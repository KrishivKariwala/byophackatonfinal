import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { analyticsFor } from "@/lib/vendor";
import { parseRange } from "@/lib/analytics";
import { BarChart } from "@/components/charts";
import { Rating } from "@/components/p1";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor · Analytics" };

export default async function Analytics({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const me = await requirePage("vendor");
  const range = parseRange((await searchParams).range);
  let a;
  try { a = analyticsFor(me, range); } catch { a = null; }
  if (!a) return <div className="mx-auto max-w-xl px-4 py-12"><h1 className="display text-4xl text-tomato">ANALYTICS</h1><p className="mt-2 text-sm text-muted">Complete vendor onboarding to see analytics.</p></div>;
  const empty = a.orders === 0 && a.unitsDonated === 0 && a.unitsExpired === 0;
  const hr = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="display text-4xl text-tomato">ANALYTICS</h1>
        <nav aria-label="Date range" className="flex gap-1">
          {[7, 30, 90].map((r) => (
            <Link key={r} href={`/v/analytics?range=${r}`} aria-current={r === range ? "page" : undefined}
              className={`btn !min-h-[44px] ${r === range ? "bg-tomato text-white" : "border-2 border-line bg-white text-burgundy"}`}>{r} days</Link>
          ))}
        </nav>
      </div>
      {empty ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center"><BarChart3 size={32} className="text-tomato" aria-hidden="true" /><h2 className="editorial text-2xl">No activity in the last {range} days</h2><p className="text-sm text-muted">Publish a listing and complete a handover to see numbers here.</p></div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Summary">
            {[["₹ recovered", `₹${a.recovered}`], ["Units sold", a.unitsSold], ["Donated", a.unitsDonated], ["Expired", a.unitsExpired], ["Sell-through", `${a.sellThroughPct}%`]].map(([k, v]) => (
              <div key={k as string} className="card p-4"><p className="text-xs font-semibold text-muted">{k}</p><p className="display text-3xl text-tomato">{v}</p></div>
            ))}
            <div className="card p-4"><p className="text-xs font-semibold text-muted">Average rating</p><div className="mt-2"><Rating avg={a.avgRating} count={a.ratingCount} /></div></div>
          </section>
          <section className="card p-4"><h2 className="editorial mb-2 text-2xl">₹ recovered per day</h2>
            <BarChart label={`Rupees recovered per day, last ${range} days`} data={a.days.map((d) => ({ key: d.date.slice(5), value: d.recovered }))} format={(n) => `₹${n}`} /></section>
          <section className="card p-4"><h2 className="editorial mb-1 text-2xl">Best-selling hours</h2>
            <p className="mb-2 text-xs text-muted">{a.bestHours.length ? `Top: ${a.bestHours.map((h) => `${hr(h.hour)} (${h.units})`).join(", ")}` : "No sales yet."} · IST, units collected</p>
            <BarChart label="Units collected by hour of day" data={a.hours.map((h) => ({ key: hr(h.hour), value: h.units }))} /></section>
        </>
      )}
    </div>
  );
}
