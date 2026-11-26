-- SAVE A PLATE: P2 rules in Postgres, slice 2 of 3: donation receipts, the donation hand-off, and impact certificates (issue #13).
-- Ports lib/p2/receipts.ts, lib/p2/certificate.ts and services.donationHandover into security-definer functions with the same rules:
--   * a receipt is issued when the vendor verifies the charity's code (and by a catch-up job for older donations / a flag re-enabled);
--     one per donation, number SAP-DR-<year>-<6 digits> from a counter that only goes up, value = units x original price (an ESTIMATE),
--     80G named only while the charity's registration is valid on the collection date;
--   * a certificate per (vendor, Indian calendar month); a month-to-date one is refreshed, a final one never changes; a public
--     verification lookup returns totals only;
--   * the monthly job issues last month's certificates once per month and tells the owner.
-- ADDITIVE and REVERSIBLE (0005_p2_receipts_certificates.down.sql). Flags: donationReceipts, impactCertificate (missing = on).
-- Setting key written by the job: last_certificate_run.

-- The receipt number year is the Indian calendar year (as in the demo adapter), not UTC.
create or replace function next_receipt_number() returns text language plpgsql security definer set search_path = public as $$
declare y int := extract(year from now() at time zone 'Asia/Kolkata')::int; n int;
begin
  insert into receipt_counters (year, last_value) values (y, 1) on conflict (year) do update set last_value = receipt_counters.last_value + 1 returning last_value into n;
  return 'SAP-DR-' || y || '-' || lpad(n::text, 6, '0');
end $$;

-- ---------------------------------------------------------------- receipts
create or replace function issue_receipt(p_batch uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare b donation_batches; l listings; n ngos; cl donation_claims; rid uuid; collected timestamptz; g80 boolean;
begin
  if not flag_on('donationReceipts') then return null; end if;   -- switched off: nothing is issued now; the job catches up if it is switched back on
  select * into b from donation_batches where id = p_batch;
  if not found or b.status <> 'Collected' then return null; end if;
  select * into cl from donation_claims where batch_id = b.id and released_at is null;
  if not found then return null; end if;
  perform pg_advisory_xact_lock(hashtext('receipt:' || b.id::text));
  select id into rid from donation_receipts where batch_id = b.id;
  if found then return rid; end if;
  select * into l from listings where id = b.listing_id;
  select * into n from ngos where id = cl.ngo_id;
  collected := coalesce((select at from donation_handovers where batch_id = b.id), now());
  g80 := nullif(btrim(coalesce(n.eighty_g_number, '')), '') is not null and n.eighty_g_valid_until is not null
         and ((n.eighty_g_valid_until + time '23:59:59') at time zone 'Asia/Kolkata') >= collected;
  insert into donation_receipts (number, batch_id, vendor_id, ngo_id, item, qty, servings, estimated_value, eighty_g_number, eighty_g_valid_until)
    values (next_receipt_number(), b.id, b.vendor_id, cl.ngo_id, l.title, b.qty, b.qty, b.qty * l.original_price,
            case when g80 then btrim(n.eighty_g_number) end, case when g80 then n.eighty_g_valid_until end)
    returning id into rid;
  insert into audit_logs (actor_id, action, entity, entity_id, detail)
    values (null, 'receipt_issued', 'receipt', rid::text, (select number from donation_receipts where id = rid));
  return rid;
end $$;

-- Catch-up: every collected donation that has no receipt yet gets one.
create or replace function run_receipt_job() returns void language plpgsql security definer set search_path = public as $$
declare b record;
begin
  if not flag_on('donationReceipts') then return; end if;
  for b in select d.id from donation_batches d
            where d.status = 'Collected' and exists (select 1 from donation_claims c where c.batch_id = d.id and c.released_at is null)
              and not exists (select 1 from donation_receipts r where r.batch_id = d.id) order by d.created_at loop
    perform issue_receipt(b.id);
  end loop;
end $$;

-- ---------------------------------------------------------------- the donation hand-off (vendor verifies the charity's code)
create or replace function donation_handover(p_batch uuid, p_code_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b donation_batches; l listings; o outlets; cl donation_claims; ngo_owner uuid; rid uuid; kg numeric(8,2);
begin
  select * into b from donation_batches where id = p_batch for update;
  -- a member sees only their own organization's batches; staff only their own outlet (otherwise: not found, so nothing is confirmed)
  if not found or b.outlet_id not in (select my_outlet_ids()) then raise exception 'not_found'; end if;
  if not exists (select 1 from vendors where id = b.vendor_id and status = 'Approved') then raise exception 'approval_required'; end if;
  if b.status <> 'Claimed' then raise exception 'bad_transition'; end if;
  select * into cl from donation_claims where batch_id = b.id and released_at is null;
  if not found or cl.collection_code_hash is distinct from p_code_hash then raise exception 'code_mismatch'; end if;
  select * into l from listings where id = b.listing_id;
  select * into o from outlets where id = b.outlet_id;
  update donation_batches set status = 'Collected' where id = b.id;
  insert into donation_handovers (batch_id, vendor_user) values (b.id, auth.uid());
  rid := issue_receipt(b.id);
  kg := round(b.qty * 0.4, 2);
  insert into impact_events (source, ref_id, units, vendor_id, neighbourhood, type, listing_id, qty, kg_est, co2e_kg)
    values ('ngo_collection', b.id, b.qty, b.vendor_id, o.neighbourhood, 'donated', b.listing_id, b.qty, kg, round(kg * 2.5, 2))
    on conflict (source, ref_id) do nothing;
  select owner_id into ngo_owner from ngos where id = cl.ngo_id;
  insert into notifications (user_id, type, text, payload) values (ngo_owner, 'generic',
    'Collected: ' || b.qty || ' × ' || l.title || ' (' || b.ref || ').', jsonb_build_object('batchId', b.id));
  insert into audit_logs (actor_id, action, entity, entity_id, detail) values (auth.uid(), 'donation_handover', 'donation_batch', b.id::text, null);
  return jsonb_build_object('ok', true, 'batch_id', b.id, 'receipt_id', rid);
end $$;

-- ---------------------------------------------------------------- impact certificates
-- Indian calendar month [from, to)
create or replace function month_start(p_month text) returns timestamptz language sql immutable as $$
  select ((p_month || '-01')::date)::timestamp at time zone 'Asia/Kolkata'
$$;

create or replace function monthly_figures(p_vendor uuid, p_month text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare f timestamptz := month_start(p_month); t timestamptz := month_start(p_month) + interval '1 month'; sold int; rupees int; donated int; charities int; people int; meals int;
begin
  select coalesce(sum(qty), 0), coalesce(sum(amount), 0) into sold, rupees from reservations
    where vendor_id = p_vendor and status = 'Picked up' and picked_up_at >= f and picked_up_at < t;
  with collected as (
    select b.id, b.qty, (select ngo_id from donation_claims c where c.batch_id = b.id and c.released_at is null) ngo_id
      from donation_batches b join donation_handovers h on h.batch_id = b.id
     where b.vendor_id = p_vendor and b.status = 'Collected' and h.at >= f and h.at < t)
  select coalesce(sum(qty), 0), count(distinct ngo_id), coalesce((select sum(beneficiaries) from distribution_logs d where d.batch_id in (select id from collected)), 0)
    into donated, charities, people from collected;
  meals := sold + donated;
  return jsonb_build_object('mealsSold', sold, 'mealsDonated', donated, 'kgRescued', round(meals * 0.4, 2), 'co2eKg', round(round(meals * 0.4, 2) * 2.5, 2),
    'rupeesRecovered', rupees, 'charitiesServed', charities, 'peopleServed', people, 'active', meals > 0);
end $$;

-- SAP-XXXX-XXXX-XXXX from random bytes (Crockford-style alphabet without lookalikes): unguessable, easy to read out.
create or replace function new_verification_id() returns text language plpgsql volatile as $$
declare alphabet constant text := 'ABCDEFGHJKMNPQRSTVWXYZ23456789'; b bytea := uuid_send(gen_random_uuid()); s text := ''; i int;
begin
  for i in 0..11 loop s := s || substr(alphabet, 1 + (get_byte(b, i) % length(alphabet)), 1); end loop;
  return 'SAP-' || substr(s, 1, 4) || '-' || substr(s, 5, 4) || '-' || substr(s, 9, 4);
end $$;

-- Create the certificate for (vendor, month), or refresh a month-to-date one. A final certificate never changes; the id is kept.
create or replace function issue_certificate(p_vendor uuid, p_month text) returns text
language plpgsql security definer set search_path = public as $$
declare f jsonb; v_partial boolean; ex impact_certificates; cid text;
begin
  perform pg_advisory_xact_lock(hashtext('cert:' || p_vendor::text || p_month));
  f := monthly_figures(p_vendor, p_month);
  v_partial := now() < month_start(p_month) + interval '1 month';
  select * into ex from impact_certificates where vendor_id = p_vendor and month = p_month;
  if found and not ex.partial then return ex.id; end if;
  if not (f ->> 'active')::boolean then return case when found then ex.id end; end if;
  if found then
    update impact_certificates set meals_sold = (f ->> 'mealsSold')::int, meals_donated = (f ->> 'mealsDonated')::int, kg_rescued = (f ->> 'kgRescued')::numeric,
      rupees_recovered = (f ->> 'rupeesRecovered')::int, co2e_kg = (f ->> 'co2eKg')::numeric, charities_served = (f ->> 'charitiesServed')::int,
      people_served = (f ->> 'peopleServed')::int, partial = v_partial, created_at = now() where id = ex.id;
    return ex.id;
  end if;
  insert into impact_certificates (id, vendor_id, month, meals_sold, meals_donated, kg_rescued, rupees_recovered, co2e_kg, charities_served, people_served, partial)
    values (new_verification_id(), p_vendor, p_month, (f ->> 'mealsSold')::int, (f ->> 'mealsDonated')::int, (f ->> 'kgRescued')::numeric,
            (f ->> 'rupeesRecovered')::int, (f ->> 'co2eKg')::numeric, (f ->> 'charitiesServed')::int, (f ->> 'peopleServed')::int, v_partial) returning id into cid;
  return cid;
end $$;

-- A vendor owner / manager asks for a month's certificate.
create or replace function generate_certificate(p_month text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare vid uuid; cid text; c impact_certificates;
begin
  if auth_role() is distinct from 'vendor' then raise exception 'forbidden' using errcode = '42501'; end if;
  if not flag_on('impactCertificate') then raise exception 'feature_off'; end if;
  select vendor_id into vid from memberships where user_id = auth.uid() and revoked_at is null and role in ('owner', 'manager') order by created_at limit 1;
  if vid is null then raise exception 'forbidden_role'; end if;
  if p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'month_invalid'; end if;
  if p_month > ist_month(now()) then raise exception 'month_future'; end if;
  cid := issue_certificate(vid, p_month);
  if cid is null then raise exception 'no_activity'; end if;
  select * into c from impact_certificates where id = cid;
  insert into audit_logs (actor_id, action, entity, entity_id, detail)
    values (auth.uid(), 'certificate_generated', 'certificate', cid, p_month || case when c.partial then ' (month to date)' else '' end);
  return to_jsonb(c);
end $$;

-- Public verification: the organization's name and the totals. Nothing about customers, charities' names or addresses.
create or replace function verify_certificate(p_id text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c impact_certificates; v vendors;
begin
  if p_id !~ '^SAP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' then return null; end if;
  select * into c from impact_certificates where id = p_id;
  if not found then return null; end if;
  select * into v from vendors where id = c.vendor_id;
  return jsonb_build_object('id', c.id, 'business', coalesce(v.business_name, 'Vendor'), 'month', c.month, 'issuedAt', c.created_at, 'partial', c.partial,
    'mealsSold', c.meals_sold, 'mealsDonated', c.meals_donated, 'kgRescued', c.kg_rescued, 'co2eKg', c.co2e_kg, 'rupeesRecovered', c.rupees_recovered,
    'charitiesServed', c.charities_served, 'peopleServed', c.people_served);
end $$;

-- Monthly job: on/after the 1st (India time) issue last month's certificate for every approved vendor with activity and tell the owner. Once per month.
create or replace function run_certificate_job() returns void language plpgsql security definer set search_path = public as $$
declare prev text := to_char(date_trunc('month', now() at time zone 'Asia/Kolkata') - interval '1 month', 'YYYY-MM'); last text; v vendors; had boolean; cid text; c impact_certificates;
begin
  if not flag_on('impactCertificate') then return; end if;
  if not pg_try_advisory_xact_lock(hashtext('certificate-job')) then return; end if;
  last := coalesce((select value #>> '{}' from settings where key = 'last_certificate_run'), '');
  if last >= prev then return; end if;
  insert into settings (key, value) values ('last_certificate_run', to_jsonb(prev)) on conflict (key) do update set value = excluded.value, updated_at = now();
  for v in select * from vendors where status = 'Approved' loop
    had := exists (select 1 from impact_certificates where vendor_id = v.id and month = prev and not partial);
    cid := issue_certificate(v.id, prev);
    if cid is not null then
      select * into c from impact_certificates where id = cid;
      if not c.partial and not had then
        insert into notifications (user_id, type, text, payload) values (v.owner_id, 'certificate_ready',
          'Your impact certificate for ' || prev || ' is ready (' || (c.meals_sold + c.meals_donated) || ' meals rescued).', jsonb_build_object('certificateId', c.id, 'month', prev));
        insert into audit_logs (actor_id, action, entity, entity_id, detail) values (null, 'certificate_issued', 'certificate', c.id, v.id::text || ' ' || prev);
      end if;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- scheduled jobs: markdown steps + credit expiry (0003) + receipts + certificates
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
  perform run_receipt_job();
  perform run_certificate_job();
end $$;

-- ---------------------------------------------------------------- who may call what
revoke all on function process_p2_jobs(), issue_receipt(uuid), run_receipt_job(), month_start(text), monthly_figures(uuid, text),
  new_verification_id(), issue_certificate(uuid, text), run_certificate_job(), next_receipt_number() from public, anon, authenticated;
-- Clients get: donation_handover (vendor members), generate_certificate (owner/manager), verify_certificate (anyone: the public page).
revoke all on function donation_handover(uuid, text), generate_certificate(text) from public, anon;
grant execute on function donation_handover(uuid, text), generate_certificate(text) to authenticated;
grant execute on function verify_certificate(text) to anon, authenticated;
