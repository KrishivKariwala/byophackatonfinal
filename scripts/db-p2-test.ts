/**
 * Behaviour tests for the P2 rules that live in Postgres (issue #13), run against the REAL database inside one rolled-back transaction.
 * They mirror the scenarios in the demo adapter's tests (tests/*.test.ts) so the two implementations are held to the same rules.
 * Slices: 1 credits and referrals, 2 receipts and certificates, 3 priority alerts and delivery sync.   Run: npm run db:p2
 */
import { check, run, type Db } from "./lib/db-test";

async function credits(db: Db) {
  console.log("\n-- slice 1: credits and referrals");
  const { one, q, as, fails } = db;
  const cust = await db.profile("Asha Rao", "customer", "9000000001");
  const owner = await db.profile("Owner", "vendor");
  const v = await db.vendor(owner, "Bakery");
  const o = await db.outlet(v);
  const bal = async (u: string) => (await one<{ b: number }>("select credit_balance($1) b", [u])).b;
  const remainingOf = async (u: string) => (await q<{ remaining: number }>("select remaining from credit_ledger where user_id = $1 and type = 'earned' order by expires_at", [u])).map((r) => r.remaining);

  // earn and spend: oldest expiry first, never below zero
  const l1 = (await one<{ id: string }>("select earn_credit($1, 30, 'lot one', 'x1') id", [cust])).id;
  const l2 = (await one<{ id: string }>("select earn_credit($1, 60, 'lot two', 'x2') id", [cust])).id;
  await q("update credit_ledger set expires_at = now() + interval '10 days' where id = $1", [l1]);
  await q("update credit_ledger set expires_at = now() + interval '50 days' where id = $1", [l2]);
  check("balance adds up unexpired lots (30 + 60)", (await bal(cust)) === 90);
  await q("select spend_credit($1, 40, 'ord-1', 'test spend')", [cust]);
  const rem = await remainingOf(cust);
  check("a spend takes the soonest-expiring lot first (30 gone, 10 from the next)", rem[0] === 0 && rem[1] === 50, `(${rem})`);
  check("balance is now 50", (await bal(cust)) === 50);
  check("spending more than the balance is refused", (await fails(() => q("select spend_credit($1, 51, 'ord-2', 'too much')", [cust]))) === "credit_insufficient");
  check("a refused spend changes nothing", (await bal(cust)) === 50 && (await q("select 1 from credit_ledger where ref_id = 'ord-2'")).length === 0);
  await q("update credit_ledger set expires_at = now() - interval '1 day' where id = $1", [l2]);
  check("an expired lot no longer counts", (await bal(cust)) === 0);
  await q("select process_p2_jobs()");
  check("the expiry job writes one 'expired' row for what was left", (await q("select amount from credit_ledger where type = 'expired' and user_id = $1", [cust])).map((r) => r.amount).join() === "50");

  // credit_quote is capped at 50% of the order and zero when the feature is off
  await one("select earn_credit($1, 80, 'top up', 't')", [cust]);
  const quote = (t: number) => as(cust, async () => (await one<{ q: any }>("select credit_quote($1) q", [t])).q);
  const q100 = await quote(100);
  check("quote: balance 80, order 100 -> usable 50 (the 50% cap)", q100.usable === 50 && q100.cap === 50 && q100.balance === 80, JSON.stringify(q100));
  check("quote: order 60 -> usable 30", (await quote(60)).usable === 30);
  await q(`insert into settings (key, value) values ('flags', '{"referrals": false}') on conflict (key) do update set value = excluded.value`);
  check("quote with the referrals flag off -> usable 0", (await quote(100)).usable === 0);
  await q("delete from settings where key = 'flags'");

  // reserve with credit (online): hold is the cash part, credit is taken now, returned if the hold lapses
  const lst = await db.listing(v, o, owner, { rescue: 100, startMin: 120, endMin: 240 });
  const hold = await as(cust, async () => (await one<{ r: any }>("select reserve_listing($1, 1, 'online', true) r", [lst])).r);
  check("online reserve with credit: hold amount 50, credit 50", hold.kind === "hold" && hold.amount === 50 && hold.credit_applied === 50, JSON.stringify(hold));
  check("the credit left the balance (80 -> 30)", (await bal(cust)) === 30);
  check("the pending payment is the cash part (50)", (await one<{ amount: number }>("select amount from payments where hold_id = $1", [hold.hold_id])).amount === 50);
  const conf = (await one<{ r: any }>("select confirm_payment($1, 'pay_1', 'evt_1') r", [hold.hold_id])).r;
  const res1 = await one<{ id: string; amount: number; credit_applied: number }>("select id, amount, credit_applied from reservations where id = $1", [conf.reservation_id]);
  check("confirmed order keeps its full value (100) and remembers the credit part (50)", res1.amount === 100 && res1.credit_applied === 50);
  const cancelled = await as(cust, async () => (await one<{ r: any }>("select cancel_reservation($1) r", [res1.id])).r);
  check("a FREE cancellation gives the credit back", cancelled.free === true && cancelled.credit_back === 50 && cancelled.refund === 50, JSON.stringify(cancelled));
  check("balance is back to 80", (await bal(cust)) === 80);
  check("restoring again restores nothing (idempotent)", (await one<{ n: number }>("select restore_credit($1, array[$2, $3], 'order cancelled') n", [cust, res1.id, hold.hold_id])).n === 0);

  // hold expiry returns the credit
  const hold2 = await as(cust, async () => (await one<{ r: any }>("select reserve_listing($1, 1, 'online', true) r", [lst])).r);
  check("second hold took 50 credit (80 -> 30)", (await bal(cust)) === 30);
  await q("update checkout_holds set expires_at = now() - interval '1 minute' where id = $1", [hold2.hold_id]);
  await q("select process_window_end()");
  check("an expired hold returns its credit (30 -> 80)", (await bal(cust)) === 80);

  // abandoning checkout returns it too
  const hold3 = await as(cust, async () => (await one<{ r: any }>("select reserve_listing($1, 1, 'online', true) r", [lst])).r);
  const rel = await as(cust, async () => (await one<{ r: any }>("select release_checkout($1) r", [hold3.hold_id])).r);
  check("release_checkout frees the stock and returns the credit", rel.status === "Released" && (await bal(cust)) === 80);

  // a LATE cancellation forfeits the credit (like the cash)
  const late = await db.listing(v, o, owner, { rescue: 100, startMin: 10, endMin: 120 });
  const h4 = await as(cust, async () => (await one<{ r: any }>("select reserve_listing($1, 1, 'online', true) r", [late])).r);
  const c4 = (await one<{ r: any }>("select confirm_payment($1, 'pay_4', 'evt_4') r", [h4.hold_id])).r;
  const after = await bal(cust);
  const lateCancel = await as(cust, async () => (await one<{ r: any }>("select cancel_reservation($1) r", [c4.reservation_id])).r);
  check("a late cancellation forfeits the credit (balance unchanged)", lateCancel.free === false && lateCancel.credit_back === 0 && (await bal(cust)) === after);

  // pay at pickup with credit: the cash to collect is the rest
  const pap = await as(cust, async () => (await one<{ r: any }>("select reserve_listing($1, 1, 'pay_at_pickup', true) r", [lst])).r);
  const papRes = await one<{ amount: number; credit_applied: number }>("select amount, credit_applied from reservations where id = $1", [pap.reservation_id]);
  const papPay = await one<{ amount: number }>("select amount from payments where reservation_id = $1", [pap.reservation_id]);
  check("pay-at-pickup with credit: order 100, credit 30 (balance cap), cash due 70", papRes.amount === 100 && papRes.credit_applied === 30 && papPay.amount === 70);

  // referrals
  const refR = await db.profile("Ravi Kumar", "customer", "9111111111");
  const refE = await db.profile("Esha Nair", "customer", "9222222222");
  const code = await as(refR, async () => (await one<{ c: string }>("select my_referral_code('dev-R') c")).c);
  check("a referral code is created: 4 letters of the name + 4 characters", /^RAVI[A-Z2-9]{4}$/.test(code), code);
  check("asking again returns the same code", (await as(refR, async () => (await one<{ c: string }>("select my_referral_code('dev-R') c")).c)) === code);
  const redeem = (who: string, c: string, dev: string | null) => as(who, async () => one("select redeem_referral($1, $2)", [c, dev]));
  check("you can't use your own code", (await fails(() => redeem(refR, code, "dev-X"))) === "self_referral");
  check("an unknown code is refused", (await fails(() => redeem(refE, "NOPE1234", "dev-E"))) === "code_unknown");
  check("a too-short code is refused", (await fails(() => redeem(refE, "ab", "dev-E"))) === "code_invalid");
  check("the same device the code was shared from is refused", (await fails(() => redeem(refE, code, "dev-R"))) === "same_device");
  const twinPhone = await db.profile("Twin", "customer", "+91 92222 22222");
  await redeem(refE, code, "dev-E");
  check("a new customer can redeem a code (pending, nothing paid yet)", (await one<{ status: string }>("select status from referrals where referee_id = $1", [refE])).status === "pending" && (await bal(refE)) === 0);
  check("redeeming twice is refused", (await fails(() => redeem(refE, code, "dev-E"))) === "already_referred");
  check("another account on the SAME PHONE NUMBER is refused", (await fails(() => redeem(twinPhone, code, "dev-T"))) === "phone_used");
  const dupDevice = await db.profile("Dev Dup", "customer", "9333333333");
  check("another account on the SAME DEVICE is refused", (await fails(() => redeem(dupDevice, code, "dev-E"))) === "device_used");
  const oldHand = await db.profile("Old Hand", "customer", "9444444444");
  await as(oldHand, async () => one("select reserve_listing($1, 1, 'online', false)", [lst]));
  check("only NEW customers (no earlier order) can redeem", (await fails(() => redeem(oldHand, code, "dev-O"))) === "not_new");

  // reward on first pickup: both people get credit
  const open = await db.listing(v, o, owner, { rescue: 100, startMin: -5, endMin: 60 });
  const eRes = await as(refE, async () => (await one<{ r: any }>("select reserve_listing($1, 1, 'pay_at_pickup', false) r", [open])).r);
  await q("insert into pickup_codes (reservation_id, vendor_id, qr_token_hash, code_hash) values ($1,$2,'qr-e','code-e')", [eRes.reservation_id, v]);
  await as(owner, async () => one("select handover(null, 'code-e')"));
  check("first pickup rewards the friend (₹50 welcome credit)", (await bal(refE)) === 50);
  check("...and the referrer (₹50)", (await bal(refR)) === 50);
  check("the referral is marked rewarded", (await one<{ status: string }>("select status from referrals where referee_id = $1", [refE])).status === "rewarded");
  check("both got a notification", (await q("select 1 from notifications where type = 'credit_earned' and user_id in ($1,$2) and text like '%50%'", [refE, refR])).length >= 2);
  await q("select reward_referral($1)", [eRes.reservation_id]);
  check("rewarding the same pickup again pays nothing more", (await bal(refE)) === 50 && (await bal(refR)) === 50);

  // monthly cap: the 11th rewarded referral still pays the friend, not the referrer
  const capR = await db.profile("Cap Referrer", "customer", "9555555555");
  const capCode = await as(capR, async () => (await one<{ c: string }>("select my_referral_code(null) c")).c);
  for (let i = 0; i < 10; i++) {
    const f = await db.profile(`Filler ${i}`, "customer", `96000000${String(i).padStart(2, "0")}`);
    await q("insert into referrals (referrer_id, referee_id, code, status, phone_key, rewarded_at) values ($1,$2,$3,'rewarded',$4,now())", [capR, f, capCode, `p${i}`]);
  }
  const lucky = await db.profile("Lucky Friend", "customer", "9777777777");
  await redeem(lucky, capCode, "dev-L");
  const lRes = await as(lucky, async () => (await one<{ r: any }>("select reserve_listing($1, 1, 'pay_at_pickup', false) r", [open])).r);
  await q("insert into pickup_codes (reservation_id, vendor_id, qr_token_hash, code_hash) values ($1,$2,'qr-l','code-l')", [lRes.reservation_id, v]);
  await as(owner, async () => one("select handover(null, 'code-l')"));
  check("11th referral: the friend is still rewarded", (await bal(lucky)) === 50);
  check("...the referrer (already at 10 this month) is not", (await bal(capR)) === 0);
  check("...and the referral records why", (await one<{ r: string }>("select reject_reason r from referrals where referee_id = $1", [lucky])).r === "referrer_monthly_cap");

  // switched off
  await q(`insert into settings (key, value) values ('flags', '{"referrals": false}') on conflict (key) do update set value = excluded.value`);
  const late2 = await db.profile("Late", "customer", "9888888888");
  check("with the referrals flag off, redeeming is refused", (await fails(() => redeem(late2, code, "dev-Z"))) === "feature_off");
  await q("delete from settings where key = 'flags'");

  // who may call what
  const anyUser = await db.profile("Nosy", "customer", "9999999999");
  const denied = async (sql: string, args: unknown[] = []) => { const m = await fails(() => as(anyUser, () => q(sql, args))); return /permission denied/.test(m); };
  check("a signed-in client cannot call earn_credit", await denied("select earn_credit($1, 500, 'free money')", [anyUser]));
  check("a signed-in client cannot call spend_credit", await denied("select spend_credit($1, 1, 'x', 'x')", [cust]));
  check("a signed-in client cannot read someone else's balance", await denied("select credit_balance($1)", [cust]));
  check("a signed-in client cannot call confirm_payment", await denied("select confirm_payment($1, 'p', 'e')", [hold.hold_id]));
  check("a signed-in client cannot run the job processors", await denied("select process_window_end()") && await denied("select process_p2_jobs()"));
}

run("db:p2", async (db) => {
  await credits(db);
});
