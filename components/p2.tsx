"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Copy, Trash2, UserPlus } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";
import { modReasonLabel, modTitleLabel, tOr } from "./i18n-helpers";

/** Cookie the server reads to know which outlet the dashboard is scoped to ("all" = every outlet the person may see). */
export function OutletSwitcher({ outlets, selected }: { outlets: { id: string; label: string }[]; selected: string }) {
  const router = useRouter();
  const { t } = useT();
  if (outlets.length < 2) return null;
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-burgundy">
      <Building2 size={16} aria-hidden="true" />{t("org.outlet")}
      <select
        className="input !min-h-[44px] !w-auto !py-2" value={selected}
        onChange={(e) => { document.cookie = `sap_outlet=${e.target.value}; path=/; max-age=31536000; samesite=lax`; router.refresh(); }}
      >
        <option value="all">{t("org.allOutlets")}</option>
        {outlets.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}

export interface TeamData {
  canManage: boolean; canManageOutlets: boolean; role: string; flagOn: boolean;
  outlets: { id: string; label: string }[];
  members: { id: string; name: string; phone?: string; role: string; outlet: string | null; isMe: boolean }[];
  invites: { id: string; contact: string; role: string; outlet: string | null; expired: boolean; expiresAt: string }[];
}

export function TeamClient({ data }: { data: TeamData }) {
  const router = useRouter();
  const { t, fmt } = useT();
  const [contact, setContact] = useState("");
  const [role, setRole] = useState<"staff" | "manager">("staff");
  const [outletId, setOutletId] = useState(data.outlets[0]?.id ?? "");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setErr(null); try { await fn(); router.refresh(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };

  const invite = () => run(async () => {
    const r = await api<{ link: string }>("/api/vendor/team", { contact, role, outletId: role === "staff" || outletId ? outletId : undefined });
    setLink(`${window.location.origin}${r.link}`); setContact(""); setCopied(false);
  });

  return (
    <div className="flex flex-col gap-6">
      {err && <p role="alert" className="rounded-xl bg-cream p-3 text-sm font-semibold text-tomato">{err}</p>}

      {data.canManage && data.flagOn && (
        <section className="card flex flex-col gap-3 p-5" aria-labelledby="inv-h">
          <h2 id="inv-h" className="editorial text-2xl">{t("org.inviteTitle")}</h2>
          <p className="text-sm text-muted">{t("org.inviteHelp")}</p>
          <form className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); if (!busy) invite(); }}>
            <label className="label">{t("org.contact")}
              <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 98xxx xxxxx / name@email.com" autoComplete="off" required />
            </label>
            <label className="label">{t("org.role")}
              <select className="input" value={role} onChange={(e) => setRole(e.target.value as "staff" | "manager")}>
                <option value="staff">{t("org.role.staff")}</option>
                {data.role === "owner" && <option value="manager">{t("org.role.manager")}</option>}
              </select>
            </label>
            <label className="label">{t("org.outlet")}
              <select className="input" value={outletId} onChange={(e) => setOutletId(e.target.value)}>
                {role === "manager" && <option value="">{t("org.allOutlets")}</option>}
                {data.outlets.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <button className="btn-primary self-end" disabled={busy || !contact.trim()}><UserPlus size={16} aria-hidden="true" />{t("org.sendInvite")}</button>
          </form>
          {link && (
            <div role="status" className="flex flex-wrap items-center gap-2 rounded-xl bg-cream p-3 text-sm text-burgundy">
              <span className="font-semibold">{t("org.inviteReady")}</span>
              <code className="break-all rounded bg-white px-2 py-1 text-xs">{link}</code>
              <button type="button" className="btn-quiet !min-h-[44px]" onClick={() => { navigator.clipboard?.writeText(link).then(() => setCopied(true)).catch(() => {}); }}>
                <Copy size={14} aria-hidden="true" />{copied ? t("common.copied") : t("common.copy")}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="card p-5" aria-labelledby="mem-h">
        <h2 id="mem-h" className="editorial mb-3 text-2xl">{t("org.members")}</h2>
        {data.members.length === 0 ? <p className="text-sm text-muted">{t("common.empty")}</p> : (
          <ul className="divide-y divide-line">
            {data.members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div><b>{m.name}</b>{m.isMe && <span className="ml-2 chip bg-peach text-burgundy">{t("org.you")}</span>}<p className="text-xs text-muted">{t(`org.role.${m.role}`)} · {m.outlet ?? t("org.allOutlets")}{m.phone ? ` · ${m.phone}` : ""}</p></div>
                {m.role !== "owner" && !m.isMe && data.canManage && (
                  <button type="button" className="btn-quiet !min-h-[44px] text-tomato" disabled={busy}
                    onClick={() => { if (window.confirm(t("org.removeConfirm", { name: m.name }))) run(() => api(`/api/vendor/team/${m.id}`, undefined, "DELETE")); }}>
                    <Trash2 size={14} aria-hidden="true" />{t("org.remove")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.canManage && (
        <section className="card p-5" aria-labelledby="pend-h">
          <h2 id="pend-h" className="editorial mb-3 text-2xl">{t("org.pending")}</h2>
          {data.invites.length === 0 ? <p className="text-sm text-muted">{t("org.noPending")}</p> : (
            <ul className="divide-y divide-line">
              {data.invites.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div><b>{i.contact}</b><p className="text-xs text-muted">{t(`org.role.${i.role}`)} · {i.outlet ?? t("org.allOutlets")} · {i.expired ? t("org.expired") : t("org.expires", { date: fmt.date(i.expiresAt) })}</p></div>
                  <button type="button" className="btn-quiet !min-h-[44px]" disabled={busy} onClick={() => run(() => api(`/api/vendor/team/invites/${i.id}`, undefined, "DELETE"))}>{t("org.cancelInvite")}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {data.canManageOutlets && <OutletsAdmin outlets={data.outlets} flagOn={data.flagOn} />}
    </div>
  );
}

function OutletsAdmin({ outlets, flagOn }: { outlets: { id: string; label: string }[]; flagOn: boolean }) {
  const router = useRouter();
  const { t } = useT();
  const [f, setF] = useState({ name: "", address: "", neighbourhood: "Koramangala", lat: "12.9352", lng: "77.6245", hours: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true); setErr(null);
    try { await api("/api/vendor/outlets", { ...f, lat: Number(f.lat), lng: Number(f.lng) }); setF({ ...f, name: "", address: "", hours: "" }); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <section className="card flex flex-col gap-3 p-5" aria-labelledby="out-h">
      <h2 id="out-h" className="editorial text-2xl">{t("org.outlets")}</h2>
      <ul className="text-sm">{outlets.map((o) => <li key={o.id} className="py-1">• {o.label}</li>)}</ul>
      {flagOn ? (
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!busy) add(); }}>
          <label className="label">{t("org.outletName")}<input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} /></label>
          <label className="label">{t("org.outletHours")}<input className="input" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} maxLength={80} placeholder="10:00–22:00" /></label>
          <label className="label sm:col-span-2">{t("org.outletAddress")}<input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} required maxLength={200} /></label>
          <label className="label">{t("org.neighbourhood")}<input className="input" value={f.neighbourhood} onChange={(e) => setF({ ...f, neighbourhood: e.target.value })} required /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="label">{t("org.lat")}<input className="input" inputMode="decimal" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} /></label>
            <label className="label">{t("org.lng")}<input className="input" inputMode="decimal" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} /></label>
          </div>
          <div className="sm:col-span-2"><button className="btn-primary" disabled={busy || !f.address.trim()}>{t("org.addOutlet")}</button></div>
        </form>
      ) : <p className="text-sm text-muted">{t("org.flagOff")}</p>}
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
    </section>
  );
}

export function JoinClient({ token, signedIn, business }: { token: string; signedIn: boolean; business: string }) {
  const router = useRouter();
  const { t } = useT();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const accept = async () => {
    setBusy(true); setErr(null);
    try { await api("/api/join", { token }); router.push("/v"); router.refresh(); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-3">
      {signedIn
        ? <button className="btn-primary !min-h-[48px]" onClick={accept} disabled={busy}>{busy ? t("common.loading") : t("org.joinAccept", { business })}</button>
        : <a className="btn-primary !min-h-[48px]" href={`/signin?role=vendor&next=${encodeURIComponent(`/join/${token}`)}`}>{t("org.joinSignIn")}</a>}
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
    </div>
  );
}

export interface CertRow { id: string; month: string; partial: boolean; meals: number; createdAt: string }

/** Impact certificates: list, download PDF, public page, and "generate" for a chosen month. */
export function CertificatesPanel({ certs, months }: { certs: CertRow[]; months: string[] }) {
  const router = useRouter();
  const { t, fmt } = useT();
  const [month, setMonth] = useState(months[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const gen = async () => {
    setBusy(true); setMsg(null);
    try { await api("/api/vendor/certificates", { month }); setMsg({ ok: true, text: t("cert.generated") }); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };
  return (
    <section className="card flex flex-col gap-3 p-4" aria-labelledby="cert-h">
      <div>
        <h2 id="cert-h" className="editorial text-2xl">{t("cert.title")}</h2>
        <p className="text-xs text-muted">{t("cert.help")}</p>
      </div>
      {certs.length === 0 ? <p className="text-sm text-muted">{t("cert.none")}</p> : (
        <ul className="divide-y divide-line">
          {certs.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div><b>{fmt.month(c.month)}</b>{c.partial && <span className="ml-2 chip bg-peach text-burgundy">{t("cert.monthToDate")}</span>}<p className="text-xs text-muted">{c.meals} · {c.id}</p></div>
              <div className="flex flex-wrap gap-2">
                <a className="btn-primary !min-h-[44px]" href={`/api/vendor/certificates/${c.id}/pdf`}>{t("cert.download")}</a>
                <a className="btn-quiet !min-h-[44px]" href={`/verify/${c.id}`} target="_blank" rel="noreferrer">{t("cert.verifyLink")}</a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="label">{t("cert.month")}
          <select className="input !w-auto" value={month} onChange={(e) => setMonth(e.target.value)}>{months.map((m) => <option key={m} value={m}>{fmt.month(m)}</option>)}</select>
        </label>
        <button type="button" className="btn-outline !min-h-[44px]" onClick={gen} disabled={busy || !month}>{busy ? t("common.loading") : t("cert.generate")}</button>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</p>}
    </section>
  );
}

// ------------------------------------------------------------------ admin: moderation queue
export interface ModItem {
  key: string; targetType: "listing" | "review" | "vendor"; targetId: string; title: string; excerpt: string; owner: string; reasons: string[];
  openReports: number; state: "open" | "hidden" | "resolved"; canEdit: boolean; history: { at: string; admin: string; action: string; reason: string }[];
}

export function ModerationClient({ items }: { items: ModItem[] }) {
  const router = useRouter();
  const { t, fmt } = useT();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [edit, setEdit] = useState({ title: "", description: "", text: "" });
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const act = async (it: ModItem, action: string) => {
    setBusy(true); setErr(null);
    try {
      await api("/api/admin/moderation", {
        targetType: it.targetType, targetId: it.targetId, action, reason,
        edit: action === "edit" ? { title: edit.title || undefined, description: edit.description || undefined, text: it.targetType === "review" ? edit.text : undefined } : undefined,
        suspendDays: action === "suspend" ? Number(days) : undefined,
      });
      setReason(""); setOpenKey(null); router.refresh();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const tone = (s: ModItem["state"]) => (s === "open" ? "bg-tomato text-white" : s === "hidden" ? "bg-burgundy text-peach" : "bg-sand text-muted");
  return (
    <ul className="flex flex-col gap-4">
      {items.map((it) => (
        <li key={it.key} className="card flex flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">{modTitleLabel(t, it.title)} <span className="text-xs font-normal text-muted">· {t(`mod.type.${it.targetType}`)} · {it.owner}</span></p>
            <span className={`chip ${tone(it.state)}`}>{t(`mod.state.${it.state}`)}</span>
          </div>
          <p className="text-xs font-semibold text-tomato">{it.reasons.map((r) => modReasonLabel(t, r)).join(" · ")}</p>
          {it.excerpt && <p className="rounded-xl bg-canvas p-3 text-sm">{it.excerpt}</p>}
          {it.history.length > 0 && (
            <details className="text-xs text-muted"><summary className="cursor-pointer font-semibold">{t("mod.history")}</summary>
              <ol className="mt-1 flex flex-col gap-0.5">{it.history.map((h, i) => <li key={i}>{fmt.dateTime(h.at)} · {h.admin} · <b>{tOr(t, `mod.${h.action}`, h.action)}</b> · {h.reason}</li>)}</ol></details>
          )}
          {openKey === it.key ? (
            <div className="flex flex-col gap-2 rounded-xl bg-cream p-3">
              <label className="label">{t("mod.reason")} *<textarea className="input min-h-[60px]" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></label>
              {it.canEdit && it.targetType === "listing" && (<div className="grid gap-2 sm:grid-cols-2">
                <label className="label">{t("mod.newTitle")}<input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} maxLength={80} /></label>
                <label className="label">{t("mod.newDescription")}<input className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} maxLength={1000} /></label></div>)}
              {it.canEdit && it.targetType === "review" && <label className="label">{t("mod.newText")}<input className="input" value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} maxLength={1000} /></label>}
              <label className="label">{t("mod.suspendDays")}<input className="input !w-24" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} /></label>
              <div className="flex flex-wrap gap-2">
                {it.state !== "hidden" ? <button type="button" className="btn-primary !min-h-[44px]" disabled={busy || reason.trim().length < 3} onClick={() => act(it, "hide")}>{t("mod.hide")}</button>
                  : <button type="button" className="btn-primary !min-h-[44px]" disabled={busy || reason.trim().length < 3} onClick={() => act(it, "restore")}>{t("mod.restore")}</button>}
                {it.canEdit && <button type="button" className="btn-outline !min-h-[44px]" disabled={busy || reason.trim().length < 3 || !(edit.title || edit.description || edit.text)} onClick={() => act(it, "edit")}>{t("mod.edit")}</button>}
                <button type="button" className="btn-quiet !min-h-[44px]" disabled={busy || reason.trim().length < 3} onClick={() => act(it, "warn")}>{t("mod.warn")}</button>
                <button type="button" className="btn-quiet !min-h-[44px] text-tomato" disabled={busy || reason.trim().length < 3 || !days} onClick={() => act(it, "suspend")}>{t("mod.suspend")}</button>
                <button type="button" className="btn-quiet !min-h-[44px]" disabled={busy || reason.trim().length < 3} onClick={() => act(it, "dismiss")}>{t("mod.dismiss")}</button>
                <button type="button" className="btn-quiet !min-h-[44px]" onClick={() => setOpenKey(null)}>{t("common.cancel")}</button>
              </div>
              {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
            </div>
          ) : <div><button type="button" className="btn-outline !min-h-[44px]" onClick={() => { setOpenKey(it.key); setErr(null); setReason(""); }}>{t("mod.review")}</button></div>}
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ admin: platform settings
export interface SettingsData {
  specs: { key: string; label: string; unit: string; min: number; max: number; step: number; value: number }[];
  flags: { name: string; label: string; on: boolean }[];
  priorityOptions: number[]; priorityChoices: number[]; moderationKeywords: string[];
  audit: { id: string; key: string; from: string; to: string; at: string; admin: string }[];
}

export function SettingsClient({ data }: { data: SettingsData }) {
  const router = useRouter();
  const { t, fmt } = useT();
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(data.specs.map((s) => [s.key, String(s.value)])));
  const [flags, setFlags] = useState<Record<string, boolean>>(() => Object.fromEntries(data.flags.map((f) => [f.name, f.on])));
  const [prio, setPrio] = useState<number[]>(data.priorityOptions);
  const [kw, setKw] = useState(data.moderationKeywords.join(", "));
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const patch = () => {
    const values: Record<string, number> = {};
    for (const s of data.specs) if (Number(vals[s.key]) !== s.value) values[s.key] = Number(vals[s.key]);
    const f: Record<string, boolean> = {};
    for (const x of data.flags) if (flags[x.name] !== x.on) f[x.name] = flags[x.name];
    const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
    const p = [...prio].sort((a, b) => a - b);
    const kws = kw.split(/[,\n]/).map((x) => x.trim().toLowerCase()).filter(Boolean);
    return {
      ...(Object.keys(values).length ? { values } : {}), ...(Object.keys(f).length ? { flags: f } : {}),
      ...(!same(p, data.priorityOptions) ? { priorityOptions: p } : {}),
      ...(kws.join("|") !== data.moderationKeywords.join("|") ? { moderationKeywords: kws } : {}),
    };
  };
  const save = async (confirm: boolean) => {
    setBusy(true); setMsg(null);
    try {
      const body = patch();
      if (Object.keys(body).length === 0) { setMsg({ ok: true, text: t("set.nothing") }); return; }
      const r = await api<{ applied: boolean; warnings: string[]; changed: number }>("/api/admin/settings", { ...body, confirm });
      if (!r.applied && r.warnings.length) { setWarnings(r.warnings); return; }
      setWarnings(null); setMsg({ ok: true, text: t("set.saved", { n: r.changed }) }); router.refresh();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <form className="card flex flex-col gap-4 p-5" onSubmit={(e) => { e.preventDefault(); if (!busy) { setWarnings(null); save(false); } }} aria-label={t("set.title")}>
        <h2 className="editorial text-2xl">{t("set.values")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.specs.map((s) => (
            <label key={s.key} className="label">{s.label}
              <input className="input" inputMode="numeric" value={vals[s.key]} min={s.min} max={s.max} step={s.step} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value.replace(/\D/g, "") })} aria-describedby={`${s.key}-help`} />
              <span id={`${s.key}-help`} className="font-normal">{t("set.range", { min: s.min, max: s.max })} · {s.unit}</span>
            </label>
          ))}
        </div>
        <fieldset>
          <legend className="label mb-1">{t("set.priority")}</legend>
          <div className="flex flex-wrap gap-2">{data.priorityChoices.map((m) => (
            <label key={m} className={`chip min-h-[44px] cursor-pointer border-2 ${prio.includes(m) ? "border-tomato bg-tomato text-white" : "border-line bg-white text-burgundy"}`}>
              <input type="checkbox" className="sr-only" checked={prio.includes(m)} onChange={() => setPrio(prio.includes(m) ? prio.filter((x) => x !== m) : [...prio, m])} />{t("prio.minutes", { n: m })}
            </label>))}</div>
        </fieldset>
        <label className="label">{t("set.keywords")}<textarea className="input min-h-[70px]" value={kw} onChange={(e) => setKw(e.target.value)} /><span className="font-normal">{t("set.keywordsHelp")}</span></label>
        <h2 className="editorial text-2xl">{t("set.flags")}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">{data.flags.map((f) => (
          <li key={f.name}><label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-line p-3 text-sm font-semibold">
            <span>{f.label}</span>
            <input type="checkbox" role="switch" className="h-6 w-6 accent-tomato" checked={flags[f.name]} onChange={(e) => setFlags({ ...flags, [f.name]: e.target.checked })} aria-label={`${f.label}: ${flags[f.name] ? t("common.on") : t("common.off")}`} />
          </label></li>))}</ul>
        {warnings && (
          <div role="alert" className="flex flex-col gap-2 rounded-xl border-2 border-tomato bg-cream p-3 text-sm text-burgundy">
            <p className="font-bold">{t("set.warnTitle")}</p>
            <ul className="list-disc pl-5">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            <div className="flex gap-2"><button type="button" className="btn-primary !min-h-[44px]" disabled={busy} onClick={() => save(true)}>{t("set.applyAnyway")}</button><button type="button" className="btn-quiet !min-h-[44px]" onClick={() => setWarnings(null)}>{t("common.cancel")}</button></div>
          </div>
        )}
        <div className="flex items-center gap-3"><button className="btn-primary !min-h-[48px]" disabled={busy}>{busy ? t("common.loading") : t("common.save")}</button>
          {msg && <span role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</span>}</div>
      </form>

      <section className="card p-5" aria-labelledby="aud-h">
        <h2 id="aud-h" className="editorial mb-2 text-2xl">{t("set.audit")}</h2>
        {data.audit.length === 0 ? <p className="text-sm text-muted">{t("set.noAudit")}</p> : (
          <ul className="divide-y divide-line text-sm">{data.audit.map((a) => (
            <li key={a.id} className="py-2"><b>{a.key}</b>: {a.from} → {a.to}<p className="text-xs text-muted">{a.admin} · {fmt.dateTime(a.at)}</p></li>))}</ul>
        )}
      </section>
    </div>
  );
}
