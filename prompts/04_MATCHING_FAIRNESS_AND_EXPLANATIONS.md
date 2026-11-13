# Phase 04 — Intelligent Allocation, Fairness Scoring and Explanation

## Objective
Build and test the core dispatch engine using distance, pickup ETA, current workload, acceptance history and idle time.

## Read first
`docs/02_PS2_TRACEABILITY.md`, `docs/07_API_AND_STATE_CONTRACTS.md`, `docs/08_ALGORITHMS_AND_DEMAND_MODEL.md`, `docs/10_TESTING_AND_DEFINITION_OF_DONE.md`.

## Instructions
1. Implement matching as pure typed functions under `lib/algorithms/`; do not put ranking logic in React components or API handlers.
2. Determine eligibility first: driver online, available, not assigned to another active ride, location sufficiently recent, not excluded by the current reassignment cycle.
3. Normalize each ranking factor to a documented 0..1 scale with clear directionality. Use the documented default weights: ETA 0.30, idle time 0.25, distance 0.20, workload 0.15, acceptance reliability 0.10. Keep weights configurable in one typed module and ensure they sum to 1.
4. Score only eligible candidates. Do not make a driver with an invalid/offline state win due to a high fairness value.
5. Store an allocation decision snapshot: candidate factor values, normalized scores, weights, total score, chosen driver and reason codes. This permits an honest explanation after the underlying driver state changes.
6. Provide an understandable explanation for passenger/admin and a driver-facing summary. Avoid exposing another driver's private performance information.
7. Implement a nearest-eligible-driver baseline using exactly the same eligible candidate set and request data for later simulation comparison.
8. Ensure deterministic tie-breaking and stable sorting.
9. Add safeguards against fairness gaming: cap/normalize idle-time influence, use server timestamps, and document that acceptance rate is a limited proxy for reliability rather than a moral judgement.
10. Add metrics to compare average wait, driver utilization, idle-time distribution and unassigned requests.

## Required tests
- Nearest driver does not always win when fairness factors materially change the score.
- Ineligible/offline/busy/stale drivers are excluded.
- Score is bounded and weights total 1.
- Tie breaks are deterministic.
- Explanations match the stored factor snapshot.
- Baseline and FairRide use identical input data.

## Acceptance checks
- Live ride assignment uses the fairness engine, not random choice.
- Admin can inspect the allocation rationale.
- User-facing explanations are concise and truthful.
- Simulation results can be independently reproduced from stored run inputs.

## Report
Provide scoring formula, normalization ranges, weights, sample candidate ranking and test results. Call out fairness trade-offs rather than claiming mathematically perfect fairness.
