import { requirePage } from "@/lib/guard";
import { flaggedLists } from "@/lib/admin";
import { Rating } from "@/components/p1";
import { fmtDateTime } from "@/components/bits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Flagged" };

export default async function Flagged() {
  await requirePage("admin");
  const f = flaggedLists();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <h1 className="display text-4xl text-tomato">FLAGGED</h1>
      <section aria-labelledby="fv"><h2 id="fv" className="editorial mb-2 text-2xl">Vendors</h2>
        <p className="mb-2 text-xs text-muted">Average rating below 3.0 with at least 20 ratings, or repeated open reports.</p>
        {f.vendors.length === 0 ? <p className="card p-5 text-sm text-muted">No vendors flagged.</p> : (
          <ul className="flex flex-col gap-3">{f.vendors.map((v) => (
            <li key={v.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div><b>{v.name}</b><ul className="text-xs text-tomato">{v.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
              <Rating avg={v.ratingAvg} count={v.ratingCount} />
            </li>))}</ul>
        )}
      </section>
      <section aria-labelledby="fc"><h2 id="fc" className="editorial mb-2 text-2xl">Customers</h2>
        <p className="mb-2 text-xs text-muted">Repeated no-shows (2+ in 30 days) or currently suspended. Three no-shows in 30 days suspend reservations for 7 days automatically.</p>
        {f.customers.length === 0 ? <p className="card p-5 text-sm text-muted">No customers flagged.</p> : (
          <ul className="flex flex-col gap-3">{f.customers.map((c) => (
            <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <b>{c.name}</b><span>{c.noShows30d} no-show{c.noShows30d === 1 ? "" : "s"} in 30 days</span>
              {c.suspendedUntil ? <span className="chip bg-sand text-tomato">Suspended until {fmtDateTime(c.suspendedUntil)}</span> : <span className="chip bg-peach text-burgundy">Watch</span>}
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
