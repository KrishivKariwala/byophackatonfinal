import { describe, expect, it } from "vitest";
import { AISLE_R, DISH_R, DISH_TH, EYE, FOCUS_LEAD, FOCUS_R, TH0, TH1, lerp, polar, smoothstep } from "../components/kitchen/scene/constants";
import { DINER, dinerZ, layoutFor, makeDinerLayout, roundLayout } from "../components/kitchen/scene/layouts";
import { KITCHEN_THEMES } from "../lib/kitchen-themes";

describe("the round (Paris Panini) layout still gives the numbers the scene always used", () => {
  it("dish positions, the walk and the pose at a dish match the original formulas", () => {
    for (let i = 0; i < DISH_TH.length; i++) {
      const [x, z] = polar(DISH_R, DISH_TH[i]), d = roundLayout.dish(i);
      expect([d.x, d.z, d.yaw]).toEqual([x, z, -DISH_TH[i]]);
      expect(roundLayout.pForDish(i)).toBeCloseTo((DISH_TH[i] - FOCUS_LEAD - TH0) / (TH1 - TH0), 12);
    }
    const s = 0.4, th = TH0 + (TH1 - TH0) * s, r = lerp(4.75, AISLE_R, smoothstep(0, 0.17, s)), [px, pz] = polar(r, th), w = roundLayout.walk(s);
    expect([w.x, w.z, w.y, w.pitch]).toEqual([px, pz, EYE, -0.1]);
    expect(w.yaw).toBeCloseTo(-th - Math.PI / 2 + lerp(-0.5, 0.3, smoothstep(0.02, 0.23, s)), 12);
    const f = roundLayout.focus(2), [fx, fz] = polar(FOCUS_R, DISH_TH[2] - FOCUS_LEAD * 0.6);
    expect([f.x, f.z]).toEqual([fx, fz]);
    expect(f.y).toBeCloseTo(EYE - 0.05, 12);
  });
  it("a theme gets the round layout unless it asks for the diner", () => {
    expect(layoutFor(KITCHEN_THEMES["paris-panini"])).toBe(roundLayout);
    expect(layoutFor(KITCHEN_THEMES["smash-guys"]).id).toBe("diner");
    expect(layoutFor(KITCHEN_THEMES["smash-guys"]).count).toBe(7);
  });
});

describe("the diner (Smash Guys) layout is a straight, smooth walk", () => {
  const n = 7, L = makeDinerLayout(n);
  it("tables are close together but never touch", () => {
    const gap = dinerZ(0) - dinerZ(1);
    expect(gap).toBeGreaterThan(DINER.TABLE_R * 2);   // they do not overlap
    expect(gap).toBeLessThanOrEqual(1.8);             // and are not far apart
    for (let i = 1; i < n; i++) expect(dinerZ(i - 1) - dinerZ(i)).toBeCloseTo(gap, 9);
  });
  it("every dish has its own stop on the scroll track, in order, inside 0..1, far enough apart to tell them apart", () => {
    const p = Array.from({ length: n }, (_, i) => L.pForDish(i));
    p.forEach((v) => { expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(1); });
    for (let i = 1; i < n; i++) expect(p[i] - p[i - 1]).toBeGreaterThan(L.stopWindow * 2);
  });
  it("the walk is a straight line down the aisle, between the pass and the tables", () => {
    for (const s of [0, 0.25, 0.5, 0.75, 1]) {
      const w = L.walk(s);
      expect(w.x).toBe(DINER.AISLE_X);
      expect(w.x).toBeGreaterThan(DINER.X_LEFT); expect(w.x).toBeLessThan(DINER.TABLE_X - DINER.TABLE_R);
    }
    const z = [0, 0.5, 1].map((s) => L.walk(s).z);
    expect(z[0]).toBeGreaterThan(z[1]); expect(z[1]).toBeGreaterThan(z[2]);
  });
  it("standing at a dish puts the camera in front of it and turns it towards the dish", () => {
    for (let i = 0; i < n; i++) {
      const f = L.focus(i), d = L.dish(i);
      expect(Math.hypot(d.x - f.x, d.z - f.z)).toBeGreaterThan(1.4); expect(Math.hypot(d.x - f.x, d.z - f.z)).toBeLessThan(2.6);
      expect(f.x).toBeGreaterThan(DINER.X_LEFT + 0.5);
      // the camera looks along (-sin yaw, -cos yaw): that must point at the dish
      const lx = -Math.sin(f.yaw), lz = -Math.cos(f.yaw), dx = d.x - f.x, dz = d.z - f.z, len = Math.hypot(dx, dz);
      expect((lx * dx + lz * dz) / len).toBeGreaterThan(0.999);
      expect(L.walk(L.pForDish(i)).z - dinerZ(i)).toBeCloseTo(DINER.LEAD, 9);
    }
  });
  it("the nearest dish and the spotlight follow the camera", () => {
    for (let i = 0; i < n; i++) { expect(L.nearest(DINER.AISLE_X, dinerZ(i) + DINER.LEAD)).toBe(i); expect(L.spot(i).target[2]).toBe(dinerZ(i)); }
  });
});
