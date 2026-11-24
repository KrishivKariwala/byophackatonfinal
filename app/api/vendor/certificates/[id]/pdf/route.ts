import { NextResponse } from "next/server";
import { RuleError } from "@/lib/rules";
import { certificateForVendor, certificatePdf } from "@/lib/p2/certificate";
import { getActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { cert, vendor } = certificateForVendor(await getActor(), id);
    const pdf = await certificatePdf(cert, vendor, new URL(req.url).origin);
    return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="impact-certificate-${cert.month}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ ok: false, error: "Could not create the PDF." }, { status: 500 });
  }
}
