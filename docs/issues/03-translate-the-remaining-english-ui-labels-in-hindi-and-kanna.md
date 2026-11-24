## Context
Switching language changes most of the app, but some UI-level labels still appear in English: neighbourhood filter chips (Koramangala, Indiranagar, HSR Layout, Jayanagar, Whitefield), category labels (Meal, Meals, Snacks, Desserts), "past" on the orders page, and the "Directions in Google Maps" link text.

## Scope
- Add catalog keys for neighbourhood names, categories and the orders "past" label in `lib/i18n/messages/{en,hi,kn}.json` and use `t()` in `app/c/Discover.tsx`, `app/c/orders`, `app/c/listing/[id]` and `app/c/orders/[id]`.
- Keep the stored value (the English id) separate from the displayed label so filters and the server keep working.
- Run `npm run i18n:check`.

## Acceptance criteria
- [ ] With `sap_lang=hi` and `kn`, none of the labels above render in English on `/c`, `/c/orders`, `/c/listing/[id]` and `/c/orders/[id]`.
- [ ] Filters still work after switching language.
- [ ] `npm test` passes.

## References
- docs/PRD.md (section 4.4)
- `lib/i18n/locales.ts`
