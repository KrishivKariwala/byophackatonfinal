"use client";
import { Minus, Plus } from "lucide-react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { useT } from "@/components/I18n";
import type { CartEntry } from "./CartSheet";

/** Animations off: the same five dishes as a quick list. Set a quantity right on the row; the cart is the same one as in the kitchen. */
export function ListMode({ theme, cart, onQty, onPhotos }: { theme: KitchenTheme; cart: Record<string, CartEntry>; onQty: (dishId: string, n: number) => void; onPhotos: (i: number) => void }) {
  const { t } = useT();
  return (
    <div className="absolute inset-0 overflow-auto px-4 pb-36 pt-[122px] sm:pt-24" style={{ background: "linear-gradient(180deg, var(--k-cream), #efe3c7)" }}>
      <div className="mx-auto max-w-xl">
        <h1 className="k-display mb-3 text-3xl" style={{ color: "var(--k-brand)" }}>{t("kitchen.list.title")}</h1>
        <ul className="flex flex-col gap-3">
          {theme.dishes.map((d, i) => {
            const q = cart[d.id]?.qty ?? 0;
            return (
              <li key={d.id} className="flex items-center gap-3 rounded-3xl border-2 bg-white/85 p-3 shadow-sm" style={{ borderColor: q ? "var(--k-brand)" : "rgba(0,0,0,.08)" }}>
                <button type="button" onClick={() => onPhotos(i)} aria-label={`${t(d.nameKey)}: ${t("kitchen.photos", { n: d.photos.length })}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.plate} alt="" className="h-[68px] w-[68px] rounded-full border-2 object-cover" style={{ borderColor: "var(--k-brass)" }} loading="lazy" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: d.veg ? "var(--k-veg)" : "var(--k-nonveg)" }}><span aria-hidden="true">●</span>{d.veg ? t("kitchen.veg") : t("kitchen.nonveg")}</p>
                  <p className="k-display text-[1.1rem] leading-tight" style={{ color: "var(--k-brand)" }}>{t(d.nameKey)}</p>
                  <p className="line-clamp-2 text-xs k-m70">{t(d.aboutKey)}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button type="button" aria-label={t("kitchen.qty.more")} onClick={() => onQty(d.id, Math.min(500, (q || 0) + (q ? 1 : 4)))} className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: "var(--k-brand)" }}><Plus size={18} aria-hidden="true" /></button>
                  <output className="k-display h-6 text-lg tabular-nums" aria-live="polite">{q || ""}</output>
                  <button type="button" aria-label={t("kitchen.qty.less")} disabled={!q} onClick={() => onQty(d.id, q - 1)} className="grid h-9 w-9 place-items-center rounded-full border-2 disabled:opacity-30" style={{ borderColor: "var(--k-brand)", color: "var(--k-brand)" }}><Minus size={16} aria-hidden="true" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
