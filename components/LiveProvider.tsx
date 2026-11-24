"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LiveEvent } from "@/lib/types";
import { useT } from "@/components/I18n";

type Listener = (e: LiveEvent) => void;
const Ctx = createContext<{ subscribe: (fn: Listener) => () => void; connected: boolean }>({ subscribe: () => () => {}, connected: false });

/**
 * One SSE connection per tab. Components subscribe for instant patches (e.g. stock counters);
 * the router is refreshed (debounced) so server-rendered views re-read committed state.
 */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const listeners = useRef(new Set<Listener>());
  const [connected, setConnected] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout>;
    const open = () => {
      es = new EventSource("/api/stream");
      es.onopen = () => setConnected(true);
      es.onmessage = (m) => {
        const e = JSON.parse(m.data) as LiveEvent;
        listeners.current.forEach((fn) => fn(e));
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 250);
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        retry = setTimeout(open, 2000);
      };
    };
    open();
    return () => { es?.close(); clearTimeout(retry); };
  }, [router]);

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    return () => { listeners.current.delete(fn); };
  }, []);

  return <Ctx.Provider value={{ subscribe, connected }}>{children}</Ctx.Provider>;
}

export const useLive = () => useContext(Ctx);

/** Live stock counter for one listing. Starts from server-rendered committed value. */
export function LiveCount({ listingId, initial, suffix }: { listingId: string; initial: number; suffix?: string }) {
  const { subscribe } = useLive();
  const { t } = useT();
  const [n, setN] = useState(initial);
  const [flash, setFlash] = useState(false);
  useEffect(() => setN(initial), [initial]);
  useEffect(
    () =>
      subscribe((e) => {
        if (e.type === "listing" && e.listingId === listingId) {
          setN(e.qtyAvailable);
          setFlash(true);
          setTimeout(() => setFlash(false), 800);
        }
      }),
    [listingId, subscribe],
  );
  return (
    <span data-testid={`count-${listingId}`} className={`chip transition ${n === 0 ? "bg-sand text-muted" : "bg-cream text-burgundy"} ${flash ? "ring-2 ring-tomato" : ""}`}>
      {n === 0 ? t("common.soldOut") : `${n} ${suffix ?? t("common.left")}`}
    </span>
  );
}

export function LiveDot() {
  const { connected } = useLive();
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-veg" : "bg-line"}`} />
      {connected ? t("status.Live") : t("common.connecting")}
    </span>
  );
}
