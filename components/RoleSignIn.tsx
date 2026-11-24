"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowRight, HeartHandshake, MapPin, Store } from "lucide-react";
import { api } from "./client";

gsap.registerPlugin(useGSAP);

type Role = "customer" | "vendor" | "ngo";

/** Each side keeps the colour of its slice on the plate, so the screen feels like the slice you just clicked. */
const THEME: Record<Role, { panel: string; word: string; title: string; sub: string; label: string; Icon: typeof MapPin; chip: string }> = {
  customer: { panel: "bg-tomato text-cream", word: "EAT", title: "FIND FOOD NEAR ME", sub: "Grab discounted surplus from kitchens near you tonight.", label: "customer", Icon: MapPin, chip: "bg-cream text-tomato" },
  vendor: { panel: "bg-peach text-burgundy", word: "LIST", title: "LIST SURPLUS AS A VENDOR", sub: "Turn today's extra into rescued meals in under a minute.", label: "vendor", Icon: Store, chip: "bg-burgundy text-peach" },
  ngo: { panel: "bg-burgundy text-peach", word: "FEED", title: "COLLECT AS AN NGO", sub: "Claim free leftovers and get them to people who need them.", label: "NGO", Icon: HeartHandshake, chip: "bg-peach text-burgundy" },
};

export function RoleSignIn({ role, actor, skipName }: { role: Role; actor: { name: string; role: string } | null; skipName: string }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const t = THEME[role];
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

  const finish = (home: string) => { router.push(home); router.refresh(); };

  const verify = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api<{ home: string }>("/api/auth/signup", { name, phone, otp, role });
      finish(r.home);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      if (msg.startsWith("First time here?")) { setStep("phone"); setOtp(""); setTimeout(() => nameRef.current?.focus(), 0); }
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
      <section className={`rs-panel relative flex flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-24 text-center sm:px-10 lg:py-14 ${t.panel}`} aria-label={`Sign in as a ${t.label}`}>
        {/* the back button is pinned to the corner so the text group below sits in the true centre of the panel.
            The animated element is a plain wrapper: a CSS opacity transition on the link itself would fight GSAP's fade. */}
        <div className="rs-fade absolute left-6 top-6 sm:left-10 sm:top-8">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-current px-4 text-sm font-semibold transition hover:bg-black/10">
            <ArrowLeft size={16} aria-hidden="true" />Pick a different side
          </Link>
        </div>
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <span className={`rs-fade inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${t.chip}`}><t.Icon size={14} aria-hidden="true" />{t.label} side</span>
          <p className="rs-word display text-[26vw] leading-[0.85] sm:text-[14rem] lg:text-[11rem] xl:text-[13rem]" aria-hidden="true">{t.word}</p>
          <h1 className="rs-fade display text-3xl leading-tight sm:text-4xl">{t.title}</h1>
          <p className="rs-fade mx-auto max-w-md text-sm font-semibold opacity-90">{t.sub}</p>
        </div>
      </section>

      {/* ------------------------------------------------ right: dummy login + verification */}
      <section className="flex items-center justify-center bg-logobg px-4 py-10 sm:px-8">
        <div className="rs-card card flex w-full max-w-md flex-col gap-4 p-6">
          <div>
            <h2 className="editorial text-3xl">Sign in as a {t.label}</h2>
            <p className="mt-1 text-sm text-muted">{step === "phone" ? "Enter your mobile number. We'll send a code." : `Enter the 6-digit code for ${phone}.`}</p>
          </div>

          {actor && actor.role !== role && (
            <p role="status" className="rounded-xl bg-cream p-3 text-xs font-semibold text-burgundy">
              You&apos;re signed in as {actor.name.split(" (")[0]} ({actor.role === "ngo" ? "NGO" : actor.role}). Continuing here switches you to a {t.label} account.
            </p>
          )}

          {step === "phone" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (phoneOk) { setErr(null); setStep("otp"); } }}>
              <label className="label">Mobile number
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" inputMode="tel" autoComplete="tel" autoFocus />
              </label>
              <label className="label">Your name <span className="font-normal">(first time only)</span>
                <input ref={nameRef} className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
              </label>
              <button className="btn-primary !min-h-[48px]" disabled={!phoneOk}>Send code <ArrowRight size={16} aria-hidden="true" /></button>
            </form>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (otp.length === 6 && !busy) verify(); }}>
              <p className="rounded-lg bg-cream p-2 text-xs text-burgundy">Demo: no SMS is sent. Enter the code <b>123456</b>.</p>
              <label className="label">Verification code
                <input className="input tracking-[0.4em]" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} autoComplete="one-time-code" autoFocus />
              </label>
              <button className="btn-primary !min-h-[48px]" disabled={busy || otp.length !== 6}>{busy ? "Checking…" : "Verify and continue"}</button>
              <button type="button" className="btn-quiet" onClick={() => { setStep("phone"); setOtp(""); setErr(null); }}>Use a different number</button>
            </form>
          )}

          {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}

          <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>

          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={skip} disabled={busy} className="btn-outline !min-h-[48px]" aria-label={`Skip sign-in and use the demo ${t.label} account`}>
              Skip, use demo {t.label}
            </button>
            <p className="text-center text-[11px] text-muted">Demo only: signs you in as {skipName}.</p>
          </div>

          <Link href="/signin?all=1" className="text-center text-xs font-semibold text-muted underline">More demo accounts</Link>
        </div>
      </section>
    </div>
  );
}
