import { handle } from "@/lib/api";
import { approvalsQueue } from "@/lib/admin";
import { getActor } from "@/lib/session";
import { RuleError } from "@/lib/rules";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const a = await getActor();
    if (a?.role !== "admin") throw new RuleError("forbidden", "Admins only.", 403);
    return approvalsQueue();
  });
}
