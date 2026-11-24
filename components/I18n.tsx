"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { formatters, translate, type Locale, type Messages, type Vars } from "@/lib/i18n/locales";
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
