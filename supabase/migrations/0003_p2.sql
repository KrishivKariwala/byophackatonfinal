-- SAVE A PLATE: P2 additions. ADDITIVE and REVERSIBLE (see 0003_p2.down.sql).
-- No existing column is dropped or renamed. Existing RLS policies that were scoped to "vendors.owner_id = auth.uid()"
-- are REPLACED by membership-scoped ones (an owner still sees exactly what they saw before: the backfill below gives every
-- vendor owner an 'owner' membership). The down migration restores the P0/P1 policies.
-- Every P2 feature is also behind a feature flag stored in `settings` (key 'flags'); a missing flag means ON.
-- STATUS: written like 0001/0002 as the production boundary; the demo adapter (lib/p2/*.ts) implements the same rules and
-- is what the automated tests exercise. This SQL has NOT been executed against a database.

-- ---------------------------------------------------------------- enums
create type org_role as enum ('owner','manager','staff');
create type referral_status as enum ('pending','rewarded','rejected');
create type credit_entry_type as enum ('earned','spent','expired');
create type delivery_status as enum ('Requested','Rider assigned','Picked up','Delivered','No rider found','Failed','Cancelled');
create type moderation_target as enum ('listing','review','vendor');
create type moderation_action_type as enum ('hide','restore','edit','warn','suspend','dismiss');
-- additive enum values (Postgres cannot drop enum values; the down migration leaves them in place, they are harmless)
alter type donation_origin add value if not exists 'priority';
alter type notification_type add value if not exists 'price_drop';
alter type notification_type add value if not exists 'priority_listing';
alter type notification_type add value if not exists 'credit_earned';
alter type notification_type add value if not exists 'customer_eta';
alter type notification_type add value if not exists 'certificate_ready';
alter type notification_type add value if not exists 'delivery_update';
alter type notification_type add value if not exists 'moderation';

-- ---------------------------------------------------------------- additive columns on existing tables
alter table outlets add column name text, add column hours text;
alter table ngos add column registration_number text, add column eighty_g_number text, add column eighty_g_valid_until date;
alter table listings add column priority_minutes int check (priority_minutes is null or priority_minutes in (15,30,45)),
  add column public_visible_at timestamptz,                  -- null = public immediately
  add column initial_rescue_price int,
  add column moderation_note text,
  add column public_notified_at timestamptz;
alter table listing_templates add column priority_minutes int;
alter table checkout_holds add column credit_applied int not null default 0 check (credit_applied >= 0);
alter table reservations add column credit_applied int not null default 0 check (credit_applied >= 0),
  add column eta_minutes int check (eta_minutes is null or eta_minutes between 0 and 240),   -- ONLY minutes are stored, never a location
  add column eta_updated_at timestamptz;
alter table reviews add column hidden boolean not null default false;
alter table donation_batches add column from_priority_listing boolean not null default false, add column delivery_request_id uuid;

create index listings_public_visible_idx on listings (public_visible_at) where public_visible_at is not null;

-- ---------------------------------------------------------------- new tables
create table settings_audit (
  id uuid primary key default gen_random_uuid(), admin_id uuid not null references profiles(id),
  key text not null, from_value text not null, to_value text not null, at timestamptz not null default now()
);

-- organizations: the existing `vendors` row is the organization (brand); outlets already hang off it.
create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id), vendor_id uuid not null references vendors(id),
  outlet_id uuid references outlets(id),                       -- null = all outlets (owner / manager); staff are pinned to one
  role org_role not null, created_at timestamptz not null default now(), revoked_at timestamptz,
  check (role <> 'staff' or outlet_id is not null)
);
create unique index memberships_active_unique on memberships (user_id, vendor_id, coalesce(outlet_id, '00000000-0000-0000-0000-000000000000')) where revoked_at is null;
create index memberships_user_idx on memberships (user_id) where revoked_at is null;
create table staff_invites (
  id uuid primary key default gen_random_uuid(), vendor_id uuid not null references vendors(id), outlet_id uuid references outlets(id),
  role org_role not null check (role <> 'owner'), contact text not null,           -- phone or email
  token_hash text not null unique, created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(), expires_at timestamptz not null,
  accepted_by uuid references profiles(id), accepted_at timestamptz, revoked_at timestamptz
);

create table listing_price_steps (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id) on delete cascade,
  effective_at timestamptz not null, discount_pct int not null check (discount_pct between 30 and 80), applied_at timestamptz
);
create index price_steps_due_idx on listing_price_steps (effective_at) where applied_at is null;

create table referral_codes (user_id uuid primary key references profiles(id), code text not null unique, device_id text);
create table referrals (
  id uuid primary key default gen_random_uuid(), referrer_id uuid not null references profiles(id), referee_id uuid not null unique references profiles(id),
  code text not null, status referral_status not null default 'pending', device_id text, phone_key text not null,
  created_at timestamptz not null default now(), rewarded_at timestamptz, reject_reason text,
  check (referrer_id <> referee_id)                              -- no self-referral
);
-- one reward per device / phone: a second redemption from the same device or phone is rejected by the server and by this index
create unique index referrals_one_per_phone on referrals (phone_key) where status <> 'rejected';
create unique index referrals_one_per_device on referrals (device_id) where device_id is not null and status <> 'rejected';
create table credit_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id), amount int not null check (amount > 0),
  type credit_entry_type not null, ref_id text, note text, created_at timestamptz not null default now(),
  expires_at timestamptz, remaining int check (remaining is null or remaining >= 0)   -- earned lots only
);
create index credit_ledger_user_idx on credit_ledger (user_id, created_at);

create table distribution_logs (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null unique references donation_batches(id),
  ngo_id uuid not null references ngos(id), vendor_id uuid not null references vendors(id),
  servings int not null check (servings > 0), beneficiaries int not null check (beneficiaries >= 0),
  centre_name text not null, notes text, photo_urls text[] not null default '{}', created_at timestamptz not null default now()
);
create table donation_receipts (
  id uuid primary key default gen_random_uuid(), number text not null unique,        -- SAP-DR-2026-000123, never reused
  batch_id uuid not null unique references donation_batches(id), vendor_id uuid not null references vendors(id), ngo_id uuid not null references ngos(id),
  item text not null, qty int not null, servings int not null, estimated_value int not null,
  eighty_g_number text, eighty_g_valid_until date, created_at timestamptz not null default now()
);
create table receipt_counters (year int primary key, last_value int not null default 0);
create or replace function next_receipt_number() returns text language plpgsql security definer set search_path = public as $$
declare y int := extract(year from now()); n int;
begin
  insert into receipt_counters (year, last_value) values (y, 1) on conflict (year) do update set last_value = receipt_counters.last_value + 1 returning last_value into n;
  return 'SAP-DR-' || y || '-' || lpad(n::text, 6, '0');
end $$;

create table delivery_requests (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null references donation_batches(id),
  ngo_id uuid not null references ngos(id), vendor_id uuid not null references vendors(id),
  provider text not null, external_id text not null, status delivery_status not null default 'Requested', fee int not null default 0,
  pickup_address text not null, drop_address text not null, rider_name text, error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- No customer data is ever stored here or sent to a provider: only the outlet and charity addresses.

create table impact_certificates (
  id text primary key,                                             -- public verification id (random, unguessable)
  vendor_id uuid not null references vendors(id), month text not null check (month ~ '^\d{4}-\d{2}$'),
  meals_sold int not null, meals_donated int not null, kg_rescued numeric not null, rupees_recovered int not null,
  co2e_kg numeric not null, charities_served int not null, people_served int not null default 0, partial boolean not null default false,
  created_at timestamptz not null default now(),
  unique (vendor_id, month)
);
create table moderation_actions (
  id uuid primary key default gen_random_uuid(), admin_id uuid not null references profiles(id),
  target_type moderation_target not null, target_id text not null, action moderation_action_type not null,
  reason text not null check (char_length(reason) >= 3), created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- backfill: every vendor owner is an owner of their organization
insert into memberships (user_id, vendor_id, role) select owner_id, id, 'owner' from vendors;

-- ---------------------------------------------------------------- helpers for RLS
-- Vendors an authenticated user can act for (owner / manager: whole organization; staff: only their outlet).
create or replace function my_vendor_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select vendor_id from memberships where user_id = auth.uid() and revoked_at is null
$$;
-- Outlets the user may see: all outlets of an org they own/manage, or the one outlet a staff member is pinned to.
create or replace function my_outlet_ids() returns setof uuid language sql stable security definer set search_path = public as $$
  select o.id from outlets o join memberships m on m.vendor_id = o.vendor_id
   where m.user_id = auth.uid() and m.revoked_at is null and (m.outlet_id is null or m.outlet_id = o.id)
$$;
create or replace function is_org_admin(p_vendor uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where user_id = auth.uid() and vendor_id = p_vendor and role in ('owner','manager') and revoked_at is null)
$$;
-- Live feature flag; a missing flag counts as ON.
create or replace function flag_on(p_flag text) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (value ->> p_flag)::boolean from settings where key = 'flags'), true)
$$;

-- ---------------------------------------------------------------- RLS: replace owner-scoped vendor policies with membership-scoped ones
drop policy if exists outlet_owner_write on outlets;
drop policy if exists listings_vendor_read on listings;
drop policy if exists res_vendor on reservations;
drop policy if exists inv_vendor on inventory_movements;
drop policy if exists listings_customer_read on listings;

create policy outlet_org_write on outlets for all using (is_org_admin(vendor_id)) with check (is_org_admin(vendor_id));
create policy listings_member_read on listings for select using (outlet_id in (select my_outlet_ids()) or auth_role() = 'admin');
-- Customers: Live, in stock, in window AND past the charity-priority window. Approved charities see priority listings at once.
create policy listings_customer_read on listings for select using (
  status = 'Live' and qty_available > 0 and window_end > now() and not hidden_by_admin
  and (public_visible_at is null or public_visible_at <= now()
       or exists (select 1 from ngos where owner_id = auth.uid() and status = 'Approved')));
create policy res_member on reservations for select using (outlet_id in (select my_outlet_ids()));
create policy inv_member on inventory_movements for select using (listing_id in (select id from listings where outlet_id in (select my_outlet_ids())) or auth_role() = 'admin');
-- (vendors never get customer phone numbers: the vendor-facing views expose first name + order code only, as in 0002)

create policy memberships_read on memberships for select using (user_id = auth.uid() or is_org_admin(vendor_id) or auth_role() = 'admin');
-- membership / invite writes and accepts go through server routes (service role) that check the role matrix.
create policy invites_read on staff_invites for select using (is_org_admin(vendor_id));

-- ---------------------------------------------------------------- RLS: new tables
alter table settings_audit enable row level security;
alter table memberships enable row level security;
alter table staff_invites enable row level security;
alter table listing_price_steps enable row level security;
alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table credit_ledger enable row level security;
alter table distribution_logs enable row level security;
alter table donation_receipts enable row level security;
alter table receipt_counters enable row level security;
alter table delivery_requests enable row level security;
alter table impact_certificates enable row level security;
alter table moderation_actions enable row level security;

create policy settings_audit_admin on settings_audit for select using (auth_role() = 'admin');
create policy price_steps_member on listing_price_steps for select using (listing_id in (select id from listings where outlet_id in (select my_outlet_ids())));
create policy refcode_own on referral_codes for select using (user_id = auth.uid());
create policy referrals_own on referrals for select using (referrer_id = auth.uid() or referee_id = auth.uid() or auth_role() = 'admin');
create policy credit_own on credit_ledger for select using (user_id = auth.uid() or auth_role() = 'admin');
create policy distlog_member on distribution_logs for select using (vendor_id in (select my_vendor_ids()) or ngo_id in (select id from ngos where owner_id = auth.uid()) or auth_role() = 'admin');
create policy receipts_party on donation_receipts for select using (is_org_admin(vendor_id) or ngo_id in (select id from ngos where owner_id = auth.uid()) or auth_role() = 'admin');
create policy delivery_party on delivery_requests for select using (vendor_id in (select my_vendor_ids()) or ngo_id in (select id from ngos where owner_id = auth.uid()) or auth_role() = 'admin');
-- certificates are PUBLIC by verification id only: a server route looks one up by id; there is deliberately no list policy for clients,
-- except the owning organization's own list.
create policy certs_own on impact_certificates for select using (is_org_admin(vendor_id) or auth_role() = 'admin');
create policy moderation_admin on moderation_actions for select using (auth_role() = 'admin');
-- vendors see a moderation action about their own listing through the notification they receive; the table itself is admin-only.

-- ---------------------------------------------------------------- jobs (pg_cron; the demo adapter runs the same logic in lib/jobs.ts)
-- Every minute:  apply due price steps (only ever LOWERS the price, never below 30% off of the original), expire credit lots older than 90 days,
--                make priority listings public once public_visible_at has passed, refresh delivery statuses from the provider.
-- Monthly (1st): generate each active vendor's impact certificate for the previous month and notify the owner.
-- Example:
--   select cron.schedule('p2-minute', '* * * * *', $$ select process_p2_jobs() $$);
--   select cron.schedule('p2-certs',  '0 3 1 * *', $$ select generate_monthly_certificates() $$);
create or replace function process_p2_jobs() returns void language plpgsql security definer set search_path = public as $$
begin
  if flag_on('autoMarkdown') then
    update listings l set rescue_price = least(l.rescue_price, floor(l.original_price * (100 - s.discount_pct) / 100.0)::int)  -- measured against the ORIGINAL price; only ever lowers
      from listing_price_steps s
     where s.listing_id = l.id and s.applied_at is null and s.effective_at <= now() and l.status = 'Live' and l.window_end > now();
    update listing_price_steps set applied_at = now() where applied_at is null and effective_at <= now();
  end if;
  if flag_on('referrals') then
    insert into credit_ledger (user_id, amount, type, ref_id, note)
      select user_id, remaining, 'expired', id::text, 'expired after 90 days' from credit_ledger
       where type = 'earned' and remaining > 0 and expires_at <= now();
    update credit_ledger set remaining = 0 where type = 'earned' and remaining > 0 and expires_at <= now();
  end if;
end $$;
