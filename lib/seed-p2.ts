import type { CreditEntry, DB, DonationBatch, Listing, Profile, Referral, Reservation } from "./types";
import { NEIGHBOURHOODS } from "./geo";
import { sha256 } from "./crypto";
import { co2eFor, kgFor } from "./impact-config";
import { receiptNumber } from "./p2/receipt-number";

/**
 * P2 demo data, layered on top of the P0/P1 seed (everything here is fictional, like the rest):
 *  - 2 organizations, 3 outlets: Crumb & Co. (owner, a manager, staff at each of its 2 outlets) and v_2 (one outlet, one staff member)
 *  - 10 referrals in every state, with a matching credit ledger (earned lots, a spend, an expiry)
 *  - listings with auto-markdown steps (one already applied) and a charity priority-window listing
 *  - 5 collected donations with receipts (one charity has 80G), 3 distribution logs, 2 delivery requests
 *  - items waiting in the moderation queue, plus a hidden listing and a dismissed one with their history
 * Times are relative to `T` so the demo always has "now" things going on.
 */
export function seedP2(db: DB, T: number): void {
  const iso = (ms: number) => new Date(ms).toISOString();
  const m = (n: number) => n * 60_000;
  const h = (n: number) => n * 3600_000;
  const day = (n: number) => n * 86400_000;
  const listing = (id: string) => db.listings.find((l) => l.id === id)!;
  const person = (id: string, name: string, role: Profile["role"], phone: string) => { db.profiles.push({ id, name, role, phone, createdAt: iso(T - day(8)), demo: true }); };
  let seq = db.seq;

  // ---------------------------------------------------------------- organizations, outlets and staff
  const o1 = db.outlets.find((o) => o.id === "o_1")!;
  Object.assign(o1, { name: "Crumb & Co. · Koramangala", hours: "08:00–22:00" });
  const idr = NEIGHBOURHOODS.Indiranagar;
  db.outlets.push({ id: "o_1b", vendorId: "v_1", name: "Crumb & Co. · Indiranagar", hours: "09:00–21:00", address: "Demo address 1B, Indiranagar, Bengaluru", neighbourhood: "Indiranagar", lat: +(idr.lat + 0.002).toFixed(5), lng: +(idr.lng + 0.001).toFixed(5), payAtPickup: true });
  Object.assign(db.outlets.find((o) => o.id === "o_2")!, { name: "Masala Lane Kitchen · Main", hours: "11:00–23:00" });
  person("u_mgr1", "Mala (Demo manager)", "vendor", "+91 90000 03001");
  person("u_staff1", "Imran (Demo staff)", "vendor", "+91 90000 03002");
  person("u_staff2", "Latha (Demo staff)", "vendor", "+91 90000 03003");
  person("u_staff3", "Vikram (Demo staff)", "vendor", "+91 90000 03004");
  const mem = (id: string, userId: string, vendorId: string, role: "manager" | "staff", outletId?: string) => db.memberships.push({ id, userId, vendorId, outletId, role, createdAt: iso(T - day(6)) });
  mem("m_seed_mgr1", "u_mgr1", "v_1", "manager");
  mem("m_seed_staff1", "u_staff1", "v_1", "staff", "o_1");
  mem("m_seed_staff2", "u_staff2", "v_1", "staff", "o_1b");
  mem("m_seed_staff3", "u_staff3", "v_2", "staff", "o_2");
  db.invites.push({ id: "iv_seed_1", vendorId: "v_1", outletId: "o_1b", role: "staff", contact: "9000003999", token: sha256("seed-invite-not-a-real-link"), createdBy: "u_ravi", createdAt: iso(T - h(5)), expiresAt: iso(T + day(7) - h(5)) });

  // listings at the second outlet
  const mk = (id: string, outletId: string, title: string, op: number, rp: number, qty: number, left: number, startMin: number, durMin: number, extra: Partial<Listing> = {}): Listing => {
    const start = T + m(startMin), created = Math.min(T - m(30), start - m(45));
    const o = db.outlets.find((x) => x.id === outletId)!;
    const l: Listing = {
      id, vendorId: o.vendorId, outletId, title, description: `Freshly made today. ${title} from today's surplus.`, category: "Bakery", imageIsRepresentative: true, surpriseBag: false,
      originalPrice: op, rescuePrice: rp, qtyTotal: qty, qtyAvailable: left, diet: "Vegetarian", allergens: ["Gluten", "Milk"], preparedAt: iso(created - h(3)), safeUntil: iso(start + m(durMin) + h(4)),
      storageNote: "Store in a cool, dry place.", safetyDeclaration: { accepted: true, acceptedAt: iso(created), byUserId: "u_ravi" },
      windowStart: iso(start), windowEnd: iso(start + m(durMin)), donateRest: true, status: "Live", createdAt: iso(created), updatedAt: iso(created), ...extra,
    };
    db.listings.push(l);
    return l;
  };
  mk("l_31", "o_1b", "Indiranagar Bun Box", 300, 150, 10, 10, 25, 100);
  mk("l_32", "o_1b", "Walnut Brownie Pack", 360, 160, 8, 8, 45, 90, { category: "Desserts", allergens: ["Gluten", "Milk", "Egg", "Nuts"] });

  // ---------------------------------------------------------------- auto-markdown
  for (const l of db.listings) if (!l.donationOnly && !l.initialRescuePrice) l.initialRescuePrice = l.rescuePrice;
  const price = (op: number, pct: number) => Math.max(1, Math.floor((op * (100 - pct)) / 100));
  const l1 = listing("l_1"); // Evening Bread Box: listed at 50% off, one step already ran, one to come
  l1.initialRescuePrice = 210; l1.rescuePrice = price(l1.originalPrice, 57);
  db.priceSteps.push({ id: "ps_seed_1", listingId: "l_1", effectiveAt: iso(T - m(30)), discountPct: 57, appliedAt: iso(T - m(30)) });
  db.priceSteps.push({ id: "ps_seed_2", listingId: "l_1", effectiveAt: iso(T + m(45)), discountPct: 70 });
  for (const [k, [pct, off]] of [[55, 55], [65, 80], [75, 105]].entries()) db.priceSteps.push({ id: `ps_seed_${3 + k}`, listingId: "l_2", effectiveAt: iso(T + m(off)), discountPct: pct });
  db.priceSteps.push({ id: "ps_seed_6", listingId: "l_31", effectiveAt: iso(T + m(70)), discountPct: 65 });

  // ---------------------------------------------------------------- charity priority window
  const l4 = db.listings.find((l) => l.id === "l_7")!; // Idli-Vada Combo Box, v_4 near the demo charities
  l4.priorityMinutes = 30;
  l4.publicVisibleAt = iso(T + m(20));
  l4.windowStart = iso(T + m(15)); l4.windowEnd = iso(T + m(120));
  const ob = db.outlets.find((o) => o.id === l4.outletId)!;
  for (const n of db.ngos.filter((x) => x.status === "Approved" && Math.hypot(x.lat - ob.lat, x.lng - ob.lng) * 111 <= x.serviceAreaKm))
    db.notifications.push({ id: `nt_seed_prio_${n.id}`, userId: n.ownerId, type: "priority_listing", text: `Priority offer: ${l4.qtyTotal} × ${l4.title}, free for charities for the next 20 min. Claim it in your feed.`, at: iso(T - m(8)), read: false, payload: { listingId: l4.id } });

  // ---------------------------------------------------------------- charities: registration, 80G
  db.ngos.forEach((n, i) => { n.registrationNumber = `DEMO-REG-${2100 + i}`; });
  db.ngos.find((n) => n.id === "n_2")!.eightyG = { number: "DEMO-80G-AAATA0002B", validUntil: iso(T + day(700)).slice(0, 10) };

  // ---------------------------------------------------------------- collected donations, receipts, distribution logs, deliveries
  const impactFor = (b: DonationBatch) => db.impact.push({ id: `ie_seed_${db.impact.length + 1}`, source: "ngo_collection", refId: b.id, units: b.qty, vendorId: b.vendorId, neighbourhood: db.outlets.find((o) => o.id === b.outletId)!.neighbourhood, at: b.collectedAt!, type: "donated", listingId: b.listingId, qty: b.qty, kgEst: kgFor(b.qty), co2eKg: co2eFor(b.qty) });
  const collected: DonationBatch[] = [];
  const addCollected = (lid: string, qty: number, ngoId: string, ago: number, origin: DonationBatch["origin"], code: string) => {
    const l = listing(lid);
    const b: DonationBatch = {
      id: `d_seed_${db.donationBatches.length + 1}`, ref: `DON-${++seq}`, listingId: lid, vendorId: l.vendorId, outletId: l.outletId, qty, title: l.title, diet: l.diet, allergens: l.allergens, preparedAt: l.preparedAt,
      collectBy: iso(T - ago + h(2)), status: "Collected", claimedByNgoId: ngoId, claimedAt: iso(T - ago - m(50)), collectionCode: code, collectionCodeHash: sha256(`${l.vendorId}:don:${code}`),
      collectedAt: iso(T - ago), createdAt: iso(T - ago - h(1)), vendorInstruction: "Donate the rest at window end", origin,
    };
    db.donationBatches.push(b); impactFor(b); collected.push(b);
    return b;
  };
  collected.push(...db.donationBatches.filter((b) => b.status === "Collected")); // the P1 seed's own collected batch (d_1)
  addCollected("l_13", 5, "n_2", h(30), "window_end", "4411");
  addCollected("l_26", 4, "n_1", h(52), "window_end", "4412");
  const past = db.listings.find((l) => l.id.startsWith("lp_") && !db.donationBatches.some((b) => b.listingId === l.id))!;
  addCollected(past.id, 8, "n_2", h(76), "window_end", "4413");
  addCollected("l_6", 3, "n_2", h(100), "no_show", "4414");
  let rn = 0;
  for (const b of collected.slice(0, 5)) {
    const l = listing(b.listingId), n = db.ngos.find((x) => x.id === b.claimedByNgoId)!;
    const g = n.eightyG && Date.parse(`${n.eightyG.validUntil}T23:59:59+05:30`) >= Date.parse(b.collectedAt!) ? n.eightyG : undefined;
    db.receipts.push({ id: `dr_seed_${++rn}`, number: receiptNumber(new Date(T).getFullYear(), rn), batchId: b.id, vendorId: b.vendorId, ngoId: n.id, createdAt: b.collectedAt!, item: b.title, qty: b.qty, servings: b.qty, estimatedValue: b.qty * l.originalPrice, eightyG: g });
  }
  db.receiptSeq[new Date(T).getFullYear()] = rn;
  const dlog = (b: DonationBatch, servings: number, people: number, centre: string, notes?: string) =>
    db.distributionLogs.push({ id: `dl_seed_${db.distributionLogs.length + 1}`, batchId: b.id, ngoId: b.claimedByNgoId!, vendorId: b.vendorId, servings, beneficiaries: people, centreName: centre, notes, photoUrls: [], createdAt: iso(Date.parse(b.collectedAt!) + h(3)) });
  dlog(collected[0], collected[0].qty, 12, "Hope Shelter dining hall", "Served at dinner.");
  dlog(collected[1], 5, 5, "Annapurna community kitchen");
  dlog(collected[3], 8, 20, "Annapurna community kitchen", "Shared with two nearby shelters.");
  const claimedBatch = db.donationBatches.find((b) => b.status === "Claimed");
  if (claimedBatch) {
    db.deliveryRequests.push({ id: "dv_seed_1", batchId: claimedBatch.id, ngoId: claimedBatch.claimedByNgoId!, vendorId: claimedBatch.vendorId, provider: "mock", externalId: `mock_${T - m(3)}_ok`, status: "Rider assigned", fee: 60, pickupAddress: db.outlets.find((o) => o.id === claimedBatch.outletId)!.address, dropAddress: db.ngos.find((n) => n.id === claimedBatch.claimedByNgoId)!.address, riderName: "Manoj", createdAt: iso(T - m(3)), updatedAt: iso(T - m(1)) });
    claimedBatch.deliveryRequestId = "dv_seed_1";
  }
  db.deliveryRequests.push({ id: "dv_seed_2", batchId: collected[1].id, ngoId: collected[1].claimedByNgoId!, vendorId: collected[1].vendorId, provider: "mock", externalId: `mock_${Date.parse(collected[1].collectedAt!) - m(20)}_ok`, status: "Delivered", fee: 50, pickupAddress: db.outlets.find((o) => o.id === collected[1].outletId)!.address, dropAddress: db.ngos.find((n) => n.id === collected[1].claimedByNgoId)!.address, riderName: "Kavya", createdAt: iso(Date.parse(collected[1].collectedAt!) - m(20)), updatedAt: iso(Date.parse(collected[1].collectedAt!) + m(5)) });
  collected[1].deliveryRequestId = "dv_seed_2";

  // ---------------------------------------------------------------- referrals and credit
  for (const [i, n] of ["u_priya", "u_arjun", "u_sana", "u_kiran", "u_meghna"].entries()) {
    const name = db.profiles.find((p) => p.id === n)!.name.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4);
    db.referralCodes.push({ userId: n, code: `${name}${["7K2M", "9QXD", "4T8R", "2WJN", "6HBC"][i]}`, deviceId: `seed-device-${n}` });
  }
  const code = (u: string) => db.referralCodes.find((c) => c.userId === u)!.code;
  const refees = ["u_ref1", "u_ref2", "u_ref3", "u_ref4", "u_ref5", "u_ref6"];
  refees.forEach((id, i) => person(id, `Friend${i + 1} (Demo customer)`, "customer", `+91 90000 0400${i + 1}`));
  let ledger = 0;
  const earn = (userId: string, amount: number, at: number, note: string, refId?: string, remaining = amount): CreditEntry => {
    const e: CreditEntry = { id: `cl_seed_${++ledger}`, userId, amount, type: "earned", note, refId, createdAt: iso(at), expiresAt: iso(at + day(90)), remaining };
    db.creditLedger.push(e); return e;
  };
  const ref = (n: number, referrerId: string, refereeId: string, status: Referral["status"], extra: Partial<Referral> = {}) => {
    const phone = db.profiles.find((p) => p.id === refereeId)!.phone!.replace(/\D/g, "").slice(-10);
    const r: Referral = { id: `rf_seed_${n}`, referrerId, refereeId, code: code(referrerId), status, deviceId: `seed-device-referee-${n}`, phoneKey: phone, createdAt: iso(T - day(20 - n)), ...extra };
    db.referrals.push(r); return r;
  };
  // a real first pickup for the friends who were rewarded
  const pickedUp = (customerId: string, lid: string, ago: number) => {
    const l = listing(lid), id = `r_seed_${db.reservations.length + 1}`, at = T - ago;
    const r: Reservation = { id, ref: `SAP-${++seq}`, listingId: lid, vendorId: l.vendorId, outletId: l.outletId, customerId, qty: 1, unitPrice: l.rescuePrice, amount: l.rescuePrice, method: "online", status: "Picked up", qrToken: `seed-${id}`, code: String(2000 + db.reservations.length), qrTokenHash: sha256(`seed-${id}`), codeHash: sha256(`${l.vendorId}:${2000 + db.reservations.length}`), createdAt: iso(at - m(90)), readyAt: iso(at - m(40)), pickedUpAt: iso(at), codeUsedAt: iso(at) };
    db.reservations.push(r);
    db.payments.push({ id: `p_seed_${id}`, reservationId: id, customerId, method: "online", amount: r.amount, status: "Test Payment Successful", gateway: "demo", gatewayOrderId: `demo_order_${id}`, createdAt: r.createdAt, updatedAt: r.pickedUpAt! });
    db.impact.push({ id: `ie_seed_${db.impact.length + 1}`, source: "customer_pickup", refId: id, units: 1, vendorId: l.vendorId, neighbourhood: db.outlets.find((o) => o.id === l.outletId)!.neighbourhood, at: r.pickedUpAt!, type: "sold", qty: 1, kgEst: kgFor(1), co2eKg: co2eFor(1), listingId: lid, customerId, rupeesSaved: (l.originalPrice - r.unitPrice) });
    db.reservationEvents.push({ id: `re_seed_${db.reservationEvents.length + 1}`, reservationId: id, to: "Picked up", at: r.pickedUpAt!, note: "code" });
  };
  pickedUp("u_ref1", "l_20", h(60)); pickedUp("u_ref4", "l_20", h(80));
  const rewarded: [number, string, string, number][] = [[1, "u_priya", "u_sana", 18], [2, "u_priya", "u_kiran", 15], [3, "u_arjun", "u_meghna", 12], [4, "u_arjun", "u_dev", 10], [5, "u_sana", "u_ref1", 6]];
  for (const [n, a, b, ago] of rewarded) {
    const r = ref(n, a, b, "rewarded", { rewardedAt: iso(T - day(ago)) });
    earn(b, 50, T - day(ago), "referral welcome credit", r.id); earn(a, 50, T - day(ago), "referral reward", r.id);
  }
  ref(6, "u_priya", "u_ref2", "pending"); ref(7, "u_arjun", "u_ref3", "pending"); ref(8, "u_sana", "u_ref5", "pending"); ref(10, "u_meghna", "u_ref6", "pending");
  ref(9, "u_kiran", "u_ref4", "rejected", { rejectReason: "duplicate_device_or_phone", deviceId: "seed-device-referee-5" });
  // Priya spent ₹40 on an order (oldest lot first); Kiran's lot from 100 days ago has expired.
  const priyaLot = db.creditLedger.find((e) => e.userId === "u_priya" && e.type === "earned")!;
  priyaLot.remaining = 10;
  db.creditLedger.push({ id: `cl_seed_${++ledger}`, userId: "u_priya", amount: 40, type: "spent", refId: "r_seed_spend", note: "used on a past order", createdAt: iso(T - day(3)) });
  const old = earn("u_kiran", 50, T - day(100), "referral reward", "rf_seed_old", 0);
  db.creditLedger.push({ id: `cl_seed_${++ledger}`, userId: "u_kiran", amount: 50, type: "expired", refId: old.id, note: "expired after 90 days", createdAt: iso(Date.parse(old.expiresAt!)) });

  // ---------------------------------------------------------------- moderation
  const l11 = listing("l_11"); l11.description = "Gulab jamun tub, a little stale on the edges but still sweet.";
  const rp = (n: number, who: string, reason: "wrong_item" | "food_safety" | "other", text: string) => db.reports.push({ id: `rp_seed_${n}`, reporterId: who, targetType: "listing", targetId: "l_4", reason, text, status: "Open", createdAt: iso(T - h(4 - n)) });
  rp(1, "u_kiran", "food_safety", "Rice was cold."); rp(2, "u_meghna", "other", "Portion was smaller than shown."); // with rp_1 from the P1 seed: 3 open reports on l_4
  const target = db.reservations.find((r) => r.status === "Picked up" && !db.reviews.some((v) => v.reservationId === r.id))!;
  db.reviews.push({ id: "rv_seed_bad", reservationId: target.id, customerId: target.customerId, vendorId: target.vendorId, rating: 1, text: "Total scam, rotten food and rude staff!", createdAt: iso(T - h(6)) });
  const v = db.vendors.find((x) => x.id === target.vendorId)!;
  const rs = db.reviews.filter((x) => x.vendorId === v.id && !x.hidden);
  v.ratingCount = rs.length; v.ratingAvg = +(rs.reduce((a, x) => a + x.rating, 0) / rs.length).toFixed(2);
  // a listing an admin already hid, and one flagged earlier but dismissed
  const l10 = listing("l_10"); l10.hiddenByAdmin = true; l10.status = "Paused"; l10.moderationNote = "Photo and description did not match the food.";
  db.moderationActions.push({ id: "ma_seed_1", adminId: "u_admin", targetType: "listing", targetId: "l_10", action: "warn", reason: "Please correct the description.", createdAt: iso(T - day(2)) });
  db.moderationActions.push({ id: "ma_seed_2", adminId: "u_admin", targetType: "listing", targetId: "l_10", action: "hide", reason: "Photo and description did not match the food.", createdAt: iso(T - day(1)) });
  const l5 = listing("l_5"); l5.description = "Paneer butter masala. No fake paneer, we promise.";
  db.moderationActions.push({ id: "ma_seed_3", adminId: "u_admin", targetType: "listing", targetId: "l_5", action: "dismiss", reason: "False positive on 'fake' (the sentence denies it).", createdAt: iso(T - day(1)), contentHash: sha256([l5.title, l5.description, l5.storageNote ?? ""].join("\u0000")) });

  db.seq = seq;
}
