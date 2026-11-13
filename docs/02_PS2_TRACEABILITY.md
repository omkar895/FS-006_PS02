# PS2 Requirement Traceability Matrix

This maps the supplied PS2 brief to implementation evidence. Keep every row; document deviations instead of silently dropping requirements.

## Core expected features

| PS2 requirement | Implementation | Evidence / acceptance test |
|---|---|---|
| Passenger and driver registration/login | Supabase Auth + role profile | Both roles can sign in; role spoofing denied |
| Driver availability | Availability control + server endpoint | Offline excluded; available appears as candidate |
| Pickup/destination entry | Seed place picker + map pins | Coordinates validated and persisted |
| Nearby drivers | Map markers + sorted list | Distance and location freshness shown |
| Driver distance | Haversine | Known-coordinate and symmetry tests |
| Suitable driver matching | Eligibility + multi-factor ranking | Deterministic rank and factor breakdown |
| ETA and approximate fare | Distance/speed ETA + itemized fare | Calculation tests and approximation disclosure |
| Accept/reject | Atomic assigned-driver response endpoint | Accept changes state; reject triggers retry |
| Ride states | Central state-transition service | Invalid transition rejected; valid event logged |
| History/fare details | `rides` + `ride_events` | Role-scoped history works |

## Five mandatory advanced features

| PS2 requirement | Implementation contract | Evidence |
|---|---|---|
| Predictive demand forecasting: train a small model (Prophet or gradient boosting) on simulated historical demand by zone and hour; pre-position idle drivers before demand surges; show predicted vs actual demand on a heatmap | Python scikit-learn GradientBoostingRegressor, deterministic synthetic zone/15-minute history with hour/day features, chronological holdout, MAE/RMSE + baseline, exported forecasts. This pack selects a 30-minute prediction horizon as an implementation decision; PS2 does not prescribe a numeric horizon. | Training runs; artifact has model version, seed, metrics, predictions; UI distinguishes predicted and actual; model predicts from past-only features |
| Zone intelligence: shared zone analysis, surge pricing, predictive repositioning | Forecast + supply by zone, pressure, bounded surge rule and driver reposition recommendation | Recompute on supply changes; show formula and reason |
| Pooling: compatible requests, nearby pickup/dropoff, route order, compare time/fare | Two-passenger route sequence enumeration with pickup precedence, detour/time guardrails, shared fare comparison | Feasible and incompatible pair tests; UI shows order/savings/added time |
| Driver allocation/fairness: distance, ETA, workload, acceptance history, idle time; explain decision; compare wait/utilization | ETA eligibility guardrail + normalized weighted score + factor explanation; metrics in Simulation Lab | Ranking changes when test factors change; explanation visible; wait/utilization measured |
| Reassignment: rejection, no response, cancellation, delay; status update/notify passenger | Dispatch orchestration, tried-driver set, bounded/idempotent retry, server-checked deadline | Reject/timeout/pre-start cancel tries next candidate or ends unassigned; event log complete |

## Technical expectations

| PS2 technical expectation | Selected implementation | Boundary |
|---|---|---|
| Frontend React / Angular / Vue | React with Next.js 16 | Select one frontend; do not add Angular/Vue |
| Backend Node.js / Django / Spring Boot | Node.js runtime via Next.js Route Handlers | One TypeScript server API layer |
| DB MySQL / PostgreSQL / MongoDB | Supabase PostgreSQL | One primary database; relational lifecycle and RLS |
| Map OSM + Leaflet or equivalent | OpenStreetMap + Leaflet / React-Leaflet | Attribution required |
| Distance/ETA matching and route optimization | Haversine + disclosed approximate ETA; pooling stop-order search | No road-route claim without routing provider |
| Simulated demand/location data | Seeded deterministic drivers and synthetic historical demand | Visible `SIMULATED` labels |
| Evaluate time, distance, waiting, utilization | Admin analytics and Simulation Lab | Values computed, never hardcoded |

## Why these technologies

The PS2 framework names are alternatives, not a demand to use every framework at once. Selected: React + Next.js, Node.js, PostgreSQL and OSM/Leaflet. Adding React and Angular together, or PostgreSQL and MongoDB without a real requirement, increases build time and integration risk.

## Judge-evidence checklist

- [ ] Passenger request persisted.
- [ ] Nearby drivers show distance and approximate ETA.
- [ ] Selected driver has auditable score explanation.
- [ ] Driver accepts/rejects and completes ride.
- [ ] Rejection/timeout triggers reassignment or explained unassigned state.
- [ ] Training run and evaluation metrics visible.
- [ ] Demand heatmap separates predicted and actual.
- [ ] Surge/reposition rationale visible.
- [ ] Pool route order, detour and fare/time comparison visible.
- [ ] Simulation uses same baseline/FairRide inputs.
- [ ] Admin metrics derive from data.
- [ ] Simulated data labelled.
