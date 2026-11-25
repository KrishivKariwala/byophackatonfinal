import { t } from "./core";
import { vendorFlags } from "./p1";
import type { DB, Vendor } from "./types";

/**
 * Vendor reliability: one number from 0 to 100 that admins can read and the feed uses to rank. It is built from three things a
 * customer would notice, each worth a fixed share:
 *   - rating            50 points: the average rating, once there are at least 5 ratings (otherwise a neutral 35)
 *   - cancellations     35 points: how few of the last 30 days' orders the vendor cancelled itself (neutral 28 below 5 orders)
 *   - open reports      15 points: minus 5 for each open report against the vendor, its listings or its orders
 * A vendor below 50 is listed after everyone else in the feed. New vendors get the neutral points, so being new is not a penalty.
 * (Overselling cannot happen: stock is atomic, so it has no part in the score.)
 */
export const RELIABILITY = { LOW_BELOW: 50, WINDOW_DAYS: 30, MIN_ORDERS: 5, MIN_RATINGS: 5 } as const;

export interface Reliability {
  score: number;
  parts: { rating: number; cancellations: number; reports: number };
  basis: { ratings: number; orders: number; vendorCancelled: number; openReports: number };
  low: boolean;
}

export function reliability(db: DB, v: Vendor, nowMs: number): Reliability {
  const since = nowMs - RELIABILITY.WINDOW_DAYS * 86400_000;
  const orders = db.reservations.filter((r) => r.vendorId === v.id && t(r.createdAt) >= since);
  const vendorCancelled = orders.filter((r) => r.status === "Cancelled" && r.cancelReason?.startsWith("Vendor cancelled")).length;
  const ratings = v.ratingCount ?? 0;
  const openReports = vendorFlags(db, v).openReports;
  const rating = ratings >= RELIABILITY.MIN_RATINGS ? Math.max(0, Math.min(5, v.ratingAvg ?? 0) - 1) / 4 * 50 : 35;
  const cancellations = orders.length >= RELIABILITY.MIN_ORDERS ? (1 - vendorCancelled / orders.length) * 35 : 28;
  const reports = 15 - Math.min(15, openReports * 5);
  const score = Math.round(rating + cancellations + reports);
  return {
    score, low: score < RELIABILITY.LOW_BELOW,
    parts: { rating: Math.round(rating), cancellations: Math.round(cancellations), reports },
    basis: { ratings, orders: orders.length, vendorCancelled, openReports },
  };
}
