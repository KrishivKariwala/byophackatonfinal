-- Reverses 0003_p2.sql. Run only after exporting any data you want to keep: every P2 table is dropped.
-- Restores the P0/P1 owner-scoped vendor policies. Enum types are dropped with their tables.
drop function if exists process_p2_jobs(), next_receipt_number(), flag_on(text), is_org_admin(uuid), my_outlet_ids(), my_vendor_ids();

drop policy if exists outlet_org_write on outlets;
drop policy if exists listings_member_read on listings;
drop policy if exists listings_customer_read on listings;
drop policy if exists res_member on reservations;
drop policy if exists inv_member on inventory_movements;

create policy outlet_owner_write on outlets for all using (vendor_id in (select id from vendors where owner_id = auth.uid()));
create policy listings_customer_read on listings for select using (status = 'Live' and qty_available > 0 and window_end > now());
create policy listings_vendor_read on listings for select using (vendor_id in (select id from vendors where owner_id = auth.uid()) or auth_role() = 'admin');
create policy res_vendor on reservations for select using (vendor_id in (select id from vendors where owner_id = auth.uid()));
create policy inv_vendor on inventory_movements for select using (listing_id in (select l.id from listings l join vendors v on v.id = l.vendor_id where v.owner_id = auth.uid()) or auth_role() = 'admin');

drop table if exists moderation_actions, impact_certificates, delivery_requests, receipt_counters, donation_receipts, distribution_logs,
  credit_ledger, referrals, referral_codes, listing_price_steps, staff_invites, memberships, settings_audit;

drop index if exists listings_public_visible_idx;
alter table donation_batches drop column from_priority_listing, drop column delivery_request_id;
alter table reviews drop column hidden;
alter table reservations drop column credit_applied, drop column eta_minutes, drop column eta_updated_at;
alter table checkout_holds drop column credit_applied;
alter table listing_templates drop column priority_minutes;
alter table listings drop column priority_minutes, drop column public_visible_at, drop column initial_rescue_price, drop column moderation_note;
alter table ngos drop column registration_number, drop column eighty_g_number, drop column eighty_g_valid_until;
alter table outlets drop column name, drop column hours;

drop type if exists moderation_action_type, moderation_target, delivery_status, credit_entry_type, referral_status, org_role;
