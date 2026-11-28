/**
 * Accessibility check (axe-core, WCAG A/AA) of the TEST-BUILD-ONLY restaurant pages (the outlet chooser), in English, Hindi and
 * Kannada. These pages do not exist on the live site, so the normal audit (npm run a11y:audit) cannot reach them.
 * Usage: npm run build && npx tsx scripts/a11y-kitchen-pages.ts
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import { startServer } from "./lib/browser-harness";

const AXE = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
(async () => {
  const srv = await startServer(3302, "a11y-kitchen", { VERCEL_ENV: "preview" });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  let blocking = 0, other = 0, n = 0;
  try {
    for (const locale of ["en", "hi", "kn"]) {
      const ctx = await browser.newContext({ locale: locale === "en" ? "en-IN" : locale, viewport: { width: 1100, height: 900 } });
      await ctx.addCookies([{ name: "sap_lang", value: locale, url: srv.base }]);
      const r = await ctx.request.post(srv.base + "/api/auth/demo", { data: { userId: "u_paris" } });
      if (!(await r.json()).ok) throw new Error("sign-in failed");
      const page = await ctx.newPage();
      for (const url of ["/v/outlets"]) {
        await page.goto(srv.base + url, { waitUntil: "load" }); await page.waitForTimeout(900);
        await page.addScriptTag({ content: AXE });
        const res: { id: string; impact: string; help: string; nodes: unknown[]; detail: string }[] = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa"] } }).then(function(r){ return r.violations.map(function(v){ return { id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, detail: v.nodes.map(function(x){ return x.target.join(' ') + ' => ' + (x.any[0] && x.any[0].message || ''); }).join(' | ') }; }); })`);
        n++;
        for (const v of res) { console.log(`${locale} ${url}: ${v.impact} ${v.id} (${v.nodes} nodes) ${v.help}\n     ${v.detail}`); if (v.impact === "serious" || v.impact === "critical") blocking++; else other++; }
      }
      await ctx.close();
    }
  } finally { await browser.close(); await srv.stop(); }
  console.log(`${n} screen-language pairs audited: ${blocking} serious/critical, ${other} minor/moderate violations`);
  process.exit(blocking ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
