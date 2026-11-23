import { beforeEach, describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const tmp = path.join(os.tmpdir(), `sap-p1-test-${process.pid}.json`);
process.env.DEMO_DB_PATH = tmp;

const store = await import("@/lib/store");
const svc = await import("@/lib/services");
const p1 = await import("@/lib/p1");
const vend = await import("@/lib/vendor");
const charity = await import("@/lib/charity");
const admin = await import("@/lib/admin");
const { suggestedDiscount, suggestedPrice, suggestPrice, sellThroughRate } = await import("@/lib/pricing");
const { cancellationOutcome } = await import("@/lib/cancel");
const { co2eFor, kgFor, IMPACT } = await import("@/lib/impact-config");
const { vendorAnalytics, vendorPayouts } = await import("@/lib/analytics");
const { rateLimit, resetRateLimits } = await import("@/lib/ratelimit");
const { buildSeed } = await import("@/lib/seed");
import type { Profile } from "@/lib/types";

const P = (id: string) => store.read().profiles.find((p) => p.id === id)! as Profile;
const iso = (ms: number) => new Date(ms).toISOString();
const min = (n: number) => n * 60_000;

async function freshListing(o: Partial<{ qty: number; startMin: number; endMin: number; donateRest: boolean; vendor: string; surprise: boolean; donationOnly: boolean; riskTag: "raw"; category: "Bakery" | "Meals" }> = {}) {
  const n = store.now();
  return svc.createListing(P(o.vendor ?? "u_ravi"), {
    title: "Test Box", category: o.category ?? "Bakery", diet: "Vegetarian", originalPrice: 200, rescuePrice: 100, qty: o.qty ?? 10,
    preparedAt: iso(n - min(30)), windowStart: iso(n + min(o.startMin ?? 60)), windowEnd: iso(n + min(o.endMin ?? 120)),
    donateRest: o.donateRest ?? false, safetyDeclaration: true, surpriseBag: o.surprise, donationOnly: o.donationOnly, riskTag: o.riskTag,
  });
}
/** Fresh customer with the 3 completed pickups that unlock pay-at-pickup (fixture only). */
async function customer(i = 0, history = 3) {
  const c = await svc.createAccount({ name: `Tester ${i} Last`, phone: `+91911100${String(i).padStart(4, "0")}`, role: "customer" });
  await store.transaction((tx) => {
    for (let k = 0; k < history; k++)
      tx.db.reservations.push({
        id: `hist_${c.id}_${k}`, ref: `H-${c.id}-${k}`, listingId: "l_3", vendorId: "v_1", outletId: "o_1", customerId: c.id, qty: 1, unitPrice: 90, amount: 90, method: "online",
        status: "Picked up", qrToken: "x", code: "0000", qrTokenHash: `h${c.id}${k}`, codeHash: `c${c.id}${k}`, createdAt: iso(tx.now - 86400_000 * (k + 2)), pickedUpAt: iso(tx.now - 86400_000 * (k + 2)),
      });
  });
  return c;
}
async function onlineOrder(c: Profile, listingId: string, qty = 1) {
  const h = await svc.reserve(c, { listingId, qty, method: "online" });
  if (h.kind !== "hold") throw new Error("expected hold");
  const out = await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: `pay_${h.holdId}`, eventId: `evt_${h.holdId}` });
  if (out.outcome !== "confirmed") throw new Error("not confirmed");
  return store.read().reservations.find((r) => r.id === out.reservationId)!;
}
const ff = (m: number) => svc.fastForward(P("u_admin"), m);

beforeEach(async () => {
  if (fs.existsSync(tmp)) fs.rmSync(tmp);
  resetRateLimits();
  await store.resetStore(buildSeed(Date.now()));
});

// ---------------------------------------------------------------- unit tests
describe("dynamic price suggestion (FR-2.3)", () => {
  it("matches the brief's example: ₹200, 2 h left, s = 0.5 → d = 0.65, ₹70", () => {
    expect(suggestedDiscount(2, 0.5)).toBeCloseTo(0.65, 5);
    expect(suggestPrice({ original: 200, hoursLeft: 2, sellThrough: 0.5 }).price).toBe(70);
  });
  it("uses s = 0.5 when there is no history", () => {
    expect(suggestedDiscount(2, null)).toBe(suggestedDiscount(2, 0.5));
    expect(suggestedDiscount(2, undefined)).toBe(suggestedDiscount(2, 0.5));
  });
  it("is capped at 0.8 and floors the time term at h = 4", () => {
    expect(suggestedDiscount(0, 0)).toBe(0.8);
    expect(suggestedDiscount(10, 1)).toBeCloseTo(0.4, 5);
    expect(suggestedDiscount(4, 1)).toBeCloseTo(0.4, 5);
    expect(suggestedDiscount(1, 0)).toBeCloseTo(0.8, 5);
  });
  it("rounds to the nearest ₹5 and never breaks the 30% minimum", () => {
    expect(suggestedPrice(200, 0.65)).toBe(70);
    expect(suggestedPrice(333, 0.5)).toBe(165);
    for (const o of [13, 19, 37, 101, 999]) for (const d of [0.4, 0.55, 0.8]) expect(suggestedPrice(o, d)).toBeLessThanOrEqual(Math.floor(o * 0.7));
    expect(suggestedPrice(13, 0.4)).toBe(9); // would round to 10, capped at floor(13 × 0.7) = 9
  });
  it("sell-through counts only this vendor's similar listings from the last 7 days", () => {
    const now = Date.now();
    const L = (id: string, v: string, cat: string, daysAgo: number, qty = 10) => ({ id, vendorId: v, category: cat, qtyTotal: qty, windowEnd: iso(now - daysAgo * 86400_000), status: "Expired" });
    const ls = [L("a", "v", "Bakery", 1), L("b", "v", "Bakery", 3), L("c", "v", "Bakery", 9), L("d", "v", "Meals", 1), L("e", "w", "Bakery", 1)];
    const rs = [{ listingId: "a", qty: 5, status: "Picked up" }, { listingId: "b", qty: 3, status: "Picked up" }, { listingId: "b", qty: 2, status: "Cancelled" }, { listingId: "c", qty: 10, status: "Picked up" }, { listingId: "d", qty: 10, status: "Picked up" }];
    expect(sellThroughRate(ls, rs, "v", "Bakery", now)).toBeCloseTo(8 / 20, 5);
    expect(sellThroughRate(ls, rs, "v", "Desserts", now)).toBeNull();
  });
  it("price suggestion endpoint logic works for a new listing", async () => {
    const out = vend.priceSuggestion(P("u_ravi"), { original: 200, category: "Bakery", hoursLeft: 2 });
    expect(out.price).toBeGreaterThan(0);
    expect(out.price).toBeLessThanOrEqual(140);
  });
});

describe("cancellation refund rules (FR-4.7)", () => {
  const start = 10_000_000_000;
  it("customer: free until 30 minutes before pickup start, refunded when paid online", () => {
    expect(cancellationOutcome({ nowMs: start - min(31), windowStartMs: start, by: "customer", paidOnline: true })).toMatchObject({ free: true, refund: true });
    expect(cancellationOutcome({ nowMs: start - min(30), windowStartMs: start, by: "customer", paidOnline: true })).toMatchObject({ free: true, refund: true });
    expect(cancellationOutcome({ nowMs: start - min(29), windowStartMs: start, by: "customer", paidOnline: true })).toMatchObject({ free: false, refund: false });
    expect(cancellationOutcome({ nowMs: start + min(10), windowStartMs: start, by: "customer", paidOnline: true }).refund).toBe(false);
  });
  it("pay-at-pickup has nothing to refund", () => {
    expect(cancellationOutcome({ nowMs: start - min(90), windowStartMs: start, by: "customer", paidOnline: false })).toMatchObject({ free: true, refund: false });
  });
  it("vendor / admin cancellations always refund, even late", () => {
    expect(cancellationOutcome({ nowMs: start + min(5), windowStartMs: start, by: "vendor", paidOnline: true })).toMatchObject({ free: true, refund: true });
  });
});

describe("impact maths", () => {
  it("1 meal ≈ 0.4 kg food, 2.5 kg CO2e per kg", () => {
    expect(IMPACT.KG_PER_MEAL).toBe(0.4);
    expect(IMPACT.CO2E_PER_KG_FOOD).toBe(2.5);
    expect(kgFor(10)).toBe(4);
    expect(co2eFor(10)).toBe(10);
    expect(co2eFor(1)).toBe(1);
  });
  it("weekly streaks", () => {
    const day = 86400_000;
    const now = Date.UTC(2026, 10, 25, 6);
    const s = p1.weeklyStreaks([now, now - 7 * day, now - 14 * day, now - 40 * day], now);
    expect(s).toEqual({ current: 3, best: 3 });
    expect(p1.weeklyStreaks([now - 20 * day], now).current).toBe(0);
  });
});

describe("rating aggregate and flags (FR-9.1, FR-9.3)", () => {
  it("one rating per picked-up order, 1-5 stars, aggregate maintained, 48 h window", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65 });
    const c = await customer(1);
    const r = await onlineOrder(c, l.id);
    await expect(p1.submitReview(c, { reservationId: r.id, rating: 5 })).rejects.toMatchObject({ code: "not_picked_up" });
    await ff(10);
    await svc.handover(P("u_ravi"), { code: r.code });
    await expect(p1.submitReview(c, { reservationId: r.id, rating: 6 })).rejects.toMatchObject({ code: "rating_invalid" });
    const before = store.read().vendors.find((v) => v.id === "v_1")!;
    const [n0, a0] = [before.ratingCount ?? 0, before.ratingAvg ?? 0];
    await p1.submitReview(c, { reservationId: r.id, rating: 2, text: "meh" });
    await expect(p1.submitReview(c, { reservationId: r.id, rating: 5 })).rejects.toMatchObject({ code: "already_reviewed" });
    const v = store.read().vendors.find((x) => x.id === "v_1")!;
    expect(v.ratingCount).toBe(n0 + 1);
    expect(v.ratingAvg).toBeCloseTo((a0 * n0 + 2) / (n0 + 1), 1);
    expect(store.read().reviews.filter((x) => x.reservationId === r.id)).toHaveLength(1);
  });
  it("closes after 48 hours", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65 });
    const c = await customer(2);
    const r = await onlineOrder(c, l.id);
    await ff(10);
    await svc.handover(P("u_ravi"), { code: r.code });
    await ff(1000); await ff(1000); // +33 h
    await ff(1000); // beyond 48 h from pickup
    await expect(p1.submitReview(c, { reservationId: r.id, rating: 4 })).rejects.toMatchObject({ code: "review_window_closed" });
  });
  it("flags below 3.0 with at least 20 ratings only", () => {
    expect(p1.isLowRated(2.9, 20)).toBe(true);
    expect(p1.isLowRated(2.9, 19)).toBe(false);
    expect(p1.isLowRated(3.0, 50)).toBe(false);
    expect(p1.isLowRated(undefined, 50)).toBe(false);
  });
  it("the seeded low-rated vendor appears in the admin flagged list", () => {
    expect(admin.flaggedLists().vendors.some((v) => v.id === "v_8" && v.reasons.some((r) => r.startsWith("Rating")))).toBe(true);
  });
});

describe("no-shows and suspension (FR-5.4)", () => {
  async function noShowOnce(c: Profile, donate = true) {
    const l = await freshListing({ startMin: 5, endMin: 65, donateRest: donate });
    const r = await svc.reserve(c, { listingId: l.id, qty: 2, method: "pay_at_pickup" });
    if (r.kind !== "reservation") throw new Error();
    return { l, resId: r.reservationId };
  }
  it("not scanned 15 minutes after pickup end becomes no-show; units are offered to charity", async () => {
    const c = await customer(3);
    const { l, resId } = await noShowOnce(c);
    await ff(65 + 14);
    expect(store.read().reservations.find((r) => r.id === resId)!.status).toBe("Reserved");
    await ff(2);
    const db = store.read();
    expect(db.reservations.find((r) => r.id === resId)!.status).toBe("No-show");
    const batch = db.donationBatches.find((b) => b.listingId === l.id && b.origin === "no_show");
    expect(batch?.qty).toBe(2);
    expect(batch?.status).toBe("Open");
    expect(db.reservationEvents.filter((e) => e.reservationId === resId).map((e) => e.to)).toEqual(["Reserved", "No-show"]);
  });
  it("3 no-shows in 30 days suspend reservations for 7 days; 2 do not", async () => {
    const c = await customer(4);
    await noShowOnce(c); await noShowOnce(c);
    await ff(65 + 20);
    expect(P(c.id).suspendedUntil).toBeUndefined();
    await expect(svc.reserve(c, { listingId: (await freshListing()).id, qty: 1, method: "online" })).resolves.toBeTruthy();
    // a third no-show
    const c2 = c;
    await store.transaction((tx) => { for (const h of tx.db.holds.filter((x) => x.customerId === c2.id)) h.status = "Released"; });
    const { resId } = await noShowOnce(c);
    await ff(65 + 20);
    expect(store.read().reservations.find((r) => r.id === resId)!.status).toBe("No-show");
    const p = P(c.id);
    expect(p.suspendedUntil).toBeTruthy();
    const days = (Date.parse(p.suspendedUntil!) - store.now()) / 86400_000;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThanOrEqual(7);
    await expect(svc.reserve(c, { listingId: (await freshListing()).id, qty: 1, method: "online" })).rejects.toMatchObject({ code: "suspended" });
    expect(store.read().notifications.some((n) => n.userId === c.id && n.type === "suspension")).toBe(true);
    expect(admin.flaggedLists().customers.some((x) => x.id === c.id && x.suspendedUntil)).toBe(true);
  });
});

// ---------------------------------------------------------------- integration tests
describe("integration: concurrency, cancellation, access control", () => {
  it("50 simultaneous reservations on a 10-unit listing give exactly 10 confirmed", async () => {
    const l = await freshListing({ qty: 10 });
    const cs: Profile[] = [];
    for (let i = 0; i < 50; i++) cs.push(await customer(100 + i));
    const results = await Promise.allSettled(cs.map((c) => svc.reserve(c, { listingId: l.id, qty: 1, method: "pay_at_pickup" })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
    const db = store.read();
    expect(db.reservations.filter((r) => r.listingId === l.id && r.status === "Reserved")).toHaveLength(10);
    expect(db.listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(0);
  });

  it("cancellation returns stock atomically and refunds online payments (free window)", async () => {
    const l = await freshListing({ qty: 5, startMin: 120, endMin: 200 });
    const c = await customer(5);
    const r = await onlineOrder(c, l.id, 2);
    expect(store.read().listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(3);
    const out = await p1.cancelReservation(c, r.id);
    expect(out).toMatchObject({ free: true, refundAmount: 200 });
    const db = store.read();
    expect(db.listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(5);
    expect(db.reservations.find((x) => x.id === r.id)).toMatchObject({ status: "Cancelled", cancelledBy: "customer" });
    expect(db.payments.find((p) => p.reservationId === r.id)!.status).toBe("Refunded");
    expect(db.refunds.some((x) => x.paymentId === db.payments.find((p) => p.reservationId === r.id)!.id && x.amount === 200)).toBe(true);
    expect(db.notifications.some((n) => n.userId === c.id && n.type === "refund_issued")).toBe(true);
    await expect(p1.cancelReservation(c, r.id)).rejects.toMatchObject({ code: "bad_transition" });
  });

  it("late cancellation (inside 30 minutes of pickup start) frees stock but gives no refund", async () => {
    const l = await freshListing({ qty: 5, startMin: 60, endMin: 120 });
    const c = await customer(6);
    const r = await onlineOrder(c, l.id, 1);
    await ff(40); // 20 minutes before pickup starts
    const out = await p1.cancelReservation(c, r.id);
    expect(out).toMatchObject({ free: false, refundAmount: 0 });
    const db = store.read();
    expect(db.listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(5);
    expect(db.payments.find((p) => p.reservationId === r.id)!.status).toBe("Test Payment Successful");
    expect(db.refunds).toHaveLength(0);
  });

  it("vendor cancellation always refunds in full, even inside the 30-minute window", async () => {
    const l = await freshListing({ qty: 5, startMin: 60, endMin: 120 });
    const c = await customer(7);
    const r = await onlineOrder(c, l.id, 1);
    await ff(50);
    const out = await svc.cancelListing(P("u_ravi"), l.id, "Oven failure");
    expect(out.refunds).toBe(1);
    expect(store.read().payments.find((p) => p.reservationId === r.id)!.status).toBe("Refunded");
  });

  it("every reservation state change is logged with a timestamp", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65 });
    const c = await customer(8);
    const r = await onlineOrder(c, l.id);
    await svc.markReady(P("u_ravi"), r.id);
    await ff(10);
    await svc.handover(P("u_ravi"), { code: r.code });
    const ev = store.read().reservationEvents.filter((e) => e.reservationId === r.id);
    expect(ev.map((e) => e.to)).toEqual(["Reserved", "Ready", "Picked up"]);
    expect(ev.every((e) => !Number.isNaN(Date.parse(e.at)))).toBe(true);
  });

  it("access control: vendors and customers only reach their own orders (the service-level equivalent of RLS)", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65 });
    const a = await customer(9), b = await customer(10);
    const r = await onlineOrder(a, l.id);
    // another vendor cannot read or act on this order
    await expect(svc.markReady(P("u_vendor2"), r.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(svc.handover(P("u_vendor2"), { code: r.code })).rejects.toBeTruthy();
    expect(vendorAnalytics(store.read(), "v_2", 90, store.now()).orders).toBeLessThanOrEqual(vendorAnalytics(store.read(), "v_1", 90, store.now()).orders + 100);
    expect(vendorPayouts(store.read(), "v_2").rows.every((row) => row.orders >= 0)).toBe(true);
    // another customer cannot cancel, rate or report someone else's reservation
    await expect(p1.cancelReservation(b, r.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(p1.submitReview(b, { reservationId: r.id, rating: 5 })).rejects.toMatchObject({ code: "not_found" });
    await expect(p1.createReport(b, { targetType: "reservation", targetId: r.id, reason: "other" })).rejects.toMatchObject({ code: "not_found" });
    // customers cannot use vendor/admin actions
    await expect(vend.updateVendorSettings(a, { payAtPickup: true })).rejects.toMatchObject({ code: "forbidden" });
    await expect(admin.actOnReport(a, "rp_1", "dismiss")).rejects.toMatchObject({ code: "forbidden" });
    // vendors see the customer's first name and code only (the order board shape has no phone number)
    const board = store.read().reservations.filter((x) => x.vendorId === "v_1").map((x) => ({ first: P(x.customerId).name.split(" ")[0] }));
    expect(board.every((x) => !/\d/.test(x.first))).toBe(true);
  });
});

describe("customer features", () => {
  it("pay at pickup needs 3 completed pickups and a vendor that allows it", async () => {
    const l = await freshListing();
    const newbie = await customer(11, 0);
    await expect(svc.reserve(newbie, { listingId: l.id, qty: 1, method: "pay_at_pickup" })).rejects.toMatchObject({ code: "pay_at_pickup_locked" });
    const regular = await customer(12, 3);
    await expect(svc.reserve(regular, { listingId: l.id, qty: 1, method: "pay_at_pickup" })).resolves.toMatchObject({ kind: "reservation" });
    await vend.updateVendorSettings(P("u_ravi"), { payAtPickup: false });
    await expect(svc.reserve(await customer(13, 3), { listingId: l.id, qty: 1, method: "pay_at_pickup" })).rejects.toMatchObject({ code: "pay_at_pickup_off" });
  });

  it("fraud caps: 3 active reservations, 5 units unless the vendor allows more, rate limit", async () => {
    const l = await freshListing({ qty: 40 });
    const c = await customer(14);
    await expect(svc.reserve(c, { listingId: l.id, qty: 6, method: "online" })).rejects.toMatchObject({ code: "qty_cap" });
    await vend.updateVendorSettings(P("u_ravi"), { maxUnitsPerOrder: 8 });
    await expect(svc.reserve(c, { listingId: l.id, qty: 8, method: "pay_at_pickup" })).resolves.toBeTruthy();
    await expect(svc.reserve(c, { listingId: l.id, qty: 9, method: "online" })).rejects.toMatchObject({ code: "qty_cap" });
    for (let i = 0; i < 2; i++) await svc.reserve(c, { listingId: l.id, qty: 1, method: "pay_at_pickup" });
    await expect(svc.reserve(c, { listingId: l.id, qty: 1, method: "pay_at_pickup" })).rejects.toMatchObject({ code: "active_cap" });
    for (let i = 0; i < 8; i++) rateLimit("k", 8, 60_000);
    expect(() => rateLimit("k", 8, 60_000)).toThrowError(/Too many/);
  });

  it("Surprise Bag keeps contents hidden until pickup but always shows allergens and diet", async () => {
    const l = await freshListing({ surprise: true });
    await svc.updateListing(P("u_ravi"), l.id, { description: "Two croissants and a loaf", safetyDeclaration: true });
    const v = svc.enrichListing(store.read(), store.read().listings.find((x) => x.id === l.id)!);
    expect(v.description).toBe(svc.SURPRISE_HIDDEN);
    expect(v.surpriseWorth).toBe(200);
    expect(v.diet).toBe("Vegetarian");
    expect(svc.enrichListing(store.read(), store.read().listings.find((x) => x.id === l.id)!, undefined, true).description).toContain("croissants");
  });

  it("followers within 10 km are notified of new listings; far followers are not", async () => {
    const near = await customer(15), far = await customer(16);
    await p1.followVendor(near, "v_1", { lat: 12.935, lng: 77.62 });
    await p1.followVendor(far, "v_1", { lat: 13.2, lng: 77.9 });
    await freshListing();
    const n = store.read().notifications;
    expect(n.some((x) => x.userId === near.id && x.type === "new_listing_followed")).toBe(true);
    expect(n.some((x) => x.userId === far.id && x.type === "new_listing_followed")).toBe(false);
    await p1.unfollowVendor(near, "v_1");
    expect(p1.followingList(near.id)).toHaveLength(0);
  });

  it("push tokens are stored per device and notifications are typed", async () => {
    const c = await customer(17);
    await p1.registerPushToken(c, { token: "ExponentPushToken[abc]", platform: "ios", deviceId: "d1" });
    await p1.registerPushToken(c, { token: "ExponentPushToken[def]", platform: "ios", deviceId: "d1" });
    await p1.registerPushToken(c, { token: "ExponentPushToken[ghi]", platform: "android", deviceId: "d2" });
    expect(store.read().pushTokens.filter((t) => t.userId === c.id)).toHaveLength(2);
    await expect(p1.registerPushToken(c, { token: "nope", platform: "ios", deviceId: "d3" })).rejects.toMatchObject({ code: "token_invalid" });
    const l = await freshListing({ startMin: 5, endMin: 65 });
    const r = await onlineOrder(c, l.id);
    await svc.markReady(P("u_ravi"), r.id);
    const types = store.read().notifications.filter((n) => n.userId === c.id).map((n) => n.type);
    expect(types).toContain("order_confirmed");
    expect(types).toContain("order_ready");
  });

  it("15-minutes-left reminder is sent once", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65 });
    const c = await customer(18);
    const r = await onlineOrder(c, l.id);
    await ff(40);
    expect(store.read().notifications.filter((n) => n.userId === c.id && n.type === "pickup_reminder")).toHaveLength(0);
    await ff(15);
    await ff(1);
    expect(store.read().notifications.filter((n) => n.userId === c.id && n.type === "pickup_reminder")).toHaveLength(1);
    expect(store.read().reservations.find((x) => x.id === r.id)!.reminderSentAt).toBeTruthy();
  });

  it("impact profile counts meals, ₹ saved, CO2e and badges from picked-up orders", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65 });
    const c = await customer(19, 0);
    const r = await onlineOrder(c, l.id, 3);
    await ff(10);
    await svc.handover(P("u_ravi"), { code: r.code });
    const m = p1.customerImpact(c.id);
    expect(m).toMatchObject({ meals: 3, rupeesSaved: 300, kgFood: 1.2, co2eKg: 3, orders: 1 });
    expect(m.badges.find((b) => b.id === "first_rescue")!.earned).toBe(true);
    expect(m.badges.find((b) => b.id === "five_rescues")!.earned).toBe(false);
    const ev = store.read().impact.find((e) => e.refId === r.id)!;
    expect(ev).toMatchObject({ type: "sold", qty: 3, kgEst: 1.2, co2eKg: 3, listingId: l.id });
  });

  it("reports: reason required, photo path validated, duplicates blocked, lands in the admin queue", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65 });
    const c = await customer(20);
    await expect(p1.createReport(c, { targetType: "listing", targetId: l.id, reason: "bogus" as never })).rejects.toMatchObject({ code: "reason_invalid" });
    await expect(p1.createReport(c, { targetType: "listing", targetId: l.id, reason: "other", photoUrl: "http://evil/x.png" })).rejects.toMatchObject({ code: "photo_invalid" });
    const rep = await p1.createReport(c, { targetType: "listing", targetId: l.id, reason: "food_safety", text: "smelled off" });
    await expect(p1.createReport(c, { targetType: "listing", targetId: l.id, reason: "food_safety" })).rejects.toMatchObject({ code: "already_reported" });
    expect(admin.reportsQueue().some((x) => x.id === rep.id && x.status === "Open")).toBe(true);
  });
});

describe("vendor features", () => {
  it("template: save and repost with fresh pickup times", async () => {
    const src = await freshListing({ category: "Meals" });
    const tpl = await vend.saveTemplateFromListing(P("u_ravi"), src.id);
    await expect(vend.saveTemplateFromListing(P("u_ravi"), src.id)).rejects.toMatchObject({ code: "template_exists" });
    await expect(vend.repostTemplate(P("u_ravi"), tpl.id, { declaration: false })).rejects.toMatchObject({ code: "declaration_required" });
    const l = await vend.repostTemplate(P("u_ravi"), tpl.id, { declaration: true });
    expect(Date.parse(l.windowStart)).toBeGreaterThan(store.now());
    expect(Date.parse(l.windowEnd) - Date.parse(l.windowStart)).toBe((tpl.windowMinutes ?? 90) * 60_000);
    expect(l.status).toBe("Live");
  });

  it("donation-only listings are never sold and go straight to a batch", async () => {
    const l = await freshListing({ donationOnly: true, qty: 6 });
    const db = store.read();
    expect(db.listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(0);
    expect(db.donationBatches.find((b) => b.listingId === l.id)).toMatchObject({ qty: 6, origin: "donation_only", status: "Open" });
    const c = await customer(21);
    await expect(svc.reserve(c, { listingId: l.id, qty: 1, method: "online" })).rejects.toBeTruthy();
    expect(svc.discover({ lat: 12.9352, lng: 77.6245, radiusKm: 25 }).some((x) => x.id === l.id)).toBe(false);
  });

  it("high-risk items are capped at a 2-hour window", async () => {
    await expect(freshListing({ riskTag: "raw", startMin: 30, endMin: 30 + 121 })).rejects.toMatchObject({ code: "risk_window" });
    await expect(freshListing({ riskTag: "raw", startMin: 30, endMin: 30 + 120 })).resolves.toBeTruthy();
  });

  it("analytics and payouts: fee comes from settings", () => {
    const db = store.read();
    const a = vendorAnalytics(db, "v_1", 30, store.now());
    expect(a.orders).toBeGreaterThan(0);
    expect(a.sellThroughPct).toBeGreaterThan(0);
    expect(a.unitsExpired).toBeGreaterThan(0);
    expect(a.days).toHaveLength(30);
    const p = vendorPayouts(db, "v_1");
    expect(p.feePercent).toBe(10);
    for (const row of p.rows) { expect(row.fee).toBe(Math.round(row.gross * 0.1)); expect(row.net).toBe(row.gross - row.fee); }
    const db2 = structuredClone(db); db2.settings.platformFeeBps = 500;
    expect(vendorPayouts(db2, "v_1").totals.fee).toBeLessThan(p.totals.fee);
  });

  it("profile completeness lists what's missing", () => {
    const db = store.read();
    const c = vend.profileCompleteness(db.vendors.find((v) => v.id === "v_1")!, db.outlets.find((o) => o.id === "o_1"));
    expect(c.missing).toEqual(["Logo"]);
    expect(c.percent).toBe(83);
  });
});

describe("charity features", () => {
  async function claimedBatch() {
    const l = await freshListing({ startMin: 5, endMin: 65, donateRest: true, qty: 4 });
    await ff(66);
    const b = store.read().donationBatches.find((x) => x.listingId === l.id)!;
    await svc.claimBatch(P("u_joseph"), b.id);
    return b;
  }
  it("claimed batch can be scheduled; the public volunteer link works until the deadline", async () => {
    const b = await claimedBatch();
    const slot = iso(store.now() + min(30));
    await expect(charity.scheduleDonation(P("u_joseph"), b.id, { slot, volunteerName: "A", volunteerPhone: "123" })).rejects.toBeTruthy();
    await expect(charity.scheduleDonation(P("u_joseph"), b.id, { slot: iso(Date.parse(b.collectBy) + min(5)), volunteerName: "Asha", volunteerPhone: "+91 98765 43210" })).rejects.toMatchObject({ code: "slot_late" });
    const out = await charity.scheduleDonation(P("u_joseph"), b.id, { slot, volunteerName: "Asha", volunteerPhone: "+91 98765 43210" });
    const view = charity.volunteerView(out.token);
    expect(view).toMatchObject({ state: "ok", vendorName: "Crumb & Co. Bakery (Demo)", volunteerName: "Asha" });
    if (view.state === "ok") { expect(view.code).toMatch(/^\d{4}$/); expect(view.address).toContain("Koramangala"); }
    expect(store.read().notifications.some((n) => n.userId === "u_ravi" && /Asha/.test(n.text))).toBe(true);
    // another NGO cannot schedule it
    await expect(charity.scheduleDonation(P("u_ngo2"), b.id, { slot, volunteerName: "Zed", volunteerPhone: "+91 98765 43211" })).rejects.toBeTruthy();
    await ff(180);
    expect(charity.volunteerView(out.token).state).toBe("expired");
    expect(charity.volunteerView("short").state).toBe("not_found");
  });
  it("releasing a claim kills the volunteer link", async () => {
    const b = await claimedBatch();
    const out = await charity.scheduleDonation(P("u_joseph"), b.id, { slot: iso(store.now() + min(20)), volunteerName: "Asha", volunteerPhone: "+91 98765 43210" });
    await svc.releaseClaim(P("u_joseph"), b.id);
    expect(charity.volunteerView(out.token).state).toBe("not_found");
  });
  it("unclaimed batches escalate 60 minutes before the deadline to verified charities within 10 km, once", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65, donateRest: true, qty: 4 });
    await ff(66);
    const b = store.read().donationBatches.find((x) => x.listingId === l.id)!;
    const countFor = () => store.read().notifications.filter((n) => n.type === "donation_escalation" && (n.payload as { batchId?: string })?.batchId === b.id).length;
    expect(countFor()).toBe(0);
    await ff(60); await ff(1);
    const first = countFor();
    expect(first).toBeGreaterThan(0);
    await ff(5);
    expect(countFor()).toBe(first);
    const recipients = new Set(store.read().notifications.filter((n) => n.type === "donation_escalation").map((n) => n.userId));
    expect(recipients.has("u_ngo4")).toBe(false); // pending NGO is never notified
  });
  it("new donation alerts go to approved NGOs whose service area covers the outlet", async () => {
    const l = await freshListing({ startMin: 5, endMin: 65, donateRest: true, qty: 3 });
    await ff(66);
    const b = store.read().donationBatches.find((x) => x.listingId === l.id)!;
    const who = store.read().notifications.filter((n) => n.type === "new_donation" && (n.payload as { batchId?: string })?.batchId === b.id).map((n) => n.userId);
    expect(who).toContain("u_joseph");
    expect(who).not.toContain("u_ngo4");
  });
});

describe("admin console", () => {
  it("approval needs a reason to reject, notifies the applicant, and unblocks publishing on approve", async () => {
    const v = store.read().vendors.find((x) => x.id === "v_13")!;
    await expect(admin.decideApproval(P("u_admin"), `vendor:${v.id}`, "Rejected", "")).rejects.toMatchObject({ code: "reason_required" });
    await expect(admin.decideApproval(P("u_ravi"), `vendor:${v.id}`, "Approved")).rejects.toMatchObject({ code: "forbidden" });
    await admin.decideApproval(P("u_admin"), `vendor:${v.id}`, "Approved");
    expect(store.read().notifications.some((n) => n.userId === v.ownerId && n.type === "approval_decision")).toBe(true);
    expect(admin.approvalsQueue().some((a) => a.id === v.id)).toBe(false);
    expect(admin.approvalsQueue().filter((a) => a.status === "Pending").length).toBeGreaterThanOrEqual(2);
  });
  it("report actions: hide listing, suspend, refund, dismiss are logged with the admin and time", async () => {
    // hide listing
    await admin.actOnReport(P("u_admin"), "rp_1", "hide_listing", "wrong item");
    expect(store.read().listings.find((l) => l.id === "l_4")!.hiddenByAdmin).toBe(true);
    await expect(svc.reserve(await customer(30), { listingId: "l_4", qty: 1, method: "online" })).rejects.toMatchObject({ code: "not_available" });
    await expect(svc.setPaused(P("u_vendor2"), "l_4", false)).rejects.toBeTruthy();
    await expect(admin.actOnReport(P("u_admin"), "rp_1", "dismiss")).rejects.toMatchObject({ code: "already_resolved" });
    // refund needs an order with a captured payment
    const out = await admin.actOnReport(P("u_admin"), "rp_2", "refund_order");
    expect(out.refund?.amount).toBeGreaterThan(0);
    // suspend
    await admin.actOnReport(P("u_admin"), "rp_3", "suspend_account");
    expect(P("u_vendor8").suspendedUntil).toBeTruthy();
    await expect(freshListing({ vendor: "u_vendor8" })).rejects.toMatchObject({ code: "account_suspended" });
    const log = store.read().audit.filter((a) => a.entity === "report");
    expect(log.map((a) => a.action)).toEqual(expect.arrayContaining(["report_hide_listing", "report_refund_order", "report_suspend_account"]));
    expect(log.every((a) => a.actorId === "u_admin" || a.actorId.startsWith("u_"))).toBe(true);
  });
});
