"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, MapPin, Navigation } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";
import { ledgerNote } from "@/lib/p2/ledger-note";

// ------------------------------------------------------------------ referrals and credit
export interface ReferralData {
  code: string; rewardInr: number; maxPct: number; balance: number; nextExpiry?: string; nextExpiryAmount?: number;
  rewardedThisMonth: number; monthlyCap: number; referredBy: { status: string } | null;
  referrals: { id: string; name: string; status: "pending" | "rewarded" | "rejected"; createdAt: string; rewardedAt?: string }[];
  ledger: { id: string; type: "earned" | "spent" | "expired"; amount: number; note?: string; createdAt: string; expiresAt?: string }[];
  canRedeem: boolean;
}

export function ReferralClient({ data }: { data: ReferralData }) {
  const router = useRouter();
  const { t, fmt } = useT();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/signin?role=customer&ref=${data.code}`;

  const redeem = async () => {
    setBusy(true); setMsg(null);
    try { await api("/api/referrals/redeem", { code }); setMsg({ ok: true, text: t("ref.applied", { amount: fmt.inr(data.rewardInr) }) }); setCode(""); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-3 sm:grid-cols-2" aria-label={t("credit.balance")}>
        <div className="flex flex-col gap-1 rounded-3xl bg-tomato p-5 text-white">
          <p className="text-sm font-semibold">{t("credit.balance")}</p>
          <p className="display text-6xl leading-none" data-testid="credit-balance">{fmt.inr(data.balance)}</p>
          <p className="text-xs opacity-90">{data.balance > 0 && data.nextExpiry && data.nextExpiryAmount ? t("credit.expires", { amount: fmt.inr(data.nextExpiryAmount), date: fmt.date(data.nextExpiry) }) : t("credit.noCredit")}</p>
          <p className="mt-2 text-[11px] opacity-90">{t("credit.notCash", { pct: data.maxPct })}</p>
        </div>
        <div className="card flex flex-col gap-2 p-5">
          <p className="label">{t("ref.yourCode")}</p>
          <p className="display text-4xl tracking-widest text-tomato" aria-label={data.code.split("").join(" ")}>{data.code}</p>
          <p className="text-xs text-muted">{t("ref.how", { amount: fmt.inr(data.rewardInr), cap: data.monthlyCap })}</p>
          <p className="text-xs font-semibold text-burgundy">{t("ref.thisMonth", { n: data.rewardedThisMonth, cap: data.monthlyCap })}</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded bg-canvas px-2 py-1 text-[11px]">{link}</code>
            <button type="button" className="btn-primary !min-h-[44px]" onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true)).catch(() => {})}>
              <Copy size={14} aria-hidden="true" />{copied ? t("common.copied") : t("ref.copyLink")}
            </button>
          </div>
        </div>
      </section>

      {data.canRedeem && (
        <section className="card flex flex-col gap-2 p-5" aria-labelledby="redeem-h">
          <h2 id="redeem-h" className="editorial text-2xl">{t("ref.haveCode")}</h2>
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (!busy && code.trim()) redeem(); }}>
            <label className="label">{t("ref.enter")}<input className="input !w-48 uppercase tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} maxLength={16} autoComplete="off" /></label>
            <button className="btn-primary !min-h-[44px]" disabled={busy || !code.trim()}>{t("ref.apply")}</button>
          </form>
          {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</p>}
        </section>
      )}
      {data.referredBy && <p role="status" className="rounded-xl bg-cream p-3 text-sm font-semibold text-burgundy">{t("ref.referredBy")} · {t(`ref.status.${data.referredBy.status}`)}</p>}

      <section className="card p-5" aria-labelledby="friends-h">
        <h2 id="friends-h" className="editorial mb-2 text-2xl">{t("ref.friends")}</h2>
        {data.referrals.length === 0 ? <p className="text-sm text-muted">{t("ref.none")}</p> : (
          <ul className="divide-y divide-line">{data.referrals.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm"><b>{r.name}</b><span className={`chip ${r.status === "rewarded" ? "bg-veg text-white" : r.status === "rejected" ? "bg-sand text-muted" : "bg-peach text-burgundy"}`}>{t(`ref.status.${r.status}`)}</span></li>
          ))}</ul>
        )}
      </section>

      <section className="card p-5" aria-labelledby="ledger-h">
        <h2 id="ledger-h" className="editorial mb-2 text-2xl">{t("ref.ledger")}</h2>
        {data.ledger.length === 0 ? <p className="text-sm text-muted">{t("common.empty")}</p> : (
          <ul className="divide-y divide-line">{data.ledger.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div><b>{t(`ref.ledger.${e.type}`)}</b><p className="text-xs text-muted">{(() => { const n = ledgerNote(e.note); return n ? t(n.key, n.vars) : e.note ?? ""; })()} · {fmt.date(e.createdAt)}</p></div>
              <b className={e.type === "earned" ? "text-veg" : "text-tomato"}>{e.type === "earned" ? "+" : "−"}{fmt.inr(e.amount)}</b>
            </li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ live ETA ("I'm on my way")
const SPEED_KMH = 18; // urban average for the on-device estimate
const EARTH_KM = 6371;
const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
};

/**
 * Foreground only: the position is read while this page is visible and is turned into minutes ON THIS DEVICE.
 * Only `{ etaMinutes }` is sent. Switching tabs / locking the phone stops updates; "Stop sharing" clears the ETA.
 */
export function EtaButton({ reservationId, outlet, initialMinutes, canStart }: { reservationId: string; outlet: { lat: number; lng: number }; initialMinutes?: number; canStart: boolean }) {
  const { t } = useT();
  const [minutes, setMinutes] = useState<number | undefined>(initialMinutes);
  const [live, setLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const watch = useRef<number | null>(null);
  const lastSent = useRef(0);

  const send = useCallback(async (n: number) => {
    setErr(null);
    try { await api(`/api/reservations/${reservationId}/eta`, { etaMinutes: n }); setMinutes(n); }
    catch (e) { setErr((e as Error).message); }
  }, [reservationId]);

  const stopWatch = useCallback(() => { if (watch.current !== null) { navigator.geolocation.clearWatch(watch.current); watch.current = null; } setLive(false); }, []);

  const startWatch = () => {
    if (!("geolocation" in navigator)) { setDenied(true); return; }
    setDenied(false);
    setLive(true);
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (document.visibilityState !== "visible") return;
        const now = Date.now();
        if (now - lastSent.current < 30_000) return; // at most one update every 30 s
        lastSent.current = now;
        const d = km({ lat: pos.coords.latitude, lng: pos.coords.longitude }, outlet); // computed here, never sent
        send(Math.min(240, Math.max(0, Math.ceil((d / SPEED_KMH) * 60))));
      },
      () => { setDenied(true); stopWatch(); },
      { enableHighAccuracy: false, maximumAge: 15_000, timeout: 20_000 },
    );
  };

  // Foreground only: stop watching the moment the page is hidden or closed.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState !== "visible") stopWatch(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); stopWatch(); };
  }, [stopWatch]);

  const stop = async () => { stopWatch(); try { await api(`/api/reservations/${reservationId}/eta`, undefined, "DELETE"); setMinutes(undefined); } catch (e) { setErr((e as Error).message); } };

  if (!canStart && minutes === undefined) return <p className="card p-4 text-xs text-muted">{t("eta.notYet")}</p>;
  return (
    <section className="card flex flex-col gap-3 p-4" aria-labelledby="eta-h">
      <div>
        <h2 id="eta-h" className="editorial flex items-center gap-2 text-2xl"><Navigation size={20} aria-hidden="true" />{t("eta.title")}</h2>
        <p className="text-xs text-muted">{t("eta.help")}</p>
      </div>
      {minutes !== undefined && (
        <p role="status" className="rounded-xl bg-cream p-3 text-sm font-bold text-burgundy">{minutes <= 1 ? t("eta.arriving") : t("eta.sharing", { n: minutes })}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {!live && <button type="button" className="btn-primary !min-h-[44px]" onClick={startWatch}><MapPin size={16} aria-hidden="true" />{t("eta.useLocation")}</button>}
        {minutes !== undefined && <button type="button" className="btn-quiet !min-h-[44px]" onClick={stop}>{t("eta.stop")}</button>}
      </div>
      <fieldset>
        <legend className="label mb-1">{t("eta.manual")}</legend>
        <div className="flex flex-wrap gap-2">{[5, 10, 15, 20, 30].map((n) => (
          <button key={n} type="button" aria-pressed={minutes === n} className={`chip min-h-[44px] min-w-[44px] justify-center border-2 ${minutes === n ? "border-tomato bg-tomato text-white" : "border-line bg-white text-burgundy"}`} onClick={() => send(n)}>{t("eta.minutes", { n })}</button>
        ))}</div>
      </fieldset>
      <p className="text-[11px] text-muted">{t("eta.privacy")}</p>
      {denied && <p role="status" className="text-xs font-semibold text-burgundy">{t("eta.denied")}</p>}
      {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
    </section>
  );
}
