import type { DB, Membership, OrgRole, Outlet, Profile, Vendor } from "../types";
import { RuleError } from "../rules";
import { cfg } from "./settings";

/**
 * P2 feature 6: organizations, outlets and staff roles.
 * The existing `vendors` record IS the organization (brand); outlets hang off it; a membership links a user to it.
 * Owners (including every pre-P2 vendor, via the backfill in store.migrate AND the ownerId fallback here) can do everything;
 * managers run listings and orders; staff only handle orders and donation hand-offs at ONE outlet.
 * Everything is checked on every call from the live store, so revoking a membership takes effect instantly.
 */

export type Perm =
  | "listing.view" | "listing.write" | "order.view" | "order.fulfil" | "donation.fulfil"
  | "analytics.view" | "payouts.view" | "outlet.settings" | "outlet.manage" | "staff.manage" | "org.settings" | "certificate.view" | "distribution.view" | "receipts.view";

const ORDER_FLOOR: Perm[] = ["listing.view", "order.view", "order.fulfil", "donation.fulfil"];
export const PERMS: Record<OrgRole, readonly Perm[]> = {
  owner: ["listing.view", "listing.write", "order.view", "order.fulfil", "donation.fulfil", "analytics.view", "payouts.view", "outlet.settings", "outlet.manage", "staff.manage", "org.settings", "certificate.view", "distribution.view", "receipts.view"],
  manager: [...ORDER_FLOOR, "listing.write", "analytics.view", "outlet.settings", "staff.manage", "certificate.view", "distribution.view", "receipts.view"],
  staff: ORDER_FLOOR,
};
export const can = (role: OrgRole, perm: Perm): boolean => PERMS[role].includes(perm);

export interface VendorCtx {
  vendor: Vendor;
  role: OrgRole;
  /** Set for staff (and for a manager pinned to one outlet): the only outlet they may touch. */
  outletId?: string;
  membership?: Membership;
}

const live = (db: DB, userId: string) => db.memberships.filter((m) => m.userId === userId && !m.revokedAt);

/** The organization this user acts for, or null. A pre-P2 owner always resolves (even if the membership row were missing). */
export function resolveOrg(db: DB, actor: Profile): VendorCtx | null {
  const owned = db.vendors.find((v) => v.ownerId === actor.id);
  if (owned) return { vendor: owned, role: "owner", membership: live(db, actor.id).find((m) => m.vendorId === owned.id) };
  if (!cfg(db).flags.multiOutlet) return null; // flag off: only the original owner model exists
  for (const m of live(db, actor.id)) {
    const vendor = db.vendors.find((v) => v.id === m.vendorId);
    if (vendor) return { vendor, role: m.role, outletId: m.outletId, membership: m };
  }
  return null;
}

/** Resolve and (optionally) authorize. Throws 403 `no_vendor` when the user has no organization, `forbidden_role` when the role can't do `perm`. */
export function vendorCtx(db: DB, actor: Profile, perm?: Perm): VendorCtx {
  const ctx = resolveOrg(db, actor);
  if (!ctx) throw new RuleError("no_vendor", "Complete vendor onboarding first, or ask your manager for an invite.", 403);
  if (perm && !can(ctx.role, perm))
    throw new RuleError("forbidden_role", `Your ${ctx.role} role can't do this. Ask the owner${perm === "payouts.view" || perm === "org.settings" || perm === "outlet.manage" ? "" : " or a manager"}.`, 403);
  return ctx;
}

/** Outlets of the organization this context may touch. */
export function outletsFor(db: DB, ctx: VendorCtx): Outlet[] {
  const all = db.outlets.filter((o) => o.vendorId === ctx.vendor.id);
  return ctx.outletId ? all.filter((o) => o.id === ctx.outletId) : all;
}
export const outletAllowed = (ctx: VendorCtx, outletId: string): boolean => !ctx.outletId || ctx.outletId === outletId;
/** Throws a 404 (never "forbidden", so another outlet's data is not even confirmed to exist). */
export function assertOutlet(ctx: VendorCtx, outletId: string, what = "Not found for your outlet.") {
  if (!outletAllowed(ctx, outletId)) throw new RuleError("not_found", what, 404);
}

/** Everyone who should hear about something at one outlet: the owner, all-outlet managers, and members pinned to that outlet. */
export function outletRecipients(db: DB, vendorId: string, outletId?: string): string[] {
  const v = db.vendors.find((x) => x.id === vendorId);
  const ids = new Set<string>(v ? [v.ownerId] : []);
  if (cfg(db).flags.multiOutlet)
    for (const m of db.memberships) if (m.vendorId === vendorId && !m.revokedAt && (!m.outletId || !outletId || m.outletId === outletId) && m.role !== "staff") ids.add(m.userId);
  if (cfg(db).flags.multiOutlet && outletId)
    for (const m of db.memberships) if (m.vendorId === vendorId && !m.revokedAt && m.outletId === outletId) ids.add(m.userId);
  return [...ids];
}
