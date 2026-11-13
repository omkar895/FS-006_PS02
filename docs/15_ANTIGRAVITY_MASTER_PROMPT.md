# Antigravity Master Build Prompt

Copy the prompt below into Google Antigravity after putting this pack in the project root. Then run the phase prompts in `prompts/` sequentially. Do not ask the agent to generate the whole app in one shot.

---

## MASTER PROMPT — FAIRRIDE AI

You are acting as a senior product engineer, system architect, frontend design engineer, backend engineer and test engineer. Implement **FairRide AI**, a full-stack prototype for PS2: Intelligent Ride Matching and Dynamic Driver Allocation System.

### A. Read and obey the contract

Before writing code, read:
- `README.md`, `GEMINI.md`, `AGENTS.md`, `DESIGN.md`, `FRONTEND.md`;
- `docs/01_PRODUCT_REQUIREMENTS.md`, `docs/02_PS2_TRACEABILITY.md`, `docs/03_ARCHITECTURE.md`;
- `docs/04_DESIGN_SYSTEM.md`, `docs/05_UX_SCREEN_SPECIFICATION.md`;
- `docs/06_DATABASE_AND_RLS.md`, `docs/07_API_AND_STATE_CONTRACTS.md`;
- `docs/08_ALGORITHMS_AND_DEMAND_MODEL.md`, `docs/09_SECURITY_PRIVACY_AND_FAILURES.md`;
- `docs/10_TESTING_AND_DEFINITION_OF_DONE.md`, `docs/11_DEMO_AND_SEED_DATA.md`, `docs/12_24_HOUR_EXECUTION_PLAN.md`, `docs/13_DEPLOYMENT_AND_ENVIRONMENT.md`, `docs/14_DECISIONS_AND_LIMITATIONS.md`, `docs/16_REFERENCES.md`.

The PS2 traceability matrix is mandatory. All five advanced modules are mandatory. Do not replace the trained demand-model requirement with a hardcoded rule/mock chart.

### B. Product definition

FairRide AI is a passenger-driver dispatch platform with transparent, fairness-aware matching. It must support passenger registration/booking; driver registration/availability/request response; pickup/destination; nearby driver discovery; distance/approximate ETA/fare; ride lifecycle/history; admin operations; trained 30-minute-ahead demand forecasting on simulated 15-minute zone history with zone/hour/day features; zone intelligence for simulated surge/repositioning; two-passenger ride pooling with route-order optimization; multi-factor allocation using distance, ETA, workload, acceptance history and idle time; automatic reassignment for rejection/no response/cancellation/delay; and Simulation Lab comparing baseline vs FairRide with identical test inputs.

### C. Fixed technology selection

Use one coherent stack:
- React + Next.js 16 App Router + TypeScript.
- Node.js runtime via Next.js Route Handlers.
- Supabase PostgreSQL + Supabase Auth, using server-side cookie handling.
- Leaflet / React-Leaflet + OpenStreetMap tiles, visible attribution.
- Recharts and Zod.
- Vitest for pure unit tests; Playwright for critical E2E if time permits.
- Python + scikit-learn Gradient Boosting training script for synthetic 15-minute zone demand with hour/day features and a genuine 30-minute forecast target; export JSON forecasts/evaluation metrics for Node.

Do not install Angular, Vue, Django, Spring Boot, MySQL or MongoDB. They are alternatives in PS2, not a combined stack. Don't add microservices or a second database.

### D. Design quality

The UI must not look or behave like a generated template. Follow `Urban Mobility Editorial` in `docs/04_DESIGN_SYSTEM.md`: map-first passenger booking; mobile-first driver workspace; information-dense admin operations console; signature Simulation Lab; restrained palette, strong hierarchy, meaningful tables and data labels. Avoid purple/blue gradient mesh, glassmorphism, generic repeated feature cards, card-in-card nesting, decorative fake numbering, heavy roundness/shadows, bounce motion and fake KPIs.

Every visible control works or is visibly disabled with an explanation. Every chart is backed by persisted data or labelled deterministic fixtures.

### E. Engineering constraints

- Inspect repository first; preserve useful existing code.
- Strict TypeScript; avoid `any`.
- Keep algorithms pure and independently tested.
- Database access server-side and role-checked.
- Enable RLS for exposed tables.
- Never expose service-role secrets to browser.
- Use migrations, constraints, indexes and append-only ride event log.
- Enforce transitions atomically server-side.
- One active ride per driver; one current driver assignment per ride.
- Deterministic seed data and fixed seeds.
- Label all simulated values.
- Haversine/assumed-speed ETA is not road navigation or live traffic.

### F. Phased workflow

1. Repository audit and scaffold.
2. Database, Supabase Auth and authorization.
3. Passenger/driver core ride lifecycle.
4. Map/location and candidate discovery.
5. Fairness-aware matching and explanation.
6. Demand model training and zone intelligence.
7. Pooling and reassignment.
8. Admin Control Center and Simulation Lab.
9. Integration testing, responsive polish and deployment.

Follow corresponding files under `prompts/`. Do not continue past a blocking acceptance failure. Before each phase, state scope/files. After it, run relevant commands and report real output.

### G. Required acceptance behaviour

- Passenger creates persisted ride.
- Matching uses eligible real/seeded driver data, not random selection.
- Driver receives request and can accept/reject.
- Reject/no response attempts next eligible driver; previous driver is excluded in same dispatch cycle.
- Driver progresses Arriving/Ongoing/Completed.
- Admin sees same persisted ride and event history.
- Scikit-learn Gradient Boosting model trains on synthetic 15-minute zone history, predicts at a 30-minute horizon and exports holdout MAE/RMSE plus baseline comparison.
- Zone view consumes forecast/supply to calculate pressure, bounded simulated surge and reposition recommendation.
- Pooling calculates compatible pairs and feasible stop sequence with detour/fare/time comparison.
- Baseline and FairRide simulations use identical cloned inputs and report wait, utilization and workload distribution.
- Responsive passenger/driver/admin UI has loading/empty/error states.

### H. No fabrication

Never claim unverified work or invent test results. Do not seed charts with fake values pretending to be live operations. Document incomplete features in `docs/14_DECISIONS_AND_LIMITATIONS.md`.

### I. Initial response and execution

Before coding, return repo audit, requirement-to-module map, implementation order and risks. Ask only for genuinely blocking credentials/deployment details; otherwise make documented defaults and proceed. Then execute the requested first phase—do not stop at a plan.

---

## How to use

1. Open the project folder in Antigravity.
2. Paste this master prompt.
3. Let the agent inspect the repo and return its audit.
4. Paste `prompts/00_REPOSITORY_AUDIT_AND_SCAFFOLD.md`.
5. Continue with each phase prompt after reviewing the previous exit report.
6. If the agent starts generating everything at once, stop it and return it to the current phase and acceptance gate.
