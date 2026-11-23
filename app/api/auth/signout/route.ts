import { handle } from "@/lib/api";
import { clearSession } from "@/lib/session";

export async function POST() {
  return handle(async () => {
    await clearSession();
    return true;
  });
}
