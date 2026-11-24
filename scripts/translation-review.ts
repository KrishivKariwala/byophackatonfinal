/**
 * Regenerates TRANSLATION_REVIEW.md: every string with its English, Hindi and Kannada text, grouped by screen, so a native speaker can review it
 * in one pass. Run: npx tsx scripts/translation-review.ts
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..");
const load = (l: string): Record<string, string> => JSON.parse(fs.readFileSync(path.join(root, "lib/i18n/messages", `${l}.json`), "utf8"));
const en = load("en"), hi = load("hi"), kn = load("kn");
const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const groups = new Map<string, string[]>();
for (const k of Object.keys(en).sort()) { const g = k.split(".")[0]; groups.set(g, [...(groups.get(g) ?? []), k]); }

const out: string[] = [
  "# Translation review",
  "",
  "Hindi (हिन्दी) and Kannada (ಕನ್ನಡ) were written by the build assistant as a **first pass**. They have **not** been reviewed by a native speaker. Nothing here should be treated as final copy until someone fluent signs it off.",
  "",
  `${Object.keys(en).length} strings. Generated from \`lib/i18n/messages/*.json\` by \`npx tsx scripts/translation-review.ts\`; edit the JSON files, not this table, then regenerate.`,
  "",
  "## How to review",
  "1. Read each row in context if you can (the screen is named by the key prefix; `docs/P2_DEMO.md` says how to reach it).",
  "2. Mark the **OK?** column or write the corrected text into the JSON file. Keep `{placeholders}` exactly as they are.",
  "3. Run `npm run i18n:check` (it fails on a missing key or a changed placeholder) and `npm test`.",
  "",
  "## Things to look at first",
  "- **Register and tone.** The app speaks to ordinary people in Bengaluru: simple, polite, no jargon. Is it too formal or too casual?",
  "- **Words left in English on purpose:** OTP, QR, UPI, FSSAI, NGO, 80G, ETA-style acronyms and the brand SAVE A PLATE. Would your audience say these in Hindi / Kannada, or is there a better everyday word?",
  "- **Legal-ish sentences** (credit is not cash, estimated value is not a tax document, 80G wording, the food-safety lines). These were translated closely but a person who knows the legal context should check the meaning is preserved.",
  "- **Plurals.** Hindi and Kannada keys with `_one` / `_other` suffixes use two forms; check the counts read naturally.",
  "- **Fonts.** Devanagari and Kannada fall back to Noto Sans in headings (the brand display font has no glyphs for them). Check the headings look acceptable.",
  "",
  "## Known limits",
  "- Notification texts, API error messages and PDFs (certificates, receipts) are generated on the server and stay in English.",
  "- Landing page animation words (EAT / LIST / FEED) are brand artwork and are not translated.",
  "",
];
for (const [g, keys] of groups) {
  out.push(`## ${g}`, "", "| Key | English | हिन्दी | ಕನ್ನಡ | OK? |", "|---|---|---|---|---|");
  for (const k of keys) out.push(`| \`${k}\` | ${esc(en[k])} | ${esc(hi[k] ?? "")} | ${esc(kn[k] ?? "")} | ☐ |`);
  out.push("");
}
fs.writeFileSync(path.join(root, "TRANSLATION_REVIEW.md"), out.join("\n"));
console.log(`Wrote TRANSLATION_REVIEW.md (${Object.keys(en).length} strings).`);
