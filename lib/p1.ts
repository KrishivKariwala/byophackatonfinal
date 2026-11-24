import "server-only";
import { read, now as clockNow } from "./store";
import { RULES, RuleError } from "./rules";
import { newId } from "./crypto";
import { write, completedPickups } from "./services";
import { audit, emitRes, iso, listingIn, move, notifyT, notifyOutletT, requireRole, setResStatus, t } from "./core";
import { cancellationOutcome } from "./cancel";
import { cfg } from "./p2/settings";
import { restoreCreditTx } from "./p2/credits";
import { IMPACT, co2eFor, kgFor } from "./impact-config";
import { refundRazorpayPayment, razorpayConfigured } from "./payments";
import type { DB, Payment, Profile, Report, ReportReason, ReportTarget, Review, Vendor } from "./types";

/** P1 customer-side features: follows, push tokens, reviews, cancellation + refunds, reports, impact profile. */

// ---------------------------------------------------------------- push tokens
export function registerPushToken(actor: Profile | null, i: { token: string; platform: "ios" | "android" | "web"; deviceId: string }) {
  return write((tx) => {
    const me = requireRole(actor, "customer", "vendor", "ngo", "admin");
    if (!i.token || i.token.length > 300) throw new RuleError("token_invalid", "Invalid push token.");
    if (!["ios", "android", "web"].includes(i.platform)) throw new RuleError("platform_invalid", "Unknown platform.");
    if (i.platform !== "web" && !/^Expo(nent)?PushToken\[[^\]]+\]$/.test(i.token)) throw new RuleError("token_invalid", "Not an Expo push token.", 400, undefined, "token_invalid_not_expo_push");
    if (!i.deviceId || i.deviceId.length > 100) throw new RuleError("device_required", "Device id required.");
    const ex = tx.db.pushTokens.find((p) => p.userId === me.id && p.deviceId === i.deviceId);
    if (ex) ex.token = i.token;
    else tx.db.pushTokens.push({ id: newId("pt"), userId: me.id, token: i.token, platform: i.platform, deviceId: i.deviceId, createdAt: iso(tx.now) });
    return { registered: true };
  });
}
export function removePushToken(actor: Profile | null, deviceId: string) {
  return write((tx) => {
    const me = requireRole(actor, "customer", "vendor", "ngo", "admin");
    tx.db.pushTokens = tx.db.pushTokens.filter((p) => !(p.userId === me.id && p.deviceId === deviceId));
    return { removed: true };
  });
}

// ---------------------------------------------------------------- follows
export function followVendor(actor: Profile | null, vendorId: string, loc?: { lat?: number; lng?: number }) {
  return write((tx) => {
    const me = requireRole(actor, "customer");
    const v = tx.db.vendors.find((x) => x.id === vendorId && x.status === "Approved");
    if (!v) throw new RuleError("not_found", "Vendor not found.", 404, undefined, "not_found_vendor_not_found");
    const lat = Number(loc?.lat), lng = Number(loc?.lng);
    const has = Number.isFinite(lat) && Number.isFinite(lng) && loc?.lat !== undefined;
    const ex = tx.db.follows.find((f) => f.customerId === me.id && f.vendorId === vendorId);
    if (ex) { if (has) { ex.lat = lat; ex.lng = lng; } return ex; }
    const f = { id: newId("f"), customerId: me.id, vendorId, lat: has ? lat : undefined, lng: has ? lng : undefined, createdAt: iso(tx.now) };
    tx.db.follows.push(f);
    return f;
  });
}
export function unfollowVendor(actor: Profile | null, vendorId: string) {
  return write((tx) => {
    const me = requireRole(actor, "customer");
    tx.db.follows = tx.db.follows.filter((f) => !(f.customerId === me.id && f.vendorId === vendorId));
    return { following: false };
  });
}
export function followingList(customerId: string) {
  const db = read();
  const n = clockNow(db);
  return db.follows.filter((f) => f.customerId === customerId).map((f) => {
    const v = db.vendors.find((x) => x.id === f.vendorId)!;
    const o = db.outlets.find((x) => x.vendorId === v.id);
    const live = db.listings.filter((l) => l.vendorId === v.id && l.status === "Live" && l.qtyAvailable > 0 && t(l.windowEnd) > n && !l.donationOnly && !l.hiddenByAdmin).length;
    return { vendorId: v.id, businessName: v.businessName, neighbourhood: o?.neighbourhood ?? "", ratingAvg: v.ratingAvg, ratingCount: v.ratingCount ?? 0, verified: v.status === "Approved", liveListings: live };
  });
}
export function isFollowing(customerId: string, vendorId: string) {
  return read().follows.some((f) => f.customerId === customerId && f.vendorId === vendorId);
}

// ---------------------------------------------------------------- reviews
export function recomputeVendorRating(db: DB, vendorId: string) {
  const rs = db.reviews.filter((r) => r.vendorId === vendorId && !r.hidden); // reviews hidden by moderation never count
  const v = db.vendors.find((x) => x.id === vendorId);
  if (!v) return;
  v.ratingCount = rs.length;
  v.ratingAvg = rs.length ? +(rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(2) : undefined;
}

/** Pure: flagged for admin review when the average is below 3.0 with at least 20 ratings. */
export function isLowRated(avg: number | undefined, count: number | undefined): boolean {
  return avg !== undefined && (count ?? 0) >= RULES.FLAG_MIN_RATINGS && avg < RULES.FLAG_RATING_BELOW;
}

export function submitReview(actor: Profile | null, i: { reservationId: string; rating: number; text?: string }) {
  return write((tx): Review => {
    const me = requireRole(actor, "customer");
    const r = tx.db.reservations.find((x) => x.id === i.reservationId && x.customerId === me.id);
    if (!r) throw new RuleError("not_found", "Order not found.", 404, undefined, "not_found_order_not_found2");
    if (r.status !== "Picked up" || !r.pickedUpAt) throw new RuleError("not_picked_up", "You can rate an order after you've picked it up.", 409);
    if (tx.now > t(r.pickedUpAt) + RULES.REVIEW_WINDOW_HOURS * 3600_000) throw new RuleError("review_window_closed", "The 48-hour rating window has closed.", 409);
    if (tx.db.reviews.some((x) => x.reservationId === r.id)) throw new RuleError("already_reviewed", "You've already rated this order.", 409);
    const rating = Number(i.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new RuleError("rating_invalid", "Choose 1 to 5 stars.");
    const text = (i.text ?? "").trim();
    if (text.length > 1000) throw new RuleError("text_too_long", "Keep your review under 1000 characters.");
    const rv: Review = { id: newId("rv"), reservationId: r.id, customerId: me.id, vendorId: r.vendorId, rating, text: text || undefined, createdAt: iso(tx.now) };
    tx.db.reviews.push(rv);
    recomputeVendorRating(tx.db, r.vendorId);
    const v = tx.db.vendors.find((x) => x.id === r.vendorId)!;
    notifyT(tx, v.ownerId, "newRating", { rating, ref: r.ref }, "generic", { reservationId: r.id });
    return rv;
  });
}

export function vendorReviews(vendorId: string) {
  const db = read();
  return db.reviews.filter((r) => r.vendorId === vendorId && !r.hidden).sort((a, b) => t(b.createdAt) - t(a.createdAt)).slice(0, 20).map((r) => ({
    id: r.id, rating: r.rating, text: r.text, createdAt: r.createdAt,
    reviewer: (db.profiles.find((p) => p.id === r.customerId)?.name ?? "Customer").split(" ")[0],
  }));
}

// ---------------------------------------------------------------- cancellation + refunds
export interface CancelResult { reservationId: string; free: boolean; refundId?: string; refundAmount: number; gatewayPaymentId?: string; gateway?: Payment["gateway"] }

/** Issues a refund row for a captured online payment. Demo adapter settles immediately; Razorpay test mode stays pending until the API call succeeds. */
export function issueRefundTx(tx: import("./store").TxContext, p: Payment, reason: string): { id: string; settled: boolean } {
  const settled = p.gateway === "demo";
  p.status = settled ? "Refunded" : "Refund Pending";
  p.updatedAt = iso(tx.now);
  const rf = { id: newId("rf"), paymentId: p.id, amount: p.amount, reason, status: settled ? ("Refunded" as const) : ("Refund Pending" as const), createdAt: iso(tx.now) };
  tx.db.refunds.push(rf);
  return { id: rf.id, settled };
}

export function cancelReservation(actor: Profile | null, reservationId: string) {
  return write((tx): CancelResult => {
    const me = requireRole(actor, "customer");
    const { db, now } = tx;
    const r = db.reservations.find((x) => x.id === reservationId && x.customerId === me.id);
    if (!r) throw new RuleError("not_found", "Order not found.", 404, undefined, "not_found_order_not_found2");
    if (r.status !== "Reserved" && r.status !== "Ready") throw new RuleError("bad_transition", `This order is ${r.status.toLowerCase()} and can't be cancelled.`, 409, { status: r.status.toLowerCase(), statusKey: `status.${r.status}` }, "bad_transition_order_cancel");
    const l = listingIn(db, r.listingId);
    const p = db.payments.find((x) => x.reservationId === r.id);
    const paidOnline = p?.status === "Test Payment Successful";
    const out = cancellationOutcome({ nowMs: now, windowStartMs: t(l.windowStart), by: "customer", paidOnline, freeMinutes: cfg(tx.db).freeCancelMinutes });
    setResStatus(tx, r, "Cancelled", me.id, out.free ? "customer cancelled (free)" : "late customer cancellation (no refund)");
    r.cancelledAt = iso(now);
    r.cancelledBy = "customer";
    r.cancelReason = out.free ? "Cancelled by customer" : "Late cancellation by customer (no refund)";
    // Units go back to stock in the same transaction, while the listing can still sell them.
    if (["Live", "Sold Out", "Paused"].includes(l.status) && now < t(l.windowEnd)) move(tx, l, r.qty, "customer_cancel", r.id);
    let refund: { id: string; settled: boolean } | undefined;
    if (out.refund && p) refund = issueRefundTx(tx, p, "Customer cancellation");
    const credit = out.free ? restoreCreditTx(tx, me.id, [r.id, r.holdId], "order cancelled") : 0; // a late cancellation forfeits credit like it forfeits cash
    const refundCash = refund && p ? p.amount : 0;
    const vendor = db.vendors.find((v) => v.id === r.vendorId)!;
    notifyOutletT(tx, vendor, r.outletId, "cancelledByCustomer", { ref: r.ref }, "order_cancelled", { reservationId: r.id });
    notifyT(tx, me.id, out.free ? `cancelledFree${refund ? "Refund" : ""}${credit ? "Credit" : ""}` : "cancelledLate", { ref: r.ref, refund: refundCash, credit }, "order_cancelled", { reservationId: r.id });
    if (refund) notifyT(tx, me.id, "refundIssued", { amount: refundCash, ref: r.ref }, "refund_issued", { reservationId: r.id, amount: refundCash });
    audit(tx, me.id, "reservation_cancelled", "reservation", r.id, out.free ? "free" : "late, no refund");
    emitRes(tx, r);
    return { reservationId: r.id, free: out.free, refundId: refund?.id, refundAmount: refundCash, gatewayPaymentId: p?.gatewayPaymentId, gateway: p?.gateway };
  });
}

/** For Razorpay test mode: call the refund API after the cancel transaction, then settle. Failures stay "Refund Pending". */
export async function executeRefund(out: Pick<CancelResult, "refundId" | "refundAmount" | "gateway" | "gatewayPaymentId">) {
  if (!out.refundId || out.gateway !== "razorpay_test" || !out.gatewayPaymentId || !razorpayConfigured()) return;
  try {
    await refundRazorpayPayment(out.gatewayPaymentId, out.refundAmount);
    const { settleRefund } = await import("./services");
    await settleRefund(out.refundId);
  } catch (e) {
    console.error("refund failed; left as Refund Pending", e);
  }
}

// ---------------------------------------------------------------- reports
export const REPORT_REASONS: ReportReason[] = ["food_safety", "wrong_item", "rude_behaviour", "other"];

export function createReport(actor: Profile | null, i: { targetType: ReportTarget; targetId: string; reason: ReportReason; text?: string; photoUrl?: string }) {
  return write((tx): Report => {
    const me = requireRole(actor, "customer");
    if (!REPORT_REASONS.includes(i.reason)) throw new RuleError("reason_invalid", "Choose a reason.");
    if (!["reservation", "listing", "vendor"].includes(i.targetType)) throw new RuleError("target_invalid", "Unknown report target.");
    const exists =
      i.targetType === "reservation" ? tx.db.reservations.some((r) => r.id === i.targetId && r.customerId === me.id)
      : i.targetType === "listing" ? tx.db.listings.some((l) => l.id === i.targetId)
      : tx.db.vendors.some((v) => v.id === i.targetId);
    if (!exists) throw new RuleError("not_found", "We couldn't find what you're reporting.", 404, undefined, "not_found_we_couldn_t");
    const text = (i.text ?? "").trim();
    if (text.length > 2000) throw new RuleError("text_too_long", "Keep the details under 2000 characters.", 400, undefined, "text_too_long_keep_details_under");
    if (i.photoUrl && !/^\/api\/uploads\/[\w.-]+$/.test(i.photoUrl)) throw new RuleError("photo_invalid", "Invalid photo.");
    const dup = tx.db.reports.some((r) => r.reporterId === me.id && r.targetType === i.targetType && r.targetId === i.targetId && r.status === "Open");
    if (dup) throw new RuleError("already_reported", "You've already reported this; we're looking into it.", 409);
    const rep: Report = { id: newId("rp"), reporterId: me.id, targetType: i.targetType, targetId: i.targetId, reason: i.reason, text: text || undefined, photoUrl: i.photoUrl, status: "Open", createdAt: iso(tx.now) };
    tx.db.reports.push(rep);
    audit(tx, me.id, "report_created", "report", rep.id, `${i.targetType}:${i.targetId} ${i.reason}`);
    for (const a of tx.db.profiles.filter((p) => p.role === "admin")) notifyT(tx, a.id, "newReport", { reason: i.reason.replace("_", " "), reasonKey: `report.reason.${i.reason}` }, "report_update", { reportId: rep.id });
    return rep;
  });
}

// ---------------------------------------------------------------- impact profile (FR-8.2)
export const BADGES = [
  { id: "first_rescue", label: "First rescue", hint: "Pick up your first order", test: (m: ImpactStats) => m.orders >= 1 },
  { id: "five_rescues", label: "Plate Saver", hint: "5 rescues", test: (m: ImpactStats) => m.orders >= 5 },
  { id: "ten_rescues", label: "Food Hero", hint: "10 rescues", test: (m: ImpactStats) => m.orders >= 10 },
  { id: "streak_2", label: "On a roll", hint: "Rescue in 2 weeks in a row", test: (m: ImpactStats) => m.bestStreakWeeks >= 2 },
  { id: "saved_500", label: "₹500 saved", hint: "Save ₹500 vs. original prices", test: (m: ImpactStats) => m.rupeesSaved >= 500 },
] as const;
interface ImpactStats { orders: number; meals: number; rupeesSaved: number; bestStreakWeeks: number }

const WEEK = 7 * 24 * 3600_000;
const IST = 5.5 * 3600_000;
const weekIndex = (ms: number) => Math.floor((ms + IST) / WEEK);

/** Pure: current and best streak of consecutive calendar weeks with at least one rescue. */
export function weeklyStreaks(pickupMs: number[], nowMs: number) {
  const weeks = [...new Set(pickupMs.map(weekIndex))].sort((a, b) => a - b);
  let best = 0, run = 0, prev = -999;
  for (const w of weeks) { run = w === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = w; }
  const cur = weekIndex(nowMs);
  let current = 0;
  const set = new Set(weeks);
  let w = set.has(cur) ? cur : set.has(cur - 1) ? cur - 1 : -999;
  while (set.has(w)) { current++; w--; }
  return { current, best };
}

export function customerImpact(customerId: string) {
  const db = read();
  const picked = db.reservations.filter((r) => r.customerId === customerId && r.status === "Picked up");
  const meals = picked.reduce((s, r) => s + r.qty, 0);
  const rupeesSaved = picked.reduce((s, r) => s + Math.max(0, (db.listings.find((l) => l.id === r.listingId)?.originalPrice ?? r.unitPrice) - r.unitPrice) * r.qty, 0);
  const streak = weeklyStreaks(picked.map((r) => t(r.pickedUpAt ?? r.createdAt)), clockNow(db));
  const stats: ImpactStats = { orders: picked.length, meals, rupeesSaved, bestStreakWeeks: streak.best };
  return {
    meals, orders: picked.length, rupeesSaved, kgFood: kgFor(meals), co2eKg: co2eFor(meals),
    streakWeeks: streak.current, bestStreakWeeks: streak.best,
    badges: BADGES.map((b) => ({ id: b.id, label: b.label, hint: b.hint, earned: b.test(stats) })),
    constants: { kgPerMeal: IMPACT.KG_PER_MEAL, co2ePerKg: IMPACT.CO2E_PER_KG_FOOD },
    payAtPickup: { completed: completedPickups(db, customerId), needed: RULES.PAY_AT_PICKUP_MIN_PICKUPS },
  };
}

// ---------------------------------------------------------------- shared queries
export function vendorFlags(db: DB, v: Vendor) {
  const reportCount = db.reports.filter((r) => r.status === "Open" && (
    (r.targetType === "vendor" && r.targetId === v.id) ||
    (r.targetType === "listing" && db.listings.find((l) => l.id === r.targetId)?.vendorId === v.id) ||
    (r.targetType === "reservation" && db.reservations.find((x) => x.id === r.targetId)?.vendorId === v.id))).length;
  return { lowRating: isLowRated(v.ratingAvg, v.ratingCount), openReports: reportCount, repeatedReports: reportCount >= 2 };
}
