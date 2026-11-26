-- SAVE A PLATE: columns and a table the app's data model has and the schema did not (issue #14).
-- Found by loading the demo data model into Postgres and reading it back: every difference below is something the app stores that had
-- nowhere to go. ADDITIVE and REVERSIBLE (0009_store_parity.down.sql).
--   profiles.is_demo            the seeded demo people, so the "continue as demo user" shortcut can never sign in as a real account
--   notifications.key / vars    the catalog key and values a message was built from, so each reader sees it in their own language
--   ngos.diet_preference        the charity's feed filter (any / Vegetarian / Non-vegetarian)
--   listing_templates.window_minutes   pickup window length, so a repost gets fresh times of the same length
--   donation_claims.collection_code_enc  the collection code the charity sees again, encrypted (the vendor check uses the hash)
--   recurring_schedules         listings the platform publishes by itself on chosen days

alter table profiles add column is_demo boolean not null default false;
alter table notifications add column key text, add column vars jsonb;
alter table ngos add column diet_preference text check (diet_preference is null or diet_preference in ('any', 'Vegetarian', 'Non-vegetarian'));
alter table listing_templates add column window_minutes int check (window_minutes is null or window_minutes > 0);
alter table donation_claims add column collection_code_enc text;

create table recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade, outlet_id uuid not null references outlets(id),
  template_id uuid not null references listing_templates(id) on delete cascade,
  days int[] not null check (days <@ array[0,1,2,3,4,5,6] and cardinality(days) > 0),   -- 0 = Sunday .. 6 = Saturday, India time
  start_time text not null check (start_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  lead_minutes int not null check (lead_minutes between 15 and 180),
  paused boolean not null default false,
  declaration_at timestamptz not null, declaration_by uuid not null references profiles(id),   -- the owner confirmed food safety for every listing it publishes
  last_published_for text, last_listing_id uuid, last_error text,
  created_at timestamptz not null default now()
);
create index recurring_schedules_vendor_idx on recurring_schedules (vendor_id);
alter table recurring_schedules enable row level security;
create policy recurring_member on recurring_schedules for select using (vendor_id in (select my_vendor_ids()));
