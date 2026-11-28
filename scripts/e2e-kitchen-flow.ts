/**
 * End-to-end check of the TEST-BUILD restaurant flow (the demo owner with Paris Panini, Smash Guys and The Pizza Bakery), in real Chrome against a production build:
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
    // the restaurant owner is the ONLY demo vendor: no Ravi, Anita, Kabir, Mala, Imran or Latha to pick, and the vendor Skip button signs in as him
    {
      const pc = await browser.newContext({ viewport: { width: 1200, height: 900 }, locale: "en-IN" }); const pp = await pc.newPage();
      await pp.goto(srv.base + "/signin"); await pp.getByRole("button", { name: /Abhijit/ }).first().waitFor({ timeout: 15000 });
      const text = await pp.locator("main").innerText();
      ok(/Abhijit "AB" Gupta/.test(text), "the demo accounts list has the restaurant owner, Abhijit \"AB\" Gupta");
      ok(!/Ravi|Anita|Kabir|Mala|Imran|Latha/.test(text), "...and none of the other demo vendors (Ravi, Anita, Kabir, Mala, Imran, Latha)");
      const refused = await pc.request.post(srv.base + "/api/auth/demo", { data: { userId: "u_ravi" } }); ok(refused.status() === 404, "signing in as another demo vendor is refused");
      await pp.goto(srv.base + "/signin?role=vendor"); await pp.getByRole("button", { name: /Skip, use demo vendor/ }).click(); await pp.waitForURL(/\/v\/outlets$/, { timeout: 20000 });
      ok(((await pp.locator("h1").first().innerText()).trim()) === 'Abhijit "AB" Gupta', "the vendor Skip button signs in as Abhijit \"AB\" Gupta and lands on his page");
      await pc.close();
    }
    const { c: vc, home } = await mk("u_paris");
    ok(home === "/v/outlets", "signing in as the restaurant lands on the outlet page");
    const v = await vc.newPage(); v.on("dialog", (d) => d.accept());
    await v.goto(srv.base + "/v/outlets");
    // the first page: the owner's name, Live orders high up with a line under it, then the restaurants one below the other
    ok(((await v.locator("h1").first().innerText()).trim()) === 'Abhijit "AB" Gupta', "the page has the owner's name on top: Abhijit \"AB\" Gupta");
    const live = v.getByRole("link", { name: /Live orders/ }).first(); ok(await live.isVisible(), "the page has a Live orders button");
    ok((await v.getByRole("link", { name: /Scan/ }).count()) === 0, "...and only that one button: no separate scan section");
    const box = async (loc: ReturnType<typeof v.locator>) => (await loc.boundingBox())!;
    const names = ["Paris Panini", "Smash Guys", "The Pizza Bakery"]; const sec = (n: string) => v.locator(`section[aria-label="${n}"]`);
    for (const n of names) ok(await sec(n).isVisible(), `restaurant box: ${n}`);
    const ys = await Promise.all(names.map(async (n) => (await box(sec(n))).y)), xs = await Promise.all(names.map(async (n) => Math.round((await box(sec(n))).x)));
    ok(ys[0] < ys[1] && ys[1] < ys[2] && new Set(xs).size === 1, "the restaurants are stacked one below the other, in order");
    const hr = await box(v.locator("main hr").first()); const lb = await box(live);
    ok(lb.y + lb.height <= hr.y && hr.y < ys[0], "Live orders sits high, with a line under it, above the restaurants");
    // two restaurants have their own look (each box wears its OWN look); the page itself and The Pizza Bakery stay in the website's look
    ok((await v.locator(".k-root").count()) === 2, "only two boxes wear a restaurant look (Paris Panini and Smash Guys); the page itself is the website's");
    ok(await sec("Paris Panini").evaluate((e) => e.classList.contains("k-root")) && await sec("Smash Guys").evaluate((e) => e.classList.contains("k-root")) && !(await sec("The Pizza Bakery").evaluate((e) => e.classList.contains("k-root"))), "...Paris Panini and Smash Guys have it, The Pizza Bakery does not");
    const face = (n: string) => sec(n).locator("h3").evaluate((e) => ({ font: getComputedStyle(e).fontFamily, bg: getComputedStyle(e.closest("section")!).backgroundColor + "|" + getComputedStyle(e.closest("section")!).backgroundImage.slice(0, 40), caps: getComputedStyle(e).textTransform }));
    const fp = await face("Paris Panini"), fs = await face("Smash Guys");
    ok(/Abril Fatface/.test(fp.font) && /Anton/.test(fs.font) && !/Anton/.test(fp.font) && !/Abril/.test(fs.font), `each box has its own lettering (Paris: ${fp.font.split(",")[0]}, Smash Guys: ${fs.font.split(",")[0]})`);
    ok(fp.bg !== fs.bg && fs.caps === "uppercase", "...and its own colours (Smash Guys is yellow diamonds with black capitals, Paris Panini is navy)");
    ok((await sec("Paris Panini").getByRole("link", { name: /Enter kitchen/ }).count()) === 2, "Paris Panini has its two outlets with Enter kitchen");
    ok((await sec("Smash Guys").getByRole("link", { name: /Enter kitchen/ }).count()) === 2, "Smash Guys has its two outlets (Indiranagar and HSR Layout) with Enter kitchen");
    ok((await sec("Smash Guys").getByText("Indiranagar").count()) >= 1 && (await sec("Smash Guys").getByText("HSR Layout").count()) >= 1, "...named Indiranagar and HSR Layout, as on its menu");
    ok((await sec("The Pizza Bakery").getByText("Kitchen coming soon").count()) === 2 && (await sec("The Pizza Bakery").getByRole("link", { name: /Enter kitchen/ }).count()) === 0, "The Pizza Bakery: two outlets, plain, kitchen coming soon");
    // add an outlet to one restaurant, and a whole new restaurant
    await sec("Smash Guys").getByRole("button", { name: "Add an outlet" }).click();
    await v.getByLabel("Outlet name").fill("Bellandur"); await v.getByLabel("Address").fill("Ecoworld, Bellandur, Bengaluru (demo)"); await v.getByRole("button", { name: "Add this outlet" }).click();
    await sec("Smash Guys").getByRole("link", { name: /Enter kitchen/ }).nth(2).waitFor({ timeout: 15000 }); ok(true, "Add an outlet puts a third outlet inside the Smash Guys box (with the Smash Guys look and a kitchen)");
    await v.getByRole("button", { name: "Add a restaurant" }).click();
    await v.getByLabel("Restaurant name").fill("Test Burrito"); await v.getByLabel("Outlet name").fill("Koramangala"); await v.getByLabel("Address").fill("80 Feet Road, Koramangala, Bengaluru (demo)"); await v.getByRole("button", { name: "Add this restaurant" }).click();
    await sec("Test Burrito").waitFor({ timeout: 15000 }); ok(true, "Add a restaurant creates a new box (plain, with its first outlet)");
    await v.goto(srv.base + "/v/kitchen?outlet=o_pita_1&door=1"); await v.waitForURL(/\/v\/outlets$/, { timeout: 15000 }); ok(true, "a restaurant with no look yet has no kitchen: its link returns to the restaurants page");

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
    await v.goto(srv.base + "/v"); await v.getByRole("link", { name: "Back to restaurants (test)" }).click(); await v.waitForURL(/\/v\/outlets$/); ok(true, "the dashboard has a way back to the restaurants page");

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
    // Smash Guys: its OWN shopfront and its OWN room (a straight diner with seven dishes), with the same rules as every kitchen
    {
      const kc = await browser.newContext({ viewport: { width: 1470, height: 956 }, locale: "en-IN" });
      await kc.request.post(srv.base + "/api/auth/demo", { data: { userId: "u_paris" } });
      const k = await kc.newPage(); const bad: string[] = []; k.on("pageerror", (e) => bad.push(String(e)));
      k.on("response", (r) => { if (r.status() >= 400 && /\/kitchen\//.test(r.url())) bad.push(`${r.status()} ${r.url()}`); });
      await k.goto(srv.base + "/v/kitchen?outlet=o_smash_1&door=1");
      await k.waitForSelector(".k-skip, [data-k-ui]", { timeout: 30000 });
      if (await k.locator(".k-skip").count()) {
        ok((await k.locator(".k-root").getAttribute("data-kt")) === "smash-guys", "the Smash Guys outlet opens the Smash Guys look (not Paris Panini's)");
        const door = await k.locator(".k-door img").evaluate((i) => ({ src: (i as HTMLImageElement).currentSrc, w: (i as HTMLImageElement).naturalWidth }));
        ok(/\/kitchen\/smash-guys\/facade/.test(door.src) && door.w > 500, `the door scene is Smash Guys' own shopfront (${door.src.split("/").slice(-2).join("/")}, ${door.w} px wide)`);
        await k.click(".k-skip"); await k.waitForFunction(`typeof window.__kitchen === "function"`, null, { timeout: 60000 }); await k.waitForTimeout(3500);
        ok((await k.locator("nav button").count()) === 7, "the diner has seven dishes");
        ok(await k.getByText("Indiranagar", { exact: true }).first().isVisible() && await k.locator("header b", { hasText: "Smash Guys" }).isVisible(), "the header says Smash Guys and the outlet, Indiranagar");
        const font = await k.locator("header b").evaluate((e) => getComputedStyle(e).fontFamily); ok(/Anton/.test(font), `Smash Guys' own lettering is used (${font.split(",")[0]})`);
        await k.locator("nav button").nth(6).click();                                   // the LAST dish must be reachable (the walk runs past it)
        const dlg = k.getByRole("dialog"); await dlg.waitFor({ timeout: 15000 });
        ok(/Mac & Cheese/i.test((await dlg.getAttribute("aria-label")) ?? ""), "the last dish (Mac & Cheese) opens from the dish dots");
        for (const q of ["12", "8", "12"]) { await dlg.getByRole("button", { name: q, exact: true }).click(); await k.waitForTimeout(600); }
        ok(/Mac & Cheese/i.test((await dlg.getAttribute("aria-label")) ?? "") && (await dlg.locator("input").inputValue()) === "12", "the quantity buttons stay on the same dish here too (12 of Mac & Cheese)");
        await dlg.getByRole("button", { name: "Add to cart" }).click(); await k.getByText(/12/).first().waitFor({ timeout: 5000 });
        await k.locator("nav button").nth(0).click(); const d2 = k.getByRole("dialog"); await d2.waitFor({ timeout: 15000 });
        ok(/OG Smash/i.test((await d2.getAttribute("aria-label")) ?? ""), "the first dish is OG Smash, a burger");
        ok(!/\b(shake|cola|mojito|coffee|matcha|juice)\b/i.test(await k.locator("nav").innerText() + (await k.locator("[data-k-ui]").allInnerTexts()).join(" ")), "no drinks anywhere on the counter");
        await k.keyboard.press("Escape");
        ok(await k.getByRole("link", { name: "Back to outlets" }).isVisible() && await k.getByRole("link", { name: /Live orders/ }).first().isVisible(), "Back to outlets and Live orders are there");
        ok(bad.length === 0, "no page errors and no missing Smash Guys pictures" + (bad.length ? ": " + bad.join("; ") : ""));
      } else console.log("skip  the 3D kitchen is not available in this browser, so the Smash Guys checks were skipped");
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

    // signing in from the demo accounts page replaces it in the history, so the browser's own Back button cannot return to it
    {
      const sc = await browser.newContext({ viewport: { width: 1200, height: 900 }, locale: "en-IN" }); const sp = await sc.newPage();
      await sp.goto(srv.base + "/signin"); await sp.getByRole("button", { name: /Abhijit/ }).first().click(); await sp.waitForURL(/\/v\/outlets$/, { timeout: 20000 });
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
