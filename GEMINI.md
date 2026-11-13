# FairRide AI — Antigravity Project Instructions

You are the senior full-stack engineer implementing FairRide AI from the `docs/` contract. The supplied PS2 brief is authoritative. These files are requirements, not optional inspiration.

## Before changing code

1. Read `AGENTS.md` and the relevant `docs/*.md` files.
2. Inspect the current repository; preserve working code.
3. Report a concise implementation plan before editing.
4. Work in phases using `prompts/00` through `prompts/09`; pass each phase gate before continuing.
5. Never claim a feature works until verified.

## Product constraints

- Three roles: **Passenger**, **Driver**, **Administrator**.
- All five advanced PS2 modules are mandatory: (1) trained 30-minute-ahead demand forecasting on simulated 15-minute zone history with hour/day features, (2) shared zone intelligence for surge and repositioning, (3) multi-passenger pooling with route-order optimization, (4) multi-factor driver allocation/fairness, and (5) automatic reassignment/exception handling.
- Label demo data `SIMULATED`; keep demo fixtures separate from real user data.
- No real-money payment, live-traffic promise, fake GPS, unlabelled synthetic prediction or fabricated performance claims.
- If something cannot be completed, document it in `docs/14_DECISIONS_AND_LIMITATIONS.md` and report it.

## Stack contract

- React + Next.js 16 App Router + TypeScript.
- Node.js runtime in API Route Handlers (`export const runtime = 'nodejs'` where appropriate).
- Supabase PostgreSQL + Supabase Auth; use supported `@supabase/ssr` patterns.
- Leaflet / React-Leaflet with visible OpenStreetMap attribution.
- Recharts; Zod at API boundaries.
- Python + scikit-learn offline Gradient Boosting training script; train on 15-minute zone demand with hour/day features and a genuine 30-minute target horizon; export forecast data and evaluation metrics as documented JSON.
- Use the latest compatible stable package versions the environment supports; commit exactly one lockfile.

## Engineering rules

- Strict TypeScript; avoid `any`; use discriminated unions for ride states and typed API results.
- Keep domain algorithms pure and testable under `src/lib/algorithms/` or equivalent.
- Keep DB access behind server-only services/repositories. Never import server credentials into client components.
- Enforce authorization server-side for every privileged route. Hiding UI is not authorization.
- Enable RLS on all exposed tables. Never expose service-role secrets in browser code.
- Use transactions/database functions for multi-row state changes.
- Validate every ride transition centrally and record it in an append-only event log.
- Use deterministic seed data and fixed random seeds.
- Implement loading, empty, error, offline, permission-denied and stale-data states.
- No placeholder buttons. Each visible control must work, be disabled with an explanation, or not appear.
- No fake charts. Charts derive from persisted data or clearly labelled deterministic fixtures.
- Haversine + assumed-speed ETA is an estimate, not road navigation or live traffic.
- Use semantic HTML, keyboard navigation, visible focus, good contrast and usable touch targets.

## Design rules

Follow `docs/04_DESIGN_SYSTEM.md` and `docs/05_UX_SCREEN_SPECIFICATION.md`. Build a distinctive mobility-operations product, not a generated SaaS dashboard. Avoid purple/blue gradient meshes, glassmorphism, repeated generic three-card grids, card-in-card layouts, meaningless counters, fake steps, and repetitive fade/bounce animations. Prioritize map legibility, purposeful hierarchy, whitespace, typography and data provenance.

## Required phase exit report

At the end of each phase report: (1) files changed, (2) features completed, (3) commands run and actual results, (4) tests passed/failed/skipped, (5) known bugs/deviations, (6) exact next phase recommendation. Never mark an unexecuted test as passed.
