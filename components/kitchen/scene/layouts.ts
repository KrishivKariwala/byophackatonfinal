/**
 * Where the dishes stand and how the camera walks past them, for each kind of room. The scene (Rig, Lights, Dish) asks the layout instead of knowing the
 * room: "round" is the Paris Panini back kitchen (a curved counter, walked clockwise); "diner" is a straight hall with the open kitchen on one side and a
 * row of tables on the other. No three.js in here, so the page can import it for free.
 */
import { AISLE_R, COUNTER_TOP, DISH_R, DISH_TH, EYE, FOCUS_LEAD, FOCUS_R, lerp, pForDish as pForDishRound, pathTheta, polar, smoothstep } from "./constants";
import type { KitchenLayout } from "@/lib/kitchen-themes";

/** a camera pose: where it stands (x, y, z), which way it turns (yaw), and its pitch */
export interface Pose { x: number; y: number; z: number; yaw: number; pitch: number }
export interface Layout {
  id: KitchenLayout;
  count: number;
  /** scroll progress (0..1) at which the camera stands in front of dish i */
  pForDish(i: number): number;
  /** where dish i's tray stands (the point on the counter or table) and which way it faces */
  dish(i: number): { x: number; y: number; z: number; yaw: number };
  /** the point above dish i where its name tag floats */
  tag(i: number): [number, number, number];
  /** the pose while walking, at (smoothed) progress s */
  walk(s: number): Pose;
  /** the pose while looking at dish i */
  focus(i: number): Pose;
  /** the dish nearest to a camera at (x, z) */
  nearest(x: number, z: number): number;
  /** the spotlight position and target for dish i */
  spot(i: number): { pos: [number, number, number]; target: [number, number, number] };
  /** the distance range over which a name tag fades in: [gone, fully shown] */
  tagRange: [number, number];
  /** how far the camera may be from a scroll position and still count as "at" a dish */
  stopWindow: number;
}

// ---------------------------------------------------------------- round (Paris Panini): the exact numbers the scene always used
export const roundLayout: Layout = {
  id: "round",
  count: DISH_TH.length,
  pForDish: pForDishRound,
  dish: (i) => { const [x, z] = polar(DISH_R, DISH_TH[i]); return { x, y: COUNTER_TOP, z, yaw: -DISH_TH[i] }; },
  tag: (i) => { const [x, z] = polar(DISH_R, DISH_TH[i]); return [x, COUNTER_TOP + 0.78, z]; },
  walk: (s) => {
    const th = pathTheta(s), r = lerp(4.75, AISLE_R, smoothstep(0, 0.17, s));
    const [x, z] = polar(r, th), bias = lerp(-0.5, 0.3, smoothstep(0.02, 0.23, s));
    return { x, y: EYE, z, yaw: -th - Math.PI / 2 + bias, pitch: -0.1 };
  },
  focus: (i) => {
    const dth = DISH_TH[i], [fx, fz] = polar(FOCUS_R, dth - FOCUS_LEAD * 0.6), [tx, tz] = polar(DISH_R, dth), fy = EYE - 0.05;
    return { x: fx, y: fy, z: fz, yaw: Math.atan2(-(tx - fx), -(tz - fz)), pitch: Math.atan2(1.48 - fy, Math.hypot(tx - fx, tz - fz)) };
  },
  nearest: (x, z) => {
    const ct = Math.atan2(x, -z); let best = 0, bd = 9;
    for (let i = 0; i < DISH_TH.length; i++) { const dd = Math.abs(DISH_TH[i] - ct); if (dd < bd) { bd = dd; best = i; } }
    return best;
  },
  spot: (i) => { const [x, z] = polar(DISH_R - 1.1, DISH_TH[i]), [tx, tz] = polar(DISH_R, DISH_TH[i]); return { pos: [x, 2.9, z], target: [tx, COUNTER_TOP + 0.35, tz] }; },
  tagRange: [6.3, 4.4],
  stopWindow: 0.04,
};

// ---------------------------------------------------------------- diner (Smash Guys): a straight hall, walked towards -z
/**
 * The hall runs along z. The open kitchen and its pass counter are on the left (-x), a red leather banquette runs along the right wall with a round table in
 * front of it for each dish. The camera walks down the aisle in between; tables are only 1.6 m apart so the walk stays smooth and the dishes follow quickly.
 */
export const DINER = {
  X_LEFT: -2.2, X_RIGHT: 2.45, Z_NEAR: 3.6, H: 3.3,
  AISLE_X: -0.35, TABLE_X: 1.2, TABLE_R: 0.55, TRAY_X: 1.12, TABLE_TOP: 0.76,
  Z_FIRST: 1.0, SPACING: 1.6, LEAD: 0.6, Z_START: 3.0,
} as const;
export const dinerZ = (i: number) => DINER.Z_FIRST - DINER.SPACING * i;

export function makeDinerLayout(count: number): Layout {
  const zEnd = dinerZ(count - 1) + DINER.LEAD - 1.1; // the walk runs a little past the last table, so the last dish is not at the very end of the scroll
  const pFor = (i: number) => (dinerZ(i) + DINER.LEAD - DINER.Z_START) / (zEnd - DINER.Z_START);
  return {
    id: "diner",
    count,
    pForDish: pFor,
    dish: (i) => ({ x: DINER.TRAY_X, y: DINER.TABLE_TOP, z: dinerZ(i), yaw: -Math.PI / 2 }),
    tag: (i) => [DINER.TRAY_X, DINER.TABLE_TOP + 0.78, dinerZ(i)],
    walk: (s) => {
      const z = lerp(DINER.Z_START, zEnd, s);
      // looking a little to the right (at the tables) while walking; straighter at the start so the whole hall is seen from the door
      const yaw = lerp(-0.12, -0.34, smoothstep(0, 0.16, s));
      return { x: DINER.AISLE_X, y: EYE, z, yaw, pitch: -0.07 };
    },
    focus: (i) => {
      const fx = DINER.AISLE_X - 0.2, fz = dinerZ(i) + 0.95, tx = DINER.TRAY_X, tz = dinerZ(i), fy = EYE - 0.1;
      return { x: fx, y: fy, z: fz, yaw: Math.atan2(-(tx - fx), -(tz - fz)), pitch: Math.atan2(DINER.TABLE_TOP + 0.55 - fy, Math.hypot(tx - fx, tz - fz)) };
    },
    nearest: (_x, z) => {
      let best = 0, bd = 99;
      for (let i = 0; i < count; i++) { const dd = Math.abs(dinerZ(i) + DINER.LEAD - z); if (dd < bd) { bd = dd; best = i; } }
      return best;
    },
    spot: (i) => ({ pos: [DINER.TRAY_X - 0.7, 2.75, dinerZ(i) + 0.35], target: [DINER.TRAY_X, DINER.TABLE_TOP + 0.35, dinerZ(i)] }),
    tagRange: [4.7, 3.1],
    stopWindow: 0.035,
  };
}

const cache = new Map<string, Layout>();
/** the layout of a theme's room (built once per theme) */
export function layoutFor(theme: { id: string; layout: KitchenLayout; dishes: unknown[] }): Layout {
  const key = `${theme.id}:${theme.layout}:${theme.dishes.length}`;
  let l = cache.get(key);
  if (!l) { l = theme.layout === "diner" ? makeDinerLayout(theme.dishes.length) : roundLayout; cache.set(key, l); }
  return l;
}
