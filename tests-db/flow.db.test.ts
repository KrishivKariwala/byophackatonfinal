import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanup, makeWorld, type World } from "./world";
import { pool, closePool } from "../lib/pg/db";
import { pgCancelReservation, pgConfirmPayment, pgFailPayment, pgHandover, pgOrderSecrets, pgReserve, pgSweep } from "../lib/pg/flow";
import { RuleError } from "../lib/rules";

let w: World;
beforeAll(async () => { w = await makeWorld(50); });
afterAll(async () => { await cleanup(); await closePool(); });

const q = async (sql: string, a: unknown[] = []) => (await pool().query(sql, a)).rows;
/** Customers with nothing active right now (the 50-way race gave 10 random customers an order, so the later tests must not assume who is free). */
const idle = async (n: number) => (await q("select p.id from profiles p where p.name like 'DBTEST Customer%' and not exists (select 1 from reservations r where r.customer_id = p.id and r.status in ('Reserved','Ready')) and not exists (select 1 from checkout_holds h where h.customer_id = p.id and h.status = 'Active') order by p.name")).slice(0, n).map((r) => r.id as string);
const code = (e: unknown) => (e instanceof RuleError ? e.code : String(e));

describe("the core flow on the real database (through the same functions the app calls)", () => {
  it("50 customers race for 10 units: exactly 10 win, 40 are told it is sold out", async () => {
    const listing = await w.listing({ qty: 10 });
    const t0 = Date.now();
    const results = await Promise.allSettled(w.customers.map((c) => pgReserve(c, { listingId: listing, qty: 1, method: "online" })));
    const won = results.filter((r) => r.status === "fulfilled");
    const lost = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    console.log(`50-way race on Postgres: ${won.length} won, ${lost.length} lost, ${Date.now() - t0} ms`);
    expect(won).toHaveLength(10);
    expect(lost).toHaveLength(40);
    expect(new Set(lost.map((r) => code(r.reason)))).toEqual(new Set(["insufficient_stock"]));
    const [l] = await q("select qty_available, status from listings where id = $1", [listing]);
    expect(l).toMatchObject({ qty_available: 0, status: "Sold Out" });
    const [m] = await q("select coalesce(sum(delta),0)::int s from inventory_movements where listing_id = $1", [listing]);
    expect(m.s).toBe(-10);
    expect((await q("select 1 from checkout_holds where listing_id = $1 and status = 'Active'", [listing]))).toHaveLength(10);
  });

  it("paying all 10 holds at once makes 10 orders, each with its own code; a repeated payment event changes nothing", async () => {
    const holds = await q("select h.id, h.customer_id from checkout_holds h join listings l on l.id = h.listing_id where h.status = 'Active' and l.title = 'DBTEST Box'");
    expect(holds).toHaveLength(10);
    const out = await Promise.all(holds.map((h) => pgConfirmPayment({ holdId: h.id, gatewayPaymentId: `pay_${h.id}`, eventId: `dbtest_evt_${h.id}`, actorId: h.customer_id })));
    expect(out.every((o) => o.outcome === "confirmed")).toBe(true);
    const again = await Promise.all(holds.map((h) => pgConfirmPayment({ holdId: h.id, gatewayPaymentId: `pay_${h.id}`, eventId: `dbtest_evt_${h.id}`, actorId: h.customer_id })));
    expect(again.every((o) => o.outcome === "duplicate")).toBe(true);
    expect(await q("select 1 from reservations where status = 'Reserved' and vendor_id = $1", [w.vendor])).toHaveLength(10);
    const codes = await q("select code_hash from pickup_codes where vendor_id = $1 and voided_at is null", [w.vendor]);
    expect(new Set(codes.map((c) => c.code_hash)).size).toBe(10);
  });

  it("someone else's checkout can't be confirmed", async () => {
    const [h] = await q("select id from checkout_holds where status = 'Converted' and listing_id in (select id from listings where vendor_id = $1) limit 1", [w.vendor]);
    await expect(pgConfirmPayment({ holdId: h.id, gatewayPaymentId: "x", eventId: "dbtest_evt_x", actorId: w.customers[49] })).rejects.toMatchObject({ code: "forbidden" });
  });

  it("the customer sees their own code again later; nobody else does", async () => {
    const [r] = await q("select id, customer_id from reservations where vendor_id = $1 limit 1", [w.vendor]);
    const mine = await pgOrderSecrets(r.customer_id, r.id);
    expect(mine?.code).toMatch(/^\d{4}$/);
    expect(mine?.qrToken.length).toBeGreaterThan(20);
    const stranger = w.customers.find((c) => c !== r.customer_id)!;
    expect(await pgOrderSecrets(stranger, r.id)).toBeNull();
    const [raw] = await q("select code_enc from pickup_codes where reservation_id = $1", [r.id]);
    expect(raw.code_enc).not.toContain(mine!.code);   // the database holds ciphertext only
  });

  it("the vendor collects with the 4-digit code once; a second try is refused; a stranger can't collect", async () => {
    const [r] = await q("select id, customer_id, ref from reservations where vendor_id = $1 and status = 'Reserved' limit 1", [w.vendor]);
    const secrets = (await pgOrderSecrets(r.customer_id, r.id))!;
    // the window opens in 2 hours: bring it forward the way time would
    await q("update listings set window_start = now() - interval '5 minutes' where vendor_id = $1", [w.vendor]);
    await expect(pgHandover(w.customers[0], { code: secrets.code })).rejects.toMatchObject({ code: "approval_required" });
    const done = await pgHandover(w.owner, { code: secrets.code });
    expect(done).toMatchObject({ ok: true, ref: r.ref, qty: 1 });
    await expect(pgHandover(w.owner, { code: secrets.code })).rejects.toMatchObject({ code: expect.stringMatching(/code_used|order_inactive|code_not_found/) });
    expect((await q("select status from reservations where id = $1", [r.id]))[0].status).toBe("Picked up");
    expect(await q("select 1 from impact_events where ref_id = $1", [r.id])).toHaveLength(1);
  });

  it("the vendor collects with the QR token too", async () => {
    const [r] = await q("select id, customer_id from reservations where vendor_id = $1 and status = 'Reserved' limit 1", [w.vendor]);
    const s = (await pgOrderSecrets(r.customer_id, r.id))!;
    expect(await pgHandover(w.owner, { token: `sap:${s.qrToken}` })).toMatchObject({ ok: true });
  });

  it("a free cancellation refunds, returns the unit to stock and frees the code", async () => {
    const [r] = await q("select id, customer_id from reservations where vendor_id = $1 and status = 'Reserved' limit 1", [w.vendor]);
    await q("update listings set window_start = now() + interval '3 hours', window_end = now() + interval '5 hours' where vendor_id = $1", [w.vendor]);
    const out = await pgCancelReservation(r.customer_id, r.id);
    expect(out).toMatchObject({ free: true, refundAmount: 100 });
    expect((await q("select status from payments where reservation_id = $1", [r.id]))[0].status).toBe("Refunded");
    expect((await q("select qty_available, status from listings where vendor_id = $1 and title = 'DBTEST Box'", [w.vendor]))[0]).toMatchObject({ qty_available: 1, status: "Live" });
    expect((await q("select voided_at from pickup_codes where reservation_id = $1", [r.id]))[0].voided_at).not.toBeNull();
    await expect(pgCancelReservation(r.customer_id, r.id)).rejects.toMatchObject({ code: "bad_transition" });
    await expect(pgCancelReservation(w.customers[1] === r.customer_id ? w.customers[2] : w.customers[1], r.id)).rejects.toMatchObject({ code: "not_found" });
  });

  it("a hold nobody pays is released by the sweep and the unit goes back", async () => {
    const listing = await w.listing({ qty: 2 });
    const [c10] = await idle(1);
    const a = await pgReserve(c10, { listingId: listing, qty: 2, method: "online" });
    if (a.kind !== "hold") throw new Error("expected a hold");
    expect((await q("select qty_available from listings where id = $1", [listing]))[0].qty_available).toBe(0);
    await q("update checkout_holds set expires_at = now() - interval '1 minute' where id = $1", [a.holdId]);
    await pgSweep(true);
    expect((await q("select qty_available, status from listings where id = $1", [listing]))[0]).toMatchObject({ qty_available: 2, status: "Live" });
    // a late payment for it is refunded, never revived
    expect(await pgConfirmPayment({ holdId: a.holdId, gatewayPaymentId: "late", eventId: "dbtest_evt_late" })).toMatchObject({ outcome: "late_refund" });
    expect((await q("select qty_available from listings where id = $1", [listing]))[0].qty_available).toBe(2);
  });

  it("abandoning checkout frees the stock at once", async () => {
    const listing = await w.listing({ qty: 1 });
    const [c11] = await idle(1);
    const a = await pgReserve(c11, { listingId: listing, qty: 1, method: "online" });
    if (a.kind !== "hold") throw new Error("expected a hold");
    expect(await pgFailPayment(c11, a.holdId)).toMatchObject({ status: "Released" });
    expect((await q("select qty_available from listings where id = $1", [listing]))[0].qty_available).toBe(1);
  });

  it("the rules the demo store enforces are enforced here too", async () => {
    const listing = await w.listing({ qty: 20 });
    const [c12, c13, c14] = await idle(3);
    await expect(pgReserve(c12, { listingId: listing, qty: 6, method: "online" })).rejects.toMatchObject({ code: "qty_cap" });
    await expect(pgReserve(c12, { listingId: listing, qty: 0, method: "online" })).rejects.toMatchObject({ code: "qty_invalid" });
    await expect(pgReserve(c12, { listingId: listing, qty: 1, method: "pay_at_pickup" })).rejects.toMatchObject({ code: "pay_at_pickup_locked" });
    for (let i = 0; i < 3; i++) await pgReserve(c12, { listingId: listing, qty: 1, method: "online" });
    await expect(pgReserve(c12, { listingId: listing, qty: 1, method: "online" })).rejects.toMatchObject({ code: "active_cap" });
    await q("update profiles set suspended_until = now() + interval '3 days', suspend_reason = 'Paused after no-shows.' where id = $1", [c13]);
    await expect(pgReserve(c13, { listingId: listing, qty: 1, method: "online" })).rejects.toMatchObject({ code: "suspended", message: "Paused after no-shows." });
    await q("update vendors set max_units_per_order = 10 where id = $1", [w.vendor]);
    expect(await pgReserve(c14, { listingId: listing, qty: 8, method: "online" })).toMatchObject({ kind: "hold", amount: 800 });
  });
});
