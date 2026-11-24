"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { discountPercent, suggestedRescuePrice } from "@/lib/rules";
import type { Category, Diet, RiskTag, Template } from "@/lib/types";
import { useT } from "@/components/I18n";
import { tOr } from "@/components/i18n-helpers";

export type FormInit = {
  title: string; description: string; category: Category; originalPrice: number | ""; rescuePrice: number | ""; qty: number;
  diet: Diet | ""; allergens: string[]; surpriseBag: boolean; storageNote: string; donateRest: boolean;
  windowStart?: string; windowEnd?: string; preparedAt?: string; safeUntil?: string;
  donationOnly?: boolean; riskTag?: RiskTag | "";
  /** P2: steps that have not run yet (edit mode) */
  priceSteps?: { effectiveAt: string; discountPct: number }[];
  priorityMinutes?: number | "";
};

export type FormFeatures = { autoMarkdown: boolean; maxDiscountPct: number; priorityOptions?: number[] };

type Suggestion = { discount: number; price: number; hoursLeft: number; historyUsed: boolean };

const ALLERGENS = ["Gluten", "Milk", "Egg", "Nuts", "Peanuts", "Soy", "Fish", "Shellfish", "Sesame"];
const pad = (n: number) => String(n).padStart(2, "0");
const toLocal = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : "");

export function ListingForm({ mode, listingId, init, templates = [], serverNow, outlets = [], defaultOutletId, features = { autoMarkdown: false, maxDiscountPct: 80 }, appliedSteps = [] }: { mode: "create" | "edit"; listingId?: string; init: FormInit; templates?: Template[]; serverNow: number; outlets?: { id: string; label: string }[]; defaultOutletId?: string; features?: FormFeatures; appliedSteps?: { effectiveAt: string; discountPct: number }[] }) {
  const { t: tr, fmt } = useT();
  const [steps, setSteps] = useState<{ at: string; pct: string }[]>([]);
  const [schedMsg, setSchedMsg] = useState<string | null>(null);
  const [outletId, setOutletId] = useState(defaultOutletId ?? outlets[0]?.id ?? "");
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
    setSteps((init.priceSteps ?? []).map((st) => ({ at: toLocal(Date.parse(st.effectiveAt) - drift), pct: String(st.discountPct) })));
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
      } catch { setSuggErr(tr("common.error")); }
    }, 350);
    return () => clearTimeout(h);
  }, [f.originalPrice, f.category, f.donationOnly, times.end, serverNow, tr]);

  const suggestSchedule = async () => {
    setSchedMsg(null);
    try {
      const q = new URLSearchParams({ original: String(f.originalPrice), rescue: String(f.rescuePrice), start: fromLocal(times.start), end: fromLocal(times.end), category: f.category });
      const res = await fetch(`/api/vendor/schedule-suggestion?${q}`);
      const j = await res.json();
      if (!j.ok) { setSchedMsg(j.error); return; }
      const drift = serverNow - Date.now();
      const next = (j.data.steps as { effectiveAt: string; discountPct: number }[]).map((s) => ({ at: toLocal(Date.parse(s.effectiveAt) - drift), pct: String(s.discountPct) }));
      setSteps(next);
      setSchedMsg(next.length ? null : tr("markdown.noSuggestion"));
    } catch { setSchedMsg(tr("common.error")); }
  };
  const stepPrice = (pct: string) => { const d = Number(pct); const o = Number(f.originalPrice); return Number.isInteger(d) && d >= 30 && d <= 80 && o > 0 ? Math.max(1, Math.floor((o * (100 - d)) / 100)) : null; };

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
      ...(mode === "create" && outlets.length > 1 ? { outletId } : {}),
      ...(mode === "create" && (features.priorityOptions?.length ?? 0) > 0 && !f.donationOnly && f.priorityMinutes ? { priorityMinutes: Number(f.priorityMinutes) } : {}),
      ...(features.autoMarkdown && !f.donationOnly ? { priceSteps: steps.filter((s) => s.at && s.pct).map((s) => ({ effectiveAt: fromLocal(s.at), discountPct: Number(s.pct) })) } : {}),
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
        {mode === "create" && outlets.length > 1 && (
          <label className="label">{tr("vform.outlet")}
            <select className="input" value={outletId} onChange={(e) => setOutletId(e.target.value)} required>
              {outlets.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
        )}
        {mode === "create" && templates.length > 0 && (
          <label className="label">{tr("vform.template")}
            <select className="input" defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">{tr("vform.choose")}</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
        )}
        <label className="label">{tr("vform.foodTitle")}<input className="input" required value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={80} /></label>
        <label className="label">{tr("vform.description")}<textarea className="input min-h-[70px]" value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="label">{tr("vform.category")}
            <select className="input" value={f.category} onChange={(e) => set("category", e.target.value as Category)}>
              {(["Bakery", "Meals", "Snacks", "Desserts"] as Category[]).map((c) => <option key={c} value={c}>{tr(`category.${c}`)}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-tomato" checked={f.surpriseBag} onChange={(e) => set("surpriseBag", e.target.checked)} />{tr("vform.surprise")}</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mode === "create" && <label className="flex items-start gap-2 text-sm font-semibold"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-tomato" checked={!!f.donationOnly} onChange={(e) => set("donationOnly", e.target.checked)} /><span>{tr("vform.donationOnly")}<span className="block text-xs font-normal text-muted">{tr("vform.donationOnlyHelp")}</span></span></label>}
          <label className="label">{tr("vform.riskTag")}
            <select className="input" value={f.riskTag ?? ""} onChange={(e) => set("riskTag", e.target.value as RiskTag | "")}>
              <option value="">{tr("vform.riskNone")}</option><option value="raw">{tr("vform.risk.raw")}</option><option value="seafood">{tr("vform.risk.seafood")}</option><option value="dairy_dessert">{tr("vform.risk.dairy_dessert")}</option>
            </select>
            {f.riskTag ? <span className="text-[11px] font-normal text-tomato">{tr("vform.riskNote")}</span> : null}
          </label>
        </div>
        <fieldset>
          <legend className="label mb-1">{tr("vform.diet")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["Vegetarian", "Non-vegetarian"] as Diet[]).map((d) => (
              <label key={d} className={`btn cursor-pointer border-2 ${f.diet === d ? (d === "Vegetarian" ? "border-veg bg-veg text-white" : "border-nonveg bg-nonveg text-white") : "border-line bg-white text-muted"}`}>
                <input type="radio" name="diet" value={d} required checked={f.diet === d} onChange={() => set("diet", d)} className="sr-only" />{tr(`diet.${d}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label mb-1">{tr("vform.allergens")}</legend>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => {
              const on = f.allergens.includes(a);
              return <button type="button" key={a} aria-pressed={on} onClick={() => set("allergens", on ? f.allergens.filter((x) => x !== a) : [...f.allergens, a])} className={`chip border-2 !py-2 ${on ? "border-tomato bg-tomato text-white" : "border-line bg-white text-burgundy"}`}>{tOr(tr, `allergen.${a}`, a)}</button>;
            })}
          </div>
        </fieldset>
        <label className="label">{tr("vform.storage")}<input className="input" value={f.storageNote} onChange={(e) => set("storageNote", e.target.value)} placeholder={tr("vform.storagePh")} /></label>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card flex flex-col gap-4 p-5">
          {mode === "create" && <p className="self-end rounded-full bg-cream px-3 py-1 text-xs font-bold text-burgundy" aria-live="off">{tr("vform.timeToList", { s: elapsed })}</p>}
          {f.donationOnly ? <p className="rounded-xl bg-cream p-3 text-sm font-semibold text-burgundy">{tr("vform.donationOnlyNote")}</p> : <>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">{tr("vform.origPrice")}<input className="input" required inputMode="numeric" value={f.originalPrice} onChange={(e) => set("originalPrice", e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} /></label>
            <label className="label">{tr("vform.rescuePrice")}<input className="input" required inputMode="numeric" value={f.rescuePrice} onChange={(e) => set("rescuePrice", e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} /></label>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {pct !== null && <span className={`font-semibold ${priceOk ? "text-veg" : "text-tomato"}`}>{priceOk ? tr("vform.pctOk", { pct }) : tr("vform.pctBad", { pct })}</span>}
            {f.originalPrice ? <button type="button" className="font-semibold text-tomato underline" onClick={() => set("rescuePrice", suggestedRescuePrice(Number(f.originalPrice)))}>{tr("vform.useHalf", { price: suggestedRescuePrice(Number(f.originalPrice)) })}</button> : null}
          </div>
          {(sugg || suggErr) && (
            <div role="status" className="flex flex-wrap items-center gap-2 rounded-xl bg-cream p-3 text-sm text-burgundy">
              {sugg ? (<>
                <span><b>{tr("vform.suggested", { price: sugg.price })}</b> {tr("vform.suggestedRest", { pct: Math.round(sugg.discount * 100), hours: sugg.hoursLeft.toFixed(1) })}{sugg.historyUsed ? `, ${tr("vform.historyUsed")}` : `, ${tr("vform.noHistory")}`}</span>
                <button type="button" className="btn-primary !min-h-[44px] !py-2" onClick={() => set("rescuePrice", sugg.price)} aria-label={tr("vform.applySuggested", { price: sugg.price })}>{tr("common.apply")}</button>
              </>) : <span className="text-xs">{suggErr}</span>}
            </div>
          )}</>}
          {features.autoMarkdown && !f.donationOnly && (
            <fieldset className="flex flex-col gap-2 rounded-xl border-2 border-line p-3" aria-describedby="md-help">
              <legend className="label px-1">{tr("markdown.title")}</legend>
              <p id="md-help" className="text-[11px] text-muted">{tr("markdown.help", { max: features.maxDiscountPct })}</p>
              {appliedSteps.length > 0 && <p className="text-[11px] font-semibold text-burgundy">{tr("markdown.applied", { n: appliedSteps.length })}</p>}
              {steps.map((s, n) => (
                <div key={n} className="grid grid-cols-[1fr_88px_auto] items-end gap-2">
                  <label className="label">{tr("markdown.stepAt", { n: n + 1 })}<input type="datetime-local" className="input" value={s.at} onChange={(e) => setSteps(steps.map((x, k) => (k === n ? { ...x, at: e.target.value } : x)))} /></label>
                  <label className="label">{tr("markdown.pctOff")}<input className="input" inputMode="numeric" value={s.pct} onChange={(e) => setSteps(steps.map((x, k) => (k === n ? { ...x, pct: e.target.value.replace(/\D/g, "").slice(0, 2) } : x)))} /></label>
                  <button type="button" className="btn-quiet !min-h-[44px]" aria-label={tr("markdown.removeStep", { n: n + 1 })} onClick={() => setSteps(steps.filter((_, k) => k !== n))}>✕</button>
                  <p className="col-span-3 -mt-1 text-[11px] text-muted">{stepPrice(s.pct) !== null ? tr("markdown.stepPrice", { price: fmt.inr(stepPrice(s.pct)!) }) : tr("markdown.stepRange")}</p>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                {steps.length < 3 && <button type="button" className="btn-quiet !min-h-[44px]" onClick={() => setSteps([...steps, { at: "", pct: "" }])}>{tr("markdown.addStep")}</button>}
                {f.originalPrice && f.rescuePrice && times.start && times.end ? <button type="button" className="btn-outline !min-h-[44px]" onClick={suggestSchedule}>{tr("markdown.useSuggested")}</button> : null}
              </div>
              {schedMsg && <p role="status" className="text-xs font-semibold text-burgundy">{schedMsg}</p>}
            </fieldset>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="label">{tr("vform.quantity")}</span>
            <div className="flex items-center gap-2">
              <button type="button" aria-label={tr("vform.decrease")} className="h-12 w-12 rounded-xl border-2 border-tomato text-2xl text-tomato" onClick={() => set("qty", Math.max(1, f.qty - 1))}>−</button>
              <input aria-label={tr("vform.quantityAria")} className="input w-20 text-center text-xl font-bold" inputMode="numeric" value={f.qty} onChange={(e) => set("qty", Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} />
              <button type="button" aria-label={tr("vform.increase")} className="h-12 w-12 rounded-xl bg-tomato text-2xl text-white" onClick={() => set("qty", f.qty + 1)}>+</button>
            </div>
          </div>
          <div className="flex gap-2">{[5, 10, 15, 20].map((q) => <button type="button" key={q} onClick={() => set("qty", q)} className="chip flex-1 justify-center border-2 border-line bg-white !py-2 text-burgundy">{q}</button>)}</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">{tr("vform.pickupFrom")}<input type="datetime-local" className="input" required value={times.start} onChange={(e) => setTimes({ ...times, start: e.target.value })} /></label>
            <label className="label">{tr("vform.until")}<input type="datetime-local" className="input" required value={times.end} onChange={(e) => setTimes({ ...times, end: e.target.value })} /></label>
            <label className="label">{tr("vform.prepared")}<input type="datetime-local" className="input" required value={times.prepared} onChange={(e) => setTimes({ ...times, prepared: e.target.value })} /></label>
            <label className="label">{tr("vform.safeUntil")}<input type="datetime-local" className="input" value={times.safe} onChange={(e) => setTimes({ ...times, safe: e.target.value })} /></label>
          </div>
          <p className="text-[11px] text-muted">{tr("vform.windowNote")}</p>
        </div>
        <div className="card flex flex-col gap-3 p-5">
          <label className="flex items-start gap-3 rounded-xl bg-cream p-3 text-sm font-bold text-burgundy">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-tomato" checked={f.donateRest} onChange={(e) => set("donateRest", e.target.checked)} />
            <span>{tr("vform.donateRest")}<span className="block text-xs font-normal">{tr("vform.donateRestHelp")}</span></span>
          </label>
          {mode === "create" && (features.priorityOptions?.length ?? 0) > 0 && !f.donationOnly && (
            <label className="label">{tr("prio.field")}
              <select className="input" value={f.priorityMinutes ?? ""} onChange={(e) => set("priorityMinutes", e.target.value ? Number(e.target.value) : "")}>
                <option value="">{tr("prio.none.option")}</option>
                {features.priorityOptions!.map((m) => <option key={m} value={m}>{tr("prio.minutes", { n: m })}</option>)}
              </select>
              <span className="text-[11px] font-normal text-muted">{tr("prio.help.vendor")}</span>
            </label>
          )}
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" required className="mt-0.5 h-5 w-5 accent-tomato" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
            <span><b>{tr("vform.declaration")}</b> {tr("vform.declarationBody")}</span>
          </label>
          <button className="btn-primary !py-4 text-base" disabled={busy}>{busy ? tr("common.saving") : mode === "create" ? tr("vform.publish") : tr("vform.saveChanges")}</button>
          {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
        </div>
      </div>
    </form>
  );
}
