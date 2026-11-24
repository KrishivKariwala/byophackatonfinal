## Context
Handover scans require a connection. The brief asked for scans to queue for up to 10 minutes and sync later.

## Scope
- Queue scans locally when offline and sync on reconnect, keeping single-use and window rules authoritative on the server.

## Acceptance criteria
- [ ] A scan made offline completes after reconnect; a reused code is still refused.

## References
- docs/PRD.md (section 11)
- `app/v/scan`
