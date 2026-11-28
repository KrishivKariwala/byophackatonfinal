import "server-only";
import { pgEnabled } from "./pg/db";
import { toUuid } from "./pg/uuid";
import { RuleError } from "./rules";
import { newId } from "./crypto";
import { write } from "./services";
import { audit, iso } from "./core";
import type { DB, Profile, Role } from "./types";
import { resolveOrg } from "./p2/org";
import { kitchenEnabled } from "./kitchen-themes";

/**
 * Demo sign-in helpers. The one-time code is simulated (123456); a real SMS provider replaces only the code check in
 * app/api/auth/signup/route.ts. Everything here is about WHO the phone number belongs to.
 */

export type SelfRole = Exclude<Role, "admin">;
export const SELF_ROLES: SelfRole[] = ["customer", "vendor", "ngo"];
export const HOME: Record<Role, string> = { customer: "/c", vendor: "/v", ngo: "/n", admin: "/admin" };

/** The ready-made, already-approved demo account each side's Skip button signs in as. */
export const SKIP_PERSONA: Record<SelfRole, string> = { customer: "u_priya", vendor: "u_ravi", ngo: "u_joseph" };

/** Compares phone numbers by their last 10 digits, so "+91 98765 43210" and "9876543210" are the same person. */
export function normalizePhone(s: string): string {
  const d = (s || "").replace(/\D/g, "");
  return d.length > 10 ? d.slice(-10) : d;
}

/** Where a signed-in user should land: vendors / NGOs without an application yet go to onboarding. */
export function homeFor(db: DB, p: Profile): string {
  if (p.role === "vendor" && !resolveOrg(db, p)) return "/v/onboarding"; // owners, and (P2) managers / staff of an organization, go to the dashboard
  if (p.role === "ngo" && !db.ngos.some((n) => n.ownerId === p.id)) return "/n/onboarding";
  if (p.role === "vendor" && kitchenEnabled()) return "/v/outlets"; // TEST VERSION ONLY: a vendor signs in, picks an outlet, then walks through the restaurant's door (never on the live site)
  return HOME[p.role];
}

/**
 * Sign in by phone, or create the account the first time ("find or create").
 * - Same number + same side: signs back in to the SAME account (no duplicates).
 * - Same number but a different side: refused with a clear message (one number = one account).
 * - First time: a name (2+ characters) is required.
 */
export function loginOrSignup(i: { name?: string; phone: string; role: string }) {
  return write((tx): { profile: Profile; existing: boolean; home: string } => {
    if (i.role === "admin") throw new RuleError("forbidden", "Admin access is provisioned, not self-selected.", 403, undefined, "forbidden_admin_access_provisioned");
    if (!SELF_ROLES.includes(i.role as SelfRole)) throw new RuleError("role_invalid", "Choose Customer, Vendor or NGO.");
    const role = i.role as SelfRole;
    const key = normalizePhone(i.phone);
    if (key.length < 10) throw new RuleError("phone_invalid", "Enter a valid 10-digit mobile number.", 400, undefined, "phone_invalid_enter_valid_10");
    const found = tx.db.profiles.find((p) => p.phone && normalizePhone(p.phone) === key);
    if (found) {
      if (found.role !== role)
        throw new RuleError("role_mismatch", `This number is registered as a ${found.role === "ngo" ? "NGO" : found.role}. Pick that side, or use a different number.`, 409, found.role === "ngo" ? { role: "NGO" } : { role: found.role, roleKey: `signin.role.${found.role}` });
      return { profile: found, existing: true, home: homeFor(tx.db, found) };
    }
    const name = (i.name ?? "").trim();
    if (name.length < 2) throw new RuleError("name_required", "First time here? Enter your name to create your account.");
    const profile: Profile = { id: newId("u"), name: name.slice(0, 80), phone: i.phone.trim(), role, createdAt: iso(tx.now), demo: true };
    tx.db.profiles.push(profile);
    audit(tx, profile.id, "account_created", "profile", profile.id, `via phone sign-in as ${role}`);
    return { profile, existing: false, home: homeFor(tx.db, profile) };
  });
}

/** Demo-only: sign in as the approved demo account for a side, so the whole flow works immediately. Always logged. */
export function skipLogin(role: string) {
  return write((tx): { profile: Profile; home: string } => {
    if (role === "admin") throw new RuleError("forbidden", "Admin access is provisioned, not self-selected.", 403, undefined, "forbidden_admin_access_provisioned");
    if (!SELF_ROLES.includes(role as SelfRole)) throw new RuleError("role_invalid", "Choose Customer, Vendor or NGO.");
    const wanted = pgEnabled() ? toUuid(SKIP_PERSONA[role as SelfRole]) : SKIP_PERSONA[role as SelfRole];   // (the database store keeps the demo ids as fixed uuids)
    const p = tx.db.profiles.find((x) => x.id === wanted && x.demo);
    if (!p) throw new RuleError("not_found", "The demo account for this side is missing. Run npm run seed.", 404, undefined, "not_found_demo_account_side");
    audit(tx, p.id, "demo_skip_login", "profile", p.id, `skip button on the ${role} sign-in`);
    return { profile: p, home: homeFor(tx.db, p) };
  });
}
