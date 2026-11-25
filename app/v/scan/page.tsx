import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { ScanClient } from "./ScanClient";
import { vendorScope } from "@/lib/p2/scope";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.scan") };
}

export default async function Scan() {
  const me = await requirePage("vendor");
  const { t } = await getT();
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  if (!v || v.status !== "Approved")
    return <div className="mx-auto max-w-xl px-4 py-12"><p className="text-sm">{t("scan.onlyApproved")} <Link className="font-semibold text-tomato underline" href="/v/onboarding">{t("scan.onboarding")}</Link></p></div>;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <p className="eyebrow text-burgundy">{v.businessName}</p>
      <h1 className="page-title">{t("scan.title")}</h1>
      <ScanClient />
    </div>
  );
}
