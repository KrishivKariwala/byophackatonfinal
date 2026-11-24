## Context
Several controls are demo-grade: the in-memory rate limit, the device cookie for referral checks, the dev-only default session secret and local-disk uploads.

## Scope
- Review session handling, role checks on every route, upload access, webhook signatures and rate limits.
- Move rate limits to Redis or the edge.
- Confirm `SESSION_SECRET` is mandatory in production.

## Acceptance criteria
- [ ] Review findings are fixed or tracked as separate issues.
- [ ] No route trusts a role or price from the client.

## References
- docs/PRD.md (sections 6.4, 9)
- `lib/ratelimit.ts`, `lib/session.ts`
