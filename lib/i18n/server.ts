import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, formatters, pickLocale, translate, type Locale, type Vars } from "./locales";
import { CATALOG, messagesFor } from "./catalog";
import { isFlagOn } from "../p2/platform";

/** The visitor's language: their saved choice, else the device language, else English. English only when the flag is off. */
export async function getLocale(): Promise<Locale> {
  if (!isFlagOn("i18n")) return DEFAULT_LOCALE;
  const c = await cookies();
  const h = await headers();
  return pickLocale(c.get(LOCALE_COOKIE)?.value, h.get("accept-language"));
}

/** For server components: `const { t, fmt } = await getT(); t("nav.discover")`. */
export async function getT() {
  const locale = await getLocale();
  const dict = messagesFor(locale);
  return {
    locale,
    t: (key: string, vars?: Vars) => translate(locale, dict, CATALOG.en, key, vars),
    fmt: formatters(locale),
  };
}
