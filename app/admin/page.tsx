import { requirePage } from "@/lib/guard";
import { read } from "@/lib/store";
import { impactSummary } from "@/lib/services";
import { StatusPill, fmtTime } from "@/components/bits";
import { ApprovalActions } from "./ApprovalActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "City impact" };

export default async function Admin() {
  await requirePage("admin");
  const s = impactSummary();
  const db = read();
  const queue = [
    ...db.vendors.filter((v) => v.status !== "Approved").map((v) => ({ kind: "vendor" as const, id: v.id, name: v.businessName, status: v.status, detail: `FSSAI ${v.fssaiNumber} · ${v.documents.join(", ") || "no documents"}`, reason: v.rejectionReason })),
    ...db.ngos.filter((n) => n.status !== "Approved").map((n) => ({ kind: "ngo" as const, id: n.id, name: n.orgName, status: n.status, detail: `Capacity ${n.capacityMeals} meals · ${n.registrationDocs.join(", ")}`, reason: n.rejectionReason })),
  ];
  const max = Math.max(1, ...s.byHood.map(([, v]) => v));
  const tiles: [string, number | string][] = [
    ["Customer pickup units", s.customerUnits], ["NGO collection units", s.ngoUnits], ["Active listings", s.activeListings],
    ["Completed customer pickups", s.completedPickups], ["Completed NGO collections", s.completedCollections], ["Approved vendors", s.approvedVendors], ["Approved NGOs", s.approvedNgos],
    ["kg food rescued (est.)", s.kgRescued], ["kg CO₂e avoided (est.)", s.co2eAvoidedKg], ["Units expired unsold", s.wastedUnits],
  ];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-burgundy">Bengaluru · admin</p>
          <h1 className="display text-4xl text-tomato sm:text-6xl">EVERY PLATE, COUNTED.</h1>
        </div>
        <span className="chip bg-peach text-burgundy">Demo data · 1 listed unit = 1 meal · counted at handover only</span>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_2fr]" aria-label="Impact counters">
        <div className="flex flex-col justify-between rounded-3xl bg-tomato p-6 text-white">
          <p className="text-sm font-semibold">Total meals rescued</p>
          <p className="display text-8xl leading-none" data-testid="total-rescued">{s.totalUnits}</p>
          <p className="text-xs opacity-90">Customer pickups + NGO collections that completed a verified handover. Reservations and listings are never counted.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map(([k, v]) => (
            <div key={k} className="card p-4"><p className="text-xs font-semibold text-muted">{k}</p><p className="display text-4xl text-tomato">{v}</p></div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="hood-h">
          <h2 id="hood-h" className="editorial mb-3 text-2xl">Rescued units by neighbourhood</h2>
          <ul className="flex flex-col gap-2">
            {s.byHood.map(([h, v]) => (
              <li key={h} className="grid grid-cols-[110px_1fr_44px] items-center gap-3 text-sm">
                <span>{h}</span>
                <span className="h-3 rounded-full bg-sand"><span className="block h-3 rounded-full bg-tomato" style={{ width: `${(v / max) * 100}%` }} /></span>
                <b className="text-right">{v}</b>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5" aria-labelledby="act-h">
          <h2 id="act-h" className="editorial mb-3 text-2xl">Recent activity</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {s.recent.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 border-b border-line/60 pb-2">
                <span>{e.source === "customer_pickup" ? `Customer pickup at ${e.vendor}` : `${e.ngo ?? "NGO"} collected from ${e.vendor}`} · {e.units} units</span>
                <span className="shrink-0 text-xs text-muted">{fmtTime(e.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-5" aria-labelledby="q-h">
        <h2 id="q-h" className="editorial mb-1 text-2xl">Applications</h2>
        <p className="mb-3 text-xs text-muted">Approve or reject vendors and NGOs. Every decision is audit-logged. Demo approvals are not regulatory approvals.</p>
        {queue.length === 0 ? <p className="text-sm text-muted">Queue is empty.</p> : (
          <ul className="flex flex-col gap-3">
            {queue.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-canvas p-3">
                <div className="min-w-[220px] flex-1">
                  <p className="font-bold">{q.name} <span className="text-xs font-semibold uppercase text-muted">· {q.kind}</span></p>
                  <p className="text-xs text-muted">{q.detail}{q.reason ? ` · Rejected: ${q.reason}` : ""}</p>
                </div>
                <StatusPill status={q.status} />
                <ApprovalActions kind={q.kind} id={q.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
