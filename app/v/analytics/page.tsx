import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { analyticsFor } from "@/lib/vendor";
import { parseRange } from "@/lib/analytics";
import { BarChart } from "@/components/charts";
import { Rating } from "@/components/p1";
import { vendorScope } from "@/lib/p2/scope";
import { OutletSwitcher, CertificatesPanel } from "@/components/p2";
import { listCertificates, monthOf } from "@/lib/p2/certificate";
import { isFlagOn } from "@/lib/p2/platform";
import { now, read } from "@/lib/store";
import { orgOverview } from "@/lib/p2/team";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.analytics") };
}

export default async function Analytics({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const me = await requirePage("vendor");
  const { t } = await getT();
  const range = parseRange((await searchParams).range);
  const scope = await vendorScope(me);
  let a;
  let why = t("vanalytics.whyOnboard");
  try { a = analyticsFor(me, range, scope.selected !== "all" ? scope.selected : undefined); } catch (e) { a = null; if ((e as { code?: string }).code === "forbidden_role") why = t("vanalytics.whyRole"); }
  if (!a) return <div className="mx-auto max-w-xl px-4 py-12"><h1 className="display text-4xl text-tomato">{t("vanalytics.title")}</h1><p role="status" className="mt-2 text-sm text-muted">{why}</p></div>;
  const byOutlet = scope.outlets.length > 1 && scope.selected === "all" ? orgOverview(me, range) : null;
  const certs = isFlagOn("impactCertificate") && scope.can("certificate.view") ? listCertificates(me) : null;
  const months = Array.from({ length: 6 }, (_, k) => { const [y, m] = monthOf(now(read())).split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 - k, 1)); return d.toISOString().slice(0, 7); });
  const empty = a.orders === 0 && a.unitsDonated === 0 && a.unitsExpired === 0;
  const hr = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="display text-4xl text-tomato">{t("vanalytics.title")}</h1>
        <OutletSwitcher selected={scope.selected} outlets={scope.outlets.map((o) => ({ id: o.id, label: o.name ?? o.address }))} />
        <nav aria-label={t("vanalytics.dateRange")} className="flex gap-1">
          {[7, 30, 90].map((r) => (
            <Link key={r} href={`/v/analytics?range=${r}`} aria-current={r === range ? "page" : undefined}
              className={`btn !min-h-[44px] ${r === range ? "bg-tomato text-white" : "border-2 border-line bg-white text-burgundy"}`}>{t("vanalytics.days", { n: r })}</Link>
          ))}
        </nav>
      </div>
      {certs && <CertificatesPanel months={months} certs={certs.map((c) => ({ id: c.id, month: c.month, partial: !!c.partial, meals: c.mealsSold + c.mealsDonated, createdAt: c.createdAt }))} />}
      {empty ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center"><BarChart3 size={32} className="text-tomato" aria-hidden="true" /><h2 className="editorial text-2xl">{t("vanalytics.noActivity", { n: range })}</h2><p className="text-sm text-muted">{t("vanalytics.noActivityBody")}</p></div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label={t("vanalytics.summary")}>
            {[[t("vanalytics.recovered"), `₹${a.recovered}`], [t("vanalytics.unitsSold"), a.unitsSold], [t("cert.donated"), a.unitsDonated], [t("status.Expired"), a.unitsExpired], [t("vanalytics.sellThrough"), `${a.sellThroughPct}%`]].map(([k, v]) => (
              <div key={k as string} className="card p-4"><p className="text-xs font-semibold text-muted">{k}</p><p className="display text-3xl text-tomato">{v}</p></div>
            ))}
            <div className="card p-4"><p className="text-xs font-semibold text-muted">{t("vanalytics.avgRating")}</p><div className="mt-2"><Rating avg={a.avgRating} count={a.ratingCount} /></div></div>
          </section>
          {byOutlet && (
            <section className="card overflow-x-auto p-4" aria-labelledby="out-an">
              <h2 id="out-an" className="editorial mb-2 text-2xl">{t("org.analyticsByOutlet")}</h2>
              <table className="w-full min-w-[480px] text-left text-sm">
                <caption className="sr-only">{t("vanalytics.outletCaption", { n: range })}</caption>
                <thead className="border-b border-line text-xs uppercase text-muted"><tr><th className="p-2">{t("org.outlet")}</th><th className="p-2">{t("vanalytics.recovered")}</th><th className="p-2">{t("vanalytics.sold")}</th><th className="p-2">{t("cert.donated")}</th><th className="p-2">{t("status.Expired")}</th><th className="p-2">{t("vanalytics.sellThrough")}</th></tr></thead>
                <tbody>{byOutlet.rows.map((r) => (<tr key={r.outlet.id} className="border-b border-line/60"><td className="p-2 font-semibold">{r.outlet.name ?? r.outlet.address}</td><td className="p-2">₹{r.recovered}</td><td className="p-2">{r.unitsSold}</td><td className="p-2">{r.unitsDonated}</td><td className="p-2">{r.unitsExpired}</td><td className="p-2">{r.sellThroughPct}%</td></tr>))}</tbody>
                <tfoot><tr className="font-bold"><td className="p-2">{t("org.allOutlets")}</td><td className="p-2">₹{byOutlet.total.recovered}</td><td className="p-2">{byOutlet.total.unitsSold}</td><td className="p-2">{byOutlet.total.unitsDonated}</td><td className="p-2">{byOutlet.total.unitsExpired}</td><td className="p-2" /></tr></tfoot>
              </table>
            </section>
          )}
          <section className="card p-4"><h2 className="editorial mb-2 text-2xl">{t("vanalytics.perDay")}</h2>
            <BarChart label={t("vanalytics.perDayChart", { n: range })} data={a.days.map((d) => ({ key: d.date.slice(5), value: d.recovered }))} format={(n) => `₹${n}`} /></section>
          <section className="card p-4"><h2 className="editorial mb-1 text-2xl">{t("vanalytics.bestHours")}</h2>
            <p className="mb-2 text-xs text-muted">{a.bestHours.length ? t("vanalytics.top", { list: a.bestHours.map((h) => `${hr(h.hour)} (${h.units})`).join(", ") }) : t("vanalytics.noSales")} · {t("vanalytics.istNote")}</p>
            <BarChart label={t("vanalytics.hourChart")} data={a.hours.map((h) => ({ key: hr(h.hour), value: h.units }))} /></section>
        </>
      )}
    </div>
  );
}
