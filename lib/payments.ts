import "server-only";
import { hmac, safeEqual } from "./crypto";

/**
 * Razorpay TEST MODE adapter. Secrets stay on the server.
 * If keys are missing, the app uses the clearly labelled demo payment adapter instead.
 * Live keys are refused: only keys starting with rzp_test_ are accepted.
 */
export function razorpayConfigured() {
  const id = process.env.RAZORPAY_KEY_ID || "";
  return Boolean(id && process.env.RAZORPAY_KEY_SECRET && id.startsWith("rzp_test_"));
}

function auth() {
  return "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
}

export async function createRazorpayOrder(amountRupees: number, receipt: string): Promise<{ id: string }> {
  if (!razorpayConfigured()) throw new Error("Razorpay test keys are not configured");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountRupees * 100, currency: "INR", receipt, payment_capture: 1 }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`);
  return (await res.json()) as { id: string };
}

/** Checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  return safeEqual(hmac(secret, `${orderId}|${paymentId}`), signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return safeEqual(hmac(secret, rawBody), signature);
}

export async function refundRazorpayPayment(paymentId: string, amountRupees: number) {
  if (!razorpayConfigured()) throw new Error("Razorpay test keys are not configured");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountRupees * 100 }),
  });
  if (!res.ok) throw new Error(`Razorpay refund failed: ${res.status}`);
  return res.json();
}
