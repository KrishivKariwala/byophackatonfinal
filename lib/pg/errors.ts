import "server-only";
import { RuleError, RULES } from "../rules";

/**
 * The database functions refuse with a short code (`raise exception 'insufficient_stock'`). This turns each into the same RuleError
 * (code, message, HTTP status, translation key) the demo store throws, so every screen and API route behaves the same on both stores.
 */
type Entry = [status: number, message: string, i18nKey?: string];
const MAP: Record<string, Entry> = {
  forbidden: [403, "You can't do that.", "forbidden_not_checkout"],
  not_found: [404, "Not found.", "not_found_order_not_found2"],
  qty_cap: [400, `Maximum ${RULES.MAX_UNITS_PER_ORDER} units per order.`, "qty_cap"],
  suspended: [403, "Reservations are paused on your account.", ""],
  pay_at_pickup_locked: [403, `Pay at pickup unlocks after ${RULES.PAY_AT_PICKUP_MIN_PICKUPS} completed pickups. Pay online for now.`],
  pay_at_pickup_off: [400, "This vendor only accepts online payment."],
  vendor_unavailable: [409, "This vendor is not accepting orders."],
  not_available: [409, "This listing is not available.", "not_available_listing_not_available"],
  window_closed: [409, "The pickup window has ended for this listing.", "window_closed_pickup_window_has"],
  insufficient_stock: [409, "Sold out.", "insufficient_stock_sold_out"],
  active_cap: [409, "You have too many active reservations."],
  credit_insufficient: [409, "Not enough credit."],
  bad_transition: [409, "That isn't possible in the order's current state.", "bad_transition_order_cancel"],
  approval_required: [403, "Your verification is not approved yet."],
  wrong_vendor: [403, "This pickup pass belongs to a different vendor."],
  wrong_outlet: [403, "This pickup pass is for a different outlet."],
  code_not_found: [404, "No order with this code at your outlet."],
  code_used: [409, "That code was already used; codes work once."],
  order_inactive: [409, "This order is no longer active."],
  too_early: [409, "The pickup window has not opened yet.", "too_early_opens"],
  too_late: [409, "The pickup window has ended."],
  already_claimed: [409, "Another NGO already claimed this batch."],
  feature_off: [403, "That feature is switched off."],
  code_mismatch: [403, "Collection code does not match this batch."],
  code_invalid: [400, "Enter the referral code your friend shared."],
  code_unknown: [404, "That referral code doesn't exist. Check it and try again."],
  self_referral: [409, "You can't use your own referral code."],
  already_referred: [409, "You've already used a referral code."],
  not_new: [409, "Referral codes are for new customers, before their first order."],
  same_device: [409, "A code can't be used on the same device it was shared from."],
  phone_used: [409, "This phone number has already redeemed a referral."],
  device_used: [409, "This device has already redeemed a referral."],
};

/** A RuleError for a database refusal, or the original error when it is not one of ours (a real fault: let it be a 500). */
export function toRuleError(e: unknown): unknown {
  if (e instanceof RuleError) return e;
  const x = e as { code?: string; message?: string };
  if ((x?.code === "P0001" || x?.code === "42501") && x.message && MAP[x.message]) {
    const [status, message, key] = MAP[x.message];
    return new RuleError(x.message, message, status, undefined, key);
  }
  return e;
}

/** Runs a database action and converts refusals to RuleErrors. */
export async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) { throw toRuleError(e); }
}
