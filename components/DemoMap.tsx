"use client";
import Link from "next/link";
import { NEIGHBOURHOODS } from "@/lib/geo";

type Item = { id: string; title: string; lat: number; lng: number; qty: number; price: number; vendor: string };

// Bounding box around the demo neighbourhoods.
const B = { minLat: 12.885, maxLat: 12.995, minLng: 77.55, maxLng: 77.78 };
const W = 900, H = 520;
const x = (lng: number) => ((lng - B.minLng) / (B.maxLng - B.minLng)) * W;
const y = (lat: number) => H - ((lat - B.minLat) / (B.maxLat - B.minLat)) * H;
const kmPerPxX = ((B.maxLng - B.minLng) * 111.32 * Math.cos((12.94 * Math.PI) / 180)) / W;

/**
 * Labelled demo map. No live map API is connected unless NEXT_PUBLIC_MAPS_API_KEY is configured;
 * this schematic never pretends to be a live map. Markers come from the same dataset as the list.
 */
export function DemoMap({ items, origin, radiusKm, hasMapKey }: { items: Item[]; origin: { lat: number; lng: number }; radiusKm: number; hasMapKey: boolean }) {
  const r = radiusKm / kmPerPxX;
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-cream px-4 py-2 text-xs font-semibold text-burgundy">
        <span>{hasMapKey ? "Map key detected — wire your provider in components/DemoMap.tsx" : "Demo map · no live map API key configured · positions are fictional demo outlets"}</span>
        <span>{items.length} markers · same results as the list</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full bg-[#FBF7EE]" role="img" aria-label={`Demo map with ${items.length} listings`}>
        <defs>
          <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#EDE6DC" strokeWidth="1" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {Object.entries(NEIGHBOURHOODS).map(([n, c]) => (
          <g key={n}>
            <circle cx={x(c.lng)} cy={y(c.lat)} r={38} fill="#FEF2C0" opacity={0.7} />
            <text x={x(c.lng)} y={y(c.lat) + 54} textAnchor="middle" fontSize="13" fontWeight="600" fill="#6B4A4A">{n}</text>
          </g>
        ))}
        <circle cx={x(origin.lng)} cy={y(origin.lat)} r={r} fill="#CB0001" fillOpacity={0.06} stroke="#CB0001" strokeDasharray="6 6" />
        <circle cx={x(origin.lng)} cy={y(origin.lat)} r={7} fill="#790000" stroke="#fff" strokeWidth="3" />
        {items.map((it) => (
          <Link key={it.id} href={`/c/listing/${it.id}`} aria-label={`${it.title}, ${it.vendor}, ₹${it.price}, ${it.qty} left`}>
            <g>
              <path d={`M${x(it.lng)} ${y(it.lat)} l-11 -22 a13 13 0 1 1 22 0 z`} fill="#CB0001" stroke="#fff" strokeWidth="2" />
              <text x={x(it.lng)} y={y(it.lat) - 25} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{it.qty}</text>
              <title>{`${it.title} · ${it.vendor} · ₹${it.price} · ${it.qty} left`}</title>
            </g>
          </Link>
        ))}
      </svg>
    </div>
  );
}
