/**
 * True for a fresh page load (typing the address, opening the app, a browser refresh); false for an in-app move such as clicking
 * the logo or a "Back" link, which Next performs with fetch() instead of loading a page. Used by middleware.ts to decide whether
 * opening the main screen should sign the demo user out.
 *
 * Next removes its own `RSC` header before middleware runs, so this relies on the browser's `Sec-Fetch-Dest` header:
 * "document" for a page load, something else (usually "empty") for fetch(). A client that sends no such header (curl, very old
 * browsers) is treated as a fresh load, which is the safe default: it ends up signed out.
 */
export function isFreshLoad(headers: Headers): boolean {
  const prefetch = headers.has("next-router-prefetch") || headers.get("purpose") === "prefetch";
  if (prefetch) return false;
  const dest = headers.get("sec-fetch-dest");
  const softNavigation = headers.get("rsc") !== null || (dest !== null && dest !== "document");
  return !softNavigation;
}
