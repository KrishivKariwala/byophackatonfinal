-- SAVE A PLATE: P2 rules in Postgres, slice 3 of 3: the charity priority window and delivery status sync (issue #13).
-- Ports lib/p2/priority.ts and lib/p2/delivery.ts (the database half; the partner network call stays on the server) with the same rules:
--   * a vendor may offer a listing to nearby verified charities first (15 / 30 / 45 min, must end >= 10 min before pickup closes);
--     charities are told at once; customers can neither see nor reserve it until public_visible_at;
--   * the first valid charity claim takes the WHOLE listing as a free donation (stock leaves in the same transaction, never goes public);
--   * if nobody claims it, followers within 10 km (or with no known location) are told ONCE when it becomes public;
--   * delivery: a charity that holds a claim can ask for a rider; only business addresses are stored/shared; statuses move FORWARD only
--     and a replayed or late update changes nothing; a failed booking never cancels the claim.
-- Also fixes a bug found while testing this slice: moving PostGIS into the `extensions` schema (0002) left process_p1_jobs() unable to
-- find st_dwithin, so the "still unclaimed" donation escalation failed. Its search_path now includes `extensions`.
-- ADDITIVE and REVERSIBLE (0006_p2_priority_delivery.down.sql). Flags: priorityWindow, delivery (missing = on).
-- Setting key read: priority_options (jsonb array, default [15,30,45]).

-- ---------------------------------------------------------------- fix: PostGIS lives in `extensions`
alter function process_p1_jobs() set search_path = public, extensions;

-- ---------------------------------------------------------------- helpers (internal)
-- Approved charities whose service area covers the outlet (or within p_max_km of it).
create or replace function ngos_near(p_outlet uuid, p_max_km numeric default null) returns setof ngos
language sql stable security definer set search_path = public, extensions as $$
  select n.* from ngos n join outlets o on o.id = p_outlet
   where n.status = 'Approved' and st_dwithin(n.location, o.location, coalesce(p_max_km, n.service_area_km) * 1000)
$$;

-- Tell everyone who works at this outlet (owner/manager of the organization, staff pinned to the outlet); the vendor owner as a fallback.
create or replace function notify_outlet(p_vendor uuid, p_outlet uuid, p_type notification_type, p_text text, p_payload jsonb default '{}') returns void
language plpgsql security definer set search_path = public as $$
declare told int := 0; m record;
begin
  for m in select distinct user_id from memberships where vendor_id = p_vendor and revoked_at is null and (outlet_id is null or outlet_id = p_outlet) loop
    insert into notifications (user_id, type, text, payload) values (m.user_id, p_type, p_text, p_payload); told := told + 1;
  end loop;
  if told = 0 then
    insert into notifications (user_id, type, text, payload) select owner_id, p_type, p_text, p_payload from vendors where id = p_vendor;
  end if;
end $$;

-- ---------------------------------------------------------------- priority window
-- A vendor owner / manager turns the window on for one listing.
create or replace function start_priority_window(p_listing uuid, p_minutes int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare l listings; v vendors; opts jsonb; visible_at timestamptz; n ngos; told int := 0;
begin
  if not flag_on('priorityWindow') then raise exception 'feature_off'; end if;
  select * into l from listings where id = p_listing for update;
  if not found or not is_org_admin(l.vendor_id) then raise exception 'not_found'; end if;
  if l.donation_only then raise exception 'priority_donation'; end if;
  opts := coalesce((select value from settings where key = 'priority_options'), '[15,30,45]'::jsonb);
  if not (opts @> to_jsonb(p_minutes)) or p_minutes not in (15, 30, 45) then raise exception 'priority_invalid'; end if;
  if l.public_visible_at is not null then raise exception 'priority_already_set'; end if;   -- a window can't be restarted, or a listing could be hidden for ever
  visible_at := now() + make_interval(mins => p_minutes);
  if visible_at >= l.window_end - interval '10 minutes' then raise exception 'priority_too_long'; end if;
  update listings set priority_minutes = p_minutes, public_visible_at = visible_at, updated_at = now() where id = l.id;
  select * into v from vendors where id = l.vendor_id;
  for n in select * from ngos_near(l.outlet_id) loop
    insert into notifications (user_id, type, text, payload) values (n.owner_id, 'priority_listing',
      'Priority offer: ' || l.qty_total || ' × ' || l.title || ' at ' || v.business_name || ', free for charities for the next ' || p_minutes || ' min. Claim it in your feed.',
      jsonb_build_object('listingId', l.id, 'until', visible_at));
    told := told + 1;
  end loop;
  insert into audit_logs (actor_id, action, entity, entity_id, detail)
    values (null, 'priority_window_started', 'listing', l.id::text, p_minutes || ' min, ' || told || ' charities notified');
  return jsonb_build_object('listing_id', l.id, 'visible_at', visible_at, 'charities_notified', told);
end $$;

-- A charity takes a whole priority listing as a free donation. All-or-nothing; the first valid claim wins.
create or replace function claim_priority_listing(p_listing uuid, p_code_hash text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare n ngos; l listings; o outlets; collect_by timestamptz; q int; b donation_batches; km numeric;
begin
  if not flag_on('priorityWindow') then raise exception 'feature_off'; end if;
  select * into n from ngos where owner_id = auth.uid();
  if not found or n.status <> 'Approved' then raise exception 'approval_required'; end if;
  select * into l from listings where id = p_listing for update;                 -- row lock: only one charity can win
  if not found then raise exception 'not_found'; end if;
  if l.public_visible_at is null or now() >= l.public_visible_at then raise exception 'priority_closed'; end if;
  if l.status <> 'Live' or l.qty_available <= 0 or now() >= l.window_end or l.hidden_by_admin or l.donation_only then raise exception 'not_available'; end if;
  select * into o from outlets where id = l.outlet_id;
  if not exists (select 1 from vendors where id = l.vendor_id and status = 'Approved' and not hidden_by_admin) then raise exception 'not_available'; end if;
  km := st_distance(n.location, o.location) / 1000.0;
  if km > n.service_area_km then raise exception 'out_of_area'; end if;
  collect_by := least(l.window_end + interval '2 hours', coalesce(l.safe_until, 'infinity'));
  if collect_by <= now() then raise exception 'not_available'; end if;
  q := l.qty_available;
  update listings set qty_available = 0, status = 'Sold Out', donation_processed_at = now(), updated_at = now() where id = l.id;   -- customers can't also buy it
  insert into inventory_movements (listing_id, delta, reason) values (l.id, -q, 'priority_claim');
  insert into donation_batches (ref, listing_id, vendor_id, outlet_id, qty, collect_by, vendor_instruction, origin, status, from_priority_listing)
    values ('DON-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, q, collect_by, 'Priority-window claim by a charity', 'priority', 'Claimed', true)
    returning * into b;
  insert into donation_claims (batch_id, ngo_id, collection_code_hash) values (b.id, n.id, p_code_hash);
  perform notify_outlet(l.vendor_id, l.outlet_id, 'generic', n.org_name || ' claimed ' || b.ref || ' (' || q || ' × ' || l.title || ').', jsonb_build_object('batchId', b.id));
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (auth.uid(), 'priority_claimed', 'listing', l.id::text, q || ' units by ' || n.id);
  return jsonb_build_object('batch_id', b.id, 'ref', b.ref, 'qty', q);
end $$;

-- Job: when a priority window ends unclaimed, followers are told ONCE that it is now open to everyone.
create or replace function run_priority_job() returns void language plpgsql security definer set search_path = public, extensions as $$
declare l listings; o outlets; v vendors;
begin
  if not flag_on('priorityWindow') then return; end if;
  for l in select * from listings where public_visible_at is not null and public_notified_at is null and now() >= public_visible_at for update skip locked loop
    update listings set public_notified_at = now() where id = l.id;
    if l.status <> 'Live' or l.qty_available <= 0 or now() >= l.window_end or l.hidden_by_admin then continue; end if;
    select * into o from outlets where id = l.outlet_id;
    select * into v from vendors where id = l.vendor_id;
    -- followers within 10 km of the outlet; a follower with no known location is still told; one alert per person
    insert into notifications (user_id, type, text, payload)
      select f.customer_id, 'new_listing_followed', v.business_name || ' just listed ' || l.title || ' (₹' || l.rescue_price || ').', jsonb_build_object('listingId', l.id, 'vendorId', v.id)
        from follows f left join profiles p on p.id = f.customer_id
       where f.vendor_id = l.vendor_id
         and (coalesce(f.lat, p.home_lat) is null or coalesce(f.lng, p.home_lng) is null
              or st_distance(st_setsrid(st_makepoint(coalesce(f.lng, p.home_lng), coalesce(f.lat, p.home_lat)), 4326)::geography, o.location) <= 10000);
  end loop;
end $$;

-- ---------------------------------------------------------------- delivery (the database half)
create or replace function delivery_is_active(s delivery_status) returns boolean language sql immutable as $$
  select s in ('Requested', 'Rider assigned', 'Picked up')
$$;
-- Statuses only move forward; a late or replayed event can never move one backwards.
create or replace function delivery_rank(s delivery_status) returns int language sql immutable as $$
  select case s when 'Requested' then 0 when 'Rider assigned' then 1 when 'Picked up' then 2 else 3 end
$$;
create or replace function delivery_can_advance(p_from delivery_status, p_to delivery_status) returns boolean language sql immutable as $$
  select p_from <> p_to and delivery_rank(p_from) < 3 and delivery_rank(p_to) > delivery_rank(p_from)
$$;

-- A charity that holds a claim asks for a rider. Saves the request FIRST; the server then calls the partner and records the outcome.
-- Returns only business information (the privacy contract: nothing about any customer).
create or replace function request_delivery(p_batch uuid, p_provider text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n ngos; b donation_batches; l listings; o outlets; v vendors; d delivery_requests;
begin
  if not flag_on('delivery') then raise exception 'feature_off'; end if;
  select * into n from ngos where owner_id = auth.uid();
  if not found then raise exception 'no_ngo'; end if;
  select * into b from donation_batches where id = p_batch for update;
  if not found or not exists (select 1 from donation_claims where batch_id = b.id and ngo_id = n.id and released_at is null) then raise exception 'not_found'; end if;
  if b.status <> 'Claimed' then raise exception 'bad_transition'; end if;
  if b.collect_by <= now() then raise exception 'expired'; end if;
  if exists (select 1 from delivery_requests where batch_id = b.id and delivery_is_active(status)) then raise exception 'delivery_active'; end if;
  select * into l from listings where id = b.listing_id;
  select * into o from outlets where id = b.outlet_id;
  select * into v from vendors where id = b.vendor_id;
  insert into delivery_requests (batch_id, ngo_id, vendor_id, provider, external_id, status, pickup_address, drop_address)
    values (b.id, n.id, b.vendor_id, p_provider, '', 'Requested', o.address, n.address) returning * into d;
  update donation_batches set delivery_request_id = d.id where id = b.id;
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (auth.uid(), 'delivery_requested', 'delivery', d.id::text, p_provider || ' for ' || b.ref);
  return jsonb_build_object('delivery_id', d.id, 'reference', b.ref, 'item', b.qty || ' × ' || l.title, 'pickupBy', b.collect_by,
    'pickup', jsonb_build_object('businessName', v.business_name, 'address', o.address, 'lat', o.lat, 'lng', o.lng, 'phone', v.phone),
    'drop', jsonb_build_object('organisation', n.org_name, 'address', n.address, 'lat', n.lat, 'lng', n.lng, 'phone', n.phone));
end $$;

-- The partner accepted the job (server only).
create or replace function record_delivery_ack(p_delivery uuid, p_external_id text, p_fee int, p_status delivery_status, p_rider text default null) returns void
language plpgsql security definer set search_path = public as $$
declare d delivery_requests; n ngos; v_ref text;
begin
  select * into d from delivery_requests where id = p_delivery for update;
  if not found then raise exception 'not_found'; end if;
  update delivery_requests set external_id = p_external_id, fee = p_fee, status = p_status, rider_name = p_rider, updated_at = now() where id = d.id;
  select * into n from ngos where id = d.ngo_id;
  select b.ref into v_ref from donation_batches b where b.id = d.batch_id;
  insert into notifications (user_id, type, text, payload) values (n.owner_id, 'delivery_update',
    'Delivery requested for ' || v_ref || ' (' || d.provider || ', about ₹' || p_fee || '). We''ll update you as the rider moves.', jsonb_build_object('deliveryId', d.id));
end $$;

-- The partner was down or refused (server only). The claim is NOT cancelled: the charity is told and can retry or collect it themselves.
create or replace function record_delivery_failure(p_delivery uuid, p_error text) returns void
language plpgsql security definer set search_path = public as $$
declare d delivery_requests; n ngos; v_ref text;
begin
  select * into d from delivery_requests where id = p_delivery for update;
  if not found then raise exception 'not_found'; end if;
  update delivery_requests set status = 'Failed', error = p_error, updated_at = now() where id = d.id;
  select * into n from ngos where id = d.ngo_id;
  select b.ref into v_ref from donation_batches b where b.id = d.batch_id;
  insert into notifications (user_id, type, text, payload) values (n.owner_id, 'delivery_update',
    'We couldn''t book a rider for ' || v_ref || ': ' || coalesce(p_error, '') || ' You still hold the claim: try again or collect it yourself before the deadline.', jsonb_build_object('deliveryId', d.id));
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (null, 'delivery_failed', 'delivery', d.id::text, coalesce(p_error, ''));
end $$;

create or replace function cancel_delivery(p_delivery uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d delivery_requests;
begin
  select dr.* into d from delivery_requests dr join ngos n on n.id = dr.ngo_id where dr.id = p_delivery and n.owner_id = auth.uid() for update of dr;
  if not found then raise exception 'not_found'; end if;
  if not delivery_is_active(d.status) then raise exception 'bad_transition'; end if;
  if d.status = 'Picked up' then raise exception 'bad_transition'; end if;   -- the rider already has the food
  update delivery_requests set status = 'Cancelled', updated_at = now() where id = d.id;
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (auth.uid(), 'delivery_cancelled', 'delivery', d.id::text, null);
  return jsonb_build_object('delivery_id', d.id, 'external_id', d.external_id, 'provider', d.provider);   -- the server cancels it at the partner
end $$;

-- Applies a status from the partner (webhook or poll). Forward-only, idempotent, tells each side once per change.
create or replace function apply_delivery_status(p_delivery uuid, p_status delivery_status, p_rider text default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare d delivery_requests; b donation_batches; n ngos; txt text; rider text; vtxt text;
begin
  select * into d from delivery_requests where id = p_delivery for update;
  if not found then return false; end if;
  if p_rider is not null and p_rider is distinct from d.rider_name then update delivery_requests set rider_name = p_rider where id = d.id; d.rider_name := p_rider; end if;
  if not delivery_can_advance(d.status, p_status) then return false; end if;
  update delivery_requests set status = p_status, updated_at = now() where id = d.id;
  select * into b from donation_batches where id = d.batch_id;
  select * into n from ngos where id = d.ngo_id;
  rider := case when d.rider_name is not null then ' (' || d.rider_name || ')' else '' end;
  txt := case p_status
    when 'Rider assigned' then 'A rider' || rider || ' is on the way to collect ' || b.ref || '.'
    when 'Picked up' then 'The rider' || rider || ' has picked up ' || b.ref || '.'
    when 'Delivered' then b.ref || ' was delivered.'
    when 'No rider found' then 'No rider accepted ' || b.ref || '. You still hold the claim: try again or collect it yourself before the deadline.'
    when 'Failed' then 'The delivery for ' || b.ref || ' failed. You still hold the claim.'
    else null end;
  if txt is not null then
    insert into notifications (user_id, type, text, payload) values (n.owner_id, 'delivery_update', txt, jsonb_build_object('deliveryId', d.id, 'status', p_status));
    if p_status in ('Rider assigned', 'Picked up') then
      vtxt := txt || ' Check the collection code before handing over.';
      perform notify_outlet(d.vendor_id, b.outlet_id, 'delivery_update', vtxt, jsonb_build_object('deliveryId', d.id, 'status', p_status));
    end if;
  end if;
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (null, 'delivery_status', 'delivery', d.id::text, p_status::text);
  return true;
end $$;

-- Entry point for a verified partner webhook (the server checks the HMAC signature first).
create or replace function delivery_webhook(p_external_id text, p_status text, p_rider text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d delivery_requests; applied boolean;
begin
  if coalesce(p_external_id, '') = '' then raise exception 'bad_event'; end if;
  if p_status not in ('Rider assigned', 'Picked up', 'Delivered', 'No rider found', 'Failed', 'Cancelled') then raise exception 'bad_event'; end if;
  select * into d from delivery_requests where external_id = p_external_id;
  if not found then return jsonb_build_object('applied', false, 'reason', 'unknown delivery'); end if;
  applied := apply_delivery_status(d.id, p_status::delivery_status, left(p_rider, 60));
  return jsonb_build_object('applied', applied);
end $$;

-- ---------------------------------------------------------------- reserve_listing: customers can't reserve what they can't see
-- (0004's version, plus: a listing still inside its charity-priority window, hidden by an admin, or donation-only is not available.)
create or replace function reserve_listing(p_listing uuid, p_qty int, p_method payment_method, p_use_credit boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare l listings; o outlets; v vendors; active int; h checkout_holds; r reservations; code text; token text; now_ts timestamptz := now();
        total int; credit int := 0;
begin
  if auth_role() is distinct from 'customer' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_qty < 1 or p_qty > 5 then raise exception 'qty_cap'; end if;
  -- serialise per customer so concurrent requests cannot bypass the 3-active cap
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  select * into l from listings where id = p_listing for update;            -- row lock: last unit cannot sell twice
  if not found then raise exception 'not_found'; end if;
  select * into v from vendors where id = l.vendor_id;
  if l.donation_only or l.hidden_by_admin or v.hidden_by_admin
     or (l.public_visible_at is not null and now_ts < l.public_visible_at and flag_on('priorityWindow')) then raise exception 'not_available'; end if;
  if v.status <> 'Approved' then raise exception 'vendor_unavailable'; end if;
  if now_ts >= l.window_end then raise exception 'window_closed'; end if;
  if l.status = 'Sold Out' or l.qty_available < p_qty then raise exception 'insufficient_stock'; end if;
  if l.status <> 'Live' then raise exception 'not_available'; end if;
  select count(*) into active from (
    select id from reservations where customer_id = auth.uid() and status in ('Reserved','Ready')
    union all select id from checkout_holds where customer_id = auth.uid() and status = 'Active' and expires_at > now_ts) x;
  if active >= 3 then raise exception 'active_cap'; end if;
  select * into o from outlets where id = l.outlet_id;
  if p_method = 'pay_at_pickup' and not o.pay_at_pickup then raise exception 'pay_at_pickup_off'; end if;
  total := p_qty * l.rescue_price;
  -- referral credit: up to credit_max_pct of the order, taken now, returned if the hold lapses or the order is cancelled for free
  if p_use_credit then credit := (credit_quote(total) ->> 'usable')::int; end if;
  update listings set qty_available = qty_available - p_qty,
    status = case when qty_available - p_qty = 0 then 'Sold Out'::listing_status else status end, updated_at = now_ts
    where id = l.id;
  if p_method = 'online' then
    insert into checkout_holds (listing_id, customer_id, qty, amount, expires_at, credit_applied)
      values (l.id, auth.uid(), p_qty, total - credit, least(now_ts + interval '5 minutes', l.window_end), credit) returning * into h;
    if credit > 0 then perform spend_credit(auth.uid(), credit, h.id::text, 'used on checkout of ' || l.title); end if;
    insert into inventory_movements (listing_id, delta, reason, ref_id) values (l.id, -p_qty, 'checkout_hold', h.id);
    insert into payments (hold_id, customer_id, method, amount, status, gateway) values (h.id, auth.uid(), 'online', h.amount, 'Pending', 'razorpay_test');
    return jsonb_build_object('kind','hold','hold_id',h.id,'expires_at',h.expires_at,'amount',h.amount,'credit_applied',credit);
  end if;
  insert into reservations (ref, listing_id, vendor_id, outlet_id, customer_id, qty, unit_price, amount, method, credit_applied)
    values ('SAP-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, auth.uid(), p_qty, l.rescue_price, total, 'pay_at_pickup', credit)
    returning * into r;
  if credit > 0 then perform spend_credit(auth.uid(), credit, r.id::text, 'used on ' || r.ref); end if;
  insert into inventory_movements (listing_id, delta, reason, ref_id) values (l.id, -p_qty, 'reservation_pay_at_pickup', r.id);
  insert into payments (reservation_id, customer_id, method, amount, status, gateway) values (r.id, auth.uid(), 'pay_at_pickup', total - credit, 'Pending', 'cash_at_pickup');
  -- pickup code/token are generated server-side by the API (plaintext returned once to the owner) and stored hashed:
  return jsonb_build_object('kind','reservation','reservation_id',r.id,'credit_applied',credit);
end $$;

-- ---------------------------------------------------------------- scheduled jobs: + the priority-window follow-up
create or replace function process_p2_jobs() returns void language plpgsql security definer set search_path = public as $$
begin
  if flag_on('autoMarkdown') then
    update listings l set rescue_price = least(l.rescue_price, floor(l.original_price * (100 - s.discount_pct) / 100.0)::int)  -- measured against the ORIGINAL price; only ever lowers
      from listing_price_steps s
     where s.listing_id = l.id and s.applied_at is null and s.effective_at <= now() and l.status = 'Live' and l.window_end > now();
    update listing_price_steps set applied_at = now() where applied_at is null and effective_at <= now();
  end if;
  if flag_on('referrals') then
    insert into credit_ledger (user_id, amount, type, ref_id, note)
      select user_id, remaining, 'expired', id::text, 'expired after 90 days' from credit_ledger
       where type = 'earned' and remaining > 0 and expires_at <= now();
    update credit_ledger set remaining = 0 where type = 'earned' and remaining > 0 and expires_at <= now();
  end if;
  perform run_receipt_job();
  perform run_certificate_job();
  perform run_priority_job();
end $$;

-- ---------------------------------------------------------------- who may call what
revoke all on function ngos_near(uuid, numeric), notify_outlet(uuid, uuid, notification_type, text, jsonb), run_priority_job(),
  record_delivery_ack(uuid, text, int, delivery_status, text), record_delivery_failure(uuid, text), apply_delivery_status(uuid, delivery_status, text),
  delivery_webhook(text, text, text), process_p2_jobs() from public, anon, authenticated;
-- Clients get: start_priority_window (vendor owner/manager), claim_priority_listing / request_delivery / cancel_delivery (the charity).
revoke all on function start_priority_window(uuid, int), claim_priority_listing(uuid, text), request_delivery(uuid, text), cancel_delivery(uuid) from public, anon;
grant execute on function start_priority_window(uuid, int), claim_priority_listing(uuid, text), request_delivery(uuid, text), cancel_delivery(uuid) to authenticated;
