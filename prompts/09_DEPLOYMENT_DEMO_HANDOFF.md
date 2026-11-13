# Phase 09 — Deployment, Demo Readiness and Handoff

## Objective
Prepare a stable hosted prototype and a reproducible demonstration suitable for judges.

## Read first
`docs/11_DEMO_AND_SEED_DATA.md`, `docs/12_24_HOUR_EXECUTION_PLAN.md`, `docs/13_DEPLOYMENT_AND_ENVIRONMENT.md`, `docs/14_DECISIONS_AND_LIMITATIONS.md`.

## Instructions
1. Verify production build and configured Node.js version against the selected hosting platform.
2. Configure Supabase production project, migrations, Auth redirect URLs and RLS. Do not use local test credentials in production.
3. Set secrets only through deployment environment settings. Provide `.env.example` with placeholders and document which values are public vs server-only.
4. Deploy the Next.js app and verify authentication, role redirects, database reads/writes and realtime/polling behavior on the hosted URL.
5. Verify OSM attribution and map tile behavior. If usage grows beyond a small demo, state that a suitable tile provider or self-hosted tiles are required.
6. Ensure the model forecast artifact is present, versioned and loadable. If unavailable, fail visibly and explain the model training step; never silently replace it with fake forecasts.
7. Seed only synthetic/demo data. Create judge demo accounts through a safe documented procedure and rotate/remove them after the event if needed.
8. Prepare a 3–5 minute walkthrough using `docs/11_DEMO_AND_SEED_DATA.md`: create request, show ranking reason, reject/timeout and reassignment, complete ride, inspect demand zones, pooling and simulation comparison.
9. Prepare a short handoff: local setup, deployment URL, account roles (credentials shared separately, not committed), architecture, algorithm limits, known issues and demo reset steps.
10. Capture only truthful screenshots and metrics from the deployed build.

## Final acceptance checklist
- Production URL loads over HTTPS.
- Passenger, driver and admin role flows verified.
- RLS and server-side authorization verified in deployed environment.
- Core ride lifecycle works end-to-end.
- Five mandatory advanced modules are demonstrable and accurately described.
- Simulation comparisons are reproducible; no fabricated success metrics.
- Model and map limitations are disclosed.
- Setup, deployment and demo reset instructions are complete.

## Final report
Provide deployment URL, build commit/version, migration status, test status, demo account setup instructions (never expose secrets in public docs), known limitations and a truthful statement of what is live versus simulated.
