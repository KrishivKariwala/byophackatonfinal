import { notFound } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { ListingForm } from "../../ListingForm";
import { vendorScope } from "@/lib/p2/scope";
import { cfg } from "@/lib/p2/settings";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.editListing") };
}

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("vendor");
  const { t } = await getT();
  const { id } = await params;
  const db = read();
  const scope = await vendorScope(me);
  const l = db.listings.find((x) => x.id === id && x.vendorId === scope.ctx?.vendor.id && scope.scopeIds.includes(x.outletId));
  if (!l || !scope.can("listing.write")) notFound();
  const allocated = l.qtyTotal - l.qtyAvailable;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="display text-4xl text-tomato">{t("vform.editTitle")}</h1>
      <p className="text-sm text-muted">{t("vform.editNote", { n: allocated })}</p>
      <ListingForm
        mode="edit"
        listingId={l.id}
        serverNow={now(db)}
        features={{ autoMarkdown: cfg(db).flags.autoMarkdown, maxDiscountPct: cfg(db).maxDiscountPct }}
        appliedSteps={db.priceSteps.filter((s) => s.listingId === l.id && s.appliedAt)}
        init={{ title: l.title, description: l.description, category: l.category, originalPrice: l.originalPrice, rescuePrice: l.rescuePrice, qty: l.qtyTotal, diet: l.diet, allergens: l.allergens, surpriseBag: l.surpriseBag, storageNote: l.storageNote || "", donateRest: l.donateRest, windowStart: l.windowStart, windowEnd: l.windowEnd, preparedAt: l.preparedAt, safeUntil: l.safeUntil, riskTag: l.riskTag ?? "", donationOnly: l.donationOnly, priceSteps: db.priceSteps.filter((s) => s.listingId === l.id && !s.appliedAt).sort((a, b) => (a.effectiveAt < b.effectiveAt ? -1 : 1)) }}
      />
    </div>
  );
}
