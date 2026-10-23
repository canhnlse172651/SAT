---
status: accepted
date: 2026-10-23
deciders: project lead (approved 2026-10-23), architect
feature: —
---

# ADR-0007: Shared package `@sat/shared` and frontend routing with `react-router`

Wave 0 foundation decision ([foundation plan](../plans/foundation-plan.md) §3, §4, §6.2). It realises the
`packages/shared` workspace foreseen in [structure.md](../steering/structure.md) ("decided in that feature's plan")
and revises ADR-0002's "no router until a spec needs one" — the specs now need one.

## Context and Problem Statement

**Shared code.** API and SPA must agree on request/response shapes, enums (roles GV | HV, HSK levels — 7 tiers
1–6 and "7–9", tracking states), error codes, Vietnam-time rules (deadline 23:59 UTC+7) and pinyin handling.
Duplicating these in `apps/api` and `apps/web` invites drift; cross-imports between the apps are forbidden
(structure.md).

**Routing.** The reference UI (`specs/screen-flow-design.html`) has ~50 screens (A01–A05, T01–T27, S01–S20), many
with path parameters (class, curriculum, lesson, set), nested layouts (TeacherShell with sidebar, StudentShell with
a mobile tab bar, AuthLayout), role guards with spec-defined redirects (001 AC-5.5, AC-16.3, AC-16.4, AC-20.4,
AC-20.10: not logged in → A01 with `returnTo`; HV on a GV screen → S01; GV on S01–S12 → T01; GV on S13–S20 → A05)
and screens worth lazy-loading (editor T07, AI review T20).

## Decision Drivers

- One source of truth for contracts (Constitution III/IV); validation with the same Zod schemas on both sides.
- Works unchanged in Node 24 (api) and the browser (web); ESM everywhere (ADR-0002/0004).
- Few, well-maintained, permissively licensed dependencies (Constitution IV/V).
- Routing must support params, nested layouts, guards, lazy routes, scroll restoration and memory routing in tests.

## Considered Options

Shared code:

1. **npm workspace `packages/shared` built with `tsc` to `dist`**
2. Copy/duplicate types and schemas in each app
3. TypeScript path aliases only (no package)

Routing:

1. **`react-router`, data mode used as a library (no framework mode)**
2. Hand-written router (~150 lines on the History API)
3. TanStack Router
4. wouter

## Decision Outcome

Chosen options: **`packages/shared` workspace** and **`react-router` in library (data) mode**, because they remove
contract drift and hand-written routing infrastructure at the cost of one well-known runtime dependency.

### `@sat/shared`

| Aspect | Decision |
|--------|----------|
| Location / name | `packages/shared`, package `@sat/shared`, `private: true`, `"type": "module"`; root `workspaces: ["packages/*", "apps/*"]` |
| Build | `tsc -p tsconfig.build.json` → `dist/` (ESM `.js` + `.d.ts` + source maps); `exports["."]` → `dist/index.js` / `dist/index.d.ts`. Root `build` and `typecheck` build it before the apps |
| Consumption | `apps/api` (runtime and typecheck) uses `dist`. Vite dev server, Vite build and both Vitest configs alias `@sat/shared` to `packages/shared/src/index.ts` so tests and dev need no rebuild loop |
| Contents | `roles`, `hsk` (7 tiers + labels), `errors` (error codes + error-body schema), `time` (Vietnam time: start/end of day, `dd/MM/yyyy`, `HH:mm`, ISO UTC), `numbers` (Vietnamese formatting `75,9` · `1.000`), `pinyin` (tone numbers → marks, mark stripping for search, ü/v), `api/*` (Zod contract schemas: session, pagination, …) |
| Rules | Pure, environment-neutral code: no `node:*` imports, no DOM, no I/O, no reading the clock (functions take a `Date`). Only runtime dependency: **`zod`** (same range as the apps, hoisted to one copy). Time-zone handling uses `Intl` with `timeZone: 'Asia/Ho_Chi_Minh'` (Vietnam has no DST) — no date library |
| Ownership | Contract changes after F02 go through the coordinator (foundation plan §9); a module adds its own schemas under `src/api/<module>.ts` in its plan |

### `react-router`

| Aspect | Decision |
|--------|----------|
| Package / version | **`react-router` 8.x** (`^8.5.0`, exact version locked in `package-lock.json`). The foundation plan said "v7"; at decision time `latest` on npm is **8.5.0** and v7 is the maintenance line (`version-7` tag 7.18.4). v8 requires React ≥ 19.2.7 (we use 19.3.1) and Node ≥ 22.22 (we use 24), and is ESM-only — all compatible. The decision approved by the project lead ("react-router in library mode") is unchanged; only the major is current |
| Mode | Data mode as a library: `createBrowserRouter` + `RouterProvider` (from `react-router/dom`), route objects with nested layout routes (`<Outlet>`) and `lazy` for heavy screens. **No framework mode** (no `@react-router/dev`, no file routes, no SSR) |
| Data loading | Route `loader`/`action` are **not** used for data: data stays in Zustand stores with explicit `status` (tech.md). The router only maps URLs to screens, guards and layouts |
| Route table | One file `apps/web/src/app/router.tsx`, routes named by screen ID (A01…S20); unbuilt screens point to a dev-only placeholder; unknown paths render A05 |
| Guards | `RequireRole` layout route reads the session store and redirects per 001 (A01 + `returnTo`, S01, T01, A05). The API remains the enforcement point (ADR-0005/0006) |
| Tests | `createMemoryRouter` inside `renderWithProviders` (F12) |
| Server | The API already serves `index.html` for non-`/api` paths, so browser-history URLs work on reload |

**New dependency line (Constitution IV):** `react-router` (web, runtime) — *why*: ~50 parameterised screens with
nested layouts, role guards, lazy routes and scroll restoration; *alternatives*: hand-written router, TanStack
Router, wouter (below); *licence*: MIT; *maintenance*: Remix/Shopify team, the most used React router, v8.5.0
current; *pinned*: `^8.5.0` + lockfile.

`@sat/shared` is a workspace package, not a third-party dependency; its only dependency, `zod`, is already approved.

### Consequences

- Good: API validation and SPA forms/clients share one Zod schema per contract; enums and error codes cannot drift.
- Good: Vietnam-time and pinyin rules have one tested implementation used by both sides.
- Good: the route table mirrors the screen IDs of the prototype; guards encode 001's redirect rules once.
- Bad: one more build step (shared must be built before the api typechecks/runs); mitigated by the aliases for dev/tests
  and by the root scripts building it first.
- Bad: `react-router` adds ~two dozen KB gzip to the bundle and brings its own major-version upgrades (v6→v7→v8 in
  two years); we use a small API surface (route objects, `Link`, `NavLink`, `Navigate`, `Outlet`, hooks) to keep
  upgrades cheap.
- Follow-up: F02 (shared package), F08/F09 (router, layouts, guards), F12 (test kit), F14 (tech.md/structure.md).

## Pros and Cons of the Options

### Shared code — 1. `packages/shared` workspace

- Good: real package boundary, typed exports, works for Node and browser.
- Bad: build ordering to manage.

### Shared code — 2. Duplicate in each app

- Good: no build coupling.
- Bad: drift is guaranteed; violates "one source of truth".

### Shared code — 3. Path aliases only

- Good: no build step.
- Bad: the API runs compiled JS under Node ESM, where TS path aliases do not resolve without a runtime loader or bundler.

### Routing — 1. `react-router` (library/data mode)

- Good: nested layouts, `lazy`, scroll restoration, memory router for tests, huge ecosystem, MIT.
- Bad: frequent majors; the framework-mode documentation dominates and must be filtered.

### Routing — 2. Hand-written router

- Good: no dependency.
- Bad: ~150 lines that we must test and maintain, without lazy loading, scroll restoration or relative links.

### Routing — 3. TanStack Router

- Good: excellent type-safe params and search params; MIT.
- Bad: steeper concepts and code-generation-oriented setup; less familiar to agents and skills; more than we need.

### Routing — 4. wouter

- Good: tiny (~2 KB), hooks-based, MIT.
- Bad: no data-router features (lazy route objects, scroll restoration), fewer guard/layout patterns.
