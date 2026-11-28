import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { now, readDb } from "@/lib/store";
import { vendorScope } from "@/lib/p2/scope";
import { kitchenEnabled, themeForVendor } from "@/lib/kitchen-themes";
import { getT } from "@/lib/i18n/server";
import { statusLabel } from "@/components/i18n-helpers";
import { ThemeFrame } from "@/components/kitchen/ThemeFrame";
import { ActionButton } from "@/components/client";
import { LiveCount } from "@/components/LiveProvider";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getT(); return { title: `${t("kitchen.board.title")} (test)` }; }

/**
 * TEST FEATURE: where a vendor lands after listing food: how many live orders there are and how many units are left, in the restaurant's own look.
 * It updates by itself (the site already refreshes server pages whenever an order or a stock count changes).
 */
export default async function Board({ searchParams }: { searchParams: Promise<{ outlet?: string }> }) {
  if (!kitchenEnabled()) notFound();
  const me = await requirePage("vendor");
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  if (!v || v.status !== "Approved") redirect("/v/new");
  const sp = await searchParams;
  const db = await readDb();
  const n = now(db);
  const { t, fmt } = await getT();
  const theme = themeForVendor(v.id);
  const picked = scope.outlets.find((o) => o.id === sp.outlet);
  const ids = picked ? [picked.id] : scope.outlets.map((o) => o.id);
  const short = (id: string) => (scope.outlets.find((o) => o.id === id)?.name ?? "").replace(/^.*·\s*/, "");
  const live = db.listings.filter((l) => l.vendorId === v.id && ids.includes(l.outletId) && l.status === "Live").sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const res = db.reservations.filter((r) => r.vendorId === v.id && ids.includes(r.outletId));
  const open = res.filter((r) => r.status === "Reserved" || r.status === "Ready");
  const collected = res.filter((r) => r.status === "Picked up" && r.pickedUpAt && n - Date.parse(r.pickedUpAt) < 12 * 3600_000).reduce((s, r) => s + r.amount, 0);
  const lt = (id: string) => db.listings.find((l) => l.id === id);
  const canFulfil = scope.can("order.fulfil");
  const kitchenHref = `/v/kitchen?outlet=${encodeURIComponent(picked?.id ?? scope.outlets[0].id)}`;
  const card = "rounded-[22px] border-2 p-4 shadow-[0_10px_30px_rgba(0,0,0,.35)]";
  const cardStyle = { background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-ink)" } as const;

  return (
    <ThemeFrame theme={theme} back="outlets">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em]" style={{ color: "var(--k-brass)" }}>{v.businessName}{picked ? ` · ${short(picked.id)}` : ""}</p>
          <h1 className="k-display text-[2.2rem] leading-[1.05] sm:text-5xl" style={{ color: "var(--k-cream)" }}>{t("kitchen.board.title")}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={kitchenHref} className="inline-flex min-h-[50px] items-center rounded-2xl px-5 text-base font-extrabold text-white" style={{ background: "var(--k-accent)" }}>{t("kitchen.board.kitchen")}</Link>
            <Link href="/v/handover" className="inline-flex min-h-[50px] items-center rounded-2xl border-2 px-5 text-base font-extrabold" style={{ borderColor: "var(--k-brass)", color: "var(--k-cream)" }}>{t("kitchen.board.scan")}</Link>
            <Link href="/v/outlets" className="inline-flex min-h-[50px] items-center rounded-2xl border-2 px-5 text-base font-extrabold" style={{ borderColor: "var(--k-brass)", color: "var(--k-cream)" }}>{t("kitchen.board.switch")}</Link>
          </div>
          {scope.outlets.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("kitchen.outlet")}>
              {[{ id: "", label: "All" }, ...scope.outlets.map((o) => ({ id: o.id, label: short(o.id) }))].map((o) => (
                <Link key={o.id || "all"} href={o.id ? `/v/board?outlet=${encodeURIComponent(o.id)}` : "/v/board"} aria-current={(picked?.id ?? "") === o.id} className="min-h-[40px] rounded-full border-2 px-4 py-2 text-sm font-extrabold"
                  style={(picked?.id ?? "") === o.id ? { background: "var(--k-cream)", color: "var(--k-brand)", borderColor: "var(--k-brass)" } : { borderColor: "color-mix(in srgb, var(--k-brass) 60%, transparent)", color: "var(--k-cream)" }}>{o.label}</Link>
              ))}
            </div>
          )}
        </div>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label={t("kitchen.board.title")}>
          {[[t("kitchen.board.live"), live.length], [t("kitchen.board.units"), live.reduce((s, l) => s + l.qtyAvailable, 0)], [t("kitchen.board.waiting"), open.length], [t("kitchen.board.collected"), fmt.inr(collected)]].map(([k, val]) => (
            <div key={k as string} className={card} style={cardStyle}><p className="text-xs font-bold uppercase tracking-wider k-m60">{k}</p><p className="k-display mt-1 text-4xl leading-none" style={{ color: "var(--k-brand)" }}>{val}</p></div>
          ))}
        </section>

        <section aria-labelledby="ord-h">
          <h2 id="ord-h" className="k-display mb-3 text-3xl" style={{ color: "var(--k-cream)" }}>{t("kitchen.board.orders")}</h2>
          {open.length === 0 ? <p className="text-base" style={{ color: "color-mix(in srgb, var(--k-cream) 80%, transparent)" }}>{t("kitchen.board.noOrders")}</p> : (
            <ul className="grid gap-3 md:grid-cols-2">
              {open.map((r) => {
                const l = lt(r.listingId); const cust = db.profiles.find((x) => x.id === r.customerId)?.name.split(" ")[0];
                return (
                  <li key={r.id} className={`${card} flex flex-col gap-1.5 text-sm`} style={{ ...cardStyle, borderColor: r.status === "Ready" ? "var(--k-accent)" : "var(--k-brass)" }}>
                    <div className="flex items-center justify-between gap-2"><b className="k-display text-xl" style={{ color: "var(--k-brand)" }}>{r.ref} · {cust}</b>
                      <span className="rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ background: r.status === "Ready" ? "#1a8f3c" : "var(--k-brand)" }}>{statusLabel(t, r.status)}</span></div>
                    <span className="text-base font-semibold">{r.qty} × {l?.title}{scope.outlets.length > 1 && <span className="text-xs k-m60"> · {short(r.outletId)}</span>}</span>
                    {l && <span className="text-xs k-m70">{t("kitchen.board.pickup", { window: fmt.window(l.windowStart, l.windowEnd) })}</span>}
                    {r.status === "Reserved" && canFulfil && <ActionButton path={`/api/vendor/orders/${r.id}/ready`} label={t("kitchen.board.ready")} className="mt-1 inline-flex min-h-[48px] items-center justify-center rounded-2xl px-5 text-base font-extrabold text-white [background:var(--k-brand)]" />}
                    {r.status === "Ready" && <Link href="/v/handover" className="mt-1 inline-flex min-h-[48px] items-center justify-center rounded-2xl border-2 px-5 text-base font-extrabold" style={{ borderColor: "var(--k-brand)", color: "var(--k-brand)" }}>{t("kitchen.board.toHand")}</Link>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="cnt-h">
          <h2 id="cnt-h" className="k-display mb-3 text-3xl" style={{ color: "var(--k-cream)" }}>{t("kitchen.board.counter")}</h2>
          {live.length === 0 ? <p className="text-base" style={{ color: "color-mix(in srgb, var(--k-cream) 80%, transparent)" }}>{t("kitchen.board.empty")}</p> : (
            <ul className="grid gap-3 md:grid-cols-2">
              {live.map((l) => (
                <li key={l.id} className={`${card} flex items-center gap-3`} style={cardStyle}>
                  {l.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-full border-2 object-cover" style={{ borderColor: "var(--k-brass)" }} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="k-display truncate text-xl leading-tight" style={{ color: "var(--k-brand)" }}>{l.title}{scope.outlets.length > 1 && <span className="text-xs font-normal k-m60"> · {short(l.outletId)}</span>}</p>
                    <p className="text-xs k-m70">{t("kitchen.board.pickup", { window: fmt.window(l.windowStart, l.windowEnd) })} · {fmt.inr(l.rescuePrice)}</p>
                  </div>
                  <div className="text-right"><p className="k-display text-3xl leading-none" style={{ color: "var(--k-accent)" }}><LiveCount listingId={l.id} initial={l.qtyAvailable} /></p><p className="text-[11px] font-bold uppercase tracking-wider k-m60">{t("kitchen.board.left", { total: l.qtyTotal })}</p></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ThemeFrame>
  );
}
