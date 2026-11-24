import "server-only";
import { zipSync, strToU8 } from "fflate";
import { read, type TxContext } from "../store";
import { RuleError } from "../rules";
import { newId } from "../crypto";
import { audit, iso, t, requireRole } from "../core";
import { A4, BRAND, drawLogo, footer, newDoc, rows, rule, save, text } from "../pdf";
import { cfg } from "./settings";
import { can, resolveOrg } from "./org";
import type { DB, DonationReceipt, Ngo, Profile } from "../types";

/**
 * P2 feature 9: donation receipts. One PDF per collected donation, with a unique number SAP-DR-<year>-<6 digits> that is never reused.
 * The value is an ESTIMATE (units × the listing's original price). Unless the charity holds a current 80G registration the receipt says,
 * in plain words, that it is an estimate and not a tax document; with 80G it names the registration and still tells the donor to rely on
 * the charity's official 80G receipt. Receipts are issued by a job once a donation is Collected, so older donations are covered too.
 */

import { receiptNumber } from "./receipt-number";
export { receiptNumber };
const yearOf = (ms: number) => Number(new Date(ms + 5.5 * 3600_000).toISOString().slice(0, 4));

/** An 80G registration counts only while it is still valid on the day of collection. */
export function validEightyG(n: Ngo | undefined, atMs: number): { number: string; validUntil: string } | undefined {
  const g = n?.eightyG;
  if (!g?.number?.trim() || !g.validUntil) return undefined;
  return Date.parse(`${g.validUntil}T23:59:59+05:30`) >= atMs ? { number: g.number.trim(), validUntil: g.validUntil } : undefined;
}

export function issueReceiptTx(tx: TxContext, batchId: string): DonationReceipt | null {
  const { db, now } = tx;
  if (!cfg(db).flags.donationReceipts) return null; // switched off: nothing is issued now; the job catches up if it is switched back on
  const b = db.donationBatches.find((x) => x.id === batchId);
  if (!b || b.status !== "Collected" || !b.claimedByNgoId) return null;
  const existing = db.receipts.find((r) => r.batchId === b.id);
  if (existing) return existing;
  const l = db.listings.find((x) => x.id === b.listingId);
  const ngo = db.ngos.find((n) => n.id === b.claimedByNgoId);
  const collectedAt = b.collectedAt ? t(b.collectedAt) : now;
  const year = yearOf(now);
  const n = (db.receiptSeq[year] ?? 0) + 1;
  db.receiptSeq[year] = n; // the counter only ever goes up: a number is never reissued
  const r: DonationReceipt = {
    id: newId("dr"), number: receiptNumber(year, n), batchId: b.id, vendorId: b.vendorId, ngoId: b.claimedByNgoId, createdAt: iso(now),
    item: b.title, qty: b.qty, servings: b.qty, estimatedValue: b.qty * (l?.originalPrice ?? 0), eightyG: validEightyG(ngo, collectedAt),
  };
  db.receipts.push(r);
  audit(tx, "system", "receipt_issued", "receipt", r.id, r.number);
  return r;
}

export function receiptJobPending(db: DB): boolean {
  return cfg(db).flags.donationReceipts && db.donationBatches.some((b) => b.status === "Collected" && !!b.claimedByNgoId && !db.receipts.some((r) => r.batchId === b.id));
}
export function runReceiptJob(tx: TxContext) {
  if (!cfg(tx.db).flags.donationReceipts) return;
  for (const b of tx.db.donationBatches) if (b.status === "Collected" && b.claimedByNgoId && !tx.db.receipts.some((r) => r.batchId === b.id)) issueReceiptTx(tx, b.id);
}

// ---------------------------------------------------------------- reads (owner/manager of the donor, or the receiving charity)
function scope(db: DB, actor: Profile | null): { vendorId?: string; ngoId?: string } {
  const me = requireRole(actor, "vendor", "ngo");
  if (!cfg(db).flags.donationReceipts) throw new RuleError("feature_off", "Donation receipts are switched off.", 403);
  if (me.role === "ngo") {
    const n = db.ngos.find((x) => x.ownerId === me.id);
    if (!n) throw new RuleError("no_ngo", "Complete NGO verification first.", 403);
    return { ngoId: n.id };
  }
  const org = resolveOrg(db, me);
  if (!org) throw new RuleError("no_vendor", "Complete vendor onboarding first.", 403);
  if (!can(org.role, "receipts.view")) throw new RuleError("forbidden_role", "Receipts are visible to the owner and managers.", 403);
  return { vendorId: org.vendor.id };
}

export function listReceipts(actor: Profile | null, range?: { from?: string; to?: string }) {
  const db = read();
  const s = scope(db, actor);
  const from = range?.from ? Date.parse(`${range.from}T00:00:00+05:30`) : -Infinity;
  const to = range?.to ? Date.parse(`${range.to}T23:59:59.999+05:30`) : Infinity;
  if (range?.from && !Number.isFinite(from)) throw new RuleError("date_invalid", "Choose a valid start date.");
  if (range?.to && !Number.isFinite(to)) throw new RuleError("date_invalid", "Choose a valid end date.");
  return db.receipts
    .filter((r) => (s.vendorId ? r.vendorId === s.vendorId : r.ngoId === s.ngoId) && t(r.createdAt) >= from && t(r.createdAt) <= to)
    .sort((a, b) => (a.number < b.number ? 1 : -1))
    .map((r) => view(db, r));
}
const view = (db: DB, r: DonationReceipt) => ({
  ...r, vendorName: db.vendors.find((v) => v.id === r.vendorId)?.businessName ?? "Vendor", ngoName: db.ngos.find((n) => n.id === r.ngoId)?.orgName ?? "Charity",
  collectedAt: db.donationBatches.find((b) => b.id === r.batchId)?.collectedAt ?? r.createdAt,
});

export function receiptForActor(actor: Profile | null, id: string) {
  const db = read();
  const s = scope(db, actor);
  const r = db.receipts.find((x) => x.id === id && (s.vendorId ? x.vendorId === s.vendorId : x.ngoId === s.ngoId));
  if (!r) throw new RuleError("not_found", "Receipt not found.", 404);
  return { receipt: r, db };
}

export async function receiptPdf(db: DB, r: DonationReceipt): Promise<Uint8Array> {
  const v = db.vendors.find((x) => x.id === r.vendorId);
  const ngo = db.ngos.find((x) => x.id === r.ngoId);
  const collected = db.donationBatches.find((b) => b.id === r.batchId)?.collectedAt ?? r.createdAt;
  const d = await newDoc({ title: `Donation receipt ${r.number}`, subject: r.number });
  await drawLogo(d, d.margin, A4.h - 36, 96);
  d.y = A4.h - 150;
  text(d, "DONATION RECEIPT", { font: d.serifBold, size: 28, color: BRAND.tomato, gap: 2 });
  text(d, `No. ${r.number}`, { font: d.sansBold, size: 14, color: BRAND.burgundy, gap: 12 });
  rule(d, 12);
  rows(d, [
    ["Donor", v?.businessName ?? "Vendor"],
    ["Received by", ngo?.orgName ?? "Charity"],
    ["Charity registration", ngo?.registrationNumber ? ngo.registrationNumber : "Not provided"],
    ["Collected on", new Date(collected).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })],
    ["Item", r.item],
    ["Quantity", `${r.qty} units (about ${r.servings} servings)`],
    ["Estimated value", `Rs. ${r.estimatedValue}  (units x original menu price)`],
  ]);
  rule(d, 14);
  if (r.eightyG) {
    text(d, `The receiving charity holds an 80G registration: ${r.eightyG.number}, valid until ${r.eightyG.validUntil}.`, { font: d.sansBold, size: 10, gap: 3 });
    text(d, "This receipt records the donation and an estimated value. Any tax deduction depends on the official receipt issued by the charity and on your tax adviser's advice.", { size: 10 });
  } else {
    text(d, "Estimated value, not a tax document.", { font: d.sansBold, size: 11, color: BRAND.tomato, gap: 3 });
    text(d, "The receiving charity has no current 80G registration on file with SAVE A PLATE, so this receipt cannot be used to claim a tax deduction. It is a record of the food donated.", { size: 10 });
  }
  footer(d, "Issued by SAVE A PLATE. The value is an estimate based on the vendor's original listed price. The receipt number is unique and is never reused.");
  return save(d);
}

/** A zip of PDFs for a date range (one file per receipt) plus an index.csv. */
export async function receiptsZip(actor: Profile | null, range: { from?: string; to?: string }): Promise<{ data: Uint8Array; count: number }> {
  const list = listReceipts(actor, range);
  if (list.length === 0) throw new RuleError("no_receipts", "No receipts in that date range.", 404);
  if (list.length > 500) throw new RuleError("range_too_large", "That is more than 500 receipts. Choose a shorter date range.", 413);
  const db = read();
  const files: Record<string, Uint8Array> = {};
  const csv = ["number,date,donor,charity,item,quantity,estimated_value_inr,80g"];
  for (const r of list) {
    files[`${r.number}.pdf`] = await receiptPdf(db, r);
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    csv.push([r.number, r.collectedAt.slice(0, 10), q(r.vendorName), q(r.ngoName), q(r.item), r.qty, r.estimatedValue, r.eightyG?.number ?? ""].join(","));
  }
  files["index.csv"] = strToU8(csv.join("\n"));
  return { data: zipSync(files, { level: 6 }), count: list.length };
}
