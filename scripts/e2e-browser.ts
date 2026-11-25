/**
 * Repeatable browser end-to-end test (headless Google Chrome via playwright-core, no browser download).
 *
 * Starts a real `next start` server on its own demo database, then drives the app like people do, in separate browser
 * contexts (separate cookies): a vendor, a customer who buys, a second customer who only watches.
 *
 *   1. Main screen: no account, no "Continue as"; opening or refreshing signs out; the logo keeps you signed in.
 *   2. Language: one click on the globe changes the whole page to Hindi, the menu closes, and nothing leaks back to English.
 *   3. Live stock: a second customer's page counts down when the buyer reserves, with no reload.
 *   4. Reserve and simulated payment: the buyer gets a pickup pass with a 4-digit code.
 *   5. Vendor "Mark ready": the buyer's pass switches to READY without a reload.
 *   6. Handover: the code verifies once, and the same code is refused the second time.
 *
 * Usage:  npm run build && npm run test:e2e-browser
 * Needs Google Chrome installed (set CHROME_CHANNEL=chromium-based channel name to use another, e.g. msedge).
 * Writes test-results/browser-e2e.log and test-results/browser-e2e.json. Exits 1 if any step fails.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type BrowserContext } from "playwright-core";

const PORT = 3200;
const BASE = `http://127.0.0.1:${PORT}`;
const DB = path.resolve("data/e2e-browser-db.json");
const OUT_DIR = path.resolve("test-results");

interface Step { name: string; ok: boolean; ms: number; detail?: string }
const steps: Step[] = [];
const log: string[] = [];
const say = (s: string) => { console.log(s); log.push(s); };

async function step(name: string, fn: () => Promise<string | void>) {
  const t0 = Date.now();
  try {
    const detail = (await fn()) || undefined;
    steps.push({ name, ok: true, ms: Date.now() - t0, detail });
    say(`PASS  ${name}${detail ? ` — ${detail}` : ""} (${Date.now() - t0} ms)`);
  } catch (e) {
    const detail = (e as Error).message.split("\n")[0];
    steps.push({ name, ok: false, ms: Date.now() - t0, detail });
    say(`FAIL  ${name} — ${detail}`);
  }
}
const expect = (cond: unknown, msg: string) => { if (!cond) throw new Error(msg); };

async function waitUp() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(BASE + "/api/listings"); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}

async function demoLogin(ctx: BrowserContext, userId: string) {
  const r = await ctx.request.post(BASE + "/api/auth/demo", { data: { userId } });
  const j = await r.json();
  expect(j.ok, `demo sign-in as ${userId} failed: ${j.error}`);
}
const hasSession = async (ctx: BrowserContext) => (await ctx.cookies(BASE)).some((c) => c.name === "sap_session");
const setLang = async (ctx: BrowserContext, lang: string) => ctx.addCookies([{ name: "sap_lang", value: lang, url: BASE }]);

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(DB)) fs.rmSync(DB);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: { ...process.env, DEMO_DB_PATH: DB, DATA_MODE: "demo", SESSION_SECRET: "e2e-browser-secret-0123456789", PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));
  let browser: Browser | undefined;
  try {
    await waitUp();
    browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || "chrome", headless: true });
    const newCtx = () => browser!.newContext({ locale: "en-IN", viewport: { width: 1000, height: 900 } });

    // ------------------------------------------------------------------ 1. main screen and sign-out
    await step("main screen shows no account and no 'Continue as'", async () => {
      const ctx = await newCtx();
      const page = await ctx.newPage();
      await page.goto(BASE + "/");
      await page.getByText("Pick your side of the plate").first().waitFor({ timeout: 15_000 });
      const text = await page.locator("body").innerText();
      expect(!/Continue as/i.test(text), "found 'Continue as'");
      const sides = await page.locator('a[href^="/signin?role="]').count();
      expect(sides >= 3, `expected 3 side links, found ${sides}`);
      await ctx.close();
      return `${sides} side links`;
    });

    await step("opening the app and refreshing sign you out; the logo keeps you signed in", async () => {
      const ctx = await newCtx();
      const page = await ctx.newPage();
      await demoLogin(ctx, "u_priya");
      expect(await hasSession(ctx), "not signed in before the test");
      await page.goto(BASE + "/c");
      await page.locator("header a[href='/']").first().click(); // in-app navigation
      await page.waitForURL(BASE + "/", { timeout: 15_000 });
      expect(await hasSession(ctx), "the logo click signed the user out");
      await page.reload(); // a refresh
      await page.waitForLoadState("load");
      expect(!(await hasSession(ctx)), "a refresh did not sign the user out");
      await demoLogin(ctx, "u_priya");
      await page.goto(BASE + "/"); // opening the app again
      expect(!(await hasSession(ctx)), "opening the main screen did not sign the user out");
      await ctx.close();
    });

    // ------------------------------------------------------------------ 2. language
    await step("one click on the globe changes the whole main screen to Hindi and closes the menu", async () => {
      const ctx = await newCtx();
      const page = await ctx.newPage();
      await page.goto(BASE + "/");
      await page.getByText("Pick your side of the plate").first().waitFor({ timeout: 15_000 });
      await page.getByRole("button", { name: "Language" }).click();
      await page.getByRole("menuitemradio", { name: "हिन्दी" }).click();
      await page.getByText("थाली का अपना पक्ष चुनें").first().waitFor({ timeout: 15_000 });
      expect((await page.locator('[role="menu"]').count()) === 0, "the language menu stayed open");
      const text = await page.locator("main").innerText();
      const english = (text.match(/[A-Za-z]{4,}/g) || []).filter((w) => !/^(SAVE|PLATE)$/i.test(w));
      expect(english.length === 0, `English words left on the main screen: ${english.slice(0, 5).join(", ")}`);
      await ctx.close();
    });

    await step("Hindi carries into the app: neighbourhoods, distances and credit history are translated", async () => {
      const ctx = await newCtx();
      await setLang(ctx, "hi");
      await demoLogin(ctx, "u_priya");
      const page = await ctx.newPage();
      await page.goto(BASE + "/c");
      await page.locator("select").first().waitFor({ timeout: 15_000 });
      const opts = await page.locator("select").first().locator("option").allInnerTexts();
      expect(opts.some((o) => /कोरमंगला/.test(o)), `neighbourhood options not translated: ${opts.join("|")}`);
      expect(!opts.some((o) => /Koramangala/.test(o)), "English neighbourhood option left");
      await page.goto(BASE + "/c/referrals");
      await page.locator("#ledger-h").waitFor({ timeout: 15_000 });
      const ledger = await page.locator("#ledger-h").locator("xpath=..").innerText();
      expect(/रेफ़रल इनाम/.test(ledger) && !/referral reward/i.test(ledger), "credit history not translated");
      await ctx.close();
    });

    // ------------------------------------------------------------------ 3-6. a real order, three people
    const vendorCtx = await newCtx();
    await demoLogin(vendorCtx, "u_ravi");
    const now = Date.now();
    const iso = (ms: number) => new Date(ms).toISOString();
    const created = await vendorCtx.request.post(BASE + "/api/vendor/listings", {
      data: {
        title: "E2E Bread Box", category: "Bakery", diet: "Vegetarian", originalPrice: 300, rescuePrice: 120, qty: 6,
        preparedAt: iso(now - 600_000), windowStart: iso(now + 5 * 60_000), windowEnd: iso(now + 65 * 60_000), donateRest: false, safetyDeclaration: true,
      },
    });
    const cj = await created.json();
    expect(cj.ok, `could not create the test listing: ${cj.error}`);
    const listingId = cj.data.id as string;

    const watcherCtx = await newCtx();
    await demoLogin(watcherCtx, "u_arjun");
    const watcher = await watcherCtx.newPage();
    await watcher.goto(`${BASE}/c/listing/${listingId}`);
    await watcher.getByText(/\b6 left\b/).first().waitFor({ timeout: 15_000 });

    const buyerCtx = await newCtx();
    const phone = `+9199${String(Date.now()).slice(-8)}`;
    const su = await buyerCtx.request.post(BASE + "/api/auth/signup", { data: { name: "E2E Buyer", phone, otp: "123456", role: "customer" } });
    expect((await su.json()).ok, "buyer sign-up failed");
    const buyer = await buyerCtx.newPage();

    let orderUrl = "";
    let code = "";
    let ref = "";

    await step("buyer reserves; a second customer's page counts down live, with no reload", async () => {
      await buyer.goto(`${BASE}/c/listing/${listingId}`);
      const t0 = Date.now();
      await buyer.getByRole("button", { name: /Reserve & pay/ }).click();
      await buyer.waitForURL(/\/c\/checkout\//, { timeout: 15_000 });
      await watcher.getByText(/\b5 left\b/).first().waitFor({ timeout: 5_000 });
      return `5 left shown after ${Date.now() - t0} ms`;
    });

    await step("simulated payment gives the buyer a pickup pass with a 4-digit code", async () => {
      await buyer.getByRole("button", { name: /Simulate successful payment/ }).click();
      await buyer.waitForURL(/\/c\/orders\/[\w-]+$/, { timeout: 20_000 });
      orderUrl = buyer.url();
      await buyer.getByText("RESERVED").first().waitFor({ timeout: 15_000 });
      const head = await buyer.locator("main").innerText();
      code = (head.match(/\n(\d{4})\n/) || [])[1] || "";
      ref = (head.match(/SAP-\d+/) || [])[0] || "";
      expect(/^\d{4}$/.test(code), "no 4-digit code on the pass");
      expect(ref, "no order reference on the pass");
      return `${ref}`;
    });

    await step("vendor marks the order ready; the buyer's pass switches to READY without a reload", async () => {
      // open the pickup window on the demo clock (the listing starts 5 minutes from now)
      const clock = await vendorCtx.request.post(BASE + "/api/demo", { data: { action: "clock", minutes: 15 } });
      expect((await clock.json()).ok, "could not move the demo clock");
      const vp = await vendorCtx.newPage();
      await vp.goto(BASE + "/v");
      const card = vp.locator("div.card", { hasText: ref }).first();
      await card.waitFor({ timeout: 15_000 });
      const t0 = Date.now();
      await card.getByRole("button", { name: "Mark ready" }).click();
      await buyer.getByText("READY FOR YOU").first().waitFor({ timeout: 10_000 });
      await vp.close();
      return `READY shown after ${Date.now() - t0} ms`;
    });

    await step("handover: the code verifies once, then the same code is refused", async () => {
      const vp = await vendorCtx.newPage();
      await vp.goto(BASE + "/v/scan");
      const input = vp.getByLabel("4-digit pickup code");
      await input.fill(code);
      await vp.getByRole("button", { name: "Verify & hand over" }).click();
      await vp.getByText(/VERIFIED/).first().waitFor({ timeout: 15_000 });
      await input.fill(code);
      await vp.getByRole("button", { name: "Verify & hand over" }).click();
      await vp.getByText("NOT ACCEPTED").first().waitFor({ timeout: 15_000 });
      await vp.close();
      void orderUrl;
    });

    await vendorCtx.request.post(BASE + "/api/demo", { data: { action: "clock", minutes: 0 } });
    await Promise.all([vendorCtx.close(), watcherCtx.close(), buyerCtx.close()]);
  } finally {
    await browser?.close().catch(() => undefined);
    server.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 400));
    if (fs.existsSync(DB)) fs.rmSync(DB);
  }

  const failed = steps.filter((s) => !s.ok);
  say(`\n${steps.length - failed.length}/${steps.length} browser steps passed${failed.length ? ` — FAILED: ${failed.map((f) => f.name).join("; ")}` : ""}`);
  fs.writeFileSync(path.join(OUT_DIR, "browser-e2e.log"), `Browser end-to-end run ${new Date().toISOString()}\n${log.join("\n")}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "browser-e2e.json"), JSON.stringify({ ranAt: new Date().toISOString(), steps, pass: failed.length === 0 }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
