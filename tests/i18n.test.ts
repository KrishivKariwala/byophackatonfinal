import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/messages/en.json";
import hi from "@/lib/i18n/messages/hi.json";
import kn from "@/lib/i18n/messages/kn.json";
import { checkCatalog, keysUsedInSource } from "@/lib/i18n/check";
import { fromAcceptLanguage, pickLocale, translate, formatters } from "@/lib/i18n/locales";

describe("i18n catalog check (feature 2)", () => {
  it("the shipped catalogs have no missing, extra or mismatched keys", () => {
    const r = checkCatalog({ en, hi, kn });
    expect(r.missing).toEqual({ hi: [], kn: [] });
    expect(r.extra).toEqual({ hi: [], kn: [] });
    expect(r.placeholder).toEqual([]);
  });

  it("detects a missing key, an extra key and a changed placeholder", () => {
    const r = checkCatalog({ en: { a: "A", b: "Hello {name}", c: "C" }, hi: { a: "ए", b: "नमस्ते {nam}", z: "zzz" }, kn: { a: "ಎ", b: "ನಮಸ್ಕಾರ {name}", c: "ಸಿ" } });
    expect(r.ok).toBe(false);
    expect(r.missing.hi).toEqual(["c"]);
    expect(r.missing.kn).toEqual([]);
    expect(r.extra.hi).toEqual(["z"]);
    expect(r.placeholder).toEqual(["hi:b"]);
  });

  it("flags keys used in code that English doesn't define, and an empty translation counts as missing", () => {
    const src = [`t("a.b") + t('x.y') + t(\`dyn.\${k}\`) + { label: "nav.q" }`];
    expect([...keysUsedInSource(src)].sort()).toEqual(["a.b", "nav.q", "x.y"]);
    const r = checkCatalog({ en: { "a.b": "A" }, hi: { "a.b": "  " }, kn: { "a.b": "ಎ" } }, src);
    expect(r.unknownKeysInCode.sort()).toEqual(["nav.q", "x.y"]);
    expect(r.missing.hi).toEqual(["a.b"]);
  });
});

describe("language selection and lookup", () => {
  it("defaults to the device language when no choice was made, English otherwise", () => {
    expect(fromAcceptLanguage("hi-IN,hi;q=0.9,en;q=0.8")).toBe("hi");
    expect(fromAcceptLanguage("fr-FR,kn;q=0.7")).toBe("kn");
    expect(fromAcceptLanguage("fr-FR,de;q=0.9")).toBeNull();
    expect(pickLocale(undefined, "hi-IN")).toBe("hi");
    expect(pickLocale("kn", "hi-IN")).toBe("kn"); // an explicit choice wins
    expect(pickLocale("xx", null)).toBe("en");
  });

  it("falls back to English per key, never showing a raw key when English has it", () => {
    expect(translate("hi", { a: "हिन्दी" }, { a: "English", b: "Only English" }, "b")).toBe("Only English");
    expect(translate("hi", { a: "हिन्दी" }, { a: "English" }, "a")).toBe("हिन्दी");
    expect(translate("hi", {}, {}, "nope.key")).toBe("nope.key");
  });

  it("interpolates variables and picks plural forms", () => {
    const dict = { "x_one": "{n} meal", "x_other": "{n} meals", "hello": "Hi {name}" };
    expect(translate("en", dict, dict, "x", { n: 1 })).toBe("1 meal");
    expect(translate("en", dict, dict, "x", { n: 4 })).toBe("4 meals");
    expect(translate("en", dict, dict, "hello", { name: "Asha" })).toBe("Hi Asha");
  });

  it("formats rupees, numbers and Asia/Kolkata times for each locale", () => {
    expect(formatters("en").inr(1234)).toBe("₹1,234");
    expect(formatters("hi").inr(1234)).toContain("₹");
    expect(formatters("en").number(1234567)).toBe("12,34,567"); // Indian digit grouping
    const iso = "2026-03-01T12:00:00Z";
    expect(formatters("en").time(iso).toLowerCase()).toMatch(/5:30\s?pm/);
    expect(formatters("kn").time(iso)).not.toBe("");
  });
});
