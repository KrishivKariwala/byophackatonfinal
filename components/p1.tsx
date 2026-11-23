"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Star, Heart, Gift } from "lucide-react";
import { api } from "./client";
import { S } from "@/lib/strings";

export function VerifiedBadge({ label = S.verified.badge }: { label?: string }) {
  return (
    <span className="chip bg-[#E6F2E9] text-veg !px-2 !py-0.5 text-[11px]" title={S.verified.tip}>
      <BadgeCheck size={13} aria-hidden="true" />{label}
    </span>
  );
}

export function SurpriseBadge({ worth }: { worth?: number }) {
  return (
    <span className="chip bg-peach text-burgundy !py-0.5 text-[11px]">
      <Gift size={13} aria-hidden="true" />{S.surprise.badge}{worth ? ` · ${S.surprise.worth(worth)}` : ""}
    </span>
  );
}

export function Rating({ avg, count }: { avg?: number; count?: number }) {
  if (!count || avg === undefined) return <span className="text-xs text-muted">{S.rating.none}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-burgundy" aria-label={`Rated ${avg.toFixed(1)} out of 5 from ${count} ratings`}>
      <Star size={13} className="fill-tomato text-tomato" aria-hidden="true" />{avg.toFixed(1)} <span className="font-normal text-muted">({count})</span>
    </span>
  );
}

export function FollowButton({ vendorId, initial, lat, lng }: { vendorId: string; initial: boolean; lat?: number; lng?: number }) {
  const router = useRouter();
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
        aria-label={on ? `${S.follow.unfollow} this restaurant` : `${S.follow.follow} this restaurant`}
        className={`btn ${on ? "border-2 border-tomato bg-white text-tomato" : "bg-tomato text-white"} !py-2`}>
        <Heart size={16} className={on ? "fill-tomato" : ""} aria-hidden="true" />{on ? S.follow.following : S.follow.follow}
      </button>
      {err && <span role="alert" className="text-xs font-semibold text-tomato">{err}</span>}
    </span>
  );
}

export function CancelOrder({ reservationId, free, refund, freeUntil }: { reservationId: string; free: boolean; refund: number; freeUntil: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const go = async () => {
    if (!window.confirm(free ? S.cancel.confirmFree(refund) : S.cancel.confirmLate)) return;
    setBusy(true); setErr(null);
    try { await api(`/api/reservations/${reservationId}/cancel`); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted">{free ? S.cancel.freeUntil(freeUntil) : S.cancel.late}</p>
      <button type="button" onClick={go} disabled={busy} className="btn-quiet !border-tomato !text-tomato" aria-label={`${S.cancel.button} (${free ? "free" : "not refunded"})`}>
        {busy ? "Cancelling…" : S.cancel.button}
      </button>
      {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
    </div>
  );
}

export function ReviewForm({ reservationId }: { reservationId: string }) {
  const router = useRouter();
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
  if (done) return <p role="status" className="rounded-xl bg-[#E6F2E9] p-3 text-sm font-semibold text-veg">{S.review.thanks}</p>;
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div><h2 className="editorial text-2xl">{S.review.title}</h2><p className="text-xs text-muted">{S.review.hint}</p></div>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={S.review.stars(n)} onClick={() => setRating(n)}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream">
            <Star size={26} className={n <= rating ? "fill-tomato text-tomato" : "text-line"} aria-hidden="true" />
          </button>
        ))}
      </div>
      <label className="label">{S.review.textLabel}
        <textarea className="input min-h-20" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button type="button" className="btn-primary" disabled={busy || rating === 0} onClick={submit}>{busy ? "Sending…" : S.review.submit}</button>
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
    </div>
  );
}

export function ReportButton({ targetType, targetId }: { targetType: "reservation" | "listing" | "vendor"; targetId: string }) {
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
      const j = await res.json().catch(() => ({ ok: false, error: S.states.error }));
      if (!j.ok) throw new Error(j.error);
      setSent(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  if (sent) return <p role="status" className="text-sm font-semibold text-veg">{S.report.sent}</p>;
  if (!open) return <button type="button" className="text-sm font-semibold text-muted underline" onClick={() => setOpen(true)}>{S.report.button}</button>;
  return (
    <div className="card flex flex-col gap-3 p-4" role="group" aria-label={S.report.title}>
      <h2 className="editorial text-xl">{S.report.title}</h2>
      <label className="label">Reason
        <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
          {Object.entries(S.report.reasons).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="label">{S.report.details}<textarea className="input min-h-20" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <label className="label">{S.report.photo}<input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <div className="flex gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={submit}>{busy ? "Sending…" : S.report.submit}</button>
        <button type="button" className="btn-quiet" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
    </div>
  );
}

export function RepostButton({ templateId, title }: { templateId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const go = async () => {
    if (!window.confirm(`Repost "${title}" with fresh pickup times?\n\nBy continuing you confirm the food-safety declaration: this food was prepared and stored hygienically and is fit to eat within the stated time.`)) return;
    setBusy(true); setMsg(null);
    try { await api(`/api/vendor/templates/${templateId}/repost`, { declaration: true }); setMsg({ ok: true, text: "Live!" }); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" className="btn-primary !min-h-[44px] !py-2" disabled={busy} onClick={go} aria-label={`Repost ${title} with fresh pickup times`}>{busy ? "Posting…" : "Repost"}</button>
      {msg && <span role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</span>}
    </span>
  );
}

export function VendorSettings({ payAtPickup, maxUnits, defaultCap }: { payAtPickup: boolean; maxUnits?: number; defaultCap: number }) {
  const router = useRouter();
  const [pap, setPap] = useState(payAtPickup);
  const [cap, setCap] = useState(String(maxUnits ?? defaultCap));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async () => {
    setBusy(true); setMsg(null);
    try { await api("/api/vendor/settings", { payAtPickup: pap, maxUnitsPerOrder: Number(cap) <= defaultCap ? null : Number(cap) }); setMsg({ ok: true, text: "Saved." }); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };
  return (
    <div className="card flex flex-col gap-3 p-4 text-sm">
      <label className="flex items-start gap-3 font-semibold"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-tomato" checked={pap} onChange={(e) => setPap(e.target.checked)} /><span>Allow pay at pickup<span className="block text-xs font-normal text-muted">Offered only to customers with 3+ completed pickups.</span></span></label>
      <label className="label">Max units per order (default {defaultCap})<input className="input w-28" inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, ""))} /></label>
      <div className="flex items-center gap-3"><button type="button" className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</button>
        {msg && <span role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</span>}</div>
    </div>
  );
}
