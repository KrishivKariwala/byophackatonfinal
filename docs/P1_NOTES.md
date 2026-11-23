# P1 build notes: decisions, deviations, assumptions

Branch: `feat/p1-features`. One commit per feature group, in the brief's order. P0 behaviour and tests are intact (all 24 original service tests pass; `scripts/http-tests.ts` passes, with the one change below).

## Stack decision (the brief allowed a fallback only "if the repo has no clear stack")
The repo has a clear stack, so P1 follows it rather than introducing Supabase/Expo as the runtime:

| Brief said | What the repo does | What I did |
|---|---|---|
| Supabase (Postgres, RLS, pg_cron, PostGIS) | A JSON store (`lib/store.ts`) with an atomic transaction wrapper; `supabase/migrations/0001_init.sql` is a written-but-never-run boundary | All P1 logic is in the service layer on the JSON store (this is what the tests exercise). **`supabase/migrations/0002_p1.sql` (+ `.down.sql`)** adds the same tables, RLS policies, indexes, PostGIS `location` columns, triggers, `cancel_reservation()` and `process_p1_jobs()` (pg_cron). It has NOT been run against a database (same status as 0001). |
| Expo Push | Web app, no mobile client | `lib/notify.ts` `sendNotification()` writes the `notifications` row and, only if `EXPO_PUSH_ENABLED=true`, posts to the Expo push API for tokens stored in `pushTokens` (`POST/DELETE /api/push-tokens`). SMS: `SMS_ENABLED=true` + `SMS_WEBHOOK_URL`. |
| pg_cron | `sweepTx()` runs before every write and every 5 s from the SSE stream | New jobs live in `lib/jobs.ts` and run inside that same sweep (idempotent). SQL equivalent is in 0002. |
| A translation/strings file | None existed | `lib/strings.ts` holds all new user-facing strings. P0 copy was left where it was. |
| "Chart library already in the repo" | None | Dependency-free SVG charts in `components/charts.tsx` (with an accessible table fallback). |
| Razorpay refunds (test mode) | `refundRazorpayPayment()` existed | Customer, vendor and admin refunds create a refund row; the demo adapter settles immediately; Razorpay test mode stays `Refund Pending` until the refund API call succeeds (`executeRefund`). Not exercised: no test keys here. |

## Deviations and small choices (all the smallest sensible option)
1. **Migration constraint changes.** 0002 relaxes `donation_batches.listing_id unique` to unique `(listing_id, origin)` (no-show units become a second batch) and `min_discount_30` to apply only when not donation-only. No column was dropped or renamed (`notifications.sent_at` is a generated copy of `at`). The `.down.sql` restores both constraints; enum value `No-show` cannot be removed from a Postgres enum and is left in place.
2. **Pay at pickup needs 3 completed pickups (A8)**, which broke two P0 test setups that created brand-new customers. Fixture customers in `tests/services.test.ts` now get 3 historical pickups, and `scripts/http-tests.ts` uses online holds for its 50-way load (same stock lock, 5-minute hold). The rule itself (`RULES.PAY_AT_PICKUP_MIN_PICKUPS`) is enforced server-side.
3. **Surprise Bag.** The `surpriseBag` flag already existed. "Worth ₹X" is the listing's original price (no new field). The description is the hidden "contents"; allergens and diet are always shown (food-safety). After pickup the customer's order page reveals the description.
4. **Follow alerts within 10 km** use the location the app sent when the customer followed (the listing's outlet location in the demo UI). A follower with no known location is still notified rather than silently dropped.
5. **Reviews** are tied to a reservation (unique) and shown with the reviewer's first name only. The vendor `ratingDemo` field is still read as a fallback label but real ratings take over once they exist.
6. **Payouts** settle only online (test-mode) payments for collected orders: gross, 10% platform fee (from `settings.platformFeeBps`, one row), net. Pay-at-pickup cash is shown in a separate column and never netted.
7. **Impact events.** The existing `impact` array was extended with `type`, `listingId`, `qty`, `kgEst`, `co2eKg`, `customerId`, `rupeesSaved`. Units that expire unsold, or no-show units nobody can donate, are written as `source: "expired"` / `type: "wasted"` and are excluded from the city "meals rescued" total. The city dashboard gained kg and CO₂e tiles.
8. **Donation-only listings** skip the 30% rule, are hidden from customers, and create their batch immediately (collect-by = pickup window end, capped by the safe-until time).
9. **No-show units** are offered to charity only when the listing had "Donate the rest" on and is still safe; otherwise they are recorded as wasted. Collect-by follows the existing policy (window end + 2 h, capped by safe-until).
10. **Suspension by admin** sets the owner's `suspendedUntil` (1 year) and hides the vendor from customers; the check reads the stored profile, not the request's snapshot.
11. **Uploads** (report photos, onboarding documents, logos) are stored privately under `data/uploads` (git-ignored) and served only to the uploader and admins. This replaces the P0 "file names only" behaviour; older seed entries still show as names.
12. **Vendor logo** is optional to submit (so P0 applications and tests keep working) but counts toward profile completeness, which shows on the vendor dashboard.
13. **Rate limit** on `POST /api/reservations`: 8 per minute per signed-in customer, in memory (single process). Use Redis or the edge in production.
14. **Volunteer link**: random 24-byte token stored on the batch, stops working at collect-by or when the batch is collected or the claim is released, and the endpoint is rate-limited.

## Not done / limits
- `0002_p1.sql` has not been executed (no database here), so the RLS policies are reviewed but not run. The "vendor cannot read another vendor's orders" integration test therefore checks the service-layer equivalent (and the `vendor_order_board` view definition), not Postgres RLS itself.
- Expo push and SMS delivery were not exercised against real services.
- Existing P0 action buttons that were already 40 px (Edit, Pause, Duplicate on the vendor table) were left alone; every P1 button is at least 44 px.
- I did not run an automated contrast checker. New text uses the existing palette pairs (tomato/burgundy on cream or white, white on tomato).
- Admin "suspend account" hides the vendor and blocks publishing but does not auto-cancel their open orders.
