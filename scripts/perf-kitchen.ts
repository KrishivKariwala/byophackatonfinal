/**
 * Measures how smoothly the 3D kitchen runs in real Chrome with the GPU on: frame times standing still and while walking, plus draw calls.
 * Needs a production build (npm run build). Run: npx tsx scripts/perf-kitchen.ts [width] [height] [variant,variant]
 * A variant is an address suffix such as "dpr=2" (force sharpness) or "fx=0" (no steam, dust or light beams). "" = as shipped.
 */
import { chromium } from "playwright-core";
import { startServer } from "./lib/browser-harness";

const W = Number(process.argv[2]) || 1470, H = Number(process.argv[3]) || 956;
const variants = (process.argv[4] ?? ",dpr=2,dpr=1.3,fx=0&dpr=1.3").split(",");

const pct = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

async function main() {
  const srv = await startServer(3411, "perf", { VERCEL_ENV: "preview" });
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-frame-rate-limit", "--disable-gpu-vsync"] });
  try {
    for (const v of variants) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: "en-IN" });
      const r = await ctx.request.post(srv.base + "/api/auth/demo", { data: { userId: "u_paris" } });
      if (!(await r.json()).ok) throw new Error("sign-in failed");
      const page = await ctx.newPage();
      await page.goto(`${srv.base}/v/kitchen?outlet=${process.env.OUTLET || "o_paris_1"}&door=1${v ? "&" + v : ""}`);
      await page.waitForSelector(".k-skip", { timeout: 30000 });
      await page.click(".k-skip");
      await page.waitForFunction(`typeof window.__kitchen === "function"`, null, { timeout: 60000 });
      await page.waitForTimeout(4000);
      const upBefore = Number(await page.evaluate(`window.__kitchen().uploads`));
      // (plain strings: the test runner's transform adds helpers that do not exist inside the page)
      await page.evaluate(`(function(){ var w = window; w.__rec = { long: [], phase: "idle", phases: { idle: [], walk: [] } };
        new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){ w.__rec.long.push(e.duration); }); }).observe({ type: "longtask" });
        var last = performance.now();
        function tick(now){ var d = now - last; last = now; w.__rec.phases[w.__rec.phase].push(d); requestAnimationFrame(tick); }
        requestAnimationFrame(tick); })()`);
      const cdp = process.env.PROFILE ? await ctx.newCDPSession(page) : null;
      if (cdp) { await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 }); await cdp.send("Profiler.start"); }
      await page.waitForTimeout(6000); // standing still
      await page.evaluate(`window.__rec.phase = "walk"`);
      for (let i = 0; i < 60; i++) { // walking: scroll along the aisle while the pointer moves over the scene
        await page.evaluate(`(function(){ var el = document.querySelector(".k-scene-area"); el.scrollTop = (el.scrollHeight - el.clientHeight) * (${i} / 60) * 0.7; })()`);
        await page.mouse.move(300 + (i * 17) % 800, 300 + (i * 11) % 400);
        await page.waitForTimeout(100);
      }
      const out = (await page.evaluate(`({ phases: window.__rec.phases, long: window.__rec.long, info: window.__kitchen() })`)) as { phases: Record<string, number[]>; long: number[]; info: Record<string, unknown> };
      if (cdp) {
        const { profile } = (await cdp.send("Profiler.stop")) as { profile: { nodes: { id: number; callFrame: { functionName: string; url: string; lineNumber: number }; hitCount?: number }[]; samples: number[]; timeDeltas: number[] } };
        const self = new Map<string, number>(); const byId = new Map(profile.nodes.map((n) => [n.id, n]));
        profile.samples.forEach((id, i) => { const n = byId.get(id)!; const k = `${n.callFrame.functionName || "(anonymous)"}  ${n.callFrame.url.split("/").slice(-2).join("/")}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000); });
        const total = [...self.values()].reduce((a, b) => a + b, 0);
        console.log(`\n--- where the main thread spent its time (${(total / 1000).toFixed(1)} s sampled)`);
        [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22).forEach(([k, ms]) => console.log(`    ${ms.toFixed(0).padStart(6)} ms  ${k}`));
      }
      console.log(`\n=== ${v || "as shipped"}   (${W}x${H} @2x; GPU: ${String(out.info.renderer).slice(0, 60)})`);
      console.log(`    drawn at ${JSON.stringify(out.info.canvas)} px, sharpness ${Number(out.info.pixelRatio).toFixed(2)}, ${out.info.calls} draw calls, ${(Number(out.info.triangles) / 1000).toFixed(0)}k triangles, ${out.info.textures} textures, effects ${out.info.fx}`);
      for (const ph of ["idle", "walk"]) {
        const a = out.phases[ph]; const sum = a.reduce((x, y) => x + y, 0);
        console.log(`    ${ph.padEnd(5)} ${(a.length / (sum / 1000)).toFixed(0).padStart(4)} fps | frame ms p50 ${pct(a, 0.5).toFixed(1)}, p95 ${pct(a, 0.95).toFixed(1)}, p99 ${pct(a, 0.99).toFixed(1)}, max ${Math.max(...a).toFixed(0)} | slower than 33 ms: ${a.filter((x) => x > 33).length}, than 50 ms: ${a.filter((x) => x > 50).length}`);
      }
      console.log(`    texture uploads after the kitchen was ready: ${Number(out.info.uploads) - upBefore} (should be 0)`);
      console.log(`    main-thread stalls over 50 ms: ${out.long.length}${out.long.length ? " (longest " + Math.max(...out.long).toFixed(0) + " ms)" : ""}`);
      await ctx.close();
    }
  } finally { await browser.close().catch(() => undefined); await srv.stop(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
