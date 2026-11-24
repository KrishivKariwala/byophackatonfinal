import { notFound, redirect } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { read, now } from "@/lib/store";
import { razorpayConfigured } from "@/lib/payments";
import { Countdown } from "@/components/client";
import { CheckoutClient } from "./CheckoutClient";
import { getT } from "@/lib/i18n/server";
import { statusLabel } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function Checkout({ params }: { params: Promise<{ holdId: string }> }) {
  const me = await requirePage("customer");
  const { t } = await getT();
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
      <h1 className="display text-4xl text-tomato">{t("checkout.title")}</h1>
      <div className="card flex flex-col gap-2 p-5 text-sm">
        <p className="font-bold">{h.qty} × {l.title}</p>
        <p className="text-muted">{v.businessName}</p>
        {h.creditApplied ? <div className="flex justify-between text-veg"><span>{t("checkout.creditUsed")}</span><span>−₹{h.creditApplied}</span></div> : null}
        <div className="flex justify-between border-t border-line pt-2 font-bold"><span>{h.creditApplied ? t("credit.toPay") : t("common.total")}</span><span>₹{h.amount}</span></div>
        <p className="text-xs text-muted">{t("checkout.status", { pay: statusLabel(t, p?.status ?? "Pending"), hold: statusLabel(t, h.status) })}</p>
        {h.status === "Active" && (
          <p className="rounded-lg bg-cream p-2 text-xs font-semibold text-burgundy">
            {t("checkout.held")} <Countdown to={h.expiresAt} serverNow={now(db)} label={t("checkout.leftToPay")} endedText={t("checkout.holdExpired")} />
          </p>
        )}
      </div>
      {h.status === "Active" ? (
        <CheckoutClient holdId={h.id} gatewayOrderId={h.gatewayOrderId} amount={h.amount} razorpay={razorpayConfigured()} keyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ""} />
      ) : (
        <p className="rounded-xl bg-sand p-4 text-sm font-semibold text-muted">
          {t("checkout.ended", { status: statusLabel(t, h.status).toLowerCase() })}
        </p>
      )}
    </div>
  );
}
