import { handle, body } from "@/lib/api";
import { createListing, type ListingInput } from "@/lib/services";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => createListing(await getActor(), await body<ListingInput>(req)));
}
