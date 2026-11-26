-- SAVE A PLATE: one clock for the whole app (issue #14).
-- The demo has a "fast-forward" tool (move the clock on 25 minutes to show a pickup window opening or a hold expiring). It moved only
-- the app's clock, while the database rules read the real one, so on the database the two disagreed. `app_now()` is now() plus the
-- offset the demo stores in the `settings` row `clock_offset_ms` (0 unless someone used the demo tool; always 0 in production), and the
-- rules below read it instead of now(). Nothing else about them changes: each definition is the previous one with now() -> app_now().
-- REVERSIBLE (0010_app_clock.down.sql puts the previous definitions back).

create or replace function app_now() returns timestamptz language sql stable security definer set search_path = public as $$
  select now() + make_interval(secs => coalesce((select (value #>> '{}')::numeric from settings where key = 'clock_offset_ms'), 0) / 1000.0)
$$;
-- (callable by everyone: trigger functions that run as the signed-in person, such as the review guard, read it; it only reveals the demo offset)

create or replace function apply_delivery_status(p_delivery uuid, p_status delivery_status, p_rider text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare d delivery_requests; b donation_batches; n ngos; txt text; rider text; vtxt text;
begin
  select * into d from delivery_requests where id = p_delivery for update;
  if not found then return false; end if;
  if p_rider is not null and p_rider is distinct from d.rider_name then update delivery_requests set rider_name = p_rider where id = d.id; d.rider_name := p_rider; end if;
  if not delivery_can_advance(d.status, p_status) then return false; end if;
  update delivery_requests set status = p_status, updated_at = app_now() where id = d.id;
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
end $function$;

create or replace function cancel_delivery(p_delivery uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare d delivery_requests;
begin
  select dr.* into d from delivery_requests dr join ngos n on n.id = dr.ngo_id where dr.id = p_delivery and n.owner_id = auth.uid() for update of dr;
  if not found then raise exception 'not_found'; end if;
  if not delivery_is_active(d.status) then raise exception 'bad_transition'; end if;
  if d.status = 'Picked up' then raise exception 'bad_transition'; end if;   -- the rider already has the food
  update delivery_requests set status = 'Cancelled', updated_at = app_now() where id = d.id;
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (auth.uid(), 'delivery_cancelled', 'delivery', d.id::text, null);
  return jsonb_build_object('delivery_id', d.id, 'external_id', d.external_id, 'provider', d.provider);   -- the server cancels it at the partner
end $function$;

create or replace function cancel_reservation(p_reservation uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare r reservations; l listings; p payments; free boolean; refund int := 0; credit_back int := 0;
begin
  select * into r from reservations where id = p_reservation and customer_id = auth.uid() for update;
  if not found then raise exception 'not_found'; end if;
  if r.status not in ('Reserved','Ready') then raise exception 'bad_transition'; end if;
  select * into l from listings where id = r.listing_id for update;
  free := app_now() <= l.window_start - interval '30 minutes';
  update reservations set status = 'Cancelled', cancelled_at = app_now(), cancelled_by = 'customer',
    cancel_reason = case when free then 'Cancelled by customer' else 'Late cancellation by customer (no refund)' end where id = r.id;
  -- stock goes back in the same transaction, but only while the listing can still sell it
  if l.status in ('Live','Sold Out') and app_now() < l.window_end then
    update listings set qty_available = qty_available + r.qty,
      status = case when status = 'Sold Out' then 'Live'::listing_status else status end, updated_at = app_now() where id = l.id;
    insert into inventory_movements (listing_id, delta, reason, ref_id) values (l.id, r.qty, 'customer_cancel', r.id);
  end if;
  select * into p from payments where reservation_id = r.id;
  if free and p.status = 'Test Payment Successful' then
    update payments set status = 'Refund Pending', updated_at = app_now() where id = p.id;
    insert into refunds (payment_id, amount, reason, status) values (p.id, p.amount, 'Customer cancellation', 'Refund Pending');
    refund := p.amount;   -- the API then calls Razorpay (test mode) and marks it Refunded
  end if;
  if free then credit_back := restore_credit(r.customer_id, array[r.id::text, r.hold_id::text], 'order cancelled'); end if;
  return jsonb_build_object('reservation_id', r.id, 'refund', refund, 'free', free, 'credit_back', credit_back);
end $function$;

create or replace function claim_batch(p_batch uuid, p_code_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare n ngos; b donation_batches;
begin
  select * into n from ngos where owner_id = auth.uid();
  if not found or n.status <> 'Approved' then raise exception 'approval_required'; end if;
  update donation_batches set status = 'Claimed' where id = p_batch and status = 'Open' and collect_by > app_now() returning * into b;
  if not found then raise exception 'already_claimed'; end if;      -- first valid claim wins
  insert into donation_claims (batch_id, ngo_id, collection_code_hash) values (b.id, n.id, p_code_hash);
  return jsonb_build_object('batch_id', b.id, 'qty', b.qty);
end $function$;

create or replace function claim_priority_listing(p_listing uuid, p_code_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public, extensions
AS $function$
declare n ngos; l listings; o outlets; collect_by timestamptz; q int; b donation_batches; km numeric;
begin
  if not flag_on('priorityWindow') then raise exception 'feature_off'; end if;
  select * into n from ngos where owner_id = auth.uid();
  if not found or n.status <> 'Approved' then raise exception 'approval_required'; end if;
  select * into l from listings where id = p_listing for update;                 -- row lock: only one charity can win
  if not found then raise exception 'not_found'; end if;
  if l.public_visible_at is null or app_now() >= l.public_visible_at then raise exception 'priority_closed'; end if;
  if l.status <> 'Live' or l.qty_available <= 0 or app_now() >= l.window_end or l.hidden_by_admin or l.donation_only then raise exception 'not_available'; end if;
  select * into o from outlets where id = l.outlet_id;
  if not exists (select 1 from vendors where id = l.vendor_id and status = 'Approved' and not hidden_by_admin) then raise exception 'not_available'; end if;
  km := st_distance(n.location, o.location) / 1000.0;
  if km > n.service_area_km then raise exception 'out_of_area'; end if;
  collect_by := least(l.window_end + interval '2 hours', coalesce(l.safe_until, 'infinity'));
  if collect_by <= app_now() then raise exception 'not_available'; end if;
  q := l.qty_available;
  update listings set qty_available = 0, status = 'Sold Out', donation_processed_at = app_now(), updated_at = app_now() where id = l.id;   -- customers can't also buy it
  insert into inventory_movements (listing_id, delta, reason) values (l.id, -q, 'priority_claim');
  insert into donation_batches (ref, listing_id, vendor_id, outlet_id, qty, collect_by, vendor_instruction, origin, status, from_priority_listing)
    values ('DON-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, q, collect_by, 'Priority-window claim by a charity', 'priority', 'Claimed', true)
    returning * into b;
  insert into donation_claims (batch_id, ngo_id, collection_code_hash) values (b.id, n.id, p_code_hash);
  perform notify_outlet(l.vendor_id, l.outlet_id, 'generic', n.org_name || ' claimed ' || b.ref || ' (' || q || ' × ' || l.title || ').', jsonb_build_object('batchId', b.id));
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (auth.uid(), 'priority_claimed', 'listing', l.id::text, q || ' units by ' || n.id);
  return jsonb_build_object('batch_id', b.id, 'ref', b.ref, 'qty', q);
end $function$;

create or replace function confirm_payment(p_hold uuid, p_gateway_payment text, p_event text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare h checkout_holds; l listings; r reservations;
begin
  insert into processed_webhooks (event_id) values (p_event) on conflict do nothing;
  if not found then return jsonb_build_object('outcome','duplicate'); end if;
  select * into h from checkout_holds where id = p_hold for update;
  if h.status = 'Converted' then return jsonb_build_object('outcome','duplicate'); end if;
  if h.status <> 'Active' or h.expires_at <= app_now() then
    update payments set status = 'Refund Pending', gateway_payment_id = p_gateway_payment, updated_at = app_now() where hold_id = h.id;
    insert into refunds (payment_id, amount, reason, status) select id, amount, 'Payment arrived after hold expired', 'Refund Pending' from payments where hold_id = h.id;
    return jsonb_build_object('outcome','late_refund');
  end if;
  select * into l from listings where id = h.listing_id;
  update checkout_holds set status = 'Converted' where id = h.id;
  insert into reservations (ref, listing_id, vendor_id, outlet_id, customer_id, qty, unit_price, amount, method, hold_id, credit_applied)
    values ('SAP-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, h.customer_id, h.qty, l.rescue_price, h.amount + h.credit_applied, 'online', h.id, h.credit_applied) returning * into r;
  update payments set status = 'Test Payment Successful', reservation_id = r.id, gateway_payment_id = p_gateway_payment, updated_at = app_now() where hold_id = h.id;
  return jsonb_build_object('outcome','confirmed','reservation_id',r.id);
end $function$;

create or replace function credit_balance(p_user uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 set search_path = public
AS $function$
  select coalesce(sum(remaining), 0)::int from credit_ledger
   where user_id = p_user and type = 'earned' and remaining > 0 and (expires_at is null or expires_at > app_now())
$function$;

create or replace function earn_credit(p_user uuid, p_amount integer, p_note text, p_ref text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare lot_id uuid;
begin
  if p_amount <= 0 then return null; end if;
  insert into credit_ledger (user_id, amount, type, ref_id, note, expires_at, remaining)
    values (p_user, p_amount, 'earned', p_ref, p_note, app_now() + interval '90 days', p_amount) returning id into lot_id;
  return lot_id;
end $function$;

create or replace function generate_certificate(p_month text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare vid uuid; cid text; c impact_certificates;
begin
  if auth_role() is distinct from 'vendor' then raise exception 'forbidden' using errcode = '42501'; end if;
  if not flag_on('impactCertificate') then raise exception 'feature_off'; end if;
  select vendor_id into vid from memberships where user_id = auth.uid() and revoked_at is null and role in ('owner', 'manager') order by created_at limit 1;
  if vid is null then raise exception 'forbidden_role'; end if;
  if p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'month_invalid'; end if;
  if p_month > ist_month(app_now()) then raise exception 'month_future'; end if;
  cid := issue_certificate(vid, p_month);
  if cid is null then raise exception 'no_activity'; end if;
  select * into c from impact_certificates where id = cid;
  insert into audit_logs (actor_id, action, entity, entity_id, detail)
    values (auth.uid(), 'certificate_generated', 'certificate', cid, p_month || case when c.partial then ' (month to date)' else '' end);
  return to_jsonb(c);
end $function$;

create or replace function handover(p_token_hash text, p_code_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare v vendors; pc pickup_codes; r reservations; l listings;
begin
  select * into v from vendors where id in (select my_vendor_ids()) and status = 'Approved' order by created_at limit 1;
  if not found then raise exception 'approval_required'; end if;
  if p_token_hash is not null then
    select * into pc from pickup_codes where qr_token_hash = p_token_hash for update;
    if found and pc.vendor_id <> v.id then raise exception 'wrong_vendor'; end if;
  else
    select pc2.* into pc from pickup_codes pc2 join reservations rr on rr.id = pc2.reservation_id
     where pc2.vendor_id = v.id and pc2.code_hash = p_code_hash and rr.outlet_id in (select my_outlet_ids())
     order by (pc2.voided_at is not null), pc2.used_at nulls first limit 1 for update of pc2;
  end if;
  if not found then raise exception 'code_not_found'; end if;
  if pc.used_at is not null then raise exception 'code_used'; end if;
  select * into r from reservations where id = pc.reservation_id for update;
  if r.outlet_id not in (select my_outlet_ids()) then raise exception 'wrong_outlet'; end if;
  if r.status not in ('Reserved','Ready') then raise exception 'order_inactive'; end if;
  select * into l from listings where id = r.listing_id;
  if app_now() < l.window_start then raise exception 'too_early'; end if;
  if app_now() > l.window_end then raise exception 'too_late'; end if;
  update pickup_codes set used_at = app_now() where reservation_id = r.id;
  update reservations set status = 'Picked up', picked_up_at = app_now() where id = r.id;
  update payments set status = 'Paid at Pickup', updated_at = app_now() where reservation_id = r.id and method = 'pay_at_pickup' and status = 'Pending';
  insert into pickup_events (reservation_id, vendor_user, method) values (r.id, auth.uid(), case when p_token_hash is null then 'code' else 'qr' end);
  insert into impact_events (source, ref_id, units, vendor_id, neighbourhood)
    select 'customer_pickup', r.id, r.qty, v.id, o.neighbourhood from outlets o where o.id = r.outlet_id;
  perform reward_referral(r.id);
  return jsonb_build_object('ok',true,'ref',r.ref,'qty',r.qty,'title',l.title,'method',r.method,
    'collect_amount', coalesce((select amount from payments where reservation_id = r.id and method = 'pay_at_pickup'), 0));
end $function$;

create or replace function issue_certificate(p_vendor uuid, p_month text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare f jsonb; v_partial boolean; ex impact_certificates; cid text;
begin
  perform pg_advisory_xact_lock(hashtext('cert:' || p_vendor::text || p_month));
  f := monthly_figures(p_vendor, p_month);
  v_partial := app_now() < month_start(p_month) + interval '1 month';
  select * into ex from impact_certificates where vendor_id = p_vendor and month = p_month;
  if found and not ex.partial then return ex.id; end if;
  if not (f ->> 'active')::boolean then return case when found then ex.id end; end if;
  if found then
    update impact_certificates set meals_sold = (f ->> 'mealsSold')::int, meals_donated = (f ->> 'mealsDonated')::int, kg_rescued = (f ->> 'kgRescued')::numeric,
      rupees_recovered = (f ->> 'rupeesRecovered')::int, co2e_kg = (f ->> 'co2eKg')::numeric, charities_served = (f ->> 'charitiesServed')::int,
      people_served = (f ->> 'peopleServed')::int, partial = v_partial, created_at = app_now() where id = ex.id;
    return ex.id;
  end if;
  insert into impact_certificates (id, vendor_id, month, meals_sold, meals_donated, kg_rescued, rupees_recovered, co2e_kg, charities_served, people_served, partial)
    values (new_verification_id(), p_vendor, p_month, (f ->> 'mealsSold')::int, (f ->> 'mealsDonated')::int, (f ->> 'kgRescued')::numeric,
            (f ->> 'rupeesRecovered')::int, (f ->> 'co2eKg')::numeric, (f ->> 'charitiesServed')::int, (f ->> 'peopleServed')::int, v_partial) returning id into cid;
  return cid;
end $function$;

create or replace function issue_receipt(p_batch uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare b donation_batches; l listings; n ngos; cl donation_claims; rid uuid; collected timestamptz; g80 boolean;
begin
  if not flag_on('donationReceipts') then return null; end if;   -- switched off: nothing is issued now; the job catches up if it is switched back on
  select * into b from donation_batches where id = p_batch;
  if not found or b.status <> 'Collected' then return null; end if;
  select * into cl from donation_claims where batch_id = b.id and released_at is null;
  if not found then return null; end if;
  perform pg_advisory_xact_lock(hashtext('receipt:' || b.id::text));
  select id into rid from donation_receipts where batch_id = b.id;
  if found then return rid; end if;
  select * into l from listings where id = b.listing_id;
  select * into n from ngos where id = cl.ngo_id;
  collected := coalesce((select at from donation_handovers where batch_id = b.id), app_now());
  g80 := nullif(btrim(coalesce(n.eighty_g_number, '')), '') is not null and n.eighty_g_valid_until is not null
         and ((n.eighty_g_valid_until + time '23:59:59') at time zone 'Asia/Kolkata') >= collected;
  insert into donation_receipts (number, batch_id, vendor_id, ngo_id, item, qty, servings, estimated_value, eighty_g_number, eighty_g_valid_until)
    values (next_receipt_number(), b.id, b.vendor_id, cl.ngo_id, l.title, b.qty, b.qty, b.qty * l.original_price,
            case when g80 then btrim(n.eighty_g_number) end, case when g80 then n.eighty_g_valid_until end)
    returning id into rid;
  insert into audit_logs (actor_id, action, entity, entity_id, detail)
    values (null, 'receipt_issued', 'receipt', rid::text, (select number from donation_receipts where id = rid));
  return rid;
end $function$;

create or replace function next_receipt_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare y int := extract(year from app_now() at time zone 'Asia/Kolkata')::int; n int;
begin
  insert into receipt_counters (year, last_value) values (y, 1) on conflict (year) do update set last_value = receipt_counters.last_value + 1 returning last_value into n;
  return 'SAP-DR-' || y || '-' || lpad(n::text, 6, '0');
end $function$;

create or replace function process_p1_jobs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public, extensions
AS $function$
declare r record; b record; n record; cnt int;
begin
  -- 15 minutes left in the pickup window
  for r in select res.id, res.customer_id, res.ref, l.title from reservations res join listings l on l.id = res.listing_id
           where res.status in ('Reserved','Ready') and res.reminder_sent_at is null
             and l.window_end > app_now() and l.window_end <= app_now() + interval '15 minutes' for update of res skip locked loop
    update reservations set reminder_sent_at = app_now() where id = r.id;
    insert into notifications (user_id, type, text, payload) values (r.customer_id, 'pickup_reminder', '15 minutes left to collect ' || r.ref || ' (' || r.title || ').', jsonb_build_object('reservationId', r.id));
  end loop;
  -- no-shows: not scanned 15 minutes after pickup end
  for r in select res.id, res.customer_id, res.ref, res.listing_id, res.qty, res.vendor_id from reservations res join listings l on l.id = res.listing_id
           where res.status in ('Reserved','Ready') and l.window_end + interval '15 minutes' <= app_now() for update of res skip locked loop
    update reservations set status = 'No-show', no_show_at = app_now() where id = r.id;
    insert into notifications (user_id, type, text, payload) values (r.customer_id, 'no_show', r.ref || ' was marked a no-show.', jsonb_build_object('reservationId', r.id));
    select count(*) into cnt from reservations where customer_id = r.customer_id and status = 'No-show' and no_show_at >= app_now() - interval '30 days';
    if cnt >= 3 then
      update profiles set suspended_until = app_now() + interval '7 days', suspend_reason = 'Reservations paused for 7 days after 3 no-shows in 30 days.'
       where id = r.customer_id and (suspended_until is null or suspended_until <= app_now());
    end if;
  end loop;
  -- offer no-show units to charity (donate-the-rest flow), one batch per listing
  for b in select l.* , (select coalesce(sum(qty),0) from reservations x where x.listing_id = l.id and x.status = 'No-show') as ns
           from listings l where l.donate_rest and l.status = 'Expired'
             and exists (select 1 from reservations x where x.listing_id = l.id and x.status = 'No-show')
             and not exists (select 1 from donation_batches d where d.listing_id = l.id and d.origin = 'no_show') loop
    if coalesce(b.safe_until, 'infinity') > app_now() and least(b.window_end + interval '2 hours', coalesce(b.safe_until, 'infinity')) > app_now() then
      insert into donation_batches (ref, listing_id, vendor_id, outlet_id, qty, collect_by, vendor_instruction, origin)
        values ('DON-' || nextval('reservation_ref_seq'), b.id, b.vendor_id, b.outlet_id, b.ns,
                least(b.window_end + interval '2 hours', coalesce(b.safe_until, 'infinity')), 'No-show units offered to charity', 'no_show');
    end if;
  end loop;
  -- escalate unclaimed batches 60 minutes before the deadline to verified charities within 10 km
  for b in select d.*, o.location as loc from donation_batches d join outlets o on o.id = d.outlet_id
           where d.status = 'Open' and d.escalated_at is null and d.collect_by - interval '60 minutes' <= app_now() for update of d skip locked loop
    update donation_batches set escalated_at = app_now() where id = b.id;
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
  update listings set donation_processed_at = app_now() where status = 'Expired' and not donate_rest and not donation_only and donation_processed_at is null;
end $function$;

create or replace function process_p2_jobs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
begin
  if flag_on('autoMarkdown') then
    update listings l set rescue_price = least(l.rescue_price, floor(l.original_price * (100 - s.discount_pct) / 100.0)::int)  -- measured against the ORIGINAL price; only ever lowers
      from listing_price_steps s
     where s.listing_id = l.id and s.applied_at is null and s.effective_at <= app_now() and l.status = 'Live' and l.window_end > app_now();
    update listing_price_steps set applied_at = app_now() where applied_at is null and effective_at <= app_now();
  end if;
  if flag_on('referrals') then
    insert into credit_ledger (user_id, amount, type, ref_id, note)
      select user_id, remaining, 'expired', id::text, 'expired after 90 days' from credit_ledger
       where type = 'earned' and remaining > 0 and expires_at <= app_now();
    update credit_ledger set remaining = 0 where type = 'earned' and remaining > 0 and expires_at <= app_now();
  end if;
  perform run_receipt_job();
  perform run_certificate_job();
  perform run_priority_job();
end $function$;

create or replace function process_window_end()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare h checkout_holds; l listings; cb timestamptz;
begin
  for h in select * from checkout_holds where status = 'Active' and expires_at <= app_now() for update skip locked loop
    update checkout_holds set status = 'Expired' where id = h.id;
    update listings set qty_available = qty_available + h.qty,
      status = case when status = 'Sold Out' and app_now() < window_end then 'Live'::listing_status else status end where id = h.listing_id;
    insert into inventory_movements (listing_id, delta, reason, ref_id) values (h.listing_id, h.qty, 'hold_expired', h.id);
    update payments set status = 'Failed', updated_at = app_now() where hold_id = h.id and status = 'Pending';
    perform restore_credit(h.customer_id, array[h.id::text], 'checkout hold expired');
  end loop;
  for l in select * from listings where status in ('Live','Paused','Sold Out') and window_end <= app_now() for update skip locked loop
    update listings set status = 'Expired', updated_at = app_now() where id = l.id;
    if l.donate_rest and l.donation_processed_at is null then
      update listings set donation_processed_at = app_now() where id = l.id;
      cb := least(l.window_end + interval '2 hours', coalesce(l.safe_until, 'infinity'));
      if l.qty_available > 0 and coalesce(l.safe_until, 'infinity') > app_now() and cb > app_now() then
        insert into donation_batches (ref, listing_id, vendor_id, outlet_id, qty, collect_by, vendor_instruction)
          values ('DON-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, l.qty_available, cb, 'Donate the rest at window end');
        insert into inventory_movements (listing_id, delta, reason) values (l.id, -l.qty_available, 'donation_batch');
        update listings set qty_available = 0 where id = l.id;
      end if;
    end if;
  end loop;
  update donation_batches set status = 'Expired' where status in ('Open','Claimed') and collect_by <= app_now();
end $function$;

create or replace function record_delivery_ack(p_delivery uuid, p_external_id text, p_fee integer, p_status delivery_status, p_rider text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare d delivery_requests; n ngos; v_ref text;
begin
  select * into d from delivery_requests where id = p_delivery for update;
  if not found then raise exception 'not_found'; end if;
  update delivery_requests set external_id = p_external_id, fee = p_fee, status = p_status, rider_name = p_rider, updated_at = app_now() where id = d.id;
  select * into n from ngos where id = d.ngo_id;
  select b.ref into v_ref from donation_batches b where b.id = d.batch_id;
  insert into notifications (user_id, type, text, payload) values (n.owner_id, 'delivery_update',
    'Delivery requested for ' || v_ref || ' (' || d.provider || ', about ₹' || p_fee || '). We''ll update you as the rider moves.', jsonb_build_object('deliveryId', d.id));
end $function$;

create or replace function record_delivery_failure(p_delivery uuid, p_error text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare d delivery_requests; n ngos; v_ref text;
begin
  select * into d from delivery_requests where id = p_delivery for update;
  if not found then raise exception 'not_found'; end if;
  update delivery_requests set status = 'Failed', error = p_error, updated_at = app_now() where id = d.id;
  select * into n from ngos where id = d.ngo_id;
  select b.ref into v_ref from donation_batches b where b.id = d.batch_id;
  insert into notifications (user_id, type, text, payload) values (n.owner_id, 'delivery_update',
    'We couldn''t book a rider for ' || v_ref || ': ' || coalesce(p_error, '') || ' You still hold the claim: try again or collect it yourself before the deadline.', jsonb_build_object('deliveryId', d.id));
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (null, 'delivery_failed', 'delivery', d.id::text, coalesce(p_error, ''));
end $function$;

create or replace function release_checkout(p_hold uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare h checkout_holds;
begin
  select * into h from checkout_holds where id = p_hold and customer_id = auth.uid() for update;
  if not found then raise exception 'not_found'; end if;
  if h.status <> 'Active' then return jsonb_build_object('status', h.status); end if;
  update checkout_holds set status = 'Released' where id = h.id;
  update listings set qty_available = qty_available + h.qty,
    status = case when status = 'Sold Out' and app_now() < window_end then 'Live'::listing_status else status end where id = h.listing_id;
  insert into inventory_movements (listing_id, delta, reason, ref_id) values (h.listing_id, h.qty, 'hold_released', h.id);
  update payments set status = 'Failed', updated_at = app_now() where hold_id = h.id and status = 'Pending';
  perform restore_credit(h.customer_id, array[h.id::text], 'checkout was not completed');
  return jsonb_build_object('status', 'Released');
end $function$;

create or replace function request_delivery(p_batch uuid, p_provider text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare n ngos; b donation_batches; l listings; o outlets; v vendors; d delivery_requests;
begin
  if not flag_on('delivery') then raise exception 'feature_off'; end if;
  select * into n from ngos where owner_id = auth.uid();
  if not found then raise exception 'no_ngo'; end if;
  select * into b from donation_batches where id = p_batch for update;
  if not found or not exists (select 1 from donation_claims where batch_id = b.id and ngo_id = n.id and released_at is null) then raise exception 'not_found'; end if;
  if b.status <> 'Claimed' then raise exception 'bad_transition'; end if;
  if b.collect_by <= app_now() then raise exception 'expired'; end if;
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
end $function$;

create or replace function reserve_listing(p_listing uuid, p_qty integer, p_method payment_method, p_use_credit boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare l listings; o outlets; v vendors; active int; h checkout_holds; r reservations; code text; token text; now_ts timestamptz := app_now();
        total int; credit int := 0; unit_cap int; max_active int := setting_int('max_active_reservations', 3); hold_min int := setting_int('hold_minutes', 5);
begin
  if auth_role() is distinct from 'customer' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_qty < 1 then raise exception 'qty_cap'; end if;
  if exists (select 1 from profiles where id = auth.uid() and suspended_until > app_now()) then raise exception 'suspended'; end if;   -- 3 no-shows in 30 days
  if p_method = 'pay_at_pickup' and (select count(*) from reservations where customer_id = auth.uid() and status = 'Picked up') < 3 then raise exception 'pay_at_pickup_locked'; end if;
  -- serialise per customer so concurrent requests cannot bypass the 3-active cap
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  select * into l from listings where id = p_listing for update;            -- row lock: last unit cannot sell twice
  if not found then raise exception 'not_found'; end if;
  select * into v from vendors where id = l.vendor_id;
  unit_cap := greatest(5, coalesce(v.max_units_per_order, 0));          -- 5 per order unless the vendor allows more (up to 50)
  if p_qty > unit_cap then raise exception 'qty_cap'; end if;
  if l.donation_only or l.hidden_by_admin or v.hidden_by_admin
     or (l.public_visible_at is not null and now_ts < l.public_visible_at and flag_on('priorityWindow')) then raise exception 'not_available'; end if;
  if v.status <> 'Approved' then raise exception 'vendor_unavailable'; end if;
  if now_ts >= l.window_end then raise exception 'window_closed'; end if;
  if l.status = 'Sold Out' or l.qty_available < p_qty then raise exception 'insufficient_stock'; end if;
  if l.status <> 'Live' then raise exception 'not_available'; end if;
  select count(*) into active from (
    select id from reservations where customer_id = auth.uid() and status in ('Reserved','Ready')
    union all select id from checkout_holds where customer_id = auth.uid() and status = 'Active' and expires_at > now_ts) x;
  if active >= max_active then raise exception 'active_cap'; end if;
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
      values (l.id, auth.uid(), p_qty, total - credit, least(now_ts + make_interval(mins => hold_min), l.window_end), credit) returning * into h;
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
end $function$;

create or replace function review_guard()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare r reservations;
begin
  select * into r from reservations where id = new.reservation_id;
  if r.customer_id <> new.customer_id or r.vendor_id <> new.vendor_id then raise exception 'review_forbidden'; end if;
  if r.status <> 'Picked up' then raise exception 'review_not_picked_up'; end if;
  if app_now() > r.picked_up_at + interval '48 hours' then raise exception 'review_window_closed'; end if;
  return new;
end $function$;

create or replace function reward_referral(p_reservation uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare r reservations; rf referrals; amount int; dup boolean; rewarded_this_month int; ref_name text; ref_cap constant int := 10;
begin
  if not flag_on('referrals') then return; end if;
  select * into r from reservations where id = p_reservation;
  if not found then return; end if;
  select * into rf from referrals where referee_id = r.customer_id and status = 'pending' for update;
  if not found then return; end if;
  amount := setting_int('referral_credit_inr', 50);
  -- one reward per device / phone, re-checked at payout time (a duplicate that slipped past redeem time)
  select exists (select 1 from referrals x where x.id <> rf.id and x.status = 'rewarded'
                   and ((rf.device_id is not null and x.device_id = rf.device_id) or x.phone_key = rf.phone_key)) into dup;
  if dup then
    update referrals set status = 'rejected', reject_reason = 'duplicate_device_or_phone' where id = rf.id;
    insert into audit_logs (actor_id, action, entity, entity_id, detail) values (null, 'referral_rejected', 'referral', rf.id::text, 'duplicate_device_or_phone');
    return;
  end if;
  select count(*) into rewarded_this_month from referrals x
   where x.referrer_id = rf.referrer_id and x.status = 'rewarded' and x.rewarded_at is not null
     and ist_month(x.rewarded_at) = ist_month(app_now()) and coalesce(x.reject_reason, '') <> 'referrer_monthly_cap';
  select split_part(name, ' ', 1) into ref_name from profiles where id = rf.referee_id;
  update referrals set status = 'rewarded', rewarded_at = app_now() where id = rf.id;
  if amount > 0 then
    perform earn_credit(rf.referee_id, amount, 'referral welcome credit', rf.id::text);
    insert into notifications (user_id, type, text, payload) values (rf.referee_id, 'credit_earned',
      '₹' || amount || ' welcome credit added after your first rescue.', jsonb_build_object('amount', amount, 'referralId', rf.id));
    if rewarded_this_month < ref_cap then
      perform earn_credit(rf.referrer_id, amount, 'referral reward', rf.id::text);
      insert into notifications (user_id, type, text, payload) values (rf.referrer_id, 'credit_earned',
        coalesce(ref_name, 'Your friend') || ' rescued their first meal. ₹' || amount || ' credit added.', jsonb_build_object('amount', amount, 'referralId', rf.id));
    else
      update referrals set reject_reason = 'referrer_monthly_cap' where id = rf.id;   -- the friend is still rewarded; the referrer hit the monthly limit
      insert into notifications (user_id, type, text, payload) values (rf.referrer_id, 'generic',
        coalesce(ref_name, 'Your friend') || ' ordered, but you have reached the limit of ' || ref_cap || ' rewarded referrals this month.', jsonb_build_object('referralId', rf.id));
    end if;
  end if;
  insert into audit_logs (actor_id, action, entity, entity_id, detail)
    values (null, 'referral_rewarded', 'referral', rf.id::text, '₹' || amount || ' each');
end $function$;

create or replace function run_certificate_job()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare prev text := to_char(date_trunc('month', app_now() at time zone 'Asia/Kolkata') - interval '1 month', 'YYYY-MM'); last text; v vendors; had boolean; cid text; c impact_certificates;
begin
  if not flag_on('impactCertificate') then return; end if;
  if not pg_try_advisory_xact_lock(hashtext('certificate-job')) then return; end if;
  last := coalesce((select value #>> '{}' from settings where key = 'last_certificate_run'), '');
  if last >= prev then return; end if;
  insert into settings (key, value) values ('last_certificate_run', to_jsonb(prev)) on conflict (key) do update set value = excluded.value, updated_at = app_now();
  for v in select * from vendors where status = 'Approved' loop
    had := exists (select 1 from impact_certificates where vendor_id = v.id and month = prev and not partial);
    cid := issue_certificate(v.id, prev);
    if cid is not null then
      select * into c from impact_certificates where id = cid;
      if not c.partial and not had then
        insert into notifications (user_id, type, text, payload) values (v.owner_id, 'certificate_ready',
          'Your impact certificate for ' || prev || ' is ready (' || (c.meals_sold + c.meals_donated) || ' meals rescued).', jsonb_build_object('certificateId', c.id, 'month', prev));
        insert into audit_logs (actor_id, action, entity, entity_id, detail) values (null, 'certificate_issued', 'certificate', c.id, v.id::text || ' ' || prev);
      end if;
    end if;
  end loop;
end $function$;

create or replace function run_priority_job()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public, extensions
AS $function$
declare l listings; o outlets; v vendors;
begin
  if not flag_on('priorityWindow') then return; end if;
  for l in select * from listings where public_visible_at is not null and public_notified_at is null and app_now() >= public_visible_at for update skip locked loop
    update listings set public_notified_at = app_now() where id = l.id;
    if l.status <> 'Live' or l.qty_available <= 0 or app_now() >= l.window_end or l.hidden_by_admin then continue; end if;
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
end $function$;

create or replace function spend_credit(p_user uuid, p_amount integer, p_ref text, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare lot record; remaining_to_take int := p_amount; take int;
begin
  if p_amount <= 0 then return; end if;
  perform pg_advisory_xact_lock(hashtext('credit:' || p_user::text));
  if credit_balance(p_user) < p_amount then raise exception 'credit_insufficient' using errcode = 'P0001'; end if;
  for lot in select id, remaining from credit_ledger
              where user_id = p_user and type = 'earned' and remaining > 0 and (expires_at is null or expires_at > app_now())
              order by expires_at nulls last, created_at, id for update loop
    take := least(remaining_to_take, lot.remaining);
    update credit_ledger set remaining = remaining - take where id = lot.id;
    remaining_to_take := remaining_to_take - take;
    exit when remaining_to_take = 0;
  end loop;
  insert into credit_ledger (user_id, amount, type, ref_id, note) values (p_user, p_amount, 'spent', p_ref, p_note);
end $function$;

create or replace function start_priority_window(p_listing uuid, p_minutes integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
declare l listings; v vendors; opts jsonb; visible_at timestamptz; n ngos; told int := 0;
begin
  if not flag_on('priorityWindow') then raise exception 'feature_off'; end if;
  select * into l from listings where id = p_listing for update;
  if not found or not is_org_admin(l.vendor_id) then raise exception 'not_found'; end if;
  if l.donation_only then raise exception 'priority_donation'; end if;
  opts := coalesce((select value from settings where key = 'priority_options'), '[15,30,45]'::jsonb);
  if not (opts @> to_jsonb(p_minutes)) or p_minutes not in (15, 30, 45) then raise exception 'priority_invalid'; end if;
  if l.public_visible_at is not null then raise exception 'priority_already_set'; end if;   -- a window can't be restarted, or a listing could be hidden for ever
  visible_at := app_now() + make_interval(mins => p_minutes);
  if visible_at >= l.window_end - interval '10 minutes' then raise exception 'priority_too_long'; end if;
  update listings set priority_minutes = p_minutes, public_visible_at = visible_at, updated_at = app_now() where id = l.id;
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
end $function$;

create or replace function void_pickup_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 set search_path = public
AS $function$
begin
  if new.status in ('Cancelled', 'Expired', 'No-show') and old.status is distinct from new.status then
    update pickup_codes set voided_at = app_now() where reservation_id = new.id and used_at is null and voided_at is null;
  end if;
  return new;
end $function$;
