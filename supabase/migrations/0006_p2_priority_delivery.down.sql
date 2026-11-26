-- Reverses 0006_p2_priority_delivery.sql: back to 0004's reserve_listing and 0005's job runner. Delivery / priority DATA lives in 0003's tables and is left alone.
-- (The process_p1_jobs search_path fix is undone too, which brings back the broken donation escalation: that is what 0002 shipped.)

drop function if exists start_priority_window(uuid, int), claim_priority_listing(uuid, text), run_priority_job(), request_delivery(uuid, text),
  record_delivery_ack(uuid, text, int, delivery_status, text), record_delivery_failure(uuid, text), cancel_delivery(uuid),
  delivery_webhook(text, text, text), apply_delivery_status(uuid, delivery_status, text), delivery_can_advance(delivery_status, delivery_status),
  delivery_rank(delivery_status), delivery_is_active(delivery_status), notify_outlet(uuid, uuid, notification_type, text, jsonb), ngos_near(uuid, numeric);

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
end $$;

alter function process_p1_jobs() set search_path = public;
