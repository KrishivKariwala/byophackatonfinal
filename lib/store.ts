import "server-only";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import type { DB, LiveEvent } from "./types";
import { buildSeed } from "./seed";

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
};
const g = globalThis as unknown as G;

export function dbPath(): string {
  return path.resolve(process.env.DEMO_DB_PATH || "./data/demo-db.json");
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

/** Read-only snapshot. Never mutate the returned object. */
export function read(): DB {
  return load();
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
  await transaction((tx) => {
    const fresh = db ?? buildSeed(Date.now());
    Object.assign(tx.db, fresh);
    tx.emit({ type: "impact" });
  });
}
