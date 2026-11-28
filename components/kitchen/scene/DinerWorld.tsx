"use client";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import * as TX from "./textures";
import { prep } from "./materials";
import { DINER as D, dinerZ, type Layout } from "./layouts";
import { LightCone, Puffs, Sparks } from "./props";
import { useFx } from "./quality";

/**
 * The Smash Guys dining room: a straight hall in glazed yellow tile. The open kitchen with its pass counter, grills and menu boards is on the left; a red
 * tufted-leather banquette runs along the right wall with a round table in front of it for each dish; wooden slats and black enamel pendant lamps overhead.
 * Surfaces are real-looking: glossy tile with a recessed grout, porcelain floor, leather with dents, brushed steel, soft contact shadows and one spotlight that
 * casts real shadows onto the dish in view. Every number is in metres; the hall runs along z (towards -z).
 */
const T = "/kitchen/textures/";
const YELLOW = "#e7b52b", BLACK = "#17181b";

function useDinerMats(theme: KitchenTheme) {
  const tex = useTexture({ pnC: `${T}pine-c.webp`, pnN: `${T}pine-n.webp`, pnR: `${T}pine-r.webp`, stC: `${T}steel-c.webp`, stN: `${T}steel-n.webp`, stR: `${T}steel-r.webp` });
  const loaded = Object.values(tex); // depend on the textures themselves, not the object useTexture hands back every time
  return useMemo(() => {
    const tile = (color: string, grout: string, w: number, h: number, rough = 0.2, vary = 0.07) => {
      const s = TX.glossTileSet(color, grout, { vary }); for (const t of [s.map, s.bump]) t.repeat.set(w / 1.2, h / 1.2);
      return new THREE.MeshStandardMaterial({ map: s.map, bumpMap: s.bump, bumpScale: 1.6, roughness: rough, metalness: 0.02, envMapIntensity: 0.9, side: THREE.DoubleSide });
    };
    const leatherSet = TX.leatherSet("#6e151b");
    const leather = (w: number, h: number) => {
      const m = leatherSet.map.clone(), b = leatherSet.bump.clone(); for (const t of [m, b]) { t.repeat.set(w / 0.5, h / 0.5); t.needsUpdate = true; }
      m.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshPhysicalMaterial({ map: m, bumpMap: b, bumpScale: 1.4, roughness: 0.5, metalness: 0.02, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.12, sheenColor: new THREE.Color("#d9786a") });
    };
    const por = TX.porcelainSet(); por.map.repeat.set(2.4, 7.2); por.rough.repeat.set(2.4, 7.2);
    const kf = TX.glossTileSet("#26272c", "#3a3b42", { vary: 0.05 }); kf.map.repeat.set(3, 8); kf.bump.repeat.set(3, 8);
    const slats = prep(tex.pnC, [6, 24], true, 0), slatN = prep(tex.pnN, [6, 24], false, 0), slatR = prep(tex.pnR, [6, 24], false, 0);
    const wood = new THREE.MeshPhysicalMaterial({ map: prep(tex.pnC, [0.9, 0.9], true), normalMap: prep(tex.pnN, [0.9, 0.9], false), roughnessMap: prep(tex.pnR, [0.9, 0.9], false), color: "#8a5a30", roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 });
    const fold = TX.foldTexture();
    return {
      floor: new THREE.MeshStandardMaterial({ map: por.map, roughnessMap: por.rough, roughness: 0.78, metalness: 0.0, envMapIntensity: 0.9 }),
      kitchenFloor: new THREE.MeshStandardMaterial({ map: kf.map, bumpMap: kf.bump, bumpScale: 1, roughness: 0.5 }),
      steel: new THREE.MeshStandardMaterial({ map: prep(tex.stC, [2, 2], true), normalMap: prep(tex.stN, [2, 2], false), roughnessMap: prep(tex.stR, [2, 2], false), color: "#d6dade", metalness: 0.92, roughness: 0.38, envMapIntensity: 1.3, side: THREE.DoubleSide }),
      steelDark: new THREE.MeshStandardMaterial({ color: "#1c1d22", metalness: 0.8, roughness: 0.42 }),
      enamel: new THREE.MeshStandardMaterial({ color: "#121316", metalness: 0.55, roughness: 0.28, side: THREE.DoubleSide, envMapIntensity: 1.2 }),
      ceiling: new THREE.MeshStandardMaterial({ map: slats, normalMap: slatN, roughnessMap: slatR, color: "#b98a56", roughness: 0.8, side: THREE.DoubleSide }),
      wood,
      black: new THREE.MeshStandardMaterial({ color: BLACK, roughness: 0.5, metalness: 0.2 }),
      tile, leather,
      band: (() => { const t = TX.starBandTexture(); t.repeat.set(12, 1); return new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); })(),
      soft: TX.softTexture(),
      /** contact shadow: black, see-through, strongest at the middle */
      blob: new THREE.MeshBasicMaterial({ map: TX.softTexture(), color: "#000", transparent: true, opacity: 0.55, depthWrite: false }),
      /** wall-to-floor/ceiling darkening */
      fold: new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.5, alphaMap: fold, depthWrite: false, side: THREE.DoubleSide }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, ...loaded]);
}
type M = ReturnType<typeof useDinerMats>;

const MENU_BOARDS: { text: string; sub?: string; script?: boolean }[] = [
  { text: "Creamy Onion Smash!", sub: "double patty · soft bun" },
  { text: "Brisket?", sub: "braised for 8 hours", script: true },
  { text: "Milk Buns", sub: "baked fresh, every day" },
  { text: "Smashing Goood", sub: "since day one", script: true },
  { text: "Chilli Cheese Smash", sub: "chef recommended" },
];
/** the names printed on the table cards (kept in English: they are the menu's own names) */
const DISH_NAMES: Record<string, string> = {
  "og-smash": "OG Smash", "oklahoma-smash": "Oklahoma Smash", "chilli-cheese-smash": "Chilli Cheese Smash", "brisket-smash": "8 Hr Brisket",
  "nashville-chicken": "Nashville Chicken", "truffle-fries": "Truffle Fries", "mac-cheese": "Mac & Cheese",
};

/** a pendant lamp's shade: a flared enamel dome (turned on a lathe) */
const SHADE = (() => { const pts = [[0.035, 0.0], [0.07, -0.015], [0.13, -0.06], [0.21, -0.125], [0.28, -0.205], [0.305, -0.255], [0.31, -0.27]].map(([r, y]) => new THREE.Vector2(r, y)); return new THREE.LatheGeometry(pts, 40); })();
const SHADE_IN = (() => { const pts = [[0.03, -0.005], [0.065, -0.02], [0.125, -0.065], [0.2, -0.13], [0.27, -0.205], [0.296, -0.255], [0.3, -0.262]].map(([r, y]) => new THREE.Vector2(r, y)); return new THREE.LatheGeometry(pts, 40); })();

export default function DinerWorld({ theme, fontsReady, layout, children }: { theme: KitchenTheme; fontsReady: boolean; layout: Layout; children?: React.ReactNode }) {
  const m = useDinerMats(theme);
  const N = layout.count;
  const { XL, XR, ZN, H } = { XL: D.X_LEFT, XR: D.X_RIGHT, ZN: D.Z_NEAR, H: D.H };
  const ZF = dinerZ(N - 1) - 2.3, L = ZN - ZF, ZC = (ZN + ZF) / 2, XK = -4.6;
  const cx = (XL + XR) / 2, kx = (XL + XK) / 2, bx = (XR + XK) / 2, bw = XR - XK;
  const wallMats = useMemo(() => ({
    right: m.tile(YELLOW, "#2c2410", L, H - 1.05), rightLow: m.tile(BLACK, "#2e2f36", L, 1.05, 0.14, 0.04), left: m.tile(YELLOW, "#2c2410", L, H - 2.2),
    far: m.tile(YELLOW, "#2c2410", bw, H), near: m.tile(YELLOW, "#2c2410", bw, H), kback: m.tile(BLACK, "#2e2f36", L, H, 0.14, 0.04), pillar: m.tile(YELLOW, "#2c2410", 0.3, 1.2),
    front: m.tile(BLACK, "#2e2f36", L, 1.0, 0.14, 0.04),
    seat: m.leather(L, 0.5), back: m.leather(L, 0.7),
  }), [m, L, H, bw]);
  const tables = useMemo(() => Array.from({ length: N }, (_, i) => ({ z: dinerZ(i) })), [N]);

  // painted signs: the brand wall, the script sign, the menu boards and a card on every table. They are redrawn once the fonts are in.
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
    const boards = MENU_BOARDS.map((b) => TX.signTexture({ w: 1024, h: 440, bg: "#f2cf4c", border: "#141414", lines: [
      { text: b.text, size: b.script ? 150 : b.text.length > 14 ? 96 : 130, color: "#141414", font: b.script ? "'Yellowtail', cursive" : "'Anton', Impact, sans-serif", y: 190, spacing: b.script ? 0 : 3 },
      ...(b.sub ? [{ text: b.sub, size: 58, color: "#5a4300", font: "'Outfit', Arial, sans-serif", y: 340, spacing: 3 }] : []),
    ] }));
    const posters = [0, 1, 2].map((k) => TX.posterTexture(k));
    const cards = theme.dishes.map((d) => TX.tentCardTexture(DISH_NAMES[d.id] ?? d.id, `₹${d.full}`, d.veg, true));
    return { big, kn, script, boards, posters, cards };
  }, [fontsReady, theme.dishes]); // eslint-disable-line react-hooks/exhaustive-deps

  const lampRefs = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ clock }) => { lampRefs.current.forEach((g, i) => { if (g) { g.rotation.z = Math.sin(clock.elapsedTime * 0.6 + i * 1.3) * 0.012; g.rotation.x = Math.cos(clock.elapsedTime * 0.5 + i) * 0.01; } }); });

  const grills = [-0.8, -4.4, -8.0];
  const pillars = Array.from({ length: Math.ceil(L / 1.6) + 1 }, (_, k) => 1.8 - 1.6 * k).filter((z) => z < ZN - 0.3 && z > ZF + 0.3);
  const boards = [1.0, -1.6, -4.2, -6.8, -9.4].filter((z) => z > ZF + 0.9).slice(0, MENU_BOARDS.length);
  const yaw = layout.dish(0).yaw;

  return (
    <group>
      {/* floors, with soft shadows where things stand on them */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0, ZC]} receiveShadow><planeGeometry args={[XR - XL, L]} /><primitive object={m.floor} attach="material" /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[kx, 0, ZC]}><planeGeometry args={[XL - XK, L]} /><primitive object={m.kitchenFloor} attach="material" /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[XL + 0.75, 0.003, ZC]}><planeGeometry args={[0.95, L - 0.2]} /><primitive object={m.blob} attach="material" /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[XR - 0.95, 0.003, ZC]}><planeGeometry args={[1.0, L - 0.2]} /><primitive object={m.blob} attach="material" /></mesh>

      {/* the right wall: black tile low, yellow tile above, a band of stars, frames and the script sign */}
      <mesh position={[XR, 0.525, ZC]} rotation-y={-Math.PI / 2}><planeGeometry args={[L, 1.05]} /><primitive object={wallMats.rightLow} attach="material" /></mesh>
      <mesh position={[XR, 1.05 + (H - 1.05) / 2, ZC]} rotation-y={-Math.PI / 2}><planeGeometry args={[L, H - 1.05]} /><primitive object={wallMats.right} attach="material" /></mesh>
      <mesh position={[XR - 0.01, 2.45, ZC]} rotation-y={-Math.PI / 2}><planeGeometry args={[L, 0.1]} /><primitive object={m.band} attach="material" /></mesh>
      <mesh position={[XR - 0.015, H - 0.4, ZC]} rotation-y={-Math.PI / 2} scale={[1, -1, 1]}><planeGeometry args={[L, 0.8]} /><primitive object={m.fold} attach="material" /></mesh>
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
      <mesh position={[XR - 0.012, 0.07, ZC]} rotation-y={-Math.PI / 2}><planeGeometry args={[L, 0.14]} /><primitive object={m.black} attach="material" /></mesh>

      {/* the banquette: rounded, buttoned leather */}
      <mesh position={[XR - 0.41, 0.06, ZC]}><boxGeometry args={[0.5, 0.12, L - 0.06]} /><primitive object={m.black} attach="material" /></mesh>
      <mesh position={[XR - 0.41, 0.32, ZC]} receiveShadow><boxGeometry args={[0.5, 0.4, L - 0.06]} /><primitive object={wallMats.seat} attach="material" /></mesh>
      <mesh position={[XR - 0.09, 0.88, ZC]} receiveShadow><boxGeometry args={[0.16, 0.72, L - 0.06]} /><primitive object={wallMats.back} attach="material" /></mesh>
      <mesh position={[XR - 0.09, 1.24, ZC]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.08, 0.08, L - 0.06, 16]} /><primitive object={m.black} attach="material" /></mesh>

      {/* the left side: pass counter with a window onto the open kitchen, a lintel of yellow tile and the menu boards */}
      <mesh position={[XL + 0.225, 0.5, ZC]}><boxGeometry args={[0.45, 1.0, L - 0.04]} /><primitive object={wallMats.front} attach="material" /></mesh>
      <mesh position={[XL + 0.3, 0.05, ZC]}><boxGeometry args={[0.42, 0.1, L - 0.04]} /><primitive object={m.steelDark} attach="material" /></mesh>
      <RoundedBox args={[0.58, 0.06, L - 0.04]} radius={0.02} smoothness={3} position={[XL + 0.25, 1.03, ZC]} receiveShadow><primitive object={m.steel} attach="material" /></RoundedBox>
      <mesh position={[XL, 2.2 + (H - 2.2) / 2, ZC]} rotation-y={Math.PI / 2}><planeGeometry args={[L, H - 2.2]} /><primitive object={wallMats.left} attach="material" /></mesh>
      <mesh position={[XL, 2.18, ZC]}><boxGeometry args={[0.32, 0.07, L]} /><primitive object={m.black} attach="material" /></mesh>
      <mesh position={[XL + 0.012, H - 0.4, ZC]} rotation-y={Math.PI / 2} scale={[1, -1, 1]}><planeGeometry args={[L, 0.8]} /><primitive object={m.fold} attach="material" /></mesh>
      {pillars.map((z) => <mesh key={z} position={[XL, 1.05 + 0.575, z]}><boxGeometry args={[0.26, 1.15, 0.24]} /><primitive object={wallMats.pillar} attach="material" /></mesh>)}
      {boards.map((z, i) => (
        <group key={z} position={[XL + 0.04, 2.72, z]} rotation-y={Math.PI / 2}>
          <mesh position-z={-0.02}><boxGeometry args={[1.38, 0.6, 0.04]} /><primitive object={m.black} attach="material" /></mesh>
          <mesh position-z={0.006}><planeGeometry args={[1.32, 0.567]} /><meshBasicMaterial map={signs.boards[i % signs.boards.length]} toneMapped={false} /></mesh>
        </group>
      ))}
      {/* heat lamps along the pass */}
      <mesh position={[XL - 0.22, 2.05, ZC]}><boxGeometry args={[0.06, 0.04, L - 0.8]} /><meshBasicMaterial color="#ff8a2a" toneMapped={false} transparent opacity={0.85} /></mesh>
      <mesh position={[XL - 0.1, 1.93, ZC]} rotation-x={Math.PI / 2}><planeGeometry args={[0.5, L - 0.8]} /><meshBasicMaterial map={m.soft} color="#ff8a2a" transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      {/* on the pass: steel pans of garnish and stacks of wrapped burgers, an order rail with tickets */}
      {[1.2, -1.0, -3.2, -5.4, -7.6].filter((z) => z > ZF + 0.8).map((z, i) => <PassSet key={z} p={[XL + 0.25, 1.06, z]} i={i} mats={m} />)}
      <group position={[XL - 0.05, 1.82, ZC]}>
        <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.012, 0.012, L - 1, 8]} /><primitive object={m.steel} attach="material" /></mesh>
        {Array.from({ length: Math.floor((L - 1.2) / 0.5) }, (_, k) => <mesh key={k} position={[0.01, -0.13 - (k % 3) * 0.02, (L - 1.2) / 2 - k * 0.5]} rotation-z={((k % 5) - 2) * 0.025}><planeGeometry args={[0.005, 0.2]} /><meshStandardMaterial color="#fbfaf4" side={THREE.DoubleSide} emissive="#fff1c8" emissiveIntensity={0.1} /></mesh>)}
      </group>

      {/* the open kitchen behind the window */}
      <mesh position={[XK, H / 2, ZC]} rotation-y={Math.PI / 2}><planeGeometry args={[L, H]} /><primitive object={wallMats.kback} attach="material" /></mesh>
      <mesh position={[XK + 0.36, 0.45, ZC]}><boxGeometry args={[0.72, 0.9, L - 0.1]} /><primitive object={wallMats.front} attach="material" /></mesh>
      <mesh position={[XK + 0.38, 0.925, ZC]}><boxGeometry args={[0.76, 0.05, L - 0.1]} /><primitive object={m.steel} attach="material" /></mesh>
      {[1.5, 1.95].map((y) => <mesh key={y} position={[XK + 0.18, y, ZC]}><boxGeometry args={[0.34, 0.04, L - 0.4]} /><primitive object={m.steel} attach="material" /></mesh>)}
      {[1.5, 1.95].flatMap((y) => [-0.6, -2.4, -4.2, -6.0, -7.8, 1.2].filter((z) => z > ZF + 0.6).map((z) => <ShelfPan key={`${y}${z}`} p={[XK + 0.2, y + 0.02, z]} mats={m} k={Math.abs(Math.round(z * 3 + y * 7))} />))}
      {grills.filter((z) => z > ZF + 0.8).map((z, i) => (
        <group key={z} position={[XK + 0.4, 0, z]}>
          <mesh position={[0, 0.965, 0]}><boxGeometry args={[0.6, 0.03, 1.1]} /><primitive object={m.steelDark} attach="material" /></mesh>
          <mesh position={[0, 0.985, 0]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.5, 0.9]} /><meshStandardMaterial color="#ff7a2a" emissive="#ff5a10" emissiveIntensity={0.4} transparent opacity={0.28} /></mesh>
          {[-0.3, 0.05, 0.35].map((dz, k) => <mesh key={k} position={[(k - 1) * 0.1, 0.99, dz]}><cylinderGeometry args={[0.07, 0.07, 0.012, 20]} /><meshStandardMaterial color="#5a2e1a" roughness={0.8} /></mesh>)}
          <Sparks origin={[0, 1.0, 0]} width={0.8} />
          <Puffs origin={[0, 1.0, 0]} count={9} height={1.0} size={0.42} spread={0.3} opacity={0.2} />
          <mesh position={[0, 2.35, 0]}><boxGeometry args={[1.05, 0.55, 1.9]} /><primitive object={m.steel} attach="material" /></mesh>
          <mesh position={[0, (2.62 + H) / 2, 0]}><boxGeometry args={[0.5, H - 2.62, 0.5]} /><primitive object={m.steel} attach="material" /></mesh>
          <mesh position={[0.05, 2.07, 0]} rotation-x={Math.PI / 2}><planeGeometry args={[0.8, 1.6]} /><meshBasicMaterial color="#ffd08a" toneMapped={false} side={THREE.DoubleSide} /></mesh>
          {i === 1 && <LightCone p={[0.1, 2.05, 0]} h={1.1} r={0.9} color="#ffb867" opacity={0.1} />}
        </group>
      ))}
      <mesh position={[(XL + XK) / 2, H, ZC]} rotation-x={Math.PI / 2}><planeGeometry args={[XL - XK, L]} /><meshStandardMaterial color="#1a1b20" roughness={0.9} /></mesh>

      {/* the ceiling: wooden slats with black beams and little downlights, and the end walls */}
      <mesh position={[cx, H, ZC]} rotation-x={Math.PI / 2}><planeGeometry args={[XR - XL, L]} /><primitive object={m.ceiling} attach="material" /></mesh>
      {Array.from({ length: Math.floor(L / 1.6) + 1 }, (_, k) => <mesh key={k} position={[cx, H - 0.06, ZN - 0.4 - 1.6 * k]}><boxGeometry args={[XR - XL, 0.12, 0.1]} /><primitive object={m.black} attach="material" /></mesh>)}
      {Array.from({ length: Math.floor(L / 1.6) }, (_, k) => <mesh key={k} position={[XL + 0.55, H - 0.005, ZN - 1.2 - 1.6 * k]} rotation-x={Math.PI / 2}><circleGeometry args={[0.07, 20]} /><meshBasicMaterial color="#fff3d2" toneMapped={false} /></mesh>)}
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
      </group>

      {/* a round table for each dish: wooden top with a black rim, a pedestal, a menu card, a condiment caddy, and a pendant lamp above */}
      {tables.map(({ z }, i) => (
        <group key={i}>
          <mesh position={[D.TABLE_X, 0.003, z]} rotation-x={-Math.PI / 2}><planeGeometry args={[1.9, 1.9]} /><primitive object={m.blob} attach="material" /></mesh>
          <mesh position={[D.TABLE_X, 0.745, z]} castShadow receiveShadow><cylinderGeometry args={[D.TABLE_R, D.TABLE_R, 0.035, 48]} /><primitive object={m.wood} attach="material" /></mesh>
          <mesh position={[D.TABLE_X, 0.738, z]}><cylinderGeometry args={[D.TABLE_R + 0.01, D.TABLE_R + 0.01, 0.03, 48]} /><primitive object={m.black} attach="material" /></mesh>
          <mesh position={[D.TABLE_X, 0.38, z]}><cylinderGeometry args={[0.045, 0.06, 0.72, 16]} /><primitive object={m.enamel} attach="material" /></mesh>
          <mesh position={[D.TABLE_X, 0.03, z]}><cylinderGeometry args={[0.25, 0.29, 0.05, 32]} /><primitive object={m.enamel} attach="material" /></mesh>
          {/* the menu card, turned like the tray so it faces whoever is walking up */}
          <group position={[D.TRAY_X, D.TABLE_TOP, z]} rotation-y={yaw}>
            <group position={[0.5, 0.0, 0.3]} rotation-y={-0.1}>
              <mesh position={[0, 0.085, 0]} rotation-x={-0.28} castShadow><planeGeometry args={[0.34, 0.186]} /><meshBasicMaterial map={signs.cards[i]} toneMapped={false} side={THREE.DoubleSide} /></mesh>
              <mesh position={[0, 0.02, -0.03]} rotation-x={0.35}><boxGeometry args={[0.3, 0.04, 0.006]} /><primitive object={m.steelDark} attach="material" /></mesh>
              <mesh position={[0, 0.006, 0]}><boxGeometry args={[0.34, 0.012, 0.07]} /><primitive object={m.steelDark} attach="material" /></mesh>
            </group>
          </group>
          <Caddy p={[D.TABLE_X + 0.38, D.TABLE_TOP, z - 0.1]} mats={m} />
          <group position={[D.TABLE_X, H, z]}>
            <group ref={(e) => { lampRefs.current[i] = e; }}>
              <mesh position-y={-0.5}><cylinderGeometry args={[0.005, 0.005, 1.0, 4]} /><meshStandardMaterial color="#111" /></mesh>
              <mesh position-y={-1.0} geometry={SHADE}><primitive object={m.enamel} attach="material" /></mesh>
              <mesh position-y={-1.0} geometry={SHADE_IN}><meshStandardMaterial color={YELLOW} side={THREE.BackSide} emissive="#ffb300" emissiveIntensity={1.1} roughness={0.5} /></mesh>
              <mesh position-y={-0.985}><cylinderGeometry args={[0.05, 0.05, 0.06, 16]} /><meshStandardMaterial color="#c9a24b" metalness={0.9} roughness={0.3} /></mesh>
              <mesh position-y={-1.27} rotation-x={Math.PI / 2}><circleGeometry args={[0.08, 16]} /><meshBasicMaterial color="#fff2c4" toneMapped={false} /></mesh>
              <mesh position-y={-1.28} rotation-x={Math.PI / 2}><planeGeometry args={[0.8, 0.8]} /><meshBasicMaterial map={m.soft} color="#ffcc66" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
            </group>
            <LightCone p={[0, -1.3, 0]} h={1.1} r={0.6} color="#ffcc66" opacity={0.07} />
          </group>
        </group>
      ))}

      <HallLights ZC={ZC} L={L} />
      <HallDust ZC={ZC} L={L} />
      {children}
    </group>
  );
}

function Caddy({ p, mats }: { p: [number, number, number]; mats: M }) {
  return (
    <group position={p}>
      <mesh position-y={0.02} castShadow><boxGeometry args={[0.2, 0.04, 0.09]} /><primitive object={mats.enamel} attach="material" /></mesh>
      {[["#b3241a", -0.06], ["#d9a91a", 0.0]].map(([c, x]) => (
        <group key={c as string} position={[x as number, 0.04, 0]}>
          <mesh position-y={0.07} castShadow><cylinderGeometry args={[0.026, 0.03, 0.14, 16]} /><meshPhysicalMaterial color={c as string} roughness={0.3} clearcoat={0.6} /></mesh>
          <mesh position-y={0.152}><coneGeometry args={[0.018, 0.04, 12]} /><meshStandardMaterial color="#f2efe6" roughness={0.4} /></mesh>
        </group>
      ))}
      <mesh position={[0.07, 0.085, 0]} castShadow><boxGeometry args={[0.055, 0.09, 0.07]} /><primitive object={mats.steel} attach="material" /></mesh>
      <mesh position={[0.07, 0.14, 0]}><boxGeometry args={[0.045, 0.02, 0.05]} /><meshStandardMaterial color="#f7f4ea" roughness={0.9} /></mesh>
    </group>
  );
}

function PassSet({ p, i, mats }: { p: [number, number, number]; i: number; mats: M }) {
  const items = [["#f1ecd9"], ["#5d8a3a"], ["#7fae4a"], ["#b8392a"]];
  return (
    <group position={p}>
      {items.slice(0, 2 + (i % 2)).map(([c], k) => (
        <group key={k} position={[0.02, 0, -0.34 + k * 0.34]}>
          <RoundedBox args={[0.3, 0.075, 0.3]} radius={0.01} smoothness={2} position-y={0.0375}><primitive object={mats.steel} attach="material" /></RoundedBox>
          <mesh position-y={0.085}><cylinderGeometry args={[0.12, 0.12, 0.03, 18]} /><meshStandardMaterial color={c} roughness={0.55} /></mesh>
        </group>
      ))}
      <group position={[0.02, 0, 0.5]}>
        {[0, 1, 2].map((k) => <mesh key={k} position-y={0.03 + k * 0.05} rotation-y={k * 0.7}><cylinderGeometry args={[0.07, 0.07, 0.046, 20]} /><meshStandardMaterial color={k % 2 ? "#f2cf4c" : "#fbf5df"} roughness={0.7} /></mesh>)}
      </group>
    </group>
  );
}

function ShelfPan({ p, mats, k }: { p: [number, number, number]; mats: M; k: number }) {
  const c = ["#f1ecd9", "#b8392a", "#7fae4a", "#d9a91a", "#5a2e1a"][k % 5];
  return (
    <group position={p}>
      <RoundedBox args={[0.26, 0.09, 0.4]} radius={0.01} smoothness={2} position-y={0.045}><primitive object={mats.steel} attach="material" /></RoundedBox>
      <mesh position-y={0.095} rotation-x={-Math.PI / 2}><planeGeometry args={[0.22, 0.34]} /><meshStandardMaterial color={c} roughness={0.6} /></mesh>
    </group>
  );
}

function HallLights({ ZC, L }: { ZC: number; L: number }) {
  return (
    <>
      {[0.2, 0.5, 0.8].map((k) => <pointLight key={k} position={[0.4, 2.7, ZC + L / 2 - L * k]} intensity={6} distance={7.5} decay={2} color="#ffd9a0" />)}
      <pointLight position={[D.X_LEFT - 1.6, 2.2, ZC]} intensity={14} distance={10} decay={2} color="#ffb060" />
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
