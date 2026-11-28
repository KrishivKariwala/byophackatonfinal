"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Camera } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";

// ------------------------------------------------------------------ distribution log (charity)
export function DistributionForm({ batchId, defaultServings }: { batchId: string; defaultServings: number }) {
  const router = useRouter();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [servings, setServings] = useState(String(defaultServings));
  const [people, setPeople] = useState("");
  const [centre, setCentre] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addPhoto = async (file?: File) => {
    if (!file) return;
    setErr(null);
    const fd = new FormData(); fd.set("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({ ok: false, error: t("common.error") }));
    if (!j.ok) { setErr(j.error); return; }
    setPhotos((p) => [...p, j.data.url as string].slice(0, 3));
  };
  const submit = async () => {
    setBusy(true); setErr(null);
    try { await api("/api/ngo/distribution", { batchId, servings: Number(servings), beneficiaries: Number(people || 0), centreName: centre, notes, photoUrls: photos }); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  if (!open) return <button type="button" className="btn-outline mt-1 !min-h-[44px]" onClick={() => setOpen(true)}>{t("dist.add")}</button>;
  return (
    <form className="mt-2 flex flex-col gap-2 rounded-xl bg-cream p-3" onSubmit={(e) => { e.preventDefault(); if (!busy) submit(); }} aria-label={t("dist.title")}>
      <p className="editorial text-lg">{t("dist.title")}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="label">{t("dist.servings")}<input className="input" inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value.replace(/\D/g, ""))} required /></label>
        <label className="label">{t("dist.people")}<input className="input" inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value.replace(/\D/g, ""))} /></label>
      </div>
      <label className="label">{t("dist.centre")}<input className="input" value={centre} onChange={(e) => setCentre(e.target.value)} required maxLength={120} /></label>
      <label className="label">{t("dist.notes")} <span className="font-normal">({t("common.optional")})</span><textarea className="input min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} /></label>
      <div className="flex flex-col gap-1">
        <p role="note" className="rounded-lg bg-white p-2 text-xs font-semibold text-burgundy"><Camera size={14} className="mr-1 inline" aria-hidden="true" />{t("dist.noFaces")}</p>
        <label className="label">{t("dist.photos")} <span className="font-normal">({t("common.optional")}, max 3)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="input" disabled={photos.length >= 3} onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {photos.length > 0 && <p className="text-xs text-muted">{t("dist.attached", { n: photos.length })} <button type="button" className="underline" onClick={() => setPhotos([])}>{t("common.remove")}</button></p>}
      </div>
      <div className="flex gap-2">
        <button className="btn-primary !min-h-[44px]" disabled={busy || !centre.trim() || !servings}>{busy ? t("common.loading") : t("dist.save")}</button>
        <button type="button" className="btn-quiet !min-h-[44px]" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
      </div>
      {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
    </form>
  );
}

// ------------------------------------------------------------------ receipts (vendor and charity)
export interface ReceiptRow { id: string; number: string; item: string; qty: number; estimatedValue: number; vendorName: string; ngoName: string; collectedAt: string; hasEightyG: boolean }

export function ReceiptsPanel({ rows, from, to }: { rows: ReceiptRow[]; from: string; to: string }) {
  const { t, fmt } = useT();
  const [f, setF] = useState(from);
  const [tt, setTt] = useState(to);
  const qs = new URLSearchParams({ ...(f ? { from: f } : {}), ...(tt ? { to: tt } : {}) }).toString();
  return (
    <div className="flex flex-col gap-4">
      <form className="card flex flex-wrap items-end gap-3 p-4" method="get" aria-label={t("rcpt.filter")}>
        <label className="label">{t("rcpt.from")}<input type="date" name="from" className="input" value={f} onChange={(e) => setF(e.target.value)} /></label>
        <label className="label">{t("rcpt.to")}<input type="date" name="to" className="input" value={tt} onChange={(e) => setTt(e.target.value)} /></label>
        <button className="btn-quiet !min-h-[44px]">{t("rcpt.apply")}</button>
        <a className={`btn-primary !min-h-[44px] ${rows.length ? "" : "pointer-events-none opacity-50"}`} href={`/api/receipts/zip?${qs}`} aria-disabled={!rows.length}><Download size={16} aria-hidden="true" />{t("rcpt.zip", { n: rows.length })}</a>
      </form>
      {rows.length === 0 ? (
        <div className="card p-8 text-center"><h2 className="editorial text-2xl">{t("rcpt.none")}</h2><p className="mt-1 text-sm text-muted">{t("rcpt.noneHelp")}</p></div>
      ) : (
        <div className="card relative overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">{t("rcpt.title")}</caption>
            <thead className="border-b border-line text-xs uppercase text-muted"><tr><th className="p-3">{t("rcpt.number")}</th><th className="p-3">{t("rcpt.date")}</th><th className="p-3">{t("rcpt.item")}</th><th className="p-3">{t("rcpt.with")}</th><th className="p-3">{t("rcpt.value")}</th><th className="p-3"><span className="sr-only">{t("common.download")}</span></th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60">
                <td className="p-3 font-semibold">{r.number}</td><td className="p-3">{fmt.date(r.collectedAt)}</td><td className="p-3">{r.qty} × {r.item}</td>
                <td className="p-3">{r.vendorName} → {r.ngoName}{r.hasEightyG && <span className="ml-2 chip bg-veg text-white">80G</span>}</td>
                <td className="p-3">{fmt.inr(r.estimatedValue)}</td>
                <td className="p-3"><a className="btn-quiet !min-h-[44px]" href={`/api/receipts/${r.id}/pdf`}><Download size={14} aria-hidden="true" />PDF</a></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted">{t("rcpt.note")}</p>
    </div>
  );
}

// ------------------------------------------------------------------ delivery hand-off (charity)
export interface DeliveryView { id: string; status: string; provider: string; fee: number; riderName?: string; error?: string }
const ACTIVE = ["Requested", "Rider assigned", "Picked up"];

export function DeliveryPanel({ batchId, delivery }: { batchId: string; delivery?: DeliveryView | null }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setErr(null); try { await fn(); router.refresh(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  const live = delivery && ACTIVE.includes(delivery.status);
  const tone = !delivery ? "" : delivery.status === "Delivered" ? "bg-veg text-white" : ["Failed", "No rider found", "Cancelled"].includes(delivery.status) ? "bg-sand text-tomato" : "bg-peach text-burgundy";
  return (
    <div className="mt-1 flex flex-col gap-1.5 rounded-xl border-2 border-line p-3" role="group" aria-label={t("deliv.title")}>
      <p className="text-xs font-bold uppercase tracking-wide text-burgundy">{t("deliv.title")}</p>
      {delivery && <p className={`chip w-fit ${tone}`} role="status">{t(`deliv.status.${delivery.status}`)}{delivery.riderName ? ` · ${delivery.riderName}` : ""}</p>}
      {delivery && live && <p className="text-[11px] text-muted">{t("deliv.fee", { fee: `₹${delivery.fee}`, provider: delivery.provider })}</p>}
      {delivery?.error && <p className="text-[11px] font-semibold text-tomato">{delivery.error}</p>}
      {(!delivery || !live) && <button type="button" className="btn-outline !min-h-[44px]" disabled={busy} onClick={() => run(() => api("/api/ngo/delivery", { batchId }))}>{delivery ? t("deliv.retry") : t("deliv.request")}</button>}
      {delivery && delivery.status !== "Picked up" && live && <button type="button" className="btn-quiet !min-h-[44px]" disabled={busy} onClick={() => run(() => api(`/api/ngo/delivery/${delivery.id}`, undefined, "DELETE"))}>{t("deliv.cancel")}</button>}
      <p className="text-[11px] text-muted">{t("deliv.note")}</p>
      {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
    </div>
  );
}
