// Translated UI pieces live in BitsUi.tsx (a client module); the plain helpers below are safe to call from server components.
export { DietTag, DemoBadge, Price, Photo, StatusPill } from "./BitsUi";

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
export const fmtWindow = (a: string, b: string) => `${fmtTime(a)}–${fmtTime(b)}`;
