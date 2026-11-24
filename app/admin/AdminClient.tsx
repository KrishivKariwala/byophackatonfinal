"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Eye } from "lucide-react";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

const isUpload = (d: string) => d.startsWith("/api/uploads/");
const isPdf = (d: string) => d.toLowerCase().endsWith(".pdf");

/** Document viewer: uploaded images/PDFs open inline; legacy demo entries are file names only. */
export function DocViewer({ docs }: { docs: string[] }) {
  const { t } = useT();
  const [open, setOpen] = useState<string | null>(null);
  if (docs.length === 0) return <p className="text-xs font-semibold text-tomato">{t("admin.noDocsAttached")}</p>;
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2">
        {docs.map((d, i) => {
          const label = isUpload(d) ? t(isPdf(d) ? "admin.docPdf" : "admin.docN", { n: i + 1 }) : d;
          return (
            <li key={d + i}>
              {isUpload(d) ? (
                <button type="button" onClick={() => setOpen(open === d ? null : d)} aria-expanded={open === d} className="btn-quiet !min-h-[44px] !py-2"><Eye size={16} aria-hidden="true" />{label}</button>
              ) : (
                <span className="chip bg-sand text-muted" title={t("admin.demoRecord")}><FileText size={14} aria-hidden="true" />{label}</span>
              )}
            </li>
          );
        })}
      </ul>
      {open && (isPdf(open)
        ? <iframe title={t("admin.docPreview")} src={open} className="h-96 w-full rounded-xl border border-line" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img alt={t("admin.docAlt")} src={open} className="max-h-96 w-auto rounded-xl border border-line object-contain" />)}
    </div>
  );
}

export function DecideButtons({ k }: { k: string }) {
  const router = useRouter();
  const { t } = useT();
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
          <button className="btn-primary !min-h-[44px]" disabled={busy} onClick={() => decide("Approved")}>{t("admin.approve")}</button>
          <button className="btn-outline !min-h-[44px]" disabled={busy} onClick={() => setRejecting(true)}>{t("admin.rejectEllipsis")}</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="label">{t("admin.rejectReason")}
            <textarea className="input min-h-16" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <div className="flex gap-2">
            <button className="btn-primary !min-h-[44px]" disabled={busy || reason.trim().length < 3} onClick={() => decide("Rejected")}>{t("admin.confirmReject")}</button>
            <button className="btn-quiet !min-h-[44px]" onClick={() => setRejecting(false)}>{t("common.back")}</button>
          </div>
        </div>
      )}
      {err && <span role="alert" className="text-xs font-semibold text-tomato">{err}</span>}
    </div>
  );
}

// `label` is the catalog key of the button text; `id` is what the API receives.
const ACTIONS: { id: string; label: string; needs?: "canHide" | "canSuspend" | "canRefund"; danger?: boolean }[] = [
  { id: "dismiss", label: "admin.act.dismiss" },
  { id: "warn", label: "admin.act.warn", needs: "canSuspend" },
  { id: "hide_listing", label: "admin.act.hide_listing", needs: "canHide" },
  { id: "suspend_account", label: "admin.act.suspend_account", needs: "canSuspend", danger: true },
  { id: "refund_order", label: "admin.act.refund_order", needs: "canRefund" },
];

export function ReportActions({ id, can }: { id: string; can: { canHide: boolean; canSuspend: boolean; canRefund: boolean } }) {
  const router = useRouter();
  const { t } = useT();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const act = async (action: string, label: string) => {
    if (action !== "dismiss" && action !== "warn" && !window.confirm(t("admin.actConfirm", { action: label }))) return;
    setBusy(true); setErr(null);
    try { await api(`/api/admin/reports/${id}/action`, { action, note }); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-2">
      <label className="label">{t("admin.noteLabel")}
        <input className="input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.filter((a) => !a.needs || can[a.needs]).map((a) => (
          <button key={a.id} disabled={busy} onClick={() => act(a.id, t(a.label))} className={`btn !min-h-[44px] ${a.danger ? "bg-tomato text-white" : a.id === "dismiss" ? "btn-quiet" : "btn-outline"}`}>{t(a.label)}</button>
        ))}
      </div>
      {err && <span role="alert" className="text-xs font-semibold text-tomato">{err}</span>}
    </div>
  );
}
