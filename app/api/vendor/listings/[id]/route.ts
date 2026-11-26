import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { cancelListing, setPaused, settleRefund, updateListing, type ListingInput } from "@/lib/services";
import { getActor } from "@/lib/session";
import { readDb } from "@/lib/store";
import { razorpayConfigured, refundRazorpayPayment } from "@/lib/payments";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    return updateListing(await getActor(), id, await body<Partial<ListingInput>>(req));
  });
}

/** Actions: pause | resume | cancel */
export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await getActor();
    const b = await body<{ action: "pause" | "resume" | "cancel"; reason?: string }>(req);
    if (b.action === "pause") return setPaused(actor, id, true);
    if (b.action === "resume") return setPaused(actor, id, false);
    if (b.action === "cancel") {
      const out = await cancelListing(actor, id, b.reason || "");
      // Razorpay test mode: settle pending refunds via the refund API after the commit.
      if (razorpayConfigured()) {
        const db = await readDb();
        for (const rf of db.refunds.filter((r) => r.status === "Refund Pending")) {
          const p = db.payments.find((x) => x.id === rf.paymentId);
          if (p?.gateway === "razorpay_test" && p.gatewayPaymentId) {
            try { await refundRazorpayPayment(p.gatewayPaymentId, rf.amount); await settleRefund(rf.id); } catch (e) { console.error("refund failed", e); }
          }
        }
      }
      return out;
    }
    throw new RuleError("action_invalid", "Unknown action.");
  });
}
