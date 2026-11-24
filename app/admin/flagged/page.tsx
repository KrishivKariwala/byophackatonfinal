import { requirePage } from "@/lib/guard";
import { flaggedLists } from "@/lib/admin";
import { Rating } from "@/components/p1";
import { fmtDateTime } from "@/components/bits";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Flagged" };

export default async function Flagged() {
  await requirePage("admin");
  const { t } = await getT();
  const f = flaggedLists();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <h1 className="display text-4xl text-tomato">{t("admin.flaggedTitle")}</h1>
      <section aria-labelledby="fv"><h2 id="fv" className="editorial mb-2 text-2xl">{t("admin.vendors")}</h2>
        <p className="mb-2 text-xs text-muted">{t("admin.flagVendorsHelp")}</p>
        {f.vendors.length === 0 ? <p className="card p-5 text-sm text-muted">{t("admin.noVendorsFlagged")}</p> : (
          <ul className="flex flex-col gap-3">{f.vendors.map((v) => (
            <li key={v.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div><b>{v.name}</b><ul className="text-xs text-tomato">{v.reasons.map((r) => <li key={r}>{r}</li>)}</ul></div>
              <Rating avg={v.ratingAvg} count={v.ratingCount} />
            </li>))}</ul>
        )}
      </section>
      <section aria-labelledby="fc"><h2 id="fc" className="editorial mb-2 text-2xl">{t("admin.customers")}</h2>
        <p className="mb-2 text-xs text-muted">{t("admin.flagCustomersHelp")}</p>
        {f.customers.length === 0 ? <p className="card p-5 text-sm text-muted">{t("admin.noCustomersFlagged")}</p> : (
          <ul className="flex flex-col gap-3">{f.customers.map((c) => (
            <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <b>{c.name}</b><span>{t("admin.noShows", { n: c.noShows30d })}</span>
              {c.suspendedUntil ? <span className="chip bg-sand text-tomato">{t("admin.suspendedUntil", { when: fmtDateTime(c.suspendedUntil) })}</span> : <span className="chip bg-peach text-burgundy">{t("admin.watch")}</span>}
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
