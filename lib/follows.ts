import "server-only";
import type { TxContext } from "./store";
import { RULES } from "./rules";
import { distanceKm } from "./geo";
import { notify } from "./core";
import type { Listing, Outlet, Vendor } from "./types";

/** When a followed vendor publishes, notify followers within 10 km. A follower with no known location is still notified. */
export function notifyFollowers(tx: TxContext, l: Listing, outlet: Outlet, vendor: Vendor) {
  for (const f of tx.db.follows.filter((x) => x.vendorId === vendor.id)) {
    const me = tx.db.profiles.find((p) => p.id === f.customerId);
    const lat = f.lat ?? me?.homeLat;
    const lng = f.lng ?? me?.homeLng;
    if (lat !== undefined && lng !== undefined && distanceKm({ lat, lng }, outlet) > RULES.FOLLOW_ALERT_RADIUS_KM) continue;
    notify(tx, f.customerId, `${vendor.businessName} just listed ${l.title} (₹${l.rescuePrice}).`, "new_listing_followed", { listingId: l.id, vendorId: vendor.id });
  }
}
