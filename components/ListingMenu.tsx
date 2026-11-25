"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";
import { Popover } from "./Popover";

/** The secondary actions of one listing, tucked into a single "More" menu (the primary action stays visible next to it). */
export function ListingMenu({ listingId, title, status }: { listingId: string; title: string; status: string }) {
  const router = useRouter();
  const { t } = useT();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const open = ["Live", "Paused", "Sold Out"].includes(status);
  const item = "flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-cream disabled:opacity-50";

  const run = async (close: () => void, fn: () => Promise<string | null>) => {
    close();
    setBusy(true); setMsg(null);
    try { const text = await fn(); if (text) setMsg({ ok: true, text }); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <Popover fixed align="left" panelClass="w-56" panelWidth={224} label={t("vdash.moreFor", { title })} buttonClass="border border-line !bg-white"
        icon={<><MoreHorizontal size={18} aria-hidden="true" /><span>{t("vdash.more")}</span></>}>
        {(close) => (
          <ul className="flex flex-col">
            {(status === "Live" || status === "Sold Out") && <li><button type="button" role="menuitem" className={item} disabled={busy} onClick={() => run(close, async () => { await api(`/api/vendor/listings/${listingId}`, { action: "pause" }); return null; })}>{t("vdash.pause")}</button></li>}
            {status === "Paused" && <li><button type="button" role="menuitem" className={item} disabled={busy} onClick={() => run(close, async () => { await api(`/api/vendor/listings/${listingId}`, { action: "resume" }); return null; })}>{t("vdash.resume")}</button></li>}
            <li><Link role="menuitem" href={`/v/new?from=${listingId}`} className={item} onClick={close}>{t("vdash.duplicate")}</Link></li>
            <li><button type="button" role="menuitem" className={item} disabled={busy} onClick={() => run(close, async () => { await api("/api/vendor/templates", { listingId }); return t("common.saved"); })}>{t("vdash.saveTemplate")}</button></li>
            {open && (
              <li className="mt-1 border-t border-line pt-1">
                <button type="button" role="menuitem" className={`${item} text-tomato`} disabled={busy}
                  onClick={() => run(close, async () => {
                    const reason = window.prompt(t("vdash.cancelPrompt"));
                    if (!reason) return null;
                    const r = await api<{ refunds: number }>(`/api/vendor/listings/${listingId}`, { action: "cancel", reason });
                    return t("vdash.cancelled", { n: r.refunds });
                  })}>{t("vdash.cancelListing")}</button>
              </li>
            )}
          </ul>
        )}
      </Popover>
      {msg && <span role={msg.ok ? "status" : "alert"} className={`text-[11px] font-semibold ${msg.ok ? "text-veg" : "text-tomato"}`}>{msg.text}</span>}
    </span>
  );
}
