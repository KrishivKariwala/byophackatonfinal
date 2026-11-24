import { describe, expect, it, vi } from "vitest";

// The visitor's language comes from a cookie in a real request; tests pick it directly.
const loc = vi.hoisted(() => ({ v: "en" as "en" | "hi" | "kn" }));
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => loc.v }));

import { store, customer, freshListing, onlineOrder } from "./p2-harness";
import en from "@/lib/i18n/messages/en.json";
import hi from "@/lib/i18n/messages/hi.json";
import kn from "@/lib/i18n/messages/kn.json";
import { checkCatalog } from "@/lib/i18n/check";
import { CATALOG, messagesFor } from "@/lib/i18n/catalog";
import { translate } from "@/lib/i18n/locales";
const { RuleError } = await import("@/lib/rules");
const { handle, localizeError } = await import("@/lib/api");
const { notifyT } = await import("@/lib/core");

const DEVANAGARI = /[ऀ-ॿ]/;
const KANNADA = /[ಀ-೿]/;

describe("server-written errors follow the visitor's language (RuleError)", () => {
  it("translates a code with vars into Hindi and Kannada, keeps English as the message, and falls back for unknown codes", async () => {
    const e = new RuleError("qty_cap", "Maximum 5 units per order.", 400, { max: 5 });
    expect(e.message).toBe("Maximum 5 units per order."); // logs and tests keep the English
    loc.v = "en";
    expect(await localizeError(e)).toBe("Maximum 5 units per order.");
    loc.v = "hi";
    const h = await localizeError(e);
    expect(h).toMatch(DEVANAGARI);
    expect(h).toContain("5");
    expect(h).not.toContain("Maximum");
    loc.v = "kn";
    const k = await localizeError(e);
    expect(k).toMatch(KANNADA);
    expect(k).toContain("5");

    // a code with no catalog entry, and a message that is the user's own words (key ""), stay as written
    loc.v = "hi";
    expect(await localizeError(new RuleError("totally_unknown_code", "Some English text."))).toBe("Some English text.");
    expect(await localizeError(new RuleError("account_suspended", "Admin wrote this.", 403, undefined, ""))).toBe("Admin wrote this.");
    expect(await localizeError(new Error("plain"))).toBe("plain");
  });

  it("translates words inside the message (a status) and distinct wordings of one code via the key", async () => {
    loc.v = "hi";
    const e = new RuleError("not_available", "This listing is live.", 409, { status: "live", statusKey: "status.Live" }, "not_available_status");
    const h = await localizeError(e);
    expect(h).toContain(hi["status.Live"]);
    expect(h).not.toContain("live");
    // the same code, other wording, other sentence
    expect(await localizeError(new RuleError("not_available", "This listing is not available.", 409, undefined, "not_available_listing_not_available"))).toBe(hi["rerr.not_available_listing_not_available"]);
  });

  it("handle() returns the localized text in the JSON body and keeps code and status", async () => {
    loc.v = "kn";
    const res = await handle(async () => { throw new RuleError("window_past", "Pickup start must be in the future.", 400); });
    const j = await res.json();
    expect(res.status).toBe(400);
    expect(j).toMatchObject({ ok: false, code: "window_past" });
    expect(j.error).toBe(kn["rerr.window_past"]);
    loc.v = "en";
    const en2 = await (await handle(async () => { throw new RuleError("window_past", "Pickup start must be in the future.", 400); })).json();
    expect(en2.error).toBe("Pickup start must be in the future.");
  });

  it("every English message thrown by validatePrices matches its catalog entry exactly", async () => {
    const { validatePrices } = await import("@/lib/rules");
    for (const [o, r, cap] of [[100, 90, 100], [100, 20, 50]] as const) {
      let err: InstanceType<typeof RuleError> | undefined;
      try { validatePrices(o, r, cap); } catch (x) { err = x as InstanceType<typeof RuleError>; }
      expect(err).toBeDefined();
      expect(translate("en", CATALOG.en, CATALOG.en, `rerr.${err!.i18nKey ?? err!.code}`, err!.vars)).toBe(err!.message);
    }
  });
});

describe("notifications keep the English text and carry key + vars", () => {
  it("notifyT stores key, vars and the exact English text; readers get kn/hi from the catalog", async () => {
    await store.transaction((tx) => { notifyT(tx, "u_priya", "orderReady", { ref: "SAP-777" }, "order_ready"); });
    const n = store.read().notifications.filter((x) => x.userId === "u_priya").pop()!;
    expect(n.key).toBe("orderReady");
    expect(n.vars).toEqual({ ref: "SAP-777" });
    expect(n.text).toBe("SAP-777 is ready for pickup.");
    expect(n.type).toBe("order_ready");
    const show = (l: "en" | "hi" | "kn") => translate(l, messagesFor(l), CATALOG.en, `notif.${n.key}`, n.vars);
    expect(show("en")).toBe(n.text);
    expect(show("hi")).toMatch(DEVANAGARI);
    expect(show("hi")).toContain("SAP-777");
    expect(show("kn")).toMatch(KANNADA);
    expect(show("kn")).toContain("SAP-777");
  });

  it("a real order writes keyed notifications whose English text is unchanged, with statuses translated at read time", async () => {
    const l = await freshListing();
    const c = await customer(7);
    await onlineOrder(c, l.id);
    const mine = store.read().notifications.filter((x) => x.userId === c.id);
    const confirmed = mine.find((x) => x.key === "orderConfirmed")!;
    expect(confirmed.text).toMatch(/^Order SAP-\w+ confirmed: 1 × Test Box\. Collect between \S+ and \S+\.$/);
    expect(translate("kn", messagesFor("kn"), CATALOG.en, `notif.${confirmed.key}`, confirmed.vars)).toMatch(KANNADA);
    // a notification with a status word: the word itself comes from the reader's catalog
    const vars = { kind: "vendor", kindKey: "signin.role.vendor", status: "approved", statusKey: "status.Approved" };
    expect(translate("en", CATALOG.en, CATALOG.en, "notif.approvalDecision", vars)).toBe("Your vendor application was approved (demo approval, not a regulatory approval).");
    const inHi = translate("hi", messagesFor("hi"), CATALOG.en, "notif.approvalDecision", vars);
    expect(inHi).toContain(hi["status.Approved"]);
    expect(inHi).toContain(hi["signin.role.vendor"]);
  });
});

describe("catalog coverage for server-written text", () => {
  it("has many rerr.* and notif.* keys, each with Hindi and Kannada text and identical placeholders", () => {
    const keys = (p: string) => Object.keys(en).filter((k) => k.startsWith(p));
    expect(keys("rerr.").length).toBeGreaterThan(40);
    expect(keys("notif.").length).toBeGreaterThan(40);
    for (const k of [...keys("rerr."), ...keys("notif.")]) {
      expect((hi as Record<string, string>)[k]?.trim(), `hi ${k}`).toBeTruthy();
      expect((kn as Record<string, string>)[k]?.trim(), `kn ${k}`).toBeTruthy();
    }
    const r = checkCatalog({ en, hi, kn });
    expect(r.ok).toBe(true);
    expect(r.placeholder).toEqual([]);
  });
});
