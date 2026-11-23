# SAVE A PLATE — Claude Code Master Build Prompt

> **Use this prompt together with the `brand-assets/` and `reference/` folders in this bundle.**
>
> Official logo preview:
>
> ![SAVE A PLATE official logo](brand-assets/save-a-plate-logo-cropped.png)
>
> Official mood board:
>
> ![SAVE A PLATE mood board](brand-assets/save-a-plate-moodboard.png)

---

## 0. Your assignment and source-of-truth hierarchy

Act as the lead product architect, senior full-stack engineer, database engineer, QA engineer and product designer. Build the actual SAVE A PLATE web application in the project workspace. Do not merely write a plan, create static mockups or produce a landing page.

Read both reference files before coding:

- `reference/original-product-requirements.txt` — original product requirements and business context.
- `brand-assets/save-a-plate-moodboard.png` — official visual direction.
- `brand-assets/save-a-plate-logo-original.png` — exact uploaded source logo.
- `brand-assets/save-a-plate-logo-cropped.png` — same logo artwork, cropped only to remove surrounding empty canvas; no recolouring or redraw.

When requirements conflict, follow this priority order:

1. The explicit P0 requirements and numerical business rules in this prompt.
2. The official logo and mood board in `brand-assets/` for all brand and visual decisions.
3. The original PRD for useful background and details that do not conflict with P0.

Do not reintroduce conflicting old PRD rules. In particular, the P0 charity release happens at the pickup-window end, not 45 minutes before the end; the P0 discount floor is 30%, not 50%; the per-order cap is 5 units; and the customer active-reservation cap is 3.

**Do not guess missing brand assets, silently relax requirements, invent external integrations or claim that an untested feature works.** If a required asset or credential is missing, build the correct integration boundary, mark the dependency clearly and report it.

## 1. Official brand: SAVE A PLATE

The product name is **SAVE A PLATE**. Do not use “RescueBite” anywhere in the application, page titles, metadata, sample content, comments visible to users or database seed records.

Official tagline:

**RESCUING GOOD FOOD, REDUCING WASTE, AND MAKING EVERY MEAL COUNT.**

Established: **2026**.

### 1.1 Exact logo use — mandatory

The uploaded tomato-and-plate illustration containing the words “save a plate” is the official logo. Use the supplied image file, not a recreated approximation.

- Use `brand-assets/save-a-plate-logo-cropped.png` as the main display asset where suitable.
- Preserve `brand-assets/save-a-plate-logo-original.png` as the untouched source.
- Copy the chosen asset into the application's public brand-asset directory without redrawing it.
- Preserve the image's intrinsic aspect ratio. Use `object-fit: contain`; never stretch, skew, rotate, crop into the lettering, trace, vectorise, recolour, apply filters to or replace the uploaded artwork.
- Do not typeset “save a plate” in a substitute font as a replacement for the logo.
- Do not replace the tomato illustration with a leaf, plate icon, recycling symbol or generic food icon.
- The cropped version retains the original cream background. Use it on a matching warm-cream surface. Do not pretend it has a transparent background.
- The full original source must remain available in the repository.
- Use the supplied logo in the site header/navigation, customer entry experience, sign-in experience and relevant footer/brand areas. Use the same supplied mark consistently across customer, vendor, NGO and admin areas.
- A favicon may be made by proportionally scaling/cropping the supplied artwork only; do not invent a new symbol.

If the image is not present at the specified relative path, stop and report the missing asset. Do not substitute a generated image or text wordmark.

### 1.2 Mood-board palette

Use the actual colour circles in the supplied mood board as the rendered visual reference. Centre samples from the supplied image are:

- Primary tomato red: `#CB0001`
- Bright red/coral: `#FD2828`
- Deep burgundy: `#790000`
- Peach: `#FDD599`
- Pale cream/yellow: `#FEF2C0`
- Mood-board warm background: `#F6F5F3`
- Logo artwork background: `#FBF0D5` (preserve inside the supplied logo asset; do not automatically use this as the whole-site background)

**Important source discrepancy:** the small HEX captions printed beneath the mood-board swatches do not all match the visible swatches; one printed code is invalid-length. Do not silently substitute the conflicting printed captions. Use the sampled visible swatches above as the initial design tokens and keep the mood-board image as the final visual reference. Document the discrepancy in the README so it is visible to the owner.

Do not introduce an unrelated green, blue or purple brand palette. Status colours may use accessible semantic treatments only when required, and should remain visually subordinate to the official brand palette.

### 1.3 Typography — supplied font files and exact mapping

The mood board specifies these three typefaces:

- **Inter** — interface, navigation, body copy, labels, forms, tables and metrics.
- **The Seasons** — editorial headings and selected storytelling text.
- **Chunko Bold** — expressive display headings and brand-style promotional emphasis.

The owner has supplied the following font files separately from this ZIP. The files must be attached to the Claude Code workspace or copied into the application workspace before the font implementation can be verified. Do not assume that files attached only to the earlier ChatGPT conversation are automatically available in Claude.

**The Seasons family — supplied variants**

| Supplied filename | CSS family | Weight | Style |
|---|---|---:|---|
| `Fontspring-DEMO-theseasons-lt.otf` | The Seasons | 300 | normal |
| `Fontspring-DEMO-theseasons-reg.otf` | The Seasons | 400 | normal |
| `Fontspring-DEMO-theseasons-bd.otf` | The Seasons | 700 | normal |
| `Fontspring-DEMO-theseasons-ltit.otf` | The Seasons | 300 | italic |
| `Fontspring-DEMO-theseasons-it.otf` | The Seasons | 400 | italic |
| `Fontspring-DEMO-theseasons-bdit.otf` | The Seasons | 700 | italic |

**Chunko Bold — supplied alternatives**

- `Chunko Bold Demo.otf` — preferred OTF asset for the display face.
- `Chunko Bold Demo(1).ttf` — alternate TTF version of the same named display family. Do not register both as separate families or load both simultaneously; use the OTF unless the target build environment demonstrates a compatibility issue.

The Seasons files' internal font metadata confirms Light, Regular, Bold, Light Italic, Italic and Bold Italic styles. Chunko's internal metadata identifies the family as `Chunko Bold Demo`; use it as a bold display face even though the font's internal style field says Regular.

**Required implementation**

1. Check whether the supplied font binaries are actually present in the Claude project workspace. If they are, copy/rename them into `public/fonts/` using stable, lowercase names (for example, `the-seasons-light.otf`, `the-seasons-regular.otf`, `the-seasons-bold.otf`, the three italic equivalents and `chunko-bold.otf`).
2. Configure `@font-face` declarations or the framework's local-font facility with the exact weights and italic styles above. Use `font-display: swap` and ensure the browser requests the correct file for each weight/style.
3. Use The Seasons for editorial headings and selected storytelling text. Use Chunko Bold for display emphasis, prominent section titles and brand-style promotional text. Use Inter for all functional UI text.
4. Inter was not included in the uploaded font set. Use the exact Inter family via a suitable supported font-loading method (such as `next/font/google` when network/build conditions permit). If it cannot be fetched or supplied locally, report the dependency; do not claim that a fallback is Inter.
5. Do not use The Seasons or Chunko Bold to typeset a replacement logo. The supplied logo image remains authoritative.
6. Do not silently substitute fonts. If a particular file is missing, report its exact filename and retain the correct CSS family token until it is supplied.
7. The supplied filenames contain `DEMO`. Treat these files as prototype/demo assets only until the owner verifies the applicable commercial/webfont licence. Do not state that production usage is licensed. Flag the licensing check in the engineering handoff before public launch.

A font mapping and CSS example is provided in `reference/font-assets-manifest.md`. The font binaries themselves are not embedded in this ZIP; attach the supplied font files separately to Claude or copy them into the application workspace.

### 1.4 Visual direction

Follow the supplied food/bakery editorial mood board: expressive display type, rich food photography, strong red and burgundy sections, warm cream/peach surfaces, thoughtful grids, premium product cards and confident editorial spacing. The interface must still clearly serve a multi-vendor surplus-food marketplace, not look like a bakery's single-store ordering site.

Do not fall back to a generic green sustainability SaaS template. Apply one coherent brand system across all four roles. The vendor experience should be operationally fast; the customer experience should be image-led and inviting; NGO and admin areas should remain legible and consistent with the brand.

## 2. Product and core journeys

SAVE A PLATE is a hyperlocal surplus-food marketplace, initially focused on Bengaluru, India.

It connects:

1. Restaurants/bakeries that publish surplus food at discounted prices.
2. Customers who discover, reserve and collect that food.
3. Verified NGOs that claim eligible remaining food for free.
4. Administrators who approve vendors and NGOs and monitor city impact.

The required end-to-end customer journey is:

Vendor approved → vendor creates listing → customer finds listing → customer reserves/payments → vendor prepares order → customer collects using a valid QR/code → customer order is marked Picked up → completed quantity contributes to impact counters.

The required end-to-end donation journey is:

Vendor selects “Donate the rest at window end” → pickup window ends → listing closes to customers → only unreserved/unheld eligible units are put into a donation batch → approved NGO claims the whole batch → vendor verifies handover → completed quantity contributes to impact counters.

Pickup only for P0. Do not build delivery or courier logistics.

## 3. Required technology and implementation approach

Use a maintainable modern stack:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui where helpful, restyled to the supplied brand system.
- Lucide icons.
- Supabase PostgreSQL, Authentication, Storage and Realtime.
- Server-side business logic and validation.
- PostgreSQL transactions and RPC functions for critical inventory/claim operations.
- Razorpay Checkout in **TEST MODE only**.
- QR-code generation and camera scanning, with manual four-digit fallback.
- Google Maps directions URLs. Map rendering may use a suitable provider configured through environment variables; ensure the demo has a graceful map experience without pretending a missing live map API is connected.

Use compatible stable versions. Inspect any existing repository before modifying it. Preserve useful existing work.

### 3.1 Configuration and security

Provide:

- `.env.example` with clearly named placeholders.
- Database migrations.
- Seed/demo data.
- Setup and run instructions in `README.md`.
- Server-only secrets.
- Row Level Security policies.
- Server-side role checks.
- Audit records for sensitive admin actions.
- Input validation and helpful error handling.

Never expose Supabase service-role keys or Razorpay secrets in client-side code. Never trust stock quantities, prices, user roles, vendor IDs, payment statuses or pickup status supplied by the browser.

### 3.2 Demo mode

The complete user experience must be demonstrable without live external credentials.

- Provide clearly labelled demo sign-in/role switching for customer, vendor, NGO and admin.
- Use fictional, clearly labelled demo restaurants and NGOs in Bengaluru.
- Seed realistic listings, orders, donation batches and statuses.
- Persist demo actions so that creating a listing, reserving it, changing order status, claiming a donation and completing handover update the relevant screens and counters.
- Keep demo transactions visibly labelled as simulated.
- Do not represent fictional businesses, actual FSSAI approvals, real payments or real payouts as genuine.
- Structure data access so demo mode can later be replaced by Supabase without rewriting the UI.

## 4. Customer app — exactly eight P0 capabilities

### 4.1 Sign-up / login

Support phone OTP or Google sign-in. At first launch, allow role selection among Customer, Vendor and NGO. Admin access is provisioned only to authorised admin accounts; it must never be granted through public role selection.

Customers may use the marketplace after sign-in. Vendor and NGO accounts must complete onboarding and remain blocked from publishing/claiming until an administrator approves them.

### 4.2 Live map + list view

Show listings within a customer-selected radius. Provide map and list views with a clear toggle. Support current location when permission is granted and manual location selection when it is not. Include Bengaluru demo neighbourhoods such as Koramangala, Indiranagar, HSR Layout, Jayanagar and Whitefield. Listing markers and list entries must reflect the same active listing dataset.

If a live map API key is missing, provide a clearly labelled demo map/fallback; do not claim GPS or live mapping is connected when it is not.

### 4.3 Live availability

Show the remaining units for every listing. Update connected clients when a reservation or vendor inventory change commits. Target visibility on other phones/devices within **2 seconds**. Database stock is authoritative; realtime messages are notifications of committed database state, not the source of truth.

### 4.4 Listing detail

Show:

- Food photos and title.
- Original price and rescue price.
- Discount percentage.
- Pickup window.
- Available quantity.
- Category.
- Mandatory veg/non-veg tag.
- Optional allergens.
- Food-safety declaration/details.
- Preparation time and any safe-consumption deadline supplied by the vendor.
- Restaurant name, location and rating where genuine/demo-labelled.

Do not invent allergen, dietary or safety information. Clearly label representative photos or variable Surprise Bag contents.

### 4.5 Filters and search

Working filters for category, diet, price, pickup time and distance. Search by food title, category and restaurant. Filters must apply to the current data, not just change their own visual state.

### 4.6 Reserve and pay

Support:

- Five-minute checkout stock hold for online payment.
- Razorpay UPI/card checkout in TEST MODE only when configured.
- Pay-at-pickup where the vendor enables it.
- Clear line-item price summary.
- Clear order/payment state.

**Payment and reservation are separate concepts.** Online checkout: create an atomic stock hold with an expiry no later than the pickup-window end; successful verified payment confirms the reservation; failed/abandoned/expired checkout releases the held stock. A late payment callback after a listing has closed must not resurrect an expired order; handle it through the appropriate test-mode refund/error path.

Pay-at-pickup: atomically confirm the reservation and allocate the units immediately; record payment as pending/unpaid until the vendor records payment at handover. Do not create a five-minute unpaid stock hold for a pay-at-pickup choice.

### 4.7 Pickup QR + four-digit fallback code

Generate a unique QR token and four-digit fallback code for each confirmed reservation. Show order reference, vendor/outlet, pickup window and directions. Codes must be server-verified, vendor-specific, reservation-specific, valid only once and unusable after successful collection.

### 4.8 Order tracking

Customer-facing order progression must be:

**Reserved → Ready → Picked up**

Show a countdown to the pickup window, order details, payment status, restaurant/location and Google Maps directions link. A vendor status change to Ready must appear on the customer view. Past orders must remain accessible.

## 5. Vendor dashboard — exactly six P0 capabilities

Build a tablet-friendly, fast operational dashboard. Prioritise large touch targets, a short listing flow and readable order status.

### 5.1 Vendor onboarding

Collect business details, business/contact name, phone/email, address and map pin, FSSAI number, operating hours and payout UPI. Allow supporting document upload. Application states: Pending, Approved, Rejected. Only approved vendors can publish listings or accept reservations.

### 5.2 Quick listing in under 60 seconds

Create a compact listing form with food title, description/category, optional image, original price, rescue price, quantity, pickup start/end, mandatory veg/non-veg tag, optional allergens and mandatory food-safety declaration. Capture preparation/safety details required by the platform's reviewed safety policy. Support templates, duplicate listing, suggested discount, fast quantity entry and one-click publish. Aim for a publish flow under 60 seconds; do not burden staff with unnecessary repeated fields.

### 5.3 “Donate the rest” at window end

Provide a prominent vendor option: **Donate the rest at window end**.

When enabled, at the pickup-window end:

1. Stop new customer reservations and close the listing to customer browsing.
2. Resolve/expire checkout holds consistently; no held or customer-reserved unit may enter a donation batch.
3. Calculate remaining unreserved and unheld stock.
4. Check donation eligibility and food-safety status.
5. Create one donation batch for the eligible remaining quantity.
6. Publish it to approved nearby NGOs.
7. Record the source listing and the vendor's donation instruction.

Do not offer ineligible or expired food. Do not donate reserved, held, already collected or already allocated inventory. If no eligible quantity remains, no donation batch is created. Donation allocation must be transactional and auditable.

### 5.4 Live orders board

Show live orders with the P0 states Reserved, Ready and Picked up. Provide order reference, quantity, pickup window and payment status/method. Vendor can mark an order Ready. Updates must be reflected in the customer tracking view.

### 5.5 Scan QR / enter code to hand over

Provide camera QR scanning and four-digit manual entry. Validate server-side that the code belongs to that reservation and the correct vendor/outlet, has not been used, and is within the pickup window. On success, atomically record handover time, mark Picked up, invalidate the token/code, record any pay-at-pickup payment confirmation and update impact counters. Show explicit success/error messages. Duplicate scans and wrong-vendor scans must fail.

### 5.6 Edit, pause or cancel a listing

Allow vendors to edit, pause, resume and cancel listings, subject to server-side validation and inventory reconciliation. On cancellation:

- Block new reservations.
- Release valid temporary holds.
- Cancel relevant outstanding orders with a recorded reason.
- Initiate full refunds for captured online payments through the payment integration/test-mode workflow.
- Do not create a fake refund for pay-at-pickup orders that were never paid.
- Notify affected customers in-app/demo mode.
- Preserve order, payment and inventory audit history.

Never delete orders or overwrite historical financial records.

## 6. Charity portal — exactly three P0 capabilities

### 6.1 NGO verification

Collect organisation details, contact person, phone/email, registration documents, address/map pin, service area, collection capacity, food handling/storage/transport arrangements and applicable FSSAI information. Statuses: Pending, Approved, Rejected. Only approved NGOs may claim donation batches. Do not treat a demo approval as a real regulatory approval.

### 6.2 Donation feed

Show nearby active free batches with vendor, food description/photo, quantity, veg/non-veg, supplied allergen/safety details, preparation time, collection deadline, address/map pin and distance. Only eligible active batches appear. Pending/unapproved NGOs cannot claim.

### 6.3 Bulk claim — all-or-nothing

An approved NGO can claim the **entire available donation batch**. P0 does not support partial claims.

The claim must be atomic: the first valid claim locks the complete batch to that NGO; simultaneous competing claims fail. Show claimant and claim state to the vendor. Give the NGO a collection reference and the vendor-specific handover path. If a claim is released before collection, reopen only if permitted by the food-safety deadline and current batch state; never duplicate quantities or claims.

## 7. Pickup and logistics — exactly two P0 capabilities

### 7.1 Pickup windows

Every listing has a pickup start and end. Pickup start must be in the future and no more than **12 hours after listing creation**. End must be after start. Customers may reserve before the pickup window begins while the listing is active, but cannot reserve after the window ends. Actual handover is permitted only during the assigned pickup window. Use server/database time consistently; do not trust client clocks.

At the window end, the listing becomes unavailable to customers and no new customer orders are permitted. Preserve it in vendor/admin history. Apply the donation flow from Section 5.3 if enabled.

### 7.2 Google Maps directions

Provide a valid Google Maps directions link from the customer's chosen location (where available) to the vendor, and to the NGO collection point where relevant. Use stored outlet coordinates/address. Do not invent coordinates for real businesses. Demo locations must be clearly fictional.

## 8. Trust, safety and payments — exactly three P0 capabilities

### 8.1 Mandatory food-safety declaration

A vendor must affirm the required food-safety declaration on every listing before it can be published. Capture the preparation time and the safety/storage/deadline information required by the product policy. Donations require a second eligibility check. Expired/ineligible food must never be donated. Preserve declaration and changes in an audit trail. Do not invent regulatory limits; make configurable rules explicit and flag regulatory review as a pre-launch requirement.

### 8.2 Mandatory veg/non-veg tag; optional allergens

Every listing must have exactly one mandatory diet classification: Vegetarian or Non-vegetarian. Allergens are optional, but if provided must be displayed clearly. Never infer the diet tag from the food name.

### 8.3 Razorpay payments — TEST MODE

Implement Razorpay test-mode order creation, server-side signature verification, webhook processing with idempotency, success/failure handling and test-mode cancellation/refund path. Keep secrets server-side. Provide pay-at-pickup as a separate method. Do not process real funds and do not state that real payment/payout/refund has occurred. If credentials are missing, keep a functional, clearly labelled demo-payment adapter and document exactly how test credentials are configured.

## 9. Admin — one P0 city impact dashboard

Create one polished city impact dashboard as the main demo highlight. Show live, database-derived counters for:

- Total meals/food units rescued.
- Customer pickup quantity.
- NGO donation collection quantity.
- Active food listings.
- Completed customer pickups.
- Completed NGO collections.
- Approved vendors.
- Approved NGOs.

Also show a concise recent activity feed and neighbourhood-level impact summary. Counts must update from committed handover events, not from listings or reservations. State the counting assumption in the UI/README (for example, whether each listed unit is treated as one meal/serving for the pilot); do not represent a reservation as rescued food.

Include only the minimum admin controls required to approve/reject vendor and NGO applications and access the city dashboard. Do not expand P0 into an unnecessarily large admin console. Protect admin routes and actions with server-side authorisation.

## 10. Mandatory business rules — do not relax

1. **Minimum discount:** rescue price must be at least 30% below original price. Enforce `rescue_price <= original_price * 0.70` on the server and database/business-rule layer. Validate positive prices and prevent invalid original/rescue relationships.
2. **Pickup start:** pickup must start within 12 hours of listing creation and must be in the future at publish time.
3. **Atomic stock reduction:** stock allocation must happen in one database transaction/RPC. Never allow the last unit to sell twice or inventory to become negative.
4. **Realtime count:** other connected devices must receive the updated available/reserved count within 2 seconds after commit.
5. **Active-reservation cap:** each customer may have at most 3 active reservations at a time. Apply the check transactionally to prevent concurrent requests bypassing the limit. Count active confirmed reservations and unexpired checkout holds toward the limit; exclude completed, cancelled, failed and expired records.
6. **Per-order cap:** no more than 5 units in one order.
7. **Single-use pickup code:** code/QR works once, only for the correct vendor/outlet and reservation, and only during the pickup window.
8. **Listing visibility:** hide from customer discovery immediately when sold out, paused, cancelled or when the pickup window ends. Keep historical access for authorised vendor/admin views.
9. **Approval gating:** unapproved vendors cannot publish; unapproved NGOs cannot claim.
10. **Exclusive donation claim:** one approved NGO claims the entire batch; no second NGO can claim the same batch.

### 10.1 Required concurrency test: 50 attempts against 10 units

Create one live test listing with 10 available units. Launch 50 simultaneous independent reservation attempts, each for one unit.

Expected result:

- Exactly 10 requests successfully allocate/hold stock.
- Exactly 40 requests fail due to insufficient availability.
- Inventory never drops below zero.
- No duplicate allocation occurs.
- No more than 10 units are allocated in total.
- The database shows exactly 10 successful stock allocations (for pay-at-pickup, 10 confirmed reservations; for online payment, 10 active holds until payment succeeds/expires).

Use a real parallel test (for example, `Promise.all` with 50 independent requests or a dedicated concurrency test). Do not simulate the expected result by hardcoding it.

### 10.2 Realtime test

Use two or more independent browser sessions. Reserve or change stock in one session and verify another session receives the committed stock count in under 2 seconds. Record test results.

### 10.3 Other required negative tests

- Customer tries to create a fourth active reservation.
- Customer tries to reserve 6 units in one order.
- Customer attempts reservation after the pickup end.
- Vendor tries to publish while pending/rejected.
- NGO tries to claim while pending/rejected.
- Wrong vendor scans a customer's code.
- Correct vendor tries to reuse an already-consumed code.
- Two NGOs attempt to claim the same batch simultaneously.
- Food is expired/ineligible at donation time.
- A late payment callback arrives after a listing/hold has expired.

All attempts must be rejected or handled according to the rules above, without corrupting stock, payment or audit history.

## 11. Suggested data model

Use normalised relational tables and proper foreign keys, unique constraints and indexes. Include at minimum:

- `profiles` / users and roles.
- `vendors`, `vendor_applications`, `outlets`.
- `ngos`, `ngo_applications`.
- `listings`, `listing_images`, `listing_templates` if used.
- `inventory_movements`.
- `checkout_holds`.
- `reservations`.
- `payments`, `refunds`.
- `pickup_codes` or securely stored token hashes.
- `pickup_events` / handover records.
- `donation_batches`, `donation_claims`, `donation_handovers`.
- `impact_events`.
- `notifications`.
- `audit_logs`.

Keep reservation state, payment state, listing state and donation state separate. Suggested state families:

- Listing: Draft, Live, Paused, Sold Out, Expired, Cancelled.
- Reservation/order: Hold, Reserved, Ready, Picked up, Cancelled, Expired.
- Payment: Pending, Test Payment Successful, Failed, Paid at Pickup, Refund Pending, Refunded.
- Donation batch: Open, Claimed, Collected, Expired, Cancelled.

Use explicit transitions and reject invalid transitions server-side. Store timestamps in UTC and display in Asia/Kolkata. Use one authoritative clock for cutoff/expiry checks.

## 12. Demo seed data

Seed clearly fictional sample restaurants/outlets and NGOs in Bengaluru neighbourhoods including Koramangala, Indiranagar, HSR Layout, Jayanagar and Whitefield. Include roughly 12 restaurants, 4 NGOs and 25–30 listings across bakery, meals, snacks and desserts, with varied prices, quantities, pickup windows and mandatory veg/non-veg labels. Include active, sold-out, expired and cancelled listings; pending/approved accounts; reservations in multiple states; open/claimed/completed donation batches.

All fictional records must be visibly labelled as demo content where a user might mistake them for real organisations. Do not invent authentic business ratings or regulatory approvals.

## 13. UX and responsive requirements

- Desktop: polished, spacious marketplace and readable operational dashboards.
- Tablet: vendor flow optimised for counter use, large controls, minimal typing and fast scan.
- Mobile: customer browsing, filters, checkout, order status and QR pickup pass work well.
- NGO: straightforward donation feed and batch claim.
- Admin: prominent readable impact counters.

Include real loading, empty, error, validation and success states. Every visible action must do what its label says. Do not use non-functional decorative buttons. Do not hardcode dashboard figures that fail to change after actions.

Apply the mood-board design tokens to every role. Preserve the supplied official logo exactly.

## 14. Explicitly out of scope for P0

Do not build these now:

- Delivery/courier management.
- POS integration.
- AI demand prediction.
- Paid subscriptions.
- Corporate CSR portal.
- Multi-city operating controls.
- Advanced loyalty programme.
- Complex GPS/ETA tracking.
- Complex analytics beyond the P0 city impact dashboard.
- Real payouts.

Keep the architecture extensible, but do not let future features delay or weaken the P0 flows.

## 15. Build order

**Phase A — Inspect and prepare**
- Inspect repository and existing code.
- Read supplied PRD, mood board and logo.
- Set up brand tokens and exact logo path.
- Set up app structure, database schema/migrations, demo mode and role protection.

**Phase B — Customer P0**
- Authentication/demo role selection.
- Map/list discovery and radius.
- Listing detail and filters.
- Atomic reservation/holds, test checkout and pay-at-pickup.
- Pickup pass and order tracking.

**Phase C — Vendor P0**
- Vendor onboarding and approval.
- Quick listing.
- Inventory and live orders.
- Listing edit/pause/cancel.
- QR/code handover.
- Donate-the-rest setting and window-end process.

**Phase D — NGO P0**
- NGO onboarding and approval.
- Donation feed.
- Atomic all-or-nothing bulk claim.
- Donation handover.

**Phase E — Admin P0**
- City impact dashboard with live counters.
- Minimal vendor/NGO approval actions.

**Phase F — Verification**
- Run all mandatory positive and negative tests.
- Run the 50-attempt/10-unit concurrency test.
- Verify realtime under 2 seconds.
- Verify payment/hold expiry and refund handling in test/demo mode.
- Verify donation batch exclusivity and timing.
- Check QR/code one-time and correct-vendor behaviour.
- Check all role permissions.
- Check responsive layouts and exact brand consistency.
- Fix errors before declaring the app complete.

## 16. Final acceptance checklist

Do not claim completion until all applicable items below have been tested and reported:

- [ ] Official supplied logo is used as an image asset; it has not been redrawn or replaced.
- [ ] Brand palette and mood-board style are applied consistently.
- [ ] Missing font assets, if any, are explicitly reported; no silent font substitution is claimed as exact.
- [ ] All 8 customer P0 capabilities work.
- [ ] All 6 vendor P0 capabilities work.
- [ ] All 3 NGO P0 capabilities work.
- [ ] Both pickup/logistics P0 capabilities work.
- [ ] All 3 trust/safety/payment P0 capabilities work.
- [ ] Admin city impact dashboard works and counters derive from completed handovers.
- [ ] 30% minimum discount rule is enforced.
- [ ] Pickup start is within 12 hours of listing creation.
- [ ] 5-minute online checkout hold works and expires correctly.
- [ ] Pay-at-pickup allocates stock safely and remains unpaid until vendor confirmation.
- [ ] Maximum 3 active reservations per customer is enforced under concurrency.
- [ ] Maximum 5 units per order is enforced.
- [ ] 50 concurrent attempts against 10 units yield exactly 10 successful stock allocations.
- [ ] Realtime stock update is received within 2 seconds in the test setup.
- [ ] QR/code is single-use and vendor-specific.
- [ ] Out-of-window reservation and pickup are blocked.
- [ ] Unapproved vendors cannot publish and unapproved NGOs cannot claim.
- [ ] Window-end donation only includes eligible, unreserved, unheld stock.
- [ ] Donation batch is locked to one NGO and cannot be double-claimed.
- [ ] Listing sellout/expiry removes it from customer discovery.
- [ ] Listing cancellation refunds captured online test payments and preserves audit history.
- [ ] All four role experiences work in demo mode.
- [ ] No visible button is inert.
- [ ] Type checking, linting and available automated tests pass.
- [ ] README contains setup, environment, demo access, test results and outstanding external dependencies.

At the end, provide a concise engineering handoff stating:

1. What was actually implemented.
2. Which workflows were tested.
3. Actual concurrency-test result.
4. Actual realtime-test result.
5. Any missing credentials/assets or unfinished integrations.
6. Exact commands to run the project.

**Do not claim a test passed unless it was actually run. Do not claim a service is connected unless its credentials and integration have been verified. Do not remove, weaken or reinterpret the numerical P0 requirements.**
