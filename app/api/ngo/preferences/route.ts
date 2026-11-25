import { handle, body } from "@/lib/api";
import { setNgoPreferences } from "@/lib/ngo-prefs";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => setNgoPreferences(await getActor(), await body<{ diet: string }>(req)));
}
