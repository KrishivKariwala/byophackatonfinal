import { handle } from "@/lib/api";
import { cancelReservation, executeRefund } from "@/lib/p1";
import { getActor } from "@/lib/session";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const out = await cancelReservation(await getActor(), id);
    await executeRefund(out);
    return { reservationId: out.reservationId, free: out.free, refundAmount: out.refundAmount };
  });
}
