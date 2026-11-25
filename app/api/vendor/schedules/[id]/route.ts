import { handle, body } from "@/lib/api";
import { deleteSchedule, setSchedulePaused } from "@/lib/p2/recurring";
import { getActor } from "@/lib/session";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => setSchedulePaused(await getActor(), (await ctx.params).id, (await body<{ paused: boolean }>(req)).paused));
}
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => deleteSchedule(await getActor(), (await ctx.params).id));
}
