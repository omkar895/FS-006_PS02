# Demo Scenario, Seed Data and Judge Walkthrough

## 1. Demo mode

Main shell must visibly say `DEMO / SIMULATED DATA`. Demo uses deterministic driver coordinates, seeded zone history, a synthetic demand forecast artifact and estimated fares. Never blend demo fixtures invisibly with user-created records.

## 2. Suggested synthetic zones

Use fictitious zone labels and seeded coordinates documented as synthetic. Do not imply coordinates represent real drivers or users.

- `central-market`
- `rail-hub`
- `campus-district`
- `tech-park`
- `residential-north`
- `hospital-quarter`

Mark records with `is_demo=true` or keep them in a dedicated demo dataset/tenant.

## 3. Seed drivers

Seed 12–15 drivers deterministically:
- 7 available;
- 3 busy;
- 2 offline;
- 1 available but stale location;
- varied idle durations, workload, completed rides, offers and acceptance counts.

Ranking demo fixture should include:
- Driver A: nearest, but very low idle duration / higher recent workload.
- Driver B: slightly farther but inside ETA guardrail, high idle duration / lower workload.
- Driver C: excluded because location stale or ETA exceeds threshold.

The winner must be determined by actual algorithm. Never hardcode the chosen driver ID.

## 4. Seed requests

Include deterministic fixtures for:
- one normal single ride;
- one request rejected by first driver and reassigned;
- one no-response request processed with explicit demo timeout action;
- one compatible two-passenger pooling pair;
- one incompatible pair to show rejection;
- enough historical data for analytics/simulation.

Demo reset must target only demo fixture records. Never truncate real profiles or user rides.

## 5. Judge demonstration (4–6 minutes)

### Part 1 — Passenger
1. Login as demo passenger.
2. Choose seeded pickup and destination.
3. Show nearby drivers and approximate ETA/fare.
4. Request ride and show selected driver plus `Why this driver?` explanation.

Narration: `The system filters by availability and freshness, applies a pickup ETA guardrail, then scores eligible candidates using distance, ETA, workload, acceptance history and idle time.`

### Part 2 — Driver and exception flow
1. Switch to assigned driver.
2. Show request, ETA and response deadline.
3. Reject or trigger explicit no-response demo action.
4. Show reassignment from passenger/admin view.
5. Accept and progress to Arriving/Ongoing/Completed.

Narration: `A rejection or timeout is handled by the dispatch service. It records the event and tries the next eligible driver without offering the same driver again in the same dispatch cycle.`

### Part 3 — Zone Intelligence
1. Open admin Demand Intelligence.
2. Show synthetic predicted vs actual demand by zone/hour.
3. Show model type, holdout MAE/RMSE and baseline comparison.
4. Show pressure, simulated surge and driver reposition recommendation.

Narration: `The model is trained on reproducible synthetic zone/hour history. This proves the training and integration workflow, not real-city predictive accuracy.`

### Part 4 — Pooling
1. Open compatible pending pair.
2. Show computed stop order and detour checks.
3. Compare separate vs shared fare/time and savings.

Narration: `The engine evaluates feasible pickup/drop-off permutations and respects pickup-before-dropoff and passenger detour constraints.`

### Part 5 — Simulation Lab
1. Run nearest-driver baseline and FairRide with same deterministic seed.
2. Compare wait, pickup distance, utilization and workload distribution.
3. Explain trade-offs honestly.

Narration: `The test measures trade-offs rather than forcing FairRide to win every metric. Results are synthetic scenario outcomes.`

## 6. Judge questions

**Why not always assign the nearest driver?** Nearest optimizes one pickup but ignores idle time/workload. FairRide keeps a max-ETA guardrail, then considers multiple factors among acceptable candidates.

**Is the demand model real?** No. It is trained on generated data to demonstrate a reproducible pipeline, holdout evaluation and integration. Real deployment needs consented/aggregated historical data and revalidation.

**Is ETA accurate?** It is based on straight-line distance and assumed speed unless a routing provider is configured. It is not live traffic ETA.

**How is fairness measured?** Completed rides per online hour, workload spread/Gini and idle-time distribution, alongside passenger wait and driver utilization.

**What if no driver qualifies?** Mark unassigned with a reason. Do not exceed ETA guardrail or retry forever.

**Does it take payment?** No. Fare is illustrative; no payment collection is implemented.

## 7. Demo reliability checklist

- Provision a passenger, at least two available drivers and one admin.
- Use known seed and deterministic ride cases.
- Run demand model training before the demo and verify artifact exists.
- Ensure first rejection scenario has a second eligible driver.
- Keep backup screenshots/video only for map tile outage; do not replace live core workflow with screenshots.
- Prepare one compatible and one incompatible pooling pair.
- Run Simulation Lab before presentation, then rerun live if possible.
