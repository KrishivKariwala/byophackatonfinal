import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { isFreshLoad } from "@/lib/fresh-load";

const req = (headers: Record<string, string> = {}, cookie = "sap_session=u_priya.sig; sap_lang=hi") =>
  new NextRequest("http://localhost:3000/", { headers: { cookie, ...headers } });

describe("opening the main screen signs the demo user out", () => {
  it("a fresh page load clears the session cookie and keeps the language", () => {
    const res = middleware(req());
    const set = res.headers.get("set-cookie") ?? "";
    expect(set).toMatch(/sap_session=;/);
    expect(set).toMatch(/Max-Age=0/i);
    expect(set).not.toMatch(/sap_lang/);
  });

  it("the page itself is rendered without the session (the cookie is stripped from the forwarded request)", () => {
    const res = middleware(req());
    const forwarded = res.headers.get("x-middleware-request-cookie") ?? "";
    expect(forwarded).not.toMatch(/sap_session/);
    expect(forwarded).toMatch(/sap_lang=hi/);
  });

  it("a real page load (browser sends Sec-Fetch-Dest: document) signs out", () => {
    expect(middleware(req({ "sec-fetch-dest": "document", "sec-fetch-mode": "navigate" })).headers.get("set-cookie")).toMatch(/sap_session=;/);
  });

  it("clicking the logo or a Back link (an in-app fetch) keeps the user signed in", () => {
    expect(middleware(req({ "sec-fetch-dest": "empty", "sec-fetch-mode": "cors", rsc: "1" })).headers.get("set-cookie")).toBeNull();
    expect(middleware(req({ "sec-fetch-dest": "empty" })).headers.get("set-cookie")).toBeNull();
  });

  it("link prefetches never sign anyone out", () => {
    expect(middleware(req({ "sec-fetch-dest": "empty", "next-router-prefetch": "1" })).headers.get("set-cookie")).toBeNull();
    expect(middleware(req({ purpose: "prefetch" })).headers.get("set-cookie")).toBeNull();
  });

  it("does nothing when nobody is signed in", () => {
    expect(middleware(req({}, "sap_lang=hi")).headers.get("set-cookie")).toBeNull();
  });

  it("classifies requests", () => {
    expect(isFreshLoad(new Headers())).toBe(true);
    expect(isFreshLoad(new Headers({ "sec-fetch-dest": "document" }))).toBe(true);
    expect(isFreshLoad(new Headers({ "sec-fetch-dest": "empty" }))).toBe(false);
  });
});
