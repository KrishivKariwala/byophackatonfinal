import { handle, body } from "@/lib/api";
import { fileDistributionLog, type LogInput } from "@/lib/p2/distribution";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await body<LogInput & { batchId: string }>(req);
    return fileDistributionLog(await getActor(), String(b.batchId ?? ""), { servings: Number(b.servings), beneficiaries: Number(b.beneficiaries), centreName: String(b.centreName ?? ""), notes: b.notes, photoUrls: b.photoUrls });
  });
}
