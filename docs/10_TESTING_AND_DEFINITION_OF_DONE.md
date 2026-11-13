# Testing Strategy and Definition of Done

## 1. Quality gates

Run relevant checks after every phase. Before demo/release:
1. Typecheck (`tsc --noEmit` or configured equivalent).
2. Lint.
3. Unit tests.
4. Integration tests for auth/database/ride lifecycle.
5. Production build.
6. Manual browser smoke test at desktop and mobile widths.

A test not executed is **not run**, not passed.

## 2. Unit tests

### Location and fare
- Haversine known pair, symmetry and zero for same point.
- Coordinate validation.
- ETA formula with configured speed/buffer.
- Fare base/distance/surge/minimum/rounding.

### Matching
- Offline, busy, stale and too-far driver excluded.
- Score weights sum to 1.
- Lower ETA/distance improve score when other inputs held constant.
- Longer idle time improves idle score up to saturation.
- High workload reduces workload score.
- Smoothed acceptance works with zero offers.
- Deterministic tie break.
- Explanation contains actual selected-driver features.

### Demand and zone
- Fixed seed reproduces history.
- Feature builder has no current/future target leakage.
- Holdout split is chronological.
- Metrics finite and non-negative.
- Pressure denominator safe at zero available drivers.
- Surge stays within bounds.
- Repositioning accounts for travel cost and can recommend staying.

### Pooling
- Valid precedence orders generated.
- Each pickup occurs before own dropoff.
- Best feasible order has lowest cost among candidates.
- Detour/time constraints reject incompatible pairs.
- Negative savings never shown as a positive saving.

### State and reassignment
- All allowed transitions accepted; invalid transitions rejected.
- Terminal state cannot reopen.
- Rejection triggers next candidate.
- Timeout processed only after server deadline.
- Tried driver not reselected.
- Retry cap ends unassigned.
- Duplicate reassignment is idempotent.

## 3. Integration tests

- Signup creates profile with safe role.
- Passenger creates/reads own ride.
- Passenger cannot read another passenger's ride.
- Driver reads assigned ride but not unrelated rides.
- Driver cannot accept another driver's request.
- Concurrent acceptance results in one winner.
- Driver state updates create ride events.
- Rejection changes assignment and appends event.
- Admin KPIs aggregate stored rows.
- Forecast artifact imports with model/source metadata.
- Pool proposal persists stop sequence and fare shares.
- Simulation run persists inputs and computed metrics.

## 4. End-to-end smoke journeys

### E2E-01 Passenger booking
Login as passenger → choose seeded locations → request ride → verify ride ID, status, assignment/pending state, ETA disclosure and fare breakdown. Pass only if the ride is persisted and visible to passenger/admin.

### E2E-02 Driver acceptance/completion
Login as assigned driver → accept → Arriving → Ongoing → Completed → verify passenger timeline and history update.

### E2E-03 Reassignment
Create request with at least two candidates → reject or simulate no-response after deadline → verify next driver offered, previous driver excluded, event history complete.

### E2E-04 Zone intelligence
Load synthetic forecast → open demand view → verify demand, supply, pressure, surge and repositioning labels → change demo supply and verify recommendation recalculates.

### E2E-05 Pooling
Load compatible requests → calculate route order/detour/fare comparison → load incompatible pair and verify rejection reason.

### E2E-06 Simulation
Run both algorithms with same seed → verify identical input snapshots → verify calculated comparison metrics → reload saved run and confirm stable values.

## 5. UI tests

- Each main action has loading, empty, error, disabled and success states where applicable.
- Keyboard operates forms/buttons/menus/tables.
- Map has synchronized list alternative and visible OSM attribution.
- At 390×844, passenger can book and driver can accept without horizontal overflow.
- At 1366×768, admin map and key analytics don't overlap.
- Status/demand not conveyed by colour alone.
- Reduced-motion preference respected.

## 6. Demo readiness checklist

- [ ] Demo accounts provisioned securely (no passwords committed).
- [ ] Seed drivers/locations deterministic.
- [ ] Demo mode and simulated-source labels visible.
- [ ] All primary controls work.
- [ ] No console errors in core flows.
- [ ] Map loads or fallback works.
- [ ] No secrets in browser bundle/logs.
- [ ] Production build succeeds.
- [ ] Safe demo reset/seed procedure exists.
- [ ] Limitations are ready to explain.

## 7. Definition of done

A requirement is done only when implementation exists, primary and failure behaviour are handled, authorization/validation are in place, relevant tests pass or gaps are documented, UI reflects persisted state, and no false claim is made about simulated data or external integrations.
