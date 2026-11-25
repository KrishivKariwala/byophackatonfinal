/**
 * Offline queue for handover scans. When the vendor's tablet has no connection, a scan is saved on the device and sent when the
 * connection returns. The server stays the only judge: it checks the code (single use, right vendor, inside the pickup window) at the
 * moment the scan arrives, so a queued scan can be refused exactly like a live one. A saved scan is kept for at most 10 minutes; after that
 * it is dropped and the vendor is told to scan again. Plain functions with no server imports, so a client component can use them.
 */
export const SCAN_QUEUE_KEY = "sap-scan-queue";
export const SCAN_QUEUE_MAX_AGE_MS = 10 * 60_000;
export const SCAN_QUEUE_MAX_ITEMS = 50;

export interface ScanPayload { code?: string; token?: string }
export interface QueuedScan { id: string; payload: ScanPayload; queuedAt: number }
export type QueueStorage = Pick<Storage, "getItem" | "setItem">;

function load(storage: QueueStorage | null): QueuedScan[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(SCAN_QUEUE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is QueuedScan => !!x && typeof x.id === "string" && typeof x.queuedAt === "number" && !!x.payload && (!!x.payload.code || !!x.payload.token)) : [];
  } catch { return []; }
}
function save(storage: QueueStorage | null, items: QueuedScan[]) {
  try { storage?.setItem(SCAN_QUEUE_KEY, JSON.stringify(items)); } catch { /* storage full or blocked: the queue is best effort */ }
}

/** The scans still worth sending, oldest first, and how many were dropped for being older than 10 minutes. */
export function readQueue(storage: QueueStorage | null, nowMs: number): { items: QueuedScan[]; dropped: number } {
  const all = load(storage);
  const items = all.filter((x) => nowMs - x.queuedAt <= SCAN_QUEUE_MAX_AGE_MS && x.queuedAt <= nowMs + 60_000).sort((a, b) => a.queuedAt - b.queuedAt);
  if (items.length !== all.length) save(storage, items);
  return { items, dropped: all.length - items.length };
}

/** Saves a scan. The same code or QR token twice is kept once. */
export function enqueue(storage: QueueStorage | null, payload: ScanPayload, nowMs: number): QueuedScan[] {
  const { items } = readQueue(storage, nowMs);
  const same = (p: ScanPayload) => (p.code && p.code === payload.code) || (p.token && p.token === payload.token);
  if (items.some((x) => same(x.payload))) return items;
  const next = [...items, { id: `${nowMs}-${Math.random().toString(36).slice(2, 8)}`, payload, queuedAt: nowMs }].slice(-SCAN_QUEUE_MAX_ITEMS);
  save(storage, next);
  return next;
}

export function removeFromQueue(storage: QueueStorage | null, id: string, nowMs: number): QueuedScan[] {
  const next = readQueue(storage, nowMs).items.filter((x) => x.id !== id);
  save(storage, next);
  return next;
}

/** True when a failed request never reached the server (no connection), so it is safe to save and send later. */
export function isOfflineError(e: unknown): boolean {
  return e instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false);
}
