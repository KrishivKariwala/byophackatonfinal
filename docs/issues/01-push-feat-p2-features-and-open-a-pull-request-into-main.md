## Context
GitHub `main` currently holds P0 + P1 only. All 12 P2 features (referrals, languages, live ETA, auto-markdown, impact certificate, multi-outlet and staff, priority window, distribution log, receipts, delivery hand-off, moderation, platform settings) and the UX pass exist only on the local branch `feat/p2-features`.

## Scope
- Push `feat/p2-features` to this repository.
- Open a PR into `main` with a description that lists the 12 feature flags and links `docs/P2_DEMO.md` and `docs/P2_NOTES.md`.
- Make sure skill folders and local tooling are NOT in the PR (`.agents`, `skills/`, `creative-skills/`, `data/skills`, `skills-lock.json`, dot-directories).

## Acceptance criteria
- [ ] PR is open and CI-clean (`npm run typecheck`, `npm run lint`, `npm test`).
- [ ] Diff contains no skill or tooling folders.
- [ ] `docs/PRD.md` is included.

## References
- docs/PRD.md (section 12, Release history)
- `docs/P2_NOTES.md`
