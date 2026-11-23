import { handle, body } from "@/lib/api";
import { markReady } from "@/lib/services";
import { getActor } from "@/lib/session";
import { RuleError } from "@/lib/rules";
import { read } from "@/lib/store";

/** POST /api/listings/:id/mark-ready  { reservationId }: marks one order on this listing Ready and notifies the customer. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const b = await body<{ reservationId: string }>(req);
    const r = read().reservations.find((x) => x.id === b.reservationId);
    if (!r || r.listingId !== id) throw new RuleError("not_found", "Order not found on this listing.", 404);
    return markReady(await getActor(), r.id);
  });
}
