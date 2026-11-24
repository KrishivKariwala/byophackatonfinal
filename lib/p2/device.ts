import "server-only";
import { cookies } from "next/headers";
import { randomToken } from "../crypto";

const NAME = "sap_device";

/** An anonymous, random per-browser id (httpOnly cookie). It is only used to stop one device redeeming referral rewards twice. */
export async function deviceId(create = true): Promise<string | undefined> {
  const jar = await cookies();
  const existing = jar.get(NAME)?.value;
  if (existing && /^[\w-]{16,64}$/.test(existing)) return existing;
  if (!create) return undefined;
  const id = randomToken();
  try { jar.set(NAME, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 }); } catch { /* read-only context (server component): the next API call sets it */ }
  return id;
}
