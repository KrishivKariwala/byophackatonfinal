import { handle, body } from "@/lib/api";
import { actOnReport, type ReportAction } from "@/lib/admin";
import { executeRefund } from "@/lib/p1";
import { getActor } from "@/lib/session";
import type { Payment } from "@/lib/types";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const b = await body<{ action: ReportAction; note?: string }>(req);
    const out = await actOnReport(await getActor(), id, b.action, b.note);
    if (out.refund) await executeRefund({ refundId: out.refund.id, refundAmount: out.refund.amount, gateway: out.refund.gateway as Payment["gateway"], gatewayPaymentId: out.refund.gatewayPaymentId });
    return { report: out.report, refunded: !!out.refund };
  });
}
