-- Reverses 0005_p2_receipts_certificates.sql. Receipts, certificates and their data live in 0003's tables and are left alone.

drop function if exists donation_handover(uuid, text), generate_certificate(text), verify_certificate(text), run_certificate_job(),
  issue_certificate(uuid, text), new_verification_id(), monthly_figures(uuid, text), month_start(text), run_receipt_job(), issue_receipt(uuid);

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

create or replace function next_receipt_number() returns text language plpgsql security definer set search_path = public as $$
declare y int := extract(year from now()); n int;
begin
  insert into receipt_counters (year, last_value) values (y, 1) on conflict (year) do update set last_value = receipt_counters.last_value + 1 returning last_value into n;
  return 'SAP-DR-' || y || '-' || lpad(n::text, 6, '0');
end $$;

grant execute on function next_receipt_number() to public;
