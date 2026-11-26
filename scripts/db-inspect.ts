/** Read-only look at the database named by SUPABASE_DB_URL: tables, whether row-level security is on, functions, policies. Run: npm run db:inspect */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const env: Record<string, string> = { ...(process.env as Record<string, string>) };
const f = path.resolve(".env.local");
if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf8").split("\n")) { const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].trim(); }

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    const t = (await c.query("select c.relname, c.relrowsecurity rls from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1")).rows;
    console.log(`tables: ${t.length}; row-level security on: ${t.filter((r) => r.rls).length}`);
    console.log(`without RLS: ${t.filter((r) => !r.rls).map((r) => r.relname).join(", ") || "none"}`);
    console.log(`functions: ${(await c.query("select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1")).rows.map((r) => r.proname).join(", ")}`);
    console.log(`policies: ${(await c.query("select count(*)::int n from pg_policies where schemaname = 'public'")).rows[0].n}`);
    console.log(`tables: ${t.map((r) => r.relname).join(", ")}`);
  } finally { await c.end(); }
})().catch((e) => { console.error(String(e.message || e).replace(/postgres(ql)?:\/\/\S+/g, "<url>")); process.exit(1); });
