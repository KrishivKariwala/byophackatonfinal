## Context
The demo store is single-process (mutex + JSON file) and live updates use server-sent events. Production needs Postgres row locks and Supabase Realtime.

## Scope
- Implement a Supabase adapter behind `lib/services.ts` that calls the RPCs.
- Swap SSE for Supabase Realtime (or keep SSE fed by Realtime).
- Keep `DATA_MODE=demo` working for demos and tests.

## Acceptance criteria
- [ ] The 50-way concurrency test passes on the Supabase adapter (exactly 10 of 50 succeed).
- [ ] Stock changes reach other sessions in under 2 seconds.

## References
- docs/PRD.md (section 9)
- `lib/store.ts`, `lib/services.ts`
