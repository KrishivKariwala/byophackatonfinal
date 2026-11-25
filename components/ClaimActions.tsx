"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";
import { Popover } from "./Popover";

/**
 * The extra tools for a claimed donation, behind one "More" menu: schedule a pickup and volunteer, request a rider, release the claim.
 * The two forms are passed in as slots and only shown when chosen (or when something is already set up, so it is never hidden).
 */
export function ClaimActions({ batchId, deliveryEnabled, scheduled, deliveryActive, scheduleSlot, deliverySlot }: {
  batchId: string; deliveryEnabled: boolean; scheduled: boolean; deliveryActive: boolean; scheduleSlot: React.ReactNode; deliverySlot: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useT();
  const [showSchedule, setShowSchedule] = useState(scheduled);
  const [showDelivery, setShowDelivery] = useState(deliveryActive);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const item = "flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-cream disabled:opacity-50";

  const release = async () => {
    if (!window.confirm(t("ngo.releaseConfirm"))) return;
    setBusy(true); setErr(null);
    try { await api(`/api/ngo/batches/${batchId}`, { action: "release" }); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div><Popover fixed align="left" panelClass="w-60" panelWidth={240} label={t("ngo.moreAria")} buttonClass="border border-line !bg-white"
        icon={<><MoreHorizontal size={18} aria-hidden="true" /><span>{t("order.more")}</span></>}>
        {(close) => (
          <ul className="flex flex-col">
            <li><button type="button" role="menuitem" className={item} onClick={() => { close(); setShowSchedule(!showSchedule); }}>{t("p1.pickupVolunteer")}</button></li>
            {deliveryEnabled && <li><button type="button" role="menuitem" className={item} onClick={() => { close(); setShowDelivery(!showDelivery); }}>{t("deliv.request")}</button></li>}
            <li className="mt-1 border-t border-line pt-1"><button type="button" role="menuitem" className={`${item} text-tomato`} disabled={busy} onClick={() => { close(); release(); }}>{t("ngo.release")}</button></li>
          </ul>
        )}
      </Popover></div>
      {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
      {deliveryEnabled && showDelivery && deliverySlot}
      {showSchedule && scheduleSlot}
    </div>
  );
}
