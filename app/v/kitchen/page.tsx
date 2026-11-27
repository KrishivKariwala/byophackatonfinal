import { notFound, redirect } from "next/navigation";
import { requirePage } from "@/lib/guard";
import { now, readDb } from "@/lib/store";
import { vendorScope } from "@/lib/p2/scope";
import { KITCHEN_THEMES, PARIS_PANINI, kitchenEnabled } from "@/lib/kitchen-themes";
import { KitchenExperience } from "@/components/kitchen/KitchenExperience";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kitchen (test)" };

/** TEST FEATURE (design branch): a themed 3D kitchen where a vendor browses their dishes and lists tonight's surplus. Not available on the live site. */
export default async function Kitchen({ searchParams }: { searchParams: Promise<{ theme?: string; door?: string }> }) {
  if (!kitchenEnabled()) notFound();
  const me = await requirePage("vendor");
  const scope = await vendorScope(me);
  const v = scope.ctx?.vendor;
  // not approved yet, or not allowed to list: the ordinary listing page explains why
  if (!v || v.status !== "Approved" || !scope.can("listing.write")) redirect("/v/new");
  const sp = await searchParams;
  const theme = KITCHEN_THEMES[sp.theme ?? ""] ?? PARIS_PANINI;
  const db = await readDb();
  return <KitchenExperience theme={theme} outlets={scope.outlets.map((o) => ({ id: o.id, label: o.name ?? o.address }))} serverNow={now(db)} showDoor={sp.door === "1"} />;
}
