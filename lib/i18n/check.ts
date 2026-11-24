import type { Messages } from "./locales";

/** Pure checks used by `npm run i18n:check` and the test suite. */
export interface I18nReport { missing: Record<string, string[]>; extra: Record<string, string[]>; placeholder: string[]; unknownKeysInCode: string[]; unusedKeys: string[]; ok: boolean }

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

/** Keys referenced in source as t("a.b"), t('a.b') or a "nav.xxx"-style literal passed to t(). Dynamic keys (template strings with ${}) are skipped. */
export function keysUsedInSource(sources: string[]): Set<string> {
  const used = new Set<string>();
  for (const src of sources) {
    for (const m of src.matchAll(/\bt\(\s*["'`]([A-Za-z][\w]*(?:\.[\w]+)+)["'`]/g)) used.add(m[1]);
    // labels declared as data and translated later: { label: "nav.discover" } / key: "x.y" / labelKey: "x.y"
    for (const m of src.matchAll(/\b(?:label|labelKey|titleKey|textKey|i18n)\s*:\s*["'`]([a-z][\w]*(?:\.[\w]+)+)["'`]/g)) used.add(m[1]);
  }
  return used;
}

export function checkCatalog(cat: Record<string, Messages>, sources: string[] = []): I18nReport {
  const en = cat.en;
  const missing: Record<string, string[]> = {};
  const extra: Record<string, string[]> = {};
  const placeholder: string[] = [];
  for (const [loc, dict] of Object.entries(cat)) {
    if (loc === "en") continue;
    missing[loc] = Object.keys(en).filter((k) => !(k in dict) || !String(dict[k]).trim());
    extra[loc] = Object.keys(dict).filter((k) => !(k in en));
    for (const k of Object.keys(dict)) if (k in en && vars(en[k]) !== vars(dict[k])) placeholder.push(`${loc}:${k}`);
  }
  const used = keysUsedInSource(sources);
  const base = (k: string) => k.replace(/_(one|other)$/, "");
  const enBases = new Set(Object.keys(en).map(base));
  const unknownKeysInCode = [...used].filter((k) => !(k in en) && !enBases.has(k));
  const usedBases = new Set([...used].map(base));
  const unusedKeys = sources.length ? Object.keys(en).filter((k) => !usedBases.has(base(k))) : [];
  const ok = Object.values(missing).every((x) => !x.length) && Object.values(extra).every((x) => !x.length) && !placeholder.length && !unknownKeysInCode.length;
  return { missing, extra, placeholder, unknownKeysInCode, unusedKeys, ok };
}
