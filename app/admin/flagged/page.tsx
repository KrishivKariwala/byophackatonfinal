import { requirePage } from "@/lib/guard";
import { flaggedLists } from "@/lib/admin";
import { read, now } from "@/lib/store";
import { reliability } from "@/lib/reliability";
import { Rating } from "@/components/p1";

import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.adminFlagged") };
}

export default async function Flagged() {
  await requirePage("admin");
  const { t, fmt } = await getT();
  const f = flaggedLists();
  const db = read();
  const rel = db.vendors.map((v) => ({ v, r: reliability(db, v, now(db)) })).sort((a, b) => a.r.score - b.r.score);
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <h1 className="page-title">{t("admin.flaggedTitle")}</h1>
      <section aria-labelledby="fv"><h2 id="fv" className="editorial mb-2 text-2xl">{t("admin.vendors")}</h2>
        <p className="mb-2 text-xs text-muted">{t("admin.flagVendorsHelp")}</p>
        {f.vendors.length === 0 ? <p className="card p-5 text-sm text-muted">{t("admin.noVendorsFlagged")}</p> : (
          <ul className="flex flex-col gap-3">{f.vendors.map((v) => (
            <li key={v.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div><b>{v.name}</b><ul className="text-xs text-tomato">{v.reasonItems.map((r) => <li key={r.key}>{t(r.key, r.vars)}</li>)}</ul></div>
              <Rating avg={v.ratingAvg} count={v.ratingCount} />
            </li>))}</ul>
        )}
      </section>
      <section aria-labelledby="rel-h"><h2 id="rel-h" className="editorial mb-2 text-2xl">{t("admin.reliability.title")}</h2>
        <p className="mb-2 text-xs text-muted">{t("admin.reliability.help")}</p>
        <ul className="flex flex-col gap-2">{rel.map(({ v, r }) => (
          <li key={v.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div><b>{v.businessName}</b><p className="text-xs text-muted">{t("admin.reliability.parts", { rating: r.parts.rating, cancel: r.parts.cancellations, reports: r.parts.reports })}</p></div>
            <div className="flex items-center gap-2">
              {r.low && <span className="chip bg-sand text-tomato">{t("admin.reliability.low")}</span>}
              <b className="stat-num !text-2xl">{r.score}</b><span className="text-xs text-muted">/ 100</span>
            </div>
          </li>))}</ul>
      </section>
      <section aria-labelledby="fc"><h2 id="fc" className="editorial mb-2 text-2xl">{t("admin.customers")}</h2>
        <p className="mb-2 text-xs text-muted">{t("admin.flagCustomersHelp")}</p>
        {f.customers.length === 0 ? <p className="card p-5 text-sm text-muted">{t("admin.noCustomersFlagged")}</p> : (
          <ul className="flex flex-col gap-3">{f.customers.map((c) => (
            <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <b>{c.name}</b><span>{t("admin.noShows", { n: c.noShows30d })}</span>
              {c.suspendedUntil ? <span className="chip bg-sand text-tomato">{t("admin.suspendedUntil", { when: fmt.dateTime(c.suspendedUntil) })}</span> : <span className="chip bg-peach text-burgundy">{t("admin.watch")}</span>}
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
