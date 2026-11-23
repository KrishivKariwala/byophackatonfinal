import fs from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { LiveProvider } from "@/components/LiveProvider";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: { default: "SAVE A PLATE — rescue surplus food in Bengaluru", template: "%s · SAVE A PLATE" },
  description: "Rescuing good food, reducing waste, and making every meal count.",
};
export const viewport: Viewport = { themeColor: "#CB0001", width: "device-width", initialScale: 1 };

// Official fonts (The Seasons, Chunko Bold) are linked only when their licensed files are present,
// so the app never requests missing files. See reference/font-assets-manifest.md.
const OFFICIAL_FONTS = ["the-seasons-regular.otf", "chunko-bold.otf"];
const hasOfficialFonts = OFFICIAL_FONTS.some((f) => fs.existsSync(path.join(process.cwd(), "public", "fonts", f)));

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        {/* Opening animation gate: runs before first paint so returning visitors never see the intro overlay flash.
            Skipped when already played this session or when the visitor prefers reduced motion. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("sap-intro-seen")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-sap-intro","skip")}catch(e){}`,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-css-tags -- conditional, only when licensed font files exist */}
        {hasOfficialFonts && <link rel="stylesheet" href="/fonts/official-fonts.css" />}
      </head>
      <body className="min-h-screen flex flex-col">
        <LiveProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LiveProvider>
      </body>
    </html>
  );
}
