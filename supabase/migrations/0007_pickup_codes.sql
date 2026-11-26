-- SAVE A PLATE: pickup codes the app can actually use (issue #14, slice A).
-- The first schema stored only HASHES of the pickup code and QR token, so a customer who left the order page could never see their
-- code again, and a cancelled order kept its 4-digit code "in use" for ever (only 10,000 codes exist per vendor).
--   * code_enc / qr_token_enc: the code and token encrypted with a server-side key (AES-256-GCM, done by the app). The database
--     never sees the plaintext or the key; the hashes are still what the vendor scan checks.
--   * voided_at: set by a trigger when the order is cancelled / expires / is a no-show, so its code is free again.
--   * handover now (a) prefers the live code if an old voided one has the same digits, (b) works for staff pinned to an outlet and
--     managers (memberships), not only the vendor owner, and refuses another outlet's order.
-- ADDITIVE and REVERSIBLE (0007_pickup_codes.down.sql; it needs no two live rows with the same code, which the up index guarantees).

alter table pickup_codes add column voided_at timestamptz, add column code_enc text, add column qr_token_enc text;

drop index if exists pickup_code_active_unique;
create unique index pickup_code_active_unique on pickup_codes (vendor_id, code_hash) where used_at is null and voided_at is null;

create or replace function void_pickup_code() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('Cancelled', 'Expired', 'No-show') and old.status is distinct from new.status then
    update pickup_codes set voided_at = now() where reservation_id = new.id and used_at is null and voided_at is null;
  end if;
  return new;
end $$;
create trigger reservations_void_code after update of status on reservations for each row execute function void_pickup_code();

create or replace function handover(p_token_hash text, p_code_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
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
  if now() < l.window_start then raise exception 'too_early'; end if;
  if now() > l.window_end then raise exception 'too_late'; end if;
  update pickup_codes set used_at = now() where reservation_id = r.id;
  update reservations set status = 'Picked up', picked_up_at = now() where id = r.id;
  update payments set status = 'Paid at Pickup', updated_at = now() where reservation_id = r.id and method = 'pay_at_pickup' and status = 'Pending';
  insert into pickup_events (reservation_id, vendor_user, method) values (r.id, auth.uid(), case when p_token_hash is null then 'code' else 'qr' end);
  insert into impact_events (source, ref_id, units, vendor_id, neighbourhood)
    select 'customer_pickup', r.id, r.qty, v.id, o.neighbourhood from outlets o where o.id = r.outlet_id;
  perform reward_referral(r.id);
  return jsonb_build_object('ok',true,'ref',r.ref,'qty',r.qty,'title',l.title,'method',r.method,
    'collect_amount', coalesce((select amount from payments where reservation_id = r.id and method = 'pay_at_pickup'), 0));
end $$;
