/**
 * Applies the SQL files in supabase/migrations to the database named by SUPABASE_DB_URL (in .env.local), in order, each in its own
 * transaction, and remembers which ones ran in the table public.schema_migrations. A file that fails is rolled back completely.
 *
 *   npm run db:migrate                 apply every file that has not run yet
 *   npm run db:rollback -- 0003_p2     run that file's .down.sql and forget it (newest first; one file at a time)
 *   npm run db:status                  list what ran and what is waiting
 *
 * Never run this against a database you cannot afford to change. It uses the direct database password, not the API keys.
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function loadEnv() {
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };
  const f = path.resolve(".env.local");
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf8").split("\n")) { const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m && !(m[1] in env && env[m[1]])) env[m[1]] = m[2].trim(); }
  return env;
}

const DIR = path.resolve("supabase/migrations");
const files = () => fs.readdirSync(DIR).filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql")).sort();
const version = (f: string) => f.replace(/\.sql$/, "");

async function main() {
  const [cmd = "migrate", target] = process.argv.slice(2);
  const url = loadEnv().SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set in .env.local");
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20_000 });
  await c.connect();
  try {
    await c.query("create table if not exists public.schema_migrations (version text primary key, applied_at timestamptz not null default now())");
    const done = new Set((await c.query("select version from public.schema_migrations")).rows.map((r) => r.version as string));
    if (cmd === "status") {
      for (const f of files()) console.log(`${done.has(version(f)) ? "applied " : "waiting "} ${f}`);
      return;
    }
    if (cmd === "rollback") {
      if (!target || !done.has(target)) throw new Error(`name an applied migration, for example: npm run db:rollback -- 0003_p2 (applied: ${[...done].join(", ") || "none"})`);
      const newest = [...done].sort().pop();
      if (newest !== target) throw new Error(`roll back the newest first (${newest})`);
      const down = path.join(DIR, `${target}.down.sql`);
      if (!fs.existsSync(down)) throw new Error(`${down} does not exist`);
      await c.query("begin");
      try { await c.query(fs.readFileSync(down, "utf8")); await c.query("delete from public.schema_migrations where version = $1", [target]); await c.query("commit"); console.log(`rolled back ${target}`); }
      catch (e) { await c.query("rollback"); const x = e as { message: string; detail?: string }; throw new Error(`${x.message}${x.detail ? `\n  detail: ${x.detail}` : ""}`); }
      return;
    }
    for (const f of files()) {
      if (done.has(version(f))) { console.log(`skip    ${f} (already applied)`); continue; }
      const sql = fs.readFileSync(path.join(DIR, f), "utf8");
      await c.query("begin");
      try { await c.query(sql); await c.query("insert into public.schema_migrations (version) values ($1)", [version(f)]); await c.query("commit"); console.log(`applied ${f}`); }
      catch (e) {
        await c.query("rollback");
        const err = e as { message: string; position?: string; detail?: string; hint?: string };
        let where = "";
        if (err.position) { const pos = Number(err.position); const line = sql.slice(0, pos).split("\n").length; where = ` (line ${line}: ${sql.split("\n")[line - 1].trim().slice(0, 120)})`; }
        console.error(`FAILED  ${f}: ${err.message}${where}${err.detail ? `\n  detail: ${err.detail}` : ""}${err.hint ? `\n  hint: ${err.hint}` : ""}`);
        process.exitCode = 1;
        return;
      }
    }
  } finally { await c.end(); }
}
main().catch((e) => { console.error(String(e.message || e).replace(/postgres(ql)?:\/\/\S+/g, "<url>")); process.exit(1); });
