"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { api } from "./client";
import { useT } from "./I18n";
import { Popover } from "./Popover";
import { ReportButton } from "./p1";

/**
 * Everything that is not "show my pass / get directions" lives in one "More" menu on the order page:
 * cancel (only while the order is active), report a problem, and the order history.
 */
export function OrderMenu({ reservationId, active, free, refund, freeUntil, minutes, history }: {
  reservationId: string; active: boolean; free: boolean; refund: number; freeUntil: string; minutes: number; history: string[];
}) {
  const router = useRouter();
  const { t } = useT();
  const [reportKey, setReportKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const item = "flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-cream disabled:opacity-50";

  const cancel = async () => {
    if (!window.confirm(free ? (refund ? t("cancel.confirmFreeRefund", { amount: refund }) : t("cancel.confirmFreeNone")) : t("cancel.confirmLate", { minutes }))) return;
    setBusy(true); setErr(null);
    try { await api(`/api/reservations/${reservationId}/cancel`); router.refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {active && <p className="text-center text-xs text-muted">{free ? t("cancel.freeUntil", { time: freeUntil }) : t("cancel.late")}</p>}
      <Popover fixed align="left" panelClass="w-60" panelWidth={240} label={t("order.moreAria")} buttonClass="border border-line !bg-white"
        icon={<><MoreHorizontal size={18} aria-hidden="true" /><span>{t("order.more")}</span></>}>
        {(close) => (
          <ul className="flex flex-col">
            <li><button type="button" role="menuitem" className={item} onClick={() => { close(); setShowHistory(!showHistory); }}>{t("order.history")}</button></li>
            <li><button type="button" role="menuitem" className={item} onClick={() => { close(); setReportKey((k) => k + 1); }}>{t("report.button")}</button></li>
            {active && (
              <li className="mt-1 border-t border-line pt-1">
                <button type="button" role="menuitem" className={`${item} text-tomato`} disabled={busy} aria-label={free ? t("cancel.ariaFree") : t("cancel.ariaLate")} onClick={() => { close(); cancel(); }}>{busy ? t("cancel.cancelling") : t("cancel.button")}</button>
              </li>
            )}
          </ul>
        )}
      </Popover>
      {err && <p role="alert" className="text-xs font-semibold text-tomato">{err}</p>}
      {showHistory && (
        <ol className="card flex w-full flex-col gap-1 p-4 text-xs text-muted" aria-label={t("order.history")}>
          {history.length ? history.map((h, i) => <li key={i}>{h}</li>) : <li>{t("order.noHistory")}</li>}
        </ol>
      )}
      {reportKey > 0 && <div className="w-full"><ReportButton key={reportKey} targetType="reservation" targetId={reservationId} defaultOpen hideTrigger /></div>}
    </div>
  );
}
