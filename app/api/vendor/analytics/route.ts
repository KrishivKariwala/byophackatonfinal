import { handle } from "@/lib/api";
import { analyticsFor } from "@/lib/vendor";
import { parseRange } from "@/lib/analytics";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => await analyticsFor(await getActor(), parseRange(new URL(req.url).searchParams.get("range"))));
}
