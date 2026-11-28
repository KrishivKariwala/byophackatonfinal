"use client";
import "@fontsource/abril-fatface/400.css";
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/600.css";
import "@fontsource/josefin-sans/700.css";
import "./kitchen.css";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { themeVars } from "@/lib/kitchen-themes";
import { LanguageMenu } from "@/components/HeaderBar";
import { useT } from "@/components/I18n";

/** On the outlet page (the restaurant's home) there is no Back arrow. A plain labelled button signs out and returns to the demo accounts, so another restaurant can come in. */
export function SwitchAccount() {
  const { t } = useT();
  return (
    <button type="button" className="pointer-events-auto inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3.5 text-sm font-extrabold shadow-lg" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-brand)" }}
      onClick={async () => { try { await fetch("/api/auth/signout", { method: "POST" }); } catch { /* going to the login page anyway */ } window.location.assign("/signin"); /* a full page load: a soft navigation raced with the refresh and left the person on the old page */ }}>
      <LogOut size={16} aria-hidden="true" />{t("kitchen.switchAccount")}
    </button>
  );
}

/** The back arrow one step up, to the outlet page (where the live orders and the pickup-code scan are also one tap away). */
export function BackToOutlets() {
  const { t } = useT();
  return (
    <Link href="/v/outlets" aria-label={t("kitchen.backOutlets")} title={t("kitchen.backOutlets")} className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border-2 shadow-lg"
      style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-brand)" }}>
      <ArrowLeft size={20} aria-hidden="true" />
    </Link>
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
/** `back`: "outlets" shows an arrow up to the outlet page; "none" (the outlet page itself, the restaurant's home) shows no arrow, only the Switch account button. */
export function ThemeFrame({ theme, children, back = "outlets" }: { theme: KitchenTheme; children: React.ReactNode; back?: "none" | "outlets" }) {
  const { locale } = useT();
  useCoverSite();
  return (
    <div className="k-root fixed inset-0 z-[60] overflow-auto" style={{ ...themeVars(theme), background: `radial-gradient(120% 70% at 50% 0%, #1c2a78 0%, ${theme.colors.brandDark} 38%, ${theme.colors.ink} 100%)`, color: theme.colors.cream } as React.CSSProperties}>
      <header className="sticky top-0 z-10 flex items-center gap-2 p-3">
        {back === "outlets" && <BackToOutlets />}
        <b className="k-display px-1 text-xl" style={{ color: "var(--k-cream)", textShadow: "0 2px 10px #000" }}>Paris Panini</b>
        {back === "none" && <div className="ml-auto"><SwitchAccount /></div>}
        <div className={`${back === "none" ? "" : "ml-auto "}rounded-full border-2 px-1 shadow-lg`} style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)" }}><LanguageMenu current={locale} /></div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-2 sm:px-6">{children}</main>
    </div>
  );
}
