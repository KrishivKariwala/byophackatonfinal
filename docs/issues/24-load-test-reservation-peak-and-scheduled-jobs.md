## Context
Targets: 1,500 concurrent users and a burst of 10 reservations per second. The new P2 jobs have no load test.

## Scope
- Write a load test for discover, reserve, pay and handover.
- Measure job runtime in the sweep with many listings, credits and certificates.

## Acceptance criteria
- [ ] No oversell under load.
- [ ] p95 for discover and availability pushes is recorded against the targets.

## References
- `docs/P2_NOTES.md` (Not done, item 6)
