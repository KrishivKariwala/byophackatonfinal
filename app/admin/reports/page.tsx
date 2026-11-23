import { Flag } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { reportsQueue } from "@/lib/admin";
import { StatusPill, fmtDateTime } from "@/components/bits";
import { S } from "@/lib/strings";
import { ReportActions } from "../AdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Reports" };

export default async function Reports() {
  await requirePage("admin");
  const list = reportsQueue();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div><h1 className="display text-4xl text-tomato">REPORTS &amp; DISPUTES</h1><p className="text-sm text-muted">Every action is logged with who did it and when.</p></div>
      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center"><Flag size={32} className="text-tomato" aria-hidden="true" /><h2 className="editorial text-2xl">No reports</h2><p className="text-sm text-muted">Customer reports appear here.</p></div>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((r) => (
            <li key={r.id} className="card flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{S.report.reasons[r.reason]} <span className="text-xs font-normal text-muted">· {r.targetType} · by {r.reporter} · {fmtDateTime(r.createdAt)}</span></p>
                <StatusPill status={r.status} />
              </div>
              <p className="text-sm text-muted">{[r.vendorName, r.listingTitle, r.reservationRef].filter(Boolean).join(" · ")}</p>
              {r.text && <p className="rounded-xl bg-canvas p-3 text-sm">{r.text}</p>}
              {r.photoUrl && (/* eslint-disable-next-line @next/next/no-img-element */
                <a href={r.photoUrl} target="_blank" rel="noreferrer"><img src={r.photoUrl} alt="Photo attached to the report" className="max-h-56 rounded-xl border border-line object-contain" /></a>)}
              {r.status === "Open" ? <ReportActions id={r.id} can={{ canHide: r.canHide, canSuspend: r.canSuspend, canRefund: r.canRefund }} /> : <p className="text-sm font-semibold text-muted">Resolved: {r.resolution}</p>}
              {r.log.length > 0 && (
                <details className="text-xs text-muted"><summary className="cursor-pointer font-semibold">Action log</summary>
                  <ol className="mt-1 flex flex-col gap-0.5">{r.log.map((l, i) => <li key={i}>{fmtDateTime(l.at)} · {l.who} · {l.action}{l.detail ? ` (${l.detail})` : ""}</li>)}</ol></details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
