# FairRide AI — Antigravity Build Pack

**Project:** PS2 — Intelligent Ride Matching and Dynamic Driver Allocation System  
**Pack version:** 1.0  
**Prepared:** 13 November 2026  
**Build target:** 24-hour hackathon prototype; judge-ready and technically defensible.

## Contents

| File | Purpose |
|---|---|
| `GEMINI.md` | Project-level instructions for Antigravity / Gemini coding agent |
| `DESIGN.md` | Root visual direction and anti-template quality bar |
| `FRONTEND.md` | Frontend architecture and React implementation rules |
| `AGENTS.md` | Cross-agent engineering rules |
| `docs/01_PRODUCT_REQUIREMENTS.md` | Detailed PRD and acceptance criteria |
| `docs/02_PS2_TRACEABILITY.md` | PS2 requirements mapped to implementation evidence |
| `docs/03_ARCHITECTURE.md` | Application architecture and boundaries |
| `docs/04_DESIGN_SYSTEM.md` | Visual identity and anti-template design rules |
| `docs/05_UX_SCREEN_SPECIFICATION.md` | Routes, layouts, interactions, states and responsiveness |
| `docs/06_DATABASE_AND_RLS.md` | Database model, constraints, indexes and RLS plan |
| `docs/07_API_AND_STATE_CONTRACTS.md` | API, data contracts and ride state machine |
| `docs/08_ALGORITHMS_AND_DEMAND_MODEL.md` | Dispatch, trained demand model, surge, pooling and simulation |
| `docs/09_SECURITY_PRIVACY_AND_FAILURES.md` | Security, privacy, authorization and failure handling |
| `docs/10_TESTING_AND_DEFINITION_OF_DONE.md` | Test strategy and completion gates |
| `docs/11_DEMO_AND_SEED_DATA.md` | Deterministic demo scenario and judge walkthrough |
| `docs/12_24_HOUR_EXECUTION_PLAN.md` | 24-hour phase plan and priorities |
| `docs/13_DEPLOYMENT_AND_ENVIRONMENT.md` | Setup, environment and deployment |
| `docs/14_DECISIONS_AND_LIMITATIONS.md` | Decisions, assumptions and limitations |
| `docs/15_ANTIGRAVITY_MASTER_PROMPT.md` | Master coding-agent prompt |
| `ANTIGRAVITY_ACTIVATION_PROMPT.md` | Activation controller and copy-paste phase execution prompts |
| `docs/16_REFERENCES.md` | Official framework, database, map and ML references |
| `prompts/00`–`09` | Separate step-by-step phase prompts |

## Recommended reading order

1. `GEMINI.md`, `AGENTS.md`, `README.md`
2. `docs/01_PRODUCT_REQUIREMENTS.md`, `docs/02_PS2_TRACEABILITY.md`, `docs/03_ARCHITECTURE.md`
3. `DESIGN.md`, `FRONTEND.md`, `docs/04_DESIGN_SYSTEM.md`, `docs/05_UX_SCREEN_SPECIFICATION.md`
4. `docs/06_DATABASE_AND_RLS.md`, `docs/07_API_AND_STATE_CONTRACTS.md`, `docs/08_ALGORITHMS_AND_DEMAND_MODEL.md`
5. `docs/09_SECURITY_PRIVACY_AND_FAILURES.md` through `docs/16_REFERENCES.md`
6. `ANTIGRAVITY_ACTIVATION_PROMPT.md` for the activation workflow; then run `prompts/00` through `prompts/09` sequentially. The activation file includes copy-paste wrappers for each phase.
7. Use `docs/15_ANTIGRAVITY_MASTER_PROMPT.md` as the detailed project-specific master specification.

## Selected stack

The PS2 brief lists alternatives. Use one compatible combination—not every alternative at once:

- **Frontend:** React + Next.js 16 App Router + TypeScript.
- **Backend:** Node.js runtime using Next.js Route Handlers.
- **Database:** PostgreSQL managed by Supabase.
- **Authentication:** Supabase Auth with server-side cookie handling.
- **Maps:** OpenStreetMap tiles with Leaflet / React-Leaflet.
- **Charts:** Recharts; **validation:** Zod.
- **Testing:** Vitest for unit tests; Playwright for core browser flows where time permits.
- **Demand model:** Python + scikit-learn Gradient Boosting trained on generated historical zone/hour demand; export metrics and forecast rows as JSON consumed by Node.
- **Deployment:** Vercel for Next.js + Supabase for Postgres/Auth.

Angular/Vue, Django/Spring Boot and MySQL/MongoDB are alternatives in PS2, not additional dependencies. Mixing them would add integration risk without improving compliance.

## Product truth

FairRide AI is a **simulation-backed academic prototype**, not a commercial ride-hailing service. Driver coordinates, demand history, forecast outputs, fares and speed assumptions must be labelled simulated/estimated. Do not claim real drivers, live traffic, live navigation, real payments or production-grade dispatch.

## Read and build in this order

1. Read `GEMINI.md` and `AGENTS.md`.
2. Read PRD, PS2 traceability and architecture.
3. Read design system and screen specification before building UI.
4. Read database/API/state contracts before persistence.
5. Read algorithms before dispatch logic.
6. Execute prompts `00` through `09` sequentially. Do not implement advanced pages before the core ride lifecycle works.

**Non-negotiable order:** core ride lifecycle → map/location → deterministic matching → fairness/explainability → trained demand forecasting → zone pricing/repositioning → pooling → reassignment → simulation comparison → admin analytics → polish/deploy.

A beautiful dashboard with mock buttons is not a completed project. Target a smaller, tested end-to-end system with explicit simulation boundaries.
