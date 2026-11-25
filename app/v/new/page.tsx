import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { ListingForm, type FormInit } from "../ListingForm";
import { vendorScope } from "@/lib/p2/scope";
import { cfg } from "@/lib/p2/settings";
import { getT } from "@/lib/i18n/server";
import { statusLabel } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.quickList") };
}

export default async function NewListing({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const me = await requirePage("vendor");
  const { t } = await getT();
  const db = read();
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  if (v && !scope.can("listing.write")) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="page-title">{t("vform.notRoleTitle")}</h1>
        <p role="alert" className="mt-2 text-sm text-muted">{t("vform.notRoleBody", { role: t(`org.role.${scope.ctx!.role}`).toLowerCase() })}</p>
        <Link href="/v" className="btn-primary mt-4">{t("vform.backToday")}</Link>
      </div>
    );
  }
  if (!v || v.status !== "Approved") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="page-title">{t("vform.notYetTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("vform.notYetBody", { status: v ? statusLabel(t, v.status) : t("vform.notStarted") })}</p>
        <Link href="/v/onboarding" className="btn-primary mt-4">{t("vform.goOnboarding")}</Link>
      </div>
    );
  }
  const { from } = await searchParams;
  const src = from ? db.listings.find((l) => l.id === from && l.vendorId === v.id && scope.scopeIds.includes(l.outletId)) : undefined;
  const init: FormInit = src
    ? { title: src.title, description: src.description, category: src.category, originalPrice: src.originalPrice, rescuePrice: src.rescuePrice, qty: src.qtyTotal, diet: src.diet, allergens: src.allergens, surpriseBag: src.surpriseBag, storageNote: src.storageNote || "", donateRest: src.donateRest }
    : { title: "", description: "", category: "Bakery", originalPrice: "", rescuePrice: "", qty: 10, diet: "", allergens: [], surpriseBag: false, storageNote: "", donateRest: true, donationOnly: false, riskTag: "" };
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <p className="eyebrow text-burgundy">{v.businessName}</p>
        <h1 className="page-title">{src ? t("vform.quickListDup") : t("vform.quickList")}</h1>
      </div>
      <ListingForm mode="create" init={init} templates={db.templates.filter((t) => t.vendorId === v.id)} serverNow={now(db)} outlets={scope.outlets.map((o) => ({ id: o.id, label: o.name ?? o.address }))} defaultOutletId={src?.outletId ?? (scope.selected !== "all" ? scope.selected : undefined)} features={{ autoMarkdown: cfg(db).flags.autoMarkdown, maxDiscountPct: cfg(db).maxDiscountPct, priorityOptions: cfg(db).flags.priorityWindow ? cfg(db).priorityOptions : [] }} />
    </div>
  );
}
