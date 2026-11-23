-- Reverses 0002_p1.sql. Postgres cannot remove an enum value, so reservation_status keeps 'No-show' (harmless).
drop view if exists vendor_public, vendor_order_board, notifications_compat;
drop function if exists process_p1_jobs(), cancel_reservation(uuid), log_reservation_status(), review_aggregate(), review_guard() cascade;
drop table if exists reports, reservation_events, reviews, follows, push_tokens, settings;

alter table notifications rename column sent_at to at;
alter table notifications drop column type, drop column payload, drop column read_at;

drop index if exists donation_batches_listing_origin_key;
delete from donation_batches where origin <> 'window_end';
alter table donation_batches add constraint donation_batches_listing_id_key unique (listing_id);
alter table donation_batches drop column origin, drop column pickup_slot, drop column volunteer_name, drop column volunteer_phone,
  drop column volunteer_token, drop column escalated_at;

alter table impact_events drop constraint impact_events_source_check;
delete from impact_events where source = 'expired';
alter table impact_events add constraint impact_events_source_check check (source in ('customer_pickup','ngo_collection'));
alter table impact_events drop column type, drop column listing_id, drop column qty, drop column kg_est, drop column co2e_kg,
  drop column customer_id, drop column rupees_saved;

alter table reservations drop column cancelled_by, drop column reminder_sent_at, drop column no_show_at;
alter table listing_templates drop column qty, drop column donate_rest, drop column donation_only, drop column risk_tag, drop column created_at;
alter table listings drop constraint risk_window_2h;
alter table listings drop constraint min_discount_30;
alter table listings add constraint min_discount_30 check (rescue_price <= floor(original_price * 0.70));
alter table listings drop column donation_only, drop column risk_tag, drop column hidden_by_admin;
alter table vendors drop column logo_url, drop column rating_avg, drop column rating_count, drop column max_units_per_order, drop column hidden_by_admin;
alter table profiles drop column suspended_until, drop column suspend_reason, drop column home_lat, drop column home_lng;

drop index if exists outlets_location_gix, ngos_location_gix;
alter table outlets drop column location;
alter table ngos drop column location;
drop type if exists notification_type, report_reason, report_target, report_status, risk_tag, donation_origin, impact_type;
-- (the FK indexes created with "if not exists" are harmless and are left in place)
