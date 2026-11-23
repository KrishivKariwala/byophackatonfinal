import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { ListingForm, type FormInit } from "../ListingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quick list" };

export default async function NewListing({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const me = await requirePage("vendor");
  const db = read();
  const v = db.vendors.find((x) => x.ownerId === me.id);
  if (!v || v.status !== "Approved") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="display text-4xl text-tomato">NOT YET</h1>
        <p className="mt-2 text-sm text-muted">Only approved vendors can publish listings. Your application is {v?.status ?? "not started"}.</p>
        <Link href="/v/onboarding" className="btn-primary mt-4">Go to onboarding</Link>
      </div>
    );
  }
  const { from } = await searchParams;
  const src = from ? db.listings.find((l) => l.id === from && l.vendorId === v.id) : undefined;
  const init: FormInit = src
    ? { title: src.title, description: src.description, category: src.category, originalPrice: src.originalPrice, rescuePrice: src.rescuePrice, qty: src.qtyTotal, diet: src.diet, allergens: src.allergens, surpriseBag: src.surpriseBag, storageNote: src.storageNote || "", donateRest: src.donateRest }
    : { title: "", description: "", category: "Bakery", originalPrice: "", rescuePrice: "", qty: 10, diet: "", allergens: [], surpriseBag: false, storageNote: "", donateRest: true, donationOnly: false, riskTag: "" };
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <p className="eyebrow text-burgundy">{v.businessName}</p>
        <h1 className="display text-4xl text-tomato">QUICK LIST{src ? " · DUPLICATE" : ""}</h1>
      </div>
      <ListingForm mode="create" init={init} templates={db.templates.filter((t) => t.vendorId === v.id)} serverNow={now(db)} />
    </div>
  );
}
