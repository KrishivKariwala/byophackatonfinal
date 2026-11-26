import { handle, body } from "@/lib/api";
import { moderate, moderationQueue, type ActInput } from "@/lib/p2/moderation";
import { RuleError } from "@/lib/rules";
import { getActor } from "@/lib/session";
import type { ModerationTarget } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    if ((await getActor())?.role !== "admin") throw new RuleError("forbidden", "Admins only.", 403);
    return await moderationQueue();
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<ActInput & { targetType: ModerationTarget; targetId: string }>(req);
    return moderate(await getActor(), b.targetType, String(b.targetId ?? ""), { action: b.action, reason: b.reason, edit: b.edit, suspendDays: b.suspendDays });
  });
}
