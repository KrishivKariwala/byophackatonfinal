import { describe, expect, it } from "vitest";
import { store, svc, P, customer, freshListing, onlineOrder, ff } from "./p2-harness";
const cr = await import("@/lib/p2/credits");
const plat = await import("@/lib/p2/platform");
const p1 = await import("@/lib/p1");

const owner = () => P("u_ravi");
const bal = (u: string) => cr.creditBalance(store.read(), u, store.now());
const give = (u: string, amount: number, ageDays = 0) =>
  store.transaction((tx) => { const e = cr.earnCreditTx(tx, u, amount, "test grant"); e.expiresAt = new Date(tx.now + (90 - ageDays) * 86400_000).toISOString(); });

/** referrer (with a code) + a brand-new referee who has used it, both fresh accounts. */
async function pair(i = 0, opts: { device?: string; refereeDevice?: string } = {}) {
  const referrer = await customer(100 + i * 2, 0);
  const referee = await customer(101 + i * 2, 0);
  const view = await cr.myReferral(referrer, opts.device);
  await cr.redeemReferralCode(referee, { code: view.code, deviceId: opts.refereeDevice ?? `dev-referee-${i}-xxxxxxxxxxxx` });
  return { referrer, referee, code: view.code };
}
async function firstPickup(c: ReturnType<typeof P>) {
  const l = await freshListing({ qty: 4, startMin: 1, endMin: 120 });
  const r = await onlineOrder(c, l.id);
  await ff(2);
  await svc.handover(owner(), { code: r.code });
  return r;
}

describe("credit quote and ledger (unit)", () => {
  it("credit covers at most 50% of an order and never more than the balance", async () => {
    const c = await customer(1, 0);
    await give(c.id, 200);
    expect(cr.creditQuote(store.read(), c.id, 100, store.now())).toMatchObject({ balance: 200, cap: 50, usable: 50 });
    expect(cr.creditQuote(store.read(), c.id, 99, store.now()).usable).toBe(49); // rounds down
    await give(c.id, 0);
    const poor = await customer(2, 0);
    await give(poor.id, 20);
    expect(cr.creditQuote(store.read(), poor.id, 100, store.now()).usable).toBe(20);
    expect(cr.creditQuote(store.read(), poor.id, 0, store.now()).usable).toBe(0);
  });

  it("spends the lot closest to expiry first and can't overspend", async () => {
    const c = await customer(3, 0);
    await give(c.id, 50, 80); // expires in 10 days
    await give(c.id, 50, 0);  // expires in 90 days
    await store.transaction((tx) => cr.spendCreditTx(tx, c.id, 60, "ord_x", "test"));
    const lots = store.read().creditLedger.filter((e) => e.userId === c.id && e.type === "earned").sort((a, b) => (a.expiresAt! < b.expiresAt! ? -1 : 1));
    expect(lots.map((l) => l.remaining)).toEqual([0, 40]);
    expect(bal(c.id)).toBe(40);
    await expect(store.transaction((tx) => cr.spendCreditTx(tx, c.id, 41, "ord_y", "test"))).rejects.toMatchObject({ code: "credit_insufficient" });
    expect(bal(c.id)).toBe(40);
  });

  it("expired lots don't count; the job writes an 'expired' row once", async () => {
    const c = await customer(4, 0);
    await give(c.id, 50, 91); // already expired
    expect(bal(c.id)).toBe(0);
    await give(c.id, 30, 89); // expires in a day
    expect(bal(c.id)).toBe(30);
    for (let k = 0; k < 2; k++) await ff(1440);
    expect(bal(c.id)).toBe(0);
    const expired = store.read().creditLedger.filter((e) => e.userId === c.id && e.type === "expired");
    expect(expired.map((e) => e.amount).sort()).toEqual([30, 50]);
    await ff(5);
    expect(store.read().creditLedger.filter((e) => e.userId === c.id && e.type === "expired")).toHaveLength(2);
  });
});

describe("referral rules (feature 1)", () => {
  it("both people get ₹50 after the referee's first completed pickup, and only then", async () => {
    const { referrer, referee } = await pair(1);
    expect([bal(referrer.id), bal(referee.id)]).toEqual([0, 0]); // nothing at sign-up
    const l = await freshListing({ qty: 4, startMin: 1, endMin: 120 });
    const r = await onlineOrder(referee, l.id);
    expect([bal(referrer.id), bal(referee.id)]).toEqual([0, 0]); // not on reserve or payment
    await ff(2);
    await svc.handover(owner(), { code: r.code });
    expect([bal(referrer.id), bal(referee.id)]).toEqual([50, 50]);
    expect(store.read().referrals.find((x) => x.refereeId === referee.id)!.status).toBe("rewarded");
    // a second order pays nothing more
    await firstPickup(referee);
    expect([bal(referrer.id), bal(referee.id)]).toEqual([50, 50]);
  });

  it("a cancelled first order does not trigger the reward", async () => {
    const { referrer, referee } = await pair(2);
    const l = await freshListing({ qty: 3, startMin: 90, endMin: 200 });
    const r = await onlineOrder(referee, l.id);
    await p1.cancelReservation(referee, r.id);
    expect([bal(referrer.id), bal(referee.id)]).toEqual([0, 0]);
    expect(store.read().referrals.find((x) => x.refereeId === referee.id)!.status).toBe("pending");
  });

  it("no self-referral: not your own code, not a code from your own phone number", async () => {
    const a = await customer(10, 0);
    const v = await cr.myReferral(a);
    await expect(cr.redeemReferralCode(a, { code: v.code })).rejects.toMatchObject({ code: "self_referral" });
    // a second account on the SAME phone number
    const twin = await svc.createAccount({ name: "Twin Account", phone: a.phone, role: "customer" });
    await expect(cr.redeemReferralCode(P(twin.id), { code: v.code })).rejects.toMatchObject({ code: "self_referral" });
  });

  it("the same device can't redeem twice, nor redeem a code shared from that same device", async () => {
    const referrer = await customer(20, 0);
    const code = (await cr.myReferral(referrer, "device-aaaaaaaaaaaaaaaa")).code;
    const one = await customer(21, 0);
    await expect(cr.redeemReferralCode(one, { code, deviceId: "device-aaaaaaaaaaaaaaaa" })).rejects.toMatchObject({ code: "same_device" }); // referrer's own device
    await cr.redeemReferralCode(one, { code, deviceId: "device-bbbbbbbbbbbbbbbb" });
    const two = await customer(22, 0);
    await expect(cr.redeemReferralCode(two, { code, deviceId: "device-bbbbbbbbbbbbbbbb" })).rejects.toMatchObject({ code: "device_used" });
    await cr.redeemReferralCode(two, { code, deviceId: "device-cccccccccccccccc" }); // a different device is fine
  });

  it("the same phone number can't redeem twice, and a referee can only use one code", async () => {
    const referrer = await customer(30, 0);
    const other = await customer(31, 0);
    const c1 = (await cr.myReferral(referrer)).code;
    const c2 = (await cr.myReferral(other)).code;
    const ref = await customer(32, 0);
    await cr.redeemReferralCode(ref, { code: c1, deviceId: "device-dddddddddddddddd" });
    await expect(cr.redeemReferralCode(ref, { code: c2, deviceId: "device-eeeeeeeeeeeeeeee" })).rejects.toMatchObject({ code: "already_referred" });
    // another account created with the same phone number as an already-redeemed referee
    const clone = await svc.createAccount({ name: "Clone Person", phone: ref.phone, role: "customer" });
    await expect(cr.redeemReferralCode(P(clone.id), { code: c2, deviceId: "device-ffffffffffffffff" })).rejects.toMatchObject({ code: "phone_used" });
  });

  it("is for new customers only, rejects unknown codes, and respects the feature flag", async () => {
    const referrer = await customer(40, 0);
    const code = (await cr.myReferral(referrer)).code;
    const old = await customer(41, 1); // has a previous order
    await expect(cr.redeemReferralCode(old, { code })).rejects.toMatchObject({ code: "not_new" });
    const fresh = await customer(42, 0);
    await expect(cr.redeemReferralCode(fresh, { code: "ZZZZ9999" })).rejects.toMatchObject({ code: "code_unknown" });
    await expect(cr.redeemReferralCode(fresh, { code: "ab" })).rejects.toMatchObject({ code: "code_invalid" });
    await expect(cr.redeemReferralCode(null, { code })).rejects.toMatchObject({ status: 401 });
    await plat.updatePlatformSettings(P("u_admin"), { flags: { referrals: false }, confirm: true });
    await expect(cr.redeemReferralCode(fresh, { code })).rejects.toMatchObject({ code: "feature_off" });
    expect(cr.creditQuote(store.read(), referrer.id, 100, store.now()).usable).toBe(0);
  });

  it("a referrer is paid for at most 10 referrals a month; the 11th friend is still rewarded", async () => {
    const referrer = await customer(50, 0);
    const code = (await cr.myReferral(referrer)).code;
    const friends = [];
    for (let k = 0; k < 11; k++) {
      const f = await customer(60 + k, 0);
      await cr.redeemReferralCode(f, { code, deviceId: `device-friend-${String(k).padStart(2, "0")}-xxxxxxx` });
      friends.push(f);
    }
    const l = await freshListing({ qty: 40, startMin: 1, endMin: 120 });
    const orders = [];
    for (const f of friends) orders.push(await onlineOrder(f, l.id));
    await ff(2);
    for (const r of orders) await svc.handover(owner(), { code: r.code });
    expect(bal(referrer.id)).toBe(10 * 50);
    expect(friends.map((f) => bal(f.id)).every((b) => b === 50)).toBe(true);
    expect(store.read().referrals.filter((r) => r.referrerId === referrer.id && r.rejectReason === "referrer_monthly_cap")).toHaveLength(1);
  });

  it("the reward amount comes from platform settings", async () => {
    await plat.updatePlatformSettings(P("u_admin"), { values: { referralCreditInr: 75 }, confirm: true });
    const { referrer, referee } = await pair(5);
    await firstPickup(referee);
    expect([bal(referrer.id), bal(referee.id)]).toEqual([75, 75]);
  });
});

describe("paying with credit (integration)", () => {
  it("online: credit pays up to half, the hold is only for the cash, and the reservation records both", async () => {
    const c = await customer(70, 0);
    await give(c.id, 200);
    const l = await freshListing({ qty: 5, original: 400, rescue: 200, startMin: 5, endMin: 180 });
    const h = await svc.reserve(c, { listingId: l.id, qty: 1, method: "online", useCredit: true });
    if (h.kind !== "hold") throw new Error("hold expected");
    expect([h.amount, h.creditApplied]).toEqual([100, 100]); // ₹200 order: ₹100 credit + ₹100 cash
    expect(bal(c.id)).toBe(100);
    await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: "pay_1", eventId: "evt_1" });
    const r = store.read().reservations.find((x) => x.holdId === h.holdId)!;
    expect([r.amount, r.creditApplied]).toEqual([200, 100]);
    expect(store.read().payments.find((p) => p.holdId === h.holdId)!.amount).toBe(100);
  });

  it("credit is optional: without useCredit nothing is spent", async () => {
    const c = await customer(71, 0);
    await give(c.id, 100);
    const l = await freshListing({ qty: 3 });
    const h = await svc.reserve(c, { listingId: l.id, qty: 1, method: "online" });
    expect(h.kind === "hold" && h.amount).toBe(100);
    expect(bal(c.id)).toBe(100);
  });

  it("pay at pickup: the customer pays the cash part at the counter", async () => {
    const c = await customer(72, 3);
    await give(c.id, 100);
    const l = await freshListing({ qty: 3, original: 200, rescue: 100, startMin: 1, endMin: 120 });
    const res = await svc.reserve(c, { listingId: l.id, qty: 1, method: "pay_at_pickup", useCredit: true });
    if (res.kind !== "reservation") throw new Error("reservation expected");
    const r = store.read().reservations.find((x) => x.id === res.reservationId)!;
    expect([r.amount, r.creditApplied, store.read().payments.find((p) => p.reservationId === r.id)!.amount]).toEqual([100, 50, 50]);
    await ff(2);
    const out = await svc.handover(owner(), { code: r.code });
    expect(out.collectAmount).toBe(50);
  });

  it("an expired hold gives the credit back", async () => {
    const c = await customer(73, 0);
    await give(c.id, 100);
    const l = await freshListing({ qty: 3 });
    await svc.reserve(c, { listingId: l.id, qty: 1, method: "online", useCredit: true });
    expect(bal(c.id)).toBe(50);
    await ff(6); // hold lasts 5 minutes
    expect(bal(c.id)).toBe(100);
    expect(store.read().notifications.some((n) => n.userId === c.id && n.type === "credit_earned")).toBe(true);
  });

  it("cancelling a credit order restores the credit (and refunds only the cash)", async () => {
    const c = await customer(74, 0);
    await give(c.id, 100);
    const l = await freshListing({ qty: 3, original: 200, rescue: 100, startMin: 120, endMin: 240 });
    const h = await svc.reserve(c, { listingId: l.id, qty: 1, method: "online", useCredit: true });
    if (h.kind !== "hold") throw new Error("hold");
    await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: "pay_c", eventId: "evt_c" });
    const r = store.read().reservations.find((x) => x.holdId === h.holdId)!;
    expect(bal(c.id)).toBe(50);
    const out = await p1.cancelReservation(c, r.id);
    expect(out.free).toBe(true);
    expect(out.refundAmount).toBe(50); // the cash, not the full ₹100
    expect(bal(c.id)).toBe(100); // credit is back
    await expect(p1.cancelReservation(c, r.id)).rejects.toMatchObject({ code: "bad_transition" }); // can't restore twice
    expect(bal(c.id)).toBe(100);
    expect(store.read().creditLedger.filter((e) => e.userId === c.id && e.note?.startsWith("restored"))).toHaveLength(1);
  });

  it("a vendor cancelling the listing restores credit; a late customer cancellation forfeits it", async () => {
    const c = await customer(75, 0);
    await give(c.id, 100);
    const l = await freshListing({ qty: 3, original: 200, rescue: 100, startMin: 60, endMin: 240 });
    const h = await svc.reserve(c, { listingId: l.id, qty: 1, method: "online", useCredit: true });
    if (h.kind !== "hold") throw new Error("hold");
    await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: "pay_v", eventId: "evt_v" });
    await svc.cancelListing(owner(), l.id, "kitchen closed");
    expect(bal(c.id)).toBe(100);

    const l2 = await freshListing({ qty: 3, original: 200, rescue: 100, startMin: 10, endMin: 120 }); // pickup in 10 min: inside the 30-min no-refund window
    const h2 = await svc.reserve(c, { listingId: l2.id, qty: 1, method: "online", useCredit: true });
    if (h2.kind !== "hold") throw new Error("hold");
    await svc.confirmOnlinePayment({ holdId: h2.holdId, gatewayPaymentId: "pay_v2", eventId: "evt_v2" });
    const r2 = store.read().reservations.find((x) => x.holdId === h2.holdId)!;
    const out = await p1.cancelReservation(c, r2.id);
    expect(out.free).toBe(false);
    expect(bal(c.id)).toBe(50); // forfeited along with the cash
  });

  it("vendor payouts still receive the full order value when part was paid with credit", async () => {
    const { vendorPayouts } = await import("@/lib/analytics");
    const c = await customer(76, 0);
    await give(c.id, 100);
    const l = await freshListing({ qty: 3, original: 200, rescue: 100, startMin: 1, endMin: 120 });
    const h = await svc.reserve(c, { listingId: l.id, qty: 1, method: "online", useCredit: true });
    if (h.kind !== "hold") throw new Error("hold");
    await svc.confirmOnlinePayment({ holdId: h.holdId, gatewayPaymentId: "pay_p", eventId: "evt_p" });
    const r = store.read().reservations.find((x) => x.holdId === h.holdId)!;
    await ff(2);
    const before = vendorPayouts(store.read(), "v_1").totals.gross;
    await svc.handover(owner(), { code: r.code });
    expect(vendorPayouts(store.read(), "v_1").totals.gross - before).toBe(100); // gross is the order value, not just the cash
  });
});
