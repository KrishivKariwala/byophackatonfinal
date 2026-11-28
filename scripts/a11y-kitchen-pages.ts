/**
 * Accessibility check (axe-core, WCAG A/AA) of the TEST-BUILD-ONLY restaurant pages (the outlet chooser, and each restaurant's door, kitchen list and
 * kitchen with a dish open: Paris Panini and Smash Guys), in English, Hindi and Kannada. These pages do not exist on the live site, so the normal audit (npm run a11y:audit) cannot reach them.
 * Usage: npm run build && npx tsx scripts/a11y-kitchen-pages.ts
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import { startServer } from "./lib/browser-harness";

const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
(async () => {
  const srv = await startServer(3302, "a11y-kitchen", { VERCEL_ENV: "preview" });
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
  let blocking = 0, other = 0, n = 0;
  try {
    for (const locale of ["en", "hi", "kn"]) {
      const ctx = await browser.newContext({ locale: locale === "en" ? "en-IN" : locale, viewport: { width: 1100, height: 900 } });
      await ctx.addCookies([{ name: "sap_lang", value: locale, url: srv.base }]);
      const r = await ctx.request.post(srv.base + "/api/auth/demo", { data: { userId: "u_paris" } });
      if (!(await r.json()).ok) throw new Error("sign-in failed");
      const page = await ctx.newPage();
      const axe = async (label: string) => {
        await page.addScriptTag({ content: AXE });
        const res: { id: string; impact: string; help: string; nodes: unknown[]; detail: string }[] = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa"] } }).then(function(r){ return r.violations.map(function(v){ return { id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, detail: v.nodes.map(function(x){ return x.target.join(' ') + ' => ' + (x.any[0] && x.any[0].message || ''); }).join(' | ') }; }); })`);
        n++;
        for (const v of res) { console.log(`${locale} ${label}: ${v.impact} ${v.id} (${v.nodes} nodes) ${v.help}\n     ${v.detail}`); if (v.impact === "serious" || v.impact === "critical") blocking++; else other++; }
      };
      await page.goto(srv.base + "/v/outlets", { waitUntil: "load" }); await page.waitForTimeout(900); await axe("/v/outlets");
      for (const outlet of ["o_paris_1", "o_smash_1"]) {
        // the quick menu list ("Animations off")
        await page.evaluate(`try { localStorage.setItem("sap-kitchen-anim", "off"); } catch (e) {}`);
        await page.goto(`${srv.base}/v/kitchen?outlet=${outlet}`, { waitUntil: "load" }); await page.waitForTimeout(1200); await axe(`${outlet} list`);
        // the door, and the kitchen with a dish open
        await page.evaluate(`try { localStorage.setItem("sap-kitchen-anim", "on"); } catch (e) {}`);
        await page.goto(`${srv.base}/v/kitchen?outlet=${outlet}&door=1`, { waitUntil: "load" });
        if (!(await page.locator(".k-skip").waitFor({ timeout: 30000 }).then(() => true, () => false))) { console.log(`skip  ${outlet}: no WebGL here`); continue; }
        await page.waitForTimeout(800); await axe(`${outlet} door`);
        await page.click(".k-skip"); await page.waitForFunction(`typeof window.__kitchen === "function"`, null, { timeout: 60000 }); await page.waitForTimeout(3500);
        await page.locator("nav button").first().click(); await page.getByRole("dialog").waitFor({ timeout: 15000 }); await page.waitForTimeout(900); await axe(`${outlet} kitchen, dish open`);
      }
      await ctx.close();
    }
  } finally { await browser.close(); await srv.stop(); }
  console.log(`${n} screen-language pairs audited: ${blocking} serious/critical, ${other} minor/moderate violations`);
  process.exit(blocking ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
