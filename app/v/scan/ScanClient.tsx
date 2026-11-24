"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

type Result = { ref: string; qty: number; title: string; collectAmount: number; method: string };
type Html5QrcodeT = { start: (c: unknown, cfg: unknown, ok: (t: string) => void, err: () => void) => Promise<void>; stop: () => Promise<void> };

export function ScanClient() {
  const { t } = useT();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ ok: true; r: Result } | { ok: false; e: string } | null>(null);
  const [cam, setCam] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const scanner = useRef<Html5QrcodeT | null>(null);
  const lastToken = useRef<string>("");

  const submit = async (payload: { code?: string; token?: string }) => {
    setBusy(true);
    try {
      const r = await api<Result>("/api/vendor/handover", payload);
      setOut({ ok: true, r });
      setCode("");
    } catch (e) {
      setOut({ ok: false, e: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!cam) return;
    let stopped = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const s = new Html5Qrcode("qr-reader") as unknown as Html5QrcodeT;
        scanner.current = s;
        await s.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, (text) => {
          if (stopped || text === lastToken.current) return;
          lastToken.current = text;
          submit({ token: text });
        }, () => {});
      } catch (e) {
        setCamErr(t("scan.camUnavailable", { reason: (e as Error).message || t("scan.permDenied") }));
        setCam(false);
      }
    })();
    return () => { stopped = true; scanner.current?.stop().catch(() => {}); scanner.current = null; };
  }, [cam, t]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card flex flex-col gap-3 p-5">
        <h2 className="editorial text-2xl">{t("scan.scanQr")}</h2>
        <div id="qr-reader" className={`overflow-hidden rounded-xl bg-ink ${cam ? "min-h-[260px]" : "hidden"}`} />
        <button className={cam ? "btn-quiet" : "btn-primary !py-4"} onClick={() => { setCamErr(null); lastToken.current = ""; setCam(!cam); }}>
          {cam ? <><CameraOff size={18} aria-hidden="true" />{t("scan.stopCam")}</> : <><Camera size={18} aria-hidden="true" />{t("scan.startCam")}</>}
        </button>
        {camErr && <p role="alert" className="text-xs font-semibold text-tomato">{camErr}</p>}
      </div>
      <form className="card flex flex-col gap-3 p-5" onSubmit={(e) => { e.preventDefault(); submit({ code }); }}>
        <h2 className="editorial text-2xl">{t("scan.enterCode")}</h2>
        <input aria-label={t("scan.codeAria")} className="input text-center text-4xl font-bold tracking-[0.5em]" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
        <button className="btn-primary !py-4 text-base" disabled={busy || code.length !== 4}>{busy ? t("scan.checking") : t("scan.verify")}</button>
      </form>
      {out && (
        <div role={out.ok ? "status" : "alert"} className={`md:col-span-2 rounded-2xl p-5 ${out.ok ? "bg-[#E6F2E9] text-veg" : "bg-cream text-tomato"}`}>
          {out.ok ? (
            <>
              <p className="display text-3xl">{t("scan.verified", { ref: out.r.ref })}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{t("scan.handOver", { qty: out.r.qty, title: out.r.title })}</p>
              {out.r.collectAmount > 0 && <p className="mt-1 text-sm font-bold text-burgundy">{t("scan.collect", { amount: out.r.collectAmount })}</p>}
            </>
          ) : (
            <><p className="display text-2xl">{t("scan.notAccepted")}</p><p className="mt-1 text-sm font-semibold">{out.e}</p></>
          )}
        </div>
      )}
    </div>
  );
}
