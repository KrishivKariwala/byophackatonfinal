import fs from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { LiveProvider } from "@/components/LiveProvider";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/components/I18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { messagesFor } from "@/lib/i18n/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: { default: t("title.default"), template: "%s · SAVE A PLATE" }, description: t("title.description") };
}
export const viewport: Viewport = { themeColor: "#CB0001", width: "device-width", initialScale: 1 };

// Official fonts (The Seasons, Chunko Bold) are linked only when their licensed files are present,
// so the app never requests missing files. See reference/font-assets-manifest.md.
const OFFICIAL_FONTS = ["the-seasons-regular.otf", "chunko-bold.otf"];
const hasOfficialFonts = OFFICIAL_FONTS.some((f) => fs.existsSync(path.join(process.cwd(), "public", "fonts", f)));

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === "en" ? "en-IN" : locale} suppressHydrationWarning>
      <head>
        {/* Opening animation gate: runs before first paint so returning visitors never see the intro overlay flash.
            Skipped when already played this session or when the visitor prefers reduced motion. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-sap-intro","skip")}else if(sessionStorage.getItem("sap-intro-seen")){d.setAttribute("data-sap-intro","skip");d.setAttribute("data-sap-quick","1")}}catch(e){}`,
          }}
        />
        {/* A browser REFRESH on any screen returns to the main screen ("/"). It runs while the HTML is parsed, before anything
            paints, so there is no flash of the page you refreshed. Only a reload triggers it: clicks, links and Back are
            untouched, and "/" itself is never redirected. location.replace swaps the history entry so Back doesn't loop. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="reload"&&location.pathname!=="/")location.replace("/")}catch(e){}`,
          }}
        />
        {/* Without JavaScript neither animation can run: never leave the page covered or hidden. */}
        <noscript>
          <style>{`.intro-root{display:none!important}html[data-sap-quick] :is(.hero-fade,.hero-word,.plate-wrap,.decor){opacity:1!important}`}</style>
        </noscript>
        {/* eslint-disable-next-line @next/next/no-css-tags -- conditional, only when licensed font files exist */}
        {hasOfficialFonts && <link rel="stylesheet" href="/fonts/official-fonts.css" />}
      </head>
      <body className="min-h-screen flex flex-col">
        <I18nProvider locale={locale} dict={messagesFor(locale)}>
          <LiveProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </LiveProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
