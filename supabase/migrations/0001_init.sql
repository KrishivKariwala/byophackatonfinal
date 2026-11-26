-- SAVE A PLATE — Supabase/Postgres schema, RLS and atomic RPCs.
-- STATUS: run on a real Supabase Postgres and tested (npm run db:migrate / db:roundtrip / db:rls / db:p2). The demo adapter in
-- lib/store.ts + lib/services.ts implements the same rules and is what the unit tests exercise.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
create type app_role as enum ('customer','vendor','ngo','admin');
create type approval_status as enum ('Pending','Approved','Rejected');
create type diet as enum ('Vegetarian','Non-vegetarian');
create type food_category as enum ('Bakery','Meals','Snacks','Desserts');
create type listing_status as enum ('Draft','Live','Paused','Sold Out','Expired','Cancelled');
create type reservation_status as enum ('Hold','Reserved','Ready','Picked up','Cancelled','Expired');
create type payment_status as enum ('Pending','Test Payment Successful','Failed','Paid at Pickup','Refund Pending','Refunded');
create type payment_method as enum ('online','pay_at_pickup');
create type hold_status as enum ('Active','Converted','Released','Expired');
create type donation_status as enum ('Open','Claimed','Collected','Expired','Cancelled');

-- ---------------------------------------------------------------- tables
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null, phone text, email text,
  role app_role not null default 'customer',
  created_at timestamptz not null default now()
);
-- Admin role is only granted by a service-role operation, never by the client (see policy below).

create table vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references profiles(id),
  business_name text not null, contact_name text not null, phone text not null, email text,
  fssai_number text not null, operating_hours text not null, payout_upi text not null,
  status approval_status not null default 'Pending', rejection_reason text,
  created_at timestamptz not null default now()
);
create table vendor_applications (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id), documents text[] not null default '{}',
  submitted_at timestamptz not null default now(), decided_at timestamptz, decided_by uuid references profiles(id)
);
create table outlets (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  address text not null, neighbourhood text not null,
  lat double precision not null, lng double precision not null,
  pay_at_pickup boolean not null default false
);
create table ngos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references profiles(id),
  org_name text not null, contact_person text not null, phone text not null, email text,
  address text not null, neighbourhood text not null, lat double precision not null, lng double precision not null,
  service_area_km numeric not null default 5, capacity_meals int not null check (capacity_meals > 0),
  handling_arrangements text not null, fssai_info text,
  status approval_status not null default 'Pending', rejection_reason text,
  created_at timestamptz not null default now()
);
create table ngo_applications (
  id uuid primary key default gen_random_uuid(), ngo_id uuid not null references ngos(id),
  registration_docs text[] not null, submitted_at timestamptz not null default now(),
  decided_at timestamptz, decided_by uuid references profiles(id)
);
create table listings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id), outlet_id uuid not null references outlets(id),
  title text not null check (char_length(title) between 3 and 80), description text not null default '',
  category food_category not null, surprise_bag boolean not null default false,
  original_price int not null check (original_price > 0),
  rescue_price int not null check (rescue_price > 0),
  qty_total int not null check (qty_total between 1 and 500),
  qty_available int not null check (qty_available >= 0),
  diet diet not null,                                   -- mandatory, exactly one
  allergens text[] not null default '{}',
  prepared_at timestamptz not null, safe_until timestamptz, storage_note text,
  safety_declared_at timestamptz not null, safety_declared_by uuid not null references profiles(id),
  window_start timestamptz not null, window_end timestamptz not null,
  donate_rest boolean not null default false,
  status listing_status not null default 'Live',
  cancel_reason text, donation_processed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint min_discount_30 check (rescue_price <= floor(original_price * 0.70)),
  constraint window_order check (window_end > window_start),
  constraint window_within_12h check (window_start <= created_at + interval '12 hours'),
  constraint safe_after_window check (safe_until is null or safe_until >= window_end)
);
create index listings_live_idx on listings (status, window_end) where status = 'Live';
create table listing_images (id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id), storage_path text not null, is_representative boolean not null default true);
create table listing_templates (
  id uuid primary key default gen_random_uuid(), vendor_id uuid not null references vendors(id),
  title text not null, description text not null default '', category food_category not null,
  original_price int not null, rescue_price int not null, diet diet not null, allergens text[] not null default '{}',
  surprise_bag boolean not null default false, storage_note text
);
create table inventory_movements (
  id bigserial primary key, listing_id uuid not null references listings(id), delta int not null,
  reason text not null, ref_id uuid, at timestamptz not null default now()
);
create table checkout_holds (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id),
  customer_id uuid not null references profiles(id), qty int not null check (qty between 1 and 5),
  amount int not null, expires_at timestamptz not null, status hold_status not null default 'Active',
  gateway_order_id text unique, created_at timestamptz not null default now()
);
create table reservations (
  id uuid primary key default gen_random_uuid(), ref text not null unique,
  listing_id uuid not null references listings(id), vendor_id uuid not null references vendors(id), outlet_id uuid not null references outlets(id),
  customer_id uuid not null references profiles(id), qty int not null check (qty between 1 and 5),
  unit_price int not null, amount int not null, method payment_method not null,
  status reservation_status not null default 'Reserved', hold_id uuid unique references checkout_holds(id),
  created_at timestamptz not null default now(), ready_at timestamptz, picked_up_at timestamptz,
  cancelled_at timestamptz, cancel_reason text
);
create table pickup_codes (
  reservation_id uuid primary key references reservations(id),
  vendor_id uuid not null references vendors(id),
  qr_token_hash text not null unique, code_hash text not null,  -- sha256(vendor_id || ':' || code)
  used_at timestamptz
);
create unique index pickup_code_active_unique on pickup_codes (vendor_id, code_hash) where used_at is null;
create table pickup_events (id bigserial primary key, reservation_id uuid not null references reservations(id), vendor_user uuid not null references profiles(id), method text not null, at timestamptz not null default now());
create table payments (
  id uuid primary key default gen_random_uuid(), reservation_id uuid references reservations(id), hold_id uuid references checkout_holds(id),
  customer_id uuid not null references profiles(id), method payment_method not null, amount int not null,
  status payment_status not null, gateway text not null, gateway_order_id text, gateway_payment_id text unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table refunds (id uuid primary key default gen_random_uuid(), payment_id uuid not null references payments(id), amount int not null, reason text not null, status payment_status not null, created_at timestamptz not null default now());
create table processed_webhooks (event_id text primary key, at timestamptz not null default now());
create table donation_batches (
  id uuid primary key default gen_random_uuid(), ref text not null unique,
  listing_id uuid not null unique references listings(id),  -- at most one batch per listing
  vendor_id uuid not null references vendors(id), outlet_id uuid not null references outlets(id),
  qty int not null check (qty > 0), collect_by timestamptz not null,
  status donation_status not null default 'Open', vendor_instruction text not null,
  created_at timestamptz not null default now()
);
create table donation_claims (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null references donation_batches(id),
  ngo_id uuid not null references ngos(id), collection_code_hash text not null,
  claimed_at timestamptz not null default now(), released_at timestamptz
);
create unique index one_active_claim on donation_claims (batch_id) where released_at is null;
create table donation_handovers (id bigserial primary key, batch_id uuid not null unique references donation_batches(id), vendor_user uuid not null references profiles(id), at timestamptz not null default now());
create table impact_events (
  id bigserial primary key, source text not null check (source in ('customer_pickup','ngo_collection')),
  ref_id uuid not null, units int not null, vendor_id uuid not null references vendors(id), neighbourhood text not null,
  at timestamptz not null default now(), unique (source, ref_id)
);
create table notifications (id bigserial primary key, user_id uuid not null references profiles(id), text text not null, read boolean not null default false, at timestamptz not null default now());
create table audit_logs (id bigserial primary key, actor_id uuid, action text not null, entity text not null, entity_id text not null, detail text, at timestamptz not null default now());

-- ---------------------------------------------------------------- helpers
create or replace function auth_role() returns app_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

-- ---------------------------------------------------------------- RPC: reserve (atomic stock + caps)
create or replace function reserve_listing(p_listing uuid, p_qty int, p_method payment_method)
returns jsonb language plpgsql security definer set search_path = public as $$
declare l listings; o outlets; v vendors; active int; h checkout_holds; r reservations; code text; token text; now_ts timestamptz := now();
begin
  if auth_role() is distinct from 'customer' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_qty < 1 or p_qty > 5 then raise exception 'qty_cap'; end if;
  -- serialise per customer so concurrent requests cannot bypass the 3-active cap
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  select * into l from listings where id = p_listing for update;            -- row lock: last unit cannot sell twice
  if not found then raise exception 'not_found'; end if;
  select * into v from vendors where id = l.vendor_id;
  if v.status <> 'Approved' then raise exception 'vendor_unavailable'; end if;
  if now_ts >= l.window_end then raise exception 'window_closed'; end if;
  if l.status = 'Sold Out' or l.qty_available < p_qty then raise exception 'insufficient_stock'; end if;
  if l.status <> 'Live' then raise exception 'not_available'; end if;
  select count(*) into active from (
    select id from reservations where customer_id = auth.uid() and status in ('Reserved','Ready')
    union all select id from checkout_holds where customer_id = auth.uid() and status = 'Active' and expires_at > now_ts) x;
  if active >= 3 then raise exception 'active_cap'; end if;
  select * into o from outlets where id = l.outlet_id;
  update listings set qty_available = qty_available - p_qty,
    status = case when qty_available - p_qty = 0 then 'Sold Out'::listing_status else status end, updated_at = now_ts
    where id = l.id;
  if p_method = 'online' then
    insert into checkout_holds (listing_id, customer_id, qty, amount, expires_at)
      values (l.id, auth.uid(), p_qty, p_qty * l.rescue_price, least(now_ts + interval '5 minutes', l.window_end)) returning * into h;
    insert into inventory_movements (listing_id, delta, reason, ref_id) values (l.id, -p_qty, 'checkout_hold', h.id);
    insert into payments (hold_id, customer_id, method, amount, status, gateway) values (h.id, auth.uid(), 'online', h.amount, 'Pending', 'razorpay_test');
    return jsonb_build_object('kind','hold','hold_id',h.id,'expires_at',h.expires_at,'amount',h.amount);
  end if;
  if not o.pay_at_pickup then raise exception 'pay_at_pickup_off'; end if;
  insert into reservations (ref, listing_id, vendor_id, outlet_id, customer_id, qty, unit_price, amount, method)
    values ('SAP-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, auth.uid(), p_qty, l.rescue_price, p_qty * l.rescue_price, 'pay_at_pickup')
    returning * into r;
  insert into inventory_movements (listing_id, delta, reason, ref_id) values (l.id, -p_qty, 'reservation_pay_at_pickup', r.id);
  insert into payments (reservation_id, customer_id, method, amount, status, gateway) values (r.id, auth.uid(), 'pay_at_pickup', r.amount, 'Pending', 'cash_at_pickup');
  -- pickup code/token are generated server-side by the API (plaintext returned once to the owner) and stored hashed:
  return jsonb_build_object('kind','reservation','reservation_id',r.id);
end $$;
create sequence if not exists reservation_ref_seq start 5000;

-- ---------------------------------------------------------------- RPC: confirm verified payment (idempotent, never revives)
create or replace function confirm_payment(p_hold uuid, p_gateway_payment text, p_event text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h checkout_holds; l listings; r reservations;
begin
  insert into processed_webhooks (event_id) values (p_event) on conflict do nothing;
  if not found then return jsonb_build_object('outcome','duplicate'); end if;
  select * into h from checkout_holds where id = p_hold for update;
  if h.status = 'Converted' then return jsonb_build_object('outcome','duplicate'); end if;
  if h.status <> 'Active' or h.expires_at <= now() then
    update payments set status = 'Refund Pending', gateway_payment_id = p_gateway_payment, updated_at = now() where hold_id = h.id;
    insert into refunds (payment_id, amount, reason, status) select id, amount, 'Payment arrived after hold expired', 'Refund Pending' from payments where hold_id = h.id;
    return jsonb_build_object('outcome','late_refund');
  end if;
  select * into l from listings where id = h.listing_id;
  update checkout_holds set status = 'Converted' where id = h.id;
  insert into reservations (ref, listing_id, vendor_id, outlet_id, customer_id, qty, unit_price, amount, method, hold_id)
    values ('SAP-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, h.customer_id, h.qty, l.rescue_price, h.amount, 'online', h.id) returning * into r;
  update payments set status = 'Test Payment Successful', reservation_id = r.id, gateway_payment_id = p_gateway_payment, updated_at = now() where hold_id = h.id;
  return jsonb_build_object('outcome','confirmed','reservation_id',r.id);
end $$;
revoke all on function confirm_payment from public, anon, authenticated;   -- server (service role) only

-- ---------------------------------------------------------------- RPC: handover (single use, vendor-specific, in window)
create or replace function handover(p_token_hash text, p_code_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v vendors; pc pickup_codes; r reservations; l listings;
begin
  select * into v from vendors where owner_id = auth.uid() and status = 'Approved';
  if not found then raise exception 'approval_required'; end if;
  if p_token_hash is not null then
    select * into pc from pickup_codes where qr_token_hash = p_token_hash for update;
    if found and pc.vendor_id <> v.id then raise exception 'wrong_vendor'; end if;
  else
    select * into pc from pickup_codes where vendor_id = v.id and code_hash = p_code_hash order by used_at nulls first limit 1 for update;
  end if;
  if not found then raise exception 'code_not_found'; end if;
  if pc.used_at is not null then raise exception 'code_used'; end if;
  select * into r from reservations where id = pc.reservation_id for update;
  if r.status not in ('Reserved','Ready') then raise exception 'order_inactive'; end if;
  select * into l from listings where id = r.listing_id;
  if now() < l.window_start then raise exception 'too_early'; end if;
  if now() > l.window_end then raise exception 'too_late'; end if;
  update pickup_codes set used_at = now() where reservation_id = r.id;
  update reservations set status = 'Picked up', picked_up_at = now() where id = r.id;
  update payments set status = 'Paid at Pickup', updated_at = now() where reservation_id = r.id and method = 'pay_at_pickup' and status = 'Pending';
  insert into pickup_events (reservation_id, vendor_user, method) values (r.id, auth.uid(), case when p_token_hash is null then 'code' else 'qr' end);
  insert into impact_events (source, ref_id, units, vendor_id, neighbourhood)
    select 'customer_pickup', r.id, r.qty, v.id, o.neighbourhood from outlets o where o.id = r.outlet_id;
  return jsonb_build_object('ok',true,'ref',r.ref,'qty',r.qty);
end $$;

-- ---------------------------------------------------------------- RPC: window-end processor (run every minute via pg_cron)
create or replace function process_window_end() returns void language plpgsql security definer set search_path = public as $$
declare h checkout_holds; l listings; cb timestamptz;
begin
  for h in select * from checkout_holds where status = 'Active' and expires_at <= now() for update skip locked loop
    update checkout_holds set status = 'Expired' where id = h.id;
    update listings set qty_available = qty_available + h.qty,
      status = case when status = 'Sold Out' and now() < window_end then 'Live'::listing_status else status end where id = h.listing_id;
    insert into inventory_movements (listing_id, delta, reason, ref_id) values (h.listing_id, h.qty, 'hold_expired', h.id);
    update payments set status = 'Failed', updated_at = now() where hold_id = h.id and status = 'Pending';
  end loop;
  for l in select * from listings where status in ('Live','Paused','Sold Out') and window_end <= now() for update skip locked loop
    update listings set status = 'Expired', updated_at = now() where id = l.id;
    if l.donate_rest and l.donation_processed_at is null then
      update listings set donation_processed_at = now() where id = l.id;
      cb := least(l.window_end + interval '2 hours', coalesce(l.safe_until, 'infinity'));
      if l.qty_available > 0 and coalesce(l.safe_until, 'infinity') > now() and cb > now() then
        insert into donation_batches (ref, listing_id, vendor_id, outlet_id, qty, collect_by, vendor_instruction)
          values ('DON-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, l.qty_available, cb, 'Donate the rest at window end');
        insert into inventory_movements (listing_id, delta, reason) values (l.id, -l.qty_available, 'donation_batch');
        update listings set qty_available = 0 where id = l.id;
      end if;
    end if;
  end loop;
  update donation_batches set status = 'Expired' where status in ('Open','Claimed') and collect_by <= now();
end $$;
-- select cron.schedule('window-end', '* * * * *', 'select process_window_end()');

-- ---------------------------------------------------------------- RPC: exclusive whole-batch claim
create or replace function claim_batch(p_batch uuid, p_code_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n ngos; b donation_batches;
begin
  select * into n from ngos where owner_id = auth.uid();
  if not found or n.status <> 'Approved' then raise exception 'approval_required'; end if;
  update donation_batches set status = 'Claimed' where id = p_batch and status = 'Open' and collect_by > now() returning * into b;
  if not found then raise exception 'already_claimed'; end if;      -- first valid claim wins
  insert into donation_claims (batch_id, ngo_id, collection_code_hash) values (b.id, n.id, p_code_hash);
  return jsonb_build_object('batch_id', b.id, 'qty', b.qty);
end $$;

-- ---------------------------------------------------------------- Row Level Security
alter table profiles enable row level security;
alter table vendors enable row level security;
alter table outlets enable row level security;
alter table ngos enable row level security;
alter table listings enable row level security;
alter table checkout_holds enable row level security;
alter table reservations enable row level security;
alter table pickup_codes enable row level security;
alter table payments enable row level security;
alter table refunds enable row level security;
alter table donation_batches enable row level security;
alter table donation_claims enable row level security;
alter table impact_events enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table inventory_movements enable row level security;

create policy own_profile_read on profiles for select using (id = auth.uid() or auth_role() = 'admin');
create policy own_profile_update on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid())); -- cannot change own role
create policy profile_insert_self on profiles for insert with check (id = auth.uid() and role in ('customer','vendor','ngo'));     -- never admin

create policy vendor_owner_rw on vendors for all using (owner_id = auth.uid() or auth_role() = 'admin')
  with check (owner_id = auth.uid() and status = 'Pending');            -- only admins (service role) change status
create policy vendor_public_read on vendors for select using (status = 'Approved');
create policy outlet_read on outlets for select using (true);
create policy outlet_owner_write on outlets for all using (vendor_id in (select id from vendors where owner_id = auth.uid()));

create policy ngo_owner_rw on ngos for all using (owner_id = auth.uid() or auth_role() = 'admin') with check (owner_id = auth.uid() and status = 'Pending');

create policy listings_customer_read on listings for select using (status = 'Live' and qty_available > 0 and window_end > now());
create policy listings_vendor_read on listings for select using (vendor_id in (select id from vendors where owner_id = auth.uid()) or auth_role() = 'admin');
-- listing writes go through server routes with validation; no direct client insert/update policy.

create policy holds_owner on checkout_holds for select using (customer_id = auth.uid());
create policy res_customer on reservations for select using (customer_id = auth.uid());
create policy res_vendor on reservations for select using (vendor_id in (select id from vendors where owner_id = auth.uid()));
create policy res_admin on reservations for select using (auth_role() = 'admin');
create policy pay_owner on payments for select using (customer_id = auth.uid() or auth_role() = 'admin');
create policy refunds_admin on refunds for select using (auth_role() = 'admin');
create policy donation_feed on donation_batches for select using (
  (status = 'Open' and exists (select 1 from ngos where owner_id = auth.uid() and status = 'Approved'))
  or vendor_id in (select id from vendors where owner_id = auth.uid())
  or id in (select batch_id from donation_claims c join ngos n on n.id = c.ngo_id where n.owner_id = auth.uid())
  or auth_role() = 'admin');
create policy claims_read on donation_claims for select using (ngo_id in (select id from ngos where owner_id = auth.uid()) or auth_role() = 'admin');
create policy impact_read on impact_events for select using (true);       -- aggregate, no personal data
create policy notif_own on notifications for select using (user_id = auth.uid());
create policy audit_admin on audit_logs for select using (auth_role() = 'admin');
create policy inv_vendor on inventory_movements for select using (listing_id in (select l.id from listings l join vendors v on v.id = l.vendor_id where v.owner_id = auth.uid()) or auth_role() = 'admin');
-- pickup_codes: no select policy for clients; only security-definer RPCs touch them.

-- Realtime: publish listings (stock/status) and reservations; clients re-read through RLS.
alter publication supabase_realtime add table listings, reservations, donation_batches, impact_events;
