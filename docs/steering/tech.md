# Tech Stack & Conventions

<!--
Project-wide technical context (imported from CLAUDE.md). Decided in ADR-0002 and ADR-0004; update this file
whenever an ADR changes the stack. Commands live in .sdd/config.json → toolchain.
-->

## Stack

| Layer | Choice | ADR |
|-------|--------|-----|
| Runtime | Node.js 24 LTS (`.nvmrc`), npm 11 workspaces | 0002 |
| Language | TypeScript 6.0, `strict` + `noUncheckedIndexedAccess`, ESM everywhere | 0002 |
| Frontend | React 19, Vite 8, Zustand 5 (`apps/web`) | 0002 |
| Backend | NestJS 12 on Express 5 (`@nestjs/platform-express`), Zod 4, nestjs-pino, helmet (`apps/api`) | 0004 |
| Database | MongoDB 8 via Mongoose 9 (`@nestjs/mongoose`) | 0002, 0004 |
| Testing | Vitest 5 + Testing Library + Supertest + `@nestjs/testing` + mongodb-memory-server; Playwright e2e | 0002, 0004 |
| Lint/format | ESLint 10 (typescript-eslint, react-hooks, react-refresh), Prettier | 0002 |
| Packaging | One Docker image (the NestJS API serves `/api` + the SPA), `node:24-alpine` | 0002 |
| Hosting | **Not decided** — `deploy:*` toolchain commands are `null` | 0003 (pending) |

## Commands (via the toolchain contract)

| Need | Command |
|------|---------|
| Everything CI runs | `node .sdd/scripts/sdd.mjs ci --e2e` |
| One test file / filter | `node .sdd/scripts/sdd.mjs run test -- apps/api/src/modules/users` |
| Local dev | `docker compose up -d mongo` then `npm run dev` (api :3000, web :5173 proxying `/api`) |

## Backend conventions (`apps/api`)

- **Nest module per domain:** `src/modules/<domain>/` containing `<domain>.module.ts` (wires the
  controller, service and `MongooseModule.forFeature`), `<domain>.controller.ts` (HTTP only),
  `<domain>.service.ts` (`@Injectable()` business rules, no `req`/`res`), `<domain>.model.ts`
  (Mongoose schema + indexes + DTO mapping), `<domain>.schemas.ts` (Zod request/response schemas), and
  co-located `*.test.ts`.
- Register each feature module in `AppModule.forRoot` (`src/app.module.ts`). Controllers use
  `@Controller('<resource>')` and are served under `/api/<resource>` (global prefix). Dependencies come
  through constructor injection (`@InjectModel` for models); no module-level singletons.
- **ESM + decorators:** relative imports end in `.js`; a class injected by type must be a value import
  (not `import type`), or Nest cannot resolve it.
- **Validate every input** (body, params, query) with Zod in the controller (`Schema.parse(body)`); a
  thrown `ZodError` becomes a 400 via the global `ApiExceptionFilter`. No class-validator/class-transformer.
- Expected failures throw `AppError(status, CODE, message)` from services — never Nest `HttpException`s,
  which would tie business rules to HTTP.
- **Error contract** (all non-2xx): `{ "error": { "code", "message", "details?", "requestId" } }`.
- REST + JSON, plural nouns, `201` + body on create, `204` on delete, cursor or `?page&limit` pagination
  with a hard max. Dates as ISO-8601 UTC strings.
- **Mongoose:** `timestamps: true`; declare indexes in the schema; never return documents directly —
  map to DTOs (`toJSON` transform or explicit mapper) so `_id`/internal fields don't leak.
- Config only through `src/config.ts` (Zod-validated env, passed to `AppModule.forRoot`); no
  `@nestjs/config`. Logs via an injected `PinoLogger` / Nest `Logger` (nestjs-pino); never log secrets,
  tokens or PII.
- No Nest CLI generators (`nest g …`): they scaffold class-validator DTOs and Jest specs. Create files
  by hand following this section.

## Frontend conventions (`apps/web`)

- **Feature folders:** `src/features/<domain>/` with components, the domain's Zustand store
  (`<domain>-store.ts`) and its tests. Shared UI in `src/components/`, utilities in `src/lib/`.
- **Zustand:** one store per domain, created with `create<State>()(…)`; actions live in the store;
  components subscribe with **selectors** (`useXStore((s) => s.field)`), never the whole store.
  Async actions set explicit status (`idle | loading | ok | error`). No derived data in state.
- All HTTP goes through `src/lib/api-client.ts` (`apiRequest`), which maps the API error contract to `ApiError`.
- Components are function components with named exports; accessible by default (roles, labels) —
  tests query by role/label, which enforces it.

## Testing Conventions

- Tests that prove an acceptance criterion cite it as `<feature-id>:AC-<n>.<m>` in the test title,
  e.g. `it('[003:AC-2.1] rejects an expired invite with 410', …)`. `sdd trace` depends on it.
- Unit/integration tests are co-located (`*.test.ts(x)`); e2e lives in `tests/e2e/*.spec.ts`.
- API: Supertest against an app from `Test.createTestingModule(…)` + `configureApp(app)` (see
  `src/app.test.ts`), with fakes as providers / `overrideProvider`; persistence tests use
  `mongodb-memory-server`. Vitest only — no Jest.
- Web: Testing Library + jsdom; stub `fetch` (never real network); reset stores in `beforeEach`.
- E2E: Playwright runs the production build with an in-memory MongoDB (`tests/e2e/server.mjs`).

## Approved Dependencies

Runtime — api: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/mongoose`,
`reflect-metadata`, `rxjs`, `express`, `mongoose`, `zod`, `pino`, `pino-http`, `nestjs-pino`, `helmet`;
web: `react`, `react-dom`, `zustand`.
Anything new requires a line (why, alternatives, licence) in the feature's `plan.md`.

## Installed skills vs. these conventions

Skills in `.claude/skills/` that come from outside this repo (`nestjs-expert`, `api-designer`,
`typescript-pro`, `react-expert`, `architecture-designer`, `test-master`, `playwright-expert`,
`frontend-design`) carry generic best practice. Use them for anything the project documents leave open.
**Where a skill conflicts with the constitution, this file, `structure.md` or a feature's `plan.md`, the
project document wins — even when the skill says MUST.** Known conflicts:

| Skill says | This project does |
|------------|-------------------|
| class-validator DTOs + global `ValidationPipe` | Zod `Schema.parse()` in the controller |
| Throw `NotFoundException` / `ConflictException` in services | Throw `AppError` |
| `@nestjs/config`, `@nestjs/swagger`, TypeORM/Prisma, Passport, tRPC | Not approved — justify in `plan.md` first |
| Jest, `*.spec.ts`, `nest g …` | Vitest, co-located `*.test.ts`, files written by hand |
| RFC 7807 `application/problem+json` errors | The error contract above |
| Version every API (`/v1`) | `/api/<resource>`, unversioned until a spec needs it |
| snake_case JSON fields | camelCase |
| Next.js / Server Components / Suspense for data | Vite SPA; Zustand stores with an explicit `status` |
| Run `npx …`, `tsc --noEmit`, `npm run lint` directly | `node .sdd/scripts/sdd.mjs run <task>` |
| Their ADR format | `.sdd/templates/adr-template.md` |
