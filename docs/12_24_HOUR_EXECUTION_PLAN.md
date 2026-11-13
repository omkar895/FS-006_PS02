# 24-Hour Implementation Plan

Timeboxes are targets, not promises. If a phase slips, reduce decorative scope before removing mandatory logic.

| Time | Phase | Deliverable | Exit gate |
|---|---|---|---|
| 0–1 h | Audit/setup | App scaffold, TypeScript, lint, folder structure, env template | App boots; baseline checks recorded |
| 1–3 h | Auth/schema | Supabase Auth, migrations, profiles, driver/rides, basic RLS | Passenger/driver/admin access verified |
| 3–6 h | Core lifecycle | Booking, availability, create ride, accept/reject, status, event log | Passenger→driver→completion flow passes |
| 6–8 h | Map/location | Leaflet, seeded places, markers, Haversine/ETA disclosure | Desktop/mobile map and fallback work |
| 8–10 h | Dispatch/fairness | Eligibility, weighted score, explanation, nearest baseline | Unit tests for factors/exclusions pass |
| 10–12 h | Reassignment | Reject, timeout action, retry set, delay exception | Two successive driver offers tested |
| 12–15 h | Model/zones | Synthetic data, Gradient Boosting training, metrics/artifact, pressure/surge/reposition | Reproducible artifact consumed by app |
| 15–17 h | Pooling | Compatibility, stop-order enumeration, fare/time comparison | Feasible and infeasible pair tests pass |
| 17–19 h | Admin/simulation | Control Center, fleet/demand/dispatch, baseline vs FairRide | Metrics computed from scenario data |
| 19–21 h | Responsive/quality | UI states, accessibility, mobile polish | Passenger/driver mobile flows work |
| 21–23 h | Test/deploy | E2E tests, deployment and env verification | Build and critical flows pass |
| 23–24 h | Rehearsal | Reset/seed, judge walkthrough, evidence | Five mandatory modules demonstrable |

## If time becomes constrained

**Never remove:** core booking, valid driver response/state flow, actual driver ranking, evidence for all five mandatory advanced features (narrow MVP implementation is acceptable), synthetic-data disclosure and admin evaluation.

**Reduce first:** marketing landing page, advanced profile settings, vehicle categories, decorative charts, animations, real geocoding, real route provider, payment/notifications.

## Anti-scope-creep rules

- Do not add a new framework after setup.
- Do not add microservices.
- Do not rewrite working logic for cosmetic reasons.
- Do not add external APIs without a specific acceptance need.
- Do not use AI-generated placeholder chart data.
- Do not train a large neural network; PS2 asks for a small model such as Prophet/gradient boosting.
- Do not claim production readiness from a successful demo.
