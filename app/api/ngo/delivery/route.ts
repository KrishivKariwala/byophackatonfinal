import { handle, body } from "@/lib/api";
import { requestDelivery } from "@/lib/p2/delivery";
import { getActor } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  return handle(async () => {
    const actor = await getActor();
    if (actor) rateLimit(`delivery:${actor.id}`, 10, 10 * 60_000);
    return requestDelivery(actor, String((await body<{ batchId: string }>(req)).batchId ?? ""));
  });
}
