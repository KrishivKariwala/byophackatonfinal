import { RuleError } from "./rules";
import { audit, requireRole } from "./core";
import { write } from "./services";
import type { Diet, Ngo, Profile } from "./types";

export const DIET_PREFERENCES = ["any", "Vegetarian", "Non-vegetarian"] as const;
export type DietPreference = (typeof DIET_PREFERENCES)[number];

/** Does a donation of this diet fit the charity's preference? (A listing that is gone counts as a match: nothing to filter on.) */
export function dietMatches(pref: Ngo["dietPreference"], diet: Diet | undefined): boolean {
  return !pref || pref === "any" || !diet || pref === diet;
}

/** A charity chooses which food the feed shows. It only filters the list: details, safety information and claiming are unchanged. */
export function setNgoPreferences(actor: Profile | null, input: { diet: string }) {
  return write((tx) => {
    const me = requireRole(actor, "ngo");
    const ngo = tx.db.ngos.find((n) => n.ownerId === me.id);
    if (!ngo) throw new RuleError("not_found", "Register your organization first.", 404);
    if (!(DIET_PREFERENCES as readonly string[]).includes(input.diet)) throw new RuleError("diet_invalid", "Choose any food, vegetarian only, or non-vegetarian only.");
    ngo.dietPreference = input.diet as DietPreference;
    audit(tx, me.id, "ngo_preferences_changed", "ngo", ngo.id, `diet preference: ${input.diet}`);
    return { diet: ngo.dietPreference };
  });
}
