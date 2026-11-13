# Algorithms, Dispatch Policy and Demand Model

This is the algorithm contract. Implementations must be deterministic for identical inputs and have unit tests. Keep formulas and weights configurable.

## 1. Haversine distance

Use Earth mean radius `R = 6371.0088 km`.

```ts
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineKm(a: Coordinate, b: Coordinate): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(Math.min(1, h)));
}
```

Validate coordinate ranges before calculation. Haversine is a great-circle distance, not road distance.

## 2. Approximate ETA

`pickup_eta_minutes = (haversine_km / assumed_average_speed_kmh) * 60 + pickup_buffer_minutes`

Suggested configurable demo values: average urban speed 22 km/h; pickup buffer 2 minutes. Keep these in configuration, not scattered across components. Round only for display. Required disclosure: `Estimated using straight-line distance and assumed average speed; not live road-traffic navigation.`

### Indicative fare calculation

Use one configurable demo formula across passenger UI, driver request and admin views:

`estimatedRoadKm = haversine(pickup, destination) * roadDetourFactor`

`subtotal = baseFare + estimatedRoadKm * ratePerKm`

`fareEstimate = roundToRupee(max(minimumFare, subtotal * surgeMultiplier))`

Initial demonstration constants: `baseFare = ₹35`, `ratePerKm = ₹12`, `roadDetourFactor = 1.20`, `minimumFare = ₹50`. These are illustrative project assumptions, not local market prices. The detour factor is only a rough correction over straight-line distance; it is not a routed road distance. Apply the bounded surge multiplier from Section 7 only when the selected pickup zone's simulated zone-intelligence calculation justifies it. Return an itemized breakdown and display `Indicative fare — route distance and pricing are simulated estimates.` Do not represent the amount as a quote, a real tariff or a payment.

## 3. Candidate eligibility

Filter before ranking:
1. Availability is `available`.
2. Location exists and age is below configured freshness threshold (demo default 120 seconds for browser source; seed fixtures use explicit fixed simulation time).
3. Driver has no active ride.
4. Vehicle category is compatible.
5. Pickup ETA is not greater than `maxPickupEtaMinutes` (demo default 12 minutes).
6. Driver is not in this dispatch cycle's tried-driver set.

If no candidate passes, return `NO_ELIGIBLE_DRIVERS` with aggregate exclusion counts for admin. Never silently select an ineligible driver.

## 4. FairRide multi-factor driver ranking

### Design principle

Fairness applies **inside an eligibility guardrail**. First remove drivers who exceed acceptable pickup ETA; then rank the remaining candidates. Do not send a passenger a much later pickup merely to improve a fairness score.

### Features
- `distanceKm`: Haversine distance to pickup.
- `pickupEtaMinutes`: configured estimate.
- `workload`: active trip count and/or completed trips in evaluation window; higher workload reduces score.
- `acceptanceReliability`: smoothed historical acceptance ratio, not a raw percentage. Use `(accepted + alpha) / (offered + alpha + beta)` with alpha=2, beta=2 initially. A single decline should not become a punitive signal.
- `idleMinutes`: since last completion or since becoming available.

### Normalization

For each eligible candidate set, convert lower-is-better values into `[0,1]` quality scores. For equal values, assign the same neutral/high score; avoid divide-by-zero. Clamp all scores.

- `distanceScore = 1 - minMax(distanceKm)`
- `etaScore = 1 - minMax(pickupEtaMinutes)`
- `workloadScore = 1 - normalizedWorkload`
- `reliabilityScore = smoothedAcceptanceReliability`
- `idleScore = min(idleMinutes / idleSaturationMinutes, 1)`

### Default formula

`score = 0.20*distanceScore + 0.30*etaScore + 0.15*workloadScore + 0.10*reliabilityScore + 0.25*idleScore`

Higher score wins. These are initial prototype weights, not universal truths. Store weights and feature contributions for every decision. Tie-break by lower ETA, then longer idle time, then stable driver ID.

### Explanation

Example only; generate from actual values: `Selected because this driver is within the pickup-time limit, has a short ETA, low current workload and has waited longer than other eligible drivers.` Admin sees numeric contributions; passenger sees short explanation; driver sees allocation policy. Never state an advantage unsupported by stored values.

## 5. Baseline

`Nearest eligible driver`: identical eligibility filters and candidate snapshot, then minimum pickup distance (tie-break ETA, driver ID). Do not make the baseline deliberately weak.

## 6. Predictive demand forecasting — mandatory trained small model

### Data generation

Generate reproducible synthetic demand in 15-minute buckets for at least 6 zones × 90 days × 96 intervals/day. Include zone identity, hour-of-day, quarter-hour position, day-of-week/weekend, zone-specific demand level, commute/lunch/evening patterns and deterministic noise. The target is demand 30 minutes ahead (two 15-minute intervals). The PS2 brief specifies zone/hour history but does not prescribe an exact forecast horizon; 30 minutes is the concrete implementation choice for this prototype. This dataset is artificial; include `is_synthetic=true` and generation seed in metadata.

### Features

At minimum:
- zone encoding (one-hot or carefully stable encoding);
- hour, quarter-hour position within the hour, day of week and weekend indicator;
- lag-1 and lag-2 demand for the same zone (15 and 30 minutes);
- rolling mean for the previous four 15-minute observations (one hour);
- comparable 15-minute slot from the previous day and previous week where available.

Predict the target at timestamp `t + 30 minutes` using only information available at timestamp `t`. Generate lag features only from earlier timestamps. Do not leak target-window actual demand or future values.

### Model and evaluation

Train `sklearn.ensemble.GradientBoostingRegressor` or `HistGradientBoostingRegressor` on synthetic historical zone/15-minute demand with hour-of-day features. Use a chronological split (e.g. first 75–80% timestamps train, latest 20–25% holdout). Compare against a simple historical zone/hour average baseline. Compute MAE and RMSE for both. Record model choice, hyperparameters, feature set, seed and split. If the trained model loses to baseline, report it honestly and use labelled baseline fallback rather than hiding the result.

### Export artifact

Export `data/generated/zone-demand-forecast.json` with this shape:

```json
{
  "metadata": {
    "modelName": "GradientBoostingRegressor",
    "modelVersion": "synthetic-demand-v1",
    "generatedAt": "ISO-8601",
    "trainingSeed": 4172,
    "isSynthetic": true,
    "trainRows": 0,
    "testRows": 0,
    "modelMetrics": { "mae": 0.0, "rmse": 0.0 },
    "baselineMetrics": { "mae": 0.0, "rmse": 0.0 }
  },
  "forecasts": [
    { "zoneSlug": "rail-hub", "forecastFor": "ISO-8601", "horizonMinutes": 30, "predictedRequests": 0.0, "actualRequests": null }
  ]
}
```

Zeros above are schema examples, not claimed results. Real artifact must contain computed values. Preserve regression values for evaluation; presentation may round expected counts. Node app reads artifact or imports rows into `demand_forecasts`. Every forecast row records model version/source.

### UI requirements

- Heatmap shows forecast demand and available driver supply separately.
- Actual-vs-predicted chart includes time and zone; forecast metadata states the 30-minute horizon.
- Show model type/version, generated timestamp, MAE/RMSE and `Synthetic demonstration data` label.
- Do not claim real-time or production-validated forecasting.

## 7. Zone intelligence: surge and repositioning

### Pressure

`pressure_z = predictedRequests_z / max(availableDrivers_z, minimumSupplyFloor)`

Use a non-zero supply floor; always also show raw predicted demand and driver count.

### Simulated surge

`surge = clamp(1.00 + k * max(0, pressure - threshold), 1.00, 1.80)`

Initial demo values: `k=0.12`, `threshold=2.0`, maximum 1.80. This is a demonstrator rule, not a commercial pricing policy. Show formula/cap in the detail view.

### Reposition recommendation

For each idle available driver and target zone:

`repositionUtility = normalizedDemandPressure - lambda * normalizedTravelCost`

Recommend the target with highest positive utility. If all values are non-positive, recommend staying. Show destination zone, estimated distance, predicted demand, available driver count and reason. Driver must accept; virtual move in simulator must be labelled. Cap recommendations per zone so all drivers do not converge on one location.

## 8. Multi-passenger pooling and route optimization

### Compatibility
For two pending requests A and B, evaluate same vehicle class, pickup proximity (initial demo threshold 2 km straight-line), destination-direction compatibility, passenger wait constraints, max detour ratio (initial 1.35 per passenger) and max extra time (initial 10 minutes per passenger).

### Stop sequence
Stops are `A_pickup`, `A_dropoff`, `B_pickup`, `B_dropoff`. Enumerate all permutations that preserve each passenger's pickup-before-own-dropoff constraint. Calculate total path distance/time. Reject sequences outside detour/wait limits. Choose the lowest weighted route cost (e.g. total distance plus penalty for added passenger time).

### Fare
- Calculate separate estimate for each request.
- Calculate pooled total from shared route distance and documented pool fee assumptions.
- Allocate pooled total using documented marginal route-cost proportions; ensure sum of passenger pooled fares equals shared total.
- Savings = separate estimate − pooled fare; show savings only when positive.
- Show added minutes and stop order. If there is no feasible/saving pool, don't propose it.

MVP is two passengers; don't spend 24 hours building a large vehicle-routing optimizer.

## 9. Automatic reassignment and exception handling

### Triggers
- Driver rejects.
- Response deadline passes/no response.
- Driver cancels after accepting but before trip starts.
- Pickup ETA delay exceeds threshold while ride is not `ongoing`.

### Retry sequence
1. Lock/load ride and verify state/attempt count.
2. Append exception event.
3. Mark `reassigning`.
4. Add previous driver to tried-driver set.
5. Find/rank remaining eligible drivers.
6. If candidate exists, assign next driver, set `requested`, issue new deadline and event.
7. If none/max attempts reached, set `unassigned` and notify passenger.
8. Never automatically reassign an `ongoing` ride.

MVP timeout: client countdown calls an authenticated endpoint; server verifies the deadline. Client clock is not authoritative. Production would need a durable scheduled worker/queue. Do not claim such a worker exists in the prototype.

### Idempotency

Retry is safe when called more than once. Use attempt count/operation key and transaction/row lock. Duplicate calls cannot assign multiple drivers or append contradictory transitions.

## 10. Simulation Lab methodology

### Inputs
Deterministic driver snapshot (availability, coordinates, idle time, workload, acceptance history), deterministic request sequence, scenario (`balanced`, `high_demand`, `low_supply`), fixed seed, max pickup ETA and score weights.

### Execute both strategies
- Baseline: nearest eligible driver.
- FairRide: fairness-aware ranking after same eligibility filter.
- Both start from identical cloned driver/request state and time progression.
- Never run first strategy against live/depleted state and then start the second on altered state.

### Metrics
- Mean and median request-to-accept wait.
- Mean pickup distance and ETA distribution.
- Unassigned request count/rate.
- Driver utilization = engaged minutes / online minutes.
- Rides per online hour per driver.
- Workload spread (standard deviation) and optional Gini coefficient.
- Completion rate in simulated lifecycle.

FairRide may improve workload distribution but slightly increase mean pickup ETA. Display trade-offs. Results are synthetic scenario outcomes, not a real-world controlled trial.

## 11. Required algorithm tests

Haversine symmetry/known-distance/same-point; invalid coordinate rejection; deterministic ties; factor sensitivity; busy/offline/stale/over-limit exclusion; fixed-seed demand reproducibility; chronological split/no leakage; bounded pressure/surge; stay-in-place reposition option; pooling precedence/detour; no repeat driver during retry; bounded reassignment; identical simulation input snapshots.
