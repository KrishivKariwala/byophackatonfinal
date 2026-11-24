import { NextResponse } from "next/server";
import { RuleError } from "@/lib/rules";
import { handleDeliveryWebhook, verifyDeliverySignature } from "@/lib/p2/delivery";

/**
 * Delivery partner webhook. The signature (x-delivery-signature: hex HMAC-SHA256 of the raw body with DELIVERY_WEBHOOK_SECRET) is checked
 * BEFORE the body is parsed; an unsigned or wrongly signed call changes nothing. Replays are harmless because statuses only move forward.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyDeliverySignature(raw, req.headers.get("x-delivery-signature") || "")) return NextResponse.json({ ok: false, error: "bad signature" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, data: await handleDeliveryWebhook(JSON.parse(raw)) });
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: e.status });
    if (e instanceof SyntaxError) return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
