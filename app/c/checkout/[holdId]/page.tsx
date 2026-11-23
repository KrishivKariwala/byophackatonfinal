import { notFound, redirect } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { razorpayConfigured } from "@/lib/payments";
import { Countdown } from "@/components/client";
import { CheckoutClient } from "./CheckoutClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function Checkout({ params }: { params: Promise<{ holdId: string }> }) {
  const me = await requirePage("customer");
  const { holdId } = await params;
  const db = read();
  const h = db.holds.find((x) => x.id === holdId && x.customerId === me.id);
  if (!h) notFound();
  if (h.status === "Converted") {
    const r = db.reservations.find((x) => x.holdId === h.id);
    if (r) redirect(`/c/orders/${r.id}`);
  }
  const l = db.listings.find((x) => x.id === h.listingId)!;
  const v = db.vendors.find((x) => x.id === l.vendorId)!;
  const p = db.payments.find((x) => x.holdId === h.id);
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-8">
      <h1 className="display text-4xl text-tomato">CHECKOUT</h1>
      <div className="card flex flex-col gap-2 p-5 text-sm">
        <p className="font-bold">{h.qty} × {l.title}</p>
        <p className="text-muted">{v.businessName}</p>
        <div className="flex justify-between border-t border-line pt-2 font-bold"><span>Total</span><span>₹{h.amount}</span></div>
        <p className="text-xs text-muted">Payment status: {p?.status ?? "Pending"} · Hold status: {h.status}</p>
        {h.status === "Active" && (
          <p className="rounded-lg bg-cream p-2 text-xs font-semibold text-burgundy">
            Units held for you: <Countdown to={h.expiresAt} serverNow={now(db)} label="left to pay" endedText="hold expired — refresh" />
          </p>
        )}
      </div>
      {h.status === "Active" ? (
        <CheckoutClient holdId={h.id} gatewayOrderId={h.gatewayOrderId} amount={h.amount} razorpay={razorpayConfigured()} keyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""} />
      ) : (
        <p className="rounded-xl bg-sand p-4 text-sm font-semibold text-muted">
          This checkout is {h.status.toLowerCase()}. The units were released back to the listing. You have not been charged; any late payment is refunded in full.
        </p>
      )}
    </div>
  );
}
