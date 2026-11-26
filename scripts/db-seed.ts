/**
 * Fill the database with the demo data (the same people, vendors and listings the demo store starts with).
 *   npm run db:seed                 into the throw-away copy (schema sap_scratch; run `npm run db:scratch` first)
 *   npm run db:seed -- --public     into the REAL schema. THIS DELETES EVERYTHING in it first. Only for a demo database.
 */
import { loadEnv } from "./lib/db-test";

const env = loadEnv();
process.env.SUPABASE_DB_URL = env.SUPABASE_DB_URL;
process.env.STORE = "supabase";
process.env.SESSION_SECRET ||= env.SESSION_SECRET || "demo-seed-secret";
const real = process.argv.includes("--public");
if (real) process.env.ALLOW_PG_RESET = "1"; else process.env.PG_SCHEMA = "sap_scratch";

(async () => {
  const { buildSeed } = await import("../lib/seed");
  const { resetStore } = await import("../lib/store");
  const { closePool } = await import("../lib/pg/db");
  await resetStore(buildSeed(Date.now()));
  await closePool();
  console.log(real ? "demo data written to the REAL schema (everything that was there is gone)" : "demo data written to the scratch schema");
})().catch((e) => { console.error(String(e.message || e).replace(/postgres(ql)?:\/\/\S+/g, "<url>")); process.exit(1); });
