import { describe, expect, it } from "vitest";
import { ff, P, store, svc } from "./p2-harness";
import { createSchedule, deleteSchedule, dueSchedules, istDay, setSchedulePaused } from "@/lib/p2/recurring";
import { saveTemplateFromListing } from "@/lib/vendor";

/** A template for Ravi, and a schedule that publishes it every day at the given India-time start. */
async function setup(startTime: string, lead = 60, days = [0, 1, 2, 3, 4, 5, 6]) {
  const tpl = await saveTemplateFromListing(P("u_ravi"), store.read().listings.find((l) => l.vendorId === "v_1")!.id).catch(() => store.read().templates.find((x) => x.vendorId === "v_1")!);
  const s = await createSchedule(P("u_ravi"), { templateId: tpl.id, days, startTime, leadMinutes: lead, declaration: true });
  return { tpl, s };
}
const hhmm = (ms: number) => { const d = new Date(ms + 330 * 60_000); return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };

describe("recurring listings", () => {
  it("knows the India calendar day", () => {
    const d = istDay(Date.UTC(2026, 10, 25, 20, 0)); // 25 Nov 2026 20:00 UTC = 26 Nov 01:30 India time
    expect(d.date).toBe("2026-11-26");
    expect(d.dow).toBe(4); // Thursday
  });

  it("validates the schedule", async () => {
    const tpl = store.read().templates.find((x) => x.vendorId === "v_1")!;
    const base = { templateId: tpl.id, days: [1], startTime: "18:30", declaration: true };
    await expect(createSchedule(P("u_ravi"), { ...base, declaration: false })).rejects.toMatchObject({ code: "declaration_required" });
    await expect(createSchedule(P("u_ravi"), { ...base, days: [] })).rejects.toMatchObject({ code: "days_required" });
    await expect(createSchedule(P("u_ravi"), { ...base, startTime: "25:99" })).rejects.toMatchObject({ code: "time_invalid" });
    await expect(createSchedule(P("u_ravi"), { ...base, leadMinutes: 5 })).rejects.toMatchObject({ code: "lead_invalid" });
    await expect(createSchedule(P("u_priya"), base)).rejects.toMatchObject({ code: "forbidden" });
    await expect(createSchedule(P("u_vendor2"), base)).rejects.toMatchObject({ code: "not_found" }); // another vendor's template
  });

  it("publishes once, ahead of the window, with the template's details; never twice for the same day", async () => {
    const now = store.now();
    const start = Math.ceil((now + 40 * 60_000) / 60_000) * 60_000; // window opens in about 40 minutes; lead is 60, so it is due now
    const { s, tpl } = await setup(hhmm(start), 60);
    const before = store.read().listings.length;
    await ff(0); // any write runs the scheduled jobs
    const after = store.read();
    expect(after.listings.length).toBe(before + 1);
    const l = after.listings[after.listings.length - 1];
    expect(l.title).toBe(tpl.title);
    expect(l.rescuePrice).toBe(tpl.rescuePrice);
    expect(Date.parse(l.windowStart)).toBe(Math.floor(start / 60_000) * 60_000 || Date.parse(l.windowStart));
    const sched = after.schedules.find((x) => x.id === s.id)!;
    expect(sched.lastListingId).toBe(l.id);
    expect(sched.lastError).toBeUndefined();
    await ff(0); await ff(0);
    expect(store.read().listings.length).toBe(before + 1); // still one
    expect(dueSchedules(store.read(), store.now())).toHaveLength(0);
  });

  it("does not publish before it is time, or when paused", async () => {
    const now = store.now();
    const { s } = await setup(hhmm(now + 5 * 3600_000), 60); // opens in 5 hours, lead 1 hour: not due
    const n = store.read().listings.length;
    await ff(0);
    expect(store.read().listings.length).toBe(n);
    await setSchedulePaused(P("u_ravi"), s.id, true);
    await ff(270); // 4.5 hours later: inside the lead time, but paused
    expect(store.read().listings.length).toBe(n);
    await setSchedulePaused(P("u_ravi"), s.id, false);
    await ff(1); // (ff(0) would put the clock back to real time)
    expect(store.read().listings.length).toBe(n + 1);
  });

  it("records why it could not publish, and tries again tomorrow", async () => {
    const now = store.now();
    const { s } = await setup(hhmm(now + 40 * 60_000), 60);
    await store.transaction((tx) => { tx.db.vendors.find((v) => v.id === "v_1")!.status = "Rejected"; });
    const n = store.read().listings.length;
    await ff(0);
    const sched = store.read().schedules.find((x) => x.id === s.id)!;
    expect(store.read().listings.length).toBe(n);
    expect(sched.lastError).toBe("approval_required");
    expect(sched.lastPublishedFor).toBeTruthy(); // one attempt per day
  });

  it("deleting a schedule keeps the listings it already published", async () => {
    const now = store.now();
    const { s } = await setup(hhmm(now + 40 * 60_000), 60);
    await ff(0);
    const n = store.read().listings.length;
    await deleteSchedule(P("u_ravi"), s.id);
    expect(store.read().schedules.find((x) => x.id === s.id)).toBeUndefined();
    expect(store.read().listings.length).toBe(n);
  });

  it("the feed shows the published listing to customers", async () => {
    const now = store.now();
    await setup(hhmm(now + 40 * 60_000), 60);
    await ff(0);
    const titles = (await svc.discover({ lat: 12.9352, lng: 77.6245, radiusKm: 25 })).map((l) => l.title);
    const tpl = store.read().templates.find((x) => x.vendorId === "v_1")!;
    expect(titles).toContain(tpl.title);
  });
});

describe("a window that opens just after midnight", () => {
  it("is published the evening before, not missed", async () => {
    // 23:20 India time: a window at 00:10 tomorrow with a 60-minute lead is due since 23:10 today.
    const mid = istDay(store.now()).midnight + 86_400_000 + 10 * 60_000; // 00:10 tomorrow (IST)
    const { s } = await setup("00:10", 60);
    const lateTonight = mid - 50 * 60_000; // 23:20 tonight
    expect(dueSchedules(store.read(), lateTonight).some((d) => d.s.id === s.id)).toBe(true);
    expect(dueSchedules(store.read(), lateTonight - 2 * 3600_000).some((d) => d.s.id === s.id)).toBe(false); // 21:20: not yet
    expect(dueSchedules(store.read(), mid + 60_000).some((d) => d.s.id === s.id && d.w.start === mid)).toBe(false); // after it opened: too late for that day
  });
});
