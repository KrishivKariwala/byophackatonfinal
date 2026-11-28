"use client";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import * as TX from "./textures";
import { prep } from "./materials";
import { DINER as D, dinerZ, type Layout } from "./layouts";
import { LightCone, Puffs, Sparks } from "./props";
import { useFx } from "./quality";

/**
 * The Smash Guys dining room: a straight hall in yellow glazed tile. The open kitchen with its pass counter, grills and menu boards is on the left; a red
 * leather banquette runs along the right wall with a round table in front of it for each dish; wooden slats and black-and-yellow pendant lamps overhead.
 * Built from simple shapes and painted surfaces, like the Paris Panini kitchen. Every number is in metres; the hall runs along z (towards -z).
 */
const T = "/kitchen/textures/";
const YELLOW = "#f1c232", BLACK = "#15161a";

function useDinerMats(theme: KitchenTheme) {
  const tex = useTexture({ pnC: `${T}pine-c.webp`, pnN: `${T}pine-n.webp`, pnR: `${T}pine-r.webp`, stC: `${T}steel-c.webp`, stN: `${T}steel-n.webp`, stR: `${T}steel-r.webp` });
  const loaded = Object.values(tex); // depend on the textures themselves, not the object useTexture hands back every time
  return useMemo(() => {
    const tile = (color: string, grout: string, w: number, h: number, rough = 0.28) => { const t = TX.glazedTileTexture(color, grout, 0.55); t.repeat.set(w / 1.76, h / 1.76); t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, roughness: rough, metalness: 0.04, side: THREE.DoubleSide }); };
    const leather = (w: number, h: number) => { const t = TX.leatherTexture("#8e1b22"); t.repeat.set(w / 0.5, h / 0.5); t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.42, metalness: 0.05 }); };
    const floorT = TX.floorTileTexture(); floorT.repeat.set(8, 24);
    const kitchenFloor = TX.glazedTileTexture("#26272c", "#3a3b42"); kitchenFloor.repeat.set(3, 8);
    const slats = prep(tex.pnC, [6, 24], true, 0); const slatN = prep(tex.pnN, [6, 24], false, 0), slatR = prep(tex.pnR, [6, 24], false, 0);
    const wood = new THREE.MeshStandardMaterial({ map: prep(tex.pnC, [0.9, 0.9], true), normalMap: prep(tex.pnN, [0.9, 0.9], false), roughnessMap: prep(tex.pnR, [0.9, 0.9], false), color: "#9c6a3a", roughness: 0.62 });
    return {
      floor: new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.5, metalness: 0.05 }),
      kitchenFloor: new THREE.MeshStandardMaterial({ map: kitchenFloor, roughness: 0.5 }),
      steel: new THREE.MeshStandardMaterial({ map: prep(tex.stC, [2, 2], true), normalMap: prep(tex.stN, [2, 2], false), roughnessMap: prep(tex.stR, [2, 2], false), color: "#d3d7dc", metalness: 0.9, roughness: 0.4, side: THREE.DoubleSide }),
      steelDark: new THREE.MeshStandardMaterial({ color: "#1c1d22", metalness: 0.8, roughness: 0.45 }),
      ceiling: new THREE.MeshStandardMaterial({ map: slats, normalMap: slatN, roughnessMap: slatR, color: "#c79a62", roughness: 0.8, side: THREE.DoubleSide }),
      wood,
      black: new THREE.MeshStandardMaterial({ color: BLACK, roughness: 0.55, metalness: 0.2 }),
      yellowSolid: new THREE.MeshStandardMaterial({ color: YELLOW, roughness: 0.4 }),
      tile: tile,
      leather,
      band: (() => { const t = TX.starBandTexture(); t.repeat.set(12, 1); return new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); })(),
      soft: TX.softTexture(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, ...loaded]);
}

const MENU_BOARDS: { text: string; sub?: string; script?: boolean }[] = [
  { text: "Creamy Onion Smash!", sub: "double patty · soft bun" },
  { text: "Brisket?", sub: "braised for 8 hours", script: true },
  { text: "Milk Buns", sub: "baked fresh, every day" },
  { text: "Smashing Goood", sub: "since day one", script: true },
  { text: "Chilli Cheese Smash", sub: "chef recommended" },
];

export default function DinerWorld({ theme, fontsReady, layout, children }: { theme: KitchenTheme; fontsReady: boolean; layout: Layout; children?: React.ReactNode }) {
  const m = useDinerMats(theme);
  const N = layout.count;
  const { XL, XR, ZN, H } = { XL: D.X_LEFT, XR: D.X_RIGHT, ZN: D.Z_NEAR, H: D.H };
  const ZF = dinerZ(N - 1) - 2.3, L = ZN - ZF, ZC = (ZN + ZF) / 2, XK = -4.6;
  const cx = (XL + XR) / 2, kx = (XL + XK) / 2, bx = (XR + XK) / 2, bw = XR - XK;
  const wallMats = useMemo(() => ({
    right: m.tile(YELLOW, "#4a3a08", L, H - 1.05), rightLow: m.tile(BLACK, "#2e2f36", L, 1.05, 0.2), left: m.tile(YELLOW, "#4a3a08", L, H - 2.2),
    far: m.tile(YELLOW, "#4a3a08", bw, H), near: m.tile(YELLOW, "#4a3a08", bw, H), kback: m.tile(BLACK, "#2e2f36", L, H, 0.2), pillar: m.tile(YELLOW, "#4a3a08", 0.3, 1.2),
    front: m.tile(BLACK, "#2e2f36", L, 1.0, 0.2),
    seat: m.leather(L, 0.5), back: m.leather(L, 0.7),
  }), [m, L, H, bw]);
  const tableXs = useMemo(() => Array.from({ length: N }, (_, i) => dinerZ(i)), [N]);

  // painted signs: the brand wall, the script sign and the menu boards. They are redrawn once the fonts are in.
  const signs = useMemo(() => {
    const big = TX.signTexture({ w: 1400, h: 520, bg: null, lines: [
      { text: "SMASH GUYS", size: 330, color: "#141414", font: "'Anton', Impact, sans-serif", y: 190, spacing: 6 },
      { text: "BURGER KITCHEN", size: 120, color: "#141414", font: "'Anton', Impact, sans-serif", y: 420, spacing: 14 },
    ] });
    const kn = TX.signTexture({ w: 1400, h: 300, bg: null, lines: [{ text: "ಸ್ಮ್ಯಾಶ್ ಗಾಯ್ಸ್", size: 230, color: "#141414", font: "'Noto Sans Kannada', 'Anton', sans-serif", y: 150 }] });
    const script = TX.signTexture({ w: 900, h: 360, bg: "#141414", border: "#f4b400", lines: [
      { text: "Smashing", size: 150, color: "#fff6d6", font: "'Yellowtail', cursive", y: 118 },
      { text: "Goood", size: 190, color: "#f4b400", font: "'Yellowtail', cursive", y: 270 },
    ] });
    const boards = MENU_BOARDS.map((b) => TX.signTexture({ w: 1024, h: 440, bg: "#f6d457", border: "#141414", lines: [
      { text: b.text, size: b.script ? 150 : b.text.length > 14 ? 96 : 130, color: "#141414", font: b.script ? "'Yellowtail', cursive" : "'Anton', Impact, sans-serif", y: 190, spacing: b.script ? 0 : 3 },
      ...(b.sub ? [{ text: b.sub, size: 58, color: "#5a4300", font: "'Outfit', Arial, sans-serif", y: 340, spacing: 3 }] : []),
    ] }));
    const posters = [0, 1, 2].map((k) => TX.posterTexture(k));
    return { big, kn, script, boards, posters };
  }, [fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const lampRefs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => { lampRefs.current.forEach((g, i) => { if (g) { g.rotation.z = Math.sin(clock.elapsedTime * 0.6 + i * 1.3) * 0.012; g.rotation.x = Math.cos(clock.elapsedTime * 0.5 + i) * 0.01; } }); });

  const grills = [-0.8, -4.4, -8.0];
  const pillars = Array.from({ length: Math.ceil(L / 1.6) + 1 }, (_, k) => 1.8 - 1.6 * k).filter((z) => z < ZN - 0.3 && z > ZF + 0.3);
  const boards = [1.0, -1.6, -4.2, -6.8, -9.4].filter((z) => z > ZF + 0.9).slice(0, MENU_BOARDS.length);

  return (
    <group>
      {/* floors */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0, ZC]}><planeGeometry args={[XR - XL, L]} /><primitive object={m.floor} attach="material" /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[kx, 0, ZC]}><planeGeometry args={[XL - XK, L]} /><primitive object={m.kitchenFloor} attach="material" /></mesh>

      {/* the right wall: black tile low, yellow tile above, a band of stars, frames and the script sign */}
      <mesh position={[XR, 0.525, ZC]} rotation-y={-Math.PI / 2}><planeGeometry args={[L, 1.05]} /><primitive object={wallMats.rightLow} attach="material" /></mesh>
      <mesh position={[XR, 1.05 + (H - 1.05) / 2, ZC]} rotation-y={-Math.PI / 2}><planeGeometry args={[L, H - 1.05]} /><primitive object={wallMats.right} attach="material" /></mesh>
      <mesh position={[XR - 0.01, 2.45, ZC]} rotation-y={-Math.PI / 2}><planeGeometry args={[L, 0.1]} /><primitive object={m.band} attach="material" /></mesh>
      <group position={[XR - 0.03, 1.85, dinerZ(Math.min(3, N - 1)) - 0.8]} rotation-y={-Math.PI / 2}>
        <mesh position-z={-0.02}><boxGeometry args={[1.5, 0.62, 0.05]} /><primitive object={m.black} attach="material" /></mesh>
        <mesh position-z={0.006}><planeGeometry args={[1.42, 0.57]} /><meshBasicMaterial map={signs.script} toneMapped={false} /></mesh>
      </group>
      {[dinerZ(0) - 0.8, dinerZ(1) - 0.8, dinerZ(2) - 0.8, dinerZ(4) - 0.8, dinerZ(5) - 0.8].filter((z) => z > ZF + 0.5).map((z, i) => (
        <group key={i} position={[XR - 0.03, 1.75 + (i % 2) * 0.12, z]} rotation-y={-Math.PI / 2}>
          <mesh position-z={-0.015}><boxGeometry args={[0.58, 0.74, 0.04]} /><primitive object={m.black} attach="material" /></mesh>
          <mesh position-z={0.008}><planeGeometry args={[0.48, 0.6]} /><meshBasicMaterial map={signs.posters[i % 3]} toneMapped={false} /></mesh>
        </group>
      ))}

      {/* the banquette */}
      <mesh position={[XR - 0.41, 0.06, ZC]}><boxGeometry args={[0.5, 0.12, L - 0.06]} /><primitive object={m.black} attach="material" /></mesh>
      <mesh position={[XR - 0.41, 0.32, ZC]}><boxGeometry args={[0.5, 0.4, L - 0.06]} /><primitive object={wallMats.seat} attach="material" /></mesh>
      <mesh position={[XR - 0.09, 0.86, ZC]}><boxGeometry args={[0.16, 0.68, L - 0.06]} /><primitive object={wallMats.back} attach="material" /></mesh>

      {/* the left side: pass counter with a window onto the open kitchen, a lintel of yellow tile and the menu boards */}
      <mesh position={[XL + 0.225, 0.5, ZC]}><boxGeometry args={[0.45, 1.0, L - 0.04]} /><primitive object={wallMats.front} attach="material" /></mesh>
      <mesh position={[XL + 0.225, 1.025, ZC]}><boxGeometry args={[0.5, 0.05, L - 0.04]} /><primitive object={m.steel} attach="material" /></mesh>
      <mesh position={[XL, 2.2 + (H - 2.2) / 2, ZC]} rotation-y={Math.PI / 2}><planeGeometry args={[L, H - 2.2]} /><primitive object={wallMats.left} attach="material" /></mesh>
      <mesh position={[XL, 2.18, ZC]}><boxGeometry args={[0.32, 0.07, L]} /><primitive object={m.black} attach="material" /></mesh>
      {pillars.map((z) => <mesh key={z} position={[XL, 1.05 + 0.575, z]}><boxGeometry args={[0.3, 1.15, 0.28]} /><primitive object={wallMats.pillar} attach="material" /></mesh>)}
      {boards.map((z, i) => (
        <group key={z} position={[XL + 0.04, 2.72, z]} rotation-y={Math.PI / 2}>
          <mesh position-z={-0.02}><boxGeometry args={[1.38, 0.6, 0.04]} /><primitive object={m.black} attach="material" /></mesh>
          <mesh position-z={0.006}><planeGeometry args={[1.32, 0.567]} /><meshBasicMaterial map={signs.boards[i % signs.boards.length]} toneMapped={false} /></mesh>
        </group>
      ))}
      {/* heat lamps along the pass */}
      <mesh position={[XL - 0.22, 2.05, ZC]}><boxGeometry args={[0.06, 0.04, L - 0.8]} /><meshBasicMaterial color="#ff8a2a" toneMapped={false} transparent opacity={0.85} /></mesh>

      {/* the open kitchen behind the window */}
      <mesh position={[XK, H / 2, ZC]} rotation-y={Math.PI / 2}><planeGeometry args={[L, H]} /><primitive object={wallMats.kback} attach="material" /></mesh>
      <mesh position={[XK + 0.36, 0.45, ZC]}><boxGeometry args={[0.72, 0.9, L - 0.1]} /><primitive object={wallMats.front} attach="material" /></mesh>
      <mesh position={[XK + 0.38, 0.925, ZC]}><boxGeometry args={[0.76, 0.05, L - 0.1]} /><primitive object={m.steel} attach="material" /></mesh>
      {[1.5, 1.95].map((y) => <mesh key={y} position={[XK + 0.18, y, ZC]}><boxGeometry args={[0.34, 0.04, L - 0.4]} /><primitive object={m.steel} attach="material" /></mesh>)}
      {grills.filter((z) => z > ZF + 0.8).map((z, i) => (
        <group key={z} position={[XK + 0.4, 0, z]}>
          <mesh position={[0, 0.965, 0]}><boxGeometry args={[0.6, 0.03, 1.1]} /><primitive object={m.steelDark} attach="material" /></mesh>
          <mesh position={[0, 0.985, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.5, 0.9]} /><meshStandardMaterial color="#ff7a2a" emissive="#ff5a10" emissiveIntensity={0.4} transparent opacity={0.28} /></mesh>
          <Sparks origin={[0, 1.0, 0]} width={0.8} />
          <Puffs origin={[0, 1.0, 0]} count={9} height={1.0} size={0.42} spread={0.3} opacity={0.2} />
          <mesh position={[0, 2.35, 0]}><boxGeometry args={[1.05, 0.55, 1.9]} /><primitive object={m.steel} attach="material" /></mesh>
          <mesh position={[0, (2.62 + H) / 2, 0]}><boxGeometry args={[0.5, H - 2.62, 0.5]} /><primitive object={m.steel} attach="material" /></mesh>
          <mesh position={[0.05, 2.07, 0]} rotation-x={Math.PI / 2}><planeGeometry args={[0.8, 1.6]} /><meshBasicMaterial color="#ffd08a" toneMapped={false} side={THREE.DoubleSide} /></mesh>
          {i === 1 && <LightCone p={[0.1, 2.05, 0]} h={1.1} r={0.9} color="#ffb867" opacity={0.1} />}
        </group>
      ))}
      <mesh position={[(XL + XK) / 2, H, ZC]} rotation-x={Math.PI / 2}><planeGeometry args={[XL - XK, L]} /><meshStandardMaterial color="#1a1b20" roughness={0.9} /></mesh>

      {/* the ceiling: wooden slats with black beams, and the end walls */}
      <mesh position={[cx, H, ZC]} rotation-x={Math.PI / 2}><planeGeometry args={[XR - XL, L]} /><primitive object={m.ceiling} attach="material" /></mesh>
      {Array.from({ length: Math.floor(L / 1.6) + 1 }, (_, k) => <mesh key={k} position={[cx, H - 0.06, ZN - 0.4 - 1.6 * k]}><boxGeometry args={[XR - XL, 0.12, 0.1]} /><primitive object={m.black} attach="material" /></mesh>)}
      <mesh position={[bx, H / 2, ZF]}><planeGeometry args={[bw, H]} /><primitive object={wallMats.far} attach="material" /></mesh>
      <mesh position={[bx, H / 2, ZN]} rotation-y={Math.PI}><planeGeometry args={[bw, H]} /><primitive object={wallMats.near} attach="material" /></mesh>
      {/* the brand on the far wall */}
      <mesh position={[cx + 0.1, 1.8, ZF + 0.02]}><planeGeometry args={[4.0, 1.486]} /><meshBasicMaterial map={signs.big} transparent toneMapped={false} /></mesh>
      <mesh position={[cx + 0.1, 2.82, ZF + 0.02]}><planeGeometry args={[2.6, 0.557]} /><meshBasicMaterial map={signs.kn} transparent toneMapped={false} /></mesh>
      <mesh position={[cx, 0.34, ZF + 0.025]}><planeGeometry args={[XR - XL, 0.1]} /><primitive object={m.band} attach="material" /></mesh>

      {/* the entrance behind the visitor: a wooden double door with glass */}
      <group position={[0.1, 0, ZN - 0.03]} rotation-y={Math.PI}>
        <mesh position={[0, 1.15, -0.04]}><planeGeometry args={[1.3, 2.3]} /><meshBasicMaterial color="#2a4672" toneMapped={false} /></mesh>
        {[[-0.68, 1.2, 0.12, 2.5], [0.68, 1.2, 0.12, 2.5], [0, 2.4, 1.5, 0.12], [0, 1.2, 0.07, 2.3]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0]}><boxGeometry args={[w, h, 0.12]} /><primitive object={m.wood} attach="material" /></mesh>)}
        {[-0.33, 0.33].flatMap((x) => [0.55, 1.6].map((y) => [x, y] as const)).map(([x, y], i) => <mesh key={i} position={[x, y, 0.07]}><boxGeometry args={[0.05, 0.05, 0.02]} /><meshStandardMaterial color="#f4b400" metalness={0.8} roughness={0.3} /></mesh>)}
      </group>

      {/* a round table for each dish, with its pendant lamp */}
      {tableXs.map((z, i) => (
        <group key={i}>
          <mesh position={[D.TABLE_X, 0.745, z]}><cylinderGeometry args={[D.TABLE_R, D.TABLE_R, 0.035, 40]} /><primitive object={m.wood} attach="material" /></mesh>
          <mesh position={[D.TABLE_X, 0.74, z]}><cylinderGeometry args={[D.TABLE_R + 0.008, D.TABLE_R + 0.008, 0.02, 40]} /><primitive object={m.black} attach="material" /></mesh>
          <mesh position={[D.TABLE_X, 0.38, z]}><cylinderGeometry args={[0.05, 0.05, 0.72, 12]} /><primitive object={m.black} attach="material" /></mesh>
          <mesh position={[D.TABLE_X, 0.02, z]}><cylinderGeometry args={[0.26, 0.28, 0.04, 28]} /><primitive object={m.black} attach="material" /></mesh>
          {/* ketchup and mustard */}
          <mesh position={[D.TABLE_X + 0.38, 0.84, z - 0.12]}><cylinderGeometry args={[0.028, 0.032, 0.16, 12]} /><meshStandardMaterial color="#c0271a" roughness={0.35} /></mesh>
          <mesh position={[D.TABLE_X + 0.38, 0.84, z + 0.04]}><cylinderGeometry args={[0.028, 0.032, 0.16, 12]} /><meshStandardMaterial color="#e5b61c" roughness={0.35} /></mesh>
          <group position={[D.TABLE_X, H, z]}>
            <group ref={(e) => { lampRefs.current[i] = e; }}>
              <mesh position-y={-0.55}><cylinderGeometry args={[0.006, 0.006, 1.1, 4]} /><meshStandardMaterial color="#111" /></mesh>
              <mesh position-y={-1.1}><cylinderGeometry args={[0.07, 0.3, 0.26, 28, 1, true]} /><meshStandardMaterial color="#17181c" side={THREE.DoubleSide} roughness={0.5} metalness={0.3} /></mesh>
              <mesh position-y={-1.0}><cylinderGeometry args={[0.065, 0.28, 0.24, 28, 1, true]} /><meshStandardMaterial color={YELLOW} side={THREE.BackSide} emissive="#ffb300" emissiveIntensity={0.9} /></mesh>
              <mesh position-y={-1.225} rotation-x={Math.PI / 2}><circleGeometry args={[0.27, 24]} /><meshBasicMaterial color="#fff2c4" toneMapped={false} transparent opacity={0.9} /></mesh>
            </group>
            <LightCone p={[0, -1.2, 0]} h={1.2} r={0.62} color="#ffcc66" opacity={0.08} />
          </group>
        </group>
      ))}

      <HallLights ZC={ZC} L={L} />
      <HallDust ZC={ZC} L={L} />
      {children}
    </group>
  );
}

function HallLights({ ZC, L }: { ZC: number; L: number }) {
  return (
    <>
      {[0.2, 0.5, 0.8].map((k) => <pointLight key={k} position={[0.4, 2.7, ZC + L / 2 - L * k]} intensity={7} distance={7.5} decay={2} color="#ffd08a" />)}
      <pointLight position={[D.X_LEFT - 1.6, 2.2, ZC]} intensity={16} distance={10} decay={2} color="#ffb060" />
    </>
  );
}

function HallDust({ ZC, L }: { ZC: number; L: number }) {
  const fx = useFx();
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); const n = 80, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = -1.8 + ((i * 53) % 37) / 8.5; a[i * 3 + 1] = 0.8 + ((i * 31) % 20) / 9; a[i * 3 + 2] = ZC - L / 2 + ((i * 97) % 100) / 100 * L; } g.setAttribute("position", new THREE.BufferAttribute(a, 3)); return g; }, [ZC, L]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useFrame(({ clock }) => {
    if (!fx) return;
    const t = clock.elapsedTime, pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, base[i * 3] + Math.sin(t * 0.13 + i) * 0.18, base[i * 3 + 1] + Math.sin(t * 0.21 + i * 1.7) * 0.12, base[i * 3 + 2] + Math.cos(t * 0.11 + i * 0.7) * 0.18);
    pos.needsUpdate = true;
  });
  if (!fx) return null;
  return <points geometry={geo} frustumCulled={false}><pointsMaterial size={0.018} color="#ffe2b0" transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></points>;
}
