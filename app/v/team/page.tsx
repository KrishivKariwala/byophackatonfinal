import Link from "next/link";
import { requirePage } from "@/lib/guard";
import { TeamClient } from "@/components/p2";
import { getT } from "@/lib/i18n/server";
import { teamOverview } from "@/lib/p2/team";
import { resolveOrg } from "@/lib/p2/org";
import { read } from "@/lib/store";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.team") };
}

export default async function Team() {
  const me = await requirePage("vendor");
  const { t } = await getT();
  const ctx = resolveOrg(read(), me);
  if (!ctx) return <div className="mx-auto max-w-xl px-4 py-12"><p className="text-sm">{t("org.noAccess")} <Link className="font-semibold text-tomato underline" href="/v/onboarding">{t("nav.verification")}</Link></p></div>;
  const o = teamOverview(me);
  if (!o.canManage) return <div className="mx-auto max-w-xl px-4 py-12"><h1 className="page-title">{t("nav.team")}</h1><p role="status" className="mt-2 text-sm text-muted">{t("org.noAccess")}</p></div>;
  const label = (x: { name?: string; address: string }) => x.name ?? x.address;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <p className="eyebrow text-burgundy">{o.business}</p>
        <h1 className="page-title">{t("org.team").toUpperCase()}</h1>
      </div>
      <TeamClient data={{ ...o, outlets: o.outlets.map((x) => ({ id: x.id, label: label(x) })) }} />
    </div>
  );
}
