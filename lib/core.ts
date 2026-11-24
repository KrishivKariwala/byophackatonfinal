import "server-only";
import type { TxContext } from "./store";
import { RULES, RuleError } from "./rules";
import { newId } from "./crypto";
import { distanceKm } from "./geo";
import { sendNotification } from "./notify";
import { vendorCtx, outletRecipients, type Perm, type VendorCtx } from "./p2/org";
import { co2eFor, kgFor } from "./impact-config";
import type {
  DB, DonationBatch, Listing, Ngo, NotificationType, Outlet, Profile, Reservation, ReservationStatus, Role, Vendor,
} from "./types";

/** Shared transaction-level helpers used by services.ts, p1.ts and jobs.ts. No business entry points live here. */

export const iso = (ms: number) => new Date(ms).toISOString();
export const t = (s: string) => Date.parse(s);

export function requireRole(actor: Profile | null, ...roles: Role[]): Profile {
  if (!actor) throw new RuleError("unauthenticated", "Please sign in.", 401);
  if (!roles.includes(actor.role)) throw new RuleError("forbidden", "Your account cannot do this.", 403);
  return actor;
}
/** The organization (vendor record) the actor works for: as its owner, or (P2) as a manager / staff member. */
export function vendorOf(db: DB, actor: Profile, perm?: Perm): Vendor {
  return vendorCtx(db, actor, perm).vendor;
}
/** Like vendorCtx but also requires an approved organization and a non-suspended account. Returns the whole context (role, outlet scope). */
export function approvedCtx(db: DB, actor: Profile, perm?: Perm): VendorCtx {
  const ctx = vendorCtx(db, actor, perm);
  approvedCheck(db, actor, ctx.vendor);
  return ctx;
}
function approvedCheck(db: DB, actor: Profile, v: Vendor) {
  if (v.status !== "Approved")
    throw new RuleError("approval_required", `Your vendor application is ${v.status}. Only approved vendors can do this.`, 403);
  const live = db.profiles.find((p) => p.id === actor.id) ?? actor; // never trust a stale actor snapshot
  if (live.suspendedUntil && t(live.suspendedUntil) > Date.now() + (db.clockOffsetMs || 0))
    throw new RuleError("account_suspended", live.suspendReason || "Your account is suspended.", 403);
}
export function approvedVendorOf(db: DB, actor: Profile, perm?: Perm): Vendor {
  return approvedCtx(db, actor, perm).vendor;
}
export function ngoOf(db: DB, actor: Profile): Ngo {
  const n = db.ngos.find((x) => x.ownerId === actor.id);
  if (!n) throw new RuleError("no_ngo", "Complete NGO verification first.", 403);
  return n;
}
export function outletOf(db: DB, outletId: string): Outlet {
  const o = db.outlets.find((x) => x.id === outletId);
  if (!o) throw new RuleError("not_found", "Outlet not found.", 404);
  return o;
}
export function listingIn(db: DB, id: string): Listing {
  const l = db.listings.find((x) => x.id === id);
  if (!l) throw new RuleError("not_found", "Listing not found.", 404);
  return l;
}

export function audit(tx: TxContext, actorId: string, action: string, entity: string, entityId: string, detail?: string) {
  tx.db.audit.push({ id: newId("au"), actorId, action, entity, entityId, detail, at: iso(tx.now) });
}

/** Tell the people who run one outlet (owner, managers, and staff pinned to it). With one outlet and one owner this is exactly the P1 behaviour. */
export function notifyOutlet(tx: TxContext, vendor: Vendor, outletId: string | undefined, text: string, type: NotificationType = "generic", payload: Record<string, unknown> = {}) {
  for (const uid of outletRecipients(tx.db, vendor.id, outletId)) sendNotification(tx, uid, type, text, payload);
}

/** Plain-text notification (kept for P0 call sites). New code should call sendNotification with a type. */
export function notify(tx: TxContext, userId: string, text: string, type: NotificationType = "generic", payload: Record<string, unknown> = {}) {
  sendNotification(tx, userId, type, text, payload);
}

export function move(tx: TxContext, l: Listing, delta: number, reason: string, refId?: string) {
  if (l.qtyAvailable + delta < 0) throw new RuleError("insufficient_stock", "Not enough units left.", 409);
  l.qtyAvailable += delta;
  l.updatedAt = iso(tx.now);
  tx.db.inventory.push({ id: newId("im"), listingId: l.id, delta, reason, refId, at: iso(tx.now) });
  if (l.status === "Live" && l.qtyAvailable === 0) l.status = "Sold Out";
  else if (l.status === "Sold Out" && l.qtyAvailable > 0 && tx.now < t(l.windowEnd) && !l.donationOnly) l.status = "Live";
  tx.emit({ type: "listing", listingId: l.id, qtyAvailable: l.qtyAvailable, status: l.status });
}

export function emitRes(tx: TxContext, r: Reservation) {
  tx.emit({ type: "reservation", reservationId: r.id, status: r.status, customerId: r.customerId, vendorId: r.vendorId });
}

/** The only way a reservation's status changes: updates it and appends a timestamped log row. */
export function setResStatus(tx: TxContext, r: Reservation, to: ReservationStatus, actorId?: string, note?: string) {
  const from = r.status;
  r.status = to;
  if (to !== "Reserved" && to !== "Ready") { r.etaMinutes = undefined; r.etaUpdatedAt = undefined; } // P2: no ETA outlives an active order
  tx.db.reservationEvents.push({ id: newId("re"), reservationId: r.id, from, to, at: iso(tx.now), actorId, note });
}
export function logNewReservation(tx: TxContext, r: Reservation, actorId?: string) {
  tx.db.reservationEvents.push({ id: newId("re"), reservationId: r.id, to: r.status, at: iso(tx.now), actorId, note: "created" });
}

/** Approved NGOs whose service area covers the outlet (C4), or all approved within `maxKm` when given (C3). */
export function ngosNear(db: DB, outlet: { lat: number; lng: number }, maxKm?: number): Ngo[] {
  return db.ngos.filter((n) => n.status === "Approved" && distanceKm(outlet, n) <= (maxKm ?? n.serviceAreaKm));
}

export function recordImpact(
  tx: TxContext,
  e: { source: "customer_pickup" | "ngo_collection" | "expired"; refId: string; units: number; vendorId: string; outlet: Outlet; listingId: string;
       type: "sold" | "donated" | "wasted"; customerId?: string; rupeesSaved?: number },
) {
  tx.db.impact.push({
    id: newId("ie"), source: e.source, refId: e.refId, units: e.units, vendorId: e.vendorId, neighbourhood: e.outlet.neighbourhood,
    at: iso(tx.now), type: e.type, listingId: e.listingId, qty: e.units, kgEst: kgFor(e.units), co2eKg: co2eFor(e.units),
    customerId: e.customerId, rupeesSaved: e.rupeesSaved,
  });
}

/** Window-end "donate the rest": unreserved, unheld units become one free batch. Also records `wasted` impact for leftovers. */
export function createDonationBatchTx(tx: TxContext, l: Listing) {
  const { db, now } = tx;
  l.donationProcessedAt = iso(now);
  const openHold = db.holds.some((h) => h.listingId === l.id && h.status === "Active");
  if (openHold) throw new RuleError("hold_open", "Internal: hold still open at window end.", 500);
  const qty = l.qtyAvailable;
  const safeUntil = l.safeUntil ? t(l.safeUntil) : Infinity;
  const collectBy = Math.min(t(l.windowEnd) + RULES.DONATION_COLLECT_HOURS_DEFAULT * 3600_000, safeUntil);
  const eligible = qty > 0 && l.safetyDeclaration?.accepted === true && safeUntil > now && collectBy > now;
  if (!eligible) {
    audit(tx, "system", "donation_skipped", "listing", l.id, qty > 0 ? "Not eligible: safety deadline passed" : "No units left");
    if (qty > 0) recordImpact(tx, { source: "expired", refId: l.id, units: qty, vendorId: l.vendorId, outlet: outletOf(db, l.outletId), listingId: l.id, type: "wasted" });
    return;
  }
  move(tx, l, -qty, "donation_batch");
  openBatch(tx, l, qty, collectBy, "Donate the rest at window end", "window_end");
}

/** Units reserved but never collected (no-show) are offered to charities through the same flow. */
export function createNoShowBatchTx(tx: TxContext, l: Listing, qty: number) {
  const { now } = tx;
  const safeUntil = l.safeUntil ? t(l.safeUntil) : Infinity;
  const collectBy = Math.min(t(l.windowEnd) + RULES.DONATION_COLLECT_HOURS_DEFAULT * 3600_000, safeUntil);
  const eligible = l.donateRest && qty > 0 && l.safetyDeclaration?.accepted === true && safeUntil > now && collectBy > now;
  if (!eligible) {
    recordImpact(tx, { source: "expired", refId: l.id, units: qty, vendorId: l.vendorId, outlet: outletOf(tx.db, l.outletId), listingId: l.id, type: "wasted" });
    audit(tx, "system", "no_show_not_donated", "listing", l.id, `${qty} units`);
    return;
  }
  openBatch(tx, l, qty, collectBy, "No-show units offered to charity", "no_show");
}

export function openBatch(tx: TxContext, l: Listing, qty: number, collectBy: number, instruction: string, origin: DonationBatch["origin"], notifyNgos = true) {
  const { db, now } = tx;
  const b: DonationBatch = {
    id: newId("d"), ref: `DON-${tx.nextSeq()}`, listingId: l.id, vendorId: l.vendorId, outletId: l.outletId, qty,
    title: l.title, diet: l.diet, allergens: l.allergens, preparedAt: l.preparedAt, collectBy: iso(collectBy),
    status: "Open", createdAt: iso(now), vendorInstruction: instruction, origin,
  };
  db.donationBatches.push(b);
  audit(tx, "system", "donation_batch_created", "donation_batch", b.id, `${qty} units from ${l.id} (${origin})`);
  const vendor = db.vendors.find((v) => v.id === l.vendorId);
  const outlet = outletOf(db, l.outletId);
  if (notifyNgos) for (const n of ngosNear(db, outlet))
    sendNotification(tx, n.ownerId, "new_donation", `${qty} × ${l.title} free at ${vendor?.businessName}. Collect by ${iso(collectBy)}.`, { batchId: b.id });
  tx.emit({ type: "donation", batchId: b.id, status: b.status });
  return b;
}
