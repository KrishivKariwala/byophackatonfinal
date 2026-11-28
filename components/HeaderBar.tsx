"use client";
import { markStaticArrival } from "@/lib/arrival";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, ChevronDown, Clock, Globe, LayoutGrid, LogOut, UserRound } from "lucide-react";
import { api } from "./client";
import { Logo } from "./Logo";
import { useT } from "./I18n";
import { Popover } from "./Popover";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/lib/i18n/locales";

export function LanguageMenu({ current }: { current: Locale }) {
  const router = useRouter();
  const { t } = useT();
  return (
    <Popover label={t("lang.label")} visibleText={current.toUpperCase()} icon={<><Globe size={18} aria-hidden="true" /><span className="text-xs font-bold uppercase max-[479px]:hidden">{current}</span></>}>
      {(close) => (
        <ul className="flex flex-col">
          {LOCALES.map((l) => (
            <li key={l}>
              <button type="button" role="menuitemradio" aria-checked={l === current} lang={l} className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-cream"
                onClick={() => {
                  close(); // the menu disappears as soon as a language is picked
                  if (l === current) return;
                  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
                  router.refresh();
                }}>
                {LOCALE_NAMES[l]}{l === current && <Check size={16} className="text-tomato" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

export interface MenuItem { href: string; label: string; desc: string }

export function NavMenu({ items, label }: { items: MenuItem[]; label: string }) {
  const path = usePathname();
  const current = items.filter((i) => path === i.href || path.startsWith(`${i.href}/`)).sort((a, b) => b.href.length - a.href.length)[0];
  return (
    <Popover label={label} visibleText={current?.label ?? label} align="left" buttonClass="!bg-white border border-line" icon={<><LayoutGrid size={18} aria-hidden="true" /><span className="max-w-[3.6rem] truncate sm:max-w-none max-[359px]:hidden">{current?.label ?? label}</span><ChevronDown size={14} aria-hidden="true" /></>}>
      {(close) => (
        <ul className="flex flex-col">
          {items.map((i) => (
            <li key={i.href}>
              <Link href={i.href} role="menuitem" onClick={close} aria-current={current?.href === i.href ? "page" : undefined}
                className={`flex min-h-[44px] flex-col justify-center rounded-xl px-3 py-2 hover:bg-cream ${current?.href === i.href ? "bg-cream" : ""}`}>
                <span className="text-sm font-bold text-burgundy">{i.label}</span>
                <span className="text-xs text-muted">{i.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

export function AccountMenu({ name, roleLabel, isAdmin, offsetMin, serverTime }: { name: string; roleLabel: string; isAdmin: boolean; offsetMin: number; serverTime: string }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const run = async (b: unknown) => { setBusy(true); try { await api("/api/demo", b); router.refresh(); } catch (e) { alert((e as Error).message); } finally { setBusy(false); } };
  const small = "min-h-[40px] rounded-lg border border-line bg-white px-3 text-xs font-semibold text-burgundy hover:bg-sand disabled:opacity-50";
  return (
    <Popover label={t("header.account")} visibleText={name.split(" (")[0]} icon={<><UserRound size={18} aria-hidden="true" /><span className="hidden max-w-[8rem] truncate sm:inline">{name.split(" (")[0]}</span></>}>
      {(close) => (
        <div className="flex flex-col gap-1">
          <div className="px-3 py-2"><p className="text-sm font-bold text-ink">{name.split(" (")[0]}</p><p className="text-xs text-muted">{roleLabel}</p></div>
          <button type="button" role="menuitem" className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-burgundy hover:bg-cream"
            onClick={async () => { close(); await api("/api/auth/signout"); router.push("/signin"); router.refresh(); }}>
            <LogOut size={16} aria-hidden="true" />{t("header.switchRole")}
          </button>
          <div className="mt-1 border-t border-line px-3 pb-2 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted"><Clock size={12} aria-hidden="true" />{t("header.demoTools")}</p>
            <p className="mb-2 text-[11px] text-muted">{t("header.demoBanner")}</p>
            <p className="mb-2 text-xs text-muted">{t("header.serverTime", { time: serverTime })}{offsetMin !== 0 && ` (+${offsetMin} min)`}</p>
            <div className="flex flex-wrap gap-1.5">
              <button disabled={busy} className={small} onClick={() => run({ action: "clock", minutes: 15 })}>{t("header.plus15")}</button>
              <button disabled={busy} className={small} onClick={() => run({ action: "clock", minutes: 60 })}>{t("header.plus1h")}</button>
              {offsetMin !== 0 && <button disabled={busy} className={small} onClick={() => run({ action: "clock", minutes: 0 })}>{t("header.realTime")}</button>}
              {isAdmin && <button disabled={busy} className={`${small} !border-tomato !text-tomato`} onClick={() => confirm(t("header.resetConfirm")) && run({ action: "reset" })}>{t("header.resetData")}</button>}
            </div>
          </div>
        </div>
      )}
    </Popover>
  );
}

export function BellMenu({ items }: { items: { id: string; text: string; at: string; read: boolean }[] }) {
  const { t, fmt } = useT();
  const router = useRouter();
  const unread = items.filter((i) => !i.read).length;
  return (
    <Popover label={unread ? t("header.notifUnread", { n: unread }) : t("header.notif")} buttonClass="relative !px-3"
      icon={<><Bell size={18} aria-hidden="true" />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-tomato px-1 text-[10px] font-bold text-white">{unread}</span>}</>}>
      {() => (
        <div onMouseEnter={async () => { if (unread) { await api("/api/notifications"); router.refresh(); } }}>
          <p className="eyebrow px-3 py-2 text-burgundy">{t("header.notifTitle")}</p>
          {items.length === 0 ? <p className="px-3 pb-3 text-sm text-muted">{t("header.notifNone")}</p> : (
            <ul className="flex max-h-80 flex-col gap-1.5 overflow-auto px-1 pb-1">{items.map((i) => (
              <li key={i.id} className="rounded-lg bg-canvas p-2 text-xs">{i.text}<div className="mt-1 text-[10px] text-muted">{fmt.time(i.at)}</div></li>))}</ul>
          )}
        </div>
      )}
    </Popover>
  );
}

/** The bar itself. On the landing page it shrinks to a floating corner (language + account) so the hero stays clean. */
export function HeaderShell({ homeLabel, menu, menuLabel, language, bell, account, signIn }: { homeLabel: string; menu: MenuItem[]; menuLabel: string; language: React.ReactNode; bell: React.ReactNode; account: React.ReactNode; signIn: React.ReactNode }) {
  const landing = usePathname() === "/";
  if (landing) {
    return (
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div className="pointer-events-auto ml-auto flex w-fit items-center gap-1 px-3 py-2 sm:px-6">{language}{account ?? signIn}</div>
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-logobg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-6">
        <Link href="/" aria-label={homeLabel} className="shrink-0" onClick={markStaticArrival}><Logo width={64} priority /></Link>
        {menu.length > 0 && <NavMenu items={menu} label={menuLabel} />}
        <div className="ml-auto flex items-center gap-1">{language}{bell}{account ?? signIn}</div>
      </div>
    </header>
  );
}
