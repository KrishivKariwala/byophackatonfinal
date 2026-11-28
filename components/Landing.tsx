"use client";
import { ARRIVE_KEY, SEEN_KEY } from "@/lib/arrival";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useT } from "./I18n";
import { useGSAP } from "@gsap/react";
import { ArrowRight, HeartHandshake, MapPin, Store } from "lucide-react";
import { Logo } from "./Logo";

gsap.registerPlugin(useGSAP, SplitText);

/* ------------------------------------------------------------------------------------------------
 * Landing hero: copy on the left, a full pie "plate" on the right (one slice per side).
 *
 * Opening animation (first visit per browser session, skipped for reduced motion):
 *   1. Red + burgundy halves meet; the plate spins up from a standstill while a 0 to 100% bar fills (speed ramps up).
 *   2. At 100% the curtains slide apart, the plate decelerates and flies into the hero plate's exact spot.
 *   3. The headline rises letter by letter, then a gold wave runs once through every letter.
 * Refreshes and later visits get a quick re-entry instead: the wheel whirls and settles while the gold wave runs through the headline. A Skip button / Esc fast-forwards the intro.
 *
 * Interaction model for the plate (keeps junctions from flickering):
 *   - VISUAL slices animate freely but never receive the pointer (pointer-events: none).
 *   - A separate, STATIC hit layer of three transparent wedges owns hover, focus and click.
 *   - The "pop" effect is an overlay copy of the hovered slice drawn above the visuals.
 * ---------------------------------------------------------------------------------------------- */

const CX = 300, CY = 300;
const R_OUT = 236; // pie radius
const R_HUB = 62;
const GOLD = "#F4B63F";
const rad = (d: number) => (d * Math.PI) / 180;
const polar = (a: number, r: number) => ({ x: CX + r * Math.cos(rad(a)), y: CY + r * Math.sin(rad(a)) });
const f = (n: number) => +n.toFixed(2);

/** Full wedge from the centre: slices meet exactly, with no gaps. */
function wedge(a0: number, a1: number, r = R_OUT) {
  const p0 = polar(a0, r), p1 = polar(a1, r);
  return `M${CX} ${CY} L${f(p0.x)} ${f(p0.y)} A${r} ${r} 0 0 1 ${f(p1.x)} ${f(p1.y)} Z`;
}
type SliceId = "customer" | "vendor" | "ngo";
type Slice = {
  id: SliceId; a0: number; a1: number; color: string; ink: string; lines: [string, string]; word: string; sub: string; Icon: typeof MapPin; aria: string;
};
type SliceBase = Omit<Slice, "lines" | "word" | "sub" | "aria">;
// Each slice is ONE flat colour (brand tomato, peach, burgundy): the same shade from the hub to the edge.
const SLICE_BASE: SliceBase[] = [
  { id: "customer", a0: -150, a1: -30, color: "#CB0001", ink: "#FEF2C0", Icon: MapPin },
  { id: "vendor", a0: -30, a1: 90, color: "#FDD599", ink: "#790000", Icon: Store },
  { id: "ngo", a0: 90, a1: 210, color: "#790000", ink: "#FDD599", Icon: HeartHandshake },
];
/** The slice artwork with its words in the visitor's language (keys land.s.<id>.*). */
function useSlices(): Slice[] {
  const { t } = useT();
  return SLICE_BASE.map((b) => ({ ...b, lines: [t(`land.s.${b.id}.l1`), t(`land.s.${b.id}.l2`)] as [string, string], word: t(`land.s.${b.id}.word`), sub: t(`land.s.${b.id}.sub`), aria: t(`land.s.${b.id}.aria`) }));
}
const mid = (s: SliceBase) => (s.a0 + s.a1) / 2;
const REDUCED = "(prefers-reduced-motion: reduce)";

/** Shared gradients / filters. `p` prefixes every id so the hero plate and the intro plate can coexist in one document. */
function PlateDefs({ p }: { p: string }) {
  return (
    <defs>
      <radialGradient id={`${p}rimGrad`} cx="50%" cy="38%" r="70%"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".72" stopColor="#FFF8E6" /><stop offset="1" stopColor="#E9D9B2" /></radialGradient>
      <radialGradient id={`${p}wellGrad`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFFDF5" /><stop offset=".8" stopColor="#F8EBCD" /><stop offset="1" stopColor="#E7D3A8" /></radialGradient>
      <filter id={`${p}blur6`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7" /></filter>
      <filter id={`${p}popShadow`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#2A0A0A" floodOpacity=".45" /></filter>
    </defs>
  );
}

/** One slice as drawn artwork (used for the base pie, the hover "pop" overlay and the intro plate). */
function SliceArt({ s }: { s: Slice }) {
  const { locale } = useT();
  const fs = locale === "en" ? 21 : 16; // Devanagari and Kannada run wider than the Latin display face
  const pt = polar(mid(s), 146);
  return (
    <>
      {/* one flat colour per slice: identical shade from the hub to the edge, no gradient, no highlight, no texture */}
      <path d={wedge(s.a0, s.a1)} fill={s.color} stroke={s.color} strokeWidth="1" strokeLinejoin="round" />
      <g style={{ fill: s.ink, color: s.ink }}>
        <s.Icon x={pt.x - 18} y={pt.y - 60} width={36} height={36} strokeWidth={2.25} />
        <text x={pt.x} y={pt.y - 2} textAnchor="middle" className="display" fontSize={fs} fill={s.ink}>{s.lines[0]}</text>
        <text x={pt.x} y={pt.y + 24} textAnchor="middle" className="display" fontSize={fs} fill={s.ink}>{s.lines[1]}</text>
      </g>
    </>
  );
}

/** Rim + bevel + well. `c` is the class prefix used by the hero's idle animation ("plate") or the intro ("ip"). */
function PlateBase({ p, c }: { p: string; c: string }) {
  return (
    <>
      <g className={`${c}-rim`}>
        <circle cx={CX} cy={CY} r="292" fill={`url(#${p}rimGrad)`} stroke="#E0CB9E" strokeWidth="3" />
        <circle cx={CX} cy={CY} r="283" fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="3" />
        <circle className={`${c}-dashes`} cx={CX} cy={CY} r="270" fill="none" stroke="#CB0001" strokeOpacity=".35" strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="257" fill="#F4E4C0" stroke="#E0CB9E" strokeWidth="2" />
      </g>
      <g className={`${c}-well`}>
        <circle cx={CX} cy={CY + 8} r="244" fill="#2A0A0A" opacity=".16" filter={`url(#${p}blur6)`} />
        <circle cx={CX} cy={CY} r="247" fill={`url(#${p}wellGrad)`} stroke="#D9C291" strokeWidth="2" />
      </g>
    </>
  );
}

/** Non-interactive copy of the plate used by the opening animation (static hub). */
function IntroPlate() {
  const { t } = useT();
  const slices = useSlices();
  return (
    <svg viewBox="0 0 600 600" aria-hidden="true" className="block h-full w-full overflow-visible drop-shadow-[0_26px_26px_rgba(42,10,10,0.35)]">
      <PlateDefs p="i-" />
      <PlateBase p="i-" c="ip" />
      {slices.map((s) => (<g key={s.id}><SliceArt s={s} /></g>))}
      <circle cx={CX} cy={CY} r={R_HUB + 6} fill="#2A0A0A" opacity=".18" filter="url(#i-blur6)" />
      <circle cx={CX} cy={CY} r={R_HUB} fill="url(#i-rimGrad)" stroke="#CB0001" strokeWidth="5" />
      <circle cx={CX} cy={CY} r={R_HUB - 12} fill="none" stroke="#CB0001" strokeOpacity=".3" strokeWidth="2" strokeDasharray="2 6" />
      <text x={CX} y={CY - 1} textAnchor="middle" className="display" fontSize="26" fill="#CB0001">{t("land.hubPick")}</text>
      <text x={CX} y={CY + 19} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.4" fill="#790000">{t("land.hubSide")}</text>
    </svg>
  );
}

/** The plate labels are stored in capitals for the slices; the plain list reads better in sentence case (English only). */
const sentenceCase = (x: string, locale: string) => (locale === "en" ? (x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).replace(/\bngo\b/g, "NGO") : x);

export function PlateHero() {
  /** A slice opens that side's own sign-in; if you're already signed in on that side it goes straight to your dashboard. */
  const sliceHref = (s: Slice) => `/signin?role=${s.id}`;
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const hubWord = useRef<SVGTextElement>(null);
  const popRef = useRef<SVGGElement>(null);
  const plateSvg = useRef<SVGSVGElement>(null);
  const introTl = useRef<gsap.core.Timeline | null>(null);
  const token = useRef(0);
  const [showIntro, setShowIntro] = useState(true); // SSR renders the overlay so there is no flash of the page before the intro
  const [active, setActive] = useState<SliceId | null>(null); // drives hub word + caption instantly
  const [pop, setPop] = useState<SliceId | null>(null); // drives the overlay (removed after its exit tween)
  const { t, locale } = useT();
  const SLICES = useSlices();
  const activeSlice = SLICES.find((s) => s.id === active) ?? null;
  const popSlice = SLICES.find((s) => s.id === pop) ?? null;

  const { contextSafe } = useGSAP(
    () => {
      const html = document.documentElement;
      let seen = false;
      try { seen = !!sessionStorage.getItem(SEEN_KEY); } catch { /* storage blocked: treat as first visit */ }
      const reduced = window.matchMedia(REDUCED).matches;
      // arriving by the logo / a Back link: show the page as it is (and count the intro as seen, so it never plays later in this tab)
      let still = false;
      try { still = sessionStorage.getItem(ARRIVE_KEY) === "1"; sessionStorage.removeItem(ARRIVE_KEY); if (still) sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
      const playIntro = !still && !seen && !reduced && !html.hasAttribute("data-sap-intro") && !!root.current?.querySelector(".intro-root");
      if (!playIntro) {
        setShowIntro(false);
        html.setAttribute("data-sap-intro", "skip");
        if (reduced || still) html.removeAttribute("data-sap-quick"); // reduced motion or a plain arrival: show the page as-is, nothing to hide
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cleanups: (() => void)[] = [];

        if (playIntro) {
          // ------------------------------------------------------------------ opening animation
          const q = <T extends Element>(s: string) => root.current!.querySelector<T>(s)!;
          const spin = q<HTMLElement>(".intro-spin"), introPlate = q<HTMLElement>(".intro-plate");
          const pct = q<HTMLElement>(".intro-pct"), bar = q<HTMLElement>(".intro-bar i");
          const prevOverflow = html.style.overflow;
          html.style.overflow = "hidden";
          cleanups.push(() => { html.style.overflow = prevOverflow; });

          gsap.set(".plate-wrap", { opacity: 0 });
          gsap.set(".hero-fade", { opacity: 0, y: 14 });
          const split = SplitText.create(".hero-word", { type: locale === "en" ? "chars" : "words", charsClass: "ch", wordsClass: "wd" });
          gsap.set((locale === "en" ? split.chars : split.words), { yPercent: 125 });

          const finish = () => {
            try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
            html.setAttribute("data-sap-intro", "done");
            html.style.overflow = prevOverflow;
            gsap.set((locale === "en" ? split.chars : split.words), { clearProps: "color" });
            gsap.set(".plate-wrap", { clearProps: "opacity" });
            introTl.current = null;
            setShowIntro(false);
          };

          // Speed ramps up with power3.in over D1 (TH1 degrees), then power3.out over D2 (TH2 degrees).
          // TH2 = TH1 * D2 / D1 makes the speed identical at the hand-off, and 864 + 576 = 4 full turns, so the plate lands upright.
          const D1 = 1.8, D2 = 1.2, TH1 = 864, TH2 = 576;
          const o = { r: 0 };
          const target = () => plateSvg.current!.getBoundingClientRect();
          const onScreen = () => target().top < window.innerHeight * 0.8; // on phones the hero plate sits below the fold
          const tl = gsap.timeline({ onComplete: finish });
          introTl.current = tl;
          tl.from(introPlate, { scale: 0.4, opacity: 0, duration: 0.5, ease: "back.out(1.6)" })
            .to(o, {
              r: TH1, duration: D1, ease: "power3.in",
              onUpdate() {
                const p = o.r / TH1;
                gsap.set(spin, { rotation: o.r });
                gsap.set(bar, { scaleX: p });
                pct.textContent = Math.round(p * 100) + "%";
              },
            }, 0.2)
            .add("open", "+=.08")
            .to(".intro-meter", { opacity: 0, y: 12, duration: 0.3 }, "open")
            .to(".intro-skip", { opacity: 0, duration: 0.3 }, "open")
            .to(".intro-l", { xPercent: -101, duration: 1.1, ease: "expo.inOut" }, "open")
            .to(".intro-r", { xPercent: 101, duration: 1.1, ease: "expo.inOut" }, "open")
            .to(o, { r: TH1 + TH2, duration: D2, ease: "power3.out", onUpdate() { gsap.set(spin, { rotation: o.r }); } }, "open")
            // fly the intro plate onto the hero plate (measured when the move starts, so layout changes are respected)
            .to(introPlate, {
              x: () => { if (!onScreen()) return 0; const t = target(), r = introPlate.getBoundingClientRect(); return t.left + t.width / 2 - (r.left + r.width / 2); },
              y: () => { if (!onScreen()) return 0; const t = target(), r = introPlate.getBoundingClientRect(); return t.top + t.height / 2 - (r.top + r.height / 2); },
              scale: () => { if (!onScreen()) return 1.15; const t = target(); return Math.min(t.width, t.height) / introPlate.getBoundingClientRect().width; },
              opacity: () => (onScreen() ? 1 : 0),
              duration: 1.1, ease: "expo.inOut",
            }, "open")
            .add(() => { gsap.set(".plate-wrap", { opacity: 1 }); gsap.set(".intro-root", { display: "none" }); }, "open+=1.12")
            // headline: letters rise fast, one by one
            .to((locale === "en" ? split.chars : split.words), { yPercent: 0, duration: 0.5, stagger: { each: 0.016 }, ease: "power4.out" }, "open+=.45")
            .to(".hero-fade", { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }, "open+=.75")
            // gold wave: each letter flashes gold and settles back, travelling once through the headline
            .to((locale === "en" ? split.chars : split.words), { keyframes: [{ color: GOLD, duration: 0.12, ease: "power1.out" }, { color: "#CB0001", duration: 0.3, ease: "power1.in" }], stagger: { each: 0.026 } }, "open+=1.2");

          const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") gsap.to(tl, { timeScale: 12, duration: 0.25, overwrite: true }); };
          window.addEventListener("keydown", onKey);
          cleanups.push(() => window.removeEventListener("keydown", onKey));
        } else if (!still) {
          // ------------------------------------------------------------------ quick re-entry (refresh / returning visitors)
          // No loader, no curtains. One thing after the other: first the wheel whirls and settles (power3.out starts fast
          // and ends at rest; 1.5 turns lands it upright) while the headline letters rise into place, THEN the gold wave
          // runs through the letters. About 2 s in total.
          const WHIRL = 1.15;
          const split = SplitText.create(".hero-word", { type: locale === "en" ? "chars" : "words", charsClass: "ch", wordsClass: "wd" });
          gsap.set((locale === "en" ? split.chars : split.words), { yPercent: 125 });
          gsap.set(".hero-fade", { opacity: 0, y: 20 });
          gsap.set(".plate-wrap", { opacity: 0, rotation: -540, scale: 0.82 });
          gsap.set(".plate-hub", { scale: 0, svgOrigin: "300 300" });
          html.removeAttribute("data-sap-quick"); // the start states above now hold, so the CSS pre-hide (no flash) can go
          const tl = gsap.timeline({ onComplete: () => { gsap.set((locale === "en" ? split.chars : split.words), { clearProps: "color" }); } });
          tl.to(".hero-fade", { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power3.out" }, 0.1)
            .to((locale === "en" ? split.chars : split.words), { yPercent: 0, duration: 0.45, stagger: { each: 0.014 }, ease: "power4.out" }, 0)
            .to(".plate-wrap", { opacity: 1, rotation: 0, scale: 1, duration: WHIRL, ease: "power3.out" }, 0)
            .to(".plate-hub", { scale: 1, svgOrigin: "300 300", duration: 0.6, ease: "elastic.out(1, 0.6)" }, WHIRL - 0.35)
            // the gold wave starts only once the wheel has come to rest
            .add("settled", WHIRL)
            .to((locale === "en" ? split.chars : split.words), { keyframes: [{ color: GOLD, duration: 0.1, ease: "power1.out" }, { color: "#CB0001", duration: 0.28, ease: "power1.in" }], stagger: { each: 0.018 } }, "settled");
        }

        // idle motion: the rim dashes turn slowly
        gsap.to(".plate-dashes", { rotate: 360, svgOrigin: "300 300", duration: 120, ease: "none", repeat: -1 });

        // pointer: plate leans gently toward the cursor (the hit layer is inside the plate, so hover stays exact)
        if (window.matchMedia("(pointer: fine)").matches && root.current) {
          const rx = gsap.quickTo(".plate-wrap", "rotationX", { duration: 0.7, ease: "power3.out" });
          const ry = gsap.quickTo(".plate-wrap", "rotationY", { duration: 0.7, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            const r = root.current!.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            ry(nx * 8); rx(-ny * 8);
          };
          const onLeave = () => { rx(0); ry(0); };
          const el = root.current;
          el.addEventListener("pointermove", onMove);
          el.addEventListener("pointerleave", onLeave);
          cleanups.push(() => { el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); });
        }
        return () => cleanups.forEach((fn) => fn());
      });
      return () => { mm.revert(); introTl.current = null; };
    },
    { scope: root },
  );

  // overlay entrance whenever a new slice is popped
  useEffect(() => {
    if (!pop || !popRef.current || window.matchMedia(REDUCED).matches) return;
    gsap.fromTo(popRef.current, { opacity: 0, scale: 1, svgOrigin: "300 300" }, { opacity: 1, scale: 1.055, svgOrigin: "300 300", duration: 0.35, ease: "back.out(2.2)", overwrite: true });
  }, [pop]);

  const skipIntro = contextSafe(() => {
    if (introTl.current) gsap.to(introTl.current, { timeScale: 12, duration: 0.25, overwrite: true });
  });

  const enter = contextSafe((s: Slice) => {
    token.current++;
    setActive(s.id);
    setPop(s.id);
    if (window.matchMedia(REDUCED).matches) return;
    gsap.to(`.plate-slice:not(.slice-${s.id})`, { opacity: 0.82, duration: 0.25, overwrite: "auto" });
    gsap.to(`.slice-${s.id}`, { opacity: 1, duration: 0.2, overwrite: "auto" });
    gsap.fromTo(hubWord.current, { scale: 0.5, opacity: 0, svgOrigin: "300 300" }, { scale: 1, opacity: 1, svgOrigin: "300 300", duration: 0.4, ease: "back.out(2.5)" });
    gsap.fromTo(caption.current, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
  });

  const leave = contextSafe(() => {
    const t = ++token.current;
    setActive(null);
    if (window.matchMedia(REDUCED).matches) { setPop(null); return; }
    gsap.to(".plate-slice", { opacity: 1, duration: 0.25, overwrite: "auto" });
    if (popRef.current)
      gsap.to(popRef.current, { opacity: 0, scale: 1, svgOrigin: "300 300", duration: 0.2, overwrite: true, onComplete: () => { if (token.current === t) setPop(null); } });
    else setPop(null);
  });

  const go = contextSafe((e: React.MouseEvent, s: Slice) => {
    e.preventDefault();
    if (window.matchMedia(REDUCED).matches) { router.push(sliceHref(s)); return; }
    token.current++;
    gsap.timeline({ onComplete: () => router.push(sliceHref(s)) })
      .to(popRef.current, { scale: 1.5, opacity: 0, svgOrigin: "300 300", duration: 0.5, ease: "power2.in" })
      .to(`.slice-${s.id}`, { scale: 1.5, opacity: 0, svgOrigin: "300 300", duration: 0.5, ease: "power2.in" }, "<")
      .to(`.plate-slice:not(.slice-${s.id})`, { opacity: 0, duration: 0.3 }, "<");
  });

  const hubTop = activeSlice ? activeSlice.word : t("land.hubPick");
  const hubBottom = activeSlice ? t("land.hubSignIn") : t("land.hubSide");

  return (
    <div ref={root} className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:min-h-[calc(100svh-190px)] lg:grid-cols-[1fr_1.1fr] lg:gap-6 lg:py-6">
      {/* ---------------------------------------------------------------- opening animation overlay */}
      {showIntro && (
        <div className="intro-root fixed inset-0 z-[70]" style={{ ["--ip" as string]: "min(72vw, 46svh)" }}>
          <div className="intro-l absolute inset-y-0 left-0 w-[50.2%] bg-tomato" />
          <div className="intro-r absolute inset-y-0 right-0 w-[50.2%] bg-burgundy" />
          {/* the shadow sits on this non-rotating wrapper, so it stays put while the plate spins inside it */}
          <div className="intro-plate absolute left-1/2 top-[44%]" style={{ width: "var(--ip)", height: "var(--ip)", marginLeft: "calc(var(--ip) / -2)", marginTop: "calc(var(--ip) / -2)" }}>
            <div className="intro-spin h-full w-full will-change-transform"><IntroPlate /></div>
          </div>
          <div className="intro-meter absolute inset-x-0 bottom-[9svh] text-center text-cream">
            <p className="sr-only" role="status">{t("land.loading")}</p>
            <div className="intro-pct display text-5xl leading-none sm:text-6xl" aria-hidden="true">0%</div>
            <div className="intro-bar mx-auto mt-3 h-1.5 w-[min(60vw,420px)] overflow-hidden rounded-full bg-cream/25" aria-hidden="true"><i className="block h-full origin-left scale-x-0 bg-peach" /></div>
            <p className="eyebrow mt-3 opacity-85" aria-hidden="true">{t("land.plating")}</p>
          </div>
          <button type="button" onClick={skipIntro} aria-label={t("land.skipAria")}
            className="intro-skip absolute bottom-5 right-5 inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-cream/60 px-5 text-sm font-semibold text-cream transition hover:bg-cream hover:text-burgundy">
            {t("land.skip")}<ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- left: copy */}
      <div className="flex flex-col items-start gap-5 text-left">
        <div className="hero-fade overflow-hidden rounded-3xl"><Logo width={150} priority /></div>
        <p className="hero-fade eyebrow text-burgundy">{t("land.eyebrow")}</p>
        <h1 className="display text-5xl leading-[0.95] text-tomato sm:text-6xl xl:text-7xl" aria-label={t("land.headlineAria")}>
          {t("land.headline").split(" ").map((w, i) => (
            <span key={`${i}-${w}`} className="mr-3 inline-block overflow-hidden align-bottom" aria-hidden="true"><span className="hero-word inline-block">{w}</span></span>
          ))}
        </h1>
        <p className="hero-fade max-w-md text-base normal-case leading-relaxed text-burgundy/80">
          {t("land.tagline")}
        </p>
        <div className="hero-fade flex w-full max-w-sm flex-col gap-1">
          <p className="eyebrow text-burgundy">{t("land.pickSide")}</p>
          <ul className="flex flex-col divide-y divide-burgundy/15 border-y border-burgundy/15">
            {SLICES.map((s) => (
              <li key={s.id}>
                <Link href={sliceHref(s)} onMouseEnter={() => enter(s)} onMouseLeave={leave} onFocus={() => enter(s)} onBlur={leave}
                  className="group flex min-h-[48px] items-center justify-between gap-3 py-2 text-sm font-semibold text-burgundy transition hover:text-tomato">
                  <span className="flex items-center gap-2.5"><s.Icon size={18} aria-hidden="true" />{sentenceCase(s.lines.join(" "), locale)}</span>
                  <ArrowRight size={16} aria-hidden="true" className="transition group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------------------------------------------------------------- right: the plate */}
      <div className="relative mx-auto flex w-full max-w-[640px] flex-col items-center gap-3">

        <div className="w-full" style={{ perspective: 1100 }}>
          <div className="plate-wrap w-full will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            <svg ref={plateSvg} viewBox="0 0 600 600" role="group" aria-label={t("land.plateAria")} className="mx-auto max-h-[calc(100svh-250px)] min-h-[280px] w-full drop-shadow-[0_26px_26px_rgba(121,0,0,0.30)]">
              <PlateDefs p="" />
              <PlateBase p="" c="plate" />

              {/* visual slices: animated, never receive the pointer */}
              <g pointerEvents="none">
                {SLICES.map((s) => (
                  <g key={s.id} className={`plate-slice slice-${s.id}`}><SliceArt s={s} /></g>
                ))}
              </g>

              {/* hover "pop" overlay: a lifted copy of the active slice */}
              <g ref={popRef} className="plate-pop" pointerEvents="none" filter="url(#popShadow)" opacity="0">
                {popSlice ? <SliceArt s={popSlice} /> : null}
              </g>

              {/* hub medallion */}
              <g className="plate-hub" pointerEvents="none">
                <circle cx={CX} cy={CY} r={R_HUB + 6} fill="#2A0A0A" opacity=".18" filter="url(#blur6)" />
                <circle cx={CX} cy={CY} r={R_HUB} fill="url(#rimGrad)" stroke="#CB0001" strokeWidth="5" />
                <circle cx={CX} cy={CY} r={R_HUB - 12} fill="none" stroke="#CB0001" strokeOpacity=".3" strokeWidth="2" strokeDasharray="2 6" />
                <text ref={hubWord} x={CX} y={CY - 1} textAnchor="middle" className="display" fontSize="26" fill={activeSlice ? (activeSlice.id === "vendor" ? "#790000" : activeSlice.color) : "#CB0001"}>{hubTop}</text>
                <text x={CX} y={CY + 19} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.4" fill="#790000">{hubBottom}</text>
              </g>

              {/* STATIC hit layer: exact 120° wedges, always on top, owns hover / focus / click */}
              <g>
                {SLICES.map((s) => (
                  <a key={s.id} href={sliceHref(s)} aria-label={s.aria} onClick={(e) => go(e, s)} onMouseEnter={() => enter(s)} onMouseLeave={leave} onFocus={() => enter(s)} onBlur={leave}
                    className="cursor-pointer outline-none [&:focus-visible_path]:stroke-[#2A0A0A] [&:focus-visible_path]:stroke-[5]">
                    <path d={wedge(s.a0, s.a1, R_OUT)} fill="transparent" stroke="none" pointerEvents="all" />
                  </a>
                ))}
              </g>
            </svg>
          </div>
        </div>
        <p ref={caption} aria-live="polite" className="min-h-[2.5rem] max-w-sm text-center text-sm font-semibold text-burgundy">
          {activeSlice ? activeSlice.sub : t("land.hint")}
        </p>
      </div>
    </div>
  );
}
