import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { customerOrders } from "@/lib/services";
import { StatusPill, fmtDateTime, fmtWindow } from "@/components/bits";

export const dynamic = "force-dynamic";
export const metadata = { title: "My orders" };

export default async function Orders() {
  const me = await requirePage("customer");
  const orders = customerOrders(me.id);
  const active = orders.filter((o) => o.status === "Reserved" || o.status === "Ready");
  const past = orders.filter((o) => !(o.status === "Reserved" || o.status === "Ready"));
  const Row = ({ o }: { o: (typeof orders)[number] }) => (
    <li>
      <Link href={`/c/orders/${o.id}`} className="card flex flex-wrap items-center gap-3 p-4 hover:shadow-md">
        <div className="flex-1">
          <p className="font-bold">{o.qty} × {o.listing.title}</p>
          <p className="text-xs text-muted">{o.ref} · {o.listing.vendor.businessName} · pickup {fmtWindow(o.listing.windowStart, o.listing.windowEnd)}</p>
          <p className="text-xs text-muted">Placed {fmtDateTime(o.createdAt)} · ₹{o.amount} · {o.payment?.status ?? "—"}</p>
        </div>
        <StatusPill status={o.status} />
      </Link>
    </li>
  );
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="display text-4xl text-tomato">MY ORDERS</h1>
      <section>
        <h2 className="editorial mb-2 text-2xl">Active ({active.length}/3)</h2>
        {active.length ? <ul className="flex flex-col gap-3">{active.map((o) => <Row key={o.id} o={o} />)}</ul> : <p className="text-sm text-muted">No active reservations. <Link href="/c" className="font-semibold text-tomato underline">Find food nearby</Link>.</p>}
      </section>
      <section>
        <h2 className="editorial mb-2 text-2xl">Past orders</h2>
        {past.length ? <ul className="flex flex-col gap-3">{past.map((o) => <Row key={o.id} o={o} />)}</ul> : <p className="text-sm text-muted">Nothing yet.</p>}
      </section>
    </div>
  );
}
