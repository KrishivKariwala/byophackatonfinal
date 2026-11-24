import { Wallet } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { payoutsFor } from "@/lib/vendor";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor · Payouts" };

export default async function Payouts() {
  const me = await requirePage("vendor");
  const { t } = await getT();
  let p;
  let why = t("payouts.whyOnboard");
  try { p = payoutsFor(me); } catch (e) { p = null; if ((e as { code?: string }).code === "forbidden_role") why = t("payouts.whyOwner"); }
  if (!p) return <div className="mx-auto max-w-xl px-4 py-12"><h1 className="display text-4xl text-tomato">{t("payouts.title")}</h1><p role="status" className="mt-2 text-sm text-muted">{why}</p></div>;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div><h1 className="display text-4xl text-tomato">{t("payouts.title")}</h1><p className="text-sm text-muted">{t("payouts.intro", { pct: p.feePercent })}</p></div>
      {p.rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center"><Wallet size={32} className="text-tomato" aria-hidden="true" /><h2 className="editorial text-2xl">{t("payouts.emptyTitle")}</h2><p className="text-sm text-muted">{t("payouts.emptyBody")}</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">{t("payouts.caption")}</caption>
            <thead className="border-b border-line text-xs uppercase text-muted"><tr><th className="p-3">{t("payouts.date")}</th><th className="p-3">{t("payouts.orders")}</th><th className="p-3">{t("payouts.gross")}</th><th className="p-3">{t("payouts.fee", { pct: p.feePercent })}</th><th className="p-3">{t("payouts.net")}</th><th className="p-3">{t("payouts.cash")}</th></tr></thead>
            <tbody>
              {p.rows.map((r) => (<tr key={r.date} className="border-b border-line/60"><td className="p-3 font-semibold">{r.date}</td><td className="p-3">{r.orders}</td><td className="p-3">₹{r.gross}</td><td className="p-3">−₹{r.fee}</td><td className="p-3 font-bold">₹{r.net}</td><td className="p-3 text-muted">₹{r.cash}</td></tr>))}
            </tbody>
            <tfoot><tr className="font-bold"><td className="p-3" colSpan={2}>{t("common.total")}</td><td className="p-3">₹{p.totals.gross}</td><td className="p-3">−₹{p.totals.fee}</td><td className="p-3">₹{p.totals.net}</td><td className="p-3 text-muted">₹{p.totals.cash}</td></tr></tfoot>
          </table>
        </div>
      )}
      <p className="text-xs text-muted">{t("payouts.cashNote")}</p>
    </div>
  );
}
