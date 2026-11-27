"use client";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { useT } from "@/components/I18n";

/**
 * The entrance. The vendor stands in front of their restaurant at night, using a real photo of the shopfront that has been given depth:
 * move the mouse (or tilt, or just wait: it breathes) and the street shifts in 3D. "Enter door" is a brass plate at the entrance.
 * Tap it, or swipe up / scroll, and the camera walks in through the arch, with the steps, pillar and shrubs rushing past, into the kitchen.
 * The kitchen is already loading underneath.
 */
const PHOTO_ASPECT = 830 / 886;
const ARCH = { x: 232, y: 500 };           // the entrance, in photo pixels
const FOCUS = { x: 0.26, y: 1 - 0.6 };     // where the camera heads, in photo uv (y up)
/** the same maths as the picture: where a photo pixel lands on the screen */
function toScreen(px: number, py: number, W: number, H: number): [number, number] {
  const sa = W / H, portrait = sa < 0.9, cx = portrait ? 0.4 : 0.5, sc = portrait ? 0.9 : 1.22, cy = portrait ? 0.5 : 0.49;
  const ux = 0.5 + (px / 830 - cx) * PHOTO_ASPECT / sa * sc, uy = 0.5 + (1 - py / 886 - cy) * sc;
  return [ux * W, (1 - uy) * H];
}

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform sampler2D uPhoto; uniform sampler2D uDepth;
uniform vec2 uRes; uniform vec2 uOff; uniform vec2 uFocus; uniform float uTime; uniform float uZoom; uniform float uPortrait; uniform float uAspect;
varying vec2 vUv;
vec2 toPhoto(vec2 uv){ float sa = uRes.x / uRes.y; float cx = mix(0.5, 0.4, uPortrait); float sc = mix(1.22, 0.9, uPortrait); float cy = mix(0.49, 0.5, uPortrait); return vec2(cx + (uv.x - 0.5) * sa / uAspect / sc, cy + (uv.y - 0.5) / sc); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 p = toPhoto(vUv);
  float d = texture2D(uDepth, vec2(clamp(p.x, 0.001, 0.999), clamp(p.y, 0.001, 0.999))).r;
  vec2 q = p;
  for (int i = 0; i < 3; i++) {
    float s = 1.0 + uZoom * (0.1 + 2.6 * d);
    q = uFocus + (p - uFocus) / s;
    q += uOff * (d - 0.4) * 0.045;
    d = texture2D(uDepth, vec2(clamp(q.x, 0.001, 0.999), clamp(q.y, 0.001, 0.999))).r;
  }
  // beyond the photo's left and right edge the facade simply carries on (its blue band) and falls away into the night
  float outside = max(max(-q.x, q.x - 1.0), 0.0);
  vec3 c = texture2D(uPhoto, vec2(clamp(q.x, 0.002, 0.998), clamp(q.y, 0.001, 0.999))).rgb;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  // day to night: darker, bluer, then light the sign, the entrance and the street lamps back up
  vec3 night = c * vec3(0.34, 0.44, 0.78) * 0.82;
  float sig = smoothstep(0.688, 0.700, q.y) * (1.0 - smoothstep(0.880, 0.892, q.y));
  float lamp = 0.9 + 0.1 * sin(uTime * 1.3) * sin(uTime * 0.37 + 1.0);
  night = mix(night, c * vec3(1.02, 1.08, 1.28) * 1.05 * lamp, sig * 0.92);
  float inside = 1.0 - smoothstep(0.0, 0.16, d);
  float flick = 0.88 + 0.12 * sin(uTime * 2.1 + sin(uTime * 5.3));
  vec3 warm = vec3(1.0, 0.62, 0.27) * (0.18 + 1.05 * lum) * flick;
  night += warm * inside * (0.55 + 0.9 * uZoom);
  // a pool of warm light spilling down the steps
  float spill = smoothstep(0.32, 0.0, length((q - vec2(0.27, 0.22)) * vec2(1.0, 1.3)));
  night += vec3(0.9, 0.5, 0.2) * spill * 0.18 * (1.0 - step(0.5, outside));
  // past the edge: the blue facade band goes on, everything below it sinks into the dark street
  float band = smoothstep(0.62, 0.69, q.y);
  vec3 street = vec3(0.012, 0.018, 0.05) + vec3(0.02, 0.03, 0.08) * smoothstep(0.0, 0.5, q.y);
  float edge = min(q.x, 1.0 - q.x);
  night = mix(night, street, (1.0 - smoothstep(-0.01, 0.12, edge)) * (1.0 - band));
  night *= 1.0 - smoothstep(0.0, 0.4, outside) * 0.9 * band;
  float outY = max(max(-q.y, q.y - 1.0), 0.0);
  night *= 1.0 - smoothstep(0.0, 0.06, outY);
  float v = length(vUv - 0.5);
  night *= 1.0 - smoothstep(0.35, 0.95, v) * 0.7;
  night += (hash(vUv * uRes + uTime) - 0.5) * 0.035;
  // walking in: the doorway glow takes over the whole screen
  vec3 end = vec3(0.16, 0.085, 0.045);
  night = mix(night, end, smoothstep(0.72, 1.0, uZoom));
  gl_FragColor = vec4(night, 1.0);
  #include <colorspace_fragment>
}`;

interface Ctl { zoom: { current: number }; off: { current: [number, number] } }

function Street({ ctl }: { ctl: Ctl }) {
  const [photo, depth] = useTexture(["/kitchen/paris-panini/door-photo.webp", "/kitchen/paris-panini/door-depth.webp"]);
  const { size } = useThree();
  const mat = useRef<THREE.ShaderMaterial>(null);
  useEffect(() => { photo.colorSpace = THREE.SRGBColorSpace; photo.anisotropy = 8; photo.needsUpdate = true; }, [photo]);
  useFrame(({ clock }) => {
    const m = mat.current; if (!m) return; const u = m.uniforms;
    const t = clock.elapsedTime;
    u.uTime.value = t; u.uZoom.value = ctl.zoom.current; u.uRes.value.set(size.width, size.height); u.uPortrait.value = size.width / size.height < 0.9 ? 1 : 0;
    // the breathing keeps the 3D visible even when nothing is touched
    u.uOff.value.set(ctl.off.current[0] + Math.sin(t * 0.45) * 0.35, ctl.off.current[1] + Math.cos(t * 0.33) * 0.22);
  });
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={VERT} fragmentShader={FRAG} toneMapped={false} depthTest={false}
        uniforms={{ uPhoto: { value: photo }, uDepth: { value: depth }, uRes: { value: new THREE.Vector2(1, 1) }, uOff: { value: new THREE.Vector2() }, uFocus: { value: new THREE.Vector2(FOCUS.x, FOCUS.y) }, uTime: { value: 0 }, uZoom: { value: 0 }, uPortrait: { value: 0 }, uAspect: { value: PHOTO_ASPECT } }} />
    </mesh>
  );
}

export function Door({ theme, onOpening, onDone, onSkip }: { theme: KitchenTheme; onOpening: () => void; onDone: () => void; onSkip: () => void }) {
  const { t } = useT();
  const root = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLButtonElement>(null);
  const ctl = useRef<Ctl>({ zoom: { current: 0 }, off: { current: [0, 0] } }).current;
  const st = useRef({ p: 0, target: 0, auto: false, opened: false, done: false, ptr: null as { y: number; id: number } | null, drag: 0 });
  const [ready, setReady] = useState(false);
  const [fade, setFade] = useState(0);

  // the plate follows the entrance as the street shifts and the camera moves
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const s = st.current;
      if (s.auto) s.target = Math.min(1, s.target + dt / 2.4);
      s.p += (s.target - s.p) * Math.min(1, dt * (s.auto ? 5 : 7));
      const e = s.p * s.p * (3 - 2 * s.p);
      ctl.zoom.current = e;
      if (e > 0.55 && !s.opened) { s.opened = true; onOpening(); }
      if (e > 0.62) setFade(Math.min(1, (e - 0.62) / 0.3));
      if (s.p > 0.985 && !s.done) { s.done = true; onDone(); }
      const el = root.current, pl = plate.current;
      if (el && pl) {
        const W = el.clientWidth, H = el.clientHeight;
        const [px, py] = toScreen(ARCH.x, ARCH.y, W, H);
        // the point moves toward the camera's focus as it walks in, and sways with the parallax
        const [fx, fy] = toScreen(FOCUS.x * 830, (1 - FOCUS.y) * 886, W, H);
        const scale = 1 + e * 1.4;
        const x = fx + (px - fx) * scale + ctl.off.current[0] * 6, y = fy + (py - fy) * scale + ctl.off.current[1] * 4;
        pl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${(1 + e * 0.8).toFixed(3)})`;
        pl.style.opacity = String(Math.max(0, 1 - e * 2.4));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ctl, onOpening, onDone]);

  const walkIn = () => { st.current.auto = true; };
  useEffect(() => {
    const el = root.current; if (!el) return;
    const wheel = (e: WheelEvent) => { e.preventDefault(); const s = st.current; if (s.auto) return; s.target = Math.max(0, Math.min(1, s.target + e.deltaY * 0.0012)); if (s.target > 0.8) s.auto = true; };
    el.addEventListener("wheel", wheel, { passive: false });
    const key = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); walkIn(); } };
    window.addEventListener("keydown", key);
    return () => { el.removeEventListener("wheel", wheel); window.removeEventListener("keydown", key); };
  }, []);

  return (
    <div ref={root} className="k-door fixed inset-0 z-[70] touch-none select-none overflow-hidden bg-[#070a22]" role="group" aria-label={t("kitchen.door.aria", { brand: theme.brand })} style={{ opacity: 1 - fade }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect(); ctl.off.current = [((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2];
        const s = st.current; if (s.ptr && !s.auto) { const dy = s.ptr.y - e.clientY; s.drag = Math.max(s.drag, Math.abs(dy)); s.target = Math.max(0, Math.min(1, dy / (r.height * 0.55))); }
      }}
      onPointerDown={(e) => { st.current.ptr = { y: e.clientY, id: e.pointerId }; st.current.drag = 0; }}
      onPointerUp={() => { const s = st.current; s.ptr = null; if (!s.auto) { if (s.target > 0.3) s.auto = true; else s.target = 0; } }}
      onPointerCancel={() => { st.current.ptr = null; st.current.target = 0; }}>
      <Canvas dpr={[1, 2]} gl={{ antialias: false, powerPreference: "high-performance" }} camera={{ position: [0, 0, 1] }} style={{ position: "absolute", inset: 0 }} onCreated={() => setReady(true)}>
        <Suspense fallback={null}><Street ctl={ctl} /></Suspense>
      </Canvas>
      {!ready && <p role="status" className="absolute inset-0 grid place-items-center text-sm font-bold text-white/70">{t("kitchen.loading")}</p>}
      <button type="button" className="k-skip rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur hover:bg-black/55" onClick={(e) => { e.stopPropagation(); onSkip(); }} onPointerDown={(e) => e.stopPropagation()}>{t("kitchen.door.skip")}</button>
      {/* the brass plate at the entrance: not a button on a page, a sign on the door */}
      <button ref={plate} type="button" aria-label={t("kitchen.door.enter")} onClick={(e) => { e.stopPropagation(); walkIn(); }} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}
        className="k-plate k-display absolute left-0 top-0 whitespace-nowrap rounded-[5px] px-5 pb-2 pt-1.5 text-[clamp(1.05rem,3.6vw,1.6rem)] leading-tight" style={{ willChange: "transform, opacity" }}>
        <span className="k-plate-chain" aria-hidden="true" />{t("kitchen.door.enter")}
      </button>
      <p className="pointer-events-none absolute inset-x-0 bottom-[4%] px-4 text-center text-[13px] font-semibold tracking-wide text-white/85" style={{ textShadow: "0 1px 10px #000", opacity: Math.max(0, 1 - fade * 3) }}>{t("kitchen.door.hint")}</p>
    </div>
  );
}
