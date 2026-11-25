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

/** Display label for a status value (e.g. "Picked up"); the raw value is kept for logic, this only affects what is shown. */
export function statusLabel(t: TFn, status: string): string {
  return tOr(t, `status.${status}`, status);
}
