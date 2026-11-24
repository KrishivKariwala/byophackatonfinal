import "server-only";
import { read, type TxContext } from "../store";
import { RuleError } from "../rules";
import { newId } from "../crypto";
import { write } from "../services";
import { audit, iso, notifyT, requireRole, t } from "../core";
import { normalizePhone } from "../auth";
import { cfg } from "./settings";
import type { CreditEntry, DB, Profile, Referral, Reservation } from "../types";

/**
 * P2 feature 1: referral credits.
 *  - ₹50 (configurable) for BOTH people once the referee's first order is Picked up.
 *  - Credits live in `credit_ledger`: "earned" lots (with a 90-day expiry and a `remaining` balance), "spent" and "expired" rows.
 *  - Up to 50% (configurable) of an order can be paid with credit. Credits are not cash: never withdrawable, never refunded as money.
 *  - Credits spent on an order are restored when it is cancelled for free, or cancelled by the vendor / admin; a late cancellation or
 *    a no-show forfeits them exactly as it forfeits the cash.
 * Abuse controls: no self-referral, one reward per device and per phone, max 10 rewarded referrals per referrer per month.
 */

export const CREDIT_LIFETIME_DAYS = 90;
export const MAX_REWARDED_PER_MONTH = 10;
const DAY = 24 * 3600_000;
const IST = 5.5 * 3600_000;
const monthKey = (ms: number) => new Date(ms + IST).toISOString().slice(0, 7);

// ---------------------------------------------------------------- balance and quote
/** Unspent, unexpired credit in rupees. */
export function creditBalance(db: DB, userId: string, nowMs: number): number {
  return db.creditLedger.filter((e) => e.userId === userId && e.type === "earned" && (e.remaining ?? 0) > 0 && (!e.expiresAt || t(e.expiresAt) > nowMs)).reduce((s, e) => s + (e.remaining ?? 0), 0);
}

/** How much credit this order may use: the balance, capped at creditMaxPct of the order. Zero when the feature is off. */
export function creditQuote(db: DB, userId: string, orderTotal: number, nowMs: number) {
  const c = cfg(db);
  const balance = c.flags.referrals ? creditBalance(db, userId, nowMs) : 0;
  const cap = Math.floor((orderTotal * c.creditMaxPct) / 100);
  return { balance, cap, usable: Math.max(0, Math.min(balance, cap)), maxPct: c.creditMaxPct };
}

// ---------------------------------------------------------------- ledger primitives (inside a transaction)
export function earnCreditTx(tx: TxContext, userId: string, amount: number, note: string, refId?: string): CreditEntry {
  const e: CreditEntry = { id: newId("cl"), userId, amount, type: "earned", refId, note, createdAt: iso(tx.now), expiresAt: iso(tx.now + CREDIT_LIFETIME_DAYS * DAY), remaining: amount };
  tx.db.creditLedger.push(e);
  return e;
}

/** Spends `amount` oldest-expiry first. Throws if the balance isn't there (never goes negative). */
export function spendCreditTx(tx: TxContext, userId: string, amount: number, refId: string, note: string) {
  if (amount <= 0) return;
  const { db, now } = tx;
  if (creditBalance(db, userId, now) < amount) throw new RuleError("credit_insufficient", "Not enough credit.", 409);
  let left = amount;
  const lots = db.creditLedger.filter((e) => e.userId === userId && e.type === "earned" && (e.remaining ?? 0) > 0 && (!e.expiresAt || t(e.expiresAt) > now))
    .sort((a, b) => t(a.expiresAt ?? "9999") - t(b.expiresAt ?? "9999"));
  for (const lot of lots) {
    const take = Math.min(left, lot.remaining ?? 0);
    lot.remaining = (lot.remaining ?? 0) - take;
    left -= take;
    if (!left) break;
  }
  db.creditLedger.push({ id: newId("cl"), userId, amount, type: "spent", refId, note, createdAt: iso(now) });
}

/** Gives back what `refIds` (a hold and/or reservation) spent, as a fresh 90-day lot. Idempotent: a second call restores nothing. */
/** The reasons restoreCreditTx is called with, mapped to catalog entries so the notification reads in the customer's language. */
const CREDIT_NOTE_KEYS: Record<string, string> = {
  "refunded by an administrator": "notif.creditNote.refundedByAdmin",
  "checkout hold expired": "notif.creditNote.holdExpired",
  "checkout was not completed": "notif.creditNote.notCompleted",
  "vendor cancelled the listing": "notif.creditNote.vendorCancelled",
  "order cancelled": "notif.creditNote.orderCancelled",
};

export function restoreCreditTx(tx: TxContext, userId: string, refIds: (string | undefined)[], note: string): number {
  const refs = refIds.filter(Boolean) as string[];
  const spent = tx.db.creditLedger.filter((e) => e.userId === userId && e.type === "spent" && e.refId && refs.includes(e.refId)).reduce((s, e) => s + e.amount, 0);
  const back = tx.db.creditLedger.filter((e) => e.userId === userId && e.type === "earned" && e.note?.startsWith("restored") && e.refId && refs.includes(e.refId)).reduce((s, e) => s + e.amount, 0);
  const owed = spent - back;
  if (owed <= 0) return 0;
  earnCreditTx(tx, userId, owed, `restored: ${note}`, refs[0]);
  notifyT(tx, userId, "creditReturned", { amount: owed, note, ...(CREDIT_NOTE_KEYS[note] ? { noteKey: CREDIT_NOTE_KEYS[note] } : {}) }, "credit_earned", { amount: owed });
  return owed;
}

/** Job: lots past their expiry write one "expired" row and drop to zero. */
export function expireCreditsTx(tx: TxContext) {
  const { db, now } = tx;
  for (const lot of db.creditLedger) {
    if (lot.type === "earned" && (lot.remaining ?? 0) > 0 && lot.expiresAt && t(lot.expiresAt) <= now) {
      db.creditLedger.push({ id: newId("cl"), userId: lot.userId, amount: lot.remaining!, type: "expired", refId: lot.id, note: `expired after ${CREDIT_LIFETIME_DAYS} days`, createdAt: iso(now) });
      lot.remaining = 0;
    }
  }
}
export function creditJobPending(db: DB, now: number): boolean {
  return cfg(db).flags.referrals && db.creditLedger.some((e) => e.type === "earned" && (e.remaining ?? 0) > 0 && !!e.expiresAt && t(e.expiresAt) <= now);
}

// ---------------------------------------------------------------- referral codes
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeCode(db: DB, name: string): string {
  const stem = name.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  for (let i = 0; i < 50; i++) {
    const code = `${stem}${Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("")}`;
    if (!db.referralCodes.some((c) => c.code === code)) return code;
  }
  return `SAP${Date.now().toString(36).toUpperCase()}`;
}
const cleanCode = (c: string) => String(c ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Everything the referral screen shows. Creates the person's code on first use and remembers the device they opened it on. */
export function myReferral(actor: Profile | null, deviceId?: string) {
  return write((tx) => {
    const me = requireRole(actor, "customer");
    const { db, now } = tx;
    if (!cfg(db).flags.referrals) throw new RuleError("feature_off", "Referrals are switched off.", 403);
    let rc = db.referralCodes.find((c) => c.userId === me.id);
    if (!rc) { rc = { userId: me.id, code: makeCode(db, me.name) }; db.referralCodes.push(rc); }
    if (deviceId) rc.deviceId = deviceId;
    return referralView(db, me.id, now, rc.code);
  });
}

export function referralView(db: DB, userId: string, nowMs: number, code: string) {
  const c = cfg(db);
  const ledger = db.creditLedger.filter((e) => e.userId === userId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 50);
  const mine = db.referrals.filter((r) => r.referrerId === userId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const thisMonth = mine.filter((r) => r.status === "rewarded" && r.rewardedAt && monthKey(t(r.rewardedAt)) === monthKey(nowMs) && r.rejectReason !== "referrer_monthly_cap").length;
  const soonest = db.creditLedger.filter((e) => e.userId === userId && e.type === "earned" && (e.remaining ?? 0) > 0 && e.expiresAt && t(e.expiresAt) > nowMs).sort((a, b) => t(a.expiresAt!) - t(b.expiresAt!))[0];
  const referredBy = db.referrals.find((r) => r.refereeId === userId);
  return {
    code, rewardInr: c.referralCreditInr, maxPct: c.creditMaxPct, balance: creditBalance(db, userId, nowMs),
    nextExpiry: soonest?.expiresAt, nextExpiryAmount: soonest?.remaining,
    rewardedThisMonth: thisMonth, monthlyCap: MAX_REWARDED_PER_MONTH,
    referrals: mine.map((r) => ({ id: r.id, name: (db.profiles.find((p) => p.id === r.refereeId)?.name ?? "Friend").split(" ")[0], status: r.status, createdAt: r.createdAt, rewardedAt: r.rewardedAt })),
    referredBy: referredBy ? { status: referredBy.status } : null,
    ledger: ledger.map((e) => ({ id: e.id, type: e.type, amount: e.amount, note: e.note, createdAt: e.createdAt, expiresAt: e.expiresAt })),
  };
}

// ---------------------------------------------------------------- redeem and reward
/** A new customer enters someone's code. Nothing is paid yet: the reward comes with the referee's first completed pickup. */
export function redeemReferralCode(actor: Profile | null, input: { code: string; deviceId?: string }) {
  return write((tx): Referral => redeemReferralTx(tx, requireRole(actor, "customer"), input));
}

export function redeemReferralTx(tx: TxContext, me: Profile, input: { code: string; deviceId?: string }): Referral {
  const { db, now } = tx;
  if (!cfg(db).flags.referrals) throw new RuleError("feature_off", "Referrals are switched off.", 403);
  const code = cleanCode(input.code);
  if (code.length < 4) throw new RuleError("code_invalid", "Enter the referral code your friend shared.");
  const rc = db.referralCodes.find((c) => c.code === code);
  if (!rc) throw new RuleError("code_unknown", "That referral code doesn't exist. Check it and try again.", 404);
  if (rc.userId === me.id) throw new RuleError("self_referral", "You can't use your own referral code.", 409);
  const live = db.profiles.find((p) => p.id === me.id) ?? me;
  const referrer = db.profiles.find((p) => p.id === rc.userId);
  if (!referrer) throw new RuleError("code_unknown", "That referral code doesn't exist.", 404, undefined, "code_unknown_referral_code_doesn");
  if (db.referrals.some((r) => r.refereeId === me.id)) throw new RuleError("already_referred", "You've already used a referral code.", 409);
  if (db.reservations.some((r) => r.customerId === me.id) || db.holds.some((h) => h.customerId === me.id))
    throw new RuleError("not_new", "Referral codes are for new customers, before their first order.", 409);
  const phoneKey = normalizePhone(live.phone ?? "") || me.id;
  if (referrer.phone && normalizePhone(referrer.phone) === phoneKey) throw new RuleError("self_referral", "You can't use a code from your own phone number.", 409, undefined, "self_referral_t_use_code");
  const device = input.deviceId?.slice(0, 64);
  if (device && rc.deviceId && rc.deviceId === device) throw new RuleError("same_device", "A code can't be used on the same device it was shared from.", 409);
  if (db.referrals.some((r) => r.status !== "rejected" && r.phoneKey === phoneKey)) throw new RuleError("phone_used", "This phone number has already redeemed a referral.", 409);
  if (device && db.referrals.some((r) => r.status !== "rejected" && r.deviceId === device)) throw new RuleError("device_used", "This device has already redeemed a referral.", 409);
  const ref: Referral = { id: newId("rf"), referrerId: rc.userId, refereeId: me.id, code, status: "pending", deviceId: device, phoneKey, createdAt: iso(now) };
  db.referrals.push(ref);
  audit(tx, me.id, "referral_redeemed", "referral", ref.id, `code ${code}`);
  return ref;
}

/** Called when a reservation becomes "Picked up". Pays both people once, subject to the abuse limits re-checked at payout time. */
export function rewardReferralTx(tx: TxContext, r: Reservation) {
  const { db, now } = tx;
  const c = cfg(db);
  if (!c.flags.referrals) return;
  const ref = db.referrals.find((x) => x.refereeId === r.customerId && x.status === "pending");
  if (!ref) return;
  const amount = c.referralCreditInr;
  // re-check the one-per-device / one-per-phone rule among already rewarded referrals (a duplicate that slipped past redeem time)
  const dup = db.referrals.some((x) => x.id !== ref.id && x.status === "rewarded" && ((ref.deviceId && x.deviceId === ref.deviceId) || x.phoneKey === ref.phoneKey));
  if (dup) { ref.status = "rejected"; ref.rejectReason = "duplicate_device_or_phone"; audit(tx, "system", "referral_rejected", "referral", ref.id, ref.rejectReason); return; }
  const key = monthKey(now);
  const rewardedThisMonth = db.referrals.filter((x) => x.referrerId === ref.referrerId && x.status === "rewarded" && x.rewardedAt && monthKey(t(x.rewardedAt)) === key && x.rejectReason !== "referrer_monthly_cap").length;
  ref.status = "rewarded";
  ref.rewardedAt = iso(now);
  if (amount > 0) {
    earnCreditTx(tx, ref.refereeId, amount, "referral welcome credit", ref.id);
    notifyT(tx, ref.refereeId, "creditFirstRescue", { amount }, "credit_earned", { amount, referralId: ref.id });
    if (rewardedThisMonth < MAX_REWARDED_PER_MONTH) {
      earnCreditTx(tx, ref.referrerId, amount, "referral reward", ref.id);
      const name = (db.profiles.find((p) => p.id === ref.refereeId)?.name ?? "Your friend").split(" ")[0];
      notifyT(tx, ref.referrerId, "creditReferrerReward", { name, amount }, "credit_earned", { amount, referralId: ref.id });
    } else {
      ref.rejectReason = "referrer_monthly_cap"; // the friend is still rewarded; this referrer has hit the monthly limit
      notifyT(tx, ref.referrerId, "referralCapReached", { name: (db.profiles.find((p) => p.id === ref.refereeId)?.name ?? "Your friend").split(" ")[0], max: MAX_REWARDED_PER_MONTH }, "generic", { referralId: ref.id });
    }
  }
  audit(tx, "system", "referral_rewarded", "referral", ref.id, `₹${amount} each${ref.rejectReason ? `; ${ref.rejectReason}` : ""}`);
}

export const referralSummaryFor = (userId: string) => { const db = read(); return referralView(db, userId, Date.now() + (db.clockOffsetMs || 0), db.referralCodes.find((c) => c.userId === userId)?.code ?? ""); };
