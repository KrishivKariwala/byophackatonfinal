import { describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, onlineOrder, ff, iso, min } from "./p2-harness";
const md = await import("@/lib/p2/markdown");
const plat = await import("@/lib/p2/platform");
const vend = await import("@/lib/vendor");

const H = 3600_000;
const base = { original: 200, startingPrice: 100, nowMs: 0, windowEndMs: 4 * H };
const step = (hours: number, pct: number) => ({ effectiveAt: hours * H, discountPct: pct });

describe("markdown step validation (feature 4, unit)", () => {
  it("accepts up to 3 increasing, time-ordered steps and computes each price from the ORIGINAL", () => {
    const v = md.validateSteps({ ...base, steps: [step(1, 55), step(2, 65), step(3, 80)] });
    expect(v.map((s) => s.price)).toEqual([90, 70, 40]);
    expect(md.validateSteps({ ...base, steps: [] })).toEqual([]);
  });

  it("rejects a 4th step", () => {
    expect(() => md.validateSteps({ ...base, steps: [step(0.5, 55), step(1, 60), step(1.5, 65), step(2, 70)] })).toThrowError(/At most 3/);
  });

  it("rejects discounts outside 30–80% and above the platform cap", () => {
    for (const d of [29, 81, 0, 100, 45.5]) expect(() => md.validateSteps({ ...base, startingPrice: 150, steps: [step(1, d)] })).toThrowError(/30% to 80%/);
    expect(() => md.validateSteps({ ...base, steps: [step(1, 70)], maxDiscountPct: 60 })).toThrowError(/caps discounts at 60%/);
  });

  it("rejects out-of-order or past times, and steps too close to (or after) the pickup end", () => {
    expect(() => md.validateSteps({ ...base, steps: [step(2, 60), step(1, 70)] })).toThrowError(/time order/);
    expect(() => md.validateSteps({ ...base, steps: [step(2, 60), step(2, 70)] })).toThrowError(/time order/);
    expect(() => md.validateSteps({ ...base, steps: [{ effectiveAt: -1000, discountPct: 60 }] })).toThrowError(/future/);
    expect(() => md.validateSteps({ ...base, steps: [step(4, 60)] })).toThrowError(/5 minutes before/);
    expect(() => md.validateSteps({ ...base, steps: [step(5, 60)] })).toThrowError(/5 minutes before/);
    expect(() => md.validateSteps({ ...base, steps: [{ effectiveAt: "nope", discountPct: 60 }] })).toThrowError(/valid time/);
  });

  it("a price only ever goes down: a step must be a deeper discount than the start and than the previous step", () => {
    expect(() => md.validateSteps({ ...base, steps: [step(1, 50)] })).toThrowError(/only ever goes down/); // already 50% off
    expect(() => md.validateSteps({ ...base, steps: [step(1, 40)] })).toThrowError(/only ever goes down/); // would raise the price
    expect(() => md.validateSteps({ ...base, steps: [step(1, 60), step(2, 60)] })).toThrowError(/only ever goes down/);
    expect(() => md.validateSteps({ ...base, steps: [step(1, 70), step(2, 60)] })).toThrowError(/only ever goes down/);
  });

  it("the suggested schedule is valid by construction and deepens as pickup end approaches", () => {
    const n = 1_000_000_000_000;
    const s = md.suggestSchedule({ original: 200, startingPrice: 130, nowMs: n, windowStartMs: n + 30 * 60_000, windowEndMs: n + 4 * H });
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThanOrEqual(3);
    for (let k = 1; k < s.length; k++) { expect(s[k].effectiveAtMs).toBeGreaterThan(s[k - 1].effectiveAtMs); expect(s[k].discountPct).toBeGreaterThan(s[k - 1].discountPct); }
    expect(() => md.validateSteps({ steps: s.map((x) => ({ effectiveAt: x.effectiveAtMs, discountPct: x.discountPct })), original: 200, startingPrice: 130, nowMs: n, windowEndMs: n + 4 * H })).not.toThrow();
    expect(md.suggestSchedule({ original: 200, startingPrice: 130, nowMs: n, windowStartMs: n, windowEndMs: n + 5 * 60_000 })).toEqual([]); // no room
    // a platform cap of 60% limits the suggestion too
    const capped = md.suggestSchedule({ original: 200, startingPrice: 130, nowMs: n, windowStartMs: n + 30 * 60_000, windowEndMs: n + 4 * H, maxDiscountPct: 60 });
    expect(capped.every((x) => x.discountPct <= 60)).toBe(true);
  });
});

describe("auto-markdown job (integration)", () => {
  const withSteps = async (steps: { effectiveAt: string; discountPct: number }[], extra: Record<string, unknown> = {}) => {
    return freshListing({ original: 200, rescue: 100, startMin: 10, endMin: 180, extra: { priceSteps: steps, ...extra } });
  };

  it("applies each step at its time, lowering the price; existing orders keep the price they paid", async () => {
    const n = store.now();
    const l = await withSteps([{ effectiveAt: iso(n + min(20)), discountPct: 60 }, { effectiveAt: iso(n + min(60)), discountPct: 75 }]);
    expect(l.initialRescuePrice).toBe(100);
    const c = await customer(1);
    const early = await onlineOrder(c, l.id); // bought at ₹100
    await ff(25);
    expect(store.read().listings.find((x) => x.id === l.id)!.rescuePrice).toBe(80);
    await ff(40);
    expect(store.read().listings.find((x) => x.id === l.id)!.rescuePrice).toBe(50);
    expect(store.read().reservations.find((r) => r.id === early.id)!.unitPrice).toBe(100);
    const late = await onlineOrder(await customer(2), l.id);
    expect(late.unitPrice).toBe(50);
    expect(store.read().priceSteps.filter((s) => s.listingId === l.id).every((s) => s.appliedAt)).toBe(true);
  });

  it("a price is never raised: a manual cut below a pending step makes that step a no-op", async () => {
    const n = store.now();
    const l = await withSteps([{ effectiveAt: iso(n + min(30)), discountPct: 60 }]);
    await svc.updateListing(P("u_ravi"), l.id, { rescuePrice: 60, safetyDeclaration: true }); // vendor already went to ₹60
    await ff(40);
    expect(store.read().listings.find((x) => x.id === l.id)!.rescuePrice).toBe(60); // step would have set ₹80: ignored
  });

  it("followers within range are notified of the drop; people who don't follow are not", async () => {
    const n = store.now();
    await withSteps([{ effectiveAt: iso(n + min(20)), discountPct: 65 }]);
    const follower = P("u_priya");
    await store.transaction((tx) => { tx.db.follows.push({ id: "f_test", customerId: follower.id, vendorId: "v_1", createdAt: iso(tx.now), lat: 12.9352, lng: 77.6245 }); });
    await ff(25);
    const got = (u: string) => store.read().notifications.filter((x) => x.userId === u && x.type === "price_drop");
    expect(got("u_priya")).toHaveLength(1);
    expect(got("u_priya")[0].text).toMatch(/₹70/);
    expect(got("u_arjun")).toHaveLength(0);
    await ff(5); // idempotent: running again sends nothing more
    expect(got("u_priya")).toHaveLength(1);
  });

  it("the server enforces the same rules when creating or editing", async () => {
    const n = store.now();
    await expect(withSteps([{ effectiveAt: iso(n + min(20)), discountPct: 40 }])).rejects.toMatchObject({ code: "step_price_up" });
    await expect(withSteps([{ effectiveAt: iso(n + min(20)), discountPct: 60 }, { effectiveAt: iso(n + min(10)), discountPct: 70 }])).rejects.toMatchObject({ code: "step_time_order" });
    await expect(withSteps([1, 2, 3, 4].map((k) => ({ effectiveAt: iso(n + min(10 * k + 5)), discountPct: 50 + k * 5 })))).rejects.toMatchObject({ code: "steps_too_many" });
    const ok = await withSteps([{ effectiveAt: iso(n + min(20)), discountPct: 60 }]);
    await expect(svc.updateListing(P("u_ravi"), ok.id, { priceSteps: [{ effectiveAt: iso(n + min(30)), discountPct: 90 }], safetyDeclaration: true })).rejects.toMatchObject({ code: "step_discount_range" });
    // replacing an unapplied schedule works and leaves exactly the new steps
    await svc.updateListing(P("u_ravi"), ok.id, { priceSteps: [{ effectiveAt: iso(n + min(45)), discountPct: 70 }], safetyDeclaration: true });
    expect(store.read().priceSteps.filter((s) => s.listingId === ok.id).map((s) => s.discountPct)).toEqual([70]);
  });

  it("the platform's discount cap and the feature flag are respected", async () => {
    const n = store.now();
    await plat.updatePlatformSettings(P("u_admin"), { values: { maxDiscountPct: 60 }, confirm: true });
    await expect(withSteps([{ effectiveAt: iso(n + min(20)), discountPct: 70 }])).rejects.toMatchObject({ code: "step_discount_cap" });
    await plat.updatePlatformSettings(P("u_admin"), { flags: { autoMarkdown: false }, confirm: true });
    await expect(withSteps([{ effectiveAt: iso(n + min(20)), discountPct: 55 }])).rejects.toMatchObject({ code: "feature_off" });
    expect(() => vend.scheduleSuggestion(P("u_ravi"), { original: 200, rescue: 100, windowStart: iso(n + min(10)), windowEnd: iso(n + min(180)) })).toThrowError(/switched off/);
    const l = await freshListing(); // listings without a schedule still work with the flag off
    expect(l.status).toBe("Live");
  });

  it("scheduleSuggestion returns a valid schedule for a real window", async () => {
    const n = store.now();
    const s = vend.scheduleSuggestion(P("u_ravi"), { original: 200, rescue: 130, windowStart: iso(n + min(30)), windowEnd: iso(n + min(240)), category: "Bakery" });
    expect(s.steps.length).toBeGreaterThan(0);
    const l = await freshListing({ original: 200, rescue: 130, startMin: 30, endMin: 240, extra: { priceSteps: s.steps } });
    expect(store.read().priceSteps.filter((x) => x.listingId === l.id)).toHaveLength(s.steps.length);
  });
});
