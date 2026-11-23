import { handle, body } from "@/lib/api";
import { submitNgoApplication } from "@/lib/services";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => submitNgoApplication(await getActor(), await body(req)));
}
