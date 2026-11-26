import "server-only";
import { NextResponse } from "next/server";
import { RuleError } from "./rules";
import { lastWrite, pgEnabled } from "./pg/db";
import { getLocale } from "./i18n/server";
import { CATALOG, messagesFor } from "./i18n/catalog";
import { translate } from "./i18n/locales";

/** The text to show for a RuleError in the visitor's language; English (the original message) when there is no catalog entry. */
async function ruleMessage(e: RuleError): Promise<string> {
  const k = e.i18nKey ?? e.code;
  if (!k) return e.message;
  const key = `rerr.${k}`;
  if (!(key in CATALOG.en)) return e.message;
  try {
    const locale = await getLocale();
    if (locale === "en") return e.message;
    return translate(locale, messagesFor(locale), CATALOG.en, key, e.vars);
  } catch {
    return e.message; // outside a request (scripts, tests): English
  }
}

/** For server components that show an error: the visitor's language for rule errors, the plain message otherwise. */
export async function localizeError(e: unknown): Promise<string> {
  if (e instanceof RuleError) return ruleMessage(e);
  return e instanceof Error ? e.message : String(e);
}

export async function handle<T>(fn: () => Promise<T>) {
  const before = lastWrite();
  try {
    const data = await fn();
    const res = NextResponse.json({ ok: true, data });
    // Database store: this request changed something. Tell the browser when, so its next page loads never use an older shared snapshot.
    if (pgEnabled() && lastWrite() !== before) res.cookies.set("sap_rev", String(lastWrite()), { path: "/", maxAge: 30, sameSite: "lax" });
    return res;
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ ok: false, code: e.code, error: await ruleMessage(e) }, { status: e.status });
    console.error(e);
    return NextResponse.json({ ok: false, code: "server_error", error: await ruleMessage(new RuleError("server_error", "Something went wrong. Please try again.")) }, { status: 500 });
  }
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new RuleError("bad_json", "Invalid request body.");
  }
}
