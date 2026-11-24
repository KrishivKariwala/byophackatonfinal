import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getT } from "@/lib/i18n/server";
import { verifyCertificate } from "@/lib/p2/certificate";
import { isFlagOn } from "@/lib/p2/platform";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify certificate", robots: { index: false } };

export default async function Verify({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, fmt } = await getT();
  const c = isFlagOn("impactCertificate") ? verifyCertificate(id.toUpperCase()) : null;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
      <Logo width={120} />
      {!c ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center" role="alert">
          <ShieldAlert size={36} className="text-tomato" aria-hidden="true" />
          <h1 className="editorial text-3xl">{t("cert.notFound")}</h1>
          <p className="text-sm text-muted">{t("cert.notFoundHelp")}</p>
          <p className="text-xs text-muted break-all">{id}</p>
        </div>
      ) : (
        <div className="card flex flex-col gap-4 p-6">
          <p className="chip w-fit bg-veg text-white"><BadgeCheck size={16} aria-hidden="true" />{t("cert.valid")}</p>
          <div>
            <p className="eyebrow text-burgundy">{fmt.month(c.month)}{c.partial ? ` · ${t("cert.partial")}` : ""}</p>
            <h1 className="display text-4xl text-tomato">{c.business}</h1>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              [t("cert.meals"), fmt.number(c.mealsSold + c.mealsDonated)], [t("cert.sold"), fmt.number(c.mealsSold)], [t("cert.donated"), fmt.number(c.mealsDonated)],
              [t("cert.kg"), fmt.number(c.kgRescued)], [t("cert.co2"), fmt.number(c.co2eKg)], [t("cert.revenue"), fmt.inr(c.rupeesRecovered)],
              [t("cert.charities"), fmt.number(c.charitiesServed)], [t("cert.people"), c.peopleServed ? fmt.number(c.peopleServed) : "—"],
            ].map(([k, v]) => (<div key={k} className="rounded-xl bg-cream p-3"><dt className="text-xs font-semibold text-muted">{k}</dt><dd className="display text-2xl text-tomato">{v}</dd></div>))}
          </dl>
          <p className="text-xs text-muted">{t("cert.issued", { date: fmt.date(c.issuedAt), id: c.id })}</p>
          <p className="text-[11px] text-muted">{t("cert.disclaimer")}</p>
        </div>
      )}
    </div>
  );
}
