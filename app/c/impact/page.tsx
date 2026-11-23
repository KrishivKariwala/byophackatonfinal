import Link from "next/link";
import { Award, Leaf, PiggyBank, Salad, Flame } from "lucide-react";
import { requirePage } from "@/lib/guard";
import { customerImpact } from "@/lib/p1";
import { S } from "@/lib/strings";

export const dynamic = "force-dynamic";
export const metadata = { title: "My impact" };

export default async function Impact() {
  const me = await requirePage("customer");
  const m = customerImpact(me.id);
  const Tile = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
    <div className="card flex flex-col gap-1 p-5"><span className="text-tomato" aria-hidden="true">{icon}</span><p className="display text-4xl text-tomato">{value}</p><p className="text-sm text-muted">{label}</p></div>
  );
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="display text-4xl text-tomato">{S.impact.title.toUpperCase()}</h1>
      {m.orders === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center">
          <Leaf size={32} className="text-tomato" aria-hidden="true" />
          <h2 className="editorial text-2xl">{S.impact.emptyTitle}</h2>
          <p className="text-sm text-muted">{S.impact.emptyBody}</p>
          <Link href="/c" className="btn-primary mt-2">Find food nearby</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Tile icon={<Salad size={22} />} value={String(m.meals)} label={S.impact.meals} />
            <Tile icon={<PiggyBank size={22} />} value={`₹${m.rupeesSaved}`} label={S.impact.saved} />
            <Tile icon={<Leaf size={22} />} value={String(m.kgFood)} label={S.impact.kg} />
            <Tile icon={<Leaf size={22} />} value={String(m.co2eKg)} label={S.impact.co2} />
          </div>
          <p className="text-[11px] text-muted">{S.impact.method(m.constants.kgPerMeal, m.constants.co2ePerKg)}</p>
        </>
      )}
      <section className="card flex items-center gap-3 p-4">
        <Flame size={24} className="text-tomato" aria-hidden="true" />
        <div><p className="font-bold">{S.impact.streak(m.streakWeeks)}</p><p className="text-xs text-muted">{S.impact.best(m.bestStreakWeeks)}</p></div>
      </section>
      <section aria-label={S.impact.badges}>
        <h2 className="editorial mb-2 text-2xl">{S.impact.badges}</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {m.badges.map((b) => (
            <li key={b.id} className={`card flex flex-col items-center gap-1 p-4 text-center ${b.earned ? "" : "opacity-60"}`}>
              <Award size={28} className={b.earned ? "text-tomato" : "text-muted"} aria-hidden="true" />
              <p className="text-sm font-bold">{b.label}</p>
              <p className="text-xs text-muted">{b.earned ? "Earned" : b.hint}</p>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted">{S.payAtPickup.locked(m.payAtPickup.completed, m.payAtPickup.needed)}</p>
    </div>
  );
}
