## Context
The NGO donation feed and the admin queues (approvals, reports, moderation, settings) have dense controls. Apply the same one-primary-action rule as the landing page.

## Scope
- Audit `/n`, `/admin/approvals`, `/admin/reports`, `/admin/moderation` and `/admin/settings`.
- Group secondary actions in dropdowns; keep destructive actions behind a reason prompt (already required).

## Acceptance criteria
- [ ] Each row or card has one primary action.
- [ ] All actions remain reachable.
- [ ] Admin settings stay range-validated with the warning flow unchanged.

## References
- docs/PRD.md (sections 5.3, 5.4)
