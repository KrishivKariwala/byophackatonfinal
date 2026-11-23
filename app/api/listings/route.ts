import { handle } from "@/lib/api";
import { discover, sweep } from "@/lib/services";
import { NEIGHBOURHOODS } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    await sweep();
    const u = new URL(req.url).searchParams;
    const k = NEIGHBOURHOODS.Koramangala;
    const num = (v: string | null, d: number) => (v && Number.isFinite(Number(v)) ? Number(v) : d);
    return discover({
      lat: num(u.get("lat"), k.lat), lng: num(u.get("lng"), k.lng), radiusKm: Math.min(25, num(u.get("radius"), 5)),
      q: u.get("q") || undefined, category: u.get("category") || undefined, diet: u.get("diet") || undefined,
      maxPrice: u.get("maxPrice") ? num(u.get("maxPrice"), 0) : undefined,
      pickupAfter: u.get("after") || undefined, pickupBy: u.get("by") || undefined,
    });
  });
}
