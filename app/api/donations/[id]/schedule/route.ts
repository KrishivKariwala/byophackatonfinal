import { handle, body } from "@/lib/api";
import { scheduleDonation } from "@/lib/charity";
import { getActor } from "@/lib/session";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const b = await body<{ slot: string; volunteerName: string; volunteerPhone: string }>(req);
    return scheduleDonation(await getActor(), id, b);
  });
}
