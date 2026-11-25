/**
 * Automated accessibility audit: runs axe-core (WCAG 2.0/2.1 A and AA rules, including colour contrast) on every screen of every kind
 * of visitor in English, Hindi and Kannada, with headless Chrome. Serious and critical violations fail the run.
 *
 * Usage:  npm run build && npm run a11y:audit
 * Writes test-results/a11y-audit.json. It cannot replace a screen-reader pass by a person (see docs/PRD.md section 11).
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { SCREENS, startHarness } from "./lib/browser-harness";

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface Found { rule: string; impact: string; help: string; nodes: number; example: string }

async function main() {
  const h = await startHarness(3301, "a11y-audit");
  const report: Record<string, Record<string, Found[]>> = {};
  let blocking = 0, other = 0, screens = 0;
  try {
    for (const locale of ["en", "hi", "kn"]) {
      report[locale] = {};
      for (const group of Object.keys(SCREENS)) {
        const ctx = await h.newContext(locale, group === "public" ? undefined : group);
        const page = await ctx.newPage();
        for (const url of SCREENS[group]) {
          await page.goto(h.base + url, { waitUntil: "load" });
          await page.waitForTimeout(url === "/" ? 6500 : url === "/c" ? 2500 : 800); // the main screen animates in first
          await page.addScriptTag({ content: AXE });
          const res = await page.evaluate(async (tags) => {
            // @ts-expect-error axe is injected into the page
            const r = await axe.run(document, { runOnly: { type: "tag", values: tags } });
            return r.violations.map((v: { id: string; impact: string; help: string; nodes: { target: unknown[] }[] }) => ({ rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, example: String(v.nodes[0]?.target?.[0] ?? "") }));
          }, TAGS);
          screens++;
          if (res.length) report[locale][`${group}:${url}`] = res;
          for (const v of res as Found[]) { if (v.impact === "serious" || v.impact === "critical") blocking++; else other++; }
        }
        await ctx.close();
      }
    }
  } finally { await h.stop(); }
  fs.mkdirSync("test-results", { recursive: true });
  fs.writeFileSync(path.join("test-results", "a11y-audit.json"), JSON.stringify({ ranAt: new Date().toISOString(), screens, blocking, other, report }, null, 2));
  // one line per rule, over every screen and language
  const byRule = new Map<string, { impact: string; help: string; screens: Set<string>; example: string }>();
  for (const [locale, pages] of Object.entries(report)) for (const [p, list] of Object.entries(pages)) for (const v of list) {
    const e = byRule.get(v.rule) ?? { impact: v.impact, help: v.help, screens: new Set<string>(), example: v.example };
    e.screens.add(`${locale} ${p}`); byRule.set(v.rule, e);
  }
  for (const [rule, e] of byRule) console.log(`${e.impact.toUpperCase().padEnd(8)} ${rule}: ${e.help} (${e.screens.size} screen-language pairs; e.g. ${e.example})`);
  console.log(`\n${screens} screen-language pairs audited: ${blocking} serious/critical, ${other} minor/moderate violations`);
  process.exit(blocking ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
