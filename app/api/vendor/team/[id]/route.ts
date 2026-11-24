import { handle, body } from "@/lib/api";
import { changeMemberRole, revokeMember } from "@/lib/p2/team";
import { getActor } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  return handle(async () => revokeMember(await getActor(), (await ctx.params).id));
}
export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const b = await body<{ role: "manager" | "staff"; outletId?: string }>(req);
    return changeMemberRole(await getActor(), (await ctx.params).id, b.role, b.outletId);
  });
}
