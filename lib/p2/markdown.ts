import { RuleError } from "../rules";
import { suggestedDiscount } from "../pricing";

/**
 * P2 feature 4: auto-markdown schedule. Pure functions (no I/O) so the rules are unit-testable.
 * A schedule is at most 3 steps; each step lowers the price to (1 - discount) × ORIGINAL price at a set time.
 * Rules: 30–80% off (and never more than the platform's discount cap), times strictly increasing and before pickup end,
 * and every step must be a deeper discount than the one before (and than the price at publish), so a price only ever goes DOWN.
 */
export const MAX_STEPS = 3;
export const MIN_STEP_DISCOUNT = 30;
export const MAX_STEP_DISCOUNT = 80;
/** A step must leave at least this long before the pickup window closes, or it would be pointless. */
export const MIN_STEP_LEAD_MS = 5 * 60_000;

export const priceAt = (original: number, discountPct: number): number => Math.max(1, Math.floor((original * (100 - discountPct)) / 100));
export const discountOf = (original: number, price: number): number => (original > 0 ? Math.round((1 - price / original) * 100) : 0);

export interface StepInput { effectiveAt: string | number; discountPct: number }
export interface ValidStep { effectiveAtMs: number; discountPct: number; price: number }

export function validateSteps(i: {
  steps: StepInput[]; original: number; startingPrice: number; nowMs: number; windowEndMs: number; maxDiscountPct?: number;
}): ValidStep[] {
  const cap = Math.min(MAX_STEP_DISCOUNT, i.maxDiscountPct ?? MAX_STEP_DISCOUNT);
  if (!Array.isArray(i.steps)) throw new RuleError("steps_invalid", "Price steps must be a list.");
  if (i.steps.length > MAX_STEPS) throw new RuleError("steps_too_many", `At most ${MAX_STEPS} price steps.`);
  const out: ValidStep[] = [];
  let prevTime = i.nowMs;
  let prevPrice = i.startingPrice;
  let prevDiscount = discountOf(i.original, i.startingPrice);
  i.steps.forEach((s, n) => {
    const label = `Step ${n + 1}`;
    const when = typeof s.effectiveAt === "number" ? s.effectiveAt : Date.parse(s.effectiveAt);
    const d = Number(s.discountPct);
    if (!Number.isFinite(when)) throw new RuleError("step_time_invalid", `${label}: choose a valid time.`);
    if (!Number.isInteger(d) || d < MIN_STEP_DISCOUNT || d > MAX_STEP_DISCOUNT)
      throw new RuleError("step_discount_range", `${label}: the discount must be a whole number from ${MIN_STEP_DISCOUNT}% to ${MAX_STEP_DISCOUNT}%.`);
    if (d > cap) throw new RuleError("step_discount_cap", `${label}: the platform caps discounts at ${cap}%.`);
    if (when <= prevTime) throw new RuleError("step_time_order", n === 0 ? `${label}: the time must be in the future.` : `${label}: steps must be in time order, after step ${n}.`);
    if (when > i.windowEndMs - MIN_STEP_LEAD_MS) throw new RuleError("step_time_late", `${label}: must be at least 5 minutes before the pickup window ends.`);
    const price = priceAt(i.original, d);
    if (price >= prevPrice || d <= prevDiscount)
      throw new RuleError("step_price_up", `${label}: each step must lower the price (it is ₹${prevPrice} now). A price only ever goes down.`);
    out.push({ effectiveAtMs: when, discountPct: d, price });
    prevTime = when; prevPrice = price; prevDiscount = d;
  });
  return out;
}

/**
 * "Use suggested schedule": reuses the P1 price function (suggestedDiscount(hoursLeft, sellThrough)) at three moments inside the
 * remaining window, so the discount deepens as pickup end approaches. Steps that wouldn't be a deeper discount than the previous are dropped.
 */
export function suggestSchedule(i: {
  original: number; startingPrice: number; nowMs: number; windowStartMs: number; windowEndMs: number; sellThrough?: number | null; maxDiscountPct?: number;
}): { effectiveAtMs: number; discountPct: number; price: number }[] {
  const from = Math.max(i.nowMs + 10 * 60_000, i.windowStartMs);
  const to = i.windowEndMs - 10 * 60_000;
  if (to <= from) return [];
  const cap = Math.min(MAX_STEP_DISCOUNT, i.maxDiscountPct ?? MAX_STEP_DISCOUNT);
  const steps: { effectiveAtMs: number; discountPct: number; price: number }[] = [];
  let prevDiscount = discountOf(i.original, i.startingPrice);
  for (const frac of [0.4, 0.7, 0.9]) {
    const at = Math.round((from + (to - from) * frac) / 60_000) * 60_000; // whole minutes
    const hoursLeft = (i.windowEndMs - at) / 3600_000;
    const d = Math.min(cap, Math.round(suggestedDiscount(hoursLeft, i.sellThrough) * 100));
    if (d >= MIN_STEP_DISCOUNT && d > prevDiscount && priceAt(i.original, d) < priceAt(i.original, prevDiscount)) {
      steps.push({ effectiveAtMs: at, discountPct: d, price: priceAt(i.original, d) });
      prevDiscount = d;
    }
  }
  return steps;
}
