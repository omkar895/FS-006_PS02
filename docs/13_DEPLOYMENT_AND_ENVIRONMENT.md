# Local Setup, Environment and Deployment

## 1. Prerequisites

- Node.js: use a currently supported LTS release compatible with Next.js and the target host. On 13 Nov 2026, Node 26 has entered Active LTS and Node 24 is in Maintenance LTS. Prefer the host's verified LTS runtime; Node 24 is a conservative fallback if host support for Node 26 is uncertain.
- npm, pnpm or the repo's selected package manager (commit exactly one lockfile).
- Supabase project.
- Python 3.11+ for offline synthetic-demand generation/model training; pin tested dependencies in `requirements.txt`.
- Git.

Next.js 16 documentation lists Node 20.9+ as the minimum; this does not prove a particular host image supports every newer major. Verify target runtime support.

## 2. Environment variables

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=SERVER_ONLY_SECRET
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_MODE=demo
DEMO_DATA_LABEL=SIMULATED
```

- `SUPABASE_SERVICE_ROLE_KEY` is server-only; never prefix `NEXT_PUBLIC_`.
- Keep `.env.local` ignored by Git.
- Do not add the service key if all operations can use user-scoped RLS.
- Validate required env vars and fail with a useful server-only message if missing.

## 3. Local setup sequence

1. Install dependencies using the committed lockfile.
2. Create/configure Supabase project.
3. Apply timestamped SQL migrations.
4. Configure Supabase Auth redirect URLs for localhost/deployed origin.
5. Run safe demo seed for zones, driver profiles and fixtures.
6. Generate forecast artifact if missing/stale.
7. Start Next.js app.
8. Run typecheck, lint, unit/integration tests and production build.

After implementation, the agent must document exact verified commands in root README. Do not invent npm scripts before inspecting `package.json`.

## 4. Deployment target

- Next.js app: Vercel or another verified Node-compatible host.
- Auth/database/Realtime: Supabase.
- Forecast JSON: generated synthetic artifact versioned with source seed/metadata for demo.

Deployment checklist:
1. Create staging/production Supabase project.
2. Apply migrations.
3. Configure auth redirect allowlist.
4. Set host environment variables.
5. Deploy Next.js.
6. Import demo data only into the demo environment.
7. Test passenger/driver/admin RLS with separate accounts.
8. Verify map attribution/fallback.
9. Run deployed smoke tests.

## 5. OpenStreetMap tile notes

OpenStreetMap data is open, but community tile servers have a usage policy and no production SLA. Use the correct HTTPS tile endpoint, visible attribution, appropriate caching and no bulk download/prefetch. For sustained production traffic, choose a tile provider or self-hosted service with suitable terms/SLA.

## 6. Production build gate

Before deployment verify: no TypeScript errors; no secret in browser bundle; auth callback works; protected pages deny correctly; RLS tested; forecast artifact exists or labelled fallback shown; ride actions work; error boundaries and map fallback exist.

## 7. Reset/rollback

- Keep migrations reversible where practical; otherwise document forward fix.
- Demo seed/reset targets only demo fixture records.
- Never truncate all profiles/rides to reset demo.
- Preserve simulation history unless an admin explicitly requests demo reset.
