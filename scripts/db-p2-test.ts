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

async function receiptsAndCertificates(db: Db) {
  console.log("\n-- slice 2: donation hand-off, receipts and impact certificates");
  const { one, q, as, fails } = db;
  await q("grant usage on schema public to authenticated, anon");
  await q("grant select on all tables in schema public to authenticated, anon");   // inside this rolled-back test only, so row rules are what get tested
  const ownerA = await db.profile("Owner A", "vendor"), ownerB = await db.profile("Owner B", "vendor"), staff2 = await db.profile("Staff Two", "vendor");
  const vA = await db.vendor(ownerA, "Bakery A"), vB = await db.vendor(ownerB, "Cafe B");
  const o1 = await db.outlet(vA, "Koramangala"), o2 = await db.outlet(vA, "Indiranagar"), oB = await db.outlet(vB, "Jayanagar");
  await q("insert into memberships (user_id, vendor_id, role) values ($1,$2,'owner'), ($3,$4,'owner')", [ownerA, vA, ownerB, vB]);
  await q("insert into memberships (user_id, vendor_id, outlet_id, role) values ($1,$2,$3,'staff')", [staff2, vA, o2]);
  const ngo = async (name: string, g80?: string, validDays?: number) => {
    const u = await db.profile(name, "ngo");
    const r = await one<{ id: string }>(
      `insert into ngos (owner_id, org_name, contact_person, phone, address, neighbourhood, lat, lng, capacity_meals, handling_arrangements, status, eighty_g_number, eighty_g_valid_until)
       values ($1,$2,'p','9','a','Koramangala',12.9,77.6,100,'van','Approved',$3, case when $4::int is null then null else (now() at time zone 'Asia/Kolkata')::date + $4::int end) returning id`, [u, name, g80 ?? null, validDays ?? null]);
    return { user: u, id: r.id };
  };
  const nValid = await ngo("Charity With 80G", "80G/2026/111", 30), nExpired = await ngo("Charity Expired 80G", "80G/2020/222", -1), nNone = await ngo("Charity No 80G");
  let seq = 0;
  /** A donation batch claimed by `n`. */
  const batch = async (vendor: string, outlet: string, owner: string, n: { id: string }, code: string, qty = 8, status = "Claimed") => {
    const l = await db.listing(vendor, outlet, owner, { price: 200, rescue: 100, qty, startMin: -150, endMin: -30 });
    const b = await one<{ id: string }>("insert into donation_batches (ref, listing_id, vendor_id, outlet_id, qty, collect_by, vendor_instruction, status) values ($1,$2,$3,$4,$5, now() + interval '2 hours', 'x', $6) returning id", [`DON-T${++seq}`, l, vendor, outlet, qty, status]);
    await q("insert into donation_claims (batch_id, ngo_id, collection_code_hash) values ($1,$2,$3)", [b.id, n.id, code]);
    return b.id;
  };
  const handover = (who: string, b: string, code: string) => as(who, async () => (await one<{ r: any }>("select donation_handover($1, $2) r", [b, code])).r);

  const b1 = await batch(vA, o1, ownerA, nValid, "h1");
  check("a wrong collection code is refused", (await fails(() => handover(ownerA, b1, "wrong"))) === "code_mismatch");
  check("another vendor cannot see or hand over this batch", (await fails(() => handover(ownerB, b1, "h1"))) === "not_found");
  check("staff pinned to a different outlet get 'not found' (existence is not confirmed)", (await fails(() => handover(staff2, b1, "h1"))) === "not_found");
  const done = await handover(ownerA, b1, "h1");
  check("the owner verifies the code: batch is Collected", done.ok === true && (await one<{ status: string }>("select status from donation_batches where id = $1", [b1])).status === "Collected");
  const r1 = await one<any>("select * from donation_receipts where batch_id = $1", [b1]);
  check("a receipt was issued with a number like SAP-DR-<year>-000001", /^SAP-DR-\d{4}-\d{6}$/.test(r1.number), r1.number);
  check("the receipt records donor, charity and an ESTIMATED value (8 units x ₹200 = 1600)", r1.vendor_id === vA && r1.ngo_id === nValid.id && r1.estimated_value === 1600 && r1.qty === 8 && r1.item === "Box");
  check("a charity with a CURRENT 80G registration is named on the receipt", r1.eighty_g_number === "80G/2026/111");
  check("impact was recorded once for the donation (8 meals, 3.2 kg, 8.0 kg CO2e)", (await one<any>("select kg_est::float k, co2e_kg::float c, qty from impact_events where ref_id = $1 and source = 'ngo_collection'", [b1])).k === 3.2);
  check("the charity was told it was collected", (await q("select 1 from notifications where user_id = $1 and text like 'Collected:%'", [nValid.user])).length === 1);
  check("codes work once: a second hand-over is refused", (await fails(() => handover(ownerA, b1, "h1"))) === "bad_transition");
  check("issuing again returns the same receipt (one per donation)", (await one<{ n: number }>("select count(*)::int n from donation_receipts where batch_id = $1", [b1])).n === 1 && (await one<{ id: string }>("select issue_receipt($1) id", [b1])).id === r1.id);

  const b2 = await batch(vA, o1, ownerA, nExpired, "h2", 3);
  await handover(ownerA, b2, "h2");
  const r2 = await one<any>("select * from donation_receipts where batch_id = $1", [b2]);
  check("an EXPIRED 80G registration is not mentioned", r2.eighty_g_number === null && r2.eighty_g_valid_until === null);
  check("numbers only go up (never reused)", Number(r2.number.slice(-6)) === Number(r1.number.slice(-6)) + 1);
  const b3 = await batch(vA, o1, ownerA, nNone, "h3", 2);
  await handover(ownerA, b3, "h3");
  check("a charity with no 80G gets a plain receipt", (await one<any>("select eighty_g_number n from donation_receipts where batch_id = $1", [b3])).n === null);
  const seesReceipts = (who: string) => as(who, async () => (await q("select number from donation_receipts")).length);
  check("the donor owner sees their 3 receipts, another vendor sees none", (await seesReceipts(ownerA)) === 3 && (await seesReceipts(ownerB)) === 0);
  check("the receiving charity sees only its own receipt", (await seesReceipts(nValid.user)) === 1);

  // switched off: nothing issued; switched back on, the job catches up
  await q(`insert into settings (key, value) values ('flags', '{"donationReceipts": false}') on conflict (key) do update set value = excluded.value`);
  const b4 = await batch(vA, o1, ownerA, nValid, "h4", 4);
  await handover(ownerA, b4, "h4");
  check("flag off: the donation is collected but no receipt is issued", (await q("select 1 from donation_receipts where batch_id = $1", [b4])).length === 0);
  await q("delete from settings where key = 'flags'");
  await q("select process_p2_jobs()");
  check("flag back on: the catch-up job issues the missing receipt, once", (await q("select 1 from donation_receipts where batch_id = $1", [b4])).length === 1);
  await q("select process_p2_jobs()");
  check("running the job again changes nothing", (await one<{ n: number }>("select count(*)::int n from donation_receipts")).n === 4);

  // ---- certificates
  const prev = (await one<{ m: string }>("select to_char(date_trunc('month', now() at time zone 'Asia/Kolkata') - interval '1 month', 'YYYY-MM') m")).m;
  const cur = (await one<{ m: string }>("select ist_month(now()) m")).m;
  const pickup = (vendor: string, outlet: string, owner: string, atExpr: string, qty: number, amount: number) =>
    db.listing(vendor, outlet, owner, { qty: 5, startMin: -300, endMin: -200 }).then((l) => q(
      `insert into reservations (ref, listing_id, vendor_id, outlet_id, customer_id, qty, unit_price, amount, method, status, picked_up_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'online','Picked up', ${atExpr})`, [`CT-${++seq}`, l, vendor, outlet, custOf, qty, amount / qty, amount]));
  const custOf = await db.profile("Customer", "customer");
  await pickup(vA, o1, ownerA, `month_start('${prev}') + interval '10 days'`, 3, 300);
  const bPrev = await batch(vA, o1, ownerA, nValid, "hp", 5, "Collected");
  await q("insert into donation_handovers (batch_id, vendor_user, at) values ($1,$2, month_start($3) + interval '12 days')", [bPrev, ownerA, prev]);
  await q("insert into distribution_logs (batch_id, ngo_id, vendor_id, servings, beneficiaries, centre_name) values ($1,$2,$3,5,40,'Centre')", [bPrev, nValid.id, vA]);
  const gen = (who: string, m: string) => as(who, async () => (await one<{ c: any }>("select generate_certificate($1) c", [m])).c);
  const c1 = await gen(ownerA, prev);
  check("certificate: 3 sold + 5 donated = 8 meals, 3.2 kg, 8.0 kg CO2e, ₹300, 1 charity, 40 people",
    c1.meals_sold === 3 && c1.meals_donated === 5 && Number(c1.kg_rescued) === 3.2 && Number(c1.co2e_kg) === 8 && c1.rupees_recovered === 300 && c1.charities_served === 1 && c1.people_served === 40, JSON.stringify(c1));
  check("a finished month's certificate is final with an unguessable id", c1.partial === false && /^SAP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c1.id), c1.id);
  await pickup(vA, o1, ownerA, `month_start('${prev}') + interval '15 days'`, 2, 200);
  const c1b = await gen(ownerA, prev);
  check("a final certificate never changes (even if more data appears), the id is kept", c1b.id === c1.id && c1b.meals_sold === 3);
  await pickup(vA, o1, ownerA, "now()", 1, 100);
  const c2 = await gen(ownerA, cur);
  check("the current month's certificate is marked month-to-date", c2.partial === true && c2.meals_sold === 1);
  await pickup(vA, o1, ownerA, "now()", 2, 200);
  const c2b = await gen(ownerA, cur);
  check("a month-to-date certificate is refreshed and keeps its id", c2b.id === c2.id && c2b.meals_sold === 3 && c2b.partial === true);
  check("a month with no activity: nothing to certify", (await fails(() => gen(ownerA, "2020-01"))) === "no_activity");
  check("a future month is refused", (await fails(() => gen(ownerA, "2999-01"))) === "month_future");
  check("a bad month is refused", (await fails(() => gen(ownerA, "March"))) === "month_invalid");
  check("staff cannot generate certificates (owner / manager only)", (await fails(() => gen(staff2, prev))) === "forbidden_role");
  check("another vendor with no activity gets nothing, not someone else's certificate", (await fails(() => gen(ownerB, prev))) === "no_activity");

  const verify = (id: string) => as(null, async () => (await one<{ v: any }>("select verify_certificate($1) v", [id])).v);
  const pub = await verify(c1.id);
  check("anyone can verify a certificate by id: business and totals", pub?.business === "Bakery A" && pub.mealsSold === 3 && pub.mealsDonated === 5 && pub.peopleServed === 40);
  check("the public answer carries no vendor id, customer or charity names", !JSON.stringify(pub).match(/vendor|owner|Charity|Customer|address/i) && !("vendorId" in pub));
  check("a made-up or malformed id verifies as nothing", (await verify("SAP-AAAA-AAAA-AAAA")) === null && (await verify("nope")) === null);
  check("certificates are listed only to their own organization", (await as(ownerB, async () => (await q("select id from impact_certificates")).length)) === 0 && (await as(ownerA, async () => (await q("select id from impact_certificates")).length)) === 2);

  // the monthly job
  const vC = await db.vendor(await db.profile("Owner C", "vendor"), "Cafe C"); const oC = await db.outlet(vC);
  const ownerC = (await one<{ owner_id: string }>("select owner_id from vendors where id = $1", [vC])).owner_id;
  await pickup(vC, oC, ownerC, `month_start('${prev}') + interval '3 days'`, 2, 160);
  await q("delete from settings where key = 'last_certificate_run'");   // earlier job runs in this test already marked the month as done
  await q("select process_p2_jobs()");
  const certC = await one<any>("select * from impact_certificates where vendor_id = $1 and month = $2", [vC, prev]);
  check("the monthly job issues last month's certificate for a vendor with activity", certC && certC.meals_sold === 2 && certC.partial === false);
  check("...and tells the owner", (await q("select 1 from notifications where user_id = $1 and type = 'certificate_ready'", [ownerC])).length === 1);
  check("...but not again for a vendor who already had a final certificate", (await q("select 1 from notifications where user_id = $1 and type = 'certificate_ready'", [ownerA])).length === 0);
  await q("select process_p2_jobs()");
  check("the job runs once a month: a second run changes nothing", (await q("select 1 from notifications where type = 'certificate_ready'")).length === 1 && (await one<{ n: number }>("select count(*)::int n from impact_certificates where month = $1", [prev])).n === 2);

  const denied = async (sql: string, args: unknown[] = []) => /permission denied/.test(await fails(() => as(ownerA, () => q(sql, args))));
  check("clients cannot call issue_receipt, the number counter, monthly_figures or the jobs",
    (await denied("select issue_receipt($1)", [b1])) && (await denied("select next_receipt_number()")) && (await denied("select monthly_figures($1, $2)", [vA, prev])) && (await denied("select run_certificate_job()")));
}

run("db:p2", async (db) => {
  await credits(db);
  await receiptsAndCertificates(db);
});
