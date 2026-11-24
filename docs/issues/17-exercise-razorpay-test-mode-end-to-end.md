## Context
The Razorpay code (server order, signature verification, idempotent webhook, refunds) is written but was never run because no test keys were available.

## Scope
- Set the four `RAZORPAY_*` variables with `rzp_test_` keys.
- Run a full reserve → pay → pickup flow, a late callback after hold expiry (must refund and not revive the order), a cancel with refund, and a duplicate webhook.
- Add the results to `test-results/`.

## Acceptance criteria
- [ ] All four scenarios behave as in the demo adapter.
- [ ] Webhook signature failures are rejected.

## References
- `lib/payments.ts`
- `app/api/payments/webhook`
- docs/PRD.md (FR-R3)
