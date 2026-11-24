## Context
The original brief included preferred NGOs getting first refusal for 10 minutes, NGOs setting how many meals they can take tonight, and recurring daily collection from a specific vendor. None of these are in the build.

## Scope
- Vendor can mark preferred NGOs; a batch is offered to them first for a set time, then to all eligible NGOs.
- NGOs set tonight's capacity; feed hides or flags batches that exceed it.
- NGO and vendor can agree a recurring collection.

## Acceptance criteria
- [ ] Each is behind a feature flag and has tests, including the single-winner claim rule.
- [ ] Docs updated.

## References
- `reference/original-product-requirements.txt` (FR-C2, charity P1)
- docs/PRD.md (section 11)
