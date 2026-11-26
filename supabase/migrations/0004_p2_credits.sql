-- SAVE A PLATE: P2 rules in Postgres, slice 1 of 3: referral credits (issue #13).
-- Ports lib/p2/credits.ts into security-definer functions, with the same rules and the same idempotency:
--   * earn: 90-day lots with a `remaining` balance; spend: oldest-expiry first, never below zero;
--   * restore: gives back what a hold / reservation spent, once (a second call restores nothing);
--   * redeem a referral code (no self-referral, one reward per device and per phone, new customers only);
--   * reward both people on the referee's first completed pickup (referrer capped at 10 rewarded referrals a month).
-- It also wires them into the P0/P1 functions: reserve_listing (spend), confirm_payment (carry the credit to the order),
-- cancel_reservation (restore on free cancel), process_window_end (restore on hold expiry) and handover (reward).
-- ADDITIVE and REVERSIBLE (0004_p2_credits.down.sql puts the previous function bodies back).
-- Settings keys read from `settings`: referral_credit_inr (default 50), credit_max_pct (default 50). Flag: 'referrals' in key 'flags'.
-- Helpers that move money are NOT callable by clients (revoked below); clients get only the RPCs at the bottom.

-- ---------------------------------------------------------------- small helpers
create or replace function setting_int(p_key text, p_default int) returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from settings where key = p_key), p_default)
$$;
-- same rule as lib/auth.ts normalizePhone: digits only, last 10
create or replace function normalize_phone(p text) returns text language sql immutable as $$
  select case when length(regexp_replace(coalesce(p, ''), '\D', '', 'g')) > 10
              then right(regexp_replace(p, '\D', '', 'g'), 10) else regexp_replace(coalesce(p, ''), '\D', '', 'g') end
$$;
create or replace function ist_month(p timestamptz) returns text language sql immutable as $$
  select to_char(p at time zone 'Asia/Kolkata', 'YYYY-MM')
$$;

-- ---------------------------------------------------------------- ledger primitives (internal)
create or replace function credit_balance(p_user uuid) returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(remaining), 0)::int from credit_ledger
   where user_id = p_user and type = 'earned' and remaining > 0 and (expires_at is null or expires_at > now())
$$;

create or replace function earn_credit(p_user uuid, p_amount int, p_note text, p_ref text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare lot_id uuid;
begin
  if p_amount <= 0 then return null; end if;
  insert into credit_ledger (user_id, amount, type, ref_id, note, expires_at, remaining)
    values (p_user, p_amount, 'earned', p_ref, p_note, now() + interval '90 days', p_amount) returning id into lot_id;
  return lot_id;
end $$;

-- Spends oldest-expiry first. The per-user lock makes two concurrent spends queue up, so the balance can never go negative.
create or replace function spend_credit(p_user uuid, p_amount int, p_ref text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare lot record; remaining_to_take int := p_amount; take int;
begin
  if p_amount <= 0 then return; end if;
  perform pg_advisory_xact_lock(hashtext('credit:' || p_user::text));
  if credit_balance(p_user) < p_amount then raise exception 'credit_insufficient' using errcode = 'P0001'; end if;
  for lot in select id, remaining from credit_ledger
              where user_id = p_user and type = 'earned' and remaining > 0 and (expires_at is null or expires_at > now())
              order by expires_at nulls last, created_at, id for update loop
    take := least(remaining_to_take, lot.remaining);
    update credit_ledger set remaining = remaining - take where id = lot.id;
    remaining_to_take := remaining_to_take - take;
    exit when remaining_to_take = 0;
  end loop;
  insert into credit_ledger (user_id, amount, type, ref_id, note) values (p_user, p_amount, 'spent', p_ref, p_note);
end $$;

-- Gives back what these refs (a hold and/or reservation) spent, as a fresh 90-day lot. Idempotent.
create or replace function restore_credit(p_user uuid, p_refs text[], p_note text) returns int
language plpgsql security definer set search_path = public as $$
declare refs text[] := array_remove(p_refs, null); spent int; back int; owed int;
begin
  if coalesce(array_length(refs, 1), 0) = 0 then return 0; end if;
  perform pg_advisory_xact_lock(hashtext('credit:' || p_user::text));
  select coalesce(sum(amount), 0) into spent from credit_ledger where user_id = p_user and type = 'spent' and ref_id = any (refs);
  select coalesce(sum(amount), 0) into back from credit_ledger where user_id = p_user and type = 'earned' and note like 'restored%' and ref_id = any (refs);
  owed := spent - back;
  if owed <= 0 then return 0; end if;
  perform earn_credit(p_user, owed, 'restored: ' || p_note, refs[1]);
  insert into notifications (user_id, type, text, payload)
    values (p_user, 'credit_earned', '₹' || owed || ' credit returned (' || p_note || ').', jsonb_build_object('amount', owed, 'note', p_note));
  return owed;
end $$;

-- ---------------------------------------------------------------- referral reward (internal; called from handover)
create or replace function reward_referral(p_reservation uuid) returns void
language plpgsql security definer set search_path = public as $$
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
     and ist_month(x.rewarded_at) = ist_month(now()) and coalesce(x.reject_reason, '') <> 'referrer_monthly_cap';
  select split_part(name, ' ', 1) into ref_name from profiles where id = rf.referee_id;
  update referrals set status = 'rewarded', rewarded_at = now() where id = rf.id;
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
end $$;

-- ---------------------------------------------------------------- client RPCs
-- What this order may use: the balance, capped at credit_max_pct of the total; zero when the feature is off.
create or replace function credit_quote(p_total int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare bal int; cap int; pct int := setting_int('credit_max_pct', 50);
begin
  if auth.uid() is null then raise exception 'forbidden' using errcode = '42501'; end if;
  bal := case when flag_on('referrals') then credit_balance(auth.uid()) else 0 end;
  cap := floor(greatest(p_total, 0) * pct / 100.0)::int;
  return jsonb_build_object('balance', bal, 'cap', cap, 'usable', greatest(0, least(bal, cap)), 'maxPct', pct);
end $$;

create or replace function my_referral_code(p_device text default null) returns text
language plpgsql security definer set search_path = public as $$
declare rc referral_codes; stem text; alpha constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; v_code text; i int; j int;
begin
  if auth_role() is distinct from 'customer' then raise exception 'forbidden' using errcode = '42501'; end if;
  if not flag_on('referrals') then raise exception 'feature_off'; end if;
  perform pg_advisory_xact_lock(hashtext('refcode:' || auth.uid()::text));
  select * into rc from referral_codes where user_id = auth.uid();
  if not found then
    select rpad(left(upper(regexp_replace(name, '[^A-Za-z]', '', 'g')), 4), 4, 'X') into stem from profiles where id = auth.uid();
    for i in 1..50 loop
      v_code := stem;
      for j in 1..4 loop v_code := v_code || substr(alpha, 1 + floor(random() * length(alpha))::int, 1); end loop;
      begin
        insert into referral_codes (user_id, code, device_id) values (auth.uid(), v_code, left(p_device, 64)) returning * into rc;
        exit;
      exception when unique_violation then rc := null;   -- someone has this code; try another
      end;
    end loop;
    if rc.user_id is null then raise exception 'code_unavailable'; end if;
  elsif p_device is not null then
    update referral_codes set device_id = left(p_device, 64) where user_id = auth.uid();
  end if;
  return rc.code;
end $$;

-- A new customer enters someone's code. Nothing is paid yet: the reward comes with the referee's first completed pickup.
create or replace function redeem_referral(p_code text, p_device text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me profiles; rc referral_codes; referrer profiles; v_code text; v_phone text; v_device text; rf referrals; cname text;
begin
  if auth_role() is distinct from 'customer' then raise exception 'forbidden' using errcode = '42501'; end if;
  if not flag_on('referrals') then raise exception 'feature_off'; end if;
  v_code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if length(v_code) < 4 then raise exception 'code_invalid'; end if;
  select * into me from profiles where id = auth.uid();
  select * into rc from referral_codes where referral_codes.code = v_code;
  if not found then raise exception 'code_unknown'; end if;
  if rc.user_id = me.id then raise exception 'self_referral'; end if;
  select * into referrer from profiles where id = rc.user_id;
  if not found then raise exception 'code_unknown'; end if;
  perform pg_advisory_xact_lock(hashtext('referee:' || me.id::text));
  if exists (select 1 from referrals where referee_id = me.id) then raise exception 'already_referred'; end if;
  if exists (select 1 from reservations where customer_id = me.id) or exists (select 1 from checkout_holds where customer_id = me.id) then
    raise exception 'not_new';
  end if;
  v_phone := coalesce(nullif(normalize_phone(me.phone), ''), me.id::text);
  if referrer.phone is not null and normalize_phone(referrer.phone) = v_phone then raise exception 'self_referral'; end if;
  v_device := left(p_device, 64);
  if v_device is not null and rc.device_id is not null and rc.device_id = v_device then raise exception 'same_device'; end if;
  if exists (select 1 from referrals where status <> 'rejected' and referrals.phone_key = v_phone) then raise exception 'phone_used'; end if;
  if v_device is not null and exists (select 1 from referrals where status <> 'rejected' and device_id = v_device) then raise exception 'device_used'; end if;
  begin
    insert into referrals (referrer_id, referee_id, code, device_id, phone_key) values (rc.user_id, me.id, v_code, v_device, v_phone) returning * into rf;
  exception when unique_violation then   -- the unique indexes are the last line of defence against a race
    get stacked diagnostics cname = constraint_name;
    raise exception '%', case cname when 'referrals_referee_id_key' then 'already_referred' when 'referrals_one_per_device' then 'device_used' else 'phone_used' end;
  end;
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (me.id, 'referral_redeemed', 'referral', rf.id::text, 'code ' || v_code);
  return jsonb_build_object('referral_id', rf.id, 'status', rf.status);
end $$;

-- Customer abandons or fails checkout: stock and credit go back, the payment is marked failed. (The demo adapter's failOnlinePayment.)
create or replace function release_checkout(p_hold uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare h checkout_holds;
begin
  select * into h from checkout_holds where id = p_hold and customer_id = auth.uid() for update;
  if not found then raise exception 'not_found'; end if;
  if h.status <> 'Active' then return jsonb_build_object('status', h.status); end if;
  update checkout_holds set status = 'Released' where id = h.id;
  update listings set qty_available = qty_available + h.qty,
    status = case when status = 'Sold Out' and now() < window_end then 'Live'::listing_status else status end where id = h.listing_id;
  insert into inventory_movements (listing_id, delta, reason, ref_id) values (h.listing_id, h.qty, 'hold_released', h.id);
  update payments set status = 'Failed', updated_at = now() where hold_id = h.id and status = 'Pending';
  perform restore_credit(h.customer_id, array[h.id::text], 'checkout was not completed');
  return jsonb_build_object('status', 'Released');
end $$;

-- ---------------------------------------------------------------- P0/P1 functions, now credit-aware
-- reserve_listing gains p_use_credit; the old 3-argument version is dropped so a call can never be ambiguous.
drop function if exists reserve_listing(uuid, int, payment_method);
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

-- confirm_payment: the order keeps its FULL value (as in the demo adapter), and remembers the credit part.
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
  insert into reservations (ref, listing_id, vendor_id, outlet_id, customer_id, qty, unit_price, amount, method, hold_id, credit_applied)
    values ('SAP-' || nextval('reservation_ref_seq'), l.id, l.vendor_id, l.outlet_id, h.customer_id, h.qty, l.rescue_price, h.amount + h.credit_applied, 'online', h.id, h.credit_applied) returning * into r;
  update payments set status = 'Test Payment Successful', reservation_id = r.id, gateway_payment_id = p_gateway_payment, updated_at = now() where hold_id = h.id;
  return jsonb_build_object('outcome','confirmed','reservation_id',r.id);
end $$;
revoke all on function confirm_payment from public, anon, authenticated;   -- server (service role) only

-- handover: also rewards the referral on the customer's first completed pickup.
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
  perform reward_referral(r.id);
  return jsonb_build_object('ok',true,'ref',r.ref,'qty',r.qty);
end $$;

-- cancel_reservation: a FREE cancellation gives the credit back; a late one forfeits it like the cash.
create or replace function cancel_reservation(p_reservation uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r reservations; l listings; p payments; free boolean; refund int := 0; credit_back int := 0;
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
  if free then credit_back := restore_credit(r.customer_id, array[r.id::text, r.hold_id::text], 'order cancelled'); end if;
  return jsonb_build_object('reservation_id', r.id, 'refund', refund, 'free', free, 'credit_back', credit_back);
end $$;

-- process_window_end: an expired hold also returns the credit it took.
create or replace function process_window_end() returns void language plpgsql security definer set search_path = public as $$
declare h checkout_holds; l listings; cb timestamptz;
begin
  for h in select * from checkout_holds where status = 'Active' and expires_at <= now() for update skip locked loop
    update checkout_holds set status = 'Expired' where id = h.id;
    update listings set qty_available = qty_available + h.qty,
      status = case when status = 'Sold Out' and now() < window_end then 'Live'::listing_status else status end where id = h.listing_id;
    insert into inventory_movements (listing_id, delta, reason, ref_id) values (h.listing_id, h.qty, 'hold_expired', h.id);
    update payments set status = 'Failed', updated_at = now() where hold_id = h.id and status = 'Pending';
    perform restore_credit(h.customer_id, array[h.id::text], 'checkout hold expired');
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

-- ---------------------------------------------------------------- who may call what
-- Functions that move money or reward people are server-internal. Clients get only credit_quote, my_referral_code,
-- redeem_referral, release_checkout, reserve_listing, cancel_reservation (each checks auth.uid() itself).
revoke all on function setting_int(text, int), credit_balance(uuid), earn_credit(uuid, int, text, text), spend_credit(uuid, int, text, text),
  restore_credit(uuid, text[], text), reward_referral(uuid), process_window_end(), process_p1_jobs(), process_p2_jobs() from public, anon, authenticated;
