"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Eye } from "lucide-react";
import { api } from "@/components/client";

const isUpload = (d: string) => d.startsWith("/api/uploads/");
const isPdf = (d: string) => d.toLowerCase().endsWith(".pdf");

/** Document viewer: uploaded images/PDFs open inline; legacy demo entries are file names only. */
export function DocViewer({ docs }: { docs: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (docs.length === 0) return <p className="text-xs font-semibold text-tomato">No documents attached.</p>;
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2">
        {docs.map((d, i) => {
          const label = isUpload(d) ? `Document ${i + 1}${isPdf(d) ? " (PDF)" : ""}` : d;
          return (
            <li key={d + i}>
              {isUpload(d) ? (
                <button type="button" onClick={() => setOpen(open === d ? null : d)} aria-expanded={open === d} className="btn-quiet !min-h-[44px] !py-2"><Eye size={16} aria-hidden="true" />{label}</button>
              ) : (
                <span className="chip bg-sand text-muted" title="Demo record: file name only"><FileText size={14} aria-hidden="true" />{label}</span>
              )}
            </li>
          );
        })}
      </ul>
      {open && (isPdf(open)
        ? <iframe title="Document preview" src={open} className="h-96 w-full rounded-xl border border-line" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img alt="Uploaded document" src={open} className="max-h-96 w-auto rounded-xl border border-line object-contain" />)}
    </div>
  );
}

export function DecideButtons({ k }: { k: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const decide = async (decision: "Approved" | "Rejected") => {
    setBusy(true); setErr(null);
    try { await api(`/api/admin/approvals/${encodeURIComponent(k)}/decide`, { decision, reason }); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-2">
      {!rejecting ? (
        <div className="flex gap-2">
          <button className="btn-primary !min-h-[44px]" disabled={busy} onClick={() => decide("Approved")}>Approve</button>
          <button className="btn-outline !min-h-[44px]" disabled={busy} onClick={() => setRejecting(true)}>Reject…</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="label">Rejection reason (required, shown to the applicant)
            <textarea className="input min-h-16" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <div className="flex gap-2">
            <button className="btn-primary !min-h-[44px]" disabled={busy || reason.trim().length < 3} onClick={() => decide("Rejected")}>Confirm rejection</button>
            <button className="btn-quiet !min-h-[44px]" onClick={() => setRejecting(false)}>Back</button>
          </div>
        </div>
      )}
      {err && <span role="alert" className="text-xs font-semibold text-tomato">{err}</span>}
    </div>
  );
}

const ACTIONS: { id: string; label: string; needs?: "canHide" | "canSuspend" | "canRefund"; danger?: boolean }[] = [
  { id: "dismiss", label: "Dismiss" },
  { id: "warn", label: "Warn vendor", needs: "canSuspend" },
  { id: "hide_listing", label: "Hide listing", needs: "canHide" },
  { id: "suspend_account", label: "Suspend account", needs: "canSuspend", danger: true },
  { id: "refund_order", label: "Refund order", needs: "canRefund" },
];

export function ReportActions({ id, can }: { id: string; can: { canHide: boolean; canSuspend: boolean; canRefund: boolean } }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const act = async (action: string, label: string) => {
    if (action !== "dismiss" && action !== "warn" && !window.confirm(`${label}? This is logged with your name.`)) return;
    setBusy(true); setErr(null);
    try { await api(`/api/admin/reports/${id}/action`, { action, note }); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-2">
      <label className="label">Note (optional, goes in the log and to the vendor/reporter)
        <input className="input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.filter((a) => !a.needs || can[a.needs]).map((a) => (
          <button key={a.id} disabled={busy} onClick={() => act(a.id, a.label)} className={`btn !min-h-[44px] ${a.danger ? "bg-tomato text-white" : a.id === "dismiss" ? "btn-quiet" : "btn-outline"}`}>{a.label}</button>
        ))}
      </div>
      {err && <span role="alert" className="text-xs font-semibold text-tomato">{err}</span>}
    </div>
  );
}
