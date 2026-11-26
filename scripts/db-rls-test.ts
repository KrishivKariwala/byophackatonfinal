/**
 * Row-level-security test against the REAL database (SUPABASE_DB_URL). Everything runs inside one transaction that is rolled back at the end,
 * so no test data is left behind. It signs in as different people the way Supabase does (role `authenticated` plus a JWT subject) and checks
 * who can see which orders and change which outlets: a vendor must not see another vendor's orders, a staff member must not see another
 * outlet's orders, a customer sees only their own, and a visitor sees nothing.   Run: npm run db:rls
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

const env: Record<string, string> = { ...(process.env as Record<string, string>) };
const f = path.resolve(".env.local");
if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf8").split("\n")) { const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].trim(); }

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` ${detail}`}`); if (!ok) failures++; };

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query("begin");
  try {
    const id = () => randomUUID();
    const [cust1, cust2, ownerA, ownerB, staffA1, staffA2] = [id(), id(), id(), id(), id(), id()];
    for (const [u, name, role] of [[cust1, "Cust One", "customer"], [cust2, "Cust Two", "customer"], [ownerA, "Owner A", "vendor"], [ownerB, "Owner B", "vendor"], [staffA1, "Staff A1", "vendor"], [staffA2, "Staff A2", "vendor"]] as const) {
      await c.query("insert into auth.users (id) values ($1)", [u]);
      await c.query("insert into profiles (id, name, role) values ($1, $2, $3)", [u, name, role]);
    }
    const vendor = async (owner: string, name: string) => (await c.query("insert into vendors (owner_id, business_name, contact_name, phone, fssai_number, operating_hours, payout_upi) values ($1,$2,'c','9','F','9-5','u@upi') returning id", [owner, name])).rows[0].id as string;
    const outlet = async (v: string, nb: string) => (await c.query("insert into outlets (vendor_id, address, neighbourhood, lat, lng) values ($1,'addr',$2,12.93,77.62) returning id", [v, nb])).rows[0].id as string;
    const vA = await vendor(ownerA, "Vendor A"), vB = await vendor(ownerB, "Vendor B");
    const oA1 = await outlet(vA, "Koramangala"), oA2 = await outlet(vA, "Indiranagar"), oB1 = await outlet(vB, "Jayanagar");
    const listing = async (v: string, o: string, ow: string) => (await c.query("insert into listings (vendor_id, outlet_id, title, category, original_price, rescue_price, qty_total, qty_available, diet, prepared_at, safety_declared_at, safety_declared_by, window_start, window_end) values ($1,$2,'Box','Bakery',200,100,5,5,'Vegetarian',now(),now(),$3,now()+interval '1 hour',now()+interval '2 hours') returning id", [v, o, ow])).rows[0].id as string;
    const lA1 = await listing(vA, oA1, ownerA), lA2 = await listing(vA, oA2, ownerA), lB1 = await listing(vB, oB1, ownerB);
    const order = async (ref: string, l: string, v: string, o: string, cu: string) => c.query("insert into reservations (ref, listing_id, vendor_id, outlet_id, customer_id, qty, unit_price, amount, method) values ($1,$2,$3,$4,$5,1,100,100,'online')", [ref, l, v, o, cu]);
    await order("T-A1", lA1, vA, oA1, cust1); await order("T-A2", lA2, vA, oA2, cust1); await order("T-B1", lB1, vB, oB1, cust2);
    await c.query("insert into memberships (user_id, vendor_id, role) values ($1,$2,'owner')", [ownerA, vA]);
    await c.query("insert into memberships (user_id, vendor_id, role) values ($1,$2,'owner')", [ownerB, vB]);
    await c.query("insert into memberships (user_id, vendor_id, outlet_id, role) values ($1,$2,$3,'staff')", [staffA1, vA, oA1]);
    await c.query("insert into memberships (user_id, vendor_id, outlet_id, role) values ($1,$2,$3,'staff')", [staffA2, vA, oA2]);

    /** Runs a query as a signed-in person (or a visitor with no id), the way Supabase evaluates policies. */
    const as = async <T>(who: string | null, fn: () => Promise<T>): Promise<T> => {
      await c.query("savepoint s");
      await c.query(`set local role ${who ? "authenticated" : "anon"}`);
      await c.query("select set_config('request.jwt.claims', $1, true)", [who ? JSON.stringify({ sub: who, role: "authenticated" }) : "{}"]);
      let failed: unknown; let result: T | undefined;
      try { result = await fn(); } catch (e) { failed = e; }
      await c.query("rollback to savepoint s"); // also clears the failed state if fn threw
      await c.query("reset role");
      if (failed) throw failed;
      return result as T;
    };
    // 1. default deny: with no grants (the project setting "grant API access to new tables" is off), the public API roles get nothing at all
    const denied = async (who: string | null) => { try { await as(who, async () => c.query("select 1 from reservations limit 1")); return false; } catch (e) { return (e as { code?: string }).code === "42501"; } };
    check("signed-in people are refused outright until a table is deliberately opened to them (default deny)", await denied(cust1));
    check("a visitor is refused outright too", await denied(null));
    // 2. now open the tables to the API roles inside this test only (rolled back), so the row rules themselves are what gets tested
    await c.query("grant usage on schema public to authenticated, anon");
    await c.query("grant select, insert, update, delete on all tables in schema public to authenticated, anon");
    const orders = (who: string | null) => as(who, async () => (await c.query("select ref from reservations where ref like 'T-%' order by ref")).rows.map((r) => r.ref as string));
    const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
    const expectOrders = async (name: string, who: string | null, want: string[]) => { const got = await orders(who); check(`${name} sees ${want.length ? want.join(", ") : "no orders"}`, same(got, want), `(saw ${got.join(", ") || "none"})`); };

    await expectOrders("vendor A (owner)", ownerA, ["T-A1", "T-A2"]);
    await expectOrders("vendor B (owner)", ownerB, ["T-B1"]);
    await expectOrders("staff at outlet A1", staffA1, ["T-A1"]);
    await expectOrders("staff at outlet A2", staffA2, ["T-A2"]);
    await expectOrders("customer 1", cust1, ["T-A1", "T-A2"]);
    await expectOrders("customer 2", cust2, ["T-B1"]);
    await expectOrders("a visitor with no account", null, []);

    const changed = (who: string, sql: string, args: unknown[]) => as(who, async () => (await c.query(sql, args)).rowCount ?? 0);
    check("vendor B cannot change vendor A's outlet", (await changed(ownerB, "update outlets set address = 'hacked' where id = $1", [oA1])) === 0);
    check("staff cannot change an outlet", (await changed(staffA1, "update outlets set address = 'hacked' where id = $1", [oA1])) === 0);
    check("vendor A can change their own outlet", (await changed(ownerA, "update outlets set address = 'new' where id = $1", [oA1])) === 1);
    check("a customer cannot change an order", (await changed(cust1, "update reservations set qty = 5 where ref = 'T-A1'", [])) === 0);
    check("a customer cannot read another customer's payments", (await as(cust1, async () => (await c.query("select count(*)::int n from payments where customer_id <> $1", [cust1])).rows[0].n)) === 0);
  } finally {
    await c.query("rollback"); // nothing from this test stays in the database
    await c.end();
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll row-level-security checks passed against the real database (test data rolled back).");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(String(e.message || e).replace(/postgres(ql)?:\/\/\S+/g, "<url>")); process.exit(1); });
