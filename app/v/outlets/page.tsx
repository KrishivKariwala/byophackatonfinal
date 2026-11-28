import { notFound, redirect } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { getT } from "@/lib/i18n/server";
import { readDb } from "@/lib/store";
import { vendorScope } from "@/lib/p2/scope";
import { kitchenEnabled, themeForVendor } from "@/lib/kitchen-themes";
import { ThemeFrame } from "@/components/kitchen/ThemeFrame";
import { OutletPicker } from "@/components/kitchen/OutletPicker";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const { t } = await getT(); return { title: `${t("kitchen.out.title")} (test)` }; }

/** TEST FEATURE: after a vendor signs in, choose which outlet to cook in tonight (or add one). Not available on the live site. */
export default async function Outlets() {
  if (!kitchenEnabled()) notFound();
  const me = await requirePage("vendor");
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  if (!v || v.status !== "Approved") redirect("/v/new"); // not approved yet: the ordinary page explains why
  const db = await readDb();
  const cards = scope.outlets.map((o) => {
    const live = db.listings.filter((l) => l.outletId === o.id && l.status === "Live");
    return { id: o.id, name: o.name ?? o.address, address: o.address, live: live.length, units: live.reduce((s, l) => s + l.qtyAvailable, 0) };
  });
  const mine = new Set(scope.outlets.map((o) => o.id));
  const waiting = db.reservations.filter((r) => mine.has(r.outletId) && (r.status === "Reserved" || r.status === "Ready")).length;
  return <ThemeFrame theme={themeForVendor(v.id)}><OutletPicker brand={v.businessName} outlets={cards} canAdd={scope.can("outlet.manage")} waiting={waiting} /></ThemeFrame>;
}
