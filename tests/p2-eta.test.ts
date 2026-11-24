import { describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, onlineOrder, ff } from "./p2-harness";
const eta = await import("@/lib/p2/eta");
const plat = await import("@/lib/p2/platform");
const p1 = await import("@/lib/p1");

const owner = () => P("u_ravi");
const res = (id: string) => store.read().reservations.find((r) => r.id === id)!;
async function activeOrder(opts: { startMin?: number } = {}) {
  const l = await freshListing({ qty: 3, startMin: opts.startMin ?? 20, endMin: (opts.startMin ?? 20) + 160 });
  const c = await customer(1, 0);
  return { c, r: await onlineOrder(c, l.id), l };
}

describe("live ETA (feature 3)", () => {
  it("stores only minutes and a timestamp, and the vendor is told once", async () => {
    const { c, r } = await activeOrder();
    const out = await eta.setEta(c, r.id, { etaMinutes: 12 });
    expect(out).toMatchObject({ minutes: 12, stale: false });
    const stored = res(r.id);
    expect(stored.etaMinutes).toBe(12);
    expect(typeof stored.etaUpdatedAt).toBe("string");
    // nothing location-like exists anywhere on the record or in notifications
    expect(JSON.stringify(stored)).not.toMatch(/lat|lng|latitude|longitude|coord|position/i);
    const msgs = store.read().notifications.filter((n) => n.userId === "u_ravi" && n.type === "customer_eta");
    expect(msgs).toHaveLength(1);
    expect(msgs[0].text).toMatch(/Tester1 is on the way|Tester1/);
    await ff(1);
    await eta.setEta(c, r.id, { etaMinutes: 8 }); // an update doesn't spam the vendor
    expect(store.read().notifications.filter((n) => n.userId === "u_ravi" && n.type === "customer_eta")).toHaveLength(1);
    await ff(1);
    await eta.setEta(c, r.id, { etaMinutes: 1 }); // "almost there" is the one extra heads-up
    expect(store.read().notifications.filter((n) => n.userId === "u_ravi" && n.type === "customer_eta")).toHaveLength(2);
  });

  it("refuses anything but minutes: a request carrying a location is rejected and nothing is stored", async () => {
    const { c, r } = await activeOrder();
    for (const extra of [{ lat: 12.93 }, { lng: 77.6 }, { location: { lat: 1, lng: 2 } }, { coords: "12.9,77.6" }, { distanceKm: 3 }]) {
      await expect(eta.setEta(c, r.id, { etaMinutes: 5, ...extra })).rejects.toMatchObject({ code: "location_not_accepted", status: 400 });
    }
    expect(res(r.id).etaMinutes).toBeUndefined();
    expect(res(r.id).etaUpdatedAt).toBeUndefined();
  });

  it("validates the number and the moment", async () => {
    const { c, r } = await activeOrder();
    for (const bad of [-1, 241, 1.5, NaN, "soon", null]) await expect(eta.setEta(c, r.id, { etaMinutes: bad })).rejects.toMatchObject({ code: "eta_invalid" });
    await expect(eta.setEta(c, r.id, {})).rejects.toMatchObject({ code: "eta_invalid" });
    const far = await activeOrder({ startMin: 200 });
    await expect(eta.setEta(far.c, far.r.id, { etaMinutes: 10 })).rejects.toMatchObject({ code: "too_early" });
  });

  it("only the customer who owns the order can share an ETA", async () => {
    const { r } = await activeOrder();
    const stranger = await customer(2, 0);
    await expect(eta.setEta(stranger, r.id, { etaMinutes: 5 })).rejects.toMatchObject({ code: "not_found" });
    await expect(eta.setEta(owner(), r.id, { etaMinutes: 5 })).rejects.toMatchObject({ status: 403 });
    await expect(eta.setEta(null, r.id, { etaMinutes: 5 })).rejects.toMatchObject({ status: 401 });
  });

  it("is cleared when the order is collected, cancelled or missed", async () => {
    const a = await activeOrder({ startMin: 1 });
    await eta.setEta(a.c, a.r.id, { etaMinutes: 3 });
    await ff(2);
    await svc.handover(owner(), { code: a.r.code });
    expect(res(a.r.id).etaMinutes).toBeUndefined();
    await expect(eta.setEta(a.c, a.r.id, { etaMinutes: 3 })).rejects.toMatchObject({ code: "bad_transition" });

    const cc = await customer(3, 0);
    const l = await freshListing({ qty: 2, startMin: 100, endMin: 200 });
    const rb = await onlineOrder(cc, l.id);
    await store.transaction((tx) => { const x = tx.db.reservations.find((q) => q.id === rb.id)!; x.etaMinutes = 7; x.etaUpdatedAt = new Date(tx.now).toISOString(); });
    await p1.cancelReservation(cc, rb.id);
    expect(res(rb.id).etaMinutes).toBeUndefined();
  });

  it("the customer can stop sharing", async () => {
    const { c, r } = await activeOrder();
    await eta.setEta(c, r.id, { etaMinutes: 9 });
    await eta.clearEta(c, r.id);
    expect(res(r.id).etaMinutes).toBeUndefined();
  });

  it("the vendor board shows a fresh ETA, then marks it stale, and respects the flag", async () => {
    const { c, r } = await activeOrder();
    await eta.setEta(c, r.id, { etaMinutes: 6 });
    expect(eta.boardEta(store.read(), res(r.id), store.now())).toMatchObject({ minutes: 6, stale: false });
    await ff(6);
    expect(eta.boardEta(store.read(), res(r.id), store.now())).toMatchObject({ minutes: 6, stale: true });
    await plat.updatePlatformSettings(P("u_admin"), { flags: { liveEta: false }, confirm: true });
    expect(eta.boardEta(store.read(), res(r.id), store.now())).toBeNull();
    await expect(eta.setEta(c, r.id, { etaMinutes: 4 })).rejects.toMatchObject({ code: "feature_off" });
  });
});
