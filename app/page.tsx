import { PlateHero } from "@/components/Landing";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// The main screen never shows an account: middleware.ts signs everyone out whenever "/" is opened.
export default async function Home() {
  const locale = await getLocale();
  return (
    <section className="relative overflow-hidden bg-logobg">
      {/* soft blobs behind the plate */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 h-[560px] w-[560px] rounded-full bg-peach/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-cream blur-3xl" />
      <PlateHero key={locale} />
    </section>
  );
}
