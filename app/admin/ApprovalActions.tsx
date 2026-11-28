"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

export function ApprovalActions({ kind, id }: { kind: "vendor" | "ngo"; id: string }) {
  const router = useRouter();
  const { t } = useT();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const act = async (status: "Approved" | "Rejected") => {
    const reason = status === "Rejected" ? window.prompt(t("admin.rejectPrompt")) : undefined;
    if (status === "Rejected" && !reason) return;
    setBusy(true);
    try { await api("/api/admin/approve", { kind, id, status, reason }); router.refresh(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <span className="flex flex-col gap-1">
      <span className="flex gap-2">
        <button className="btn-primary !min-h-[44px] !py-2" disabled={busy} onClick={() => act("Approved")}>{t("admin.approve")}</button>
        <button className="btn-outline !min-h-[44px] !py-2" disabled={busy} onClick={() => act("Rejected")}>{t("admin.reject")}</button>
      </span>
      {err && <span role="alert" className="text-xs text-tomato">{err}</span>}
    </span>
  );
}
