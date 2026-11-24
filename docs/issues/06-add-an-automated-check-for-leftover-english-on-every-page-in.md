## Context
Language leaks were found by manually fetching pages and scanning for Latin-script words. This should be a repeatable test so "the whole app changes" stays true.

## Scope
- Write a script (or Playwright test) that signs in as each demo persona, loads every screen with `sap_lang=hi` and `kn`, and reports Latin-script words that are not on an allow-list (brand name, demo business and person names, "Razorpay", "TEST", currency codes).
- Run it in CI or as `npm run i18n:scan`.

## Acceptance criteria
- [ ] The scan runs for customer, vendor, NGO and admin screens.
- [ ] Allow-list is small and documented.
- [ ] A new untranslated label fails the scan.

## References
- docs/PRD.md (section 4.4)
- `scripts/i18n-check.ts`
