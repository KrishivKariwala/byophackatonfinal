## Context
The foreground-only ETA watcher is tested logically but not on a device with real GPS.

## Scope
- Test "Estimate from my location" on iOS and Android browsers while walking.
- Confirm only minutes are sent and the vendor board greys after 5 minutes without updates.

## Acceptance criteria
- [ ] Works on both platforms; behaviour documented.

## References
- `lib/p2/eta.ts`
- docs/PRD.md (FR-P3)
