import { handle, body } from "@/lib/api";
import { RuleError } from "@/lib/rules";
import { skipLogin } from "@/lib/auth";
import { setSession } from "@/lib/session";

/** Demo-only "Skip": signs in as the approved demo account for the chosen side. Disabled outside demo mode. */
export async function POST(req: Request) {
  return handle(async () => {
    if (process.env.DATA_MODE && process.env.DATA_MODE !== "demo") throw new RuleError("forbidden", "Skip is only available in demo mode.", 403);
    const { role } = await body<{ role: string }>(req);
    const { profile, home } = await skipLogin(String(role));
    await setSession(profile.id);
    return { id: profile.id, role: profile.role, home };
  });
}
