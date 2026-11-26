import { handle, body } from "@/lib/api";
import { followVendor, followingList, unfollowVendor } from "@/lib/p1";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const a = await getActor();
    return a ? await followingList(a.id) : [];
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<{ vendorId: string; lat?: number; lng?: number }>(req);
    return followVendor(await getActor(), String(b.vendorId), { lat: b.lat, lng: b.lng });
  });
}
export async function DELETE(req: Request) {
  return handle(async () => {
    const b = await body<{ vendorId: string }>(req);
    return unfollowVendor(await getActor(), String(b.vendorId));
  });
}
