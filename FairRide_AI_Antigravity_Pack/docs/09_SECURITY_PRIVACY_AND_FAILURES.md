# Security, Privacy and Failure Handling

## 1. Security posture

This is an academic prototype, but ride and role data still require least privilege, server-side authorization, RLS and data minimization.

## 2. Authentication and role authorization

- Supabase Auth handles authentication.
- Read identity from a verified server session/token, never from a posted user ID.
- Resolve `profiles.role` server-side for every protected page/API.
- Never trust role from body, query string, local storage or client state.
- Role changes are trusted/admin provisioning; ordinary profile update cannot modify role.
- Admin APIs reject passenger/driver sessions even if UI hides routes.

## 3. Secrets and environment

- Browser-visible variables may include Supabase URL and publishable/anon key only when RLS is correct.
- Service-role key and database secrets are server-only; never prefix with `NEXT_PUBLIC_`.
- `.env.local` is gitignored; `.env.example` contains placeholders.
- Never paste credentials into chat, screenshots, logs or docs.

## 4. Data minimization

- Passenger sees only assigned driver's allowed display information/location in dispatch or ride context.
- Driver sees only data needed to respond/complete their assigned ride.
- Unassigned candidates use callsign/vehicle label and metrics, not email/phone.
- Admin sees only operationally needed PII.
- Don't retain continuous location history beyond prototype need.
- Reset synthetic seed data separately from user data.

## 5. Database controls

- RLS on all exposed/public tables.
- Review `GRANT` and policies together.
- Prevent self-role escalation.
- Restrict direct `rides` updates; state writes go through server services/RPC.
- Ride event log is append-only for normal roles.
- Realtime channels are private/scoped; otherwise use authorized polling.
- Test direct access allowed and denied cases, not only UI.

## 6. Input validation and abuse

- Validate coordinates, string lengths, IDs, enums, fares and request counts.
- Rate-limit signup/ride creation/simulation/location writes where host allows.
- Cap simulation size and candidate counts.
- Prevent creating rides for another passenger ID.
- Prevent driver actions on another driver's request.
- Prevent passenger from updating assigned driver or fare.
- Escape user text; avoid HTML injection.
- Don't log tokens or full PII request bodies.

## 7. Failure scenarios

| Failure | Required behaviour |
|---|---|
| Supabase unavailable | Error + retry; don't claim booking succeeded |
| Stale driver location | Exclude candidate; show stale state to admin |
| No eligible driver | Mark unassigned and explain; allow retry |
| Driver rejects | Append event and attempt next driver |
| No response | Server checks deadline then attempts next driver |
| Duplicate booking submission | Idempotency returns existing ride or safe conflict |
| Two drivers accept race | Exactly one wins; other receives `RIDE_ALREADY_ASSIGNED` |
| Passenger cancels | Validate current state, log event and release driver if safe |
| Driver cancels before start | Reassign and preserve old assignment event |
| Delay after pickup | Flag/notify; never auto-transfer an ongoing trip |
| Forecast artifact missing | `Forecast unavailable`; labelled fallback only if configured |
| Map tile outage | Map error fallback, keep text location and candidate list usable |
| Geolocation denied | Seed locations/manual pin remain available; disclose source |
| Realtime fails | Bounded polling + last-updated timestamp |

## 8. User-facing error copy

- `We couldn't find an eligible driver nearby. Your request wasn't assigned.`
- `The driver did not respond in time. We're checking the next available driver.`
- `Location is out of date. This driver won't be considered until their location updates.`
- `Demand forecast is unavailable. Current ride booking is still available.`
- `The map service is temporarily unavailable. You can still choose a saved location.`

## 9. Product disclosures

No claim of background tracking, live traffic, real GPS, guaranteed arrival, actual commercial surge price or certified emergency transport. No payment information is collected in this prototype.
