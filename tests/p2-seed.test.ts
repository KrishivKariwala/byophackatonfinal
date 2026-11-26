import { describe, expect, it } from "vitest";
import { store, svc, P, ff } from "./p2-harness";
const mod = await import("@/lib/p2/moderation");
const cr = await import("@/lib/p2/credits");
const pr = await import("@/lib/p2/priority");
const org = await import("@/lib/p2/org");
const rc = await import("@/lib/p2/receipts");
const { checkCatalog } = await import("@/lib/i18n/check");
import en from "@/lib/i18n/messages/en.json";
import hi from "@/lib/i18n/messages/hi.json";
import kn from "@/lib/i18n/messages/kn.json";

describe("P2 demo seed", () => {
  it("2 organizations, 3 outlets, mixed staff", () => {
    const db = store.read();
    const orgs = new Set(db.memberships.filter((m) => m.role !== "owner" && ["v_1", "v_2"].includes(m.vendorId)).map((m) => m.vendorId));
    expect([...orgs].sort()).toEqual(["v_1", "v_2"]);
    expect(db.outlets.filter((o) => o.vendorId === "v_1")).toHaveLength(2);
    expect(db.outlets.filter((o) => o.vendorId === "v_2")).toHaveLength(1);
    expect(db.memberships.filter((m) => m.role === "manager")).toHaveLength(1);
    expect(db.memberships.filter((m) => m.role === "staff")).toHaveLength(3);
    expect(db.invites.filter((i) => !i.acceptedAt && !i.revokedAt)).toHaveLength(1);
  });

  it("seeded staff are confined to their own outlet", async () => {
    const db = store.read();
    expect(org.vendorCtx(db, P("u_staff2")).outletId).toBe("o_1b");
    expect(org.vendorCtx(db, P("u_staff1")).outletId).toBe("o_1");
    expect(org.vendorCtx(db, P("u_mgr1")).outletId).toBeUndefined();
    const o1Order = db.reservations.find((r) => r.outletId === "o_1" && (r.status === "Reserved" || r.status === "Ready"));
    if (o1Order) await expect(svc.markReady(P("u_staff2"), o1Order.id)).rejects.toMatchObject({ code: "not_found" });
  });

  it("10 referrals across every state, with a ledger that adds up", () => {
    const db = store.read();
    expect(db.referrals).toHaveLength(10);
    expect(new Set(db.referrals.map((r) => r.status))).toEqual(new Set(["pending", "rewarded", "rejected"]));
    for (const r of db.referrals.filter((x) => x.status === "rewarded")) expect(db.creditLedger.filter((e) => e.refId === r.id && e.type === "earned")).toHaveLength(2);
    for (const e of db.creditLedger.filter((x) => x.type === "earned")) expect(e.remaining).toBeLessThanOrEqual(e.amount);
    for (const u of new Set(db.creditLedger.map((e) => e.userId))) expect(cr.creditBalance(db, u, store.now())).toBeGreaterThanOrEqual(0);
    expect(cr.creditBalance(db, "u_priya", store.now())).toBe(60); // 100 earned, 40 spent
    expect(cr.creditBalance(db, "u_kiran", store.now())).toBe(50); // one lot expired, one live
    expect(db.creditLedger.some((e) => e.type === "expired")).toBe(true);
  });

  it("price-step listings (one already applied) and a priority listing hidden from customers but offered to charities", async () => {
    const db = store.read();
    expect(new Set(db.priceSteps.map((s) => s.listingId)).size).toBeGreaterThanOrEqual(3);
    expect(db.priceSteps.some((s) => s.appliedAt)).toBe(true);
    const l = db.listings.find((x) => x.id === "l_7")!;
    expect((await svc.discover({ lat: 12.93, lng: 77.58, radiusKm: 50 })).some((x) => x.id === "l_7")).toBe(false);
    const ngo = db.ngos.find((n) => n.status === "Approved" && pr.priorityOffersFor(db, n, store.now()).some((o) => o.l.id === l.id));
    expect(ngo).toBeTruthy();
  });

  it("5 receipts with unique numbers (one with 80G), 3 distribution logs, 2 delivery requests", async () => {
    const db = store.read();
    expect(db.receipts).toHaveLength(5);
    expect(new Set(db.receipts.map((r) => r.number)).size).toBe(5);
    expect(db.receipts.some((r) => r.eightyG)).toBe(true);
    expect(db.receipts.some((r) => !r.eightyG)).toBe(true);
    expect(db.receiptSeq[new Date().getFullYear()]).toBe(5);
    expect(db.distributionLogs).toHaveLength(3);
    expect(db.deliveryRequests).toHaveLength(2);
    expect(new Set(db.deliveryRequests.map((d) => d.status))).toEqual(new Set(["Rider assigned", "Delivered"]));
    expect((await rc.listReceipts(P("u_ravi"))).length).toBeGreaterThan(0);
  });

  it("moderation: flagged items in the queue, a hidden listing, and a dismissed one that stays dismissed", async () => {
    const q = (await mod.moderationQueue(store.read()));
    const open = q.filter((i) => i.state === "open");
    expect(open.some((i) => i.targetType === "listing" && i.targetId === "l_11")).toBe(true); // keyword
    expect(open.some((i) => i.targetType === "listing" && i.targetId === "l_4")).toBe(true); // 3 reports
    expect(open.some((i) => i.targetType === "review" && i.targetId === "rv_seed_bad")).toBe(true); // keyword in a review
    expect(q.find((i) => i.targetId === "l_10")!.state).toBe("hidden");
    expect(q.find((i) => i.targetId === "l_5")!.state).toBe("resolved");
  });

  it("the seeded store survives the clock moving forward (jobs run, nothing breaks)", async () => {
    await ff(60);
    expect(store.read().deliveryRequests.find((d) => d.id === "dv_seed_1")!.status).toBe("Delivered"); // the mock rider finishes 12 minutes after the request
  });
});

describe("translations ship complete", () => {
  it("every English key has Hindi and Kannada text", () => {
    const r = checkCatalog({ en, hi, kn });
    expect(r.ok).toBe(true);
    expect(Object.keys(en).length).toBeGreaterThan(200);
  });
});
