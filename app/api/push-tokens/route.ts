import { handle, body } from "@/lib/api";
import { registerPushToken, removePushToken } from "@/lib/p1";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<{ token: string; platform: "ios" | "android" | "web"; deviceId: string }>(req);
    return registerPushToken(await getActor(), b);
  });
}
export async function DELETE(req: Request) {
  return handle(async () => {
    const b = await body<{ deviceId: string }>(req);
    return removePushToken(await getActor(), String(b.deviceId));
  });
}
