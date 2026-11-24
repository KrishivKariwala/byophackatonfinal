import en from "./messages/en.json";
import hi from "./messages/hi.json";
import kn from "./messages/kn.json";
import type { Locale, Messages } from "./locales";

export const CATALOG: Record<Locale, Messages> = { en, hi, kn };
/** The dictionary a client needs for one locale: English underneath, the locale's own strings on top (per-key fallback). */
export const messagesFor = (locale: Locale): Messages => (locale === "en" ? CATALOG.en : { ...CATALOG.en, ...CATALOG[locale] });
