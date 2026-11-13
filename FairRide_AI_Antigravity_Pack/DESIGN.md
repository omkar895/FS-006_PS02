# FairRide AI — Visual Design Direction

This is the design entry point for the coding agent. The detailed token and component contract lives in [`docs/04_DESIGN_SYSTEM.md`](docs/04_DESIGN_SYSTEM.md); route-by-route behaviour lives in [`docs/05_UX_SCREEN_SPECIFICATION.md`](docs/05_UX_SCREEN_SPECIFICATION.md). Those two files are the source of truth. Do not invent a second visual language.

## Creative direction: Urban Mobility Editorial

Make FairRide feel like a considered mobility product built by a small, capable product team. The visual identity should come from map composition, operational typography, carefully structured data, strong spacing and precise status language—not from decoration.

A judge should understand the product in seconds:
- Passenger: choose a destination and request a ride.
- Driver: decide whether to accept a request and complete the trip.
- Operations admin: understand fleet state, demand and allocation decisions.
- Simulation Lab: inspect whether the dispatch algorithm actually changes measurable outcomes.

## Core visual signature

- **Colour:** paper/off-white canvas, deep ink typography, forest-green primary actions, restrained acid-lime accents for selected data, amber for attention, red only for errors or destructive actions.
- **Type:** choose IBM Plex Sans or Manrope; use tabular numerals for metrics. No decorative monospace eyebrow labels.
- **Shape:** mostly 8–12 px corners, thin dividers, quiet surfaces; avoid inflated pills and heavy shadows.
- **Composition:** map-first booking workspace, mobile-first driver workspace, dense but calm operations console, analytical simulation workspace.
- **Data:** every metric has a label, time window, unit and provenance. Simulated/forecast/estimated/user-provided values must be distinguishable.

## Anti-template rules

Do not ship:
- purple/blue gradient meshes or glowing blobs;
- glassmorphism or blurred floating cards;
- centered marketing hero with one oversized CTA as the main app experience;
- the same three-card grid repeated on every page;
- card-in-card nesting or giant rounded panels;
- icon tiles for every navigation item;
- decorative 01/02/03 numbering or uppercase tracked micro-labels;
- fake counters, fabricated chart data, fake ratings or meaningless percentage rings;
- generic AI sparkle/brain motifs;
- bounce, elastic or blanket fade-up animations.

## Quality bar

A screen is not finished because it looks polished in a screenshot. It is finished when hierarchy is clear, data can be interpreted, actions work, error/empty/loading states are designed, keyboard focus is visible, text contrast is acceptable and the layout holds on narrow screens.

## Review order

1. Review the page at desktop width and mobile width.
2. Check whether the map or table is the actual working surface, not decoration.
3. Remove any repeated component that does not improve scanning.
4. Verify every visible metric has a real or explicitly labelled deterministic source.
5. Verify every button navigates or triggers a real operation.
6. Compare the result against `docs/04_DESIGN_SYSTEM.md` and `docs/05_UX_SCREEN_SPECIFICATION.md` before calling it done.
