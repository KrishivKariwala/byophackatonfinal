-- SAVE A PLATE: reserve_listing parity with the demo rules (issue #14, slice A).
-- The app's reserve() enforced four rules that the database function did not, so the Supabase adapter would have been LOOSER than the demo:
--   * suspended customers (3 no-shows in 30 days) cannot reserve;
--   * pay-at-pickup unlocks only after 3 completed pickups;
--   * the per-order cap is 5 unless the vendor allows more (up to 50): the qty check constraints allowed only 1..5, now 1..50;
--   * the hold time and the active-reservation cap come from settings (hold_minutes, max_active_reservations; defaults 5 and 3).
-- REVERSIBLE (0008_reserve_parity.down.sql restores 0006's function and the 1..5 constraints; it fails if a bigger order exists).

alter table checkout_holds drop constraint checkout_holds_qty_check, add constraint checkout_holds_qty_check check (qty between 1 and 50);
alter table reservations drop constraint reservations_qty_check, add constraint reservations_qty_check check (qty between 1 and 50);

create or replace function reserve_listing(p_listing uuid, p_qty int, p_method payment_method, p_use_credit boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare l listings; o outlets; v vendors; active int; h checkout_holds; r reservations; code text; token text; now_ts timestamptz := now();
        total int; credit int := 0; unit_cap int; max_active int := setting_int('max_active_reservations', 3); hold_min int := setting_int('hold_minutes', 5);
begin
  if auth_role() is distinct from 'customer' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_qty < 1 then raise exception 'qty_cap'; end if;
  if exists (select 1 from profiles where id = auth.uid() and suspended_until > now()) then raise exception 'suspended'; end if;   -- 3 no-shows in 30 days
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
end $$;
