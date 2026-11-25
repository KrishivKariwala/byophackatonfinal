/**
 * Leftover-English scan: opens every screen of every kind of visitor in Hindi and Kannada and reports Latin-script words that are
 * not explained by data (business, person and dish names, addresses, reviews: text people wrote, which is not translated) or by
 * a short allow-list of names and standards (SAP, UPI, PDF, ...). A new untranslated label fails the run.
 *
 * Usage:  npm run build && npm run i18n:scan
 * Writes test-results/i18n-scan.json. Exits 1 if anything is left over.
 */
import fs from "node:fs";
import path from "node:path";
import { SCREENS, startHarness } from "./lib/browser-harness";

const ALLOW = new Set(["save", "plate", "http", "https", "signin", "role", "mock", "sap", "don", "upi", "otp", "sms", "pdf", "ngo", "fssai", "gstin", "ist", "qr", "csv", "zip", "kg", "demo", "razorpay", "test", "google", "maps", "inr", "ref", "dr", "gst", "us", "eta", "id", "ok", "pcs", "reg", "registration"]);
const DATA_KEYS = new Set(["name", "businessName", "orgName", "title", "description", "storageNote", "address", "text", "centreName", "notes", "riderName", "contactName", "volunteerName", "contact", "allergens", "neighbourhood", "rejectionReason", "handlingArrangements", "documents", "docs", "files", "code", "registrationDocs", "fssaiDocs", "idDocs"]);

function dataWords(db: unknown): Set<string> {
  const out = new Set<string>();
  const walk = (v: unknown, key = "") => {
    if (typeof v === "string") { if (DATA_KEYS.has(key)) for (const w of v.match(/[A-Za-z][A-Za-z']*/g) || []) out.add(w.toLowerCase()); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(db);
  return out;
}

async function main() {
  const h = await startHarness(3300, "i18n-scan");
  const results: Record<string, Record<string, string[]>> = {};
  let leftovers = 0;
  try {
    for (const locale of ["hi", "kn"]) {
      results[locale] = {};
      for (const group of Object.keys(SCREENS)) {
        const ctx = await h.newContext(locale, group === "public" ? undefined : group);
        const page = await ctx.newPage();
        for (const url of SCREENS[group]) {
          await page.goto(h.base + url, { waitUntil: "load" });
          await page.waitForTimeout(group === "customer" && url === "/c" ? 2500 : 700);
          const text = await page.locator("body").innerText();
          const data = dataWords(JSON.parse(fs.readFileSync(h.db, "utf8"))); // refreshed per page: sign-ups and writes add names
          const words = [...new Set((text.match(/[A-Za-z][A-Za-z']{2,}/g) || []).map((w) => w.toLowerCase()))].filter((w) => !ALLOW.has(w) && !data.has(w));
          if (words.length) { results[locale][`${group}:${url}`] = words; leftovers += words.length; }
        }
        await ctx.close();
      }
    }
  } finally { await h.stop(); }
  fs.mkdirSync("test-results", { recursive: true });
  fs.writeFileSync(path.join("test-results", "i18n-scan.json"), JSON.stringify({ ranAt: new Date().toISOString(), leftovers, results }, null, 2));
  for (const [locale, pages] of Object.entries(results)) for (const [p, w] of Object.entries(pages)) console.log(`${locale}  ${p}: ${w.join(", ")}`);
  console.log(leftovers ? `\nFAIL: ${leftovers} leftover English word(s)` : "\nPASS: no leftover English on any screen in Hindi or Kannada");
  process.exit(leftovers ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
