import crypto from "node:crypto";

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
// With STORE=supabase every id is a real uuid (the database columns are uuids); the demo store keeps readable prefixed ids.
export const newId = (prefix: string) => (process.env.STORE === "supabase" ? crypto.randomUUID() : `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`);
export const randomToken = () => crypto.randomBytes(24).toString("base64url");
export const random4 = () => String(crypto.randomInt(0, 10000)).padStart(4, "0");

export function hmac(secret: string, data: string) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
