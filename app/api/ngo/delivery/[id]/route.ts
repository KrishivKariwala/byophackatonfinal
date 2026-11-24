import { handle } from "@/lib/api";
import { cancelDelivery } from "@/lib/p2/delivery";
import { getActor } from "@/lib/session";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => cancelDelivery(await getActor(), (await ctx.params).id));
}
