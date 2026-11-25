/**
 * Credit-ledger rows store a short English note (written by lib/p2/credits.ts and lib/services.ts, and by the seed).
 * `ledgerNote()` recognises every note format and returns the catalog key and values to show it in the visitor's language.
 * Unknown text comes back as null, so the caller shows it as written. No server-only imports: it is used by a client component.
 */

/** The reasons restoreCreditTx is called with, mapped to catalog entries (also used for the "credit returned" notification). */
export const CREDIT_NOTE_KEYS: Record<string, string> = {
  "refunded by an administrator": "notif.creditNote.refundedByAdmin",
  "checkout hold expired": "notif.creditNote.holdExpired",
  "checkout was not completed": "notif.creditNote.notCompleted",
  "vendor cancelled the listing": "notif.creditNote.vendorCancelled",
  "order cancelled": "notif.creditNote.orderCancelled",
};

export interface LedgerNote { key: string; vars?: Record<string, string | number> }

export function ledgerNote(note?: string | null): LedgerNote | null {
  if (!note) return null;
  if (note === "referral reward") return { key: "ledger.note.referralReward" };
  if (note === "referral welcome credit") return { key: "ledger.note.referralWelcome" };
  if (note === "used on a past order") return { key: "ledger.note.usedPast" };
  let m = note.match(/^used on checkout of (.+)$/);
  if (m) return { key: "ledger.note.usedCheckout", vars: { title: m[1] } };
  m = note.match(/^used on (.+)$/);
  if (m) return { key: "ledger.note.usedOrder", vars: { ref: m[1] } };
  m = note.match(/^restored: (.+)$/);
  if (m) return { key: "ledger.note.restored", vars: { reason: m[1], ...(CREDIT_NOTE_KEYS[m[1]] ? { reasonKey: CREDIT_NOTE_KEYS[m[1]] } : {}) } };
  m = note.match(/^expired after (\d+) days$/);
  if (m) return { key: "ledger.note.expired", vars: { days: Number(m[1]) } };
  return null;
}
