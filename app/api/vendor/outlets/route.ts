import { handle, body } from "@/lib/api";
import { addOutlet, type OutletInput } from "@/lib/p2/team";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => addOutlet(await getActor(), await body<OutletInput>(req)));
}
