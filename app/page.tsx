import Link from "next/link";
import { ArrowUpRight, HeartHandshake, MapPin, Store } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getActor } from "@/lib/session";
import { impactSummary, sweep } from "@/lib/services";

export const dynamic = "force-dynamic";

const HOME: Record<string, string> = { customer: "/c", vendor: "/v", ngo: "/n", admin: "/admin" };

const TILES = [
  {
    n: "01", title: "FIND FOOD NEAR ME", kicker: "I'm hungry", sub: "Grab discounted surplus tonight", sticker_text: "30%+ off", Icon: MapPin,
    tone: "bg-tomato text-cream shadow-[0_10px_0_#790000]", tilt: "", ring: "border-coral", blob: "bg-burgundy/40", num: "text-cream",
    badge: "bg-cream text-tomato", sticker: "bg-peach text-burgundy",
  },
  {
    n: "02", title: "LIST SURPLUS AS A VENDOR", kicker: "I have extra", sub: "List in under a minute", sticker_text: "Zero waste", Icon: Store,
    tone: "bg-cream text-tomato ring-[6px] ring-inset ring-tomato shadow-[0_10px_0_#CB0001]", tilt: "", ring: "border-peach", blob: "bg-peach/60", num: "text-tomato",
    badge: "bg-tomato text-cream", sticker: "bg-tomato text-cream",
  },
  {
    n: "03", title: "COLLECT AS AN NGO", kicker: "We feed people", sub: "Free leftovers, verified NGOs", sticker_text: "Free", Icon: HeartHandshake,
    tone: "bg-burgundy text-peach shadow-[0_10px_0_#2A0A0A]", tilt: "", ring: "border-tomato", blob: "bg-tomato/50", num: "text-peach",
    badge: "bg-peach text-burgundy", sticker: "bg-cream text-burgundy",
  },
];

export default async function Home() {
  await sweep();
  const actor = await getActor();
  const s = impactSummary();
  return (
    <>
      <section className="bg-logobg">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Logo width={180} priority />
            <p className="eyebrow text-burgundy">Bengaluru pilot · surplus food marketplace</p>
            <h1 className="display text-4xl leading-[0.95] text-tomato sm:text-5xl">TONIGHT&apos;S SURPLUS, SOMEONE&apos;S DINNER.</h1>
            <p className="text-sm font-semibold tracking-wide text-burgundy">PICK YOUR SIDE OF THE PLATE</p>
          </div>

          {actor ? (
            <Link href={HOME[actor.role]} className="btn-primary !px-10 !py-6 !text-lg">Continue as {actor.name}</Link>
          ) : (
            <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-3 sm:gap-6">
              {TILES.map((t) => (
                <Link
                  key={t.title}
                  href="/signin"
                  className={`tile group relative isolate flex aspect-square flex-col justify-between rounded-[2.25rem] p-6 ${t.tone} ${t.tilt}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-16 w-16 items-center justify-center rounded-full ${t.badge} transition-transform duration-300 group-hover:rotate-[-12deg] group-hover:scale-110`}>
                      <t.Icon size={32} strokeWidth={2.25} />
                    </span>
                  </div>

                  <div>
                    <p className="eyebrow opacity-80">{t.kicker}</p>
                    <h2 className="display mt-1 text-3xl leading-[0.95]">{t.title}</h2>
                    <p className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold opacity-90">
                      <span>{t.sub}</span>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.badge} transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1`}>
                        <ArrowUpRight size={22} strokeWidth={2.5} />
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="bg-burgundy text-cream">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div><p className="display text-5xl text-peach">{s.totalUnits}</p><p className="text-sm font-semibold">meals rescued (demo data, completed handovers)</p></div>
          <div><p className="display text-5xl text-peach">{s.activeListings}</p><p className="text-sm font-semibold">listings live right now</p></div>
          <div><p className="display text-5xl text-peach">{s.approvedVendors} · {s.approvedNgos}</p><p className="text-sm font-semibold">approved vendors · NGOs</p></div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3">
        {[
          ["01", "Restaurants list surplus", "In under a minute, at least 30% off, with a pickup window in the next 12 hours."],
          ["02", "You reserve and collect", "Live stock, a 5-minute checkout hold or pay at pickup, and a single-use pickup pass."],
          ["03", "Leftovers go to NGOs", "At window end, unreserved food becomes one free batch for a verified NGO."],
        ].map(([n, h, p]) => (
          <div key={n} className="card p-6">
            <p className="display text-3xl text-tomato">{n}</p>
            <h2 className="editorial mt-2 text-3xl">{h}</h2>
            <p className="mt-2 text-sm text-muted">{p}</p>
          </div>
        ))}
      </section>
    </>
  );
}
