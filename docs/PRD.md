# SAVE A PLATE: Product Requirements Document

**Version:** 3.0, current build (P0 + P1 + P2) · **Date:** 24 Nov 2026 · **Owner:** AI Team 10
**Release state:** demo build, runs locally (`npm run dev` / `npm start`, http://localhost:3000). All restaurants, NGOs, people, ratings and approvals are fictional and labelled "(Demo)". No real money, SMS, payouts or delivery partners are involved.
**Pilot city:** Bengaluru.

> This PRD describes the product **exactly as it behaves today**. Every number, rule and screen below is what the build does. Things that are not built are listed in section 11 and are not described as features anywhere else.

---

## 1. Summary

SAVE A PLATE is a hyperlocal surplus-food marketplace with a charity channel. Restaurants and bakeries list same-day surplus at **30% or more off** for pickup. Customers reserve and pay, then collect with a single-use pickup pass (QR + 4-digit code). Food left at window end can go **free** to verified NGOs. Admins approve partners and watch city impact, which is counted **only from completed handovers**.

**Problem.** India wastes an estimated 78.1 million tonnes of food a year (UNEP Food Waste Index 2024). Bakeries and restaurants typically have 5–15% of daily prep left at close. It is binned, handed out informally, or donated with no tracking.

**Design principles (as built)**
1. Two listing styles: **Itemised** and **Surprise Bag** (contents hidden until pickup; allergens and diet always shown).
2. **Pay at reservation** with a 5-minute stock hold. Pay-at-pickup unlocks only after 3 completed pickups.
3. Unsold food can go **free to charities**; customers never see charity-only offers.
4. **Pickup** is the default. Delivery exists only as an optional hand-off for charity collections.
5. **The server clock and server rules decide everything.** The browser is never trusted for time, price, stock or role.
6. **Simple first:** a clean landing page, a compact header with dropdowns, one clear action per screen.

---

## 2. Goals, non-goals and metrics

### Goals
1. Vendors recover revenue on food that would otherwise be binned.
2. Customers get good food at a clear discount close to them.
3. Charities get reliable access to otherwise-unsold food, with receipts and impact proof.
4. Every rescued meal is counted and reported (meals, kg food, kg CO₂e).
5. A busy kitchen can list in about a minute; a first-time customer needs no instructions.

### Non-goals
- Courier logistics for paying customers
- Grocery or supermarket chains
- Cooked food older than the same service day
- Customer-to-customer resale
- Real payments, SMS or payouts in this build

### Metrics
**North-star:** meals rescued per week = completed paid pickups + completed charity collections. *Pilot assumption: 1 listed unit = 1 meal.* Only handovers count; listings and reservations never do.

Pilot targets (not yet measured; the build runs on fictional demo data):

| Metric | Definition | Target |
|---|---|---|
| Meals rescued / week | Completed handovers | 3,500 |
| Sell-through | Units reserved ÷ units listed | ≥ 75% |
| Pickup completion | Completed ÷ reserved | ≥ 92% |
| No-show rate | Reservations not collected | ≤ 5% |
| Time to list | "New listing" to live (the Quick list screen shows a timer) | ≤ 60 s |
| Customer repeat (30-day) | ≥ 2 orders in 30 days | ≥ 40% |
| Rating | Average post-pickup rating | ≥ 4.4 / 5 |
| Oversell incidents | Reservations a vendor could not fulfil | 0 (stock can never go below 0) |

---

## 3. Personas and surfaces

| Persona (demo account) | Who | Surface |
|---|---|---|
| **Priya**: customer | Koramangala, orders often | `/c` |
| **Arjun**: customer | At the 3-reservation cap (for testing the limit) | `/c` |
| **Sana, Kiran, Meghna, Dev**: customers | Varying pickup history (pay-at-pickup, referrals, ratings) | `/c` |
| **Ravi**: vendor owner | Crumb & Co. Bakery, 2 outlets | `/v` |
| **Mala / Imran / Latha**: manager and counter staff | Work for Ravi's organization | `/v` (limited by role) |
| **Anita**: vendor owner | Masala Lane Kitchen | `/v` |
| **Kabir**: vendor, pending | Dough Theory (publishing blocked until approved) | `/v` |
| **Joseph, Fatima**: NGOs, approved | Hope Shelter Trust, Annapurna Kitchen | `/n` |
| **Asha**: NGO, pending | New Dawn Foundation (claiming blocked) | `/n` |
| **Meera**: admin | Platform operations | `/admin` |

Roles: `customer`, `vendor` (organization roles owner / manager / staff), `ngo`, `admin`. Admin cannot be self-selected.

---

## 4. Experience

### 4.1 Landing page
- Shows the logo, headline, a short tagline, and **"Pick your side"** with three choices: **Find food near me**, **List surplus as a vendor**, **Collect as an NGO**. The same three choices are the slices of an interactive plate (hover or tap a slice), and also a plain list of three rows with arrows, which is easier to use on a phone and with a keyboard. The plate is the only illustration on the page: there are no floating leaves, dots or blurred blobs, and the tagline and list are in sentence case.
- **Opening the app, or refreshing any page, starts signed out.** There is no "Continue as…" button and no saved demo account. (`middleware.ts` clears the session cookie whenever `/` is requested as a fresh page load; a browser refresh on any other page returns to `/` with a page load, so it signs out too.)
- **Moving around inside the app keeps you signed in.** Clicking the logo or a "Back" link is an in-app navigation, not a page load, so it does not sign you out. Link prefetches never sign anyone out. (Browsers send `Sec-Fetch-Dest: document` on a page load; see `lib/fresh-load.ts`. A client that sends no such header is treated as a fresh load.)
- **Language** is a small globe + code in the top corner. Choosing a language closes the menu immediately.
- An opening animation plays once per browser session and is skipped for visitors who prefer reduced motion.

### 4.2 Sign-in
- Each side has its own sign-in: mobile number (and name the first time), then the simulated code **123456**. The same number signs back into the same account. A number registered on one side cannot be used on another. Optional referral code for customers.
- **"Skip, use demo {side}"** signs in as an approved demo account (customer Priya, vendor Ravi, NGO Joseph). It is demo-only (disabled when `DATA_MODE` is not `demo`) and every use is audit-logged.
- "More demo accounts" (`/signin?all=1`) lists every persona; no password.
- New vendors and NGOs start **Pending** until an admin approves them.

### 4.3 Header and navigation (inside the app)
- Compact bar: logo, **menu dropdown** (current page plus all destinations the role may use, each with a one-line description), **language**, **notifications bell**, **account dropdown** (switch role, demo tools).
- Dropdowns close on outside click, Escape or choosing an item.
- **Demo clock** (in the account dropdown): +15 min / +1 h / Real time. It shifts the *server* clock so holds expire, windows close and batches appear live.

### 4.4 Languages
- **English, हिन्दी, ಕನ್ನಡ.** One click changes the app; no manual refresh.
- Choice stored in cookie `sap_lang`; the first visit uses the browser language, else English. Missing translations fall back to English per key. Numbers, dates and ₹ amounts follow the language. Server errors, notifications and page titles are localized.
- 1,440 translatable strings × 3 languages. `npm run i18n:check` fails on any missing key or changed placeholder and runs inside `npm test`.
- **Current limits:** the Hindi and Kannada text is an unreviewed first pass (`TRANSLATION_REVIEW.md`). Some catalogue labels still appear in English (neighbourhood filter chips, category names such as Meal / Snacks / Desserts, "past" on the orders page, credit-ledger note text). Vendor-written text (listing titles, descriptions, reviews) and proper names are not machine-translated. PDFs (certificates, receipts) are English only.

### 4.5 Look and feel, brand and accessibility
- **Direction ("price tag and paper bag").** The app screens (customer, vendor, NGO, admin) are plain and flat so the food and the numbers lead: warm off-white page, white sheets with a thin warm border and 12 px corners, no floating shadows, small squared tags instead of pills, and the plain bold sans for headings. The chunky display face is kept for the main screen, the sign-in screens, the customer's "Rescue something tasty" heading, the pickup pass and the impact numbers, so it means something when it appears.
- **Signature: the hang tag.** A rescue price is printed on a tomato-red tag with a pointed edge and a punched hole, with the original price struck beside it and the discount in red. It appears on every listing card, the listing page and the vendor's listings.
- **Placeholders are honest.** With no food photography supplied, listings show a hatched "Representative image" tile (like packing paper) instead of a drawn illustration.
- Official logo as supplied. Palette: tomato `#CB0001`, coral `#FD2828`, burgundy `#790000`, peach `#FDD599`, cream `#FEF2C0`, page `#F6F5F3`, logo cream `#FBF0D5`.
- The official fonts (The Seasons, Chunko Bold) are not installed; labelled stand-ins (Cormorant Garamond, Bagel Fat One) render instead, with Inter for UI.
- Designed in: 44 px touch targets, labelled controls, `role=status/alert`, text alternatives, Escape-closable menus, reduced-motion handling. `npm run a11y:audit` runs axe-core (WCAG 2.0/2.1 A and AA, including colour contrast) on every screen in all three languages: 0 violations on 87 screen-language pairs. A screen-reader pass by a person has not been done.

---

## 5. Features

### 5.1 Customer (`/c`)
| Feature | Behaviour |
|---|---|
| Discover | Map and list with radius, GPS or manual neighbourhood. Filters (category, diet, price, pickup time, distance) and search (title, category, restaurant) run on the server. |
| Live availability | "N left" updates over SSE after each committed change; sold-out cards grey out. |
| Listing detail | Price, % off, window, quantity, category, diet, allergens, safety declaration, prepared and eat-by time, outlet, ratings, directions link, cancellation policy. |
| Reserve and pay | Quantity stepper, line items, 5-minute hold for online payment, optional referral credit, simulated payment (or Razorpay TEST mode if keys are set). |
| Pay at pickup | Open after 3 completed pickups; otherwise greyed with an explanation. |
| Pickup pass | Unique QR + 4-digit code, reference, window, directions. |
| Orders | Reserved → Ready → Picked up, countdown, past orders. |
| "I'm on my way" | Available when pickup opens within 90 minutes. The phone works out minutes; only minutes are sent. |
| Notifications | In-app bell: order confirmed, ready, 15 minutes left, cancelled, refund issued, price drop, new listing from a followed vendor. Optional Expo push / SMS via env flags. |
| Follow | Follow a vendor; alerted when it lists within 10 km. `/c/following`. |
| Surprise Bag | "Worth ₹X" badge; contents hidden until pickup. |
| Ratings | 1–5 stars + text, once per order, within 48 h. Averages shown on vendor cards and profiles. |
| Impact | `/c/impact`: meals, ₹ saved, kg, CO₂e, streak, badges. |
| Cancel and refund | Free until 30 minutes before pickup starts; later cancellation is not refunded. Vendor cancellation always refunds. |
| Report a problem | Reason, photo, text → admin queue. |
| Referrals and credit | `/c/referrals`: own code and link, referred friends, credit ledger. See 6.6. |

### 5.2 Vendor and organization (`/v`)
| Feature | Behaviour |
|---|---|
| Onboarding | Business, contact, address and pin, FSSAI, hours, UPI, logo and documents (stored privately) → Pending / Approved / Rejected. |
| Quick list | Templates, duplicate, suggested price, quantity chips, safety declaration, Surprise Bag, donation-only, "Donate the rest", food-risk tag, one-tap publish. |
| Price suggestion | Suggested rescue price from time left and history; the 30% minimum is still enforced. |
| Recurring listings | "Repeat on a schedule" on the dashboard: pick a saved template, the days of the week and a pickup start time (India time); the platform publishes the listing by itself 15 to 180 minutes ahead of each window. The owner confirms the food-safety declaration once per schedule; every normal rule still applies at publish time (30% discount, window rules, approved vendor). Never twice for one day; if a rule now fails it records why and tries again the next day. Up to 10 schedules, each can be paused or deleted. |
| Auto-markdown | Up to 3 timed price drops; price only goes down; followers notified; existing orders keep their price. |
| Charity priority window | "Offer to charities first" for 15 / 30 / 45 minutes; customers cannot see or reserve it until it ends. |
| Live orders board | Reserved → Ready → Collected; Mark ready; shows first name and ETA for customers on the way. |
| Scan and hand over | Camera QR or 4-digit code; single use. With no connection the scan is saved on the device (up to 10 minutes) and sent automatically when the connection returns; the server still decides each one, so a saved scan can be refused like a live one, and a banner says how many are waiting. |
| Listing controls | Edit, pause, resume, cancel (with refunds and audit); save as template; repost. |
| Analytics | 7 / 30 / 90-day charts; per-outlet table for organizations. |
| Payouts | Daily gross, 10% platform fee, net (online payments only; pay-at-pickup cash shown separately). |
| Impact certificate | Monthly PDF with verification ID and QR; public verify page. |
| Receipts | Numbered donation receipts (PDF, zip by date range). |
| Team (owner / manager) | Outlets, staff and manager roles, invite links, outlet switcher. |
| Settings | Pay-at-pickup toggle per outlet and a per-order unit cap for the organization (up to the platform limit; owner only). |

### 5.3 Charity (`/n`)
| Feature | Behaviour |
|---|---|
| Verification | Org, contact, documents, area, capacity, handling, FSSAI, optional 80G → admin approval. |
| Donation feed | Nearby open batches with all safety details; priority offers with a countdown. A "Food you can take" choice (any, vegetarian only, non-vegetarian only) filters the feed and the priority offers; it is only a filter, so a note says how many offers it hides, "Show all" brings them back, and claiming works the same either way. |
| Claim and collect | All-or-nothing claim; release; collection code; vendor verifies handover. |
| Schedule and volunteers | Pickup time and volunteer name; no-login volunteer link (address, vendor phone, time, code) that expires. |
| Distribution log | Servings, people reached, centre, optional photos (no faces). |
| Receipts | `/n/receipts`: download per donation or zip. |
| Delivery hand-off | "Request a rider" for a claimed batch (mock rider by default). |

### 5.4 Admin (`/admin`)
| Feature | Behaviour |
|---|---|
| City impact | Counters from handover events only: meals, kg, CO₂e, neighbourhood summary, live feed. |
| Approvals | Vendor / NGO queue, document viewer, rejection needs a reason, applicant notified. |
| Reports | Dismiss, warn, hide listing, suspend account, refund order; every action logged with who and when. |
| Flagged | Vendors averaging below 3.0 over 20+ ratings; customers with repeat no-shows. |
| Vendor reliability | A score from 0 to 100 for every vendor: rating (50 points, once there are 5 ratings), how few of the last 30 days' orders the vendor cancelled itself (35) and open reports (15). Shown to admins on the Flagged screen. A vendor below 50 is listed after everyone else in the customer feed. New vendors get neutral points. |
| Moderation | Keyword and report-based queue; hide, restore, edit, warn, suspend, dismiss, each with a reason. |
| Settings | Range-validated platform settings, 12 feature flags, change history. |

---

## 6. Functional requirements and rules

All rules are enforced **server-side**.

### 6.1 Listings
- **FR-L1** Fields: title, category, diet (exactly one tag, never inferred), allergens, original and rescue price, quantity (max 500), prepared and eat-by time, pickup window; optional Surprise Bag, donation-only, "Donate the rest", food-risk tag.
- **FR-L2** `rescue_price ≤ 70% of original_price` (at least 30% off). Not applied to donation-only listings. An admin can cap the maximum discount (30–90%) but never relax the 30% minimum.
- **FR-L3** The pickup window must start in the future, at most 12 hours after the listing is created, and end after it starts.
- **FR-L4** A safety declaration is required on every listing and re-confirmed on edit. Food tagged raw, seafood or dairy dessert is limited to a 2-hour window.
- **FR-L5** A listing is hidden from customers when sold out, paused, cancelled, ended, hidden by moderation, or inside a charity priority window.
- **FR-L6** Unapproved vendors cannot publish.

### 6.2 Availability
- **FR-A1** Available = listed − reserved − held, stored server-side, never below 0 (one atomic transaction per change).
- **FR-A2** Committed changes are pushed to all open sessions over SSE.

### 6.3 Reservations and payment
- **FR-R1** Online payment holds stock for **5 minutes** (admin range 2–15); unpaid holds are released.
- **FR-R2** At most **3 active reservations** per customer (admin range 1–10; unexpired holds count) and **5 units per order**. Reserve calls are limited to 8 per minute per customer.
- **FR-R3** Payment callbacks are idempotent. A late callback after the hold expired is refunded and does not revive the order. Razorpay TEST mode code (server order, signature check, webhook, refunds) exists but has not been exercised; the demo adapter settles immediately.
- **FR-R4** A customer may cancel free until **30 minutes** before pickup starts (admin range 0–240). Later cancellation is **not refunded**. Vendor or admin cancellation always refunds.
- **FR-R5** Pay at pickup requires 3 completed pickups.
- **FR-R6** **No-show:** not collected 15 minutes after the pickup window ends. No refund; units can go to charity. 3 no-shows in 30 days pause reservations for 7 days.

### 6.4 Pickup and handover
- **FR-P1** Each reservation has a unique QR token and 4-digit code, stored hashed. The code is single use and valid only for the right vendor, right reservation and the pickup window. Reusing a code or scanning at the wrong vendor is refused with a clear message.
- **FR-P2** Handover is confirmed **only** by the vendor's scan or code. That event counts impact and issues receipts.
- **FR-P3** ETA: vendors see the customer's first name and minutes (greyed after 5 minutes without an update). The secret pickup code is never shown on the board. The request is rejected if it carries anything other than minutes.

### 6.5 Charity
- **FR-C1** With "Donate the rest" on, units still unreserved at window end become **one donation batch**; collect-by = window end + 2 hours, capped by the eat-by time. No-show units are offered only when "Donate the rest" was on and the food is still safe; otherwise they are recorded as wasted and excluded from "meals rescued".
- **FR-C2** One NGO claims the **whole** batch (conditional transition under lock). Unapproved NGOs cannot claim. A claim can be released.
- **FR-C3** Unclaimed batches **escalate** 60 minutes before collect-by to approved NGOs within 10 km, once. NGOs whose service area covers an outlet are alerted when a batch appears.
- **FR-C4** Priority window: the listing is invisible to customers until the window ends. An NGO claim takes it as a free donation and it never goes public. Followers are told when it goes public.
- **FR-C5** The food-safety eligibility check runs again at donation time.
- **FR-C6** Receipts are numbered (`SAP-DR-<year>-<counter>`); value = quantity × original price, always labelled an estimate. 80G is mentioned only while the charity's registration is valid on the collection date. The 80G number is self-declared and is not checked against any register.

### 6.6 Credits and referrals
- **FR-X1** A referral pays **₹50** to each side (admin range ₹0–500) when the friend's first order is picked up.
- **FR-X2** Credit is held in 90-day lots, earliest expiry spent first, usable for up to **50%** of an order (admin range 0–100%).
- **FR-X3** Credit is restored on free cancellation, vendor cancellation, admin refund and hold expiry. It is **forfeited** on a late cancellation or no-show.
- **FR-X4** Refused with a clear reason: own code, same phone, same device (cookie), a second code. The referrer's rewards are capped at 10 per month; beyond that the friend is still paid and only the referrer is capped.
- **FR-X5** Vendors are paid the full order value; the credit part is funded by the platform and settles through it.

### 6.7 Organizations and roles
- **FR-O1** A vendor row is an organization.

| Role | Can do |
|---|---|
| Owner | Everything, including payouts, outlets, organization settings, inviting managers |
| Manager | Listings, orders, analytics, certificates, receipts, inviting staff |
| Staff | Orders and hand-offs at **one** outlet |

- **FR-O2** Invite links are valid 7 days, stored hashed, one use. A phone invite works only for that number. Links are shown to copy; nothing is sent.
- **FR-O3** A staff member asking for another outlet's order gets a 404. One account belongs to one organization. Removal takes effect on the person's next click.

### 6.8 Moderation and settings
- **FR-M1** Items enter the moderation queue by a keyword (whole word, admin-editable list; default `scam, fake, stale, rotten, fraud, abuse, hate`) or 3+ open reports. A dismissal holds until the wording changes or a new report arrives. Every action needs a reason, notifies the person affected and is logged. Hiding a review recalculates the vendor rating.
- **FR-S1** Settings are range-validated, cached up to 60 seconds (cleared on save), audit-logged with who changed what. A change that affects live listings first shows a warning and needs "Apply anyway".

### 6.9 Rules at a glance

| Rule | Value |
|---|---|
| Minimum discount | 30% off |
| Pickup start | In the future, ≤ 12 h after creation |
| Checkout hold | 5 min |
| Active reservations per customer | 3 |
| Units per order | 5 |
| Reserve rate limit | 8 per minute |
| Free cancellation | until 30 min before pickup starts |
| No-show grace | 15 min after window end |
| No-show pause | 3 in 30 days → 7 days |
| Pay at pickup | after 3 completed pickups |
| High-risk food window | ≤ 2 h |
| Platform fee | 10% |
| Charity collect-by | window end + 2 h (capped by eat-by) |
| Escalation | 60 min before collect-by, 10 km |
| Follow alert radius | 10 km |
| Review window | 48 h |
| Low-rating flag | < 3.0 avg over 20+ ratings |
| Referral credit | ₹50 each, ≤ 50% of an order, 90-day expiry |
| Default search radius | 5 km |
| Priority window choices | 15 / 30 / 45 min |

---

## 7. User flows

**Customer.** Landing → *Find food near me* → sign in (number + code, or Skip) → feed → filter → listing → quantity (optionally use credit) → pay → pickup pass → optional *I'm on my way* → show QR → vendor scans → *Picked up* → rate → impact updates.

**Vendor.** Landing → *List surplus as a vendor* → sign in → *Quick list* → Publish → orders appear live → *Mark ready* → customer arrives → scan or type code. At window end unreserved units are donated (if "Donate the rest" is on) or expire.

**Charity.** Landing → *Collect as an NGO* → sign in → donation feed (and priority offers) → *Claim all* → collection code → optional volunteer link or rider → vendor verifies handover → receipt and distribution log.

**Admin.** Sign in as Meera → approvals, reports, moderation, settings, city impact.

**Edge cases handled.** Late customer → no-show → units to charity. Payment after hold expiry → refund, order not revived. Vendor cancels a listing → everyone refunded. Reused or wrong-vendor code → refused. 50 simultaneous reservations for 10 units → exactly 10 succeed. 3 NGOs claiming one batch → exactly one wins.

---

## 8. Scheduled work

Runs inside the transaction before every write and every 5 seconds from the SSE stream. All jobs are idempotent: hold expiry, window end and donation batches, recording leftover units as wasted, 15-minute pickup reminders, no-shows and the 7-day pause, escalation of unclaimed batches, auto-markdown steps, monthly certificates, credit expiry, priority-window release, receipt catch-up and mock-delivery status.

---

## 9. Architecture

- **App:** Next.js 15 App Router, TypeScript, Tailwind, Lucide, GSAP (landing). Server components read state; client components call JSON route handlers under `app/api/*`.
- **Logic:** `lib/services.ts` holds every rule; feature code is in `lib/p2/*`, `lib/delivery/*`, `lib/i18n/*`, `lib/pdf.ts` (pdf-lib), zip via fflate.
- **Data:** a JSON store (`data/demo-db.json`, seeded on first request, times relative to now). Every write takes a mutex, works on a copy (rollback on error), persists atomically, then emits live events after commit. `npm run seed` recreates it.
- **Security:** signed httpOnly session cookie; roles come from stored profiles; secrets server-only; pickup codes and QR tokens stored hashed; uploads stored privately under `data/uploads` and served only to the uploader and admins; admin actions audit-logged.
- **Delivery:** `DeliveryProvider` interface; `MockProvider` default (status derived from the app clock); Dunzo and Porter stubs fail safely; HMAC-signed webhook at `/api/delivery/webhook`. Delivery status is informational: a donation counts as collected only when the vendor verifies the charity's code.
- **Production boundary:** `supabase/migrations/0001_init.sql`, `0002_p1.sql`, `0003_p2.sql` (+ down scripts) define schema, RLS, indexes and RPCs. **All three have now been run on a real Supabase Postgres and tested; the app does not use it yet.** `0004_p2_credits.sql`, `0005_p2_receipts_certificates.sql` and `0006_p2_priority_delivery.sql` add the P2 rules that 0003 left out (referral and credit spend / restore / reward, the donation hand-off and receipt issuing, certificate generation, priority-window claim and follower alerts, delivery status sync), so every P2 rule now exists in Postgres as well as in the demo adapter.
- **Screens:** `/` · `/signin` · `/c`, `/c/listing/[id]`, `/c/checkout/[holdId]`, `/c/orders`, `/c/orders/[id]`, `/c/impact`, `/c/following`, `/c/referrals` · `/v`, `/v/new`, `/v/scan`, `/v/listings/[id]`, `/v/analytics`, `/v/payouts`, `/v/receipts`, `/v/team`, `/v/onboarding` · `/n`, `/n/receipts`, `/n/onboarding` · `/admin`, `/admin/approvals`, `/admin/reports`, `/admin/flagged`, `/admin/moderation`, `/admin/settings` · public `/verify/[id]`, `/volunteer/[token]`, `/join/[token]`.

### Feature flags
Admin → Settings → Feature flags. A flag that is missing counts as **on**; switching one off removes its screens and rules without a deploy:
`referrals`, `i18n`, `liveEta`, `autoMarkdown`, `impactCertificate`, `multiOutlet`, `priorityWindow`, `distributionLog`, `donationReceipts`, `delivery`, `moderation`, `platformSettings`.

### Environment variables
`SESSION_SECRET` (required in production), `DATA_MODE` (`demo`), `DEMO_DB_PATH`, `RAZORPAY_KEY_ID` (must start `rzp_test_`), `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `EXPO_PUSH_ENABLED`, `SMS_ENABLED`, `SMS_WEBHOOK_URL`, `DELIVERY_PROVIDER` (`mock` | `dunzo` | `porter`), `DUNZO_API_KEY`, `PORTER_API_KEY`, `DELIVERY_WEBHOOK_SECRET`.

---

## 10. Quality status

| Check | Result |
|---|---|
| `npm test` (translation check + vitest) | **252 tests passing** (P0, P1, P2, localized server text, sign-out middleware, credit-ledger notes, concurrency regressions) |
| `npm run i18n:check` | 1,500 keys × 3 languages, none missing |
| Typecheck, lint | Clean |
| 50 parallel reservations vs 10 units (real HTTP server) | 10 succeeded, 40 refused, final stock 0 |
| Realtime (2 independent sessions) | All events received; max 7 ms from request |
| Production build, HTTP end-to-end (`npm run test:e2e-http`) | Re-run on the current build: 10 of 50 reservations succeed, 40 refused, realtime and all negative checks pass |
| Load test (`npm run test:load`, one laptop, one process, JSON demo store) | **Passes**: 1,500 people on the feed arriving over 3 s: p95 2 ms, 0 errors (target 1.5 s). 100 reservations at 10 per second: p95 13 ms, all accepted, no oversell (target 1 s). Writes, which run the scheduled jobs first, stay under 10 ms with 185 listings. A same-millisecond burst of 1,500 new connections is limited by the operating system's accept queue (128 on macOS), not by the app. Numbers are for this machine and the demo store, not a production database |
| Security review (`docs/SECURITY_REVIEW.md`, `npm run security:check`) | 126 route calls: every protected route refuses a visitor without the right session; a customer is refused on every staff route; a foreign-site write is refused; demo shortcuts are refused in production mode. Fixed: the unguarded simulated payment, cross-site writes, missing headers. Open: shared rate limits (#41), Content-Security-Policy (#42), Next.js 16 (#43), plus the backend items |
| Browser end-to-end (`npm run test:e2e-browser`, headless Chrome, 9 steps) | **9/9 pass**: no account on the main screen, refresh and opening sign out while the logo keeps you signed in, one-click Hindi with nothing English left on the main screen, Hindi carried into the app, a second customer's page counts down live, simulated payment gives a pass with a code, vendor "Mark ready" updates the pass without a reload, a handover made with no connection is saved and sent when it returns and the same code is then refused, and Chrome reports the site installable with a friendly offline page. Proven to fail when the sign-out rule is broken. Log: `test-results/browser-e2e.log` |

---

## 11. Not built, not connected, and known limits

| Area | Current state |
|---|---|
| Database | The app still runs on the JSON demo store. The six Supabase migrations have been run on a real Postgres 17 (Mumbai) and tested: they apply cleanly, every rollback restores the schema exactly, 14 row-level-security checks pass, and 139 behaviour checks cover every P2 rule in Postgres (`npm run db:roundtrip`, `npm run db:rls`, `npm run db:p2`). With `STORE=supabase` the whole app runs on that database (`lib/pg/`): 9 of 9 browser steps, the 50-customers-for-10-units race and the services tests pass on it (`npm run test:db`, `npm run test:parity`). It is not switched on for the deployed site yet (needs the Vercel settings and one seeding run, see README). Limits: every read loads the whole database, generic writes are one at a time, scheduled jobs run from the app, no browser-side Realtime push |
| Sign-in | OTP is simulated (`123456`); Google sign-in shows "not connected" |
| Payments | Simulated; Razorpay TEST code written but not exercised; no payouts |
| Messaging | No SMS or email sent (invite links are copied manually); Expo push and SMS are off by default and untested |
| Delivery | Mock rider only; Dunzo and Porter are stubs |
| Maps | Schematic demo map; Google Maps directions links work |
| Documents | Stored on local disk, not a storage bucket |
| Apps | One responsive web app that can be installed on a phone's home screen (manifest, icons, a small service worker); offline, a page shows a plain notice in English, Hindi and Kannada and nothing personal is stored. No native mobile apps and no push notifications from the browser. Not yet checked on real iPhones and Android phones or with Lighthouse |
| Not in this build | Preferred-NGO first refusal, NGO capacity signals, standing arrangements, rescue subscriptions, waitlist, device fingerprinting, deposits |
| Translations | Hindi and Kannada are an unreviewed first pass; some catalogue labels still show English (see 4.4); PDFs are English only |
| Referral device check | A cookie, so clearing cookies defeats it (the phone-number rule still holds) |
| ETA | Foreground only (the tab must be open); not tested on a phone with real GPS |
| PDFs | Built-in PDF fonts, English only |
| Accessibility, load and security | Done and repeatable: accessibility audit (`npm run a11y:audit`, 0 violations), load test (`npm run test:load`) and security route sweep (`npm run security:check`, see `docs/SECURITY_REVIEW.md`). Still to do: a screen-reader pass by a person, and an outside security test |
| Legal | Food-safety, FSSAI surplus-food guidance, donation liability and 80G need regulatory review before any real launch |
| Screens still busy | Some screens (vendor dashboard action rows, order cards) carry more buttons than the landing page and header |

---

## 12. Release history

| Phase | Scope |
|---|---|
| **P0** | List → discover → reserve → pay → pickup → settle; NGO claim and collect; admin approvals; city impact |
| **P1** | Notifications, follows, Surprise Bag, ratings, impact profile, cancellation and refunds, reports, pay at pickup, templates, price suggestion, analytics, payouts, donation-only listings, charity scheduling and volunteer link, escalation, no-show handling, fraud controls, verified badges, admin console |
| **P2** | Referral credits, Hindi / Kannada, live ETA, auto-markdown, impact certificate, multi-outlet and staff roles, priority window, distribution log, receipts, delivery hand-off, moderation, platform settings (all behind flags) |
| **UX pass (current)** | Simplified landing page and header with dropdowns, one-click language change across the app, no persistent demo sign-in |

---

## Appendix: supporting documents

`README.md` (setup, demo accounts, walkthrough) · `docs/P1_DEMO.md`, `docs/P1_NOTES.md` · `docs/P2_DEMO.md`, `docs/P2_NOTES.md` · `TRANSLATION_REVIEW.md` · `supabase/migrations/*` · `reference/original-product-requirements.txt` (the original v1.0 brief, kept for history only; this document is the source of truth for the current build)
