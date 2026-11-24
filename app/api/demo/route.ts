import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { fastForward } from "@/lib/services";
import { resetStore } from "@/lib/store";
import { getActor } from "@/lib/session";

// Demo controls: shift the demo clock (to show window end and donation live) or reset the demo data (admin only).
export async function POST(req: Request) {
  return handle(async () => {
    if (process.env.DATA_MODE && process.env.DATA_MODE !== "demo") throw new RuleError("forbidden", "Demo controls are disabled.", 403, undefined, "forbidden_demo_controls_are");
    const actor = await getActor();
    const b = await body<{ action: "clock" | "reset"; minutes?: number }>(req);
    if (b.action === "clock") return { offsetMs: await fastForward(actor, Number(b.minutes || 0)) };
    if (b.action === "reset") {
      if (actor?.role !== "admin") throw new RuleError("forbidden", "Only the demo admin can reset data.", 403, undefined, "forbidden_only_demo_admin");
      await resetStore();
      return { reset: true };
    }
    throw new RuleError("action_invalid", "Unknown action.");
  });
}
