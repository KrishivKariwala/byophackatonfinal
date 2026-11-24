import "server-only";
import type { TxContext } from "./store";
import { RULES } from "./rules";
import { createNoShowBatchTx, iso, listingIn, ngosNear, notify, notifyOutlet, outletOf, recordImpact, setResStatus, audit, emitRes, t } from "./core";
import type { DB } from "./types";
import { p2JobsPending, runP2Jobs } from "./p2/jobs";

/**
 * Scheduled jobs. They run inside the same transaction that already runs `sweepTx` (before every write, and
 * every 5 s from the SSE stream), so they behave like a once-a-minute scheduler. The Postgres equivalents are
 * in supabase/migrations/0002_p1.sql (pg_cron). Every job is idempotent.
 *
 *  1. wasted impact for leftover units of listings that end without "donate the rest"
 *  2. 15-minutes-left pickup reminders
 *  3. no-show handling (15 min after pickup end) + "donate the rest" for those units + 3-in-30-days suspension
 *  4. escalate unclaimed donation batches 60 min before the deadline to all verified charities within 10 km
 */

const MIN = 60_000;

export function jobsPending(db: DB, now: number): boolean {
  return (
    db.listings.some((l) => l.status === "Expired" && !l.donationProcessedAt && !l.donateRest && !l.donationOnly && l.qtyAvailable > 0) ||
    db.reservations.some((r) => {
      if (r.status !== "Reserved" && r.status !== "Ready") return false;
      const l = db.listings.find((x) => x.id === r.listingId);
      if (!l) return false;
      const end = t(l.windowEnd);
      return (!r.reminderSentAt && end - now <= RULES.REMINDER_MINUTES_LEFT * MIN && end > now) || now >= end + RULES.NO_SHOW_GRACE_MINUTES * MIN;
    }) ||
    db.donationBatches.some((b) => b.status === "Open" && !b.escalatedAt && t(b.collectBy) - now <= RULES.ESCALATE_MINUTES_BEFORE_DEADLINE * MIN) ||
    p2JobsPending(db, now)
  );
}

export function runScheduledJobs(tx: TxContext) {
  const { db, now } = tx;

  // 1. Leftover units that were not donated are recorded as wasted (once).
  for (const l of db.listings) {
    if (l.status === "Expired" && !l.donationProcessedAt && !l.donateRest && !l.donationOnly) {
      l.donationProcessedAt = iso(now);
      if (l.qtyAvailable > 0)
        recordImpact(tx, { source: "expired", refId: l.id, units: l.qtyAvailable, vendorId: l.vendorId, outlet: outletOf(db, l.outletId), listingId: l.id, type: "wasted" });
    }
  }

  // 2. Reminders.
  for (const r of db.reservations) {
    if ((r.status !== "Reserved" && r.status !== "Ready") || r.reminderSentAt) continue;
    const l = listingIn(db, r.listingId);
    const left = t(l.windowEnd) - now;
    if (left > 0 && left <= RULES.REMINDER_MINUTES_LEFT * MIN) {
      r.reminderSentAt = iso(now);
      notify(tx, r.customerId, `${Math.max(1, Math.ceil(left / MIN))} minutes left to collect ${r.ref} (${l.title}).`, "pickup_reminder", { reservationId: r.id });
    }
  }

  // 3. No-shows.
  const perListing = new Map<string, number>();
  const affected = new Set<string>();
  for (const r of db.reservations) {
    if (r.status !== "Reserved" && r.status !== "Ready") continue;
    const l = listingIn(db, r.listingId);
    if (now < t(l.windowEnd) + RULES.NO_SHOW_GRACE_MINUTES * MIN) continue;
    setResStatus(tx, r, "No-show", "system", "not scanned 15 min after pickup end");
    r.noShowAt = iso(now);
    perListing.set(l.id, (perListing.get(l.id) ?? 0) + r.qty);
    affected.add(r.customerId);
    notify(tx, r.customerId, `${r.ref} was marked a no-show because it wasn't collected. Three no-shows in 30 days pause new reservations for 7 days.`, "no_show", { reservationId: r.id });
    const vendor = db.vendors.find((v) => v.id === r.vendorId);
    if (vendor) notifyOutlet(tx, vendor, r.outletId, `${r.ref} was not collected (no-show).`, "no_show", { reservationId: r.id });
    emitRes(tx, r);
  }
  for (const [lid, qty] of perListing) createNoShowBatchTx(tx, listingIn(db, lid), qty);
  for (const cid of affected) applyNoShowSuspension(tx, cid);

  // 4. Escalation of unclaimed batches.
  for (const b of db.donationBatches) {
    if (b.status !== "Open" || b.escalatedAt) continue;
    if (t(b.collectBy) - now > RULES.ESCALATE_MINUTES_BEFORE_DEADLINE * MIN) continue;
    b.escalatedAt = iso(now);
    const vendor = db.vendors.find((v) => v.id === b.vendorId);
    const targets = ngosNear(db, outletOf(db, b.outletId), RULES.ESCALATION_RADIUS_KM);
    for (const n of targets)
      notify(tx, n.ownerId, `Still unclaimed: ${b.qty} × ${b.title} at ${vendor?.businessName}. Collect by ${b.collectBy}.`, "donation_escalation", { batchId: b.id });
    audit(tx, "system", "donation_escalated", "donation_batch", b.id, `${targets.length} charities notified`);
  }

  // 5. P2 jobs (auto-markdown steps; later: credit expiry, certificates, delivery status).
  runP2Jobs(tx);
}

/** Counts the customer's no-shows in the last 30 days; at 3 their reservations are suspended for 7 days. */
export function applyNoShowSuspension(tx: TxContext, customerId: string) {
  const { db, now } = tx;
  const p = db.profiles.find((x) => x.id === customerId);
  if (!p) return;
  const since = now - RULES.NO_SHOW_SUSPEND_WINDOW_DAYS * 24 * 60 * MIN;
  const n = noShowCount(db, customerId, since);
  if (n >= RULES.NO_SHOW_SUSPEND_COUNT && !(p.suspendedUntil && t(p.suspendedUntil) > now)) {
    p.suspendedUntil = iso(now + RULES.SUSPEND_DAYS * 24 * 60 * MIN);
    p.suspendReason = `Reservations paused until ${p.suspendedUntil.slice(0, 10)} after ${n} no-shows in ${RULES.NO_SHOW_SUSPEND_WINDOW_DAYS} days.`;
    audit(tx, "system", "customer_suspended", "profile", p.id, p.suspendReason);
    notify(tx, p.id, p.suspendReason, "suspension", { until: p.suspendedUntil });
  }
}

export function noShowCount(db: DB, customerId: string, sinceMs: number): number {
  return db.reservations.filter((r) => r.customerId === customerId && r.status === "No-show" && r.noShowAt && t(r.noShowAt) >= sinceMs).length;
}
