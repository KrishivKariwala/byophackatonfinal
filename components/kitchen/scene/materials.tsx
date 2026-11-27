"use client";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { createContext, useContext, useMemo } from "react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import * as TX from "./textures";

/**
 * Every surface of the kitchen. The big ones (terrazzo floor, marble slab, pine panelling, corrugated counter front, brick, steel) are
 * scanned CC0 material sets from ambientCG; the wall mural is the Paris street drawing; small things are painted in code.
 */
export interface Mats {
  floor: THREE.MeshStandardMaterial; marble: THREE.MeshStandardMaterial; pine: THREE.MeshStandardMaterial; pineWall: THREE.MeshStandardMaterial;
  counter: THREE.MeshStandardMaterial; steel: THREE.MeshStandardMaterial; steelDark: THREE.MeshStandardMaterial; brick: THREE.MeshStandardMaterial;
  blueTile: THREE.MeshStandardMaterial; ceiling: THREE.MeshStandardMaterial; plaster: THREE.MeshStandardMaterial; copper: THREE.MeshStandardMaterial;
  murals: THREE.MeshStandardMaterial[]; rattan: THREE.Texture; bread: THREE.Texture; soft: THREE.Texture;
}
const Ctx = createContext<Mats | null>(null);
export const MatsProvider = Ctx.Provider;
export function useMats() { const m = useContext(Ctx); if (!m) throw new Error("materials not ready"); return m; }

const T = "/kitchen/textures/";
type Rep = [number, number];
function prep(t: THREE.Texture, rep: Rep, srgb: boolean, rot = 0, flipX = false) {
  const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(flipX ? -rep[0] : rep[0], rep[1]); if (flipX) c.offset.x = 1;
  c.center.set(0.5, 0.5); c.rotation = rot; c.anisotropy = 8; c.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; c.needsUpdate = true; return c;
}

export function useBuildMats(theme: KitchenTheme): Mats {
  const tex = useTexture({
    tzC: `${T}terrazzo-c.webp`, tzN: `${T}terrazzo-n.webp`, tzR: `${T}terrazzo-r.webp`,
    mbC: `${T}marble-c.webp`, mbN: `${T}marble-n.webp`, mbR: `${T}marble-r.webp`,
    pnC: `${T}pine-c.webp`, pnN: `${T}pine-n.webp`, pnR: `${T}pine-r.webp`,
    brC: `${T}brick-c.webp`, brN: `${T}brick-n.webp`, brR: `${T}brick-r.webp`,
    coN: `${T}corrugated-n.webp`, coR: `${T}corrugated-r.webp`,
    stC: `${T}steel-c.webp`, stN: `${T}steel-n.webp`, stR: `${T}steel-r.webp`,
    muA: "/kitchen/paris-panini/mural-a.webp", muB: "/kitchen/paris-panini/mural-b.webp",
  });
  // useTexture hands back a NEW object on every render; depending on that object rebuilt every material (and re-uploaded every texture) on each
  // re-render of the page, e.g. whenever the pointer moved onto a dish. Depend on the textures themselves instead.
  const loaded = Object.values(tex);
  return useMemo(() => {
    const { brand, brandDark, cream } = theme.colors;
    const floor = new THREE.MeshStandardMaterial({ map: prep(tex.tzC, [7, 7], true), normalMap: prep(tex.tzN, [7, 7], false), roughnessMap: prep(tex.tzR, [7, 7], false), roughness: 0.55, metalness: 0.0 });
    floor.normalScale.set(0.6, 0.6);
    const marble = new THREE.MeshStandardMaterial({ map: prep(tex.mbC, [0.5, 0.5], true), normalMap: prep(tex.mbN, [0.5, 0.5], false), roughnessMap: prep(tex.mbR, [0.5, 0.5], false), roughness: 0.35, metalness: 0.0 });
    const pine = new THREE.MeshStandardMaterial({ map: prep(tex.pnC, [1.2, 1.2], true), normalMap: prep(tex.pnN, [1.2, 1.2], false), roughnessMap: prep(tex.pnR, [1.2, 1.2], false), roughness: 0.8 });
    // wall panelling: slats run up and down, so the picture is turned a quarter
    const pineWall = new THREE.MeshStandardMaterial({ map: prep(tex.pnC, [1.1, 38], true, Math.PI / 2), normalMap: prep(tex.pnN, [1.1, 38], false, Math.PI / 2), roughnessMap: prep(tex.pnR, [1.1, 38], false, Math.PI / 2), roughness: 0.78, side: THREE.BackSide });
    const counter = new THREE.MeshStandardMaterial({ color: brand, normalMap: prep(tex.coN, [5, 2], false, Math.PI / 2), roughnessMap: prep(tex.coR, [5, 2], false, Math.PI / 2), roughness: 0.5, metalness: 0.35 });
    counter.normalScale.set(1.2, 1.2);
    const steel = new THREE.MeshStandardMaterial({ map: prep(tex.stC, [2, 2], true), normalMap: prep(tex.stN, [2, 2], false), roughnessMap: prep(tex.stR, [2, 2], false), color: "#cfd3d8", metalness: 0.9, roughness: 0.4, side: THREE.DoubleSide });
    const steelDark = new THREE.MeshStandardMaterial({ color: "#1c1d22", metalness: 0.8, roughness: 0.45 });
    const brick = new THREE.MeshStandardMaterial({ map: prep(tex.brC, [2, 1.4], true), normalMap: prep(tex.brN, [2, 1.4], false), roughnessMap: prep(tex.brR, [2, 1.4], false), color: "#d58a62", roughness: 0.9 });
    const tile = TX.glazedTileTexture(brand, brandDark); tile.repeat.set(0.85, 0.85); tile.anisotropy = 8;
    const blueTile = new THREE.MeshStandardMaterial({ map: tile, roughness: 0.22, metalness: 0.05 });
    const stripes = TX.stripeTexture(); const ceiling = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.9 });
    const plaster = new THREE.MeshStandardMaterial({ color: cream, roughness: 0.95, side: THREE.BackSide });
    const copper = new THREE.MeshStandardMaterial({ color: "#b8683a", metalness: 0.9, roughness: 0.32 });
    const murals = [tex.muA, tex.muB].map((m) => new THREE.MeshStandardMaterial({ map: prep(m, [1, 1], true, 0, true), roughness: 0.95, side: THREE.BackSide }));
    return { floor, marble, pine, pineWall, counter, steel, steelDark, brick, blueTile, ceiling, plaster, copper, murals, rattan: TX.caneTexture(), bread: TX.breadTexture(), soft: TX.softTexture() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, ...loaded]);
}
