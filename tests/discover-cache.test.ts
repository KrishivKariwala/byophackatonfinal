import { describe, expect, it } from "vitest";
import { customer, ff, freshListing, onlineOrder, svc } from "./p2-harness";

const filters = { lat: 12.9352, lng: 77.6245, radiusKm: 25 } as const;
const find = async (id: string) => (await svc.discover({ ...filters })).find((l) => l.id === id);

describe("the feed cache never shows stale stock", () => {
  it("identical requests in the same second share one result", async () => {
    const a = (await svc.discover({ ...filters }));
    const b = (await svc.discover({ ...filters }));
    expect(b).toBe(a);
  });

  it("a reservation shows up in the very next feed read", async () => {
    const l = await freshListing({ qty: 5, startMin: 5, endMin: 60 });
    expect((await find(l.id))?.qtyAvailable).toBe(5);
    const c = await customer(1, 0);
    await onlineOrder(c, l.id, 2);
    expect((await find(l.id))?.qtyAvailable).toBe(3);
  });

  it("different filters get different results", async () => {
    const all = (await svc.discover({ ...filters }));
    const none = (await svc.discover({ ...filters, q: "no-such-dish-anywhere" }));
    expect(none.length).toBe(0);
    expect(all.length).toBeGreaterThan(0);
  });

  it("moving the demo clock past a listing's end removes it from the feed", async () => {
    const l = await freshListing({ qty: 5, startMin: 5, endMin: 30 });
    expect((await find(l.id))).toBeTruthy();
    await ff(60);
    expect((await find(l.id))).toBeUndefined();
  });
});
