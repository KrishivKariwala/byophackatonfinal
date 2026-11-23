import { handle, body } from "@/lib/api";
import { submitReview } from "@/lib/p1";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<{ reservationId: string; rating: number; text?: string }>(req);
    return submitReview(await getActor(), { reservationId: String(b.reservationId), rating: Number(b.rating), text: b.text });
  });
}
