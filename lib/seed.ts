import type {
  Category, DB, Diet, DonationBatch, ImpactEvent, Listing, ListingStatus, Ngo, Outlet, Payment,
  Profile, Report, Reservation, ReservationEvent, ReservationStatus, Review, Template, Vendor,
} from "./types";
import { co2eFor, kgFor } from "./impact-config";
import { NEIGHBOURHOODS, type Neighbourhood } from "./geo";
import { sha256 } from "./crypto";
import { seedP2 } from "./seed-p2";

/**
 * Clearly fictional Bengaluru demo data. Every business and NGO name carries "(Demo)".
 * No real ratings, FSSAI approvals, payments or payouts are represented.
 * All times are relative to `T` so the demo always has live, upcoming and past windows.
 */
export function buildSeed(T: number): DB {
  const iso = (ms: number) => new Date(ms).toISOString();
  const m = (n: number) => n * 60_000;
  const h = (n: number) => n * 3600_000;
  let seq = 4800;

  const profiles: Profile[] = [];
  const P = (id: string, name: string, role: Profile["role"], phone?: string): Profile => {
    const p: Profile = { id, name, role, phone, createdAt: iso(T - h(240)), demo: true };
    profiles.push(p);
    return p;
  };
  P("u_admin", "Meera (Demo admin)", "admin", "+91 90000 00001");
  P("u_priya", "Priya (Demo customer)", "customer", "+91 90000 00010");
  P("u_arjun", "Arjun (Demo customer)", "customer", "+91 90000 00011");
  P("u_sana", "Sana (Demo customer)", "customer", "+91 90000 00012");
  P("u_kiran", "Kiran (Demo customer)", "customer", "+91 90000 00013");
  P("u_meghna", "Meghna (Demo customer)", "customer", "+91 90000 00014");
  P("u_dev", "Dev (Demo customer)", "customer", "+91 90000 00015");

  type VSpec = [string, string, Neighbourhood, Vendor["status"], boolean];
  const vspecs: VSpec[] = [
    ["Crumb & Co. Bakery (Demo)", "Ravi", "Koramangala", "Approved", true],
    ["Masala Lane Kitchen (Demo)", "Anita", "Koramangala", "Approved", true],
    ["Dough Theory (Demo)", "Kabir", "Indiranagar", "Pending", false],
    ["The Idli Room (Demo)", "Lakshmi", "Jayanagar", "Approved", true],
    ["Biryani Junction (Demo)", "Imran", "HSR Layout", "Approved", false],
    ["Sugar Spoon Desserts (Demo)", "Neha", "Indiranagar", "Approved", true],
    ["Green Bowl Café (Demo)", "Rohan", "Whitefield", "Approved", true],
    ["Filter & Fold Café (Demo)", "Suresh", "Jayanagar", "Approved", false],
    ["Tandoor Street (Demo)", "Harpreet", "Whitefield", "Approved", true],
    ["Little Loaf Patisserie (Demo)", "Divya", "HSR Layout", "Approved", true],
    ["Coastal Curry House (Demo)", "Joel", "Indiranagar", "Approved", true],
    ["Corner Chaat Co. (Demo)", "Vikram", "Koramangala", "Rejected", true],
  ];
  const vendors: Vendor[] = [];
  const outlets: Outlet[] = [];
  vspecs.forEach(([name, contact, hood, status, payAtPickup], i) => {
    const n = i + 1;
    const ownerId = n === 1 ? "u_ravi" : `u_vendor${n}`;
    P(ownerId, `${contact} (Demo vendor)`, "vendor", `+91 90000 01${String(n).padStart(3, "0")}`);
    const vid = `v_${n}`;
    vendors.push({
      id: vid, ownerId, businessName: name, contactName: contact,
      phone: `+91 90000 01${String(n).padStart(3, "0")}`, email: `demo-vendor${n}@example.invalid`,
      fssaiNumber: `DEMO-FSSAI-${10000 + n}`, operatingHours: "08:00–22:00", payoutUpi: `demo${n}@upi`,
      documents: ["demo-fssai-certificate.pdf"], status,
      rejectionReason: status === "Rejected" ? "Demo: FSSAI document unreadable" : undefined,
      createdAt: iso(T - h(200 - n)),
    });
    const c = NEIGHBOURHOODS[hood];
    const j = ((n * 37) % 11) / 1000 - 0.005;
    outlets.push({
      id: `o_${n}`, vendorId: vid, address: `Demo address ${n}, ${hood}, Bengaluru`, neighbourhood: hood,
      lat: +(c.lat + j).toFixed(5), lng: +(c.lng - j * 0.8).toFixed(5), payAtPickup,
    });
  });

  const ngoSpecs: [string, string, Neighbourhood, Ngo["status"], number][] = [
    ["Hope Shelter Trust (Demo)", "Joseph", "Koramangala", "Approved", 80],
    ["Annapurna Community Kitchen (Demo)", "Fatima", "Jayanagar", "Approved", 150],
    ["Little Hands Home (Demo)", "George", "Whitefield", "Approved", 40],
    ["New Dawn Foundation (Demo)", "Asha", "Indiranagar", "Pending", 60],
  ];
  const ngos: Ngo[] = ngoSpecs.map(([org, person, hood, status, cap], i) => {
    const n = i + 1;
    const ownerId = n === 1 ? "u_joseph" : `u_ngo${n}`;
    P(ownerId, `${person} (Demo NGO)`, "ngo", `+91 90000 02${String(n).padStart(3, "0")}`);
    const c = NEIGHBOURHOODS[hood];
    return {
      id: `n_${n}`, ownerId, orgName: org, contactPerson: person, phone: `+91 90000 02${String(n).padStart(3, "0")}`,
      email: `demo-ngo${n}@example.invalid`, registrationDocs: ["demo-registration.pdf"],
      address: `Demo address, ${hood}, Bengaluru`, neighbourhood: hood, lat: c.lat + 0.004, lng: c.lng - 0.003,
      serviceAreaKm: 8, capacityMeals: cap, handlingArrangements: "Insulated carriers, two-wheeler and van (demo)",
      fssaiInfo: "Demo registration — not a real regulatory approval", status, createdAt: iso(T - h(150 - n)),
    };
  });

  // [vendorIdx, title, category, diet, original, rescue, qtyTotal, qtyAvail, startOffsetMin, durationMin, status, donateRest, allergens, surprise]
  type LSpec = [number, string, Category, Diet, number, number, number, number, number, number, ListingStatus, boolean, string[], boolean];
  const lspecs: LSpec[] = [
    [1, "Evening Bread Box", "Bakery", "Vegetarian", 420, 180, 10, 3, -20, 110, "Live", true, ["Gluten", "Milk"], true],
    [1, "Croissant Bag (4 pcs)", "Bakery", "Vegetarian", 360, 199, 8, 5, 40, 90, "Live", true, ["Gluten", "Milk", "Egg"], false],
    [1, "Garlic Loaf", "Bakery", "Vegetarian", 180, 90, 6, 0, -40, 120, "Sold Out", false, ["Gluten", "Milk"], false],
    [2, "Chicken Biryani Tray", "Meals", "Non-vegetarian", 320, 160, 12, 6, 30, 90, "Live", true, [], false],
    [2, "Paneer Butter Masala + 2 Rotis", "Meals", "Vegetarian", 300, 150, 10, 10, 60, 90, "Live", true, ["Milk", "Gluten"], false],
    [2, "Veg Thali", "Meals", "Vegetarian", 250, 120, 15, 0, -200, 120, "Expired", true, ["Milk"], false],
    [4, "Idli-Vada Combo Box", "Snacks", "Vegetarian", 160, 80, 20, 14, 15, 105, "Live", false, [], false],
    [4, "Filter Coffee Decoction (500 ml)", "Snacks", "Vegetarian", 140, 70, 6, 6, 90, 60, "Live", false, [], false],
    [5, "Mutton Biryani Handi", "Meals", "Non-vegetarian", 480, 240, 8, 8, 120, 90, "Live", true, [], false],
    [5, "Egg Biryani", "Meals", "Non-vegetarian", 220, 110, 10, 4, 45, 75, "Paused", false, ["Egg"], false],
    [6, "Gulab Jamun Tub (6 pcs)", "Desserts", "Vegetarian", 200, 99, 12, 9, 50, 120, "Live", true, ["Milk"], false],
    [6, "Brownie Surprise Bag", "Desserts", "Vegetarian", 300, 140, 10, 2, 20, 100, "Live", true, ["Gluten", "Milk", "Egg", "Nuts"], true],
    [6, "Cheesecake Slices", "Desserts", "Vegetarian", 450, 220, 6, 0, -300, 90, "Expired", false, ["Milk", "Gluten"], false],
    [7, "Quinoa Salad Bowl", "Meals", "Vegetarian", 350, 170, 8, 8, 75, 90, "Live", true, ["Nuts"], false],
    [7, "Chicken Wrap Pair", "Snacks", "Non-vegetarian", 280, 140, 10, 7, 35, 85, "Live", false, ["Gluten"], false],
    [8, "Masala Dosa Batter Kit", "Snacks", "Vegetarian", 150, 75, 10, 10, 100, 80, "Live", false, [], false],
    [8, "Kesari Bath Box", "Desserts", "Vegetarian", 120, 60, 10, 0, 10, 90, "Cancelled", false, ["Milk", "Gluten"], false],
    [9, "Tandoori Chicken Half", "Meals", "Non-vegetarian", 380, 190, 10, 5, 25, 95, "Live", true, ["Milk"], false],
    [9, "Dal Makhani + Naan", "Meals", "Vegetarian", 260, 130, 12, 12, 140, 80, "Live", true, ["Milk", "Gluten"], false],
    [9, "Butter Naan Stack (6)", "Bakery", "Vegetarian", 150, 70, 15, 0, -260, 90, "Expired", true, ["Gluten", "Milk"], false],
    [10, "Sourdough Half Loaf", "Bakery", "Vegetarian", 240, 120, 8, 6, 55, 95, "Live", true, ["Gluten"], false],
    [10, "Fruit Tart Duo", "Desserts", "Vegetarian", 320, 160, 6, 6, 80, 70, "Live", false, ["Gluten", "Milk", "Egg"], false],
    [10, "Pastry Surprise Bag", "Bakery", "Vegetarian", 400, 180, 10, 0, -10, 100, "Sold Out", true, ["Gluten", "Milk", "Egg"], true],
    [11, "Fish Curry Meal", "Meals", "Non-vegetarian", 360, 180, 8, 5, 40, 90, "Live", true, ["Fish"], false],
    [11, "Appam + Veg Stew", "Meals", "Vegetarian", 220, 110, 10, 10, 110, 90, "Live", true, ["Coconut"], false],
    [11, "Prawn Fry Box", "Snacks", "Non-vegetarian", 420, 210, 6, 0, -180, 90, "Expired", false, ["Shellfish"], false],
    [1, "Cinnamon Rolls (2 pcs)", "Bakery", "Vegetarian", 220, 110, 6, 6, 150, 60, "Live", true, ["Gluten", "Milk", "Egg"], false],
    [4, "Lemon Rice Packs", "Meals", "Vegetarian", 140, 70, 10, 0, -150, 90, "Expired", true, ["Peanuts"], false],
  ];

  const listings: Listing[] = lspecs.map((s, i) => {
    const [vIdx, title, category, diet, op, rp, qt, qa, startOff, dur, status, donateRest, allergens, surprise] = s;
    const start = T + m(startOff);
    const created = Math.min(T - m(30), start - m(45));
    return {
      id: `l_${i + 1}`, vendorId: `v_${vIdx}`, outletId: `o_${vIdx}`, title,
      description: surprise
        ? "Surprise Bag: contents vary with what is left today. Photo is representative."
        : `Freshly made today. ${title} from today's surplus.`,
      category, imageIsRepresentative: true, surpriseBag: surprise,
      originalPrice: op, rescuePrice: rp, qtyTotal: qt, qtyAvailable: qa, diet, allergens,
      preparedAt: iso(created - h(3)), safeUntil: iso(start + m(dur) + h(4)),
      storageNote: category === "Meals" ? "Keep refrigerated after pickup; reheat thoroughly." : "Store in a cool, dry place.",
      safetyDeclaration: { accepted: true, acceptedAt: iso(created), byUserId: vIdx === 1 ? "u_ravi" : `u_vendor${vIdx}` },
      windowStart: iso(start), windowEnd: iso(start + m(dur)), donateRest, status,
      createdAt: iso(created), updatedAt: iso(created),
      cancelReason: status === "Cancelled" ? "Demo: kitchen closed early" : undefined,
      donationProcessedAt: status === "Expired" ? iso(start + m(dur)) : undefined,
    };
  });

  const reservations: Reservation[] = [];
  const payments: Payment[] = [];
  const impact: ImpactEvent[] = [];
  const R = (lid: string, customerId: string, qty: number, status: ReservationStatus, method: Reservation["method"], code: string) => {
    const l = listings.find((x) => x.id === lid)!;
    const id = `r_${reservations.length + 1}`;
    const token = `demo-token-${id}`;
    const created = Date.parse(l.createdAt) + m(10 + reservations.length);
    const r: Reservation = {
      id, ref: `SAP-${++seq}`, listingId: lid, vendorId: l.vendorId, outletId: l.outletId, customerId, qty,
      unitPrice: l.rescuePrice, amount: qty * l.rescuePrice, method, status, qrToken: token, code,
      qrTokenHash: sha256(token), codeHash: sha256(`${l.vendorId}:${code}`), createdAt: iso(created),
      readyAt: status === "Ready" || status === "Picked up" ? iso(created + m(20)) : undefined,
      pickedUpAt: status === "Picked up" ? iso(Math.max(Date.parse(l.windowStart) + m(5), created + m(30))) : undefined,
      codeUsedAt: status === "Picked up" ? iso(Math.max(Date.parse(l.windowStart) + m(5), created + m(30))) : undefined,
    };
    reservations.push(r);
    const paidOnline = method === "online";
    payments.push({
      id: `p_${reservations.length}`, reservationId: id, customerId, method, amount: r.amount,
      status: paidOnline ? "Test Payment Successful" : status === "Picked up" ? "Paid at Pickup" : "Pending",
      gateway: paidOnline ? "demo" : "cash_at_pickup", gatewayOrderId: paidOnline ? `demo_order_${id}` : undefined,
      createdAt: r.createdAt, updatedAt: r.createdAt,
    });
    if (status === "Picked up") {
      const o = outlets.find((x) => x.id === l.outletId)!;
      impact.push({ id: `ie_${impact.length + 1}`, source: "customer_pickup", refId: id, units: qty, vendorId: l.vendorId, neighbourhood: o.neighbourhood, at: r.pickedUpAt! });
    }
  };
  // Evening Bread Box (l_1): 10 total, 3 left → 7 allocated
  R("l_1", "u_priya", 2, "Ready", "online", "7304");
  R("l_1", "u_arjun", 1, "Reserved", "online", "5521");
  R("l_1", "u_sana", 2, "Picked up", "pay_at_pickup", "1180");
  R("l_1", "u_arjun", 2, "Picked up", "online", "6642");
  // Croissant Bag (l_2): 8 total, 5 left
  R("l_2", "u_priya", 3, "Reserved", "pay_at_pickup", "2093");
  // Garlic Loaf sold out (l_3): 6
  R("l_3", "u_sana", 3, "Picked up", "online", "4410");
  R("l_3", "u_arjun", 3, "Ready", "pay_at_pickup", "9035");
  // Biryani tray (l_4): 12 total, 6 left
  R("l_4", "u_sana", 4, "Reserved", "online", "3307");
  R("l_4", "u_arjun", 2, "Reserved", "online", "7781");
  // Expired Veg Thali (l_6): 15 total, 0 left (12 picked up/donated)
  R("l_6", "u_priya", 2, "Picked up", "online", "8156");
  R("l_6", "u_sana", 5, "Picked up", "online", "2268");
  R("l_6", "u_arjun", 1, "Picked up", "pay_at_pickup", "6034");
  // Idli (l_7): 20 total, 14 left
  R("l_7", "u_kiran", 1, "Reserved", "pay_at_pickup", "4475");
  R("l_7", "u_sana", 5, "Ready", "online", "1957");
  // Cheesecake expired (l_13)
  R("l_13", "u_arjun", 4, "Picked up", "online", "3829");
  R("l_13", "u_priya", 2, "Picked up", "online", "5592");
  // Brownie (l_12): 10, 2 left
  R("l_12", "u_kiran", 3, "Reserved", "online", "8640");
  R("l_12", "u_sana", 5, "Ready", "online", "2715");
  // Pastry Surprise sold out (l_23): 10
  R("l_23", "u_meghna", 5, "Ready", "online", "6390");
  R("l_23", "u_dev", 5, "Reserved", "online", "4128");
  // Tandoori (l_18): 10, 5 left
  R("l_18", "u_kiran", 5, "Reserved", "pay_at_pickup", "7012");
  // Fish curry (l_24): 8, 5 left
  R("l_24", "u_meghna", 3, "Ready", "online", "5863");
  // Butter naan expired (l_20)
  R("l_20", "u_priya", 3, "Picked up", "online", "1349");
  R("l_20", "u_arjun", 5, "Picked up", "online", "9271");

  // Donation batches from expired listings with donateRest
  const donationBatches: DonationBatch[] = [];
  const D = (lid: string, qty: number, status: DonationBatch["status"], ngoId: string | undefined, collectByOffsetMin: number, code: string) => {
    const l = listings.find((x) => x.id === lid)!;
    const id = `d_${donationBatches.length + 1}`;
    const b: DonationBatch = {
      id, ref: `DON-${++seq}`, listingId: lid, vendorId: l.vendorId, outletId: l.outletId, qty, title: l.title,
      diet: l.diet, allergens: l.allergens, preparedAt: l.preparedAt, collectBy: iso(T + m(collectByOffsetMin)), status,
      claimedByNgoId: ngoId, claimedAt: ngoId ? iso(Date.parse(l.windowEnd) + m(5)) : undefined,
      collectionCode: ngoId ? code : undefined, collectionCodeHash: ngoId ? sha256(`${l.vendorId}:don:${code}`) : undefined,
      collectedAt: status === "Collected" ? iso(Date.parse(l.windowEnd) + m(40)) : undefined,
      createdAt: l.windowEnd, vendorInstruction: "Donate the rest at window end",
    };
    donationBatches.push(b);
    if (status === "Collected") {
      const o = outlets.find((x) => x.id === l.outletId)!;
      impact.push({ id: `ie_${impact.length + 1}`, source: "ngo_collection", refId: id, units: qty, vendorId: l.vendorId, neighbourhood: o.neighbourhood, at: b.collectedAt! });
    }
  };
  D("l_6", 7, "Collected", "n_2", -60, "3141");
  D("l_20", 7, "Claimed", "n_1", 70, "2718");
  D("l_28", 10, "Open", undefined, 100, "");

  // Upcoming/open batch for the live Evening Bread Box is created by the window-end processor at run time.

  const templates: Template[] = [
    { id: "t_1", vendorId: "v_1", title: "Evening Bread Box", description: "Surprise mix of today's breads.", category: "Bakery", originalPrice: 420, rescuePrice: 180, diet: "Vegetarian", allergens: ["Gluten", "Milk"], surpriseBag: true, storageNote: "Store in a cool, dry place." },
    { id: "t_2", vendorId: "v_1", title: "Croissant Bag (4 pcs)", description: "Butter croissants baked this morning.", category: "Bakery", originalPrice: 360, rescuePrice: 180, diet: "Vegetarian", allergens: ["Gluten", "Milk", "Egg"], surpriseBag: false },
    { id: "t_3", vendorId: "v_2", title: "Chicken Biryani Tray", description: "Dum biryani, serves one.", category: "Meals", originalPrice: 320, rescuePrice: 160, diet: "Non-vegetarian", allergens: [], surpriseBag: false, storageNote: "Keep refrigerated; reheat thoroughly." },
  ];


  // ================================================================ P1 demo data
  // Past, collected orders so analytics, payouts, impact profiles and ratings are not empty.
  const customers = ["u_priya", "u_arjun", "u_sana", "u_kiran", "u_meghna", "u_dev"];
  const reviews: Review[] = [];
  const history: [number, Category][] = [[1, "Bakery"], [2, "Meals"], [4, "Snacks"], [5, "Meals"], [6, "Desserts"], [7, "Meals"], [9, "Meals"], [10, "Bakery"], [11, "Meals"]];
  const REV_TEXT = ["Fresh and great value.", "Good portion, easy pickup.", "Loved it, will be back.", "Decent, a little cold.", "Friendly staff.", ""];
  let hp = 0;
  const pastOrder = (l: Listing, vIdx: number, customerId: string, qty: number, rating: number | null, method: Reservation["method"], pickedAt: number) => {
    const id = `r_${reservations.length + 1}`;
    const code = String(1000 + ((reservations.length * 37) % 8999));
    const token = `demo-token-${id}`;
    const r: Reservation = {
      id, ref: `SAP-${++seq}`, listingId: l.id, vendorId: l.vendorId, outletId: l.outletId, customerId, qty, unitPrice: l.rescuePrice, amount: qty * l.rescuePrice,
      method, status: "Picked up", qrToken: token, code, qrTokenHash: sha256(token), codeHash: sha256(`${l.vendorId}:${code}`),
      createdAt: iso(pickedAt - m(90)), readyAt: iso(pickedAt - m(40)), pickedUpAt: iso(pickedAt), codeUsedAt: iso(pickedAt),
    };
    reservations.push(r);
    payments.push({
      id: `p_${reservations.length}`, reservationId: id, customerId, method, amount: r.amount, status: method === "online" ? "Test Payment Successful" : "Paid at Pickup",
      gateway: method === "online" ? "demo" : "cash_at_pickup", gatewayOrderId: method === "online" ? `demo_order_${id}` : undefined, createdAt: r.createdAt, updatedAt: iso(pickedAt),
    });
    const o = outlets.find((x) => x.id === l.outletId)!;
    impact.push({ id: `ie_${impact.length + 1}`, source: "customer_pickup", refId: id, units: qty, vendorId: l.vendorId, neighbourhood: o.neighbourhood, at: r.pickedUpAt! });
    if (rating !== null) reviews.push({ id: `rv_${reviews.length + 1}`, reservationId: id, customerId, vendorId: l.vendorId, rating, text: REV_TEXT[(hp + rating) % REV_TEXT.length] || undefined, createdAt: iso(pickedAt + h(2)) });
  };
  const pastListing = (vIdx: number, category: Category, k: number, donateRest: boolean, qtyTotal: number, qtyLeft: number): Listing => {
    const days = 1 + k * 2 + (vIdx % 2);
    const end = T - h(days * 24) + h((k * 3 + vIdx) % 8 - 4) - m(60);
    const start = end - m(120);
    const price = category === "Bakery" ? [220, 110] : category === "Desserts" ? [300, 150] : category === "Snacks" ? [160, 80] : [320, 160];
    const l: Listing = {
      id: `lp_${vIdx}_${k}`, vendorId: `v_${vIdx}`, outletId: `o_${vIdx}`, title: `${category} Box (past)`, description: "Past demo listing.", category, imageIsRepresentative: true, surpriseBag: false,
      originalPrice: price[0], rescuePrice: price[1], qtyTotal, qtyAvailable: qtyLeft, diet: "Vegetarian", allergens: [], preparedAt: iso(start - h(3)), safeUntil: iso(end + h(4)),
      safetyDeclaration: { accepted: true, acceptedAt: iso(start - h(1)), byUserId: vIdx === 1 ? "u_ravi" : `u_vendor${vIdx}` },
      windowStart: iso(start), windowEnd: iso(end), donateRest, status: "Expired", createdAt: iso(start - h(1)), updatedAt: iso(end), donationProcessedAt: iso(end),
    };
    listings.push(l);
    return l;
  };
  for (const [vIdx, cat] of history) {
    for (let k = 0; k < 5; k++) {
      const donate = k !== 4; // the oldest listing was not donated: its leftovers count as expired
      const l = pastListing(vIdx, cat, k, donate, 10, k === 4 ? 3 : 0);
      const pickedAt = Date.parse(l.windowStart) + m(25 + ((k * 13) % 60));
      const c1 = customers[hp++ % customers.length];
      const c2 = customers[hp++ % customers.length];
      pastOrder(l, vIdx, c1, 2 + (k % 2), [5, 4, 5, 3, 4][(k + vIdx) % 5], k % 2 === 0 ? "online" : "pay_at_pickup", pickedAt);
      pastOrder(l, vIdx, c2, 1 + (k % 4), null, "online", pickedAt + m(20));
      if (k === 4) { const o = outlets.find((x) => x.id === l.outletId)!; impact.push({ id: `ie_${impact.length + 1}`, source: "expired", refId: l.id, units: 3, vendorId: l.vendorId, neighbourhood: o.neighbourhood, at: l.windowEnd }); }
    }
  }
  // One low-rated vendor (20 ratings, average 2.5) so the admin "Flagged" list has a real example.
  for (let k = 0; k < 20; k++) {
    const l = k < 5 ? pastListing(8, "Snacks", k, false, 10, 0) : listings.find((x) => x.id === `lp_8_${k % 5}`)!;
    pastOrder(l, 8, customers[(k + 2) % customers.length], 1 + (k % 3), k % 2 === 0 ? 2 : 3, "online", Date.parse(l.windowStart) + m(20 + k));
  }
  // Two more applications for the approval demo (a third pending vendor and the pending NGO already exist).
  profiles.push({ id: "u_vendor13", name: "Pooja (Demo vendor)", role: "vendor", phone: "+91 90000 01013", createdAt: iso(T - h(30)), demo: true });
  vendors.push({ id: "v_13", ownerId: "u_vendor13", businessName: "Spice Route Tiffins (Demo)", contactName: "Pooja", phone: "+91 90000 01013", email: "demo-vendor13@example.invalid", fssaiNumber: "DEMO-FSSAI-10013", operatingHours: "07:00–21:00", payoutUpi: "demo13@upi", documents: ["demo-fssai-certificate.pdf", "demo-id-proof.pdf"], status: "Pending", createdAt: iso(T - h(26)) });
  outlets.push({ id: "o_13", vendorId: "v_13", address: "Demo address 13, Jayanagar, Bengaluru", neighbourhood: "Jayanagar", lat: 12.9291, lng: 77.5851, payAtPickup: false });
  // Follows.
  const follows = [
    { id: "f_1", customerId: "u_priya", vendorId: "v_1", createdAt: iso(T - h(70)) },
    { id: "f_2", customerId: "u_priya", vendorId: "v_6", createdAt: iso(T - h(60)) },
    { id: "f_3", customerId: "u_sana", vendorId: "v_1", createdAt: iso(T - h(50)) },
    { id: "f_4", customerId: "u_arjun", vendorId: "v_2", createdAt: iso(T - h(40)) },
  ];
  // Three open reports for the disputes queue.
  const reports: Report[] = [
    { id: "rp_1", reporterId: "u_sana", targetType: "listing", targetId: "l_4", reason: "wrong_item", text: "The tray had veg biryani, not chicken.", status: "Open", createdAt: iso(T - h(5)) },
    { id: "rp_2", reporterId: "u_arjun", targetType: "reservation", targetId: "r_4", reason: "food_safety", text: "Bread felt stale and a bit damp.", status: "Open", createdAt: iso(T - h(3)) },
    { id: "rp_3", reporterId: "u_priya", targetType: "vendor", targetId: "v_8", reason: "rude_behaviour", text: "Staff were dismissive at the counter.", status: "Open", createdAt: iso(T - h(2)) },
  ];
  // Rating aggregates (same maths as submitReview).
  for (const v of vendors) {
    const rs = reviews.filter((r) => r.vendorId === v.id);
    if (rs.length) { v.ratingCount = rs.length; v.ratingAvg = +(rs.reduce((a, r) => a + r.rating, 0) / rs.length).toFixed(2); }
  }
  // Impact events carry the P1 fields; every reservation gets a state-change log.
  for (const e of impact) {
    if (e.type) continue;
    e.type = e.source === "customer_pickup" ? "sold" : e.source === "ngo_collection" ? "donated" : "wasted";
    e.qty = e.units; e.kgEst = kgFor(e.units); e.co2eKg = co2eFor(e.units);
    if (e.source === "customer_pickup") {
      const r = reservations.find((x) => x.id === e.refId);
      const l = r && listings.find((x) => x.id === r.listingId);
      if (r && l) { e.listingId = l.id; e.customerId = r.customerId; e.rupeesSaved = (l.originalPrice - r.unitPrice) * r.qty; }
    }
  }
  const reservationEvents: ReservationEvent[] = [];
  for (const r of reservations) {
    const ev = (to: ReservationStatus, at: string, from?: ReservationStatus, note?: string) => reservationEvents.push({ id: `re_${reservationEvents.length + 1}`, reservationId: r.id, from, to, at, note });
    ev("Reserved", r.createdAt, undefined, "created");
    if (r.readyAt) ev("Ready", r.readyAt, "Reserved", "vendor marked ready");
    if (r.pickedUpAt) ev("Picked up", r.pickedUpAt, r.readyAt ? "Ready" : "Reserved", "code");
  }

  const db: DB = {
    version: 1, clockOffsetMs: 0, seq, profiles, vendors, outlets, ngos, listings, templates, schedules: [],
    holds: [], reservations, payments, refunds: [], inventory: [], donationBatches, impact,
    notifications: [
      { id: "nt_1", userId: "u_priya", text: "SAP-4801 is ready for pickup at Crumb & Co. Bakery (Demo).", at: iso(T - m(5)), read: false, key: "seedReadyAt", vars: { ref: "SAP-4801", place: "Crumb & Co. Bakery (Demo)" } },
    ],
    audit: [], processedWebhooks: [],
    reservationEvents, pushTokens: [], follows, reviews, reports, settings: { platformFeeBps: 1000 },
    settingsAudit: [], memberships: vendors.map((v) => ({ id: `m_${v.id}_owner`, userId: v.ownerId, vendorId: v.id, role: "owner" as const, createdAt: v.createdAt })),
    invites: [], priceSteps: [], referralCodes: [], referrals: [], creditLedger: [], distributionLogs: [], receipts: [], receiptSeq: {},
    deliveryRequests: [], certificates: [], moderationActions: [],
  };
  seedP2(db, T);
  return db;
}
