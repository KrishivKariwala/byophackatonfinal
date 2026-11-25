type TFn = (key: string, vars?: Record<string, string | number>) => string;

/** Translated text for `key`, or `fallback` when the catalog has no such key (t() returns the key itself in that case). */
export function tOr(t: TFn, key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

/** Display label for a neighbourhood name (e.g. "Koramangala"); the English name is what is stored, this only affects what is shown. */
export function hoodLabel(t: TFn, name: string): string {
  return tOr(t, `hood.${name}`, name);
}

/**
 * The moderation queue stores its reasons as short English sentences ("Keyword: stale", "3 open reports", "Hidden by an administrator").
 * This shows them in the visitor's language; text it does not recognise comes back as written.
 */
export function modReasonLabel(t: TFn, reason: string): string {
  let m = reason.match(/^Keyword: (.+)$/);
  if (m) return t("mod.reason.keyword", { words: m[1] });
  m = reason.match(/^(\d+) open reports?$/);
  if (m) return t("mod.reason.reports", { n: Number(m[1]) });
  if (reason === "Hidden by an administrator") return t("mod.reason.hidden");
  return reason;
}

/** Moderation item titles for reviews are built as "4★ review of Crumb & Co."; this shows them in the visitor's language. */
export function modTitleLabel(t: TFn, title: string): string {
  const m = title.match(/^(\d)★ review of (.+)$/);
  return m ? t("mod.reviewOf", { rating: Number(m[1]), vendor: m[2] }) : title;
}

/** Display label for a status value (e.g. "Picked up"); the raw value is kept for logic, this only affects what is shown. */
export function statusLabel(t: TFn, status: string): string {
  return tOr(t, `status.${status}`, status);
}
