# Phase 02 — Passenger/Driver Core Ride Lifecycle

## Objective
Deliver a complete end-to-end ride flow backed by PostgreSQL. This is the vertical slice that must work before advanced modules.

## Read first
`docs/01_PRODUCT_REQUIREMENTS.md`, `docs/05_UX_SCREEN_SPECIFICATION.md`, `docs/06_DATABASE_AND_RLS.md`, `docs/07_API_AND_STATE_CONTRACTS.md`, `docs/10_TESTING_AND_DEFINITION_OF_DONE.md`.

## Instructions
1. Build role-aware passenger and driver application shells with navigation appropriate to each role.
2. Passenger can create a ride with pickup, destination and allowed ride preferences. Validate required coordinates and text fields server-side.
3. Driver can toggle online/available state, update demo location, see ride offers and accept or reject an offer.
4. Implement the ride state machine exactly: `requested -> accepted -> arriving -> ongoing -> completed`, with valid cancellation and exception paths. Reject invalid transitions on the server.
5. Persist every meaningful lifecycle transition to `ride_events`; do not rely on client-only state.
6. Ensure request creation is idempotent where appropriate and prevent duplicate active rides/assignments.
7. Build fare and pickup ETA as clearly identified estimates from documented assumptions. No fake payment processing.
8. Provide useful loading, empty, error, retry and disabled states. Do not render non-functional buttons.
9. Build ride history for passengers and drivers from persisted records.
10. Add a deterministic demo seed with enough drivers and ride cases for testing, but label fixtures as demo/simulated.

## UX acceptance behaviour
- A passenger can submit a ride request and see a persisted Requested status.
- A driver can receive an eligible offer and accept it; passenger and driver views reflect the same ride.
- Driver can progress the ride through Arriving, Ongoing and Completed.
- Passenger can see the lifecycle and ride details.
- A refresh does not erase the ride or its state.
- Invalid transitions are rejected and shown with clear feedback.

## Acceptance checks
- Unit tests for every allowed and forbidden transition.
- API integration tests for passenger create, driver accept/reject, status updates and history.
- Verify authorization by role and record ownership.
- Verify concurrent accept attempts cannot assign one ride to multiple drivers.

## Report
Show the exact end-to-end flow tested, test output and any unimplemented edge cases. Do not proceed if the basic lifecycle is unreliable.
