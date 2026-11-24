import { handle, body } from "@/lib/api";
import { acceptInvite } from "@/lib/p2/team";
import { getActor } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  return handle(async () => {
    const actor = await getActor();
    rateLimit(`join:${actor?.id ?? "anon"}`, 10, 10 * 60_000); // invite tokens are unguessable, but never allow rapid guessing
    return acceptInvite(actor, String((await body<{ token: string }>(req)).token ?? ""));
  });
}
