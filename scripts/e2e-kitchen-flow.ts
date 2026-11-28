/**
 * End-to-end check of the TEST-BUILD restaurant flow (Paris Panini demo account), in real Chrome against a production build:
 * the first page has one Live orders button that opens the ordinary Today dashboard (marketplace look: live orders, units left, scan and hand over); a listing made for an outlet is published; a customer's order
 * appears there; Mark ready works; the pickup code is accepted on the Scan & hand over page; the Back arrows go where they say.
 * Usage: npm run build && npx tsx scripts/e2e-kitchen-flow.ts
 */
import { chromium } from "playwright-core";
import { startServer } from "./lib/browser-harness";

const ok = (c: unknown, m: string) => { if (!c) throw new Error(m); console.log("PASS ", m); };
(async () => {
  const srv = await startServer(3303, "e2e-kitchen", { VERCEL_ENV: "preview" });
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
  try {
    const mk = async (uid: string) => { const c = await browser.newContext({ viewport: { width: 1200, height: 900 }, locale: "en-IN" }); const r = await c.request.post(srv.base + "/api/auth/demo", { data: { userId: uid } }); const j = await r.json(); if (!j.ok) throw new Error("sign-in " + uid); return { c, home: j.data?.home as string | undefined }; };
    const { c: vc, home } = await mk("u_paris");
    ok(home === "/v/outlets", "signing in as the restaurant lands on the outlet page");
    const v = await vc.newPage(); v.on("dialog", (d) => d.accept());
    await v.goto(srv.base + "/v/outlets");
    ok(await v.getByRole("link", { name: /Live orders/ }).first().isVisible(), "the outlet page has a Live orders button");
    ok((await v.getByRole("link", { name: /Scan/ }).count()) === 0, "...and only that one button: no separate scan section");

    const now = Date.now(), iso = (ms: number) => new Date(ms).toISOString();
    const mkl = await vc.request.post(srv.base + "/api/vendor/listings", { data: { title: "Laura panini", category: "Meals", diet: "Vegetarian", originalPrice: 300, rescuePrice: 150, qty: 8, outletId: "o_paris_1", preparedAt: iso(now - 600_000), windowStart: iso(now + 5 * 60_000), windowEnd: iso(now + 65 * 60_000), donateRest: false, safetyDeclaration: true } });
    const lj = await mkl.json(); ok(lj.ok, "a listing for the Indiranagar outlet is published: " + (lj.error ?? "ok"));

    const { c: cc } = await mk("u_priya"); const cp = await cc.newPage();
    await cp.goto(`${srv.base}/c/listing/${lj.data.id}`); await cp.getByRole("button", { name: /Reserve & pay/ }).click(); await cp.waitForURL(/\/c\/checkout\//);
    await cp.getByRole("button", { name: /Simulate successful payment/ }).click(); await cp.waitForURL(/\/c\/orders\/[\w-]+$/, { timeout: 20000 });
    const head = await cp.locator("main").innerText(); const code = (head.match(/\n(\d{4})\n/) || [])[1], ref = (head.match(/SAP-\d+/) || [])[0];
    ok(code && ref, `the customer has a pickup pass (${ref})`);

    await vc.request.post(srv.base + "/api/demo", { data: { action: "clock", minutes: 15 } });
    await v.getByRole("link", { name: /Live orders/ }).first().click(); await v.waitForURL(/\/v$/, { timeout: 15000 });
    ok(await v.getByRole("heading", { name: "Today" }).isVisible(), "Live orders opens the Today dashboard, in the website's own look (not the restaurant's)");
    ok((await v.locator(".k-root").count()) === 0, "...and nothing of the restaurant theme is on that page");
    await v.getByText(ref!).first().waitFor({ timeout: 15000 }); ok(true, "the customer's order is on the dashboard's Live orders");
    const card = v.locator("div.card", { hasText: ref! }).first(); await card.getByRole("button", { name: "Mark ready" }).click();
    await cp.getByText("READY FOR YOU").first().waitFor({ timeout: 15000 }); ok(true, "Mark ready works and the customer's pass switches to READY");

    await v.getByRole("link", { name: /Scan & hand over/ }).first().click(); await v.waitForURL(/\/v\/scan/);
    await v.getByLabel("4-digit pickup code").fill(code!); await v.getByRole("button", { name: "Verify & hand over" }).click();
    await v.getByText(/VERIFIED/).first().waitFor({ timeout: 15000 }); ok(true, "the pickup code is accepted on the Scan & hand over page");
    await v.goto(srv.base + "/v"); await v.getByRole("link", { name: "Back to outlets (test)" }).click(); await v.waitForURL(/\/v\/outlets$/); ok(true, "the dashboard has a way back to the outlet page");

    // the quantity buttons (4 / 8 / 12) must change the quantity of THIS dish, not jump to the next one (taps used to reach the plate behind the card)
    {
      const kc = await browser.newContext({ viewport: { width: 1470, height: 956 }, locale: "en-IN" });
      await kc.request.post(srv.base + "/api/auth/demo", { data: { userId: "u_paris" } });
      const k = await kc.newPage(); await k.goto(srv.base + "/v/kitchen?outlet=o_paris_1&door=1");
      await k.waitForSelector(".k-skip, [data-k-ui]", { timeout: 30000 });
      if (await k.locator(".k-skip").count()) {
        await k.click(".k-skip"); await k.waitForFunction(`typeof window.__kitchen === "function"`, null, { timeout: 60000 }); await k.waitForTimeout(3500);
        const tag = k.locator(".k-tag button").first(); await tag.click();
        const dlg = k.getByRole("dialog"); await dlg.waitFor({ timeout: 10000 });
        const first = await dlg.getAttribute("aria-label");
        for (const q of ["12", "8", "12"]) { await dlg.getByRole("button", { name: q, exact: true }).click(); await k.waitForTimeout(700); }
        ok((await dlg.getAttribute("aria-label")) === first, `the quantity buttons stay on the same dish (${first})`);
        ok((await dlg.locator("input").inputValue()) === "12", "and the quantity really is 12");
        await dlg.getByRole("button", { name: "Add to cart" }).click(); await k.getByText(/12/).first().waitFor({ timeout: 5000 }); ok(true, "Add to cart keeps the quantity");
      } else console.log("skip  the 3D kitchen is not available in this browser, so the quantity-button check was skipped");
      await kc.close();
    }
    // the door scene (the restaurant "animation") has its own Back arrow, and so does the kitchen
    await v.goto(srv.base + "/v/kitchen?outlet=o_paris_1&door=1"); await v.waitForSelector(".k-skip, [data-k-ui]", { timeout: 30000 });
    if (await v.locator(".k-skip").count()) {
      ok(await v.getByRole("link", { name: "Back to outlets" }).isVisible(), "the door scene has a Back arrow");
      await v.getByRole("link", { name: "Back to outlets" }).click(); await v.waitForURL(/\/v\/outlets$/); ok(true, "...and it goes to the outlet page");
      await v.goto(srv.base + "/v/kitchen?outlet=o_paris_1&door=1"); await v.waitForSelector(".k-skip"); await v.click(".k-skip");
    }
    await v.getByRole("link", { name: "Back to outlets" }).click(); await v.waitForURL(/\/v\/outlets$/); ok(true, "the Back arrow in the kitchen goes to the outlet page");
    ok((await v.getByRole("link", { name: /Back to/ }).count()) === 0, "the outlet page itself has no Back arrow that could land on the demo accounts");
    await v.getByRole("button", { name: "Switch restaurant account" }).click(); await v.waitForURL(/\/signin/, { timeout: 15000 }); ok(true, "Switch restaurant account signs out and shows the demo accounts");
    const after = await vc.request.get(srv.base + "/v/outlets", { maxRedirects: 0 }); ok(after.status() === 307, "after switching, the outlet page needs a new sign-in");

    // signing in from the demo accounts page replaces it in the history, so the browser's own Back button cannot return to it
    {
      const sc = await browser.newContext({ viewport: { width: 1200, height: 900 }, locale: "en-IN" }); const sp = await sc.newPage();
      await sp.goto(srv.base + "/signin"); await sp.getByRole("button", { name: /Marc/ }).first().click(); await sp.waitForURL(/\/v\/outlets$/, { timeout: 20000 });
      await sp.goBack(); await sp.waitForTimeout(800); ok(!/\/signin/.test(sp.url()), `the browser Back button does not return to the demo accounts page (it went to ${new URL(sp.url()).pathname})`);
      await sc.close();
    }

    // the logo goes to the main screen WITHOUT replaying the opening or whirling animation, even in a brand-new tab
    {
      const lc = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "en-IN" });
      await lc.request.post(srv.base + "/api/auth/demo", { data: { userId: "u_priya" } });
      const lp = await lc.newPage(); await lp.goto(srv.base + "/c"); await lp.waitForSelector("header a[href='/']");
      await lp.locator("header a[href='/']").first().click(); await lp.waitForURL(srv.base + "/");
      await lp.waitForTimeout(250);
      const st = await lp.evaluate(`(function(){ var i = document.querySelector(".intro-root"); var p = document.querySelector(".plate-wrap"); var h = document.querySelector(".hero-fade"); return { intro: !!i && getComputedStyle(i).display !== "none", plateOpacity: p ? getComputedStyle(p).opacity : null, plateTransform: p ? (p.style.transform || "") : null, heroOpacity: h ? getComputedStyle(h).opacity : null }; })()`) as { intro: boolean; plateOpacity: string | null; plateTransform: string | null; heroOpacity: string | null };
      ok(!st.intro, "no opening animation after the logo, even in a new tab");
      ok(st.plateOpacity === "1" && st.heroOpacity === "1" && !/rotate/.test(st.plateTransform ?? ""), `the main screen is simply there (plate opacity ${st.plateOpacity}, headline opacity ${st.heroOpacity}, no whirl)`);
      const h1 = lp.locator("h1").first(); ok((await h1.isVisible()) && /surplus/i.test(await h1.innerText()) && /dinner/i.test(await h1.innerText()), "and it shows the headline (Tonight's surplus, someone's dinner)");
      await lc.close();
    }
    console.log("\nall steps passed");
  } finally { await browser.close(); await srv.stop(); }
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
