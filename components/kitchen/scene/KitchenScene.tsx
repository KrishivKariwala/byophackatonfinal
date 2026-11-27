"use client";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, useTexture } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Suspense, memo, useEffect, useMemo, useRef, useState } from "react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { AISLE_R, COUNTER_IN, COUNTER_OUT, COUNTER_TOP, DEG, DISH_R, DISH_TH, DOOR_TH, EYE, FOCUS_LEAD, FOCUS_R, ISLAND_R, ROOM_R, WALL_H, lerp, lerpAngle, pForDish, pathTheta, polar, smoothstep, type WalkApi } from "./constants";
import * as TX from "./textures";
import { QualityCtx, pickDpr, useFx } from "./quality";
import { MatsProvider, useBuildMats, useMats } from "./materials";
import { Dust, Fan, HangingStrings, LightCone, Oven, Press, Puffs, Sparks, Stations, WallClock } from "./props";

/**
 * The round back-of-house kitchen of one restaurant, built from simple shapes and painted surfaces, with the real food photos on the plates.
 * Scrolling walks the camera along the aisle; when the visitor stops, the camera turns to the nearest dish. All words are ordinary HTML
 * around the canvas (so Hindi and Kannada render properly), except the painted signs that belong to the restaurant itself.
 */
export interface SceneProps {
  theme: KitchenTheme; api: WalkApi;
  /** one DOM element per dish; the scene moves it over the dish every frame */
  tags: React.MutableRefObject<(HTMLElement | null)[]>;
  onTap: (i: number) => void; onPlate: (i: number) => void; onAutoFocus: (i: number) => void; onUnfocus: () => void; onHover: (i: number | null) => void;
  onReady: () => void; fontsReady: boolean; portrait: boolean;
  /** stop drawing frames (the door is closed and nothing can be seen), to save the battery */
  paused?: boolean;
  /** the element that receives taps and drags (the scroll track sits above the canvas) */
  eventSource: React.RefObject<HTMLElement | null>;
}

// ---------------------------------------------------------------- helpers
function sectorGeometry(r0: number, r1: number, t0: number, t1: number, h: number, bevel = 0) {
  const a0 = Math.PI / 2 - t1, a1 = Math.PI / 2 - t0;
  const s = new THREE.Shape();
  s.moveTo(r1 * Math.cos(a0), r1 * Math.sin(a0)); s.absarc(0, 0, r1, a0, a1, false);
  s.lineTo(r0 * Math.cos(a1), r0 * Math.sin(a1)); s.absarc(0, 0, r0, a1, a0, true); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: Math.max(10, Math.round(Math.abs(t1 - t0) / DEG / 1.5)) });
  g.rotateX(-Math.PI / 2);
  return g;
}
const at = (r: number, th: number, y: number): [number, number, number] => { const [x, z] = polar(r, th); return [x, y, z]; };

// ---------------------------------------------------------------- the room: terrazzo floor, pine panelling, the Paris mural, a striped ceiling
const PANELS = 9;
function Room({ theme }: { theme: KitchenTheme }) {
  const m = useMats();
  const { brand, accent, brass, cream } = theme.colors;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}><circleGeometry args={[ROOM_R, 96]} /><primitive object={m.floor} attach="material" /></mesh>
      <mesh position-y={WALL_H / 2}><cylinderGeometry args={[ROOM_R, ROOM_R, WALL_H, 96, 1, true]} /><primitive object={m.plaster} attach="material" /></mesh>
      <mesh position-y={0.52}><cylinderGeometry args={[ROOM_R - 0.012, ROOM_R - 0.012, 1.04, 96, 1, true]} /><primitive object={m.pineWall} attach="material" /></mesh>
      <mesh position-y={1.1}><cylinderGeometry args={[ROOM_R - 0.016, ROOM_R - 0.016, 0.13, 96, 1, true]} /><meshStandardMaterial color={brand} roughness={0.35} side={THREE.BackSide} /></mesh>
      <mesh position-y={1.18}><cylinderGeometry args={[ROOM_R - 0.02, ROOM_R - 0.02, 0.035, 96, 1, true]} /><meshStandardMaterial color={brass} metalness={0.85} roughness={0.35} side={THREE.BackSide} /></mesh>
      {Array.from({ length: PANELS }, (_, i) => (
        <mesh key={i} position-y={2.3}><cylinderGeometry args={[ROOM_R - 0.02, ROOM_R - 0.02, 2.1, 14, 1, true, (i * 2 * Math.PI) / PANELS, (2 * Math.PI) / PANELS]} /><primitive object={m.murals[i % 2]} attach="material" /></mesh>
      ))}
      <mesh position-y={3.37}><cylinderGeometry args={[ROOM_R - 0.025, ROOM_R - 0.025, 0.05, 96, 1, true]} /><meshStandardMaterial color={accent} roughness={0.5} side={THREE.BackSide} /></mesh>
      <mesh position-y={WALL_H} rotation-x={Math.PI / 2}><circleGeometry args={[ROOM_R, 64]} /><primitive object={m.ceiling} attach="material" /></mesh>
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[0, WALL_H - 0.07, 0]} rotation-y={(i * Math.PI) / 6}><boxGeometry args={[ROOM_R * 2 - 0.2, 0.13, 0.17]} /><primitive object={m.pine} attach="material" /></mesh>)}
      <mesh position-y={WALL_H - 0.1} rotation-x={Math.PI / 2}><torusGeometry args={[ROOM_R - 0.1, 0.05, 8, 96]} /><meshStandardMaterial color={cream} roughness={0.6} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------- the marble counter, tile, shelves, rails and signs all round the wall
const ARC0 = -44 * DEG, ARC1 = 114 * DEG;
function Counter({ theme, fontsReady }: { theme: KitchenTheme; fontsReady: boolean }) {
  const m = useMats();
  const { brand, accent, cream, brass } = theme.colors;
  const geo = useMemo(() => ({
    base: sectorGeometry(COUNTER_IN, COUNTER_OUT, ARC0, ARC1, 0.78),
    kick: sectorGeometry(COUNTER_IN + 0.08, COUNTER_OUT, ARC0, ARC1, 0.1),
    top: sectorGeometry(COUNTER_IN - 0.05, COUNTER_OUT, ARC0 - 0.012, ARC1 + 0.012, 0.055, 0.01),
    splash: sectorGeometry(COUNTER_OUT - 0.06, COUNTER_OUT, ARC0, ARC1, 0.62),
    shelf: sectorGeometry(COUNTER_OUT - 0.5, COUNTER_OUT, ARC0, ARC1, 0.045),
  }), []);
  const kick = useMemo(() => new THREE.MeshStandardMaterial({ color: "#14161c", roughness: 0.8 }), []);
  const pans = useMemo(() => { const out: { th: number }[] = []; for (let a = ARC0 + 5 * DEG; a < ARC1 - 4 * DEG; a += 8.5 * DEG) out.push({ th: a }); return out; }, []);
  const railGeo = useMemo(() => { const pts: THREE.Vector3[] = []; for (let a = ARC0 - 18 * DEG; a <= ARC1 + 0.001; a += 4 * DEG) pts.push(new THREE.Vector3(...at(COUNTER_OUT - 0.1, a, 2.88))); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.013, 6, false); }, []);
  const signTex = useMemo(() => TX.signTexture({ w: 1024, h: 300, bg: brand, border: brass, lines: [
    { text: "Paris Panini", size: 150, color: "#ffffff", font: "'Abril Fatface', Georgia, serif", y: 125 },
    { text: "gourmet sandwiches & wraps", size: 46, color: cream, font: "'Josefin Sans', Arial, sans-serif", y: 238, spacing: 6 },
  ] }), [brand, brass, cream, fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const chalk = useMemo(() => TX.chalkTexture([
    { text: "Menu du jour", size: 92, y: 118, color: "#fff3c4" },
    { text: "paninis · wraps · sauces maison", size: 50, y: 230 },
    { text: "pressed to order", size: 60, y: 340 },
    { text: "rien ne se perd", size: 66, y: 470, color: "#ffb4a8" },
    { text: "(nothing is wasted)", size: 40, y: 545 },
  ], "'Josefin Sans', Arial, sans-serif"), [fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      <mesh geometry={geo.kick} material={kick} />
      <mesh geometry={geo.base} material={m.counter} position-y={0.1} />
      <mesh geometry={geo.top} material={m.marble} position-y={0.88} />
      <mesh geometry={geo.splash} material={m.blueTile} position-y={COUNTER_TOP} />
      <mesh geometry={geo.shelf} material={m.pine} position-y={1.6} />
      {/* the pan rail with copper pans */}
      <mesh geometry={railGeo} material={m.steel} />
      {pans.map((p, i) => (
        <group key={i} position={at(COUNTER_OUT - 0.16, p.th, 2.62)} rotation-y={-p.th}>
          <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.14, 0.13, 0.04, 20]} /><primitive object={i % 3 ? m.copper : m.steel} attach="material" /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.012, 0.012, 0.3, 6]} /><meshStandardMaterial color="#3a3a3a" metalness={0.5} /></mesh>
        </group>
      ))}
      {/* order tickets on their rail */}
      <group position={at(COUNTER_OUT - 0.1, 112 * DEG, 1.95)} rotation-y={-112 * DEG}>
        <mesh><boxGeometry args={[1.1, 0.025, 0.025]} /><primitive object={m.steel} attach="material" /></mesh>
        {[-0.45, -0.3, -0.16, -0.02, 0.12, 0.27, 0.42].map((x, i) => <Ticket key={i} x={x} i={i} />)}
      </group>
      {/* the restaurant's sign above the entrance end, and the chalk menu above the middle dish */}
      <group position={at(COUNTER_OUT - 0.03, -8 * DEG, 2.62)} rotation-y={8 * DEG}>
        <mesh position-z={-0.02}><boxGeometry args={[2.5, 0.78, 0.04]} /><meshStandardMaterial color={brand} roughness={0.5} /></mesh>
        <mesh position-z={0.003}><planeGeometry args={[2.4, 0.7]} /><meshBasicMaterial map={signTex} toneMapped={false} /></mesh>
        <mesh position={[-0.98, 0.43, 0.05]} scale={[1, 0.4, 0.6]}><sphereGeometry args={[0.12, 20, 12]} /><meshStandardMaterial color={accent} roughness={0.8} /></mesh>
      </group>
      <group position={at(COUNTER_OUT - 0.03, DISH_TH[2], 2.45)} rotation-y={-DISH_TH[2]}>
        <mesh position-z={-0.03}><boxGeometry args={[1.62, 1.02, 0.05]} /><primitive object={m.pine} attach="material" /></mesh>
        <mesh position-z={0.003}><planeGeometry args={[1.5, 0.94]} /><meshBasicMaterial map={chalk} toneMapped={false} /></mesh>
      </group>
      <group position={at(COUNTER_OUT - 0.08, 99 * DEG, 2.2)} rotation-y={-99 * DEG}>
        <mesh scale={[1, 0.34, 1]}><sphereGeometry args={[0.16, 22, 14]} /><meshStandardMaterial color={accent} roughness={0.9} /></mesh>
        <mesh position={[0, 0.07, 0.01]}><cylinderGeometry args={[0.012, 0.012, 0.05, 6]} /><meshStandardMaterial color="#2a1a10" /></mesh>
      </group>
    </group>
  );
}
function Ticket({ x, i }: { x: number; i: number }) {
  const r = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (r.current) r.current.rotation.z = (i % 3 - 1) * 0.04 + Math.sin(clock.elapsedTime * 1.4 + i) * 0.03; });
  return <mesh ref={r} position={[x, -0.12, 0.012]}><planeGeometry args={[0.1, 0.22]} /><meshStandardMaterial color="#fbfaf4" roughness={0.9} emissive="#fff1c8" emissiveIntensity={0.08} side={THREE.DoubleSide} /></mesh>;
}

// ---------------------------------------------------------------- the island, the grill and the chimney hood in the middle
function Island({ theme }: { theme: KitchenTheme }) {
  const m = useMats();
  const { brass } = theme.colors;
  const wood = m.pine;
  return (
    <group>
      <mesh position-y={0.45}><cylinderGeometry args={[ISLAND_R - 0.1, ISLAND_R - 0.05, 0.9, 8]} /><primitive object={m.steel} attach="material" /></mesh>
      <mesh position-y={0.92}><cylinderGeometry args={[ISLAND_R + 0.05, ISLAND_R + 0.05, 0.07, 8]} /><primitive object={m.steel} attach="material" /></mesh>
      {/* the flat-top grill, with sparks */}
      <mesh position={[0, 0.97, 0.42]}><boxGeometry args={[1.15, 0.03, 0.6]} /><primitive object={m.steelDark} attach="material" /></mesh>
      <mesh position={[0, 0.99, 0.42]} rotation-x={-Math.PI / 2}><planeGeometry args={[1.0, 0.45]} /><meshStandardMaterial color="#ff7a2a" emissive="#ff5a10" emissiveIntensity={0.35} transparent opacity={0.26} /></mesh>
      <Sparks origin={[0, 1.0, 0.42]} width={1.0} />
      <Puffs origin={[0.1, 1.0, 0.42]} count={14} height={1.0} size={0.5} spread={0.3} opacity={0.2} />
      <Press p={[-0.5, 0.955, -0.35]} rot={0.4} phase={0} />
      <Press p={[0.48, 0.955, -0.45]} rot={-0.2} phase={4} />
      <group position={[-0.55, 0.955, 0.45]}>
        <mesh position-y={0.11}><cylinderGeometry args={[0.17, 0.17, 0.22, 24]} /><primitive object={m.steel} attach="material" /></mesh>
        <mesh position-y={0.225}><cylinderGeometry args={[0.175, 0.175, 0.02, 24]} /><primitive object={m.steel} attach="material" /></mesh>
        <Puffs origin={[0, 0.25, 0]} count={8} height={0.5} size={0.2} spread={0.06} opacity={0.2} />
      </group>
      <group position={[0.75, 0.955, 0.38]} rotation-y={-0.5}>
        <mesh position-y={0.02}><boxGeometry args={[0.46, 0.04, 0.3]} /><primitive object={wood} attach="material" /></mesh>
        <mesh position={[0, 0.09, 0]} rotation-z={Math.PI / 2}><capsuleGeometry args={[0.04, 0.34, 6, 12]} /><meshStandardMaterial map={m.bread} roughness={0.75} /></mesh>
      </group>
      {[["#7aa04a", 1.0, 0.1], ["#d2503a", 1.1, -0.1], ["#f2efe6", 1.17, 0.25]].map(([c, x, z], i) => (
        <group key={i} position={[(x as number) - 0.28, 0.955, (z as number) - 0.08]} rotation-y={0.4}>
          <mesh position-y={0.05}><cylinderGeometry args={[0.07, 0.065, 0.1, 14]} /><primitive object={m.steel} attach="material" /></mesh>
          <mesh position-y={0.1}><cylinderGeometry args={[0.063, 0.063, 0.01, 14]} /><meshStandardMaterial color={c as string} roughness={0.6} /></mesh>
        </group>
      ))}
      {/* the chimney: steel hood, a fan inside, a duct to the ceiling, pans on a ring, a warm light and a cone of it */}
      <mesh position-y={2.4} rotation-y={Math.PI / 4}><cylinderGeometry args={[0.52, 1.72, 0.9, 4, 1, true]} /><primitive object={m.steel} attach="material" /></mesh>
      <mesh position-y={1.97} rotation-y={Math.PI / 4}><torusGeometry args={[1.2, 0.025, 6, 4]} /><meshStandardMaterial color={brass} metalness={0.9} roughness={0.3} /></mesh>
      <mesh position-y={(2.85 + WALL_H) / 2}><boxGeometry args={[0.74, WALL_H - 2.85, 0.74]} /><primitive object={m.steel} attach="material" /></mesh>
      <mesh position-y={1.965} rotation-x={Math.PI / 2}><circleGeometry args={[0.95, 4]} /><meshBasicMaterial color="#ffd08a" toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <Fan y={1.99} />
      <LightCone p={[0, 1.96, 0]} h={1.0} r={1.1} color="#ffb867" opacity={0.1} />
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.cos((i * Math.PI) / 2 + 0.78) * 1.5, 3.3, Math.sin((i * Math.PI) / 2 + 0.78) * 1.5]}><cylinderGeometry args={[0.008, 0.008, 0.8, 4]} /><meshStandardMaterial color="#333" /></mesh>)}
      {Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return (
        <group key={i} position={[Math.cos(a) * 1.56, 2.62, Math.sin(a) * 1.56]} rotation-y={-a + Math.PI / 2}>
          <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.12, 0.11, 0.035, 18]} /><primitive object={i % 3 ? m.copper : m.steel} attach="material" /></mesh>
          <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.01, 0.01, 0.24, 5]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
        </group>); })}
      <mesh position-y={2.62} rotation-x={Math.PI / 2}><torusGeometry args={[1.56, 0.012, 6, 64]} /><primitive object={m.steel} attach="material" /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------- the back door we came in through, and the rattan lamps
function DoorFrame({ theme, fontsReady }: { theme: KitchenTheme; fontsReady: boolean }) {
  const { brand, brass, cream, accent } = theme.colors;
  const m = useMats();
  const sign = useMemo(() => TX.signTexture({ w: 256, h: 128, bg: cream, border: accent, lines: [{ text: "OUVERT", size: 62, color: accent, font: "'Abril Fatface', Georgia, serif", y: 68 }] }), [cream, accent, fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group position={at(ROOM_R - 0.02, DOOR_TH, 0)} rotation-y={-DOOR_TH}>
      <mesh position={[0, 1.1, -0.06]}><planeGeometry args={[1.05, 2.2]} /><meshBasicMaterial color="#2c3a7a" toneMapped={false} /></mesh>
      <mesh position={[0, 1.1, -0.055]}><planeGeometry args={[1.05, 2.2]} /><meshBasicMaterial map={m.soft} color="#ffc46b" transparent opacity={0.55} toneMapped={false} depthWrite={false} /></mesh>
      {[[-0.56, 1.15, 0.07, 2.4], [0.56, 1.15, 0.07, 2.4]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0.05]}><boxGeometry args={[w, h, 0.14]} /><meshStandardMaterial color={cream} roughness={0.6} /></mesh>)}
      <mesh position={[0, 2.3, 0.05]}><boxGeometry args={[1.2, 0.1, 0.14]} /><meshStandardMaterial color={cream} roughness={0.6} /></mesh>
      <group position={[-0.5, 0, 0.1]} rotation-y={-1.75}>
        <mesh position={[0.5, 1.1, 0]}><boxGeometry args={[1.0, 2.2, 0.06]} /><meshStandardMaterial color={brand} roughness={0.4} metalness={0.05} /></mesh>
        {[[0.5, 1.55, 0.78, 0.9], [0.5, 0.55, 0.78, 0.7]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0.035]}><boxGeometry args={[w, h, 0.012]} /><meshStandardMaterial color="#222c78" roughness={0.45} /></mesh>)}
        <mesh position={[0.88, 1.05, 0.05]}><sphereGeometry args={[0.035, 12, 12]} /><meshStandardMaterial color={brass} metalness={0.9} roughness={0.25} /></mesh>
        <mesh position={[0.5, 1.7, 0.045]}><planeGeometry args={[0.28, 0.14]} /><meshBasicMaterial map={sign} toneMapped={false} /></mesh>
      </group>
    </group>
  );
}

function Lamps() {
  const m = useMats();
  const refs = useRef<(THREE.Group | null)[]>([]);
  const list = [-30, 0, 30, 60, 90];
  useFrame(({ clock }) => { refs.current.forEach((g, i) => { if (g) { g.rotation.z = Math.sin(clock.elapsedTime * 0.6 + i * 1.3) * 0.012; g.rotation.x = Math.cos(clock.elapsedTime * 0.5 + i) * 0.01; } }); });
  return (
    <group>
      {list.map((d, i) => (
        <group key={d} position={at(AISLE_R + 0.15, d * DEG, 2.78)}>
          <group ref={(e) => { refs.current[i] = e; }}>
            <mesh position-y={0.5}><cylinderGeometry args={[0.006, 0.006, 1.0, 4]} /><meshStandardMaterial color="#222" /></mesh>
            <mesh><cylinderGeometry args={[0.3, 0.3, 0.32, 28, 1, true]} /><meshStandardMaterial map={m.rattan} color="#f0d9a8" side={THREE.DoubleSide} roughness={0.9} emissive="#ffb24a" emissiveIntensity={0.65} /></mesh>
            <mesh position-y={0.16} rotation-x={-Math.PI / 2}><circleGeometry args={[0.3, 24]} /><meshStandardMaterial map={m.rattan} /></mesh>
            <mesh position-y={-0.06} rotation-x={Math.PI / 2}><circleGeometry args={[0.26, 24]} /><meshBasicMaterial color="#fff0c8" toneMapped={false} transparent opacity={0.85} /></mesh>
          </group>
          <LightCone p={[0, -0.15, 0]} h={1.5} r={0.75} opacity={0.09} />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- the five dishes
function Dish({ index, dish, focused, onTap, onPlate, onHover }: { index: number; dish: KitchenTheme["dishes"][number]; focused: React.MutableRefObject<number | null>; onTap: (i: number) => void; onPlate: (i: number) => void; onHover: (i: number | null) => void }) {
  const map = useTexture(dish.plate);
  useMemo(() => { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; return map; }, [map]);
  const g = useRef<THREE.Group>(null), tilt = useRef<THREE.Group>(null), pool = useRef<THREE.Mesh>(null), hov = useRef(false);
  const soft = useMemo(() => TX.softTexture(), []);
  const th = DISH_TH[index];
  useFrame(({ pointer }, d) => {
    if (!tilt.current || !g.current) return;
    const f = focused.current === index;
    const a = f ? 1.2 : hov.current ? 0.98 : 0.8;
    const rx = THREE.MathUtils.damp(tilt.current.rotation.x, a - Math.PI / 2, 5, d);
    tilt.current.rotation.x = rx;
    tilt.current.rotation.y = THREE.MathUtils.damp(tilt.current.rotation.y, f ? -pointer.x * 0.35 : 0, 5, d);
    tilt.current.position.y = THREE.MathUtils.damp(tilt.current.position.y, f ? 0.56 : 0.43, 5, d);
    tilt.current.position.z = THREE.MathUtils.damp(tilt.current.position.z, f ? 0.2 : 0, 5, d);
    const s = THREE.MathUtils.damp(tilt.current.scale.x, f ? 1.14 : hov.current ? 1.07 : 1, 6, d);
    tilt.current.scale.setScalar(s);
    if (pool.current) (pool.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.damp((pool.current.material as THREE.MeshBasicMaterial).opacity, f ? 0.5 : 0.22, 4, d);
  });
  return (
    <group ref={g} position={at(DISH_R, th, COUNTER_TOP)} rotation-y={-th}>
      <mesh ref={pool} rotation-x={-Math.PI / 2} position-y={0.004}><planeGeometry args={[1.9, 1.9]} /><meshBasicMaterial map={soft} color="#ffb259" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.006}><planeGeometry args={[0.95, 0.95]} /><meshBasicMaterial map={soft} color="#000" transparent opacity={0.55} depthWrite={false} /></mesh>
      <group ref={tilt} position={[0, 0.43, 0]} rotation-x={0.8 - Math.PI / 2}>
        {/* the stand that props the tray up */}
        <mesh position={[0, -0.12, -0.2]} rotation-x={0.2}><cylinderGeometry args={[0.018, 0.018, 0.6, 6]} /><meshStandardMaterial color="#8d939b" metalness={0.9} roughness={0.3} /></mesh>
        <mesh position-z={-0.02} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.385, 0.385, 0.035, 48]} /><meshStandardMaterial color="#c3c8cf" metalness={0.9} roughness={0.28} /></mesh>
        <mesh position-z={0.0}><torusGeometry args={[0.37, 0.016, 10, 56]} /><meshStandardMaterial color="#d9dde2" metalness={0.95} roughness={0.22} /></mesh>
        <mesh position-z={0.004}><circleGeometry args={[0.352, 72]} /><meshBasicMaterial map={map} toneMapped={false} /></mesh>
      </group>
      <Steam count={10} height={0.5} spread={0.1} size={0.14} opacity={0.16} origin={[0, 0.85, 0.05]} />
      {/* an invisible ball around the plate catches taps; it never moves, so the plate cannot dodge the pointer */}
      <mesh position={[0, 0.5, 0.05]} onClick={(e) => { e.stopPropagation(); if (focused.current === index) onPlate(index); else onTap(index); }} onPointerOver={(e) => { e.stopPropagation(); hov.current = true; onHover(index); }} onPointerOut={() => { hov.current = false; onHover(null); }}>
        <sphereGeometry args={[0.46, 10, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- steam: a few soft puffs rising and fading
type SteamProps = { count: number; height: number; spread: number; size: number; opacity: number; origin: [number, number, number]; axis?: "y" | "z" };
function Steam(p: SteamProps) { return useFx() ? <SteamImpl {...p} /> : null; }
function SteamImpl({ count, height, spread, size, opacity, origin, axis = "y" }: SteamProps) {
  const soft = useMemo(() => TX.softTexture(), []);
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3)); g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3)); return g; }, [count]);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ o: i / count, a: (i * 2.399) % 6.283, s: 0.7 + ((i * 37) % 10) / 22 })), [count]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime; const pos = geo.attributes.position as THREE.BufferAttribute, col = geo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const s = seeds[i]; const u = (t * 0.16 * s.s + s.o) % 1; const sway = Math.sin(t * 0.9 + s.a) * spread * u;
      const x = origin[0] + sway + Math.cos(s.a) * spread * 0.4 * u, y = u * height, z = origin[2] + Math.sin(s.a) * spread * 0.4 * u;
      if (axis === "y") pos.setXYZ(i, x, origin[1] + y, z); else pos.setXYZ(i, x, origin[1] + z, origin[2] + y);
      const k = Math.sin(u * Math.PI) * opacity; col.setXYZ(i, k, k, k);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
  });
  return <points geometry={geo} frustumCulled={false}><pointsMaterial map={soft} size={size} sizeAttenuation vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points>;
}

// ---------------------------------------------------------------- lights, environment and camera
function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl); const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env; scene.environmentIntensity = 0.3;
    return () => { scene.environment = null; env.dispose(); pm.dispose(); };
  }, [gl, scene]);
  return null;
}

function Lights({ api }: { api: WalkApi }) {
  const spot = useRef<THREE.SpotLight>(null), target = useMemo(() => new THREE.Object3D(), []);
  const cur = useRef({ th: DISH_TH[0], k: 0 });
  useFrame(({ camera }, d) => {
    const f = api.focus.current;
    // the spotlight goes to the focused dish, or to the dish nearest the camera
    let th: number;
    if (f != null) th = DISH_TH[f];
    else { let best = 0, bd = 9; const ct = Math.atan2(camera.position.x, -camera.position.z); for (let i = 0; i < DISH_TH.length; i++) { const dd = Math.abs(DISH_TH[i] - ct); if (dd < bd) { bd = dd; best = i; } } th = DISH_TH[best]; }
    cur.current.th = lerpAngle(cur.current.th, th, 1 - Math.exp(-4 * d));
    cur.current.k = THREE.MathUtils.damp(cur.current.k, f != null ? 1 : 0.6, 4, d);
    if (spot.current) { const [x, z] = polar(DISH_R - 1.1, cur.current.th); spot.current.position.set(x, 2.9, z); spot.current.intensity = 26 * cur.current.k + 8; const [tx, tz] = polar(DISH_R, cur.current.th); target.position.set(tx, COUNTER_TOP + 0.35, tz); }
  });
  return (
    <>
      <hemisphereLight args={["#ffe0b8", "#1a2050", 0.3]} />
      <pointLight position={[0, 1.85, 0]} intensity={20} distance={7.5} decay={2} color="#ffb867" />
      <spotLight ref={spot} angle={0.5} penumbra={0.85} distance={7} decay={1.6} color="#ffe0b0" target={target} />
      <primitive object={target} />
    </>
  );
}

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

/** Moves the camera: along the aisle with scrolling, to the dish when it is focused, with drag-to-look on top. Also places the dish name tags and notices when the visitor stops. */
function Rig({ api, tags, onAutoFocus, onUnfocus, portrait }: Pick<SceneProps, "api" | "tags" | "onAutoFocus" | "onUnfocus" | "portrait">) {
  const { camera, size } = useThree();
  const st = useRef({ t: 0, f: 0, fi: 0, lx: 0, ly: 0, sx: 0, sy: 0, enter: 0, idle: 0, lastP: 0, focusP: 0, fov: 58, lastFocus: null as number | null });
  const v = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const rel0 = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => { (camera as THREE.PerspectiveCamera).clearViewOffset(); }, [camera]);
  useFrame(({ clock }, d) => {
    d = Math.min(d, 0.05);
    const s = st.current, cam = camera as THREE.PerspectiveCamera;
    const p = api.progress.current;
    s.t = THREE.MathUtils.damp(s.t, p, 3.6, d);
    s.enter = THREE.MathUtils.damp(s.enter, api.enter.current, 1.7, d);
    const focus = api.focus.current;
    // note where the scroll was when a dish was focused; scrolling clearly away from there (and only that) lets it go
    if (focus !== s.lastFocus) { s.lastFocus = focus; if (focus != null) { s.fi = focus; s.focusP = p; } }
    s.f = THREE.MathUtils.damp(s.f, focus != null ? 1 : 0, 3.4, d);

    // the pose on the aisle
    const th = pathTheta(s.t);
    const r = lerp(4.75, AISLE_R, smoothstep(0, 0.17, s.t));
    const [px, pz] = polar(r, th);
    const bias = lerp(-0.5, 0.3, smoothstep(0.02, 0.23, s.t));
    const yawPath = -th - Math.PI / 2 + bias;
    let x = px, z = pz, yaw = yawPath, pitch = -0.1, y = EYE;
    // the pose in front of the focused dish
    if (s.f > 0.001) {
      const dth = DISH_TH[s.fi];
      const [fx, fz] = polar(FOCUS_R, dth - FOCUS_LEAD * 0.6);
      const [tx, tz] = polar(DISH_R, dth);
      const fy = EYE - 0.05;
      const yawF = Math.atan2(-(tx - fx), -(tz - fz));
      const pitchF = Math.atan2(1.48 - fy, Math.hypot(tx - fx, tz - fz));
      const e = s.f * s.f * (3 - 2 * s.f);
      x = lerp(px, fx, e); z = lerp(pz, fz, e); y = lerp(EYE, fy, e); yaw = lerpAngle(yawPath, yawF, e); pitch = lerp(-0.1, pitchF, e);
    }
    // looking around by dragging, and a little breathing
    const lk = api.look.current;
    s.lx = THREE.MathUtils.damp(s.lx, lk.x, 7, d); s.ly = THREE.MathUtils.damp(s.ly, lk.y, 7, d);
    const damp = 1 - 0.8 * s.f;
    const t = clock.elapsedTime;
    const moving = Math.abs(p - s.t);
    y += Math.sin(t * 1.5) * 0.004 + Math.sin(t * 9) * 0.006 * Math.min(1, moving * 90);
    cam.position.set(x, y, z);
    cam.rotation.set(pitch + s.ly * damp, yaw + s.lx * damp, Math.sin(t * 0.8) * 0.0025, "YXZ");

    // the opening push-in when the door opens
    const en = s.enter * s.enter * (3 - 2 * s.enter);
    const baseFov = portrait ? 74 : 58;
    s.fov = THREE.MathUtils.damp(s.fov, baseFov, 3, d);
    const fovNow = s.fov + (1 - en) * 16;
    if (Math.abs(cam.fov - fovNow) > 0.01) { cam.fov = fovNow; }
    // push the scene aside to make room for the dish sheet
    const sh = api.shift.current;
    s.sx = THREE.MathUtils.damp(s.sx, sh.x * s.f, 4, d); s.sy = THREE.MathUtils.damp(s.sy, sh.y * s.f, 4, d);
    cam.setViewOffset(size.width, size.height, s.sx * size.width, s.sy * size.height, size.width, size.height);
    cam.updateProjectionMatrix();

    // resting on a dish: turn to it and open the sheet; scrolling again lets go
    const dp = Math.abs(p - s.lastP); s.lastP = p;
    s.idle = dp < 0.00025 ? s.idle + d : 0;
    if (api.rest.current != null && Math.abs(p - api.rest.current) > 0.012) api.rest.current = null;
    if (focus == null && !api.busy.current && api.rest.current == null && s.enter > 0.9 && s.idle > 0.55) {
      let best = -1, bd = 1;
      for (let i = 0; i < DISH_TH.length; i++) { const dd = Math.abs(pForDish(i) - s.t); if (dd < bd) { bd = dd; best = i; } }
      if (best >= 0 && bd < 0.04) onAutoFocus(best);
    }
    if (focus != null && Math.abs(p - s.focusP) > 0.03 && !api.busy.current) onUnfocus();

    // the dish name tags
    cam.getWorldDirection(fwd);
    for (let i = 0; i < DISH_TH.length; i++) {
      const el = tags.current[i]; if (!el) continue;
      const [dx, dz] = polar(DISH_R, DISH_TH[i]);
      v.set(dx, COUNTER_TOP + 0.78, dz);
      const rel = rel0.copy(v).sub(cam.position);
      const dist = rel.length(); const inFront = rel.dot(fwd) / dist;
      v.project(cam);
      const sx = (v.x * 0.5 + 0.5) * size.width, sy = (-v.y * 0.5 + 0.5) * size.height;
      const near = smoothstep(6.3, 4.4, dist) * smoothstep(0.35, 0.55, inFront);
      const other = focus != null && focus !== i ? 0 : 1;
      const show = focus === i ? 0.0 : near * other;
      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
      el.style.opacity = show.toFixed(2); el.style.pointerEvents = show > 0.5 ? "auto" : "none";
      el.style.zIndex = String(Math.round(1000 - dist * 100));
    }
  });
  return null;
}

function World(p: SceneProps) {
  const { theme, api } = p;
  const mats = useBuildMats(theme);
  return (
    <MatsProvider value={mats}>
      <Room theme={theme} />
      <Counter theme={theme} fontsReady={p.fontsReady} />
      <Island theme={theme} />
      <Oven th={123} />
      <Stations />
      <HangingStrings />
      <WallClock th={76} />
      <DoorFrame theme={theme} fontsReady={p.fontsReady} />
      <Lamps />
      <Dust />
      {theme.dishes.map((dish, i) => <Dish key={dish.id} index={i} dish={dish} focused={api.focus} onTap={p.onTap} onPlate={p.onPlate} onHover={p.onHover} />)}
      <Rig api={api} tags={p.tags} onAutoFocus={p.onAutoFocus} onUnfocus={p.onUnfocus} portrait={p.portrait} />
    </MatsProvider>
  );
}

/**
 * Warm-up. WebGL does its first-time work lazily: compiling a shader, decoding and uploading a texture, sending a model to the graphics card,
 * all the first time something comes into view. Each is a freeze of 50 to 150 ms in the middle of the walk. So do it all now, while the door is
 * still closed: compile every shader, then draw the whole kitchen once, ignoring what is in view. Only then is the kitchen "ready".
 */
function Warmup({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let off = false;
    (async () => {
      try { await gl.compileAsync(scene, camera); } catch { gl.compile(scene, camera); }
      if (off) return;
      const culled: THREE.Object3D[] = [];
      scene.traverse((o) => { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false; } });
      gl.render(scene, camera);
      culled.forEach((o) => { o.frustumCulled = true; });
      onDone();
    })();
    return () => { off = true; };
  }, [gl, scene, camera, onDone]);
  return null;
}

/** numbers for the measuring script (scripts/perf-kitchen.ts): draw calls, triangles, textures, the sharpness in use */
function PerfProbe({ info }: { info: { dpr: number; fx: boolean } }) {
  const gl = useThree((s) => s.gl);
  const uploads = useRef(0);
  useEffect(() => {
    const ctx = gl.getContext() as WebGL2RenderingContext;
    const wrap = (name: "texImage2D" | "texSubImage2D" | "texStorage2D") => { const orig = (ctx[name] as (...a: unknown[]) => unknown).bind(ctx); (ctx as unknown as Record<string, unknown>)[name] = (...a: unknown[]) => { uploads.current++; return orig(...a); }; };
    wrap("texImage2D"); wrap("texSubImage2D");
    (window as unknown as { __kitchen?: unknown }).__kitchen = () => ({ uploads: uploads.current, calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, programs: gl.info.programs?.length ?? 0, pixelRatio: gl.getPixelRatio(), canvas: [gl.domElement.width, gl.domElement.height], dpr: info.dpr, fx: info.fx, renderer: (gl.getContext().getParameter(gl.getContext().RENDERER) as string) });
  }, [gl, info]);
  return null;
}

function KitchenSceneInner(p: SceneProps) {
  const { theme, api } = p;
  // The page around the scene re-renders often (hover, scroll hints, the cart). The scene must not: hand it handlers that never change.
  const live = useRef(p); live.current = p;
  const stable = useMemo(() => ({
    onTap: (i: number) => live.current.onTap(i), onPlate: (i: number) => live.current.onPlate(i), onAutoFocus: (i: number) => live.current.onAutoFocus(i),
    onUnfocus: () => live.current.onUnfocus(), onHover: (i: number | null) => live.current.onHover(i), onReady: () => live.current.onReady(),
  }), []);
  const sceneProps = useMemo(() => ({ theme: p.theme, api: p.api, tags: p.tags, fontsReady: p.fontsReady, portrait: p.portrait, paused: p.paused, eventSource: p.eventSource, ...stable }), [p.theme, p.api, p.tags, p.fontsReady, p.portrait, p.paused, p.eventSource, stable]);
  // Sharpness follows the device. The start is a pixel budget (a Retina laptop screen at full sharpness is four times the work for little gain
  // in a moving scene); when frames still run slow, step the sharpness down, and then switch the see-through effects off.
  // ?dpr=1 and ?fx=0 force a setting, for testing.
  const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const forcedDpr = Number(q?.get("dpr")) || 0, forcedFx = q?.get("fx");
  const base = useMemo(() => forcedDpr || (typeof window === "undefined" ? 1 : pickDpr(window.innerWidth, window.innerHeight, window.matchMedia("(pointer: coarse)").matches)), [forcedDpr]);
  const [dpr, setDpr] = useState(base);
  const [fx, setFx] = useState(forcedFx !== "0");
  const adapt = !forcedDpr && forcedFx == null;
  const probe = useMemo(() => ({ dpr, fx }), [dpr, fx]);
  return (
    <Canvas frameloop={p.paused ? "never" : "always"} dpr={dpr} camera={{ fov: 58, near: 0.08, far: 40, position: [0, EYE, 0] }} gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
        style={{ position: "absolute", inset: 0 }} eventSource={p.eventSource as React.RefObject<HTMLElement>} eventPrefix="client" aria-hidden="true">
        <QualityCtx.Provider value={{ fx }}>
        <color attach="background" args={[theme.colors.ink]} />
        <fogExp2 attach="fog" args={[theme.colors.ink, 0.05]} />
        {adapt && <PerformanceMonitor flipflops={4} bounds={(hz) => [hz * 0.7, hz * 0.93]} onDecline={() => { if (dpr > 1.01) setDpr((d) => Math.max(1, d - 0.25)); else setFx(false); }} onIncline={() => { if (!fx) setFx(true); else setDpr((d) => Math.min(base, d + 0.25)); }} />}
        <PerfProbe info={probe} />
        <Env />
        <Lights api={api} />
        <TapPosition />
        <Suspense fallback={null}>
          <World {...sceneProps} />
          <Warmup onDone={stable.onReady} />
        </Suspense>
        </QualityCtx.Provider>
      </Canvas>
  );
}

export default memo(KitchenSceneInner, (a, b) => a.theme === b.theme && a.api === b.api && a.tags === b.tags && a.fontsReady === b.fontsReady && a.portrait === b.portrait && a.paused === b.paused && a.eventSource === b.eventSource);
