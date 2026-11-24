import { ShieldCheck } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { approvalsQueue } from "@/lib/admin";
import { StatusPill, fmtDateTime } from "@/components/bits";
import { DecideButtons, DocViewer } from "../AdminClient";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Approvals" };

export default async function Approvals() {
  await requirePage("admin");
  const { t } = await getT();
  const q = approvalsQueue();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div><h1 className="display text-4xl text-tomato">{t("admin.approvalsTitle")}</h1><p className="text-sm text-muted">{t("admin.approvalsHelp")}</p></div>
      {q.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center"><ShieldCheck size={32} className="text-tomato" aria-hidden="true" /><h2 className="editorial text-2xl">{t("admin.queueEmptyTitle")}</h2><p className="text-sm text-muted">{t("admin.newApps")}</p></div>
      ) : (
        <ul className="flex flex-col gap-4">
          {q.map((a) => (
            <li key={a.key} className="card flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-bold">{a.name} <span className="text-xs font-semibold uppercase text-muted">· {t(`admin.kind.${a.kind}`)}</span></p>
                <StatusPill status={a.status} />
              </div>
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {a.fields.map(([k, v]) => (<div key={k}><dt className="inline text-xs text-muted">{k}: </dt><dd className="inline font-semibold">{v}</dd></div>))}
                <div><dt className="inline text-xs text-muted">{t("admin.submitted")} </dt><dd className="inline font-semibold">{fmtDateTime(a.submittedAt)}</dd></div>
              </dl>
              {a.reason && <p className="text-xs text-tomato">{t("admin.rejected", { reason: a.reason })}</p>}
              <DocViewer docs={a.documents} />
              {a.status === "Pending" || a.status === "Rejected" ? <DecideButtons k={a.key} /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
