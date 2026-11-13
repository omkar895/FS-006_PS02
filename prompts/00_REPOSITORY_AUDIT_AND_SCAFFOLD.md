# Phase 00 — Repository Audit and Scaffold

## Objective
Establish a reliable Next.js 16 + TypeScript application foundation without destroying existing work.

## Read first
`GEMINI.md`, `AGENTS.md`, `docs/03_ARCHITECTURE.md`, `docs/04_DESIGN_SYSTEM.md`, `docs/05_UX_SCREEN_SPECIFICATION.md`, `docs/14_DECISIONS_AND_LIMITATIONS.md`.

## Instructions
1. Inspect the repository, package manager, existing routes, dependencies, scripts, environment files and Git state. Summarize what already exists before changing anything.
2. Preserve useful code. Do not run destructive cleanup or replace the repository wholesale.
3. If no app exists, scaffold Next.js 16 App Router with TypeScript, Tailwind CSS, ESLint and the Node.js runtime. Use the package manager already present; otherwise use pnpm.
4. Install only the dependencies needed by the agreed architecture: Supabase SSR/client libraries, Zod, React-Leaflet/Leaflet, Recharts, and a restrained accessible component approach. Add Vitest and Playwright only when establishing their configurations.
5. Create the folder structure in `docs/03_ARCHITECTURE.md`. Keep domain logic outside route components.
6. Add global fonts, CSS variables and base layout from `docs/04_DESIGN_SYSTEM.md`. Do not build placeholder dashboards yet.
7. Add `.env.example` with variable names only. Never add real credentials or commit `.env.local`.
8. Configure strict TypeScript, path aliases, lint/typecheck/test/build scripts, and a clear README developer setup section.
9. Create a health endpoint or minimal application smoke route and verify it runs.

## Design requirements
- Use the Urban Mobility Editorial system, not a generic SaaS dashboard starter.
- Establish page grid, typography, spacing, borders, focus rings and responsive primitives.
- Use semantic HTML and visible keyboard focus.
- Do not use fake charts, fake metrics, lorem ipsum or decorative controls.

## Acceptance checks
- `npm run lint` (or equivalent) passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- App starts locally and the health/smoke route responds.
- No secrets are present in tracked files.
- Report installed package versions and any compatibility issue before proceeding.

## Report
List changed files, commands executed, actual outputs, remaining risks and explicit confirmation that existing useful files were preserved.
