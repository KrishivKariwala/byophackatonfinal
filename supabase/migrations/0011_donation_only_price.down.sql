-- Reverses 0011_donation_only_price.sql. Fails if a donation-only listing (rescue price 0) exists; delete those first.
alter table listings drop constraint listings_rescue_price_check;
alter table listings add constraint listings_rescue_price_check check (rescue_price > 0);
