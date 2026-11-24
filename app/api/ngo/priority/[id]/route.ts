import { handle } from "@/lib/api";
import { claimPriorityListing } from "@/lib/p2/priority";
import { getActor } from "@/lib/session";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => claimPriorityListing(await getActor(), (await ctx.params).id));
}
