import "server-only";
import type { TxContext } from "./store";
import { RULES } from "./rules";
import { distanceKm } from "./geo";
import { notifyT } from "./core";
import type { Listing, Outlet, Vendor } from "./types";

/** When a followed vendor publishes, notify followers within 10 km. A follower with no known location is still notified. */
export function notifyFollowers(tx: TxContext, l: Listing, outlet: Outlet, vendor: Vendor) {
  const told = new Set<string>(); // one alert per person even if they somehow follow twice
  for (const f of tx.db.follows.filter((x) => x.vendorId === vendor.id)) {
    if (told.has(f.customerId)) continue;
    const me = tx.db.profiles.find((p) => p.id === f.customerId);
    const lat = f.lat ?? me?.homeLat;
    const lng = f.lng ?? me?.homeLng;
    if (lat !== undefined && lng !== undefined && distanceKm({ lat, lng }, outlet) > RULES.FOLLOW_ALERT_RADIUS_KM) continue;
    told.add(f.customerId);
    notifyT(tx, f.customerId, "newListingFollowed", { vendor: vendor.businessName, title: l.title, price: l.rescuePrice }, "new_listing_followed", { listingId: l.id, vendorId: vendor.id });
  }
}
