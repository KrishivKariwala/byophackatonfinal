"use client";
import "@fontsource/abril-fatface/400.css";
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/600.css";
import "@fontsource/josefin-sans/700.css";
import "@fontsource/anton/400.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "./kitchen.css";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ChevronRight, Plus, Store } from "lucide-react";
import { NEIGHBOURHOODS } from "@/lib/geo";
import { KITCHEN_THEMES, SEP, themeVars } from "@/lib/kitchen-themes";
import { api } from "@/components/client";
import { useT } from "@/components/I18n";

export interface OutletCard { id: string; area: string; address: string; live: number; units: number }
export interface RestaurantGroup { name: string; themeId: string | null; outlets: OutletCard[] }

type Hood = keyof typeof NEIGHBOURHOODS;
const blank = { name: "", address: "", hood: "Indiranagar" as Hood };
const clean = (s: string) => s.replace(new RegExp(SEP.trim(), "g"), " ").replace(/\s+/g, " ").trim();

/** The page a restaurant owner lands on: their name, the live orders, then each restaurant as its own box with its outlets. Only a restaurant's own box wears its look. */
export function RestaurantHub({ owner, waiting, groups, canAdd }: { owner: string; waiting: number; groups: RestaurantGroup[]; canAdd: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [adding, setAdding] = useState<string | null>(null); // which restaurant is getting an outlet ("" = a new restaurant)
  const [f, setF] = useState(blank);
  const [rname, setRname] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const open = (restaurant: string) => { setAdding(restaurant); setF(blank); setRname(""); setErr(null); };
  const save = async (e: React.FormEvent, restaurant: string) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const c = NEIGHBOURHOODS[f.hood];
      await api("/api/vendor/outlets", { name: `${restaurant}${SEP}${clean(f.name)}`, address: f.address.trim(), neighbourhood: f.hood, lat: c.lat, lng: c.lng, hours: "10:00-23:00" });
      setAdding(null); router.refresh();
    } catch (er) { setErr((er as Error).message); } finally { setBusy(false); }
  };
  const field = "mt-1 min-h-[48px] w-full rounded-xl border-2 border-line bg-white px-3 text-base text-ink";

  const form = (restaurant: string, isNew: boolean) => (
    <form onSubmit={(e) => save(e, isNew ? clean(rname) : restaurant)} className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-line bg-white p-4 text-ink">
      <h3 className="text-lg font-extrabold">{isNew ? t("kitchen.rest.add") : t("kitchen.out.add")}</h3>
      {isNew && <><p className="text-sm text-muted">{t("kitchen.rest.addHelp")}</p>
        <label className="text-sm font-bold">{t("kitchen.rest.name")}<input required maxLength={40} className={field} value={rname} onChange={(e) => setRname(e.target.value)} /></label></>}
      <label className="text-sm font-bold">{t("kitchen.out.name")}<input required maxLength={40} className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="text-sm font-bold">{t("kitchen.out.address")}<input required maxLength={120} className={field} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></label>
      <label className="text-sm font-bold">{t("kitchen.out.hood")}
        <select className={field} value={f.hood} onChange={(e) => setF({ ...f, hood: e.target.value as Hood })}>{Object.keys(NEIGHBOURHOODS).map((h) => <option key={h} value={h}>{h}</option>)}</select></label>
      {err && <p role="alert" className="text-sm font-semibold text-tomato">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setAdding(null)} className="btn-outline">{t("kitchen.out.cancel")}</button>
        <button disabled={busy || (isNew && !clean(rname))} className="btn-primary flex-1 disabled:opacity-60">{isNew ? t("kitchen.rest.save") : t("kitchen.out.save")}</button>
      </div>
    </form>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <p className="eyebrow text-burgundy">{t("kitchen.rest.owner")}</p>
        <h1 className="page-title">{owner}</h1>
      </div>

      <Link href="/v" className="btn-primary self-start !px-6 !py-4 text-base"><Activity size={20} aria-hidden="true" />{t("kitchen.board.orders")}<span className="font-semibold">· {t("kitchen.out.waiting", { n: waiting })}</span></Link>
      <hr className="border-line" />

      <div>
        <h2 className="text-2xl font-extrabold text-ink">{t("kitchen.rest.title")}</h2>
        <p className="text-sm text-muted">{t("kitchen.rest.sub")}</p>
      </div>

      <ul className="flex flex-col gap-5">
        {groups.map((g) => {
          const theme = g.themeId ? KITCHEN_THEMES[g.themeId] : null;
          const box = theme
            ? { className: "k-root rounded-[26px] border-[3px] p-5 shadow-none sm:p-6", style: { ...themeVars(theme), background: theme.hub.background, borderColor: theme.hub.border, color: theme.hub.text, boxShadow: theme.hub.shadow } as React.CSSProperties }
            : { className: "card p-5 sm:p-6", style: undefined };
          return (
            <li key={g.name}>
              <section aria-label={g.name} data-kt={theme?.id} className={box.className} style={box.style}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className={theme ? "k-display leading-tight" : "text-2xl font-extrabold text-ink"} style={theme ? { fontSize: theme.hub.titleSize } : undefined}>{g.name}</h3>
                  <p className={theme ? "text-sm font-bold" : "text-sm font-semibold text-muted"} style={theme ? { color: theme.hub.sub } : undefined}>{g.outlets.length === 1 ? t("kitchen.rest.outlets1") : t("kitchen.rest.outlets", { n: g.outlets.length })}</p>
                </div>
                <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                  {g.outlets.map((o) => {
                    const body = (
                      <>
                        <span className="flex items-center gap-3">
                          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white ${theme ? "" : "bg-tomato"}`} style={theme ? { background: "var(--k-brand)" } : undefined}><Store size={20} aria-hidden="true" /></span>
                          <span className="min-w-0"><span className={theme ? "k-display block text-[1.5rem] leading-tight" : "block text-lg font-extrabold text-ink"} style={theme ? { color: "var(--k-brand)" } : undefined}>{o.area}</span>
                            <span className={`block truncate text-xs ${theme ? "k-m70" : "text-muted"}`}>{o.address}</span></span>
                        </span>
                        <span className="text-sm font-bold" style={{ color: "#a81d1d" }}>{t("kitchen.out.stats", { live: o.live, units: o.units })}</span>
                      </>
                    );
                    return theme ? (
                      <li key={o.id} className="flex min-w-0">
                        <Link href={`/v/kitchen?outlet=${encodeURIComponent(o.id)}&door=1`} className="group flex w-full flex-col gap-3 rounded-[22px] border-2 p-4 transition hover:-translate-y-0.5" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-ink)" }}>
                          {body}
                          <span className="mt-auto inline-flex min-h-[46px] items-center justify-between rounded-2xl px-4 text-base font-extrabold text-white" style={{ background: "var(--k-brand)" }}>{t("kitchen.out.enter")}<ChevronRight size={20} aria-hidden="true" /></span>
                        </Link>
                      </li>
                    ) : (
                      <li key={o.id} className="flex min-w-0">
                        <div className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-white p-4">
                          {body}
                          <span className="mt-auto inline-flex min-h-[44px] items-center rounded-xl bg-sand px-4 text-sm font-bold text-ink">{t("kitchen.rest.soon")}</span>
                        </div>
                      </li>
                    );
                  })}
                  {canAdd && (
                    <li className="flex">
                      {adding === g.name ? <div className="w-full">{form(g.name, false)}</div> : (
                        <button type="button" onClick={() => open(g.name)} className={`flex min-h-[120px] w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-4 text-center font-extrabold transition hover:-translate-y-0.5 ${theme ? "" : "border-line text-ink"}`} style={theme ? { borderColor: theme.hub.add.border, color: theme.hub.add.text } : undefined}>
                          <Plus size={26} aria-hidden="true" /><span>{t("kitchen.out.add")}</span>
                        </button>
                      )}
                    </li>
                  )}
                </ul>
              </section>
            </li>
          );
        })}
      </ul>

      {canAdd && (adding === "" ? form("", true) : (
        <button type="button" onClick={() => open("")} className="btn-outline self-start !px-6 !py-4 text-base"><Plus size={20} aria-hidden="true" />{t("kitchen.rest.add")}</button>
      ))}
    </div>
  );
}
