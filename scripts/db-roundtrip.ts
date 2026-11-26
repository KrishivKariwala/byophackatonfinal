/**
 * Proves the rollback scripts really undo their migrations. For each migration with a .down.sql, newest first: take a snapshot of the schema
 * (tables, columns, constraints, indexes, policies, functions, types, triggers), roll the migration back, and compare with the snapshot
 * taken just before it was applied; then apply it again. Run: npm run db:roundtrip   (changes the database; use a development database)
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { execFileSync } from "node:child_process";

const env: Record<string, string> = { ...(process.env as Record<string, string>) };
const f = path.resolve(".env.local");
if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf8").split("\n")) { const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].trim(); }

async function snapshot(c: Client): Promise<string[]> {
  const q = async (sql: string) => (await c.query(sql)).rows.map((r) => Object.values(r).join("|"));
  const notExt = "not exists (select 1 from pg_depend d where d.objid = {oid} and d.deptype = 'e')";
  return [
    ...(await q("select 'col', table_name, column_name, data_type, is_nullable, coalesce(column_default,'') from information_schema.columns where table_schema = 'public' order by 2,3")),
    ...(await q("select 'con', conrelid::regclass::text, conname, pg_get_constraintdef(oid) from pg_constraint where connamespace = 'public'::regnamespace order by 2,3")),
    ...(await q("select 'idx', tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by 2,3")),
    ...(await q("select 'pol', tablename, policyname, cmd, coalesce(qual,''), coalesce(with_check,'') from pg_policies where schemaname = 'public' order by 2,3")),
    ...(await q(`select 'fn', p.proname, pg_get_function_identity_arguments(p.oid) from pg_proc p where p.pronamespace = 'public'::regnamespace and ${notExt.replace("{oid}", "p.oid")} order by 2,3`)),
    ...(await q("select 'type', t.typname from pg_type t where t.typnamespace = 'public'::regnamespace and t.typtype = 'e' order by 2")),
    ...(await q("select 'trg', event_object_table, trigger_name from information_schema.triggers where trigger_schema = 'public' order by 2,3")),
    ...(await q("select 'rls', c.relname, c.relrowsecurity::text from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' order by 2")),
  ];
}

const run = (...args: string[]) => (process.env.DEBUG_RT ? console.log("  $ db-migrate", args.join(" ")) : 0, execFileSync)("npx", ["tsx", "scripts/db-migrate.ts", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  let bad = 0;
  try {
    const dir = path.resolve("supabase/migrations");
    const withDown = fs.readdirSync(dir).filter((x) => x.endsWith(".down.sql")).map((x) => x.replace(".down.sql", "")).sort().reverse();
    for (const v of withDown) {
      const applied = (await c.query("select 1 from public.schema_migrations where version = $1", [v])).rowCount;
      if (!applied) { console.log(`skip ${v} (not applied)`); continue; }
      // newer migrations sit on top of this one, so they come off first (and go back on at the end of this round)
      for (const newer of withDown.filter((x) => x > v)) if ((await c.query("select 1 from public.schema_migrations where version = $1", [newer])).rowCount) run("rollback", newer);
      // snapshot of the state BEFORE this migration = state after rolling it back, so roll back first, snapshot, apply, snapshot again
      run("rollback", v);
      const before = await snapshot(c);
      run("migrate");
      const afterUp = await snapshot(c);
      for (const newer of withDown.filter((x) => x > v)) run("rollback", newer); // `migrate` put the newer ones back too
      run("rollback", v);
      const afterDown = await snapshot(c);
      const diff = [...before.filter((x) => !afterDown.includes(x)).map((x) => `missing after rollback: ${x}`), ...afterDown.filter((x) => !before.includes(x)).map((x) => `left behind by rollback: ${x}`)];
      run("migrate");
      const again = await snapshot(c);
      const reapplied = afterUp.length === again.length && afterUp.every((x, i) => x === again[i]);
      if (diff.length || !reapplied) { bad++; console.log(`FAIL ${v}`); diff.slice(0, 12).forEach((d) => console.log("  " + d.slice(0, 200))); if (!reapplied) console.log("  applying it a second time gave a different schema"); }
      else console.log(`PASS ${v}: rollback restores the schema exactly, and it applies again identically`);
    }
  } finally { await c.end(); }
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(String(e.stderr || e.message || e).replace(/postgres(ql)?:\/\/\S+/g, "<url>")); process.exit(1); });
