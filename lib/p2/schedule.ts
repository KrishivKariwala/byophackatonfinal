import type { TxContext } from "../store";
import type { Listing, Profile } from "../types";
import { RuleError } from "../rules";
import { newId } from "../crypto";
import { audit, iso, t } from "../core";
import { cfg } from "./settings";
import { validateSteps, type StepInput } from "./markdown";

/**
 * Stores a listing's auto-markdown schedule (replacing any steps that haven't run yet). Steps that already ran stay as history
 * and the new steps must be a deeper discount than the CURRENT price, so editing a schedule can never push a price back up.
 */
export function setPriceSteps(tx: TxContext, me: Profile, l: Listing, steps: StepInput[] | undefined) {
  if (steps === undefined) return;
  const { db, now } = tx;
  if (!cfg(db).flags.autoMarkdown) {
    if (steps.length) throw new RuleError("feature_off", "Auto-markdown is switched off by the platform.", 403, undefined, "feature_off_auto_markdown_switched");
    return;
  }
  if (l.donationOnly && steps.length) throw new RuleError("steps_donation", "Donation-only listings have no price to mark down.");
  const valid = validateSteps({ steps, original: l.originalPrice, startingPrice: l.rescuePrice, nowMs: now, windowEndMs: t(l.windowEnd), maxDiscountPct: cfg(db).maxDiscountPct });
  db.priceSteps = db.priceSteps.filter((s) => s.listingId !== l.id || s.appliedAt);
  for (const s of valid) db.priceSteps.push({ id: newId("ps"), listingId: l.id, effectiveAt: iso(s.effectiveAtMs), discountPct: s.discountPct });
  if (valid.length || steps.length === 0) audit(tx, me.id, "price_schedule_set", "listing", l.id, valid.map((s) => `${new Date(s.effectiveAtMs).toISOString().slice(11, 16)}→${s.discountPct}%`).join(", ") || "cleared");
}
