"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/components/client";
import { StatusPill } from "@/components/bits";
import { useT } from "@/components/I18n";
import { tOr } from "@/components/i18n-helpers";

type Persona = { id: string; name: string; role: string; org?: string; status?: string };
const HOME: Record<string, string> = { customer: "/c", vendor: "/v", ngo: "/n", admin: "/admin" };

export function SignInClient({ personas }: { personas: Persona[] }) {
  const router = useRouter();
  const { t } = useT();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<"customer" | "vendor" | "ngo">("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [googleNote, setGoogleNote] = useState(false);

  const go = async (fn: () => Promise<{ role: string; home?: string }>, redirectFor?: (r: string) => string) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fn();
      if (r.home) router.replace(r.home); else router.push(redirectFor ? redirectFor(r.role) : HOME[r.role]); // (restaurant home: replace, so the browser Back button cannot return to this page)
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-5" aria-labelledby="demo-h">
        <h2 id="demo-h" className="editorial text-2xl">{t("signin.demoTitle")}</h2>
        <p className="mb-3 text-xs text-muted">{t("signin.demoHelp")}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {personas.map((p) => (
            <li key={p.id}>
              <button disabled={busy} onClick={() => go(() => api("/api/auth/demo", { userId: p.id }))} className="flex w-full flex-col items-start gap-1 rounded-xl border-2 border-line bg-white p-3 text-left hover:border-tomato">
                <span className="text-[11px] font-bold uppercase tracking-wider text-tomato">{tOr(t, `signin.role.${p.role}`, p.role)}</span>
                <span className="text-sm font-semibold">{p.name}</span>
                {p.org && <span className="text-xs text-muted">{p.org}</span>}
                {p.status && <StatusPill status={p.status} />}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="new-h">
        <h2 id="new-h" className="editorial text-2xl">{t("signin.newTitle")}</h2>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="label mb-1">{t("signin.iAm")}</legend>
          {(["customer", "vendor", "ngo"] as const).map((r) => (
            <label key={r} className={`chip cursor-pointer border-2 ${role === r ? "border-tomato bg-tomato text-white" : "border-line bg-white text-burgundy"}`}>
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
              {t(`signin.role.${r}`)}
            </label>
          ))}
        </fieldset>
        <p className="text-[11px] text-muted">{t("signin.adminNote")}</p>
        <label className="label">{t("signin.name")}<input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        <label className="label">{t("signin.phone")}<input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" inputMode="tel" autoComplete="tel" /></label>
        {!otpSent ? (
          <button className="btn-primary" disabled={!phone || !name} onClick={() => setOtpSent(true)}>{t("signin.sendOtp")}</button>
        ) : (
          <>
            <p className="rounded-lg bg-cream p-2 text-xs text-burgundy">{t("signin.otpNote")} <b>123456</b>.</p>
            <label className="label">{t("signin.otp")}<input className="input tracking-[0.4em]" value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={6} autoComplete="one-time-code" /></label>
            <button className="btn-primary" disabled={busy || otp.length !== 6} onClick={() => go(() => api("/api/auth/signup", { name, phone, otp, role }), (r) => (r === "vendor" ? "/v/onboarding" : r === "ngo" ? "/n/onboarding" : "/c"))}>
              {t("signin.verify")}
            </button>
          </>
        )}
        <button className="btn-quiet" onClick={() => setGoogleNote(true)}>{t("signin.google")}</button>
        {googleNote && <p role="status" className="text-xs text-muted">{t("signin.googleNote")}</p>}
        {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
      </section>
    </div>
  );
}
