import { Flag } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { reportsQueue } from "@/lib/admin";
import { StatusPill } from "@/components/bits";
import { ReportActions } from "../AdminClient";
import { getT } from "@/lib/i18n/server";
import { tOr } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";

/** "dismiss: note text" -> the action in the reader's language, then the admin's own note unchanged. */
function resolutionText(t: Parameters<typeof tOr>[0], resolution?: string): string {
  if (!resolution) return "";
  const m = /^(\w+)(: [\s\S]*)?$/.exec(resolution);
  return m ? `${tOr(t, `adm.res.${m[1]}`, m[1])}${m[2] ?? ""}` : resolution;
}
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.adminReports") };
}

export default async function Reports() {
  await requirePage("admin");
  const { t, fmt } = await getT();
  const list = await reportsQueue();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div><h1 className="page-title">{t("admin.reportsTitle")}</h1><p className="text-sm text-muted">{t("admin.reportsHelp")}</p></div>
      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center"><Flag size={32} className="text-tomato" aria-hidden="true" /><h2 className="editorial text-2xl">{t("admin.noReports")}</h2><p className="text-sm text-muted">{t("admin.noReportsBody")}</p></div>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((r) => (
            <li key={r.id} className="card flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{t(`report.reason.${r.reason}`)} <span className="text-xs font-normal text-muted">· {tOr(t, `admin.target.${r.targetType}`, r.targetType)} · {t("admin.by", { reporter: r.reporter })} · {fmt.dateTime(r.createdAt)}</span></p>
                <StatusPill status={r.status} />
              </div>
              <p className="text-sm text-muted">{[r.vendorName, r.listingTitle, r.reservationRef].filter(Boolean).join(" · ")}</p>
              {r.text && <p className="rounded-xl bg-canvas p-3 text-sm">{r.text}</p>}
              {r.photoUrl && (/* eslint-disable-next-line @next/next/no-img-element */
                <a href={r.photoUrl} target="_blank" rel="noreferrer"><img src={r.photoUrl} alt={t("admin.reportPhoto")} className="max-h-56 rounded-xl border border-line object-contain" /></a>)}
              {r.status === "Open" ? <ReportActions id={r.id} can={{ canHide: r.canHide, canSuspend: r.canSuspend, canRefund: r.canRefund }} /> : <p className="text-sm font-semibold text-muted">{t("admin.resolved", { resolution: resolutionText(t, r.resolution) })}</p>}
              {r.log.length > 0 && (
                <details className="text-xs text-muted"><summary className="cursor-pointer font-semibold">{t("admin.actionLog")}</summary>
                  <ol className="mt-1 flex flex-col gap-0.5">{r.log.map((l, i) => <li key={i}>{fmt.dateTime(l.at)} · {l.who} · {tOr(t, `adm.log.${l.action}`, l.action)}{l.detail ? ` (${l.detail})` : ""}</li>)}</ol></details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
