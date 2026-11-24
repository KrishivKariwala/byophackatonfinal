import type { DB, FlagName, Settings } from "../types";
import { RULES } from "../rules";

/**
 * P2 platform settings. Everything an admin can change lives in `db.settings`; anything unset falls back to DEFAULTS
 * (which equal the P0/P1 constants, so a store written before P2 behaves exactly as before).
 * `cfg(db)` is a pure resolver (used inside transactions); the 60-second TTL cache for request handlers is in lib/p2/settings-cache.ts.
 */

export const FLAG_NAMES: FlagName[] = [
  "referrals", "i18n", "liveEta", "autoMarkdown", "impactCertificate", "multiOutlet",
  "priorityWindow", "distributionLog", "donationReceipts", "delivery", "moderation", "platformSettings",
];

export const FLAG_LABELS: Record<FlagName, string> = {
  referrals: "Referral credits", i18n: "Language switcher", liveEta: "Live ETA", autoMarkdown: "Auto-markdown schedule",
  impactCertificate: "Impact certificate", multiOutlet: "Multi-outlet and staff", priorityWindow: "Charity priority window",
  distributionLog: "Distribution log", donationReceipts: "Donation receipts", delivery: "Delivery hand-off",
  moderation: "Content moderation", platformSettings: "Platform settings screen",
};

export const DEFAULTS: {
  platformFeeBps: number; holdMinutes: number; freeCancelMinutes: number; defaultRadiusKm: number; maxActiveReservations: number;
  maxDiscountPct: number; priorityOptions: number[]; referralCreditInr: number; creditMaxPct: number; moderationKeywords: string[];
} = {
  platformFeeBps: 1000,
  holdMinutes: RULES.HOLD_MINUTES,
  freeCancelMinutes: RULES.CANCEL_FREE_MINUTES_BEFORE_START,
  defaultRadiusKm: 5,
  maxActiveReservations: RULES.MAX_ACTIVE_RESERVATIONS,
  maxDiscountPct: 80,
  priorityOptions: [15, 30, 45],
  referralCreditInr: 50,
  creditMaxPct: 50,
  moderationKeywords: ["scam", "fake", "stale", "rotten", "fraud", "abuse", "hate"],
};

/** Validated ranges: a value outside is refused with its range in the message. */
export interface SettingSpec { key: keyof typeof DEFAULTS; label: string; unit: string; min: number; max: number; step: number }
export const SETTING_SPECS: SettingSpec[] = [
  { key: "platformFeeBps", label: "Platform fee", unit: "basis points (100 = 1%)", min: 0, max: 3000, step: 50 },
  { key: "holdMinutes", label: "Checkout hold time", unit: "minutes", min: 2, max: 15, step: 1 },
  { key: "freeCancelMinutes", label: "Free cancellation window", unit: "minutes before pickup starts", min: 0, max: 240, step: 5 },
  { key: "defaultRadiusKm", label: "Default search radius", unit: "km", min: 1, max: 25, step: 1 },
  { key: "maxActiveReservations", label: "Max active reservations per customer", unit: "reservations", min: 1, max: 10, step: 1 },
  { key: "maxDiscountPct", label: "Maximum discount cap", unit: "% off the original price", min: 30, max: 90, step: 5 },
  { key: "referralCreditInr", label: "Referral credit", unit: "₹ each", min: 0, max: 500, step: 5 },
  { key: "creditMaxPct", label: "Credit usable per order", unit: "% of order value", min: 0, max: 100, step: 5 },
];
export const PRIORITY_CHOICES = [15, 30, 45] as const;

export type Cfg = typeof DEFAULTS & { flags: Record<FlagName, boolean> };

export function resolveSettings(s: Settings | undefined): Cfg {
  const x = s ?? ({ platformFeeBps: DEFAULTS.platformFeeBps } as Settings);
  const flags = Object.fromEntries(FLAG_NAMES.map((f) => [f, x.flags?.[f] ?? true])) as Record<FlagName, boolean>;
  const popts = (x.priorityOptions ?? DEFAULTS.priorityOptions).filter((m) => (PRIORITY_CHOICES as readonly number[]).includes(m));
  return {
    platformFeeBps: x.platformFeeBps ?? DEFAULTS.platformFeeBps,
    holdMinutes: x.holdMinutes ?? DEFAULTS.holdMinutes,
    freeCancelMinutes: x.freeCancelMinutes ?? DEFAULTS.freeCancelMinutes,
    defaultRadiusKm: x.defaultRadiusKm ?? DEFAULTS.defaultRadiusKm,
    maxActiveReservations: x.maxActiveReservations ?? DEFAULTS.maxActiveReservations,
    maxDiscountPct: x.maxDiscountPct ?? DEFAULTS.maxDiscountPct,
    priorityOptions: popts.length ? popts : DEFAULTS.priorityOptions,
    referralCreditInr: x.referralCreditInr ?? DEFAULTS.referralCreditInr,
    creditMaxPct: x.creditMaxPct ?? DEFAULTS.creditMaxPct,
    moderationKeywords: x.moderationKeywords ?? DEFAULTS.moderationKeywords,
    flags,
  };
}

export const cfg = (db: DB): Cfg => resolveSettings(db.settings);
export const flagOn = (db: DB, f: FlagName): boolean => cfg(db).flags[f];
