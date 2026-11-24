// P0 business rules. These numbers must not be relaxed.
export const RULES = {
  MIN_DISCOUNT_FACTOR: 0.7, // rescue_price <= original_price * 0.70
  MAX_PICKUP_START_HOURS: 12, // pickup start <= 12 h after listing creation
  HOLD_MINUTES: 5, // online checkout stock hold
  MAX_ACTIVE_RESERVATIONS: 3,
  MAX_UNITS_PER_ORDER: 5,
  MAX_LISTING_QTY: 500,
  DONATION_COLLECT_HOURS_DEFAULT: 2, // configurable policy: collection window after window end, capped by safeUntil

  // ---- P1
  CANCEL_FREE_MINUTES_BEFORE_START: 30, // customer cancels free until 30 min before pickup start
  NO_SHOW_GRACE_MINUTES: 15, // not scanned 15 min after pickup end => no-show
  NO_SHOW_SUSPEND_COUNT: 3, // 3 no-shows ...
  NO_SHOW_SUSPEND_WINDOW_DAYS: 30, // ... in 30 days ...
  SUSPEND_DAYS: 7, // ... suspends reservations for 7 days
  NO_SHOW_FLAG_COUNT: 2, // admin "flagged customers" threshold
  REMINDER_MINUTES_LEFT: 15, // "15 minutes left in your pickup window"
  ESCALATE_MINUTES_BEFORE_DEADLINE: 60, // unclaimed donation batches escalate 60 min before collect-by
  ESCALATION_RADIUS_KM: 10,
  FOLLOW_ALERT_RADIUS_KM: 10,
  REVIEW_WINDOW_HOURS: 48,
  FLAG_RATING_BELOW: 3.0, // flagged for admin review: average below 3.0 ...
  FLAG_MIN_RATINGS: 20, // ... with at least 20 ratings
  PAY_AT_PICKUP_MIN_PICKUPS: 3, // pay at pickup only for customers with 3+ completed pickups
  HIGH_RISK_MAX_WINDOW_MINUTES: 120, // raw / seafood / dairy dessert
  MAX_DISCOUNT_SUGGESTION: 0.8, // suggestion cap; the enforced minimum is still 30% off
  RESERVE_RATE_LIMIT: { max: 8, windowMs: 60_000 }, // per customer, per minute
} as const;

export class RuleError extends Error {
  status: number;
  code: string;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function suggestedRescuePrice(original: number): number {
  // Suggest 50% off, always within the 30% minimum.
  return Math.max(1, Math.floor(original * 0.5));
}

export function discountPercent(original: number, rescue: number): number {
  if (original <= 0) return 0;
  return Math.round((1 - rescue / original) * 100);
}

export function validatePrices(original: number, rescue: number, maxDiscountPct = 100) {
  if (!Number.isFinite(original) || !Number.isInteger(original) || original <= 0)
    throw new RuleError("price_invalid", "Original price must be a positive whole number of rupees.");
  if (!Number.isFinite(rescue) || !Number.isInteger(rescue) || rescue <= 0)
    throw new RuleError("price_invalid", "Rescue price must be a positive whole number of rupees.");
  const floor = Math.ceil((original * (100 - maxDiscountPct)) / 100);
  if (maxDiscountPct < 100 && rescue < Math.max(1, floor))
    throw new RuleError("discount_too_large", `The platform caps discounts at ${maxDiscountPct}% off (minimum ₹${Math.max(1, floor)} for ₹${original}).`);
  if (rescue > original * RULES.MIN_DISCOUNT_FACTOR)
    throw new RuleError(
      "discount_too_small",
      `Rescue price must be at least 30% below the original (max ₹${Math.floor(original * RULES.MIN_DISCOUNT_FACTOR)} for ₹${original}).`,
    );
}

export function validateWindow(now: number, createdAt: number, start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new RuleError("window_invalid", "Pickup start and end are required.");
  if (start <= now) throw new RuleError("window_past", "Pickup start must be in the future.");
  if (start > createdAt + RULES.MAX_PICKUP_START_HOURS * 3600_000)
    throw new RuleError("window_too_far", "Pickup must start within 12 hours of creating the listing.");
  if (end <= start) throw new RuleError("window_order", "Pickup end must be after pickup start.");
}
