import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { confirmOnlinePayment } from "@/lib/services";
import { getActor } from "@/lib/session";
import { readDb } from "@/lib/store";
import { verifyCheckoutSignature } from "@/lib/payments";

// Razorpay Checkout success handler (TEST MODE). The signature is verified on the server.
export async function POST(req: Request, ctx: { params: Promise<{ holdId: string }> }) {
  return handle(async () => {
    const { holdId } = await ctx.params;
    const actor = await getActor();
    if (!actor) throw new RuleError("unauthenticated", "Please sign in.", 401);
    const b = await body<{ razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }>(req);
    const hold = (await readDb()).holds.find((h) => h.id === holdId);
    if (!hold || hold.gatewayOrderId !== b.razorpay_order_id) throw new RuleError("order_mismatch", "Payment does not match this checkout.", 400);
    if (!verifyCheckoutSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature))
      throw new RuleError("bad_signature", "Payment signature could not be verified.", 400);
    return confirmOnlinePayment({ holdId, gatewayPaymentId: b.razorpay_payment_id, eventId: `pay_${b.razorpay_payment_id}`, actorId: actor.id });
  });
}
