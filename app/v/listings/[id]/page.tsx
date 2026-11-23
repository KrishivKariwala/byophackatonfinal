import { notFound } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { ListingForm } from "../../ListingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit listing" };

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("vendor");
  const { id } = await params;
  const db = read();
  const v = db.vendors.find((x) => x.ownerId === me.id);
  const l = db.listings.find((x) => x.id === id && x.vendorId === v?.id);
  if (!l) notFound();
  const allocated = l.qtyTotal - l.qtyAvailable;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="display text-4xl text-tomato">EDIT LISTING</h1>
      <p className="text-sm text-muted">{allocated} unit(s) already reserved or held — total quantity cannot go below that. Price changes do not affect existing orders.</p>
      <ListingForm
        mode="edit"
        listingId={l.id}
        serverNow={now(db)}
        init={{ title: l.title, description: l.description, category: l.category, originalPrice: l.originalPrice, rescuePrice: l.rescuePrice, qty: l.qtyTotal, diet: l.diet, allergens: l.allergens, surpriseBag: l.surpriseBag, storageNote: l.storageNote || "", donateRest: l.donateRest, windowStart: l.windowStart, windowEnd: l.windowEnd, preparedAt: l.preparedAt, safeUntil: l.safeUntil, riskTag: l.riskTag ?? "", donationOnly: l.donationOnly }}
      />
    </div>
  );
}
