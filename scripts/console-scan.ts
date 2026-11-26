/**
 * Visits every screen of every kind of visitor in English, Hindi and Kannada with headless Chrome and reports anything the browser
 * complains about: console errors, uncaught page errors, failed requests, and responses of 400 or more (other than the expected
 * ones). Also times how long each screen takes to load.
 *   npm run build && npm run scan:console          (add STORE=supabase PG_SCHEMA=sap_scratch to scan the database store)
 */
import { SCREENS, startHarness } from "./lib/browser-harness";

(async () => {
  const h = await startHarness(3302, "console-scan");
  const problems: string[] = [];
  const slow: { url: string; ms: number }[] = [];
  let screens = 0;
  try {
    for (const locale of ["en", "hi", "kn"]) {
      for (const group of Object.keys(SCREENS)) {
        const ctx = await h.newContext(locale, group === "public" ? undefined : group);
        const page = await ctx.newPage();
        let here = "";
        page.on("console", (m) => { if (m.type() === "error") problems.push(`[${locale} ${group} ${here}] console: ${m.text().slice(0, 200)}`); });
        page.on("pageerror", (e) => problems.push(`[${locale} ${group} ${here}] page error: ${String(e).slice(0, 200)}`));
        page.on("requestfailed", (r) => { if (!/_rsc|stream|\.woff2?$/.test(r.url())) problems.push(`[${locale} ${group} ${here}] request failed: ${r.url().replace(h.base, "")} ${r.failure()?.errorText ?? ""}`); });
        page.on("response", (r) => { if (r.status() >= 400 && !/\/api\/auth\//.test(r.url())) problems.push(`[${locale} ${group} ${here}] HTTP ${r.status()}: ${r.url().replace(h.base, "")}`); });
        for (const url of SCREENS[group]) {
          here = url;
          const t0 = Date.now();
          await page.goto(h.base + url, { waitUntil: "load" });
          const ms = Date.now() - t0;
          if (ms > 1500) slow.push({ url: `${group}:${url} (${locale})`, ms });
          await page.waitForTimeout(url === "/" ? 6500 : 700);
          screens++;
        }
        await ctx.close();
      }
    }
  } finally { await h.stop(); }
  const uniq = [...new Set(problems)];
  console.log(`${screens} screens scanned in 3 languages: ${uniq.length} distinct problem(s), ${slow.length} slow load(s) over 1.5 s`);
  for (const p of uniq) console.log("  " + p);
  for (const s of slow) console.log(`  slow: ${s.url} ${s.ms} ms`);
  process.exit(uniq.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
