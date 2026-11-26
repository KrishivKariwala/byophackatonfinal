import { PlateHero } from "@/components/Landing";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// The main screen never shows an account: middleware.ts signs everyone out whenever "/" is opened.
export default async function Home() {
  const locale = await getLocale();
  // min-height: the cream fills the whole screen (the header floats over its top 60px) whatever the language: Hindi and Kannada are shorter, which left a grey band at the bottom
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-logobg pt-[60px]">
      <PlateHero key={locale} />
    </section>
  );
}
