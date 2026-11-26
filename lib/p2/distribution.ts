import "server-only";
import { readDb } from "../store";
import { RuleError } from "../rules";
import { newId } from "../crypto";
import { write } from "../services";
import { audit, iso, ngoOf, notifyOutletT, requireRole } from "../core";
import { cfg } from "./settings";
import { can, resolveOrg } from "./org";
import type { DB, DistributionLog, Profile } from "../types";

/**
 * P2 feature 8: distribution log. After collecting a donation a charity can record how it was used: servings, people reached,
 * the centre, notes and (optionally) photos. The vendor sees a summary, and the people-reached figure feeds the impact certificate.
 * Photos are optional and private (only the filing charity, the donating vendor's owner/managers and admins can open them).
 * The upload form reminds charities not to photograph faces; nothing is stored about individuals.
 */

export const MAX_PHOTOS = 3;
const PHOTO = /^\/api\/uploads\/[\w.-]+\.(jpg|png|webp)$/;

export interface LogInput { servings: number; beneficiaries: number; centreName: string; notes?: string; photoUrls?: string[] }

export function fileDistributionLog(actor: Profile | null, batchId: string, i: LogInput) {
  return write((tx): DistributionLog => {
    const me = requireRole(actor, "ngo");
    const { db, now } = tx;
    if (!cfg(db).flags.distributionLog) throw new RuleError("feature_off", "Distribution logs are switched off.", 403, undefined, "feature_off_distribution_logs_are");
    const n = ngoOf(db, me);
    const b = db.donationBatches.find((x) => x.id === batchId);
    if (!b || b.claimedByNgoId !== n.id) throw new RuleError("not_found", "Donation not found.", 404, undefined, "not_found_donation_not_found");
    if (b.status !== "Collected") throw new RuleError("not_collected", "You can log distribution once the donation has been collected.", 409);
    if (db.distributionLogs.some((x) => x.batchId === b.id)) throw new RuleError("already_logged", "A distribution log was already filed for this donation.", 409);
    const servings = Number(i.servings), people = Number(i.beneficiaries);
    if (!Number.isInteger(servings) || servings < 1 || servings > 100_000) throw new RuleError("servings_invalid", "Enter how many servings were distributed (a whole number, 1 or more).");
    if (!Number.isInteger(people) || people < 0 || people > 100_000) throw new RuleError("people_invalid", "Enter how many people were reached (a whole number, 0 or more).");
    const centre = String(i.centreName ?? "").trim();
    if (centre.length < 2 || centre.length > 120) throw new RuleError("centre_invalid", "Enter the name of the centre or place where food was served.");
    const notes = String(i.notes ?? "").trim();
    if (notes.length > 1000) throw new RuleError("notes_long", "Keep notes under 1000 characters.");
    const photos = (i.photoUrls ?? []).map(String);
    if (photos.length > MAX_PHOTOS) throw new RuleError("photos_many", `At most ${MAX_PHOTOS} photos.`, 400, { max: MAX_PHOTOS });
    for (const u of photos) {
      if (!PHOTO.test(u)) throw new RuleError("photo_invalid", "Photos must be JPG, PNG or WebP files uploaded here.", 400, undefined, "photo_invalid_photos_must_jpg");
      if (!u.startsWith(`/api/uploads/${me.id}-`)) throw new RuleError("photo_invalid", "You can only attach photos you uploaded.", 400, undefined, "photo_invalid_only_attach_photos");
    }
    const log: DistributionLog = { id: newId("dl"), batchId: b.id, ngoId: n.id, vendorId: b.vendorId, servings, beneficiaries: people, centreName: centre, notes: notes || undefined, photoUrls: photos, createdAt: iso(now) };
    db.distributionLogs.push(log);
    const vendor = db.vendors.find((v) => v.id === b.vendorId)!;
    notifyOutletT(tx, vendor, b.outletId, people ? "servedFromPeople" : "servedFrom", { org: n.orgName, servings, ref: b.ref, people, centre }, "generic", { batchId: b.id });
    audit(tx, me.id, "distribution_logged", "donation_batch", b.id, `${servings} servings, ${people} people`);
    return log;
  });
}

/** Vendor side: a summary per collected donation. Owners/managers see photos; staff see the summary only. */
export function distributionSummaryFor(db: DB, vendorId: string, outletIds: string[] | null) {
  return db.distributionLogs.filter((l) => l.vendorId === vendorId && (!outletIds || outletIds.includes(db.donationBatches.find((b) => b.id === l.batchId)?.outletId ?? "")))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((l) => ({ ...l, ngoName: db.ngos.find((n) => n.id === l.ngoId)?.orgName ?? "Charity", ref: db.donationBatches.find((b) => b.id === l.batchId)?.ref ?? "" }));
}

/** Who may open an uploaded file besides its uploader: the donating vendor's owner/managers and the filing charity, for photos attached to a log. */
export async function canReadLogPhoto(actor: Profile, name: string): Promise<boolean> {
  const db = await readDb();
  const url = `/api/uploads/${name}`;
  const log = db.distributionLogs.find((l) => l.photoUrls.includes(url));
  if (!log) return false;
  if (actor.role === "ngo") return db.ngos.some((n) => n.ownerId === actor.id && n.id === log.ngoId);
  if (actor.role === "vendor") {
    const org = resolveOrg(db, actor);
    return !!org && org.vendor.id === log.vendorId && can(org.role, "distribution.view");
  }
  return false;
}
