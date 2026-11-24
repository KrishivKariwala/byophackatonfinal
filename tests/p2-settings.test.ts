import { describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, onlineOrder } from "./p2-harness";
const plat = await import("@/lib/p2/platform");
const { cfg, resolveSettings, DEFAULTS } = await import("@/lib/p2/settings");

const admin = () => P("u_admin");

describe("platform settings (feature 12)", () => {
  it("a store without any P2 settings behaves exactly like P0/P1 (defaults equal the old constants)", () => {
    const c = cfg(store.read());
    expect(c.holdMinutes).toBe(5);
    expect(c.freeCancelMinutes).toBe(30);
    expect(c.maxActiveReservations).toBe(3);
    expect(c.platformFeeBps).toBe(1000);
    expect(Object.values(c.flags).every(Boolean)).toBe(true);
    expect(resolveSettings(undefined).holdMinutes).toBe(DEFAULTS.holdMinutes);
  });

  it("only admins can change settings", async () => {
    await expect(plat.updatePlatformSettings(P("u_ravi"), { values: { holdMinutes: 8 } })).rejects.toMatchObject({ status: 403 });
    await expect(plat.updatePlatformSettings(P("u_priya"), { values: { holdMinutes: 8 } })).rejects.toMatchObject({ status: 403 });
    await expect(plat.updatePlatformSettings(null, { values: { holdMinutes: 8 } })).rejects.toBeTruthy();
  });

  it("validates ranges: hold time 2–15 minutes, and so on", async () => {
    for (const bad of [1, 16, 0, -3, 7.5, NaN]) await expect(plat.updatePlatformSettings(admin(), { values: { holdMinutes: bad } })).rejects.toMatchObject({ code: "setting_range" });
    await expect(plat.updatePlatformSettings(admin(), { values: { maxDiscountPct: 20 } })).rejects.toMatchObject({ code: "setting_range" }); // the 30% minimum can never be cancelled
    await expect(plat.updatePlatformSettings(admin(), { values: { platformFeeBps: 5000 } })).rejects.toMatchObject({ code: "setting_range" });
    await expect(plat.updatePlatformSettings(admin(), { priorityOptions: [10] })).rejects.toMatchObject({ code: "setting_range" });
    await expect(plat.updatePlatformSettings(admin(), { priorityOptions: [] })).rejects.toMatchObject({ code: "setting_range" });
    await expect(plat.updatePlatformSettings(admin(), { flags: { nope: true } as never })).rejects.toMatchObject({ code: "setting_unknown" });
    expect(store.read().settingsAudit).toHaveLength(0); // nothing half-applied
    const ok = await plat.updatePlatformSettings(admin(), { values: { holdMinutes: 2 } });
    expect(ok).toMatchObject({ applied: true, changed: 1 });
    await plat.updatePlatformSettings(admin(), { values: { holdMinutes: 15 } });
  });

  it("every change is in the audit trail with who, what, from and to", async () => {
    await plat.updatePlatformSettings(admin(), { values: { holdMinutes: 8, defaultRadiusKm: 7 }, flags: { referrals: false } });
    const trail = store.read().settingsAudit;
    expect(trail.map((c) => c.key).sort()).toEqual(["defaultRadiusKm", "flag:referrals", "holdMinutes"]);
    const h = trail.find((c) => c.key === "holdMinutes")!;
    expect([h.from, h.to, h.adminId]).toEqual(["5", "8", "u_admin"]);
    expect(store.read().audit.some((a) => a.action === "setting_changed")).toBe(true);
    // setting the same value again records nothing
    await plat.updatePlatformSettings(admin(), { values: { holdMinutes: 8 } });
    expect(store.read().settingsAudit).toHaveLength(3);
  });

  it("the cache serves for 60 seconds but a write is visible immediately", async () => {
    expect(plat.getSettings().holdMinutes).toBe(5);
    await plat.updatePlatformSettings(admin(), { values: { holdMinutes: 9 } });
    await new Promise((r) => setTimeout(r, 5)); // invalidation runs after commit
    expect(plat.getSettings().holdMinutes).toBe(9);
    expect(plat.getSettings()).toBe(plat.getSettings()); // same object: served from cache
  });

  it("the hold time is used for new checkout holds", async () => {
    await plat.updatePlatformSettings(admin(), { values: { holdMinutes: 10 } });
    const l = await freshListing();
    const c = await customer(1);
    const h = await svc.reserve(c, { listingId: l.id, qty: 1, method: "online" });
    expect(h.kind).toBe("hold");
    const hold = store.read().holds.find((x) => x.listingId === l.id)!;
    expect(Date.parse(hold.expiresAt) - store.now()).toBeGreaterThan(9 * 60_000);
    expect(Date.parse(hold.expiresAt) - store.now()).toBeLessThanOrEqual(10 * 60_000 + 1000);
  });

  it("max active reservations and the discount cap are enforced from settings", async () => {
    await plat.updatePlatformSettings(admin(), { values: { maxActiveReservations: 1, maxDiscountPct: 50 }, confirm: true });
    const l = await freshListing({ qty: 5 });
    const c = await customer(2);
    await onlineOrder(c, l.id);
    await expect(svc.reserve(c, { listingId: l.id, qty: 1, method: "online" })).rejects.toMatchObject({ code: "active_cap" });
    // a 60%-off listing is now refused; 50% off is fine
    await expect(freshListing({ original: 200, rescue: 80 })).rejects.toMatchObject({ code: "discount_too_large" });
    await expect(freshListing({ original: 200, rescue: 100 })).resolves.toBeTruthy();
  });

  it("warns when a change affects live listings and applies only once confirmed", async () => {
    const before = (await plat.updatePlatformSettings(admin(), { values: { maxDiscountPct: 50 } })).warnings.join(" ").match(/^(\d+) live/)![1];
    await freshListing({ original: 200, rescue: 60 }); // one more listing at 70% off
    const first = await plat.updatePlatformSettings(admin(), { values: { maxDiscountPct: 50 } });
    expect(first.applied).toBe(false);
    expect(first.warnings.join(" ")).toContain(`${Number(before) + 1} live listings`);
    expect(cfg(store.read()).maxDiscountPct).toBe(80); // nothing changed yet
    const second = await plat.updatePlatformSettings(admin(), { values: { maxDiscountPct: 50 }, confirm: true });
    expect(second.applied).toBe(true);
    expect(cfg(store.read()).maxDiscountPct).toBe(50);
  });

  it("flags are switchable without code changes and default to on", async () => {
    await plat.updatePlatformSettings(admin(), { flags: { liveEta: false, delivery: false } });
    const c = cfg(store.read());
    expect([c.flags.liveEta, c.flags.delivery, c.flags.referrals]).toEqual([false, false, true]);
    await plat.updatePlatformSettings(admin(), { flags: { liveEta: true } });
    expect(cfg(store.read()).flags.liveEta).toBe(true);
  });
});
