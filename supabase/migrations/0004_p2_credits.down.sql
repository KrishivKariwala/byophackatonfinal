-- Reverses 0004_p2_credits.sql: puts the previous function bodies back (verbatim from 0001/0002). Credit-ledger DATA is left alone (it lives in 0003's tables).

drop function if exists reserve_listing(uuid, int, payment_method, boolean);
drop function if exists release_checkout(uuid), redeem_referral(text, text), my_referral_code(text), credit_quote(int),
  reward_referral(uuid), restore_credit(uuid, text[], text), spend_credit(uuid, int, text, text), earn_credit(uuid, int, text, text),
  credit_balance(uuid), ist_month(timestamptz), normalize_phone(text), setting_int(text, int);

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

-- the job runners were callable by everyone before this migration; restore that
grant execute on function process_window_end(), process_p1_jobs(), process_p2_jobs() to public;
