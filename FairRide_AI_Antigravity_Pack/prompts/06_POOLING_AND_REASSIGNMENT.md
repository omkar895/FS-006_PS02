# Phase 06 — Two-Passenger Ride Pooling and Automatic Reassignment

## Objective
Implement compatible ride pooling with route-order comparison, plus reliable reassignment and exception handling.

## Read first
`docs/01_PRODUCT_REQUIREMENTS.md`, `docs/02_PS2_TRACEABILITY.md`, `docs/07_API_AND_STATE_CONTRACTS.md`, `docs/08_ALGORITHMS_AND_DEMAND_MODEL.md`, `docs/09_SECURITY_PRIVACY_AND_FAILURES.md`.

## Part A — Pooling
1. Begin with two passenger requests only. Do not attempt an unconstrained fleet-wide vehicle routing optimizer in this sprint.
2. Define compatibility: compatible pickup proximity, destination/route proximity, passenger detour limit, capacity limit and ride status eligibility.
3. Enumerate the feasible pickup/drop-off sequences for two passengers while enforcing pickup-before-dropoff and capacity constraints.
4. Score candidate sequences using total estimated distance/time and each passenger's detour. Pick the best valid ordering.
5. Compare individual ride totals with shared route totals. Calculate each passenger fare using a documented allocation rule; show estimated savings and extra travel time.
6. Require user confirmation before joining a shared ride. Do not silently pool passengers.
7. Persist pool, member, route order and status. Handle one passenger cancelling without corrupting the other passenger's state.

## Part B — Reassignment and exceptions
1. Add an idempotent dispatch cycle with an explicit excluded-driver set and bounded attempt count.
2. Handle driver rejection, request timeout/no response, driver cancellation and delayed arrival. Define the threshold and source of each timeout.
3. When reassignment is needed, atomically release the previous assignment, append an event, exclude the previous driver for that dispatch cycle and request the next eligible candidate.
4. Prevent two drivers from accepting the same offer concurrently. Use transaction/conditional update semantics.
5. Keep passengers informed of status transitions and current assignment. Preserve the previous assignment in ride events for audit.
6. Add a deterministic “simulate no response” control for the demo. It must invoke the same server workflow as a real timeout path, not directly mutate UI state.
7. Set a maximum reassignment count and a terminal failure state/message when no candidates remain.

## Acceptance checks
- Pooling rejects incompatible requests and displays a valid stop order for compatible requests.
- Shared ride fare/time is compared to separate rides and assumptions are visible.
- Passenger confirmation is required.
- Rejection and timeout lead to another candidate when one exists.
- Previous driver is not immediately selected again in the same cycle.
- Duplicate/concurrent acceptance cannot create two active assignments.
- Event history explains every reassignment and failure.

## Report
Show a worked two-passenger route example, detour calculations, exception state diagram and concurrency/idempotency test output.
