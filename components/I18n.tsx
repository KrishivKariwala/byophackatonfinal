"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, formatters, translate, type Locale, type Messages, type Vars } from "@/lib/i18n/locales";
import en from "@/lib/i18n/messages/en.json";

interface Ctx { locale: Locale; dict: Messages }
const I18nCtx = createContext<Ctx>({ locale: "en", dict: en });

/** The server resolves the language once and hands the (English-backed) dictionary to every client component. */
export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Messages; children: React.ReactNode }) {
  const v = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <I18nCtx.Provider value={v}>{children}</I18nCtx.Provider>;
}

export function useT() {
  const { locale, dict } = useContext(I18nCtx);
  const t = useCallback((key: string, vars?: Vars) => translate(locale, dict, en, key, vars), [locale, dict]);
  const fmt = useMemo(() => formatters(locale), [locale]);
  return { t, fmt, locale };
}

/** Remembers the choice in a cookie (a year) and refreshes so server-rendered text switches too. */
export function LanguageSwitcher() {
  const router = useRouter();
  const { t, locale } = useT();
  const [busy, setBusy] = useState(false);
  const choose = (l: Locale) => {
    if (l === locale) return;
    setBusy(true);
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
    setTimeout(() => setBusy(false), 600);
  };
  return (
    <div role="group" aria-label={t("lang.label")} className="inline-flex items-center gap-1 rounded-xl border border-line bg-white p-1">
      <Languages size={16} className="ml-1 text-muted" aria-hidden="true" />
      {LOCALES.map((l) => (
        <button
          key={l} type="button" lang={l} onClick={() => choose(l)} disabled={busy} aria-pressed={l === locale}
          className={`min-h-[44px] min-w-[44px] rounded-lg px-2.5 text-sm font-semibold transition ${l === locale ? "bg-tomato text-white" : "text-burgundy hover:bg-cream"}`}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
