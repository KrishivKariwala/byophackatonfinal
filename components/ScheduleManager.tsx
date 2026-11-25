"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MoreHorizontal } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";
import { Popover } from "./Popover";
import { tOr } from "./i18n-helpers";

export interface ScheduleRow { id: string; templateTitle: string; days: number[]; startTime: string; leadMinutes: number; paused: boolean; lastError?: string }

/** Recurring listings: pick a saved template, the days and the start time, and the platform publishes it by itself each day. */
export function ScheduleManager({ templates, schedules }: { templates: { id: string; title: string }[]; schedules: ScheduleRow[] }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [adding, setAdding] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [days, setDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("18:30");
  const [lead, setLead] = useState(60);
  const [declared, setDeclared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dayName = (d: number) => new Intl.DateTimeFormat(locale === "en" ? "en-IN" : locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + d)));
  const toggle = (d: number) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); router.refresh(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const save = () => run(async () => {
    await api("/api/vendor/schedules", { templateId, days, startTime, leadMinutes: lead, declaration: declared });
    setAdding(false); setDays([]); setDeclared(false);
  });
  const item = "flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-cream disabled:opacity-50";

  return (
    <section aria-labelledby="sched-h">
      <h2 id="sched-h" className="editorial mb-1 flex items-center gap-2 text-3xl"><CalendarClock size={26} aria-hidden="true" />{t("sched.title")}</h2>
      <p className="mb-3 text-sm text-muted">{t("sched.help")}</p>
      {schedules.length === 0 && !adding && <p className="mb-3 text-sm text-muted">{t("sched.empty")}</p>}
      {schedules.length > 0 && (
        <ul className="mb-3 grid gap-3 md:grid-cols-2">
          {schedules.map((s) => (
            <li key={s.id} className="card flex items-start justify-between gap-3 p-4 text-sm">
              <div>
                <b>{s.templateTitle}</b>
                <p className="text-xs text-muted">{s.days.map(dayName).join(" · ")}</p>
                <p className="text-xs text-muted">{t("sched.line", { time: s.startTime, n: s.leadMinutes })}</p>
                <p className="mt-1"><span className={`chip ${s.paused ? "bg-sand text-muted" : "bg-[#E6F2E9] text-veg"}`}>{s.paused ? t("sched.paused") : t("sched.active")}</span></p>
                {s.lastError && <p role="status" className="mt-1 text-xs font-semibold text-tomato">{t("sched.lastError", { why: tOr(t, `rerr.${s.lastError}`, s.lastError) })}</p>}
              </div>
              <Popover fixed panelClass="w-52" panelWidth={208} label={t("sched.moreAria", { title: s.templateTitle })} buttonClass="border border-line !bg-white"
                icon={<><MoreHorizontal size={18} aria-hidden="true" /><span>{t("vdash.more")}</span></>}>
                {(close) => (
                  <ul className="flex flex-col">
                    <li><button type="button" role="menuitem" className={item} disabled={busy} onClick={() => { close(); run(() => api(`/api/vendor/schedules/${s.id}`, { paused: !s.paused }, "PATCH")); }}>{s.paused ? t("vdash.resume") : t("vdash.pause")}</button></li>
                    <li className="mt-1 border-t border-line pt-1"><button type="button" role="menuitem" className={`${item} text-tomato`} disabled={busy} onClick={() => { close(); if (window.confirm(t("sched.deleteConfirm"))) run(() => api(`/api/vendor/schedules/${s.id}`, undefined, "DELETE")); }}>{t("sched.delete")}</button></li>
                  </ul>
                )}
              </Popover>
            </li>
          ))}
        </ul>
      )}
      {!adding ? (
        templates.length > 0
          ? <button type="button" className="btn-outline" onClick={() => setAdding(true)}>{t("sched.add")}</button>
          : <p className="text-xs text-muted">{t("sched.needTemplate")}</p>
      ) : (
        <form className="card flex max-w-xl flex-col gap-3 p-4" onSubmit={(e) => { e.preventDefault(); if (!busy) save(); }}>
          <label className="label">{t("sched.template")}
            <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>{templates.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
          </label>
          <fieldset>
            <legend className="label mb-1">{t("sched.days")}</legend>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button key={d} type="button" aria-pressed={days.includes(d)} onClick={() => toggle(d)}
                  className={`chip min-h-[44px] min-w-[52px] justify-center border-2 text-sm ${days.includes(d) ? "border-tomato bg-tomato text-white" : "border-line bg-white text-burgundy"}`}>{dayName(d)}</button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">{t("sched.start")}<input type="time" required className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label>
            <label className="label">{t("sched.lead")}
              <select className="input" value={lead} onChange={(e) => setLead(Number(e.target.value))}>{[30, 60, 90, 120, 180].map((n) => <option key={n} value={n}>{t("sched.leadOpt", { n })}</option>)}</select>
            </label>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={declared} onChange={(e) => setDeclared(e.target.checked)} /><span>{t("sched.declaration")}</span></label>
          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy || !declared || days.length === 0}>{busy ? t("common.saving") : t("sched.save")}</button>
            <button type="button" className="btn-quiet" onClick={() => setAdding(false)}>{t("common.cancel")}</button>
          </div>
        </form>
      )}
      {err && <p role="alert" className="mt-2 text-sm font-semibold text-tomato">{err}</p>}
    </section>
  );
}
