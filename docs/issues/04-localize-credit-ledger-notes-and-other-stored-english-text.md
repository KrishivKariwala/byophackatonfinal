## Context
Credit-ledger rows store English prose ("referral reward", "referral welcome credit", "used on a past order") in `creditLedger.note`, so the referrals page shows English in Hindi and Kannada.

## Scope
- Store a key + variables for new ledger entries (the way notifications store `key` and `vars`) and translate on display.
- Map the existing seeded notes to keys in `lib/seed-p2.ts` and in the display layer so older rows render localized too.
- Review other stored free text that the app itself writes (audit-log summaries visible to users, system notes) and do the same where the visitor sees it.

## Acceptance criteria
- [ ] `/c/referrals` shows no English ledger text in Hindi and Kannada.
- [ ] Existing demo data still displays correctly.
- [ ] Tests cover earning, spending, restoring and expiring entries.

## References
- `lib/p2/credits.ts`
- `lib/seed-p2.ts`
- docs/PRD.md (section 6.6)
