import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/messages/en.json";
import hi from "@/lib/i18n/messages/hi.json";
import kn from "@/lib/i18n/messages/kn.json";
import { translate } from "@/lib/i18n/locales";
import { CREDIT_NOTE_KEYS, ledgerNote } from "@/lib/p2/ledger-note";
import { buildSeed } from "@/lib/seed";

const catalogs = { en, hi, kn } as Record<string, Record<string, string>>;

describe("credit ledger notes are shown in the visitor's language", () => {
  it("recognises every note the app writes", () => {
    expect(ledgerNote("referral reward")?.key).toBe("ledger.note.referralReward");
    expect(ledgerNote("referral welcome credit")?.key).toBe("ledger.note.referralWelcome");
    expect(ledgerNote("used on a past order")?.key).toBe("ledger.note.usedPast");
    expect(ledgerNote("used on checkout of Bread Box")).toEqual({ key: "ledger.note.usedCheckout", vars: { title: "Bread Box" } });
    expect(ledgerNote("used on SAP-1234")).toEqual({ key: "ledger.note.usedOrder", vars: { ref: "SAP-1234" } });
    expect(ledgerNote("expired after 90 days")).toEqual({ key: "ledger.note.expired", vars: { days: 90 } });
    for (const reason of Object.keys(CREDIT_NOTE_KEYS)) {
      const n = ledgerNote(`restored: ${reason}`)!;
      expect(n.key).toBe("ledger.note.restored");
      expect(n.vars).toMatchObject({ reason, reasonKey: CREDIT_NOTE_KEYS[reason] });
    }
  });

  it("returns null for text it does not know, so it is shown as written", () => {
    expect(ledgerNote("something else")).toBeNull();
    expect(ledgerNote(undefined)).toBeNull();
  });

  it("every key exists in English, Hindi and Kannada", () => {
    const keys = ["referralReward", "referralWelcome", "usedPast", "usedCheckout", "usedOrder", "restored", "expired"].map((k) => `ledger.note.${k}`);
    for (const loc of ["en", "hi", "kn"]) for (const k of keys) expect(catalogs[loc][k], `${loc} ${k}`).toBeTruthy();
  });

  it("reads in Hindi and Kannada, including the nested reason", () => {
    const n = ledgerNote("restored: order cancelled")!;
    const hiText = translate("hi", hi as never, en as never, n.key, n.vars);
    const knText = translate("kn", kn as never, en as never, n.key, n.vars);
    expect(hiText).not.toMatch(/[A-Za-z]/);
    expect(knText).not.toMatch(/[A-Za-z]/);
  });

  it("all notes in the demo seed are recognised", () => {
    const db = buildSeed(Date.now());
    const notes = new Set(db.creditLedger.map((e) => e.note).filter(Boolean) as string[]);
    expect(notes.size).toBeGreaterThan(0);
    for (const note of notes) expect(ledgerNote(note), note).not.toBeNull();
  });
});
