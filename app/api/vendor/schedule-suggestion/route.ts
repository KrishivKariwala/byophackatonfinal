import { handle } from "@/lib/api";
import { scheduleSuggestion } from "@/lib/vendor";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const u = new URL(req.url).searchParams;
    return await scheduleSuggestion(await getActor(), {
      original: Number(u.get("original")), rescue: Number(u.get("rescue")), windowStart: u.get("start") ?? "", windowEnd: u.get("end") ?? "", category: u.get("category") ?? undefined,
    });
  });
}
