import { RuleError } from "./rules";

/** Small in-process sliding-window limiter (demo/single instance). Production: put this in Redis or the edge. */
type G = { __sapRate?: Map<string, number[]> };
const g = globalThis as unknown as G;

export function rateLimit(key: string, max: number, windowMs: number, nowMs = Date.now()) {
  const m: Map<string, number[]> = (g.__sapRate ??= new Map());
  const hits = (m.get(key) ?? []).filter((x) => nowMs - x < windowMs);
  if (hits.length >= max) {
    m.set(key, hits);
    throw new RuleError("rate_limited", "Too many attempts. Please wait a moment and try again.", 429);
  }
  hits.push(nowMs);
  m.set(key, hits);
}
export function resetRateLimits() { (g.__sapRate ??= new Map()).clear(); }
