import type { DB } from "./types";

const DAY = 24 * 3600_000;
const IST = 5.5 * 3600_000;
const istDate = (ms: number) => new Date(ms + IST).toISOString().slice(0, 10);
const istHour = (ms: number) => new Date(ms + IST).getUTCHours();
const t = (s: string) => Date.parse(s);

export type Range = 7 | 30 | 90;
export const parseRange = (v: string | null | undefined): Range => (v === "30" ? 30 : v === "90" ? 90 : 7);

/** Vendor analytics (FR-8.1). Pure over a DB snapshot so it is unit-testable. */
export function vendorAnalytics(db: DB, vendorId: string, range: Range, nowMs: number, outletIds?: string[]) {
  const okOutlet = (id?: string) => !outletIds || (!!id && outletIds.includes(id));
  const listingOutlet = (listingId?: string) => db.listings.find((l) => l.id === listingId)?.outletId;
  const from = nowMs - range * DAY;
  const inR = (iso?: string) => !!iso && t(iso) >= from && t(iso) <= nowMs;
  const picked = db.reservations.filter((r) => r.vendorId === vendorId && okOutlet(r.outletId) && r.status === "Picked up" && inR(r.pickedUpAt));
  const recovered = picked.reduce((s, r) => s + r.amount, 0);
  const sold = picked.reduce((s, r) => s + r.qty, 0);
  const donated = db.impact.filter((e) => e.vendorId === vendorId && okOutlet(listingOutlet(e.listingId)) && e.source === "ngo_collection" && inR(e.at)).reduce((s, e) => s + e.units, 0);
  // Expired = leftover units that were not collected or donated (written as `expired` impact events, incl. no-show units nobody claimed).
  const expired = db.impact.filter((e) => e.vendorId === vendorId && okOutlet(listingOutlet(e.listingId)) && e.source === "expired" && inR(e.at)).reduce((s, e) => s + e.units, 0);
  const ended = db.listings.filter((l) => l.vendorId === vendorId && okOutlet(l.outletId) && !l.donationOnly && l.status !== "Cancelled" && t(l.windowEnd) <= nowMs && t(l.windowEnd) >= from);
  const listed = ended.reduce((s, l) => s + l.qtyTotal, 0);
  const soldOnEnded = db.reservations.filter((r) => r.status === "Picked up" && ended.some((l) => l.id === r.listingId)).reduce((s, r) => s + r.qty, 0);
  const sellThroughPct = listed ? Math.round((soldOnEnded / listed) * 100) : 0;
  const v = db.vendors.find((x) => x.id === vendorId);

  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, units: 0 }));
  for (const r of picked) hours[istHour(t(r.pickedUpAt!))].units += r.qty;
  const bestHours = [...hours].filter((h) => h.units > 0).sort((a, b) => b.units - a.units).slice(0, 3);

  const days: { date: string; recovered: number }[] = [];
  for (let i = range - 1; i >= 0; i--) days.push({ date: istDate(nowMs - i * DAY), recovered: 0 });
  for (const r of picked) { const d = days.find((x) => x.date === istDate(t(r.pickedUpAt!))); if (d) d.recovered += r.amount; }

  return {
    range, recovered, unitsSold: sold, unitsDonated: donated, unitsExpired: expired, sellThroughPct,
    avgRating: v?.ratingAvg, ratingCount: v?.ratingCount ?? 0, hours, bestHours, days, orders: picked.length,
  };
}

/** Daily settlement list: online-paid, collected orders only. Fee comes from settings (default 10%). Pay-at-pickup cash is shown separately (never settled through us). */
export function vendorPayouts(db: DB, vendorId: string) {
  const bps = db.settings?.platformFeeBps ?? 1000;
  const byDay = new Map<string, { date: string; orders: number; units: number; gross: number; cash: number }>();
  for (const r of db.reservations) {
    if (r.vendorId !== vendorId || r.status !== "Picked up" || !r.pickedUpAt) continue;
    const p = db.payments.find((x) => x.reservationId === r.id);
    const d = istDate(t(r.pickedUpAt));
    const row = byDay.get(d) ?? { date: d, orders: 0, units: 0, gross: 0, cash: 0 };
    if (p?.status === "Test Payment Successful") { row.gross += r.amount; row.orders++; row.units += r.qty; }
    else if (p?.status === "Paid at Pickup") {
      row.cash += p.amount; // the cash the vendor actually collected
      if (r.creditApplied) { row.gross += r.creditApplied; row.orders++; row.units += r.qty; } // referral credit is platform-funded, so it settles through us
    }
    byDay.set(d, row);
  }
  const rows = [...byDay.values()].sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => {
    const fee = Math.round((r.gross * bps) / 10000);
    return { ...r, fee, net: r.gross - fee };
  });
  const totals = rows.reduce((s, r) => ({ gross: s.gross + r.gross, fee: s.fee + r.fee, net: s.net + r.net, cash: s.cash + r.cash }), { gross: 0, fee: 0, net: 0, cash: 0 });
  return { feePercent: bps / 100, rows, totals };
}
