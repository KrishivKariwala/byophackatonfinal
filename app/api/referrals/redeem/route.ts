import { handle, body } from "@/lib/api";
import { redeemReferralCode } from "@/lib/p2/credits";
import { deviceId } from "@/lib/p2/device";
import { getActor } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  return handle(async () => {
    const actor = await getActor();
    if (actor) rateLimit(`refcode:${actor.id}`, 10, 10 * 60_000); // code guessing is rate-limited
    const r = await redeemReferralCode(actor, { code: String((await body<{ code: string }>(req)).code ?? ""), deviceId: await deviceId() });
    return { id: r.id, status: r.status };
  });
}
