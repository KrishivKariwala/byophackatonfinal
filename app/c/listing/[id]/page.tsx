import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { completedPickups, enrichListing, isCustomerVisible } from "@/lib/services";
import { isFollowing, vendorReviews } from "@/lib/p1";
import { FollowButton, Rating, ReportButton, SurpriseBadge, VerifiedBadge } from "@/components/p1";
import { directionsUrl } from "@/lib/geo";
import { RULES } from "@/lib/rules";
import { DietTag, Photo, Price, StatusPill } from "@/components/bits";
import { LiveCount } from "@/components/LiveProvider";
import { ReserveBox } from "./ReserveBox";
import { cfg } from "@/lib/p2/settings";
import { creditQuote } from "@/lib/p2/credits";
import { getT } from "@/lib/i18n/server";
import { statusLabel, tOr } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("customer");
  const { t, fmt } = await getT();
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
        <Link href="/c" className="inline-flex items-center gap-1 text-sm font-semibold text-tomato"><ChevronLeft size={16} aria-hidden="true" />{t("listing.back")}</Link>
        <Photo title={l.title} surprise={l.surpriseBag} className="h-72 rounded-3xl" />
        <div className="flex flex-wrap items-center gap-2">
          <DietTag diet={l.diet} large />
          <span className="chip bg-cream text-burgundy">{t(`category.${l.category}`)}</span>
          {l.surpriseBag && <SurpriseBadge worth={l.surpriseWorth} />}
          {l.vendor.verified && <VerifiedBadge />}
          {!visible && <StatusPill status={raw.status} />}
        </div>
        <h1 className="editorial text-5xl leading-none">{l.title}</h1>
        <p className="text-sm text-muted">{l.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="card p-3"><dt className="text-xs text-muted">{t("listing.pickupWindow")}</dt><dd className="font-bold">{fmt.window(l.windowStart, l.windowEnd)}</dd></div>
          <div className="card p-3"><dt className="text-xs text-muted">{t("listing.available")}</dt><dd className="font-bold"><LiveCount listingId={l.id} initial={l.qtyAvailable} /> <span className="text-xs text-muted">{t("listing.of", { total: l.qtyTotal })}</span></dd></div>
          <div className="card p-3"><dt className="text-xs text-muted">{t("listing.prepared")}</dt><dd className="font-bold">{fmt.dateTime(l.preparedAt)}</dd></div>
          <div className="card p-3"><dt className="text-xs text-muted">{t("listing.allergens")}</dt><dd className="font-bold">{l.allergens.length ? l.allergens.map((a) => tOr(t, `allergen.${a}`, a)).join(", ") : t("listing.noneDeclared")}</dd></div>
          {l.safeUntil && <div className="card p-3"><dt className="text-xs text-muted">{t("listing.eatBy")}</dt><dd className="font-bold">{fmt.dateTime(l.safeUntil)}</dd></div>}
          <div className="card p-3"><dt className="text-xs text-muted">{t("listing.restaurant")}</dt><dd className="font-bold">{l.vendor.businessName}</dd><dd><Rating avg={l.vendor.ratingAvg} count={l.vendor.ratingCount} /></dd></div>
        </dl>
        <div className="rounded-2xl bg-cream p-4 text-sm text-burgundy">
          <b>{t("listing.foodSafetyTitle")}</b> {t("listing.foodSafetyBody", { date: fmt.dateTime(l.safetyDeclaration.acceptedAt) })}
          {l.storageNote && <> {t("listing.storage", { note: l.storageNote })}</>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FollowButton vendorId={l.vendor.id} initial={isFollowing(me.id, l.vendor.id)} lat={l.outlet.lat} lng={l.outlet.lng} />
          <span className="text-xs text-muted">{t("follow.hint")}</span>
        </div>
        {reviews.length > 0 && (
          <section aria-label={t("listing.recentRatings")} className="card flex flex-col gap-2 p-4">
            <h2 className="editorial text-xl">{t("listing.whatSay")}</h2>
            <ul className="flex flex-col gap-2 text-sm">{reviews.map((r) => (
              <li key={r.id}><span className="font-semibold">{r.reviewer}</span> · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}{r.text && <span className="text-muted"> — {r.text}</span>}</li>
            ))}</ul>
          </section>
        )}
        <ReportButton targetType="listing" targetId={l.id} />
        <p className="text-sm">
          {l.outlet.address} ·{" "}
          <a className="font-semibold underline" href={directionsUrl(l.outlet)} target="_blank" rel="noreferrer">{t("listing.directions")}</a>
        </p>
      </div>
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="card flex flex-col gap-4 p-5">
          <Price original={l.originalPrice} rescue={l.rescuePrice} size="lg" />
          {l.surpriseBag && <p className="rounded-xl bg-peach p-3 text-sm font-semibold text-burgundy">{t("p1.surprise.note")}. {t("listing.worthFor", { worth: l.originalPrice, price: l.rescuePrice })}</p>}
          {suspended && <p role="alert" className="rounded-xl bg-sand p-3 text-sm font-semibold text-tomato">{t("listing.suspended", { date: suspended })}</p>}
          {visible && !suspended ? (
            <ReserveBox
              listingId={l.id}
              unitPrice={l.rescuePrice}
              maxQty={Math.min(unitCap, l.qtyAvailable)}
              payAtPickup={payOk}
              payAtPickupNote={!l.outlet.payAtPickup ? t("listing.payOff") : t("listing.payLocked", { need: RULES.PAY_AT_PICKUP_MIN_PICKUPS, done: picks })}
              activeCount={active}
              policy={t("cancel.policy", { minutes: cfg(db).freeCancelMinutes })}
              creditBalance={creditQuote(db, me.id, 0, n).balance}
              creditMaxPct={cfg(db).creditMaxPct}
              maxActive={cfg(db).maxActiveReservations}
              holdMinutes={cfg(db).holdMinutes}
            />
          ) : suspended ? null : (
            <p className="rounded-xl bg-sand p-3 text-sm font-semibold text-muted">{t("listing.unavailable", { status: statusLabel(t, raw.status).toLowerCase() })}</p>
          )}
          <p className="text-[11px] text-muted">{t("listing.limits", { max: unitCap, active: cfg(db).maxActiveReservations, have: active })}</p>
        </div>
      </aside>
    </div>
  );
}
