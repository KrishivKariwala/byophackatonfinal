"use client";
import { useRef, useState } from "react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { useT } from "@/components/I18n";

/**
 * The entrance. After sign-in the vendor stands in front of their restaurant's door at night: the sign, the striped awning, the lit window.
 * "Enter door" is not a button: it is a brass plate on the door itself, and the door is pushed open (drag it or tap it).
 * The 3D kitchen is already loading underneath; when the door swings open the whole street zooms through the doorway into it.
 */
export function Door({ theme, onOpening, onDone, onSkip }: { theme: KitchenTheme; onOpening: () => void; onDone: () => void; onSkip: () => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = useRef(0);

  const push = () => {
    if (open) return;
    setOpen(true); setDrag(null);
    setTimeout(() => { setZoom(true); onOpening(); }, 650);
    setTimeout(onDone, 2150);
  };
  const angle = open ? -112 : drag != null ? -Math.min(70, drag) : undefined;

  return (
    <div className={`k-door ${open ? "is-open" : ""} ${zoom ? "is-zoom" : ""}`} role="group" aria-label={t("kitchen.door.aria", { brand: theme.brand })}>
      <div className="k-stars" aria-hidden="true" />
      <div className="k-street" aria-hidden="true" />
      <div className="k-spill" aria-hidden="true" />
      <button type="button" className="k-skip rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur hover:bg-black/50" onClick={onSkip}>{t("kitchen.door.skip")}</button>
      <div className="k-shop">
        <div className="k-sign k-display" aria-hidden="true"><b>Paris Panini</b><small>{theme.tagline}</small></div>
        <div className="k-awning" aria-hidden="true" />
        <div className="k-wall" aria-hidden="true">
          <div className="k-window l"><i /><i /><i /></div>
          <div className="k-window r"><i /><i /><i /></div>
          <div className="k-lamp l" /><div className="k-lamp r" />
        </div>
        <div className="k-doorway">
          <div className="k-bell" aria-hidden="true" />
          <div className="k-frame"><div className="k-inside" /></div>
          <button type="button" aria-label={t("kitchen.door.enter")} aria-expanded={open}
            className={`k-leaf ${open ? "is-open" : ""} ${drag != null ? "is-drag" : ""}`} style={angle != null ? ({ ["--k-open" as string]: `${angle}deg` } as React.CSSProperties) : undefined}
            onClick={() => { if (moved.current < 8) push(); }}
            onPointerDown={(e) => { if (open) return; start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; moved.current = 0; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { const s = start.current; if (!s || open) return; const dx = Math.abs(e.clientX - s.x); moved.current = Math.max(moved.current, dx); if (dx > 8) setDrag(dx * 0.35); }}
            onPointerUp={() => { const was = drag; start.current = null; if (was != null && was > 12) push(); else setDrag(null); }}
            onPointerCancel={() => { start.current = null; setDrag(null); }}>
            <span className="p a" aria-hidden="true" /><span className="p b" aria-hidden="true" />
            <span className="sign k-display" aria-hidden="true">OUVERT</span>
            <span className="plate k-display">{t("kitchen.door.enter")}</span>
            <span className="handle" aria-hidden="true" /><span className="kick" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="pointer-events-none absolute inset-x-0 bottom-[4.5%] text-center text-[13px] font-semibold tracking-wide text-white/80" style={{ textShadow: "0 1px 8px #000" }}>{open ? "" : t("kitchen.door.hint")}</p>
    </div>
  );
}
