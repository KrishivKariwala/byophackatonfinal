import "server-only";
import type { TxContext } from "../store";
import { RuleError, RULES } from "../rules";
import { write, lockClaimTx } from "../services";
import { audit, iso, listingIn, move, ngoOf, notifyT, openBatch, ngosNear, outletOf, requireRole, t } from "../core";
import { distanceKm } from "../geo";
import { notifyFollowers } from "../follows";
import { cfg } from "./settings";
import type { DB, Listing, Outlet, Profile, Vendor } from "../types";

/**
 * P2 feature 7: charity priority window. A vendor can offer a listing to nearby verified charities first (15 / 30 / 45 min).
 *  - Customers can neither see nor reserve it until `public_visible_at`; charities see it at once and get a notification.
 *  - A charity that claims it during the window takes the whole listing as a free donation: it never goes public.
 *  - If nobody claims it, it simply becomes public when the window ends (visibility is a pure function of the clock, so it needs no job
 *    to flip) and followers are told at that moment.
 */

/** True when customers may see the listing: no priority window, or the window is over. */
export function priorityOver(db: DB, l: Listing, nowMs: number): boolean {
  if (!l.publicVisibleAt) return true;
  if (!cfg(db).flags.priorityWindow && nowMs < t(l.publicVisibleAt)) return true; // flag switched off: nothing stays hidden
  return nowMs >= t(l.publicVisibleAt);
}

export function setupPriority(tx: TxContext, l: Listing, outlet: Outlet, vendor: Vendor, minutes: number) {
  const { db, now } = tx;
  const c = cfg(db);
  if (!c.flags.priorityWindow) throw new RuleError("feature_off", "The charity priority window is switched off.", 403, undefined, "feature_off_charity_priority_window");
  if (l.donationOnly) throw new RuleError("priority_donation", "Donation-only listings are already for charities.");
  if (!c.priorityOptions.includes(Number(minutes))) throw new RuleError("priority_invalid", `Choose ${c.priorityOptions.join(", ")} minutes.`, 400, { options: c.priorityOptions.join(", ") });
  const visibleAt = now + Number(minutes) * 60_000;
  if (visibleAt >= t(l.windowEnd) - 10 * 60_000)
    throw new RuleError("priority_too_long", "The priority window must end at least 10 minutes before pickup closes, or customers would never get a chance.");
  l.priorityMinutes = Number(minutes);
  l.publicVisibleAt = iso(visibleAt);
  const near = ngosNear(db, outlet);
  for (const n of near)
    notifyT(tx, n.ownerId, "priorityOffer", { qty: l.qtyTotal, title: l.title, vendor: vendor.businessName, minutes }, "priority_listing", { listingId: l.id, until: l.publicVisibleAt });
  audit(tx, "system", "priority_window_started", "listing", l.id, `${minutes} min, ${near.length} charities notified`);
}

/** Priority listings an approved charity can claim right now (inside its service area, still inside the window). */
export function priorityOffersFor(db: DB, ngo: { lat: number; lng: number; serviceAreaKm: number; status: string }, nowMs: number) {
  if (!cfg(db).flags.priorityWindow || ngo.status !== "Approved") return [];
  return db.listings
    .filter((l) => l.publicVisibleAt && nowMs < t(l.publicVisibleAt) && l.status === "Live" && l.qtyAvailable > 0 && !l.hiddenByAdmin && !l.donationOnly && nowMs < t(l.windowEnd))
    .map((l) => ({ l, outlet: outletOf(db, l.outletId), vendor: db.vendors.find((v) => v.id === l.vendorId)! }))
    .filter((x) => x.vendor.status === "Approved" && !x.vendor.hiddenByAdmin && distanceKm(ngo, x.outlet) <= ngo.serviceAreaKm)
    .map((x) => ({ ...x, km: distanceKm(ngo, x.outlet) }))
    .sort((a, b) => t(a.l.publicVisibleAt!) - t(b.l.publicVisibleAt!));
}

/** A charity takes a whole priority listing as a free donation. All-or-nothing; the first valid claim wins. */
export function claimPriorityListing(actor: Profile | null, listingId: string) {
  return write((tx) => {
    const me = requireRole(actor, "ngo");
    const { db, now } = tx;
    if (!cfg(db).flags.priorityWindow) throw new RuleError("feature_off", "The charity priority window is switched off.", 403, undefined, "feature_off_charity_priority_window");
    const n = ngoOf(db, me);
    if (n.status !== "Approved") throw new RuleError("approval_required", `Your NGO verification is ${n.status}. Only approved NGOs can claim.`, 403, { status: n.status, statusKey: `status.${n.status}` });
    const l = listingIn(db, listingId);
    if (!l.publicVisibleAt || now >= t(l.publicVisibleAt)) throw new RuleError("priority_closed", "The priority window for this listing has ended.", 409);
    if (l.status !== "Live" || l.qtyAvailable <= 0 || now >= t(l.windowEnd)) throw new RuleError("not_available", "This listing is no longer available.", 409);
    const outlet = outletOf(db, l.outletId);
    if (distanceKm(n, outlet) > n.serviceAreaKm) throw new RuleError("out_of_area", "This vendor is outside your service area.", 403);
    const safeUntil = l.safeUntil ? t(l.safeUntil) : Infinity;
    const collectBy = Math.min(t(l.windowEnd) + RULES.DONATION_COLLECT_HOURS_DEFAULT * 3600_000, safeUntil);
    if (collectBy <= now) throw new RuleError("not_available", "This food is past its safe-to-eat time.", 409, undefined, "not_available_food_past_its");
    const qty = l.qtyAvailable;
    move(tx, l, -qty, "priority_claim"); // the stock leaves the listing in the same transaction: customers can't also buy it
    l.donationProcessedAt = iso(now); // so window end does not create a second batch
    const b = openBatch(tx, l, qty, collectBy, "Priority-window claim by a charity", "priority", false);
    b.fromPriorityListing = true;
    lockClaimTx(tx, me, n, b);
    audit(tx, me.id, "priority_claimed", "listing", l.id, `${qty} units by ${n.id}`);
    return b;
  });
}

/** Job: when a priority window ends unclaimed, followers are told once that it is now open to everyone. */
export function priorityJobPending(db: DB, now: number): boolean {
  return cfg(db).flags.priorityWindow && db.listings.some((l) => l.publicVisibleAt && !l.publicNotifiedAt && now >= t(l.publicVisibleAt));
}
export function runPriorityJob(tx: TxContext) {
  const { db, now } = tx;
  for (const l of db.listings) {
    if (!l.publicVisibleAt || l.publicNotifiedAt || now < t(l.publicVisibleAt)) continue;
    l.publicNotifiedAt = iso(now);
    if (l.status !== "Live" || l.qtyAvailable <= 0 || now >= t(l.windowEnd) || l.hiddenByAdmin) continue;
    const vendor = db.vendors.find((v) => v.id === l.vendorId);
    const outlet = db.outlets.find((o) => o.id === l.outletId);
    if (vendor && outlet) notifyFollowers(tx, l, outlet, vendor);
    tx.emit({ type: "listing", listingId: l.id, qtyAvailable: l.qtyAvailable, status: l.status });
  }
}
