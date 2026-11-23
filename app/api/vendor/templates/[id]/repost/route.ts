import { handle, body } from "@/lib/api";
import { repostTemplate } from "@/lib/vendor";
import { getActor } from "@/lib/session";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const b = await body<{ declaration: boolean; startInMinutes?: number }>(req);
    return repostTemplate(await getActor(), id, { declaration: b.declaration === true, startInMinutes: b.startInMinutes });
  });
}
