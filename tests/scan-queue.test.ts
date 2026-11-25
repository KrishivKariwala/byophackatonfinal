import { describe, expect, it } from "vitest";
import { SCAN_QUEUE_MAX_AGE_MS, SCAN_QUEUE_MAX_ITEMS, enqueue, isOfflineError, readQueue, removeFromQueue, type QueueStorage } from "@/lib/scan-queue";

const memory = (): QueueStorage => { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) }; };
const T0 = 1_800_000_000_000;

describe("offline scan queue", () => {
  it("saves scans and returns them oldest first", () => {
    const s = memory();
    enqueue(s, { code: "1111" }, T0);
    enqueue(s, { token: "sap:abc" }, T0 + 1000);
    expect(readQueue(s, T0 + 2000).items.map((x) => x.payload)).toEqual([{ code: "1111" }, { token: "sap:abc" }]);
  });

  it("keeps the same code or token once", () => {
    const s = memory();
    enqueue(s, { code: "1111" }, T0); enqueue(s, { code: "1111" }, T0 + 500); enqueue(s, { token: "t" }, T0 + 600); enqueue(s, { token: "t" }, T0 + 700);
    expect(readQueue(s, T0 + 1000).items).toHaveLength(2);
  });

  it("drops scans older than 10 minutes and says how many", () => {
    const s = memory();
    enqueue(s, { code: "1111" }, T0);
    enqueue(s, { code: "2222" }, T0 + SCAN_QUEUE_MAX_AGE_MS - 1000);
    const r = readQueue(s, T0 + SCAN_QUEUE_MAX_AGE_MS + 1000);
    expect(r.items.map((x) => x.payload.code)).toEqual(["2222"]);
    expect(r.dropped).toBe(1);
    expect(readQueue(s, T0 + SCAN_QUEUE_MAX_AGE_MS + 1000).dropped).toBe(0); // dropped for good
  });

  it("removes a scan once it has been sent", () => {
    const s = memory();
    const [a] = enqueue(s, { code: "1111" }, T0);
    enqueue(s, { code: "2222" }, T0 + 10);
    removeFromQueue(s, a.id, T0 + 20);
    expect(readQueue(s, T0 + 30).items.map((x) => x.payload.code)).toEqual(["2222"]);
  });

  it("ignores damaged data and works without storage", () => {
    const s = memory(); s.setItem("sap-scan-queue", "{nope");
    expect(readQueue(s, T0).items).toEqual([]);
    expect(readQueue(null, T0).items).toEqual([]);
    expect(() => enqueue(null, { code: "1" }, T0)).not.toThrow();
  });

  it("is capped", () => {
    const s = memory();
    for (let i = 0; i < SCAN_QUEUE_MAX_ITEMS + 10; i++) enqueue(s, { code: String(1000 + i) }, T0 + i);
    expect(readQueue(s, T0 + 1000).items).toHaveLength(SCAN_QUEUE_MAX_ITEMS);
  });

  it("only a request that never reached the server counts as offline", () => {
    expect(isOfflineError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isOfflineError(Object.assign(new Error("Code already used"), { code: "code_used" }))).toBe(false);
  });
});
