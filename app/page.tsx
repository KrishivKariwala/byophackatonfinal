import { getActor } from "@/lib/session";
import { impactSummary, sweep } from "@/lib/services";
import { HowItWorks, PlateHero, StatsBand } from "@/components/Landing";

export const dynamic = "force-dynamic";

const HOME: Record<string, string> = { customer: "/c", vendor: "/v", ngo: "/n", admin: "/admin" };

const STEPS: [string, string, string][] = [
  ["01", "Restaurants list surplus", "In under a minute, at least 30% off, with a pickup window in the next 12 hours."],
  ["02", "You reserve and collect", "Live stock, a 5-minute checkout hold or pay at pickup, and a single-use pickup pass."],
  ["03", "Leftovers go to NGOs", "At window end, unreserved food becomes one free batch for a verified NGO."],
];

export default async function Home() {
  await sweep();
  const actor = await getActor();
  const s = impactSummary();
  return (
    <>
      <section className="relative overflow-hidden bg-logobg">
        {/* soft blobs behind the plate */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 h-[560px] w-[560px] rounded-full bg-peach/50 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-cream blur-3xl" />
        <PlateHero actor={actor ? { name: actor.name, href: HOME[actor.role] } : null} />
      </section>
      <section className="bg-burgundy text-cream">
        <StatsBand
          stats={[
            { label: "meals rescued (demo data, completed handovers)", value: s.totalUnits },
            { label: "listings live right now", value: s.activeListings },
            { label: "approved vendors · NGOs", value: s.approvedVendors, pair: s.approvedNgos },
          ]}
        />
      </section>
      <HowItWorks steps={STEPS} />
    </>
  );
}
