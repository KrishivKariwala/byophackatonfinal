import { handle } from "@/lib/api";
import { markReady } from "@/lib/services";
import { getActor } from "@/lib/session";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    return markReady(await getActor(), id);
  });
}
