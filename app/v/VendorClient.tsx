"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

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
