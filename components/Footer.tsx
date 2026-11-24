"use client";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { useT } from "./I18n";

export function Footer() {
  const { t } = useT();
  // The landing page is kept clean: the demo notice stays in the header bar there.
  if (usePathname() === "/") return null;
  return (
    <footer className="mt-16 bg-logobg">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <Logo width={96} />
        <div className="flex-1 text-xs text-burgundy">
          <p className="font-semibold tracking-wide">{t("footer.tagline")}</p>
          <p className="mt-1 text-muted">{t("footer.demoNote")}</p>
        </div>
      </div>
    </footer>
  );
}
