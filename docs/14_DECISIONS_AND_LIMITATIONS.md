# Architecture Decisions, Assumptions and Known Limitations

## 1. Decision log

| ID | Decision | Reason | Consequence |
|---|---|---|---|
| ADR-01 | React + Next.js 16 | One React app with App Router/server capabilities | Do not add Angular or Vue |
| ADR-02 | Node.js Route Handlers | Meets PS2 Node.js option with minimal service overhead | Keep API in Node runtime; no second backend for MVP |
| ADR-03 | Supabase PostgreSQL | Relational lifecycle, constraints, transactions, RLS and Auth | One primary database |
| ADR-04 | Leaflet + OpenStreetMap | Meets mapping expectation without mandatory commercial map API | Attribution/tile policy must be respected |
| ADR-05 | Haversine + assumed-speed ETA | Feasible and testable within sprint | Not road distance or live traffic ETA |
| ADR-06 | Offline Python Gradient Boosting | Satisfies PS2 trained-small-model expectation without inference microservice | Forecast artifact is exported; synthetic results aren't real-city forecasts |
| ADR-07 | Fairness score behind ETA guardrail | Balances passenger wait and driver workload | Weights require evaluation; not universal optimum |
| ADR-08 | Two-passenger pooling MVP | Demonstrates route sequence optimization in scope | Not a scalable fleet routing solver |
| ADR-09 | Client-triggered timeout check for MVP | Avoids background queue infrastructure | Server validates deadline; production needs reliable scheduler/worker |
| ADR-10 | Deterministic simulation | Repeatable and auditable comparison | Synthetic scenario, not field evidence |

## 2. Explicit limitations

1. No live road routing by default; straight-line distance understates road distance.
2. No live traffic feed; the map is not a traffic map.
3. Synthetic demand data; forecasting demonstrates a model pipeline only.
4. No real GPS unless browser permission is granted; seeded driver locations are simulated.
5. No payment integration; fare is indicative.
6. No production queue/worker; timeout is processed by authenticated server check during MVP and is not guaranteed to run while nobody uses the app.
7. Two-passenger pooling only.
8. Weighted fairness policy does not guarantee mathematically fair outcomes.
9. Community OSM tiles are best-effort.
10. Security patterns require review before public commercial deployment.

## 3. Assumptions

- Demo provisions one admin, at least one passenger and two drivers.
- Six zones and 10–15 drivers are seeded.
- Maximum pickup ETA initially 12 minutes, configurable.
- Location freshness threshold configurable.
- Fare/surge assumptions are educational.
- Each passenger and driver can have at most one active ride in MVP.

## 4. Deferred decisions

- Geocoding/routing provider if actual street addresses are needed.
- PostGIS and location retention/consent policy for production.
- Durable queue/worker for timeout and exception tasks.
- Pool fare allocation for more than two passengers.
- Real-data validation of fairness weights/model.
- OSM-derived tile provider for sustained scale.

## 5. Claims not to make

- `AI predicts traffic`: model forecasts synthetic zone ride demand 30 minutes ahead using zone/time-of-day features; it does not predict road traffic.
- `Real-time location`: only when browser GPS is permitted and fresh; otherwise simulated.
- `Fastest road route`: not implemented without road-routing engine.
- `Fair for every driver`: score attempts to balance defined factors; outcomes must be measured.
- `X% more efficient`: only report computed percentage from a reproducible run and label its scenario synthetic.
