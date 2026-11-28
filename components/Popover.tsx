"use client";
import { useEffect, useRef, useState } from "react";

/**
 * A small dropdown: closes on outside click, Escape, or when an item is chosen. Keyboard and screen-reader friendly.
 * `fixed` positions the panel against the viewport, so it is never clipped by a scrolling table or card around the button.
 */
export function Popover({ label, icon, children, align = "right", className = "", buttonClass = "", panelClass = "w-72", panelWidth = 288, fixed = false, visibleText }: {
  label: string; icon: React.ReactNode; children: (close: () => void) => React.ReactNode; align?: "left" | "right";
  className?: string; buttonClass?: string; panelClass?: string; panelWidth?: number; fixed?: boolean; visibleText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const shut = () => setOpen(false); // a fixed panel would drift away from its button, so it closes on scroll or resize
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    if (fixed) { window.addEventListener("scroll", shut, true); window.addEventListener("resize", shut); }
    return () => {
      document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", shut, true); window.removeEventListener("resize", shut);
    };
  }, [open, fixed]);
  const toggle = () => {
    if (!open && fixed && btn.current) {
      const r = btn.current.getBoundingClientRect();
      const w = Math.min(panelWidth, window.innerWidth - 16);
      const want = align === "right" ? r.right - w : r.left;
      setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(want, window.innerWidth - w - 8)) }); // always fully inside the window
    }
    setOpen(!open);
  };
  const place = fixed && pos ? { position: "fixed" as const, top: pos.top, left: pos.left } : undefined;
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button ref={btn} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={visibleText && !label.toLowerCase().includes(visibleText.toLowerCase()) ? `${visibleText}, ${label}` : label} onClick={toggle}
        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-burgundy transition hover:bg-cream ${open ? "bg-cream" : ""} ${buttonClass}`}>
        {icon}
      </button>
      {open && (
        <div role="menu" style={place} className={`${fixed ? "" : `absolute top-12 ${align === "right" ? "right-0" : "left-0"}`} z-50 ${panelClass} max-w-[calc(100vw-1.5rem)] rounded-2xl border border-line bg-white p-2 shadow-xl`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
