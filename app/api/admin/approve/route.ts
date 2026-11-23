import { handle, body } from "@/lib/api";
import { setApproval } from "@/lib/services";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<{ kind: "vendor" | "ngo"; id: string; status: "Approved" | "Rejected"; reason?: string }>(req);
    return setApproval(await getActor(), b.kind, b.id, b.status, b.reason);
  });
}
