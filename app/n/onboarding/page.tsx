import { requirePage } from "@/lib/guard";
import { readDb } from "@/lib/store";
import { StatusPill } from "@/components/bits";
import { OnboardingForm } from "@/components/OnboardingForm";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.ngoOnboarding") };
}

export default async function NgoOnboarding() {
  const me = await requirePage("ngo");
  const { t } = await getT();
  const n = (await readDb()).ngos.find((x) => x.ownerId === me.id);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <h1 className="page-title">{t("onb.ngoTitle")}</h1>
      {n && <p className="flex items-center gap-2 text-sm">{t("onb.status")} <StatusPill status={n.status} />{n.rejectionReason && <span className="text-tomato">{t("onb.reason", { reason: n.rejectionReason })}</span>}</p>}
      <p className="text-xs text-muted">{t("onb.ngoNote")}</p>
      <OnboardingForm
        kind="ngo"
        locked={n?.status === "Approved"}
        init={{
          orgName: n?.orgName ?? "", contactPerson: n?.contactPerson ?? me.name, phone: n?.phone ?? me.phone ?? "", email: n?.email ?? "",
          address: n?.address ?? "", neighbourhood: n?.neighbourhood ?? "Koramangala", lat: n?.lat, lng: n?.lng, serviceAreaKm: n?.serviceAreaKm ?? 5,
          capacityMeals: n?.capacityMeals ?? "", handlingArrangements: n?.handlingArrangements ?? "", fssaiInfo: n?.fssaiInfo ?? "", registrationDocs: n?.registrationDocs ?? [],
          registrationNumber: n?.registrationNumber ?? "", eightyGNumber: n?.eightyG?.number ?? "", eightyGValidUntil: n?.eightyG?.validUntil ?? "",
        }}
      />
    </div>
  );
}
