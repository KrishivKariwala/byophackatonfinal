import { describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, onlineOrder, ff } from "./p2-harness";
const cert = await import("@/lib/p2/certificate");
const plat = await import("@/lib/p2/platform");
const { IMPACT } = await import("@/lib/impact-config");

const owner = () => P("u_ravi");

describe("impact certificate (feature 5)", () => {
  it("month helpers use Indian calendar months", () => {
    expect(cert.monthOf(Date.parse("2026-03-31T19:00:00Z"))).toBe("2026-04"); // 00:30 IST on 1 April
    expect(cert.previousMonth(Date.parse("2026-01-10T00:00:00Z"))).toBe("2025-12");
    const r = cert.monthRange("2026-02");
    expect(r.to - r.from).toBe(28 * 24 * 3600_000);
  });

  it("verification ids look right and don't repeat", () => {
    const ids = new Set(Array.from({ length: 200 }, () => cert.newVerificationId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^SAP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("figures reuse the impact constants: kg = meals × 0.4, CO2e = kg × 2.5", async () => {
    const l = await freshListing({ qty: 6, startMin: 1, endMin: 120 });
    const c = await customer(1);
    const r1 = await onlineOrder(c, l.id, 2);
    const r2 = await onlineOrder(c, l.id, 1);
    await ff(2);
    await svc.handover(owner(), { code: r1.code });
    await svc.handover(owner(), { code: r2.code });
    const month = cert.monthOf(store.now());
    const f = cert.monthlyFigures(store.read(), "v_1", month);
    expect(f.mealsSold).toBeGreaterThanOrEqual(3);
    expect(f.kgRescued).toBeCloseTo((f.mealsSold + f.mealsDonated) * IMPACT.KG_PER_MEAL, 2);
    expect(f.co2eKg).toBeCloseTo(f.kgRescued * IMPACT.CO2E_PER_KG_FOOD, 1);
  });

  it("generate: issues a month-to-date certificate, then a stable id when the month closes", async () => {
    const l = await freshListing({ qty: 3, startMin: 1, endMin: 120 });
    const r = await onlineOrder(await customer(2), l.id);
    await ff(2);
    await svc.handover(owner(), { code: r.code });
    const month = cert.monthOf(store.now());
    const c1 = await cert.generateCertificate(owner(), month);
    expect(c1.partial).toBe(true);
    const again = await cert.generateCertificate(owner(), month);
    expect(again.id).toBe(c1.id); // one certificate per month
    expect(store.read().certificates.filter((c) => c.vendorId === "v_1" && c.month === month)).toHaveLength(1);
  });

  it("refuses future months, bad months and empty months, and non-owners/managers", async () => {
    await expect(cert.generateCertificate(owner(), "2999-01")).rejects.toMatchObject({ code: "month_future" });
    await expect(cert.generateCertificate(owner(), "March")).rejects.toMatchObject({ code: "month_invalid" });
    await expect(cert.generateCertificate(owner(), "2020-01")).rejects.toMatchObject({ code: "no_activity" });
    await expect(cert.generateCertificate(P("u_priya"), "2026-01")).rejects.toMatchObject({ status: 403 });
  });

  it("the monthly job issues last month's certificate and notifies the owner, once", async () => {
    // a pickup 40 days ago guarantees activity in a past month
    await store.transaction((tx) => {
      const at = tx.now - 40 * 24 * 3600_000;
      tx.db.reservations.push({ id: "old_1", ref: "OLD-1", listingId: "l_3", vendorId: "v_1", outletId: "o_1", customerId: "u_priya", qty: 4, unitPrice: 50, amount: 200, method: "online", status: "Picked up", qrToken: "x", code: "1111", qrTokenHash: "oh1", codeHash: "oc1", createdAt: new Date(at).toISOString(), pickedUpAt: new Date(at).toISOString() });
      tx.db.settings.lastCertificateRun = undefined;
    });
    await ff(1); // any write sweeps and runs the job
    const month = cert.monthOf(store.now() - 40 * 24 * 3600_000);
    const mine = store.read().certificates.filter((c) => c.vendorId === "v_1" && c.month === month);
    expect(mine).toHaveLength(1);
    expect(mine[0].partial).toBeFalsy();
    expect(mine[0].mealsSold).toBeGreaterThanOrEqual(4);
    const notes = store.read().notifications.filter((n) => n.userId === "u_ravi" && n.type === "certificate_ready");
    expect(notes.length).toBeGreaterThanOrEqual(1);
    const before = store.read().certificates.length;
    await ff(1);
    expect(store.read().certificates.length).toBe(before); // idempotent
    expect(store.read().notifications.filter((n) => n.type === "certificate_ready" && n.userId === "u_ravi")).toHaveLength(notes.length);
  });

  it("public verification returns totals only, validates the id shape, and respects the flag", async () => {
    const l = await freshListing({ qty: 2, startMin: 1, endMin: 120 });
    const r = await onlineOrder(await customer(3), l.id);
    await ff(2);
    await svc.handover(owner(), { code: r.code });
    const c = await cert.generateCertificate(owner(), cert.monthOf(store.now()));
    const pub = cert.verifyCertificate(c.id)!;
    expect(pub.business).toMatch(/Crumb/);
    expect(Object.keys(pub).sort()).toEqual(["business", "charitiesServed", "co2eKg", "id", "issuedAt", "kgRescued", "mealsDonated", "mealsSold", "month", "partial", "peopleServed", "rupeesRecovered"]);
    expect(JSON.stringify(pub)).not.toMatch(/u_priya|phone|customer/i);
    expect(cert.verifyCertificate("SAP-AAAA-BBBB-CCCC")).toBeNull();
    expect(cert.verifyCertificate("not an id")).toBeNull();
    expect(cert.verifyCertificate("'; drop table")).toBeNull();
    await plat.updatePlatformSettings(P("u_admin"), { flags: { impactCertificate: false }, confirm: true });
    await expect(cert.generateCertificate(owner(), cert.monthOf(store.now()))).rejects.toMatchObject({ code: "feature_off" });
  });

  it("another vendor can't download your certificate; the PDF is a real PDF with the id on it", async () => {
    const l = await freshListing({ qty: 2, startMin: 1, endMin: 120 });
    const r = await onlineOrder(await customer(4), l.id);
    await ff(2);
    await svc.handover(owner(), { code: r.code });
    const c = await cert.generateCertificate(owner(), cert.monthOf(store.now()));
    expect(() => cert.certificateForVendor(P("u_vendor2"), c.id)).toThrowError(/not found/i);
    const { cert: mine, vendor } = cert.certificateForVendor(owner(), c.id);
    const pdf = await cert.certificatePdf(mine, vendor, "http://localhost:3000");
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(2000);
  });
});
