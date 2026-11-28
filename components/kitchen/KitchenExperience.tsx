"use client";
import "@fontsource/abril-fatface/400.css";
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/600.css";
import "@fontsource/josefin-sans/700.css";
import "./kitchen.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Check, ShoppingBag, Sparkles, X, Footprints } from "lucide-react";
import type { KitchenTheme } from "@/lib/kitchen-themes";
import { LanguageMenu } from "@/components/HeaderBar";
import { BackToOutlets } from "./ThemeFrame";
import { useT } from "@/components/I18n";
import { Door } from "./Door";
import { DishSheet } from "./DishSheet";
import { PhotoViewer } from "./PhotoViewer";
import { CartSheet, type CartEntry } from "./CartSheet";
import { ListMode } from "./ListMode";
import { pForDish, type WalkApi } from "./scene/constants";

// Three.js is large: it is fetched only on this screen, only in the browser (WebGL does not exist on the server).
const KitchenScene = dynamic(() => import("./scene/KitchenScene"), { ssr: false });

type Phase = "boot" | "door" | "walk" | "list";
const PREF = "sap-kitchen-anim";
const DOOR_SEEN = "sap-kitchen-door";
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode: the choice just isn't remembered */ } };
function webglOk() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } }

/** The vendor's kitchen: a door, then a scroll-driven walk past the dishes. Everything the page says is ordinary HTML (so every language works). */
export function KitchenExperience({ theme, outlets, outletId, serverNow, showDoor }: { theme: KitchenTheme; outlets: { id: string; label: string }[]; outletId: string; serverNow: number; showDoor: boolean }) {
  const { t, locale } = useT();
  const [phase, setPhase] = useState<Phase>("boot");
  const [why, setWhy] = useState<"" | "webgl">("");
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [sheet, setSheet] = useState<number | null>(null);
  const [draft, setDraft] = useState<CartEntry>({ qty: 4, allergens: [] });
  const [viewer, setViewer] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [credits, setCredits] = useState(false);
  const [moved, setMoved] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [t0] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const tags = useRef<(HTMLElement | null)[]>([]);
  const cursor = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const openedDoor = useRef(false);
  const api = useRef<WalkApi>({ progress: { current: 0 }, focus: { current: null }, look: { current: { x: 0, y: 0 } }, enter: { current: 0 }, busy: { current: false }, rest: { current: null }, shift: { current: { x: 0.17, y: 0 } } }).current;
  const outlet = outlets.find((o) => o.id === outletId) ?? outlets[0];
  const outletName = outlet.label.replace(/^.*·\s*/, "");

  // ---- first look: does this device want the animation?
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 2 || ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8) <= 1;
    const pref = read(PREF);
    // the door greets you after signing in (?door=1) and the first time in a visit; after that it is skipped
    let seen = false; try { seen = sessionStorage.getItem(DOOR_SEEN) === "1"; } catch { /* no storage: always show the door */ }
    const skipDoor = !showDoor && seen;
    const enter = () => { if (skipDoor) { openedDoor.current = true; api.enter.current = 1; setPhase("walk"); } else setPhase("door"); };
    if (!webglOk()) { setWhy("webgl"); setPhase("list"); }
    else if (pref === "on") enter();
    else if (pref === "off" || reduce || lowEnd) setPhase("list");
    else enter();
    Promise.all([document.fonts.load('48px "Abril Fatface"'), document.fonts.load('40px "Josefin Sans"')]).then(() => setFontsReady(true)).catch(() => setFontsReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fit = () => { const w = window.innerWidth; api.shift.current = w >= 820 ? { x: 0.17, y: 0 } : { x: 0, y: 0.2 }; setPortrait(w / window.innerHeight < 0.9); };
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, [api]);
  useEffect(() => { api.busy.current = viewer != null || cartOpen || credits; }, [api, viewer, cartOpen, credits]);

  // while the door is closed nothing in the kitchen can be seen: after it has been drawn once (so it is ready), stop drawing frames until the door is touched
  useEffect(() => {
    if (phase !== "door" || !ready) { if (phase !== "door") setPaused(false); return; }
    const h = setTimeout(() => setPaused(true), 2500);
    return () => clearTimeout(h);
  }, [phase, ready]);
  // the site's own header and footer sit under the kitchen: keep them out of keyboard reach, and put focus in the kitchen once we are in
  useEffect(() => {
    const main = document.querySelector("main"); const sibs = Array.from(main?.parentElement?.children ?? []).filter((e) => e !== main && /^(HEADER|FOOTER)$/.test(e.tagName));
    sibs.forEach((e) => e.setAttribute("inert", ""));
    return () => sibs.forEach((e) => e.removeAttribute("inert"));
  }, []);
  useEffect(() => { if (phase === "walk") scroller.current?.focus({ preventScroll: true }); }, [phase]);

  // ---- walking and looking
  const pending = useRef<number | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** open a dish: if it is not right here, walk to it first (smooth scroll), then turn and open the sheet */
  const focusDish = useCallback((i: number, walk: boolean) => {
    const open = () => { api.focus.current = i; api.rest.current = null; setDraft({ qty: 4, allergens: [...theme.dishes[i].allergens] }); setSheet(i); };
    const el = scroller.current;
    if (walk && el) {
      const max = Math.max(1, el.scrollHeight - el.clientHeight), want = pForDish(i);
      if (Math.abs(api.progress.current - want) > 0.03) {
        api.focus.current = null; setSheet(null); setViewer(null);
        pending.current = i;
        el.scrollTo({ top: want * max, behavior: "smooth" });
        return;
      }
    }
    open();
  }, [api, theme.dishes]);
  const closeSheet = useCallback((manual: boolean) => {
    if (manual) api.rest.current = api.progress.current;
    api.focus.current = null; setSheet(null); setViewer(null);
  }, [api]);
  useEffect(() => { if (sheet != null && cart[theme.dishes[sheet].id]) setDraft(cart[theme.dishes[sheet].id]); }, [sheet]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (credits) setCredits(false); else if (viewer != null) return; else if (cartOpen) setCartOpen(false); else if (sheet != null) closeSheet(true); };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [credits, viewer, cartOpen, sheet, closeSheet]);

  const lookStart = useRef<{ x: number; y: number; lx: number; ly: number } | null>(null);
  const lookTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDown = (e: React.PointerEvent) => { dragged.current = false; lookStart.current = { x: e.clientX, y: e.clientY, lx: api.look.current.x, ly: api.look.current.y }; if (lookTimer.current) clearTimeout(lookTimer.current); cursor.current?.classList.add("is-down"); };
  const onMove = (e: React.PointerEvent) => {
    const c = cursor.current; if (c) { c.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`; c.classList.add("is-on"); }
    const s = lookStart.current; if (!s || sheet != null) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) dragged.current = true;
    if (Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(dy) * 0.8) api.look.current = { x: Math.max(-0.75, Math.min(0.75, s.lx + (dx / window.innerWidth) * 2.6)), y: Math.max(-0.22, Math.min(0.22, s.ly + (dy / window.innerHeight) * 0.9)) };
  };
  const onUp = () => { lookStart.current = null; cursor.current?.classList.remove("is-down"); lookTimer.current = setTimeout(() => { api.look.current = { x: 0, y: 0 }; }, 2600); };

  // ---- the cart
  const setQty = useCallback((id: string, n: number) => {
    setCart((c) => { const next = { ...c }; if (n <= 0) delete next[id]; else next[id] = { qty: n, allergens: c[id]?.allergens ?? [...(theme.dishes.find((d) => d.id === id)?.allergens ?? [])] }; return next; });
  }, [theme.dishes]);
  const add = () => {
    if (sheet == null) return; const d = theme.dishes[sheet];
    setCart((c) => ({ ...c, [d.id]: draft })); setToast(t("kitchen.added")); setTimeout(() => setToast(null), 1800); closeSheet(true);
  };
  const remove = () => { if (sheet == null) return; setQty(theme.dishes[sheet].id, 0); closeSheet(true); };
  const portions = Object.values(cart).reduce((a, b) => a + b.qty, 0);
  const kinds = Object.keys(cart).length;

  const toggleAnim = () => {
    if (phase === "list") { write(PREF, "on"); setPhase(openedDoor.current ? "walk" : "door"); if (openedDoor.current) api.enter.current = 1; }
    else { write(PREF, "off"); closeSheet(false); setPhase("list"); }
  };
  const aria = useMemo(() => t("kitchen.scene.aria", { brand: theme.brand }), [t, theme.brand]);
  const sceneOn = phase === "door" || phase === "walk";

  return (
    <div ref={root} className="k-root fixed inset-0 z-[60] overflow-hidden" style={{ ["--k-brand" as string]: theme.colors.brand, ["--k-dark" as string]: theme.colors.brandDark, ["--k-accent" as string]: theme.colors.accent, ["--k-cream" as string]: theme.colors.cream, ["--k-wood" as string]: theme.colors.wood, ["--k-ink" as string]: theme.colors.ink, ["--k-brass" as string]: theme.colors.brass, background: theme.colors.ink } as React.CSSProperties}>
      {sceneOn && (
        <>
          <KitchenScene theme={theme} api={api} tags={tags} eventSource={root} fontsReady={fontsReady} portrait={portrait} paused={paused}
            onTap={(i) => { if (!dragged.current) focusDish(i, true); }} onPlate={(i) => { if (!dragged.current) setViewer(i); }}
            onAutoFocus={(i) => focusDish(i, false)} onUnfocus={() => closeSheet(false)} onHover={setHover} onReady={() => setReady(true)} />
          <div className="k-vignette pointer-events-none absolute inset-0 z-[5]" aria-hidden="true" />
          {/* the scroll track: scroll or swipe anywhere over the kitchen to walk; drag sideways to look around */}
          <div ref={scroller} role="region" tabIndex={0} aria-label={aria} className="k-scene-area absolute inset-0 z-10 overflow-y-auto"
            style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
            onScroll={(e) => { const el = e.currentTarget; api.progress.current = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight); if (!moved && el.scrollTop > 30) setMoved(true);
              if (pending.current != null) { if (settle.current) clearTimeout(settle.current); settle.current = setTimeout(() => { const i = pending.current; pending.current = null; if (i != null) focusDish(i, false); }, 220); } }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={() => cursor.current?.classList.remove("is-on")}>
            <div style={{ height: "560%" }} />
          </div>
          {/* dish name tags, moved over the dishes by the scene every frame */}
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true" style={{ opacity: phase === "door" ? 0 : 1, transition: "opacity .6s ease" }}>
            {theme.dishes.map((d, i) => (
              <div key={d.id} data-k-ui className="k-tag" ref={(el) => { tags.current[i] = el; }}>
                <button type="button" tabIndex={-1} onClick={() => focusDish(i, true)} className="flex items-center gap-2 whitespace-nowrap rounded-full border-2 py-1.5 pl-2.5 pr-3.5 shadow-[0_8px_22px_rgba(0,0,0,.45)]" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-brand)" }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.veg ? "#1a8f3c" : "#c0392b" }} />
                  <span className="k-display text-[15px] leading-none">{t(d.nameKey)}</span>
                  <span className="text-xs font-bold k-m70">₹{d.full}</span>
                  {cart[d.id] && <span className="rounded-full px-1.5 text-xs font-extrabold text-white" style={{ background: "var(--k-accent)" }}>×{cart[d.id].qty}</span>}
                </button>
              </div>
            ))}
          </div>
          {!ready && phase !== "door" && <p role="status" className="pointer-events-none absolute inset-0 z-[5] grid place-items-center text-sm font-bold text-white/80">{t("kitchen.loading")}</p>}
        </>
      )}
      {phase === "list" && (
        <>
          {why === "webgl" && <p role="status" className="absolute inset-x-3 top-20 z-30 mx-auto max-w-md rounded-xl bg-white/90 p-2 text-center text-xs font-semibold">{t("kitchen.noWebgl")}</p>}
          <ListMode theme={theme} cart={cart} onQty={setQty} onPhotos={(i) => setViewer(i)} />
        </>
      )}

      {/* top bar */}
      {phase !== "door" && phase !== "boot" && (
        <header data-k-ui className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-wrap items-center gap-1.5 p-2.5 sm:gap-2 sm:p-3">
          <BackToOutlets />
          <b className="k-display hidden px-1 text-xl sm:block" style={phase === "list" ? { color: "var(--k-brand)" } : { color: "#fff", textShadow: "0 2px 10px #000" }}>Paris Panini</b>
          <span className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full border-2 px-4 text-sm font-extrabold shadow-lg" style={{ background: "var(--k-brand)", borderColor: "var(--k-brass)", color: "#fff" }}>{outletName}</span>
          <Link href="/v" className="pointer-events-auto inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3.5 text-sm font-extrabold shadow-lg" style={{ background: "var(--k-accent)", borderColor: "var(--k-accent)", color: "#fff" }}><Activity size={16} aria-hidden="true" />{t("kitchen.board.orders")}</Link>
          <div className="pointer-events-auto ml-auto flex items-center gap-1.5">
            <div className="pointer-events-auto rounded-full border-2 px-1 shadow-lg" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)" }}><LanguageMenu current={locale} /></div>
            <button type="button" onClick={toggleAnim} className="flex min-h-[44px] items-center gap-1.5 rounded-full border-2 px-3 text-xs font-extrabold shadow-lg sm:text-sm" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)", color: "var(--k-brand)" }}>
              {phase === "list" ? <Footprints size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}<span>{phase === "list" ? t("kitchen.anim.on") : t("kitchen.anim.off")}</span>
            </button>
          </div>
        </header>
      )}

      {phase === "walk" && sheet == null && !moved && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-col items-center gap-1 px-4 text-center k-pop" style={{ textShadow: "0 2px 10px #000" }}>
          <p className="text-sm font-bold text-white sm:text-base">{t("kitchen.hint.walk")}</p>
          <p className="text-xs font-semibold text-white/75">{t("kitchen.hint.look")}</p>
        </div>
      )}

      {/* dish dots: jump to a dish */}
      {phase === "walk" && (
        <nav data-k-ui aria-label={t("kitchen.list.title")} className="absolute left-2 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2.5">
          {theme.dishes.map((d, i) => (
            <button key={d.id} type="button" aria-label={t(d.nameKey)} aria-current={sheet === i} onClick={() => focusDish(i, true)} className="group flex h-8 w-8 items-center justify-center">
              <span className="block rounded-full border-2 transition-all" style={{ width: sheet === i ? 16 : 11, height: sheet === i ? 16 : 11, borderColor: "var(--k-cream)", background: cart[d.id] ? "var(--k-accent)" : sheet === i ? "var(--k-brass)" : "transparent" }} />
              <span className="pointer-events-none absolute left-9 hidden whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold group-hover:inline-block group-focus-visible:inline-block" style={{ background: "var(--k-cream)", color: "var(--k-brand)" }}>{t(d.nameKey)}</span>
            </button>
          ))}
        </nav>
      )}

      {sheet != null && viewer == null && (
        <DishSheet dish={theme.dishes[sheet]} name={t(theme.dishes[sheet].nameKey)} about={t(theme.dishes[sheet].aboutKey)} qty={draft.qty} allergens={draft.allergens} inCart={!!cart[theme.dishes[sheet].id]}
          onQty={(n) => setDraft((d) => ({ ...d, qty: n }))} onAllergens={(a) => setDraft((d) => ({ ...d, allergens: a }))} onAdd={add} onRemove={remove} onClose={() => closeSheet(true)} onPhotos={() => setViewer(sheet)} />
      )}

      {/* cart bar */}
      {(phase === "walk" || phase === "list") && (
        <div className={`absolute inset-x-3 bottom-3 z-30 flex justify-center ${sheet != null ? "max-sm:hidden" : ""}`} style={{ pointerEvents: "none" }}>
          <div data-k-ui className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-[22px] border-2 p-2.5 pl-4 shadow-[0_14px_36px_rgba(0,0,0,.45)]" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)" }}>
            <p className="min-w-0 text-sm" aria-live="polite"><b className="k-display text-base" style={{ color: "var(--k-brand)" }}>{t("kitchen.cart")}</b>
              <span className="block truncate text-xs font-semibold k-m70">{kinds === 0 ? t("kitchen.cart.empty") : t("kitchen.cart.summary", { dishes: kinds, qty: portions })}</span></p>
            <Link href="/v" aria-label={t("kitchen.board.orders")} title={t("kitchen.board.orders")} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2" style={{ borderColor: "var(--k-brand)", color: "var(--k-brand)" }}><Activity size={20} aria-hidden="true" /></Link>
            <button type="button" disabled={kinds === 0} onClick={() => { setCartOpen(true); }} className="flex min-h-[48px] shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-4 text-sm font-extrabold text-white disabled:opacity-40" style={{ background: "var(--k-brand)" }}><ShoppingBag size={18} aria-hidden="true" />{t("kitchen.cart.open")}</button>
          </div>
        </div>
      )}
      {(phase === "walk" || phase === "list") && (
        <button type="button" data-k-ui onClick={() => setCredits(true)} className="absolute bottom-[84px] right-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white/85 hover:bg-black/55 sm:bottom-4">{t("kitchen.credits")}</button>
      )}
      {toast && <p role="status" className="k-pop absolute left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-xl" style={{ background: "#1a8f3c" }}><Check size={16} aria-hidden="true" />{toast}</p>}

      {viewer != null && <PhotoViewer dish={theme.dishes[viewer]} name={t(theme.dishes[viewer].nameKey)} onClose={() => setViewer(null)} />}
      {cartOpen && <CartSheet theme={theme} cart={cart} outlet={{ id: outlet.id, name: outletName }} serverNow={serverNow} t0={t0} onQty={setQty} onRemove={(id) => setQty(id, 0)} onClose={() => setCartOpen(false)} onPublished={() => setCart({})} />}
      {credits && (
        <div data-k-ui className="fixed inset-0 z-[85] grid place-items-center bg-black/55 p-4 k-pop" role="dialog" aria-modal="true" aria-label={t("kitchen.credits")}>
          <section className="max-h-[88svh] w-full max-w-lg overflow-auto rounded-3xl border-[3px] p-5" style={{ background: "var(--k-cream)", borderColor: "var(--k-brass)" }}>
            <div className="flex items-start justify-between gap-3"><h2 className="k-display text-2xl" style={{ color: "var(--k-brand)" }}>{t("kitchen.credits")}</h2><button type="button" aria-label={t("kitchen.close")} onClick={() => setCredits(false)} className="grid h-11 w-11 place-items-center rounded-full bg-black/5"><X size={20} aria-hidden="true" /></button></div>
            <p className="mt-1 text-sm k-m75">{t("kitchen.credits.intro")} {t("kitchen.photo.note")}</p>
            <ul className="mt-3 divide-y divide-black/10 text-sm">
              {theme.dishes.flatMap((d) => d.photos).map((p) => <li key={p.src} className="py-2"><span className="font-bold" style={{ color: "var(--k-brand)" }}>{p.title}</span><span className="block text-xs k-m70">{t("kitchen.photo.credit", { author: p.author, license: p.license })}</span></li>)}
            </ul>
          </section>
        </div>
      )}

      {phase === "door" && <Door theme={theme} onAwake={() => setPaused(false)} onOpening={() => { openedDoor.current = true; api.enter.current = 1; }} onDone={() => { try { sessionStorage.setItem(DOOR_SEEN, "1"); } catch { /* ignore */ } setPhase("walk"); }} onSkip={() => { openedDoor.current = true; api.enter.current = 1; try { sessionStorage.setItem(DOOR_SEEN, "1"); } catch { /* ignore */ } setPhase("walk"); }} />}
      {phase === "door" && <div data-k-ui className="pointer-events-none absolute left-2.5 top-2.5 z-[90] sm:left-3 sm:top-3"><BackToOutlets /></div>}

      {/* the restaurant's own cursor */}
      <div ref={cursor} className={`k-cursor ${hover != null ? "is-look" : ""}`} aria-hidden="true"><div className="ring k-display">{hover != null ? t("kitchen.look") : ""}</div></div>
    </div>
  );
}

