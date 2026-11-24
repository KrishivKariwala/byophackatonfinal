import { requirePage } from "@/lib/guard";
import { read } from "@/lib/store";
import { StatusPill } from "@/components/bits";
import { OnboardingForm } from "@/components/OnboardingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "NGO verification" };

export default async function NgoOnboarding() {
  const me = await requirePage("ngo");
  const n = read().ngos.find((x) => x.ownerId === me.id);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <h1 className="display text-4xl text-tomato">NGO VERIFICATION</h1>
      {n && <p className="flex items-center gap-2 text-sm">Status: <StatusPill status={n.status} />{n.rejectionReason && <span className="text-tomato">Reason: {n.rejectionReason}</span>}</p>}
      <p className="text-xs text-muted">Only approved NGOs can claim donation batches. A demo approval is not a real regulatory approval.</p>
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
