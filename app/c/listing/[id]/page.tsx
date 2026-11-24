import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { completedPickups, enrichListing, isCustomerVisible } from "@/lib/services";
import { isFollowing, vendorReviews } from "@/lib/p1";
import { S } from "@/lib/strings";
import { FollowButton, Rating, ReportButton, SurpriseBadge, VerifiedBadge } from "@/components/p1";
import { directionsUrl } from "@/lib/geo";
import { RULES } from "@/lib/rules";
import { DietTag, Photo, Price, fmtDateTime, fmtWindow, StatusPill } from "@/components/bits";
import { LiveCount } from "@/components/LiveProvider";
import { ReserveBox } from "./ReserveBox";
import { cfg } from "@/lib/p2/settings";
import { creditQuote } from "@/lib/p2/credits";
import { cancelPolicyText } from "@/lib/cancel";

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
  const suspended = me.suspendedUntil && Date.parse(me.suspendedUntil) > n ? me.suspendedUntil.slice(0, 10) : null;
  const picks = completedPickups(db, me.id);
  const payOk = l.outlet.payAtPickup && picks >= RULES.PAY_AT_PICKUP_MIN_PICKUPS;
  const vendorRow = db.vendors.find((v) => v.id === raw.vendorId)!;
  const unitCap = Math.max(RULES.MAX_UNITS_PER_ORDER, vendorRow.maxUnitsPerOrder ?? 0);
  const reviews = vendorReviews(raw.vendorId).slice(0, 3);
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
          {l.surpriseBag && <SurpriseBadge worth={l.surpriseWorth} />}
          {l.vendor.verified && <VerifiedBadge />}
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
          <div className="card p-3"><dt className="text-xs text-muted">Restaurant</dt><dd className="font-bold">{l.vendor.businessName}</dd><dd><Rating avg={l.vendor.ratingAvg} count={l.vendor.ratingCount} /></dd></div>
        </dl>
        <div className="rounded-2xl bg-cream p-4 text-sm text-burgundy">
          <b>Food-safety declaration</b> signed by the vendor for this listing on {fmtDateTime(l.safetyDeclaration.acceptedAt)}.
          {l.storageNote && <> Storage: {l.storageNote}</>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FollowButton vendorId={l.vendor.id} initial={isFollowing(me.id, l.vendor.id)} lat={l.outlet.lat} lng={l.outlet.lng} />
          <span className="text-xs text-muted">{S.follow.hint}</span>
        </div>
        {reviews.length > 0 && (
          <section aria-label="Recent ratings" className="card flex flex-col gap-2 p-4">
            <h2 className="editorial text-xl">What customers say</h2>
            <ul className="flex flex-col gap-2 text-sm">{reviews.map((r) => (
              <li key={r.id}><span className="font-semibold">{r.reviewer}</span> · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}{r.text && <span className="text-muted"> — {r.text}</span>}</li>
            ))}</ul>
          </section>
        )}
        <ReportButton targetType="listing" targetId={l.id} />
        <p className="text-sm">
          {l.outlet.address} ·{" "}
          <a className="font-semibold underline" href={directionsUrl(l.outlet)} target="_blank" rel="noreferrer">Directions in Google Maps</a>
        </p>
      </div>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="card flex flex-col gap-4 p-5">
          <Price original={l.originalPrice} rescue={l.rescuePrice} size="lg" />
          {l.surpriseBag && <p className="rounded-xl bg-peach p-3 text-sm font-semibold text-burgundy">{S.surprise.note}. {S.surprise.worth(l.originalPrice)} for ₹{l.rescuePrice}.</p>}
          {suspended && <p role="alert" className="rounded-xl bg-sand p-3 text-sm font-semibold text-tomato">{S.suspended(suspended)}</p>}
          {visible && !suspended ? (
            <ReserveBox
              listingId={l.id}
              unitPrice={l.rescuePrice}
              maxQty={Math.min(unitCap, l.qtyAvailable)}
              payAtPickup={payOk}
              payAtPickupNote={!l.outlet.payAtPickup ? S.payAtPickup.off : S.payAtPickup.locked(picks, RULES.PAY_AT_PICKUP_MIN_PICKUPS)}
              activeCount={active}
              policy={cancelPolicyText(cfg(db).freeCancelMinutes)}
              creditBalance={creditQuote(db, me.id, 0, n).balance}
              creditMaxPct={cfg(db).creditMaxPct}
              maxActive={cfg(db).maxActiveReservations}
              holdMinutes={cfg(db).holdMinutes}
            />
          ) : suspended ? null : (
            <p className="rounded-xl bg-sand p-3 text-sm font-semibold text-muted">This listing is no longer available to reserve ({raw.status.toLowerCase()}).</p>
          )}
          <p className="text-[11px] text-muted">Max {unitCap} units per order · up to {cfg(db).maxActiveReservations} active reservations · you have {active}.</p>
        </div>
      </aside>
    </div>
  );
}
