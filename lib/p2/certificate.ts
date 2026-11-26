import "server-only";
import crypto from "node:crypto";
import { readDb, type TxContext } from "../store";
import { RuleError } from "../rules";
import { write } from "../services";
import { audit, iso, notifyT, requireRole, t } from "../core";
import { co2eFor, kgFor, IMPACT } from "../impact-config";
import { A4, BRAND, drawLogo, footer, newDoc, qr, rows, rule, save, text } from "../pdf";
import { cfg } from "./settings";
import { vendorCtx } from "./org";
import type { DB, ImpactCertificate, Profile, Vendor } from "../types";

/**
 * P2 feature 5: monthly impact certificate. Figures reuse lib/impact-config (the same constants as every other impact number),
 * months are Indian calendar months, and every certificate has an unguessable verification id behind a public /verify/:id page.
 */

const IST = 5.5 * 3600_000;
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export const monthOf = (ms: number) => new Date(ms + IST).toISOString().slice(0, 7);
export function monthRange(month: string): { from: number; to: number } {
  const [y, m] = month.split("-").map(Number);
  return { from: Date.UTC(y, m - 1, 1) - IST, to: Date.UTC(y, m, 1) - IST }; // [from, to)
}
export function previousMonth(ms: number): string {
  const [y, m] = monthOf(ms).split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** The figures for one vendor and month. Pure over a DB snapshot. */
export function monthlyFigures(db: DB, vendorId: string, month: string) {
  const { from, to } = monthRange(month);
  const inM = (iso?: string) => !!iso && t(iso) >= from && t(iso) < to;
  const picked = db.reservations.filter((r) => r.vendorId === vendorId && r.status === "Picked up" && inM(r.pickedUpAt));
  const mealsSold = picked.reduce((s, r) => s + r.qty, 0);
  const rupeesRecovered = picked.reduce((s, r) => s + r.amount, 0);
  const collected = db.donationBatches.filter((b) => b.vendorId === vendorId && b.status === "Collected" && inM(b.collectedAt));
  const mealsDonated = collected.reduce((s, b) => s + b.qty, 0);
  const charitiesServed = new Set(collected.map((b) => b.claimedByNgoId).filter(Boolean)).size;
  const batchIds = new Set(collected.map((b) => b.id));
  const peopleServed = db.distributionLogs.filter((l) => batchIds.has(l.batchId)).reduce((s, l) => s + l.beneficiaries, 0);
  const meals = mealsSold + mealsDonated;
  return { mealsSold, mealsDonated, kgRescued: kgFor(meals), co2eKg: co2eFor(meals), rupeesRecovered, charitiesServed, peopleServed, active: meals > 0 };
}

/** SAP-XXXX-XXXX-XXXX from 60 random bits (Crockford base32 minus lookalikes): unguessable, easy to read out. */
export function newVerificationId(): string {
  const A = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  const b = crypto.randomBytes(12);
  const s = Array.from(b, (x) => A[x % A.length]).join("");
  return `SAP-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

/** Create the certificate for (vendor, month), or refresh a partial one. Same id is kept when a month-to-date certificate is finalised. */
export function issueCertificateTx(tx: TxContext, vendor: Vendor, month: string): ImpactCertificate | null {
  const { db, now } = tx;
  const f = monthlyFigures(db, vendor.id, month);
  const partial = now < monthRange(month).to;
  const existing = db.certificates.find((c) => c.vendorId === vendor.id && c.month === month);
  if (existing && !existing.partial) return existing; // final certificates never change
  if (!f.active) return existing ?? null;
  const body = { mealsSold: f.mealsSold, mealsDonated: f.mealsDonated, kgRescued: f.kgRescued, rupeesRecovered: f.rupeesRecovered, co2eKg: f.co2eKg, charitiesServed: f.charitiesServed, peopleServed: f.peopleServed, partial: partial || undefined };
  if (existing) { Object.assign(existing, body, { createdAt: iso(now) }); return existing; }
  const c: ImpactCertificate = { id: newVerificationId(), vendorId: vendor.id, month, createdAt: iso(now), ...body };
  db.certificates.push(c);
  return c;
}

/** Monthly job: on/after the 1st, issue last month's certificate for every approved vendor with activity, and tell the owner. Runs once per month. */
export function certificateJobPending(db: DB, now: number): boolean {
  return cfg(db).flags.impactCertificate && (db.settings.lastCertificateRun ?? "") < previousMonth(now);
}
export function runCertificateJob(tx: TxContext) {
  const { db, now } = tx;
  if (!certificateJobPending(db, now)) return;
  const month = previousMonth(now);
  db.settings.lastCertificateRun = month;
  for (const v of db.vendors.filter((x) => x.status === "Approved")) {
    const had = db.certificates.some((c) => c.vendorId === v.id && c.month === month && !c.partial);
    const c = issueCertificateTx(tx, v, month);
    if (c && !c.partial && !had) {
      notifyT(tx, v.ownerId, "certificateReady", { month, meals: c.mealsSold + c.mealsDonated }, "certificate_ready", { certificateId: c.id, month });
      audit(tx, "system", "certificate_issued", "certificate", c.id, `${v.id} ${month}`);
    }
  }
}

// ---------------------------------------------------------------- services
export function generateCertificate(actor: Profile | null, month: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    if (!cfg(tx.db).flags.impactCertificate) throw new RuleError("feature_off", "Impact certificates are switched off.", 403, undefined, "feature_off_impact_certificates_are");
    const ctx = vendorCtx(tx.db, me, "certificate.view");
    if (!MONTH_RE.test(month)) throw new RuleError("month_invalid", "Choose a month like 2026-03.");
    if (month > monthOf(tx.now)) throw new RuleError("month_future", "That month hasn't started yet.");
    const c = issueCertificateTx(tx, ctx.vendor, month);
    if (!c) throw new RuleError("no_activity", "No meals were rescued in that month, so there is nothing to certify.", 409);
    audit(tx, me.id, "certificate_generated", "certificate", c.id, `${month}${c.partial ? " (month to date)" : ""}`);
    return c;
  });
}

export async function listCertificates(actor: Profile | null) {
  const db = await readDb();
  const ctx = vendorCtx(db, requireRole(actor, "vendor"), "certificate.view");
  return db.certificates.filter((c) => c.vendorId === ctx.vendor.id).sort((a, b) => (a.month < b.month ? 1 : -1));
}

/** What the public verification page may show: the organization's name and the totals. Nothing about customers, charities' names or addresses. */
export async function verifyCertificate(id: string) {
  if (!/^SAP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(id)) return null;
  const db = await readDb();
  const c = db.certificates.find((x) => x.id === id);
  if (!c) return null;
  const v = db.vendors.find((x) => x.id === c.vendorId);
  return { id: c.id, business: v?.businessName ?? "Vendor", month: c.month, issuedAt: c.createdAt, partial: !!c.partial, mealsSold: c.mealsSold, mealsDonated: c.mealsDonated,
    kgRescued: c.kgRescued, co2eKg: c.co2eKg, rupeesRecovered: c.rupeesRecovered, charitiesServed: c.charitiesServed, peopleServed: c.peopleServed };
}

export async function certificateForVendor(actor: Profile | null, id: string): Promise<{ cert: ImpactCertificate; vendor: Vendor }> {
  const db = await readDb();
  const ctx = vendorCtx(db, requireRole(actor, "vendor"), "certificate.view");
  const cert = db.certificates.find((c) => c.id === id && c.vendorId === ctx.vendor.id);
  if (!cert) throw new RuleError("not_found", "Certificate not found.", 404, undefined, "not_found_certificate_not_found");
  return { cert, vendor: ctx.vendor };
}

export async function certificatePdf(cert: ImpactCertificate, vendor: Vendor, origin: string): Promise<Uint8Array> {
  const url = `${origin.replace(/\/$/, "")}/verify/${cert.id}`;
  const d = await newDoc({ title: `Impact certificate ${cert.month}`, subject: `Verification ${cert.id}` });
  await drawLogo(d, d.margin, A4.h - 36, 96);
  d.y = A4.h - 150;
  text(d, "IMPACT CERTIFICATE", { font: d.serifBold, size: 30, color: BRAND.tomato, gap: 2 });
  text(d, cert.partial ? `${monthLabel(cert.month)} (month to date, not final)` : monthLabel(cert.month), { font: d.serif, size: 15, color: BRAND.burgundy, gap: 14 });
  text(d, "This certifies that", { size: 11, color: BRAND.muted });
  text(d, vendor.businessName, { font: d.serifBold, size: 22, gap: 2 });
  text(d, "rescued surplus food through SAVE A PLATE in Bengaluru, instead of letting it go to waste.", { size: 11, gap: 10 });
  rule(d, 16);
  const meals = cert.mealsSold + cert.mealsDonated;
  rows(d, [
    ["Meals rescued", `${meals}  (${cert.mealsSold} sold at a discount + ${cert.mealsDonated} donated)`],
    ["Food rescued", `${cert.kgRescued} kg (estimate)`],
    ["CO2e avoided", `${cert.co2eKg} kg (estimate)`],
    ["Revenue recovered", `Rs. ${cert.rupeesRecovered}`],
    ["Charities served", String(cert.charitiesServed)],
    ["People reached", cert.peopleServed ? `${cert.peopleServed} (from charity distribution logs)` : "Not reported"],
  ]);
  rule(d, 16);
  const top = d.y;
  await qr(d, url, d.margin, top - 6, 92);
  d.y = top - 6;
  text(d, "Verification ID", { x: d.margin + 110, size: 9, color: BRAND.muted });
  text(d, cert.id, { x: d.margin + 110, font: d.sansBold, size: 16, gap: 4 });
  text(d, "Anyone can check this certificate at:", { x: d.margin + 110, size: 9, color: BRAND.muted });
  text(d, url, { x: d.margin + 110, size: 9, font: d.sansBold, maxWidth: A4.w - d.margin * 2 - 110 });
  text(d, `Issued ${new Date(cert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}`, { x: d.margin + 110, size: 9, color: BRAND.muted });
  footer(d, `Estimates: one listed unit counts as one meal, ${IMPACT.KG_PER_MEAL} kg of food per meal and ${IMPACT.CO2E_PER_KG_FOOD} kg CO2e avoided per kg of food. Only completed handovers are counted. This certificate is a statement of impact, not a financial or tax document.`);
  return save(d);
}

export const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

