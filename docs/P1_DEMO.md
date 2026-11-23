# P1 demo checklist

Run once: `npm run seed` (fresh data), then `./launch.sh` (or `npm run dev`). Sign in at `/signin` by clicking a persona (no password).
The header's **Demo clock** (+15 min / +1 h) fast-forwards time so windows, reminders, no-shows and escalations can be shown live.
Personas: **Sana** and **Arjun** (customers with 3+ pickups, so pay-at-pickup is open), **Kiran / Meghna / Dev** (customers with no pickups), **Ravi** (Crumb & Co. vendor), **Anita** (Masala Lane vendor), **Joseph** (approved NGO), **Meera** (admin).

## A. Customer
1. **Notifications** (A1). As Sana open `/c/listing/l_2`, reserve & pay (demo pay). Bell: "Order confirmed". Sign in as Ravi, **Mark ready** on the Live orders board; Sana's bell shows "ready for pickup". Use **+1 h** until a pickup window has ≤15 min left: "15 minutes left". Cancel an order for "order cancelled" and "refund issued". Push/SMS: set `EXPO_PUSH_ENABLED=true` or `SMS_ENABLED=true`; token storage via `POST /api/push-tokens`.
2. **Follow** (A2). Listing page → **Follow** (button + hint). `/c/following` lists followed restaurants. As Ravi publish a listing; Priya and Sana (followers within 10 km) get "just listed".
3. **Surprise Bag** (A3). `/c` shows the "Surprise Bag · Worth ₹420" badge on *Evening Bread Box*; the detail page hides contents but shows allergens and diet. As a vendor tick **Surprise Bag** in Quick list.
4. **Ratings** (A4). Pick up an order (vendor `/v/scan`), then open it as the customer: **Rate your order** (1–5 stars + text, once, within 48 h). Vendor profile and cards show the average. Admin → **Flagged** shows *Filter & Fold Café* (20 ratings, avg 2.5).
5. **Impact** (A5). `/c/impact` as Sana: meals, ₹ saved, kg, CO₂e, streak, badges. The city dashboard (`/admin`) has kg and CO₂e tiles.
6. **Cancel & refund** (A6). The policy shows before payment (listing page) and on the order page. Cancel before pickup start − 30 min: free, stock returns, online payment refunded. Use **+15 min** until inside 30 min of pickup: cancelling shows "not refunded". Vendor cancelling a listing always refunds.
7. **Report a problem** (A7). Order page or listing page → **Report a problem** (reason, photo, text). It appears in Admin → **Reports**.
8. **Pay at pickup** (A8). As Kiran (no pickups) the option is greyed with "unlocks after 3 completed pickups". As Sana it's open. Vendor toggle: `/v` → **Settings**.

## B. Vendor (sign in as Ravi)
1. **Templates** (B1). `/v` → listing row **Save as template**; **Templates** section → **Repost** (fresh times, confirms the safety declaration).
2. **Price suggestion** (B2). `/v/new` → enter an original price and a pickup end: a yellow box shows "Suggested ₹X" with **Apply**. Example: ₹200 with 2 h left and no history → ₹70. The 30% minimum is still enforced; you can override.
3. **Mark Ready** (B3). Live orders board; also `POST /api/listings/:id/mark-ready`.
4. **Analytics** (B4). `/v/analytics` with 7/30/90-day filters and charts.
5. **Payouts** (B5). `/v/payouts`: daily gross, 10% fee, net.
6. **Donation-only** (B6). Quick list → **Donation-only**: no price, never shown to customers, batch appears for NGOs at once.

## C. Charity (sign in as Joseph)
1. **Schedule & volunteers** (C1). `/n` → claim a batch → **Pickup & volunteer** form. Ravi's Donations panel shows "Volunteer coming: …".
2. **Volunteer link** (C2). Copy the link from the form and open it in a private window: address, vendor phone, time, pickup code, no login. After the deadline (+1 h clock) it says expired.
3. **Escalation** (C3). Create a donate-the-rest listing, +1 h past its end, then +1 h again: unclaimed batch notifies approved NGOs within 10 km, once.
4. **New donation alerts** (C4). NGOs whose service area covers the outlet are notified as soon as a batch appears.

## D. Trust & safety
1. **No-show** (D1). Reserve (pay at pickup as Sana), don't collect, fast-forward past pickup end + 15 min: order becomes **No-show**, units go to a charity batch. Repeat for 3 orders in 30 days: reservations are paused 7 days with a clear message.
2. **Fraud controls** (D2). A 4th active reservation, or 6 units, is refused (vendors can raise the unit cap in Settings). Reserve calls are rate-limited (8 per minute).
3. **Verified badge** (D3). On cards, listing pages, vendor dashboard and the NGO feed.
4. **Profile completeness** (D4). `/v` banner lists what's missing (Logo for Ravi); onboarding takes a logo and real document uploads.
5. **High-risk limit** (D5). In Quick list set **Food risk tag** to Raw and a window over 2 h: refused.

## E. Admin (sign in as Meera)
1. **Approvals** (E1). `/admin/approvals`: 2 pending vendors + 1 pending NGO; open the document viewer; reject needs a reason; the applicant gets a notification.
2. **Reports & disputes** (E2). `/admin/reports`: 3 open reports; actions Dismiss / Warn / Hide listing / Suspend account / Refund order. Each is logged with who and when.
3. **Flagged** (E3). `/admin/flagged`: low-rated vendors and repeat no-show customers.

## Verify everything
```bash
npm run typecheck && npm run lint && npm test      # 66 tests
npm run build && npm run test:e2e-http             # 50-way HTTP concurrency, realtime, negative checks
```
