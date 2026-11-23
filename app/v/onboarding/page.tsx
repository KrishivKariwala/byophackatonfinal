import { requirePage } from "@/lib/guard";
import { read } from "@/lib/store";
import { StatusPill } from "@/components/bits";
import { OnboardingForm } from "@/components/OnboardingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor onboarding" };

export default async function VendorOnboarding() {
  const me = await requirePage("vendor");
  const db = read();
  const v = db.vendors.find((x) => x.ownerId === me.id);
  const o = v ? db.outlets.find((x) => x.vendorId === v.id) : undefined;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <h1 className="display text-4xl text-tomato">VENDOR ONBOARDING</h1>
      {v && <p className="flex items-center gap-2 text-sm">Application status: <StatusPill status={v.status} />{v.rejectionReason && <span className="text-tomato">Reason: {v.rejectionReason}</span>}</p>}
      <p className="text-xs text-muted">An administrator reviews every application. Demo approvals are not real FSSAI or regulatory approvals.</p>
      <OnboardingForm
        kind="vendor"
        locked={v?.status === "Approved"}
        init={{
          businessName: v?.businessName ?? "", contactName: v?.contactName ?? me.name, phone: v?.phone ?? me.phone ?? "", email: v?.email ?? "",
          address: o?.address ?? "", neighbourhood: o?.neighbourhood ?? "Koramangala", lat: o?.lat, lng: o?.lng,
          fssaiNumber: v?.fssaiNumber ?? "", operatingHours: v?.operatingHours ?? "", payoutUpi: v?.payoutUpi ?? "",
          documents: v?.documents ?? [], payAtPickup: o?.payAtPickup ?? true,
        }}
      />
    </div>
  );
}
