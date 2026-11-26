/**
 * A throw-away copy of the whole schema (every migration, in order) in its own Postgres schema, `sap_scratch`, inside your real
 * database, so tests can wipe and refill it without ever touching real data in `public`.
 *   npm run db:scratch            (re)create it from the migrations
 *   npm run db:scratch -- drop    remove it
 * The app and the tests use it when PG_SCHEMA=sap_scratch.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { loadEnv } from "./lib/db-test";

export const SCRATCH = "sap_scratch";

export async function createScratch(log = true) {
  const env = loadEnv();
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    await c.query(`drop schema if exists ${SCRATCH} cascade`);
    await c.query(`create schema ${SCRATCH}`);
    await c.query(`set search_path = ${SCRATCH}, extensions`);
    const dir = path.resolve("supabase/migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql")).sort();
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), "utf8")
        .replace(/set search_path = public(, extensions)?/g, `set search_path = ${SCRATCH}, extensions`)   // the functions must see the scratch tables
        .replace(/alter publication supabase_realtime[^;]*;/g, "")                                          // the scratch copy is not broadcast
        .replace(/create extension if not exists [^;]*;/g, "");
      await c.query("begin");
      try { await c.query(sql); await c.query("commit"); } catch (e) { await c.query("rollback"); throw new Error(`${f}: ${(e as Error).message}`); }
      if (log) console.log(`scratch: ${f}`);
    }
  } finally { await c.end(); }
}

export async function dropScratch() {
  const c = new Client({ connectionString: loadEnv().SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try { await c.query(`drop schema if exists ${SCRATCH} cascade`); } finally { await c.end(); }
}

if (require.main === module) {
  (process.argv[2] === "drop" ? dropScratch() : createScratch()).then(() => console.log(process.argv[2] === "drop" ? "scratch schema removed" : "scratch schema ready")).catch((e) => { console.error(String(e.message || e).replace(/postgres(ql)?:\/\/\S+/g, "<url>")); process.exit(1); });
}
