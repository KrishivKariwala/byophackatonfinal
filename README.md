# SAVE A PLATE

**Rescuing good food, reducing waste, and making every meal count.** · Est. 2026

A hyperlocal surplus-food marketplace for Bengaluru. Restaurants and bakeries list same-day surplus at 30%+ off for pickup, customers reserve and collect with a single-use pickup pass, and anything left at window end goes free to verified NGOs. Admins approve partners and watch city impact, counted only from completed handovers.

> **Demo build.** All restaurants, NGOs, people, ratings and approvals are fictional and labelled "(Demo)". Payments are simulated (or Razorpay **TEST mode** when keys are set). No real money, payouts, FSSAI approvals or SMS are involved.

---

## Quick start

```bash
npm install
cp .env.example .env.local        # set SESSION_SECRET; everything else optional
npm run build && npm start        # http://localhost:3000   (or: npm run dev)
```

The demo store (`data/demo-db.json`) is created and seeded on first request, with times relative to "now" so there are always live, upcoming and ended pickup windows. `npm run seed` re-creates it (restart the server afterwards).

### Demo access

**From the landing page:** click a slice of the plate (Find food, List surplus, Collect as an NGO). You get that side's own sign-in: enter a mobile number (and your name the first time), then the simulated code **123456**. The same number signs you back in to the same account. A number registered on one side can't be used on another.

**Skip:** every side's sign-in has a **Skip, use demo {side}** button that signs you in as an approved demo account (customer: Priya, vendor: Ravi, NGO: Joseph) and goes straight to that side's home. It is demo-only (disabled when `DATA_MODE` is not `demo`) and every use is written to the audit log. Brand-new vendors and NGOs still start **Pending** until an admin approves them.

Opening the app, or refreshing any page, always signs you out, so it starts with no demo account every time. Clicking the logo or a Back link inside the app keeps you signed in.

**All demo accounts:** open **/signin** (or "More demo accounts") and click a persona. No password.

| Persona | Role | What to try |
|---|---|---|
| Priya | Customer (2 active orders) | Discover → listing → Reserve & pay → pickup pass |
| Arjun | Customer (at the 3-reservation cap) | Try a 4th reservation and see it rejected |
| Ravi · Crumb & Co. Bakery | Vendor, approved | Quick list, Mark ready, Scan & hand over, Donations |
| Anita · Masala Lane Kitchen | Vendor, approved | A second outlet, for wrong-vendor scans |
| Kabir · Dough Theory | Vendor, **pending** | Publishing is blocked |
| Joseph · Hope Shelter Trust | NGO, approved | Donation feed, claim whole batch, collection code |
| Fatima · Annapurna Kitchen | NGO, approved | Compete for the same batch |
| Asha · New Dawn Foundation | NGO, **pending** | Claiming is blocked |
| Meera | Admin | City impact dashboard, approve/reject, reset demo |

New accounts: choose Customer, Vendor or NGO, then use the simulated OTP **123456**. Admin cannot be self-selected.

**Demo clock.** Open the **Account** menu (top right) → **Demo tools** for **+15 min / +1 h** (and **Real time** once the clock has moved). It shifts the *server* clock, so you can watch holds expire, windows close and "Donate the rest" batches appear live. All rules use the server clock; client clocks are never trusted.

### Five-minute walkthrough
1. **Ravi → Quick list** → pick the "Evening Bread Box" template → 10 → tick the declaration → **Publish now**. A timer shows time to list.
2. **Priya** (second browser) → reserve 1 → **Simulate successful payment** → pickup pass with QR and 4-digit code. Other open tabs see the stock drop live.
3. **Ravi → Today → Mark ready**: Priya's pass switches to *Ready* without a reload.
4. **Ravi → Scan & hand over** → enter the code → *Verified*. Entering it again → *Not accepted*.
5. **Demo clock +1 h** a few times → the listing closes. With "Donate the rest" on, the unreserved units become one batch.
6. **Joseph → Donation feed → Claim all** → collection code → **Ravi → Donations → Verify handover**.
7. **Meera → City impact**: counters update live from the handovers.

---

## What is implemented (P0)

| Area | Capability | Where |
|---|---|---|
| Customer | Sign-up/login (phone OTP simulated, Google boundary), role choice, admin never self-selectable | `/signin`, `api/auth/*` |
| | Live map + list with radius, GPS or manual neighbourhood, same dataset on both | `/c`, `components/DemoMap.tsx` |
| | Live availability over SSE (committed state only) | `api/stream`, `components/LiveProvider.tsx` |
| | Listing detail: price, % off, window, qty, category, diet, allergens, safety declaration, prep and eat-by time, outlet | `/c/listing/[id]` |
| | Filters (category, diet, price, pickup time, distance) and search (title, category, restaurant), applied on the server | `discover()` |
| | Reserve & pay: 5-min hold for online pay, pay-at-pickup confirms immediately, line items | `reserve()`, `/c/checkout/[holdId]` |
| | Pickup pass: unique QR token + 4-digit code, ref, window, directions | `/c/orders/[id]` |
| | Tracking Reserved → Ready → Picked up, countdown, past orders | `/c/orders` |
| Vendor | Onboarding (business, contact, address + pin, FSSAI, hours, UPI, docs) → Pending / Approved / Rejected | `/v/onboarding` |
| | Quick list in under 60 s: templates, duplicate, suggested price, quantity stepper and chips, one-tap publish | `/v/new` |
| | Donate the rest at window end | `sweepTx()` → `createDonationBatchTx()` |
| | Live orders board, Mark ready | `/v` |
| | Camera QR scan (html5-qrcode) + 4-digit entry | `/v/scan`, `handover()` |
| | Edit / pause / resume / cancel with refunds and audit | `/v/listings/[id]`, `cancelListing()` |
| NGO | Verification (org, contact, docs, area, capacity, handling, FSSAI) | `/n/onboarding` |
| | Donation feed: nearby open batches with all safety details | `/n` |
| | Atomic all-or-nothing claim, release, collection code | `claimBatch()`, `releaseClaim()` |
| Logistics | Pickup windows: start in the future and ≤ 12 h after creation, end > start, server clock | `validateWindow()` |
| | Google Maps directions URLs to vendor / NGO collection point | `lib/geo.ts` |
| Trust | Mandatory safety declaration per listing (re-confirmed on edit), second eligibility check before donation | `validateListingFields()` |
| | Exactly one diet tag, never inferred; optional allergens shown | listing form + validation |
| | Razorpay TEST mode: server order, signature verification, idempotent webhook, refunds; demo adapter when unset | `lib/payments.ts`, `api/checkout/*`, `api/payments/webhook` |
| Admin | City impact dashboard (8 counters, neighbourhood summary, activity feed) from handover events only; approve/reject with audit | `/admin` |

### Business rules (enforced server-side; the browser is never trusted)
| Rule | Value | Code |
|---|---|---|
| Minimum discount | `rescue_price <= original_price × 0.70` | `lib/rules.ts` + DB check in migration |
| Pickup start | future, ≤ 12 h after listing creation | `validateWindow` |
| Atomic stock | one transaction per change, never < 0 | `lib/store.ts transaction()` |
| Realtime | committed counts pushed to all sessions | SSE after commit |
| Active reservations | ≤ 3 per customer, unexpired holds count | inside the same transaction |
| Units per order | ≤ 5 | `reserve()` |
| Pickup code | single use, right vendor, right reservation, inside window | `handover()` |
| Visibility | hidden when sold out, paused, cancelled or ended | `isCustomerVisible()` |
| Approval gating | unapproved vendors can't publish, unapproved NGOs can't claim | `approvedVendorOf`, `claimBatch` |
| Exclusive claim | one NGO claims the whole batch | conditional transition under lock |

**Impact counting assumption:** for the pilot, **1 listed unit = 1 meal**. Only completed handovers (customer *Picked up* or NGO *Collected*) are counted; listings and reservations never are.

---

## Test results (actually run, 23 Nov 2026)

| Suite | Command | Result |
|---|---|---|
| Service tests (24) | `npm test` | **24/24 passed** |
| 50 parallel attempts vs 10 units, real HTTP server | `npm run test:concurrency` | **10 succeeded, 40 failed (`insufficient_stock`)**, final stock 0, 10 reservations in DB, lowest running stock 0 |
| Realtime, 2 independent SSE sessions (customer + vendor) | same script | 10/10 events received; **max 7 ms** from request, **2 ms** from commit (target < 2,000 ms) |
| HTTP negative checks (10) | same script | all rejected with the expected codes |
| Browser end-to-end (headless Chrome, 6 contexts) | `test-results/browser-e2e.log` | stock change on another browser in **33 ms**; Ready shown on the customer's pass **885 ms** after the vendor's click; reused code rejected; 30% rule shown in UI; NGO claim + vendor verify; admin total updated live |
| Typecheck / lint / build | `npm run typecheck`, `npm run lint`, `npm run build` | clean |

Negative cases covered: 4th active reservation (also with 6 concurrent requests → exactly 3 succeed), 6 units in one order, reserving after window end, pending/rejected vendor publishing, pending NGO claiming, wrong vendor scanning (QR → `wrong_vendor`, code → `code_not_found`), reused code, three NGOs claiming one batch at once (exactly one wins), ineligible food at donation time (no batch), nothing left (no batch), late payment callback after hold expiry (refund path, order not revived), 30% discount boundary (71 rejected, 70 accepted), pickup window in the past / > 12 h / end before start, missing declaration or diet, cancellation refunding only captured online payments.

Raw output: `test-results/http-tests.json`, `test-results/browser-e2e.log`, `test-results/unit.txt`.

---

## Architecture

- **Next.js 15 App Router + TypeScript + Tailwind**, Lucide icons. Server components read state; client components call JSON route handlers.
- **Data layer:** `lib/services.ts` holds every business rule. In demo mode it runs on `lib/store.ts`: a JSON store where each write takes an in-process mutex, works on a copy (rollback on error), persists atomically, then emits live events *after* commit.
- **Window-end processor:** `sweepTx()` runs at the start of every write and every 5 s from the SSE stream. It expires holds, closes ended listings, creates donation batches and expires stale batches.
- **Supabase boundary:** `supabase/migrations/0001_init.sql` has the normalised schema, check constraints (30% rule, 12 h, qty), row-level security, and security-definer RPCs (`reserve_listing` with `FOR UPDATE` + advisory lock, `confirm_payment`, `handover`, `claim_batch`, `process_window_end` for pg_cron).
- **Security:** signed httpOnly session cookie (demo); roles come from stored profiles; secrets are server-only; pickup codes and QR tokens are stored as SHA-256 hashes for verification; admin actions are audit-logged.

```
app/            pages (c = customer, v = vendor, n = NGO, admin) + api/ route handlers
lib/            types, rules, services (business logic), store (demo tx), seed, session, payments, geo
components/     brand + shared UI, LiveProvider (SSE), DemoMap
supabase/       production schema, RLS, RPCs
tests/          vitest service tests      scripts/  HTTP concurrency/realtime tests, seed
public/brand    official logo (original + crop, untouched)      reference/  bundle docs + mood board
```

---

## Brand implementation

- **Logo:** the supplied artwork is used as-is (`public/brand/save-a-plate-logo-cropped.png`; the original is kept alongside). `object-fit: contain`, intrinsic ratio, on matching cream surfaces. The favicon is a proportional scale of the same artwork.
- **Palette (sampled from the visible mood-board swatches):** tomato `#CB0001`, coral `#FD2828`, burgundy `#790000`, peach `#FDD599`, cream `#FEF2C0`, page `#F6F5F3`, logo cream `#FBF0D5`.
  ⚠ **Mood-board discrepancy:** the printed captions (`#FF2600`, `#FF2828`, `#7a0000`, `#FF6D699`, `#fff32c`) don't match the rendered swatches, and `#FF6D699` is an invalid 7-digit code. The sampled swatch values are used; please confirm the intended values.
- **Typography:** Inter for all UI (self-hosted via `@fontsource/inter`, the real Inter family).
  ⚠ **The Seasons and Chunko Bold font files were not supplied in this workspace.** They are commercial Fontspring demo fonts and were not downloaded from unofficial sources. The CSS tokens still name them first (`"The Seasons"`, `"Chunko Bold"`). Until the files arrive, two labelled stand-ins render: **Cormorant Garamond** (editorial) and **Bagel Fat One** (display). These are *not* the official faces.
  To install the official fonts, copy the files into `public/fonts/` with the manifest names (`the-seasons-light.otf`, `the-seasons-regular.otf`, `the-seasons-bold.otf`, `the-seasons-light-italic.otf`, `the-seasons-italic.otf`, `the-seasons-bold-italic.otf`, `chunko-bold.otf`) and restart. `app/layout.tsx` then links `public/fonts/official-fonts.css` automatically. **Licensing:** the filenames contain `DEMO`; verify the Fontspring web/commercial licence before any public launch.
- **Food photography:** none was supplied, so listings show a clearly labelled "Representative image" tile rather than stock or fake photos.

---

## Outstanding external dependencies

| Dependency | Status | To finish |
|---|---|---|
| Supabase (Postgres, Auth, Storage, Realtime) | **Not connected.** Migration written, not executed | Create a project, run `supabase/migrations/0001_init.sql`, set env vars, implement a `supabase` adapter behind `lib/services.ts` calling the RPCs, swap SSE for Supabase Realtime |
| Phone OTP / Google sign-in | Simulated OTP (123456); Google shows a "not connected" note | Supabase Auth phone provider (SMS gateway) + Google OAuth client |
| Razorpay TEST mode | Code paths written (order, signature, webhook, refund); **not exercised**, no test keys | Set `RAZORPAY_KEY_ID` (must start `rzp_test_`), `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`; point the webhook at `/api/payments/webhook` |
| Live map tiles | Labelled schematic demo map | Add a provider key and render it in `components/DemoMap.tsx` (directions links already work without a key) |
| Document uploads | File names recorded only | Supabase Storage bucket with RLS |
| Official fonts | Missing (see above) | Supply licensed files |
| Food-safety / regulatory rules | Configurable defaults (donation collect-by = window end + 2 h, capped by vendor eat-by) | **Regulatory review before launch.** The FSSAI surplus-food guidance and liability terms need legal sign-off |
| Multi-instance scaling | Demo store is single-process | Use the Supabase RPCs (row locks) in production |

## P1 features

P1 adds notifications (in-app + optional Expo push/SMS), follows, Surprise Bag, ratings, impact profile, cancellation and refunds, reports, pay at pickup, vendor templates, price suggestion, analytics and payouts, donation-only listings, charity scheduling with a public volunteer link, escalation, no-show handling, fraud controls, verified badges, and an admin console (approvals, reports, flagged). See `docs/P1_DEMO.md` to try each one and `docs/P1_NOTES.md` for decisions and limits. Schema: `supabase/migrations/0002_p1.sql` (+ `.down.sql`).

## P2 features

P2 adds referral credits, Hindi and Kannada (globe menu at the top corner), a live "I'm on my way" ETA, auto-markdown schedules, monthly impact certificates with a public verification page, multiple outlets with owner / manager / staff roles, a charity priority window, distribution logs, donation receipts (PDF + zip), a delivery hand-off layer (mock rider by default), an admin moderation queue, and an admin platform-settings screen with an audit trail. **Every P2 feature is behind a feature flag** (Admin → Settings), so any of them can be switched off without a deploy. See `docs/P2_DEMO.md` to try each one, `docs/P2_NOTES.md` for decisions, assumptions and what is *not* done (read it: the Postgres side is only partly written), and `TRANSLATION_REVIEW.md` (the Hindi and Kannada text is an unreviewed first pass). Schema: `supabase/migrations/0003_p2.sql` (+ `.down.sql`; run on a real database, with the missing P2 rules added in 0004 to 0006).

Extra environment variables: `DELIVERY_PROVIDER` (`mock` default | `dunzo` | `porter`), `DUNZO_API_KEY`, `PORTER_API_KEY`, `DELIVERY_WEBHOOK_SECRET` (see `.env.example`).

## Deploying to Vercel

1. Import the repo in Vercel (framework: Next.js, no build settings to change).
2. In **Settings → Environment Variables** add `SESSION_SECRET` (any long random string). Everything else is optional; leave `DATA_MODE` unset (demo).
3. Deploy.

Notes for this demo build: Vercel's project folder is read-only, so on Vercel the demo data is kept in the temp directory. It is seeded on first request and **resets whenever Vercel starts a fresh instance**, and different instances do not share data. That is fine for a demo and not for real use: production needs the Supabase adapter (see the issue backlog). If `SESSION_SECRET` is missing the demo still runs on a public fallback and logs a warning.

## Database (Supabase)

The demo runs on a JSON file. The real database lives in `supabase/migrations/`: `0001_init.sql`, `0002_p1.sql`, `0003_p2.sql`, then the P2 rules in three slices: `0004_p2_credits.sql`, `0005_p2_receipts_certificates.sql`, `0006_p2_priority_delivery.sql`, then `0007_pickup_codes.sql` (codes the customer can see again, freed on cancel, staff can scan) and `0008_reserve_parity.sql` (the reserve rules the demo already had), `0009_store_parity.sql` (columns the app's data model needed) and `0010_app_clock.sql` (one clock, so the demo fast-forward works on the database too) (+ `.down.sql` for every one after the first). They have been run on a real Supabase Postgres and tested (see below): every P2 rule now exists in Postgres as well as in the demo adapter. **The app runs on the demo store unless `STORE=supabase` is set. With it set, the WHOLE app runs on this database** (sign-in, listings, orders, vendor / charity / admin screens): the 9-step browser test passes on it, and so do the 50-customers-for-10-units race and the services tests (see "Proving it" below).

How it works, in one paragraph: the hot paths (reserve, pay, collect, cancel) call the database's own functions, which lock single rows, so many customers never queue behind each other (`lib/pg/flow.ts`). Everything else keeps its business logic in the app: `lib/pg/store.ts` loads the tables as the same data object the demo store uses, hands a draft to that logic, and writes back only what changed, inside one transaction under a database-wide write lock (`lib/pg/spec.ts` says how each collection maps to tables). Live updates (stock counts, order status) reach other server instances through a one-query-a-second check of the database (`lib/pg/poll.ts`), feeding the same event stream as before.

**Connections and speed:** on Vercel the app uses Supabase's *transaction* pooler (port 6543, switched automatically from the session address in `SUPABASE_DB_URL`; the session pooler allows only 15 clients in total and a burst of visitors used them all). A read loads the whole database, so one load is shared by every request a server handles within 2 seconds, and a visitor who just changed something always gets a snapshot newer than their change (cookie `sap_rev`).

**Known limits (be aware):** every non-hot write reads the whole database, and a cache miss does too (fine for a demo or pilot, the first thing to replace with scoped reads before real scale); generic writes happen one at a time; each write costs roughly 0.3 to 0.7 s to a database in another city; the scheduled jobs run from the app (every few seconds while it is used), `pg_cron` is not set up; the connection encrypts but does not yet verify Supabase's certificate (TODO in `lib/pg/db.ts`); Realtime push straight to the browser is not used.

1. Create a Supabase project and put its values in `.env.local` (names in `.env.example`; never commit them). For `SUPABASE_DB_URL` use the **Session pooler** URI from *Connect*: the "Direct connection" address needs IPv6 and fails on many networks.
2. Project setting "Grant API access to new tables automatically" stays **off** (new tables are closed to the public API until opened on purpose) and "Enable RLS on new tables automatically" **on**.

```bash
npm run db:migrate     # apply every migration that has not run yet (each file in one transaction, remembered in public.schema_migrations)
npm run db:status      # what has run
npm run db:rollback -- 0006_p2_priority_delivery   # undo the newest one with its .down.sql
npm run db:inspect     # read-only: tables, row-level security, policies, functions
npm run db:roundtrip   # proves each rollback restores the schema exactly and the migration applies again identically
npm run db:rls         # row-level-security tests against the real database (data rolled back)
npm run db:scratch      # a throw-away copy of the whole schema (schema sap_scratch) for tests; `-- drop` removes it
npm run db:seed         # fill the scratch copy with the demo data (`-- --public` fills the REAL schema and DELETES what is there: demo databases only)
npm run scan:console   # visits every screen in 3 languages with headless Chrome and lists console errors, failed requests and slow loads
npm run test:parity     # the same unit tests as `npm test`, run on Postgres (slow: minutes)
npm run test:db        # the core flow on the real database: 50 customers race for 10 units, pay, collect, cancel (test data removed afterwards)
npm run db:p2          # behaviour tests for every P2 rule in Postgres: credits, referrals, receipts, certificates, priority window, delivery (data rolled back)
```

### Proving it
```bash
npm run test:db                        # 50-way race, pay, collect, cancel, rules, seed round trip, live update across instances
npm run db:scratch && npm run db:seed  # then:  STORE=supabase PG_SCHEMA=sap_scratch npm run test:e2e-browser   (after a production build)
npm run test:parity                    # tests/services.test.ts on Postgres
```
### Switching a deployment to the database
On Vercel add: `STORE=supabase`, `SUPABASE_DB_URL` (the Session pooler address), `SESSION_SECRET` (a long random text), and keep `DATA_MODE=demo` for a public demo (or `production` for real use). Then fill an EMPTY database once with `npm run db:seed -- --public` (demo people and listings). Do not set `STORE` on a deployment before that.

## Commands

```bash
npm run dev               # dev server
npm run build && npm start
npm test                  # translation completeness check + vitest (P0, P1, P2 service tests, incl. concurrency)
npm run i18n:check        # fails on any missing Hindi/Kannada key or changed {placeholder}
npm run test:concurrency  # builds must exist: real HTTP server, 50×10, realtime, negative checks
npm run test:load         # builds must exist: 1,500 feed users, 10 reservations/s for 10 s, write time as listings pile up; fails on oversell or a missed target
npm run security:check    # builds must exist: calls every API route as a visitor, a customer and a foreign site; checks demo shortcuts are refused in production mode
npm run a11y:audit        # builds must exist: axe-core (WCAG 2.0/2.1 A and AA, incl. colour contrast) on every screen in English, Hindi and Kannada
npm run i18n:scan         # builds must exist: headless Chrome opens every screen in Hindi and Kannada and fails on any leftover English
npm run test:e2e-browser  # builds must exist: headless Chrome drives sign-out, language, live stock, order, Mark ready, handover (needs Google Chrome installed)
npm run typecheck && npm run lint
npm run seed              # fresh demo data
```
