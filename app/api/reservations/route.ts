import { handle, body } from "@/lib/api";
import { attachGatewayOrder, reserve } from "@/lib/services";
import { getActor } from "@/lib/session";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/payments";
import { rateLimit } from "@/lib/ratelimit";
import { RULES } from "@/lib/rules";
import type { PaymentMethod } from "@/lib/types";

export async function POST(req: Request) {
  return handle(async () => {
    const actor = await getActor();
    if (actor) rateLimit(`reserve:${actor.id}`, RULES.RESERVE_RATE_LIMIT.max, RULES.RESERVE_RATE_LIMIT.windowMs);
    const b = await body<{ listingId: string; qty: number; method: PaymentMethod }>(req);
    const result = await reserve(actor, { listingId: String(b.listingId), qty: Number(b.qty), method: b.method });
    if (result.kind === "hold" && razorpayConfigured()) {
      const order = await createRazorpayOrder(result.amount, result.holdId);
      await attachGatewayOrder(result.holdId, order.id, "razorpay_test");
      return { ...result, gatewayOrderId: order.id, gateway: "razorpay_test" };
    }
    return { ...result, gateway: result.kind === "hold" ? "demo" : "cash_at_pickup" };
  });
}
