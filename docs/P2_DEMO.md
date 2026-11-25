# P2 demo checklist

Run once: `npm run seed` (fresh data, includes the P2 demo data), then `npm run dev`. Open the app and pick a side on the plate. Every side's sign-in has a **Skip, use demo {side}** button; to pick a specific person open `/signin?all=1` and click a persona (no password). Opening the app or refreshing any page starts you signed out, so sign in again after a refresh; clicking the logo inside the app keeps you signed in. To change person, use **Account → Switch role**, which signs you out and shows the list of demo personas.
The **Demo clock** (Account menu → **Demo tools** → +15 min / +1 h; **Real time** appears once the clock has moved) moves time forward, which drives auto-markdown steps, priority windows, ETAs going stale, credit expiry, the mock delivery rider and the monthly certificate job.
The **language** menu (the small globe with EN / HI / KN at the top corner, also on the main screen) switches English / हिन्दी / ಕನ್ನಡ on every screen with one click; the menu closes as soon as you pick one. The first visit uses the device language.

Personas: **Priya** (customer, ₹60 credit, has a code), **Sana / Arjun** (customers with pickups), **Ravi** (owner of Crumb & Co., 2 outlets), **Mala** (Crumb & Co. manager), **Imran** (staff, Koramangala outlet), **Latha** (staff, Indiranagar outlet), **Anita** (owner of Masala Lane), **Joseph** (approved charity), **Meera** (admin).

Every feature is behind a switch: Admin → **Settings** → *Feature flags*. Turn one off and its screens and rules disappear without a deploy.

## 1. Referral credits
1. As **Priya** open **Credit and referrals** (`/c/referrals`): balance **₹60** (₹100 earned, ₹40 used), her code and share link, the 5 friends she referred in various states, the credit ledger.
2. Use **Account → Switch role** (or just refresh) to sign out, open her link `/signin?role=customer&ref=<code>` (or paste the code), sign up as a new customer. Nothing is paid yet.
3. Order and pick up that customer's first order (vendor `/v/scan`): both wallets get ₹50 (notifications "credit earned").
4. As a customer with credit, open a listing: **Use ₹X credit** (at most 50% of the order). The total shows cash due. Cancel it for free: the credit comes back; cancel inside the 30-minute window: credit is forfeited like the cash.
5. Abuse checks to try: own code, same phone, same device, a second code, a 12th referral in a month. Each is refused with a clear reason.
6. Advance the clock 90+ days in steps of 1 day: unused credit expires (ledger shows "Expired").

## 2. Languages
Switch to हिन्दी or ಕನ್ನಡ with the globe menu at the top corner. Menus, forms and the new P2 screens change; dates, times and ₹ amounts follow the language. A key with no translation falls back to English per key. `npm run i18n:check` fails on any missing key. Server-written notification text and PDFs stay English (see P2_NOTES).

## 3. "I'm on my way" (live ETA)
As a customer with an order whose pickup opens within 90 minutes: order page → **I'm on my way**. Use **Estimate from my location** (the phone works out the minutes, only the minutes are sent, only while the page is open) or tap 5/10/15/20/30 min. As the vendor, the Live orders card shows first name and "On the way · ~N min"; after 5 minutes without updates it greys to "last updated N min ago". The request body is rejected if it carries anything but minutes.

## 4. Auto-markdown
As **Ravi**: *Evening Bread Box* already ran one step (listed ₹210, now ₹180) and has one more at +45 min (70% off). `/v/new` → set both prices and times → **Auto-markdown schedule** → **Use suggested schedule** (uses the P1 price function) or add up to 3 steps by hand. Rules shown inline: 30–80% off, in time order, each deeper than the last, before pickup end. Advance the clock: the price drops, followers within 10 km get "Price drop", existing orders keep their price.

## 5. Impact certificate
As **Ravi**: `/v/analytics` → **Impact certificates** → pick a month → **Generate** → **Download PDF** (verification ID + QR) and **Public page** (`/verify/SAP-XXXX-XXXX-XXXX`, no login, totals only). The current month is marked "month to date" and keeps the same ID when it is finalised. On the 1st of each month the job issues last month's certificates and notifies owners.

## 6. Multi-outlet and staff
1. As **Ravi**: open the menu at the top left (it shows the name of the page you are on) and choose **Team** (`/v/team`). Crumb & Co. has two outlets (Koramangala, Indiranagar), a manager and two staff, plus one pending invite. Create an invite (phone or email) and copy the link; open it signed in as another vendor account to join. **Remove** takes effect on that person's next click.
2. The dashboard and Analytics have an **Outlet** switcher (All / each outlet); Analytics shows a per-outlet table plus the total.
3. As **Imran** (staff, Koramangala): only that outlet's orders appear; no Quick list, Analytics, Payouts or Team in the menu; Scan works only for that outlet's codes. As **Latha** the mirror image. As **Mala** (manager): both outlets, listings and analytics, no Payouts or outlet admin.
4. Payouts and outlet creation are owner-only; managers can invite staff, only the owner invites managers.

## 7. Charity priority window
As **Ravi** → Quick list → **Offer to charities first** → 30 min. Customers can't see or reserve it until the window ends (`/c` as Priya). As **Joseph** (`/n`): **Priority offers** shows it with a countdown; **Claim all** takes it free and it never goes public. If nobody claims, it appears for customers when the window ends and followers are notified then. The seed has one running: *Idli-Vada Combo Box*.

## 8. Distribution log
As Joseph → **My claims** → a collected donation → **Log distribution** (servings, people reached, centre, optional photos with a "no faces" reminder). Ravi's Donations panel shows "Where your donations went". The people-reached number appears on the impact certificate.

## 9. Donation receipts
As **Ravi** or **Joseph**: **Receipts** (`/v/receipts`, `/n/receipts`). Five seeded receipts with numbers like `SAP-DR-2026-000003`. Download one PDF or **Download all as zip** for a date range (PDFs + `index.csv`). Receipts for *Annapurna Community Kitchen* mention its 80G registration; the others say "Estimated value, not a tax document."

## 10. Delivery hand-off
As **Joseph** → a claimed batch → **Request a rider**. The mock rider moves Looking → Rider on the way (2 min) → Picked up (6) → Delivered (12) as you advance the clock; both sides are notified. Put `NORIDER` in an outlet address to see "No rider found", `FAILJOB` to see a failed booking; the claim stays either way. Real partners: `DELIVERY_PROVIDER=dunzo|porter` (stubs). Webhook: `POST /api/delivery/webhook` with `x-delivery-signature`.

## 11. Moderation
As **Meera** → **Moderation** (`/admin/moderation`): flagged items waiting: *Gulab Jamun* (keyword "stale"), *Chicken Biryani Tray* (3 open reports), a 1★ review (keywords), plus a hidden listing and a dismissed one with their history. Every action (hide, restore, edit, warn, suspend, dismiss) needs a reason, notifies the person affected, and is logged. Hide a listing and it leaves `/c` immediately; hide a review and the vendor's rating recalculates.

## 12. Platform settings
As **Meera** → **Settings**: change checkout hold time (2–15 min), free-cancel window, default radius, max active reservations, discount cap, referral credit, priority options, moderation keywords and the 12 feature flags. Out-of-range values are refused with the range. A change that touches live listings first shows a warning and needs **Apply anyway**. The change history below lists who changed what. Settings are cached for at most 60 seconds and the cache is cleared on every save.

## Verify everything
```bash
npm run typecheck && npm run lint && npm test      # includes the translation completeness check
npm run build && npm run test:e2e-http             # HTTP concurrency, realtime and negative checks
```
