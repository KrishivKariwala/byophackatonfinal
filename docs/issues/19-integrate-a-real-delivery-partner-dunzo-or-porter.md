## Context
The delivery hand-off layer works with a mock rider. Dunzo and Porter providers are stubs that fail safely.

## Scope
- Implement one provider against its real API behind `DeliveryProvider`.
- Map the provider statuses and verify the HMAC-signed webhook.
- Keep sending business information only.

## Acceptance criteria
- [ ] A claimed batch can book a real rider in a sandbox.
- [ ] Statuses update both sides; a failed booking keeps the claim.

## References
- `lib/delivery/*`
- docs/PRD.md (section 5.3)
