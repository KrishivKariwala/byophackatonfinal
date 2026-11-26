import { handle, body } from "@/lib/api";
import { settingsAuditTrail, updatePlatformSettings, getSettings, type SettingsPatch } from "@/lib/p2/platform";
import { RuleError } from "@/lib/rules";
import { getActor } from "@/lib/session";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    if ((await getActor())?.role !== "admin") throw new RuleError("forbidden", "Admins only.", 403);
    return { settings: getSettings(), audit: await settingsAuditTrail((await readDb())) };
  });
}
export async function POST(req: Request) {
  return handle(async () => updatePlatformSettings(await getActor(), await body<SettingsPatch>(req)));
}
