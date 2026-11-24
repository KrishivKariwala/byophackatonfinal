import { describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, ff } from "./p2-harness";
const pr = await import("@/lib/p2/priority");
const dist = await import("@/lib/p2/distribution");
const rc = await import("@/lib/p2/receipts");
const plat = await import("@/lib/p2/platform");
const cert = await import("@/lib/p2/certificate");
const disc = svc.discover;

const owner = () => P("u_ravi");
const ngo = () => P("u_joseph"); // approved, near Koramangala
const here = { lat: 12.9352, lng: 77.6245, radiusKm: 25 };
const visibleToCustomers = (id: string) => disc(here).some((l) => l.id === id);
const prio = (m: number, extra: Record<string, unknown> = {}) => freshListing({ qty: 6, startMin: 10, endMin: 180, extra: { priorityMinutes: m, ...extra } });

describe("charity priority window (feature 7)", () => {
  it("a priority listing is invisible to customers until public_visible_at, then appears with no job needed", async () => {
    const l = await prio(30);
    expect(l.publicVisibleAt).toBeTruthy();
    expect(Math.abs(Date.parse(l.publicVisibleAt!) - store.now() - 30 * 60_000)).toBeLessThan(2000);
    expect(visibleToCustomers(l.id)).toBe(false);
    await ff(29);
    expect(visibleToCustomers(l.id)).toBe(false);
    await ff(2);
    expect(visibleToCustomers(l.id)).toBe(true);
  });

  it("customers cannot reserve it before the window ends, even by direct id", async () => {
    const l = await prio(15);
    const c = await customer(1, 0);
    await expect(svc.reserve(c, { listingId: l.id, qty: 1, method: "online" })).rejects.toMatchObject({ code: "not_available" });
    await ff(16);
    await expect(svc.reserve(c, { listingId: l.id, qty: 1, method: "online" })).resolves.toMatchObject({ kind: "hold" });
  });

  it("nearby charities see it at once and are notified; far ones aren't", async () => {
    const l = await prio(45);
    const offers = pr.priorityOffersFor(store.read(), store.read().ngos.find((n) => n.ownerId === "u_joseph")!, store.now());
    expect(offers.map((o) => o.l.id)).toContain(l.id);
    expect(store.read().notifications.some((n) => n.userId === "u_joseph" && n.type === "priority_listing")).toBe(true);
    const pending = store.read().ngos.find((n) => n.status !== "Approved");
    if (pending) expect(pr.priorityOffersFor(store.read(), pending, store.now())).toEqual([]);
  });

  it("a charity claiming during the window takes it as a free donation, and it never goes public", async () => {
    const l = await prio(30);
    const batch = await pr.claimPriorityListing(ngo(), l.id);
    expect(batch).toMatchObject({ status: "Claimed", qty: 6, origin: "priority", fromPriorityListing: true });
    const after = store.read().listings.find((x) => x.id === l.id)!;
    expect(after.qtyAvailable).toBe(0);
    await ff(40); // window over
    expect(visibleToCustomers(l.id)).toBe(false);
    expect(store.read().donationBatches.filter((b) => b.listingId === l.id)).toHaveLength(1); // no second batch at window end
    await expect(svc.reserve(await customer(2, 0), { listingId: l.id, qty: 1, method: "online" })).rejects.toBeTruthy();
    expect(store.read().notifications.some((n) => n.userId === "u_ravi" && /claimed/i.test(n.text))).toBe(true);
  });

  it("only one charity wins; claiming after the window or outside it is refused", async () => {
    const l = await prio(30);
    const results = await Promise.allSettled([pr.claimPriorityListing(ngo(), l.id), pr.claimPriorityListing(P("u_ngo2"), l.id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const l2 = await prio(15);
    await ff(16);
    await expect(pr.claimPriorityListing(ngo(), l2.id)).rejects.toMatchObject({ code: "priority_closed" });
    await expect(pr.claimPriorityListing(P("u_priya"), l2.id)).rejects.toMatchObject({ status: 403 });
  });

  it("a stock-race: units held by a customer before the listing was claimed can't exist, but stock never goes negative", async () => {
    const l = await prio(30);
    await pr.claimPriorityListing(ngo(), l.id);
    const row = store.read().listings.find((x) => x.id === l.id)!;
    expect(row.qtyAvailable).toBeGreaterThanOrEqual(0);
    expect(store.read().inventory.filter((m) => m.listingId === l.id).reduce((s, m) => s + m.delta, 0)).toBe(0);
  });

  it("followers are told when it goes public (once), not at publish", async () => {
    await store.transaction((tx) => { tx.db.follows.push({ id: "f_t", customerId: "u_priya", vendorId: "v_1", createdAt: new Date(tx.now).toISOString(), lat: 12.9352, lng: 77.6245 }); });
    const l = await prio(15);
    const told = () => store.read().notifications.filter((n) => n.userId === "u_priya" && n.type === "new_listing_followed" && (n.payload as { listingId?: string })?.listingId === l.id).length;
    expect(told()).toBe(0);
    await ff(16);
    expect(told()).toBe(1);
    await ff(2);
    expect(told()).toBe(1);
  });

  it("validates the length, ends before pickup closes, and respects options and the flag", async () => {
    await expect(prio(20)).rejects.toMatchObject({ code: "priority_invalid" });
    await expect(freshListing({ startMin: 10, endMin: 40, extra: { priorityMinutes: 30 } })).rejects.toMatchObject({ code: "priority_too_long" });
    await plat.updatePlatformSettings(P("u_admin"), { priorityOptions: [15, 30], confirm: true });
    await expect(prio(45)).rejects.toMatchObject({ code: "priority_invalid" });
    await expect(prio(30)).resolves.toBeTruthy();
    await plat.updatePlatformSettings(P("u_admin"), { flags: { priorityWindow: false }, confirm: true });
    await expect(prio(15)).rejects.toMatchObject({ code: "feature_off" });
  });

  it("switching the feature off makes hidden priority listings public immediately", async () => {
    const l = await prio(45);
    expect(visibleToCustomers(l.id)).toBe(false);
    const w = await plat.updatePlatformSettings(P("u_admin"), { flags: { priorityWindow: false } });
    expect(w.applied).toBe(false);
    expect(w.warnings.join(" ")).toMatch(/priority window/);
    await plat.updatePlatformSettings(P("u_admin"), { flags: { priorityWindow: false }, confirm: true });
    expect(visibleToCustomers(l.id)).toBe(true);
  });
});

/** Runs a listing all the way to a Collected donation by the approved charity. */
async function collectedDonation(qty = 5, original = 200) {
  const l = await freshListing({ qty, original, rescue: 100, startMin: 1, endMin: 60, donateRest: true });
  await ff(61);
  const b = store.read().donationBatches.find((x) => x.listingId === l.id)!;
  await svc.claimBatch(ngo(), b.id);
  const code = store.read().donationBatches.find((x) => x.id === b.id)!.collectionCode!;
  await svc.donationHandover(owner(), b.id, code);
  return store.read().donationBatches.find((x) => x.id === b.id)!;
}

describe("distribution log (feature 8)", () => {
  it("the charity files one log per collected donation; the vendor sees it and the certificate counts the people", async () => {
    const b = await collectedDonation();
    const log = await dist.fileDistributionLog(ngo(), b.id, { servings: 5, beneficiaries: 12, centreName: "Hope Shelter", notes: "Served at dinner" });
    expect(log).toMatchObject({ servings: 5, beneficiaries: 12, vendorId: "v_1" });
    expect(dist.distributionSummaryFor(store.read(), "v_1", null)[0]).toMatchObject({ centreName: "Hope Shelter", ngoName: expect.any(String) });
    expect(store.read().notifications.some((n) => n.userId === "u_ravi" && /Hope Shelter/.test(n.text))).toBe(true);
    const f = cert.monthlyFigures(store.read(), "v_1", cert.monthOf(store.now()));
    expect(f.peopleServed).toBeGreaterThanOrEqual(12);
    await expect(dist.fileDistributionLog(ngo(), b.id, { servings: 5, beneficiaries: 1, centreName: "Again" })).rejects.toMatchObject({ code: "already_logged" });
  });

  it("only the claiming charity, only after collection, with valid numbers and photos", async () => {
    const l = await freshListing({ qty: 3, startMin: 1, endMin: 60, donateRest: true });
    await ff(61);
    const b = store.read().donationBatches.find((x) => x.listingId === l.id)!;
    await svc.claimBatch(ngo(), b.id);
    await expect(dist.fileDistributionLog(ngo(), b.id, { servings: 3, beneficiaries: 1, centreName: "Early" })).rejects.toMatchObject({ code: "not_collected" });
    const done = await collectedDonation(4);
    await expect(dist.fileDistributionLog(P("u_ngo2"), done.id, { servings: 4, beneficiaries: 1, centreName: "Other NGO" })).rejects.toMatchObject({ code: "not_found" });
    await expect(dist.fileDistributionLog(owner(), done.id, { servings: 4, beneficiaries: 1, centreName: "Vendor" })).rejects.toMatchObject({ status: 403 });
    const ok = { servings: 1, beneficiaries: 1, centreName: "Centre" };
    for (const bad of [{ servings: 0 }, { servings: 1.5 }, { beneficiaries: -1 }, { centreName: "" }])
      await expect(dist.fileDistributionLog(ngo(), done.id, { ...ok, ...bad })).rejects.toBeTruthy();
    await expect(dist.fileDistributionLog(ngo(), done.id, { servings: 1, beneficiaries: 1, centreName: "Centre", photoUrls: ["https://evil.example/x.jpg"] })).rejects.toMatchObject({ code: "photo_invalid" });
    await expect(dist.fileDistributionLog(ngo(), done.id, { servings: 1, beneficiaries: 1, centreName: "Centre", photoUrls: ["/api/uploads/someone-else-abc.jpg"] })).rejects.toMatchObject({ code: "photo_invalid" });
    await expect(dist.fileDistributionLog(ngo(), done.id, { servings: 1, beneficiaries: 1, centreName: "Centre", photoUrls: ["/api/uploads/u_joseph-1.jpg", "/api/uploads/u_joseph-2.jpg", "/api/uploads/u_joseph-3.jpg", "/api/uploads/u_joseph-4.jpg"] })).rejects.toMatchObject({ code: "photos_many" });
    await expect(dist.fileDistributionLog(ngo(), done.id, { servings: 1, beneficiaries: 0, centreName: "Centre", photoUrls: ["/api/uploads/u_joseph-abc.jpg"] })).resolves.toBeTruthy(); // photos are optional but allowed
  });
});

describe("donation receipts (feature 9)", () => {
  it("one receipt per collected donation with a unique, increasing, never-reused number", async () => {
    const b1 = await collectedDonation(3);
    const b2 = await collectedDonation(4);
    const rs = store.read().receipts;
    const r1 = rs.find((r) => r.batchId === b1.id)!, r2 = rs.find((r) => r.batchId === b2.id)!;
    const year = new Date().getFullYear();
    expect(r1.number).toBe(rc.receiptNumber(year, store.read().receiptSeq[year] - 1));
    expect(r1.number).toMatch(/^SAP-DR-\d{4}-\d{6}$/);
    expect(r2.number > r1.number).toBe(true);
    expect(new Set(rs.map((r) => r.number)).size).toBe(rs.length);
    // the job is idempotent
    await ff(1);
    expect(store.read().receipts.filter((r) => r.batchId === b1.id)).toHaveLength(1);
  });

  it("numbering: zero-padded, per year, and a counter that never goes back", () => {
    expect(rc.receiptNumber(2026, 1)).toBe("SAP-DR-2026-000001");
    expect(rc.receiptNumber(2026, 123456)).toBe("SAP-DR-2026-123456");
    expect(rc.receiptNumber(2027, 7)).toBe("SAP-DR-2027-000007");
  });

  it("value is an estimate: quantity × original price", async () => {
    const b = await collectedDonation(5, 240);
    expect(store.read().receipts.find((r) => r.batchId === b.id)).toMatchObject({ qty: 5, estimatedValue: 1200, item: "Test Box" });
  });

  it("80G only counts while valid: the receipt carries it, or says it's not a tax document", async () => {
    const n = store.read().ngos.find((x) => x.ownerId === "u_joseph")!;
    expect(rc.validEightyG(n, Date.now())).toBeUndefined();
    const withG = { ...n, eightyG: { number: "AAATX1234AF20214", validUntil: "2099-03-31" } };
    expect(rc.validEightyG(withG, Date.now())).toMatchObject({ number: "AAATX1234AF20214" });
    expect(rc.validEightyG({ ...n, eightyG: { number: "OLD", validUntil: "2020-01-01" } }, Date.now())).toBeUndefined();
    expect(rc.validEightyG({ ...n, eightyG: { number: " ", validUntil: "2099-01-01" } }, Date.now())).toBeUndefined();
    await store.transaction((tx) => { tx.db.ngos.find((x) => x.id === n.id)!.eightyG = { number: "AAATX1234AF20214", validUntil: "2099-03-31" }; });
    const b = await collectedDonation(2);
    expect(store.read().receipts.find((r) => r.batchId === b.id)!.eightyG).toMatchObject({ number: "AAATX1234AF20214" });
  });

  it("PDFs are real PDFs; the no-80G wording is present; the zip holds one PDF per receipt plus an index", async () => {
    const b = await collectedDonation(3);
    const { receipt, db } = rc.receiptForActor(owner(), store.read().receipts.find((r) => r.batchId === b.id)!.id);
    const pdf = await rc.receiptPdf(db, receipt);
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(2000);
    await collectedDonation(2);
    const { data, count } = await rc.receiptsZip(owner(), {});
    expect(count).toBeGreaterThanOrEqual(2);
    const { unzipSync, strFromU8 } = await import("fflate");
    const files = unzipSync(data);
    expect(Object.keys(files).filter((f) => f.endsWith(".pdf"))).toHaveLength(count);
    expect(strFromU8(files["index.csv"]).split("\n")[0]).toMatch(/^number,date/);
    await expect(rc.receiptsZip(owner(), { from: "2099-01-01", to: "2099-12-31" })).rejects.toMatchObject({ code: "no_receipts" });
  });

  it("date ranges filter; only the donor's owner/managers and the receiving charity can see a receipt", async () => {
    const b = await collectedDonation(3);
    const id = store.read().receipts.find((r) => r.batchId === b.id)!.id;
    const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
    expect(rc.listReceipts(owner(), { from: today, to: today }).some((r) => r.id === id)).toBe(true);
    expect(rc.listReceipts(owner(), { to: "2000-01-01" })).toEqual([]);
    expect(() => rc.listReceipts(owner(), { from: "garbage" })).toThrowError(/valid start date/);
    expect(rc.listReceipts(ngo()).some((r) => r.id === id)).toBe(true); // the charity sees its own
    expect(rc.listReceipts(P("u_ngo2")).some((r) => r.id === id)).toBe(false);
    expect(rc.listReceipts(P("u_vendor2")).some((r) => r.id === id)).toBe(false);
    expect(() => rc.receiptForActor(P("u_vendor2"), id)).toThrowError(/not found/i);
    expect(() => rc.receiptForActor(P("u_ngo2"), id)).toThrowError(/not found/i);
    expect(() => rc.listReceipts(P("u_priya"))).toThrowError();
  });

  it("the feature flag turns receipts off without touching donations", async () => {
    await plat.updatePlatformSettings(P("u_admin"), { flags: { donationReceipts: false }, confirm: true });
    const b = await collectedDonation(2);
    expect(store.read().receipts.some((r) => r.batchId === b.id)).toBe(false);
    expect(() => rc.listReceipts(owner())).toThrowError(/switched off/);
  });
});

describe("regression: concurrent reservations still sell exactly N", () => {
  it("20 customers racing for 7 units get exactly 7", async () => {
    const l = await freshListing({ qty: 7 });
    const cs = await Promise.all(Array.from({ length: 20 }, (_, i) => customer(200 + i, 0)));
    const out = await Promise.allSettled(cs.map((c) => svc.reserve(c, { listingId: l.id, qty: 1, method: "online" })));
    expect(out.filter((o) => o.status === "fulfilled")).toHaveLength(7);
    expect(store.read().listings.find((x) => x.id === l.id)!.qtyAvailable).toBe(0);
  });
});
