import "./scratch-env";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createScratch } from "../scripts/db-scratch";
import { buildSeed } from "../lib/seed";
import { bus, resetStore } from "../lib/store";
import { closePool, pool } from "../lib/pg/db";
import { watchDatabase } from "../lib/pg/poll";
import { toUuid } from "../lib/pg/uuid";

beforeAll(async () => { await createScratch(false); await resetStore(buildSeed(Date.now())); });
afterAll(async () => { await closePool(); });

describe("changes made by ANOTHER server instance reach this one's live stream", () => {
  it("a stock change written straight to the database arrives in under 2 seconds", async () => {
    const got: any[] = [];
    bus().on("live", (e) => got.push(e));
    const stop = watchDatabase(500);
    await new Promise((r) => setTimeout(r, 1500));            // baseline taken
    const listing = toUuid("l_1");
    const t0 = Date.now();
    // what another instance's reserve_listing does, done by hand on a separate connection
    await pool().query(`select set_config('search_path', 'sap_scratch, extensions', false)`);
    await pool().query(`update sap_scratch.listings set qty_available = qty_available - 1 where id = $1`, [listing]);
    let ms = 0;
    while (!got.some((e) => e.type === "listing" && e.listingId === listing) && Date.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 50));
    ms = Date.now() - t0;
    stop();
    console.log(`cross-instance stock change reached the stream in ${ms} ms`);
    expect(got.some((e) => e.type === "listing" && e.listingId === listing)).toBe(true);
    expect(ms).toBeLessThan(2000);
  });
});
