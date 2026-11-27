"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { useT } from "@/components/I18n";

/**
 * The entrance. The vendor stands in front of the restaurant at dusk and PUSHES the door open.
 *
 * Motion thesis (from the creative-skills pack: apple-design + animate): one authored moment, the push. The door answers the instant it is
 * pressed, follows a drag 1:1, keeps the speed of the hand when released, swings on springs with a small bump at the stop, and is never
 * pulled (it only opens inward, away from you). Behind the opening is the LIVE kitchen: the doorway is a real hole in the picture, so as
 * the leaves swing away you see the kitchen, then the whole front zooms past you and you are inside.
 */
const IW = 1376, IH = 768;                                   // the shopfront picture
const LEAF = { x: 606, y: 302, w: 166, h: 327 };             // the two door leaves, in picture pixels
const HALF = Math.round(LEAF.w / 2);
const DC = { x: LEAF.x + LEAF.w / 2, y: LEAF.y + LEAF.h / 2 };
const OPEN = 84;                                             // degrees: how far the leaves swing away
const IMG = "/kitchen/paris-panini";

type Sp = { x: number; v: number };
/** a damped spring toward `target`, integrated in small steps so it is stable at any frame rate */
function spring(s: Sp, target: number, response: number, zeta: number, dt: number) {
  const w = (2 * Math.PI) / response, n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
  for (let i = 0; i < n; i++) { s.v += (-w * w * (s.x - target) - 2 * zeta * w * s.v) * h; s.x += s.v * h; }
}
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (t: number) => { const c = clamp(t, 0, 1); return c * c * (3 - 2 * c); };

/** the little brass doorbell, only ever as an answer to a tap or push */
let ctx: AudioContext | null = null;
function bell() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!AC) return;
    ctx = ctx ?? new AC(); const t = ctx.currentTime;
    [1568, 2349, 3136].forEach((f, i) => { const o = ctx!.createOscillator(), g = ctx!.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 / (i + 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); o.connect(g).connect(ctx!.destination); o.start(t); o.stop(t + 1.2); });
  } catch { /* no sound: fine */ }
}
const buzz = (ms: number) => { try { const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation; if (ua && !ua.hasBeenActive) return; navigator.vibrate?.(ms); } catch { /* not supported */ } };

export function Door({ theme, onAwake, onOpening, onDone, onSkip }: { theme: KitchenTheme; onAwake: () => void; onOpening: () => void; onDone: () => void; onSkip: () => void }) {
  const { t } = useT();
  const root = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), leafL = useRef<HTMLDivElement>(null), leafR = useRef<HTMLDivElement>(null);
  const shadeL = useRef<HTMLElement>(null), shadeR = useRef<HTMLElement>(null), spill = useRef<HTMLDivElement>(null), reveal = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null);
  const fills = useRef<(HTMLDivElement | null)[]>([]), hint = useRef<HTMLParagraphElement>(null);
  const cbs = useRef({ onAwake, onOpening, onDone }); cbs.current = { onAwake, onOpening, onDone };
  const S = useRef({ a: { x: 0, v: 0 } as Sp, d: { x: 0, v: 0 } as Sp, target: 0, dTarget: 0, opened: false, done: false, touched: false, press: 0, drag: null as null | { x0: number; y0: number; hist: { t: number; a: number }[] }, par: { x: 0, y: 0, tx: 0, ty: 0 }, nextNudge: 3.2, bell: false, buzzed: false, reduce: false });
  const [loaded, setLoaded] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  const pushOpen = () => {
    const s = S.current; if (s.target === OPEN) return;
    if (!s.touched) cbs.current.onAwake();
    s.touched = true; s.target = OPEN; s.a.v = Math.max(s.a.v, s.reduce ? 0 : 70); s.press = 1; buzz(12);
    if (!s.bell) { s.bell = true; bell(); }
  };

  useEffect(() => {
    const s = S.current; s.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();
    const t0 = last;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const el = root.current, st = stage.current; if (!el || !st) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const time = (now - t0) / 1000;
      const vw = el.clientWidth, vh = el.clientHeight, portrait = vw / vh < 1;
      const s0 = portrait ? Math.min((vw * 0.34) / LEAF.w, (vh * 0.42) / LEAF.h) : Math.max(vw / IW, vh / IH);
      const p0 = { x: vw / 2, y: portrait ? vh * 0.55 : vh * 0.58 };
      const smax = Math.max(2.4, Math.max(vw / (162 * s0), vh / (323 * s0)) * 1.12);

      // the door: a spring toward closed or open, or glued to the finger while it is being dragged
      if (!s.drag) {
        if (s.touched === false && !s.reduce && time > s.nextNudge && s.target === 0) { s.a.v += 15; s.nextNudge = time + 5.5; } // a small inward nudge now and then: "push me"
        spring(s.a, s.target, s.reduce ? 0.2 : s.target === OPEN ? 0.62 : 0.5, s.reduce ? 1 : s.target === OPEN ? 0.58 : 0.9, dt);
        if (s.a.x < 0) { s.a.x = 0; if (s.a.v < 0) s.a.v = 0; }        // a door that only opens inward: it can never be pulled toward you
        if (s.a.x > OPEN + 6) { s.a.x = OPEN + 6; if (s.a.v > 0) s.a.v *= -0.3; }
      }
      s.press *= Math.exp(-dt * 9);
      const aEff = s.a.x + s.press * 2.2;
      if (s.a.x > 28 && !s.buzzed) { s.buzzed = true; buzz(10); }
      if (s.a.x > 58 && !s.opened) { s.opened = true; s.dTarget = 1; cbs.current.onOpening(); }
      if (s.opened) spring(s.d, s.dTarget, s.reduce ? 0.3 : 1.15, 1, dt);
      const d = clamp(s.d.x, 0, 1.02);
      if (d > 0.975 && !s.done) { s.done = true; cbs.current.onDone(); }

      // the whole front: placed so the door sits at its spot, tilting a little with the pointer, then zooming through the doorway
      s.par.x += (s.par.tx - s.par.x) * Math.min(1, dt * 4); s.par.y += (s.par.ty - s.par.y) * Math.min(1, dt * 4);
      const sway = s.reduce ? 0 : 1;
      const ry = (s.par.x * 2.4 + Math.sin(time * 0.4) * 0.9 * sway) * (1 - d), rx = (-s.par.y * 1.6 + Math.cos(time * 0.33) * 0.55 * sway) * (1 - d);
      const sc = s.reduce ? s0 : s0 * Math.exp(Math.log(smax) * d), e = smooth(d);
      if (s.reduce) el.style.opacity = String(1 - e);
      let px = s.reduce ? p0.x : p0.x + (vw / 2 - p0.x) * e, py = s.reduce ? p0.y : p0.y + (vh / 2 - p0.y) * e;
      if (!portrait) { px = clamp(px, vw - (IW - DC.x) * sc, DC.x * sc); py = clamp(py, vh - (IH - DC.y) * sc, DC.y * sc); }
      st.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${sc.toFixed(4)}) translate3d(${-DC.x}px, ${-DC.y}px, 0)`;
      // plain fills where the picture does not reach the edges of the screen (phones are taller than the picture)
      const left = px - DC.x * sc, top = py - DC.y * sc, right = left + IW * sc, bottom = top + IH * sc, f = fills.current;
      if (f[0]) f[0].style.height = `${Math.max(0, top + 1)}px`;
      if (f[1]) f[1].style.top = `${Math.max(0, bottom - 1)}px`;
      if (f[2]) f[2].style.width = `${Math.max(0, left + 1)}px`;
      if (f[3]) f[3].style.left = `${Math.max(0, right - 1)}px`;

      const k = clamp(s.a.x / OPEN, 0, 1.05);
      if (leafL.current) leafL.current.style.transform = `rotateY(${aEff.toFixed(2)}deg)`;
      if (leafR.current) leafR.current.style.transform = `rotateY(${(-aEff).toFixed(2)}deg)`;
      const shade = String(Math.min(0.62, k * 0.7)); if (shadeL.current) shadeL.current.style.opacity = shade; if (shadeR.current) shadeR.current.style.opacity = shade;
      if (spill.current) spill.current.style.opacity = String(Math.min(1, k * 1.15) * (1 - e));
      if (reveal.current) reveal.current.style.opacity = String(1 - e);
      if (hint.current) hint.current.style.opacity = String(1 - smooth(k * 2.2));
      if (btn.current) { btn.current.style.opacity = String(1 - smooth(k * 1.6)); btn.current.style.transform = `translateY(${(smooth(k * 1.6) * 24).toFixed(1)}px) scale(${(1 - s.press * 0.05).toFixed(3)})`; }
    };
    raf = requestAnimationFrame(frame); if (img.current?.complete && img.current.naturalWidth) setLoaded(true);
    return () => cancelAnimationFrame(raf);
  }, []);

  // pressing and pushing: respond on touch-down, follow the hand 1:1, hand over its speed on release
  const down = (e: React.PointerEvent) => {
    const s = S.current; if ((e.target as HTMLElement).closest("button")) return;
    if (!s.touched) cbs.current.onAwake();
    s.touched = true; s.press = 1; buzz(8);
    s.drag = { x0: e.clientX, y0: e.clientY, hist: [{ t: performance.now(), a: s.a.x }] }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const s = S.current, r = e.currentTarget.getBoundingClientRect(); s.par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; s.par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    const g = s.drag; if (!g) return;
    const dy = e.clientY - g.y0, dx = e.clientX - g.x0, travel = r.height * 0.34;
    let deg = ((-dy + 0.5 * Math.abs(dx)) / travel) * OPEN;
    if (deg < 0) deg = -(Math.abs(deg) * 5.5) / (Math.abs(deg) + 28);            // rubber band: pushing the wrong way barely moves it
    deg = Math.min(deg, OPEN + 8);
    g.hist.push({ t: performance.now(), a: deg }); if (g.hist.length > 6) g.hist.shift();
    s.a.x = deg; s.a.v = 0; s.target = 0;
  };
  const up = () => {
    const s = S.current, g = s.drag; if (!g) return; s.drag = null;
    const h = g.hist, first = h[Math.max(0, h.length - 4)], lastS = h[h.length - 1];
    const dt = Math.max(0.016, (lastS.t - first.t) / 1000), v = (lastS.a - first.a) / dt;     // degrees per second at release
    const moved = Math.abs(lastS.a - g.hist[0].a) > 3;
    const projected = s.a.x + clamp(v, -400, 600) * 0.22;                                       // where the swing is heading (momentum projection)
    if (!moved || projected > 30 || s.a.x > 46) { s.target = OPEN; s.a.v = clamp(v, 40, 500); if (!s.bell) { s.bell = true; bell(); } } else { s.target = 0; s.a.v = clamp(v, -300, 0); }
  };

  useEffect(() => {
    const wheel = (e: WheelEvent) => { e.preventDefault(); const s = S.current; s.touched = true; if (e.deltaY > 6) pushOpen(); };
    const el = root.current; el?.addEventListener("wheel", wheel, { passive: false });
    const key = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.closest?.("button")) return; if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") { e.preventDefault(); pushOpen(); } };
    window.addEventListener("keydown", key);
    return () => { el?.removeEventListener("wheel", wheel); window.removeEventListener("keydown", key); };
  }, []);

  return (
    <div ref={root} className="k-door fixed inset-0 z-[70] touch-none select-none overflow-hidden" style={{ perspective: "1800px", perspectiveOrigin: "50% 50%", background: loaded ? "transparent" : "#070a22" }} role="group" aria-label={t("kitchen.door.aria", { brand: theme.brand })}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {/* plain colour where the picture does not reach: sky above, street below, night to the sides */}
      <div ref={(e) => { fills.current[0] = e; }} className="k-fill" style={{ left: 0, right: 0, top: 0, background: "linear-gradient(#0d1b33, #2f5d90 55%, #5890c4)" }} />
      <div ref={(e) => { fills.current[1] = e; }} className="k-fill" style={{ left: 0, right: 0, bottom: 0, background: "linear-gradient(#524a4c, #1c1b20 45%, #07080d)" }} />
      <div ref={(e) => { fills.current[2] = e; }} className="k-fill" style={{ left: 0, top: 0, bottom: 0, background: "#040608" }} />
      <div ref={(e) => { fills.current[3] = e; }} className="k-fill" style={{ right: 0, top: 0, bottom: 0, background: "#050607" }} />

      <div ref={stage} className="absolute left-0 top-0" style={{ width: IW, height: IH, transformOrigin: "0 0", willChange: "transform", opacity: loaded ? 1 : 0 }}>
        {/* the shopfront, with the doorway cut out so the live kitchen shows through */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={`${IMG}/facade.webp`} alt="" draggable={false} width={IW} height={IH} onLoad={() => setLoaded(true)} className="absolute left-0 top-0 max-w-none" />
        <div ref={reveal} className="k-reveal" style={{ left: LEAF.x + 2, top: LEAF.y + 2, width: LEAF.w - 4, height: LEAF.h - 4 }} />
        {/* life in the street: the lantern and the lit windows flicker, warm light spills onto the step when the door opens */}
        <div className="k-glow" style={{ left: 826 - 70, top: 312 - 70, width: 140, height: 140, background: "radial-gradient(circle, rgba(255,196,110,.9), rgba(255,170,80,.25) 45%, transparent 70%)" }} />
        <div className="k-glow" style={{ left: 285, top: 225, width: 225, height: 270, borderRadius: 40, background: "radial-gradient(ellipse, rgba(255,190,100,.28), transparent 70%)", animationDelay: "-1.2s" }} />
        <div className="k-glow" style={{ left: 865, top: 225, width: 225, height: 270, borderRadius: 40, background: "radial-gradient(ellipse, rgba(255,190,100,.28), transparent 70%)", animationDelay: "-2.1s" }} />
        <div ref={spill} className="absolute" style={{ left: LEAF.x - 120, top: LEAF.y + LEAF.h - 4, width: LEAF.w + 240, height: 120, opacity: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(255,198,120,.95), rgba(255,160,70,.35) 45%, transparent 72%)", mixBlendMode: "screen", pointerEvents: "none" }} />
        {/* the two leaves: they swing on their outer hinges, away from you */}
        <div className="absolute" style={{ left: LEAF.x, top: LEAF.y, width: LEAF.w, height: LEAF.h, perspective: 640, perspectiveOrigin: "50% 42%" }}>
          <div ref={leafL} className="k-leaf3d" style={{ left: 0, width: HALF, height: LEAF.h, transformOrigin: "0% 50%", backgroundImage: `url(${IMG}/door-left.webp)` }}><i ref={shadeL} className="k-shade" /></div>
          <div ref={leafR} className="k-leaf3d" style={{ left: HALF, width: LEAF.w - HALF, height: LEAF.h, transformOrigin: "100% 50%", backgroundImage: `url(${IMG}/door-right.webp)` }}>
            <i ref={shadeR} className="k-shade k-shade-r" />
            <span className="k-push-plate k-display" aria-hidden="true">{t("kitchen.door.push")}</span>
          </div>
        </div>
      </div>

      <button type="button" className="k-skip rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90 hover:bg-black/55" onClick={onSkip}>{t("kitchen.door.skip")}</button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button ref={btn} type="button" onClick={pushOpen} className="k-plate k-display pointer-events-auto relative inline-flex min-h-[56px] items-center gap-3 whitespace-nowrap rounded-full px-7 text-[clamp(1.1rem,4.4vw,1.5rem)] leading-none" style={{ willChange: "transform, opacity" }}>
          <ArrowUp size={22} strokeWidth={3} aria-hidden="true" className="k-push-arrow" />{t("kitchen.door.enter")}
        </button>
        <p ref={hint} className="text-center text-[13px] font-semibold tracking-wide text-white/85" style={{ textShadow: "0 1px 10px #000" }}>{t("kitchen.door.hint")}</p>
      </div>
    </div>
  );
}
