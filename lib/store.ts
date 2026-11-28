import "server-only";
import { EventEmitter } from "node:events";
import * as React from "react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { DB, LiveEvent } from "./types";
import { buildSeed } from "./seed";
import { seedKitchen } from "./seed-kitchen";
import { kitchenEnabled } from "./kitchen-themes";
import { lastWrite, pgEnabled, setAfterCommit } from "./pg/db";
import { pgRead, pgReplaceAll, pgTransaction } from "./pg/store";

/**
 * Demo-mode data store.
 *
 * Every mutation runs inside `transaction()`, which:
 *  1. waits for an in-process mutex (one writer at a time — the demo equivalent of a row lock),
 *  2. works on a deep copy of the state, so a thrown error rolls everything back,
 *  3. persists the new state to disk atomically (temp file + rename), then
 *  4. emits live events only AFTER the commit, so realtime never runs ahead of the data.
 *
 * This guarantees atomic stock changes inside one Node process. For multi-instance production the
 * same operations exist as Postgres RPCs with SELECT ... FOR UPDATE (supabase/migrations).
 */

type G = {
  __sapDb?: DB;
  __sapLock?: Promise<unknown>;
  __sapBus?: EventEmitter;
  __sapDbPath?: string;
  __sapPgSync?: DB;
};
const g = globalThis as unknown as G;

/**
 * Where the demo store lives. Serverless hosts such as Vercel have a read-only project folder, so there the file goes in the
 * temp directory (writable, but private to one instance and cleared on a cold start: the demo simply re-seeds).
 */
export function dbPath(): string {
  const fallback = process.env.VERCEL ? path.join(os.tmpdir(), "sap-demo-db.json") : "./data/demo-db.json";
  return path.resolve(process.env.DEMO_DB_PATH || fallback);
}

function load(): DB {
  const p = dbPath();
  if (g.__sapDb && g.__sapDbPath === p) return g.__sapDb;
  let db: DB;
  if (fs.existsSync(p)) {
    db = migrate(JSON.parse(fs.readFileSync(p, "utf8")) as DB);
  } else {
    db = buildSeed(Date.now());
    persist(db);
  }
  g.__sapDb = db;
  g.__sapDbPath = p;
  return db;
}

/** Additive upgrade of stores written before P1: fill the new collections and settings with defaults. */
export function migrate(db: DB): DB {
  db.schedules ??= [];
  db.reservationEvents ??= [];
  db.pushTokens ??= [];
  db.follows ??= [];
  db.reviews ??= [];
  db.reports ??= [];
  db.settings ??= { platformFeeBps: 1000 };
  // P2 collections
  db.settingsAudit ??= [];
  db.memberships ??= [];
  db.invites ??= [];
  db.priceSteps ??= [];
  db.referralCodes ??= [];
  db.referrals ??= [];
  db.creditLedger ??= [];
  db.distributionLogs ??= [];
  db.receipts ??= [];
  db.receiptSeq ??= {};
  db.deliveryRequests ??= [];
  db.certificates ??= [];
  db.moderationActions ??= [];
  // every vendor owner is an owner of their organization (the vendor record), even in stores written before P2
  for (const v of db.vendors) {
    if (!db.memberships.some((m) => m.userId === v.ownerId && m.vendorId === v.id && m.role === "owner" && !m.revokedAt))
      db.memberships.push({ id: `m_${v.id}_owner`, userId: v.ownerId, vendorId: v.id, role: "owner", createdAt: v.createdAt });
  }
  // test version only: a store written before the Paris Panini demo restaurant existed gets it added
  if (kitchenEnabled() && !db.vendors.some((v) => v.id === "v_paris")) seedKitchen(db, Date.now());
  return db;
}

function persist(db: DB) {
  const p = dbPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, p);
}

export function bus(): EventEmitter {
  if (!g.__sapBus) {
    g.__sapBus = new EventEmitter();
    g.__sapBus.setMaxListeners(1000);
  }
  return g.__sapBus;
}

/** Read-only snapshot. Never mutate the returned object. (Demo store only: with STORE=supabase use `await readDb()`.) */
export function read(): DB {
  if (pgEnabled()) {
    // Only for the tests that run the unit suite against Postgres: PG_SYNC_CACHE=1 keeps a synchronous copy fresh after every commit.
    if (process.env.PG_SYNC_CACHE && g.__sapPgSync) return g.__sapPgSync;
    throw new Error("read() is the demo store; with STORE=supabase use `await readDb()`.");
  }
  return load();
}
if (process.env.PG_SYNC_CACHE && pgEnabled()) setAfterCommit(async () => { g.__sapPgSync = await pgRead(); });

/** A read-only snapshot from whichever store is active. One per request when called from a server component (React `cache`). */
const memo: <T>(f: () => Promise<T>) => () => Promise<T> = (React as unknown as { cache?: <T>(f: () => Promise<T>) => () => Promise<T> }).cache ?? ((f) => f);

/**
 * Database store: reading means loading the whole database, which is the expensive part of a request. So one load is SHARED by
 * every request this server handles for 2 seconds (and concurrent requests wait for the same load instead of each starting one):
 * twenty visitors in the same moment cost the database one read, not twenty. To keep it honest:
 *  - a change made by this server empties it at once (lastWrite);
 *  - a visitor who just changed something carries a `sap_rev` cookie (set in lib/api.ts) with the commit time, and never gets a
 *    snapshot older than that, even from another server: they always see their own change;
 *  - other people's changes show within 2 seconds (live updates already arrive sooner through the event stream).
 */
const SNAPSHOT_TTL_MS = 2000;
let shared: { at: number; p: Promise<DB> } | null = null;
async function revSeen(): Promise<number> {
  try { const { cookies } = await import("next/headers"); return Number((await cookies()).get("sap_rev")?.value) || 0; } catch { return 0; }   // (no request: scripts, tests)
}
async function sharedSnapshot(): Promise<DB> {
  const need = Math.max(lastWrite(), await revSeen());
  if (shared && Date.now() - shared.at < SNAPSHOT_TTL_MS && shared.at >= need) return shared.p;
  const entry = { at: Date.now(), p: pgRead() };
  shared = entry;
  entry.p.catch(() => { if (shared === entry) shared = null; });
  return entry.p;
}
const snapshotOnce = memo(() => sharedSnapshot());
export async function readDb(): Promise<DB> {
  return pgEnabled() ? snapshotOnce() : load();
}

/** Server/database clock. Client clocks are never trusted. Demo fast-forward adds an offset. */
export function now(db: DB = load()): number {
  return Date.now() + (db.clockOffsetMs || 0);
}

export interface TxContext {
  db: DB;
  now: number;
  emit: (e: Omit<LiveEvent, "committedAt"> & Record<string, unknown>) => void;
  nextSeq: () => number;
  /** Runs only after the transaction has been persisted (push delivery, SMS). Never runs on rollback. */
  afterCommit: (fn: () => void | Promise<void>) => void;
}

export async function transaction<T>(fn: (tx: TxContext) => T | Promise<T>): Promise<T> {
  if (pgEnabled()) return pgTransaction(fn, (e) => bus().emit("live", e));
  const prev = g.__sapLock ?? Promise.resolve();
  let release!: () => void;
  const mine = new Promise<void>((r) => (release = r));
  g.__sapLock = prev.then(() => mine);
  await prev.catch(() => undefined);
  try {
    const current = load();
    const draft: DB = structuredClone(current);
    const pending: Omit<LiveEvent, "committedAt">[] = [];
    const after: (() => void | Promise<void>)[] = [];
    const tx: TxContext = {
      db: draft,
      now: now(draft),
      emit: (e) => pending.push(e as Omit<LiveEvent, "committedAt">),
      nextSeq: () => ++draft.seq,
      afterCommit: (fn) => after.push(fn),
    };
    const result = await fn(tx);
    persist(draft);
    g.__sapDb = draft; // commit
    const committedAt = Date.now();
    for (const e of pending) bus().emit("live", { ...e, committedAt } as LiveEvent);
    for (const fn of after) Promise.resolve().then(fn).catch((err) => console.error("afterCommit failed", err));
    return result;
  } finally {
    release();
  }
}

/** Replace the whole store (demo reset / tests). */
let epochN = 0;
/** Bumped whenever the whole store is replaced (reset/seed), so caches built on it can drop themselves. */
export const storeEpoch = () => epochN;

export async function resetStore(db?: DB) {
  epochN++;
  if (pgEnabled()) return pgReplaceAll(db ?? buildSeed(Date.now()));
  await transaction((tx) => {
    const fresh = db ?? buildSeed(Date.now());
    Object.assign(tx.db, fresh);
    tx.emit({ type: "impact" });
  });
}
