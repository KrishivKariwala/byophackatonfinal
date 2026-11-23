"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, HeartHandshake, MapPin, Store } from "lucide-react";
import { Logo } from "./Logo";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* ------------------------------------------------------------------------------------------------
 * Landing page animation. GSAP plugins used: core timelines + stagger, quickTo (pointer tilt),
 * matchMedia (reduced-motion), ScrollTrigger (count-ups and card reveals).
 * Everything that moves respects prefers-reduced-motion: users who opt out get the final state.
 * ---------------------------------------------------------------------------------------------- */

const CX = 300, CY = 300;
const R_OUT = 236, R_IN = 80, PAD = 4; // degrees of gap between slices
const rad = (d: number) => (d * Math.PI) / 180;
const polar = (a: number, r: number) => ({ x: CX + r * Math.cos(rad(a)), y: CY + r * Math.sin(rad(a)) });

function wedge(a0: number, a1: number) {
  const s0 = a0 + PAD, s1 = a1 - PAD;
  const o0 = polar(s0, R_OUT), o1 = polar(s1, R_OUT), i1 = polar(s1, R_IN), i0 = polar(s0, R_IN);
  return `M${o0.x} ${o0.y} A${R_OUT} ${R_OUT} 0 0 1 ${o1.x} ${o1.y} L${i1.x} ${i1.y} A${R_IN} ${R_IN} 0 0 0 ${i0.x} ${i0.y} Z`;
}

type SliceId = "customer" | "vendor" | "ngo";
const SLICES: {
  id: SliceId; a0: number; a1: number; fill: string; ink: string; lines: [string, string]; word: string; sub: string; Icon: typeof MapPin; aria: string;
}[] = [
  { id: "customer", a0: -150, a1: -30, fill: "#CB0001", ink: "#FEF2C0", lines: ["FIND FOOD", "NEAR ME"], word: "EAT", sub: "Grab discounted surplus from kitchens near you tonight.", Icon: MapPin, aria: "Find food near me. Sign in as a customer" },
  { id: "vendor", a0: -30, a1: 90, fill: "#FDD599", ink: "#790000", lines: ["LIST SURPLUS", "AS A VENDOR"], word: "LIST", sub: "Turn today's extra into rescued meals in under a minute.", Icon: Store, aria: "List surplus as a vendor. Sign in as a vendor" },
  { id: "ngo", a0: 90, a1: 210, fill: "#790000", ink: "#FDD599", lines: ["COLLECT AS", "AN NGO"], word: "FEED", sub: "Claim free leftovers and get them to people who need them.", Icon: HeartHandshake, aria: "Collect as an NGO. Sign in as an NGO" },
];

const mid = (s: (typeof SLICES)[number]) => (s.a0 + s.a1) / 2;
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

export function PlateHero({ actor }: { actor: { name: string; href: string } | null }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const plate = useRef<SVGSVGElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const hubWord = useRef<SVGTextElement>(null);
  const [active, setActive] = useState<SliceId | null>(null);
  const activeSlice = SLICES.find((s) => s.id === active) ?? null;

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`(prefers-reduced-motion: no-preference)`, () => {
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
          .from(".plate-label", { opacity: 0, y: 10, duration: 0.5, stagger: 0.12 }, 1.2)
          .from(".plate-hub", { scale: 0, transformOrigin: "300px 300px", duration: 1, ease: "elastic.out(1, 0.55)" }, 1.0)
          .from(".decor", { scale: 0, rotate: -90, duration: 0.8, stagger: 0.12, ease: "back.out(2.4)" }, 1.1);

        // idle motion: rim dashes turn slowly, decor floats
        gsap.to(".plate-dashes", { rotate: 360, svgOrigin: "300 300", duration: 120, ease: "none", repeat: -1 });
        gsap.utils.toArray<HTMLElement>(".decor").forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? -14 : 14, x: i % 2 ? 8 : -8, rotate: i % 2 ? 8 : -8, duration: 2.6 + i * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
        });

        // pointer: plate leans toward the cursor, decor drifts at different depths (fine pointers only)
        if (window.matchMedia("(pointer: fine)").matches && plate.current && root.current) {
          const rx = gsap.quickTo(".plate-wrap", "rotationX", { duration: 0.6, ease: "power3.out" });
          const ry = gsap.quickTo(".plate-wrap", "rotationY", { duration: 0.6, ease: "power3.out" });
          const parallax = gsap.utils.toArray<HTMLElement>(".decor-depth").map((el, i) => ({
            x: gsap.quickTo(el, "x", { duration: 1, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 1, ease: "power3.out" }), k: 10 + i * 8,
          }));
          const onMove = (e: PointerEvent) => {
            const r = root.current!.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            ry(nx * 14); rx(-ny * 14);
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

  const enter = contextSafe((s: (typeof SLICES)[number]) => {
    setActive(s.id);
    if (window.matchMedia(REDUCED).matches) return;
    const a = rad(mid(s));
    gsap.to(`.slice-${s.id}`, { scale: 1.06, x: Math.cos(a) * 14, y: Math.sin(a) * 14, svgOrigin: "300 300", duration: 0.45, ease: "back.out(2.2)", overwrite: "auto" });
    gsap.to(".plate-slice:not(.slice-" + s.id + ")", { opacity: 0.72, scale: 0.985, svgOrigin: "300 300", duration: 0.3, overwrite: "auto" });
    gsap.fromTo(hubWord.current, { scale: 0.4, opacity: 0, svgOrigin: "300 300" }, { scale: 1, opacity: 1, svgOrigin: "300 300", duration: 0.5, ease: "back.out(2.5)" });
    gsap.fromTo(caption.current, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
  });

  const leave = contextSafe(() => {
    setActive(null);
    if (window.matchMedia(REDUCED).matches) return;
    gsap.to(".plate-slice", { scale: 1, x: 0, y: 0, opacity: 1, svgOrigin: "300 300", duration: 0.45, ease: "power3.out", overwrite: "auto" });
    gsap.fromTo(caption.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  });

  const go = contextSafe((e: React.MouseEvent, s: (typeof SLICES)[number]) => {
    e.preventDefault();
    if (window.matchMedia(REDUCED).matches) { router.push("/signin"); return; }
    gsap.timeline({ onComplete: () => router.push("/signin") })
      .to(`.slice-${s.id}`, { scale: 0.96, duration: 0.1, svgOrigin: "300 300" })
      .to(`.slice-${s.id}`, { scale: 1.5, opacity: 0, duration: 0.45, ease: "power2.in", svgOrigin: "300 300" })
      .to(".plate-slice:not(.slice-" + s.id + ")", { opacity: 0, duration: 0.3 }, "<");
  });

  const hubTop = activeSlice ? activeSlice.word : "PICK";
  const hubBottom = activeSlice ? "→ SIGN IN" : "YOUR SIDE";

  return (
    <div ref={root} className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-6 lg:py-6">
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
                  className="group inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-tomato bg-white/60 px-4 py-2 text-sm font-semibold text-tomato transition hover:bg-tomato hover:text-cream">
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
            <svg ref={plate} viewBox="0 0 600 600" role="group" aria-label="Pick your side of the plate" className="mx-auto max-h-[calc(100svh-250px)] min-h-[280px] w-full drop-shadow-[0_28px_28px_rgba(121,0,0,0.28)]">
              {/* plate rim */}
              <g className="plate-rim">
                <circle cx={CX} cy={CY} r="292" fill="#FFF8E6" stroke="#E9D5AE" strokeWidth="3" />
                <circle className="plate-dashes" cx={CX} cy={CY} r="276" fill="none" stroke="#CB0001" strokeOpacity=".35" strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" />
                <circle cx={CX} cy={CY} r="258" fill="#FDD599" opacity=".55" />
              </g>
              <circle className="plate-well" cx={CX} cy={CY} r="246" fill="#FFF8E6" stroke="#E9D5AE" strokeWidth="2" />

              {SLICES.map((s) => {
                const p = polar(mid(s), 168);
                return (
                  <g key={s.id}>
                    <g className={`plate-slice slice-${s.id}`}>
                      <a href="/signin" aria-label={s.aria} onClick={(e) => go(e, s)} onMouseEnter={() => enter(s)} onMouseLeave={leave} onFocus={() => enter(s)} onBlur={leave}
                        className="cursor-pointer outline-none [&:focus-visible_path]:stroke-[#2A0A0A]">
                        <path d={wedge(s.a0, s.a1)} fill={s.fill} stroke={s.fill} strokeWidth="14" strokeLinejoin="round" className="transition-[filter] duration-300 hover:[filter:brightness(1.08)]" />
                        <path d={wedge(s.a0, s.a1)} fill="none" stroke={s.ink} strokeOpacity=".28" strokeWidth="2" strokeDasharray="3 9" transform={`translate(0 0)`} pointerEvents="none" />
                        <g className="plate-label" pointerEvents="none" style={{ fill: s.ink, color: s.ink }}>
                          <s.Icon x={p.x - 20} y={p.y - 62} width={40} height={40} strokeWidth={2.25} />
                          <text x={p.x} y={p.y + 4} textAnchor="middle" className="display" fontSize="25" fill={s.ink}>{s.lines[0]}</text>
                          <text x={p.x} y={p.y + 32} textAnchor="middle" className="display" fontSize="25" fill={s.ink}>{s.lines[1]}</text>
                        </g>
                      </a>
                    </g>
                  </g>
                );
              })}

              {/* hub */}
              <g className="plate-hub" pointerEvents="none">
                <circle cx={CX} cy={CY} r={R_IN - 6} fill="#FFF8E6" stroke="#CB0001" strokeWidth="5" />
                <circle cx={CX} cy={CY} r={R_IN - 18} fill="none" stroke="#CB0001" strokeOpacity=".3" strokeWidth="2" strokeDasharray="2 6" />
                <text ref={hubWord} x={CX} y={CY - 2} textAnchor="middle" className="display" fontSize="30" fill={activeSlice ? (activeSlice.id === "vendor" ? "#790000" : activeSlice.fill) : "#CB0001"}>{hubTop}</text>
                <text x={CX} y={CY + 22} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="1.5" fill="#790000">{hubBottom}</text>
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

/* ------------------------------------------------------------------------------------------------
 * Below the fold: count-up stats and staggered card reveals, both driven by ScrollTrigger.
 * ---------------------------------------------------------------------------------------------- */

export function StatsBand({ stats }: { stats: { label: string; value: number; suffix?: string; pair?: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".stat", { y: 30, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 85%", once: true } });
        gsap.utils.toArray<HTMLElement>(".count").forEach((el) => {
          const end = Number(el.dataset.to), pair = el.dataset.pair ? Number(el.dataset.pair) : null;
          const o = { v: 0 };
          gsap.to(o, {
            v: end, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
            onUpdate: () => { el.textContent = pair === null ? String(Math.round(o.v)) : `${Math.round(o.v)} · ${pair}`; },
            onComplete: () => { el.textContent = pair === null ? String(end) : `${end} · ${pair}`; },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
      {stats.map((s) => (
        <div key={s.label} className="stat">
          <p className="display text-5xl text-peach"><span className="count" data-to={s.value} data-pair={s.pair}>{s.pair !== undefined ? `${s.value} · ${s.pair}` : s.value}</span></p>
          <p className="text-sm font-semibold">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export function HowItWorks({ steps }: { steps: [string, string, string][] }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".how-card", { y: 60, opacity: 0, rotate: (i) => (i - 1) * 3, duration: 0.9, stagger: 0.16, ease: "back.out(1.4)", scrollTrigger: { trigger: ref.current, start: "top 80%", once: true } });
        const cards = gsap.utils.toArray<HTMLElement>(".how-card");
        const cleanups = cards.map((c) => {
          const on = () => gsap.to(c, { y: -8, rotate: 0.6, duration: 0.3, ease: "power2.out" });
          const off = () => gsap.to(c, { y: 0, rotate: 0, duration: 0.4, ease: "power3.out" });
          c.addEventListener("pointerenter", on); c.addEventListener("pointerleave", off);
          return () => { c.removeEventListener("pointerenter", on); c.removeEventListener("pointerleave", off); };
        });
        return () => cleanups.forEach((f) => f());
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <section ref={ref} className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3">
      {steps.map(([n, h, p]) => (
        <div key={n} className="how-card card p-6">
          <p className="display text-3xl text-tomato">{n}</p>
          <h2 className="editorial mt-2 text-3xl">{h}</h2>
          <p className="mt-2 text-sm text-muted">{p}</p>
        </div>
      ))}
    </section>
  );
}
