"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { KitchenDish } from "@/lib/kitchen-themes";
import { useT } from "@/components/I18n";

/**
 * Browse the photos of one dish. They stand in a row in 3D, like cards on a table: the front one tilts with your finger or mouse,
 * tapping it brings the next one forward, swiping or the arrows go either way. Every photo is credited underneath.
 */
export function PhotoViewer({ dish, name, onClose }: { dish: KitchenDish; name: string; onClose: () => void }) {
  const { t } = useT();
  const n = dish.photos.length;
  const [cur, setCur] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const down = useRef<{ x: number; id: number } | null>(null);
  const swiped = useRef(false);
  const go = (d: number) => setCur((c) => (c + d + n) % n);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const p = dish.photos[cur];
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#05071d]/95 backdrop-blur-sm k-pop" role="dialog" aria-modal="true" aria-label={name}>
      <div className="flex items-center justify-between gap-3 p-4 text-white">
        <p className="k-display text-xl sm:text-2xl">{name}</p>
        <button type="button" aria-label={t("kitchen.close")} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X size={22} aria-hidden="true" /></button>
      </div>

      <div className="k-stage relative min-h-0 flex-1 touch-pan-y select-none"
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -10, y: ((e.clientX - r.left) / r.width - 0.5) * 14 }); const d = down.current; if (d && Math.abs(e.clientX - d.x) > 46) { swiped.current = true; go(e.clientX < d.x ? 1 : -1); down.current = null; } }}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        onPointerDown={(e) => { down.current = { x: e.clientX, id: e.pointerId }; swiped.current = false; }}
        onPointerUp={() => { down.current = null; }}>
        {dish.photos.map((ph, i) => {
          let off = (i - cur + n) % n; if (off > n / 2) off -= n;
          const a = Math.abs(off);
          const front = off === 0;
          return (
            <button key={ph.src} type="button" className="k-card" tabIndex={front ? 0 : -1}
              aria-label={front ? t("kitchen.photo.next") : ph.title}
              onClick={() => { if (swiped.current) { swiped.current = false; return; } if (front) go(1); else setCur(i); }}
              style={{
                transform: `translate(-50%, -50%) translate3d(${off * 56}%, 0, ${-a * 160}px) rotateY(${front ? tilt.y : -off * 42}deg) rotateX(${front ? tilt.x : 0}deg) scale(${1 - a * 0.16})`,
                opacity: a > 1 ? 0 : a === 1 ? 0.55 : 1, zIndex: 10 - a, pointerEvents: a > 1 ? "none" : "auto", padding: 0, border: 0,
              }}>
              {/* the photos are lazy: only the front card and its neighbours are fetched */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.src} alt={front ? ph.title : ""} loading={a <= 1 ? "eager" : "lazy"} draggable={false} />
            </button>
          );
        })}
        {n > 1 && (<>
          <button type="button" aria-label={t("kitchen.photo.prev")} onClick={() => go(-1)} className="absolute left-2 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"><ChevronLeft aria-hidden="true" /></button>
          <button type="button" aria-label={t("kitchen.photo.next")} onClick={() => go(1)} className="absolute right-2 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"><ChevronRight aria-hidden="true" /></button>
        </>)}
      </div>

      <div className="p-4 pb-6 text-center text-white">
        <div className="mb-3 flex justify-center gap-2" aria-hidden="true">{dish.photos.map((_, i) => <span key={i} className="h-2 rounded-full transition-all" style={{ width: i === cur ? 26 : 8, background: i === cur ? "var(--k-brass)" : "rgba(255,255,255,.4)" }} />)}</div>
        <p role="status" className="text-sm font-bold">{t("kitchen.photo.count", { n: cur + 1, total: n })}{n > 1 ? ` · ${t("kitchen.photo.tap")}` : ""}</p>
        <p className="mt-1 text-xs text-white/75">
          <a href={p.source} target="_blank" rel="noopener noreferrer" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">{t("kitchen.photo.credit", { author: p.author, license: p.license })}</a>
          {" · "}{t("kitchen.photo.note")}
        </p>
      </div>
    </div>
  );
}
