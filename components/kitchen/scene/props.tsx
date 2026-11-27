"use client";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { COUNTER_OUT, COUNTER_TOP, DEG, DISH_R, DISH_TH, polar } from "./constants";
import { useMats } from "./materials";
import { useFx } from "./quality";

/** Props with a purpose: the ingredients of each dish stand behind it, and the kitchen is busy (fire, steam, a turning spit, a ticking clock). */
const at = (r: number, th: number, y: number): [number, number, number] => { const [x, z] = polar(r, th); return [x, y, z]; };
const glass = { color: "#cfe8e0", transparent: true, opacity: 0.38, roughness: 0.08, metalness: 0.0 } as const;

export function Jar({ p, body, h = 0.17, r = 0.058, lid = "#c9a24b" }: { p: [number, number, number]; body: string; h?: number; r?: number; lid?: string }) {
  return (
    <group position={p}>
      <mesh position-y={h / 2}><cylinderGeometry args={[r, r, h, 14]} /><meshStandardMaterial {...glass} /></mesh>
      <mesh position-y={h * 0.44}><cylinderGeometry args={[r * 0.88, r * 0.88, h * 0.82, 14]} /><meshStandardMaterial color={body} roughness={0.5} /></mesh>
      <mesh position-y={h + 0.012}><cylinderGeometry args={[r * 1.02, r * 1.02, 0.025, 14]} /><meshStandardMaterial color={lid} metalness={0.8} roughness={0.35} /></mesh>
    </group>
  );
}

export function Bowl({ p, r = 0.15, color = "#f4f1ea", fill, fillColor = "#fff", balls = 0 }: { p: [number, number, number]; r?: number; color?: string; fill?: boolean; fillColor?: string; balls?: number }) {
  return (
    <group position={p}>
      <mesh position-y={r * 0.9} rotation-x={Math.PI}><sphereGeometry args={[r, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={color} roughness={0.25} side={THREE.DoubleSide} /></mesh>
      {fill && <mesh position-y={r * 0.62} rotation-x={-Math.PI / 2}><circleGeometry args={[r * 0.78, 22]} /><meshStandardMaterial color={fillColor} roughness={0.5} /></mesh>}
      {Array.from({ length: balls }, (_, i) => { const a = (i / Math.max(1, balls)) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * r * 0.38, r * 0.7 + (i % 2) * 0.02, Math.sin(a) * r * 0.38]}><sphereGeometry args={[r * 0.32, 12, 10]} /><meshStandardMaterial color="#fbfaf2" roughness={0.35} /></mesh>; })}
    </group>
  );
}

function Produce({ p, color, r = 0.05, sy = 1 }: { p: [number, number, number]; color: string; r?: number; sy?: number }) {
  return <mesh position={p} scale={[1, sy, 1]}><sphereGeometry args={[r, 14, 12]} /><meshStandardMaterial color={color} roughness={0.35} /></mesh>;
}

function Crate({ p, children }: { p: [number, number, number]; children?: React.ReactNode }) {
  const m = useMats();
  return (
    <group position={p}>
      <mesh position-y={0.07}><boxGeometry args={[0.36, 0.14, 0.26]} /><primitive object={m.pine} attach="material" /></mesh>
      {children}
    </group>
  );
}

function Basket({ p, r = 0.17, children }: { p: [number, number, number]; r?: number; children?: React.ReactNode }) {
  const m = useMats();
  return (
    <group position={p}>
      <mesh position-y={0.065}><cylinderGeometry args={[r, r * 0.8, 0.13, 20, 1, true]} /><meshStandardMaterial map={m.rattan} side={THREE.DoubleSide} roughness={0.9} /></mesh>
      <mesh position-y={0.02} rotation-x={-Math.PI / 2}><circleGeometry args={[r * 0.8, 18]} /><meshStandardMaterial map={m.rattan} /></mesh>
      {children}
    </group>
  );
}

function Pot({ p, r = 0.15, h = 0.2, copper = true, content = "#6b3a1e", steam = false }: { p: [number, number, number]; r?: number; h?: number; copper?: boolean; content?: string; steam?: boolean }) {
  const m = useMats();
  return (
    <group position={p}>
      <mesh position-y={h / 2}><cylinderGeometry args={[r, r * 0.92, h, 24, 1, true]} /><primitive object={copper ? m.copper : m.steel} attach="material" /></mesh>
      <mesh position-y={h * 0.82} rotation-x={-Math.PI / 2}><circleGeometry args={[r * 0.97, 24]} /><meshStandardMaterial color={content} roughness={0.25} /></mesh>
      <mesh position-y={h} rotation-x={Math.PI / 2}><torusGeometry args={[r, 0.012, 8, 28]} /><primitive object={copper ? m.copper : m.steel} attach="material" /></mesh>
      <mesh position={[r + 0.05, h * 0.55, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.012, 0.012, 0.13, 8]} /><meshStandardMaterial color="#2b2b2b" /></mesh>
      {steam && <Puffs origin={[0, h * 0.9, 0]} count={9} height={0.55} size={0.2} />}
    </group>
  );
}

/** the soft white puffs that rise from hot things */
type PuffsProps = { origin: [number, number, number]; count: number; height: number; size: number; spread?: number; opacity?: number };
export function Puffs(p: PuffsProps) { return useFx() ? <PuffsImpl {...p} /> : null; }
function PuffsImpl({ origin, count, height, size, spread = 0.08, opacity = 0.22 }: PuffsProps) {
  const m = useMats();
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3)); g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3)); return g; }, [count]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, pos = geo.attributes.position as THREE.BufferAttribute, col = geo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const o = i / count, u = (t * 0.2 + o) % 1, a = i * 2.399;
      pos.setXYZ(i, origin[0] + Math.sin(t * 0.8 + a) * spread * u, origin[1] + u * height, origin[2] + Math.cos(t * 0.7 + a) * spread * u);
      const k = Math.sin(u * Math.PI) * opacity; col.setXYZ(i, k, k, k);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
  });
  return <points geometry={geo} frustumCulled={false}><pointsMaterial map={m.soft} size={size} sizeAttenuation vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points>;
}

/** orange sparks jumping off the hot grill */
export function Sparks(p: { origin: [number, number, number]; width: number }) { return useFx() ? <SparksImpl {...p} /> : null; }
function SparksImpl({ origin, width }: { origin: [number, number, number]; width: number }) {
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18 * 3), 3)); g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(18 * 3), 3)); return g; }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, pos = geo.attributes.position as THREE.BufferAttribute, col = geo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < 18; i++) {
      const seed = i * 7.31, life = 0.7 + (i % 5) * 0.25, u = ((t * 0.9 + seed) % life) / life, x = Math.sin(seed * 3.1) * width * 0.5 + Math.sin(seed + t) * 0.03;
      pos.setXYZ(i, origin[0] + x, origin[1] + u * (0.25 + (i % 3) * 0.08) - u * u * 0.1, origin[2] + Math.cos(seed * 2.3) * width * 0.25);
      const k = (1 - u) * (1 - u); col.setXYZ(i, k, k * 0.55, k * 0.15);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
  });
  return <points geometry={geo} frustumCulled={false}><pointsMaterial size={0.028} sizeAttenuation vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points>;
}

/** dust floating in the light */
export function Dust() { return useFx() ? <DustImpl /> : null; }
function DustImpl() {
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); const n = 70; const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const r = 1.6 + ((i * 53) % 37) / 10; const th = ((i * 97) % 360) * DEG; a[i * 3] = Math.sin(th) * r; a[i * 3 + 1] = 0.7 + ((i * 31) % 20) / 9; a[i * 3 + 2] = -Math.cos(th) * r; } g.setAttribute("position", new THREE.BufferAttribute(a, 3)); return g; }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, base[i * 3] + Math.sin(t * 0.13 + i) * 0.18, base[i * 3 + 1] + Math.sin(t * 0.21 + i * 1.7) * 0.12, base[i * 3 + 2] + Math.cos(t * 0.11 + i * 0.7) * 0.18);
    pos.needsUpdate = true;
  });
  return <points geometry={geo} frustumCulled={false}><pointsMaterial size={0.018} color="#ffe2b0" transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points>;
}

/** a soft cone of light under a lamp */
type ConeProps = { p: [number, number, number]; h?: number; r?: number; color?: string; opacity?: number };
export function LightCone(c: ConeProps) { return useFx() ? <LightConeImpl {...c} /> : null; }
function LightConeImpl({ p, h = 1.6, r = 0.8, color = "#ffc875", opacity = 0.12 }: ConeProps) {
  const tex = useMemo(() => { const c = document.createElement("canvas"); c.width = 4; c.height = 64; const g = c.getContext("2d")!; const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); return new THREE.CanvasTexture(c); }, []);
  return <mesh position={[p[0], p[1] - h / 2, p[2]]}><cylinderGeometry args={[0.12, r, h, 24, 1, true]} /><meshBasicMaterial map={tex} color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>;
}

// ---------------------------------------------------------------- things that sway and turn
function Basil({ p }: { p: [number, number, number] }) {
  const leaves = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (leaves.current) { leaves.current.rotation.z = Math.sin(clock.elapsedTime * 1.3) * 0.045; leaves.current.rotation.x = Math.cos(clock.elapsedTime * 1.1) * 0.035; } });
  return (
    <group position={p}>
      <mesh position-y={0.06}><cylinderGeometry args={[0.085, 0.06, 0.12, 16]} /><meshStandardMaterial color="#b4603b" roughness={0.85} /></mesh>
      <group ref={leaves} position-y={0.12}>
        {Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, h = 0.05 + (i % 5) * 0.045; return (
          <mesh key={i} position={[Math.cos(a) * 0.05, h, Math.sin(a) * 0.05]} rotation={[0.5 * Math.cos(a), a, 0.5 * Math.sin(a)]} scale={[1, 0.5, 1.5]}><sphereGeometry args={[0.04, 10, 8]} /><meshStandardMaterial color={i % 3 ? "#3f8a3a" : "#56a247"} roughness={0.55} /></mesh>); })}
      </group>
    </group>
  );
}

function Spit({ p }: { p: [number, number, number] }) {
  const g = useRef<THREE.Group>(null), glow = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }, d) => { if (g.current) g.current.rotation.y += d * 0.9; if (glow.current) glow.current.opacity = 0.55 + 0.25 * Math.sin(clock.elapsedTime * 3) * Math.sin(clock.elapsedTime * 1.3); });
  return (
    <group position={p}>
      <mesh position={[0, 0.34, -0.07]}><boxGeometry args={[0.34, 0.5, 0.025]} /><meshBasicMaterial ref={glow} color="#ff4a12" transparent opacity={0.6} toneMapped={false} /></mesh>
      <mesh position-y={0.015}><cylinderGeometry args={[0.1, 0.12, 0.03, 18]} /><meshStandardMaterial color="#2b2b30" metalness={0.8} roughness={0.4} /></mesh>
      <group ref={g} position-y={0.04}>
        <mesh position-y={0.28}><cylinderGeometry args={[0.012, 0.012, 0.56, 8]} /><meshStandardMaterial color="#c9ccd2" metalness={0.9} roughness={0.3} /></mesh>
        {[0.06, 0.15, 0.24, 0.33, 0.42].map((y, i) => <mesh key={i} position-y={y} rotation-y={i * 0.7}><cylinderGeometry args={[0.095 - Math.abs(i - 2) * 0.012, 0.095 - Math.abs(i - 2) * 0.012, 0.085, 14]} /><meshStandardMaterial color={i % 2 ? "#a8431f" : "#c2562a"} roughness={0.55} /></mesh>)}
      </group>
    </group>
  );
}

function Hanging({ p, kind }: { p: [number, number, number]; kind: "chili" | "garlic" }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 0.9 + p[0]) * 0.07; });
  return (
    <group position={p}>
      <group ref={g}>
        <mesh position-y={-0.2}><cylinderGeometry args={[0.004, 0.004, 0.4, 4]} /><meshStandardMaterial color="#6b5a3a" /></mesh>
        {kind === "chili"
          ? [0.08, 0.17, 0.26, 0.35].flatMap((y, i) => [-1, 1].map((s) => <mesh key={`${i}${s}`} position={[s * 0.03, -y - 0.03, 0.005]} rotation-z={s * 0.35}><capsuleGeometry args={[0.012, 0.075, 4, 8]} /><meshStandardMaterial color="#c9301f" roughness={0.4} /></mesh>))
          : [0.06, 0.14, 0.22, 0.3, 0.38].map((y, i) => <mesh key={i} position={[(i % 2 ? 0.02 : -0.02), -y, 0]} scale={[1, 0.85, 1]}><sphereGeometry args={[0.04 - i * 0.002, 12, 10]} /><meshStandardMaterial color="#f1e8d2" roughness={0.6} /></mesh>)}
      </group>
    </group>
  );
}

export function HangingStrings() {
  const spots: { th: number; kind: "chili" | "garlic"; y: number }[] = [{ th: -24, kind: "garlic", y: 2.82 }, { th: 6, kind: "chili", y: 2.82 }, { th: 30, kind: "garlic", y: 2.82 }, { th: 54, kind: "chili", y: 2.82 }, { th: 78, kind: "garlic", y: 2.82 }, { th: 100, kind: "chili", y: 2.82 }];
  return <group>{spots.map((s) => <group key={s.th} position={at(COUNTER_OUT - 0.2, s.th * DEG, s.y)} rotation-y={-s.th * DEG}><Hanging p={[0, 0, 0]} kind={s.kind} /></group>)}</group>;
}

export function WallClock({ th = 76 }: { th?: number }) {
  const hands = useRef<{ m: THREE.Mesh | null; h: THREE.Mesh | null; s: THREE.Mesh | null }>({ m: null, h: null, s: null });
  const m = useMats();
  useFrame(() => { const d = new Date(), sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60; if (hands.current.s) hands.current.s.rotation.z = -sec * (Math.PI / 30); if (hands.current.m) hands.current.m.rotation.z = -min * (Math.PI / 30); if (hands.current.h) hands.current.h.rotation.z = -hr * (Math.PI / 6); });
  return (
    <group position={at(COUNTER_OUT - 0.04, th * DEG, 3.0)} rotation-y={-th * DEG}>
      <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.26, 0.26, 0.05, 32]} /><meshStandardMaterial color="#c9a24b" metalness={0.85} roughness={0.35} /></mesh>
      <mesh position-z={0.03}><circleGeometry args={[0.235, 32]} /><meshStandardMaterial color="#f6efe0" roughness={0.6} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin((i * Math.PI) / 6) * 0.2, Math.cos((i * Math.PI) / 6) * 0.2, 0.034]} rotation-z={-(i * Math.PI) / 6}><boxGeometry args={[0.012, i % 3 ? 0.03 : 0.05, 0.004]} /><meshBasicMaterial color="#1b1b22" /></mesh>)}
      <mesh ref={(e) => { hands.current.h = e; }} position-z={0.04}><boxGeometry args={[0.014, 0.12, 0.006]} /><meshBasicMaterial color="#1b1b22" /></mesh>
      <mesh ref={(e) => { hands.current.m = e; }} position-z={0.045}><boxGeometry args={[0.01, 0.18, 0.006]} /><meshBasicMaterial color="#1b1b22" /></mesh>
      <mesh ref={(e) => { hands.current.s = e; }} position-z={0.05}><boxGeometry args={[0.004, 0.2, 0.004]} /><meshBasicMaterial color="#d92b2b" /></mesh>
      <mesh position-z={0.055}><sphereGeometry args={[0.014, 8, 8]} /><primitive object={m.copper} attach="material" /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------- the brick oven where the bread is baked
export function Oven({ th = 123 }: { th?: number }) {
  const m = useMats();
  const light = useRef<THREE.PointLight>(null), flames = useRef<(THREE.Mesh | null)[]>([]), glow = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, k = 0.75 + 0.25 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1) + 0.12 * Math.sin(t * 17);
    if (light.current) light.current.intensity = 5 + 6 * k;
    if (glow.current) glow.current.opacity = 0.55 + 0.3 * k;
    flames.current.forEach((f, i) => { if (f) { const w = 0.7 + 0.5 * Math.sin(t * (7 + i * 2.3) + i * 1.7) * Math.sin(t * 3.1 + i); f.scale.set(1 + 0.12 * Math.sin(t * 11 + i), 0.75 + 0.4 * w + 0.15 * k, 1); } });
  });
  return (
    <group position={at(COUNTER_OUT - 0.5, th * DEG, 0)} rotation-y={-th * DEG}>
      <mesh position-y={0.45}><boxGeometry args={[1.5, 0.9, 0.95]} /><primitive object={m.brick} attach="material" /></mesh>
      <mesh position-y={0.92}><boxGeometry args={[1.62, 0.07, 1.05]} /><primitive object={m.marble} attach="material" /></mesh>
      <mesh position-y={1.28} scale={[1, 0.82, 0.78]}><sphereGeometry args={[0.78, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><primitive object={m.brick} attach="material" /></mesh>
      {/* the mouth of the oven: a dark arch with logs and real-looking flames */}
      <mesh position={[0, 1.12, 0.455]}><boxGeometry args={[0.6, 0.36, 0.05]} /><meshStandardMaterial color="#0d0706" roughness={1} /></mesh>
      <mesh position={[0, 1.3, 0.455]}><circleGeometry args={[0.3, 24, 0, Math.PI]} /><meshStandardMaterial color="#0d0706" roughness={1} /></mesh>
      <mesh position={[0, 1.11, 0.48]}><planeGeometry args={[0.9, 0.7]} /><meshBasicMaterial ref={glow} map={m.soft} color="#ff6a14" transparent opacity={0.8} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      {[-0.12, 0.0, 0.12].map((x, i) => <mesh key={i} position={[x, 0.97, 0.5]} rotation={[0, 0, Math.PI / 2 + (i - 1) * 0.3]}><cylinderGeometry args={[0.028, 0.032, 0.26, 8]} /><meshStandardMaterial color="#2a160c" roughness={0.9} emissive="#4a1608" /></mesh>)}
      {[[-0.1, 0.13, 0.7], [0.06, 0.16, 1], [0.15, 0.1, 0.55], [-0.02, 0.11, 0.85]].map(([x, h, o], i) => (
        <mesh key={i} ref={(e) => { flames.current[i] = e; }} position={[x as number, 1.0 + (h as number) * 0.5 + 0.06, 0.5]}><coneGeometry args={[0.07 + (i % 2) * 0.02, (h as number) * 2.4, 10]} /><meshBasicMaterial color={i % 2 ? "#ffd24a" : "#ff7a1c"} transparent opacity={o as number} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      ))}
      <pointLight ref={light} position={[0, 1.1, 0.8]} intensity={8} distance={3.8} decay={2} color="#ff8a3a" />
      <mesh position={[0, 2.0, -0.05]}><cylinderGeometry args={[0.17, 0.22, 0.9, 12, 1, true]} /><primitive object={m.steel} attach="material" /></mesh>
      {[-0.5, -0.25, 0].map((x, i) => <mesh key={i} position={[0.45 + x * 0.35, 1.02 + i * 0.002, 0.2]} rotation={[Math.PI / 2, 0, 0.3 + i * 0.5]}><capsuleGeometry args={[0.045, 0.5, 6, 14]} /><meshStandardMaterial map={m.bread} roughness={0.75} /></mesh>)}
      <Puffs origin={[0, 2.45, -0.05]} count={10} height={0.7} size={0.34} spread={0.14} opacity={0.2} />
      <Sparks origin={[0, 1.15, 0.5]} width={0.4} />
    </group>
  );
}

// ---------------------------------------------------------------- the panini press that really presses
export function Press({ p, rot = 0, phase = 0 }: { p: [number, number, number]; rot?: number; phase?: number }) {
  const m = useMats();
  const lid = useRef<THREE.Group>(null), hot = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const c = ((clock.elapsedTime + phase) % 8) / 8; // open, close, hold, open
    let open = 0.95;
    if (c < 0.55) open = 0.95; else if (c < 0.66) open = 0.95 * (1 - (c - 0.55) / 0.11); else if (c < 0.84) open = 0.02; else open = 0.95 * Math.min(1, (c - 0.84) / 0.12);
    if (lid.current) lid.current.rotation.x = -open; if (hot.current) hot.current.opacity = 0.06 + 0.12 * (1 - open);
  });
  const ribs = (y: number) => Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[-0.26 + i * 0.065, y, 0]}><boxGeometry args={[0.03, 0.016, 0.4]} /><meshStandardMaterial color="#2f3036" metalness={0.8} roughness={0.35} /></mesh>);
  return (
    <group position={p} rotation-y={rot}>
      <mesh position-y={0.05}><boxGeometry args={[0.64, 0.1, 0.46]} /><primitive object={m.steelDark} attach="material" /></mesh>
      {ribs(0.105)}
      <mesh position={[0, 0.11, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.55, 0.38]} /><meshBasicMaterial ref={hot} color="#ff6a1a" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <group ref={lid} position={[0, 0.1, -0.23]}>
        <mesh position={[0, 0.02, 0.23]}><boxGeometry args={[0.64, 0.07, 0.46]} /><primitive object={m.steelDark} attach="material" /></mesh>
        {ribs(-0.02).map((e, i) => <group key={i} position-z={0.23}>{e}</group>)}
        <mesh position={[0, 0.08, 0.42]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.018, 0.018, 0.34, 10]} /><meshStandardMaterial color="#111" roughness={0.6} /></mesh>
      </group>
      <Puffs origin={[0, 0.12, 0]} count={6} height={0.4} size={0.16} spread={0.1} opacity={0.18} />
    </group>
  );
}

export function Fan({ y = 1.99 }: { y?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, d) => { if (g.current) g.current.rotation.y += d * 9; });
  return (
    <group position-y={y} rotation-x={Math.PI}>
      <group ref={g}>{[0, 1, 2, 3].map((i) => <mesh key={i} rotation-y={(i * Math.PI) / 2} position={[0.17, 0, 0]} rotation-z={0.25}><boxGeometry args={[0.32, 0.008, 0.11]} /><meshStandardMaterial color="#9aa0a8" metalness={0.9} roughness={0.35} /></mesh>)}</group>
      <mesh><cylinderGeometry args={[0.04, 0.04, 0.03, 12]} /><meshStandardMaterial color="#222" /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------- the five ingredient stations, one behind each dish
export function Stations() {
  const m = useMats();
  return (
    <group>
      {DISH_TH.map((th, i) => (
        <group key={i} position={at(DISH_R, th, COUNTER_TOP)} rotation-y={-th}>
          {i === 0 && (<>
            <Crate p={[0.74, 0, -0.22]}>{[[-0.1, -0.04], [0.02, 0.02], [0.1, -0.05], [-0.04, 0.06], [0.11, 0.05]].map(([x, z], k) => <Produce key={k} p={[x, 0.17, z]} color={k % 2 ? "#d2321f" : "#c0271a"} r={0.052} />)}</Crate>
            <Basil p={[-0.68, 0, -0.22]} />
            <Bowl p={[0.4, 0, -0.4]} balls={5} fill fillColor="#e8f1ee" />
            <Jar p={[-0.3, 0.715, -0.4]} body="#55902f" /><Jar p={[-0.1, 0.715, -0.4]} body="#a52719" h={0.14} /><Jar p={[0.12, 0.715, -0.42]} body="#d9b24a" r={0.05} h={0.2} lid="#222" />
          </>)}
          {i === 1 && (<>
            <Basket p={[0.7, 0, -0.2]}>{[[-0.07, -0.02], [0.05, 0.03], [0.08, -0.06], [-0.03, 0.07], [0.0, -0.08]].map(([x, z], k) => <mesh key={k} position={[x, 0.15, z]} scale={[1, 0.62, 1]}><sphereGeometry args={[0.055, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} /><meshStandardMaterial color={k % 2 ? "#cdb99a" : "#8c6a4a"} roughness={0.7} /></mesh>)}</Basket>
            <group position={[-0.7, 0, -0.2]}>
              <mesh position-y={0.02}><boxGeometry args={[0.4, 0.04, 0.26]} /><primitive object={m.pine} attach="material" /></mesh>
              <mesh position={[-0.1, 0.1, 0]} scale={[1.3, 0.8, 0.8]}><sphereGeometry args={[0.07, 14, 12]} /><meshStandardMaterial color="#4a2459" roughness={0.3} /></mesh>
              <mesh position={[0.08, 0.075, 0.03]} rotation-z={Math.PI / 2}><capsuleGeometry args={[0.03, 0.14, 6, 10]} /><meshStandardMaterial color="#3f7a2f" roughness={0.4} /></mesh>
              <Produce p={[0.15, 0.1, -0.05]} color="#cf2a1c" r={0.055} sy={1.1} />
            </group>
            <Pot p={[-0.36, 0, -0.4]} copper={false} content="#b8431c" r={0.17} steam />
            <Jar p={[-0.28, 0.715, -0.4]} body="#55902f" /><Jar p={[0, 0.715, -0.4]} body="#5c6b2a" h={0.15} /><Jar p={[0.22, 0.715, -0.42]} body="#b8431c" />
          </>)}
          {i === 2 && (<>
            <Pot p={[-0.7, 0, -0.24]} copper content="#5a2f14" r={0.17} h={0.22} steam />
            <Basket p={[0.7, 0, -0.2]} r={0.2}>{[[-0.09, -0.03], [0.07, 0.04], [0.02, -0.09], [-0.04, 0.08], [0.11, -0.05]].map(([x, z], k) => <mesh key={k} position={[x, 0.15, z]} scale={[1, 0.88, 1]}><sphereGeometry args={[0.06, 14, 12]} /><meshStandardMaterial color={k % 2 ? "#c68a3a" : "#a8691f"} roughness={0.5} /></mesh>)}</Basket>
            <group position={[0.32, 0, -0.4]}>{[0, 1, 2].map((k) => <mesh key={k} position-y={0.03 + k * 0.045} rotation-x={Math.PI / 2}><torusGeometry args={[0.09 - k * 0.006, 0.026, 10, 22]} /><meshStandardMaterial color="#c58a2b" roughness={0.45} /></mesh>)}</group>
            <mesh position={[-0.3, 0.1, -0.4]}><cylinderGeometry args={[0.035, 0.05, 0.2, 12]} /><meshStandardMaterial color="#f6f0e2" roughness={0.4} /></mesh>
            <Jar p={[-0.2, 0.715, -0.4]} body="#7a3f1d" /><Jar p={[0.04, 0.715, -0.4]} body="#f1e9d2" h={0.15} /><Jar p={[0.26, 0.715, -0.42]} body="#c58a2b" />
          </>)}
          {i === 3 && (<>
            <group position={[-0.7, 0, -0.2]}>{[0, 1, 2, 3, 4].map((k) => <mesh key={k} position-y={0.012 + k * 0.022} rotation-y={k * 0.4}><cylinderGeometry args={[0.17, 0.17, 0.02, 24]} /><meshStandardMaterial color={k % 2 ? "#e9d9b4" : "#f0e2c0"} roughness={0.8} /></mesh>)}</group>
            <Jar p={[0.66, 0, -0.24]} body="#7da83a" r={0.07} h={0.22} />
            <mesh position={[0.4, 0.09, -0.2]} scale={[1, 0.95, 1]}><sphereGeometry args={[0.1, 16, 14]} /><meshStandardMaterial color="#9dc468" roughness={0.6} /></mesh>
            <Bowl p={[-0.32, 0, -0.4]} fill fillColor="#3a3a1f" r={0.13} />
            <mesh position={[0.34, 0.06, -0.4]}><sphereGeometry args={[0.06, 14, 12]} /><meshStandardMaterial color="#fbfaf2" roughness={0.35} /></mesh>
            <Jar p={[-0.22, 0.715, -0.4]} body="#4a5a1f" /><Jar p={[0, 0.715, -0.4]} body="#7da83a" h={0.14} /><Jar p={[0.22, 0.715, -0.42]} body="#2d2a16" r={0.05} />
          </>)}
          {i === 4 && (<>
            {[0, 1, 2].map((k) => <mesh key={k} position={[-0.74 + k * 0.1, 0.1, -0.2 + (k % 2) * 0.05]}><cylinderGeometry args={[0.032, 0.04, 0.2, 12]} /><meshStandardMaterial color="#b8210f" roughness={0.3} /></mesh>)}
            <group position={[0.7, 0, -0.2]}>{[[-0.05, 0], [0.04, 0.05], [0.0, -0.05], [0.08, -0.02], [-0.08, 0.04]].map(([x, z], k) => <mesh key={k} position={[x, 0.03, z]} rotation={[0.2, k, Math.PI / 2 - 0.2 * k]}><capsuleGeometry args={[0.014, 0.08, 4, 8]} /><meshStandardMaterial color="#cc2a17" roughness={0.35} /></mesh>)}</group>
            <Spit p={[0.0, 0, -0.4]} />
            <Jar p={[-0.26, 0.715, -0.4]} body="#b8210f" /><Jar p={[-0.04, 0.715, -0.4]} body="#e0a02a" h={0.14} /><Jar p={[0.2, 0.715, -0.42]} body="#a02a14" />
          </>)}
        </group>
      ))}
    </group>
  );
}
