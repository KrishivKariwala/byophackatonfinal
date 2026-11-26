/**
 * Shared helpers for the tests that run against the REAL database (SUPABASE_DB_URL). Every test runs inside one transaction that is
 * rolled back at the end, so no test data is ever left behind.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

export function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  const f = path.resolve(".env.local");
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf8").split("\n")) { const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].trim(); }
  return env;
}

export const results = { failures: 0, passes: 0 };
export const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` ${detail}`}`);
  if (ok) results.passes++; else results.failures++;
};

export type Db = Awaited<ReturnType<typeof open>>;

/** Opens a connection and a transaction. Call `db.finish()` to roll everything back. */
export async function open() {
  const env = loadEnv();
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query("begin");
  const q = async <T = Record<string, any>>(sql: string, args: unknown[] = []) => (await c.query(sql, args)).rows as T[];
  const one = async <T = Record<string, any>>(sql: string, args: unknown[] = []) => (await q<T>(sql, args))[0];

  /** Runs `fn` as a signed-in person (or a visitor), the way Supabase evaluates a request. Changes made by `fn` are KEPT. */
  const as = async <T>(who: string | null, fn: () => Promise<T>): Promise<T> => {
    await c.query("savepoint as_s");
    await c.query(`set local role ${who ? "authenticated" : "anon"}`);
    await c.query("select set_config('request.jwt.claims', $1, true)", [who ? JSON.stringify({ sub: who, role: "authenticated" }) : "{}"]);
    try {
      const r = await fn();
      await c.query("reset role");
      await c.query("release savepoint as_s");
      return r;
    } catch (e) {
      await c.query("rollback to savepoint as_s");   // clears the failed state; the call's own changes are undone
      await c.query("reset role");
      throw e;
    }
  };
  /** The message of the error `fn` raises ("" if it does not raise). */
  const fails = async (fn: () => Promise<unknown>): Promise<string> => {
    await c.query("savepoint fails_s");
    try { await fn(); await c.query("release savepoint fails_s"); return ""; }
    catch (e) { await c.query("rollback to savepoint fails_s"); await c.query("reset role"); const x = e as { message?: string }; return x.message || "error"; }
  };

  const id = () => randomUUID();
  const profile = async (name: string, role: "customer" | "vendor" | "ngo" | "admin" = "customer", phone?: string) => {
    const u = id();
    await c.query("insert into auth.users (id) values ($1)", [u]);
    await c.query("insert into profiles (id, name, role, phone) values ($1,$2,$3,$4)", [u, name, role, phone ?? null]);
    return u;
  };
  const vendor = async (owner: string, name: string, approved = true) =>
    (await one<{ id: string }>("insert into vendors (owner_id, business_name, contact_name, phone, fssai_number, operating_hours, payout_upi, status) values ($1,$2,'c','9','F','9-5','u@upi',$3) returning id", [owner, name, approved ? "Approved" : "Pending"])).id;
  const outlet = async (v: string, nb = "Koramangala", payAtPickup = true) =>
    (await one<{ id: string }>("insert into outlets (vendor_id, address, neighbourhood, lat, lng, pay_at_pickup) values ($1,'addr',$2,12.93,77.62,$3) returning id", [v, nb, payAtPickup])).id;
  /** A listing. `startMin` / `endMin` are minutes from now (negative = already open). */
  const listing = async (v: string, o: string, owner: string, opts: { price?: number; rescue?: number; qty?: number; startMin?: number; endMin?: number; donateRest?: boolean } = {}) =>
    (await one<{ id: string }>(
      `insert into listings (vendor_id, outlet_id, title, category, original_price, rescue_price, qty_total, qty_available, diet, prepared_at, safety_declared_at, safety_declared_by, window_start, window_end, donate_rest)
       values ($1,$2,'Box','Bakery',$3,$4,$5,$5,'Vegetarian',now(),now(),$6, now() + ($7 || ' minutes')::interval, now() + ($8 || ' minutes')::interval, $9) returning id`,
      [v, o, opts.price ?? 200, opts.rescue ?? 100, opts.qty ?? 5, owner, opts.startMin ?? 60, opts.endMin ?? 120, opts.donateRest ?? false])).id;
  return { c, q, one, as, fails, id, profile, vendor, outlet, listing, finish: async () => { await c.query("rollback"); await c.end(); } };
}

export async function run(name: string, body: (db: Db) => Promise<void>) {
  const db = await open();
  try { await body(db); } finally { await db.finish(); }
  console.log(results.failures ? `\n${name}: ${results.failures} check(s) FAILED` : `\n${name}: all ${results.passes} checks passed against the real database (test data rolled back).`);
  process.exit(results.failures ? 1 : 0);
}
