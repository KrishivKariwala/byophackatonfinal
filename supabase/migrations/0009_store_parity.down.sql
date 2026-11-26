-- Reverses 0009_store_parity.sql. Drops the new table and columns (and what they hold).
drop table if exists recurring_schedules;
alter table donation_claims drop column collection_code_enc;
alter table listing_templates drop column window_minutes;
alter table ngos drop column diet_preference;
alter table notifications drop column key, drop column vars;
alter table profiles drop column is_demo;
