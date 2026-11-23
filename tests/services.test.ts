import { beforeEach, describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const tmp = path.join(os.tmpdir(), `sap-test-${process.pid}.json`);
process.env.DEMO_DB_PATH = tmp;

const store = await import("@/lib/store");
const svc = await import("@/lib/services");
const { buildSeed } = await import("@/lib/seed");
import type { Profile } from "@/lib/types";

const P = (id: string) => store.read().profiles.find((p) => p.id === id)! as Profile;
const iso = (ms: number) => new Date(ms).toISOString();
const min = (n: number) => n * 60_000;

async function freshListing(opts: Partial<{ qty: number; startMin: number; endMin: number; donateRest: boolean; safeUntilMin: number; vendor: string }> = {}) {
  const n = store.now();
  return svc.createListing(P(opts.vendor ?? "u_ravi"), {
    title: "Test Box", category: "Bakery", diet: "Vegetarian", originalPrice: 200, rescuePrice: 100, qty: opts.qty ?? 10,
    preparedAt: iso(n - min(30)), windowStart: iso(n + min(opts.startMin ?? 5)), windowEnd: iso(n + min(opts.endMin ?? 65)),
    safeUntil: opts.safeUntilMin !== undefined ? iso(n + min(opts.safeUntilMin)) : undefined,
    donateRest: opts.donateRest ?? false, safetyDeclaration: true,
  });
}
async function makeCustomers(count: number) {
  const out: Profile[] = [];
  for (let i = 0; i < count; i++) out.push(await svc.createAccount({ name: `Load Tester ${i}`, phone: `+91900000${String(i).padStart(4, "0")}`, role: "customer" }));
  return out;
}
const codeOf = (e: unknown) => (e as { code?: string }).code;

beforeEach(async () => {
  if (fs.existsSync(tmp)) fs.rmSync(tmp);
  await store.resetStore(buildSeed(Date.now()));
});

describe("concurrency: 50 parallel attempts against 10 units", () => {
  it("pay-at-pickup: exactly 10 succeed, 40 fail, stock never negative", async () => {
    const l = await freshListing({ qty: 10 });
    const customers = await makeCustomers(50);
    const results = await Promise.allSettled(customers.map((c) => svc.reserve(c, { listingId: l.id, qty: 1, method: "pay_at_pickup" })));
    const ok = results.filter((r) => r.status === "fulfilled");
    const fail = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(10);
    expect(fail).toHaveLength(40);
    expect(fail.every((f) => codeOf(f.reason) === "insufficient_stock")).toBe(true);
    const db = store.read();
    const after = db.listings.find((x) => x.id === l.id)!;
    expect(after.qtyAvailable).toBe(0);
    expect(after.status).toBe("Sold Out");
    expect(db.reservations.filter((r) => r.listingId === l.id)).toHaveLength(10);
    expect(db.reservations.filter((r) => r.listingId === l.id).reduce((s, r) => s + r.qty, 0)).toBe(10);
    // Never negative at any point: replay the movement ledger.
    let running = 0;
    for (const m of db.inventory.filter((x) => x.listingId === l.id)) { running += m.delta; expect(running).toBeGreaterThanOrEqual(0); }
  });

  it("online checkout: exactly 10 active holds", async () => {
    const l = await freshListing({ qty: 10 });
    const customers = await makeCustomers(50);
    const results = await Promise.allSettled(customers.map((c) => svc.reserve(c, { listingId: l.id, qty: 1, method: "online" })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
    const db = store.read();
    expect(db.holds.filter((h) => h.listingId === l.id && h.status === "Active")).toHaveLength(10);
    expect(db.listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(0);
  });
});

describe("customer rules", () => {
  it("rejects a 4th active reservation (holds count), also under concurrency", async () => {
    const l = await freshListing({ qty: 50 });
    const priya = P("u_priya"); // seeded with 2 active
    await svc.reserve(priya, { listingId: l.id, qty: 1, method: "online" });
    await expect(svc.reserve(priya, { listingId: l.id, qty: 1, method: "pay_at_pickup" })).rejects.toMatchObject({ code: "active_cap" });
    const [c] = await makeCustomers(1);
    const rs = await Promise.allSettled(Array.from({ length: 6 }, () => svc.reserve(c, { listingId: l.id, qty: 1, method: "pay_at_pickup" })));
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(3);
  });

  it("rejects 6 units in one order", async () => {
    const l = await freshListing({ qty: 20 });
    const [c] = await makeCustomers(1);
    await expect(svc.reserve(c, { listingId: l.id, qty: 6, method: "pay_at_pickup" })).rejects.toMatchObject({ code: "qty_cap" });
    await expect(svc.reserve(c, { listingId: l.id, qty: 5, method: "pay_at_pickup" })).resolves.toMatchObject({ kind: "reservation" });
  });

  it("rejects reservation after pickup end and hides the listing", async () => {
    const l = await freshListing({ startMin: 5, endMin: 20 });
    await svc.fastForward(P("u_admin"), 25);
    const [c] = await makeCustomers(1);
    await expect(svc.reserve(c, { listingId: l.id, qty: 1, method: "pay_at_pickup" })).rejects.toMatchObject({ code: "window_closed" });
    expect(store.read().listings.find((x) => x.id === l.id)!.status).toBe("Expired");
  });

  it("sold-out listings leave discovery immediately", async () => {
    const l = await freshListing({ qty: 1 });
    const [c] = await makeCustomers(1);
    const o = store.read().outlets.find((x) => x.id === l.outletId)!;
    expect(svc.discover({ lat: o.lat, lng: o.lng, radiusKm: 5 }).some((x) => x.id === l.id)).toBe(true);
    await svc.reserve(c, { listingId: l.id, qty: 1, method: "pay_at_pickup" });
    expect(svc.discover({ lat: o.lat, lng: o.lng, radiusKm: 5 }).some((x) => x.id === l.id)).toBe(false);
  });

  it("filters apply to data", async () => {
    const k = { lat: 12.9352, lng: 77.6245, radiusKm: 25 };
    const veg = svc.discover({ ...k, diet: "Vegetarian" });
    expect(veg.length).toBeGreaterThan(0);
    expect(veg.every((l) => l.diet === "Vegetarian")).toBe(true);
    expect(svc.discover({ ...k, category: "Desserts" }).every((l) => l.category === "Desserts")).toBe(true);
    expect(svc.discover({ ...k, maxPrice: 100 }).every((l) => l.rescuePrice <= 100)).toBe(true);
    expect(svc.discover({ ...k, q: "biryani" }).every((l) => /biryani/i.test(l.title + l.vendor.businessName + l.category))).toBe(true);
  });
});

describe("payments", () => {
  it("successful payment confirms; duplicate callback is idempotent", async () => {
    const l = await freshListing();
    const [c] = await makeCustomers(1);
    const h = await svc.reserve(c, { listingId: l.id, qty: 2, method: "online" });
    if (h.kind !== "hold") throw new Error("expected hold");
    const a = await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: "pay_1", eventId: "evt_1" });
    const b = await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: "pay_1", eventId: "evt_1" });
    expect(a.outcome).toBe("confirmed");
    expect(b.outcome).toBe("duplicate");
    expect(store.read().reservations.filter((r) => r.holdId === h.holdId)).toHaveLength(1);
  });

  it("late payment callback after hold expiry is refunded, never revives the order", async () => {
    const l = await freshListing({ qty: 5 });
    const [c] = await makeCustomers(1);
    const h = await svc.reserve(c, { listingId: l.id, qty: 2, method: "online" });
    if (h.kind !== "hold") throw new Error("expected hold");
    expect(store.read().listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(3);
    await svc.fastForward(P("u_admin"), 6);
    expect(store.read().listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(5); // released
    const out = await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: "pay_late", eventId: "evt_late" });
    expect(out.outcome).toBe("late_refund");
    const db = store.read();
    expect(db.reservations.some((r) => r.holdId === h.holdId)).toBe(false);
    expect(db.payments.find((p) => p.holdId === h.holdId)!.status).toBe("Refund Pending");
    expect(db.refunds).toHaveLength(1);
  });

  it("failed payment releases stock", async () => {
    const l = await freshListing({ qty: 5 });
    const [c] = await makeCustomers(1);
    const h = await svc.reserve(c, { listingId: l.id, qty: 3, method: "online" });
    if (h.kind !== "hold") throw new Error("expected hold");
    await svc.failOnlinePayment(c, h.holdId);
    expect(store.read().listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(5);
  });
});

describe("vendor rules", () => {
  it("enforces 30% minimum discount", async () => {
    const n = store.now();
    const base = { title: "Price Test", category: "Meals" as const, diet: "Vegetarian" as const, qty: 5, preparedAt: iso(n - min(10)), windowStart: iso(n + min(10)), windowEnd: iso(n + min(60)), donateRest: false, safetyDeclaration: true };
    await expect(svc.createListing(P("u_ravi"), { ...base, originalPrice: 100, rescuePrice: 71 })).rejects.toMatchObject({ code: "discount_too_small" });
    await expect(svc.createListing(P("u_ravi"), { ...base, originalPrice: 100, rescuePrice: 70 })).resolves.toMatchObject({ rescuePrice: 70 });
  });

  it("enforces pickup start in the future and within 12 hours", async () => {
    const n = store.now();
    const base = { title: "Window Test", category: "Meals" as const, diet: "Vegetarian" as const, qty: 5, originalPrice: 100, rescuePrice: 50, preparedAt: iso(n - min(10)), donateRest: false, safetyDeclaration: true };
    await expect(svc.createListing(P("u_ravi"), { ...base, windowStart: iso(n - min(1)), windowEnd: iso(n + min(60)) })).rejects.toMatchObject({ code: "window_past" });
    await expect(svc.createListing(P("u_ravi"), { ...base, windowStart: iso(n + min(12 * 60 + 1)), windowEnd: iso(n + min(13 * 60)) })).rejects.toMatchObject({ code: "window_too_far" });
    await expect(svc.createListing(P("u_ravi"), { ...base, windowStart: iso(n + min(30)), windowEnd: iso(n + min(20)) })).rejects.toMatchObject({ code: "window_order" });
  });

  it("requires the safety declaration and a diet tag", async () => {
    const n = store.now();
    const base = { title: "Decl Test", category: "Meals" as const, qty: 5, originalPrice: 100, rescuePrice: 50, preparedAt: iso(n - min(10)), windowStart: iso(n + min(10)), windowEnd: iso(n + min(60)), donateRest: false };
    await expect(svc.createListing(P("u_ravi"), { ...base, diet: "Vegetarian", safetyDeclaration: false })).rejects.toMatchObject({ code: "declaration_required" });
    // @ts-expect-error missing diet on purpose
    await expect(svc.createListing(P("u_ravi"), { ...base, safetyDeclaration: true })).rejects.toMatchObject({ code: "diet_required" });
  });

  it("pending and rejected vendors cannot publish", async () => {
    await expect(freshListing({ vendor: "u_vendor3" })).rejects.toMatchObject({ code: "approval_required" });
    await expect(freshListing({ vendor: "u_vendor12" })).rejects.toMatchObject({ code: "approval_required" });
  });

  it("pickup codes: wrong vendor fails, reuse fails, success counts impact", async () => {
    const before = svc.impactSummary().totalUnits;
    const r = store.read().reservations.find((x) => x.ref === "SAP-4801")!; // Priya, Crumb & Co., window open
    await expect(svc.handover(P("u_vendor2"), { token: r.qrToken })).rejects.toMatchObject({ code: "wrong_vendor" });
    await expect(svc.handover(P("u_vendor2"), { code: r.code })).rejects.toMatchObject({ code: "code_not_found" });
    const ok = await svc.handover(P("u_ravi"), { token: r.qrToken });
    expect(ok.ref).toBe("SAP-4801");
    await expect(svc.handover(P("u_ravi"), { token: r.qrToken })).rejects.toMatchObject({ code: "code_used" });
    await expect(svc.handover(P("u_ravi"), { code: r.code })).rejects.toMatchObject({ code: "code_used" });
    expect(svc.impactSummary().totalUnits).toBe(before + r.qty);
  });

  it("handover outside the window is rejected; reservations do not count as impact", async () => {
    const l = await freshListing({ startMin: 30, endMin: 90 });
    const [c] = await makeCustomers(1);
    const before = svc.impactSummary().totalUnits;
    const res = await svc.reserve(c, { listingId: l.id, qty: 2, method: "pay_at_pickup" });
    if (res.kind !== "reservation") throw new Error();
    expect(svc.impactSummary().totalUnits).toBe(before);
    const r = store.read().reservations.find((x) => x.id === res.reservationId)!;
    await expect(svc.handover(P("u_ravi"), { code: r.code })).rejects.toMatchObject({ code: "too_early" });
    await svc.fastForward(P("u_admin"), 35);
    const out = await svc.handover(P("u_ravi"), { code: r.code });
    expect(out.collectAmount).toBe(200);
    expect(store.read().payments.find((p) => p.reservationId === r.id)!.status).toBe("Paid at Pickup");
  });

  it("cancellation refunds captured online payments only and preserves history", async () => {
    const l = await freshListing({ qty: 10 });
    const [a, b] = await makeCustomers(2);
    const h = await svc.reserve(a, { listingId: l.id, qty: 2, method: "online" });
    if (h.kind !== "hold") throw new Error();
    await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: "pay_x", eventId: "evt_x" });
    await svc.reserve(b, { listingId: l.id, qty: 1, method: "pay_at_pickup" });
    const out = await svc.cancelListing(P("u_ravi"), l.id, "Oven failure");
    expect(out.refunds).toBe(1);
    const db = store.read();
    const rs = db.reservations.filter((r) => r.listingId === l.id);
    expect(rs.every((r) => r.status === "Cancelled")).toBe(true);
    expect(db.payments.find((p) => p.reservationId === rs.find((r) => r.method === "pay_at_pickup")!.id)!.status).toBe("Pending");
    expect(db.audit.some((x) => x.action === "listing_cancelled" && x.entityId === l.id)).toBe(true);
  });
});

describe("donations", () => {
  it("window end donates only unreserved, unheld units", async () => {
    const l = await freshListing({ qty: 10, startMin: 2, endMin: 4, donateRest: true, safeUntilMin: 240 });
    const [a, b] = await makeCustomers(2);
    await svc.reserve(a, { listingId: l.id, qty: 3, method: "pay_at_pickup" });
    await svc.reserve(b, { listingId: l.id, qty: 2, method: "online" }); // hold, never paid
    await svc.fastForward(P("u_admin"), 5);
    const db = store.read();
    const batch = db.donationBatches.find((x) => x.listingId === l.id)!;
    expect(batch.qty).toBe(7); // 10 - 3 reserved; the 2 held units were released at window end, not reserved
    expect(batch.status).toBe("Open");
    expect(db.listings.find((x) => x.id === l.id)!.status).toBe("Expired");
  });

  it("expired / ineligible food is not donated", async () => {
    const l = await freshListing({ qty: 6, startMin: 2, endMin: 4, donateRest: true, safeUntilMin: 4 });
    await svc.fastForward(P("u_admin"), 5);
    expect(store.read().donationBatches.some((x) => x.listingId === l.id)).toBe(false);
  });

  it("no batch when nothing remains", async () => {
    const l = await freshListing({ qty: 2, startMin: 2, endMin: 4, donateRest: true, safeUntilMin: 240 });
    const [a] = await makeCustomers(1);
    await svc.reserve(a, { listingId: l.id, qty: 2, method: "pay_at_pickup" });
    await svc.fastForward(P("u_admin"), 5);
    expect(store.read().donationBatches.some((x) => x.listingId === l.id)).toBe(false);
  });

  it("pending NGO cannot claim; two NGOs claiming at once: exactly one wins", async () => {
    const open = store.read().donationBatches.find((b) => b.status === "Open")!;
    await expect(svc.claimBatch(P("u_ngo4"), open.id)).rejects.toMatchObject({ code: "approval_required" });
    const rs = await Promise.allSettled([svc.claimBatch(P("u_joseph"), open.id), svc.claimBatch(P("u_ngo2"), open.id), svc.claimBatch(P("u_ngo3"), open.id)]);
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((rs.filter((r) => r.status === "rejected") as PromiseRejectedResult[]).every((r) => codeOf(r.reason) === "already_claimed")).toBe(true);
    const b = store.read().donationBatches.find((x) => x.id === open.id)!;
    expect(b.status).toBe("Claimed");
    expect(b.qty).toBe(open.qty);
  });

  it("vendor verifies donation handover; impact counts it", async () => {
    const before = svc.impactSummary();
    const b = store.read().donationBatches.find((x) => x.status === "Claimed")!;
    const owner = store.read().vendors.find((v) => v.id === b.vendorId)!.ownerId;
    await expect(svc.donationHandover(P(owner), b.id, "0000")).rejects.toMatchObject({ code: "code_mismatch" });
    await svc.donationHandover(P(owner), b.id, b.collectionCode!);
    const after = svc.impactSummary();
    expect(after.ngoUnits).toBe(before.ngoUnits + b.qty);
    expect(after.completedCollections).toBe(before.completedCollections + 1);
  });
});

describe("roles", () => {
  it("admin role cannot be self-selected; customers cannot use vendor/admin actions", async () => {
    await expect(svc.createAccount({ name: "Mallory", role: "admin" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(svc.setApproval(P("u_priya"), "vendor", "v_3", "Approved")).rejects.toMatchObject({ code: "forbidden" });
    await expect(svc.markReady(P("u_priya"), "r_1")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("admin approval unlocks publishing and is audited", async () => {
    await svc.setApproval(P("u_admin"), "vendor", "v_3", "Approved");
    await expect(freshListing({ vendor: "u_vendor3" })).resolves.toMatchObject({ status: "Live" });
    expect(store.read().audit.some((a) => a.action === "vendor_approved" && a.entityId === "v_3")).toBe(true);
  });
});
