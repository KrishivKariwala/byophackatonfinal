import { NextResponse } from "next/server";
import { volunteerView } from "@/lib/charity";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** GET /api/volunteer/:token: public, no login. Rate-limited per client to blunt token guessing. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    rateLimit(`vol:${req.headers.get("x-forwarded-for") ?? "local"}`, 30, 60_000);
  } catch {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Too many requests." }, { status: 429 });
  }
  const { token } = await ctx.params;
  const v = await volunteerView(token);
  const status = v.state === "ok" ? 200 : v.state === "not_found" ? 404 : 410;
  return NextResponse.json({ ok: v.state === "ok", data: v }, { status, headers: { "Cache-Control": "no-store" } });
}
