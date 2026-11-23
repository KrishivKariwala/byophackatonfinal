import { handle, body } from "@/lib/api";
import { updateVendorSettings } from "@/lib/vendor";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => updateVendorSettings(await getActor(), await body<{ payAtPickup?: boolean; maxUnitsPerOrder?: number | null }>(req)));
}
