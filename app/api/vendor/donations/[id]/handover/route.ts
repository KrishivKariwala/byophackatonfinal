import { handle, body } from "@/lib/api";
import { donationHandover } from "@/lib/services";
import { getActor } from "@/lib/session";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { code } = await body<{ code: string }>(req);
    return donationHandover(await getActor(), id, code);
  });
}
