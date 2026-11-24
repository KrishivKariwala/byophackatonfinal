## Context
Order cards and the live orders board carry several buttons and status chips at once. A first-time user should see one obvious next step.

## Scope
- On `/c/orders` and `/c/orders/[id]`: show the pickup pass as the single primary action; move cancel, report and rate into a menu or secondary section.
- On the vendor board: one primary button per card (Mark ready or Scan), others in a menu.

## Acceptance criteria
- [ ] Each card has one primary action.
- [ ] Cancel, report and rate remain available.
- [ ] No regression in tests or in the live-update behaviour.

## References
- docs/PRD.md (sections 5.1, 5.2)
- `app/c/orders`, `components/p1.tsx`
