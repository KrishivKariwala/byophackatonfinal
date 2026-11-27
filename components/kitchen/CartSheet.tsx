"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShieldCheck, X } from "lucide-react";
import type { KitchenOutlet, KitchenTheme } from "@/lib/kitchen-themes";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";
import { suggestedRescuePrice } from "@/lib/rules";
import en from "@/lib/i18n/messages/en.json";

export type CartEntry = { qty: number; allergens: string[] };
const pad = (n: number) => String(n).padStart(2, "0");
const toLocal = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const START = [10, 20, 30, 45];
const LENGTH = [60, 90, 120, 180];
const E = en as Record<string, string>;

/**
 * The cart as an ordinary, quick form in the restaurant's own look: the dishes with their quantities, when people can pick up, and Publish.
 * Price is set for you (half price, within the 30%-off rule), the food-safety declaration is added automatically, and each dish becomes a real listing.
 */
export function CartSheet({ theme, cart, outlet, outlets, serverNow, t0, onQty, onRemove, onClose, onPublished }: {
  theme: KitchenTheme; cart: Record<string, CartEntry>; outlet: KitchenOutlet; outlets: { id: string; label: string }[]; serverNow: number; t0: number;
  onQty: (id: string, n: number) => void; onRemove: (id: string) => void; onClose: () => void; onPublished: () => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const nowMs = () => serverNow + (Date.now() - t0);
  const [startMin, setStartMin] = useState(20);
  const [lenMin, setLenMin] = useState(120);
  const [exact, setExact] = useState<{ start: string; end: string } | null>(null);
  const [declOpen, setDeclOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<number | null>(null);

  const items = useMemo(() => theme.dishes.filter((d) => cart[d.id]).map((d) => ({ dish: d, ...cart[d.id], rescue: suggestedRescuePrice(d.full) })), [theme, cart]);
  const portions = items.reduce((a, i) => a + i.qty, 0);
  const sum = items.reduce((a, i) => a + i.qty * i.rescue, 0);
  const outletIndex = Math.max(0, theme.outlets.findIndex((o) => o.id === outlet.id));

  const publish = async () => {
    setBusy(true); setErrors([]);
    const start = exact ? new Date(exact.start).getTime() : nowMs() + startMin * 60_000;
    const end = exact ? new Date(exact.end).getTime() : start + lenMin * 60_000;
    const target = outlets[outletIndex] ?? outlets[0];
    const failed: string[] = []; let ok = 0;
    for (const it of items) {
      const name = E[it.dish.nameKey] ?? it.dish.id;
      try {
        await api("/api/vendor/listings", {
          title: name, description: `${E[it.dish.aboutKey] ?? ""} ${theme.brand.replace(" (Demo)", "")}, ${outlet.name}.`.trim(), category: it.dish.category, imageUrl: it.dish.photos[0].src,
          originalPrice: it.dish.full, rescuePrice: it.rescue, donationOnly: false, qty: it.qty, diet: it.dish.veg ? "Vegetarian" : "Non-vegetarian",
          allergens: it.allergens, surpriseBag: false, storageNote: "", donateRest: true,
          windowStart: new Date(start).toISOString(), windowEnd: new Date(end).toISOString(), preparedAt: new Date(nowMs() - 20 * 60_000).toISOString(),
          safetyDeclaration: true, ...(outlets.length > 1 && target ? { outletId: target.id } : {}),
        });
        ok++;
      } catch (e) { failed.push(t("kitchen.failed", { name: t(it.dish.nameKey), error: (e as Error).message })); }
    }
    setBusy(false);
    if (ok) { setDone(ok); onPublished(); router.refresh(); }
    if (failed.length) setErrors(failed);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/50 sm:items-center sm:p-4 k-pop" role="dialog" aria-modal="true" aria-label={t("kitchen.cart.title")}>
      <section className="k-rise relative flex max-h-[94svh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border-[3px] sm:rounded-[28px]" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)" }}>
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
          <div><h2 className="k-display text-[1.7rem] leading-none" style={{ color: "var(--k-brand)" }}>{done ? t("kitchen.done") : t("kitchen.cart.title")}</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-[.14em] k-m60">{theme.brand} · {outlet.name}</p></div>
          <button type="button" aria-label={t("kitchen.close")} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-black/5 hover:bg-black/10"><X size={20} aria-hidden="true" /></button>
        </header>

        {done ? (
          <div className="px-5 pb-6 pt-2">
            <p className="flex items-center gap-2 text-base font-bold" style={{ color: "#1a8f3c" }}><Check aria-hidden="true" />{t("kitchen.doneBody", { n: done })}</p>
            {errors.map((e) => <p key={e} role="alert" className="mt-2 text-sm font-semibold" style={{ color: "var(--k-accent)" }}>{e}</p>)}
            <Link href="/v" className="mt-5 flex min-h-[52px] items-center justify-center rounded-2xl text-base font-extrabold text-white" style={{ background: "var(--k-brand)" }}>{t("kitchen.dashboard")}</Link>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto px-5 pb-3">
              <ul className="divide-y divide-black/10">
                {items.map(({ dish, qty, rescue }) => (
                  <li key={dish.id} className="flex items-center gap-3 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dish.plate} alt="" className="h-14 w-14 shrink-0 rounded-full border-2 object-cover" style={{ borderColor: "var(--k-brass)" }} />
                    <div className="min-w-0 flex-1">
                      <p className="k-display truncate text-[1.05rem] leading-tight" style={{ color: "var(--k-brand)" }}>{t(dish.nameKey)}</p>
                      <p className="text-xs k-m70">{t("kitchen.rescue", { price: rescue, orig: dish.full, pct: Math.round((1 - rescue / dish.full) * 100) })}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" aria-label={t("kitchen.qty.less")} onClick={() => (qty > 1 ? onQty(dish.id, qty - 1) : onRemove(dish.id))} className="grid h-10 w-10 place-items-center rounded-full border-2" style={{ borderColor: "var(--k-brand)", color: "var(--k-brand)" }}><Minus size={16} aria-hidden="true" /></button>
                      <output className="k-display w-8 text-center text-xl tabular-nums" aria-live="polite">{qty}</output>
                      <button type="button" aria-label={t("kitchen.qty.more")} onClick={() => onQty(dish.id, Math.min(500, qty + 1))} className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: "var(--k-brand)" }}><Plus size={16} aria-hidden="true" /></button>
                    </div>
                  </li>
                ))}
              </ul>

              <fieldset className="mt-3">
                <legend className="mb-1.5 text-[11px] font-bold uppercase tracking-[.12em] k-m60">{t("kitchen.when")}</legend>
                <div className="flex flex-wrap gap-1.5">{START.map((m) => <button key={m} type="button" aria-pressed={!exact && startMin === m} onClick={() => { setExact(null); setStartMin(m); }} className="min-h-[40px] rounded-full border-2 px-3 text-sm font-bold" style={!exact && startMin === m ? { background: "var(--k-brand)", borderColor: "var(--k-brand)", color: "#fff" } : { borderColor: "rgba(0,0,0,.18)" }}>{t("kitchen.startsIn", { n: m })}</button>)}</div>
                <p className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-[.12em] k-m60">{t("kitchen.openFor")}</p>
                <div className="flex flex-wrap gap-1.5">{LENGTH.map((m) => <button key={m} type="button" aria-pressed={!exact && lenMin === m} onClick={() => { setExact(null); setLenMin(m); }} className="min-h-[40px] rounded-full border-2 px-3 text-sm font-bold" style={!exact && lenMin === m ? { background: "var(--k-brand)", borderColor: "var(--k-brand)", color: "#fff" } : { borderColor: "rgba(0,0,0,.18)" }}>{t("kitchen.hours", { n: m / 60 })}</button>)}</div>
                <details className="mt-2" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open && !exact) { const s = nowMs() + startMin * 60_000; setExact({ start: toLocal(s), end: toLocal(s + lenMin * 60_000) }); } }}>
                  <summary className="cursor-pointer text-sm font-bold underline" style={{ color: "var(--k-brand)" }}>{t("kitchen.exactTimes")}</summary>
                  {exact && <div className="mt-2 grid grid-cols-2 gap-2">
                    <input type="datetime-local" aria-label={t("vform.pickupFrom")} className="min-h-[44px] rounded-xl border-2 bg-white px-2 text-sm" value={exact.start} onChange={(e) => setExact({ ...exact, start: e.target.value })} />
                    <input type="datetime-local" aria-label={t("vform.until")} className="min-h-[44px] rounded-xl border-2 bg-white px-2 text-sm" value={exact.end} onChange={(e) => setExact({ ...exact, end: e.target.value })} />
                  </div>}
                </details>
              </fieldset>

              <div className="mt-4 rounded-2xl border-2 p-3" style={{ borderColor: "rgba(0,0,0,.12)", background: "rgba(255,255,255,.55)" }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold" style={{ color: "#1a6a3a" }}><ShieldCheck size={18} aria-hidden="true" />{t("kitchen.safety")}</p>
                  <button type="button" aria-expanded={declOpen} onClick={() => setDeclOpen(!declOpen)} className="text-sm font-bold underline" style={{ color: "var(--k-brand)" }}>{t("kitchen.safetyRead")}</button>
                </div>
                {declOpen && <p className="mt-2 text-xs leading-snug k-m80"><b>{t("vform.declaration")}</b> {t("vform.declarationBody")}</p>}
              </div>
              {errors.map((e) => <p key={e} role="alert" className="mt-2 text-sm font-semibold" style={{ color: "var(--k-accent)" }}>{e}</p>)}
            </div>
            <footer className="border-t-2 border-black/10 p-4" style={{ background: "rgba(255,255,255,.5)" }}>
              <p className="mb-2 text-center text-sm font-bold" style={{ color: "var(--k-ink)" }}>{t("kitchen.total", { qty: portions, sum })}</p>
              <button type="button" disabled={busy || items.length === 0} onClick={publish} className="min-h-[54px] w-full rounded-2xl text-base font-extrabold text-white shadow-lg transition active:scale-[.98] disabled:opacity-50" style={{ background: "var(--k-accent)" }}>{busy ? t("kitchen.publishing") : t("kitchen.publish", { n: items.length })}</button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
