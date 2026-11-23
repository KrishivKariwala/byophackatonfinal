import { RULES } from "./rules";
import type { DB, Listing, Reservation } from "./types";

/** Pure cancellation policy (FR-4.7). Customer: free until 30 min before pickup start; later = no refund. Vendor: always refund. */
export function cancellationOutcome(input: { nowMs: number; windowStartMs: number; by: "customer" | "vendor" | "admin"; paidOnline: boolean }) {
  const deadline = input.windowStartMs - RULES.CANCEL_FREE_MINUTES_BEFORE_START * 60_000;
  const free = input.by !== "customer" || input.nowMs <= deadline;
  return { free, refund: input.paidOnline && free, deadlineMs: deadline };
}

export const CANCEL_POLICY_TEXT =
  "Cancel for free until 30 minutes before pickup starts and any online payment is refunded in full. After that, cancelling is not refunded. If the vendor cancels, you always get a full refund.";

export function cancelQuote(db: DB, r: Reservation, l: Listing) {
  const active = r.status === "Reserved" || r.status === "Ready";
  const p = db.payments.find((x) => x.reservationId === r.id);
  const paidOnline = p?.status === "Test Payment Successful";
  const o = cancellationOutcome({ nowMs: Date.now() + (db.clockOffsetMs || 0), windowStartMs: Date.parse(l.windowStart), by: "customer", paidOnline });
  return { allowed: active, free: o.free, refundAmount: o.refund ? r.amount : 0, freeUntil: new Date(o.deadlineMs).toISOString() };
}
