import { handle, body } from "@/lib/api";
import { clearEta, setEta } from "@/lib/p2/eta";
import { getActor } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const actor = await getActor();
    if (actor) rateLimit(`eta:${actor.id}`, 30, 60_000);
    return setEta(actor, (await ctx.params).id, await body<Record<string, unknown>>(req));
  });
}
export async function DELETE(_req: Request, ctx: Ctx) {
  return handle(async () => clearEta(await getActor(), (await ctx.params).id));
}
