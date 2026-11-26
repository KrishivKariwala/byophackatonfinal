import "server-only";
import crypto from "node:crypto";

/**
 * Pickup codes and QR tokens must be shown to the customer again whenever they open their order, but the database only stores hashes
 * for the vendor's scan. So the plaintext is also stored ENCRYPTED (AES-256-GCM) with a key only the server has. The database
 * (and anyone who reads it) sees ciphertext. Key: PICKUP_BOX_KEY, else SESSION_SECRET.
 */
function key(): Buffer {
  const s = process.env.PICKUP_BOX_KEY || process.env.SESSION_SECRET;
  if (!s) {
    const demo = !process.env.DATA_MODE || process.env.DATA_MODE === "demo";
    if (!demo || process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (or PICKUP_BOX_KEY) must be set to encrypt pickup codes.");
    return crypto.createHash("sha256").update("dev-only-insecure-secret").digest();
  }
  return crypto.createHash("sha256").update(`pickup-box:${s}`).digest();
}

export function seal(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function open(sealed: string | null | undefined): string | null {
  if (!sealed) return null;
  const [v, iv, tag, ct] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !ct) return null;
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
  } catch { return null; } // wrong key or tampered
}
