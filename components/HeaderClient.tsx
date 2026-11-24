"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useT();
  return (
    <button
      className="btn-quiet !py-2 !min-h-[36px]"
      onClick={async () => {
        await api("/api/auth/signout");
        router.push("/signin");
        router.refresh();
      }}
    >
      {t("header.switchRole")}
    </button>
  );
}

export function DemoControls({ isAdmin, offsetMin }: { isAdmin: boolean; offsetMin: number }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const run = async (b: unknown) => {
    setBusy(true);
    try { await api("/api/demo", b); router.refresh(); } catch (e) { alert((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <span className="ml-auto flex flex-wrap items-center gap-2">
      <span className="text-muted">{t("header.demoClock")}</span>
      <button disabled={busy} className="rounded-md border border-line bg-white px-2 py-1 hover:bg-sand" onClick={() => run({ action: "clock", minutes: 15 })}>{t("header.plus15")}</button>
      <button disabled={busy} className="rounded-md border border-line bg-white px-2 py-1 hover:bg-sand" onClick={() => run({ action: "clock", minutes: 60 })}>{t("header.plus1h")}</button>
      {offsetMin !== 0 && <button disabled={busy} className="rounded-md border border-line bg-white px-2 py-1 hover:bg-sand" onClick={() => run({ action: "clock", minutes: 0 })}>{t("header.realTime")}</button>}
      {isAdmin && (
        <button disabled={busy} className="rounded-md border border-tomato bg-white px-2 py-1 text-tomato hover:bg-sand" onClick={() => confirm(t("header.resetConfirm")) && run({ action: "reset" })}>
          {t("header.resetData")}
        </button>
      )}
    </span>
  );
}

export function NotificationBell({ items }: { items: { id: string; text: string; at: string; read: boolean }[] }) {
  const { t, fmt } = useT();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const unread = items.filter((i) => !i.read).length;
  return (
    <div className="relative">
      <button
        aria-label={unread ? t("header.notifUnread", { n: unread }) : t("header.notif")}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-burgundy hover:bg-cream"
        onClick={async () => {
          setOpen(!open);
          if (!open && unread) { await api("/api/notifications"); router.refresh(); }
        }}
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-tomato px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 rounded-2xl border border-line bg-white p-3 shadow-xl">
          <p className="eyebrow mb-2 text-burgundy">{t("header.notifTitle")}</p>
          {items.length === 0 ? <p className="text-sm text-muted">{t("header.notifNone")}</p> : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-auto">
              {items.map((i) => (
                <li key={i.id} className="rounded-lg bg-canvas p-2 text-xs">
                  {i.text}
                  <div className="mt-1 text-[10px] text-muted">{fmt.time(i.at)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
