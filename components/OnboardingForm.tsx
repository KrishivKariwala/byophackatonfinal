"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./client";
import { NEIGHBOURHOODS, type Neighbourhood } from "@/lib/geo";
import { useT } from "./I18n";
import { hoodLabel } from "./i18n-helpers";

type Init = Record<string, string | number | boolean | string[] | undefined>;

// [field, catalog key of its label]
const FIELDS = {
  vendor: [
    ["businessName", "onb.f.businessName"], ["contactName", "onb.f.contactName"], ["phone", "onb.f.phone"], ["email", "onb.f.email"],
    ["address", "onb.f.outletAddress"], ["fssaiNumber", "onb.f.fssaiNumber"], ["operatingHours", "onb.f.operatingHours"], ["payoutUpi", "onb.f.payoutUpi"],
  ],
  ngo: [
    ["orgName", "onb.f.orgName"], ["contactPerson", "onb.f.contactPerson"], ["phone", "onb.f.phone"], ["email", "onb.f.email"], ["address", "onb.f.collectionAddress"],
    ["serviceAreaKm", "onb.f.serviceAreaKm"], ["capacityMeals", "onb.f.capacityMeals"], ["handlingArrangements", "onb.f.handling"], ["fssaiInfo", "onb.f.fssaiInfo"],
    ["registrationNumber", "onb.f.registrationNumber"], ["eightyGNumber", "onb.f.eightyGNumber"],
  ],
} as const;

export function OnboardingForm({ kind, init, locked }: { kind: "vendor" | "ngo"; init: Init; locked?: boolean }) {
  const router = useRouter();
  const { t } = useT();
  const [f, setF] = useState<Init>(init);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const docsKey = kind === "vendor" ? "documents" : "registrationDocs";
  const docs = (f[docsKey] as string[]) || [];
  const hood = (f.neighbourhood as Neighbourhood) || "Koramangala";
  const [upErr, setUpErr] = useState<string | null>(null);

  const upload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({ ok: false, error: t("onb.uploadFailed") }));
    if (!j.ok) throw new Error(j.error);
    return j.data.url as string;
  };
  const addDocs = async (files: File[]) => {
    setUpErr(null);
    try {
      const urls = await Promise.all(files.map(upload));
      setF((x) => ({ ...x, [docsKey]: [...((x[docsKey] as string[]) || []), ...urls] }));
    } catch (e) { setUpErr((e as Error).message); }
  };
  const addLogo = async (file?: File) => {
    if (!file) return;
    setUpErr(null);
    try { const url = await upload(file); setF((x) => ({ ...x, logoUrl: url })); } catch (e) { setUpErr((e as Error).message); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const c = NEIGHBOURHOODS[hood];
    try {
      await api(`/api/${kind}/onboarding`, { ...f, lat: f.lat ?? c.lat, lng: f.lng ?? c.lng, neighbourhood: hood });
      setMsg({ ok: true, t: t("onb.submitted") });
      router.refresh();
    } catch (er) {
      setMsg({ ok: false, t: (er as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2">
      <fieldset disabled={locked} className="contents">
        {FIELDS[kind].map(([k, labelKey]) => (
          <label key={k} className={`label ${k === "address" || k === "handlingArrangements" ? "sm:col-span-2" : ""}`}>{t(labelKey)}
            <input className="input" value={String(f[k] ?? "")} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
        <label className="label">{t("onb.mapPin")}
          <select className="input" value={hood} onChange={(e) => { const n = e.target.value as Neighbourhood; setF({ ...f, neighbourhood: n, lat: NEIGHBOURHOODS[n].lat, lng: NEIGHBOURHOODS[n].lng }); }}>
            {Object.keys(NEIGHBOURHOODS).map((n) => <option key={n} value={n}>{hoodLabel(t, n)}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="label">{t("onb.lat")}<input className="input" value={String(f.lat ?? NEIGHBOURHOODS[hood].lat)} onChange={(e) => setF({ ...f, lat: Number(e.target.value) })} /></label>
          <label className="label">{t("onb.lng")}<input className="input" value={String(f.lng ?? NEIGHBOURHOODS[hood].lng)} onChange={(e) => setF({ ...f, lng: Number(e.target.value) })} /></label>
        </div>
        {kind === "ngo" && (
          <label className="label">{t("onb.eightyGUntil")}
            <input type="date" className="input" value={String(f.eightyGValidUntil ?? "")} onChange={(e) => setF({ ...f, eightyGValidUntil: e.target.value })} />
            <span className="font-normal">{t("onb.eightyGHelp")}</span>
          </label>
        )}
        {kind === "vendor" && (
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" className="h-5 w-5 accent-tomato" checked={!!f.payAtPickup} onChange={(e) => setF({ ...f, payAtPickup: e.target.checked })} />{t("onb.acceptPap")}</label>
        )}
        {kind === "vendor" && (
          <label className="label sm:col-span-2">{t("onb.logo")}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="input" onChange={(e) => addLogo(e.target.files?.[0])} />
            <span className="font-normal">{f.logoUrl ? t("onb.logoUploaded") : t("onb.logoOptional")}</span>
          </label>
        )}
        <label className="label sm:col-span-2">{kind === "vendor" ? t("onb.docsVendor") : t("onb.docsNgo")}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="input" onChange={(e) => addDocs(Array.from(e.target.files || []))} />
          <span className="font-normal">{t("onb.docsNote")}{docs.length ? ` ${t("onb.attached", { n: docs.length })}` : ""}</span>
          {upErr && <span role="alert" className="font-semibold text-tomato">{upErr}</span>}
        </label>
        {!locked && <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? t("onb.submitting") : t("onb.submit")}</button>}
      </fieldset>
      {locked && <p className="text-sm font-semibold text-veg sm:col-span-2">{t("onb.locked")}</p>}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold sm:col-span-2 ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.t}</p>}
    </form>
  );
}
