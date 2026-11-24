import type { TxContext } from "../store";
import type { DB, Listing } from "../types";
import { audit, iso, notify, t } from "../core";
import { distanceKm } from "../geo";
import { RULES } from "../rules";
import { cfg } from "./settings";
import { discountOf } from "./markdown";
import { certificateJobPending, runCertificateJob } from "./certificate";

/** P2 scheduled jobs. Run inside the same transaction as the P1 jobs (see lib/jobs.ts); the Postgres equivalents are in 0003_p2.sql. Idempotent. */

export function p2JobsPending(db: DB, now: number): boolean {
  const c = cfg(db);
  return (c.flags.autoMarkdown && db.priceSteps.some((s) => !s.appliedAt && t(s.effectiveAt) <= now)) || certificateJobPending(db, now);
}

export function runP2Jobs(tx: TxContext) {
  applyDuePriceSteps(tx);
  runCertificateJob(tx);
}

/** Applies due markdown steps. A step never raises a price: if the vendor already went lower, it is marked done and changes nothing. */
export function applyDuePriceSteps(tx: TxContext) {
  const { db, now } = tx;
  if (!cfg(db).flags.autoMarkdown) return;
  const due = db.priceSteps.filter((s) => !s.appliedAt && t(s.effectiveAt) <= now).sort((a, b) => (a.effectiveAt < b.effectiveAt ? -1 : 1));
  for (const s of due) {
    s.appliedAt = iso(now);
    const l = db.listings.find((x) => x.id === s.listingId);
    if (!l || !["Live", "Paused", "Sold Out"].includes(l.status) || t(l.windowEnd) <= now) continue;
    const price = Math.max(1, Math.floor((l.originalPrice * (100 - s.discountPct)) / 100));
    if (price >= l.rescuePrice) continue;
    const was = l.rescuePrice;
    l.rescuePrice = price;
    l.updatedAt = iso(now);
    audit(tx, "system", "price_step_applied", "listing", l.id, `₹${was} → ₹${price} (${s.discountPct}% off)`);
    tx.emit({ type: "listing", listingId: l.id, qtyAvailable: l.qtyAvailable, status: l.status });
    if (l.status === "Live" && l.qtyAvailable > 0) notifyPriceDrop(tx, l, was);
  }
}

/** Followers within 10 km hear about the drop (in this app "favourites" are follows). Deduplicated per person per step. */
function notifyPriceDrop(tx: TxContext, l: Listing, was: number) {
  const { db } = tx;
  const vendor = db.vendors.find((v) => v.id === l.vendorId);
  const outlet = db.outlets.find((o) => o.id === l.outletId);
  if (!vendor || !outlet) return;
  const pct = discountOf(l.originalPrice, l.rescuePrice);
  const told = new Set<string>();
  for (const f of db.follows.filter((x) => x.vendorId === vendor.id)) {
    if (told.has(f.customerId)) continue;
    const me = db.profiles.find((p) => p.id === f.customerId);
    const lat = f.lat ?? me?.homeLat, lng = f.lng ?? me?.homeLng;
    if (lat !== undefined && lng !== undefined && distanceKm({ lat, lng }, outlet) > RULES.FOLLOW_ALERT_RADIUS_KM) continue;
    told.add(f.customerId);
    notify(tx, f.customerId, `Price drop: ${l.title} at ${vendor.businessName} is now ₹${l.rescuePrice} (was ₹${was}, ${pct}% off).`, "price_drop", { listingId: l.id, vendorId: vendor.id });
  }
}
