import "server-only";
import { NextResponse } from "next/server";
import { RuleError } from "./rules";

export async function handle<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    if (e instanceof RuleError) return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ ok: false, code: "server_error", error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new RuleError("bad_json", "Invalid request body.");
  }
}
