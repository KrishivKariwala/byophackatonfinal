import "server-only";
import { cookies } from "next/headers";
import { readDb } from "../store";
import { can, outletsFor, resolveOrg, type VendorCtx } from "./org";
import type { Outlet, Profile } from "../types";

export const OUTLET_COOKIE = "sap_outlet";

/** What a vendor-side page should show: the person's organization, role, the outlets they may see, and the outlet switcher's choice. */
export async function vendorScope(actor: Profile): Promise<{ ctx: VendorCtx | null; outlets: Outlet[]; selected: string; scopeIds: string[]; can: (p: Parameters<typeof can>[1]) => boolean }> {
  const db = await readDb();
  const ctx = resolveOrg(db, actor);
  if (!ctx) return { ctx: null, outlets: [], selected: "all", scopeIds: [], can: () => false };
  const outlets = outletsFor(db, ctx);
  const c = (await cookies()).get(OUTLET_COOKIE)?.value ?? "all";
  const selected = c !== "all" && outlets.some((o) => o.id === c) ? c : outlets.length === 1 ? outlets[0].id : "all";
  const scopeIds = selected === "all" ? outlets.map((o) => o.id) : [selected];
  return { ctx, outlets, selected, scopeIds, can: (p) => can(ctx.role, p) };
}
