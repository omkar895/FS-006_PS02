# FairRide AI — Frontend Engineering Guide

The UI requirements are defined in `docs/04_DESIGN_SYSTEM.md` and `docs/05_UX_SCREEN_SPECIFICATION.md`. This file describes how to implement them in React/Next.js without coupling UI components to database internals.

## Chosen frontend stack

- React + Next.js 16 App Router + TypeScript.
- Tailwind CSS for layout and tokens.
- Accessible components built with native HTML and a small component library only where useful.
- Leaflet / React-Leaflet for map views.
- Recharts for analytics and simulation charts.
- Zod for form and API response validation.

The PS2 names React, Angular or Vue as alternatives. This project chooses React through Next.js; do not add Angular or Vue.

## App Router and rendering boundaries

- Prefer Server Components for page shells, role-specific data loading and static content.
- Use Client Components only for interactive controls, map layers, charts, local form state and realtime/polling subscriptions.
- Keep map imports client-only; load Leaflet CSS and give every map container an explicit height.
- Use Next.js Route Handlers for server-side mutations and protected data access.
- Do not let components import the Supabase service-role client or issue privileged writes.
- Put shared server-side authorization in reusable server helpers; enforce it on every protected route, not only navigation layouts.

## Recommended component boundaries

```text
components/
  app-shell/
  navigation/
  forms/
  maps/
    RideMap.tsx
    DriverMarkers.tsx
    ZoneOverlay.tsx
    MapLegend.tsx
  passenger/
    BookingPanel.tsx
    FareEstimate.tsx
    DriverMatchSummary.tsx
    RideTimeline.tsx
  driver/
    AvailabilityControl.tsx
    IncomingRequest.tsx
    ActiveTripActions.tsx
    DriverFairnessSummary.tsx
  admin/
    OperationsHeader.tsx
    FleetTable.tsx
    DispatchRankings.tsx
    DemandHeatmap.tsx
    PoolProposalTable.tsx
    SimulationControls.tsx
    SimulationResults.tsx
  data-display/
    StatusBadge.tsx
    MetricValue.tsx
    EmptyState.tsx
    ErrorState.tsx
    DataProvenance.tsx
```

These are suggested boundaries, not a mandate to create dozens of tiny files. Combine components when that improves cohesion.

## Data flow

1. Form validates locally for fast feedback.
2. Route Handler authenticates the session, checks role/ownership, validates again with Zod, applies domain logic and persists changes.
3. API response returns the authoritative ride state and event/decision metadata.
4. UI updates from the server response or a verified subscription/poll response.
5. For assignment and lifecycle mutations, do not optimistically show success before the server confirms it.

Do not store a second, divergent ride state inside each dashboard. Use typed API wrappers and one documented domain contract from `docs/07_API_AND_STATE_CONTRACTS.md`.

## Role experience boundaries

### Passenger
- Map is the primary workspace, with a compact booking rail on desktop and a bottom sheet on mobile.
- Reveal detail progressively: pickup/destination first, fare/ETA after both points are selected, allocation explanation after matching.
- Keep estimate disclosures close to values.

### Driver
- Mobile-first, high contrast, 44–48 px minimum action targets.
- Availability, incoming request, current trip and next action receive priority.
- Never use tiny charts or admin-style data density on the driver home screen.

### Admin
- Desktop-optimised operational console that remains usable on tablet/mobile.
- Use tables/lists for ranked candidates and events; a map supports, rather than replaces, those lists.
- Put the Simulation Lab in its own route with clear scenario controls and measured results.

## Interaction states required

Every server-driven section needs loading, empty, error and retry states. Forms need idle, validating, submitting, success and server-error states. Ride controls need disabled states while the server is processing or when a transition is invalid. Do not leave buttons as visual placeholders.

## Maps and estimates

- OSM attribution remains visible.
- Provide a text/list alternative to map markers.
- Use Haversine only for straight-line distance. Label it accordingly.
- ETA must show its assumption and must not be called live navigation.
- Simulated marker movement must require a demo control or deterministic simulation tick and must be labelled.
- Handle map tile failure without blocking booking.

## Charts and operational data

- Chart title describes the question, not the library component.
- Axes include units; include data window and source.
- Distinguish predicted and actual with more than colour.
- No fake animation, arbitrary KPI values or chart points added to improve visual balance.
- Empty data is a valid state and should be communicated honestly.

## Accessibility and responsive requirements

- Semantic landmarks and heading hierarchy.
- Visible keyboard focus and keyboard-operable menus/forms.
- Proper labels and error associations.
- Status never communicated by colour alone.
- Text contrast target WCAG AA.
- Respect `prefers-reduced-motion`.
- Test passenger and driver flows at narrow mobile widths; test admin console at desktop and tablet widths.
