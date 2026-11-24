"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

export function CancelListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { t } = useT();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <span className="inline-flex flex-col">
      <button
        className="btn !min-h-[40px] !py-2 border border-tomato text-tomato hover:bg-cream"
        disabled={busy}
        onClick={async () => {
          const reason = window.prompt(t("vdash.cancelPrompt"));
          if (!reason) return;
          setBusy(true);
          try {
            const r = await api<{ refunds: number }>(`/api/vendor/listings/${listingId}`, { action: "cancel", reason });
            setErr(t("vdash.cancelled", { n: r.refunds }));
            router.refresh();
          } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
        }}
      >
        {t("common.cancel")}
      </button>
      {err && <span role="status" className="text-[11px] font-semibold text-tomato">{err}</span>}
    </span>
  );
}

export function DonationVerify({ batchId }: { batchId: string }) {
  const router = useRouter();
  const { t } = useT();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await api(`/api/vendor/donations/${batchId}/handover`, { code });
          setMsg({ ok: true, t: t("vdash.handoverOk") });
          router.refresh();
        } catch (er) { setMsg({ ok: false, t: (er as Error).message }); }
      }}
    >
      <label className="label">{t("vdash.ngoCode")}
        <input className="input tracking-[0.3em]" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
      </label>
      <button className="btn-primary" disabled={code.length !== 4}>{t("vdash.verifyHandover")}</button>
      {msg && <span role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.t}</span>}
    </form>
  );
}
