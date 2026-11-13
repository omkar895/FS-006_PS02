# Technical References

These are the official technical references used to select and constrain the implementation stack. Re-check version-specific instructions before adding or upgrading packages.

## Next.js and React
- [Next.js App Router documentation](https://nextjs.org/docs/app) — application structure, layouts, server/client components and routing.
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) — server-side API endpoints in the App Router.
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — current version-specific upgrade requirements.

## Supabase
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — Auth and database integration pattern for Next.js.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy design and table access protection.

## Maps
- [React-Leaflet setup](https://react-leaflet.js.org/docs/start-setup/) — React bindings, map container setup and Leaflet CSS.
- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/) — attribution, caching, service constraints and best-effort availability. OSM data is open; public tile servers are not an unlimited free production tile API.

## Machine learning
- [scikit-learn ensemble methods](https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting) — Gradient Boosting model reference.
- [scikit-learn model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html) — regression metrics such as MAE and RMSE.

## Implementation notes
- The PS2 brief lists framework/database choices as alternatives. This pack selects Next.js/React + Node.js Route Handlers + PostgreSQL/Supabase + OSM/Leaflet as one coherent stack.
- The demand model is trained offline in Python and exported to the Node application. This avoids introducing a separately deployed inference service for a 24-hour prototype.
- OSM tiles in the demo must retain visible attribution and comply with the tile policy. For sustained public usage, select an appropriate tile provider or self-hosted service rather than relying on community tiles as an SLA-backed service.
