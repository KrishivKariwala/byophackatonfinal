import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { ModerationClient } from "@/components/p2";
import { getT } from "@/lib/i18n/server";
import { moderationQueue } from "@/lib/p2/moderation";
import { isFlagOn } from "@/lib/p2/platform";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.adminModeration") };
}

export default async function Moderation() {
  await requirePage("admin");
  if (!isFlagOn("moderation")) notFound();
  const { t } = await getT();
  const items = await moderationQueue();
  const open = items.filter((i) => i.state === "open").length;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div><h1 className="page-title">{t("mod.title").toUpperCase()}</h1><p className="text-sm text-muted">{t("mod.help")} <b>{t("mod.openCount", { n: open })}</b></p></div>
      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center"><ShieldCheck size={32} className="text-tomato" aria-hidden="true" /><h2 className="editorial text-2xl">{t("mod.empty")}</h2><p className="text-sm text-muted">{t("mod.emptyHelp")}</p></div>
      ) : <ModerationClient items={items.map((i) => ({ key: i.key, targetType: i.targetType, targetId: i.targetId, title: i.title, excerpt: i.excerpt, owner: i.owner, reasons: i.reasons, openReports: i.openReports, state: i.state, canEdit: i.canEdit, history: i.history }))} />}
    </div>
  );
}
