import { loadEnv } from "../scripts/lib/db-test";

/** Point the app at the throw-away schema copy (npm run db:scratch) and the Postgres store, before any lib module reads the env. */
const env = loadEnv();
process.env.SUPABASE_DB_URL = env.SUPABASE_DB_URL;
process.env.STORE = "supabase";
process.env.PG_SCHEMA = "sap_scratch";
process.env.SESSION_SECRET ||= "db-test-secret";
process.env.PG_POOL_MAX ||= "6";
