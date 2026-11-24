import { NextResponse } from "next/server";
import { RuleError } from "@/lib/rules";
import { receiptsZip } from "@/lib/p2/receipts";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/receipts/zip?from=YYYY-MM-DD&to=YYYY-MM-DD: every receipt in the range as PDFs plus index.csv. */
export async function GET(req: Request) {
  try {
    const u = new URL(req.url).searchParams;
    const { data } = await receiptsZip(await getActor(), { from: u.get("from") || undefined, to: u.get("to") || undefined });
    return new NextResponse(Buffer.from(data), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="donation-receipts-${u.get("from") || "start"}-to-${u.get("to") || "today"}.zip"`, "Cache-Control": "private, no-store" } });
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ ok: false, error: "Could not create the zip." }, { status: 500 });
  }
}
