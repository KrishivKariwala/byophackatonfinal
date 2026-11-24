import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { customerOrders } from "@/lib/services";
import { StatusPill, fmtDateTime, fmtWindow } from "@/components/bits";
import { getT } from "@/lib/i18n/server";
import { statusLabel } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";
export const metadata = { title: "My orders" };

export default async function Orders() {
  const me = await requirePage("customer");
  const { t } = await getT();
  const orders = customerOrders(me.id);
  const active = orders.filter((o) => o.status === "Reserved" || o.status === "Ready");
  const past = orders.filter((o) => !(o.status === "Reserved" || o.status === "Ready"));
  const Row = ({ o }: { o: (typeof orders)[number] }) => (
    <li>
      <Link href={`/c/orders/${o.id}`} className="card flex flex-wrap items-center gap-3 p-4 hover:shadow-md">
        <div className="flex-1">
          <p className="font-bold">{o.qty} × {o.listing.title}</p>
          <p className="text-xs text-muted">{t("orders.row", { ref: o.ref, vendor: o.listing.vendor.businessName, window: fmtWindow(o.listing.windowStart, o.listing.windowEnd) })}</p>
          <p className="text-xs text-muted">{t("orders.placed", { when: fmtDateTime(o.createdAt), amount: o.amount, pay: o.payment ? statusLabel(t, o.payment.status) : "—" })}</p>
        </div>
        <StatusPill status={o.status} />
      </Link>
    </li>
  );
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="display text-4xl text-tomato">{t("orders.title")}</h1>
      <section>
        <h2 className="editorial mb-2 text-2xl">{t("orders.active", { n: active.length, max: 3 })}</h2>
        {active.length ? <ul className="flex flex-col gap-3">{active.map((o) => <Row key={o.id} o={o} />)}</ul> : <p className="text-sm text-muted">{t("orders.noActive")} <Link href="/c" className="font-semibold text-tomato underline">{t("common.findFood")}</Link>.</p>}
      </section>
      <section>
        <h2 className="editorial mb-2 text-2xl">{t("orders.past")}</h2>
        {past.length ? <ul className="flex flex-col gap-3">{past.map((o) => <Row key={o.id} o={o} />)}</ul> : <p className="text-sm text-muted">{t("orders.nothingYet")}</p>}
      </section>
    </div>
  );
}
