"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, HeartHandshake, MapPin, Store } from "lucide-react";
import { Logo } from "./Logo";

gsap.registerPlugin(useGSAP);

/* ------------------------------------------------------------------------------------------------
 * Landing hero: copy on the left, a full pie "plate" on the right (one slice per side).
 *
 * Interaction model (this is what keeps the junctions from flickering):
 *   - VISUAL slices animate freely but never receive the pointer (pointer-events: none).
 *   - A separate, STATIC hit layer of three transparent wedges owns hover, focus and click.
 *     It never moves relative to the plate, so a slice popping out can't slide out from under the cursor.
 *   - The "pop" effect is an overlay copy of the hovered slice drawn above the visuals.
 * GSAP: timelines + stagger (entrance), quickTo (pointer tilt), matchMedia (reduced motion).
 * ---------------------------------------------------------------------------------------------- */

const CX = 300, CY = 300;
const R_OUT = 236; // pie radius
const R_CRUST = 214; // inner edge of the crust band
const R_HUB = 62;
const rad = (d: number) => (d * Math.PI) / 180;
const polar = (a: number, r: number) => ({ x: CX + r * Math.cos(rad(a)), y: CY + r * Math.sin(rad(a)) });
const f = (n: number) => +n.toFixed(2);

/** Full wedge from the centre: slices meet exactly, with no gaps. */
function wedge(a0: number, a1: number, r = R_OUT) {
  const p0 = polar(a0, r), p1 = polar(a1, r);
  return `M${CX} ${CY} L${f(p0.x)} ${f(p0.y)} A${r} ${r} 0 0 1 ${f(p1.x)} ${f(p1.y)} Z`;
}
/** Crust band along the outer edge of a slice. */
function ring(a0: number, a1: number, r0 = R_CRUST, r1 = R_OUT) {
  const o0 = polar(a0, r1), o1 = polar(a1, r1), i1 = polar(a1, r0), i0 = polar(a0, r0);
  return `M${f(o0.x)} ${f(o0.y)} A${r1} ${r1} 0 0 1 ${f(o1.x)} ${f(o1.y)} L${f(i1.x)} ${f(i1.y)} A${r0} ${r0} 0 0 0 ${f(i0.x)} ${f(i0.y)} Z`;
}

type SliceId = "customer" | "vendor" | "ngo";
type Slice = {
  id: SliceId; a0: number; a1: number; ink: string; lines: [string, string]; word: string; sub: string; Icon: typeof MapPin; aria: string;
  stops: [string, string, string]; crust: string;
};
const SLICES: Slice[] = [
  { id: "customer", a0: -150, a1: -30, ink: "#FEF2C0", lines: ["FIND FOOD", "NEAR ME"], word: "EAT", sub: "Grab discounted surplus from kitchens near you tonight.", Icon: MapPin, aria: "Find food near me. Sign in as a customer",
    stops: ["#EC3A33", "#CB0001", "#A80000"], crust: "#7A0000" },
  { id: "vendor", a0: -30, a1: 90, ink: "#790000", lines: ["LIST SURPLUS", "AS A VENDOR"], word: "LIST", sub: "Turn today's extra into rescued meals in under a minute.", Icon: Store, aria: "List surplus as a vendor. Sign in as a vendor",
    stops: ["#FFE9C4", "#FDD599", "#EDBE78"], crust: "#B9792A" },
  { id: "ngo", a0: 90, a1: 210, ink: "#FDD599", lines: ["COLLECT AS", "AN NGO"], word: "FEED", sub: "Claim free leftovers and get them to people who need them.", Icon: HeartHandshake, aria: "Collect as an NGO. Sign in as an NGO",
    stops: ["#A01616", "#790000", "#5A0000"], crust: "#2A0A0A" },
];
const mid = (s: Slice) => (s.a0 + s.a1) / 2;
const REDUCED = "(prefers-reduced-motion: reduce)";

function Decor({ kind }: { kind: "tomato" | "leaf" | "crumbs" }) {
  if (kind === "tomato")
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true" className="h-full w-full">
        <circle cx="40" cy="40" r="36" fill="#CB0001" />
        <circle cx="40" cy="40" r="27" fill="#FD2828" opacity=".55" />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="40" cy="22" rx="3.6" ry="7" fill="#FEF2C0" transform={`rotate(${a} 40 40)`} />
        ))}
        <circle cx="40" cy="40" r="5" fill="#FEF2C0" />
      </svg>
    );
  if (kind === "leaf")
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true" className="h-full w-full">
        <path d="M10 62C10 28 34 10 70 10c0 36-18 60-52 60" fill="#1F7A3A" />
        <path d="M14 66C30 46 46 32 66 14" stroke="#E6F2E9" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="h-full w-full">
      <circle cx="20" cy="24" r="7" fill="#FDD599" /><circle cx="52" cy="16" r="5" fill="#CB0001" /><circle cx="60" cy="52" r="8" fill="#FDD599" /><circle cx="26" cy="58" r="5" fill="#790000" />
    </svg>
  );
}

/** One slice as drawn artwork (used for both the base pie and the hover "pop" overlay). */
function SliceArt({ s }: { s: Slice }) {
  const p = polar(mid(s), 146);
  return (
    <>
      <path d={wedge(s.a0, s.a1)} fill={`url(#grad-${s.id})`} stroke={s.stops[1]} strokeWidth="1" strokeLinejoin="round" />
      <path d={wedge(s.a0, s.a1)} fill="url(#dots)" opacity=".5" />
      <path d={ring(s.a0, s.a1)} fill={s.crust} opacity=".22" />
      <path d={wedge(s.a0, s.a1, R_CRUST)} fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2" />
      <path d={wedge(s.a0, s.a1, R_OUT - 6)} fill="none" stroke={s.ink} strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" />
      <g style={{ fill: s.ink, color: s.ink }}>
        <s.Icon x={p.x - 18} y={p.y - 60} width={36} height={36} strokeWidth={2.25} />
        <text x={p.x} y={p.y - 2} textAnchor="middle" className="display" fontSize="21" fill={s.ink}>{s.lines[0]}</text>
        <text x={p.x} y={p.y + 24} textAnchor="middle" className="display" fontSize="21" fill={s.ink}>{s.lines[1]}</text>
      </g>
    </>
  );
}

export function PlateHero({ actor }: { actor: { name: string; href: string } | null }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const hubWord = useRef<SVGTextElement>(null);
  const popRef = useRef<SVGGElement>(null);
  const token = useRef(0);
  const [active, setActive] = useState<SliceId | null>(null); // drives hub word + caption instantly
  const [pop, setPop] = useState<SliceId | null>(null); // drives the overlay (removed after its exit tween)
  const activeSlice = SLICES.find((s) => s.id === active) ?? null;
  const popSlice = SLICES.find((s) => s.id === pop) ?? null;

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(".hero-fade", { y: 26, opacity: 0, duration: 0.7, stagger: 0.09 }, 0)
          .from(".hero-word", { yPercent: 115, rotate: 4, duration: 0.9, stagger: 0.07, ease: "power4.out" }, 0.1)
          .from(".plate-rim", { scale: 0.3, rotate: -140, transformOrigin: "300px 300px", duration: 1.2, ease: "back.out(1.3)" }, 0.15)
          .from(".plate-well", { scale: 0.2, transformOrigin: "300px 300px", duration: 0.9, ease: "back.out(1.6)" }, 0.45)
          .from(
            ".plate-slice",
            {
              opacity: 0, scale: 0.4, transformOrigin: "300px 300px", rotate: (i) => (i % 2 ? 40 : -40), duration: 0.9, stagger: 0.14, ease: "back.out(1.7)",
              x: (i) => Math.cos(rad(mid(SLICES[i]))) * 160, y: (i) => Math.sin(rad(mid(SLICES[i]))) * 160,
            },
            0.65,
          )
          .from(".plate-hub", { scale: 0, transformOrigin: "300px 300px", duration: 1, ease: "elastic.out(1, 0.55)" }, 1.0)
          .from(".decor", { scale: 0, rotate: -90, duration: 0.8, stagger: 0.12, ease: "back.out(2.4)" }, 1.1);

        gsap.to(".plate-dashes", { rotate: 360, svgOrigin: "300 300", duration: 120, ease: "none", repeat: -1 });
        gsap.utils.toArray<HTMLElement>(".decor").forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? -14 : 14, x: i % 2 ? 8 : -8, rotate: i % 2 ? 8 : -8, duration: 2.6 + i * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
        });

        // pointer: plate leans gently toward the cursor (the hit layer is inside the plate, so hover stays exact)
        if (window.matchMedia("(pointer: fine)").matches && root.current) {
          const rx = gsap.quickTo(".plate-wrap", "rotationX", { duration: 0.7, ease: "power3.out" });
          const ry = gsap.quickTo(".plate-wrap", "rotationY", { duration: 0.7, ease: "power3.out" });
          const parallax = gsap.utils.toArray<HTMLElement>(".decor-depth").map((el, i) => ({
            x: gsap.quickTo(el, "x", { duration: 1, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 1, ease: "power3.out" }), k: 10 + i * 8,
          }));
          const onMove = (e: PointerEvent) => {
            const r = root.current!.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            ry(nx * 8); rx(-ny * 8);
            parallax.forEach((p) => { p.x(-nx * p.k); p.y(-ny * p.k); });
          };
          const onLeave = () => { rx(0); ry(0); parallax.forEach((p) => { p.x(0); p.y(0); }); };
          const el = root.current;
          el.addEventListener("pointermove", onMove);
          el.addEventListener("pointerleave", onLeave);
          return () => { el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); };
        }
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // overlay entrance whenever a new slice is popped
  useEffect(() => {
    if (!pop || !popRef.current || window.matchMedia(REDUCED).matches) return;
    gsap.fromTo(popRef.current, { opacity: 0, scale: 1, svgOrigin: "300 300" }, { opacity: 1, scale: 1.055, svgOrigin: "300 300", duration: 0.35, ease: "back.out(2.2)", overwrite: true });
  }, [pop]);

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
    if (window.matchMedia(REDUCED).matches) { router.push("/signin"); return; }
    token.current++;
    gsap.timeline({ onComplete: () => router.push("/signin") })
      .to(popRef.current, { scale: 1.5, opacity: 0, svgOrigin: "300 300", duration: 0.5, ease: "power2.in" })
      .to(`.slice-${s.id}`, { scale: 1.5, opacity: 0, svgOrigin: "300 300", duration: 0.5, ease: "power2.in" }, "<")
      .to(`.plate-slice:not(.slice-${s.id})`, { opacity: 0, duration: 0.3 }, "<");
  });

  const hubTop = activeSlice ? activeSlice.word : "PICK";
  const hubBottom = activeSlice ? "→ SIGN IN" : "YOUR SIDE";

  return (
    <div ref={root} className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:min-h-[calc(100svh-190px)] lg:grid-cols-[1fr_1.1fr] lg:gap-6 lg:py-6">
      {/* ---------------------------------------------------------------- left: copy */}
      <div className="flex flex-col items-start gap-5 text-left">
        <div className="hero-fade overflow-hidden rounded-3xl"><Logo width={150} priority /></div>
        <p className="hero-fade eyebrow text-burgundy">Bengaluru pilot · surplus food marketplace</p>
        <h1 className="display text-5xl leading-[0.95] text-tomato sm:text-6xl xl:text-7xl" aria-label="Tonight's surplus, someone's dinner.">
          {["TONIGHT'S", "SURPLUS,", "SOMEONE'S", "DINNER."].map((w) => (
            <span key={w} className="mr-3 inline-block overflow-hidden align-bottom" aria-hidden="true"><span className="hero-word inline-block">{w}</span></span>
          ))}
        </h1>
        <p className="hero-fade max-w-md text-sm font-semibold tracking-wide text-burgundy">
          RESCUING GOOD FOOD, REDUCING WASTE, AND MAKING EVERY MEAL COUNT.
        </p>
        {actor ? (
          <div className="hero-fade"><Link href={actor.href} className="btn-primary !px-8 !py-4 text-base">Continue as {actor.name}<ArrowRight size={18} aria-hidden="true" /></Link></div>
        ) : null}
        <div className="hero-fade flex flex-col gap-2">
          <p className="eyebrow text-burgundy">{actor ? "Or switch sides" : "Pick your side of the plate"}</p>
          <ul className="flex flex-wrap gap-2">
            {SLICES.map((s) => (
              <li key={s.id}>
                <Link href="/signin" onMouseEnter={() => enter(s)} onMouseLeave={leave} onFocus={() => enter(s)} onBlur={leave}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-tomato bg-white/60 px-4 py-2 text-sm font-semibold text-tomato transition hover:bg-tomato hover:text-cream">
                  <s.Icon size={16} aria-hidden="true" />{s.lines.join(" ")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------------------------------------------------------------- right: the plate */}
      <div className="relative mx-auto flex w-full max-w-[640px] flex-col items-center gap-3">
        <div className="decor decor-depth absolute -left-2 top-4 z-10 h-16 w-16 sm:h-20 sm:w-20"><Decor kind="tomato" /></div>
        <div className="decor decor-depth absolute -right-1 top-24 z-10 h-14 w-14 sm:h-16 sm:w-16"><Decor kind="leaf" /></div>
        <div className="decor decor-depth absolute bottom-16 -left-1 z-10 h-14 w-14 sm:h-16 sm:w-16"><Decor kind="leaf" /></div>
        <div className="decor decor-depth absolute -right-2 bottom-8 z-10 h-16 w-16 sm:h-20 sm:w-20"><Decor kind="crumbs" /></div>

        <div className="w-full" style={{ perspective: 1100 }}>
          <div className="plate-wrap w-full will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            <svg viewBox="0 0 600 600" role="group" aria-label="Pick your side of the plate" className="mx-auto max-h-[calc(100svh-250px)] min-h-[280px] w-full drop-shadow-[0_26px_26px_rgba(121,0,0,0.30)]">
              <defs>
                <radialGradient id="rimGrad" cx="50%" cy="38%" r="70%"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".72" stopColor="#FFF8E6" /><stop offset="1" stopColor="#E9D9B2" /></radialGradient>
                <radialGradient id="wellGrad" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFFDF5" /><stop offset=".8" stopColor="#F8EBCD" /><stop offset="1" stopColor="#E7D3A8" /></radialGradient>
                <filter id="blur6" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7" /></filter>
                <filter id="popShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#2A0A0A" floodOpacity=".45" /></filter>
                <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#fff" opacity=".35" /><circle cx="10" cy="10" r="1" fill="#000" opacity=".12" /></pattern>
                {SLICES.map((s) => (
                  <radialGradient key={s.id} id={`grad-${s.id}`} gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={R_OUT}>
                    <stop offset="0" stopColor={s.stops[0]} /><stop offset=".62" stopColor={s.stops[1]} /><stop offset="1" stopColor={s.stops[2]} />
                  </radialGradient>
                ))}
              </defs>

              {/* plate: rim, bevel, well */}
              <g className="plate-rim">
                <circle cx={CX} cy={CY} r="292" fill="url(#rimGrad)" stroke="#E0CB9E" strokeWidth="3" />
                <circle cx={CX} cy={CY} r="283" fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="3" />
                <circle className="plate-dashes" cx={CX} cy={CY} r="270" fill="none" stroke="#CB0001" strokeOpacity=".35" strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" />
                <circle cx={CX} cy={CY} r="257" fill="#F4E4C0" stroke="#E0CB9E" strokeWidth="2" />
              </g>
              <g className="plate-well">
                <circle cx={CX} cy={CY + 8} r="244" fill="#2A0A0A" opacity=".16" filter="url(#blur6)" />
                <circle cx={CX} cy={CY} r="247" fill="url(#wellGrad)" stroke="#D9C291" strokeWidth="2" />
              </g>

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
                <text ref={hubWord} x={CX} y={CY - 1} textAnchor="middle" className="display" fontSize="26" fill={activeSlice ? (activeSlice.id === "vendor" ? "#790000" : activeSlice.stops[1]) : "#CB0001"}>{hubTop}</text>
                <text x={CX} y={CY + 19} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.4" fill="#790000">{hubBottom}</text>
              </g>

              {/* STATIC hit layer: exact 120° wedges, always on top, owns hover / focus / click */}
              <g>
                {SLICES.map((s) => (
                  <a key={s.id} href="/signin" aria-label={s.aria} onClick={(e) => go(e, s)} onMouseEnter={() => enter(s)} onMouseLeave={leave} onFocus={() => enter(s)} onBlur={leave}
                    className="cursor-pointer outline-none [&:focus-visible_path]:stroke-[#2A0A0A] [&:focus-visible_path]:stroke-[5]">
                    <path d={wedge(s.a0, s.a1, R_OUT)} fill="transparent" stroke="none" pointerEvents="all" />
                  </a>
                ))}
              </g>
            </svg>
          </div>
        </div>
        <p ref={caption} aria-live="polite" className="min-h-[2.5rem] max-w-sm text-center text-sm font-semibold text-burgundy">
          {activeSlice ? activeSlice.sub : "Hover or tap a slice to choose how you want to save a plate."}
        </p>
      </div>
    </div>
  );
}
