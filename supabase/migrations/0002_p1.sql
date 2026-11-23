-- SAVE A PLATE: P1 additions. ADDITIVE and REVERSIBLE (see 0002_p1.down.sql).
-- No existing column is dropped or renamed. The only change to an existing object is relaxing the P0 rule
-- "at most one donation batch per listing" (donation_batches.listing_id unique) to "one per origin", because
-- no-show units are offered to charity as a second batch. The down migration restores the original constraint
-- (it fails loudly if a listing has two batches; delete the no-show batches first).
-- STATUS: written like 0001 as the production boundary; the demo adapter (lib/services.ts, lib/p1.ts, lib/jobs.ts)
-- implements the same rules and is what the automated tests exercise.

create extension if not exists postgis;

-- ---------------------------------------------------------------- enums
alter type reservation_status add value if not exists 'No-show';
create type notification_type as enum ('order_confirmed','order_ready','pickup_reminder','order_cancelled','refund_issued',
  'new_listing_followed','new_donation','donation_escalation','review_prompt','approval_decision','report_update','no_show','suspension','new_order','generic');
create type report_reason as enum ('food_safety','wrong_item','rude_behaviour','other');
create type report_target as enum ('reservation','listing','vendor');
create type report_status as enum ('Open','Dismissed','Actioned');
create type risk_tag as enum ('raw','seafood','dairy_dessert');
create type donation_origin as enum ('window_end','no_show','donation_only');
create type impact_type as enum ('sold','donated','wasted');

-- ---------------------------------------------------------------- additive columns
alter table profiles add column suspended_until timestamptz, add column suspend_reason text,
  add column home_lat double precision, add column home_lng double precision;

alter table vendors add column logo_url text,
  add column rating_avg numeric(3,2), add column rating_count int not null default 0,
  add column max_units_per_order int check (max_units_per_order is null or max_units_per_order between 5 and 50),
  add column hidden_by_admin boolean not null default false;

alter table listings add column donation_only boolean not null default false,
  add column risk_tag risk_tag, add column hidden_by_admin boolean not null default false,
  add constraint risk_window_2h check (risk_tag is null or window_end <= window_start + interval '2 hours');
-- donation-only listings are never sold, so the 30% rule does not apply to them
alter table listings drop constraint min_discount_30;
alter table listings add constraint min_discount_30 check (donation_only or rescue_price <= floor(original_price * 0.70));

alter table listing_templates add column qty int, add column donate_rest boolean, add column donation_only boolean,
  add column risk_tag risk_tag, add column created_at timestamptz not null default now();

alter table reservations add column cancelled_by text check (cancelled_by in ('customer','vendor','system','admin')),
  add column reminder_sent_at timestamptz, add column no_show_at timestamptz;

alter table donation_batches add column origin donation_origin not null default 'window_end',
  add column pickup_slot timestamptz, add column volunteer_name text, add column volunteer_phone text,
  add column volunteer_token text unique, add column escalated_at timestamptz;
alter table donation_batches drop constraint donation_batches_listing_id_key;
create unique index donation_batches_listing_origin_key on donation_batches (listing_id, origin);

alter table impact_events add column type impact_type, add column listing_id uuid references listings(id),
  add column qty int, add column kg_est numeric(8,2), add column co2e_kg numeric(8,2),
  add column customer_id uuid references profiles(id), add column rupees_saved int;
alter table impact_events drop constraint impact_events_source_check;
alter table impact_events add constraint impact_events_source_check check (source in ('customer_pickup','ngo_collection','expired'));

-- notifications become typed (user_id, type, payload, sent_at, read_at); old rows keep working
alter table notifications add column type notification_type not null default 'generic',
  add column payload jsonb not null default '{}', add column read_at timestamptz;
alter table notifications rename column at to sent_at;  -- additive view below keeps the old name readable
create view notifications_compat as select id, user_id, text, read, sent_at as at from notifications;

-- ---------------------------------------------------------------- new tables
create table settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
insert into settings (key, value) values ('platform_fee_bps', '1000'::jsonb);   -- 10% of order value, configurable

create table push_tokens (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade,
  token text not null, platform text not null check (platform in ('ios','android','web')), device_id text not null,
  created_at timestamptz not null default now(), unique (user_id, device_id)
);
create table follows (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references profiles(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade, lat double precision, lng double precision,
  created_at timestamptz not null default now(), unique (customer_id, vendor_id)
);
create table reviews (
  id uuid primary key default gen_random_uuid(), reservation_id uuid not null unique references reservations(id),
  customer_id uuid not null references profiles(id), vendor_id uuid not null references vendors(id),
  rating int not null check (rating between 1 and 5), text text check (text is null or char_length(text) <= 1000),
  created_at timestamptz not null default now()
);
create table reservation_events (
  id bigserial primary key, reservation_id uuid not null references reservations(id),
  from_status reservation_status, to_status reservation_status not null, at timestamptz not null default now(),
  actor_id uuid, note text
);
create table reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references profiles(id),
  target_type report_target not null, target_id uuid not null, reason report_reason not null,
  photo_url text, text text check (text is null or char_length(text) <= 2000),
  status report_status not null default 'Open', resolution text, resolved_by uuid references profiles(id), resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes (foreign keys + geography)
alter table outlets add column location geography(Point,4326) generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored;
alter table ngos add column location geography(Point,4326) generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored;
create index outlets_location_gix on outlets using gist (location);
create index ngos_location_gix on ngos using gist (location);
create index if not exists outlets_vendor_idx on outlets (vendor_id);
create index if not exists listings_vendor_idx on listings (vendor_id);
create index if not exists listings_outlet_idx on listings (outlet_id);
create index if not exists reservations_customer_idx on reservations (customer_id, status);
create index if not exists reservations_vendor_idx on reservations (vendor_id, status);
create index if not exists reservations_listing_idx on reservations (listing_id);
create index if not exists payments_reservation_idx on payments (reservation_id);
create index if not exists donation_batches_vendor_idx on donation_batches (vendor_id);
create index if not exists donation_batches_status_idx on donation_batches (status, collect_by);
create index if not exists impact_events_vendor_idx on impact_events (vendor_id);
create index if not exists impact_events_customer_idx on impact_events (customer_id);
create index if not exists notifications_user_idx on notifications (user_id, read);
create index push_tokens_user_idx on push_tokens (user_id);
create index follows_vendor_idx on follows (vendor_id);
create index follows_customer_idx on follows (customer_id);
create index reviews_vendor_idx on reviews (vendor_id);
create index reviews_customer_idx on reviews (customer_id);
create index reservation_events_res_idx on reservation_events (reservation_id, at);
create index reports_status_idx on reports (status, created_at);
create index reports_reporter_idx on reports (reporter_id);

-- ---------------------------------------------------------------- rating aggregate (FR-9.3) and review window (FR-9.1)
create or replace function review_guard() returns trigger language plpgsql as $$
declare r reservations;
begin
  select * into r from reservations where id = new.reservation_id;
  if r.customer_id <> new.customer_id or r.vendor_id <> new.vendor_id then raise exception 'review_forbidden'; end if;
  if r.status <> 'Picked up' then raise exception 'review_not_picked_up'; end if;
  if now() > r.picked_up_at + interval '48 hours' then raise exception 'review_window_closed'; end if;
  return new;
end $$;
create trigger reviews_guard before insert on reviews for each row execute function review_guard();

create or replace function review_aggregate() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update vendors v set rating_avg = s.a, rating_count = s.c
    from (select round(avg(rating)::numeric, 2) a, count(*) c from reviews where vendor_id = new.vendor_id) s
   where v.id = new.vendor_id;
  return new;
end $$;
create trigger reviews_aggregate after insert on reviews for each row execute function review_aggregate();

-- ---------------------------------------------------------------- every reservation state change is logged
create or replace function log_reservation_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into reservation_events (reservation_id, to_status, note) values (new.id, new.status, 'created');
  elsif new.status is distinct from old.status then
    insert into reservation_events (reservation_id, from_status, to_status) values (new.id, old.status, new.status);
  end if;
  return new;
end $$;
create trigger reservations_status_log after insert or update of status on reservations for each row execute function log_reservation_status();

-- ---------------------------------------------------------------- RPC: customer cancel (atomic stock return, 30-minute rule)
create or replace function cancel_reservation(p_reservation uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r reservations; l listings; p payments; free boolean; refund int := 0;
begin
  select * into r from reservations where id = p_reservation and customer_id = auth.uid() for update;
  if not found then raise exception 'not_found'; end if;
  if r.status not in ('Reserved','Ready') then raise exception 'bad_transition'; end if;
  select * into l from listings where id = r.listing_id for update;
  free := now() <= l.window_start - interval '30 minutes';
  update reservations set status = 'Cancelled', cancelled_at = now(), cancelled_by = 'customer',
    cancel_reason = case when free then 'Cancelled by customer' else 'Late cancellation by customer (no refund)' end where id = r.id;
  -- stock goes back in the same transaction, but only while the listing can still sell it
  if l.status in ('Live','Sold Out') and now() < l.window_end then
    update listings set qty_available = qty_available + r.qty,
      status = case when status = 'Sold Out' then 'Live'::listing_status else status end, updated_at = now() where id = l.id;
    insert into inventory_movements (listing_id, delta, reason, ref_id) values (l.id, r.qty, 'customer_cancel', r.id);
  end if;
  select * into p from payments where reservation_id = r.id;
  if free and p.status = 'Test Payment Successful' then
    update payments set status = 'Refund Pending', updated_at = now() where id = p.id;
    insert into refunds (payment_id, amount, reason, status) values (p.id, p.amount, 'Customer cancellation', 'Refund Pending');
    refund := p.amount;   -- the API then calls Razorpay (test mode) and marks it Refunded
  end if;
  return jsonb_build_object('reservation_id', r.id, 'refund', refund, 'free', free);
end $$;

-- ---------------------------------------------------------------- RPC: P1 scheduled jobs (run every minute via pg_cron)
create or replace function process_p1_jobs() returns void language plpgsql security definer set search_path = public as $$
declare r record; b record; n record; cnt int;
begin
  -- 15 minutes left in the pickup window
  for r in select res.id, res.customer_id, res.ref, l.title from reservations res join listings l on l.id = res.listing_id
           where res.status in ('Reserved','Ready') and res.reminder_sent_at is null
             and l.window_end > now() and l.window_end <= now() + interval '15 minutes' for update of res skip locked loop
    update reservations set reminder_sent_at = now() where id = r.id;
    insert into notifications (user_id, type, text, payload) values (r.customer_id, 'pickup_reminder', '15 minutes left to collect ' || r.ref || ' (' || r.title || ').', jsonb_build_object('reservationId', r.id));
  end loop;
  -- no-shows: not scanned 15 minutes after pickup end
  for r in select res.id, res.customer_id, res.ref, res.listing_id, res.qty, res.vendor_id from reservations res join listings l on l.id = res.listing_id
           where res.status in ('Reserved','Ready') and l.window_end + interval '15 minutes' <= now() for update of res skip locked loop
    update reservations set status = 'No-show', no_show_at = now() where id = r.id;
    insert into notifications (user_id, type, text, payload) values (r.customer_id, 'no_show', r.ref || ' was marked a no-show.', jsonb_build_object('reservationId', r.id));
    select count(*) into cnt from reservations where customer_id = r.customer_id and status = 'No-show' and no_show_at >= now() - interval '30 days';
    if cnt >= 3 then
      update profiles set suspended_until = now() + interval '7 days', suspend_reason = 'Reservations paused for 7 days after 3 no-shows in 30 days.'
       where id = r.customer_id and (suspended_until is null or suspended_until <= now());
    end if;
  end loop;
  -- offer no-show units to charity (donate-the-rest flow), one batch per listing
  for b in select l.* , (select coalesce(sum(qty),0) from reservations x where x.listing_id = l.id and x.status = 'No-show') as ns
           from listings l where l.donate_rest and l.status = 'Expired'
             and exists (select 1 from reservations x where x.listing_id = l.id and x.status = 'No-show')
             and not exists (select 1 from donation_batches d where d.listing_id = l.id and d.origin = 'no_show') loop
    if coalesce(b.safe_until, 'infinity') > now() and least(b.window_end + interval '2 hours', coalesce(b.safe_until, 'infinity')) > now() then
      insert into donation_batches (ref, listing_id, vendor_id, outlet_id, qty, collect_by, vendor_instruction, origin)
        values ('DON-' || nextval('reservation_ref_seq'), b.id, b.vendor_id, b.outlet_id, b.ns,
                least(b.window_end + interval '2 hours', coalesce(b.safe_until, 'infinity')), 'No-show units offered to charity', 'no_show');
    end if;
  end loop;
  -- escalate unclaimed batches 60 minutes before the deadline to verified charities within 10 km
  for b in select d.*, o.location as loc from donation_batches d join outlets o on o.id = d.outlet_id
           where d.status = 'Open' and d.escalated_at is null and d.collect_by - interval '60 minutes' <= now() for update of d skip locked loop
    update donation_batches set escalated_at = now() where id = b.id;
    for n in select owner_id from ngos where status = 'Approved' and st_dwithin(location, b.loc, 10000) loop
      insert into notifications (user_id, type, text, payload) values (n.owner_id, 'donation_escalation', 'Still unclaimed: ' || b.qty || ' meals. Collect before the deadline.', jsonb_build_object('batchId', b.id));
    end loop;
  end loop;
  -- leftovers that were not donated count as wasted
  insert into impact_events (source, ref_id, units, vendor_id, neighbourhood, type, listing_id, qty, kg_est, co2e_kg)
    select 'expired', l.id, l.qty_available, l.vendor_id, o.neighbourhood, 'wasted', l.id, l.qty_available, l.qty_available * 0.4, l.qty_available * 0.4 * 2.5
      from listings l join outlets o on o.id = l.outlet_id
     where l.status = 'Expired' and not l.donate_rest and not l.donation_only and l.qty_available > 0 and l.donation_processed_at is null
    on conflict do nothing;
  update listings set donation_processed_at = now() where status = 'Expired' and not donate_rest and not donation_only and donation_processed_at is null;
end $$;
-- select cron.schedule('p1-jobs', '* * * * *', 'select process_p1_jobs()');

-- ---------------------------------------------------------------- views for least-privilege reads
-- Vendors see the customer's FIRST NAME and the order, never the phone number.
create view vendor_order_board with (security_barrier = true) as
  select r.id, r.ref, r.listing_id, r.vendor_id, r.qty, r.amount, r.method, r.status, r.created_at, r.ready_at,
         split_part(p.name, ' ', 1) as customer_first_name
    from reservations r join profiles p on p.id = r.customer_id
   where r.vendor_id in (select id from vendors where owner_id = auth.uid());
-- Public rating summary (no reviewer identity).
create view vendor_public as
  select id, business_name, rating_avg, rating_count, (status = 'Approved') as verified, logo_url from vendors where status = 'Approved' and not hidden_by_admin;

-- ---------------------------------------------------------------- Row Level Security
alter table settings enable row level security;
alter table push_tokens enable row level security;
alter table follows enable row level security;
alter table reviews enable row level security;
alter table reservation_events enable row level security;
alter table reports enable row level security;

create policy settings_read on settings for select using (true);
create policy settings_admin_write on settings for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy push_own on push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy follows_own on follows for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy follows_vendor_count on follows for select using (vendor_id in (select id from vendors where owner_id = auth.uid()));
create policy reviews_public_read on reviews for select using (true);   -- text is public; reviewer is shown as first name only by the API
create policy reviews_insert_own on reviews for insert with check (customer_id = auth.uid());
create policy resevents_customer on reservation_events for select using (reservation_id in (select id from reservations where customer_id = auth.uid()));
create policy resevents_vendor on reservation_events for select using (reservation_id in (select id from reservations where vendor_id in (select id from vendors where owner_id = auth.uid())));
create policy resevents_admin on reservation_events for select using (auth_role() = 'admin');
create policy reports_insert_own on reports for insert with check (reporter_id = auth.uid());
create policy reports_read_own on reports for select using (reporter_id = auth.uid() or auth_role() = 'admin');
create policy reports_admin_update on reports for update using (auth_role() = 'admin');
-- volunteer link: read through a server route that matches the unguessable token and the collect-by deadline (no client policy).
