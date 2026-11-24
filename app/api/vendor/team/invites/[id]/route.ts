import { handle } from "@/lib/api";
import { revokeInvite } from "@/lib/p2/team";
import { getActor } from "@/lib/session";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => revokeInvite(await getActor(), (await ctx.params).id));
}
