import { randomUUID } from "node:crypto";
import { loadEnv } from "../scripts/lib/db-test";

/** Real-database test world. Data is COMMITTED (the tests need several connections racing), then removed by `cleanup`. */
const env = loadEnv();
process.env.SUPABASE_DB_URL = env.SUPABASE_DB_URL;
process.env.STORE = "supabase";
process.env.SESSION_SECRET ||= "db-test-secret";
process.env.PG_POOL_MAX ||= "10";

import { pool, withTx } from "../lib/pg/db";

export const TAG = "DBTEST";

export interface World { owner: string; vendor: string; outlet: string; customers: string[]; listing: (o?: { qty?: number; rescue?: number; startMin?: number; endMin?: number }) => Promise<string> }

export async function cleanup() {
  const p = pool();
  const users = (await p.query("select id from profiles where name like $1", [`${TAG}%`])).rows.map((r) => r.id as string);
  if (!users.length) return;
  const vendors = (await p.query("select id from vendors where owner_id = any($1)", [users])).rows.map((r) => r.id as string);
  const q = (sql: string, a: unknown[]) => p.query(sql, a);
  const res = "(select id from reservations where vendor_id = any($1) or customer_id = any($2))";
  await q(`delete from reservation_events where reservation_id in ${res}`, [vendors, users]);
  await q(`delete from pickup_events where reservation_id in ${res}`, [vendors, users]);
  await q(`delete from pickup_codes where reservation_id in ${res}`, [vendors, users]);
  await q(`delete from impact_events where ref_id in ${res} or vendor_id = any($1)`, [vendors, users]);
  await q("delete from refunds where payment_id in (select id from payments where customer_id = any($1))", [users]);
  await q("delete from payments where customer_id = any($1)", [users]);
  await q("delete from credit_ledger where user_id = any($1)", [users]);
  await q("delete from reservations where vendor_id = any($1) or customer_id = any($2)", [vendors, users]);
  await q("delete from checkout_holds where customer_id = any($1)", [users]);
  await q("delete from inventory_movements where listing_id in (select id from listings where vendor_id = any($1))", [vendors]);
  await q("delete from listings where vendor_id = any($1)", [vendors]);
  await q("delete from memberships where user_id = any($1) or vendor_id = any($2)", [users, vendors]);
  await q("delete from outlets where vendor_id = any($1)", [vendors]);
  await q("delete from vendors where id = any($1)", [vendors]);
  await q("delete from notifications where user_id = any($1)", [users]);
  await q("delete from audit_logs where actor_id = any($1)", [users]);
  await q("delete from processed_webhooks where event_id like 'dbtest_%'", []);
  await q("delete from profiles where id = any($1)", [users]);
  await q("delete from auth.users where id = any($1)", [users]);
}

async function person(name: string, role: "customer" | "vendor") {
  const id = randomUUID();
  await withTx(null, async (c) => {
    await c.query("insert into auth.users (id) values ($1)", [id]);
    await c.query("insert into profiles (id, name, role) values ($1, $2, $3)", [id, `${TAG} ${name}`, role]);
  });
  return id;
}

export async function makeWorld(customerCount: number): Promise<World> {
  await cleanup();   // leftovers from a run that was killed half-way
  const owner = await person("Owner", "vendor");
  const customers: string[] = [];
  for (let i = 0; i < customerCount; i += 10) customers.push(...await Promise.all(Array.from({ length: Math.min(10, customerCount - i) }, (_, k) => person(`Customer ${i + k}`, "customer"))));
  const { vendor, outlet } = await withTx(null, async (c) => {
    const v = (await c.query("insert into vendors (owner_id, business_name, contact_name, phone, fssai_number, operating_hours, payout_upi, status) values ($1,$2,'c','9','F','9-5','u@upi','Approved') returning id", [owner, `${TAG} Bakery`])).rows[0].id as string;
    await c.query("insert into memberships (user_id, vendor_id, role) values ($1,$2,'owner')", [owner, v]);
    const o = (await c.query("insert into outlets (vendor_id, address, neighbourhood, lat, lng, pay_at_pickup) values ($1,'addr','Koramangala',12.93,77.62,true) returning id", [v])).rows[0].id as string;
    return { vendor: v, outlet: o };
  });
  const listing = async (o: { qty?: number; rescue?: number; startMin?: number; endMin?: number } = {}) => withTx(null, async (c) => (await c.query(
    `insert into listings (vendor_id, outlet_id, title, category, original_price, rescue_price, qty_total, qty_available, diet, prepared_at, safety_declared_at, safety_declared_by, window_start, window_end)
     values ($1,$2,$3,'Bakery',200,$4,$5,$5,'Vegetarian',now(),now(),$6, now() + ($7 || ' minutes')::interval, now() + ($8 || ' minutes')::interval) returning id`,
    [vendor, outlet, `${TAG} Box`, o.rescue ?? 100, o.qty ?? 10, owner, o.startMin ?? 120, o.endMin ?? 240])).rows[0].id as string);
  return { owner, vendor, outlet, customers, listing };
}
