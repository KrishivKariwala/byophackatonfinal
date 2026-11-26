import { MapPin, Phone, Clock, KeyRound } from "lucide-react";
import { volunteerView } from "@/lib/charity";

import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.volunteer"), robots: { index: false, follow: false } };
}

export default async function Volunteer({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t, fmt } = await getT();
  const v = await volunteerView(token);
  if (v.state !== "ok") {
    const msg = v.state === "collected" ? [t("volunteer.allDone"), t("volunteer.collectedMsg")] : v.state === "expired" ? [t("volunteer.expired"), t("volunteer.expiredMsg")] : [t("volunteer.notFound"), t("volunteer.notFoundMsg")];
    return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="page-title">{msg[0].toUpperCase()}</h1><p className="mt-2 text-sm text-muted">{msg[1]}</p></div>;
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex flex-col items-center gap-2 rounded-[2rem] bg-burgundy p-6 text-center text-cream">
        <p className="eyebrow text-peach">{t("volunteer.pass", { ref: v.ref })}</p>
        <h1 className="display text-3xl">{v.qty} × {v.title.toUpperCase()}</h1>
        {v.volunteerName && <p className="text-sm text-peach">{t("volunteer.for", { name: v.volunteerName })}</p>}
        <p className="mt-2 flex items-center gap-1 text-xs text-peach"><KeyRound size={14} aria-hidden="true" />{t("volunteer.showCode")}</p>
        <p className="display text-6xl tracking-[0.3em]" aria-label={t("volunteer.codeAria", { code: v.code.split("").join(" ") })}>{v.code}</p>
      </div>
      <div className="card flex flex-col gap-3 p-4 text-sm">
        <p className="flex items-start gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-tomato" aria-hidden="true" /><span><b>{v.vendorName}</b><br />{v.address}</span></p>
        <p className="flex items-center gap-2"><Clock size={18} className="shrink-0 text-tomato" aria-hidden="true" /><span>{v.slot ? <>{t("volunteer.pickupTime")} <b>{fmt.dateTime(v.slot)}</b> · </> : null}{t("volunteer.collectBy")} <b>{fmt.time(v.collectBy)}</b></span></p>
        <p className="flex items-center gap-2"><Phone size={18} className="shrink-0 text-tomato" aria-hidden="true" /><a className="font-semibold underline" href={`tel:${v.vendorPhone.replace(/\s/g, "")}`}>{t("volunteer.call", { phone: v.vendorPhone })}</a></p>
        <a className="btn-primary" href={v.directions} target="_blank" rel="noreferrer">{t("listing.directions")}</a>
      </div>
      <p className="text-center text-[11px] text-muted">{t("volunteer.footer")}</p>
    </div>
  );
}
