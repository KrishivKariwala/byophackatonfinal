import "server-only";
import { read, now as clockNow } from "../store";
import { RuleError } from "../rules";
import { newId, randomToken, sha256 } from "../crypto";
import { write } from "../services";
import { approvedCtx, audit, iso, notify, requireRole, t } from "../core";
import { normalizePhone } from "../auth";
import { vendorAnalytics, type Range } from "../analytics";
import { cfg } from "./settings";
import { can, outletsFor, resolveOrg, vendorCtx } from "./org";
import type { DB, Membership, OrgRole, Outlet, Profile, StaffInvite } from "../types";

/** P2 feature 6 services: outlets, staff invites, role changes, instant revoke, all-outlets overview. */

const INVITE_DAYS = 7;
const MAX_OUTLETS = 25;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function requireMultiOutlet(db: DB) {
  if (!cfg(db).flags.multiOutlet) throw new RuleError("feature_off", "Multiple outlets and staff accounts are switched off.", 403);
}

// ---------------------------------------------------------------- outlets
export interface OutletInput { name?: string; address: string; neighbourhood: string; lat: number; lng: number; hours?: string; payAtPickup?: boolean }

function cleanOutlet(i: Partial<OutletInput>, partial: boolean): Partial<Outlet> {
  const out: Partial<Outlet> = {};
  const str = (k: "name" | "address" | "neighbourhood" | "hours", max: number, req: boolean) => {
    if (i[k] === undefined) { if (req && !partial) throw new RuleError("field_required", `${k[0].toUpperCase()}${k.slice(1)} is required.`); return; }
    const v = String(i[k]).trim();
    if (req && !v) throw new RuleError("field_required", `${k[0].toUpperCase()}${k.slice(1)} is required.`);
    if (v.length > max) throw new RuleError("field_long", `${k} is too long (max ${max}).`);
    out[k] = v;
  };
  str("name", 60, false); str("address", 200, true); str("neighbourhood", 60, true); str("hours", 80, false);
  if (i.lat !== undefined || i.lng !== undefined || !partial) {
    const lat = Number(i.lat), lng = Number(i.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new RuleError("pin_required", "Drop a valid map pin.");
    out.lat = lat; out.lng = lng;
  }
  if (i.payAtPickup !== undefined) out.payAtPickup = !!i.payAtPickup;
  return out;
}

export function addOutlet(actor: Profile | null, i: OutletInput) {
  return write((tx): Outlet => {
    const me = requireRole(actor, "vendor");
    const ctx = approvedCtx(tx.db, me, "outlet.manage");
    const existing = tx.db.outlets.filter((o) => o.vendorId === ctx.vendor.id);
    if (existing.length >= 1) requireMultiOutlet(tx.db);
    if (existing.length >= MAX_OUTLETS) throw new RuleError("outlet_limit", `An organization can have at most ${MAX_OUTLETS} outlets.`, 409);
    const o: Outlet = { id: newId("o"), vendorId: ctx.vendor.id, payAtPickup: false, address: "", neighbourhood: "", lat: 0, lng: 0, ...cleanOutlet(i, false) };
    tx.db.outlets.push(o);
    audit(tx, me.id, "outlet_added", "outlet", o.id, o.name ?? o.address);
    return o;
  });
}

export function updateOutlet(actor: Profile | null, outletId: string, patch: Partial<OutletInput>) {
  return write((tx): Outlet => {
    const me = requireRole(actor, "vendor");
    const ctx = approvedCtx(tx.db, me, "outlet.manage");
    const o = tx.db.outlets.find((x) => x.id === outletId && x.vendorId === ctx.vendor.id);
    if (!o) throw new RuleError("not_found", "Outlet not found.", 404);
    Object.assign(o, cleanOutlet(patch, true));
    audit(tx, me.id, "outlet_updated", "outlet", o.id);
    return o;
  });
}

// ---------------------------------------------------------------- invites
export function inviteMember(actor: Profile | null, i: { contact: string; role: Exclude<OrgRole, "owner">; outletId?: string }) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    requireMultiOutlet(tx.db);
    const ctx = approvedCtx(tx.db, me, "staff.manage");
    if (i.role !== "manager" && i.role !== "staff") throw new RuleError("role_invalid", "Invite someone as a manager or as staff.");
    if (i.role === "manager" && ctx.role !== "owner") throw new RuleError("forbidden_role", "Only the owner can invite a manager.", 403);
    const contact = String(i.contact ?? "").trim();
    const isPhone = normalizePhone(contact).length === 10 && /^[+\d\s()-]+$/.test(contact);
    if (!isPhone && !EMAIL.test(contact)) throw new RuleError("contact_invalid", "Enter a 10-digit mobile number or an email address.");
    const mine = outletsFor(tx.db, ctx);
    let outletId = i.outletId || undefined;
    if (outletId && !mine.some((o) => o.id === outletId)) throw new RuleError("not_found", "That outlet isn't part of your account.", 404);
    if (i.role === "staff" && !outletId) {
      if (mine.length === 1) outletId = mine[0].id; // a one-outlet brand: no need to choose
      else throw new RuleError("outlet_required", "Choose which outlet this staff member works at.");
    }
    if (ctx.outletId && !outletId) outletId = ctx.outletId; // a pinned manager can only invite into their own outlet
    const key = isPhone ? normalizePhone(contact) : contact.toLowerCase();
    // a newer invite replaces an older open one for the same person and brand
    for (const old of tx.db.invites) if (old.vendorId === ctx.vendor.id && old.contact === key && !old.acceptedAt && !old.revokedAt) old.revokedAt = iso(tx.now);
    const raw = randomToken();
    const inv: StaffInvite = {
      id: newId("iv"), vendorId: ctx.vendor.id, outletId, role: i.role, contact: key, token: sha256(raw), createdBy: me.id,
      createdAt: iso(tx.now), expiresAt: iso(tx.now + INVITE_DAYS * 24 * 3600_000),
    };
    tx.db.invites.push(inv);
    audit(tx, me.id, "invite_created", "invite", inv.id, `${i.role}${outletId ? ` @ ${outletId}` : ""}`);
    // If the person already has an account, tell them in-app too (the link works for new people as well).
    if (isPhone) {
      const known = tx.db.profiles.find((p) => p.phone && normalizePhone(p.phone) === key && p.role === "vendor");
      if (known) notify(tx, known.id, `${ctx.vendor.businessName} invited you to join as ${i.role}. Open /join/${raw} to accept.`, "generic", { inviteId: inv.id });
    }
    return { inviteId: inv.id, token: raw, link: `/join/${raw}`, expiresAt: inv.expiresAt, role: inv.role, outletId };
  });
}

/** Public preview of an invite (so the join page can say who invited you). Never reveals the contact. */
export function previewInvite(rawToken: string) {
  const db = read();
  const inv = db.invites.find((x) => x.token === sha256(String(rawToken)));
  if (!inv) return null;
  const v = db.vendors.find((x) => x.id === inv.vendorId);
  const o = db.outlets.find((x) => x.id === inv.outletId);
  const state = inv.revokedAt ? "revoked" : inv.acceptedAt ? "used" : t(inv.expiresAt) < clockNow(db) ? "expired" : "open";
  return { business: v?.businessName ?? "A vendor", role: inv.role, outlet: o ? (o.name ?? o.address) : null, state, usesPhone: !inv.contact.includes("@") };
}

export function acceptInvite(actor: Profile | null, rawToken: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    requireMultiOutlet(tx.db);
    const inv = tx.db.invites.find((x) => x.token === sha256(String(rawToken)));
    if (!inv) throw new RuleError("invite_invalid", "This invite link isn't valid.", 404);
    if (inv.revokedAt) throw new RuleError("invite_revoked", "This invite was cancelled.", 410);
    if (inv.acceptedAt) throw new RuleError("invite_used", "This invite was already used.", 410);
    if (t(inv.expiresAt) < tx.now) throw new RuleError("invite_expired", "This invite has expired. Ask for a new one.", 410);
    if (resolveOrg(tx.db, me)) throw new RuleError("already_member", "This account already belongs to a vendor organization.", 409);
    const live = tx.db.profiles.find((p) => p.id === me.id) ?? me;
    if (!inv.contact.includes("@") && (!live.phone || normalizePhone(live.phone) !== inv.contact))
      throw new RuleError("invite_wrong_number", "This invite was sent to a different mobile number. Sign in with that number.", 403);
    const v = tx.db.vendors.find((x) => x.id === inv.vendorId);
    if (!v) throw new RuleError("not_found", "That organization no longer exists.", 404);
    const m: Membership = { id: newId("m"), userId: me.id, vendorId: inv.vendorId, outletId: inv.outletId, role: inv.role, createdAt: iso(tx.now) };
    tx.db.memberships.push(m);
    inv.acceptedBy = me.id;
    inv.acceptedAt = iso(tx.now);
    audit(tx, me.id, "invite_accepted", "membership", m.id, `${inv.role} of ${v.businessName}`);
    notify(tx, inv.createdBy, `${live.name.split(" ")[0]} joined ${v.businessName} as ${inv.role}.`);
    return { membership: m, business: v.businessName };
  });
}

export function revokeInvite(actor: Profile | null, inviteId: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const ctx = vendorCtx(tx.db, me, "staff.manage");
    const inv = tx.db.invites.find((x) => x.id === inviteId && x.vendorId === ctx.vendor.id);
    if (!inv || (ctx.outletId && inv.outletId !== ctx.outletId)) throw new RuleError("not_found", "Invite not found.", 404);
    if (inv.acceptedAt) throw new RuleError("invite_used", "Already accepted; remove the member instead.", 409);
    inv.revokedAt = iso(tx.now);
    audit(tx, me.id, "invite_revoked", "invite", inv.id);
    return { revoked: true };
  });
}

// ---------------------------------------------------------------- members
function targetMember(db: DB, ctx: ReturnType<typeof vendorCtx>, membershipId: string): Membership {
  const m = db.memberships.find((x) => x.id === membershipId && x.vendorId === ctx.vendor.id && !x.revokedAt);
  if (!m || (ctx.outletId && m.outletId !== ctx.outletId)) throw new RuleError("not_found", "Team member not found.", 404);
  return m;
}

/** Takes effect immediately: the very next request from that person fails the membership check. */
export function revokeMember(actor: Profile | null, membershipId: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const ctx = vendorCtx(tx.db, me, "staff.manage");
    const m = targetMember(tx.db, ctx, membershipId);
    if (m.role === "owner") throw new RuleError("forbidden_role", "The owner can't be removed.", 403);
    if (m.userId === me.id) throw new RuleError("self_revoke", "You can't remove yourself.", 409);
    if (ctx.role === "manager" && m.role !== "staff") throw new RuleError("forbidden_role", "Managers can only remove staff.", 403);
    m.revokedAt = iso(tx.now);
    audit(tx, me.id, "member_revoked", "membership", m.id, `${m.role}`);
    notify(tx, m.userId, `Your access to ${ctx.vendor.businessName} was removed.`);
    return { revoked: true };
  });
}

export function changeMemberRole(actor: Profile | null, membershipId: string, role: Exclude<OrgRole, "owner">, outletId?: string) {
  return write((tx) => {
    const me = requireRole(actor, "vendor");
    const ctx = vendorCtx(tx.db, me, "org.settings"); // owner only
    const m = targetMember(tx.db, ctx, membershipId);
    if (m.role === "owner") throw new RuleError("forbidden_role", "The owner's role can't be changed.", 403);
    if (role !== "manager" && role !== "staff") throw new RuleError("role_invalid", "Choose manager or staff.");
    const oid = outletId || m.outletId;
    if (outletId && !tx.db.outlets.some((o) => o.id === outletId && o.vendorId === ctx.vendor.id)) throw new RuleError("not_found", "Outlet not found.", 404);
    if (role === "staff" && !oid) throw new RuleError("outlet_required", "Staff work at one outlet: choose which.");
    m.role = role;
    m.outletId = role === "staff" ? oid : outletId === "" ? undefined : oid;
    audit(tx, me.id, "member_role_changed", "membership", m.id, `${role}${m.outletId ? ` @ ${m.outletId}` : ""}`);
    return m;
  });
}

// ---------------------------------------------------------------- read models
export function teamOverview(actor: Profile | null) {
  const db = read();
  const ctx = vendorCtx(db, requireRole(actor, "vendor"));
  const outlets = db.outlets.filter((o) => o.vendorId === ctx.vendor.id);
  const label = (id?: string): string | null => { const o = outlets.find((x) => x.id === id); return o ? (o.name ?? o.address) : null; }; // null = all outlets (translated by the page)
  const scope = (outletId?: string) => !ctx.outletId || outletId === ctx.outletId;
  const members = can(ctx.role, "staff.manage")
    ? db.memberships.filter((m) => m.vendorId === ctx.vendor.id && !m.revokedAt && scope(m.outletId)).map((m) => {
        const p = db.profiles.find((x) => x.id === m.userId);
        return { id: m.id, name: p?.name ?? "—", phone: p?.phone, role: m.role, outletId: m.outletId, outlet: label(m.outletId), isMe: m.userId === ctx.membership?.userId || m.userId === actor?.id };
      })
    : [];
  const nowMs = clockNow(db);
  const invites = can(ctx.role, "staff.manage")
    ? db.invites.filter((v) => v.vendorId === ctx.vendor.id && !v.acceptedAt && !v.revokedAt && scope(v.outletId)).map((v) => ({
        id: v.id, contact: v.contact, role: v.role, outlet: label(v.outletId), expiresAt: v.expiresAt, expired: t(v.expiresAt) < nowMs }))
    : [];
  return { business: ctx.vendor.businessName, role: ctx.role, canManage: can(ctx.role, "staff.manage"), canManageOutlets: can(ctx.role, "outlet.manage"), outlets, members, invites, flagOn: cfg(db).flags.multiOutlet };
}

/** All-outlets analytics: one row per outlet plus the combined total (owner / all-outlet manager). */
export function orgOverview(actor: Profile | null, range: Range) {
  const db = read();
  const ctx = vendorCtx(db, requireRole(actor, "vendor"), "analytics.view");
  const nowMs = clockNow(db);
  const rows = outletsFor(db, ctx).map((o) => {
    const a = vendorAnalytics(db, ctx.vendor.id, range, nowMs, [o.id]);
    return { outlet: o, recovered: a.recovered, unitsSold: a.unitsSold, unitsDonated: a.unitsDonated, unitsExpired: a.unitsExpired, orders: a.orders, sellThroughPct: a.sellThroughPct };
  });
  const total = rows.reduce((s, r) => ({ recovered: s.recovered + r.recovered, unitsSold: s.unitsSold + r.unitsSold, unitsDonated: s.unitsDonated + r.unitsDonated, unitsExpired: s.unitsExpired + r.unitsExpired, orders: s.orders + r.orders }), { recovered: 0, unitsSold: 0, unitsDonated: 0, unitsExpired: 0, orders: 0 });
  return { range, rows, total, scopedToOutlet: !!ctx.outletId };
}
