import { handle, body } from "@/lib/api";
import { inviteMember, teamOverview } from "@/lib/p2/team";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => teamOverview(await getActor()));
}
export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<{ contact: string; role: "manager" | "staff"; outletId?: string }>(req);
    return inviteMember(await getActor(), { contact: String(b.contact ?? ""), role: b.role, outletId: b.outletId || undefined });
  });
}
