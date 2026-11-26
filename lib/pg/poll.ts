import "server-only";
import { withTx } from "./db";
import { bus } from "../store";
import type { LiveEvent } from "../types";

/**
 * Cross-instance live updates. A server only hears the changes it made itself; on a host that runs several instances (Vercel) a
 * customer connected to one instance would never hear about a reservation made through another. So while anyone is listening, each
 * instance asks the database once a second which stock counts and order / donation statuses changed and republishes them on its own
 * bus, which feeds the same server-sent-events stream as before. Cost: one small query per second per busy instance.
 * (Supabase Realtime pushed straight to the browser would remove the polling; this needs no extra setup and keeps the stream as it is.)
 */
interface PollState { timer?: NodeJS.Timeout; listeners: number; seen: Record<string, Map<string, string>>; impact: number | null }
const g = globalThis as unknown as { __sapPoll?: PollState };
const state = (): PollState => (g.__sapPoll ??= { listeners: 0, seen: { listing: new Map(), reservation: new Map(), donation: new Map() }, impact: null });

type Pending = Omit<LiveEvent, "committedAt">;

export async function pollOnce(): Promise<void> {
  const s = state();
  const first = s.impact === null;
  const out: Pending[] = [];
  const rows = await withTx(null, async (c) => ({
    listings: (await c.query("select id, qty_available, status from listings where status in ('Live','Sold Out','Paused') or updated_at > now() - interval '1 day'")).rows,
    reservations: (await c.query("select id, status, customer_id, vendor_id from reservations where status in ('Reserved','Ready') or created_at > now() - interval '1 day'")).rows,
    donations: (await c.query("select id, status from donation_batches where status in ('Open','Claimed') or created_at > now() - interval '1 day'")).rows,
    impact: Number((await c.query("select count(*)::int n from impact_events")).rows[0].n),
  }), { write: false });
  const diff = (kind: string, items: { id: string; sig: string; event: Pending }[]) => {
    const seen = s.seen[kind];
    for (const i of items) { if (seen.get(i.id) !== i.sig) { if (!first) out.push(i.event); seen.set(i.id, i.sig); } }
  };
  diff("listing", rows.listings.map((l: any) => ({ id: l.id, sig: `${l.qty_available}|${l.status}`, event: { type: "listing", listingId: l.id, qtyAvailable: l.qty_available, status: l.status } as Pending })));
  diff("reservation", rows.reservations.map((r: any) => ({ id: r.id, sig: r.status, event: { type: "reservation", reservationId: r.id, status: r.status, customerId: r.customer_id, vendorId: r.vendor_id } as Pending })));
  diff("donation", rows.donations.map((d: any) => ({ id: d.id, sig: d.status, event: { type: "donation", batchId: d.id, status: d.status } as Pending })));
  if (!first && rows.impact !== s.impact) out.push({ type: "impact" } as Pending);
  s.impact = rows.impact;
  const committedAt = Date.now();
  for (const e of out) bus().emit("live", { ...e, committedAt } as LiveEvent);
}

/** Start watching (reference counted: call the returned function when the listener goes away). */
export function watchDatabase(intervalMs = 1000): () => void {
  const s = state();
  s.listeners++;
  if (!s.timer) {
    let busy = false;
    const tick = async () => { if (busy) return; busy = true; try { await pollOnce(); } catch (e) { console.error("live poll failed", (e as Error).message); } finally { busy = false; } };
    void tick();
    s.timer = setInterval(tick, intervalMs);
    s.timer.unref?.();
  }
  return () => {
    s.listeners = Math.max(0, s.listeners - 1);
    if (!s.listeners && s.timer) { clearInterval(s.timer); s.timer = undefined; s.impact = null; for (const m of Object.values(s.seen)) m.clear(); }
  };
}
