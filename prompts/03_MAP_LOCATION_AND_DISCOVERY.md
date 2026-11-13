# Phase 03 — Maps, Location and Nearby Driver Discovery

## Objective
Add map-based pickup/destination selection and nearby-driver discovery using OpenStreetMap and Leaflet.

## Read first
`docs/03_ARCHITECTURE.md`, `docs/04_DESIGN_SYSTEM.md`, `docs/05_UX_SCREEN_SPECIFICATION.md`, `docs/07_API_AND_STATE_CONTRACTS.md`, `docs/14_DECISIONS_AND_LIMITATIONS.md`.

## Instructions
1. Use Leaflet/React-Leaflet in a client component. Avoid importing browser-only map code during server rendering; use dynamic loading where required.
2. Use OpenStreetMap tiles with visible attribution and follow the public tile usage policy. Do not bulk-download, prefetch or treat the community tile service as a production SLA-backed service.
3. Render pickup, destination, available drivers and active ride markers with distinct, accessible map legends. Use custom restrained markers, not emoji confetti.
4. Allow users to search/select pickup and destination. If an external geocoding provider is not configured, offer a deterministic demo-location picker rather than presenting fake geocoding as real.
5. Compute straight-line distance using a tested Haversine implementation. Display units clearly.
6. Compute indicative pickup ETA from a documented assumed average speed and explicitly label it as an estimate, not live road ETA or traffic-aware navigation.
7. Show nearby drivers using the real seeded/database driver state and location; filter unavailable drivers and stale coordinates.
8. Add a demo control to move simulated driver coordinates in a predictable way. Keep simulation-only movement clearly identified.
9. Make the map responsive, keyboard-accessible around its surrounding controls, and provide a list alternative for map entities.
10. Handle missing tiles/network with a non-blocking fallback and preserve form values.

## Acceptance checks
- Map loads with visible attribution.
- Pickup and destination selection persist into the ride request.
- Distances match unit tests for known coordinates.
- Unavailable/stale drivers are not presented as live candidates.
- Map failure does not block manual selection or ride creation.
- No claim of road routing or live traffic unless a real routing/traffic provider is integrated.

## Report
Document tile provider, location/geocoding limitations, ETA assumptions and verified map interactions.
