/**
 * End-to-end HTTP tests against a real `next start` server:
 *  1. 50 independent customers fire reservations in parallel at a fresh 10-unit listing.
 *  2. Realtime: two independent SSE sessions must receive the committed stock change in < 2 s.
 *  3. Selected negative checks over HTTP (role gating, wrong vendor scan).
 * Usage: npm run build && npx tsx scripts/http-tests.ts
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3100;
const BASE = `http://127.0.0.1:${PORT}`;
const DB = path.resolve("data/http-test-db.json");
const results: Record<string, unknown> = { startedAt: new Date().toISOString() };

function cookieFrom(res: Response) {
  const raw = res.headers.get("set-cookie") || "";
  const m = raw.match(/sap_session=[^;]+/);
  if (!m) throw new Error("no session cookie");
  return m[0];
}
async function post(p: string, body: unknown, cookie?: string) {
  const res = await fetch(BASE + p, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  return { res, json: (await res.json()) as { ok: boolean; data?: any; code?: string; error?: string } };
}
async function login(userId: string) {
  const { res, json } = await post("/api/auth/demo", { userId });
  if (!json.ok) throw new Error(json.error);
  return cookieFrom(res);
}
async function signup(i: number) {
  const { res, json } = await post("/api/auth/signup", { name: `HTTP Tester ${i}`, phone: `+9198${String(i).padStart(8, "0")}`, otp: "123456", role: "customer" });
  if (!json.ok) throw new Error(json.error);
  return cookieFrom(res);
}
async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + "/api/listings"); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}
function sse(cookie: string, onEvent: (e: any, at: number) => void) {
  const ctrl = new AbortController();
  const ready = (async () => {
    const res = await fetch(BASE + "/api/stream", { headers: { Cookie: cookie }, signal: ctrl.signal });
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let resolveFirst: () => void;
    const connected = new Promise<void>((r) => (resolveFirst = r));
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n\n")) >= 0) {
            const chunk = buf.slice(0, i);
            buf = buf.slice(i + 2);
            if (chunk.startsWith(": connected")) resolveFirst!();
            if (chunk.startsWith("data: ")) onEvent(JSON.parse(chunk.slice(6)), Date.now());
          }
        }
      } catch {}
    })();
    await connected;
  })();
  return { ready, close: () => ctrl.abort() };
}

async function main() {
  if (fs.existsSync(DB)) fs.rmSync(DB);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: { ...process.env, DEMO_DB_PATH: DB, DATA_MODE: "demo", SESSION_SECRET: "http-test-secret-0123456789", PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));
  try {
    await waitUp();
    const ravi = await login("u_ravi");
    const now = Date.now();
    const iso = (ms: number) => new Date(ms).toISOString();
    const create = await post("/api/vendor/listings", {
      title: "Concurrency Test Box", category: "Bakery", diet: "Vegetarian", originalPrice: 200, rescuePrice: 100, qty: 10,
      preparedAt: iso(now - 600_000), windowStart: iso(now + 300_000), windowEnd: iso(now + 3_900_000), donateRest: false, safetyDeclaration: true,
    }, ravi);
    if (!create.json.ok) throw new Error(`create failed: ${create.json.error}`);
    const listingId = create.json.data.id as string;

    // ---- 1. concurrency
    const cookies = await Promise.all(Array.from({ length: 50 }, (_, i) => signup(i)));
    const t0 = Date.now();
    const attempts = await Promise.all(cookies.map((c) => post("/api/reservations", { listingId, qty: 1, method: "pay_at_pickup" }, c)));
    const ok = attempts.filter((a) => a.json.ok).length;
    const failed = attempts.filter((a) => !a.json.ok);
    const db = JSON.parse(fs.readFileSync(DB, "utf8"));
    const listing = db.listings.find((l: any) => l.id === listingId);
    const resv = db.reservations.filter((r: any) => r.listingId === listingId);
    let running = 0, minRunning = Infinity;
    for (const m of db.inventory.filter((x: any) => x.listingId === listingId)) { running += m.delta; minRunning = Math.min(minRunning, running); }
    results.concurrency = {
      attempts: 50, succeeded: ok, failed: failed.length,
      failureCodes: failed.reduce((acc: Record<string, number>, f) => ((acc[f.json.code!] = (acc[f.json.code!] || 0) + 1), acc), {}),
      finalQtyAvailable: listing.qtyAvailable, listingStatus: listing.status, reservationsInDb: resv.length,
      unitsAllocated: resv.reduce((s: number, r: any) => s + r.qty, 0), minRunningStock: minRunning, durationMs: Date.now() - t0,
      pass: ok === 10 && failed.length === 40 && listing.qtyAvailable === 0 && resv.length === 10 && minRunning >= 0,
    };
    console.log("CONCURRENCY", results.concurrency);

    // ---- 2. realtime, two independent sessions (customer + vendor)
    const create2 = await post("/api/vendor/listings", {
      title: "Realtime Test Box", category: "Bakery", diet: "Vegetarian", originalPrice: 200, rescuePrice: 100, qty: 20,
      preparedAt: iso(now - 600_000), windowStart: iso(now + 300_000), windowEnd: iso(now + 3_900_000), donateRest: false, safetyDeclaration: true,
    }, ravi);
    const rtId = create2.json.data.id as string;
    const observer1 = await login("u_arjun");
    const samples: { session: string; latencyFromCommitMs: number; latencyFromRequestMs: number; qty: number }[] = [];
    let sentAt = 0;
    const mk = (name: string, c: string) => sse(c, (e, at) => {
      if (e.type === "listing" && e.listingId === rtId) samples.push({ session: name, latencyFromCommitMs: at - e.committedAt, latencyFromRequestMs: at - sentAt, qty: e.qtyAvailable });
    });
    const s1 = mk("customer-session", observer1);
    const s2 = mk("vendor-session", ravi);
    await Promise.all([s1.ready, s2.ready]);
    const buyers = cookies.slice(10, 15);
    for (const b of buyers) {
      sentAt = Date.now();
      const r = await post("/api/reservations", { listingId: rtId, qty: 1, method: "pay_at_pickup" }, b);
      if (!r.json.ok) throw new Error(r.json.error);
      await new Promise((r) => setTimeout(r, 300));
    }
    await new Promise((r) => setTimeout(r, 500));
    s1.close(); s2.close();
    const maxReq = Math.max(...samples.map((s) => s.latencyFromRequestMs));
    results.realtime = {
      sessions: 2, updatesSent: buyers.length, eventsReceived: samples.length, maxLatencyFromRequestMs: maxReq,
      maxLatencyFromCommitMs: Math.max(...samples.map((s) => s.latencyFromCommitMs)), finalCountSeen: samples.at(-1)?.qty, samples,
      pass: samples.length === buyers.length * 2 && maxReq < 2000,
    };
    console.log("REALTIME", { ...(results.realtime as object), samples: undefined });

    // ---- 3. HTTP negative checks
    const priya = await login("u_priya");
    const neg: Record<string, string | undefined> = {};
    neg.customerCreatesListing = (await post("/api/vendor/listings", { title: "x" }, priya)).json.code;
    neg.customerApproves = (await post("/api/admin/approve", { kind: "vendor", id: "v_3", status: "Approved" }, priya)).json.code;
    neg.unauthenticatedReserve = (await post("/api/reservations", { listingId: rtId, qty: 1, method: "pay_at_pickup" })).json.code;
    neg.sixUnits = (await post("/api/reservations", { listingId: rtId, qty: 6, method: "pay_at_pickup" }, cookies[20])).json.code;
    const pending = await login("u_vendor3");
    neg.pendingVendorPublish = (await post("/api/vendor/listings", { title: "Pending Test", category: "Bakery", diet: "Vegetarian", originalPrice: 200, rescuePrice: 100, qty: 3, preparedAt: iso(now), windowStart: iso(now + 600_000), windowEnd: iso(now + 3_600_000), donateRest: false, safetyDeclaration: true }, pending)).json.code;
    const vendor2 = await login("u_vendor2");
    neg.wrongVendorScan = (await post("/api/vendor/handover", { token: "sap:demo-token-r_1" }, vendor2)).json.code;
    const pendingNgo = await login("u_ngo4");
    const openBatch = db.donationBatches.find((b: any) => b.status === "Open");
    neg.pendingNgoClaim = (await post(`/api/ngo/batches/${openBatch.id}`, { action: "claim" }, pendingNgo)).json.code;
    neg.adminSelfSignup = (await post("/api/auth/signup", { name: "Mallory", phone: "+919811111111", otp: "123456", role: "admin" })).json.code;
    const ok1 = await post("/api/vendor/handover", { token: "sap:demo-token-r_1" }, ravi);
    neg.firstScanOk = ok1.json.ok ? "ok" : ok1.json.code;
    neg.reuseScan = (await post("/api/vendor/handover", { token: "sap:demo-token-r_1" }, ravi)).json.code;
    const expected: Record<string, string> = {
      customerCreatesListing: "forbidden", customerApproves: "forbidden", unauthenticatedReserve: "unauthenticated", sixUnits: "qty_cap",
      pendingVendorPublish: "approval_required", wrongVendorScan: "wrong_vendor", pendingNgoClaim: "approval_required", adminSelfSignup: "forbidden",
      firstScanOk: "ok", reuseScan: "code_used",
    };
    results.httpNegative = { observed: neg, expected, pass: Object.entries(expected).every(([k, v]) => neg[k] === v) };
    console.log("HTTP NEGATIVE", results.httpNegative);
  } finally {
    server.kill("SIGTERM");
    results.finishedAt = new Date().toISOString();
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync("test-results/http-tests.json", JSON.stringify(results, null, 2));
  }
  const all = ["concurrency", "realtime", "httpNegative"].every((k) => (results[k] as { pass?: boolean })?.pass);
  console.log(all ? "ALL HTTP TESTS PASSED" : "SOME HTTP TESTS FAILED");
  process.exit(all ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
