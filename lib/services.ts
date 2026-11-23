import "server-only";
import { transaction, read, now as clockNow, type TxContext } from "./store";
import {
  iso, t, requireRole, approvedVendorOf, ngoOf, outletOf, listingIn, audit, notify, move, emitRes, setResStatus,
  logNewReservation, createDonationBatchTx, recordImpact, openBatch,
} from "./core";
import { notifyFollowers } from "./follows";
import { cancelQuote } from "./cancel";
import { RULES, RuleError, validatePrices, validateWindow } from "./rules";
import { newId, random4, randomToken, sha256 } from "./crypto";
import { distanceKm } from "./geo";
import { co2eFor, kgFor } from "./impact-config";
import { runScheduledJobs, jobsPending } from "./jobs";
import type {
  ApprovalStatus, Category, CheckoutHold, DB, Diet, Listing, Ngo, Payment,
  PaymentMethod, Profile, Reservation, RiskTag, Role,
} from "./types";

export const CATEGORIES: Category[] = ["Bakery", "Meals", "Snacks", "Desserts"];
export const DIETS: Diet[] = ["Vegetarian", "Non-vegetarian"];

// ---------------------------------------------------------------- helpers

function uniqueCode(db: DB, vendorId: string): string {
  const inUse = new Set(
    db.reservations
      .filter((r) => r.vendorId === vendorId && !r.codeUsedAt && (r.status === "Reserved" || r.status === "Ready"))
      .map((r) => r.codeHash),
  );
  for (let i = 0; i < 200; i++) {
    const c = random4();
    if (!inUse.has(sha256(`${vendorId}:${c}`))) return c;
  }
  throw new RuleError("code_exhausted", "Could not allocate a pickup code. Try again.", 503);
}
function newReservation(tx: TxContext, l: Listing, customerId: string, qty: number, method: PaymentMethod, holdId?: string): Reservation {
  const code = uniqueCode(tx.db, l.vendorId);
  const token = randomToken();
  const r: Reservation = {
    id: newId("r"), ref: `SAP-${tx.nextSeq()}`, listingId: l.id, vendorId: l.vendorId, outletId: l.outletId, customerId,
    qty, unitPrice: l.rescuePrice, amount: qty * l.rescuePrice, method, status: "Reserved", holdId,
    qrToken: token, code, qrTokenHash: sha256(token), codeHash: sha256(`${l.vendorId}:${code}`), createdAt: iso(tx.now),
  };
  tx.db.reservations.push(r);
  logNewReservation(tx, r, customerId);
  return r;
}
function activeCount(db: DB, customerId: string): number {
  const res = db.reservations.filter((r) => r.customerId === customerId && (r.status === "Reserved" || r.status === "Ready")).length;
  const holds = db.holds.filter((h) => h.customerId === customerId && h.status === "Active").length;
  return res + holds;
}
export function isCustomerVisible(db: DB, l: Listing, nowMs: number): boolean {
  const v = db.vendors.find((x) => x.id === l.vendorId);
  return l.status === "Live" && l.qtyAvailable > 0 && nowMs < t(l.windowEnd) && v?.status === "Approved" && !l.donationOnly && !l.hiddenByAdmin && !v?.hiddenByAdmin;
}

// ---------------------------------------------------------------- window-end processor

/** Expires holds, closes ended listings, creates donation batches, expires stale batches. Runs inside every write. */
export function sweepTx(tx: TxContext) {
  const { db, now } = tx;
  // 1. Expire checkout holds (5 min or window end, whichever first) and release their stock.
  for (const h of db.holds) {
    if (h.status === "Active" && t(h.expiresAt) <= now) {
      h.status = "Expired";
      const l = db.listings.find((x) => x.id === h.listingId);
      if (l) move(tx, l, h.qty, "hold_expired", h.id);
      const p = db.payments.find((x) => x.holdId === h.id && x.status === "Pending");
      if (p) { p.status = "Failed"; p.updatedAt = iso(now); }
    }
  }
  // 2. Close listings whose window ended; run "Donate the rest".
  for (const l of db.listings) {
    if ((l.status === "Live" || l.status === "Paused" || l.status === "Sold Out") && t(l.windowEnd) <= now) {
      l.status = "Expired";
      l.updatedAt = iso(now);
      tx.emit({ type: "listing", listingId: l.id, qtyAvailable: l.qtyAvailable, status: l.status });
      if (l.donateRest && !l.donationProcessedAt && !l.donationOnly) createDonationBatchTx(tx, l);
    }
  }
  // 3. Expire batches past their collection deadline.
  for (const b of db.donationBatches) {
    if ((b.status === "Open" || b.status === "Claimed") && t(b.collectBy) <= now) {
      b.status = "Expired";
      tx.emit({ type: "donation", batchId: b.id, status: b.status });
    }
  }
  // 4. P1 scheduled jobs (reminders, no-shows, escalation, wasted impact).
  runScheduledJobs(tx);
}

export async function sweep() {
  const db = read();
  const n = clockNow(db);
  const needs =
    db.holds.some((h) => h.status === "Active" && t(h.expiresAt) <= n) ||
    db.listings.some((l) => (l.status === "Live" || l.status === "Paused" || l.status === "Sold Out") && t(l.windowEnd) <= n) ||
    db.donationBatches.some((b) => (b.status === "Open" || b.status === "Claimed") && t(b.collectBy) <= n) ||
    jobsPending(db, n);
  if (needs) await transaction((tx) => sweepTx(tx));
}

/** All writes go through here so the processor always runs first. */
export function write<T>(fn: (tx: TxContext) => T): Promise<T> {
  return transaction((tx) => {
    sweepTx(tx);
    return fn(tx);
  });
}

// ---------------------------------------------------------------- customer

/** Upper bound used for the cheap early check; the per-vendor cap is applied once the listing is known. */
const MAX_ANY_ORDER = 50;

export function completedPickups(db: DB, customerId: string): number {
  return db.reservations.filter((r) => r.customerId === customerId && r.status === "Picked up").length;
}

export type ReserveResult =
  | { kind: "hold"; holdId: string; expiresAt: string; amount: number; gatewayOrderId: string }
  | { kind: "reservation"; reservationId: string };

export function reserve(actor: Profile | null, input: { listingId: string; qty: number; method: PaymentMethod }): Promise<ReserveResult> {
  return write((tx) => {
    const me = requireRole(actor, "customer");
    const { db, now } = tx;
    const live = db.profiles.find((p) => p.id === me.id) ?? me; // suspension is read from stored state, not the caller's snapshot
    const qty = Number(input.qty);
    if (!Number.isInteger(qty) || qty < 1) throw new RuleError("qty_invalid", "Choose at least 1 unit.");
    if (live.suspendedUntil && t(live.suspendedUntil) > now)
      throw new RuleError("suspended", live.suspendReason || `Reservations are paused until ${live.suspendedUntil.slice(0, 10)}.`, 403);
    if (qty > MAX_ANY_ORDER) throw new RuleError("qty_cap", `Maximum ${RULES.MAX_UNITS_PER_ORDER} units per order.`);
    if (input.method !== "online" && input.method !== "pay_at_pickup") throw new RuleError("method_invalid", "Choose a payment method.");
    const l = listingIn(db, input.listingId);
    const vendor = db.vendors.find((v) => v.id === l.vendorId);
    const unitCap = Math.max(RULES.MAX_UNITS_PER_ORDER, vendor?.maxUnitsPerOrder ?? 0);
    if (qty > unitCap) throw new RuleError("qty_cap", `Maximum ${unitCap} units per order.`);
    if (l.donationOnly || l.hiddenByAdmin || vendor?.hiddenByAdmin) throw new RuleError("not_available", "This listing is not available.", 409);
    if (vendor?.status !== "Approved") throw new RuleError("vendor_unavailable", "This vendor is not accepting orders.", 409);
    if (now >= t(l.windowEnd)) throw new RuleError("window_closed", "The pickup window has ended for this listing.", 409);
    if (l.status === "Sold Out") throw new RuleError("insufficient_stock", "Sold out.", 409);
    if (l.status !== "Live") throw new RuleError("not_available", `This listing is ${l.status.toLowerCase()}.`, 409);
    const outlet = outletOf(db, l.outletId);
    if (input.method === "pay_at_pickup" && !outlet.payAtPickup)
      throw new RuleError("pay_at_pickup_off", "This vendor only accepts online payment.");
    if (input.method === "pay_at_pickup" && completedPickups(db, me.id) < RULES.PAY_AT_PICKUP_MIN_PICKUPS)
      throw new RuleError("pay_at_pickup_locked", `Pay at pickup unlocks after ${RULES.PAY_AT_PICKUP_MIN_PICKUPS} completed pickups. Pay online for now.`, 403);
    if (activeCount(db, me.id) >= RULES.MAX_ACTIVE_RESERVATIONS)
      throw new RuleError("active_cap", `You can have at most ${RULES.MAX_ACTIVE_RESERVATIONS} active reservations.`, 409);
    if (l.qtyAvailable < qty) throw new RuleError("insufficient_stock", l.qtyAvailable === 0 ? "Sold out." : `Only ${l.qtyAvailable} left.`, 409);

    if (input.method === "online") {
      const expiresAt = Math.min(now + RULES.HOLD_MINUTES * 60_000, t(l.windowEnd));
      const h: CheckoutHold = {
        id: newId("h"), listingId: l.id, customerId: me.id, qty, amount: qty * l.rescuePrice, expiresAt: iso(expiresAt),
        status: "Active", gatewayOrderId: `demo_order_${newId("o")}`, createdAt: iso(now),
      };
      db.holds.push(h);
      move(tx, l, -qty, "checkout_hold", h.id);
      db.payments.push({
        id: newId("p"), holdId: h.id, customerId: me.id, method: "online", amount: h.amount, status: "Pending",
        gateway: "demo", gatewayOrderId: h.gatewayOrderId, createdAt: iso(now), updatedAt: iso(now),
      });
      return { kind: "hold", holdId: h.id, expiresAt: h.expiresAt, amount: h.amount, gatewayOrderId: h.gatewayOrderId } as const;
    }
    move(tx, l, -qty, "reservation_pay_at_pickup");
    const r = newReservation(tx, l, me.id, qty, "pay_at_pickup");
    db.payments.push({
      id: newId("p"), reservationId: r.id, customerId: me.id, method: "pay_at_pickup", amount: r.amount, status: "Pending",
      gateway: "cash_at_pickup", createdAt: iso(now), updatedAt: iso(now),
    });
    emitRes(tx, r);
    notify(tx, vendor.ownerId, `New order ${r.ref}: ${qty} × ${l.title} (pay at pickup).`, "new_order", { reservationId: r.id });
    notify(tx, me.id, `Order ${r.ref} confirmed: ${qty} × ${l.title}. Pay at pickup.`, "order_confirmed", { reservationId: r.id });
    return { kind: "reservation", reservationId: r.id } as const;
  });
}

export function attachGatewayOrder(holdId: string, gatewayOrderId: string, gateway: Payment["gateway"]) {
  return write((tx) => {
    const h = tx.db.holds.find((x) => x.id === holdId);
    if (!h) throw new RuleError("not_found", "Checkout not found.", 404);
    h.gatewayOrderId = gatewayOrderId;
    const p = tx.db.payments.find((x) => x.holdId === holdId);
    if (p) { p.gatewayOrderId = gatewayOrderId; p.gateway = gateway; }
  });
}

export type PaymentOutcome =
  | { outcome: "confirmed"; reservationId: string }
  | { outcome: "late_refund"; refundId: string }
  | { outcome: "duplicate"; reservationId?: string };

/**
 * Called after server-side verification of a payment (Razorpay signature or demo adapter).
 * Idempotent on eventId. A payment for an expired/released hold never resurrects the order.
 */
export function confirmOnlinePayment(input: { holdId: string; gatewayPaymentId: string; eventId: string; actorId?: string }): Promise<PaymentOutcome> {
  return write((tx) => {
    const { db, now } = tx;
    if (db.processedWebhooks.includes(input.eventId)) {
      const r = db.reservations.find((x) => x.holdId === input.holdId);
      return { outcome: "duplicate", reservationId: r?.id } as const;
    }
    db.processedWebhooks.push(input.eventId);
    const h = db.holds.find((x) => x.id === input.holdId);
    if (!h) throw new RuleError("not_found", "Checkout not found.", 404);
    if (input.actorId && h.customerId !== input.actorId) throw new RuleError("forbidden", "Not your checkout.", 403);
    const p = db.payments.find((x) => x.holdId === h.id)!;
    if (h.status === "Converted") {
      const r = db.reservations.find((x) => x.holdId === h.id)!;
      return { outcome: "duplicate", reservationId: r.id } as const;
    }
    if (h.status !== "Active" || t(h.expiresAt) <= now) {
      // Late callback: money captured after the hold lapsed. Refund (test mode), never revive.
      p.status = "Refund Pending";
      p.gatewayPaymentId = input.gatewayPaymentId;
      p.updatedAt = iso(now);
      const refund = { id: newId("rf"), paymentId: p.id, amount: p.amount, reason: "Payment arrived after checkout hold expired", status: "Refund Pending" as const, createdAt: iso(now) };
      db.refunds.push(refund);
      audit(tx, "system", "late_payment_refund", "payment", p.id, input.gatewayPaymentId);
      notify(tx, h.customerId, `Your payment arrived after the 5-minute hold expired. A full test-mode refund of ₹${p.amount} has been initiated.`, "refund_issued", { amount: p.amount });
      return { outcome: "late_refund", refundId: refund.id } as const;
    }
    const l = listingIn(db, h.listingId);
    h.status = "Converted";
    const r = newReservation(tx, l, h.customerId, h.qty, "online", h.id);
    p.status = "Test Payment Successful";
    p.reservationId = r.id;
    p.gatewayPaymentId = input.gatewayPaymentId;
    p.updatedAt = iso(now);
    emitRes(tx, r);
    const vendor = db.vendors.find((v) => v.id === l.vendorId)!;
    notify(tx, vendor.ownerId, `New order ${r.ref}: ${r.qty} × ${l.title} (paid, test mode).`, "new_order", { reservationId: r.id });
    notify(tx, h.customerId, `Order ${r.ref} confirmed: ${r.qty} × ${l.title}. Collect between ${l.windowStart} and ${l.windowEnd}.`, "order_confirmed", { reservationId: r.id });
    return { outcome: "confirmed", reservationId: r.id } as const;
  });
}

export function failOnlinePayment(actor: Profile | null, holdId: string) {
  return write((tx) => {
    const me = requireRole(actor, "customer");
    const h = tx.db.holds.find((x) => x.id === holdId && x.customerId === me.id);
    if (!h) throw new RuleError("not_found", "Checkout not found.", 404);
    if (h.status !== "Active") return { status: h.status };
    h.status = "Released";
    move(tx, listingIn(tx.db, h.listingId), h.qty, "hold_released", h.id);
    const p = tx.db.payments.find((x) => x.holdId === h.id);
    if (p) { p.status = "Failed"; p.updatedAt = iso(tx.now); }
    return { status: h.status };
  });
}

// ---------------------------------------------------------------- vendor

export interface ListingInput {
  title: string; description?: string; category: Category; imageUrl?: string; surpriseBag?: boolean;
  originalPrice: number; rescuePrice: number; qty: number; diet: Diet; allergens?: string[];
  preparedAt: string; safeUntil?: string; storageNote?: string; windowStart: string; windowEnd: string;
  donateRest: boolean; safetyDeclaration: boolean;
  /** P1 */
  donationOnly?: boolean; riskTag?: RiskTag;
}

function validateListingFields(i: ListingInput, now: number, createdAt: number) {
  if (!i.title || i.title.trim().length < 3 || i.title.length > 80) throw new RuleError("title_invalid", "Title must be 3–80 characters.");
  if (!CATEGORIES.includes(i.category)) throw new RuleError("category_invalid", "Choose a category.");
  if (!DIETS.includes(i.diet)) throw new RuleError("diet_required", "Choose Vegetarian or Non-vegetarian.");
  if (!i.donationOnly) validatePrices(Number(i.originalPrice), Number(i.rescuePrice));
  if (i.riskTag && !["raw", "seafood", "dairy_dessert"].includes(i.riskTag)) throw new RuleError("risk_invalid", "Unknown food risk tag.");
  const q = Number(i.qty);
  if (!Number.isInteger(q) || q < 1 || q > RULES.MAX_LISTING_QTY) throw new RuleError("qty_invalid", `Quantity must be 1–${RULES.MAX_LISTING_QTY}.`);
  if (i.safetyDeclaration !== true) throw new RuleError("declaration_required", "Confirm the food-safety declaration to publish.");
  const prep = t(i.preparedAt);
  if (!Number.isFinite(prep) || prep > now + 60_000) throw new RuleError("prepared_invalid", "Preparation time must be now or earlier.");
  const ws = t(i.windowStart), we = t(i.windowEnd);
  validateWindow(now, createdAt, ws, we);
  if (i.riskTag && we - ws > RULES.HIGH_RISK_MAX_WINDOW_MINUTES * 60_000)
    throw new RuleError("risk_window", "Raw, seafood and dairy-dessert items can have a pickup window of at most 2 hours.");
  if (i.safeUntil) {
    const su = t(i.safeUntil);
    if (!Number.isFinite(su) || su < we) throw new RuleError("safe_until_invalid", "Safe-to-eat deadline must be after the pickup end.");
  }
  if (i.imageUrl && !/^(https:\/\/|\/)/.test(i.imageUrl)) throw new RuleError("image_invalid", "Image must be an https URL.");
}

export function createListing(actor: Profile | null, i: ListingInput) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const v = approvedVendorOf(tx.db, me);
    const outlet = tx.db.outlets.find((o) => o.vendorId === v.id);
    if (!outlet) throw new RuleError("no_outlet", "Add your outlet address first.", 409);
    validateListingFields(i, tx.now, tx.now);
    const l: Listing = {
      id: newId("l"), vendorId: v.id, outletId: outlet.id, title: i.title.trim(), description: (i.description || "").trim(),
      category: i.category, imageUrl: i.imageUrl || undefined, imageIsRepresentative: true, surpriseBag: !!i.surpriseBag,
      originalPrice: Number(i.originalPrice) || 0, rescuePrice: i.donationOnly ? 0 : Number(i.rescuePrice), qtyTotal: Number(i.qty), qtyAvailable: 0,
      donationOnly: !!i.donationOnly || undefined, riskTag: i.riskTag || undefined,
      diet: i.diet, allergens: (i.allergens || []).map((a) => a.trim()).filter(Boolean).slice(0, 12),
      preparedAt: iso(t(i.preparedAt)), safeUntil: i.safeUntil ? iso(t(i.safeUntil)) : undefined, storageNote: i.storageNote?.trim() || undefined,
      safetyDeclaration: { accepted: true, acceptedAt: iso(tx.now), byUserId: me.id },
      windowStart: iso(t(i.windowStart)), windowEnd: iso(t(i.windowEnd)), donateRest: !!i.donateRest,
      status: "Live", createdAt: iso(tx.now), updatedAt: iso(tx.now),
    };
    tx.db.listings.push(l);
    move(tx, l, l.qtyTotal, "listing_published");
    audit(tx, me.id, "listing_published", "listing", l.id, `declaration accepted; donateRest=${l.donateRest}${l.donationOnly ? "; donation-only" : ""}`);
    if (l.donationOnly) {
      // Donation-only: never sold. Units go straight to a batch that charities can claim until the window ends.
      l.donationProcessedAt = iso(tx.now);
      move(tx, l, -l.qtyTotal, "donation_only");
      const safeUntil = l.safeUntil ? t(l.safeUntil) : Infinity;
      openBatch(tx, l, l.qtyTotal, Math.min(t(l.windowEnd), safeUntil), "Donation-only listing", "donation_only");
    } else {
      notifyFollowers(tx, l, outlet, v);
    }
    return l;
  });
}

export function updateListing(actor: Profile | null, id: string, patch: Partial<ListingInput>) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const v = approvedVendorOf(tx.db, me);
    const l = listingIn(tx.db, id);
    if (l.vendorId !== v.id) throw new RuleError("forbidden", "Not your listing.", 403);
    if (!["Live", "Paused", "Sold Out"].includes(l.status)) throw new RuleError("not_editable", `A ${l.status.toLowerCase()} listing cannot be edited.`, 409);
    const allocated = l.qtyTotal - l.qtyAvailable;
    const merged: ListingInput = {
      title: patch.title ?? l.title, description: patch.description ?? l.description, category: patch.category ?? l.category,
      imageUrl: patch.imageUrl ?? l.imageUrl, surpriseBag: patch.surpriseBag ?? l.surpriseBag,
      originalPrice: patch.originalPrice ?? l.originalPrice, rescuePrice: patch.rescuePrice ?? l.rescuePrice,
      qty: patch.qty ?? l.qtyTotal, diet: patch.diet ?? l.diet, allergens: patch.allergens ?? l.allergens,
      preparedAt: patch.preparedAt ?? l.preparedAt, safeUntil: patch.safeUntil ?? l.safeUntil, storageNote: patch.storageNote ?? l.storageNote,
      windowStart: patch.windowStart ?? l.windowStart, windowEnd: patch.windowEnd ?? l.windowEnd,
      donateRest: patch.donateRest ?? l.donateRest, safetyDeclaration: patch.safetyDeclaration ?? true,
      riskTag: patch.riskTag ?? l.riskTag, donationOnly: l.donationOnly,
    };
    if (patch.safetyDeclaration !== true) throw new RuleError("declaration_required", "Re-confirm the food-safety declaration to save changes.");
    // Window rules: if the window changes, the start must still be in the future and within 12 h of creation.
    // Forms submit minute precision; treat sub-minute differences as unchanged.
    const sameMin = (x: string, y: string) => Math.abs(t(x) - t(y)) < 60_000;
    const windowChanged = !sameMin(merged.windowStart, l.windowStart) || !sameMin(merged.windowEnd, l.windowEnd);
    if (!windowChanged) { merged.windowStart = l.windowStart; merged.windowEnd = l.windowEnd; }
    const now = tx.now;
    if (windowChanged) validateWindow(now, t(l.createdAt), t(merged.windowStart), t(merged.windowEnd));
    validateListingFields({ ...merged, windowStart: windowChanged ? merged.windowStart : iso(now + 120_000), windowEnd: windowChanged ? merged.windowEnd : iso(now + 180_000) }, now, now);
    if (!windowChanged && merged.safeUntil && t(merged.safeUntil) < t(l.windowEnd)) throw new RuleError("safe_until_invalid", "Safe-to-eat deadline must be after the pickup end.");
    const newTotal = Number(merged.qty);
    if (newTotal < allocated) throw new RuleError("qty_below_allocated", `${allocated} units are already reserved or held; quantity cannot go below that.`, 409);
    const before = JSON.stringify({ p: [l.originalPrice, l.rescuePrice], q: l.qtyTotal, d: l.diet, a: l.allergens, w: [l.windowStart, l.windowEnd] });
    Object.assign(l, {
      title: merged.title.trim(), description: merged.description || "", category: merged.category, imageUrl: merged.imageUrl,
      surpriseBag: !!merged.surpriseBag, originalPrice: Number(merged.originalPrice), rescuePrice: Number(merged.rescuePrice), diet: merged.diet,
      allergens: merged.allergens || [], preparedAt: merged.preparedAt, safeUntil: merged.safeUntil, storageNote: merged.storageNote,
      windowStart: merged.windowStart, windowEnd: merged.windowEnd, donateRest: !!merged.donateRest, riskTag: merged.riskTag,
      safetyDeclaration: { accepted: true, acceptedAt: iso(now), byUserId: me.id },
    });
    const delta = newTotal - l.qtyTotal;
    l.qtyTotal = newTotal;
    if (delta !== 0) move(tx, l, delta, "vendor_adjust");
    else { l.updatedAt = iso(now); tx.emit({ type: "listing", listingId: l.id, qtyAvailable: l.qtyAvailable, status: l.status }); }
    audit(tx, me.id, "listing_edited", "listing", l.id, `before=${before}`);
    return l;
  });
}

export function setPaused(actor: Profile | null, id: string, paused: boolean) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const v = approvedVendorOf(tx.db, me);
    const l = listingIn(tx.db, id);
    if (l.vendorId !== v.id) throw new RuleError("forbidden", "Not your listing.", 403);
    if (paused) {
      if (l.status !== "Live" && l.status !== "Sold Out") throw new RuleError("bad_transition", `Cannot pause a ${l.status.toLowerCase()} listing.`, 409);
      l.status = "Paused";
    } else {
      if (l.status !== "Paused") throw new RuleError("bad_transition", "Listing is not paused.", 409);
      if (l.hiddenByAdmin) throw new RuleError("hidden_by_admin", "This listing was hidden by an administrator and can't be resumed.", 403);
      if (tx.now >= t(l.windowEnd)) throw new RuleError("window_closed", "The pickup window has ended.", 409);
      l.status = l.qtyAvailable > 0 ? "Live" : "Sold Out";
    }
    l.updatedAt = iso(tx.now);
    audit(tx, me.id, paused ? "listing_paused" : "listing_resumed", "listing", l.id);
    tx.emit({ type: "listing", listingId: l.id, qtyAvailable: l.qtyAvailable, status: l.status });
    return l;
  });
}

export function cancelListing(actor: Profile | null, id: string, reason: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const v = approvedVendorOf(tx.db, me);
    const { db, now } = tx;
    const l = listingIn(db, id);
    if (l.vendorId !== v.id) throw new RuleError("forbidden", "Not your listing.", 403);
    if (!["Live", "Paused", "Sold Out", "Draft"].includes(l.status)) throw new RuleError("bad_transition", `A ${l.status.toLowerCase()} listing cannot be cancelled.`, 409);
    if (!reason || reason.trim().length < 3) throw new RuleError("reason_required", "Give a short cancellation reason.");
    l.status = "Cancelled";
    l.cancelReason = reason.trim();
    let refunds = 0;
    // Release holds.
    for (const h of db.holds.filter((x) => x.listingId === l.id && x.status === "Active")) {
      h.status = "Released";
      const p = db.payments.find((x) => x.holdId === h.id);
      if (p && p.status === "Pending") { p.status = "Failed"; p.updatedAt = iso(now); }
      notify(tx, h.customerId, `Your checkout for ${l.title} was cancelled by the vendor.`);
    }
    // Cancel outstanding orders; refund captured online payments; never fake a refund for unpaid pay-at-pickup.
    for (const r of db.reservations.filter((x) => x.listingId === l.id && (x.status === "Reserved" || x.status === "Ready"))) {
      setResStatus(tx, r, "Cancelled", me.id, "vendor cancelled listing");
      r.cancelledAt = iso(now);
      r.cancelledBy = "vendor";
      r.cancelReason = `Vendor cancelled listing: ${l.cancelReason}`;
      const p = db.payments.find((x) => x.reservationId === r.id);
      if (p && p.status === "Test Payment Successful") {
        // Demo adapter refunds immediately (simulated). Razorpay test mode: Refund Pending until the refund API call succeeds.
        const settled = p.gateway === "demo";
        p.status = settled ? "Refunded" : "Refund Pending";
        p.updatedAt = iso(now);
        db.refunds.push({ id: newId("rf"), paymentId: p.id, amount: p.amount, reason: r.cancelReason, status: settled ? "Refunded" : "Refund Pending", createdAt: iso(now) });
        refunds++;
      }
      notify(tx, r.customerId, `${r.ref} was cancelled by the vendor (${l.cancelReason}).${p?.method === "online" ? " A full test-mode refund was issued." : ""}`, "order_cancelled", { reservationId: r.id });
      if (p?.method === "online" && refunds > 0) notify(tx, r.customerId, `Refund of ₹${p.amount} issued for ${r.ref}.`, "refund_issued", { reservationId: r.id, amount: p.amount });
      emitRes(tx, r);
    }
    const remaining = l.qtyAvailable;
    l.qtyAvailable = 0;
    db.inventory.push({ id: newId("im"), listingId: l.id, delta: -remaining, reason: "listing_cancelled", at: iso(now) });
    l.updatedAt = iso(now);
    audit(tx, me.id, "listing_cancelled", "listing", l.id, `${l.cancelReason}; refunds=${refunds}`);
    tx.emit({ type: "listing", listingId: l.id, qtyAvailable: 0, status: l.status });
    return { listing: l, refunds };
  });
}

export function markReady(actor: Profile | null, reservationId: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const v = approvedVendorOf(tx.db, me);
    const r = tx.db.reservations.find((x) => x.id === reservationId);
    if (!r || r.vendorId !== v.id) throw new RuleError("not_found", "Order not found for this outlet.", 404);
    if (r.status !== "Reserved") throw new RuleError("bad_transition", `Order is ${r.status}; only Reserved orders can be marked Ready.`, 409);
    setResStatus(tx, r, "Ready", me.id, "vendor marked ready");
    r.readyAt = iso(tx.now);
    notify(tx, r.customerId, `${r.ref} is ready for pickup.`, "order_ready", { reservationId: r.id });
    emitRes(tx, r);
    return r;
  });
}

export type HandoverResult = { ok: true; ref: string; qty: number; title: string; collectAmount: number; method: PaymentMethod };

export function handover(actor: Profile | null, input: { code?: string; token?: string }) {
  return write((tx): HandoverResult => {
    const me = requireRole(actor, "vendor");
    const v = approvedVendorOf(tx.db, me);
    const { db, now } = tx;
    let r: Reservation | undefined;
    if (input.token) {
      const raw = input.token.trim().replace(/^sap:/, "");
      r = db.reservations.find((x) => x.qrTokenHash === sha256(raw));
      if (r && r.vendorId !== v.id) throw new RuleError("wrong_vendor", "This pickup pass belongs to a different vendor.", 403);
    } else if (input.code) {
      if (!/^\d{4}$/.test(input.code.trim())) throw new RuleError("code_format", "Enter the 4-digit code.");
      const h = sha256(`${v.id}:${input.code.trim()}`);
      const matches = db.reservations.filter((x) => x.vendorId === v.id && x.codeHash === h);
      r = matches.find((x) => !x.codeUsedAt && (x.status === "Reserved" || x.status === "Ready")) ?? matches[0];
    } else throw new RuleError("code_required", "Scan the QR or enter the 4-digit code.");
    if (!r) throw new RuleError("code_not_found", "No order with this code at your outlet.", 404);
    if (r.codeUsedAt || r.status === "Picked up") throw new RuleError("code_used", `${r.ref} was already collected; codes work once.`, 409);
    if (r.status !== "Reserved" && r.status !== "Ready") throw new RuleError("order_inactive", `${r.ref} is ${r.status.toLowerCase()}.`, 409);
    const l = listingIn(db, r.listingId);
    if (now < t(l.windowStart)) throw new RuleError("too_early", `Pickup window opens at ${l.windowStart}.`, 409);
    if (now > t(l.windowEnd)) throw new RuleError("too_late", "The pickup window has ended.", 409);
    setResStatus(tx, r, "Picked up", me.id, input.token ? "qr" : "code");
    r.pickedUpAt = iso(now);
    r.codeUsedAt = iso(now);
    const p = db.payments.find((x) => x.reservationId === r!.id);
    let collect = 0;
    if (p && r.method === "pay_at_pickup" && p.status === "Pending") {
      p.status = "Paid at Pickup";
      p.updatedAt = iso(now);
      collect = p.amount;
    }
    const outlet = outletOf(db, r.outletId);
    recordImpact(tx, { source: "customer_pickup", refId: r.id, units: r.qty, vendorId: v.id, outlet, listingId: l.id, type: "sold", customerId: r.customerId, rupeesSaved: (l.originalPrice - r.unitPrice) * r.qty });
    audit(tx, me.id, "handover", "reservation", r.id, input.token ? "qr" : "code");
    notify(tx, r.customerId, `${r.ref} picked up. Thanks for saving a plate! You can rate your order for 48 hours.`, "review_prompt", { reservationId: r.id });
    emitRes(tx, r);
    tx.emit({ type: "impact" });
    return { ok: true, ref: r.ref, qty: r.qty, title: l.title, collectAmount: collect, method: r.method };
  });
}

export function donationHandover(actor: Profile | null, batchId: string, code: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const v = approvedVendorOf(tx.db, me);
    const b = tx.db.donationBatches.find((x) => x.id === batchId);
    if (!b || b.vendorId !== v.id) throw new RuleError("not_found", "Donation batch not found for this outlet.", 404);
    if (b.status !== "Claimed") throw new RuleError("bad_transition", `Batch is ${b.status}.`, 409);
    if (!b.collectionCodeHash || b.collectionCodeHash !== sha256(`${v.id}:don:${String(code).trim()}`))
      throw new RuleError("code_mismatch", "Collection code does not match this batch.", 403);
    b.status = "Collected";
    b.collectedAt = iso(tx.now);
    const outlet = outletOf(tx.db, b.outletId);
    recordImpact(tx, { source: "ngo_collection", refId: b.id, units: b.qty, vendorId: v.id, outlet, listingId: b.listingId, type: "donated" });
    const ngo = tx.db.ngos.find((n) => n.id === b.claimedByNgoId);
    if (ngo) notify(tx, ngo.ownerId, `${b.ref} collected: ${b.qty} × ${b.title}. Donation recorded.`);
    audit(tx, me.id, "donation_handover", "donation_batch", b.id);
    tx.emit({ type: "donation", batchId: b.id, status: b.status });
    tx.emit({ type: "impact" });
    return b;
  });
}

// ---------------------------------------------------------------- NGO

export function claimBatch(actor: Profile | null, batchId: string) {
  return write((tx) => {
    const me = requireRole(actor, "ngo");
    const n = ngoOf(tx.db, me);
    if (n.status !== "Approved") throw new RuleError("approval_required", `Your NGO verification is ${n.status}. Only approved NGOs can claim.`, 403);
    const b = tx.db.donationBatches.find((x) => x.id === batchId);
    if (!b) throw new RuleError("not_found", "Batch not found.", 404);
    // Conditional transition inside the lock: the first valid claim wins, the rest fail.
    if (b.status !== "Open") throw new RuleError("already_claimed", b.status === "Claimed" ? "Another NGO already claimed this batch." : `Batch is ${b.status}.`, 409);
    if (t(b.collectBy) <= tx.now) throw new RuleError("expired", "Collection deadline has passed.", 409);
    const code = random4();
    b.status = "Claimed";
    b.claimedByNgoId = n.id;
    b.claimedAt = iso(tx.now);
    b.collectionCode = code;
    b.collectionCodeHash = sha256(`${b.vendorId}:don:${code}`);
    const vendor = tx.db.vendors.find((v) => v.id === b.vendorId)!;
    notify(tx, vendor.ownerId, `${n.orgName} claimed ${b.ref} (${b.qty} × ${b.title}).`);
    audit(tx, me.id, "donation_claimed", "donation_batch", b.id, n.id);
    tx.emit({ type: "donation", batchId: b.id, status: b.status });
    return b;
  });
}

export function releaseClaim(actor: Profile | null, batchId: string) {
  return write((tx) => {
    const me = requireRole(actor, "ngo");
    const n = ngoOf(tx.db, me);
    const b = tx.db.donationBatches.find((x) => x.id === batchId);
    if (!b || b.claimedByNgoId !== n.id || b.status !== "Claimed") throw new RuleError("not_found", "No active claim to release.", 404);
    b.claimedByNgoId = undefined;
    b.claimedAt = undefined;
    b.collectionCode = undefined;
    b.collectionCodeHash = undefined;
    b.pickupSlot = b.volunteerName = b.volunteerPhone = b.volunteerToken = undefined; // old volunteer link dies with the claim
    b.status = t(b.collectBy) > tx.now ? "Open" : "Expired"; // reopen only while still safe to collect
    audit(tx, me.id, "donation_claim_released", "donation_batch", b.id);
    tx.emit({ type: "donation", batchId: b.id, status: b.status });
    return b;
  });
}

// ---------------------------------------------------------------- onboarding + admin

export function createAccount(input: { name: string; phone?: string; email?: string; role: Role }) {
  return write((tx) => {
    if (input.role === "admin") throw new RuleError("forbidden", "Admin access is provisioned, not self-selected.", 403);
    if (!["customer", "vendor", "ngo"].includes(input.role)) throw new RuleError("role_invalid", "Choose Customer, Vendor or NGO.");
    if (!input.name || input.name.trim().length < 2) throw new RuleError("name_required", "Enter your name.");
    const p: Profile = { id: newId("u"), name: input.name.trim(), phone: input.phone, email: input.email, role: input.role, createdAt: iso(tx.now), demo: true };
    tx.db.profiles.push(p);
    return p;
  });
}

export function submitVendorApplication(actor: Profile | null, i: {
  businessName: string; contactName: string; phone: string; email: string; address: string; neighbourhood: string;
  lat: number; lng: number; fssaiNumber: string; operatingHours: string; payoutUpi: string; documents: string[]; payAtPickup: boolean;
  logoUrl?: string;
}) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    for (const [k, label] of [["businessName", "Business name"], ["contactName", "Contact name"], ["phone", "Phone"], ["address", "Address"], ["fssaiNumber", "FSSAI number"], ["operatingHours", "Operating hours"], ["payoutUpi", "Payout UPI"]] as const)
      if (!String(i[k] ?? "").trim()) throw new RuleError("field_required", `${label} is required.`);
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(i.payoutUpi.trim())) throw new RuleError("upi_invalid", "Enter a valid UPI ID, e.g. name@bank.");
    if (!Number.isFinite(Number(i.lat)) || !Number.isFinite(Number(i.lng))) throw new RuleError("pin_required", "Drop a map pin.");
    let v = tx.db.vendors.find((x) => x.ownerId === me.id);
    if (v && v.status === "Approved") throw new RuleError("already_approved", "Already approved.", 409);
    const base = {
      businessName: i.businessName.trim(), contactName: i.contactName.trim(), phone: i.phone.trim(), email: i.email.trim(),
      fssaiNumber: i.fssaiNumber.trim(), operatingHours: i.operatingHours.trim(), payoutUpi: i.payoutUpi.trim(), documents: i.documents || [],
    };
    if (i.logoUrl && !/^\/api\/uploads\/[\w.-]+$/.test(i.logoUrl)) throw new RuleError("logo_invalid", "Upload the logo as an image file.");
    if (i.logoUrl) Object.assign(base, { logoUrl: i.logoUrl });
    if (v) Object.assign(v, base, { status: "Pending" as ApprovalStatus, rejectionReason: undefined });
    else { v = { id: newId("v"), ownerId: me.id, ...base, status: "Pending", createdAt: iso(tx.now) }; tx.db.vendors.push(v); }
    const o = tx.db.outlets.find((x) => x.vendorId === v!.id);
    const od = { address: i.address.trim(), neighbourhood: i.neighbourhood, lat: Number(i.lat), lng: Number(i.lng), payAtPickup: !!i.payAtPickup };
    if (o) Object.assign(o, od); else tx.db.outlets.push({ id: newId("o"), vendorId: v.id, ...od });
    audit(tx, me.id, "vendor_application_submitted", "vendor", v.id);
    return v;
  });
}

export function submitNgoApplication(actor: Profile | null, i: Omit<Ngo, "id" | "ownerId" | "status" | "createdAt" | "rejectionReason">) {
  return write((tx) => {
    const me = requireRole(actor, "ngo");
    for (const [k, label] of [["orgName", "Organisation name"], ["contactPerson", "Contact person"], ["phone", "Phone"], ["address", "Address"], ["handlingArrangements", "Food handling arrangements"]] as const)
      if (!String(i[k] ?? "").trim()) throw new RuleError("field_required", `${label} is required.`);
    if (!i.registrationDocs?.length) throw new RuleError("docs_required", "Upload your registration document.");
    if (!(Number(i.capacityMeals) > 0)) throw new RuleError("capacity_required", "Enter collection capacity.");
    let n = tx.db.ngos.find((x) => x.ownerId === me.id);
    if (n && n.status === "Approved") throw new RuleError("already_approved", "Already approved.", 409);
    const data = { ...i, capacityMeals: Number(i.capacityMeals), serviceAreaKm: Number(i.serviceAreaKm) || 5, lat: Number(i.lat), lng: Number(i.lng) };
    if (n) Object.assign(n, data, { status: "Pending" as ApprovalStatus, rejectionReason: undefined });
    else { n = { id: newId("n"), ownerId: me.id, ...data, status: "Pending", createdAt: iso(tx.now) }; tx.db.ngos.push(n); }
    audit(tx, me.id, "ngo_application_submitted", "ngo", n.id);
    return n;
  });
}

export function setApproval(actor: Profile | null, kind: "vendor" | "ngo", id: string, status: "Approved" | "Rejected", reason?: string) {
  return write((tx) => {
    const me = requireRole(actor, "admin");
    if (status === "Rejected" && (!reason || reason.trim().length < 3)) throw new RuleError("reason_required", "Give a rejection reason.");
    const rec = kind === "vendor" ? tx.db.vendors.find((x) => x.id === id) : tx.db.ngos.find((x) => x.id === id);
    if (!rec) throw new RuleError("not_found", "Application not found.", 404);
    rec.status = status;
    rec.rejectionReason = status === "Rejected" ? reason!.trim() : undefined;
    notify(tx, rec.ownerId, `Your ${kind === "vendor" ? "vendor" : "NGO"} application was ${status.toLowerCase()}${status === "Rejected" ? `: ${reason!.trim()}` : ""} (demo approval, not a regulatory approval).`, "approval_decision", { kind, id, status });
    audit(tx, me.id, `${kind}_${status.toLowerCase()}`, kind, id, reason);
    tx.emit({ type: "impact" });
    return rec;
  });
}

/** Demo-only clock fast-forward so window-end and donation behaviour can be shown live. */
export function fastForward(actor: Profile | null, minutes: number) {
  return transaction((tx) => {
    requireRole(actor, "customer", "vendor", "ngo", "admin");
    if (process.env.DATA_MODE && process.env.DATA_MODE !== "demo") throw new RuleError("forbidden", "Only available in demo mode.", 403);
    const mins = Math.max(-1440, Math.min(1440, Math.round(minutes)));
    tx.db.clockOffsetMs = mins === 0 ? 0 : (tx.db.clockOffsetMs || 0) + mins * 60_000;
    tx.now = Date.now() + tx.db.clockOffsetMs;
    audit(tx, actor!.id, "demo_clock_changed", "clock", "demo", `${tx.db.clockOffsetMs / 60000} min offset`);
    sweepTx(tx);
    tx.emit({ type: "impact" });
    return tx.db.clockOffsetMs;
  });
}

export function markNotificationsRead(actor: Profile | null) {
  return transaction((tx) => {
    const me = requireRole(actor, "customer", "vendor", "ngo", "admin");
    for (const n of tx.db.notifications) if (n.userId === me.id) n.read = true;
  });
}

// ---------------------------------------------------------------- queries (read-only)

export const SURPRISE_HIDDEN = "Contents are a surprise: revealed at pickup. Allergens and diet are always shown.";

/** Customer-facing listing. Surprise Bag contents (description) stay hidden unless `reveal` (order picked up). */
export function enrichListing(db: DB, l: Listing, origin?: { lat: number; lng: number }, reveal = false) {
  const outlet = db.outlets.find((o) => o.id === l.outletId)!;
  const vendor = db.vendors.find((v) => v.id === l.vendorId)!;
  return {
    ...l,
    description: l.surpriseBag && !reveal ? SURPRISE_HIDDEN : l.description,
    surpriseWorth: l.surpriseBag ? l.originalPrice : undefined,
    outlet,
    vendor: {
      id: vendor.id, businessName: vendor.businessName, ratingDemo: vendor.ratingDemo,
      ratingAvg: vendor.ratingAvg, ratingCount: vendor.ratingCount ?? 0, verified: vendor.status === "Approved", logoUrl: vendor.logoUrl,
    },
    distanceKm: origin ? distanceKm(origin, outlet) : undefined,
  };
}
export type EnrichedListing = ReturnType<typeof enrichListing>;

export interface DiscoverFilters {
  lat: number; lng: number; radiusKm: number; q?: string; category?: string; diet?: string; maxPrice?: number; pickupAfter?: string; pickupBy?: string;
}
export function discover(f: DiscoverFilters) {
  const db = read();
  const n = clockNow(db);
  const q = (f.q || "").trim().toLowerCase();
  const origin = { lat: f.lat, lng: f.lng };
  return db.listings
    .filter((l) => isCustomerVisible(db, l, n))
    .map((l) => enrichListing(db, l, origin))
    .filter((l) => (l.distanceKm ?? 0) <= f.radiusKm)
    .filter((l) => !f.category || l.category === f.category)
    .filter((l) => !f.diet || l.diet === f.diet)
    .filter((l) => !f.maxPrice || l.rescuePrice <= f.maxPrice)
    .filter((l) => !f.pickupAfter || hm(l.windowEnd) > f.pickupAfter)
    .filter((l) => !f.pickupBy || hm(l.windowStart) <= f.pickupBy)
    .filter((l) => !q || l.title.toLowerCase().includes(q) || l.category.toLowerCase().includes(q) || l.vendor.businessName.toLowerCase().includes(q))
    .sort((a, b) => t(a.windowStart) - t(b.windowStart) || (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
/** Local IST HH:MM for filter comparison. */
export function hm(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
}

export function customerOrders(customerId: string) {
  const db = read();
  return db.reservations
    .filter((r) => r.customerId === customerId)
    .map((r) => {
      const l = db.listings.find((x) => x.id === r.listingId)!;
      return {
        ...r,
        listing: enrichListing(db, l, undefined, r.status === "Picked up"),
        payment: db.payments.find((p) => p.reservationId === r.id),
        review: db.reviews.find((x) => x.reservationId === r.id),
        cancel: cancelQuote(db, r, l),
        events: db.reservationEvents.filter((e) => e.reservationId === r.id),
      };
    })
    .sort((a, b) => t(b.createdAt) - t(a.createdAt));
}

export function impactSummary() {
  const db = read();
  const rescued = db.impact.filter((e) => e.source !== "expired");
  const sum = (src?: string) => rescued.filter((e) => !src || e.source === src).reduce((s, e) => s + e.units, 0);
  const n = clockNow(db);
  const byHood: Record<string, number> = {};
  for (const e of rescued) byHood[e.neighbourhood] = (byHood[e.neighbourhood] || 0) + e.units;
  return {
    totalUnits: sum(),
    customerUnits: sum("customer_pickup"),
    ngoUnits: sum("ngo_collection"),
    activeListings: db.listings.filter((l) => isCustomerVisible(db, l, n)).length,
    completedPickups: rescued.filter((e) => e.source === "customer_pickup").length,
    completedCollections: rescued.filter((e) => e.source === "ngo_collection").length,
    kgRescued: +rescued.reduce((s, e) => s + (e.kgEst ?? kgFor(e.units)), 0).toFixed(1),
    co2eAvoidedKg: +rescued.reduce((s, e) => s + (e.co2eKg ?? co2eFor(e.units)), 0).toFixed(1),
    wastedUnits: db.impact.filter((e) => e.source === "expired").reduce((s, e) => s + e.units, 0),
    approvedVendors: db.vendors.filter((v) => v.status === "Approved").length,
    approvedNgos: db.ngos.filter((x) => x.status === "Approved").length,
    byHood: Object.entries(byHood).sort((a, b) => b[1] - a[1]),
    recent: [...rescued].sort((a, b) => t(b.at) - t(a.at)).slice(0, 8).map((e) => ({
      ...e,
      vendor: db.vendors.find((v) => v.id === e.vendorId)?.businessName ?? "",
      ngo: e.source === "ngo_collection" ? db.ngos.find((x) => x.id === db.donationBatches.find((b) => b.id === e.refId)?.claimedByNgoId)?.orgName : undefined,
    })),
  };
}

export function settleRefund(refundId: string) {
  return write((tx) => {
    const rf = tx.db.refunds.find((x) => x.id === refundId);
    if (!rf || rf.status === "Refunded") return rf;
    rf.status = "Refunded";
    const p = tx.db.payments.find((x) => x.id === rf.paymentId);
    if (p) { p.status = "Refunded"; p.updatedAt = iso(tx.now); }
    return rf;
  });
}
