import { handle } from "@/lib/api";
import { customerImpact } from "@/lib/p1";
import { getActor } from "@/lib/session";
import { RuleError } from "@/lib/rules";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const a = await getActor();
    if (!a || a.role !== "customer") throw new RuleError("forbidden", "Customers only.", 403);
    return customerImpact(a.id);
  });
}
