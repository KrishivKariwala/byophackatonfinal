-- Reverses 0007_pickup_codes.sql. Voided rows are removed first so the original unique index can come back.
drop trigger if exists reservations_void_code on reservations;
drop function if exists void_pickup_code();
delete from pickup_codes where voided_at is not null;
drop index if exists pickup_code_active_unique;
create unique index pickup_code_active_unique on pickup_codes (vendor_id, code_hash) where used_at is null;
alter table pickup_codes drop column voided_at, drop column code_enc, drop column qr_token_enc;

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
