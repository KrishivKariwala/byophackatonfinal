import { handle, body } from "@/lib/api";
import { handover } from "@/lib/services";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<{ code?: string; token?: string }>(req);
    return handover(await getActor(), { code: b.code, token: b.token });
  });
}
