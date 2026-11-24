import { notFound } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { SettingsClient } from "@/components/p2";
import { getT } from "@/lib/i18n/server";
import { getSettings, settingsAuditTrail } from "@/lib/p2/platform";
import { FLAG_LABELS, FLAG_NAMES, PRIORITY_CHOICES, SETTING_SPECS } from "@/lib/p2/settings";
import { read } from "@/lib/store";
import { tOr } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Platform settings" };

export default async function PlatformSettings() {
  await requirePage("admin");
  const s = getSettings();
  if (!s.flags.platformSettings) notFound();
  const { t } = await getT();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div><h1 className="display text-4xl text-tomato">{t("set.title").toUpperCase()}</h1><p className="text-sm text-muted">{t("set.help")}</p></div>
      <SettingsClient data={{
        specs: SETTING_SPECS.map((p) => ({ key: p.key, label: tOr(t, `set.spec.${p.key}.label`, p.label), unit: tOr(t, `set.spec.${p.key}.unit`, p.unit), min: p.min, max: p.max, step: p.step, value: Number(s[p.key]) })),
        flags: FLAG_NAMES.map((f) => ({ name: f, label: tOr(t, `set.flag.${f}`, FLAG_LABELS[f]), on: s.flags[f] })),
        priorityOptions: s.priorityOptions, priorityChoices: [...PRIORITY_CHOICES], moderationKeywords: s.moderationKeywords,
        audit: settingsAuditTrail(read()).map((a) => ({ id: a.id, key: a.key, from: a.from, to: a.to, at: a.at, admin: a.admin })),
      }} />
    </div>
  );
}
