## Context
Staff invites only show a link to copy. Push (`EXPO_PUSH_ENABLED`) and SMS (`SMS_ENABLED`) are wired but off and untested.

## Scope
- Pick an SMS or email provider and send invite links.
- Test Expo push and SMS paths against the real services.
- Respect user language for the message text.

## Acceptance criteria
- [ ] An invited person receives the link.
- [ ] Push and SMS deliver for the notification types listed in PRD section 5.1.

## References
- `lib/notify.ts`
- `docs/P2_NOTES.md` (Not done, item 3)
