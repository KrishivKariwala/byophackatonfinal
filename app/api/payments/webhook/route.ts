import { NextResponse } from "next/server";
import { confirmOnlinePayment } from "@/lib/services";
import { read } from "@/lib/store";
import { verifyWebhookSignature } from "@/lib/payments";

// Razorpay webhook (TEST MODE). Verified with the webhook secret, idempotent on the payment id.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") || ""))
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 400 });
  const evt = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: { id: string; order_id: string } } } };
  const pay = evt.payload?.payment?.entity;
  if (evt.event === "payment.captured" && pay) {
    const hold = read().holds.find((h) => h.gatewayOrderId === pay.order_id);
    if (hold) {
      const out = await confirmOnlinePayment({ holdId: hold.id, gatewayPaymentId: pay.id, eventId: `pay_${pay.id}` });
      return NextResponse.json({ ok: true, data: out });
    }
  }
  return NextResponse.json({ ok: true, ignored: evt.event });
}
