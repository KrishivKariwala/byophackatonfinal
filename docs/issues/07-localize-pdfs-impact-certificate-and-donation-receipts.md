## Context
Certificates and receipts are English only because the built-in PDF fonts have no Hindi or Kannada glyphs.

## Scope
- Embed Noto Sans Devanagari and Noto Sans Kannada (or the official brand fonts if licensed) in `lib/pdf.ts`.
- Translate the PDF text through the same catalog.
- Keep the verification ID and number formats unchanged.

## Acceptance criteria
- [ ] Certificate and receipt PDFs render correctly in all three languages, including ₹ amounts and dates.
- [ ] Public `/verify/[id]` page unchanged.

## References
- `lib/pdf.ts`
- `docs/P2_NOTES.md` (PDFs row)
