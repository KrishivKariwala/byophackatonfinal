import { describe, expect, it } from "vitest";
import { ff, freshListing, P, store, svc } from "./p2-harness";
import { RELIABILITY, reliability } from "@/lib/reliability";

const vendor = (id: string) => store.read().vendors.find((v) => v.id === id)!;
const score = (id: string) => reliability(store.read(), vendor(id), store.now());
const filters = { lat: 12.9352, lng: 77.6245, radiusKm: 25 } as const;

describe("vendor reliability score", () => {
  it("is out of 100, and a new vendor with no history is not penalised", () => {
    const r = score("v_1");
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThanOrEqual(100);
    const parts = r.parts.rating + r.parts.cancellations + r.parts.reports;
    expect(Math.abs(parts - r.score)).toBeLessThanOrEqual(1); // rounded parts add up to the score
  });

  it("falls with a poor rating", async () => {
    const before = score("v_1").score;
    await store.transaction((tx) => { const v = tx.db.vendors.find((x) => x.id === "v_1")!; v.ratingAvg = 1.5; v.ratingCount = 20; });
    expect(score("v_1").parts.rating).toBeLessThan(10);
    expect(score("v_1").score).toBeLessThan(before);
  });

  it("falls with open reports against the vendor", async () => {
    const before = score("v_1").parts.reports;
    await store.transaction((tx) => {
      for (let i = 0; i < 3; i++) tx.db.reports.push({ id: `rp_t${i}`, reporterId: "u_priya", targetType: "vendor", targetId: "v_1", reason: "other", status: "Open", createdAt: new Date(tx.now).toISOString() } as never);
    });
    expect(score("v_1").parts.reports).toBe(Math.max(0, before - 15));
    expect(score("v_1").basis.openReports).toBeGreaterThanOrEqual(3);
  });

  it("falls when the vendor itself cancels customers' orders", async () => {
    await store.transaction((tx) => {
      for (let i = 0; i < 6; i++)
        tx.db.reservations.push({ id: `rc_${i}`, ref: `C-${i}`, listingId: "l_3", vendorId: "v_1", outletId: "o_1", customerId: "u_priya", qty: 1, unitPrice: 90, amount: 90, method: "online", status: "Cancelled",
          cancelReason: "Vendor cancelled listing: out of stock", qrToken: "x", code: "0000", qrTokenHash: `q${i}`, codeHash: `c${i}`, createdAt: new Date(tx.now - 86400_000).toISOString() } as never);
    });
    const r = score("v_1");
    expect(r.basis.vendorCancelled).toBeGreaterThanOrEqual(6);
    expect(r.parts.cancellations).toBeLessThan(28);
  });

  it("a vendor below the line is listed after everyone else in the feed", async () => {
    // two vendors, one listing each, the low one's window starts earlier so it would normally come first
    const a = await freshListing({ vendor: "u_ravi", startMin: 30, endMin: 120 });
    const b = await freshListing({ vendor: "u_vendor2", startMin: 10, endMin: 120 });
    const idx = (id: string) => svc.discover({ ...filters }).findIndex((l) => l.id === id);
    expect(idx(b.id)).toBeLessThan(idx(a.id)); // earlier window first when both are fine
    await store.transaction((tx) => { const v = tx.db.vendors.find((x) => x.ownerId === "u_vendor2")!; v.ratingAvg = 1; v.ratingCount = 30;
      for (let i = 0; i < 4; i++) tx.db.reports.push({ id: `rp_x${i}`, reporterId: "u_priya", targetType: "vendor", targetId: v.id, reason: "other", status: "Open", createdAt: new Date(tx.now).toISOString() } as never); });
    expect(reliability(store.read(), store.read().vendors.find((x) => x.ownerId === "u_vendor2")!, store.now()).low).toBe(true);
    expect(idx(b.id)).toBeGreaterThan(idx(a.id)); // now it is listed after the reliable vendor
    await ff(0);
  });

  it("the line is 50", () => { expect(RELIABILITY.LOW_BELOW).toBe(50); });
});
