"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowRight, HeartHandshake, MapPin, Store } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";

gsap.registerPlugin(useGSAP);

type Role = "customer" | "vendor" | "ngo";

/** Each side keeps the colour of its slice on the plate, so the screen feels like the slice you just clicked. */
const THEME: Record<Role, { panel: string; Icon: typeof MapPin; chip: string }> = {
  customer: { panel: "bg-tomato text-cream", Icon: MapPin, chip: "bg-cream text-tomato" },
  vendor: { panel: "bg-peach text-burgundy", Icon: Store, chip: "bg-burgundy text-peach" },
  ngo: { panel: "bg-burgundy text-peach", Icon: HeartHandshake, chip: "bg-peach text-burgundy" },
};

export function RoleSignIn({ role, actor, skipName, next, refCode }: { role: Role; actor: { name: string; role: string } | null; skipName: string; next?: string; refCode?: string }) {
  const [referral, setReferral] = useState(refCode ?? "");
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const { t } = useT();
  const th = THEME[role];
  const label = t(`rs.label.${role}`);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const phoneOk = phone.replace(/\D/g, "").length >= 10;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(".rs-panel", { clipPath: "inset(0 100% 0 0)", duration: 0.7, ease: "power4.inOut" })
          .from(".rs-word", { yPercent: 40, opacity: 0, duration: 0.6 }, 0.25)
          .from(".rs-fade", { y: 18, opacity: 0, duration: 0.5, stagger: 0.07 }, 0.35)
          .from(".rs-card", { y: 24, opacity: 0, duration: 0.55 }, 0.3);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const finish = (home: string) => { router.push(next ?? home); router.refresh(); };

  const verify = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api<{ home: string }>("/api/auth/signup", { name, phone, otp, role, referralCode: role === "customer" ? referral : undefined });
      finish(r.home);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      if ((e as { code?: string }).code === "name_required") { setStep("phone"); setOtp(""); setTimeout(() => nameRef.current?.focus(), 0); }
    } finally { setBusy(false); }
  };

  const skip = async () => {
    setBusy(true); setErr(null);
    try { const r = await api<{ home: string }>("/api/auth/skip", { role }); finish(r.home); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  return (
    <div ref={root} className="grid min-h-[calc(100svh-190px)] lg:grid-cols-2">
      {/* ------------------------------------------------ left: the slice you picked */}
      <section className={`rs-panel relative flex flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-24 text-center sm:px-10 lg:py-14 ${th.panel}`} aria-label={t("rs.signInAs", { role: label })}>
        {/* the back button is pinned to the corner so the text group below sits in the true centre of the panel.
            The animated element is a plain wrapper: a CSS opacity transition on the link itself would fight GSAP's fade. */}
        <div className="rs-fade absolute left-6 top-6 sm:left-10 sm:top-8">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-current px-4 text-sm font-semibold transition hover:bg-black/10">
            <ArrowLeft size={16} aria-hidden="true" />{t("rs.pickOther")}
          </Link>
        </div>
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <span className={`rs-fade inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${th.chip}`}><th.Icon size={14} aria-hidden="true" />{t("rs.side", { role: label })}</span>
          <p className="rs-word display text-[26vw] leading-[0.85] sm:text-[14rem] lg:text-[11rem] xl:text-[13rem]" aria-hidden="true">{t(`rs.word.${role}`)}</p>
          <h1 className="rs-fade display text-3xl leading-tight sm:text-4xl">{t(`rs.title.${role}`)}</h1>
          <p className="rs-fade mx-auto max-w-md text-sm font-semibold opacity-90">{t(`rs.sub.${role}`)}</p>
        </div>
      </section>

      {/* ------------------------------------------------ right: dummy login + verification */}
      <section className="flex items-center justify-center bg-logobg px-4 py-10 sm:px-8">
        <div className="rs-card card flex w-full max-w-md flex-col gap-4 p-6">
          <div>
            <h2 className="editorial text-3xl">{t("rs.signInAs", { role: label })}</h2>
            <p className="mt-1 text-sm text-muted">{step === "phone" ? t("rs.enterPhone") : t("rs.enterCode", { phone })}</p>
          </div>

          {actor && actor.role !== role && (
            <p role="status" className="rounded-xl bg-cream p-3 text-xs font-semibold text-burgundy">
              {t("rs.switching", { name: actor.name.split(" (")[0], from: t(`rs.label.${actor.role === "customer" || actor.role === "vendor" || actor.role === "ngo" ? actor.role : "customer"}`), to: label })}
            </p>
          )}

          {step === "phone" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (phoneOk) { setErr(null); setStep("otp"); } }}>
              <label className="label">{t("rs.mobile")}
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" inputMode="tel" autoComplete="tel" autoFocus />
              </label>
              <label className="label">{t("rs.name")} <span className="font-normal">{t("rs.firstTime")}</span>
                <input ref={nameRef} className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
              </label>
              {role === "customer" && (
                <label className="label">{t("rs.referral")} <span className="font-normal">{t("rs.optionalFirst")}</span>
                  <input className="input uppercase tracking-widest" value={referral} onChange={(e) => setReferral(e.target.value)} maxLength={16} autoComplete="off" />
                </label>
              )}
              <button className="btn-primary !min-h-[48px]" disabled={!phoneOk}>{t("rs.sendCode")} <ArrowRight size={16} aria-hidden="true" /></button>
            </form>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (otp.length === 6 && !busy) verify(); }}>
              <p className="rounded-lg bg-cream p-2 text-xs text-burgundy">{t("rs.demoCode1")} <b>123456</b>{t("rs.demoCode2")}</p>
              <label className="label">{t("rs.code")}
                <input className="input tracking-[0.4em]" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} autoComplete="one-time-code" autoFocus />
              </label>
              <button className="btn-primary !min-h-[48px]" disabled={busy || otp.length !== 6}>{busy ? t("rs.checking") : t("rs.verify")}</button>
              <button type="button" className="btn-quiet" onClick={() => { setStep("phone"); setOtp(""); setErr(null); }}>{t("rs.otherNumber")}</button>
            </form>
          )}

          {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}

          <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true"><span className="h-px flex-1 bg-line" />{t("rs.or")}<span className="h-px flex-1 bg-line" /></div>

          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={skip} disabled={busy} className="btn-outline !min-h-[48px]" aria-label={t("rs.skipAria", { role: label })}>
              {t("rs.skip", { role: label })}
            </button>
            <p className="text-center text-[11px] text-muted">{t("rs.skipNote", { name: skipName })}</p>
          </div>

          <Link href="/signin?all=1" className="text-center text-xs font-semibold text-muted underline">{t("rs.moreAccounts")}</Link>
        </div>
      </section>
    </div>
  );
}
