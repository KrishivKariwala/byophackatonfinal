import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { beforeEach } from "vitest";
import type { Profile } from "@/lib/types";

/** Shared fixtures for the P2 test files. Imported before any lib module so DEMO_DB_PATH is set first. */
const tmp = path.join(os.tmpdir(), `sap-p2-test-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
process.env.DEMO_DB_PATH = tmp;

export const store = await import("@/lib/store");
export const svc = await import("@/lib/services");
const { buildSeed } = await import("@/lib/seed");
const { resetRateLimits } = await import("@/lib/ratelimit");
const { invalidateSettingsCache } = await import("@/lib/p2/platform");

export const P = (id: string) => store.read().profiles.find((p) => p.id === id)! as Profile;
export const iso = (ms: number) => new Date(ms).toISOString();
export const min = (n: number) => n * 60_000;

export async function freshListing(o: Partial<{ qty: number; startMin: number; endMin: number; donateRest: boolean; vendor: string; original: number; rescue: number; extra: Record<string, unknown> }> = {}) {
  const n = store.now();
  return svc.createListing(P(o.vendor ?? "u_ravi"), {
    title: "Test Box", category: "Bakery", diet: "Vegetarian", originalPrice: o.original ?? 200, rescuePrice: o.rescue ?? 100, qty: o.qty ?? 10,
    preparedAt: iso(n - min(30)), windowStart: iso(n + min(o.startMin ?? 60)), windowEnd: iso(n + min(o.endMin ?? 180)),
    donateRest: o.donateRest ?? false, safetyDeclaration: true, ...(o.extra ?? {}),
  } as Parameters<typeof svc.createListing>[1]);
}

/** A customer with `history` completed pickups already on record (so pay-at-pickup is unlocked); fixture only. */
export async function customer(i = 0, history = 3, phone?: string) {
  const c = await svc.createAccount({ name: `Tester${i} Last`, phone: phone ?? `+91911100${String(i).padStart(4, "0")}`, role: "customer" });
  await store.transaction((tx) => {
    for (let k = 0; k < history; k++)
      tx.db.reservations.push({
        id: `hist_${c.id}_${k}`, ref: `H-${c.id}-${k}`, listingId: "l_3", vendorId: "v_1", outletId: "o_1", customerId: c.id, qty: 1, unitPrice: 90, amount: 90, method: "online",
        status: "Picked up", qrToken: "x", code: "0000", qrTokenHash: `h${c.id}${k}`, codeHash: `c${c.id}${k}`, createdAt: iso(tx.now - 86400_000 * (k + 2)), pickedUpAt: iso(tx.now - 86400_000 * (k + 2)),
      });
  });
  return c;
}

export async function onlineOrder(c: Profile, listingId: string, qty = 1) {
  const h = await svc.reserve(c, { listingId, qty, method: "online" });
  if (h.kind !== "hold") throw new Error("expected hold");
  const out = await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: `pay_${h.holdId}`, eventId: `evt_${h.holdId}` });
  if (out.outcome !== "confirmed") throw new Error("not confirmed");
  return store.read().reservations.find((r) => r.id === out.reservationId)!;
}
export const ff = (m: number) => svc.fastForward(P("u_admin"), m);

beforeEach(async () => {
  if (fs.existsSync(tmp)) fs.rmSync(tmp);
  resetRateLimits();
  invalidateSettingsCache();
  await store.resetStore(buildSeed(Date.now()));
});
