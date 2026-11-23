// Demo neighbourhood reference points (area centres used only to place clearly fictional demo outlets).
export const NEIGHBOURHOODS = {
  Koramangala: { lat: 12.9352, lng: 77.6245 },
  Indiranagar: { lat: 12.9719, lng: 77.6412 },
  "HSR Layout": { lat: 12.9116, lng: 77.6389 },
  Jayanagar: { lat: 12.9308, lng: 77.5838 },
  Whitefield: { lat: 12.9698, lng: 77.75 },
} as const;
export type Neighbourhood = keyof typeof NEIGHBOURHOODS;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Valid Google Maps directions URL (no API key needed). */
export function directionsUrl(dest: { lat: number; lng: number }, origin?: { lat: number; lng: number }) {
  const u = new URL("https://www.google.com/maps/dir/");
  u.searchParams.set("api", "1");
  u.searchParams.set("destination", `${dest.lat},${dest.lng}`);
  if (origin) u.searchParams.set("origin", `${origin.lat},${origin.lng}`);
  u.searchParams.set("travelmode", "walking");
  return u.toString();
}
