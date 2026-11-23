import "server-only";
import { read, now as clockNow } from "./store";
import { RULES, RuleError } from "./rules";
import { newId } from "./crypto";
import { write, createListing, CATEGORIES } from "./services";
import { approvedVendorOf, audit, iso, listingIn, requireRole, t, vendorOf, outletOf } from "./core";
import { sellThroughRate, suggestPrice } from "./pricing";
import { vendorAnalytics, vendorPayouts, type Range } from "./analytics";
import type { DB, Outlet, Profile, Template, Vendor } from "./types";

/** P1 vendor-side features: templates, settings, price suggestion, profile completeness, analytics, payouts. */

// ---------------------------------------------------------------- templates (B1)
export function saveTemplateFromListing(actor: Profile | null, listingId: string) {
  return write((tx): Template => {
    const me = requireRole(actor, "vendor");
    const v = approvedVendorOf(tx.db, me);
    const l = listingIn(tx.db, listingId);
    if (l.vendorId !== v.id) throw new RuleError("forbidden", "Not your listing.", 403);
    const dup = tx.db.templates.find((x) => x.vendorId === v.id && x.title === l.title && x.originalPrice === l.originalPrice);
    if (dup) throw new RuleError("template_exists", "A template like this already exists.", 409);
    const tpl: Template = {
      id: newId("t"), vendorId: v.id, title: l.title, description: l.description, category: l.category, originalPrice: l.originalPrice,
      rescuePrice: l.rescuePrice, diet: l.diet, allergens: l.allergens, surpriseBag: l.surpriseBag, storageNote: l.storageNote,
      qty: l.qtyTotal, donateRest: l.donateRest, donationOnly: l.donationOnly, riskTag: l.riskTag,
      windowMinutes: Math.max(15, Math.round((t(l.windowEnd) - t(l.windowStart)) / 60_000)), createdAt: iso(tx.now),
    };
    tx.db.templates.push(tpl);
    audit(tx, me.id, "template_saved", "template", tpl.id, l.id);
    return tpl;
  });
}

export function deleteTemplate(actor: Profile | null, id: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const v = vendorOf(tx.db, me);
    const i = tx.db.templates.findIndex((x) => x.id === id && x.vendorId === v.id);
    if (i < 0) throw new RuleError("not_found", "Template not found.", 404);
    tx.db.templates.splice(i, 1);
    return { deleted: true };
  });
}

/** One-tap repost: fresh pickup times (next quarter-hour at least 30 min away, same length), prepared now. Re-confirms the safety declaration. */
export async function repostTemplate(actor: Profile | null, id: string, opts: { declaration: boolean; startInMinutes?: number }) {
  const db = read();
  const me = requireRole(actor, "vendor");
  const v = vendorOf(db, me);
  const tpl = db.templates.find((x) => x.id === id && x.vendorId === v.id);
  if (!tpl) throw new RuleError("not_found", "Template not found.", 404);
  if (opts.declaration !== true) throw new RuleError("declaration_required", "Confirm the food-safety declaration to publish.");
  const n = clockNow(db);
  const lead = Math.max(5, Math.min(120, opts.startInMinutes ?? 30)) * 60_000;
  const start = Math.ceil((n + lead) / (15 * 60_000)) * 15 * 60_000;
  const len = (tpl.windowMinutes ?? 90) * 60_000;
  return createListing(actor, {
    title: tpl.title, description: tpl.description, category: tpl.category, originalPrice: tpl.originalPrice, rescuePrice: tpl.rescuePrice,
    qty: tpl.qty ?? 10, diet: tpl.diet, allergens: tpl.allergens, surpriseBag: tpl.surpriseBag, storageNote: tpl.storageNote,
    preparedAt: iso(n - 60_000), windowStart: iso(start), windowEnd: iso(start + len), donateRest: tpl.donateRest ?? true,
    donationOnly: tpl.donationOnly, riskTag: tpl.riskTag, safetyDeclaration: true,
  });
}

// ---------------------------------------------------------------- settings (A8 / D2)
export function updateVendorSettings(actor: Profile | null, i: { payAtPickup?: boolean; maxUnitsPerOrder?: number | null }) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const v = vendorOf(tx.db, me);
    const o = tx.db.outlets.find((x) => x.vendorId === v.id);
    if (!o) throw new RuleError("no_outlet", "Add your outlet address first.", 409);
    if (i.payAtPickup !== undefined) o.payAtPickup = !!i.payAtPickup;
    if (i.maxUnitsPerOrder !== undefined) {
      if (i.maxUnitsPerOrder === null) v.maxUnitsPerOrder = undefined;
      else {
        const n = Number(i.maxUnitsPerOrder);
        if (!Number.isInteger(n) || n < RULES.MAX_UNITS_PER_ORDER || n > 50) throw new RuleError("cap_invalid", `Choose a whole number from ${RULES.MAX_UNITS_PER_ORDER} to 50.`);
        v.maxUnitsPerOrder = n;
      }
    }
    audit(tx, me.id, "vendor_settings_changed", "vendor", v.id, JSON.stringify(i));
    return { payAtPickup: o.payAtPickup, maxUnitsPerOrder: v.maxUnitsPerOrder ?? RULES.MAX_UNITS_PER_ORDER };
  });
}

// ---------------------------------------------------------------- price suggestion (B2)
export function priceSuggestion(actor: Profile | null, q: { listingId?: string; original?: number; category?: string; hoursLeft?: number }) {
  const db = read();
  const me = requireRole(actor, "vendor");
  const v = vendorOf(db, me);
  const n = clockNow(db);
  let original = Number(q.original);
  let category = q.category ?? "";
  let hoursLeft = Number(q.hoursLeft);
  if (q.listingId) {
    const l = db.listings.find((x) => x.id === q.listingId && x.vendorId === v.id);
    if (!l) throw new RuleError("not_found", "Listing not found.", 404);
    original = l.originalPrice;
    category = l.category;
    if (!Number.isFinite(hoursLeft)) hoursLeft = (t(l.windowEnd) - n) / 3600_000;
  }
  if (!Number.isFinite(original) || original <= 0) throw new RuleError("price_invalid", "Enter the original price first.");
  if (!Number.isFinite(hoursLeft)) throw new RuleError("hours_required", "Set the pickup end time first.");
  const s = category && CATEGORIES.includes(category as never) ? sellThroughRate(db.listings, db.reservations, v.id, category, n) : null;
  const out = suggestPrice({ original, hoursLeft, sellThrough: s });
  return { ...out, original, hoursLeft: +hoursLeft.toFixed(2), historyUsed: s !== null };
}

// ---------------------------------------------------------------- completeness (D4)
export function profileCompleteness(v: Vendor, o?: Outlet) {
  const checks: [string, boolean][] = [
    ["FSSAI number", !!v.fssaiNumber?.trim()],
    ["Address", !!o?.address?.trim()],
    ["Map location (lat/lng)", Number.isFinite(o?.lat) && Number.isFinite(o?.lng)],
    ["Operating hours", !!v.operatingHours?.trim()],
    ["Payout UPI", !!v.payoutUpi?.trim()],
    ["Logo", !!v.logoUrl],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return { done, total: checks.length, percent: Math.round((done / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([k]) => k) };
}

// ---------------------------------------------------------------- analytics + payouts (B4, B5)
export function analyticsFor(actor: Profile | null, range: Range) {
  const db = read();
  const v = vendorOf(db, requireRole(actor, "vendor"));
  return vendorAnalytics(db, v.id, range, clockNow(db));
}
export function payoutsFor(actor: Profile | null) {
  const db: DB = read();
  const v = vendorOf(db, requireRole(actor, "vendor"));
  return vendorPayouts(db, v.id);
}
export { outletOf };
