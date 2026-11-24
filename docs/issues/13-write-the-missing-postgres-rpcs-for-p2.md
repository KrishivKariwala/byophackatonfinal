## Context
`0003_p2.sql` has tables, RLS and `process_p2_jobs()` but not the logic for: spending and restoring referral credit, rewarding on pickup, issuing receipts, generating certificates, priority-window follow-up alerts and delivery sync. These exist only in the demo adapter.

## Scope
- Implement each as a security-definer RPC with the same rules and idempotency as the TypeScript version.
- Add parity tests that run the same scenarios against both adapters.

## Acceptance criteria
- [ ] Every P2 rule in PRD section 6 has a Postgres implementation.
- [ ] Parity tests pass.

## References
- `docs/P2_NOTES.md` (Not done, item 1)
- `lib/p2/*`
