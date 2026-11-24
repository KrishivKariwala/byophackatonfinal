import { handle, body } from "@/lib/api";
import { updateOutlet, type OutletInput } from "@/lib/p2/team";
import { getActor } from "@/lib/session";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => updateOutlet(await getActor(), (await ctx.params).id, await body<Partial<OutletInput>>(req)));
}
