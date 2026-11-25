import { PlateHero } from "@/components/Landing";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// The main screen never shows an account: middleware.ts signs everyone out whenever "/" is opened.
export default async function Home() {
  const locale = await getLocale();
  return (
    <section className="relative overflow-hidden bg-logobg">
      <PlateHero key={locale} />
    </section>
  );
}
