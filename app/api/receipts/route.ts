import { handle } from "@/lib/api";
import { listReceipts } from "@/lib/p2/receipts";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/receipts?from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(req: Request) {
  return handle(async () => {
    const u = new URL(req.url).searchParams;
    return await listReceipts(await getActor(), { from: u.get("from") || undefined, to: u.get("to") || undefined });
  });
}
