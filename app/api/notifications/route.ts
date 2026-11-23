import { handle } from "@/lib/api";
import { markNotificationsRead } from "@/lib/services";
import { getActor } from "@/lib/session";

export async function POST() {
  return handle(async () => markNotificationsRead(await getActor()));
}
