"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./client";
import { NEIGHBOURHOODS, type Neighbourhood } from "@/lib/geo";

type Init = Record<string, string | number | boolean | string[] | undefined>;

const FIELDS = {
  vendor: [
    ["businessName", "Business name *"], ["contactName", "Contact name *"], ["phone", "Phone *"], ["email", "Email"],
    ["address", "Outlet address *"], ["fssaiNumber", "FSSAI licence / registration number *"], ["operatingHours", "Operating hours *"], ["payoutUpi", "Payout UPI ID *"],
  ],
  ngo: [
    ["orgName", "Organisation name *"], ["contactPerson", "Contact person *"], ["phone", "Phone *"], ["email", "Email"], ["address", "Collection address *"],
    ["serviceAreaKm", "Service area (km)"], ["capacityMeals", "Collection capacity (meals per day) *"], ["handlingArrangements", "Food handling, storage and transport *"], ["fssaiInfo", "FSSAI registration (if applicable)"],
  ],
} as const;

export function OnboardingForm({ kind, init, locked }: { kind: "vendor" | "ngo"; init: Init; locked?: boolean }) {
  const router = useRouter();
  const [f, setF] = useState<Init>(init);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const docsKey = kind === "vendor" ? "documents" : "registrationDocs";
  const docs = (f[docsKey] as string[]) || [];
  const hood = (f.neighbourhood as Neighbourhood) || "Koramangala";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const c = NEIGHBOURHOODS[hood];
    try {
      await api(`/api/${kind}/onboarding`, { ...f, lat: f.lat ?? c.lat, lng: f.lng ?? c.lng, neighbourhood: hood });
      setMsg({ ok: true, t: "Submitted. Status: Pending until an administrator reviews it." });
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
        {FIELDS[kind].map(([k, label]) => (
          <label key={k} className={`label ${k === "address" || k === "handlingArrangements" ? "sm:col-span-2" : ""}`}>{label}
            <input className="input" value={String(f[k] ?? "")} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
        <label className="label">Map pin — neighbourhood
          <select className="input" value={hood} onChange={(e) => { const n = e.target.value as Neighbourhood; setF({ ...f, neighbourhood: n, lat: NEIGHBOURHOODS[n].lat, lng: NEIGHBOURHOODS[n].lng }); }}>
            {Object.keys(NEIGHBOURHOODS).map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="label">Pin latitude<input className="input" value={String(f.lat ?? NEIGHBOURHOODS[hood].lat)} onChange={(e) => setF({ ...f, lat: Number(e.target.value) })} /></label>
          <label className="label">Pin longitude<input className="input" value={String(f.lng ?? NEIGHBOURHOODS[hood].lng)} onChange={(e) => setF({ ...f, lng: Number(e.target.value) })} /></label>
        </div>
        {kind === "vendor" && (
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" className="h-5 w-5 accent-tomato" checked={!!f.payAtPickup} onChange={(e) => setF({ ...f, payAtPickup: e.target.checked })} />Accept pay-at-pickup orders</label>
        )}
        <label className="label sm:col-span-2">{kind === "vendor" ? "Supporting documents (FSSAI certificate, ID)" : "Registration documents (12A/80G, trust deed) *"}
          <input type="file" multiple className="input" onChange={(e) => setF({ ...f, [docsKey]: [...docs, ...Array.from(e.target.files || []).map((x) => x.name)] })} />
          <span className="font-normal">Demo mode records file names only; files are uploaded to Supabase Storage once it is configured.{docs.length ? ` Attached: ${docs.join(", ")}` : ""}</span>
        </label>
        {!locked && <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</button>}
      </fieldset>
      {locked && <p className="text-sm font-semibold text-veg sm:col-span-2">Approved. Contact the platform team to change verified details.</p>}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold sm:col-span-2 ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.t}</p>}
    </form>
  );
}
