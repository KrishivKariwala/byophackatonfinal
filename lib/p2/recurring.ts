import { RuleError } from "../rules";
import { newId } from "../crypto";
import { approvedCtx, audit, iso, requireRole } from "../core";
import { createListingTx, write } from "../services";
import type { TxContext } from "../store";
import { assertOutlet, outletsFor } from "./org";
import type { DB, RecurringSchedule, Profile, Template } from "../types";

/**
 * Recurring listings: a vendor picks a saved template, the days of the week and a pickup start time; the platform then publishes that
 * listing by itself, `leadMinutes` before each window opens. Every normal rule still applies at publish time (the 30% discount rule, window
 * rules, an approved vendor), the owner confirms the food-safety declaration once for the whole schedule, and a schedule never publishes
 * twice for the same day. If a rule now fails it records why (`lastError`) and tries again the next day.
 */
export const RECURRING = { MAX_PER_VENDOR: 10, MIN_LEAD: 15, MAX_LEAD: 180, DEFAULT_LEAD: 60 } as const;

const IST_OFFSET_MS = 330 * 60_000;

/** Calendar facts in India time for a moment. `midnight` is the UTC timestamp of 00:00 India time that day. */
export function istDay(ms: number) {
  const shifted = ms + IST_OFFSET_MS;
  const d = new Date(shifted);
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - IST_OFFSET_MS;
  return { date: d.toISOString().slice(0, 10), dow: d.getUTCDay(), midnight };
}

const parseTime = (s: string): number | null => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** The window a schedule would publish for today, or null if it is not scheduled for today. */
function todaysWindow(s: RecurringSchedule, template: Template, nowMs: number) {
  const day = istDay(nowMs);
  if (!s.days.includes(day.dow)) return null;
  const startMin = parseTime(s.startTime);
  if (startMin === null) return null;
  const start = day.midnight + startMin * 60_000;
  return { date: day.date, publishAt: start - s.leadMinutes * 60_000, start, end: start + (template.windowMinutes ?? 90) * 60_000 };
}

export function dueSchedules(db: DB, nowMs: number) {
  const out: { s: RecurringSchedule; template: Template; w: NonNullable<ReturnType<typeof todaysWindow>> }[] = [];
  for (const s of db.schedules) {
    if (s.paused) continue;
    const template = db.templates.find((x) => x.id === s.templateId);
    if (!template) continue;
    const w = todaysWindow(s, template, nowMs);
    if (w && s.lastPublishedFor !== w.date && nowMs >= w.publishAt && nowMs < w.start) out.push({ s, template, w });
  }
  return out;
}

export function recurringJobPending(db: DB, nowMs: number): boolean {
  return dueSchedules(db, nowMs).length > 0;
}

/** Publishes every schedule that is due. Runs inside the same transaction as the other scheduled jobs. */
export function runRecurringJob(tx: TxContext) {
  for (const { s, template, w } of dueSchedules(tx.db, tx.now)) {
    const vendor = tx.db.vendors.find((v) => v.id === s.vendorId);
    const owner = vendor && tx.db.profiles.find((p) => p.id === vendor.ownerId);
    if (!vendor || !owner) { s.lastError = "vendor_missing"; s.lastPublishedFor = w.date; continue; }
    try {
      const l = createListingTx(tx, owner, {
        title: template.title, description: template.description, category: template.category, originalPrice: template.originalPrice, rescuePrice: template.rescuePrice,
        qty: template.qty ?? 10, diet: template.diet, allergens: template.allergens, surpriseBag: template.surpriseBag, storageNote: template.storageNote,
        preparedAt: iso(tx.now - 60_000), windowStart: iso(w.start), windowEnd: iso(w.end), donateRest: template.donateRest ?? true,
        donationOnly: template.donationOnly, riskTag: template.riskTag, safetyDeclaration: true, outletId: s.outletId, priorityMinutes: template.priorityMinutes,
      });
      s.lastListingId = l.id; s.lastError = undefined;
      audit(tx, owner.id, "schedule_published", "schedule", s.id, `listing ${l.id} for ${w.date}`);
    } catch (e) {
      s.lastError = e instanceof RuleError ? e.code : "publish_failed";
      audit(tx, owner.id, "schedule_failed", "schedule", s.id, `${w.date}: ${s.lastError}`);
    }
    s.lastPublishedFor = w.date; // one attempt per day: a failure is retried tomorrow, not every few seconds
  }
}

export interface ScheduleInput { templateId: string; days: number[]; startTime: string; leadMinutes?: number; declaration: boolean; outletId?: string }

export function createSchedule(actor: Profile | null, i: ScheduleInput) {
  return write((tx): RecurringSchedule => {
    const me = requireRole(actor, "vendor");
    const ctx = approvedCtx(tx.db, me, "listing.write");
    const v = ctx.vendor;
    const tpl = tx.db.templates.find((x) => x.id === i.templateId && x.vendorId === v.id);
    if (!tpl) throw new RuleError("not_found", "Template not found.", 404, undefined, "not_found_template_not_found");
    if (i.declaration !== true) throw new RuleError("declaration_required", "Confirm the food-safety declaration to publish.");
    const days = [...new Set((i.days ?? []).map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
    if (days.length === 0) throw new RuleError("days_required", "Choose at least one day of the week.");
    if (parseTime(String(i.startTime)) === null) throw new RuleError("time_invalid", "Enter the pickup start time as HH:MM, for example 18:30.");
    const lead = i.leadMinutes ?? RECURRING.DEFAULT_LEAD;
    if (!Number.isInteger(lead) || lead < RECURRING.MIN_LEAD || lead > RECURRING.MAX_LEAD) throw new RuleError("lead_invalid", `Publish between ${RECURRING.MIN_LEAD} and ${RECURRING.MAX_LEAD} minutes before the window opens.`, 400, { min: RECURRING.MIN_LEAD, max: RECURRING.MAX_LEAD });
    if (tx.db.schedules.filter((x) => x.vendorId === v.id).length >= RECURRING.MAX_PER_VENDOR) throw new RuleError("too_many_schedules", `You can have up to ${RECURRING.MAX_PER_VENDOR} schedules.`, 409, { max: RECURRING.MAX_PER_VENDOR });
    const mine = outletsFor(tx.db, ctx);
    const outlet = i.outletId ? mine.find((o) => o.id === i.outletId) : mine[0];
    if (!outlet) throw new RuleError("no_outlet", "Add your outlet address first.", 409);
    assertOutlet(ctx, outlet.id, "Outlet not found for your account.");
    const s: RecurringSchedule = {
      id: newId("rs"), vendorId: v.id, outletId: outlet.id, templateId: tpl.id, days, startTime: i.startTime, leadMinutes: lead, paused: false,
      declaration: { acceptedAt: iso(tx.now), byUserId: me.id }, createdAt: iso(tx.now),
    };
    tx.db.schedules.push(s);
    audit(tx, me.id, "schedule_created", "schedule", s.id, `${tpl.title}; days ${days.join("")}; ${i.startTime}`);
    return s;
  });
}

function mine(tx: TxContext, actor: Profile | null, id: string) {
  const me = requireRole(actor, "vendor");
  const ctx = approvedCtx(tx.db, me, "listing.write");
  const s = tx.db.schedules.find((x) => x.id === id && x.vendorId === ctx.vendor.id);
  if (!s) throw new RuleError("not_found", "Schedule not found.", 404);
  assertOutlet(ctx, s.outletId, "Schedule not found.");
  return { me, s };
}

export function setSchedulePaused(actor: Profile | null, id: string, paused: boolean) {
  return write((tx) => {
    const { me, s } = mine(tx, actor, id);
    s.paused = !!paused;
    audit(tx, me.id, paused ? "schedule_paused" : "schedule_resumed", "schedule", s.id);
    return { paused: s.paused };
  });
}

export function deleteSchedule(actor: Profile | null, id: string) {
  return write((tx) => {
    const { me, s } = mine(tx, actor, id);
    tx.db.schedules.splice(tx.db.schedules.indexOf(s), 1);
    audit(tx, me.id, "schedule_deleted", "schedule", s.id);
    return { deleted: true };
  });
}
