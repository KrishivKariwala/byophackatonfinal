import { Wallet } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { payoutsFor } from "@/lib/vendor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor · Payouts" };

export default async function Payouts() {
  const me = await requirePage("vendor");
  let p;
  let why = "Complete vendor onboarding first.";
  try { p = payoutsFor(me); } catch (e) { p = null; if ((e as { code?: string }).code === "forbidden_role") why = "Payouts are visible to the owner only."; }
  if (!p) return <div className="mx-auto max-w-xl px-4 py-12"><h1 className="display text-4xl text-tomato">PAYOUTS</h1><p role="status" className="mt-2 text-sm text-muted">{why}</p></div>;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div><h1 className="display text-4xl text-tomato">PAYOUTS</h1><p className="text-sm text-muted">Daily settlement of online (test-mode) payments for collected orders. Platform fee {p.feePercent}% of order value. Demo figures, no real money moves.</p></div>
      {p.rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center"><Wallet size={32} className="text-tomato" aria-hidden="true" /><h2 className="editorial text-2xl">No settlements yet</h2><p className="text-sm text-muted">Online orders show up here the day they are collected.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Daily settlements</caption>
            <thead className="border-b border-line text-xs uppercase text-muted"><tr><th className="p-3">Date</th><th className="p-3">Orders</th><th className="p-3">Gross</th><th className="p-3">Fee ({p.feePercent}%)</th><th className="p-3">Net</th><th className="p-3">Cash at pickup</th></tr></thead>
            <tbody>
              {p.rows.map((r) => (<tr key={r.date} className="border-b border-line/60"><td className="p-3 font-semibold">{r.date}</td><td className="p-3">{r.orders}</td><td className="p-3">₹{r.gross}</td><td className="p-3">−₹{r.fee}</td><td className="p-3 font-bold">₹{r.net}</td><td className="p-3 text-muted">₹{r.cash}</td></tr>))}
            </tbody>
            <tfoot><tr className="font-bold"><td className="p-3" colSpan={2}>Total</td><td className="p-3">₹{p.totals.gross}</td><td className="p-3">−₹{p.totals.fee}</td><td className="p-3">₹{p.totals.net}</td><td className="p-3 text-muted">₹{p.totals.cash}</td></tr></tfoot>
          </table>
        </div>
      )}
      <p className="text-xs text-muted">Cash collected at pickup goes straight to you and is not part of the platform settlement.</p>
    </div>
  );
}
