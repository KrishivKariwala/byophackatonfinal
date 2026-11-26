import { handle, body } from "@/lib/api";
import { generateCertificate, listCertificates } from "@/lib/p2/certificate";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => await listCertificates(await getActor()));
}
export async function POST(req: Request) {
  return handle(async () => generateCertificate(await getActor(), String((await body<{ month: string }>(req)).month ?? "")));
}
