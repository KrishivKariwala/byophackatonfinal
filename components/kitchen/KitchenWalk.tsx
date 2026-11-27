"use client";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { RoundedBox, useCursor } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KitchenItem, KitchenStation, KitchenTheme } from "@/lib/kitchen-themes";

/**
 * PROTOTYPE of the 3D kitchen walk-through. Scrolling walks the camera down a themed kitchen; each station is a display table with
 * five dishes; tapping a dish opens a panel to choose a quantity and add it to tonight's surplus tray.
 * All text lives in ordinary HTML on top of the 3D (so Hindi and Kannada render properly and screen readers can read it),
 * and there is a plain 2D list of the same dishes for phones that struggle with 3D, for people who ask for less motion, and for assistive tools.
 */
const STATION_Z = [-2, -7, -12, -17, -22];
const WALK_FROM = 5, WALK_TO = -19;

type Tray = Record<string, number>;
const flat = (t: KitchenTheme) => t.stations.flatMap((s) => s.items.map((i) => ({ ...i, station: s })));
const price = (i: KitchenItem) => (i.full ? `₹${i.full}` : "included");

// ---------------------------------------------------------------- textures (drawn in code: no image files to download)
function useTextures(t: KitchenTheme) {
  return useMemo(() => {
    const terrazzo = document.createElement("canvas"); terrazzo.width = terrazzo.height = 512;
    const a = terrazzo.getContext("2d")!; a.fillStyle = "#f3ede1"; a.fillRect(0, 0, 512, 512);
    const flecks = ["#b8a58c", "#8a7f74", "#c98a6a", "#d8cdb9", "#6e7a96"];
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 520; i++) { a.fillStyle = flecks[Math.floor(rnd() * flecks.length)]; a.beginPath(); a.ellipse(rnd() * 512, rnd() * 512, 2 + rnd() * 6, 1.5 + rnd() * 4, rnd() * 3, 0, 6.3); a.fill(); }
    const floor = new THREE.CanvasTexture(terrazzo); floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(3, 14); floor.colorSpace = THREE.SRGBColorSpace;

    const m = document.createElement("canvas"); m.width = 1024; m.height = 512;
    const b = m.getContext("2d")!; b.fillStyle = "#faf6ec"; b.fillRect(0, 0, 1024, 512);
    b.strokeStyle = t.colors.ink; b.lineWidth = 2.2; b.globalAlpha = 0.75;
    for (let x = 10; x < 1024; x += 118) { // a line-drawn Parisian street: tall townhouses, mansard roofs, tall windows
      const h = 210 + ((x * 37) % 130), w = 104;
      b.strokeRect(x, 470 - h, w, h);
      b.beginPath(); b.moveTo(x - 6, 470 - h); b.lineTo(x + w / 2, 470 - h - 46); b.lineTo(x + w + 6, 470 - h); b.stroke();
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { b.strokeRect(x + 16 + c * 46, 470 - h + 22 + r * 62, 26, 44); b.beginPath(); b.arc(x + 29 + c * 46, 470 - h + 22 + r * 62, 13, Math.PI, 0); b.stroke(); }
    }
    b.beginPath(); b.moveTo(0, 470); b.lineTo(1024, 470); b.stroke();
    const mural = new THREE.CanvasTexture(m); mural.colorSpace = THREE.SRGBColorSpace;

    const tile = document.createElement("canvas"); tile.width = 256; tile.height = 256;
    const c = tile.getContext("2d")!; c.fillStyle = t.colors.brand; c.fillRect(0, 0, 256, 256); c.strokeStyle = t.colors.brandDark; c.lineWidth = 3;
    for (let x = 0; x <= 256; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); }
    const tiles = new THREE.CanvasTexture(tile); tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(26, 1); tiles.colorSpace = THREE.SRGBColorSpace;
    return { floor, mural, tiles };
  }, [t]);
}

// Text inside the 3D scene is drawn onto a canvas texture. (Interface text, in any language, stays ordinary HTML around the scene.)
function useTextTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, key: string) {
  return useMemo(() => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d")!, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, w, h]);
}

function SignText({ text, w, h, size, color, font = "Georgia, 'Times New Roman', serif", spacing = 0, scale }: { text: string; w: number; h: number; size: number; color: string; font?: string; spacing?: number; scale: [number, number] }) {
  const tex = useTextTexture((ctx, cw, ch) => { ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `${size}px ${font}`; (ctx as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`; ctx.fillText(text, cw / 2, ch / 2); }, w, h, `${text}|${color}|${size}`);
  return <mesh><planeGeometry args={scale} /><meshBasicMaterial map={tex} transparent toneMapped={false} /></mesh>;
}

function DishLabel({ name, veg, count, near, forced }: { name: string; veg: boolean; count: number; near: number; forced: boolean }) {
  const sp = useRef<THREE.Sprite>(null);
  const { camera } = useThree();
  useFrame(() => { if (sp.current) { const ahead = camera.position.z - near; sp.current.visible = forced || (ahead > 0.4 && ahead < 3.4); } });
  const tex = useTextTexture((ctx, cw, ch) => {
    ctx.clearRect(0, 0, cw, ch);
    const label = count > 0 ? `${name}   × ${count}` : name;
    ctx.font = "bold 44px Inter, Arial, sans-serif";
    const tw = Math.min(cw - 30, ctx.measureText(label).width + 90);
    const x = (cw - tw) / 2;
    ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.beginPath(); ctx.roundRect(x, 18, tw, ch - 36, (ch - 36) / 2); ctx.fill();
    ctx.fillStyle = veg ? "#1a8f3c" : "#c0392b"; ctx.beginPath(); ctx.arc(x + 34, ch / 2, 11, 0, 6.3); ctx.fill();
    ctx.fillStyle = count > 0 ? "#d92b2b" : "#12163a"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(label, x + 58, ch / 2 + 2);
  }, 640, 128, `${name}|${veg}|${count}`);
  return <sprite ref={sp} position={[0, 0.62, 0]} scale={[1.5, 0.3, 1]}><spriteMaterial map={tex} transparent depthTest={false} toneMapped={false} /></sprite>;
}

// ---------------------------------------------------------------- the room
function Room({ theme }: { theme: KitchenTheme }) {
  const tx = useTextures(theme);
  const { brand, cream, wood, accent } = theme.colors;
  const L = 34, cz = -10;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, cz]}><planeGeometry args={[7.4, L]} /><meshStandardMaterial map={tx.floor} roughness={0.55} /></mesh>
      {/* ceiling: cream and wood stripes */}
      {Array.from({ length: 34 }, (_, i) => <mesh key={i} position={[0, 3.3, 6 - i]}><boxGeometry args={[7.4, 0.05, 0.5]} /><meshStandardMaterial color={i % 2 ? wood : cream} roughness={0.8} /></mesh>)}
      {/* left wall: wood panelling under a drawn Paris street */}
      <mesh position={[-3.7, 0.65, cz]}><boxGeometry args={[0.12, 1.3, L]} /><meshStandardMaterial color={wood} roughness={0.7} /></mesh>
      <mesh position={[-3.63, 2.3, cz]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[L, 2]} /><meshStandardMaterial map={tx.mural} map-repeat={[3, 1]} roughness={0.9} /></mesh>
      {/* right wall: blue tiled counter and a plaster wall above */}
      <mesh position={[3.1, 0.52, cz]}><boxGeometry args={[1.1, 1.04, L]} /><meshStandardMaterial map={tx.tiles} roughness={0.35} /></mesh>
      <mesh position={[3.1, 1.07, cz]}><boxGeometry args={[1.22, 0.07, L]} /><meshStandardMaterial color="#efe9de" roughness={0.3} /></mesh>
      <mesh position={[3.68, 2.0, cz]}><boxGeometry args={[0.1, 4, L]} /><meshStandardMaterial color="#ece6da" roughness={0.9} /></mesh>
      <mesh position={[3.62, 1.9, cz]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[L, 1.5]} /><meshStandardMaterial color={theme.colors.brandDark} roughness={0.5} /></mesh>
      {/* the entrance wall behind the visitor and the far wall */}
      <mesh position={[0, 1.65, 6.6]}><boxGeometry args={[7.4, 3.3, 0.1]} /><meshStandardMaterial color={brand} roughness={0.6} /></mesh>
      <mesh position={[0, 1.65, -27]}><boxGeometry args={[7.4, 3.3, 0.1]} /><meshStandardMaterial color={cream} roughness={0.8} /></mesh>
      {/* the hanging sign with the beret and the moustache */}
      <group position={[0, 2.62, -0.6]}>
        <mesh><boxGeometry args={[3.7, 0.78, 0.1]} /><meshStandardMaterial color={brand} roughness={0.5} /></mesh>
        <mesh position={[-1.35, 0.1, 0.09]} scale={[1, 0.42, 0.55]}><sphereGeometry args={[0.3, 24, 16]} /><meshStandardMaterial color={accent} roughness={0.7} /></mesh>
        <mesh position={[-1.35, -0.2, 0.08]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.1, 0.028, 8, 20, Math.PI]} /><meshStandardMaterial color="#fff" /></mesh>
        <group position={[0.35, 0.02, 0.07]}><SignText text="Paris Panini" w={1024} h={256} size={150} color="#ffffff" spacing={10} scale={[2.6, 0.65]} /></group>
      </group>
      {/* cane pendant lamps */}
      {[-3.5, -9, -15, -21].map((z) => (
        <group key={z} position={[-0.6, 2.5, z]}>
          <mesh><cylinderGeometry args={[0.42, 0.55, 0.5, 20, 1, true]} /><meshStandardMaterial color="#c9a46a" side={THREE.DoubleSide} roughness={0.9} emissive="#ffb347" emissiveIntensity={0.35} /></mesh>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.01, 0.01, 0.9]} /><meshStandardMaterial color="#333" /></mesh>
          <pointLight position={[0, -0.2, 0]} intensity={9} distance={9} color="#ffd9a0" />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- food, drawn from simple shapes
function Food({ kind, veg, spin }: { kind: string; veg: boolean; spin: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (ref.current && spin) ref.current.rotation.y += d * 0.9; });
  const filling = veg ? "#5d9a43" : "#a8452d";
  return (
    <group ref={ref}>
      {kind === "dips" ? (
        <>
          <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.17, 0.13, 0.14, 24]} /><meshStandardMaterial color="#f4f1ea" roughness={0.3} /></mesh>
          <mesh position={[0, 0.145, 0]}><cylinderGeometry args={[0.15, 0.15, 0.02, 24]} /><meshStandardMaterial color={veg ? "#eadfb6" : "#7a4a2a"} roughness={0.4} /></mesh>
        </>
      ) : kind === "combos" ? (
        <>
          <RoundedBox args={[0.34, 0.16, 0.26]} radius={0.03} position={[0, 0.08, 0]}><meshStandardMaterial color="#e9e1cf" roughness={0.7} /></RoundedBox>
          {[-0.1, -0.05, 0, 0.05, 0.1].map((x, i) => <mesh key={i} position={[x, 0.22, (i % 2 ? 0.02 : -0.03)]} rotation={[0.2, 0, (i - 2) * 0.08]}><boxGeometry args={[0.03, 0.16, 0.03]} /><meshStandardMaterial color="#e8b441" /></mesh>)}
        </>
      ) : kind === "wraps" ? (
        <>
          <mesh position={[0, 0.13, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 0.5, 20]} /><meshStandardMaterial color="#e8c48a" roughness={0.8} /></mesh>
          <mesh position={[0.26, 0.13, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.085, 0.085, 0.03, 16]} /><meshStandardMaterial color={filling} /></mesh>
          {[-0.12, 0, 0.12].map((x) => <mesh key={x} position={[x, 0.235, 0]}><boxGeometry args={[0.02, 0.012, 0.19]} /><meshStandardMaterial color="#6b4a2a" /></mesh>)}
        </>
      ) : (
        <>
          <RoundedBox args={[0.62, 0.1, 0.3]} radius={0.04} position={[0, 0.05, 0]}><meshStandardMaterial color="#d9a95b" roughness={0.85} /></RoundedBox>
          <RoundedBox args={[0.58, 0.07, 0.27]} radius={0.03} position={[0, 0.115, 0]}><meshStandardMaterial color={filling} roughness={0.9} /></RoundedBox>
          <RoundedBox args={[0.62, 0.1, 0.3]} radius={0.04} position={[0, 0.18, 0]}><meshStandardMaterial color="#e2b86a" roughness={0.85} /></RoundedBox>
          {[-0.2, -0.07, 0.07, 0.2].map((x) => <mesh key={x} position={[x, 0.232, 0]}><boxGeometry args={[0.025, 0.006, 0.26]} /><meshStandardMaterial color="#8b5a2b" /></mesh>)}
        </>
      )}
    </group>
  );
}

function Dish({ item, kind, x, z, count, selected, onPick, label }: { item: KitchenItem; kind: string; x: number; z: number; count: number; selected: boolean; onPick: (i: KitchenItem) => void; label: boolean }) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const g = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (g.current) g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, hover || selected ? 1.25 : 1, 8, d)); });
  return (
    <group position={[x, 0.92, z]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPick(item); }}>
      <mesh position={[0, 0.005, 0]}><cylinderGeometry args={[0.36, 0.38, 0.02, 28]} /><meshStandardMaterial color="#f7f3ea" roughness={0.3} /></mesh>
      <group ref={g}><Food kind={kind} veg={item.veg} spin={hover || selected} /></group>
      {label && <DishLabel name={item.name} veg={item.veg} count={count} near={z} forced={hover || selected || count > 0} />}
    </group>
  );
}

function Stations({ theme, tray, picked, active, onPick }: { theme: KitchenTheme; tray: Tray; picked: string | null; active: number; onPick: (i: KitchenItem) => void }) {
  return (
    <group>
      {theme.stations.map((s, si) => {
        const z0 = STATION_Z[si];
        return (
          <group key={s.id}>
            <mesh position={[-2.05, 0.45, z0]}><boxGeometry args={[1.2, 0.9, 4.7]} /><meshStandardMaterial color={theme.colors.wood} roughness={0.6} /></mesh>
            <mesh position={[-2.05, 0.905, z0]}><boxGeometry args={[1.28, 0.04, 4.78]} /><meshStandardMaterial color="#efe6d4" roughness={0.4} /></mesh>
            <mesh position={[-1.43, 0.45, z0]}><boxGeometry args={[0.04, 0.85, 4.6]} /><meshStandardMaterial color={theme.colors.brand} roughness={0.5} /></mesh>
            <group position={[-2.3, 2.45, z0 + 2.2]}>
              <mesh><boxGeometry args={[0.1, 0.55, 1.9]} /><meshStandardMaterial color={theme.colors.brand} roughness={0.5} /></mesh>
              <group position={[0.07, 0, 0]} rotation={[0, Math.PI / 2, 0]}><SignText text={s.title} w={1024} h={256} size={96} color="#ffffff" scale={[1.8, 0.45]} /></group>
            </group>
            {s.items.map((it, ii) => <Dish key={it.id} item={it} kind={s.id.includes("paninis") ? "panini" : s.id} x={-2.0} z={z0 + (ii - 2) * 0.88} count={tray[it.id] ?? 0} selected={picked === it.id} onPick={onPick} label={active === si} />)}
          </group>
        );
      })}
    </group>
  );
}

// The scroll track sits on top of the 3D, so a tap lands on it, not on the canvas. Work out where the tap is relative to the canvas
// (clientX/Y minus the canvas position) instead of relative to whatever element was tapped, or the dishes could never be hit.
function TapPosition() {
  const events = useThree((s) => s.events);
  useEffect(() => {
    const prev = events.compute;
    events.compute = (e, state) => {
      state.pointer.set(((e.clientX - state.size.left) / state.size.width) * 2 - 1, -((e.clientY - state.size.top) / state.size.height) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, state.camera);
    };
    return () => { events.compute = prev; };
  }, [events]);
  return null;
}

// ---------------------------------------------------------------- the walk: scrolling moves the camera along the kitchen
// The page owns a tall, invisible scroll container; `progress` (0 to 1) is how far down it is. The camera follows it with a little easing.
function Walk({ progress, onStation, reduced }: { progress: React.MutableRefObject<number>; onStation: (n: number) => void; reduced: boolean }) {
  const { camera, pointer } = useThree();
  const last = useRef(-1);
  const t = useRef(0);
  const look = useRef(new THREE.Vector3());
  useFrame((_, d) => {
    t.current = reduced ? progress.current : THREE.MathUtils.damp(t.current, progress.current, 5, d);
    const z = THREE.MathUtils.lerp(WALK_FROM, WALK_TO, t.current);
    const sway = reduced ? 0 : 1;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, 0.75 + Math.sin(t.current * 22) * 0.05 * sway + pointer.x * 0.25, 4, d);
    camera.position.y = 1.55 + Math.sin(t.current * 70) * 0.018 * sway;
    camera.position.z = z;
    look.current.set(-1.4 + pointer.x * 0.9, 1.1 + pointer.y * 0.25, z - 3.4);
    camera.lookAt(look.current);
    const idx = Math.max(0, Math.min(4, Math.round((WALK_FROM - z - 3) / 5)));
    if (idx !== last.current) { last.current = idx; onStation(idx); }
  });
  return null;
}

// ---------------------------------------------------------------- the page: overlays on top of the 3D
export default function KitchenWalk({ theme }: { theme: KitchenTheme }) {
  const [mode, setMode] = useState<"3d" | "list">("3d");
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(0);
  const [tray, setTray] = useState<Tray>({});
  const [picked, setPicked] = useState<KitchenItem | null>(null);
  const [qty, setQty] = useState(5);
  const [outlet, setOutlet] = useState(theme.outlets[0].id);
  const [review, setReview] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const goTo = useCallback((n: number) => {
    const el = scroller.current; if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const target = ((n === 0 ? WALK_FROM : STATION_Z[n] + 3.2) - WALK_FROM) / (WALK_TO - WALK_FROM);
    el.scrollTo({ top: Math.max(0, Math.min(1, target)) * max, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);
  const all = useMemo(() => flat(theme), [theme]);
  const count = Object.values(tray).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 2 || ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8) <= 1;
    setReduced(mq.matches);
    if (mq.matches || lowEnd) setMode("list");
  }, []);

  const pick = useCallback((i: KitchenItem) => { setPicked(i); setQty(tray[i.id] || 5); }, [tray]);
  const add = () => { if (picked) { setTray((t) => ({ ...t, [picked.id]: qty })); setPicked(null); } };
  const remove = (id: string) => setTray((t) => { const n = { ...t }; delete n[id]; return n; });
  const st: KitchenStation = theme.stations[active];
  const o = theme.outlets.find((x) => x.id === outlet)!;
  const stepper = (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Fewer" className="grid h-11 w-11 place-items-center rounded-full border-2 text-xl font-bold" style={{ borderColor: theme.colors.brand, color: theme.colors.brand }} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
      <output className="w-12 text-center text-3xl font-extrabold tabular-nums" aria-live="polite">{qty}</output>
      <button type="button" aria-label="More" className="grid h-11 w-11 place-items-center rounded-full border-2 text-xl font-bold" style={{ borderColor: theme.colors.brand, color: theme.colors.brand }} onClick={() => setQty((q) => Math.min(500, q + 1))}>+</button>
    </div>
  );

  return (
    <div ref={root} className="relative -mt-0 h-[calc(100svh-60px)] min-h-[520px] w-full overflow-hidden" style={{ background: theme.colors.ink, color: theme.colors.ink }}>
      {mode === "3d" ? (
        <>
          <Canvas dpr={[1, 1.75]} eventSource={root as React.RefObject<HTMLElement>} eventPrefix="client" camera={{ fov: 62, near: 0.1, far: 60, position: [0.75, 1.55, WALK_FROM] }} gl={{ antialias: true, powerPreference: "high-performance" }} aria-label={`3D walk-through of the ${theme.brand} kitchen. Scroll to walk. A list view is available.`} style={{ position: "absolute", inset: 0 }}>
            <color attach="background" args={[theme.colors.ink]} />
            <fog attach="fog" args={[theme.colors.ink, 10, 34]} />
            <hemisphereLight args={["#fff4e0", "#7a5a3a", 1.15]} />
            <directionalLight position={[2, 4, 3]} intensity={0.7} />
            <TapPosition />
            <Walk progress={progress} onStation={setActive} reduced={reduced} />
            <Room theme={theme} />
            <Stations theme={theme} tray={tray} picked={picked?.id ?? null} active={active} onPick={pick} />
          </Canvas>
          {/* the invisible scroll track: swipe or wheel over the kitchen to walk; taps and clicks still reach the dishes below */}
          <div ref={scroller} className="absolute inset-0 overflow-y-auto" style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
            onScroll={(e) => { const el = e.currentTarget; progress.current = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight); }}>
            <div style={{ height: "600%" }} />
          </div>
        </>
      ) : (
        <ListView theme={theme} tray={tray} onPick={pick} />
      )}

      {/* top bar: brand, outlet, view switch */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 p-2 shadow backdrop-blur">
          <b className="px-2" style={{ fontFamily: "Georgia, serif", color: theme.colors.brand }}>{theme.brand}</b>
          {theme.outlets.map((x) => <button key={x.id} type="button" onClick={() => setOutlet(x.id)} aria-pressed={x.id === outlet} className="rounded-full px-3 py-1.5 text-xs font-bold" style={x.id === outlet ? { background: theme.colors.brand, color: "#fff" } : { background: "#eee", color: theme.colors.ink }}>{x.name}</button>)}
        </div>
        <button type="button" className="pointer-events-auto rounded-full bg-white/90 px-3 py-2 text-xs font-bold shadow" onClick={() => setMode(mode === "3d" ? "list" : "3d")}>{mode === "3d" ? "Switch to simple list" : "Walk the kitchen"}</button>
      </div>
      <p className="pointer-events-none absolute left-3 top-[72px] max-w-[80%] text-xs font-semibold text-white/85 sm:top-[64px]">{o.address}</p>

      {/* station nav */}
      {mode === "3d" && (
        <nav aria-label="Stations" className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          {theme.stations.map((s, i) => (
            <button key={s.id} type="button" aria-label={s.title} aria-current={i === active} onClick={() => goTo(i)} className="group flex items-center justify-end gap-2">
              <span className="hidden rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold group-hover:inline">{s.title}</span>
              <span className="block h-3 w-3 rounded-full border-2 border-white" style={{ background: i === active ? theme.colors.accent : "transparent" }} />
            </button>
          ))}
        </nav>
      )}
      {mode === "3d" && (
        <div className="pointer-events-none absolute bottom-24 left-3 right-3 text-center sm:bottom-20">
          <p role="status" className="mx-auto inline-block rounded-2xl bg-white/90 px-4 py-2 text-sm font-bold shadow" style={{ color: theme.colors.brand }}>{st.title}<span className="block text-xs font-medium text-ink/70">{st.subtitle}</span></p>
          {active === 0 && <p className="mt-2 text-xs font-semibold text-white/90">Scroll to walk · tap a dish to add it</p>}
        </div>
      )}

      {/* the item panel */}
      {picked && (
        <div className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-md rounded-3xl bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4" role="dialog" aria-label={picked.name}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: picked.veg ? "#1a8f3c" : "#c0392b" }}>{picked.veg ? "Vegetarian" : "Non-vegetarian"}{picked.mustTry ? " · must-try" : ""}</p>
              <h2 className="text-xl font-extrabold" style={{ fontFamily: "Georgia, serif", color: theme.colors.brand }}>{picked.name}</h2>
              <p className="mt-1 text-sm text-ink/75">{picked.about}</p>
              <p className="mt-1 text-sm font-bold">{picked.half ? `Half ₹${picked.half} · ` : ""}Full {price(picked)}</p>
            </div>
            <button type="button" aria-label="Close" className="rounded-full bg-black/5 px-3 py-1 text-lg font-bold" onClick={() => setPicked(null)}>×</button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">How many to list tonight?</p>{stepper}</div>
            <button type="button" className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white" style={{ background: theme.colors.accent }} onClick={add}>{tray[picked.id] ? "Update" : "Add to surplus"}</button>
          </div>
        </div>
      )}

      {/* the tray bar */}
      {!picked && (
        <div className="absolute inset-x-3 bottom-3 z-10 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-3xl bg-white/95 p-3 shadow-xl backdrop-blur">
          <div className="text-sm"><b style={{ color: theme.colors.brand }}>Tonight&apos;s surplus</b><span className="block text-xs text-ink/70">{count === 0 ? "Nothing yet. Tap a dish." : `${Object.keys(tray).length} dish${Object.keys(tray).length === 1 ? "" : "es"} · ${count} portions`}</span></div>
          <button type="button" disabled={count === 0} onClick={() => setReview(true)} className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white disabled:opacity-40" style={{ background: theme.colors.brand }}>Review</button>
        </div>
      )}

      {review && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/55 p-4" role="dialog" aria-label="Review tonights surplus">
          <div className="max-h-full w-full max-w-md overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-extrabold" style={{ fontFamily: "Georgia, serif", color: theme.colors.brand }}>Tonight at {o.name}</h2>
            <ul className="mt-3 divide-y">
              {Object.entries(tray).map(([id, q]) => { const it = all.find((x) => x.id === id)!; return (
                <li key={id} className="flex items-center justify-between gap-3 py-2 text-sm"><span><b>{it.name}</b><span className="block text-xs text-ink/60">{it.station.title}</span></span><span className="flex items-center gap-3"><b>× {q}</b><button type="button" className="text-xs font-bold underline" onClick={() => remove(id)}>remove</button></span></li>
              ); })}
            </ul>
            <p className="mt-3 rounded-xl bg-black/5 p-3 text-xs text-ink/70">Prototype: this is where the pickup window, the rescue price (at least 30% off) and the food-safety declaration come next, and then Publish.</p>
            <div className="mt-4 flex justify-end gap-2"><button type="button" className="rounded-2xl bg-black/5 px-4 py-2 text-sm font-bold" onClick={() => setReview(false)}>Keep browsing</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListView({ theme, tray, onPick }: { theme: KitchenTheme; tray: Tray; onPick: (i: KitchenItem) => void }) {
  return (
    <div className="h-full overflow-auto bg-[#f6efe0] px-4 pb-32 pt-28">
      {theme.stations.map((s) => (
        <section key={s.id} className="mx-auto mb-6 max-w-xl">
          <h2 className="text-lg font-extrabold" style={{ fontFamily: "Georgia, serif", color: theme.colors.brand }}>{s.title}</h2>
          <p className="mb-2 text-xs text-ink/70">{s.subtitle}</p>
          <ul className="flex flex-col gap-2">
            {s.items.map((i) => (
              <li key={i.id}><button type="button" onClick={() => onPick(i)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-3 text-left shadow-sm">
                <span><b><span style={{ color: i.veg ? "#1a8f3c" : "#c0392b" }}>●</span> {i.name}</b><span className="block text-xs text-ink/70">{i.about}</span></span>
                <span className="text-sm font-bold">{tray[i.id] ? `× ${tray[i.id]}` : price(i)}</span>
              </button></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
