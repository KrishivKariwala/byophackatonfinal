"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ChevronRight, Plus, ScanLine, Store } from "lucide-react";
import { NEIGHBOURHOODS } from "@/lib/geo";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

export interface OutletCard { id: string; name: string; address: string; live: number; units: number }

/** After login: choose which outlet you are cooking in tonight (or add one). Each outlet leads to the restaurant's door and kitchen. */
export function OutletPicker({ brand, outlets, canAdd, waiting }: { brand: string; outlets: OutletCard[]; canAdd: boolean; waiting: number }) {
  const { t } = useT();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [restaurant, setRestaurant] = useState(false);
  const [f, setF] = useState({ name: "", address: "", hood: "Indiranagar" as keyof typeof NEIGHBOURHOODS });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const c = NEIGHBOURHOODS[f.hood];
      await api("/api/vendor/outlets", { name: `${brand.replace(" (Demo)", "")} · ${f.name.trim()}`, address: f.address.trim(), neighbourhood: f.hood, lat: c.lat, lng: c.lng, hours: "10:00-23:00" });
      setAdding(false); setF({ name: "", address: "", hood: "Indiranagar" }); router.refresh();
    } catch (er) { setErr((er as Error).message); } finally { setBusy(false); }
  };
  const field = "mt-1 min-h-[48px] w-full rounded-xl border-2 bg-white px-3 text-base text-[color:var(--k-ink)]";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="k-display text-[2.2rem] leading-[1.05] sm:text-5xl" style={{ color: "var(--k-cream)" }}>{t("kitchen.out.title")}</h1>
        <p className="mt-2 max-w-xl text-base" style={{ color: "color-mix(in srgb, var(--k-cream) 80%, transparent)" }}>{t("kitchen.out.sub")}</p>
      </div>

      {/* the day-to-day tools, one tap from the first page: who has ordered, and handing a pickup over */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/v/board" className="flex min-h-[84px] items-center gap-4 rounded-[22px] border-[3px] p-4 shadow-[0_14px_36px_rgba(0,0,0,.4)] transition hover:-translate-y-0.5" style={{ background: "var(--k-accent)", borderColor: "var(--k-brass)", color: "#fff" }}>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/20"><Activity size={24} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="k-display block text-[1.5rem] leading-tight">{t("kitchen.board.orders")}</span>
            <span className="block text-sm font-semibold">{t("kitchen.out.waiting", { n: waiting })} · {t("kitchen.out.ordersHelp")}</span></span>
          <ChevronRight size={22} aria-hidden="true" />
        </Link>
        <Link href="/v/handover" className="flex min-h-[84px] items-center gap-4 rounded-[22px] border-[3px] p-4 shadow-[0_14px_36px_rgba(0,0,0,.4)] transition hover:-translate-y-0.5" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-ink)" }}>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--k-brand)" }}><ScanLine size={24} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="k-display block text-[1.5rem] leading-tight" style={{ color: "var(--k-brand)" }}>{t("kitchen.board.scan")}</span>
            <span className="block text-sm font-semibold k-m70">{t("kitchen.out.scanHelp")}</span></span>
          <ChevronRight size={22} aria-hidden="true" style={{ color: "var(--k-brand)" }} />
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {outlets.map((o) => (
          <li key={o.id} className="flex">
            <Link href={`/v/kitchen?outlet=${encodeURIComponent(o.id)}&door=1`} className="group flex w-full flex-col gap-3 rounded-[26px] border-[3px] p-5 shadow-[0_18px_44px_rgba(0,0,0,.45)] transition hover:-translate-y-1" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-ink)" }}>
              <span className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: "var(--k-brand)" }}><Store size={22} aria-hidden="true" /></span>
                <span className="min-w-0"><span className="k-display block text-[1.7rem] leading-tight" style={{ color: "var(--k-brand)" }}>{o.name.replace(/^.*·\s*/, "")}</span>
                  <span className="block truncate text-xs k-m70">{o.address}</span></span></span>
              <span className="text-sm font-bold" style={{ color: "#a81d1d" }}>{t("kitchen.out.stats", { live: o.live, units: o.units })}</span>
              <span className="mt-auto inline-flex min-h-[48px] items-center justify-between rounded-2xl px-4 text-base font-extrabold text-white" style={{ background: "var(--k-brand)" }}>{t("kitchen.out.enter")}<ChevronRight size={20} aria-hidden="true" className="transition group-hover:translate-x-1" /></span>
            </Link>
          </li>
        ))}
        {canAdd && (
          <li className="flex">
            {adding ? (
              <form onSubmit={save} className="flex h-full flex-col gap-3 rounded-[26px] border-[3px] border-dashed p-5" style={{ background: "color-mix(in srgb, var(--k-cream) 94%, transparent)", borderColor: "var(--k-brass)", color: "var(--k-ink)" }}>
                <h2 className="k-display text-2xl" style={{ color: "var(--k-brand)" }}>{t("kitchen.out.add")}</h2>
                <label className="text-sm font-bold">{t("kitchen.out.name")}<input required maxLength={40} className={field} style={{ borderColor: "rgba(0,0,0,.15)" }} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
                <label className="text-sm font-bold">{t("kitchen.out.address")}<input required maxLength={120} className={field} style={{ borderColor: "rgba(0,0,0,.15)" }} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
                <label className="text-sm font-bold">{t("kitchen.out.hood")}
                  <select className={field} style={{ borderColor: "rgba(0,0,0,.15)" }} value={f.hood} onChange={(e) => setF({ ...f, hood: e.target.value as keyof typeof NEIGHBOURHOODS })}>
                    {Object.keys(NEIGHBOURHOODS).map((h) => <option key={h} value={h}>{h}</option>)}
                  </select></label>
                {err && <p role="alert" className="text-sm font-semibold" style={{ color: "#a81d1d" }}>{err}</p>}
                <div className="mt-auto flex gap-2">
                  <button type="button" onClick={() => setAdding(false)} className="min-h-[48px] rounded-2xl border-2 px-4 text-sm font-extrabold" style={{ borderColor: "rgba(0,0,0,.2)" }}>{t("kitchen.out.cancel")}</button>
                  <button disabled={busy} className="min-h-[48px] flex-1 rounded-2xl text-base font-extrabold text-white disabled:opacity-60" style={{ background: "var(--k-accent)" }}>{t("kitchen.out.save")}</button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => setAdding(true)} className="flex h-full min-h-[190px] w-full flex-col items-center justify-center gap-2 rounded-[26px] border-[3px] border-dashed p-5 text-center transition hover:-translate-y-1" style={{ borderColor: "var(--k-brass)", color: "var(--k-cream)" }}>
                <Plus size={30} aria-hidden="true" /><span className="k-display text-2xl">{t("kitchen.out.add")}</span>
              </button>
            )}
          </li>
        )}
      </ul>

      <div className="rounded-[22px] border-2 p-4" style={{ borderColor: "color-mix(in srgb, var(--k-brass) 70%, transparent)" }}>
        <button type="button" aria-expanded={restaurant} onClick={() => setRestaurant(!restaurant)} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="k-display text-xl" style={{ color: "var(--k-cream)" }}>{t("kitchen.out.addRestaurant")}</span><Plus size={22} aria-hidden="true" className={`transition ${restaurant ? "rotate-45" : ""}`} />
        </button>
        {restaurant && (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm" style={{ color: "color-mix(in srgb, var(--k-cream) 85%, transparent)" }}>{t("kitchen.out.restaurantNote")}</p>
            <Link href="/signin?role=vendor&switch=1" className="inline-flex min-h-[48px] items-center justify-center rounded-2xl px-5 text-sm font-extrabold text-white" style={{ background: "var(--k-accent)" }}>{t("kitchen.out.createAccount")}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
