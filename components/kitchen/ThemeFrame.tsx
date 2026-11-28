"use client";
import "@fontsource/abril-fatface/400.css";
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/600.css";
import "@fontsource/josefin-sans/700.css";
import "./kitchen.css";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { themeVars } from "@/lib/kitchen-themes";
import { LanguageMenu } from "@/components/HeaderBar";
import { useT } from "@/components/I18n";

/** The back arrow of a restaurant's own pages: it leaves for the login page (and signs out), so another restaurant account can come in. */
export function BackToLogin() {
  const { t } = useT();
  return (
    <button type="button" aria-label={t("kitchen.back")} title={t("kitchen.back")} className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border-2 shadow-lg"
      style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-brand)" }}
      onClick={async () => { try { await fetch("/api/auth/signout", { method: "POST" }); } catch { /* going to the login page anyway */ } window.location.assign("/signin"); /* a full page load: a soft navigation raced with the refresh and left the person on the old page */ }}>
      <ArrowLeft size={20} aria-hidden="true" />
    </button>
  );
}

/** Keeps the marketplace header and footer out of keyboard reach while a restaurant's own page covers them. */
export function useCoverSite() {
  useEffect(() => {
    const main = document.querySelector("main"); const sibs = Array.from(main?.parentElement?.children ?? []).filter((e) => e !== main && /^(HEADER|FOOTER)$/.test(e.tagName));
    sibs.forEach((e) => e.setAttribute("inert", ""));
    return () => sibs.forEach((e) => e.removeAttribute("inert"));
  }, []);
}

/** A page in the restaurant's own world (its fonts, colours and night-time mood), kept apart from the marketplace's look. */
export function ThemeFrame({ theme, children }: { theme: KitchenTheme; children: React.ReactNode }) {
  const { locale } = useT();
  useCoverSite();
  return (
    <div className="k-root fixed inset-0 z-[60] overflow-auto" style={{ ...themeVars(theme), background: `radial-gradient(120% 70% at 50% 0%, #1c2a78 0%, ${theme.colors.brandDark} 38%, ${theme.colors.ink} 100%)`, color: theme.colors.cream } as React.CSSProperties}>
      <header className="sticky top-0 z-10 flex items-center gap-2 p-3">
        <BackToLogin />
        <b className="k-display px-1 text-xl" style={{ color: "var(--k-cream)", textShadow: "0 2px 10px #000" }}>Paris Panini</b>
        <div className="ml-auto rounded-full border-2 px-1 shadow-lg" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)" }}><LanguageMenu current={locale} /></div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-2 sm:px-6">{children}</main>
    </div>
  );
}
