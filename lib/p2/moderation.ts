import "server-only";
import { read } from "../store";
import { RuleError } from "../rules";
import { newId, sha256 } from "../crypto";
import { write } from "../services";
import { audit, iso, notify, requireRole, t } from "../core";
import { recomputeVendorRating } from "../p1";
import { cfg } from "./settings";
import type { DB, Listing, ModerationAction, ModerationActionType, ModerationTarget, Profile, Review, Vendor } from "../types";

/**
 * P2 feature 11: content moderation.
 * Things reach the queue two ways: a keyword match in the text (admin-editable list) or 3+ open customer reports against a listing or vendor.
 * Admins act with hide / restore / edit / warn / suspend / dismiss. EVERY action needs a reason, is stored in `moderation_actions`
 * (who, what, why, when) and notifies the person affected. Hiding removes the item from discovery at once (the same flag the customer
 * queries already check), and a hidden review stops counting in the vendor's rating.
 */

export const REPORT_FLAG_COUNT = 3;
export const ACTIONS: ModerationActionType[] = ["hide", "restore", "edit", "warn", "suspend", "dismiss"];

/** Case-insensitive whole-word match, so "scam" flags "this is a scam" but not "scampi". */
export function matchKeywords(text: string, keywords: string[]): string[] {
  const hay = String(text ?? "").toLowerCase();
  return keywords.filter((k) => k && new RegExp(`(^|[^\\p{L}\\p{N}])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "iu").test(hay));
}

export interface QueueItem {
  key: string; targetType: ModerationTarget; targetId: string; title: string; excerpt: string; owner: string; reasons: string[];
  openReports: number; state: "open" | "hidden" | "resolved"; evidenceAt: string; history: { at: string; admin: string; action: string; reason: string }[];
  canEdit: boolean;
}

const fingerprint = (texts: string[]) => sha256(texts.join("\u0000"));
const lastDecision = (db: DB, type: ModerationTarget, id: string) =>
  db.moderationActions.filter((a) => a.targetType === type && a.targetId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

export function moderationQueue(db: DB = read()): QueueItem[] {
  const kws = cfg(db).moderationKeywords;
  const items: QueueItem[] = [];
  const hist = (type: ModerationTarget, id: string) => db.moderationActions.filter((a) => a.targetType === type && a.targetId === id)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).map((a) => ({ at: a.createdAt, admin: db.profiles.find((p) => p.id === a.adminId)?.name ?? a.adminId, action: a.action, reason: a.reason }));
  const openReports = (type: "listing" | "vendor", id: string) => db.reports.filter((r) => r.targetType === type && r.targetId === id && r.status === "Open");

  const add = (type: ModerationTarget, id: string, title: string, excerpt: string, owner: string, texts: string[], reports: ReturnType<typeof openReports>, contentAt: string, hidden: boolean, canEdit: boolean) => {
    const hits = [...new Set(texts.flatMap((x) => matchKeywords(x, kws)))];
    const reasons = [...(hits.length ? [`Keyword: ${hits.join(", ")}`] : []), ...(reports.length >= REPORT_FLAG_COUNT ? [`${reports.length} open reports`] : [])];
    const decision = lastDecision(db, type, id);
    const evidenceAt = [contentAt, ...reports.map((r) => r.createdAt)].sort().pop()!;
    // a decision settles the item until NEW evidence shows up: a report filed after it, or (for keyword matches) different wording
    const newReport = decision ? reports.some((r) => t(r.createdAt) > t(decision.createdAt)) : false;
    const sameWords = !hits.length || decision?.contentHash === fingerprint(texts);
    const settled = !!decision && decision.action !== "restore" && !newReport && sameWords;
    if (hidden) items.push({ key: `${type}:${id}`, targetType: type, targetId: id, title, excerpt, owner, reasons: reasons.length ? reasons : ["Hidden by an administrator"], openReports: reports.length, state: "hidden", evidenceAt, history: hist(type, id), canEdit });
    else if (reasons.length && !settled) items.push({ key: `${type}:${id}`, targetType: type, targetId: id, title, excerpt, owner, reasons, openReports: reports.length, state: "open", evidenceAt, history: hist(type, id), canEdit });
    else if (decision && t(decision.createdAt) > Date.now() - 14 * 86400_000 + (db.clockOffsetMs || 0)) items.push({ key: `${type}:${id}`, targetType: type, targetId: id, title, excerpt, owner, reasons: reasons.length ? reasons : ["Reviewed"], openReports: reports.length, state: "resolved", evidenceAt, history: hist(type, id), canEdit });
  };

  for (const l of db.listings) {
    const v = db.vendors.find((x) => x.id === l.vendorId);
    add("listing", l.id, l.title, l.description, v?.businessName ?? "", [l.title, l.description, l.storageNote ?? ""], openReports("listing", l.id), l.updatedAt, !!l.hiddenByAdmin, true);
  }
  for (const r of db.reviews) {
    const v = db.vendors.find((x) => x.id === r.vendorId);
    add("review", r.id, `${r.rating}★ review of ${v?.businessName ?? "vendor"}`, r.text ?? "", db.profiles.find((p) => p.id === r.customerId)?.name.split(" ")[0] ?? "Customer", [r.text ?? ""], [], r.createdAt, !!r.hidden, true);
  }
  for (const v of db.vendors) {
    add("vendor", v.id, v.businessName, "", v.contactName, [v.businessName], openReports("vendor", v.id), v.createdAt, !!v.hiddenByAdmin, false);
  }
  const rank = { open: 0, hidden: 1, resolved: 2 } as const;
  return items.sort((a, b) => rank[a.state] - rank[b.state] || (a.evidenceAt < b.evidenceAt ? 1 : -1));
}

export interface ActInput { action: ModerationActionType; reason: string; edit?: { title?: string; description?: string; text?: string }; suspendDays?: number }

function targetOf(db: DB, type: ModerationTarget, id: string): { listing?: Listing; review?: Review; vendor?: Vendor } {
  if (type === "listing") { const listing = db.listings.find((x) => x.id === id); return { listing, vendor: db.vendors.find((v) => v.id === listing?.vendorId) }; }
  if (type === "review") { const review = db.reviews.find((x) => x.id === id); return { review, vendor: db.vendors.find((v) => v.id === review?.vendorId) }; }
  return { vendor: db.vendors.find((v) => v.id === id) };
}

export function moderate(actor: Profile | null, type: ModerationTarget, id: string, input: ActInput) {
  return write((tx): ModerationAction => {
    const me = requireRole(actor, "admin");
    const { db, now } = tx;
    if (!cfg(db).flags.moderation) throw new RuleError("feature_off", "Moderation is switched off.", 403);
    if (!["listing", "review", "vendor"].includes(type)) throw new RuleError("target_invalid", "Unknown item type.");
    if (!ACTIONS.includes(input.action)) throw new RuleError("action_invalid", "Unknown action.");
    const reason = String(input.reason ?? "").trim();
    if (reason.length < 3) throw new RuleError("reason_required", "Give a reason. It is recorded and shown to the person affected.");
    if (reason.length > 500) throw new RuleError("reason_long", "Keep the reason under 500 characters.");
    const { listing, review, vendor } = targetOf(db, type, id);
    if (!(listing || review || vendor)) throw new RuleError("not_found", "Item not found.", 404);
    const owner = type === "review" ? db.profiles.find((p) => p.id === review!.customerId) : vendor ? db.profiles.find((p) => p.id === vendor.ownerId) : undefined;
    const what = type === "listing" ? `your listing "${listing!.title}"` : type === "review" ? "your review" : "your business";
    let detail = reason;
    const tell = (text: string) => { if (owner) notify(tx, owner.id, text, "moderation", { type, id }); };

    switch (input.action) {
      case "hide":
        if (listing) { listing.hiddenByAdmin = true; if (listing.status === "Live" || listing.status === "Sold Out") listing.status = "Paused"; listing.moderationNote = reason; listing.updatedAt = iso(now); tx.emit({ type: "listing", listingId: listing.id, qtyAvailable: listing.qtyAvailable, status: listing.status }); }
        else if (review) { review.hidden = true; recomputeVendorRating(db, review.vendorId); }
        else if (vendor) vendor.hiddenByAdmin = true;
        tell(`Save a Plate hid ${what}: ${reason}`);
        break;
      case "restore":
        if (listing) { listing.hiddenByAdmin = false; listing.moderationNote = undefined; listing.updatedAt = iso(now); tx.emit({ type: "listing", listingId: listing.id, qtyAvailable: listing.qtyAvailable, status: listing.status }); /* it stays Paused: the vendor resumes it */ }
        else if (review) { review.hidden = false; recomputeVendorRating(db, review.vendorId); }
        else if (vendor) vendor.hiddenByAdmin = false;
        tell(`Save a Plate restored ${what}.${listing && listing.status === "Paused" ? " You can resume the listing from your dashboard." : ""} ${reason}`.trim());
        break;
      case "edit": {
        const e = input.edit ?? {};
        if (listing) {
          const before = `${listing.title} | ${listing.description}`;
          if (e.title !== undefined) { const v = e.title.trim(); if (v.length < 3 || v.length > 80) throw new RuleError("title_invalid", "Title must be 3–80 characters."); listing.title = v; }
          if (e.description !== undefined) listing.description = e.description.trim().slice(0, 1000);
          listing.moderationNote = reason; listing.updatedAt = iso(now);
          detail = `${reason} [edited; before: ${before.slice(0, 200)}]`;
        } else if (review) {
          if (e.text === undefined) throw new RuleError("edit_empty", "Give the replacement text.");
          detail = `${reason} [edited; before: ${(review.text ?? "").slice(0, 200)}]`;
          review.text = e.text.trim().slice(0, 1000) || undefined;
        } else throw new RuleError("edit_unsupported", "A business profile can't be edited from here; warn or suspend instead.");
        tell(`Save a Plate edited ${what}: ${reason}`);
        break;
      }
      case "warn":
        tell(`Warning from Save a Plate about ${what}: ${reason}`);
        break;
      case "suspend": {
        if (!owner) throw new RuleError("no_target", "There is no account to suspend.");
        const days = Math.round(Number(input.suspendDays ?? 7));
        if (!Number.isFinite(days) || days < 1 || days > 365) throw new RuleError("days_invalid", "Choose between 1 and 365 days.");
        const p = db.profiles.find((x) => x.id === owner.id)!;
        p.suspendedUntil = iso(now + days * 86400_000);
        p.suspendReason = `Suspended by an administrator until ${p.suspendedUntil.slice(0, 10)}: ${reason}`;
        if (vendor && type !== "review") vendor.hiddenByAdmin = true; // a suspended vendor disappears from discovery immediately
        notify(tx, p.id, p.suspendReason, "suspension", { until: p.suspendedUntil });
        detail = `${reason} [${days} days]`;
        break;
      }
      case "dismiss":
        detail = reason;
        break;
    }
    const texts = listing ? [listing.title, listing.description, listing.storageNote ?? ""] : review ? [review.text ?? ""] : vendor ? [vendor.businessName] : [];
    const rec: ModerationAction = { id: newId("ma"), adminId: me.id, targetType: type, targetId: id, action: input.action, reason: detail, createdAt: iso(now), contentHash: fingerprint(texts) };
    db.moderationActions.push(rec);
    audit(tx, me.id, `moderation_${input.action}`, type, id, detail.slice(0, 300));
    return rec;
  });
}

export const moderationCounts = (db: DB = read()) => { const q = moderationQueue(db); return { open: q.filter((x) => x.state === "open").length, hidden: q.filter((x) => x.state === "hidden").length }; };
