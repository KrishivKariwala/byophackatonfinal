"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { List, Map as MapIcon, MapPin, Search, LocateFixed } from "lucide-react";
import type { EnrichedListing } from "@/lib/services";
import { NEIGHBOURHOODS, type Neighbourhood } from "@/lib/geo";
import { DietTag, Photo, Price, fmtWindow } from "@/components/bits";
import { LiveCount, useLive } from "@/components/LiveProvider";
import { api } from "@/components/client";
import { DemoMap } from "@/components/DemoMap";

type F = { q: string; category: string; diet: string; maxPrice: string; after: string; by: string; radius: number };
const EMPTY: F = { q: "", category: "", diet: "", maxPrice: "", after: "", by: "", radius: 5 };

export function Discover({ initial, hasMapKey }: { initial: EnrichedListing[]; hasMapKey: boolean; totalDemoListings: number }) {
  const [items, setItems] = useState(initial);
  const [f, setF] = useState<F>(EMPTY);
  const [view, setView] = useState<"list" | "map">("list");
  const [hood, setHood] = useState<Neighbourhood | "gps">("Koramangala");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsMsg, setGpsMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { subscribe } = useLive();
  const origin = hood === "gps" && gps ? gps : NEIGHBOURHOODS[hood === "gps" ? "Koramangala" : hood];

  const query = useMemo(() => {
    const p = new URLSearchParams({ lat: String(origin.lat), lng: String(origin.lng), radius: String(f.radius) });
    for (const k of ["q", "category", "diet", "maxPrice", "after", "by"] as const) if (f[k]) p.set(k, f[k]);
    return p.toString();
  }, [origin.lat, origin.lng, f]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api<EnrichedListing[]>(`/api/listings?${query}`, undefined, "GET"));
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const id = setTimeout(load, 200);
    return () => clearTimeout(id);
  }, [load]);

  // Re-query on committed changes so sold-out / ended listings drop out of discovery.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const off = subscribe((e) => {
      if (e.type === "listing") { clearTimeout(t); t = setTimeout(load, 300); }
    });
    return () => { off(); clearTimeout(t); };
  }, [subscribe, load]);

  const set = (k: keyof F, v: string | number) => setF((x) => ({ ...x, [k]: v }));
  const useGps = () => {
    if (!("geolocation" in navigator)) { setGpsMsg("Location is not available in this browser. Choose a neighbourhood."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); setHood("gps"); setGpsMsg("Using your current location."); },
      () => setGpsMsg("Location permission denied. Choose a neighbourhood instead."),
      { timeout: 8000 },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-burgundy">Near you</p>
          <h1 className="display text-4xl text-tomato sm:text-5xl">RESCUE SOMETHING TASTY</h1>
        </div>
        <div className="flex rounded-xl bg-sand p-1" role="tablist" aria-label="View">
          <button role="tab" aria-selected={view === "list"} onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold ${view === "list" ? "bg-white" : "text-muted"}`}><List size={16} aria-hidden="true" />List</button>
          <button role="tab" aria-selected={view === "map"} onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold ${view === "map" ? "bg-white" : "text-muted"}`}><MapIcon size={16} aria-hidden="true" />Map</button>
        </div>
      </div>

      <button type="button" className="btn-quiet md:hidden" aria-expanded={showFilters} aria-controls="filters" onClick={() => setShowFilters(!showFilters)}>
        {showFilters ? "Hide filters" : "Search & filters"}{!showFilters && (f.q || f.category || f.diet || f.maxPrice || f.after || f.by) ? " · active" : ""}
      </button>
      <section id="filters" aria-label="Filters" className={`card gap-3 p-4 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr] ${showFilters ? "grid" : "hidden"}`}>
        <label className="label md:col-span-1">Search
          <span className="relative"><Search size={16} aria-hidden="true" className="absolute left-3 top-3.5 text-muted" />
            <input className="input pl-9" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Food, category or restaurant" /></span>
        </label>
        <label className="label">Location
          <span className="flex gap-2">
            <select className="input" value={hood} onChange={(e) => setHood(e.target.value as Neighbourhood)}>
              {Object.keys(NEIGHBOURHOODS).map((n) => <option key={n}>{n}</option>)}
              {gps && <option value="gps">My location</option>}
            </select>
            <button type="button" onClick={useGps} className="btn-quiet !px-3" aria-label="Use my current location"><LocateFixed size={18} aria-hidden="true" /></button>
          </span>
        </label>
        <label className="label">Distance: {f.radius} km
          <input type="range" min={1} max={20} value={f.radius} onChange={(e) => set("radius", Number(e.target.value))} className="accent-tomato mt-3" />
        </label>
        <label className="label">Max price
          <select className="input" value={f.maxPrice} onChange={(e) => set("maxPrice", e.target.value)}>
            <option value="">Any</option><option value="100">Up to ₹100</option><option value="150">Up to ₹150</option><option value="200">Up to ₹200</option>
          </select>
        </label>
        <label className="label">Category
          <select className="input" value={f.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">All</option><option>Bakery</option><option>Meals</option><option>Snacks</option><option>Desserts</option>
          </select>
        </label>
        <label className="label">Diet
          <select className="input" value={f.diet} onChange={(e) => set("diet", e.target.value)}>
            <option value="">Veg + non-veg</option><option value="Vegetarian">Vegetarian only</option><option value="Non-vegetarian">Non-vegetarian only</option>
          </select>
        </label>
        <label className="label">Pickup open after
          <input type="time" className="input" value={f.after} onChange={(e) => set("after", e.target.value)} />
        </label>
        <label className="label">Pickup starts by
          <input type="time" className="input" value={f.by} onChange={(e) => set("by", e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-4">
          <span className="text-xs text-muted" aria-live="polite">{loading ? "Updating…" : `${items.length} listing${items.length === 1 ? "" : "s"} within ${f.radius} km`}</span>
          {gpsMsg && <span className="text-xs text-burgundy">{gpsMsg}</span>}
          <button type="button" className="ml-auto text-xs font-semibold text-tomato underline" onClick={() => setF(EMPTY)}>Clear filters</button>
        </div>
      </section>
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}

      {view === "map" ? (
        <DemoMap origin={origin} radiusKm={f.radius} hasMapKey={hasMapKey} items={items.map((l) => ({ id: l.id, title: l.title, lat: l.outlet.lat, lng: l.outlet.lng, qty: l.qtyAvailable, price: l.rescuePrice, vendor: l.vendor.businessName }))} />
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-10 text-center">
          <MapPin className="text-tomato" aria-hidden="true" />
          <p className="editorial text-2xl">Nothing nearby matches right now</p>
          <p className="text-sm text-muted">Widen the distance, clear filters, or check back closer to closing time.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <li key={l.id}>
              <Link href={`/c/listing/${l.id}`} className="card block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                <Photo title={l.title} surprise={l.surpriseBag} className="h-36" />
                <div className="flex flex-col gap-1.5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold leading-tight">{l.title}</h2>
                    <DietTag diet={l.diet} />
                  </div>
                  <p className="text-xs text-muted">{l.vendor.businessName} · {l.outlet.neighbourhood} · {l.distanceKm?.toFixed(1)} km</p>
                  <div className="mt-1 flex items-center justify-between"><Price original={l.originalPrice} rescue={l.rescuePrice} /><LiveCount listingId={l.id} initial={l.qtyAvailable} /></div>
                  <p className="text-xs text-muted">Pickup {fmtWindow(l.windowStart, l.windowEnd)} · {l.category}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
