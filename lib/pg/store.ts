import "server-only";
import type { PoolClient } from "pg";
import { withTx, pool, notifySettings } from "./db";
import { toUuid } from "./uuid";
import { SPECS, AUX_TABLES, bindInsert, type Obj, type Raw, type Spec } from "./spec";
import type { DB, LiveEvent } from "../types";
import { buildSeed } from "../seed";
import type { TxContext } from "../store";

/**
 * The Postgres store: the same `DB` object the demo store keeps, loaded from the tables and saved back as row changes.
 *  - loadSnapshot: ONE query returns every table as JSON; spec.ts says how rows become objects.
 *  - pgTransaction: takes a database-wide lock, loads, hands the business logic a draft copy, then writes only what changed
 *    (inserts, updated columns, deletes) and commits. Nothing is written if the logic throws.
 *  - The hot paths (reserve, pay, collect, cancel) do NOT go through here: they call the database functions in lib/pg/flow.ts, which
 *    lock single rows, so thousands of customers do not queue behind one lock.
 * The cost of this design is that every read and every generic write loads the whole database. That is fine for a demo and a
 * pilot and is the next thing to replace (scoped reads) before real scale.
 */
interface Col { udt: string; gen: boolean; serial: boolean }
type TableInfo = Map<string, Map<string, Col>>;
const infoCache = new Map<string, TableInfo>();
const schema = () => process.env.PG_SCHEMA || "public";

async function tableInfo(c: PoolClient): Promise<TableInfo> {
  const s = schema();
  const hit = infoCache.get(s);
  if (hit) return hit;
  const rows = (await c.query("select table_name, column_name, udt_name, is_generated, column_default, is_identity from information_schema.columns where table_schema = $1 order by ordinal_position", [s])).rows;
  const t: TableInfo = new Map();
  for (const r of rows) {
    if (!t.has(r.table_name)) t.set(r.table_name, new Map());
    t.get(r.table_name)!.set(r.column_name, { udt: r.udt_name, gen: r.is_generated === "ALWAYS", serial: /nextval/.test(r.column_default ?? "") || r.is_identity === "YES" });
  }
  infoCache.set(s, t);
  return t;
}

const snake = (s: string) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z0-9])/g, (_, m) => m.toUpperCase());
const q = (id: string) => `"${id.replace(/"/g, '""')}"`;
const pkOf = (s: Spec) => s.pk ?? "id";
const keyOf = (s: Spec, o: Obj) => String(o[camel(pkOf(s))]);
const warned = new Set<string>();

// ---------------------------------------------------------------- rows -> objects
function rowToObj(s: Spec, row: Obj, t: Map<string, Col>): Obj {
  const rev: Record<string, string> = {};
  for (const [f, col] of Object.entries(s.rename ?? {})) rev[col] = f;
  const o: Obj = {};
  for (const [col, val] of Object.entries(row)) {
    if (val === null || s.skipCols?.includes(col) || s.gen?.includes(col)) continue;
    let v = val;
    const ci = t.get(col);
    if (ci?.udt === "timestamptz") v = new Date(val).toISOString();
    if (s.serial && col === pkOf(s)) v = String(val);
    o[rev[col] ?? camel(col)] = v;
  }
  for (const [f, x] of Object.entries(s.xform ?? {})) if (x.from) o[f] = x.from(o[f]);
  return o;
}

/**
 * Tests only (PG_TEST_ALIASES=1): the unit tests refer to people and listings by their readable demo ids ("u_vendor2"). The store keeps
 * uuids; this maps the seeded ones back to the readable ids on the way out (writes map them in again, so both directions agree).
 */
let aliasMap: Map<string, string> | null = null;
function aliases(): Map<string, string> | null {
  if (!process.env.PG_TEST_ALIASES) return null;
  if (!aliasMap) {
    aliasMap = new Map();
    const seed = buildSeed(Date.now()) as unknown as Record<string, unknown>;
    for (const v of Object.values(seed)) if (Array.isArray(v)) for (const o of v) if (o && typeof o === "object") for (const k of ["id", "userId"]) { const s = (o as Record<string, unknown>)[k]; if (typeof s === "string") aliasMap.set(toUuid(s), s); }
  }
  return aliasMap;
}
function realias(v: any, m: Map<string, string>): any {
  if (typeof v === "string") return m.get(v) ?? v;
  if (Array.isArray(v)) return v.map((x) => realias(x, m));
  if (v && typeof v === "object") { for (const k of Object.keys(v)) v[k] = realias(v[k], m); return v; }
  return v;
}

function snapshotSql(ti: TableInfo): string {
  const tables = [...SPECS.map((s) => s.table), ...AUX_TABLES];
  const parts = tables.map((tb) => {
    const cols = [...(ti.get(tb)?.entries() ?? [])].filter(([, ci]) => !ci.gen).map(([n]) => n);
    const order = cols.includes("created_at") ? "t.created_at, " : "";
    const pairs = cols.map((n) => `'${n}', t.${q(n)}`).join(", ");
    return `'${tb}', coalesce((select jsonb_agg(jsonb_build_object(${pairs}) order by ${order}${cols.includes("id") ? "t.id" : q(cols[0])}) from ${q(tb)} t), '[]'::jsonb)`;
  });
  return `select jsonb_build_object(${parts.join(", ")}) as d`;
}

function parseSnapshot(raw: Raw, ti: TableInfo): DB {
  const built: Record<string, Obj[]> = {};
  for (const s of SPECS) built[s.coll] = raw[s.table].map((row) => { const o = rowToObj(s, row, ti.get(s.table)!); s.unpack?.(o, row, raw); return o; });
  for (const s of SPECS) s.link?.(built[s.coll], built, raw);
  const settings: Obj = {};
  for (const r of raw.settings) settings[camel(r.key)] = r.value;
  if (settings.platformFeeBps === undefined) settings.platformFeeBps = 1000;
  const clockOffsetMs = Number(settings.clockOffsetMs ?? 0);   // the demo fast-forward lives in a settings row
  delete settings.clockOffsetMs;
  const receiptSeq: Record<string, number> = {};
  for (const r of raw.receipt_counters) receiptSeq[String(r.year)] = r.last_value;
  const db = { version: 1, clockOffsetMs, seq: 0, ...built, settings, receiptSeq, processedWebhooks: raw.processed_webhooks.map((r) => r.event_id) } as unknown as DB;
  notifySettings(db.settings as unknown as Record<string, unknown>);
  const m = aliases();
  return m ? realias(db, m) : db;
}

export async function loadSnapshot(c: PoolClient): Promise<DB> {
  const ti = await tableInfo(c);
  return parseSnapshot((await c.query(snapshotSql(ti))).rows[0].d as Raw, ti);
}

// ---------------------------------------------------------------- objects -> rows
function convert(v: any, ci: Col | undefined): any {
  if (v === undefined || v === null) return v;
  switch (ci?.udt) {
    case "uuid": return toUuid(String(v));
    case "_uuid": return (v as string[]).map((x) => toUuid(String(x)));
    case "jsonb": case "json": return JSON.stringify(v);
    default: return v;
  }
}

function objToRow(s: Spec, o: Obj, t: Map<string, Col>): Obj {
  const row: Obj = {};
  for (const k of Object.keys(o)) {
    if (s.omit?.includes(k)) continue;
    const col = s.rename?.[k] ?? snake(k);
    const ci = t.get(col);
    if (!ci) { const w = `${s.table}.${k}`; if (!warned.has(w)) { warned.add(w); console.warn(`pg store: field "${k}" has no column in ${s.table}; it is not saved`); } continue; }
    if (ci.gen || (s.serial && col === pkOf(s))) continue;
    row[col] = s.xform?.[k]?.to ? s.xform[k].to!(o[k]) : o[k];
  }
  if (s.pack) Object.assign(row, s.pack(o));
  return row;
}

let currentInfo: TableInfo | null = null;
async function insertMany(c: PoolClient, table: string, rows: Obj[]) {
  if (!rows.length) return;
  const t = (currentInfo ?? await tableInfo(c)).get(table);
  if (!t) throw new Error(`unknown table ${table}`);
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => r[k] !== undefined)))];
  if (!cols.length) { for (const _ of rows) await c.query(`insert into ${q(table)} default values`); return; }
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100), args: unknown[] = [];
    const values = chunk.map((r) => `(${cols.map((col) => { if (r[col] === undefined) return "default"; args.push(convert(r[col], t.get(col))); return `$${args.length}`; }).join(", ")})`);
    await c.query(`insert into ${q(table)} (${cols.map(q).join(", ")}) values ${values.join(", ")}`, args);
  }
}
bindInsert(insertMany);

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

async function save(c: PoolClient, orig: DB, draft: DB, ti: TableInfo, bulk = false) {
  currentInfo = ti;
  const dels: { s: Spec; keys: string[] }[] = [];
  for (const s of SPECS) {
    const t = ti.get(s.table)!;
    const before = ((orig as any)[s.coll] as Obj[]) ?? [], after = ((draft as any)[s.coll] as Obj[]) ?? [];
    if (s.skipWrite && !bulk) continue;   // (a trigger writes it; a bulk reseed has triggers off and writes the history itself)
    const prev = new Map(before.map((o) => [keyOf(s, o), o]));
    const seen = new Set<string>();
    const ins: Obj[] = [], upd: { obj: Obj; old: Obj }[] = [];
    for (const o of after) { const k = keyOf(s, o); seen.add(k); const old = prev.get(k); if (!old) ins.push(o); else if (!same(o, old)) upd.push({ obj: o, old }); }
    if (s.coll === "profiles" && ins.length) await c.query(`insert into auth.users (id) select unnest($1::uuid[]) on conflict do nothing`, [ins.map((p) => toUuid(String(p.id)))]);
    if (ins.length) {
      await insertMany(c, s.table, ins.map((o) => objToRow(s, o, t)));
      if (s.after) await s.after(c, ins.map((obj) => ({ obj })));
    }
    const changedItems: { obj: Obj; old?: Obj }[] = [];
    for (const { obj, old } of upd) {
      const nr = objToRow(s, obj, t), or = objToRow(s, old, t);
      const cols = Object.keys(nr).filter((col) => col !== pkOf(s) && !same(convert(nr[col], t.get(col)), convert(or[col], t.get(col))));
      for (const col of Object.keys(or)) if (!(col in nr) && col !== pkOf(s) && or[col] != null && !cols.includes(col)) cols.push(col);   // a field that was removed becomes null
      if (cols.length) {
        const args = cols.map((col) => convert(nr[col] ?? null, t.get(col)));
        const pkv = s.serial ? Number(old[camel(pkOf(s))]) : convert(old[camel(pkOf(s))], t.get(pkOf(s)));
        await c.query(`update ${q(s.table)} set ${cols.map((col, i) => `${q(col)} = $${i + 1}`).join(", ")} where ${q(pkOf(s))} = $${cols.length + 1}`, [...args, pkv]);
      }
      changedItems.push({ obj, old });
    }
    if (changedItems.length && s.after) await s.after(c, changedItems);
    const gone = [...prev.keys()].filter((k) => !seen.has(k));
    if (gone.length) dels.push({ s, keys: gone });
  }
  for (const { s, keys } of dels.reverse()) {
    const t = ti.get(s.table)!;
    await c.query(`delete from ${q(s.table)} where ${q(pkOf(s))} = any($1)`, [s.serial ? keys.map(Number) : keys.map((k) => convert(k, t.get(pkOf(s))))]);
  }
  // settings (key / jsonb value), receipt counters, processed webhook ids
  const ps = (orig.settings ?? {}) as Obj, ns = (draft.settings ?? {}) as Obj;
  for (const k of new Set([...Object.keys(ps), ...Object.keys(ns)])) {
    if (same(ps[k], ns[k])) continue;
    if (ns[k] === undefined) await c.query("delete from settings where key = $1", [snake(k)]);
    else await c.query("insert into settings (key, value) values ($1, $2::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now()", [snake(k), JSON.stringify(ns[k])]);
  }
  for (const [y, n] of Object.entries(draft.receiptSeq ?? {})) if (orig.receiptSeq?.[y] !== n)
    await c.query("insert into receipt_counters (year, last_value) values ($1, $2) on conflict (year) do update set last_value = excluded.last_value", [Number(y), n]);
  if ((orig.clockOffsetMs || 0) !== (draft.clockOffsetMs || 0))
    await c.query("insert into settings (key, value) values ('clock_offset_ms', $1::jsonb) on conflict (key) do update set value = excluded.value, updated_at = now()", [JSON.stringify(draft.clockOffsetMs || 0)]);
  const known = new Set(orig.processedWebhooks ?? []);
  const fresh = (draft.processedWebhooks ?? []).filter((e) => !known.has(e));
  if (fresh.length) await c.query("insert into processed_webhooks (event_id) select unnest($1::text[]) on conflict do nothing", [fresh]);
}

// ---------------------------------------------------------------- transactions
const LOCK_KEY = 7340291;
export async function pgTransaction<T>(fn: (tx: TxContext) => T | Promise<T>, bus: (e: LiveEvent) => void): Promise<T> {
  const events: Omit<LiveEvent, "committedAt">[] = [], after: (() => void | Promise<void>)[] = [];
  const result = await withTx(null, async (c) => {
    const t0 = Date.now();
    const ti = await tableInfo(c);
    // ONE round trip: take the database-wide write lock (one generic write at a time; row-level flows are not blocked by it), reserve
    // reference numbers, and read everything.
    const res = (await c.query(`select pg_advisory_xact_lock(${LOCK_KEY}); select nextval('reservation_ref_seq') n from generate_series(1, 50); ${snapshotSql(ti)}`)) as unknown as { rows: Obj[] }[];
    const seqs = res[1].rows.map((r) => Number(r.n));
    const orig = parseSnapshot(res[2].rows[0].d as Raw, ti);
    const t1 = Date.now();
    const draft = structuredClone(orig);
    const tx: TxContext = {
      db: draft, now: Date.now(),
      emit: (e) => { events.push(e as Omit<LiveEvent, "committedAt">); },
      nextSeq: () => { const n = seqs.shift(); if (n === undefined) throw new Error("ran out of reference numbers in one transaction"); return n; },
      afterCommit: (f) => { after.push(f); },
    };
    const r = await fn(tx);
    const t2 = Date.now();
    await save(c, orig, draft, ti);
    if (process.env.PG_TIMING) console.log(`pg tx: load ${t1 - t0} ms, logic ${t2 - t1} ms, save ${Date.now() - t2} ms`);
    return r;
  });
  const committedAt = Date.now();
  for (const e of events) bus({ ...e, committedAt } as LiveEvent);
  for (const f of after) Promise.resolve().then(f).catch((err) => console.error("afterCommit failed", err));
  return result;
}

/** One consistent snapshot for reading. */
export const pgRead = () => withTx(null, (c) => loadSnapshot(c));

const emptyDb = (): DB => ({ version: 1, clockOffsetMs: 0, seq: 0, settings: { platformFeeBps: 1000 }, receiptSeq: {}, processedWebhooks: [], ...Object.fromEntries(SPECS.map((s) => [s.coll, []])) } as unknown as DB);

/** Replace everything (seeding, demo reset, tests). Refuses to run against the real `public` schema unless ALLOW_PG_RESET=1. */
export async function pgReplaceAll(db: DB) {
  if (process.env.DATA_MODE === "production") throw new Error("Refusing to replace all data in production mode.");
  if (!process.env.PG_SCHEMA && process.env.ALLOW_PG_RESET !== "1") throw new Error("Refusing to wipe the real schema: set PG_SCHEMA=sap_scratch for tests, or ALLOW_PG_RESET=1 to reset a demo database on purpose.");
  await withTx(null, async (c) => {
    await c.query("select pg_advisory_xact_lock($1)", [LOCK_KEY]);
    const ti = await tableInfo(c);
    const users = (await c.query("select id from profiles")).rows.map((r) => r.id);
    for (const tb of ["pickup_events", ...AUX_TABLES]) await c.query(`delete from ${q(tb)}`);
    for (const s of [...SPECS].reverse()) await c.query(`delete from ${q(s.table)}`);
    if (users.length) await c.query("delete from auth.users where id = any($1)", [users]);
    // The rules in triggers (review window, status log, code release) guard live traffic; a reseed loads history that predates them.
    const guarded = ["reviews", "reservations"];
    for (const tb of guarded) await c.query(`alter table ${q(tb)} disable trigger user`);
    await save(c, emptyDb(), db, ti, true);
    for (const tb of guarded) await c.query(`alter table ${q(tb)} enable trigger user`);
  });
}

export { pool };
