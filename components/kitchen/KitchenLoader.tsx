"use client";
import dynamic from "next/dynamic";
import type { KitchenTheme } from "@/lib/kitchen-themes";

// Three.js is large: it is fetched only on this screen, only in the browser (WebGL does not exist on the server).
const KitchenWalk = dynamic(() => import("./KitchenWalk"), {
  ssr: false,
  loading: () => <div className="grid h-[70svh] place-items-center text-sm font-semibold text-muted" role="status">Warming up the kitchen…</div>,
});

export function KitchenLoader({ theme }: { theme: KitchenTheme }) {
  return <KitchenWalk theme={theme} />;
}
