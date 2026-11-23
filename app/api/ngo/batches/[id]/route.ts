import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { claimBatch, releaseClaim } from "@/lib/services";
import { getActor } from "@/lib/session";

/** Actions: claim (whole batch, atomic) | release */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { action } = await body<{ action: "claim" | "release" }>(req);
    const actor = await getActor();
    if (action === "claim") return claimBatch(actor, id);
    if (action === "release") return releaseClaim(actor, id);
    throw new RuleError("action_invalid", "Unknown action.");
  });
}
