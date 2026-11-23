"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { discountPercent, suggestedRescuePrice } from "@/lib/rules";
import type { Category, Diet, RiskTag, Template } from "@/lib/types";
import { S } from "@/lib/strings";

export type FormInit = {
  title: string; description: string; category: Category; originalPrice: number | ""; rescuePrice: number | ""; qty: number;
  diet: Diet | ""; allergens: string[]; surpriseBag: boolean; storageNote: string; donateRest: boolean;
  windowStart?: string; windowEnd?: string; preparedAt?: string; safeUntil?: string;
  donationOnly?: boolean; riskTag?: RiskTag | "";
};

type Suggestion = { discount: number; price: number; hoursLeft: number; historyUsed: boolean };

const ALLERGENS = ["Gluten", "Milk", "Egg", "Nuts", "Peanuts", "Soy", "Fish", "Shellfish", "Sesame"];
const pad = (n: number) => String(n).padStart(2, "0");
const toLocal = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : "");

export function ListingForm({ mode, listingId, init, templates = [], serverNow }: { mode: "create" | "edit"; listingId?: string; init: FormInit; templates?: Template[]; serverNow: number }) {
  const router = useRouter();
  const [f, setF] = useState<FormInit>(init);
  const [times, setTimes] = useState({ start: "", end: "", prepared: "", safe: "" });
  const [declared, setDeclared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [t0] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [sugg, setSugg] = useState<Suggestion | null>(null);
  const [suggErr, setSuggErr] = useState<string | null>(null);

  useEffect(() => {
    // Defaults computed from the server clock, shown in the device's local time.
    const drift = serverNow - Date.now();
    const s = init.windowStart ? Date.parse(init.windowStart) : Math.ceil((serverNow + 30 * 60_000) / (15 * 60_000)) * 15 * 60_000;
    const e = init.windowEnd ? Date.parse(init.windowEnd) : s + 90 * 60_000;
    const p = init.preparedAt ? Date.parse(init.preparedAt) : serverNow - 60 * 60_000;
    setTimes({ start: toLocal(s - drift), end: toLocal(e - drift), prepared: toLocal(p - drift), safe: init.safeUntil ? toLocal(Date.parse(init.safeUntil) - drift) : "" });
    if (mode === "create") { const i = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000); return () => clearInterval(i); }
  }, [init, serverNow, mode, t0]);

  const set = <K extends keyof FormInit>(k: K, v: FormInit[K]) => setF((x) => ({ ...x, [k]: v }));
  const pct = useMemo(() => (f.originalPrice && f.rescuePrice ? discountPercent(Number(f.originalPrice), Number(f.rescuePrice)) : null), [f.originalPrice, f.rescuePrice]);
  const priceOk = f.donationOnly || pct !== null && Number(f.rescuePrice) <= Number(f.originalPrice) * 0.7 && Number(f.rescuePrice) > 0;

  // Dynamic price suggestion (FR-2.3): refreshed when the original price, category or pickup end changes.
  useEffect(() => {
    setSugg(null); setSuggErr(null);
    if (f.donationOnly || !f.originalPrice || !times.end) return;
    const drift = serverNow - Date.now();
    const hoursLeft = (Date.parse(fromLocal(times.end)) - (Date.now() + drift)) / 3600_000;
    if (!Number.isFinite(hoursLeft)) return;
    const h = setTimeout(async () => {
      try {
        const q = new URLSearchParams({ original_price: String(f.originalPrice), category: f.category, hours_left: String(Math.max(0, hoursLeft)) });
        const res = await fetch(`/api/suggested-discount?${q}`);
        const j = await res.json();
        if (j.ok) setSugg(j.data as Suggestion); else setSuggErr(j.error);
      } catch { setSuggErr(S.states.error); }
    }, 350);
    return () => clearTimeout(h);
  }, [f.originalPrice, f.category, f.donationOnly, times.end, serverNow]);

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setF((x) => ({ ...x, title: t.title, description: t.description, category: t.category, originalPrice: t.originalPrice, rescuePrice: t.rescuePrice, diet: t.diet, allergens: t.allergens, surpriseBag: t.surpriseBag, storageNote: t.storageNote || "", qty: t.qty ?? x.qty, donateRest: t.donateRest ?? x.donateRest, donationOnly: t.donationOnly ?? false, riskTag: t.riskTag ?? "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const payload = {
      title: f.title, description: f.description, category: f.category, originalPrice: Number(f.originalPrice) || 0, rescuePrice: f.donationOnly ? 0 : Number(f.rescuePrice),
      donationOnly: !!f.donationOnly, riskTag: f.riskTag || undefined,
      qty: Number(f.qty), diet: f.diet, allergens: f.allergens, surpriseBag: f.surpriseBag, storageNote: f.storageNote, donateRest: f.donateRest,
      windowStart: fromLocal(times.start), windowEnd: fromLocal(times.end), preparedAt: fromLocal(times.prepared), safeUntil: times.safe ? fromLocal(times.safe) : undefined,
      safetyDeclaration: declared,
    };
    try {
      if (mode === "create") await api("/api/vendor/listings", payload);
      else await api(`/api/vendor/listings/${listingId}`, payload, "PATCH");
      router.push("/v");
      router.refresh();
    } catch (er) {
      setErr((er as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="card flex flex-col gap-4 p-5">
        {mode === "create" && templates.length > 0 && (
          <label className="label">Start from a template
            <select className="input" defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">— Choose —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
        )}
        <label className="label">Food title *<input className="input" required value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={80} /></label>
        <label className="label">Description<textarea className="input min-h-[70px]" value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="label">Category *
            <select className="input" value={f.category} onChange={(e) => set("category", e.target.value as Category)}>
              <option>Bakery</option><option>Meals</option><option>Snacks</option><option>Desserts</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-tomato" checked={f.surpriseBag} onChange={(e) => set("surpriseBag", e.target.checked)} />{S.surprise.badge} (fixed price, contents hidden until pickup)</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mode === "create" && <label className="flex items-start gap-2 text-sm font-semibold"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-tomato" checked={!!f.donationOnly} onChange={(e) => set("donationOnly", e.target.checked)} /><span>Donation-only<span className="block text-xs font-normal text-muted">Never sold. Goes straight to verified NGOs.</span></span></label>}
          <label className="label">Food risk tag
            <select className="input" value={f.riskTag ?? ""} onChange={(e) => set("riskTag", e.target.value as RiskTag | "")}>
              <option value="">None</option><option value="raw">Raw</option><option value="seafood">Seafood</option><option value="dairy_dessert">Dairy dessert</option>
            </select>
            {f.riskTag ? <span className="text-[11px] font-normal text-tomato">High-risk items: pickup window max 2 hours.</span> : null}
          </label>
        </div>
        <fieldset>
          <legend className="label mb-1">Diet * (exactly one)</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["Vegetarian", "Non-vegetarian"] as Diet[]).map((d) => (
              <label key={d} className={`btn cursor-pointer border-2 ${f.diet === d ? (d === "Vegetarian" ? "border-veg bg-veg text-white" : "border-nonveg bg-nonveg text-white") : "border-line bg-white text-muted"}`}>
                <input type="radio" name="diet" value={d} required checked={f.diet === d} onChange={() => set("diet", d)} className="sr-only" />{d}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label mb-1">Allergens (optional — only what you know)</legend>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => {
              const on = f.allergens.includes(a);
              return <button type="button" key={a} aria-pressed={on} onClick={() => set("allergens", on ? f.allergens.filter((x) => x !== a) : [...f.allergens, a])} className={`chip border-2 !py-2 ${on ? "border-tomato bg-tomato text-white" : "border-line bg-white text-burgundy"}`}>{a}</button>;
            })}
          </div>
        </fieldset>
        <label className="label">Storage / handling note<input className="input" value={f.storageNote} onChange={(e) => set("storageNote", e.target.value)} placeholder="e.g. Keep refrigerated; reheat thoroughly" /></label>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card flex flex-col gap-4 p-5">
          {mode === "create" && <p className="self-end rounded-full bg-cream px-3 py-1 text-xs font-bold text-burgundy" aria-live="off">Time to list: {elapsed}s</p>}
          {f.donationOnly ? <p className="rounded-xl bg-cream p-3 text-sm font-semibold text-burgundy">Donation-only: no price. Charities can claim it free until the pickup window ends.</p> : <>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">Original price ₹ *<input className="input" required inputMode="numeric" value={f.originalPrice} onChange={(e) => set("originalPrice", e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} /></label>
            <label className="label">Rescue price ₹ *<input className="input" required inputMode="numeric" value={f.rescuePrice} onChange={(e) => set("rescuePrice", e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} /></label>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {pct !== null && <span className={`font-semibold ${priceOk ? "text-veg" : "text-tomato"}`}>{pct}% off · {priceOk ? "meets the 30% minimum" : "must be at least 30% off"}</span>}
            {f.originalPrice ? <button type="button" className="font-semibold text-tomato underline" onClick={() => set("rescuePrice", suggestedRescuePrice(Number(f.originalPrice)))}>Use 50% off (₹{suggestedRescuePrice(Number(f.originalPrice))})</button> : null}
          </div>
          {(sugg || suggErr) && (
            <div role="status" className="flex flex-wrap items-center gap-2 rounded-xl bg-cream p-3 text-sm text-burgundy">
              {sugg ? (<>
                <span><b>Suggested ₹{sugg.price}</b> ({Math.round(sugg.discount * 100)}% off) · {sugg.hoursLeft.toFixed(1)} h left{sugg.historyUsed ? ", based on your last 7 days" : ", no history yet"}</span>
                <button type="button" className="btn-primary !min-h-[44px] !py-2" onClick={() => set("rescuePrice", sugg.price)} aria-label={`Apply suggested price ₹${sugg.price}`}>Apply</button>
              </>) : <span className="text-xs">{suggErr}</span>}
            </div>
          )}</>}
          <div className="flex items-center justify-between gap-3">
            <span className="label">Quantity *</span>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Decrease" className="h-12 w-12 rounded-xl border-2 border-tomato text-2xl text-tomato" onClick={() => set("qty", Math.max(1, f.qty - 1))}>−</button>
              <input aria-label="Quantity" className="input w-20 text-center text-xl font-bold" inputMode="numeric" value={f.qty} onChange={(e) => set("qty", Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} />
              <button type="button" aria-label="Increase" className="h-12 w-12 rounded-xl bg-tomato text-2xl text-white" onClick={() => set("qty", f.qty + 1)}>+</button>
            </div>
          </div>
          <div className="flex gap-2">{[5, 10, 15, 20].map((q) => <button type="button" key={q} onClick={() => set("qty", q)} className="chip flex-1 justify-center border-2 border-line bg-white !py-2 text-burgundy">{q}</button>)}</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">Pickup from *<input type="datetime-local" className="input" required value={times.start} onChange={(e) => setTimes({ ...times, start: e.target.value })} /></label>
            <label className="label">Until *<input type="datetime-local" className="input" required value={times.end} onChange={(e) => setTimes({ ...times, end: e.target.value })} /></label>
            <label className="label">Prepared at *<input type="datetime-local" className="input" required value={times.prepared} onChange={(e) => setTimes({ ...times, prepared: e.target.value })} /></label>
            <label className="label">Safe to eat until<input type="datetime-local" className="input" value={times.safe} onChange={(e) => setTimes({ ...times, safe: e.target.value })} /></label>
          </div>
          <p className="text-[11px] text-muted">Pickup must start in the future and within 12 hours of creating the listing.</p>
        </div>
        <div className="card flex flex-col gap-3 p-5">
          <label className="flex items-start gap-3 rounded-xl bg-cream p-3 text-sm font-bold text-burgundy">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-tomato" checked={f.donateRest} onChange={(e) => set("donateRest", e.target.checked)} />
            <span>Donate the rest at window end<span className="block text-xs font-normal">Unreserved units become one free batch for verified NGOs, if still safe.</span></span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" required className="mt-0.5 h-5 w-5 accent-tomato" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
            <span><b>Food-safety declaration *</b> — I confirm this food was prepared and stored hygienically, the details above are accurate, and it is fit to eat within the stated time.</span>
          </label>
          <button className="btn-primary !py-4 text-base" disabled={busy}>{busy ? "Saving…" : mode === "create" ? "Publish now" : "Save changes"}</button>
          {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
        </div>
      </div>
    </form>
  );
}
