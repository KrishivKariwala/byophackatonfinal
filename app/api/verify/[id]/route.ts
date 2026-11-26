import { NextResponse } from "next/server";
import { verifyCertificate } from "@/lib/p2/certificate";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** Public. Rate-limited per caller so verification ids can't be enumerated; ids carry 60 random bits regardless. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try { rateLimit(`verify:${req.headers.get("x-forwarded-for") ?? "local"}`, 60, 60_000); }
  catch { return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 }); }
  const c = await verifyCertificate((await ctx.params).id.toUpperCase());
  return c ? NextResponse.json({ ok: true, data: c }) : NextResponse.json({ ok: false, error: "No certificate with this ID." }, { status: 404 });
}
