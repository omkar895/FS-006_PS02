# Phase 08 — Integration, Testing, Accessibility and Design Polish

## Objective
Integrate all modules, remove placeholder interactions, verify security and state consistency, and bring the experience to a judge-ready standard.

## Read first
`docs/04_DESIGN_SYSTEM.md`, `docs/05_UX_SCREEN_SPECIFICATION.md`, `docs/09_SECURITY_PRIVACY_AND_FAILURES.md`, `docs/10_TESTING_AND_DEFINITION_OF_DONE.md`, `docs/14_DECISIONS_AND_LIMITATIONS.md`.

## Instructions
1. Walk through every role end-to-end: passenger, driver and admin. Fix broken routes, empty screens and disconnected state.
2. Search for placeholder links, buttons without handlers, TODOs, hardcoded demo results and `any` types. Replace, disable with reason, or document each one.
3. Verify a booking made by passenger is the same persisted record accepted by driver and visible to admin.
4. Verify ride status and events stay consistent after refresh, reconnect and failed requests.
5. Verify matching and simulation use the same normalized factor definitions and deterministic test inputs.
6. Run unit tests for algorithms/state transitions; integration tests for APIs/RLS; E2E tests for the core passenger-driver flow and key exception paths.
7. Test responsive layouts at representative mobile, tablet and desktop widths. Driver must remain usable one-handed on narrow screens.
8. Check keyboard navigation, focus visibility, labels, form errors, contrast, accessible names, reduced-motion behavior and non-color status communication.
9. Test empty/error/loading states, map tile failure, stale location, database unavailability, no eligible drivers and model artifact missing/outdated.
10. Verify charts have units, axes, timeframe and source labels; ensure no arbitrary visual metrics.
11. Check performance and console output. Remove debug logs and secrets.
12. Run lint, typecheck, unit tests, integration tests, E2E tests where configured and production build. Fix errors; do not suppress them to claim passing.

## Acceptance checks
All criteria in `docs/10_TESTING_AND_DEFINITION_OF_DONE.md` pass or are explicitly recorded as blocked with a reason. No critical or high-severity security, data integrity or ride-lifecycle defect remains.

## Report
Return a pass/fail matrix with command output, known defects, accessibility findings and screenshots/route checklist. Do not say “fully tested” if only a smoke test was performed.
