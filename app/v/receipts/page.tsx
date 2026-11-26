import { notFound } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { ReceiptsPanel } from "@/components/p2-charity";
import { getT } from "@/lib/i18n/server";
import { localizeError } from "@/lib/api";
import { listReceipts } from "@/lib/p2/receipts";
import { isFlagOn } from "@/lib/p2/platform";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.receipts") };
}

export default async function Receipts({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const me = await requirePage("vendor");
  if (!isFlagOn("donationReceipts")) notFound();
  const { t } = await getT();
  const sp = await searchParams;
  const ok = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  const from = ok(sp.from), to = ok(sp.to);
  let rows: Awaited<ReturnType<typeof listReceipts>> = [];
  let denied: string | null = null;
  try { rows = await listReceipts(me, { from, to }); } catch (e) { denied = await localizeError(e); }
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <h1 className="page-title">{t("rcpt.title").toUpperCase()}</h1>
      {denied ? <p role="status" className="card p-6 text-sm text-muted">{denied}</p> : <ReceiptsPanel from={from} to={to} rows={rows.map((r) => ({ id: r.id, number: r.number, item: r.item, qty: r.qty, estimatedValue: r.estimatedValue, vendorName: r.vendorName, ngoName: r.ngoName, collectedAt: r.collectedAt, hasEightyG: !!r.eightyG }))} />}
    </div>
  );
}
