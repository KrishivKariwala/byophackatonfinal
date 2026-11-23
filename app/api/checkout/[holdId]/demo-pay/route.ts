import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { confirmOnlinePayment, failOnlinePayment } from "@/lib/services";
import { getActor } from "@/lib/session";
import { razorpayConfigured } from "@/lib/payments";
import { newId } from "@/lib/crypto";

// Demo payment adapter: SIMULATED. Used only when Razorpay test keys are not configured.
export async function POST(req: Request, ctx: { params: Promise<{ holdId: string }> }) {
  return handle(async () => {
    if (razorpayConfigured()) throw new RuleError("use_gateway", "Razorpay test mode is configured; use the real checkout.", 409);
    const { holdId } = await ctx.params;
    const actor = await getActor();
    if (!actor || actor.role !== "customer") throw new RuleError("unauthenticated", "Please sign in as a customer.", 401);
    const { outcome } = await body<{ outcome: "success" | "fail" }>(req);
    if (outcome === "fail") return { outcome: "failed", ...(await failOnlinePayment(actor, holdId)) };
    return confirmOnlinePayment({ holdId, gatewayPaymentId: `demo_pay_${newId("x")}`, eventId: `demo_evt_${holdId}`, actorId: actor.id });
  });
}
