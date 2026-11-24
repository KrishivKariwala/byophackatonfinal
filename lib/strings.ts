// NOTE: UI text that used to read from `S` now lives in the i18n catalogs (lib/i18n/messages/*.json, keys like follow.*, cancel.*, review.*, report.*, impact.*, p1.*).
// `S` is kept only as an English reference for server-generated text; no screen imports it any more.
// User-facing strings for P1 features live here (the repo had no strings file before P1; P0 copy stays where it was).
// Currency is INR (₹). Keep wording plain; no string is built from untrusted HTML.
export const S = {
  surprise: {
    badge: "Surprise Bag",
    worth: (n: number) => `Worth ₹${n}`,
    hidden: "Contents are a surprise and are revealed at pickup. Allergens and diet are always shown.",
    note: "Surprise Bag · fixed price · contents revealed at pickup",
  },
  verified: { badge: "Verified", tip: "Approved by Save a Plate (demo approval, not a regulatory approval)." },
  rating: { none: "No ratings yet", count: (n: number) => `${n} rating${n === 1 ? "" : "s"}` },
  follow: {
    follow: "Follow", following: "Following", unfollow: "Unfollow",
    hint: "Get an alert when this restaurant lists food within 10 km.",
    emptyTitle: "You aren't following anyone yet",
    emptyBody: "Follow restaurants from a listing page and we'll tell you when they post.",
  },
  cancel: {
    policy: "Cancel for free until 30 minutes before pickup starts and any online payment is refunded in full. After that, cancelling is not refunded. If the vendor cancels, you always get a full refund.",
    button: "Cancel order",
    confirmFree: (refund: number) => `Cancel this order? ${refund ? `₹${refund} will be refunded (test mode).` : "Nothing was charged."}`,
    confirmLate: "Cancel anyway? This is within 30 minutes of pickup, so it will NOT be refunded.",
    freeUntil: (t: string) => `Free cancellation until ${t}`,
    late: "Free cancellation has ended. Cancelling now is not refunded.",
  },
  review: {
    title: "Rate your order",
    hint: "You can rate once, within 48 hours of pickup.",
    textLabel: "Anything to add? (optional)",
    submit: "Submit rating",
    thanks: "Thanks for rating! Your feedback helps other customers.",
    stars: (n: number) => `${n} star${n === 1 ? "" : "s"}`,
  },
  report: {
    button: "Report a problem",
    title: "Report a problem",
    reasons: { food_safety: "Food safety", wrong_item: "Wrong item", rude_behaviour: "Rude behaviour", other: "Other" },
    photo: "Add a photo (optional, JPG/PNG/WebP, under 3 MB)",
    details: "What happened? (optional)",
    submit: "Send report",
    sent: "Report sent. Our team will review it.",
  },
  impact: {
    title: "Your impact",
    meals: "meals rescued", saved: "saved vs. original price", kg: "kg food rescued", co2: "kg CO₂e avoided",
    streak: (w: number) => (w ? `${w}-week streak` : "No streak yet"),
    best: (w: number) => `Best: ${w} week${w === 1 ? "" : "s"}`,
    badges: "Badges",
    method: (kg: number, co2: number) => `Estimate: 1 meal ≈ ${kg} kg of food; 1 kg of food ≈ ${co2} kg CO₂e.`,
    emptyTitle: "No rescues yet",
    emptyBody: "Pick up your first order and your impact shows up here.",
  },
  suspended: (until: string) => `Reservations are paused until ${until} after repeated no-shows. You can still browse.`,
  payAtPickup: {
    locked: (done: number, need: number) => `Pay at pickup unlocks after ${need} completed pickups (you have ${done}).`,
    off: "Not offered by this vendor.",
  },
  states: { loading: "Loading…", error: "Something went wrong. Please try again.", retry: "Try again" },
  noShow: "Marked a no-show: not collected within 15 minutes of pickup end.",
} as const;
