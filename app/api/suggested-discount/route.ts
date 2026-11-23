import { handle } from "@/lib/api";
import { priceSuggestion } from "@/lib/vendor";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/suggested-discount?listing_id=&hours_left=  (new listings: ?original_price=&category=&hours_left=) */
export async function GET(req: Request) {
  return handle(async () => {
    const u = new URL(req.url).searchParams;
    const num = (k: string) => (u.get(k) !== null && u.get(k) !== "" ? Number(u.get(k)) : undefined);
    return priceSuggestion(await getActor(), {
      listingId: u.get("listing_id") || undefined, original: num("original_price"), category: u.get("category") || undefined, hoursLeft: num("hours_left"),
    });
  });
}
