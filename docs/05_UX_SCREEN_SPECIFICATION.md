# UX and Screen Specification

## 1. Route map

### Public
- `/` — concise product introduction and role entry.
- `/login` — sign in.
- `/signup` — account creation and passenger/driver role selection.
- `/auth/callback` — Supabase callback.

### Passenger
- `/passenger/book` — booking workspace.
- `/passenger/matching/[rideId]` — matching/request state.
- `/passenger/ride/[rideId]` — active ride.
- `/passenger/history` — ride history/fare details.
- `/passenger/profile` — profile/preferences.

### Driver
- `/driver` — home and availability.
- `/driver/requests` — incoming requests.
- `/driver/ride/[rideId]` — active trip workflow.
- `/driver/history` — history/earnings.
- `/driver/profile` — profile/vehicle.

### Admin
- `/admin/overview` — Control Center overview.
- `/admin/fleet` — fleet map/driver list.
- `/admin/dispatch` — dispatch queue and allocation explanations.
- `/admin/demand` — zone demand, forecasts and repositioning.
- `/admin/pooling` — compatible requests and pool plan.
- `/admin/simulation` — nearest baseline vs FairRide Simulation Lab.
- `/admin/analytics` — operational metrics and event history.

## 2. Global shells

### Passenger shell
Top bar: brand, Book Ride, My Rides, account menu. Desktop: 380–420 px booking rail plus flexible map. Mobile: full map with fixed/collapsible bottom sheet; use a simpler sheet rather than risky drag physics if schedule is tight.

### Driver shell
Mobile-first full-width app shell, clear availability header, bottom nav (Home, Requests, History, Profile). Active trip replaces home content. Avoid crowded analytics.

### Admin shell
Left navigation: Overview, Fleet, Dispatch, Demand, Pooling, Simulation, Analytics. Top bar: current page, `DEMO / SIMULATED` mode, account menu. Main region has page-specific workspace, filters and data timestamps.

## 3. Passenger screens

### 3.1 Book Ride (`/passenger/book`)
**Purpose:** choose pickup/destination and request a ride.

**Desktop:** left rail with title, pickup, destination, optional vehicle type, fare estimate preview, `Find a driver` and nearby list; right-side interactive Leaflet map with seed locations, drivers, pickup/destination markers and fit-to-route control.

**States:**
- Initial: locations empty; map centred on demo area.
- Pickup selected: field label + pickup marker.
- Destination selected: destination marker and dashed direct connector; estimate note visible.
- Searching: loading label; duplicate submission disabled.
- No drivers: reason + retry action.
- Validation/network error: inline message; preserve user selections on retry.

**Actions:** search/select seeded place; choose active pickup/destination then click map; swap endpoints; request ride; toggle nearby drivers.

**Disclosure shown on screen:** `Distance and pickup time are estimates based on straight-line distance and an assumed average speed. The map does not show live traffic.`

### 3.2 Matching (`/passenger/matching/[rideId]`)
- Show status and last-updated time.
- Assigned: driver demo name/callsign, vehicle label, pickup ETA and expandable `Why this driver?` explanation.
- Pending: `Finding a driver`; only show aggregate candidate count if safe.
- Reassigning: `The first driver could not take this request. Finding another available driver.`
- Unassigned/expired: clear reason and action to retry.

### 3.3 Active ride (`/passenger/ride/[rideId]`)
- Map shows pickup, destination, driver position with source label, direct line/route approximation and status.
- Timeline: Requested → Accepted → Arriving → Ongoing → Completed.
- Fare estimate/distance visible; final fare only after completion.
- Cancellation only in allowed states and with confirmation.
- Delay notice includes whether another driver is being considered.

### 3.4 Ride history
Date, pickup → destination, driver label, status and fare; filters all/completed/cancelled; empty state links to Book Ride.

## 4. Driver screens

### 4.1 Driver home (`/driver`)
- Greeting and prominent `Go online` / `Go offline` control.
- Explain why offline is unavailable during an active ride.
- Map/current location freshness + source label.
- Summary: completed rides, online minutes and demo earnings estimate.
- Fairness insight: idle time and how it enters eligible allocation; never guarantee rides.

### 4.2 Incoming request (`/driver/requests` or sheet)
Show pickup label, pickup distance/ETA, destination summary, approximate fare/earning, Accept/Reject, response deadline and loading/expired states. Keep touch targets 48 px where possible. Server response, not card disappearance, confirms acceptance.

### 4.3 Active trip (`/driver/ride/[rideId]`)
Only show next valid action in sequence Accepted → Arriving → Ongoing → Completed. Show endpoints and estimate. Confirm before completion. If location movement is simulated, give explicit `Advance simulated location` / `Simulate arrival` controls and label them.

### 4.4 Driver history
Date, endpoints, trip status, earning estimate and duration. Fairness summary must be informative, not a hidden penalty score for declining.

## 5. Admin screens

### 5.1 Control Center (`/admin/overview`)
Compact operational summary: active rides, available drivers, completed rides in window, average wait, unassigned/exception rides. Main view: fleet/ride map, zone pressure list and recent dispatch-event table. Every metric includes window/source.

### 5.2 Fleet (`/admin/fleet`)
Large map + driver table. Filters: available, busy, offline, stale. Rows show callsign, availability, location timestamp, zone and current ride state. Selecting row focuses map and detail area. Avoid unnecessary personal data.

### 5.3 Dispatch Engine (`/admin/dispatch`)
Request queue with age, pickup, candidate count, assigned driver and state. Selecting request shows ranked candidates and normalized factor contributions; exclusion reasons include offline, stale, busy and ETA limit. Show selected-driver rationale. Demo-only manual exception triggers must be audit logged.

### 5.4 Demand Intelligence (`/admin/demand`)
Zone heatmap/list, low/medium/high legend, forecast horizon, predicted-vs-actual chart, synthetic-data badge, model name/version/generated timestamp and MAE/RMSE. Per-zone table: predicted requests, actual if available, available drivers, pressure, surge multiplier and reposition recommendation. `Why this zone?` reveals input factors. Reposition is a recommendation, not teleportation.

### 5.5 Pooling (`/admin/pooling`)
Pending requests and compatible pair proposals. Show pickup proximity, destination compatibility, stop order, total distance/time, separate vs shared fare, extra time and savings. Incompatible pairs show reason.

### 5.6 Simulation Lab (`/admin/simulation`)
Explain baseline `Nearest eligible driver` vs `FairRide multi-factor allocation`. Controls: scenario, request count, seed and max pickup ETA. Run persists a simulation record. Results: mean/median wait, pickup distance, unassigned count/rate, driver utilization, workload spread/Gini and completion rate. All outputs calculated. Label `Synthetic scenario; not a real-world trial`.

### 5.7 Analytics (`/admin/analytics`)
Time filter limited to available data. Metrics: wait, pickup ETA, utilization, completion and reassignments. Event table with timestamp, ride, event type and actor role. Empty state when no data exists; don't inject random values.

## 6. Navigation and access

- Login redirects to correct role workspace.
- Missing/inconsistent role blocks protected pages with safe setup message.
- Passenger cannot access driver/admin by changing URL; driver cannot access admin.
- Protected page data and every API independently verify role server-side.

## 7. Responsive behaviour

| Width | Behaviour |
|---|---|
| ≥1440 px | Full admin rail, wide map/list split, desktop tables |
| 1024–1439 px | Compact rail, map/list split; tables can scroll horizontally |
| 768–1023 px | Collapsible nav, stacked admin panels, sensible map height |
| <768 px | Passenger map + bottom sheet; driver mobile-first; admin compact nav + stacked sections |

Do not just shrink desktop. Reorder by task priority and preserve touch targets/map controls.

## 8. Frontend implementation guardrails

- Use typed API wrappers; components must not directly mutate database tables.
- One source of truth for ride state comes from API response/subscription.
- Avoid optimistic state changes for assignment/lifecycle; update after server confirmation.
- Loading skeletons only where layout stability helps.
- Every button/menu item navigates or executes a meaningful operation.
- Map has loading/error/empty states and synchronized list alternative.
