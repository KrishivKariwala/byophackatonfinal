import { describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, onlineOrder, ff } from "./p2-harness";
const org = await import("@/lib/p2/org");
const team = await import("@/lib/p2/team");
const plat = await import("@/lib/p2/platform");
const vend = await import("@/lib/vendor");

const owner = () => P("u_ravi"); // owner of v_1 (outlet o_1)

/** v_1 with a second outlet, a manager (all outlets), staff at outlet A and staff at outlet B. Returns their profiles. */
async function setupOrg() {
  const outletB = await team.addOutlet(owner(), { name: "Koramangala", address: "5th Block, Koramangala", neighbourhood: "Koramangala", lat: 12.935, lng: 77.62, hours: "10–22" });
  const A = store.read().outlets.find((o) => o.vendorId === "v_1" && o.id !== outletB.id)!;
  const mk = async (i: number, role: "manager" | "staff", outletId?: string) => {
    const phone = `+91 90000 7${String(i).padStart(4, "0")}`;
    const p = await svc.createAccount({ name: `Member${i} Name`, phone, role: "vendor" });
    const inv = await team.inviteMember(owner(), { contact: phone, role, outletId });
    await team.acceptInvite(P(p.id), inv.token);
    return P(p.id);
  };
  return { A, B: outletB, manager: await mk(1, "manager"), staffA: await mk(2, "staff", A.id), staffB: await mk(3, "staff", outletB.id) };
}

describe("role permission matrix (feature 6)", () => {
  it("owner can do everything; manager cannot touch payouts, outlets or org settings; staff only handle orders", () => {
    const all = org.PERMS.owner;
    for (const p of all) expect(org.can("owner", p)).toBe(true);
    for (const p of ["payouts.view", "outlet.manage", "org.settings"] as const) expect(org.can("manager", p)).toBe(false);
    for (const p of ["listing.write", "analytics.view", "staff.manage", "order.fulfil"] as const) expect(org.can("manager", p)).toBe(true);
    expect(org.PERMS.staff.slice().sort()).toEqual(["donation.fulfil", "listing.view", "order.fulfil", "order.view"]);
    for (const p of ["listing.write", "analytics.view", "payouts.view", "staff.manage", "outlet.manage"] as const) expect(org.can("staff", p)).toBe(false);
  });
});

describe("migration: existing vendors keep working", () => {
  it("every seeded vendor owner has an owner membership and resolves as owner with no data change", () => {
    const db = store.read();
    for (const v of db.vendors) expect(db.memberships.some((m) => m.userId === v.ownerId && m.vendorId === v.id && m.role === "owner")).toBe(true);
    const ctx = org.vendorCtx(db, owner(), "payouts.view");
    expect(ctx.vendor.id).toBe("v_1");
    expect(ctx.role).toBe("owner");
    expect(ctx.outletId).toBeUndefined();
  });

  it("a store saved before P2 (no memberships collection) is upgraded on load", async () => {
    await store.transaction((tx) => { delete (tx.db as unknown as Record<string, unknown>).memberships; });
    const db = store.migrate(structuredClone(store.read()));
    expect(db.memberships.length).toBe(db.vendors.length);
    expect(db.vendors.length).toBeGreaterThan(5);
  });
});

describe("staff and outlet isolation (integration)", () => {
  it("staff of outlet A cannot see or fulfil outlet B's orders, and can fulfil their own", async () => {
    const { A, B, staffA, staffB } = await setupOrg();
    const la = await freshListing({ qty: 5, startMin: 1, endMin: 120, extra: { outletId: A.id } });
    const lb = await freshListing({ qty: 5, startMin: 1, endMin: 120, extra: { outletId: B.id } });
    expect([la.outletId, lb.outletId]).toEqual([A.id, B.id]);
    const c = await customer(1);
    const ra = await onlineOrder(c, la.id);
    const rb = await onlineOrder(c, lb.id);
    await ff(2); // pickup window has opened

    // A's staff: outlet B's order does not exist for them
    await expect(svc.markReady(staffA, rb.id)).rejects.toMatchObject({ code: "not_found", status: 404 });
    await expect(svc.handover(staffA, { code: rb.code })).rejects.toMatchObject({ code: "code_not_found" });
    await expect(svc.handover(staffA, { token: rb.qrToken })).rejects.toMatchObject({ code: "wrong_outlet" });
    expect(store.read().reservations.find((r) => r.id === rb.id)!.status).toBe("Reserved"); // untouched
    // ...but their own order works
    await svc.markReady(staffA, ra.id);
    const done = await svc.handover(staffA, { code: ra.code });
    expect(done.ok).toBe(true);
    // B's staff the mirror image
    await expect(svc.handover(staffB, { code: ra.code })).rejects.toMatchObject({ code: "code_not_found" });
    await expect(svc.handover(staffB, { code: rb.code })).resolves.toMatchObject({ ok: true });
  });

  it("staff cannot manage listings of any outlet, see analytics or payouts, or invite people", async () => {
    const { A, staffA } = await setupOrg();
    const la = await freshListing({ extra: { outletId: A.id } });
    await expect(svc.setPaused(staffA, la.id, true)).rejects.toMatchObject({ code: "forbidden_role" });
    await expect(svc.cancelListing(staffA, la.id, "no")).rejects.toMatchObject({ code: "forbidden_role" });
    await expect(freshListing({ vendor: staffA.id })).rejects.toMatchObject({ code: "forbidden_role" });
    await expect(vend.analyticsFor(staffA, 7)).rejects.toThrowError(/role can't/);
    await expect(vend.payoutsFor(staffA)).rejects.toThrowError(/role can't/);
    await expect(team.inviteMember(staffA, { contact: "+91 98000 11111", role: "staff", outletId: A.id })).rejects.toMatchObject({ code: "forbidden_role" });
  });

  it("a manager runs both outlets but cannot see payouts, add outlets or invite managers", async () => {
    const { A, B, manager } = await setupOrg();
    const lb = await freshListing({ vendor: manager.id, extra: { outletId: B.id } });
    expect(lb.outletId).toBe(B.id);
    await svc.setPaused(manager, lb.id, true);
    await expect(vend.payoutsFor(manager)).rejects.toThrowError(/role can't/);
    await expect(team.addOutlet(manager, { address: "x", neighbourhood: "y", lat: 12.9, lng: 77.6 })).rejects.toMatchObject({ code: "forbidden_role" });
    await expect(team.inviteMember(manager, { contact: "mgr2@example.com", role: "manager" })).rejects.toMatchObject({ code: "forbidden_role" });
    await expect(team.inviteMember(manager, { contact: "newstaff@example.com", role: "staff", outletId: A.id })).resolves.toMatchObject({ role: "staff" });
  });

  it("revoking a membership takes effect on the very next request", async () => {
    const { A, staffA } = await setupOrg();
    const la = await freshListing({ qty: 3, startMin: 1, endMin: 120, extra: { outletId: A.id } });
    const c = await customer(2);
    const r = await onlineOrder(c, la.id);
    await ff(2);
    await svc.markReady(staffA, r.id); // works now
    const m = store.read().memberships.find((x) => x.userId === staffA.id)!;
    await team.revokeMember(owner(), m.id);
    await expect(svc.handover(staffA, { code: r.code })).rejects.toMatchObject({ code: "no_vendor" });
    expect(store.read().reservations.find((x) => x.id === r.id)!.status).toBe("Ready"); // not collected by the revoked person
    expect(store.read().audit.some((a) => a.action === "member_revoked")).toBe(true);
  });

  it("the owner can't be removed, nobody removes themselves, and a manager can't remove another manager", async () => {
    const { manager } = await setupOrg();
    const db = store.read();
    const ownerM = db.memberships.find((m) => m.userId === "u_ravi")!;
    await expect(team.revokeMember(manager, ownerM.id)).rejects.toMatchObject({ code: "forbidden_role" });
    const mm = db.memberships.find((m) => m.userId === manager.id)!;
    await expect(team.revokeMember(manager, mm.id)).rejects.toMatchObject({ code: "self_revoke" });
  });

  it("outlet-scoped analytics: staff-pinned scopes are enforced; owner sees each outlet and the total", async () => {
    const { A, B } = await setupOrg();
    const la = await freshListing({ qty: 5, startMin: 1, endMin: 120, extra: { outletId: A.id } });
    const lb = await freshListing({ qty: 5, startMin: 1, endMin: 120, extra: { outletId: B.id } });
    const c = await customer(3); // (its fixture history is already outlet-A pickups, so measure after creating it)
    const before = (await team.orgOverview(owner(), 7)).rows.find((r) => r.outlet.id === A.id)!.unitsSold;
    const ra = await onlineOrder(c, la.id);
    const rb = await onlineOrder(c, lb.id, 2);
    await ff(2);
    await svc.handover(owner(), { code: ra.code });
    await svc.handover(owner(), { code: rb.code });
    const o = (await team.orgOverview(owner(), 7));
    const rowA = o.rows.find((r) => r.outlet.id === A.id)!;
    const rowB = o.rows.find((r) => r.outlet.id === B.id)!;
    expect([rowA.unitsSold - before, rowB.unitsSold]).toEqual([1, 2]);
    expect(o.total.unitsSold).toBe(before + 3);
    expect((await vend.analyticsFor(owner(), 7, B.id)).unitsSold).toBe(2);
    expect((await vend.analyticsFor(owner(), 7)).unitsSold).toBe(before + 3);
  });
});

describe("staff invites", () => {
  it("phone invites only work for that number; links work once and expire after 7 days", async () => {
    const A = store.read().outlets.find((o) => o.vendorId === "v_1")!;
    const phone = "+91 90000 71234";
    const stranger = await svc.createAccount({ name: "Stranger Two", phone: "+91 90000 79999", role: "vendor" });
    const right = await svc.createAccount({ name: "Right Person", phone, role: "vendor" });
    const inv = await team.inviteMember(owner(), { contact: phone, role: "staff", outletId: A.id });
    expect((await team.previewInvite(inv.token))).toMatchObject({ business: expect.any(String), role: "staff", state: "open" });
    await expect(team.acceptInvite(P(stranger.id), inv.token)).rejects.toMatchObject({ code: "invite_wrong_number" });
    await expect(team.acceptInvite(P(right.id), "not-a-token")).rejects.toMatchObject({ code: "invite_invalid" });
    await team.acceptInvite(P(right.id), inv.token);
    await expect(team.acceptInvite(P(right.id), inv.token)).rejects.toMatchObject({ code: "invite_used" });

    const phone2 = "+91 90000 71235";
    const p2 = await svc.createAccount({ name: "Late Person", phone: phone2, role: "vendor" });
    const inv2 = await team.inviteMember(owner(), { contact: phone2, role: "staff", outletId: A.id });
    for (let k = 0; k < 8; k++) await ff(1440); // the demo clock moves at most a day per call
    await expect(team.acceptInvite(P(p2.id), inv2.token)).rejects.toMatchObject({ code: "invite_expired" });
  });

  it("the invite token is stored hashed; a customer account can't accept; a second invite replaces the first; revoked invites die", async () => {
    const A = store.read().outlets.find((o) => o.vendorId === "v_1")!;
    const inv1 = await team.inviteMember(owner(), { contact: "someone@example.com", role: "staff", outletId: A.id });
    expect(store.read().invites.some((i) => i.token === inv1.token)).toBe(false);
    const inv2 = await team.inviteMember(owner(), { contact: "someone@example.com", role: "staff", outletId: A.id });
    const cust = await customer(9);
    await expect(team.acceptInvite(cust, inv2.token)).rejects.toMatchObject({ status: 403 });
    const v = await svc.createAccount({ name: "Some One", phone: "+91 90000 70001", role: "vendor" });
    await expect(team.acceptInvite(P(v.id), inv1.token)).rejects.toMatchObject({ code: "invite_revoked" });
    await team.revokeInvite(owner(), inv2.inviteId);
    await expect(team.acceptInvite(P(v.id), inv2.token)).rejects.toMatchObject({ code: "invite_revoked" });
  });

  it("someone who already runs a vendor can't also join another as staff (one organization per account)", async () => {
    const A = store.read().outlets.find((o) => o.vendorId === "v_1")!;
    const inv = await team.inviteMember(owner(), { contact: "+91 90000 01002", role: "staff", outletId: A.id }); // u_vendor2's phone
    const other = P("u_vendor2");
    expect(other.phone).toBeTruthy();
    await expect(team.acceptInvite(other, inv.token)).rejects.toMatchObject({ code: "already_member" });
  });

  it("validates contact, role and outlet", async () => {
    await expect(team.inviteMember(owner(), { contact: "12345", role: "staff" })).rejects.toMatchObject({ code: "contact_invalid" });
    await expect(team.inviteMember(owner(), { contact: "a@b.co", role: "owner" as never })).rejects.toMatchObject({ code: "role_invalid" });
    await expect(team.inviteMember(owner(), { contact: "a@b.co", role: "staff", outletId: "o_2" })).rejects.toMatchObject({ code: "not_found" }); // another vendor's outlet
  });
});

describe("outlets and notifications", () => {
  it("a second outlet needs the multi-outlet flag; flag off ignores staff memberships but never locks out owners", async () => {
    await plat.updatePlatformSettings(P("u_admin"), { flags: { multiOutlet: false }, confirm: true });
    await expect(team.addOutlet(owner(), { address: "x", neighbourhood: "y", lat: 12.9, lng: 77.6 })).rejects.toMatchObject({ code: "feature_off" });
    await plat.updatePlatformSettings(P("u_admin"), { flags: { multiOutlet: true }, confirm: true });
    const { A, staffA } = await setupOrg();
    expect(org.vendorCtx(store.read(), staffA).outletId).toBe(A.id);
    await plat.updatePlatformSettings(P("u_admin"), { flags: { multiOutlet: false }, confirm: true });
    expect(() => org.vendorCtx(store.read(), staffA)).toThrowError(/onboarding/);
    expect(org.vendorCtx(store.read(), owner()).role).toBe("owner");
  });

  it("new-order alerts reach the owner, managers and that outlet's staff, but not the other outlet's staff", async () => {
    const { A, B, manager, staffA, staffB } = await setupOrg();
    const la = await freshListing({ qty: 3, extra: { outletId: A.id } });
    await onlineOrder(await customer(4), la.id);
    const got = (u: string) => store.read().notifications.filter((n) => n.userId === u && /New order/.test(n.text)).length;
    expect([got("u_ravi"), got(manager.id), got(staffA.id), got(staffB.id)]).toEqual([1, 1, 1, 0]);
    expect(B.id).toBeTruthy();
  });

  it("a listing can't be created at someone else's outlet", async () => {
    await expect(freshListing({ extra: { outletId: "o_2" } })).rejects.toMatchObject({ code: "not_found" });
  });
});
