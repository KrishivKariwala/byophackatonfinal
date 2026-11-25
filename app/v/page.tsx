import Link from "next/link";
import { Plus, ScanLine } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { StatusPill, DietTag } from "@/components/bits";
import { ActionButton } from "@/components/client";
import { LiveCount } from "@/components/LiveProvider";
import { CancelListingButton, DonationVerify } from "./VendorClient";
import { RepostButton, VendorSettings, VerifiedBadge, Rating } from "@/components/p1";
import { profileCompleteness } from "@/lib/vendor";
import { RULES } from "@/lib/rules";
import { vendorScope } from "@/lib/p2/scope";
import { OutletSwitcher } from "@/components/p2";
import { getT } from "@/lib/i18n/server";
import { boardEta } from "@/lib/p2/eta";
import { statusLabel, tOr } from "@/components/i18n-helpers";

// profileCompleteness() returns English field names; map them to catalog keys for display.
const MISSING_KEYS: Record<string, string> = { "FSSAI number": "fssai", Address: "address", "Map location (lat/lng)": "map", "Operating hours": "hours", "Payout UPI": "upi", Logo: "logo" };

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.vendorToday") };
}

export default async function VendorHome() {
  const me = await requirePage("vendor");
  const db = read();
  const n = now(db);
  const { t, fmt } = await getT();
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  if (!v || !scope.ctx) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <h1 className="display text-4xl text-tomato">{t("vdash.welcome")}</h1>
        <p className="mt-2 text-sm text-muted">{t("vdash.completeOnb")}</p>
        <Link href="/v/onboarding" className="btn-primary mt-6">{t("vdash.startOnb")}</Link>
      </div>
    );
  }
  const approved = v.status === "Approved";
  const inScope = (outletId: string) => scope.scopeIds.includes(outletId);
  const canList = scope.can("listing.write");
  const multi = scope.outlets.length > 1;
  const outletLabel = (id: string) => { const o = scope.outlets.find((x) => x.id === id); return o ? (o.name ?? o.address) : ""; };
  const listings = db.listings.filter((l) => l.vendorId === v.id && inScope(l.outletId)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const res = db.reservations.filter((r) => r.vendorId === v.id && inScope(r.outletId));
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
  const outlet = scope.outlets.find((o) => o.id === scope.selected) ?? scope.outlets[0];
  const completeness = profileCompleteness(v, outlet);
  const templates = db.templates.filter((x) => x.vendorId === v.id);
  const batches = db.donationBatches.filter((b) => b.vendorId === v.id && inScope(b.outletId)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex flex-wrap items-center gap-2 text-burgundy">{v.businessName}{approved && <VerifiedBadge />}<Rating avg={v.ratingAvg} count={v.ratingCount} /></p>
          <h1 className="display text-4xl text-tomato sm:text-5xl">{t("vdash.today")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OutletSwitcher selected={scope.selected} outlets={scope.outlets.map((o) => ({ id: o.id, label: o.name ?? o.address }))} />
          {approved ? (
            <>
              {canList && <Link href="/v/new" className="btn-primary !px-6 !py-4 text-base"><Plus size={20} aria-hidden="true" />{t("nav.quickList")}</Link>}
              <Link href="/v/scan" className="btn-outline !px-6 !py-4 text-base"><ScanLine size={20} aria-hidden="true" />{t("nav.scan")}</Link>
            </>
          ) : null}
        </div>
      </div>

      {!approved && (
        <div role="status" className="rounded-2xl border-2 border-tomato bg-cream p-4 text-sm text-burgundy">
          <b>{t("vdash.appStatus", { status: statusLabel(t, v.status) })}</b> {v.status === "Rejected" ? `${t("vdash.reason", { reason: v.rejectionReason ?? "" })} ` : ""}
          {t("vdash.onlyApproved")} <Link className="font-semibold underline" href="/v/onboarding">{v.status === "Rejected" ? t("vdash.updateResubmit") : t("vdash.viewApp")}</Link>
        </div>
      )}

      {scope.ctx.role === "staff" && outlet && (
        <p role="status" className="rounded-2xl bg-cream p-3 text-sm font-semibold text-burgundy">{t("org.staffNote", { outlet: outlet.name ?? outlet.address })}</p>
      )}

      {completeness.percent < 100 && scope.ctx.role === "owner" && (
        <div role="status" className="rounded-2xl border-2 border-peach bg-cream p-4 text-sm text-burgundy">
          <b>{t("vdash.profile", { pct: completeness.percent })}</b> {t("vdash.missing", { list: completeness.missing.map((m) => tOr(t, `vdash.miss.${MISSING_KEYS[m] ?? m}`, m)).join(", ") })} <Link className="font-semibold underline" href="/v/onboarding">{t("vdash.completeProfile")}</Link>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label={t("vdash.glance")}>
        {[[t("vdash.liveListings"), live.length], [t("vdash.unitsLeft"), live.reduce((s, l) => s + l.qtyAvailable, 0)], [t("vdash.pickups30"), soon], [t("vdash.collectedToday"), `₹${salesToday}`]].map(([k, val]) => (
          <div key={k as string} className="card p-4"><p className="text-xs font-semibold text-muted">{k}</p><p className="display text-3xl text-tomato">{val}</p></div>
        ))}
      </section>

      {approved && canList && (
        <section aria-labelledby="tpl-h">
          <h2 id="tpl-h" className="editorial mb-3 text-3xl">{t("vdash.templates")}</h2>
          {templates.length === 0 ? <p className="text-sm text-muted">{t("vdash.noTemplates")}</p> : (
            <ul className="grid gap-3 md:grid-cols-3">
              {templates.map((tp) => (
                <li key={tp.id} className="card flex items-center justify-between gap-3 p-4 text-sm">
                  <div><b>{tp.title}</b><p className="text-xs text-muted">{t("vdash.tplLine", { price: tp.rescuePrice, qty: tp.qty ?? 10, min: tp.windowMinutes ?? 90 })}</p></div>
                  <RepostButton templateId={tp.id} title={tp.title} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="orders-h">
        <h2 id="orders-h" className="editorial mb-3 text-3xl">{t("vdash.liveOrders")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(cols) as (keyof typeof cols)[]).map((c) => (
            <div key={c} className="flex flex-col gap-3 rounded-2xl bg-sand p-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-burgundy">{statusLabel(t, c)} · {cols[c].length}</h3>
              {cols[c].length === 0 && <p className="text-xs text-muted">{t("vdash.none")}</p>}
              {cols[c].map((r) => {
                const l = lt(r.listingId);
                const p = pay(r.id);
                const cust = db.profiles.find((x) => x.id === r.customerId)?.name.split(" ")[0];
                const eta = c === "Picked up" ? null : boardEta(db, r, n);
                return (
                  <div key={r.id} className={`card flex flex-col gap-1 p-3 text-sm ${c === "Ready" ? "ring-2 ring-peach" : ""}`}>
                    <b className="text-base">{r.ref} · {cust}</b>
                    <span>{r.qty} × {l.title}{multi && <span className="text-xs text-muted"> · {outletLabel(r.outletId)}</span>}</span>
                    {eta && (
                      <span role="status" className={`rounded-lg px-2 py-1 text-xs font-bold ${eta.stale ? "bg-sand text-muted" : eta.minutes <= 2 ? "bg-veg text-white" : "bg-peach text-burgundy"}`}>
                        {eta.stale ? t("eta.vendorStale", { n: eta.minutes, m: Math.max(1, Math.round(eta.ageSeconds / 60)) }) : eta.minutes <= 1 ? t("eta.arriving") : t("eta.vendor", { n: eta.minutes })}
                      </span>
                    )}
                    <span className="text-xs text-muted">{t("vdash.pickup", { window: fmt.window(l.windowStart, l.windowEnd) })}</span>
                    <span className="text-xs text-muted">{r.method === "online" ? t("vdash.online") : t("listing.payAtPickup")} · {p ? statusLabel(t, p.status) : null}{r.method === "pay_at_pickup" && p?.status === "Pending" ? ` · ${t("vdash.collect", { amount: r.amount })}` : ""}</span>
                    {c === "Reserved" && approved && <ActionButton path={`/api/vendor/orders/${r.id}/ready`} label={t("vdash.markReady")} className="btn-primary mt-1" />}
                    {c === "Ready" && <Link href="/v/scan" className="btn-outline mt-1">{t("vdash.scanOrEnter")}</Link>}
                    {c === "Picked up" && <span className="text-xs font-semibold text-veg">{t("vdash.handedOver", { time: fmt.time(r.pickedUpAt!) })}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="don-h">
        <h2 id="don-h" className="editorial mb-3 text-3xl">{t("vdash.donations")}</h2>
        {batches.length === 0 ? <p className="text-sm text-muted">{t("vdash.noBatches")}</p> : (
          <div className="grid gap-3 md:grid-cols-3">
            {batches.map((b) => {
              const ngo = db.ngos.find((x) => x.id === b.claimedByNgoId);
              return (
                <div key={b.id} className="card flex flex-col gap-1 p-4 text-sm">
                  <div className="flex items-center justify-between"><b>{b.ref}</b><StatusPill status={b.status} /></div>
                  <span>{b.qty} × {b.title}</span>
                  <span className="text-xs text-muted">{t("vdash.collectBy", { time: fmt.time(b.collectBy), id: b.listingId })}</span>
                  {ngo && <span className="text-xs">{t("vdash.claimedBy")} <b>{ngo.orgName}</b></span>}
                  {(() => { const d = db.deliveryRequests.filter((x) => x.batchId === b.id && ["Rider assigned", "Picked up", "Requested"].includes(x.status))[0]; return d ? <span role="status" className="rounded-lg bg-peach p-2 text-xs font-semibold text-burgundy">{t(`deliv.status.${d.status}`)}{d.riderName ? ` · ${d.riderName}` : ""} · {t("vdash.checkCode")}</span> : null; })()}
                  {b.volunteerName && <span className="rounded-lg bg-cream p-2 text-xs text-burgundy">{t("vdash.volunteerComing")} <b>{b.volunteerName}</b> · {b.volunteerPhone}{b.pickupSlot ? ` · ${fmt.time(b.pickupSlot)}` : ""}</span>}
                  {b.origin === "no_show" && <span className="text-[11px] text-muted">{t("vdash.fromNoShow")}</span>}
                  {b.status === "Claimed" && approved && <DonationVerify batchId={b.id} />}
                  {b.status === "Collected" && <span role="status" className="text-xs font-semibold text-veg">{t("vdash.handoverVerified", { time: fmt.time(b.collectedAt!) })}</span>}
                  {(() => { const log = db.distributionLogs.find((x) => x.batchId === b.id); return log ? <span className="rounded-lg bg-cream p-2 text-xs text-burgundy"><b>{t("dist.vendorTitle")}:</b> {t("dist.summary", { servings: log.servings, people: log.beneficiaries, centre: log.centreName })}{log.photoUrls.length > 0 && scope.can("distribution.view") ? <span className="mt-1 flex flex-wrap gap-2">{log.photoUrls.map((u) => (<a key={u} href={u} target="_blank" rel="noreferrer" className="underline">{t("vdash.photo")}</a>))}</span> : null}</span> : null; })()}
                  {b.status === "Open" && <span className="text-xs text-muted">{t("vdash.waitingNgo")}</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {approved && outlet && scope.can("outlet.settings") && (
        <section aria-labelledby="set-h">
          <h2 id="set-h" className="editorial mb-3 text-3xl">{t("vdash.settings")}</h2>
          <VendorSettings payAtPickup={outlet.payAtPickup} maxUnits={v.maxUnitsPerOrder} defaultCap={RULES.MAX_UNITS_PER_ORDER} outletId={outlet.id} canSetCap={scope.can("org.settings")} />
        </section>
      )}

      <section aria-labelledby="list-h">
        <h2 id="list-h" className="editorial mb-3 text-3xl">{t("vdash.listings")}</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr><th className="p-3">{t("vdash.col.listing")}</th><th className="p-3">{t("vdash.col.status")}</th><th className="p-3">{t("vdash.col.left")}</th><th className="p-3">{t("vdash.col.price")}</th><th className="p-3">{t("vdash.col.window")}</th><th className="p-3">{t("vdash.col.donateRest")}</th><th className="p-3">{t("vdash.col.actions")}</th></tr>
            </thead>
            <tbody>
              {listings.map((l) => {
                const open = ["Live", "Paused", "Sold Out"].includes(l.status);
                return (
                  <tr key={l.id} className="border-b border-line/60 align-top">
                    <td className="p-3"><b>{l.title}</b>{multi && <p className="text-xs text-muted">{outletLabel(l.outletId)}</p>}<div className="mt-1"><DietTag diet={l.diet} /></div></td>
                    <td className="p-3"><StatusPill status={l.status} /></td>
                    <td className="p-3">{open ? <LiveCount listingId={l.id} initial={l.qtyAvailable} /> : "—"} <span className="text-xs text-muted">/ {l.qtyTotal}</span></td>
                    <td className="p-3">₹{l.rescuePrice} <s className="text-xs text-muted">₹{l.originalPrice}</s></td>
                    <td className="p-3 whitespace-nowrap">{fmt.window(l.windowStart, l.windowEnd)}</td>
                    <td className="p-3">{l.donateRest ? t("common.yes") : t("common.no")}</td>
                    <td className="p-3">
                      {approved && canList && (
                        <div className="flex flex-wrap gap-2">
                          {open && <Link href={`/v/listings/${l.id}`} className="btn-quiet !min-h-[40px] !py-2">{t("common.edit")}</Link>}
                          {(l.status === "Live" || l.status === "Sold Out") && <ActionButton path={`/api/vendor/listings/${l.id}`} body={{ action: "pause" }} label={t("vdash.pause")} className="btn-quiet !min-h-[40px] !py-2" />}
                          {l.status === "Paused" && <ActionButton path={`/api/vendor/listings/${l.id}`} body={{ action: "resume" }} label={t("vdash.resume")} className="btn-quiet !min-h-[40px] !py-2" />}
                          {open && <CancelListingButton listingId={l.id} />}
                          <Link href={`/v/new?from=${l.id}`} className="btn-quiet !min-h-[40px] !py-2">{t("vdash.duplicate")}</Link>
                          <ActionButton path="/api/vendor/templates" body={{ listingId: l.id }} label={t("vdash.saveTemplate")} successText={t("common.saved")} className="btn-quiet !min-h-[40px] !py-2" />
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
