import "server-only";
import { Pool, type PoolClient } from "pg";

/**
 * The Postgres connection used when STORE=supabase (the production store). The demo JSON store is untouched and is still what runs
 * when STORE is unset, so demos and the unit tests do not need a database.
 *
 * Every call runs in ONE transaction and tells Postgres who is acting (`request.jwt.claims.sub`), exactly as Supabase does for a
 * signed-in request, so the security-definer functions (reserve_listing, handover, ...) check the right person via auth.uid().
 * The app connects as the database owner (bypassing row-level security) and relies on those functions for the rules; row-level
 * security is what protects direct browser access with the anon key.
 */
const g = globalThis as unknown as { __sapPool?: Pool };

export const pgEnabled = () => process.env.STORE === "supabase";

/**
 * Supabase offers two pooled addresses. The SESSION pooler (port 5432) lets only 15 clients connect in TOTAL, and a serverless host
 * such as Vercel keeps idle connections open in frozen instances, so a few busy seconds used all 15 and the whole site returned errors
 * until they timed out. The TRANSACTION pooler (port 6543) hands a connection out per transaction and allows hundreds of clients, and
 * everything the app does lives inside one transaction (set_config(..., true), advisory xact locks), so it works there. On Vercel the
 * session address in SUPABASE_DB_URL is switched to 6543 automatically; set PG_KEEP_PORT=1 to opt out.
 */
function runtimeUrl(): string {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set (needed when STORE=supabase).");
  if ((process.env.VERCEL || process.env.PG_TRANSACTION_POOLER === "1") && !process.env.PG_KEEP_PORT) {
    try { const u = new URL(url); if (u.port === "5432" && u.hostname.endsWith(".pooler.supabase.com")) { u.port = "6543"; return u.toString(); } } catch { /* leave it as given */ }
  }
  return url;
}

export function pool(): Pool {
  if (!g.__sapPool) {
    const url = runtimeUrl();
    // Supabase's pooler presents a certificate chain Node does not trust by default; the connection is still encrypted.
    // TODO(security): pin Supabase's CA instead of skipping verification.
    g.__sapPool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: Number(process.env.PG_POOL_MAX ?? (process.env.VERCEL ? 4 : 10)), idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000 });
    g.__sapPool.on("error", (e) => console.error("postgres pool error", e.message));
  }
  return g.__sapPool;
}

/** When this process last committed a change (ms). The shared snapshot (lib/store.ts readDb) is never older than this. */
let lastWriteAt = 0;
export const lastWrite = () => lastWriteAt;

/** Whoever caches platform settings is told every time a snapshot is read, so admin changes show up on the next request. */
const settingsListeners: ((s: Record<string, unknown>) => void)[] = [];
export const onSettingsSeen = (f: (s: Record<string, unknown>) => void) => { settingsListeners.push(f); };
export const notifySettings = (s: Record<string, unknown>) => { for (const f of settingsListeners) f(s); };

/** Test support: runs after every committed transaction so a synchronous snapshot can be refreshed (PG_SYNC_CACHE=1). */
let afterCommit: (() => Promise<void>) | null = null;
export const setAfterCommit = (f: (() => Promise<void>) | null) => { afterCommit = f; };
let inHook = false;

export async function closePool() { const p = g.__sapPool; g.__sapPool = undefined; if (p) await p.end(); }

/** Runs `fn` in a transaction as `actorId` (a profile uuid), or as nobody. Commits on success, rolls back on any error. */
/** A busy database may refuse a connection for a moment ("max clients", "too many connections"): try again shortly instead of failing the request. */
async function connect(): Promise<PoolClient> {
  for (let i = 0; ; i++) {
    try { return await pool().connect(); }
    catch (e) {
      const m = String((e as Error).message ?? e);
      if (i >= 3 || !/max clients|too many (clients|connections)|EMAXCONN|remaining connection slots|timeout/i.test(m)) throw e;
      await new Promise((r) => setTimeout(r, 150 * (i + 1) + Math.random() * 100));
    }
  }
}

export async function withTx<T>(actorId: string | null, fn: (c: PoolClient) => Promise<T>, opts: { write?: boolean } = {}): Promise<T> {
  const c = await connect();
  let released = false;
  try {
    // One round trip: begin, who is acting, and (PG_SCHEMA) which copy of the schema to use. PG_SCHEMA points the app at a scratch copy
    // (npm run db:scratch) so tests never touch real data.
    const claims = c.escapeLiteral(JSON.stringify(actorId ? { sub: actorId, role: "authenticated" } : {}));
    const path = process.env.PG_SCHEMA ? `, set_config('search_path', ${c.escapeLiteral(`${process.env.PG_SCHEMA}, extensions`)}, true)` : "";
    await c.query(`begin; select set_config('request.jwt.claims', ${claims}, true)${path}`);
    const r = await fn(c);
    await c.query("commit");
    if (opts.write !== false) lastWriteAt = Date.now();
    if (afterCommit && !inHook) { inHook = true; try { c.release(); released = true; await afterCommit(); } finally { inHook = false; } }
    return r;
  } catch (e) {
    try { await c.query("rollback"); } catch { /* connection already gone */ }
    throw e;
  } finally {
    if (!released) c.release();
  }
}

/** Tries `fn` inside a savepoint; a failure undoes only that attempt (used for "pick another random code"). */
export async function attempt<T>(c: PoolClient, fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
  await c.query("savepoint attempt_s");
  try { const value = await fn(); await c.query("release savepoint attempt_s"); return { ok: true, value }; }
  catch (error) { await c.query("rollback to savepoint attempt_s"); return { ok: false, error }; }
}
