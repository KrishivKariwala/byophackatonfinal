import { handle, body } from "@/lib/api";
import { saveTemplateFromListing, deleteTemplate } from "@/lib/vendor";
import { getActor } from "@/lib/session";
import { readDb } from "@/lib/store";
import { vendorCtx } from "@/lib/p2/org";
import { requireRole } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const a = await getActor();
    const ctx = vendorCtx((await readDb()), requireRole(a, "vendor"), "listing.write");
    return (await readDb()).templates.filter((t) => t.vendorId === ctx.vendor.id);
  });
}
export async function POST(req: Request) {
  return handle(async () => saveTemplateFromListing(await getActor(), String((await body<{ listingId: string }>(req)).listingId)));
}
export async function DELETE(req: Request) {
  return handle(async () => deleteTemplate(await getActor(), String((await body<{ id: string }>(req)).id)));
}
