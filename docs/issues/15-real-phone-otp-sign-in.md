## Context
Sign-in uses a simulated code (`123456`). A real SMS provider should replace only the code check in `app/api/auth/signup/route.ts`; the account rules in `lib/auth.ts` stay.

## Scope
- Integrate an SMS OTP provider (e.g. Supabase Auth phone).
- Keep the rate limit on wrong codes (8 per 10 minutes per number).
- Keep demo Skip and the simulated code only when `DATA_MODE=demo`.

## Acceptance criteria
- [ ] A real number receives a code and can sign in.
- [ ] Simulated code and Skip are impossible when `DATA_MODE` is not `demo`.
- [ ] Existing auth tests still pass.

## References
- `lib/auth.ts`
- `app/api/auth/signup/route.ts`
- docs/PRD.md (section 4.2)
