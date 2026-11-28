import { notFound, redirect } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { getT } from "@/lib/i18n/server";
import { readDb } from "@/lib/store";
import { vendorScope } from "@/lib/p2/scope";
import { RESTAURANT_THEME, areaOf, kitchenEnabled, restaurantOf } from "@/lib/kitchen-themes";
import { RestaurantHub, type RestaurantGroup } from "@/components/kitchen/RestaurantHub";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getT(); return { title: `${t("kitchen.rest.title")} (test)` }; }

/**
 * TEST FEATURE: where a restaurant owner lands after signing in. Their name, the live orders, then each of their restaurants (several outlets each).
 * Not available on the live site.
 */
export default async function Outlets() {
  if (!kitchenEnabled()) notFound();
  const me = await requirePage("vendor");
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  if (!v || v.status !== "Approved") redirect("/v/new"); // not approved yet: the ordinary page explains why
  const db = await readDb();
  const fallback = v.businessName.replace(/\s*\(Demo\)\s*$/, "");
  const groups: RestaurantGroup[] = [];
  for (const o of scope.outlets) {
    const live = db.listings.filter((l) => l.outletId === o.id && l.status === "Live");
    const name = restaurantOf(o, fallback);
    let g = groups.find((x) => x.name === name);
    if (!g) { g = { name, themeId: RESTAURANT_THEME[name] ?? null, outlets: [] }; groups.push(g); }
    g.outlets.push({ id: o.id, area: areaOf(o), address: o.address, live: live.length, units: live.reduce((s, l) => s + l.qtyAvailable, 0) });
  }
  const mine = new Set(scope.outlets.map((o) => o.id));
  const waiting = db.reservations.filter((r) => mine.has(r.outletId) && (r.status === "Reserved" || r.status === "Ready")).length;
  const owner = me.name.replace(/\s*\((Demo[^)]*)\)\s*$/, "");
  return <RestaurantHub owner={owner} waiting={waiting} groups={groups} canAdd={scope.can("outlet.manage")} />;
}
