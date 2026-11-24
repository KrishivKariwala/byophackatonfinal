## Context
The header redesign, sign-out-on-landing middleware, landing changes and server-text localization were verified with type check, lint, the i18n check and 208 unit tests, but the production build, the HTTP end-to-end script and the headless browser pass have not been re-run since.

## Scope
- Stop the dev server, `rm -rf .next`, `npm run build`, start, and run `npm run test:e2e-http` (50-way concurrency, realtime, negative checks).
- Re-run the browser end-to-end pass (6 contexts) and save logs under `test-results/`.
- Check `/` sets no stale session, and that a refresh on any page returns to `/` signed out.

## Acceptance criteria
- [ ] Build succeeds with no warnings that matter.
- [ ] HTTP script: 10 of 50 succeed, 40 refused, final stock 0, all negative checks pass.
- [ ] Browser pass logs committed or attached to the PR.

## References
- docs/PRD.md (section 10, Quality status)
- `scripts/http-tests.ts`
