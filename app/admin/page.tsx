import { requirePage } from "@/lib/guard";
import { read } from "@/lib/store";
import { impactSummary } from "@/lib/services";
import { StatusPill, fmtTime } from "@/components/bits";
import { ApprovalActions } from "./ApprovalActions";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "City impact" };

export default async function Admin() {
  await requirePage("admin");
  const { t } = await getT();
  const s = impactSummary();
  const db = read();
  const queue = [
    ...db.vendors.filter((v) => v.status !== "Approved").map((v) => ({ kind: "vendor" as const, id: v.id, name: v.businessName, status: v.status, detail: t("admin.queueVendor", { fssai: v.fssaiNumber, docs: v.documents.join(", ") || t("admin.noDocs") }), reason: v.rejectionReason })),
    ...db.ngos.filter((n) => n.status !== "Approved").map((n) => ({ kind: "ngo" as const, id: n.id, name: n.orgName, status: n.status, detail: t("admin.queueNgo", { n: n.capacityMeals, docs: n.registrationDocs.join(", ") }), reason: n.rejectionReason })),
  ];
  const max = Math.max(1, ...s.byHood.map(([, v]) => v));
  const tiles: [string, number | string][] = [
    [t("admin.tile.customerUnits"), s.customerUnits], [t("admin.tile.ngoUnits"), s.ngoUnits], [t("admin.tile.activeListings"), s.activeListings],
    [t("admin.tile.completedPickups"), s.completedPickups], [t("admin.tile.completedCollections"), s.completedCollections], [t("admin.tile.approvedVendors"), s.approvedVendors], [t("admin.tile.approvedNgos"), s.approvedNgos],
    [t("admin.tile.kg"), s.kgRescued], [t("admin.tile.co2"), s.co2eAvoidedKg], [t("admin.tile.wasted"), s.wastedUnits],
  ];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-burgundy">{t("admin.eyebrow")}</p>
          <h1 className="display text-4xl text-tomato sm:text-6xl">{t("admin.headline")}</h1>
        </div>
        <span className="chip bg-peach text-burgundy">{t("admin.demoChip")}</span>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_2fr]" aria-label={t("admin.counters")}>
        <div className="flex flex-col justify-between rounded-3xl bg-tomato p-6 text-white">
          <p className="text-sm font-semibold">{t("admin.totalRescued")}</p>
          <p className="display text-8xl leading-none" data-testid="total-rescued">{s.totalUnits}</p>
          <p className="text-xs opacity-90">{t("admin.totalNote")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map(([k, v]) => (
            <div key={k} className="card p-4"><p className="text-xs font-semibold text-muted">{k}</p><p className="display text-4xl text-tomato">{v}</p></div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="hood-h">
          <h2 id="hood-h" className="editorial mb-3 text-2xl">{t("admin.byHood")}</h2>
          <ul className="flex flex-col gap-2">
            {s.byHood.map(([h, v]) => (
              <li key={h} className="grid grid-cols-[110px_1fr_44px] items-center gap-3 text-sm">
                <span>{h}</span>
                <span className="h-3 rounded-full bg-sand"><span className="block h-3 rounded-full bg-tomato" style={{ width: `${(v / max) * 100}%` }} /></span>
                <b className="text-right">{v}</b>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5" aria-labelledby="act-h">
          <h2 id="act-h" className="editorial mb-3 text-2xl">{t("admin.recent")}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {s.recent.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 border-b border-line/60 pb-2">
                <span>{e.source === "customer_pickup" ? t("admin.recentCustomer", { vendor: e.vendor, units: e.units }) : t("admin.recentNgo", { ngo: e.ngo ?? "NGO", vendor: e.vendor, units: e.units })}</span>
                <span className="shrink-0 text-xs text-muted">{fmtTime(e.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-5" aria-labelledby="q-h">
        <h2 id="q-h" className="editorial mb-1 text-2xl">{t("admin.applications")}</h2>
        <p className="mb-3 text-xs text-muted">{t("admin.appsHelp")}</p>
        {queue.length === 0 ? <p className="text-sm text-muted">{t("admin.queueEmpty")}</p> : (
          <ul className="flex flex-col gap-3">
            {queue.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-canvas p-3">
                <div className="min-w-[220px] flex-1">
                  <p className="font-bold">{q.name} <span className="text-xs font-semibold uppercase text-muted">· {t(`admin.kind.${q.kind}`)}</span></p>
                  <p className="text-xs text-muted">{q.detail}{q.reason ? ` · ${t("admin.rejected", { reason: q.reason })}` : ""}</p>
                </div>
                <StatusPill status={q.status} />
                <ApprovalActions kind={q.kind} id={q.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
