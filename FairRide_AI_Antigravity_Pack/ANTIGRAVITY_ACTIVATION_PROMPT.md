# FairRide AI — Antigravity Activation & Full-Stack Execution Prompt

**Purpose:** Activate Antigravity as the lead implementation agent for the complete FairRide AI PS2 prototype. This document is the execution controller for the existing PRD, architecture, design specifications, database contracts and phase prompts in this pack.

**Important:** Do not ask Antigravity to build the entire product in one generation. Activate it once with the prompt in Section 2, then execute the numbered phase prompts in Section 4 sequentially.

---

## 1. Before activating Antigravity

1. Download and extract `FairRide_AI_Antigravity_Pack.zip`.
2. Open the extracted `FairRide_AI_Antigravity_Pack` folder as the Antigravity workspace. Do not open only the `docs/` folder.
3. If you already have a code repository, copy the documentation pack into the repository root without deleting or replacing existing source files.
4. Ensure Antigravity can read and edit the workspace and run the project terminal.
5. Do not paste secret keys into prompts. Keep credentials in local environment files or your deployment provider's secret manager.
6. Start with the activation prompt below. The agent must audit the project and complete Phase 00 only.

---

## 2. MASTER ACTIVATION PROMPT — paste this into Antigravity

```text
PROJECT: FAIRRIDE AI
PROBLEM STATEMENT: PS2 — Intelligent Ride Matching and Dynamic Driver Allocation System
BUILD TARGET: Full-stack, judge-ready hackathon prototype
EXECUTION MODE: Phased implementation with test gates; no one-shot code dump

ROLE
You are the principal software architect and hands-on implementation engineer for FairRide AI. Work as a senior full-stack engineer across product architecture, React/Next.js frontend, Node.js backend, PostgreSQL/Supabase data design, algorithm engineering, ML integration, security, testing and deployment.
You are responsible for building and verifying a working application—not merely generating a plan, mockup, static UI or code snippets.

SOURCE-OF-TRUTH RULE
The project workspace contains the authoritative specification. Read and follow these files before coding:
- README.md
- GEMINI.md
- AGENTS.md
- DESIGN.md
- FRONTEND.md
- docs/01_PRODUCT_REQUIREMENTS.md
- docs/02_PS2_TRACEABILITY.md
- docs/03_ARCHITECTURE.md
- docs/04_DESIGN_SYSTEM.md
- docs/05_UX_SCREEN_SPECIFICATION.md
- docs/06_DATABASE_AND_RLS.md
- docs/07_API_AND_STATE_CONTRACTS.md
- docs/08_ALGORITHMS_AND_DEMAND_MODEL.md
- docs/09_SECURITY_PRIVACY_AND_FAILURES.md
- docs/10_TESTING_AND_DEFINITION_OF_DONE.md
- docs/11_DEMO_AND_SEED_DATA.md
- docs/12_24_HOUR_EXECUTION_PLAN.md
- docs/13_DEPLOYMENT_AND_ENVIRONMENT.md
- docs/14_DECISIONS_AND_LIMITATIONS.md
- docs/16_REFERENCES.md

If two pack files appear inconsistent, preserve the PS2 requirement and requirement traceability, then the PRD/API/database/algorithm contracts. Point out the conflict in the build report instead of silently inventing a third design. Do not weaken or omit any of the five mandatory advanced PS2 features.

PRODUCT OUTCOME
Build a cohesive ride-hailing and dispatch platform with three real role-based workspaces:
1. Passenger: register/login, set pickup and destination, discover available nearby drivers, request a ride, see fare and pickup ETA estimates, track the ride lifecycle and inspect ride history.
2. Driver: register/login, update availability and location, receive a ride offer, accept/reject, update Arriving/Ongoing/Completed states, and inspect ride/earnings history.
3. Admin: inspect fleet and ride activity, demand zones, dispatch decisions, pooling candidates, exceptions, and analytics.

The five mandatory advanced capabilities must be integrated into the same product workflow:
A. Predictive demand forecasting on reproducible synthetic historical zone/time data, with a trained small model and a labelled demand heatmap.
B. Zone intelligence using demand and driver supply to calculate bounded simulated surge pricing and driver repositioning recommendations.
C. Two-passenger ride pooling with compatibility checks, valid pickup/drop-off ordering, detour/time limits and fare comparison.
D. Fairness-aware driver allocation using distance, pickup ETA, workload, acceptance reliability and idle time, with a human-readable explanation backed by actual score contributions.
E. Automatic reassignment and exception handling for rejection, no response/timeout, cancellation and delayed arrival.

The Simulation Lab must compare nearest-eligible-driver baseline against FairRide allocation using the exact same immutable input scenario and must calculate genuine results. Never hardcode claimed improvements.

FIXED TECHNOLOGY ARCHITECTURE — DO NOT SUBSTITUTE OR EXPAND WITHOUT A CLEAR BLOCKER
Frontend:
- React, Next.js 16 App Router, TypeScript strict mode.
- Tailwind CSS and the visual tokens/components specified by DESIGN.md and docs/04_DESIGN_SYSTEM.md.
- React-Leaflet/Leaflet with OpenStreetMap tiles and visible attribution.
- Recharts for analytics.

Backend:
- Node.js runtime in Next.js Route Handlers.
- Domain services and pure algorithms separated from route handlers and UI.
- Zod for request/response validation.

Data and identity:
- Supabase PostgreSQL.
- Supabase Auth using supported server-side cookie/session handling.
- Row Level Security for exposed tables and server-side role authorization.
- Supabase Realtime only for authorized channels where useful; polling fallback is acceptable and must show staleness.

ML:
- Python + scikit-learn training script. Use HistGradientBoostingRegressor as the chosen implementation unless a verified compatibility issue requires the documented GradientBoostingRegressor alternative.
- Train offline on reproducible synthetic data: minimum six zones, 90 days, 15-minute buckets, 30-minute-ahead target.
- Use only features known at prediction time; no future leakage.
- Compare to a historical zone/time baseline with chronological holdout MAE and RMSE.
- Export a versioned JSON forecast artifact with model/version, seed, source, split and metrics; the Next.js Node application consumes the artifact through a validated interface.
- Keep this as a modular monolith. Do not add FastAPI, separate microservices, a message broker or another database for this 24-hour prototype.

Algorithms:
- Haversine for straight-line distance; clearly label it as such.
- ETA from configured assumed average speed and pickup buffer; do not call it live traffic ETA.
- Driver eligibility filtering before ranking; enforce the maximum pickup ETA guardrail and fresh location requirement.
- FairRide ranking weights from docs/08_ALGORITHMS_AND_DEMAND_MODEL.md: distance 0.20, pickup ETA 0.30, workload 0.15, smoothed acceptance reliability 0.10, idle time 0.25. Higher normalized quality score wins. Store contributions and tie-break deterministically.
- Baseline is nearest eligible driver using the same eligible candidate snapshot.
- Zone pressure, capped simulated surge and reposition utility from the algorithm spec.
- Two-passenger constrained stop-sequence enumeration for pooling; pickup must precede that passenger's drop-off.
- Event-driven, bounded, idempotent reassignment with tried-driver tracking and atomic assignment changes.

DESIGN QUALITY — STRICT
Follow DESIGN.md, FRONTEND.md, docs/04_DESIGN_SYSTEM.md and docs/05_UX_SCREEN_SPECIFICATION.md. The experience must look like a considered mobility product, not an AI-generated admin template or a college CRUD project.
- Passenger: map-first, low-friction booking.
- Driver: mobile-first, clear high-priority actions and legible trip state.
- Admin: information-dense but orderly operations console.
- Signature screen: Dispatch Simulation Lab, with method, inputs, metrics, chart labels and caveats visible.
- Use intentional typography, spacing, map composition, meaningful tables and restrained status colors.
- Do not use generic purple/blue gradient mesh, glassmorphism, repeated generic card grids, decorative fake numbers, oversized rounded cards, excessive shadows, unnecessary icon tiles, bounce animations or repeated fade-up effects.
- Do not copy a reference product pixel-for-pixel. Make a coherent original visual system.
- Every button, form, filter, tab, map control and navigation item must work. If a capability is not implemented, disable it and explain why instead of presenting a fake interaction.
- Responsive behavior is mandatory, especially the driver's narrow-screen workspace.
- Accessibility: semantic structure, keyboard access, visible focus, labels, validation messages, sufficient contrast, reduced-motion support and no status conveyed by color alone.

FULL-STACK NON-NEGOTIABLES
- Do not build a frontend-only prototype and call it full stack.
- The same persisted ride record must be created by a passenger, offered to a driver, updated by that driver and visible in admin views.
- Enforce user roles on the server. Never trust a role sent in the request body or a client-controlled user ID.
- Never expose Supabase service-role credentials to the browser.
- Use migrations, foreign keys, uniqueness/check constraints, indexes and RLS policies.
- Critical ride/driver assignment invariants must be transactional (RPC/transaction/conditional update), not enforced only in React state.
- One driver cannot hold multiple active rides; one ride cannot have two current assigned drivers.
- Use append-only ride events for audit history.
- Protect against double-clicks, duplicate requests and concurrent accept actions with idempotency/conditional updates.
- Add loading, empty, validation, success, error, stale-data and no-driver states.
- Do not store core business data only in localStorage or in-memory arrays. In-memory fixtures are allowed only for isolated tests or an explicitly labelled demo fallback.
- Seed deterministic synthetic demo data, clearly label it, and never present synthetic metrics as live operations.
- Do not fake model predictions, driver GPS, route distances, bookings, ratings or simulation improvements.

EXECUTION PROTOCOL
Work in this order and use the existing prompt files:
00_REPOSITORY_AUDIT_AND_SCAFFOLD
01_DATABASE_AUTH_RLS
02_CORE_RIDE_LIFECYCLE
03_MAP_LOCATION_AND_DISCOVERY
04_MATCHING_FAIRNESS_AND_EXPLANATIONS
05_DEMAND_MODEL_AND_ZONE_INTELLIGENCE
06_POOLING_AND_REASSIGNMENT
07_ADMIN_CONTROL_CENTER_AND_SIMULATION
08_INTEGRATION_TESTS_ACCESSIBILITY_POLISH
09_DEPLOYMENT_DEMO_HANDOFF

At activation, perform a repository/specification audit, then implement Phase 00 only. Do not start Phase 01 in the same run unless explicitly instructed after Phase 00 is reviewed.
For each phase:
1. Read that phase prompt completely and all referenced contracts.
2. State the scope, files/modules to change, dependencies and acceptance tests.
3. Implement the entire phase, including frontend/backend/database wiring where applicable.
4. Run the relevant lint, typecheck, unit/integration tests and build checks.
5. Fix failures introduced by the phase. Do not suppress type/lint/test errors to claim success.
6. Update docs/14_DECISIONS_AND_LIMITATIONS.md and BUILD_LOG.md with genuine decisions, commands, test results and remaining blockers.
7. Stop at the phase gate. Do not silently start the next phase.

Do not ask me to approve non-blocking implementation details. Make conservative decisions consistent with the spec and record them. Ask only for genuinely blocking credentials or product choices. If Supabase credentials are not yet configured, still implement migrations, server integration, .env.example and test adapters; never replace the real data architecture with local arrays. Clearly report which integration checks need credentials.

QUALITY GATE FOR EVERY PHASE
A phase is not complete merely because files were generated. It is complete only when:
- The code runs and the relevant user flow is connected end-to-end for that phase.
- No newly introduced TypeScript errors remain.
- Relevant automated tests pass, or are explicitly marked blocked with the real reason.
- No visible placeholder or dead control is introduced.
- Security and data integrity implications are checked.
- Evidence is provided: changed files, commands, actual results, route/screens to inspect, and known limitations.

INITIAL RESPONSE REQUIRED
First inspect the entire workspace and return:
1. Existing repository state and detected package manager/runtime.
2. Specification files successfully read.
3. PS2 requirements mapped to the implementation modules.
4. Missing credentials/tools and whether they block local implementation.
5. Dependency/architecture risks and decisions.
6. Exact Phase 00 work plan.
Then immediately execute Phase 00. Do not stop at the plan.

TRUTHFULNESS
Never claim a test passed unless you ran it and saw it pass. Never invent test output, ML metrics, screenshots, deployment URLs or credentials. Clearly separate implemented, simulated, partially implemented and unimplemented capabilities. Do not claim production readiness for this hackathon prototype.
```

---

## 3. What Antigravity must produce in Phase 00

Before moving to the database or UI feature work, Phase 00 must leave the workspace in a clean, runnable state:

- Existing repository and Git state inspected; existing useful code preserved.
- Next.js App Router + TypeScript project configured if one does not already exist.
- Package manager and Node runtime checked against framework requirements.
- Strict TypeScript, lint, typecheck, test and build scripts configured.
- Global typography, color tokens, spacing, focus states and responsive shell established from the design docs.
- Folder/module boundaries created from `docs/03_ARCHITECTURE.md`.
- `.env.example` created with variable names and safe placeholders only.
- A health/smoke route created.
- No fake dashboards, placeholder charts or invented metrics.
- `BUILD_LOG.md` created with commands and actual outputs.

**Phase 00 exit gate:** local app starts, lint passes, typecheck passes and production build passes. If something cannot pass because of an external credential or environment issue, the agent must identify the exact blocker and not disguise it as a pass.

---

## 4. Step-by-step phase execution prompts

After the previous phase passes its gate and you have reviewed its report, paste the matching wrapper below. The full implementation details are already in the corresponding `prompts/` file. Do not skip a phase.

### Phase 00 — Audit and scaffold

```text
Execute Phase 00 now. Read prompts/00_REPOSITORY_AUDIT_AND_SCAFFOLD.md in full and follow it exactly. Inspect before editing; preserve existing work. Complete only Phase 00. Run lint, typecheck and production build. Create/update BUILD_LOG.md with actual command output, changed files, blockers and the Phase 00 pass/fail gate. Do not start Phase 01.
```

### Phase 01 — Database, authentication and authorization

```text
Execute Phase 01 now. Read prompts/01_DATABASE_AUTH_RLS.md and the database, API, security and PRD contracts. Implement real Supabase PostgreSQL migrations, constraints, indexes, RLS, server-side Supabase Auth/session handling, role guards and deterministic seed procedure. Ensure a user cannot self-assign the admin role. Add tests for role isolation and database rules. Run migrations/tests where the environment permits. Update BUILD_LOG.md with actual results. Stop after Phase 01; do not start Phase 02.
```

### Phase 02 — Core ride lifecycle

```text
Execute Phase 02 now. Read prompts/02_CORE_RIDE_LIFECYCLE.md. Implement passenger booking, driver availability, ride request persistence, driver offer, accept/reject, ride status transitions Requested -> Accepted -> Arriving -> Ongoing -> Completed, cancellation, history and append-only ride events. Wire UI actions to authenticated Node.js Route Handlers and Supabase persistence. Enforce transitions and driver/ride invariants server-side and atomically. Test passenger -> driver -> passenger/admin end-to-end. Stop after Phase 02.
```

### Phase 03 — Map, location and driver discovery

```text
Execute Phase 03 now. Read prompts/03_MAP_LOCATION_AND_DISCOVERY.md. Integrate Leaflet/React-Leaflet and OpenStreetMap with attribution, coordinate validation, deterministic simulated driver locations, Haversine distance, configured approximate pickup ETA and nearby-driver discovery. Clearly label straight-line estimates and simulated locations. Add map loading/error/empty states and a non-map list fallback. Do not claim live GPS or real traffic. Test coordinate edge cases and map behavior. Stop after Phase 03.
```

### Phase 04 — Fairness-aware dispatch and explanations

```text
Execute Phase 04 now. Read prompts/04_MATCHING_FAIRNESS_AND_EXPLANATIONS.md and docs/08_ALGORITHMS_AND_DEMAND_MODEL.md. Implement eligibility filtering first, then the documented normalized weighted score: distance 0.20, ETA 0.30, workload 0.15, smoothed acceptance reliability 0.10, idle time 0.25. Preserve the max pickup ETA guardrail, fresh-location rule, deterministic tie-breaks and per-factor contributions. Implement nearest-eligible baseline with identical eligibility filters. Persist dispatch decision/reason data. Show appropriate explanations to passenger, driver and admin. Add deterministic unit tests. Stop after Phase 04.
```

### Phase 05 — Trained demand model and zone intelligence

```text
Execute Phase 05 now. Read prompts/05_DEMAND_MODEL_AND_ZONE_INTELLIGENCE.md and docs/08_ALGORITHMS_AND_DEMAND_MODEL.md. Generate 90 days of deterministic 15-minute synthetic demand for at least six zones. Train HistGradientBoostingRegressor in Python/scikit-learn for the exact t+30-minute target, using only features known at prediction time. Use chronological holdout evaluation and compare MAE/RMSE with the historical zone/time baseline. Export and validate the versioned JSON artifact consumed by the Node app. Implement zone pressure, bounded simulated surge and reposition utility from the shared forecast/supply service. Add reproducibility and leakage tests. Report actual metrics; never fabricate them. Stop after Phase 05.
```

### Phase 06 — Ride pooling and reassignment

```text
Execute Phase 06 now. Read prompts/06_POOLING_AND_REASSIGNMENT.md. Implement two-passenger compatibility, feasible pickup/drop-off sequence search, pickup-before-own-drop-off constraints, wait/detour caps, separate-vs-pooled fare/time comparison and explicit passenger consent. Implement idempotent, bounded reassignment for rejection, timeout/no response, cancellation and delayed arrival, excluding already-tried drivers. Make assignment/driver state changes atomic and prevent concurrent accept races. Add tests for compatible/incompatible pools, cancellations, retries, limits and concurrency. Stop after Phase 06.
```

### Phase 07 — Admin Control Center and Simulation Lab

```text
Execute Phase 07 now. Read prompts/07_ADMIN_CONTROL_CENTER_AND_SIMULATION.md. Build the admin operations console from persisted data and the forecast artifact. Implement reproducible Simulation Lab runs comparing nearest-eligible baseline and FairRide using the same immutable input snapshot, seed, candidate set and request sequence. Compute wait, ETA, idle time, utilization, workload distribution, unassigned/completed rides and pickup distance where available. Persist run configuration/results. Show methodology, caveats and synthetic-data labels. Do not hardcode impressive numbers or claim that FairRide wins every metric. Stop after Phase 07.
```

### Phase 08 — Integration, accessibility and design QA

```text
Execute Phase 08 now. Read prompts/08_INTEGRATION_TESTS_ACCESSIBILITY_POLISH.md. Test all three roles end-to-end against the same persisted records. Search for dead buttons, placeholder routes, TODOs, hardcoded KPI values, accidental client-side business logic, `any` types and console errors. Verify RLS, role boundaries, assignment concurrency, ride status consistency, refresh/reconnect behavior, map failure fallback, model artifact failure handling and responsive layouts. Run lint, typecheck, unit, integration, E2E and production build. Fix issues; provide a truthful pass/fail report. Stop after Phase 08.
```

### Phase 09 — Deployment, demo and handoff

```text
Execute Phase 09 now. Read prompts/09_DEPLOYMENT_DEMO_HANDOFF.md and docs/13_DEPLOYMENT_AND_ENVIRONMENT.md. Prepare environment configuration, migrations, demo seed/reset workflow, model artifact verification and deployment. Do not invent credentials or deployment URLs. Verify deployed passenger, driver and admin flows if credentials are available. Prepare a 3–5 minute judge demo and a handoff report separating live integrations from simulation. Stop after Phase 09 and report the exact deployment status and limitations.
```

---

## 5. Integration checkpoints — verify these before calling the app complete

### Checkpoint A: Core full-stack ride

- [ ] Passenger can register/login and create a persisted ride.
- [ ] Passenger's ride appears in the correct driver's request queue.
- [ ] Driver can accept/reject the assigned offer.
- [ ] Passenger and admin see the same ride record and current status.
- [ ] Driver can progress Arriving, Ongoing and Completed.
- [ ] Refreshing the page does not lose the persisted ride state.
- [ ] Unauthorized users cannot read or mutate other users' protected records.

### Checkpoint B: Matching and fairness

- [ ] Ineligible/stale/busy drivers are filtered before scoring.
- [ ] Driver ranking uses the agreed five factors and documented weights.
- [ ] Selection explanation is based on stored factor contributions.
- [ ] Nearest-driver baseline uses the same eligible set.
- [ ] Identical inputs produce deterministic decisions.

### Checkpoint C: Demand model and zone intelligence

- [ ] Model is actually trained from synthetic historical rows.
- [ ] Forecast target is exactly 30 minutes ahead.
- [ ] No future information leaks into features.
- [ ] Chronological holdout MAE/RMSE are computed and reported.
- [ ] Model is compared against a baseline.
- [ ] Forecast metadata and synthetic-data disclosure appear in the UI.
- [ ] Zone pressure/surge/repositioning consume forecast and current supply data.

### Checkpoint D: Pooling and exceptions

- [ ] Two-passenger pool candidate checks constraints.
- [ ] Every passenger is picked up before their own drop-off.
- [ ] Detour and extra-time limits are enforced.
- [ ] Each passenger explicitly confirms pooling.
- [ ] Rejection/no response/cancellation/delay can trigger reassignment.
- [ ] Previous drivers are excluded in the current dispatch cycle.
- [ ] Concurrent accepts cannot create multiple assignments.

### Checkpoint E: Judge-facing evidence

- [ ] Admin console shows persisted or explicitly labelled deterministic data.
- [ ] Simulation uses the same scenario for both algorithms.
- [ ] Actual metrics and metric definitions are visible.
- [ ] Simulation configuration and seed are reproducible.
- [ ] Every advanced PS2 feature can be demonstrated in a predictable sequence.
- [ ] No chart, score or model result is fabricated.

---

## 6. Rules for handling problems during implementation

If Antigravity encounters a problem, use these instructions rather than asking it to rewrite the entire app:

**Build/type errors**
```text
Do not rewrite the project. Reproduce the current error, identify the smallest responsible module, fix the root cause, rerun the failing command and report the exact result. Preserve passing tests.
```

**Broken frontend interaction**
```text
Trace the UI action through its handler, API route, authorization, service, database operation and returned state. Fix the actual broken layer. Do not replace the control with a mock response or local-only state.
```

**Database or RLS failure**
```text
Inspect the migration, constraints, authenticated user context and RLS policy. Add a minimal reproducible test. Fix permissions at the database/server boundary; do not disable RLS or use the service-role key in the browser as a workaround.
```

**Model training failure**
```text
Reproduce the training failure in the Python environment, inspect data schema and feature generation, and correct the training pipeline. Do not silently substitute a hand-written forecast. If model training remains blocked, report the blocker and leave the UI in an honest unavailable state.
```

**Design drift or generic UI**
```text
Audit the current screens against DESIGN.md, FRONTEND.md and docs/04_DESIGN_SYSTEM.md. Correct hierarchy, spacing, typography, map composition, density, responsive behavior and states. Do not solve design problems by adding more cards, gradients or decorative elements.
```

---

## 7. Final handoff format required from Antigravity

At the end of each phase—and especially after Phase 09—Antigravity must produce:

1. **Status:** PASS / PARTIAL / BLOCKED for each requirement.
2. **Changed files:** grouped by frontend, backend, database, algorithms, ML and tests.
3. **Run commands:** exact commands executed.
4. **Test evidence:** actual pass/fail counts and any skipped tests with reasons.
5. **Working routes:** passenger, driver and admin route paths.
6. **Data status:** Supabase connected or not, migrations applied or not, seed data loaded or not.
7. **Model status:** model type, training seed, train/test range, actual MAE/RMSE, baseline metrics and artifact path.
8. **Advanced-feature status:** matching, forecasting, zone intelligence, pooling and reassignment.
9. **Security status:** authentication, server-side role checks and RLS verification.
10. **Known limitations:** what is simulated, approximate, incomplete or unverified.
11. **Next action:** the one exact next phase prompt or blocking setup action.

Never report a green status based only on generated code. A result is complete only when the described behavior was run and verified.

---

## 8. Recommended operating rhythm for a 24-hour build

- Do not spend the first hours repeatedly redesigning the prompt. Activate once and start Phase 00.
- Keep Phase 00–04 as the first critical path: foundation, database/auth, ride lifecycle, maps and matching.
- Implement Phase 05–07 next: trained demand model, zone intelligence, pooling, reassignment and Simulation Lab.
- Reserve meaningful time for Phase 08 testing and Phase 09 deployment. Do not consume all available time on visual polish.
- If time becomes critically short, preserve the working core ride flow and visibly disclose any incomplete advanced feature. Never fake a working feature for the demo.
