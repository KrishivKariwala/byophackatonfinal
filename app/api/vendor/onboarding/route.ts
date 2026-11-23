import { handle, body } from "@/lib/api";
import { submitVendorApplication } from "@/lib/services";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => submitVendorApplication(await getActor(), await body(req)));
}
