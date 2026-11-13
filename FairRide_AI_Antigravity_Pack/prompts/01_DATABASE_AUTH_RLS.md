# Phase 01 — Database, Authentication and Authorization

## Objective
Implement the relational schema, Supabase Auth integration and role-aware access control before ride workflows are added.

## Read first
`docs/01_PRODUCT_REQUIREMENTS.md`, `docs/02_PS2_TRACEABILITY.md`, `docs/06_DATABASE_AND_RLS.md`, `docs/09_SECURITY_PRIVACY_AND_FAILURES.md`, `docs/13_DEPLOYMENT_AND_ENVIRONMENT.md`.

## Instructions
1. Inspect the existing Supabase configuration and migrations. Do not assume tables exist.
2. Write versioned SQL migrations for profiles, driver profiles, zones, rides, ride events, demand forecasts, ride pools, pool members and simulation runs/results as specified in the database contract.
3. Use UUID primary keys, foreign keys, sensible check constraints, timestamps, indexes and uniqueness constraints. Add database constraints for valid ride statuses and one active assignment per driver where feasible.
4. Keep profile role values constrained to `passenger`, `driver`, `admin`. Do not allow a client to self-promote to admin. Create admins only through a documented trusted setup procedure.
5. Configure Supabase Auth using server-side cookie-aware clients. Separate browser-safe and server-only client modules.
6. Enable RLS on every table exposed through Supabase's Data API. Implement least-privilege policies: passengers access their own rides; drivers access assigned/offered rides and their own profile; admins have controlled operational access. Validate policies against the documented user-role matrix.
7. Keep privileged writes and matching operations on the server. Never ship the service-role key to the browser or prefix it with `NEXT_PUBLIC_`.
8. Add auth middleware/layout guards for user experience, but treat server-side authorization and RLS as the actual security boundary.
9. Add typed database access helpers and Zod validation for auth/profile inputs.
10. Add a safe seed procedure for zones and demo accounts. Do not seed real personal data or hardcode credentials into source files.

## Required failure handling
- Unauthenticated requests return 401.
- Authenticated users with the wrong role receive 403.
- A user cannot access another passenger's ride by guessing its ID.
- Driver profile location and availability are not writable by arbitrary users.
- Missing Supabase configuration produces an actionable setup message, not a misleading success page.

## Acceptance checks
- Fresh database can be migrated from zero.
- RLS is enabled for all relevant tables.
- Authenticated passenger, driver and admin access tests pass.
- Cross-user access tests fail as expected.
- No service-role secret appears in client bundles, source maps or browser environment.
- Migration and local setup instructions are documented.

## Report
Provide migration names, policy summary, tests run and a table of role/table permissions. Stop if the security boundary is not verified.
