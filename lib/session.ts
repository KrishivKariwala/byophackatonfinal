import "server-only";
import { cookies } from "next/headers";
import { hmac, safeEqual } from "./crypto";
import { read } from "./store";
import type { Profile } from "./types";

export const SESSION_COOKIE = "sap_session";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production");
  return s || "dev-only-insecure-secret";
}

export function signSession(userId: string) {
  return `${userId}.${hmac(secret(), userId)}`;
}

export function verifySession(value: string | undefined): string | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i <= 0) return null;
  const uid = value.slice(0, i);
  const sig = value.slice(i + 1);
  return safeEqual(sig, hmac(secret(), uid)) ? uid : null;
}

/** Resolves the acting user from the signed cookie. Roles always come from the server-side profile. */
export async function getActor(): Promise<Profile | null> {
  const jar = await cookies();
  const uid = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  return read().profiles.find((p) => p.id === uid) ?? null;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(userId), { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 14 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
