import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { distanceKm, directionsUrl } from "@/lib/geo";
import { DietTag, StatusPill, Photo } from "@/components/bits";
import { ActionButton } from "@/components/client";
import { ScheduleForm, VerifiedBadge } from "@/components/p1";
import { DistributionForm, DeliveryPanel } from "@/components/p2-charity";
import { ClaimActions } from "@/components/ClaimActions";
import { priorityOffersFor } from "@/lib/p2/priority";
import { cfg } from "@/lib/p2/settings";
import { getT } from "@/lib/i18n/server";
import { hoodLabel, statusLabel, tOr } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.donationFeed") };
}

export default async function NgoFeed() {
  const me = await requirePage("ngo");
  const db = read();
  const n = now(db);
  const ngo = db.ngos.find((x) => x.ownerId === me.id);
  const { t, fmt } = await getT();
  if (!ngo) return <div className="mx-auto max-w-xl px-4 py-12"><Link href="/n/onboarding" className="btn-primary">{t("ngo.start")}</Link></div>;
  const approved = ngo.status === "Approved";
  const flags = cfg(db).flags;
  const offers = priorityOffersFor(db, ngo, n);
  const enrich = (b: (typeof db.donationBatches)[number]) => {
    const o = db.outlets.find((x) => x.id === b.outletId)!;
    const l = db.listings.find((x) => x.id === b.listingId);
    return { ...b, outlet: o, vendor: db.vendors.find((v) => v.id === b.vendorId)!, listing: l, km: distanceKm(ngo, o) };
  };
  const open = db.donationBatches.filter((b) => b.status === "Open" && Date.parse(b.collectBy) > n).map(enrich).filter((b) => b.km <= ngo.serviceAreaKm).sort((a, b) => a.km - b.km);
  const mine = db.donationBatches.filter((b) => b.claimedByNgoId === ngo.id).map(enrich).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <p className="eyebrow text-burgundy">{ngo.orgName}</p>
        <h1 className="display text-4xl text-tomato sm:text-5xl">{t("ngo.title")}</h1>
        <p className="flex items-center gap-2 text-sm font-semibold">{approved && <VerifiedBadge label={t("ngo.verifiedNgo")} />}</p>
        <p className="text-sm text-muted">{t("ngo.freeBatches", { km: ngo.serviceAreaKm })}</p>
      </div>
      {!approved && (
        <div role="status" className="rounded-2xl border-2 border-tomato bg-cream p-4 text-sm text-burgundy">
          <b>{t("ngo.verification", { status: statusLabel(t, ngo.status) })}</b> {t("ngo.viewOnly")} <Link className="font-semibold underline" href="/n/onboarding">{t("ngo.viewVerification")}</Link>
        </div>
      )}
      {flags.priorityWindow && (
        <section aria-labelledby="prio-h" className="rounded-3xl border-2 border-peach bg-cream/60 p-4">
          <h2 id="prio-h" className="editorial text-3xl">{t("prio.title")} ({offers.length})</h2>
          <p className="mb-3 text-sm text-muted">{t("prio.help")}</p>
          {offers.length === 0 ? <p className="text-sm text-muted">{t("prio.none")}</p> : (
            <ul className="grid gap-3 md:grid-cols-2">
              {offers.map(({ l, outlet, vendor, km }) => (
                <li key={l.id} className="card flex flex-col gap-1.5 p-4 text-sm">
                  <div className="flex items-start justify-between gap-2"><b className="text-lg">{l.qtyAvailable} × {l.title}</b><DietTag diet={l.diet} /></div>
                  <span className="text-muted">{vendor.businessName} · {hoodLabel(t, outlet.neighbourhood)} · {t("units.km", { n: km.toFixed(1) })}</span>
                  <span>{t("ngo.allergensLine", { list: l.allergens.length ? l.allergens.map((a) => tOr(t, `allergen.${a}`, a)).join(", ") : t("ngo.noneDeclared") })}</span>
                  <span className="font-bold text-tomato">{t("prio.until", { time: fmt.time(l.publicVisibleAt!) })}</span>
                  <ActionButton path={`/api/ngo/priority/${l.id}`} label={t("prio.claim", { n: l.qtyAvailable })} className="btn-primary mt-2" successText={t("prio.claimed")} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <section aria-labelledby="open-h">
        <h2 id="open-h" className="editorial mb-3 text-3xl">{t("ngo.available", { n: open.length })}</h2>
        {open.length === 0 ? <p className="card p-6 text-sm text-muted">{t("ngo.noOpen")}</p> : (
          <ul className="grid gap-4 md:grid-cols-2">
            {open.map((b) => (
              <li key={b.id} className="card overflow-hidden">
                <Photo title={b.title} className="h-28" />
                <div className="flex flex-col gap-1.5 p-4 text-sm">
                  <div className="flex items-start justify-between gap-2"><b className="text-lg">{b.qty} × {b.title}</b><DietTag diet={b.diet} /></div>
                  <span className="text-muted">{b.vendor.businessName} · {hoodLabel(t, b.outlet.neighbourhood)} · {t("units.km", { n: b.km.toFixed(1) })}</span>
                  <span>{t("ngo.allergensLine", { list: b.allergens.length ? b.allergens.map((a) => tOr(t, `allergen.${a}`, a)).join(", ") : t("ngo.noneDeclared") })}</span>
                  <span>{t("ngo.prepared", { when: fmt.dateTime(b.preparedAt) })}{b.listing?.storageNote ? ` · ${b.listing.storageNote}` : ""}</span>
                  <span className="font-bold text-tomato">{t("ngo.collectBy", { time: fmt.time(b.collectBy) })}</span>
                  <span className="text-xs text-muted">{b.outlet.address} · <a className="underline" href={directionsUrl(b.outlet, ngo)} target="_blank" rel="noreferrer">{t("ngo.directions")}</a></span>
                  {approved ? (
                    <ActionButton path={`/api/ngo/batches/${b.id}`} body={{ action: "claim" }} label={t("ngo.claimAll", { qty: b.qty })} className="btn-primary mt-2" successText={t("ngo.claimedMsg")} />
                  ) : (
                    <button className="btn-primary mt-2" disabled title={t("ngo.approvalTitle")}>{t("ngo.claimNeedApproval")}</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="mine-h">
        <h2 id="mine-h" className="editorial mb-3 text-3xl">{t("ngo.myClaims")}</h2>
        {mine.length === 0 ? <p className="text-sm text-muted">{t("ngo.noClaims")}</p> : (
          <ul className="grid gap-3 md:grid-cols-3">
            {mine.map((b) => (
              <li key={b.id} className="card flex flex-col gap-1 p-4 text-sm">
                <div className="flex items-center justify-between"><b>{b.ref}</b><StatusPill status={b.status} /></div>
                <span>{b.qty} × {b.title}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-muted">{b.vendor.businessName}{b.vendor.status === "Approved" && <VerifiedBadge />}</span>
                {b.fromPriorityListing && <span className="chip w-fit bg-peach text-burgundy">{t("prio.title")}</span>}
                {b.status === "Claimed" && (
                  <>
                    <span className="mt-1 text-xs">{t("ngo.showCode")}</span>
                    <span className="display text-4xl tracking-[0.3em] text-tomato">{b.collectionCode}</span>
                    <span className="text-xs font-semibold">{t("ngo.collectBy", { time: fmt.time(b.collectBy) })}</span>
                    <a className="btn-outline mt-1" href={directionsUrl(b.outlet, ngo)} target="_blank" rel="noreferrer">{t("ngo.directionsVendor")}</a>
                    {(() => {
                      const d = db.deliveryRequests.filter((x) => x.batchId === b.id).sort((p, q) => (p.createdAt < q.createdAt ? 1 : -1))[0];
                      return (
                        <ClaimActions batchId={b.id} deliveryEnabled={!!flags.delivery} scheduled={!!b.volunteerName} deliveryActive={!!d && ["Requested", "Rider assigned", "Picked up"].includes(d.status)}
                          deliverySlot={<DeliveryPanel batchId={b.id} delivery={d ? { id: d.id, status: d.status, provider: d.provider, fee: d.fee, riderName: d.riderName, error: d.error } : null} />}
                          scheduleSlot={<ScheduleForm batchId={b.id} serverNow={n} collectBy={b.collectBy} initial={{ slot: b.pickupSlot, name: b.volunteerName, phone: b.volunteerPhone, url: b.volunteerToken ? `/volunteer/${b.volunteerToken}` : undefined }} />} />
                      );
                    })()}
                  </>
                )}
                {b.status === "Collected" && <span className="text-xs font-semibold text-veg">{t("ngo.collected", { when: fmt.dateTime(b.collectedAt!) })}</span>}
                {b.status === "Collected" && flags.distributionLog && (() => {
                  const log = db.distributionLogs.find((x) => x.batchId === b.id);
                  return log
                    ? <span role="status" className="rounded-lg bg-cream p-2 text-xs font-semibold text-burgundy">{t("dist.logged")}: {t("dist.summary", { servings: log.servings, people: log.beneficiaries, centre: log.centreName })}</span>
                    : <DistributionForm batchId={b.id} defaultServings={b.qty} />;
                })()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
