# Repository Engineering Contract

This applies to every coding agent working in this repository.

## Source of truth

FairRide AI is an academic prototype for PS2: Intelligent Ride Matching and Dynamic Driver Allocation System. Detailed requirements live in `docs/`. If a request conflicts with the PRD, call out the conflict and prefer the PRD unless the project owner explicitly changes it.

## Mandatory reading

- `docs/01_PRODUCT_REQUIREMENTS.md`
- `docs/02_PS2_TRACEABILITY.md`
- `docs/03_ARCHITECTURE.md`
- `docs/04_DESIGN_SYSTEM.md`
- `docs/05_UX_SCREEN_SPECIFICATION.md`
- `docs/06_DATABASE_AND_RLS.md`
- `docs/07_API_AND_STATE_CONTRACTS.md`
- `docs/08_ALGORITHMS_AND_DEMAND_MODEL.md`
- `docs/10_TESTING_AND_DEFINITION_OF_DONE.md`

## Build discipline

1. Inspect before editing.
2. Plan by vertical slice, not by generating every page at once.
3. Implement one real end-to-end user journey before decorative polish.
4. Keep algorithms pure and unit-tested.
5. Preserve data consistency across passenger, driver and admin views.
6. Put schema changes in migrations; do not rely on manual dashboard edits.
7. Keep seed data deterministic and separate from user data.
8. Never commit `.env`, tokens, service keys or private data.
9. Re-run typecheck, lint, tests and production build after integration changes.
10. Update documentation when implementation decisions change.

## Definition of acceptable work

A page is not complete because it renders. Its primary action must work; data must be real or explicitly simulated; pending/error/empty states must exist; authorization must be enforced; and acceptance criteria must be tested.
