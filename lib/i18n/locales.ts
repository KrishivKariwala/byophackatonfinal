/**
 * Multi-language support (P2 feature 2). Client-safe: no Node-only imports here.
 * - Locales: English (source of truth), Hindi, Kannada.
 * - Every key falls back to English per key, so a half-translated locale never shows a raw key.
 * - Numbers, currency and dates go through Intl for the active locale; INR is always rupees, times are Asia/Kolkata.
 */
export const LOCALES = ["en", "hi", "kn"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "sap_lang";
/** Shown in each language's own script so people can find theirs. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", hi: "हिन्दी", kn: "ಕನ್ನಡ" };
const INTL_TAG: Record<Locale, string> = { en: "en-IN", hi: "hi-IN", kn: "kn-IN" };

export type Messages = Record<string, string>;
export type Vars = Record<string, string | number>;

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** First supported language in an Accept-Language header ("hi-IN,hi;q=0.9,en;q=0.8" -> "hi"), else null. */
export function fromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const parts = header.split(",").map((p) => {
    const [tag, ...params] = p.trim().split(";");
    const q = Number(params.find((x) => x.trim().startsWith("q="))?.split("=")[1] ?? 1);
    return { lang: tag.trim().toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0 };
  }).filter((x) => x.q > 0).sort((a, b) => b.q - a.q);
  for (const p of parts) if (isLocale(p.lang)) return p.lang;
  return null;
}

/** Explicit choice (cookie) wins; then the device language; then English. */
export function pickLocale(cookie: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (isLocale(cookie)) return cookie;
  return fromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}

/** Looks up a key with per-key English fallback, plural suffixes (_one / _other) and {name} interpolation. */
export function translate(locale: Locale, dict: Messages, en: Messages, key: string, vars?: Vars): string {
  let k = key;
  if (vars && typeof vars.n === "number") {
    const cat = new Intl.PluralRules(INTL_TAG[locale]).select(vars.n);
    const pk = `${key}_${cat === "one" ? "one" : "other"}`;
    if (pk in dict || pk in en) k = pk;
  }
  const raw = dict[k] ?? en[k] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => {
    if (!(name in vars)) return m;
    // Server-written values (a status, a reason) carry a companion `<name>Key` naming a catalog entry, so other languages show their own word.
    const ref = vars[`${name}Key`];
    if (locale !== "en" && typeof ref === "string" && (dict[ref] ?? en[ref]))
      return (dict[ref] ?? en[ref]).replace(/\{(\w+)\}/g, (mm, other: string) => (other !== name && other in vars ? String(vars[other]) : mm));
    return String(vars[name]);
  });
}

export function formatters(locale: Locale) {
  const tag = INTL_TAG[locale];
  return {
    number: (n: number) => new Intl.NumberFormat(tag).format(n),
    inr: (n: number) => new Intl.NumberFormat(tag, { style: "currency", currency: "INR", maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n),
    date: (d: string | number | Date) => new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(d)),
    time: (d: string | number | Date) => new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(d)),
    window: (a: string | number | Date, b: string | number | Date) => `${new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(a))}–${new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(b))}`,
    dateTime: (d: string | number | Date) => new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(d)),
    month: (ym: string) => new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`)),
  };
}
export type Formatters = ReturnType<typeof formatters>;
