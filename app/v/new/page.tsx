import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { ListingForm, type FormInit } from "../ListingForm";
import { vendorScope } from "@/lib/p2/scope";
import { cfg } from "@/lib/p2/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quick list" };

export default async function NewListing({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const me = await requirePage("vendor");
  const db = read();
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  if (v && !scope.can("listing.write")) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="display text-4xl text-tomato">NOT FOR YOUR ROLE</h1>
        <p role="alert" className="mt-2 text-sm text-muted">Your {scope.ctx!.role} role can handle orders but not create listings. Ask the owner or a manager.</p>
        <Link href="/v" className="btn-primary mt-4">Back to today</Link>
      </div>
    );
  }
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
  const src = from ? db.listings.find((l) => l.id === from && l.vendorId === v.id && scope.scopeIds.includes(l.outletId)) : undefined;
  const init: FormInit = src
    ? { title: src.title, description: src.description, category: src.category, originalPrice: src.originalPrice, rescuePrice: src.rescuePrice, qty: src.qtyTotal, diet: src.diet, allergens: src.allergens, surpriseBag: src.surpriseBag, storageNote: src.storageNote || "", donateRest: src.donateRest }
    : { title: "", description: "", category: "Bakery", originalPrice: "", rescuePrice: "", qty: 10, diet: "", allergens: [], surpriseBag: false, storageNote: "", donateRest: true, donationOnly: false, riskTag: "" };
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <p className="eyebrow text-burgundy">{v.businessName}</p>
        <h1 className="display text-4xl text-tomato">QUICK LIST{src ? " · DUPLICATE" : ""}</h1>
      </div>
      <ListingForm mode="create" init={init} templates={db.templates.filter((t) => t.vendorId === v.id)} serverNow={now(db)} outlets={scope.outlets.map((o) => ({ id: o.id, label: o.name ?? o.address }))} defaultOutletId={src?.outletId ?? (scope.selected !== "all" ? scope.selected : undefined)} features={{ autoMarkdown: cfg(db).flags.autoMarkdown, maxDiscountPct: cfg(db).maxDiscountPct, priorityOptions: cfg(db).flags.priorityWindow ? cfg(db).priorityOptions : [] }} />
    </div>
  );
}
