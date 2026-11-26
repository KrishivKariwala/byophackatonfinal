import { handle } from "@/lib/api";
import { payoutsFor } from "@/lib/vendor";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => await payoutsFor(await getActor()));
}
