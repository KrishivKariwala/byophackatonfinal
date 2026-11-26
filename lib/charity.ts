import "server-only";
import { readDb, now as clockNow } from "./store";
import { RuleError } from "./rules";
import { randomToken } from "./crypto";
import { write } from "./services";
import { audit, iso, ngoOf, notifyOutletT, outletOf, requireRole, t } from "./core";
import { directionsUrl } from "./geo";
import type { Profile } from "./types";

/** P1 charity portal: pickup scheduling with volunteer details, tokenised public volunteer link. */

const PHONE = /^\+?[\d\s-]{8,16}$/;

export function scheduleDonation(actor: Profile | null, batchId: string, i: { slot: string; volunteerName: string; volunteerPhone: string }) {
  return write((tx) => {
    const me = requireRole(actor, "ngo");
    const n = ngoOf(tx.db, me);
    const b = tx.db.donationBatches.find((x) => x.id === batchId);
    if (!b || b.claimedByNgoId !== n.id) throw new RuleError("not_found", "No claimed batch found.", 404, undefined, "not_found_no_claimed_batch");
    if (b.status !== "Claimed") throw new RuleError("bad_transition", `Batch is ${b.status.toLowerCase()}; only claimed batches can be scheduled.`, 409, { status: b.status.toLowerCase(), statusKey: `status.${b.status}` }, "bad_transition_batch_schedule");
    const slot = t(i.slot);
    if (!Number.isFinite(slot)) throw new RuleError("slot_invalid", "Choose a pickup time.");
    if (slot < tx.now - 60_000) throw new RuleError("slot_past", "Pick a time that hasn't passed.");
    if (slot > t(b.collectBy)) throw new RuleError("slot_late", "The pickup time must be before the collect-by deadline.");
    const name = (i.volunteerName ?? "").trim();
    const phone = (i.volunteerPhone ?? "").trim();
    if (name.length < 2 || name.length > 80) throw new RuleError("volunteer_name", "Enter the volunteer's name.");
    if (!PHONE.test(phone)) throw new RuleError("volunteer_phone", "Enter a valid phone number for the volunteer.");
    b.pickupSlot = iso(slot);
    b.volunteerName = name;
    b.volunteerPhone = phone;
    b.volunteerToken ??= randomToken();
    const vendor = tx.db.vendors.find((v) => v.id === b.vendorId)!;
    notifyOutletT(tx, vendor, b.outletId, "volunteerSending", { org: n.orgName, name, ref: b.ref, time: iso(slot) }, "generic", { batchId: b.id });
    audit(tx, me.id, "donation_scheduled", "donation_batch", b.id, `${name} @ ${iso(slot)}`);
    return { batchId: b.id, token: b.volunteerToken, slot: b.pickupSlot, url: `/volunteer/${b.volunteerToken}` };
  });
}

export type VolunteerView =
  | { state: "ok"; ref: string; qty: number; title: string; vendorName: string; vendorPhone: string; address: string; directions: string; slot?: string; collectBy: string; code: string; volunteerName?: string }
  | { state: "expired" | "collected" | "not_found" };

/** Public (no login). Matches the unguessable token; the link stops working once the pickup deadline has passed or the batch is closed. */
export async function volunteerView(token: string): Promise<VolunteerView> {
  const db = await readDb();
  if (!token || token.length < 16) return { state: "not_found" };
  const b = db.donationBatches.find((x) => x.volunteerToken === token);
  if (!b) return { state: "not_found" };
  if (b.status === "Collected") return { state: "collected" };
  if (b.status !== "Claimed" || t(b.collectBy) <= clockNow(db)) return { state: "expired" };
  const vendor = db.vendors.find((v) => v.id === b.vendorId)!;
  const outlet = outletOf(db, b.outletId);
  return {
    state: "ok", ref: b.ref, qty: b.qty, title: b.title, vendorName: vendor.businessName, vendorPhone: vendor.phone, address: outlet.address,
    directions: directionsUrl(outlet), slot: b.pickupSlot, collectBy: b.collectBy, code: b.collectionCode ?? "", volunteerName: b.volunteerName,
  };
}
