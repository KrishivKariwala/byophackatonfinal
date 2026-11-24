import { handle } from "@/lib/api";
import { creditQuote } from "@/lib/p2/credits";
import { requireRole } from "@/lib/core";
import { getActor } from "@/lib/session";
import { now, read } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /api/credits?total=300  ->  how much credit could be used on an order of that value. */
export async function GET(req: Request) {
  return handle(async () => {
    const me = requireRole(await getActor(), "customer");
    const db = read();
    return creditQuote(db, me.id, Math.max(0, Number(new URL(req.url).searchParams.get("total")) || 0), now(db));
  });
}
