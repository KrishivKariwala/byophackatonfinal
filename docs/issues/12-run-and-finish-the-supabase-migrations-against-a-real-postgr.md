## Context
`supabase/migrations/0001_init.sql`, `0002_p1.sql` and `0003_p2.sql` (+ down scripts) have never been executed. RLS policies are reviewed but untested.

## Scope
- Create a Supabase project and apply the migrations in order; fix any errors.
- Apply and test the down scripts.
- Write integration tests for RLS (a vendor cannot read another vendor's orders; staff cannot read another outlet's orders).

## Acceptance criteria
- [ ] All three migrations apply cleanly on an empty database and roll back.
- [ ] RLS tests pass against real Postgres.

## References
- `supabase/migrations/*`
- docs/PRD.md (sections 9, 11)
