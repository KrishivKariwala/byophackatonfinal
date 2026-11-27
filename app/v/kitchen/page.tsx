import { requirePage } from "@/lib/guard";
import { KitchenLoader } from "@/components/kitchen/KitchenLoader";
import { KITCHEN_THEMES, PARIS_PANINI } from "@/lib/kitchen-themes";

export const dynamic = "force-dynamic";
export const metadata = { title: "3D kitchen (test)" };

/** PROTOTYPE (design branch only): walk through a themed 3D kitchen and pick what to list. */
export default async function Kitchen({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  await requirePage("vendor");
  const sp = await searchParams;
  const theme = KITCHEN_THEMES[sp.theme ?? ""] ?? PARIS_PANINI;
  return <KitchenLoader theme={theme} />;
}
