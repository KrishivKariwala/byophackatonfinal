import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { enrichListing, isCustomerVisible } from "@/lib/services";
import { directionsUrl } from "@/lib/geo";
import { RULES } from "@/lib/rules";
import { DietTag, Photo, Price, fmtDateTime, fmtWindow, StatusPill } from "@/components/bits";
import { LiveCount } from "@/components/LiveProvider";
import { ReserveBox } from "./ReserveBox";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("customer");
  const { id } = await params;
  const db = read();
  const raw = db.listings.find((l) => l.id === id);
  if (!raw) notFound();
  const l = enrichListing(db, raw);
  const n = now(db);
  const visible = isCustomerVisible(db, raw, n);
  const active = db.reservations.filter((r) => r.customerId === me.id && (r.status === "Reserved" || r.status === "Ready")).length +
    db.holds.filter((h) => h.customerId === me.id && h.status === "Active").length;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col gap-4">
        <Link href="/c" className="inline-flex items-center gap-1 text-sm font-semibold text-tomato"><ChevronLeft size={16} aria-hidden="true" />Back to discover</Link>
        <Photo title={l.title} surprise={l.surpriseBag} className="h-72 rounded-3xl" />
        <div className="flex flex-wrap items-center gap-2">
          <DietTag diet={l.diet} large />
          <span className="chip bg-cream text-burgundy">{l.category}</span>
          {l.surpriseBag && <span className="chip bg-peach text-burgundy">Surprise Bag · contents vary</span>}
          {!visible && <StatusPill status={raw.status} />}
        </div>
        <h1 className="editorial text-5xl leading-none">{l.title}</h1>
        <p className="text-sm text-muted">{l.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="card p-3"><dt className="text-xs text-muted">Pickup window</dt><dd className="font-bold">{fmtWindow(l.windowStart, l.windowEnd)}</dd></div>
          <div className="card p-3"><dt className="text-xs text-muted">Available</dt><dd className="font-bold"><LiveCount listingId={l.id} initial={l.qtyAvailable} /> <span className="text-xs text-muted">of {l.qtyTotal}</span></dd></div>
          <div className="card p-3"><dt className="text-xs text-muted">Prepared</dt><dd className="font-bold">{fmtDateTime(l.preparedAt)}</dd></div>
          <div className="card p-3"><dt className="text-xs text-muted">Allergens (vendor-supplied)</dt><dd className="font-bold">{l.allergens.length ? l.allergens.join(", ") : "None declared"}</dd></div>
          {l.safeUntil && <div className="card p-3"><dt className="text-xs text-muted">Eat by (vendor-supplied)</dt><dd className="font-bold">{fmtDateTime(l.safeUntil)}</dd></div>}
          <div className="card p-3"><dt className="text-xs text-muted">Restaurant</dt><dd className="font-bold">{l.vendor.businessName}</dd><dd className="text-xs text-muted">No ratings yet (demo)</dd></div>
        </dl>
        <div className="rounded-2xl bg-cream p-4 text-sm text-burgundy">
          <b>Food-safety declaration</b> signed by the vendor for this listing on {fmtDateTime(l.safetyDeclaration.acceptedAt)}.
          {l.storageNote && <> Storage: {l.storageNote}</>}
        </div>
        <p className="text-sm">
          {l.outlet.address} ·{" "}
          <a className="font-semibold underline" href={directionsUrl(l.outlet)} target="_blank" rel="noreferrer">Directions in Google Maps</a>
        </p>
      </div>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="card flex flex-col gap-4 p-5">
          <Price original={l.originalPrice} rescue={l.rescuePrice} size="lg" />
          {visible ? (
            <ReserveBox
              listingId={l.id}
              unitPrice={l.rescuePrice}
              maxQty={Math.min(RULES.MAX_UNITS_PER_ORDER, l.qtyAvailable)}
              payAtPickup={l.outlet.payAtPickup}
              activeCount={active}
            />
          ) : (
            <p className="rounded-xl bg-sand p-3 text-sm font-semibold text-muted">This listing is no longer available to reserve ({raw.status.toLowerCase()}).</p>
          )}
          <p className="text-[11px] text-muted">Max {RULES.MAX_UNITS_PER_ORDER} units per order · up to {RULES.MAX_ACTIVE_RESERVATIONS} active reservations · you have {active}.</p>
        </div>
      </aside>
    </div>
  );
}
