## Context
Report photos, onboarding documents, logos and distribution-log photos are stored on local disk under `data/uploads`.

## Scope
- Use a private Supabase Storage bucket with RLS: only the uploader and admins can read.
- Keep the same upload API and size and type validation.

## Acceptance criteria
- [ ] Files are stored in the bucket.
- [ ] A non-owner cannot fetch another user's file.

## References
- `app/api/uploads`
- docs/PRD.md (section 9)
