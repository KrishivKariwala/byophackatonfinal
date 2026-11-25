# Security review (issue #25)

Reviewed on 25 Nov 2026 against the demo build. Method: reading the code for sign-in, sessions, uploads, webhooks, rate limits and every API route;
the automated route sweep (`npm run security:check`, 126 calls); `npm audit --omit=dev`. This is a self-review, not a penetration test by an outside
party. Re-run the sweep after any change to the API.

## What the sweep proves
- All 66 API routes were called as a visitor with no session, and every protected one refused (4xx, never 2xx and never a crash). The routes that are
  public on purpose are listed with the reason in `scripts/security-check.ts` (the public feed, sign-in and sign-up, the two signed gateway
  webhooks, the public certificate check, the volunteer link).
- A signed-in **customer** was refused on every `admin/`, `vendor/` and `ngo/` route.
- A write request carrying an `Origin` header from another website is refused (403), even with a valid session.
- With `DATA_MODE=production` the demo sign-in, the Skip button, the demo clock and reset, and the simulated payment are all refused (403).
- Roles come from the stored profile that the signed cookie points to, never from the request. Prices come from the listing in the store: the reserve call
  carries only a listing, a quantity, a payment method and whether to use credit.

## Findings

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | The simulated payment route (`/api/checkout/{hold}/demo-pay`) was not tied to demo mode: with no payment keys set, a production deployment would have let anyone "pay" for free | High | **Fixed**: refused outside demo mode; covered by the production-mode part of the sweep |
| 2 | Demo shortcuts are **on** when `DATA_MODE` is not set (anyone can sign in as any demo persona, including admin, with no password) | Medium | Accepted for the demo deployment. **A real deployment must set `DATA_MODE=production`**; the sweep checks everything is refused then. Real sign-in is #15 |
| 3 | In demo mode, with no `SESSION_SECRET`, sessions are signed with a public fallback value | Medium | Accepted for the demo (anyone can already pick any persona). With `DATA_MODE=production` and no secret the server refuses to start signing sessions |
| 4 | Write requests from another site | Low | **Fixed**: cookie is `SameSite=Lax` and the middleware now also refuses a foreign `Origin` on writes (webhooks exempt: they are signed) |
| 5 | No security headers | Low | **Fixed**: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (camera and location for this site only) and HSTS on every response |
| 6 | No Content-Security-Policy | Medium | Open: needs per-request nonces for the two inline start-up scripts and the checkout script. Tracked in #42 |
| 7 | Rate limits (wrong one-time codes, reservations) are counted in one process's memory | Medium | Open: needs a shared store. Tracked in #41 |
| 8 | `npm audit`: PostCSS advisories inside Next.js 15 (1 high, 1 moderate) | Low here | Not exploitable: they concern a build step handling CSS from an untrusted source, and this app never processes visitor-supplied CSS. The fix needs Next.js 16 (breaking). Tracked in #43 |
| 9 | The referral device check is a cookie, so clearing cookies defeats it | Low | Accepted (the phone-number rule still holds); documented in `docs/P2_NOTES.md` |
| 10 | Uploads (report photos, documents, logos) are on local disk | Medium for production | Open: tracked in #21. Access is already limited to the uploader and admins, type and size are validated, and the file name is checked against path tricks |

## Checked and fine
- Session cookie: signed, `HttpOnly`, `SameSite=Lax`, `Secure` in production, 14 days.
- Pickup codes and QR tokens are stored hashed, single use, bound to the vendor and reservation.
- Webhooks verify a signature (Razorpay, and an HMAC for the delivery partner); both have tests.
- Only invite links of a fixed shape can be returned to after sign-in (no open redirect).
- No `dangerouslySetInnerHTML` except the two fixed start-up scripts in `app/layout.tsx`.
- No state change on a plain page view (`GET`) other than harmless lazy creation of a referral code.

## Still needed before a real launch
Real one-time-code sign-in (#15), a database with row-level security that has been run (#12 to #14), shared rate limits (#41), a Content-Security-Policy (#42),
private object storage (#21), and an outside security test.
