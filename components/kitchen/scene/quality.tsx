"use client";
import { createContext, useContext } from "react";

/**
 * How much the kitchen draws. The "effects" (steam, sparks, dust, light beams) are the costly, see-through layers: they are the first thing
 * switched off when a device cannot keep up. Everything can also be forced from the address (?fx=0, ?dpr=1) for testing.
 */
export const QualityCtx = createContext({ fx: true });
export const useFx = () => useContext(QualityCtx).fx;

/** the highest number of pixels worth drawing: a Retina laptop screen drawn at full sharpness is 4x the work, for little gain in a moving 3D scene */
export function pickDpr(width: number, height: number, coarse: boolean): number {
  const budget = coarse ? 1.7e6 : 2.4e6;
  const fit = Math.sqrt(budget / Math.max(1, width * height));
  return Math.max(1, Math.min(window.devicePixelRatio || 1, coarse ? 2 : 1.75, fit));
}
