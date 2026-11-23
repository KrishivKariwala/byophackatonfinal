import { handle, body } from "@/lib/api";
import { decideApproval } from "@/lib/admin";
import { getActor } from "@/lib/session";

/** POST /api/admin/approvals/:id/decide  { decision: "Approved" | "Rejected", reason? }   (id = "vendor:<id>" or "ngo:<id>") */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const b = await body<{ decision: "Approved" | "Rejected"; reason?: string }>(req);
    return decideApproval(await getActor(), decodeURIComponent(id), b.decision, b.reason);
  });
}
