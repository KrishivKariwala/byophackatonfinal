import { requirePage } from "@/lib/guard";
import { getT } from "@/lib/i18n/server";
import { discover } from "@/lib/services";
import { NEIGHBOURHOODS } from "@/lib/geo";
import { read } from "@/lib/store";
import { Discover } from "./Discover";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("title.discover") };
}

export default async function CustomerHome() {
  await requirePage("customer");
  const k = NEIGHBOURHOODS.Koramangala;
  const initial = discover({ lat: k.lat, lng: k.lng, radiusKm: 5 });
  const hasMapKey = Boolean(process.env.NEXT_PUBLIC_MAPS_API_KEY);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Discover initial={initial} hasMapKey={hasMapKey} totalDemoListings={read().listings.length} />
    </div>
  );
}
