import "server-only";
import { read, transaction, now as clockNow, type TxContext } from "../store";
import { RuleError } from "../rules";
import { newId, hmac, safeEqual } from "../crypto";
import { write } from "../services";
import { audit, iso, ngoOf, notifyT, notifyOutletT, outletOf, requireRole } from "../core";
import { getDeliveryProvider } from "../delivery";
import { DeliveryError, canAdvance, isActive, type DeliveryJob, type DeliveryProvider } from "../delivery/provider";
import { cfg } from "./settings";
import type { DB, DeliveryRequest, DeliveryStatus, Profile } from "../types";

/**
 * P2 feature 10: delivery hand-off for donations. A charity that has claimed a batch can ask a delivery partner to collect it.
 *  - The provider call happens OUTSIDE the store transaction (it is network I/O); the request row is saved first, so nothing is lost
 *    if the partner is slow or down.
 *  - Failures (partner down, no rider found) never cancel the claim: the charity is told and can try again or collect it themselves.
 *  - The delivery status is informational. The donation only counts as collected when the VENDOR verifies the charity's code, as before.
 *  - Only business information leaves the system (see DeliveryJob).
 */

const active = (db: DB, batchId: string) => db.deliveryRequests.find((d) => d.batchId === batchId && isActive(d.status));

function jobFor(db: DB, batchId: string): DeliveryJob {
  const b = db.donationBatches.find((x) => x.id === batchId)!;
  const outlet = outletOf(db, b.outletId);
  const vendor = db.vendors.find((v) => v.id === b.vendorId)!;
  const ngo = db.ngos.find((n) => n.id === b.claimedByNgoId)!;
  return {
    reference: b.ref, item: `${b.qty} × ${b.title}`, pickupBy: b.collectBy,
    pickup: { businessName: vendor.businessName, address: outlet.address, lat: outlet.lat, lng: outlet.lng, phone: vendor.phone },
    drop: { organisation: ngo.orgName, address: ngo.address, lat: ngo.lat, lng: ngo.lng, phone: ngo.phone },
  };
}

export async function requestDelivery(actor: Profile | null, batchId: string, provider: DeliveryProvider = getDeliveryProvider()) {
  // 1. validate and save a "Requested" row (inside the transaction)
  const created = await write((tx) => {
    const me = requireRole(actor, "ngo");
    const { db, now } = tx;
    if (!cfg(db).flags.delivery) throw new RuleError("feature_off", "Delivery hand-off is switched off.", 403, undefined, "feature_off_delivery_hand_off");
    const n = ngoOf(db, me);
    const b = db.donationBatches.find((x) => x.id === batchId);
    if (!b || b.claimedByNgoId !== n.id) throw new RuleError("not_found", "No claimed batch found.", 404, undefined, "not_found_no_claimed_batch");
    if (b.status !== "Claimed") throw new RuleError("bad_transition", `This donation is ${b.status.toLowerCase()}; delivery can be requested while it is claimed.`, 409, { status: b.status.toLowerCase(), statusKey: `status.${b.status}` }, "bad_transition_donation_delivery");
    if (Date.parse(b.collectBy) <= now) throw new RuleError("expired", "The collection deadline has passed.", 409);
    if (active(db, b.id)) throw new RuleError("delivery_active", "A delivery is already in progress for this donation.", 409);
    const job = jobFor(db, b.id);
    const row: DeliveryRequest = {
      id: newId("dv"), batchId: b.id, ngoId: n.id, vendorId: b.vendorId, provider: provider.name, externalId: "", status: "Requested", fee: 0,
      pickupAddress: job.pickup.address, dropAddress: job.drop.address, createdAt: iso(now), updatedAt: iso(now),
    };
    db.deliveryRequests.push(row);
    b.deliveryRequestId = row.id;
    audit(tx, me.id, "delivery_requested", "delivery", row.id, `${provider.name} for ${b.ref}`);
    return { id: row.id, job, ownerId: me.id };
  });

  // 2. call the provider (no transaction held)
  let ack: Awaited<ReturnType<DeliveryProvider["request"]>> | null = null;
  let error: string | null = null;
  try { ack = await provider.request(created.job, clockNow(read())); }
  catch (e) { error = e instanceof DeliveryError ? e.message : "The delivery partner could not be reached."; if (!(e instanceof DeliveryError)) console.error("delivery provider error", e); }

  // 3. record the outcome
  return transaction((tx) => {
    const d = tx.db.deliveryRequests.find((x) => x.id === created.id)!;
    d.updatedAt = iso(tx.now);
    if (ack) {
      Object.assign(d, { externalId: ack.externalId, fee: ack.fee, status: ack.status, riderName: ack.riderName });
      notifyT(tx, created.ownerId, "deliveryRequested", { ref: created.job.reference, provider: provider.name, fee: ack.fee }, "delivery_update", { deliveryId: d.id });
    } else {
      Object.assign(d, { status: "Failed" as DeliveryStatus, error });
      notifyT(tx, created.ownerId, "deliveryNoRider", { ref: created.job.reference, error: String(error) }, "delivery_update", { deliveryId: d.id });
      audit(tx, "system", "delivery_failed", "delivery", d.id, error ?? "");
    }
    return viewOf(tx.db, d);
  });
}

export function cancelDelivery(actor: Profile | null, deliveryId: string, provider: DeliveryProvider = getDeliveryProvider()) {
  return (async () => {
    const d = await write((tx) => {
      const me = requireRole(actor, "ngo");
      const n = ngoOf(tx.db, me);
      const row = tx.db.deliveryRequests.find((x) => x.id === deliveryId && x.ngoId === n.id);
      if (!row) throw new RuleError("not_found", "Delivery not found.", 404, undefined, "not_found_delivery_not_found");
      if (!isActive(row.status)) throw new RuleError("bad_transition", "This delivery is already finished.", 409);
      if (row.status === "Picked up") throw new RuleError("bad_transition", "The rider already has the food; it can't be cancelled now.", 409, undefined, "bad_transition_rider_already_has");
      row.status = "Cancelled"; row.updatedAt = iso(tx.now);
      audit(tx, me.id, "delivery_cancelled", "delivery", row.id);
      return { ...row };
    });
    if (d.externalId) { try { await provider.cancel(d.externalId); } catch (e) { console.error("delivery cancel failed at provider", e); } }
    return d;
  })();
}

// ---------------------------------------------------------------- status updates
/** Applies a status from the provider (job, poll or webhook). Forward-only, idempotent, notifies both sides once per change. */
export function applyDeliveryStatus(tx: TxContext, d: DeliveryRequest, status: DeliveryStatus, riderName?: string): boolean {
  if (riderName && riderName !== d.riderName) d.riderName = riderName;
  if (!canAdvance(d.status, status)) return false;
  d.status = status;
  d.updatedAt = iso(tx.now);
  const b = tx.db.donationBatches.find((x) => x.id === d.batchId);
  const ngo = tx.db.ngos.find((n) => n.id === d.ngoId);
  const vendor = tx.db.vendors.find((v) => v.id === d.vendorId);
  const ref = b?.ref ?? "donation";
  const rider = d.riderName ? ` (${d.riderName})` : "";
  const key: Record<DeliveryStatus, string> = {
    Requested: "", "Rider assigned": "deliveryAssigned", "Picked up": "deliveryPickedUp", Delivered: "deliveryDelivered",
    "No rider found": "deliveryNoRiderFound", Failed: "deliveryFailed", Cancelled: "",
  };
  const vars = { rider, ref };
  if (key[status]) {
    if (ngo) notifyT(tx, ngo.ownerId, key[status], vars, "delivery_update", { deliveryId: d.id, status });
    if (vendor && b && (status === "Rider assigned" || status === "Picked up")) notifyOutletT(tx, vendor, b.outletId, `${key[status]}Vendor`, vars, "delivery_update", { deliveryId: d.id, status });
  }
  audit(tx, "system", "delivery_status", "delivery", d.id, status);
  return true;
}

export function deliveryJobPending(db: DB, now: number): boolean {
  if (!cfg(db).flags.delivery) return false;
  const p = getDeliveryProvider();
  if (!p.statusNow) return false;
  return db.deliveryRequests.some((d) => isActive(d.status) && d.externalId && p.statusNow!(d.externalId, now).status !== d.status);
}
export function runDeliveryJob(tx: TxContext) {
  const p = getDeliveryProvider();
  if (!cfg(tx.db).flags.delivery || !p.statusNow) return;
  for (const d of tx.db.deliveryRequests) {
    if (!isActive(d.status) || !d.externalId || d.provider !== p.name) continue;
    const u = p.statusNow(d.externalId, tx.now);
    applyDeliveryStatus(tx, d, u.status, u.riderName);
  }
}

// ---------------------------------------------------------------- webhook (real partners)
export const WEBHOOK_STATUSES: DeliveryStatus[] = ["Rider assigned", "Picked up", "Delivered", "No rider found", "Failed", "Cancelled"];

/** HMAC-SHA256 of the raw body with DELIVERY_WEBHOOK_SECRET, hex. No secret configured means every webhook is refused. */
export function verifyDeliverySignature(rawBody: string, signature: string, secret = process.env.DELIVERY_WEBHOOK_SECRET): boolean {
  if (!secret || !signature) return false;
  return safeEqual(hmac(secret, rawBody), signature.trim().toLowerCase());
}

export function handleDeliveryWebhook(evt: { externalId?: string; status?: string; riderName?: string }) {
  return write((tx) => {
    if (!evt.externalId || typeof evt.externalId !== "string") throw new RuleError("bad_event", "Missing delivery id.");
    if (!WEBHOOK_STATUSES.includes(evt.status as DeliveryStatus)) throw new RuleError("bad_event", "Unknown delivery status.", 400, undefined, "bad_event_unknown_delivery_status");
    const d = tx.db.deliveryRequests.find((x) => x.externalId === evt.externalId);
    if (!d) return { applied: false, reason: "unknown delivery" };
    return { applied: applyDeliveryStatus(tx, d, evt.status as DeliveryStatus, evt.riderName?.slice(0, 60)), reason: undefined };
  });
}

// ---------------------------------------------------------------- read model
function viewOf(db: DB, d: DeliveryRequest) {
  const b = db.donationBatches.find((x) => x.id === d.batchId);
  return { ...d, ref: b?.ref ?? "", item: b ? `${b.qty} × ${b.title}` : "" };
}
export function deliveriesFor(db: DB, filter: { ngoId?: string; vendorId?: string; outletIds?: string[] | null }) {
  return db.deliveryRequests
    .filter((d) => (filter.ngoId ? d.ngoId === filter.ngoId : true) && (filter.vendorId ? d.vendorId === filter.vendorId : true)
      && (!filter.outletIds || filter.outletIds.includes(db.donationBatches.find((b) => b.id === d.batchId)?.outletId ?? "")))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((d) => viewOf(db, d));
}
