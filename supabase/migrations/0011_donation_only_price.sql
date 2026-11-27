-- SAVE A PLATE: donation-only listings could not be saved in Postgres (live bug: "Something went wrong" on Publish).
-- A donation-only listing is never sold, so the app stores its rescue price as 0. Migration 0002 already exempted such listings from the
-- 30% rule (min_discount_30) but forgot the plain "rescue_price > 0" rule from 0001, so the database refused every one of them with
-- listings_rescue_price_check. Same exemption here. Sold listings still need a price above 0. ADDITIVE and REVERSIBLE (0011_donation_only_price.down.sql).
alter table listings drop constraint listings_rescue_price_check;
alter table listings add constraint listings_rescue_price_check check (donation_only or rescue_price > 0);
