import { NEIGHBOURHOODS } from "./geo";
import type { DB, Outlet, Vendor } from "./types";

/**
 * TEST VERSION ONLY (see kitchenEnabled): a demo restaurant owner who runs three restaurants, each with outlets: Paris Panini (which already has its look and
 * 3D kitchen), Smash Guys and The Pizza Bakery (plain for now). One vendor account owns them all; an outlet's name is "<restaurant> · <area>", which is how the
 * outlet page groups them. The people and businesses here are fictional demo data like everything else in the seed.
 */
export const KITCHEN_OWNER_NAME = 'Abhijit "AB" Gupta (Demo vendor)';

// (the ids o_pita_* are internal and kept from when this restaurant was first added under another name, so stores that already hold them are renamed rather than duplicated)
const OUTLETS: { id: string; restaurant: string; area: string; hood: keyof typeof NEIGHBOURHOODS; address: string; dLat: number; dLng: number }[] = [
  { id: "o_paris_1", restaurant: "Paris Panini", area: "Indiranagar", hood: "Indiranagar", address: "12th Main, HAL 2nd Stage, Indiranagar, Bengaluru (demo)", dLat: 0.001, dLng: 0.002 },
  { id: "o_paris_2", restaurant: "Paris Panini", area: "Sanjay Nagar", hood: "Indiranagar", address: "4th Cross, 80 Feet Rd, RMV 2nd Stage, Bengaluru (demo)", dLat: 0.062, dLng: -0.067 },
  { id: "o_smash_1", restaurant: "Smash Guys", area: "Koramangala", hood: "Koramangala", address: "5th Block, Koramangala, Bengaluru (demo)", dLat: 0.001, dLng: 0.001 },
  { id: "o_smash_2", restaurant: "Smash Guys", area: "HSR Layout", hood: "HSR Layout", address: "27th Main, Sector 1, HSR Layout, Bengaluru (demo)", dLat: -0.001, dLng: 0.002 },
  { id: "o_pita_1", restaurant: "The Pizza Bakery", area: "Jayanagar", hood: "Jayanagar", address: "4th Block, Jayanagar, Bengaluru (demo)", dLat: 0.001, dLng: -0.001 },
  { id: "o_pita_2", restaurant: "The Pizza Bakery", area: "Whitefield", hood: "Whitefield", address: "ITPL Main Road, Whitefield, Bengaluru (demo)", dLat: -0.001, dLng: 0.001 },
];

/** Creates whatever of the demo owner, vendor account, outlets and membership is missing, and renames the owner. Safe to run again and again (a store written by an earlier version gets topped up). */
export function ensureKitchen(db: DB, T: number) {
  const iso = (ms: number) => new Date(ms).toISOString();
  const day = (n: number) => n * 86400_000;
  const owner = db.profiles.find((p) => p.id === "u_paris");
  if (owner) owner.name = KITCHEN_OWNER_NAME;
  else db.profiles.push({ id: "u_paris", name: KITCHEN_OWNER_NAME, role: "vendor", phone: "+91 90000 04001", createdAt: iso(T - day(9)), demo: true });
  let v = db.vendors.find((x) => x.id === "v_paris");
  if (!v) {
    const nv: Vendor = {
      id: "v_paris", ownerId: "u_paris", businessName: "Paris Panini (Demo)", contactName: "AB", phone: "+91 90000 04001", email: "demo-paris@example.invalid",
      fssaiNumber: "DEMO-FSSAI-20001", operatingHours: "10:00-23:00", payoutUpi: "demoparis@upi", documents: ["demo-fssai-certificate.pdf"], status: "Approved", createdAt: iso(T - day(9)),
    };
    db.vendors.push(nv); v = nv;
  }
  for (const o of OUTLETS) {
    const have = db.outlets.find((x) => x.id === o.id);
    if (have) { have.name = `${o.restaurant} · ${o.area}`; continue; } // already there: keep it, but make sure it carries the current restaurant name
    const c = NEIGHBOURHOODS[o.hood];
    const outlet: Outlet = { id: o.id, vendorId: v.id, name: `${o.restaurant} · ${o.area}`, address: o.address, neighbourhood: o.hood, lat: +(c.lat + o.dLat).toFixed(5), lng: +(c.lng + o.dLng).toFixed(5), payAtPickup: true, hours: "10:00-23:00" };
    db.outlets.push(outlet);
  }
  if (!db.memberships.some((m) => m.userId === "u_paris" && m.vendorId === v.id && m.role === "owner")) db.memberships.push({ id: "m_v_paris_owner", userId: "u_paris", vendorId: v.id, role: "owner", createdAt: iso(T - day(9)) });
}
