import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { vendorScope } from "@/lib/p2/scope";
import { kitchenEnabled, themeForVendor } from "@/lib/kitchen-themes";
import { getT } from "@/lib/i18n/server";
import { ThemeFrame } from "@/components/kitchen/ThemeFrame";
import { ScanClient } from "../scan/ScanClient";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getT(); return { title: `${t("scan.title")} (test)` }; }

/** TEST FEATURE: the pickup-code scan, in the restaurant's own look (the marketplace version is /v/scan). Not available on the live site. */
export default async function Handover() {
  if (!kitchenEnabled()) notFound();
  const me = await requirePage("vendor");
  const { t } = await getT();
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  if (!v || v.status !== "Approved") redirect("/v/new");
  const btn = "inline-flex min-h-[50px] items-center rounded-2xl border-2 px-5 text-base font-extrabold";
  return (
    <ThemeFrame theme={themeForVendor(v.id)} back="outlets">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em]" style={{ color: "var(--k-brass)" }}>{v.businessName}</p>
          <h1 className="k-display text-[2.2rem] leading-[1.05] sm:text-5xl" style={{ color: "var(--k-cream)" }}>{t("scan.title")}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/v/board" className={`${btn} text-white`} style={{ background: "var(--k-accent)", borderColor: "var(--k-accent)" }}>{t("kitchen.board.orders")}</Link>
            <Link href="/v/outlets" className={btn} style={{ borderColor: "var(--k-brass)", color: "var(--k-cream)" }}>{t("kitchen.board.switch")}</Link>
          </div>
        </div>
        <div className="rounded-[26px] border-[3px] p-4 shadow-[0_18px_44px_rgba(0,0,0,.45)] sm:p-6" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-ink)" }}>
          <ScanClient />
        </div>
      </div>
    </ThemeFrame>
  );
}
