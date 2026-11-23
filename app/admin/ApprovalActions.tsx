"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";

export function ApprovalActions({ kind, id }: { kind: "vendor" | "ngo"; id: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const act = async (status: "Approved" | "Rejected") => {
    const reason = status === "Rejected" ? window.prompt("Rejection reason (shown to the applicant)") : undefined;
    if (status === "Rejected" && !reason) return;
    setBusy(true);
    try { await api("/api/admin/approve", { kind, id, status, reason }); router.refresh(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <span className="flex flex-col gap-1">
      <span className="flex gap-2">
        <button className="btn-primary !min-h-[40px] !py-2" disabled={busy} onClick={() => act("Approved")}>Approve</button>
        <button className="btn-outline !min-h-[40px] !py-2" disabled={busy} onClick={() => act("Rejected")}>Reject</button>
      </span>
      {err && <span role="alert" className="text-xs text-tomato">{err}</span>}
    </span>
  );
}
