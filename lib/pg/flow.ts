import "server-only";
import type { PoolClient } from "pg";
import { bus } from "../store";
import type { LiveEvent } from "../types";
import { withTx, attempt, pool } from "./db";
import { guard } from "./errors";
import { open as unseal, seal } from "./box";
import { RuleError } from "../rules";
import { randomToken, random4, sha256, newId } from "../crypto";
import { toUuid as U } from "./uuid";
import { razorpayConfigured } from "../payments";
import type { PaymentMethod } from "../types";
import type { CancelResult } from "../p1";
import type { HandoverResult, PaymentOutcome, ReserveResult } from "../services";

/**
 * The core customer and vendor flow on Postgres: reserve, pay, collect, cancel. Each function is ONE database transaction that calls
 * the rules written in supabase/migrations (reserve_listing, confirm_payment, handover, cancel_reservation, release_checkout), so
 * stock, caps, credit and codes are decided by the database under row locks, not by this process. Results have the same shape as the
 * demo store's functions in lib/services.ts and lib/p1.ts, which delegate here when STORE=supabase.
 */
type Row = Record<string, any>;
const one = async (c: PoolClient, sql: string, args: unknown[] = []): Promise<Row | undefined> => (await c.query(sql, args)).rows[0];

// ---------------------------------------------------------------- pickup codes
/** Gives a new order its 4-digit code and QR token: hashes for the vendor's scan, encrypted copies for the customer to see again. */
async function issueCode(c: PoolClient, reservationId: string) {
  const r = await one(c, "select vendor_id from reservations where id = $1", [reservationId]);
  if (!r) throw new RuleError("not_found", "Order not found.", 404);
  for (let i = 0; i < 200; i++) {
    const code = random4(), token = randomToken();
    const res = await attempt(c, () => c.query(
      "insert into pickup_codes (reservation_id, vendor_id, qr_token_hash, code_hash, code_enc, qr_token_enc) values ($1,$2,$3,$4,$5,$6)",
      [reservationId, r.vendor_id, sha256(token), sha256(`${r.vendor_id}:${code}`), seal(code), seal(token)]));
    if (res.ok) return;
    if ((res.error as { code?: string }).code !== "23505") throw res.error;   // 23505 = this code is already live for the vendor: pick another
  }
  throw new RuleError("code_exhausted", "Could not allocate a pickup code. Try again.", 503);
}

/** The plain code and QR token for the customer who owns the order (null for anyone else). */
export async function pgOrderSecrets(customerId: string, reservationId: string): Promise<{ code: string; qrToken: string } | null> {
  return withTx(U(customerId), async (c) => {
    const r = await one(c, "select pc.code_enc, pc.qr_token_enc from pickup_codes pc join reservations r on r.id = pc.reservation_id where r.id = $1 and r.customer_id = $2", [U(reservationId), U(customerId)]);
    const code = unseal(r?.code_enc), qrToken = unseal(r?.qr_token_enc);
    return code && qrToken ? { code, qrToken } : null;
  }, { write: false });
}

// ---------------------------------------------------------------- live updates
// Events are collected inside the transaction and sent only after it commits, so a screen never hears about a change that was rolled back.
// (In-process only for now: another server instance learns on its next read. Cross-instance push is the next slice.)
type Pending = Omit<LiveEvent, "committedAt">;
async function listingEvent(c: PoolClient, listingId: string, out: Pending[]) {
  const l = await one(c, "select id, qty_available, status from listings where id = $1", [listingId]);
  if (l) out.push({ type: "listing", listingId: l.id, qtyAvailable: l.qty_available, status: l.status } as Pending);
}
async function reservationEvent(c: PoolClient, reservationId: string, out: Pending[]) {
  const r = await one(c, "select id, status, customer_id, vendor_id from reservations where id = $1", [reservationId]);
  if (r) out.push({ type: "reservation", reservationId: r.id, status: r.status, customerId: r.customer_id, vendorId: r.vendor_id } as Pending);
}
const publish = (events: Pending[]) => { const committedAt = Date.now(); for (const e of events) bus().emit("live", { ...e, committedAt } as LiveEvent); };

// ---------------------------------------------------------------- notifications (the database functions do not send the order ones)
async function tell(c: PoolClient, userId: string, type: string, text: string, payload: object) {
  await c.query("insert into notifications (user_id, type, text, payload) values ($1, $2::notification_type, $3, $4)", [userId, type, text, JSON.stringify(payload)]);
}
async function orderPlaced(c: PoolClient, reservationId: string, paid: boolean) {
  const o = await one(c, "select r.id, r.ref, r.qty, r.vendor_id, r.outlet_id, r.customer_id, l.title from reservations r join listings l on l.id = r.listing_id where r.id = $1", [reservationId]);
  if (!o) return;
  await c.query("select notify_outlet($1, $2, 'new_order', $3, $4)", [o.vendor_id, o.outlet_id, `New order ${o.ref}: ${o.qty} × ${o.title}${paid ? " (paid)" : " (pay at pickup)"}.`, JSON.stringify({ reservationId })]);
  await tell(c, o.customer_id, "order_confirmed", `${o.ref} is confirmed: ${o.qty} × ${o.title}.`, { reservationId });
}

// ---------------------------------------------------------------- reserve
export async function pgReserve(actorId: string, input: { listingId: string; qty: number; method: PaymentMethod; useCredit?: boolean }): Promise<ReserveResult> {
  const qty = Number(input.qty);
  if (!Number.isInteger(qty) || qty < 1) throw new RuleError("qty_invalid", "Choose at least 1 unit.");
  if (input.method !== "online" && input.method !== "pay_at_pickup") throw new RuleError("method_invalid", "Choose a payment method.");
  const events: Pending[] = [];
  const result = await guard(() => withTx(U(actorId), async (c) => {
    const p = await one(c, "select suspended_until, suspend_reason from profiles where id = $1", [U(actorId)]);
    if (p?.suspended_until && new Date(p.suspended_until).getTime() > Date.now())
      throw new RuleError("suspended", p.suspend_reason || `Reservations are paused until ${new Date(p.suspended_until).toISOString().slice(0, 10)}.`, 403, { date: new Date(p.suspended_until).toISOString().slice(0, 10) }, p.suspend_reason ? "" : undefined);
    const r = (await one(c, "select reserve_listing($1, $2, $3::payment_method, $4) r", [U(input.listingId), qty, input.method, input.useCredit === true]))!.r;
    if (r.kind === "hold") {
      // With no payment gateway configured the checkout is the demo adapter, so mark the payment that way.
      const gatewayOrderId = `demo_order_${newId("o")}`;
      await c.query("update checkout_holds set gateway_order_id = $2 where id = $1", [r.hold_id, gatewayOrderId]);
      await c.query("update payments set gateway_order_id = $2, gateway = $3 where hold_id = $1", [r.hold_id, gatewayOrderId, razorpayConfigured() ? "razorpay_test" : "demo"]);
      await listingEvent(c, U(input.listingId), events);
      return { kind: "hold", holdId: r.hold_id, expiresAt: new Date(r.expires_at).toISOString(), amount: r.amount, gatewayOrderId, creditApplied: r.credit_applied ?? 0 } as const;
    }
    await issueCode(c, r.reservation_id);
    await orderPlaced(c, r.reservation_id, false);
    await listingEvent(c, U(input.listingId), events);
    await reservationEvent(c, r.reservation_id, events);
    return { kind: "reservation", reservationId: r.reservation_id } as const;
  }));
  publish(events);
  return result;
}

/** The real gateway's order id replaces the placeholder (Razorpay test mode). */
export async function pgAttachGatewayOrder(holdId: string, gatewayOrderId: string, gateway: string) {
  return guard(() => withTx(null, async (c) => {
    if (!(await one(c, "select 1 from checkout_holds where id = $1", [U(holdId)]))) throw new RuleError("not_found", "Checkout not found.", 404);
    await c.query("update checkout_holds set gateway_order_id = $2 where id = $1", [U(holdId), gatewayOrderId]);
    await c.query("update payments set gateway_order_id = $2, gateway = $3 where hold_id = $1", [U(holdId), gatewayOrderId, gateway]);
  }));
}

// ---------------------------------------------------------------- pay
export async function pgConfirmPayment(input: { holdId: string; gatewayPaymentId: string; eventId: string; actorId?: string }): Promise<PaymentOutcome> {
  const events: Pending[] = [];
  const result = await guard(() => withTx(null, async (c) => {
    const h = await one(c, "select id, customer_id, status from checkout_holds where id = $1", [U(input.holdId)]);
    if (!h) throw new RuleError("not_found", "Checkout not found.", 404, undefined, "not_found_checkout_not_found");
    if (input.actorId && h.customer_id !== U(input.actorId)) throw new RuleError("forbidden", "Not your checkout.", 403, undefined, "forbidden_not_checkout");
    const out = (await one(c, "select confirm_payment($1, $2, $3) r", [U(input.holdId), input.gatewayPaymentId, input.eventId]))!.r;
    if (out.outcome === "confirmed") {
      await issueCode(c, out.reservation_id);
      await orderPlaced(c, out.reservation_id, true);
      await reservationEvent(c, out.reservation_id, events);
      return { outcome: "confirmed", reservationId: out.reservation_id } as const;
    }
    if (out.outcome === "late_refund") {
      const rf = await one(c, "select rf.id, rf.amount from refunds rf join payments p on p.id = rf.payment_id where p.hold_id = $1 order by rf.created_at desc limit 1", [U(input.holdId)]);
      await tell(c, h.customer_id, "refund_issued", `Your payment of ₹${rf?.amount ?? 0} arrived after the checkout hold expired, so it will be refunded.`, { amount: rf?.amount ?? 0 });
      return { outcome: "late_refund", refundId: rf?.id } as const;
    }
    const r = await one(c, "select id from reservations where hold_id = $1", [U(input.holdId)]);
    return { outcome: "duplicate", reservationId: r?.id } as const;
  }));
  publish(events);
  return result;
}

export async function pgFailPayment(actorId: string, holdId: string): Promise<{ status: string }> {
  const events: Pending[] = [];
  const result = await guard(() => withTx(U(actorId), async (c) => {
    const r = (await one(c, "select release_checkout($1) r", [U(holdId)]))!.r;
    const h = await one(c, "select listing_id from checkout_holds where id = $1", [U(holdId)]);
    if (h) await listingEvent(c, h.listing_id, events);
    return r;
  }));
  publish(events);
  return result;
}

// ---------------------------------------------------------------- cancel
export async function pgCancelReservation(actorId: string, reservationId: string): Promise<CancelResult> {
  const events: Pending[] = [];
  const result = await guard(() => withTx(U(actorId), async (c) => {
    const out = (await one(c, "select cancel_reservation($1) r", [U(reservationId)]))!.r;
    const rf = out.refund > 0 ? await one(c, "select rf.id, p.gateway, p.gateway_payment_id from refunds rf join payments p on p.id = rf.payment_id where p.reservation_id = $1 order by rf.created_at desc limit 1", [U(reservationId)]) : undefined;
    // The demo gateway refunds at once; a real gateway stays "Refund Pending" until its API call succeeds (executeRefund).
    if (rf && rf.gateway === "demo") {
      await c.query("update refunds set status = 'Refunded' where id = $1", [rf.id]);
      await c.query("update payments set status = 'Refunded', updated_at = now() where reservation_id = $1", [U(reservationId)]);
    }
    const o = await one(c, "select r.ref, r.vendor_id, r.outlet_id from reservations r where r.id = $1", [U(reservationId)]);
    await c.query("select notify_outlet($1, $2, 'order_cancelled', $3, $4)", [o!.vendor_id, o!.outlet_id, `${o!.ref} was cancelled by the customer.`, JSON.stringify({ reservationId: U(reservationId) })]);
    const msg = out.free
      ? `${o!.ref} is cancelled.${out.refund ? ` ₹${out.refund} will be refunded.` : ""}${out.credit_back ? ` ₹${out.credit_back} credit returned.` : ""}`
      : `${o!.ref} was cancelled late, so there is no refund.`;
    await tell(c, U(actorId), "order_cancelled", msg, { reservationId: U(reservationId) });
    await reservationEvent(c, U(reservationId), events);
    const rl = await one(c, "select listing_id from reservations where id = $1", [U(reservationId)]);
    if (rl) await listingEvent(c, rl.listing_id, events);
    return { reservationId: U(reservationId), free: out.free, refundId: rf?.id, refundAmount: out.refund, gatewayPaymentId: rf?.gateway_payment_id ?? undefined, gateway: rf?.gateway } as CancelResult;
  }));
  publish(events);
  return result;
}

// ---------------------------------------------------------------- collect (vendor scans the code or QR)
export async function pgHandover(vendorUserId: string, input: { code?: string; token?: string }): Promise<HandoverResult> {
  const events: Pending[] = [];
  const result = await guard(() => withTx(U(vendorUserId), async (c) => {
    let tokenHash: string | null = null, codeHash: string | null = null;
    if (input.token) tokenHash = sha256(input.token.trim().replace(/^sap:/, ""));
    else if (input.code) {
      if (!/^\d{4}$/.test(input.code.trim())) throw new RuleError("code_format", "Enter the 4-digit code.");
      const v = await one(c, "select id from vendors where id in (select my_vendor_ids()) and status = 'Approved' order by created_at limit 1");
      if (!v) throw new RuleError("approval_required", "Your verification is not approved yet.", 403);
      codeHash = sha256(`${v.id}:${input.code.trim()}`);
    } else throw new RuleError("code_required", "Scan the QR or enter the 4-digit code.");
    const r = (await one(c, "select handover($1, $2) r", [tokenHash, codeHash]))!.r;
    const o = await one(c, "select customer_id, id from reservations where ref = $1", [r.ref]);
    if (o) { await tell(c, o.customer_id, "review_prompt", `${r.ref} was picked up. How was it?`, { reservationId: o.id }); await reservationEvent(c, o.id, events); }
    events.push({ type: "impact" } as Pending);
    return { ok: true, ref: r.ref, qty: r.qty, title: r.title, collectAmount: r.collect_amount ?? 0, method: r.method } as HandoverResult;
  }));
  publish(events);
  return result;
}

// ---------------------------------------------------------------- scheduled work (until pg_cron runs it)
let lastSweep = 0;
/** Expires holds, closes ended listings, runs reminders / no-shows / receipts / alerts. At most once every few seconds per process. */
export async function pgSweep(force = false) {
  if (!force && Date.now() - lastSweep < 5000) return;
  lastSweep = Date.now();
  await withTx(null, async (c) => { await c.query("select process_window_end()"); await c.query("select process_p1_jobs()"); await c.query("select process_p2_jobs()"); }, { write: false });   // (not counted as a write: it runs every few seconds and would keep emptying the shared snapshot; what it changes is picked up within the snapshot's 2 seconds)
}
export { pool };
