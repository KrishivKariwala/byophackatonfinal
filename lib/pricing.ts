import { RULES } from "./rules";

/**
 * Dynamic price suggestion (FR-2.3). Pure functions, no I/O.
 *   d = min(0.8, 0.4 + 0.1 * max(0, 4 - h) + 0.1 * (1 - s))
 * h = hours left until pickup end, s = vendor sell-through on similar listings over the last 7 days (0..1; 0.5 if no history).
 * Rescue price = original × (1 − d), rounded to the nearest ₹5. The enforced rule (at least 30% off) always wins:
 * if rounding would break it, the price is capped at floor(original × 0.7). 80% off is the suggestion cap, not a rule.
 */
export function suggestedDiscount(hoursLeft: number, sellThrough: number | null | undefined): number {
  const h = Number.isFinite(hoursLeft) ? Math.max(0, hoursLeft) : 0;
  const s = sellThrough === null || sellThrough === undefined || !Number.isFinite(sellThrough) ? 0.5 : Math.min(1, Math.max(0, sellThrough));
  const d = Math.min(RULES.MAX_DISCOUNT_SUGGESTION, 0.4 + 0.1 * Math.max(0, 4 - h) + 0.1 * (1 - s));
  return +d.toFixed(4);
}

export function suggestedPrice(original: number, d: number): number {
  if (!Number.isFinite(original) || original <= 0) return 0;
  const raw = original * (1 - d);
  let price = Math.round(raw / 5) * 5;
  const maxAllowed = Math.floor(original * RULES.MIN_DISCOUNT_FACTOR);
  if (price > maxAllowed) price = maxAllowed;
  if (price < 1) price = Math.min(maxAllowed, 5) || 1;
  return price;
}

export function suggestPrice(input: { original: number; hoursLeft: number; sellThrough?: number | null }) {
  const d = suggestedDiscount(input.hoursLeft, input.sellThrough);
  return { discount: d, price: suggestedPrice(input.original, d), sellThroughUsed: input.sellThrough ?? 0.5 };
}

/** Sell-through of this vendor's similar (same category) listings that ended in the last 7 days: units collected ÷ units listed. */
export function sellThroughRate(
  listings: { id: string; vendorId: string; category: string; qtyTotal: number; windowEnd: string; status: string; donationOnly?: boolean }[],
  reservations: { listingId: string; qty: number; status: string }[],
  vendorId: string, category: string, nowMs: number,
): number | null {
  const from = nowMs - 7 * 24 * 3600_000;
  const similar = listings.filter((l) => l.vendorId === vendorId && l.category === category && !l.donationOnly && l.status !== "Cancelled" && Date.parse(l.windowEnd) <= nowMs && Date.parse(l.windowEnd) >= from);
  const listed = similar.reduce((s, l) => s + l.qtyTotal, 0);
  if (listed === 0) return null;
  const ids = new Set(similar.map((l) => l.id));
  const sold = reservations.filter((r) => ids.has(r.listingId) && r.status === "Picked up").reduce((s, r) => s + r.qty, 0);
  return Math.min(1, sold / listed);
}
