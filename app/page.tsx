import { getActor } from "@/lib/session";
import { PlateHero } from "@/components/Landing";

export const dynamic = "force-dynamic";

const HOME: Record<string, string> = { customer: "/c", vendor: "/v", ngo: "/n", admin: "/admin" };

export default async function Home() {
  const actor = await getActor();
  return (
    <section className="relative overflow-hidden bg-logobg">
      {/* soft blobs behind the plate */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 h-[560px] w-[560px] rounded-full bg-peach/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-cream blur-3xl" />
      <PlateHero actor={actor ? { name: actor.name, href: HOME[actor.role] } : null} />
    </section>
  );
}
