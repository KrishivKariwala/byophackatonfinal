import { NextResponse, type NextRequest } from "next/server";
import { isCrossSiteWrite, isFreshLoad } from "@/lib/fresh-load";

/**
 * A fresh load of the main screen ("/") starts signed out: the session cookie is removed from this request (so the page and
 * header render with no account) and from the browser. A browser refresh anywhere returns to "/" with a full page load
 * (see app/layout.tsx), so a refresh also ends the demo session.
 *
 * In-app moves are different: clicking the logo or a "Back" link is a client-side navigation (a fetch, not a page load),
 * and that keeps you signed in. Link prefetches are ignored too, so hovering a link never signs anyone out.
 * See lib/fresh-load.ts for how the two are told apart.
 */
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    // writes from another site are refused (see lib/fresh-load.ts)
    return isCrossSiteWrite(req.method, req.nextUrl.pathname, req.headers)
      ? NextResponse.json({ ok: false, code: "cross_site", error: "Cross-site requests are not allowed." }, { status: 403 })
      : NextResponse.next();
  }
  if (!isFreshLoad(req.headers) || !req.cookies.has("sap_session")) return NextResponse.next();
  const headers = new Headers(req.headers);
  const rest = (headers.get("cookie") ?? "").split(/;\s*/).filter((c) => c && !c.startsWith("sap_session="));
  if (rest.length) headers.set("cookie", rest.join("; ")); else headers.delete("cookie");
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set("sap_session", "", { path: "/", maxAge: 0 });
  return res;
}

export const config = { matcher: ["/", "/api/:path*"] };
