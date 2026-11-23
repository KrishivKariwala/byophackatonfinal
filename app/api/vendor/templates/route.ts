import { handle, body } from "@/lib/api";
import { saveTemplateFromListing, deleteTemplate } from "@/lib/vendor";
import { getActor } from "@/lib/session";
import { read } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const a = await getActor();
    const v = read().vendors.find((x) => x.ownerId === a?.id);
    return read().templates.filter((t) => t.vendorId === v?.id);
  });
}
export async function POST(req: Request) {
  return handle(async () => saveTemplateFromListing(await getActor(), String((await body<{ listingId: string }>(req)).listingId)));
}
export async function DELETE(req: Request) {
  return handle(async () => deleteTemplate(await getActor(), String((await body<{ id: string }>(req)).id)));
}
