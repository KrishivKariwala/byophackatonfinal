import { NextResponse } from "next/server";
import { RuleError } from "@/lib/rules";
import { localizeError } from "@/lib/api";
import { receiptForActor, receiptPdf } from "@/lib/p2/receipts";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { receipt, db } = receiptForActor(await getActor(), (await ctx.params).id);
    const pdf = await receiptPdf(db, receipt);
    return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${receipt.number}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ ok: false, code: e.code, error: await localizeError(e) }, { status: e.status });
    console.error(e);
    return NextResponse.json({ ok: false, error: await localizeError(new RuleError("pdf_failed", "Could not create the PDF.")) }, { status: 500 });
  }
}
