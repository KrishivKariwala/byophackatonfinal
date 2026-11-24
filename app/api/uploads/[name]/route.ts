import { getActor } from "@/lib/session";
import { readUpload } from "@/lib/uploads";
import { canReadLogPhoto } from "@/lib/p2/distribution";

export const dynamic = "force-dynamic";

/** Uploads are private: only the uploader (name is prefixed with their user id) and admins can read them, plus the donating vendor's owner/managers for photos a charity attached to a distribution log. */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const a = await getActor();
  if (!a || (a.role !== "admin" && !name.startsWith(`${a.id}-`) && !canReadLogPhoto(a, name))) return new Response("Not found", { status: 404 });
  const f = readUpload(name);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.data), { headers: { "Content-Type": f.type, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
