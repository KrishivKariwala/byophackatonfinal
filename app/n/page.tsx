import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { distanceKm, directionsUrl } from "@/lib/geo";
import { DietTag, StatusPill, fmtDateTime, fmtTime, Photo } from "@/components/bits";
import { ActionButton } from "@/components/client";
import { ScheduleForm, VerifiedBadge } from "@/components/p1";

export const dynamic = "force-dynamic";
export const metadata = { title: "Donation feed" };

export default async function NgoFeed() {
  const me = await requirePage("ngo");
  const db = read();
  const n = now(db);
  const ngo = db.ngos.find((x) => x.ownerId === me.id);
  if (!ngo) return <div className="mx-auto max-w-xl px-4 py-12"><Link href="/n/onboarding" className="btn-primary">Start NGO verification</Link></div>;
  const approved = ngo.status === "Approved";
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
        <h1 className="display text-4xl text-tomato sm:text-5xl">DONATION FEED</h1>
        <p className="flex items-center gap-2 text-sm font-semibold">{approved && <VerifiedBadge label="Verified NGO" />}</p>
        <p className="text-sm text-muted">Free batches within {ngo.serviceAreaKm} km. Claims are all-or-nothing: the whole batch locks to the first approved NGO.</p>
      </div>
      {!approved && (
        <div role="status" className="rounded-2xl border-2 border-tomato bg-cream p-4 text-sm text-burgundy">
          <b>Verification {ngo.status}.</b> You can view the feed, but only approved NGOs can claim. <Link className="font-semibold underline" href="/n/onboarding">View verification</Link>
        </div>
      )}
      <section aria-labelledby="open-h">
        <h2 id="open-h" className="editorial mb-3 text-3xl">Available now ({open.length})</h2>
        {open.length === 0 ? <p className="card p-6 text-sm text-muted">No open batches nearby. Batches appear when a vendor&apos;s pickup window ends with unreserved food.</p> : (
          <ul className="grid gap-4 md:grid-cols-2">
            {open.map((b) => (
              <li key={b.id} className="card overflow-hidden">
                <Photo title={b.title} className="h-28" />
                <div className="flex flex-col gap-1.5 p-4 text-sm">
                  <div className="flex items-start justify-between gap-2"><b className="text-lg">{b.qty} × {b.title}</b><DietTag diet={b.diet} /></div>
                  <span className="text-muted">{b.vendor.businessName} · {b.outlet.neighbourhood} · {b.km.toFixed(1)} km</span>
                  <span>Allergens (vendor-supplied): {b.allergens.length ? b.allergens.join(", ") : "none declared"}</span>
                  <span>Prepared {fmtDateTime(b.preparedAt)}{b.listing?.storageNote ? ` · ${b.listing.storageNote}` : ""}</span>
                  <span className="font-bold text-tomato">Collect by {fmtTime(b.collectBy)}</span>
                  <span className="text-xs text-muted">{b.outlet.address} · <a className="underline" href={directionsUrl(b.outlet, ngo)} target="_blank" rel="noreferrer">Directions</a></span>
                  {approved ? (
                    <ActionButton path={`/api/ngo/batches/${b.id}`} body={{ action: "claim" }} label={`Claim all ${b.qty} · free`} className="btn-primary mt-2" successText="Claimed — see your collection code below." />
                  ) : (
                    <button className="btn-primary mt-2" disabled title="Approval required">Claim (approval required)</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="mine-h">
        <h2 id="mine-h" className="editorial mb-3 text-3xl">My claims</h2>
        {mine.length === 0 ? <p className="text-sm text-muted">No claims yet.</p> : (
          <ul className="grid gap-3 md:grid-cols-3">
            {mine.map((b) => (
              <li key={b.id} className="card flex flex-col gap-1 p-4 text-sm">
                <div className="flex items-center justify-between"><b>{b.ref}</b><StatusPill status={b.status} /></div>
                <span>{b.qty} × {b.title}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-muted">{b.vendor.businessName}{b.vendor.status === "Approved" && <VerifiedBadge />}</span>
                {b.status === "Claimed" && (
                  <>
                    <span className="mt-1 text-xs">Show this collection code to the vendor:</span>
                    <span className="display text-4xl tracking-[0.3em] text-tomato">{b.collectionCode}</span>
                    <span className="text-xs font-semibold">Collect by {fmtTime(b.collectBy)}</span>
                    <a className="btn-outline mt-1" href={directionsUrl(b.outlet, ngo)} target="_blank" rel="noreferrer">Directions to vendor</a>
                    <ScheduleForm batchId={b.id} serverNow={n} collectBy={b.collectBy} initial={{ slot: b.pickupSlot, name: b.volunteerName, phone: b.volunteerPhone, url: b.volunteerToken ? `/volunteer/${b.volunteerToken}` : undefined }} />
                    <ActionButton path={`/api/ngo/batches/${b.id}`} body={{ action: "release" }} label="Release claim" className="btn-quiet" confirm="Release this batch so another NGO can collect it?" />
                  </>
                )}
                {b.status === "Collected" && <span className="text-xs font-semibold text-veg">Collected {fmtDateTime(b.collectedAt!)}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
