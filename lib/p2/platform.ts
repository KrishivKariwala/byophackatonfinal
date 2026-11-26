import "server-only";
import { read, readDb, storeEpoch } from "./../store";
import { onSettingsSeen, pgEnabled } from "../pg/db";
import { RuleError } from "../rules";
import { write } from "../services";
import { audit, iso, requireRole, t } from "../core";
import { newId } from "../crypto";
import { FLAG_NAMES, SETTING_SPECS, PRIORITY_CHOICES, resolveSettings, type Cfg } from "./settings";
import type { DB, FlagName, Profile, Settings } from "../types";

/**
 * P2 feature 12: platform settings. Reads are served from a 60-second TTL cache (so a hot path never re-resolves them);
 * every write validates ranges, records an audit trail row per changed key, and invalidates the cache immediately.
 * Inside a transaction always use cfg(tx.db) from ./settings, which is always current.
 */

const TTL_MS = 60_000;
let cache: { at: number; epoch: number; value: Cfg } | null = null;
export const invalidateSettingsCache = () => { if (!pgEnabled()) cache = null; };   // (database store: the next snapshot read refreshes it)

export function getSettings(): Cfg {
  const nowMs = Date.now();
  if (cache && nowMs - cache.at < TTL_MS && cache.epoch === storeEpoch()) return cache.value;
  // On the database store the cache is refreshed by every snapshot read (see below); before the first read the defaults apply.
  if (pgEnabled()) return cache?.value ?? resolveSettings(undefined);
  const value = resolveSettings(read().settings);
  cache = { at: nowMs, epoch: storeEpoch(), value };
  return value;
}
// Database store: every snapshot that is read refreshes the cached settings, so an admin's change shows on the next request.
if (pgEnabled()) onSettingsSeen((s) => { cache = { at: Date.now(), epoch: storeEpoch(), value: resolveSettings(s as unknown as Settings) }; });
export const isFlagOn = (f: FlagName): boolean => getSettings().flags[f];

export interface SettingsPatch {
  values?: Partial<Record<(typeof SETTING_SPECS)[number]["key"], number>>;
  priorityOptions?: number[];
  moderationKeywords?: string[];
  flags?: Partial<Record<FlagName, boolean>>;
  /** Required when the change affects live listings or customers right now (the warnings are returned first). */
  confirm?: boolean;
}

/** What a change would touch right now, in plain words. Empty = nothing live is affected. */
export function impactOf(db: DB, patch: SettingsPatch, nowMs: number): string[] {
  const cur = resolveSettings(db.settings);
  const out: string[] = [];
  const v = patch.values ?? {};
  if (v.maxDiscountPct !== undefined && v.maxDiscountPct < cur.maxDiscountPct) {
    const n = db.listings.filter((l) => l.status === "Live" && !l.donationOnly && t(l.windowEnd) > nowMs && l.originalPrice > 0 && (1 - l.rescuePrice / l.originalPrice) * 100 > v.maxDiscountPct!).length;
    if (n) out.push(`${n} live listing${n === 1 ? "" : "s"} already discount more than ${v.maxDiscountPct}%. They keep their price, but vendors cannot edit them to a deeper discount.`);
  }
  if (v.holdMinutes !== undefined) {
    const n = db.holds.filter((h) => h.status === "Active").length;
    if (n) out.push(`${n} checkout hold${n === 1 ? " is" : "s are"} active now. They keep their current expiry; only new holds last ${v.holdMinutes} min.`);
  }
  if (v.maxActiveReservations !== undefined && v.maxActiveReservations < cur.maxActiveReservations) {
    const per = new Map<string, number>();
    for (const r of db.reservations) if (r.status === "Reserved" || r.status === "Ready") per.set(r.customerId, (per.get(r.customerId) ?? 0) + 1);
    const n = [...per.values()].filter((c) => c > v.maxActiveReservations!).length;
    if (n) out.push(`${n} customer${n === 1 ? " has" : "s have"} more active reservations than the new limit. Existing ones stay; they just can't add more.`);
  }
  if (v.freeCancelMinutes !== undefined) {
    const n = db.reservations.filter((r) => r.status === "Reserved" || r.status === "Ready").length;
    if (n) out.push(`${n} active reservation${n === 1 ? "" : "s"} will use the new free-cancellation window.`);
  }
  if (patch.flags) for (const f of FLAG_NAMES) {
    if (patch.flags[f] === false && cur.flags[f] && f === "priorityWindow") {
      const n = db.listings.filter((l) => l.status === "Live" && l.publicVisibleAt && t(l.publicVisibleAt) > nowMs).length;
      if (n) out.push(`${n} listing${n === 1 ? " is" : "s are"} in a charity priority window. Switching it off makes them public to customers immediately.`);
    }
  }
  return out;
}

export function updatePlatformSettings(actor: Profile | null, patch: SettingsPatch) {
  return write((tx) => {
    const me = requireRole(actor, "admin");
    const db = tx.db;
    if (!resolveSettings(db.settings).flags.platformSettings && !patch.flags?.platformSettings) {
      // the settings screen itself is flag-gated, but an admin can always switch it back on
      throw new RuleError("feature_off", "The platform settings screen is switched off.", 403, undefined, "feature_off_platform_settings_screen");
    }
    const next: Settings = { ...db.settings, flags: { ...db.settings.flags } };
    const changes: { key: string; from: string; to: string }[] = [];
    const record = (key: string, from: unknown, to: unknown) => {
      if (JSON.stringify(from) !== JSON.stringify(to)) changes.push({ key, from: JSON.stringify(from), to: JSON.stringify(to) });
    };
    const cur = resolveSettings(db.settings);

    for (const [key, raw] of Object.entries(patch.values ?? {})) {
      const spec = SETTING_SPECS.find((s) => s.key === key);
      if (!spec) throw new RuleError("setting_unknown", `Unknown setting "${key}".`, 400, undefined, "");
      const n = Number(raw);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < spec.min || n > spec.max)
        throw new RuleError("setting_range", `${spec.label} must be a whole number from ${spec.min} to ${spec.max} (${spec.unit}).`, 400, { label: spec.label, labelKey: `set.spec.${spec.key}.label`, min: spec.min, max: spec.max, unit: spec.unit, unitKey: `set.spec.${spec.key}.unit` }, "setting_range_spec");
      record(key, cur[spec.key], n);
      (next as unknown as Record<string, unknown>)[key] = n;
    }
    if (patch.priorityOptions) {
      const opts = [...new Set(patch.priorityOptions.map(Number))].sort((a, b) => a - b);
      if (!opts.length || opts.some((o) => !(PRIORITY_CHOICES as readonly number[]).includes(o)))
        throw new RuleError("setting_range", "Priority-window options must be a non-empty subset of 15, 30 and 45 minutes.");
      record("priorityOptions", cur.priorityOptions, opts);
      next.priorityOptions = opts;
    }
    if (patch.moderationKeywords) {
      const kws = [...new Set(patch.moderationKeywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean))].slice(0, 100);
      if (kws.some((k) => k.length > 40)) throw new RuleError("setting_range", "A moderation keyword can be at most 40 characters.", 400, undefined, "setting_range_moderation_keyword_most");
      record("moderationKeywords", cur.moderationKeywords, kws);
      next.moderationKeywords = kws;
    }
    for (const [f, on] of Object.entries(patch.flags ?? {})) {
      if (!FLAG_NAMES.includes(f as FlagName) || typeof on !== "boolean") throw new RuleError("setting_unknown", `Unknown feature flag "${f}".`, 400, undefined, "");
      record(`flag:${f}`, cur.flags[f as FlagName], on);
      next.flags![f as FlagName] = on;
    }
    if (!changes.length) return { changed: 0, warnings: [] as string[], applied: false };

    const warnings = impactOf(db, patch, tx.now);
    if (warnings.length && patch.confirm !== true) return { changed: changes.length, warnings, applied: false };

    db.settings = next;
    for (const c of changes) {
      db.settingsAudit.push({ id: newId("sc"), adminId: me.id, key: c.key, from: c.from, to: c.to, at: iso(tx.now) });
      audit(tx, me.id, "setting_changed", "settings", c.key, `${c.from} → ${c.to}`);
    }
    tx.afterCommit(() => invalidateSettingsCache()); // after commit, so a concurrent read can't re-cache the old values
    return { changed: changes.length, warnings, applied: true };
  });
}

export const settingsAuditTrail = async (db?: DB) => { db ??= await readDb(); return [...db.settingsAudit].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 100)
  .map((c) => ({ ...c, admin: db!.profiles.find((p) => p.id === c.adminId)?.name ?? c.adminId })); };
