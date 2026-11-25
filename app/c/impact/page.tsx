import Link from "next/link";
import { Award, Leaf, PiggyBank, Salad, Flame } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { customerImpact } from "@/lib/p1";
import { getT } from "@/lib/i18n/server";
import { tOr } from "@/components/i18n-helpers";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.impact") };
}

export default async function Impact() {
  const me = await requirePage("customer");
  const { t } = await getT();
  const m = customerImpact(me.id);
  const Tile = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
    <div className="card flex flex-col gap-1 p-5"><span className="text-tomato" aria-hidden="true">{icon}</span><p className="page-title">{value}</p><p className="text-sm text-muted">{label}</p></div>
  );
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="page-title">{t("impact.title").toUpperCase()}</h1>
      {m.orders === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center">
          <Leaf size={32} className="text-tomato" aria-hidden="true" />
          <h2 className="editorial text-2xl">{t("impact.emptyTitle")}</h2>
          <p className="text-sm text-muted">{t("impact.emptyBody")}</p>
          <Link href="/c" className="btn-primary mt-2">{t("common.findFood")}</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Tile icon={<Salad size={22} />} value={String(m.meals)} label={t("impact.meals")} />
            <Tile icon={<PiggyBank size={22} />} value={`₹${m.rupeesSaved}`} label={t("impact.saved")} />
            <Tile icon={<Leaf size={22} />} value={String(m.kgFood)} label={t("impact.kg")} />
            <Tile icon={<Leaf size={22} />} value={String(m.co2eKg)} label={t("impact.co2")} />
          </div>
          <p className="text-[11px] text-muted">{t("impact.method", { kg: m.constants.kgPerMeal, co2: m.constants.co2ePerKg })}</p>
        </>
      )}
      <section className="card flex items-center gap-3 p-4">
        <Flame size={24} className="text-tomato" aria-hidden="true" />
        <div><p className="font-bold">{m.streakWeeks ? t("impact.streak", { n: m.streakWeeks }) : t("impact.noStreak")}</p><p className="text-xs text-muted">{t("impact.best", { n: m.bestStreakWeeks })}</p></div>
      </section>
      <section aria-label={t("impact.badges")}>
        <h2 className="editorial mb-2 text-2xl">{t("impact.badges")}</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {m.badges.map((b) => (
            <li key={b.id} className={`card flex flex-col items-center gap-1 p-4 text-center ${b.earned ? "" : "opacity-60"}`}>
              <Award size={28} className={b.earned ? "text-tomato" : "text-muted"} aria-hidden="true" />
              <p className="text-sm font-bold">{tOr(t, `impact.badge.${b.id}.label`, b.label)}</p>
              <p className="text-xs text-muted">{b.earned ? t("impact.earned") : tOr(t, `impact.badge.${b.id}.hint`, b.hint)}</p>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted">{t("listing.payLocked", { need: m.payAtPickup.needed, done: m.payAtPickup.completed })}</p>
    </div>
  );
}
