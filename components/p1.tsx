"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Star, Heart, Gift } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";

export function VerifiedBadge({ label }: { label?: string }) {
  const { t } = useT();
  return (
    <span className="chip bg-[#E6F2E9] text-veg !px-2 !py-0.5 text-[11px]" title={t("p1.verifiedTip")}>
      <BadgeCheck size={13} aria-hidden="true" />{label ?? t("p1.verified")}
    </span>
  );
}

export function SurpriseBadge({ worth }: { worth?: number }) {
  const { t } = useT();
  return (
    <span className="chip bg-peach text-burgundy !py-0.5 text-[11px]">
      <Gift size={13} aria-hidden="true" />{t("p1.surprise.badge")}{worth ? ` · ${t("p1.surprise.worth", { amount: worth })}` : ""}
    </span>
  );
}

export function Rating({ avg, count }: { avg?: number; count?: number }) {
  const { t } = useT();
  if (!count || avg === undefined) return <span className="text-xs text-muted">{t("p1.ratingNone")}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-burgundy" aria-label={t("p1.rated", { avg: avg.toFixed(1), n: count })}>
      <Star size={13} className="fill-tomato text-tomato" aria-hidden="true" />{avg.toFixed(1)} <span className="font-normal text-muted">({count})</span>
    </span>
  );
}

export function FollowButton({ vendorId, initial, lat, lng }: { vendorId: string; initial: boolean; lat?: number; lng?: number }) {
  const router = useRouter();
  const { t } = useT();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toggle = async () => {
    setBusy(true); setErr(null);
    try {
      await api("/api/follows", on ? { vendorId } : { vendorId, lat, lng }, on ? "DELETE" : "POST");
      setOn(!on); router.refresh();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" onClick={toggle} disabled={busy} aria-pressed={on}
        aria-label={on ? t("follow.unfollowAria") : t("follow.followAria")}
        className={`btn ${on ? "border-2 border-tomato bg-white text-tomato" : "bg-tomato text-white"} !py-2`}>
        <Heart size={16} className={on ? "fill-tomato" : ""} aria-hidden="true" />{on ? t("follow.following") : t("follow.follow")}
      </button>
      {err && <span role="alert" className="text-xs font-semibold text-tomato">{err}</span>}
    </span>
  );
}

export function CancelOrder({ reservationId, free, refund, freeUntil, minutes = 30 }: { reservationId: string; free: boolean; refund: number; freeUntil: string; minutes?: number }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const go = async () => {
    if (!window.confirm(free ? (refund ? t("cancel.confirmFreeRefund", { amount: refund }) : t("cancel.confirmFreeNone")) : t("cancel.confirmLate", { minutes }))) return;
    setBusy(true); setErr(null);
    try { await api(`/api/reservations/${reservationId}/cancel`); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted">{free ? t("cancel.freeUntil", { time: freeUntil }) : t("cancel.late")}</p>
      <button type="button" onClick={go} disabled={busy} className="btn-quiet !border-tomato !text-tomato" aria-label={free ? t("cancel.ariaFree") : t("cancel.ariaLate")}>
        {busy ? t("cancel.cancelling") : t("cancel.button")}
      </button>
      {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
    </div>
  );
}

export function ReviewForm({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const { t } = useT();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const submit = async () => {
    setBusy(true); setErr(null);
    try { await api("/api/reviews", { reservationId, rating, text }); setDone(true); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  if (done) return <p role="status" className="rounded-xl bg-[#E6F2E9] p-3 text-sm font-semibold text-veg">{t("review.thanks")}</p>;
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div><h2 className="editorial text-2xl">{t("review.title")}</h2><p className="text-xs text-muted">{t("review.hint")}</p></div>
      <div role="radiogroup" aria-label={t("review.rating")} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={t("review.stars", { n })} onClick={() => setRating(n)}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream">
            <Star size={26} className={n <= rating ? "fill-tomato text-tomato" : "text-line"} aria-hidden="true" />
          </button>
        ))}
      </div>
      <label className="label">{t("review.textLabel")}
        <textarea className="input min-h-20" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button type="button" className="btn-primary" disabled={busy || rating === 0} onClick={submit}>{busy ? t("common.sending") : t("review.submit")}</button>
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
    </div>
  );
}

const REPORT_REASONS = ["food_safety", "wrong_item", "rude_behaviour", "other"] as const;

export function ReportButton({ targetType, targetId }: { targetType: "reservation" | "listing" | "vendor"; targetId: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("food_safety");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.set("targetType", targetType); fd.set("targetId", targetId); fd.set("reason", reason); fd.set("text", text);
      if (file) fd.set("photo", file);
      const res = await fetch("/api/reports", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({ ok: false, error: t("common.error") }));
      if (!j.ok) throw new Error(j.error);
      setSent(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  if (sent) return <p role="status" className="text-sm font-semibold text-veg">{t("report.sent")}</p>;
  if (!open) return <button type="button" className="text-sm font-semibold text-muted underline" onClick={() => setOpen(true)}>{t("report.button")}</button>;
  return (
    <div className="card flex flex-col gap-3 p-4" role="group" aria-label={t("report.title")}>
      <h2 className="editorial text-xl">{t("report.title")}</h2>
      <label className="label">{t("report.reason")}
        <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REPORT_REASONS.map((k) => <option key={k} value={k}>{t(`report.reason.${k}`)}</option>)}
        </select>
      </label>
      <label className="label">{t("report.details")}<textarea className="input min-h-20" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <label className="label">{t("report.photo")}<input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <div className="flex gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={submit}>{busy ? t("common.sending") : t("report.submit")}</button>
        <button type="button" className="btn-quiet" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
      </div>
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
    </div>
  );
}

export function RepostButton({ templateId, title }: { templateId: string; title: string }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const go = async () => {
    if (!window.confirm(t("p1.repostConfirm", { title }))) return;
    setBusy(true); setMsg(null);
    try { await api(`/api/vendor/templates/${templateId}/repost`, { declaration: true }); setMsg({ ok: true, text: t("p1.live") }); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" className="btn-primary !min-h-[44px] !py-2" disabled={busy} onClick={go} aria-label={t("p1.repostAria", { title })}>{busy ? t("p1.posting") : t("p1.repost")}</button>
      {msg && <span role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</span>}
    </span>
  );
}

export function VendorSettings({ payAtPickup, maxUnits, defaultCap, outletId, canSetCap = true }: { payAtPickup: boolean; maxUnits?: number; defaultCap: number; outletId?: string; canSetCap?: boolean }) {
  const router = useRouter();
  const { t } = useT();
  const [pap, setPap] = useState(payAtPickup);
  const [cap, setCap] = useState(String(maxUnits ?? defaultCap));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async () => {
    setBusy(true); setMsg(null);
    try { await api("/api/vendor/settings", { payAtPickup: pap, outletId, ...(canSetCap ? { maxUnitsPerOrder: Number(cap) <= defaultCap ? null : Number(cap) } : {}) }); setMsg({ ok: true, text: t("common.saved") }); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };
  return (
    <div className="card flex flex-col gap-3 p-4 text-sm">
      <label className="flex items-start gap-3 font-semibold"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-tomato" checked={pap} onChange={(e) => setPap(e.target.checked)} /><span>{t("p1.allowPap")}<span className="block text-xs font-normal text-muted">{t("p1.allowPapHelp")}</span></span></label>
      {canSetCap && <label className="label">{t("p1.maxUnits", { def: defaultCap })}<input className="input w-28" inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, ""))} /></label>}
      <div className="flex items-center gap-3"><button type="button" className="btn-primary" disabled={busy} onClick={save}>{busy ? t("common.saving") : t("p1.saveSettings")}</button>
        {msg && <span role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</span>}</div>
    </div>
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

export function ScheduleForm({ batchId, serverNow, collectBy, initial }: { batchId: string; serverNow: number; collectBy: string; initial?: { slot?: string; name?: string; phone?: string; url?: string } }) {
  const router = useRouter();
  const { t } = useT();
  const drift = serverNow - Date.now();
  const [slot, setSlot] = useState(() => toLocalInput(initial?.slot ? Date.parse(initial.slot) : Math.min(Date.parse(collectBy) - 5 * 60_000, serverNow + 30 * 60_000)));
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [url, setUrl] = useState(initial?.url ?? "");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const d = await api<{ url: string }>(`/api/donations/${batchId}/schedule`, { slot: new Date(slot).toISOString(), volunteerName: name, volunteerPhone: phone });
      setUrl(d.url); setMsg({ ok: true, text: t("p1.scheduled") }); router.refresh();
    } catch (er) { setMsg({ ok: false, text: (er as Error).message }); } finally { setBusy(false); }
  };
  const full = typeof window !== "undefined" && url ? `${window.location.origin}${url}` : url;
  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded-xl bg-canvas p-3">
      <p className="eyebrow text-burgundy">{t("p1.pickupVolunteer")}</p>
      <label className="label">{t("p1.pickupTime")}<input type="datetime-local" required className="input" value={slot} min={toLocalInput(serverNow - drift)} max={toLocalInput(Date.parse(collectBy) - drift)} onChange={(e) => setSlot(e.target.value)} /></label>
      <label className="label">{t("p1.volName")}<input required className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="label">{t("p1.volPhone")}<input required className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      <button className="btn-primary" disabled={busy}>{busy ? t("common.saving") : initial?.name ? t("p1.updatePickup") : t("p1.schedulePickup")}</button>
      {msg && <span role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</span>}
      {full && (
        <label className="label">{t("p1.volLink")}
          <input readOnly className="input text-xs" value={full} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}
    </form>
  );
}
