## Context
Feedback: "too many unnecessary buttons" and "I don't know what half these buttons do." The landing page and header are done, but the vendor dashboard still shows many action buttons per listing row and per section.

## Scope
- List every button on `/v` and `/v/listings/[id]` and decide the one primary action per row.
- Move secondary actions (Edit, Pause, Duplicate, Save as template, Repost, Cancel) into one "More" dropdown using the existing `Popover` pattern in `components/HeaderBar.tsx`.
- Add one-line hints or labels where an action is not self-explanatory.
- Keep every control at least 44 px and keyboard operable.

## Acceptance criteria
- [ ] No row shows more than one visible button plus a menu.
- [ ] All previous actions are still reachable.
- [ ] Works in English, Hindi and Kannada at 375 px width.
- [ ] Existing tests pass.

## References
- docs/PRD.md (sections 4.3, 11)
- `app/v/page.tsx`, `app/v/VendorClient.tsx`
