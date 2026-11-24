import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { read } from "@/lib/store";
import { setSession } from "@/lib/session";

// Demo sign-in / role switching. Only available in demo mode and only for demo-labelled profiles.
export async function POST(req: Request) {
  return handle(async () => {
    if (process.env.DATA_MODE && process.env.DATA_MODE !== "demo") throw new RuleError("forbidden", "Demo sign-in is disabled.", 403, undefined, "forbidden_demo_sign_disabled");
    const { userId } = await body<{ userId: string }>(req);
    const p = read().profiles.find((x) => x.id === userId && x.demo);
    if (!p) throw new RuleError("not_found", "Demo user not found.", 404, undefined, "not_found_demo_user_not");
    await setSession(p.id);
    return { id: p.id, role: p.role };
  });
}
