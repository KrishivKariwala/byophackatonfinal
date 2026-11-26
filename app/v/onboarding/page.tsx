import { requirePage } from "@/lib/guard";
import { readDb } from "@/lib/store";
import { StatusPill } from "@/components/bits";
import { OnboardingForm } from "@/components/OnboardingForm";
import { resolveOrg } from "@/lib/p2/org";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.vendorOnboarding") };
}

export default async function VendorOnboarding() {
  const me = await requirePage("vendor");
  const { t } = await getT();
  const db = await readDb();
  const org = resolveOrg(db, me);
  if (org && org.role !== "owner")
    return <div className="mx-auto max-w-xl px-4 py-12"><h1 className="page-title">{t("onb.outletProfile")}</h1><p role="status" className="mt-2 text-sm text-muted">{t("onb.ownerOnly", { business: org.vendor.businessName })}</p></div>;
  const v = db.vendors.find((x) => x.ownerId === me.id);
  const o = v ? db.outlets.find((x) => x.vendorId === v.id) : undefined;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <h1 className="page-title">{t("onb.vendorTitle")}</h1>
      {v && <p className="flex items-center gap-2 text-sm">{t("onb.appStatus")} <StatusPill status={v.status} />{v.rejectionReason && <span className="text-tomato">{t("onb.reason", { reason: v.rejectionReason })}</span>}</p>}
      <p className="text-xs text-muted">{t("onb.reviewNote")}</p>
      <OnboardingForm
        kind="vendor"
        locked={v?.status === "Approved"}
        init={{
          businessName: v?.businessName ?? "", contactName: v?.contactName ?? me.name, phone: v?.phone ?? me.phone ?? "", email: v?.email ?? "",
          address: o?.address ?? "", neighbourhood: o?.neighbourhood ?? "Koramangala", lat: o?.lat, lng: o?.lng,
          fssaiNumber: v?.fssaiNumber ?? "", operatingHours: v?.operatingHours ?? "", payoutUpi: v?.payoutUpi ?? "",
          documents: v?.documents ?? [], payAtPickup: o?.payAtPickup ?? true, logoUrl: v?.logoUrl,
        }}
      />
    </div>
  );
}
