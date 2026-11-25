/**
 * Shared helpers for the browser-driven scripts (i18n scan, accessibility audit): start a real `next start` server on its own
 * demo database, open headless Google Chrome, sign in as demo personas, and list the screens each persona can see.
 * Needs a production build (`npm run build`) and Google Chrome installed (CHROME_CHANNEL=msedge to use Edge).
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type BrowserContext } from "playwright-core";

export interface Harness { base: string; db: string; browser: Browser; stop: () => Promise<void>; newContext: (locale: string, persona?: string) => Promise<BrowserContext> }

export const PERSONAS: Record<string, string> = { customer: "u_priya", vendor: "u_ravi", ngo: "u_joseph", admin: "u_admin" };

/** The screens worth checking for each kind of visitor. Ids are the stable ones from the demo seed. */
export const SCREENS: Record<string, string[]> = {
  public: ["/", "/signin", "/signin?all=1", "/signin?role=customer", "/signin?role=vendor", "/signin?role=ngo"],
  customer: ["/c", "/c/listing/l_2", "/c/orders", "/c/orders/r_5", "/c/impact", "/c/referrals", "/c/following"],
  vendor: ["/v", "/v/new", "/v/analytics", "/v/payouts", "/v/receipts", "/v/team", "/v/scan", "/v/listings/l_2"],
  ngo: ["/n", "/n/receipts"],
  admin: ["/admin", "/admin/approvals", "/admin/reports", "/admin/flagged", "/admin/moderation", "/admin/settings"],
};

export async function startHarness(port: number, name: string): Promise<Harness> {
  const base = `http://127.0.0.1:${port}`;
  const db = path.resolve(`data/${name}-db.json`);
  if (fs.existsSync(db)) fs.rmSync(db);
  const server: ChildProcess = spawn("npx", ["next", "start", "-p", String(port)], {
    env: { ...process.env, DEMO_DB_PATH: db, DATA_MODE: "demo", SESSION_SECRET: `${name}-secret-0123456789`, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stderr?.on("data", (d) => process.stderr.write(`[server] ${d}`));
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(base + "/api/listings")).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
    if (i === 79) throw new Error("server did not start");
  }
  const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || "chrome", headless: true });
  return {
    base, db, browser,
    newContext: async (locale, persona) => {
      const ctx = await browser.newContext({ locale: locale === "en" ? "en-IN" : locale, viewport: { width: 1100, height: 900 } });
      await ctx.addCookies([{ name: "sap_lang", value: locale, url: base }]);
      if (persona) {
        const r = await ctx.request.post(base + "/api/auth/demo", { data: { userId: PERSONAS[persona] } });
        if (!(await r.json()).ok) throw new Error(`sign-in as ${persona} failed`);
      }
      return ctx;
    },
    stop: async () => {
      await browser.close().catch(() => undefined);
      server.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 400));
      if (fs.existsSync(db)) fs.rmSync(db);
    },
  };
}
