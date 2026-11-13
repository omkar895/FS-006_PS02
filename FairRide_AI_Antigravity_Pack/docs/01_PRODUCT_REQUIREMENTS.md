# Product Requirements Document — FairRide AI

**Version:** 1.0 | **Status:** Build specification | **Source:** User-provided PS2 — Intelligent Ride Matching and Dynamic Driver Allocation System PDF | **Target:** Responsive full-stack prototype for a 24-hour hackathon build.

## 1. Product summary

FairRide AI is a ride-matching and driver-dispatch platform that connects passengers with available drivers. It estimates pickup time and fare, assigns drivers using distance, ETA, workload, acceptance history and idle time, and supports the complete ride lifecycle.

Its product differentiator is **transparent, fairness-aware dispatch**: the system does not blindly choose the nearest driver. It ranks eligible drivers using a documented multi-factor score while keeping pickup ETA inside a configurable passenger-wait guardrail.

A connected zone-intelligence layer forecasts demand 30 minutes ahead from simulated 15-minute zone demand history with hour-of-day features, estimates demand/supply pressure, calculates a clearly simulated surge multiplier and recommends where idle drivers should reposition. A pooling module identifies compatible requests and evaluates feasible pickup/drop-off sequences. Reassignment handles rejection, no response, cancellation and delayed arrival. An admin Simulation Lab compares FairRide with a nearest-driver baseline on the same test inputs.

**Core promise:** reduce avoidable passenger waiting while distributing driver opportunities more transparently and making dispatch decisions inspectable.

## 2. Problem and objective

Ride-hailing services need to match passengers with suitable nearby drivers. Inefficient allocation can increase passenger waiting time, driver idle time and operating costs. PS2 asks for a platform that identifies and assigns an available driver based on location, distance, availability and estimated pickup time, and supports the complete ride lifecycle.

## 3. Product goals

1. Passenger can register, choose pickup/destination, request a ride and receive an eligible assignment.
2. Driver can register, control availability, accept/reject and progress a ride through allowed states.
3. System calculates distance, approximate pickup ETA and fare consistently.
4. Allocation is explainable and uses all PS2 factors: distance, pickup ETA, current workload, acceptance history and idle time.
5. All five advanced PS2 capabilities are demonstrable and traceable.
6. Admin can inspect active fleet, demand zones, allocation decisions, pooling and performance.
7. App works with deterministic simulated drivers and demand when real GPS/traffic integrations are unavailable.

## 4. Non-goals

Not in the 24-hour prototype: commercial dispatch or safety guarantees; real-money payments; production turn-by-turn routing or live-traffic ETA; a real fleet; SMS/WhatsApp/calling; KYC or vehicle verification; multi-city operations; regulatory certification; or a production-grade ML service/field accuracy claim.

## 5. Personas and permissions

### Passenger
Needs clear booking, fare/ETA estimate, understandable driver assignment, trip status and history. Can create rides, cancel where allowed, view own rides and permitted assigned-driver details.

### Driver
Needs online/offline control, incoming requests, accept/reject, trip-state actions and ride/earnings history. Can update own availability/location, never another driver's data.

### Administrator / dispatcher
Needs fleet-wide operations visibility, exception handling, demand-zone analytics, allocation explanations, pool candidate review and simulation comparisons. Admin permissions are enforced server-side.

## 6. Main user journeys

### A — Passenger booking
1. Sign in; open Book Ride.
2. Choose pickup and destination from seeded demo locations or map pin selection.
3. Backend validates coordinates and estimates distance, pickup ETA and fare.
4. Matching filters eligible drivers and ranks them.
5. System persists ride + assignment event; driver receives request.
6. Passenger sees status and ETA.
7. Driver accepts; passenger sees Accepted → Arriving → Ongoing → Completed.
8. History and admin metrics update from persisted records.

### B — Driver response
1. Driver signs in and is initially offline.
2. Driver goes online; source and timestamp of coordinate are stored.
3. Incoming request shows pickup distance/ETA and fare estimate.
4. Driver accepts/rejects within response window.
5. Only assigned driver can progress Arriving/Ongoing/Completed.
6. Rejection/timeout records an event and tries next eligible driver.

### C — Admin inspection
1. Admin opens Control Center.
2. Sees operations KPIs and simulated/live-permission fleet map.
3. Inspects ranked candidates and score breakdown.
4. Inspects predicted vs actual synthetic demand and zone pressure.
5. Reviews surge/reposition rationale and pooling candidates.
6. Runs baseline vs FairRide simulation on the same deterministic inputs.

### D — Pooling
1. Two or more pending requests exist within a configured time window.
2. Pooling checks pickup proximity, destination compatibility, detour and stop precedence.
3. Selects lowest-cost feasible stop sequence.
4. Shows shared ETA/fare and savings versus separate rides.
5. MVP confirms only after required passengers/driver accept; otherwise individual rides continue.

## 7. Functional requirements

### FR-01 Authentication and roles
- Supabase Auth signup/signin.
- Each profile has exactly one role: `passenger`, `driver`, `admin`.
- Role cannot be self-edited in client.
- Protected APIs/pages verify role server-side.

### FR-02 Driver availability and location
- Driver toggles `offline`/`available` when not on active ride.
- System sets `busy` during an active ride.
- Location source is `simulated` or `browser_geolocation`, with `recorded_at`.
- Stale location is excluded from dispatch.
- Demo seeds 10–15 deterministic driver locations.

### FR-03 Location selection
- Passenger selects pickup and destination.
- Each point has valid latitude/longitude.
- UI labels seed-location vs map-pin source.
- Invalid/empty values block submission with inline errors.
- Geocoding is not required; seeded places + map click are sufficient for MVP.

### FR-04 Discovery and matching
- Only available, fresh, non-busy, compatible drivers are candidates.
- Calculate distance and ETA; apply max ETA guardrail before score.
- Rank with algorithm in `08_ALGORITHMS_AND_DEMAND_MODEL.md`.
- Persist feature values, normalized scores, selection and rationale in `match_metadata`.
- Never expose unassigned driver email/phone.

### FR-05 ETA and fare
- Use Haversine unless routing provider is explicitly added.
- ETA = straight-line distance / assumed average speed + pickup buffer.
- Label ETA as approximate; it is not road-navigation ETA.
- Fare = base + distance component, multiplied by bounded simulated surge, subject to minimum fare. Initial demo constants and detour assumption are specified in `docs/08_ALGORITHMS_AND_DEMAND_MODEL.md`.
- Return an itemized fare breakdown and disclose that this is not a commercial quote.

### FR-06 Driver response
- Assigned driver accepts/rejects a request while `requested` and before expiry.
- Response is atomic and server-validated.
- Driver cannot respond to another driver's request.
- Duplicate/replayed actions are idempotent or rejected safely.

### FR-07 Ride lifecycle
States: `requested`, `accepted`, `arriving`, `ongoing`, `completed`, `cancelled`, `reassigning`, `unassigned`, `expired`. Public PS2 labels remain Requested, Accepted, Arriving, Ongoing, Completed. Extra states are for exceptions. See API/state contract.

### FR-08 Ride history
- Passenger sees own rides; driver sees assigned rides; admin sees all.
- Fare, endpoints, timestamps, status and event timeline are available to appropriate role.

### FR-09 Predictive demand forecasting — mandatory
- Generate reproducible synthetic historical demand in 15-minute buckets by zone, with hour-of-day and weekday features.
- Train a small scikit-learn Gradient Boosting Regressor to forecast a 30-minute horizon from lagged demand/temporal features.
- Use chronological holdout; prevent future leakage.
- Compare against historical-average baseline.
- Export model metadata, forecasts, MAE/RMSE to JSON for Node app.
- Display predicted versus actual values on heatmap and chart.
- Label all data/output as synthetic demonstration.

### FR-10 Zone intelligence — mandatory
- Reuse forecast and driver-supply-by-zone data.
- Calculate demand/supply pressure.
- Calculate bounded simulated surge multiplier via documented formula.
- Recommend idle-driver repositioning using demand and travel cost.
- Explain recommendation; do not move driver without acceptance or explicit demo simulation.

### FR-11 Multi-passenger pooling — mandatory
- Identify compatible pending requests with nearby pickup/dropoff.
- Evaluate pickup-before-own-dropoff sequences; two passengers for MVP.
- Select efficient feasible route under detour/time constraints.
- Compare pooled total time/fare with separate estimates.
- Show savings/extra time only when computed values support it.

### FR-12 Intelligent allocation/fairness — mandatory
- Rank by distance, pickup ETA, workload, acceptance history and idle time.
- Explain factor contributions.
- Enforce passenger wait guardrail before scoring.
- Evaluate waiting time and driver utilization; include workload distribution metric.

### FR-13 Reassignment/exception handling — mandatory
- Reassign on rejection, response timeout/no-response, pre-start driver cancellation and excessive pre-start delay.
- Append event and update passenger-visible state.
- Bounded attempts; if no candidate, mark `unassigned` with reason.
- Never auto-reassign an `ongoing` ride.

### FR-14 Admin dashboard
- Active rides, available drivers, completed rides, cancellations and average wait.
- Fleet map and zone status.
- Navigation to Dispatch, Demand, Pooling, Simulation and Analytics.
- Charts from actual records or labelled deterministic fixtures only.

### FR-15 Simulation Lab (differentiator)
- Run nearest-driver baseline and FairRide on identical request/driver snapshots and same seed.
- Report mean/median wait, pickup distance, utilization, workload spread/Gini, unassigned rate and completion rate.
- Show absolute/percentage deltas; no hardcoded improvements.
- Store seed, inputs, parameters, algorithm version and outputs.

## 8. Non-functional requirements

- Usability: simple passenger booking; driver primary actions easy on mobile.
- Accessibility: keyboard, semantic labels, visible focus, contrast, no color-only state and reduced motion.
- Performance: avoid blocking page shell; load map/charts client-side where needed.
- Reliability: server-side state transitions, idempotent writes where possible, event log.
- Security: server auth, RLS, no client service key, validation and PII minimization.
- Maintainability: pure testable algorithms and shared types.
- Transparency: disclose synthetic data, forecast, fare multiplier and ETA assumptions.

## 9. Metric definitions

- Average passenger wait = mean(`accepted_at - requested_at`) for assigned rides.
- Pickup ETA error = mean absolute difference between predicted pickup minutes and simulated/actual pickup duration.
- Driver utilization = engaged minutes / online minutes.
- Completion rate = completed / (completed + cancelled + expired) for eligible trips.
- Workload spread = standard deviation or Gini of completed rides per online hour.
- Reassignment rate = rides with at least one reassign event / requested rides.
- Pooling savings = (sum individual fare estimates − pooled fare) / sum individual fare estimates, only when positive.

## 10. MVP release boundary

Complete only when a passenger can create a persisted ride; a driver can accept/reject and complete a valid lifecycle; matching ranks real candidate records using all stated factors; rejection/no-response triggers actual reassignment logic; the trained demand artifact and evaluation metrics are visible; zone pressure/surge/reposition consumes forecast and supply; pooling computes feasible route order and fare/time comparison; Simulation Lab computes results from identical inputs; admin sees shared persisted state; and security/smoke tests pass.

## 11. Assumptions requiring labels

Seed coordinates are artificial; average speed/buffer are configurable assumptions; demand history/model is synthetic and not calibrated to a real city; surge is a demonstration rule; GPS is simulated unless browser permission is granted; OSM base map does not imply traffic information.
