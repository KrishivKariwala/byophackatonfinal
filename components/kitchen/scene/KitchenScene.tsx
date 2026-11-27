"use client";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, useTexture } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { AISLE_R, COUNTER_IN, COUNTER_OUT, COUNTER_TOP, DEG, DISH_R, DISH_TH, DOOR_TH, EYE, FOCUS_LEAD, FOCUS_R, ISLAND_R, ROOM_R, WALL_H, lerp, lerpAngle, pForDish, pathTheta, polar, smoothstep, type WalkApi } from "./constants";
import * as TX from "./textures";

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

// ---------------------------------------------------------------- the room
function Room({ theme, fontsReady }: { theme: KitchenTheme; fontsReady: boolean }) {
  const { brand, brandDark, accent, cream, brass, ink } = theme.colors;
  const t = useMemo(() => {
    const floor = TX.checkerTexture("#e9e0cc", "#2a3170");
    const wall = TX.subwayTexture(); wall.repeat.set(28.5, 3.1);
    const blue = TX.glazedTileTexture(brand, brandDark); blue.repeat.set(28.5, 0.96);
    const mural = TX.muralTexture(brandDark); mural.repeat.set(17, 1);
    return { floor, wall, blue, mural };
  }, [brand, brandDark]);
  void fontsReady;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}><circleGeometry args={[ROOM_R, 80]} /><meshStandardMaterial map={t.floor} roughness={0.32} metalness={0.05} /></mesh>
      <mesh position-y={WALL_H / 2}><cylinderGeometry args={[ROOM_R, ROOM_R, WALL_H, 96, 1, true]} /><meshStandardMaterial map={t.wall} roughness={0.28} side={THREE.BackSide} /></mesh>
      <mesh position-y={0.58}><cylinderGeometry args={[ROOM_R - 0.006, ROOM_R - 0.006, 1.16, 96, 1, true]} /><meshStandardMaterial map={t.blue} roughness={0.2} metalness={0.05} side={THREE.BackSide} /></mesh>
      <mesh position-y={1.19}><cylinderGeometry args={[ROOM_R - 0.03, ROOM_R - 0.03, 0.06, 96, 1, true]} /><meshStandardMaterial color={brass} roughness={0.35} metalness={0.7} side={THREE.BackSide} /></mesh>
      <mesh position-y={3.28}><cylinderGeometry args={[ROOM_R - 0.004, ROOM_R - 0.004, 0.5, 96, 1, true]} /><meshStandardMaterial map={t.mural} roughness={0.9} side={THREE.BackSide} /></mesh>
      <mesh position-y={3.55}><cylinderGeometry args={[ROOM_R - 0.03, ROOM_R - 0.03, 0.06, 96, 1, true]} /><meshStandardMaterial color={accent} roughness={0.5} side={THREE.BackSide} /></mesh>
      <mesh position-y={WALL_H} rotation-x={Math.PI / 2}><circleGeometry args={[ROOM_R, 64]} /><meshStandardMaterial color={ink} roughness={0.95} /></mesh>
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0, WALL_H - 0.08, 0]} rotation-y={(i * Math.PI) / 8}><boxGeometry args={[ROOM_R * 2 - 0.2, 0.14, 0.16]} /><meshStandardMaterial color="#3a2a1c" roughness={0.8} /></mesh>)}
      <mesh position-y={WALL_H - 0.12}><torusGeometry args={[ROOM_R - 0.12, 0.04, 8, 96]} /><meshStandardMaterial color={cream} roughness={0.6} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------- the stone counter, shelves, rails, signs and tubs all round the wall
const ARC0 = -44 * DEG, ARC1 = 112 * DEG;
function Counter({ theme, fontsReady }: { theme: KitchenTheme; fontsReady: boolean }) {
  const { brand, accent, cream, brass } = theme.colors;
  const geo = useMemo(() => ({
    base: sectorGeometry(COUNTER_IN, COUNTER_OUT, ARC0, ARC1, 0.78),
    kick: sectorGeometry(COUNTER_IN + 0.08, COUNTER_OUT, ARC0, ARC1, 0.1),
    top: sectorGeometry(COUNTER_IN - 0.04, COUNTER_OUT, ARC0 - 0.01, ARC1 + 0.01, 0.05, 0.008),
    splash: sectorGeometry(COUNTER_OUT - 0.06, COUNTER_OUT, ARC0, ARC1, 0.62),
    shelf: sectorGeometry(COUNTER_OUT - 0.5, COUNTER_OUT, ARC0, ARC1, 0.045),
  }), []);
  const m = useMemo(() => {
    const steel = TX.steelTexture(); const granite = TX.graniteTexture(); granite.repeat.set(1.3, 1.3); const wood = TX.woodTexture("#8a5a2e"); const cane = TX.caneTexture();
    return { steel, granite, wood, cane };
  }, []);
  const mats = useMemo(() => ({
    steel: new THREE.MeshStandardMaterial({ map: m.steel, roughness: 0.38, metalness: 0.75 }),
    kick: new THREE.MeshStandardMaterial({ color: "#14161c", roughness: 0.8 }),
    granite: new THREE.MeshStandardMaterial({ map: m.granite, roughness: 0.2, metalness: 0.1 }),
    wood: new THREE.MeshStandardMaterial({ map: m.wood, roughness: 0.7 }),
  }), [m]);

  // tubs on the lower shelf, plates and jars
  const tubs = useMemo(() => {
    const out: { p: [number, number, number]; r: number; h: number; c: string }[] = [];
    const cols = ["#d9dde2", "#c5a35a", "#f4f1ea", "#7f9a52", "#c25a3c", "#d9dde2", "#e8d9b0"];
    for (let a = ARC0 + 3 * DEG; a < ARC1 - 2 * DEG; a += 3.4 * DEG) {
      const k = Math.round((a - ARC0) / (3.4 * DEG));
      const h = 0.1 + ((k * 7) % 5) * 0.025;
      out.push({ p: at(COUNTER_OUT - 0.24 + (k % 2) * 0.1, a, 1.64 + h / 2), r: 0.065 + ((k * 3) % 3) * 0.012, h, c: cols[k % cols.length] });
    }
    return out;
  }, []);
  const pans = useMemo(() => { const out: { th: number; r: number }[] = []; for (let a = ARC0 + 6 * DEG; a < ARC1 - 4 * DEG; a += 8.5 * DEG) out.push({ th: a, r: 0.1 + (Math.round(a * 50) % 3) * 0.025 }); return out; }, []);
  const rail = useMemo(() => { const out: { th: number }[] = []; for (let a = ARC0; a <= ARC1; a += 2.5 * DEG) out.push({ th: a }); return out; }, []);

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
      <mesh geometry={geo.kick} material={mats.kick} />
      <mesh geometry={geo.base} material={mats.steel} position-y={0.1} />
      <mesh geometry={geo.top} material={mats.granite} position-y={0.88} />
      <mesh geometry={geo.splash} material={mats.steel} position-y={COUNTER_TOP} />
      <mesh geometry={geo.shelf} material={mats.wood} position-y={1.6} />
      {/* tubs and jars on the shelf */}
      {tubs.map((t, i) => (
        <mesh key={i} position={t.p}><cylinderGeometry args={[t.r, t.r * 0.92, t.h, 14]} /><meshStandardMaterial color={t.c} roughness={0.4} metalness={t.c === "#d9dde2" ? 0.6 : 0.1} /></mesh>
      ))}
      {/* the pan rail with copper pans hanging on it */}
      {rail.map((r, i) => <mesh key={i} position={at(COUNTER_OUT - 0.1, r.th, 2.88)} rotation-y={-r.th}><boxGeometry args={[0.27, 0.025, 0.025]} /><meshStandardMaterial color="#b8bdc4" metalness={0.9} roughness={0.3} /></mesh>)}
      {pans.map((p, i) => (
        <group key={i} position={at(COUNTER_OUT - 0.16, p.th, 2.62)} rotation-y={-p.th}>
          <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.14, 0.13, 0.04, 20]} /><meshStandardMaterial color="#b8683a" metalness={0.85} roughness={0.35} /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.012, 0.012, 0.3, 6]} /><meshStandardMaterial color="#3a3a3a" metalness={0.5} /></mesh>
          <mesh position={[0, -0.02, 0.02]} rotation-z={0}><boxGeometry args={[0.02, 0.01, 0.01]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.02, 8, 8]} /><meshStandardMaterial color="#b8bdc4" metalness={0.9} roughness={0.3} /></mesh>
          <mesh position={[0, 0.25 - p.r * 0, 0]}><cylinderGeometry args={[0.004, 0.004, 0.2, 4]} /><meshStandardMaterial color="#444" /></mesh>
        </group>
      ))}
      {/* order tickets on their rail */}
      <group position={at(COUNTER_OUT - 0.1, -33 * DEG, 1.95)} rotation-y={33 * DEG}>
        <mesh><boxGeometry args={[1.1, 0.025, 0.025]} /><meshStandardMaterial color="#b8bdc4" metalness={0.9} roughness={0.3} /></mesh>
        {[-0.45, -0.3, -0.16, -0.02, 0.12, 0.27, 0.42].map((x, i) => (
          <mesh key={i} position={[x, -0.12, 0.012]} rotation-z={(i % 3 - 1) * 0.04}><planeGeometry args={[0.1, 0.22]} /><meshStandardMaterial color="#fbfaf4" roughness={0.9} emissive="#fff1c8" emissiveIntensity={0.08} side={THREE.DoubleSide} /></mesh>
        ))}
      </group>
      {/* the restaurant's sign above the first dishes, and the chalk menu above the middle one */}
      <group position={at(COUNTER_OUT - 0.03, -20 * DEG, 2.34)} rotation-y={20 * DEG}>
        <mesh position-z={-0.02}><boxGeometry args={[2.5, 0.78, 0.04]} /><meshStandardMaterial color={brand} roughness={0.5} /></mesh>
        <mesh position-z={0.003}><planeGeometry args={[2.4, 0.7]} /><meshBasicMaterial map={signTex} toneMapped={false} /></mesh>
        <mesh position={[-1.18, 0.5, -0.03]}><cylinderGeometry args={[0.008, 0.008, 0.5, 5]} /><meshStandardMaterial color="#333" /></mesh>
        <mesh position={[1.18, 0.5, -0.03]}><cylinderGeometry args={[0.008, 0.008, 0.5, 5]} /><meshStandardMaterial color="#333" /></mesh>
        {/* beret and moustache */}
        <mesh position={[-0.98, 0.43, 0.05]} scale={[1, 0.4, 0.6]}><sphereGeometry args={[0.12, 20, 12]} /><meshStandardMaterial color={accent} roughness={0.8} /></mesh>
      </group>
      <group position={at(COUNTER_OUT - 0.03, DISH_TH[2], 2.36)} rotation-y={-DISH_TH[2]}>
        <mesh position-z={-0.03}><boxGeometry args={[1.62, 1.02, 0.05]} /><meshStandardMaterial color="#6a4524" roughness={0.7} /></mesh>
        <mesh position-z={0.003}><planeGeometry args={[1.5, 0.94]} /><meshBasicMaterial map={chalk} toneMapped={false} /></mesh>
      </group>
      {/* a French flag and the red beret on its hook */}
      <group position={at(COUNTER_OUT - 0.02, 106 * DEG, 2.3)} rotation-y={-106 * DEG}>
        {[brand, "#f4f1ea", accent].map((c, i) => <mesh key={i} position={[(i - 1) * 0.2, 0, 0]}><planeGeometry args={[0.2, 0.55]} /><meshStandardMaterial color={c} roughness={0.8} side={THREE.DoubleSide} /></mesh>)}
      </group>
      <group position={at(COUNTER_OUT - 0.08, 99 * DEG, 2.0)} rotation-y={-99 * DEG}>
        <mesh scale={[1, 0.34, 1]}><sphereGeometry args={[0.16, 22, 14]} /><meshStandardMaterial color={accent} roughness={0.9} /></mesh>
        <mesh position={[0, 0.07, 0.01]}><cylinderGeometry args={[0.012, 0.012, 0.05, 6]} /><meshStandardMaterial color="#2a1a10" /></mesh>
      </group>
      {/* baguettes standing in a wooden bin near the door, and a stack of bread boxes */}
      <group position={at(COUNTER_OUT - 0.45, 102 * DEG, COUNTER_TOP)} rotation-y={-102 * DEG}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.7, 0.24, 0.32]} /><meshStandardMaterial map={m.wood} roughness={0.8} /></mesh>
        <BaguetteBundle />
      </group>
    </group>
  );
}
function BaguetteBundle() {
  const bread = useMemo(() => TX.breadTexture(), []);
  return (
    <group>
      {[-0.22, -0.11, 0, 0.11, 0.22].map((x, i) => (
        <mesh key={i} position={[x, 0.55, (i % 2) * 0.05 - 0.03]} rotation={[0.08 * (i - 2) * 0.3, 0, 0.12 * (i - 2) * 0.4]}><capsuleGeometry args={[0.045, 0.78, 6, 14]} /><meshStandardMaterial map={bread} roughness={0.75} /></mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- the island, the grill and the chimney hood in the middle
function Island({ theme }: { theme: KitchenTheme }) {
  const { brass } = theme.colors;
  const steel = useMemo(() => TX.steelTexture(), []);
  const bread = useMemo(() => TX.breadTexture(), []);
  const wood = useMemo(() => TX.woodTexture("#a47440"), []);
  const hoodMat = useMemo(() => new THREE.MeshStandardMaterial({ map: steel, color: "#d4d8dd", metalness: 0.85, roughness: 0.32, side: THREE.DoubleSide }), [steel]);
  const dark = <meshStandardMaterial color="#1b1c20" roughness={0.45} metalness={0.7} />;
  return (
    <group>
      <mesh position-y={0.45}><cylinderGeometry args={[ISLAND_R - 0.1, ISLAND_R - 0.05, 0.9, 8]} /><meshStandardMaterial map={steel} color="#aeb3ba" metalness={0.75} roughness={0.42} /></mesh>
      <mesh position-y={0.92}><cylinderGeometry args={[ISLAND_R + 0.05, ISLAND_R + 0.05, 0.07, 8]} /><meshStandardMaterial map={steel} color="#e1e4e8" metalness={0.85} roughness={0.3} /></mesh>
      {/* the flat-top grill */}
      <mesh position={[0, 0.97, 0.42]}><boxGeometry args={[1.15, 0.03, 0.6]} />{dark}</mesh>
      <mesh position={[0, 0.99, 0.42]} rotation-x={-Math.PI / 2}><planeGeometry args={[1.0, 0.45]} /><meshStandardMaterial color="#ff7a2a" emissive="#ff5a10" emissiveIntensity={0.35} transparent opacity={0.28} /></mesh>
      {/* two panini presses, lids open */}
      {[{ x: -0.5, z: -0.35, r: 0.4 }, { x: 0.48, z: -0.45, r: -0.2 }].map((p, k) => (
        <group key={k} position={[p.x, 0.955, p.z]} rotation-y={p.r}>
          <mesh position-y={0.05}><boxGeometry args={[0.64, 0.1, 0.46]} />{dark}</mesh>
          {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[-0.26 + i * 0.065, 0.105, 0]}><boxGeometry args={[0.03, 0.016, 0.4]} /><meshStandardMaterial color="#303238" metalness={0.8} roughness={0.35} /></mesh>)}
          <group position={[0, 0.1, -0.23]} rotation-x={-0.95}>
            <mesh position={[0, 0.02, 0.23]}><boxGeometry args={[0.64, 0.07, 0.46]} />{dark}</mesh>
            {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[-0.26 + i * 0.065, -0.02, 0.23]}><boxGeometry args={[0.03, 0.016, 0.4]} /><meshStandardMaterial color="#303238" metalness={0.8} roughness={0.35} /></mesh>)}
            <mesh position={[0, 0.07, 0.4]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.018, 0.018, 0.34, 10]} /><meshStandardMaterial color="#111" roughness={0.6} /></mesh>
          </group>
        </group>
      ))}
      {/* stock pot and a pan */}
      <group position={[-0.55, 0.955, 0.45]}>
        <mesh position-y={0.11}><cylinderGeometry args={[0.17, 0.17, 0.22, 24]} /><meshStandardMaterial map={steel} metalness={0.85} roughness={0.3} /></mesh>
        <mesh position-y={0.225}><cylinderGeometry args={[0.175, 0.175, 0.02, 24]} /><meshStandardMaterial color="#cfd3d8" metalness={0.9} roughness={0.28} /></mesh>
      </group>
      {/* chopping board, baguette, sauce tubs */}
      <group position={[0.75, 0.955, 0.38]} rotation-y={-0.5}>
        <mesh position-y={0.02}><boxGeometry args={[0.46, 0.04, 0.3]} /><meshStandardMaterial map={wood} roughness={0.75} /></mesh>
        <mesh position={[0, 0.09, 0]} rotation-z={Math.PI / 2}><capsuleGeometry args={[0.04, 0.34, 6, 12]} /><meshStandardMaterial map={bread} roughness={0.75} /></mesh>
      </group>
      {[["#7aa04a", 1.0, 0.1], ["#d2503a", 1.1, -0.1], ["#f2efe6", 1.17, 0.25]].map(([c, x, z], i) => (
        <group key={i} position={[(x as number) - 0.28, 0.955, (z as number) - 0.08]} rotation-y={0.4}>
          <mesh position-y={0.05}><cylinderGeometry args={[0.07, 0.065, 0.1, 14]} /><meshStandardMaterial color="#e5e8ec" metalness={0.6} roughness={0.3} /></mesh>
          <mesh position-y={0.1}><cylinderGeometry args={[0.063, 0.063, 0.01, 14]} /><meshStandardMaterial color={c as string} roughness={0.6} /></mesh>
        </group>
      ))}
      {/* the chimney: a steel hood, a duct to the ceiling, a rail with copper pans and the warm light underneath */}
      <mesh position-y={2.4} rotation-y={Math.PI / 4} material={hoodMat}><cylinderGeometry args={[0.52, 1.72, 0.9, 4, 1, true]} /></mesh>
      <mesh position-y={1.97} rotation-y={Math.PI / 4}><torusGeometry args={[1.2, 0.025, 6, 4]} /><meshStandardMaterial color={brass} metalness={0.9} roughness={0.3} /></mesh>
      <mesh position-y={(2.85 + WALL_H) / 2} material={hoodMat}><boxGeometry args={[0.74, WALL_H - 2.85, 0.74]} /></mesh>
      <mesh position-y={1.965} rotation-x={Math.PI / 2}><circleGeometry args={[0.95, 4]} /><meshBasicMaterial color="#ffd08a" toneMapped={false} side={THREE.DoubleSide} /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.cos((i * Math.PI) / 2 + 0.78) * 1.5, 3.3, Math.sin((i * Math.PI) / 2 + 0.78) * 1.5]}><cylinderGeometry args={[0.008, 0.008, 0.8, 4]} /><meshStandardMaterial color="#333" /></mesh>)}
      {Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return (
        <group key={i} position={[Math.cos(a) * 1.56, 2.62, Math.sin(a) * 1.56]} rotation-y={-a + Math.PI / 2}>
          <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.12, 0.11, 0.035, 18]} /><meshStandardMaterial color={i % 3 ? "#b8683a" : "#c9ccd2"} metalness={0.85} roughness={0.35} /></mesh>
          <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.01, 0.01, 0.24, 5]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
        </group>); })}
      <mesh position-y={2.62} rotation-x={Math.PI / 2}><torusGeometry args={[1.56, 0.012, 6, 64]} /><meshStandardMaterial color="#9aa0a8" metalness={0.9} roughness={0.3} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------- the back door we came in through, and lamps
function Door({ theme, fontsReady }: { theme: KitchenTheme; fontsReady: boolean }) {
  const { brand, brass, cream, accent } = theme.colors;
  const sign = useMemo(() => TX.signTexture({ w: 256, h: 128, bg: cream, border: accent, lines: [{ text: "OUVERT", size: 62, color: accent, font: "'Abril Fatface', Georgia, serif", y: 68 }] }), [cream, accent, fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const glow = useMemo(() => { const t = TX.softTexture(); return t; }, []);
  return (
    <group position={at(ROOM_R - 0.02, DOOR_TH, 0)} rotation-y={-DOOR_TH}>
      {/* the night outside, seen through the doorway */}
      <mesh position={[0, 1.1, -0.06]}><planeGeometry args={[1.05, 2.2]} /><meshBasicMaterial color="#2c3a7a" toneMapped={false} /></mesh>
      <mesh position={[0, 1.1, -0.055]}><planeGeometry args={[1.05, 2.2]} /><meshBasicMaterial map={glow} color="#ffc46b" transparent opacity={0.55} toneMapped={false} depthWrite={false} /></mesh>
      {/* frame */}
      {[[-0.56, 1.15, 0.07, 2.4], [0.56, 1.15, 0.07, 2.4]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0.05]}><boxGeometry args={[w, h, 0.14]} /><meshStandardMaterial color={cream} roughness={0.6} /></mesh>)}
      <mesh position={[0, 2.3, 0.05]}><boxGeometry args={[1.2, 0.1, 0.14]} /><meshStandardMaterial color={cream} roughness={0.6} /></mesh>
      {/* the door leaf, swung open into the kitchen */}
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
  const cane = useMemo(() => TX.caneTexture(), []);
  return (
    <group>
      {[-30, 0, 30, 60, 90].map((d) => (
        <group key={d} position={at(AISLE_R + 0.15, d * DEG, 2.62)}>
          <mesh position-y={0.55}><cylinderGeometry args={[0.006, 0.006, 1.1, 4]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh><cylinderGeometry args={[0.17, 0.4, 0.36, 24, 1, true]} /><meshStandardMaterial map={cane} color="#e8cf9c" side={THREE.DoubleSide} roughness={0.9} emissive="#ffb24a" emissiveIntensity={0.55} /></mesh>
          <mesh position-y={-0.14}><sphereGeometry args={[0.07, 12, 10]} /><meshBasicMaterial color="#fff0c8" toneMapped={false} /></mesh>
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
        <mesh position-z={0.004}><circleGeometry args={[0.352, 72]} /><meshPhysicalMaterial map={map} color="#8c8c8c" emissive="#ffffff" emissiveMap={map} emissiveIntensity={0.5} roughness={0.6} clearcoat={0.15} clearcoatRoughness={0.5} toneMapped={false} /></mesh>
        <mesh position-z={0.03} onClick={(e) => { e.stopPropagation(); if (focused.current === index) onPlate(index); else onTap(index); }} onPointerOver={(e) => { e.stopPropagation(); hov.current = true; onHover(index); }} onPointerOut={() => { hov.current = false; onHover(null); }}>
          <circleGeometry args={[0.55, 24]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      <Steam count={10} height={0.5} spread={0.1} size={0.14} opacity={0.16} origin={[0, 0.85, 0.05]} />
    </group>
  );
}

// ---------------------------------------------------------------- steam: a few soft puffs rising and fading
function Steam({ count, height, spread, size, opacity, origin, axis = "y" }: { count: number; height: number; spread: number; size: number; opacity: number; origin: [number, number, number]; axis?: "y" | "z" }) {
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
  const spot = useRef<THREE.SpotLight>(null), target = useMemo(() => new THREE.Object3D(), []), lantern = useRef<THREE.PointLight>(null);
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
    if (lantern.current) { lantern.current.position.copy(camera.position); lantern.current.position.y += 0.4; }
  });
  return (
    <>
      <hemisphereLight args={["#ffe0b8", "#1a2050", 0.3]} />
      <pointLight position={[0, 1.85, 0]} intensity={20} distance={7.5} decay={2} color="#ffb867" />
      <pointLight ref={lantern} intensity={3.2} distance={5} decay={2} color="#ffe9cf" />
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
  const st = useRef({ t: 0, f: 0, fi: 0, lx: 0, ly: 0, sx: 0, sy: 0, enter: 0, idle: 0, lastP: 0, focusP: 0, fov: 58, seen: false });
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
    if (focus != null && s.fi !== focus) { s.fi = focus; s.focusP = p; }
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
    if (focus != null && Math.abs(p - s.focusP) > 0.014 && !api.busy.current) onUnfocus();

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

function Ready({ onReady }: { onReady: () => void }) { useEffect(() => { onReady(); }, [onReady]); return null; }

export default function KitchenScene(p: SceneProps) {
  const { theme, api } = p;
  // sharpness follows the device: start high, step down when frames get slow, step back up when there is room (?dpr=0.5 forces it, for testing)
  const forced = typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("dpr")) || 0 : 0;
  const [dpr, setDpr] = useState(forced || 1.5);
  return (
    <Canvas dpr={dpr} camera={{ fov: 58, near: 0.08, far: 40, position: [0, EYE, 0] }} gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      style={{ position: "absolute", inset: 0 }} eventSource={p.eventSource as React.RefObject<HTMLElement>} eventPrefix="client" aria-hidden="true">
      <color attach="background" args={[theme.colors.ink]} />
      <fogExp2 attach="fog" args={[theme.colors.ink, 0.05]} />
      {!forced && <PerformanceMonitor flipflops={3} onDecline={() => setDpr((d) => Math.max(0.6, d - 0.35))} onIncline={() => setDpr((d) => Math.min(1.7, d + 0.2))} />}
      <Env />
      <Lights api={api} />
      <TapPosition />
      <Suspense fallback={null}>
        <Room theme={theme} fontsReady={p.fontsReady} />
        <Counter theme={theme} fontsReady={p.fontsReady} />
        <Island theme={theme} />
        <Door theme={theme} fontsReady={p.fontsReady} />
        <Lamps />
        {theme.dishes.map((dish, i) => <Dish key={dish.id} index={i} dish={dish} focused={api.focus} onTap={p.onTap} onPlate={p.onPlate} onHover={p.onHover} />)}
        <Steam count={34} height={1.1} spread={0.45} size={0.7} opacity={0.34} origin={[0, 1.0, 0.42]} />
        <Steam count={12} height={0.9} spread={0.2} size={0.5} opacity={0.3} origin={[-0.55, 1.2, 0.45]} />
        <Rig api={api} tags={p.tags} onAutoFocus={p.onAutoFocus} onUnfocus={p.onUnfocus} portrait={p.portrait} />
        <Ready onReady={p.onReady} />
      </Suspense>
    </Canvas>
  );
}

