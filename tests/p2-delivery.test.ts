import { afterEach, describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, onlineOrder, ff } from "./p2-harness";
const dv = await import("@/lib/p2/delivery");
const plat = await import("@/lib/p2/platform");
const { setDeliveryProvider, getDeliveryProvider } = await import("@/lib/delivery");
const { MockProvider, MOCK_TIMELINE } = await import("@/lib/delivery/mock");
const { DunzoProvider, PorterProvider } = await import("@/lib/delivery/external");
const { canAdvance, DeliveryError } = await import("@/lib/delivery/provider");
const { hmac } = await import("@/lib/crypto");
import type { DeliveryJob, DeliveryProvider } from "@/lib/delivery/provider";

const ngo = () => P("u_joseph");
afterEach(() => { setDeliveryProvider(null); delete process.env.DELIVERY_PROVIDER; delete process.env.DELIVERY_WEBHOOK_SECRET; });

async function claimed(extra: Record<string, unknown> = {}) {
  const l = await freshListing({ qty: 5, startMin: 1, endMin: 60, donateRest: true, ...extra });
  await ff(61);
  const b = store.read().donationBatches.find((x) => x.listingId === l.id)!;
  await svc.claimBatch(ngo(), b.id);
  return store.read().donationBatches.find((x) => x.id === b.id)!;
}
const row = (id: string) => store.read().deliveryRequests.find((d) => d.id === id)!;

describe("delivery hand-off (feature 10)", () => {
  it("provider selection: mock by default, stubs by env, unknown values fall back to the mock", () => {
    expect(getDeliveryProvider().name).toBe("mock");
    process.env.DELIVERY_PROVIDER = "dunzo";
    expect(getDeliveryProvider().name).toBe("dunzo");
    process.env.DELIVERY_PROVIDER = "PORTER";
    expect(getDeliveryProvider().name).toBe("porter");
    process.env.DELIVERY_PROVIDER = "typo";
    expect(getDeliveryProvider().name).toBe("mock");
  });

  it("the mock provider walks Requested → Rider assigned → Picked up → Delivered on the app's clock", async () => {
    const b = await claimed();
    const d = await dv.requestDelivery(ngo(), b.id);
    expect(d).toMatchObject({ status: "Requested", provider: "mock", batchId: b.id });
    expect(d.fee).toBeGreaterThanOrEqual(30);
    expect(store.read().donationBatches.find((x) => x.id === b.id)!.deliveryRequestId).toBe(d.id);
    const seen: string[] = [];
    for (const minutes of [3, 4, 6]) { await ff(minutes); seen.push(row(d.id).status); } // elapsed 3, 7, 13 minutes
    expect(seen).toEqual(["Rider assigned", "Picked up", "Delivered"]);
    expect(row(d.id).riderName).toBeTruthy();
    const ngoNotes = store.read().notifications.filter((n) => n.userId === "u_joseph" && n.type === "delivery_update").map((n) => n.text);
    expect(ngoNotes.some((t) => /on the way/.test(t))).toBe(true);
    expect(ngoNotes.some((t) => /delivered/.test(t))).toBe(true);
    // the vendor is told when a rider is coming, with a reminder to check the code
    expect(store.read().notifications.some((n) => n.userId === "u_ravi" && /collection code/.test(n.text))).toBe(true);
  });

  it("delivery status never counts as collected: only the vendor's code check does", async () => {
    const b = await claimed();
    await dv.requestDelivery(ngo(), b.id);
    await ff(15);
    expect(store.read().donationBatches.find((x) => x.id === b.id)!.status).toBe("Claimed");
    const code = store.read().donationBatches.find((x) => x.id === b.id)!.collectionCode!;
    await svc.donationHandover(P("u_ravi"), b.id, code);
    expect(store.read().donationBatches.find((x) => x.id === b.id)!.status).toBe("Collected");
  });

  it("never sends customer information: the job is business data only (checked with a spy provider)", async () => {
    // a customer with a recognisable name and phone has an order at this very outlet
    const c = await customer(1, 0, "+91 98765 43210");
    const l0 = await freshListing({ qty: 2, startMin: 1, endMin: 60, donateRest: true });
    await onlineOrder(c, l0.id);
    const jobs: DeliveryJob[] = [];
    const spy: DeliveryProvider = { name: "spy", async request(job) { jobs.push(job); return { externalId: "spy_1", fee: 40, status: "Requested" }; }, async status() { return { status: "Requested" }; }, async cancel() {} };
    setDeliveryProvider(spy);
    const b = await claimed();
    await dv.requestDelivery(ngo(), b.id, spy);
    expect(jobs).toHaveLength(1);
    const sent = JSON.stringify(jobs[0]);
    expect(sent).not.toMatch(/Tester1|98765|43210|u_priya|customer|reservation|SAP-\d/i);
    expect(Object.keys(jobs[0]).sort()).toEqual(["drop", "item", "pickup", "pickupBy", "reference"]);
    expect(Object.keys(jobs[0].pickup).sort()).toEqual(["address", "businessName", "lat", "lng", "phone"]);
    expect(Object.keys(jobs[0].drop).sort()).toEqual(["address", "lat", "lng", "organisation", "phone"]);
  });

  it("failure handling: a partner error leaves the claim intact, tells the charity, and can be retried", async () => {
    const b = await claimed();
    const down: DeliveryProvider = { name: "down", async request() { throw new DeliveryError("provider_error", "Partner is down."); }, async status() { return { status: "Failed" }; }, async cancel() {} };
    const d = await dv.requestDelivery(ngo(), b.id, down);
    expect(d.status).toBe("Failed");
    expect(d.error).toMatch(/down/);
    expect(store.read().donationBatches.find((x) => x.id === b.id)!.status).toBe("Claimed"); // still theirs
    expect(store.read().notifications.some((n) => n.userId === "u_joseph" && /couldn't book a rider/.test(n.text))).toBe(true);
    const retry = await dv.requestDelivery(ngo(), b.id, new MockProvider());
    expect(retry.status).toBe("Requested");
  });

  it("an unconfigured real partner fails safely with a clear message; an unexpected crash is also contained", async () => {
    const b = await claimed();
    const d = await dv.requestDelivery(ngo(), b.id, new DunzoProvider());
    expect(d).toMatchObject({ status: "Failed", provider: "dunzo" });
    expect(d.error).toMatch(/DUNZO_API_KEY/);
    const crash: DeliveryProvider = { name: "crash", async request() { throw new Error("socket hang up with secret token"); }, async status() { return { status: "Failed" }; }, async cancel() {} };
    const d2 = await dv.requestDelivery(ngo(), b.id, crash);
    expect(d2.status).toBe("Failed");
    expect(d2.error).not.toMatch(/socket|secret/); // internal error text is never shown to users
    process.env.PORTER_API_KEY = "x";
    await expect((new PorterProvider() as DeliveryProvider).request({} as DeliveryJob, 0)).rejects.toMatchObject({ code: "not_implemented" });
    delete process.env.PORTER_API_KEY;
  });

  it("no rider found: reported to the charity, claim kept", async () => {
    await store.transaction((tx) => { tx.db.outlets.find((o) => o.id === "o_1")!.address += " NORIDER"; });
    const b = await claimed();
    const d = await dv.requestDelivery(ngo(), b.id);
    await ff(MOCK_TIMELINE.noRiderAfterMin + 1);
    expect(row(d.id).status).toBe("No rider found");
    expect(store.read().donationBatches.find((x) => x.id === b.id)!.status).toBe("Claimed");
    expect(store.read().notifications.some((n) => n.userId === "u_joseph" && /No rider accepted/.test(n.text))).toBe(true);
  });

  it("rules: only the claiming charity, only while claimed, one active delivery at a time, cancel before pickup", async () => {
    const b = await claimed();
    await expect(dv.requestDelivery(P("u_ngo2"), b.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(dv.requestDelivery(P("u_ravi"), b.id)).rejects.toMatchObject({ status: 403 });
    const d = await dv.requestDelivery(ngo(), b.id);
    await expect(dv.requestDelivery(ngo(), b.id)).rejects.toMatchObject({ code: "delivery_active" });
    await expect(dv.cancelDelivery(P("u_ngo2"), d.id)).rejects.toMatchObject({ code: "not_found" });
    await dv.cancelDelivery(ngo(), d.id);
    expect(row(d.id).status).toBe("Cancelled");
    await ff(15); // the timer must not resurrect a cancelled job
    expect(row(d.id).status).toBe("Cancelled");
    const d2 = await dv.requestDelivery(ngo(), b.id);
    await ff(8);
    expect(row(d2.id).status).toBe("Picked up");
    await expect(dv.cancelDelivery(ngo(), d2.id)).rejects.toMatchObject({ code: "bad_transition" });
    const open = await freshListing({ qty: 2, startMin: 1, endMin: 60, donateRest: true });
    await ff(61);
    const ob = store.read().donationBatches.find((x) => x.listingId === open.id)!;
    await expect(dv.requestDelivery(ngo(), ob.id)).rejects.toMatchObject({ code: "not_found" }); // not claimed by this charity
  });

  it("statuses only move forward", () => {
    expect(canAdvance("Requested", "Rider assigned")).toBe(true);
    expect(canAdvance("Picked up", "Rider assigned")).toBe(false);
    expect(canAdvance("Delivered", "Failed")).toBe(false);
    expect(canAdvance("Cancelled", "Picked up")).toBe(false);
    expect(canAdvance("Picked up", "Picked up")).toBe(false);
  });

  it("webhook: signature is verified before anything happens; replays and out-of-order events are harmless", async () => {
    const secret = "whsec_test";
    process.env.DELIVERY_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({ externalId: "x", status: "Delivered" });
    expect(dv.verifyDeliverySignature(body, hmac(secret, body))).toBe(true);
    expect(dv.verifyDeliverySignature(body, hmac(secret, body).toUpperCase())).toBe(true);
    expect(dv.verifyDeliverySignature(body, hmac("other", body))).toBe(false);
    expect(dv.verifyDeliverySignature(body + " ", hmac(secret, body))).toBe(false); // tampered body
    expect(dv.verifyDeliverySignature(body, "")).toBe(false);
    delete process.env.DELIVERY_WEBHOOK_SECRET;
    expect(dv.verifyDeliverySignature(body, hmac(secret, body))).toBe(false); // no secret configured: refuse everything

    const b = await claimed();
    const partner: DeliveryProvider = { name: "partner", async request() { return { externalId: "ext_42", fee: 55, status: "Requested" }; }, async status() { return { status: "Requested" }; }, async cancel() {} };
    const d = await dv.requestDelivery(ngo(), b.id, partner);
    expect((await dv.handleDeliveryWebhook({ externalId: "ext_42", status: "Rider assigned", riderName: "Asha" })).applied).toBe(true);
    expect((await dv.handleDeliveryWebhook({ externalId: "ext_42", status: "Picked up" })).applied).toBe(true);
    expect((await dv.handleDeliveryWebhook({ externalId: "ext_42", status: "Rider assigned" })).applied).toBe(false); // late/out of order
    expect((await dv.handleDeliveryWebhook({ externalId: "ext_42", status: "Picked up" })).applied).toBe(false); // replay
    expect(row(d.id)).toMatchObject({ status: "Picked up", riderName: "Asha" });
    expect((await dv.handleDeliveryWebhook({ externalId: "nope", status: "Delivered" })).applied).toBe(false);
    await expect(dv.handleDeliveryWebhook({ externalId: "ext_42", status: "Exploded" })).rejects.toMatchObject({ code: "bad_event" });
    await expect(dv.handleDeliveryWebhook({ status: "Delivered" })).rejects.toMatchObject({ code: "bad_event" });
  });

  it("the feature flag switches delivery off without touching claims", async () => {
    const b = await claimed();
    await plat.updatePlatformSettings(P("u_admin"), { flags: { delivery: false }, confirm: true });
    await expect(dv.requestDelivery(ngo(), b.id)).rejects.toMatchObject({ code: "feature_off" });
    expect(store.read().donationBatches.find((x) => x.id === b.id)!.status).toBe("Claimed");
  });
});
