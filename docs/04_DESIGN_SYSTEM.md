# FairRide AI — Design System and Visual Direction

## 1. Design concept: Urban Mobility Editorial

FairRide should feel like a carefully designed mobility operations product: calm, legible, confident and information-rich. It should not resemble a generic AI-generated SaaS template. Passenger and driver experiences are direct and action-oriented; the admin console should feel like a real dispatch tool used to monitor a moving system.

The map, trip state and operational data are the visual content. Avoid decoration that competes with them.

## 2. Visual principles

1. **Map is a working surface:** give it space, a clear legend and contextual controls.
2. **Hierarchy before ornament:** use typography, alignment, spacing and rules to create emphasis.
3. **Meaningful density:** admin screens may be dense, but every metric must answer an operational question.
4. **One dominant action per view:** book, accept/complete, inspect/run simulation.
5. **Status is explicit:** pair colour with text/icon; never rely on colour alone.
6. **Data provenance is visible:** `SIMULATED`, `FORECAST`, `LIVE / USER LOCATION` and `ESTIMATE` are distinct labels.
7. **Composition varies by task:** don't repeat the same dashboard card grid on every page.

## 3. Colour tokens

Use CSS variables and verify contrast. These values are a starting palette.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#18231D` | Primary text, dark shell elements |
| `--ink-soft` | `#35423A` | Secondary headings |
| `--paper` | `#F4F3ED` | Main canvas |
| `--surface` | `#FFFFFF` | Primary content surface |
| `--surface-muted` | `#EAECE5` | Quiet panels and selected rows |
| `--line` | `#D6DCD2` | Dividers and borders |
| `--forest` | `#245A43` | Primary action, positive state |
| `--lime` | `#D6EE74` | Restrained accent for high-value data |
| `--amber` | `#B96A2E` | Delay, warning, elevated demand |
| `--red` | `#B7443E` | Error, cancellation, critical exception |
| `--blue-muted` | `#476B75` | Secondary map layer only |
| `--muted` | `#68746C` | Metadata and helper copy |

Avoid large blue/purple gradients and gradient meshes. Prefer solid fills, subtle borders and restrained map overlays.

## 4. Typography

- Primary: **IBM Plex Sans** or **Manrope**. Pick one and use it consistently.
- Numeric/table values: tabular numerals; optional IBM Plex Mono only for compact technical IDs/coordinates, never decorative uppercase labels.
- Use sentence case. Avoid tracked all-caps labels as decoration.
- Page title: 28–36 px desktop, 25–30 px mobile.
- Section title: 17–21 px; body: 14–16 px; helper metadata: 12–13 px while maintaining readability.
- Important numbers: 24–32 px with unit/label nearby.

## 5. Layout and spacing

- 4 px base spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Operations content max width: 1440 px.
- Passenger desktop: 360–420 px control rail plus flexible map.
- Use 12-column grid only where it improves alignment.
- Use 1 px dividers and quiet background changes to define structure.
- Corner radius mostly 8–12 px; pill radius only for compact status chips/toggles.
- Shadows are rare; prefer borders and tonal separation.
- Avoid card-in-card nesting; panels can contain rows/tables, not a card for every row.

## 6. Component rules

### Buttons
- Primary: forest fill, white text; one primary per decision area.
- Secondary: surface fill with border.
- Destructive: red text/border or solid red only for irreversible cancellation.
- Provide hover, focus, disabled and loading states.
- Touch target: 44 px minimum, 48 px preferred for driver actions.

### Inputs
- Visible labels; placeholder is not a label.
- Inline error copy associated with the field.
- Location controls support seeded search and map pin selection.
- Map click must not be the only way to choose a location.

### Tables and lists
- Align columns, display units and use row separators.
- Sortable columns expose sort direction.
- Empty states explain what data is missing/how to create it.
- Admin data should favour useful tables over walls of cards.

### Status labels
- Available: forest + `Available`.
- Busy: amber + `On a ride`.
- Offline: neutral + `Offline`.
- Requested: amber + `Waiting for driver`.
- Accepted: forest + `Driver accepted`.
- Arriving: muted blue + `Driver arriving`.
- Ongoing: ink + `Ride in progress`.
- Completed: forest + `Completed`.
- Cancelled/expired: red + explicit text.
- Reassigning: amber + `Finding another driver`.

### Maps
- Keep OSM attribution visible.
- Provide legend for passenger, assigned driver, available driver, pickup, destination, demand zones and route line.
- Use marker shape/icon as well as colour.
- Selected driver is visually stronger than other candidates.
- Animate only meaningful movement/state changes; don't animate all markers.
- Ensure map has defined height at every breakpoint.

### Charts
- Title states the question (e.g. `Requests by zone and hour`).
- Include units, time window and data-source label.
- Distinguish predicted vs actual using label plus line/marker style, not colour alone.
- No 3D charts, decorative gauges or unlabelled percentages.

## 7. Motion

- 140–220 ms for control feedback; 220–320 ms for panel transitions.
- Calm easing such as `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- No bounce, elastic spring, parallax or excessive marker motion.
- Don't apply the same fade-up animation to every element.
- Respect `prefers-reduced-motion`; motion signals state, not decoration.

## 8. Visual anti-patterns to avoid

- Centered hero with one generic CTA dominating the app shell.
- Purple/blue gradient mesh background.
- Glassmorphism and blurred floating panels.
- Repeated generic three-card grids.
- Card inside card inside card.
- Oversized rounded-2xl panels and heavy drop shadows.
- An icon inside a rounded coloured square for every feature.
- Fake 01/02/03 numbering or decorative monospace headings.
- Fake KPI counters, fabricated charts or meaningless percentage rings.
- Map used only as a background image with no working controls.
- AI sparkle/brain iconography as a substitute for explaining the system.

## 9. Role-specific visual language

### Passenger
Calm and uncluttered. Map occupies most of desktop canvas; booking controls use compact side rail. Mobile uses map + bottom sheet and one clear primary action. Show only decisions needed now.

### Driver
Mobile-first and high-contrast. Availability is prominent. Incoming request details are scannable at a glance. Accept and Reject are separated spatially with clear consequences. Large tap targets; minimal analytics.

### Admin
Data-dense but orderly. Persistent left navigation, top context bar, broad map/work area and compact analytics. Tables and ranked lists are first-class components. Use ink/dark surfaces selectively, not as a default full-screen black dashboard.

## 10. Accessibility

- WCAG AA contrast target for text and interactive components.
- Keyboard access and clear focus ring.
- Semantic landmarks, heading order and proper table headers.
- Text labels for status; never colour-only communication.
- Accessible map controls plus synchronized driver/zone list alternative.
- Error summary for complex forms.
- Reduced motion and zoom to 200% without loss of core functionality.
