/**
 * Geometry of the round kitchen, shared by the 3D scene and the page around it (no three.js in here, so the page can import it for free).
 *
 * The room is a circle. A chimney hood and cooking island stand in the middle; a curved stone counter runs round the wall with the five
 * dishes on it; the visitor walks the aisle in between, clockwise, so the food is always on the LEFT.
 *   polar(r, th): th = 0 is the far side, th grows clockwise seen from above (x = r sin th, z = -r cos th).
 */
export const DEG = Math.PI / 180;
export const ROOM_R = 5.45;
export const WALL_H = 3.7;
export const ISLAND_R = 1.45;
export const AISLE_R = 3.0;
export const COUNTER_IN = 4.4;
export const COUNTER_OUT = 5.3;
export const COUNTER_TOP = 0.93;
export const DISH_R = 4.74;
export const FOCUS_R = 2.55;
export const EYE = 1.55;

export const polar = (r: number, th: number): [number, number] => [r * Math.sin(th), -r * Math.cos(th)];

/** angles of the five dishes on the counter */
export const DISH_TH = [-6, 18, 42, 66, 90].map((d) => d * DEG);
/** the walk runs from the door (TH0) along the aisle to TH1 */
export const TH0 = -50 * DEG;
export const TH1 = 110 * DEG;
export const DOOR_TH = -64 * DEG;
/** where the camera stands, in angle, when it looks at a dish: a little before it, so the food is ahead on the left */
export const FOCUS_LEAD = 0.13;

export const pathTheta = (p: number) => TH0 + (TH1 - TH0) * p;
export const pForDish = (i: number) => (DISH_TH[i] - FOCUS_LEAD - TH0) / (TH1 - TH0);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smoothstep = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** shortest-way angle interpolation */
export const lerpAngle = (a: number, b: number, t: number) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };

/** what the page needs to know about the walk */
export interface WalkApi {
  /** scroll progress 0..1 (written by the page's scroll track) */
  progress: { current: number };
  /** index of the dish the camera is looking at, or null */
  focus: { current: number | null };
  /** drag-to-look offsets in radians (yaw, pitch) */
  look: { current: { x: number; y: number } };
  /** 0 = door still closed, 1 = inside */
  enter: { current: number };
  /** true while a dialog or the cart covers the scene: the camera must not auto-stop */
  busy: { current: boolean };
  /** scroll position at which the visitor closed a dish by hand: do not stop there again until they scroll on */
  rest: { current: number | null };
  /** how far the scene is pushed aside for the dish sheet: x to the left, y upwards, as fractions of the screen */
  shift: { current: { x: number; y: number } };
}
