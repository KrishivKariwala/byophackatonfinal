import "./scratch-env";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createScratch } from "../scripts/db-scratch";
import { buildSeed } from "../lib/seed";
import { readDb, resetStore } from "../lib/store";
import { closePool } from "../lib/pg/db";
import { toUuid } from "../lib/pg/uuid";
import type { DB } from "../lib/types";

beforeAll(async () => { await createScratch(false); });
afterAll(async () => { await closePool(); });

/** Every id in the data, so a reference to it can be mapped the way the store maps ids. */
const idsOf = (db: DB) => { const s = new Set<string>(); for (const v of Object.values(db)) if (Array.isArray(v)) for (const o of v) if (o && typeof o === "object") for (const k of ["id", "userId"]) if (typeof (o as any)[k] === "string") s.add((o as any)[k]); return s; };
const mapIds = (v: any, ids: Set<string>): any => typeof v === "string" ? (ids.has(v) ? toUuid(v) : v) : Array.isArray(v) ? v.map((x) => mapIds(x, ids)) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, mapIds(x, ids)])) : v;
/** Drops empty values (null, undefined, false, 0, [], "") and sorts keys, so "not set" and "set to its default" compare equal. */
const strip = (o: any): any => Array.isArray(o) ? o.map(strip) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).filter(([, v]) => !(v === undefined || v === null || v === false || v === 0 || v === "" || (Array.isArray(v) && !v.length))).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, strip(v)])) : o;
/** Fields that legitimately differ: the database numbers these rows itself (serial ids), keeps free text ids as written, or stamps a creation time. */
const IGNORE: Record<string, string[]> = {
  impact: ["id"], notifications: ["id", "payload"], audit: ["id"], inventory: ["id", "refId"], reservationEvents: ["id"],
  creditLedger: ["refId"], moderationActions: ["targetId"], templates: ["createdAt"],
};

describe("the Postgres store holds the same data the demo store does", () => {
  it("seed -> database -> read back is the same data (every collection)", async () => {
    const seed = buildSeed(Date.now());
    await resetStore(seed);
    const back = await readDb();
    const ids = idsOf(seed);
    const problems: string[] = [];
    for (const [coll, want] of Object.entries(seed)) {
      if (!Array.isArray(want)) continue;
      const got = ((back as any)[coll] ?? []) as any[];
      const drop = (x: any) => { const y = { ...x }; for (const k of IGNORE[coll] ?? []) delete y[k]; if (y.origin === "window_end") delete y.origin; if (y.type === "generic") delete y.type; for (const k of Object.keys(y)) if (typeof y[k] === "number") y[k] = Math.round(y[k] * 1e6) / 1e6; return y; };   // (the database fills in these two defaults itself)
      const norm = (xs: any[], mapped: boolean) => xs.map((x) => strip(drop(mapped ? mapIds(x, ids) : x))).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      const w = norm(want, true), g = norm(got, false);
      if (w.length !== g.length) { problems.push(`${coll}: ${w.length} in seed, ${g.length} read back`); continue; }
      for (let i = 0; i < w.length; i++) {
        const a = w[i], b = g[i];
        if (JSON.stringify(a) !== JSON.stringify(b)) {
          const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
          const d = [...keys].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map((k) => `${k}: ${JSON.stringify(a[k])?.slice(0, 60)} != ${JSON.stringify(b[k])?.slice(0, 60)}`);
          problems.push(`${coll}[${i}] ${d.slice(0, 4).join(" | ")}`);
          break;
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
