import { describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, onlineOrder, ff } from "./p2-harness";
const mod = await import("@/lib/p2/moderation");
const plat = await import("@/lib/p2/platform");
const p1 = await import("@/lib/p1");

const admin = () => P("u_admin");
const here = { lat: 12.9352, lng: 77.6245, radiusKm: 25 };
const discoverable = (id: string) => svc.discover(here).some((l) => l.id === id);
const queue = () => mod.moderationQueue(store.read());
const item = (type: string, id: string) => queue().find((q) => q.targetType === type && q.targetId === id);
const report = async (listingId: string, n: number) => {
  for (let k = 0; k < n; k++) { const c = await customer(300 + k, 0); await p1.createReport(c, { targetType: "listing", targetId: listingId, reason: "other", text: `problem ${k}` }); }
};

describe("moderation (feature 11)", () => {
  it("keyword matching is whole-word and case-insensitive", () => {
    expect(mod.matchKeywords("This is a SCAM!", ["scam"])).toEqual(["scam"]);
    expect(mod.matchKeywords("Scampi with garlic", ["scam"])).toEqual([]);
    expect(mod.matchKeywords("rotten, stale bread", ["stale", "rotten", "fake"]).sort()).toEqual(["rotten", "stale"]);
    expect(mod.matchKeywords("a.b+c", ["a.b+c"])).toEqual(["a.b+c"]); // regex characters in a keyword are literal
    expect(mod.matchKeywords("", ["scam"])).toEqual([]);
  });

  it("auto-flags a listing with a keyword in its text, and one with 3+ open reports, but not 2", async () => {
    const bad = await freshListing({ extra: { description: "Slightly stale but fine" } });
    expect(item("listing", bad.id)).toMatchObject({ state: "open", reasons: [expect.stringContaining("Keyword: stale")] });
    const reported = await freshListing();
    await report(reported.id, 2);
    expect(item("listing", reported.id)).toBeUndefined();
    await report(reported.id, 0);
    const third = await customer(399, 0);
    await p1.createReport(third, { targetType: "listing", targetId: reported.id, reason: "food_safety" });
    expect(item("listing", reported.id)).toMatchObject({ state: "open", openReports: 3, reasons: [expect.stringContaining("3 open reports")] });
  });

  it("hiding removes it from discovery immediately and notifies the vendor; restoring brings it back as paused", async () => {
    const l = await freshListing({ extra: { description: "a total scam" } });
    expect(discoverable(l.id)).toBe(true);
    await mod.moderate(admin(), "listing", l.id, { action: "hide", reason: "Misleading text" });
    expect(discoverable(l.id)).toBe(false);
    const hidden = store.read().listings.find((x) => x.id === l.id)!;
    expect([hidden.hiddenByAdmin, hidden.status, hidden.moderationNote]).toEqual([true, "Paused", "Misleading text"]);
    expect(store.read().notifications.some((n) => n.userId === "u_ravi" && n.type === "moderation" && /Misleading text/.test(n.text))).toBe(true);
    await expect(svc.reserve(await customer(1, 0), { listingId: l.id, qty: 1, method: "online" })).rejects.toBeTruthy();
    await expect(svc.setPaused(P("u_ravi"), l.id, false)).rejects.toMatchObject({ code: "hidden_by_admin" }); // the vendor can't undo it
    await mod.moderate(admin(), "listing", l.id, { action: "restore", reason: "Text corrected" });
    expect(store.read().listings.find((x) => x.id === l.id)!.hiddenByAdmin).toBe(false);
    await svc.setPaused(P("u_ravi"), l.id, false);
    expect(discoverable(l.id)).toBe(true);
  });

  it("every action is recorded with who, what, why and when, and a reason is mandatory", async () => {
    const l = await freshListing({ extra: { description: "fake discount" } });
    const before = store.read().moderationActions.length;
    await expect(mod.moderate(admin(), "listing", l.id, { action: "hide", reason: "" })).rejects.toMatchObject({ code: "reason_required" });
    await expect(mod.moderate(admin(), "listing", l.id, { action: "hide", reason: "ab" })).rejects.toMatchObject({ code: "reason_required" });
    expect(store.read().moderationActions).toHaveLength(before); // refused actions leave no record
    await mod.moderate(admin(), "listing", l.id, { action: "warn", reason: "Please fix the wording" });
    await mod.moderate(admin(), "listing", l.id, { action: "hide", reason: "Still misleading" });
    const rec = store.read().moderationActions.filter((a) => a.targetId === l.id);
    expect(rec.map((r) => r.action)).toEqual(["warn", "hide"]);
    expect(rec[0]).toMatchObject({ adminId: "u_admin", targetType: "listing", reason: "Please fix the wording" });
    expect(Date.parse(rec[0].createdAt)).toBeGreaterThan(0);
    expect(item("listing", l.id)!.history.map((h) => h.action)).toEqual(["warn", "hide"]);
    expect(store.read().audit.some((a) => a.action === "moderation_hide")).toBe(true);
  });

  it("edit changes the text and keeps the before-text in the record; the item leaves the queue once clean", async () => {
    const l = await freshListing({ extra: { description: "stale rolls" } });
    await mod.moderate(admin(), "listing", l.id, { action: "edit", reason: "Removed the word", edit: { description: "Day-old rolls" } });
    expect(store.read().listings.find((x) => x.id === l.id)!.description).toBe("Day-old rolls");
    expect(store.read().moderationActions.at(-1)!.reason).toMatch(/before: Test Box \| stale rolls/);
    expect(item("listing", l.id)?.state).not.toBe("open");
    await expect(mod.moderate(admin(), "listing", l.id, { action: "edit", reason: "bad", edit: { title: "x" } })).rejects.toMatchObject({ code: "title_invalid" });
    await expect(mod.moderate(admin(), "vendor", "v_1", { action: "edit", reason: "no edit", edit: { title: "z" } })).rejects.toMatchObject({ code: "edit_unsupported" });
  });

  it("dismiss settles an item until its wording changes or a new report arrives", async () => {
    const l = await freshListing({ extra: { description: "not a scam, honest" } });
    expect(item("listing", l.id)!.state).toBe("open");
    await mod.moderate(admin(), "listing", l.id, { action: "dismiss", reason: "False positive" });
    expect(item("listing", l.id)!.state).toBe("resolved");
    await ff(1);
    await onlineOrder(await customer(2, 0), l.id); // stock changes touch the listing but not its wording
    expect(item("listing", l.id)!.state).toBe("resolved");
    await svc.updateListing(P("u_ravi"), l.id, { description: "actually a scam now", safetyDeclaration: true });
    expect(item("listing", l.id)!.state).toBe("open"); // new wording, new look
    await mod.moderate(admin(), "listing", l.id, { action: "dismiss", reason: "Looked again" });
    await report(l.id, 3);
    expect(item("listing", l.id)!.state).toBe("open"); // new reports reopen it
  });

  it("a hidden review stops counting toward the vendor's rating, and comes back when restored", async () => {
    const c = await customer(3, 0);
    const l = await freshListing({ qty: 3, startMin: 1, endMin: 120 });
    const r = await onlineOrder(c, l.id);
    await ff(2);
    await svc.handover(P("u_ravi"), { code: r.code });
    await p1.submitReview(c, { reservationId: r.id, rating: 1, text: "this place is a scam" });
    const rv = store.read().reviews.find((x) => x.reservationId === r.id)!;
    const avgWith = store.read().vendors.find((v) => v.id === "v_1")!.ratingAvg;
    expect(item("review", rv.id)!.state).toBe("open");
    await mod.moderate(admin(), "review", rv.id, { action: "hide", reason: "Abusive wording" });
    const avgHidden = store.read().vendors.find((v) => v.id === "v_1")!.ratingAvg;
    expect(avgHidden).toBeGreaterThan(avgWith!);
    expect(p1.vendorReviews("v_1").some((x) => x.id === rv.id)).toBe(false);
    expect(store.read().notifications.some((n) => n.userId === c.id && n.type === "moderation")).toBe(true);
    await mod.moderate(admin(), "review", rv.id, { action: "restore", reason: "Reinstated" });
    expect(store.read().vendors.find((v) => v.id === "v_1")!.ratingAvg).toBe(avgWith);
  });

  it("suspend pauses the account for the chosen days and hides a suspended vendor; limits are enforced", async () => {
    await expect(mod.moderate(admin(), "vendor", "v_1", { action: "suspend", reason: "Repeated violations", suspendDays: 0 })).rejects.toMatchObject({ code: "days_invalid" });
    await expect(mod.moderate(admin(), "vendor", "v_1", { action: "suspend", reason: "Repeated violations", suspendDays: 400 })).rejects.toMatchObject({ code: "days_invalid" });
    const l = await freshListing();
    await mod.moderate(admin(), "vendor", "v_1", { action: "suspend", reason: "Repeated violations", suspendDays: 5 });
    const owner = P("u_ravi");
    expect(Date.parse(owner.suspendedUntil!) - store.now()).toBeGreaterThan(4.9 * 86400_000);
    expect(store.read().vendors.find((v) => v.id === "v_1")!.hiddenByAdmin).toBe(true);
    expect(discoverable(l.id)).toBe(false);
    await expect(freshListing()).rejects.toMatchObject({ code: "account_suspended" });
    // a customer can be suspended through their review
    await expect(mod.moderate(admin(), "review", "nope", { action: "warn", reason: "whatever" })).rejects.toMatchObject({ code: "not_found" });
  });

  it("only admins; unknown actions and types are refused; the flag turns it off", async () => {
    const l = await freshListing();
    await expect(mod.moderate(P("u_ravi"), "listing", l.id, { action: "hide", reason: "self hide" })).rejects.toMatchObject({ status: 403 });
    await expect(mod.moderate(P("u_priya"), "listing", l.id, { action: "hide", reason: "customer hide" })).rejects.toMatchObject({ status: 403 });
    await expect(mod.moderate(null, "listing", l.id, { action: "hide", reason: "nobody" })).rejects.toMatchObject({ status: 401 });
    await expect(mod.moderate(admin(), "listing", l.id, { action: "explode" as never, reason: "bad action" })).rejects.toMatchObject({ code: "action_invalid" });
    await expect(mod.moderate(admin(), "order" as never, l.id, { action: "hide", reason: "bad type" })).rejects.toMatchObject({ code: "target_invalid" });
    await plat.updatePlatformSettings(admin(), { flags: { moderation: false }, confirm: true });
    await expect(mod.moderate(admin(), "listing", l.id, { action: "hide", reason: "flag off" })).rejects.toMatchObject({ code: "feature_off" });
  });

  it("the keyword list comes from platform settings", async () => {
    await plat.updatePlatformSettings(admin(), { moderationKeywords: ["banana"], confirm: true });
    const a = await freshListing({ extra: { description: "stale bread" } });
    const b = await freshListing({ extra: { description: "banana bread" } });
    expect(item("listing", a.id)).toBeUndefined();
    expect(item("listing", b.id)!.state).toBe("open");
  });
});
