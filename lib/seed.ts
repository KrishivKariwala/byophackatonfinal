import type {
  Category, DB, Diet, DonationBatch, ImpactEvent, Listing, ListingStatus, Ngo, Outlet, Payment,
  Profile, Reservation, ReservationStatus, Template, Vendor,
} from "./types";
import { NEIGHBOURHOODS, type Neighbourhood } from "./geo";
import { sha256 } from "./crypto";

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

  return {
    version: 1, clockOffsetMs: 0, seq, profiles, vendors, outlets, ngos, listings, templates,
    holds: [], reservations, payments, refunds: [], inventory: [], donationBatches, impact,
    notifications: [
      { id: "nt_1", userId: "u_priya", text: "SAP-4801 is ready for pickup at Crumb & Co. Bakery (Demo).", at: iso(T - m(5)), read: false },
    ],
    audit: [], processedWebhooks: [],
    reservationEvents: [], pushTokens: [], follows: [], reviews: [], reports: [], settings: { platformFeeBps: 1000 },
  };
}
