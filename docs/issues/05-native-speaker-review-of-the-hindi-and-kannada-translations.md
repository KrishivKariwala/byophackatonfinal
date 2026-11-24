## Context
The 1,440 strings in `hi.json` and `kn.json` are an unreviewed first pass. `TRANSLATION_REVIEW.md` lists them side by side with English.

## Scope
- Have a Hindi and a Kannada speaker review every string for correctness, tone and fit in the UI (button width, headings).
- Record the reviewer, date and changes in `TRANSLATION_REVIEW.md`.
- Check long Hindi and Kannada strings in the landing plate, headers and buttons for overflow.

## Acceptance criteria
- [ ] Both languages signed off by a named reviewer.
- [ ] No overflow or clipped text on mobile (375 px) and desktop.
- [ ] `npm run i18n:check` still passes.

## References
- `TRANSLATION_REVIEW.md`
- docs/PRD.md (section 4.4)
