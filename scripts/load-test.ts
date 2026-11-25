/**
 * Load test against a real `next start` server on its own demo database. Targets come from the PRD (section 2 and the original brief):
 *   - the feed answers 1,500 people at once, p95 under 1.5 s (arriving over a few seconds, as people do)
 *   - a burst of 10 reservations per second is accepted without ever overselling
 *   - the scheduled jobs (they run inside every write) stay fast as listings, reservations and credits pile up
 *
 * Usage:  npm run build && npm run test:load
 * Numbers are for the machine it runs on (a laptop, one process, the JSON demo store), not a production database.
 * Writes test-results/load-test.json. Exits 1 on any oversell, a high error rate, or a missed target.
 */
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./lib/browser-harness";

const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] : 0; };
const summary = (xs: number[]) => ({ n: xs.length, p50: Math.round(pct(xs, 50)), p95: Math.round(pct(xs, 95)), p99: Math.round(pct(xs, 99)), max: Math.round(Math.max(0, ...xs)) });

async function main() {
  const srv = await startServer(3302, "load-test");
  const B = srv.base;
  const post = async (p: string, body: unknown, cookie?: string) => {
    const res = await fetch(B + p, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
    return { res, json: (await res.json()) as { ok: boolean; data?: any; code?: string; error?: string } };
  };
  const cookieOf = (res: Response) => (res.headers.get("set-cookie") || "").match(/sap_session=[^;]+/)![0];
  const results: Record<string, any> = { ranAt: new Date().toISOString(), targets: { feedConcurrent: 1500, feedP95Ms: 1500, reservationsPerSecond: 10, reservationP95Ms: 1000 } };
  let failed = false;
  const fail = (m: string) => { console.log("FAIL:", m); failed = true; };
  try {
    // ---- setup: vendor, five listings with 40 units each, 120 customers
    const ravi = cookieOf((await post("/api/auth/demo", { userId: "u_ravi" })).res);
    const now = Date.now();
    const iso = (ms: number) => new Date(ms).toISOString();
    const listingIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const c = await post("/api/vendor/listings", { title: `Load Box ${i}`, category: "Bakery", diet: "Vegetarian", originalPrice: 200, rescuePrice: 100, qty: 40, preparedAt: iso(now - 600_000), windowStart: iso(now + 300_000), windowEnd: iso(now + 3_900_000), donateRest: false, safetyDeclaration: true }, ravi);
      if (!c.json.ok) throw new Error(`could not create a listing: ${c.json.error}`);
      listingIds.push(c.json.data.id);
    }
    const customers: string[] = [];
    for (let i = 0; i < 120; i += 20) {
      const batch = await Promise.all(Array.from({ length: 20 }, async (_, k) => {
        const n = i + k;
        const r = await post("/api/auth/signup", { name: `Load Tester ${n}`, phone: `+9197${String(n).padStart(8, "0")}`, otp: "123456", role: "customer" });
        if (!r.json.ok) throw new Error(r.json.error);
        return cookieOf(r.res);
      }));
      customers.push(...batch);
    }

    // ---- 1. the feed under 1,500 simultaneous requests
    const feedUrl = `${B}/api/listings?lat=12.9352&lng=77.6245&radius=10`;
    // warm-up: a running site has already served requests (compiled code, filled cache), so measure that steady state
    for (let i = 0; i < 100; i++) await (await fetch(feedUrl)).arrayBuffer();
    const feedMs: number[] = []; let feedErrors = 0;
    const t0 = Date.now();
    // 1,500 people at the peak: they arrive over three seconds (one every 2 ms), not in the same millisecond. A same-millisecond burst of
    // 1,500 brand-new connections overflows the operating system's accept queue (128 on macOS) and measures the OS, not the app.
    const inflight: Promise<void>[] = [];
    for (let i = 0; i < results.targets.feedConcurrent; i++) {
      inflight.push((async () => {
        const s = performance.now();
        try { const r = await fetch(feedUrl); await r.arrayBuffer(); if (!r.ok) feedErrors++; } catch { feedErrors++; }
        feedMs.push(performance.now() - s);
      })());
      await new Promise((r) => setTimeout(r, 2));
    }
    await Promise.all(inflight);
    results.feed = { concurrent: results.targets.feedConcurrent, wallMs: Date.now() - t0, errors: feedErrors, latencyMs: summary(feedMs) };
    console.log("FEED", results.feed);
    if (feedErrors > results.targets.feedConcurrent * 0.01) fail(`feed error rate ${feedErrors}/${results.targets.feedConcurrent}`);
    if (results.feed.latencyMs.p95 > results.targets.feedP95Ms) fail(`feed p95 ${results.feed.latencyMs.p95} ms is over ${results.targets.feedP95Ms} ms`);

    // ---- 2. 10 reservations per second for 10 seconds, spread over the five listings
    const resMs: number[] = []; let ok = 0, rejected = 0, unexpected = 0;
    const burst: Promise<void>[] = [];
    const t1 = Date.now();
    for (let sec = 0; sec < 10; sec++) {
      for (let k = 0; k < 10; k++) {
        const idx = sec * 10 + k;
        burst.push((async () => {
          const s = performance.now();
          const r = await post("/api/reservations", { listingId: listingIds[idx % listingIds.length], qty: 1, method: "online" }, customers[idx]);
          resMs.push(performance.now() - s);
          if (r.json.ok) ok++; else if (["insufficient_stock", "sold_out"].includes(r.json.code ?? "")) rejected++; else unexpected++;
        })());
        await new Promise((r) => setTimeout(r, 100)); // 10 per second
      }
    }
    await Promise.all(burst);
    const db = JSON.parse(fs.readFileSync(srv.db, "utf8"));
    let oversold = false;
    for (const id of listingIds) {
      const l = db.listings.find((x: any) => x.id === id);
      const held = db.holds.filter((h: any) => h.listingId === id && h.status === "Active").reduce((s: number, h: any) => s + h.qty, 0);
      if (l.qtyAvailable < 0 || l.qtyAvailable + held !== l.qtyTotal) oversold = true;
    }
    results.reservations = { attempts: 100, ratePerSecond: 10, wallMs: Date.now() - t1, accepted: ok, rejectedForStock: rejected, unexpectedErrors: unexpected, oversold, latencyMs: summary(resMs) };
    console.log("RESERVATIONS", results.reservations);
    if (oversold) fail("a listing was oversold");
    if (unexpected > 0) fail(`${unexpected} unexpected reservation errors`);
    if (results.reservations.latencyMs.p95 > results.targets.reservationP95Ms) fail(`reservation p95 ${results.reservations.latencyMs.p95} ms is over ${results.targets.reservationP95Ms} ms`);

    // ---- 3. scheduled jobs: every write runs them first, so time writes while the store holds a lot
    const bulk = JSON.parse(fs.readFileSync(srv.db, "utf8"));
    const base0 = bulk.listings.length;
    // not editing the file under the running server: measure with what is there now (seed + the test data), then again after 100 more listings
    const timeWrites = async (label: string) => {
      const xs: number[] = [];
      for (let i = 0; i < 20; i++) { const s = performance.now(); await post("/api/demo", { action: "clock", minutes: 1 }, ravi); xs.push(performance.now() - s); }
      await post("/api/demo", { action: "clock", minutes: 0 }, ravi);
      return { label, listings: (JSON.parse(fs.readFileSync(srv.db, "utf8"))).listings.length, ...summary(xs) };
    };
    const before = await timeWrites("seed + load test data");
    for (let i = 0; i < 100; i++) await post("/api/vendor/listings", { title: `Bulk ${i}`, category: "Bakery", diet: "Vegetarian", originalPrice: 200, rescuePrice: 100, qty: 10, preparedAt: iso(Date.now() - 600_000), windowStart: iso(Date.now() + 300_000), windowEnd: iso(Date.now() + 3_900_000), donateRest: false, safetyDeclaration: true }, ravi);
    const after = await timeWrites("after 100 more listings");
    results.jobs = { writeWithJobsMs: [before, after], listingsAtStart: base0 };
    console.log("JOBS", results.jobs.writeWithJobsMs);
    if (after.p95 > 500) fail(`a write (which runs the scheduled jobs) took p95 ${after.p95} ms with ${after.listings} listings`);
  } finally { await srv.stop(); }
  fs.mkdirSync("test-results", { recursive: true });
  results.pass = !failed;
  fs.writeFileSync(path.join("test-results", "load-test.json"), JSON.stringify(results, null, 2));
  console.log(failed ? "\nLOAD TEST FAILED" : "\nLOAD TEST PASSED");
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
