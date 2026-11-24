import "server-only";
import { RuleError } from "../rules";
import { write } from "../services";
import { audit, emitRes, iso, notifyOutlet, requireRole, t } from "../core";
import { cfg } from "./settings";
import type { DB, Profile, Reservation } from "../types";

/**
 * P2 feature 3: "I'm on my way". The customer's phone estimates the time and sends ONLY a number of minutes.
 * Nothing about where the person is ever reaches the server: not a coordinate, not a distance, not a route. Only `eta_minutes`
 * and `eta_updated_at` are stored, and they are cleared the moment the order is collected, cancelled or missed.
 */

export const ETA_MAX_MINUTES = 240;
export const ETA_STALE_MS = 5 * 60_000; // older than this the vendor sees it greyed out as "last updated …"
export const ETA_MIN_GAP_MS = 15_000; // updates faster than this are coalesced
const OPENS_EARLY_MS = 90 * 60_000; // can say "on my way" up to 90 minutes before pickup opens

export function setEta(actor: Profile | null, reservationId: string, body: Record<string, unknown>) {
  return write((tx) => {
    const me = requireRole(actor, "customer");
    const { db, now } = tx;
    if (!cfg(db).flags.liveEta) throw new RuleError("feature_off", "Live ETA is switched off.", 403);
    // The contract is "minutes only". A request that carries anything location-like is refused outright, never silently dropped.
    const extra = Object.keys(body).filter((k) => k !== "etaMinutes");
    if (extra.length) throw new RuleError("location_not_accepted", "Only the number of minutes is accepted. Your location is never sent to us.", 400);
    const minutes = body.etaMinutes;
    if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 0 || minutes > ETA_MAX_MINUTES) throw new RuleError("eta_invalid", `Choose between 0 and ${ETA_MAX_MINUTES} minutes.`);
    const r = db.reservations.find((x) => x.id === reservationId && x.customerId === me.id);
    if (!r) throw new RuleError("not_found", "Order not found.", 404);
    if (r.status !== "Reserved" && r.status !== "Ready") throw new RuleError("bad_transition", "This order is no longer waiting for pickup.", 409);
    const l = db.listings.find((x) => x.id === r.listingId)!;
    if (now > t(l.windowEnd)) throw new RuleError("window_closed", "The pickup window has ended.", 409);
    if (now < t(l.windowStart) - OPENS_EARLY_MS) throw new RuleError("too_early", "You can share an ETA up to 90 minutes before pickup opens.", 409);
    const prev = r.etaMinutes;
    if (r.etaUpdatedAt && now - t(r.etaUpdatedAt) < ETA_MIN_GAP_MS && prev === minutes) return etaView(r, now);
    r.etaMinutes = minutes;
    r.etaUpdatedAt = iso(now);
    const vendor = db.vendors.find((v) => v.id === r.vendorId)!;
    const first = prev === undefined;
    const arriving = minutes <= 2 && (prev === undefined || prev > 2);
    if (first || arriving) {
      const name = me.name.split(" ")[0];
      notifyOutlet(tx, vendor, r.outletId, arriving && !first ? `${name} is almost there for ${r.ref}.` : `${name} is on the way to collect ${r.ref} (about ${minutes} min).`, "customer_eta", { reservationId: r.id, etaMinutes: minutes });
    }
    if (first) audit(tx, me.id, "eta_started", "reservation", r.id);
    emitRes(tx, r);
    return etaView(r, now);
  });
}

export function clearEta(actor: Profile | null, reservationId: string) {
  return write((tx) => {
    const me = requireRole(actor, "customer");
    const r = tx.db.reservations.find((x) => x.id === reservationId && x.customerId === me.id);
    if (!r) throw new RuleError("not_found", "Order not found.", 404);
    r.etaMinutes = undefined;
    r.etaUpdatedAt = undefined;
    emitRes(tx, r);
    return { cleared: true };
  });
}

export function etaView(r: Pick<Reservation, "etaMinutes" | "etaUpdatedAt">, nowMs: number) {
  if (r.etaMinutes === undefined || !r.etaUpdatedAt) return null;
  const age = nowMs - t(r.etaUpdatedAt);
  return { minutes: r.etaMinutes, updatedAt: r.etaUpdatedAt, ageSeconds: Math.max(0, Math.round(age / 1000)), stale: age > ETA_STALE_MS };
}

/** What an outlet board shows: first name and the ETA only. No location exists to show, and the secret pickup code is never exposed. */
export function boardEta(db: DB, r: Reservation, nowMs: number) {
  if (!cfg(db).flags.liveEta) return null;
  return etaView(r, nowMs);
}
