import { NEIGHBOURHOODS } from "./geo";
import type { DB, Outlet, Vendor } from "./types";

/**
 * TEST VERSION ONLY (see kitchenEnabled): a demo restaurant account for Paris Panini, with its two outlets, so the 3D kitchen has a restaurant
 * whose name and outlets match its theme. The next demo restaurants (another look, another login) are added the same way.
 * The people and businesses here are fictional demo data like everything else in the seed.
 */
export function seedKitchen(db: DB, T: number) {
  const iso = (ms: number) => new Date(ms).toISOString();
  const day = (n: number) => n * 86400_000;
  const idr = NEIGHBOURHOODS.Indiranagar;
  db.profiles.push({ id: "u_paris", name: "Marc (Demo vendor)", role: "vendor", phone: "+91 90000 04001", createdAt: iso(T - day(9)), demo: true });
  const v: Vendor = {
    id: "v_paris", ownerId: "u_paris", businessName: "Paris Panini (Demo)", contactName: "Marc", phone: "+91 90000 04001", email: "demo-paris@example.invalid",
    fssaiNumber: "DEMO-FSSAI-20001", operatingHours: "10:00-23:00", payoutUpi: "demoparis@upi", documents: ["demo-fssai-certificate.pdf"], status: "Approved", createdAt: iso(T - day(9)),
  };
  db.vendors.push(v);
  const outlet = (id: string, name: string, address: string, dLat: number, dLng: number): Outlet => ({ id, vendorId: v.id, name, address, neighbourhood: "Indiranagar", lat: +(idr.lat + dLat).toFixed(5), lng: +(idr.lng + dLng).toFixed(5), payAtPickup: true, hours: "10:00-23:00" });
  db.outlets.push(outlet("o_paris_1", "Paris Panini · Indiranagar", "12th Main, HAL 2nd Stage, Indiranagar, Bengaluru (demo)", 0.001, 0.002), outlet("o_paris_2", "Paris Panini · Sanjay Nagar", "4th Cross, 80 Feet Rd, RMV 2nd Stage, Bengaluru (demo)", 0.062, -0.067));
  db.memberships.push({ id: "m_v_paris_owner", userId: "u_paris", vendorId: v.id, role: "owner", createdAt: iso(T - day(9)) });
}
