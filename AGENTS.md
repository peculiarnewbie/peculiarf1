# PeculiarF1 — F1 / F2 / F3 / F1 Academy Schedule Lookup

## Stack

- **Alchemy v2** — infra-as-code (Cloudflare Workers, R2)
- **Effect** — typed errors, dependency injection, Effect Schema, Effect RPC
- **Solid.js** — reactive UI with Solid Router + TanStack Solid Query
- **Vite+** — build toolchain (`vp`): dev, build, fmt (oxfmt), lint (oxlint), test
- **Vitest** — test runner (bundled in `vp` via `@voidzero-dev/vite-plus-test`)
- **@effect/vitest** — Effect-aware test helpers
- **TypeScript 7** beta (`@typescript/native-preview`) — `tsgo --noEmit`
- **pnpm** — package manager

## Source Layout

```
src/
  schedule/
    types.ts       — Effect Schema types (ScheduleEvent, SeriesSchedule)
    ical.ts        — iCal parser utilities
    pipeline.ts    — fetch + parse + store pipeline
    bucket.ts      — R2 bucket resource declaration
  worker.ts        — Cloudflare Worker (API + static assets fallback)
frontend/
  index.html       — SPA entry
  vite.config.ts   — Vite config with Solid plugin
  dist/            — Built frontend assets (managed by Alchemy StaticSite)
  src/
    main.tsx       — Entry point
    App.tsx        — Root: QueryClientProvider + Router
    routes/
      index.tsx    — SchedulePage: queries, mutations, series selector
    components/
      Header.tsx   — Series nav + refresh button
      ScheduleView.tsx — Meeting-grouped event list
      SessionCard.tsx  — Individual session row
    lib/
      api.ts       — API client + types
    styles.css     — Dark F1 theme
scripts/
  build-frontend.ts  — Builds SolidJS app to frontend/dist/
alchemy.run.ts     — Stack definition
```

## API Endpoints

| Method | Path             | Description                          |
| ------ | ---------------- | ------------------------------------ |
| GET    | `/`              | Serves the frontend HTML             |
| GET    | `/api/schedules` | Returns all series schedules as JSON |
| POST   | `/api/refresh`   | Fetches iCal feeds and stores in R2  |

## Pipeline

The pipeline fetches public iCal feeds from `ics.ecal.com` for all four series,
parses them into typed schedule data, and stores the result in an R2 bucket.
It is idempotent — running it multiple times simply overwrites the stored data.

Trigger: `POST /api/refresh` on the deployed worker.

## Data Flow

```
iCal feeds (ecal.com)
  → pipeline.ts (Effect.gen)
  → R2 bucket (schedules/{series}.json)
  → /api/schedules (JSON)
  → SolidJS frontend with TanStack Query
```

## Frontend Dev Workflow

The frontend is a SolidJS SPA in `frontend/`. Alchemy's `Cloudflare.StaticSite` runs the build, content-hashes the output, and deploys it as a Worker with static assets — no manual build step required before deploy.

```
pnpm build:frontend     # Manual build to frontend/dist/ (optional)
pnpm deploy             # Alchemy builds and deploys automatically
```

For local frontend dev (hot reload):

```
cd frontend && npx vite dev
```

## Commands

| Run                   | What it does                          |
| --------------------- | ------------------------------------- |
| `pnpm build:frontend` | Build SolidJS app into frontend/dist/ |
| `vp run deploy`       | Deploy stack (StaticSite builds automatically) |
| `vp run destroy`      | Tear down stack                       |
| `vp run dev`          | Local worker with hot reload          |
| `vp check`            | Lint + fmt + typecheck                |
| `vp fmt`              | Format (oxfmt)                        |
| `vp test`             | Run all tests (vitest)                |
| `vp run typecheck`    | TypeScript 7 check                    |
