/**
 * Route sweep: calls every API route as a visitor who is NOT signed in (and again as a customer where it matters) and fails if a
 * protected route answers 2xx or crashes (5xx). Routes that are public on purpose are listed below with the reason.
 *
 * Usage:  npm run build && npm run security:check
 * Writes test-results/security-check.json. Exits 1 on any unexpected answer.
 */
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./lib/browser-harness";

/** Public on purpose, with the protection each one relies on instead of a session. */
const PUBLIC: Record<string, string> = {
  "auth/demo": "demo sign-in (refused outside demo mode, checked separately)",
  "auth/skip": "demo skip (refused outside demo mode)",
  "auth/signup": "phone sign-up with a one-time code, rate limited",
  "auth/signout": "clears the caller's own cookie",
  "listings": "the public feed",
  "stream": "live stock counts of public listings",
  "suggested-discount": "pure price calculation, no data",
  "payments/webhook": "gateway callback, signature verified",
  "delivery/webhook": "delivery partner callback, HMAC signature verified",
  "verify/[id]": "public certificate verification page (totals only)",
  "volunteer/[token]": "unguessable link for a volunteer, expires",
  "follows:GET": "returns an empty list to visitors; signed-in callers get only their own follows",
};

function routes() {
  const out: { route: string; methods: string[] }[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "route.ts") {
        const src = fs.readFileSync(p, "utf8");
        const methods = [...src.matchAll(/export (?:async )?function (GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
        out.push({ route: path.relative("app/api", path.dirname(p)).replaceAll(path.sep, "/"), methods });
      }
    }
  };
  walk("app/api");
  return out.sort((a, b) => a.route.localeCompare(b.route));
}

async function main() {
  const srv = await startServer(3304, "security-check");
  const rows: { route: string; method: string; as: string; status: number; verdict: string }[] = [];
  let bad = 0;
  try {
    const call = async (route: string, method: string, cookie?: string) => {
      const url = `${srv.base}/api/${route.replace(/\[[^\]]+\]/g, "probe_id")}`;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: method === "GET" ? undefined : "{}", redirect: "manual" });
      await res.body?.cancel().catch(() => undefined); // the live stream never ends; the status line is all we need
      return res.status;
    };
    // anonymous sweep
    for (const { route, methods } of routes()) {
      for (const method of methods) {
        const status = await call(route, method);
        const isPublic = route in PUBLIC || `${route}:${method}` in PUBLIC;
        let verdict = "ok";
        if (status >= 500) verdict = "CRASH";
        else if (!isPublic && status >= 200 && status < 300) verdict = "OPEN (answered 2xx without a session)";
        if (verdict !== "ok") bad++;
        rows.push({ route, method, as: "nobody", status, verdict });
      }
    }
    // a write that arrives from another website must be refused, even with a valid session
    const login0 = await fetch(srv.base + "/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "u_priya" }) });
    const cookie0 = (login0.headers.get("set-cookie") || "").match(/sap_session=[^;]+/)![0];
    for (const [route, method] of [["reservations", "POST"], ["follows", "DELETE"], ["auth/signout", "POST"]]) {
      const res = await fetch(`${srv.base}/api/${route}`, { method, headers: { "Content-Type": "application/json", Cookie: cookie0, Origin: "https://evil.example" }, body: "{}" });
      await res.arrayBuffer().catch(() => undefined);
      const verdict = res.status === 403 ? "ok" : `ACCEPTED A CROSS-SITE WRITE (status ${res.status})`;
      if (verdict !== "ok") bad++;
      rows.push({ route, method, as: "customer, from another website", status: res.status, verdict });
    }
    // a customer must not reach vendor, NGO or admin routes
    const login = await fetch(srv.base + "/api/auth/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "u_priya" }) });
    const cookie = (login.headers.get("set-cookie") || "").match(/sap_session=[^;]+/)![0];
    for (const { route, methods } of routes()) {
      if (!/^(admin|vendor|ngo)\//.test(route)) continue;
      for (const method of methods) {
        const status = await call(route, method, cookie);
        let verdict = "ok";
        if (status >= 500) verdict = "CRASH";
        else if (status >= 200 && status < 300) verdict = "OPEN (a customer got 2xx on a staff route)";
        if (verdict !== "ok") bad++;
        rows.push({ route, method, as: "customer", status, verdict });
      }
    }
  } finally { await srv.stop(); }

  // outside demo mode (DATA_MODE=production) every demo shortcut must be refused, with or without a session
  const prod = await startServer(3305, "security-check-prod", { DATA_MODE: "production" });
  try {
    const post = async (p: string, data: unknown, cookie?: string) => {
      const res = await fetch(`${prod.base}${p}`, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(data) });
      await res.arrayBuffer().catch(() => undefined);
      return res;
    };
    const signup = await post("/api/auth/signup", { name: "Prod Tester", phone: "+919876500001", otp: "123456", role: "customer" });
    const cookie = (signup.headers.get("set-cookie") || "").match(/sap_session=[^;]+/)?.[0];
    const shortcuts: [string, unknown, string | undefined][] = [
      ["/api/auth/demo", { userId: "u_admin" }, undefined], ["/api/auth/skip", { role: "vendor" }, undefined],
      ["/api/demo", { action: "clock", minutes: 60 }, cookie], ["/api/demo", { action: "reset" }, cookie],
      ["/api/checkout/probe_id/demo-pay", { outcome: "success" }, cookie],
    ];
    for (const [p, data, c] of shortcuts) {
      const res = await post(p, data, c);
      const verdict = res.status === 403 ? "ok" : `NOT REFUSED (status ${res.status})`;
      if (verdict !== "ok") bad++;
      rows.push({ route: p.replace("/api/", ""), method: "POST", as: "production mode", status: res.status, verdict });
    }
  } finally { await prod.stop(); }
  fs.mkdirSync("test-results", { recursive: true });
  fs.writeFileSync(path.join("test-results", "security-check.json"), JSON.stringify({ ranAt: new Date().toISOString(), checked: rows.length, problems: bad, rows }, null, 2));
  for (const r of rows.filter((x) => x.verdict !== "ok")) console.log(`${r.verdict}: ${r.method} /api/${r.route} as ${r.as} -> ${r.status}`);
  console.log(`\n${rows.length} route calls checked: ${bad ? `${bad} problem(s)` : "every protected route refused a visitor without the right session"}`);
  process.exit(bad ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
