import { NextResponse, type NextRequest } from "next/server";

/**
 * Opening the main screen ("/") always starts signed out: the session cookie is removed from this request (so the page
 * and header render with no account) and from the browser. Because a browser refresh anywhere returns to "/" (see
 * app/layout.tsx), a refresh also ends the demo session. Link prefetches are ignored so hovering a link never signs anyone out.
 */
export function middleware(req: NextRequest) {
  const prefetch = req.headers.get("next-router-prefetch") || req.headers.get("purpose") === "prefetch";
  if (prefetch || !req.cookies.has("sap_session")) return NextResponse.next();
  const headers = new Headers(req.headers);
  const rest = (headers.get("cookie") ?? "").split(/;\s*/).filter((c) => c && !c.startsWith("sap_session="));
  if (rest.length) headers.set("cookie", rest.join("; ")); else headers.delete("cookie");
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set("sap_session", "", { path: "/", maxAge: 0 });
  return res;
}

export const config = { matcher: ["/"] };
