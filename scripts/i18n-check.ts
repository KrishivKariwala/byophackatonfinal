/**
 * Fails (exit 1) when a locale is missing a key that English has, has a key English doesn't, changes a {placeholder},
 * or when the code calls t("some.key") for a key English doesn't define.   Run: npm run i18n:check   (also part of `npm test`).
 */
import fs from "node:fs";
import path from "node:path";
import { checkCatalog } from "../lib/i18n/check";

const root = path.join(__dirname, "..");
const load = (l: string) => JSON.parse(fs.readFileSync(path.join(root, "lib/i18n/messages", `${l}.json`), "utf8"));
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name === ".next" ? [] : walk(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
const sources = ["app", "components", "lib"].flatMap((d) => walk(path.join(root, d))).filter((f) => !f.endsWith("lib/i18n/check.ts")).map((f) => fs.readFileSync(f, "utf8"));
const r = checkCatalog({ en: load("en"), hi: load("hi"), kn: load("kn") }, sources);

for (const [loc, keys] of Object.entries(r.missing)) if (keys.length) console.error(`✗ ${loc}: ${keys.length} missing key(s):\n   ${keys.join("\n   ")}`);
for (const [loc, keys] of Object.entries(r.extra)) if (keys.length) console.error(`✗ ${loc}: ${keys.length} key(s) not in English:\n   ${keys.join("\n   ")}`);
if (r.placeholder.length) console.error(`✗ placeholder mismatch:\n   ${r.placeholder.join("\n   ")}`);
if (r.unknownKeysInCode.length) console.error(`✗ keys used in code but not defined in en.json:\n   ${r.unknownKeysInCode.join("\n   ")}`);
if (r.unusedKeys.length) console.warn(`(info) ${r.unusedKeys.length} key(s) in en.json not referenced by a literal t("…") call (they may be built dynamically).`);
if (!r.ok) process.exit(1);
console.log(`✓ i18n OK: ${Object.keys(load("en")).length} keys × 3 locales, no missing keys.`);
