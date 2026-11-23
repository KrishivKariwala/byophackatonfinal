import Link from "next/link";
import { Plus, ScanLine } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { StatusPill, fmtTime, fmtWindow, DietTag } from "@/components/bits";
import { ActionButton } from "@/components/client";
import { LiveCount } from "@/components/LiveProvider";
import { CancelListingButton, DonationVerify } from "./VendorClient";
import { RepostButton, VendorSettings, VerifiedBadge, Rating } from "@/components/p1";
import { profileCompleteness } from "@/lib/vendor";
import { RULES } from "@/lib/rules";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor · Today" };

export default async function VendorHome() {
  const me = await requirePage("vendor");
  const db = read();
  const n = now(db);
  const v = db.vendors.find((x) => x.ownerId === me.id);
  if (!v) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="display text-4xl text-tomato">WELCOME</h1>
        <p className="mt-2 text-sm text-muted">Complete onboarding to start listing surplus food.</p>
        <Link href="/v/onboarding" className="btn-primary mt-6">Start vendor onboarding</Link>
      </div>
    );
  }
  const approved = v.status === "Approved";
  const listings = db.listings.filter((l) => l.vendorId === v.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const res = db.reservations.filter((r) => r.vendorId === v.id);
  const recent = (iso?: string) => !!iso && n - Date.parse(iso) < 12 * 3600_000;
  const cols = {
    Reserved: res.filter((r) => r.status === "Reserved"),
    Ready: res.filter((r) => r.status === "Ready"),
    "Picked up": res.filter((r) => r.status === "Picked up" && recent(r.pickedUpAt)),
  };
  const lt = (id: string) => db.listings.find((l) => l.id === id)!;
  const pay = (rid: string) => db.payments.find((p) => p.reservationId === rid);
  const live = listings.filter((l) => l.status === "Live");
  const salesToday = res.filter((r) => r.status === "Picked up" && recent(r.pickedUpAt)).reduce((s, r) => s + r.amount, 0);
  const soon = [...cols.Reserved, ...cols.Ready].filter((r) => { const s = Date.parse(lt(r.listingId).windowStart); return s - n < 30 * 60_000 && Date.parse(lt(r.listingId).windowEnd) > n; }).length;
  const outlet = db.outlets.find((o) => o.vendorId === v.id);
  const completeness = profileCompleteness(v, outlet);
  const templates = db.templates.filter((x) => x.vendorId === v.id);
  const batches = db.donationBatches.filter((b) => b.vendorId === v.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex flex-wrap items-center gap-2 text-burgundy">{v.businessName}{approved && <VerifiedBadge />}<Rating avg={v.ratingAvg} count={v.ratingCount} /></p>
          <h1 className="display text-4xl text-tomato sm:text-5xl">TODAY</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {approved ? (
            <>
              <Link href="/v/new" className="btn-primary !px-6 !py-4 text-base"><Plus size={20} aria-hidden="true" />Quick list</Link>
              <Link href="/v/scan" className="btn-outline !px-6 !py-4 text-base"><ScanLine size={20} aria-hidden="true" />Scan &amp; hand over</Link>
            </>
          ) : null}
        </div>
      </div>

      {!approved && (
        <div role="status" className="rounded-2xl border-2 border-tomato bg-cream p-4 text-sm text-burgundy">
          <b>Application {v.status}.</b> {v.status === "Rejected" ? `Reason: ${v.rejectionReason}. ` : ""}
          Only approved vendors can publish listings or accept reservations. <Link className="font-semibold underline" href="/v/onboarding">{v.status === "Rejected" ? "Update and resubmit" : "View application"}</Link>
        </div>
      )}

      {completeness.percent < 100 && (
        <div role="status" className="rounded-2xl border-2 border-peach bg-cream p-4 text-sm text-burgundy">
          <b>Profile {completeness.percent}% complete.</b> Missing: {completeness.missing.join(", ")}. <Link className="font-semibold underline" href="/v/onboarding">Complete your profile</Link>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Today at a glance">
        {[["Live listings", live.length], ["Units left", live.reduce((s, l) => s + l.qtyAvailable, 0)], ["Pickups in next 30 min", soon], ["Collected today (demo ₹)", `₹${salesToday}`]].map(([k, val]) => (
          <div key={k as string} className="card p-4"><p className="text-xs font-semibold text-muted">{k}</p><p className="display text-3xl text-tomato">{val}</p></div>
        ))}
      </section>

      {approved && (
        <section aria-labelledby="tpl-h">
          <h2 id="tpl-h" className="editorial mb-3 text-3xl">Templates</h2>
          {templates.length === 0 ? <p className="text-sm text-muted">No templates yet. Use “Save as template” on any listing below, then repost it in one tap.</p> : (
            <ul className="grid gap-3 md:grid-cols-3">
              {templates.map((tp) => (
                <li key={tp.id} className="card flex items-center justify-between gap-3 p-4 text-sm">
                  <div><b>{tp.title}</b><p className="text-xs text-muted">₹{tp.rescuePrice} · {tp.qty ?? 10} units · {tp.windowMinutes ?? 90} min window</p></div>
                  <RepostButton templateId={tp.id} title={tp.title} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="orders-h">
        <h2 id="orders-h" className="editorial mb-3 text-3xl">Live orders</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(cols) as (keyof typeof cols)[]).map((c) => (
            <div key={c} className="flex flex-col gap-3 rounded-2xl bg-sand p-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-burgundy">{c} · {cols[c].length}</h3>
              {cols[c].length === 0 && <p className="text-xs text-muted">None</p>}
              {cols[c].map((r) => {
                const l = lt(r.listingId);
                const p = pay(r.id);
                const cust = db.profiles.find((x) => x.id === r.customerId)?.name.split(" ")[0];
                return (
                  <div key={r.id} className={`card flex flex-col gap-1 p-3 text-sm ${c === "Ready" ? "ring-2 ring-peach" : ""}`}>
                    <b className="text-base">{r.ref} · {cust}</b>
                    <span>{r.qty} × {l.title}</span>
                    <span className="text-xs text-muted">Pickup {fmtWindow(l.windowStart, l.windowEnd)}</span>
                    <span className="text-xs text-muted">{r.method === "online" ? "Online" : "Pay at pickup"} · {p?.status}{r.method === "pay_at_pickup" && p?.status === "Pending" ? ` · collect ₹${r.amount}` : ""}</span>
                    {c === "Reserved" && approved && <ActionButton path={`/api/vendor/orders/${r.id}/ready`} label="Mark ready" className="btn-primary mt-1" />}
                    {c === "Ready" && <Link href="/v/scan" className="btn-outline mt-1">Scan or enter code</Link>}
                    {c === "Picked up" && <span className="text-xs font-semibold text-veg">Handed over {fmtTime(r.pickedUpAt!)}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="don-h">
        <h2 id="don-h" className="editorial mb-3 text-3xl">Donations</h2>
        {batches.length === 0 ? <p className="text-sm text-muted">No donation batches yet. Turn on “Donate the rest at window end” when listing.</p> : (
          <div className="grid gap-3 md:grid-cols-3">
            {batches.map((b) => {
              const ngo = db.ngos.find((x) => x.id === b.claimedByNgoId);
              return (
                <div key={b.id} className="card flex flex-col gap-1 p-4 text-sm">
                  <div className="flex items-center justify-between"><b>{b.ref}</b><StatusPill status={b.status} /></div>
                  <span>{b.qty} × {b.title}</span>
                  <span className="text-xs text-muted">Collect by {fmtTime(b.collectBy)} · from listing {b.listingId}</span>
                  {ngo && <span className="text-xs">Claimed by <b>{ngo.orgName}</b></span>}
                  {b.status === "Claimed" && approved && <DonationVerify batchId={b.id} />}
                  {b.status === "Collected" && <span role="status" className="text-xs font-semibold text-veg">Handover verified {fmtTime(b.collectedAt!)} · Donation recorded</span>}
                  {b.status === "Open" && <span className="text-xs text-muted">Waiting for an approved NGO to claim.</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {approved && outlet && (
        <section aria-labelledby="set-h">
          <h2 id="set-h" className="editorial mb-3 text-3xl">Settings</h2>
          <VendorSettings payAtPickup={outlet.payAtPickup} maxUnits={v.maxUnitsPerOrder} defaultCap={RULES.MAX_UNITS_PER_ORDER} />
        </section>
      )}

      <section aria-labelledby="list-h">
        <h2 id="list-h" className="editorial mb-3 text-3xl">Listings</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr><th className="p-3">Listing</th><th className="p-3">Status</th><th className="p-3">Left</th><th className="p-3">Price</th><th className="p-3">Window</th><th className="p-3">Donate rest</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const open = ["Live", "Paused", "Sold Out"].includes(l.status);
                return (
                  <tr key={l.id} className="border-b border-line/60 align-top">
                    <td className="p-3"><b>{l.title}</b><div className="mt-1"><DietTag diet={l.diet} /></div></td>
                    <td className="p-3"><StatusPill status={l.status} /></td>
                    <td className="p-3">{open ? <LiveCount listingId={l.id} initial={l.qtyAvailable} /> : "—"} <span className="text-xs text-muted">/ {l.qtyTotal}</span></td>
                    <td className="p-3">₹{l.rescuePrice} <s className="text-xs text-muted">₹{l.originalPrice}</s></td>
                    <td className="p-3 whitespace-nowrap">{fmtWindow(l.windowStart, l.windowEnd)}</td>
                    <td className="p-3">{l.donateRest ? "Yes" : "No"}</td>
                    <td className="p-3">
                      {approved && (
                        <div className="flex flex-wrap gap-2">
                          {open && <Link href={`/v/listings/${l.id}`} className="btn-quiet !min-h-[40px] !py-2">Edit</Link>}
                          {(l.status === "Live" || l.status === "Sold Out") && <ActionButton path={`/api/vendor/listings/${l.id}`} body={{ action: "pause" }} label="Pause" className="btn-quiet !min-h-[40px] !py-2" />}
                          {l.status === "Paused" && <ActionButton path={`/api/vendor/listings/${l.id}`} body={{ action: "resume" }} label="Resume" className="btn-quiet !min-h-[40px] !py-2" />}
                          {open && <CancelListingButton listingId={l.id} />}
                          <Link href={`/v/new?from=${l.id}`} className="btn-quiet !min-h-[40px] !py-2">Duplicate</Link>
                          <ActionButton path="/api/vendor/templates" body={{ listingId: l.id }} label="Save as template" successText="Saved" className="btn-quiet !min-h-[40px] !py-2" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
