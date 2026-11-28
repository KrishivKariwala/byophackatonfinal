"use client";
import { Images, Minus, Plus, X } from "lucide-react";
import type { KitchenDish } from "@/lib/kitchen-themes";
import { useT } from "@/components/I18n";
import { tOr } from "@/components/i18n-helpers";

export const ALLERGENS = ["Gluten", "Milk", "Egg", "Nuts", "Peanuts", "Soy", "Fish", "Shellfish", "Sesame"];
export const MAX_QTY = 500;

/** The card that rises when you stop at a dish: what it is, how many portions, and the add button. */
export function DishSheet({ dish, name, about, qty, allergens, inCart, onQty, onAllergens, onAdd, onRemove, onClose, onPhotos }: {
  dish: KitchenDish; name: string; about: string; qty: number; allergens: string[]; inCart: boolean;
  onQty: (n: number) => void; onAllergens: (a: string[]) => void; onAdd: () => void; onRemove: () => void; onClose: () => void; onPhotos: () => void;
}) {
  const { t } = useT();
  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 z-30 flex justify-center sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2">
      <section data-k-ui role="dialog" aria-label={name} className="k-rise pointer-events-auto w-full max-w-[440px] rounded-[26px] border-[3px] p-3.5 shadow-[0_24px_60px_rgba(0,0,0,.55)] sm:w-[400px] sm:p-5" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em]">
              <span className="inline-flex items-center gap-1.5" style={{ color: dish.veg ? "#1a8f3c" : "#c0392b" }}>
                <span aria-hidden="true" className="grid h-3.5 w-3.5 place-items-center rounded-[3px] border-2" style={{ borderColor: "currentColor" }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} /></span>
                {dish.veg ? t("kitchen.veg") : t("kitchen.nonveg")}
              </span>
              {dish.mustTry && <span className="rounded-full px-2 py-0.5 text-white" style={{ background: "var(--k-accent)" }}>{t("kitchen.mustTry")}</span>}
            </p>
            <h2 className="k-display mt-1 text-[1.65rem] leading-[1.1] sm:text-[1.9rem]" style={{ color: "var(--k-brand)" }}>{name}</h2>
          </div>
          <button type="button" aria-label={t("kitchen.close")} onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/5 hover:bg-black/10"><X size={20} aria-hidden="true" /></button>
        </div>
        <p className="mt-1.5 text-[15px] leading-snug k-m80">{about}</p>
        <p className="mt-2 text-sm font-bold" style={{ color: "var(--k-brand)" }}>{dish.half ? `${t("kitchen.price.half", { price: dish.half })} · ` : ""}{t("kitchen.price.full", { price: dish.full })}</p>

        <button type="button" onClick={onPhotos} className="mt-2 flex w-full items-center gap-3 rounded-2xl border-2 px-2.5 py-1.5 text-left transition hover:-translate-y-0.5" style={{ borderColor: "var(--k-brand)" }}>
          <span className="flex -space-x-3" aria-hidden="true">
            {dish.photos.slice(0, 3).map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.src} src={p.src} alt="" className="h-9 w-9 rounded-full border-2 border-[color:var(--k-cream)] object-cover shadow" style={{ zIndex: 3 - i }} loading="lazy" />
            ))}
          </span>
          <span className="flex-1 text-sm font-extrabold" style={{ color: "var(--k-brand)" }}>{t("kitchen.photos", { n: dish.photos.length })}</span>
          <Images size={20} aria-hidden="true" style={{ color: "var(--k-brand)" }} />
        </button>

        <details className="mt-2 rounded-2xl border-2 px-3 py-1.5" style={{ borderColor: "rgba(0,0,0,.12)" }}>
          <summary className="cursor-pointer list-none text-[13px] font-bold k-m80">
            <span className="uppercase tracking-[.1em] k-m55">{t("kitchen.contains")}</span>
            <span className="mt-0.5 block" style={{ color: "var(--k-accent)" }}>{allergens.length ? allergens.map((a) => tOr(t, `allergen.${a}`, a)).join(" · ") : "—"}</span>
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ALLERGENS.map((a) => {
              const on = allergens.includes(a);
              return <button key={a} type="button" aria-pressed={on} onClick={() => onAllergens(on ? allergens.filter((x) => x !== a) : [...allergens, a])}
                className="min-h-[36px] rounded-full border-2 px-3 text-xs font-bold" style={on ? { background: "var(--k-accent)", borderColor: "var(--k-accent)", color: "#fff" } : { borderColor: "rgba(0,0,0,.18)", color: "var(--k-ink)" }}>{tOr(t, `allergen.${a}`, a)}</button>;
            })}
          </div>
        </details>

        <div className="mt-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[.12em] k-m60">{t("kitchen.howMany")}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" aria-label={t("kitchen.qty.less")} onClick={() => onQty(Math.max(1, qty - 1))} className="grid h-12 w-12 place-items-center rounded-full border-2" style={{ borderColor: "var(--k-brand)", color: "var(--k-brand)" }}><Minus size={20} aria-hidden="true" /></button>
              <input aria-label={t("kitchen.howMany")} inputMode="numeric" value={qty} onChange={(e) => onQty(Math.min(MAX_QTY, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} className="k-display h-12 w-16 rounded-xl border-2 bg-white text-center text-2xl tabular-nums" style={{ borderColor: "rgba(0,0,0,.15)" }} />
              <button type="button" aria-label={t("kitchen.qty.more")} onClick={() => onQty(Math.min(MAX_QTY, qty + 1))} className="grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: "var(--k-brand)" }}><Plus size={20} aria-hidden="true" /></button>
            </div>
            <div className="flex gap-1.5">{[4, 8, 12].map((q) => <button key={q} type="button" onClick={() => onQty(q)} className="h-10 min-w-[40px] rounded-full border-2 px-2 text-sm font-extrabold" style={qty === q ? { background: "var(--k-brand)", borderColor: "var(--k-brand)", color: "#fff" } : { borderColor: "rgba(0,0,0,.18)" }}>{q}</button>)}</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {inCart && <button type="button" onClick={onRemove} className="min-h-[52px] rounded-2xl border-2 px-4 text-sm font-extrabold" style={{ borderColor: "rgba(0,0,0,.2)" }}>{t("kitchen.remove")}</button>}
          <button type="button" onClick={onAdd} className="min-h-[50px] flex-1 rounded-2xl text-base font-extrabold text-white shadow-lg transition active:scale-[.98]" style={{ background: "var(--k-accent)" }}>{inCart ? t("kitchen.update") : t("kitchen.add")}</button>
        </div>
      </section>
    </div>
  );
}
