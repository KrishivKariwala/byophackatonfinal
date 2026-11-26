import crypto from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID.test(s);

/**
 * The demo data uses readable ids ("u_vendor2", "l_ab12"); Postgres uses uuids. Anything that is not already a uuid becomes a
 * deterministic one (a v5 uuid of the text), so the same demo id always maps to the same uuid and every reference stays consistent.
 */
const NS = Buffer.from("6f1d3b1e5a7c4c0e9a3d2b7f8e4c1a90", "hex");
export function toUuid(s: string): string {
  if (isUuid(s)) return s.toLowerCase();
  const h = crypto.createHash("sha1").update(NS).update(String(s)).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}
