import { handle } from "@/lib/api";
import { myReferral } from "@/lib/p2/credits";
import { deviceId } from "@/lib/p2/device";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => myReferral(await getActor(), await deviceId()));
}
