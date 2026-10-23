# Tech Stack & Conventions

<!--
Project-wide technical context (imported from CLAUDE.md). Decided in ADR-0002, ADR-0004 … ADR-0008; update this file
whenever an ADR changes the stack. Commands live in .sdd/config.json → toolchain.
-->

## Stack

| Layer | Choice | ADR |
|-------|--------|-----|
| Runtime | Node.js 24 LTS (`.nvmrc`), npm 11 workspaces | 0002 |
| Language | TypeScript 6.0, `strict` + `noUncheckedIndexedAccess`, ESM everywhere | 0002 |
| Frontend | React 19, Vite 8, Zustand 5, React Router 8 (library/data mode) (`apps/web`) | 0002, 0007 |
| Shared code | npm workspace `packages/shared` (`@sat/shared`: Zod contracts, enums, error codes, VN time, pinyin), built with `tsc` to `dist` | 0007 |
| Backend | NestJS 12 on Express 5 (`@nestjs/platform-express`), Zod 4, nestjs-pino, helmet (`apps/api`) | 0004 |
| Auth | Server-side sessions in MongoDB + `httpOnly` cookie `sat_sid`; scrypt via `node:crypto`; Origin check for writes | 0005 |
| Tenancy | `workspaceId` on every business document, enforced by `scoped()`; one 404 for missing / foreign / wrong role | 0006 |
| Infrastructure ports | `Clock`, `EmailSender`, `FileStorage`, `JobScheduler`; only dev/test adapters so far | 0008 |
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
| Dev data | `npm run seed -w @sat/api` (after a build): workspace "Workspace của Cô Lan", GV `lan@sat.dev` / `LanHSK2026`, HV `hv1…hv3@sat.dev` / `HocVien2026` (module 001 accounts) |
| Dev sign-in | A01 with the seed accounts, or `POST /api/dev/session` `{ "role": "GV" \| "HV", "userId?", "workspaceId?" }` (dev/test only) |
| Dev QA helpers | `POST /api/dev/clock { advanceMs }` / `DELETE /api/dev/clock` (move the server clock), `DELETE /api/dev/throttles` (clear rate limits); outbox recipients `reject@….invalid` are refused, other `….invalid` addresses bounce (dev/test only) |

`@sat/shared` is consumed from `dist/` by the api build and typecheck (the `typecheck` / `build` tasks rebuild it);
Vite and Vitest alias it to `src/`, so tests see edits immediately.

## Backend conventions (`apps/api`)

- **Nest module per domain:** `src/modules/<domain>/` containing `<domain>.module.ts` (wires the
  controller, service and `MongooseModule.forFeature`), `<domain>.controller.ts` (HTTP only),
  `<domain>.service.ts` (`@Injectable()` business rules, no `req`/`res`), `<domain>.model.ts`
  (Mongoose schema + indexes + DTO mapping), `<domain>.schemas.ts` (Zod request/response schemas), and
  co-located `*.test.ts`. A `<domain>.repository.ts` extending `WorkspaceScopedRepository` is optional.
- Register each feature module in `AppModule.forRoot` (`src/app.module.ts`, `imports`). Controllers use
  `@Controller('<resource>')` and are served under `/api/<resource>` (global prefix). Dependencies come
  through constructor injection (`@InjectModel` for models); no module-level singletons.
- **ESM + decorators:** relative imports end in `.js`; a class injected by type must be a value import
  (not `import type`), or Nest cannot resolve it.
- **Validate every input** (body, params, query) in the controller with `parse(schema, input)`
  (`common/validation/parse.js`); a `ZodError` becomes `400 VALIDATION_ERROR`. No class-validator.
  Body ids use `objectId` from `@sat/shared` (→ 400); a malformed **path** id must answer `notFound()` (ADR-0006).
- Expected failures throw `AppError(status, CODE, message, details?)` (`src/errors.ts`) from services —
  never Nest `HttpException`s. Codes come from `@sat/shared` (`ERROR_CODES` / `NOT_FOUND`, `CONFLICT`, …);
  a module-specific code is declared in its plan.
- **Error contract** (all non-2xx): `{ "error": { "code", "message", "details?", "requestId" } }`.
- REST + JSON, plural nouns, camelCase, `201` + body on create, `204` on delete, `?page&limit` (max 100) or
  cursor pagination. Dates as ISO-8601 UTC strings; VN-time rules (23:59 deadlines, 08:00 jobs) use `@sat/shared` time helpers.
- **Never hard-delete learning data:** set `archivedAt` (ADR-0006). Writes that two people can race on carry
  `expectedVersion` and go through `updateWithVersion`.
- Config only through `src/config.ts` (Zod-validated env, passed to `AppModule.forRoot`, every variable in
  `.env.example`); no `@nestjs/config`. Logs via Nest `Logger` / `PinoLogger`; `requestId`, `userId`,
  `workspaceId` are attached automatically; never log secrets, tokens, emails, names or other PII.
- No Nest CLI generators (`nest g …`). Create files by hand following this section.

### Building blocks in `apps/api/src/common` (import from these paths)

| Need | Use | Notes |
|------|-----|-------|
| Require sign-in | nothing — the global `AuthGuard` does it | No/expired/locked session → `401 UNAUTHENTICATED`, `details.reason` = `missing \| expired \| locked`, cookie cleared |
| Open a route | `@Public()` (`common/auth/index.js`) | Login, activation, health… |
| Restrict by role | `@Roles('GV')` / `@Roles('HV')` on controller or handler | Wrong role → `404 NOT_FOUND`, never 403 (A05) |
| Who is calling | `@CurrentUser() user: AuthPrincipal` → `{ sessionId, userId, role, workspaceId }` | Inside services without the param: `requireContext()` (`common/context/request-context.js`) |
| Sessions (module 001) | `SessionService.create({ userId, role, workspaceId, userAgent? })` → `{ token, session }`, then `res.setHeader('Set-Cookie', sessionCookie(token, session.maxAgeSeconds, secure))`; `revoke(sessionId, reason?)`, `revokeAllExcept(userId, keepSessionId)`, `revokeAll(userId, reason)` | `secure` = `AUTH_OPTIONS.cookieSecure`; logout uses `clearedSessionCookie(secure)`. Lock/delete-on-next-request: provide `SESSION_PRINCIPAL_RESOLVER` (`check(principal)` → `{ active }`). TTL: GV 8 h, HV 30 days idle (config) |
| Passwords (module 001) | `hashPassword(pw)`, `verifyPassword(pw, hash)`, `needsRehash(hash)` | scrypt; never log or return hashes |
| Workspace isolation | `scoped(model, workspaceId)` or an `@Injectable()` provider `extends WorkspaceScopedRepository<T>` using `this.scope` (`common/tenancy/scoped.js`); its constructor takes `@InjectModel(NAME) model` and `@Inject(WORKSPACE_PROVIDER) ws` (`common/tenancy/workspace-provider.js`) and calls `super(model, ws)` | Adds `workspaceId` to every filter / `create` / first `$match`; `findById` treats foreign or malformed ids as missing. `$lookup` sub-pipelines must repeat `workspaceId`. Raw model access only for non-workspace collections, justified in the plan |
| Uniform 404 | `notFound()`, `orNotFound(doc)` (`common/tenancy/not-found.js`) | Same answer for missing, other workspace, wrong role |
| Schema conventions | `new Schema({ workspaceId: workspaceIdField, …, version: versionField }, { ...baseSchemaOptions, collection })`, `workspaceIndex(schema, { field: 1 }, opts?)` (`common/persistence/base-schema.js`) | `baseSchemaOptions`: timestamps, no `__v`, JSON drops `_id`/`__v`/`workspaceId` and adds `id` |
| DTO mapping | `toDto(doc, pick?)` | Never return Mongoose documents |
| Concurrent edits | `updateWithVersion(this.scope, { _id }, expectedVersion, changes)` (`common/persistence/version.js`) | Bumps `version`; stale → `409 CONFLICT` with `details: { currentVersion, updatedAt }`; missing → 404 |
| Pagination | query `paginationQuerySchema` (`@sat/shared`) → `paginate(scope.find(f).sort(s), page)` → `{ items, page, limit, total }`; or `cursorPage(query, { after, limit })` → `{ items, nextCursor }` (`common/persistence/pagination.js`) | Limit clamped to `MAX_PAGE_LIMIT` (100); bad cursor → 404 |
| Time | `@Inject(CLOCK) clock: Clock` → `clock.now()`; `vnToday(clock)` (`common/ports/index.js`) | Never `new Date()` / `Date.now()` in business rules |
| Email | `@Inject(EMAIL_SENDER) mail: EmailSender` → `send({ to, subject, html, text, tag, workspaceId?, fromName? })`; provider events (bounces) on `@Inject(EMAIL_EVENTS) EmailEvents`; a permanent refusal throws `EmailRejectedError` | Dev adapter writes `dev_outbox` (read via `GET /api/dev/outbox?to=&tag=`); `tag` identifies the mail kind for tests |
| Files | `@Inject(FILE_STORAGE) files: FileStorage` → `put({ workspaceId, ownerId, filename, contentType, bytes \| stream })`, `get(id)`, `delete(id)` | Caller checks workspace; `GET /api/files/:id` (module `files`) already does. Errors: 400 `INVALID_FILENAME`, 413 `FILE_TOO_LARGE`, 415 `UNSUPPORTED_FILE_TYPE` |
| Jobs | `@Inject(JOB_SCHEDULER) jobs: JobScheduler` → `handle(name, fn)`, `schedule(name, runAt, payload?)`, `every(name, 'HH:mm' VN, fn)` | Dev adapter is a no-op that logs; tests use `ManualScheduler.runDue()` |

Rules that apply to every module:

- **Origin rule:** `POST/PUT/PATCH/DELETE` under `/api` must carry an `Origin` (or `Referer`) equal to `APP_ORIGIN`
  (outside production also `http://localhost:5173` and `http://localhost:<PORT>`); otherwise `403 FORBIDDEN`. Browsers
  send it; API tests use `createTestApp().http`, which sets it.
- **Production guard:** `AppModule.forRoot` calls `assertNoDevAdaptersInProduction` — the API refuses to start with
  `NODE_ENV=production` until real email/scheduler adapters exist (provider ADRs). `/api/dev/*` (`DevModule`) is only
  registered when `NODE_ENV` is `development` or `test`.
- **Users and workspaces** belong to module 001 (`modules/accounts`, global): it binds `WORKSPACE_DIRECTORY` (port in
  `common/directory`) and `SESSION_PRINCIPAL_RESOLVER` (every request re-checks that the account exists and is not locked),
  and exports `STUDENT_LINKS` — modules 003, 005 and 012–015 re-bind it to report class counts and submissions and to purge
  a deleted student's data (`modules/accounts/student-links.ts`).
- Infrastructure endpoints already exist: `GET /api/health`, `GET /api/ready`, `GET /api/session` (`sessionResponseSchema`: `{ user: { id, role,
  displayName }, workspace: { id, name } }` or 401), `GET /api/files/:id`.

## Frontend conventions (`apps/web`)

- **Feature folders:** `src/features/<domain>/` with pages/components, the domain's Zustand store
  (`<domain>-store.ts`) and its tests. Shared UI in `src/components/`, utilities in `src/lib/`.
- **Zustand:** one store per domain, created with `create<State>()(…)`; actions live in the store;
  components subscribe with **selectors** (`useXStore((s) => s.field)`), never the whole store.
  Async actions set explicit status (`idle | loading | ok | error`). No derived data in state.
- Components are function components with named exports; accessible by default (roles, labels) —
  tests query by role/label, which enforces it. Pages call `useDocumentTitle(name)` (`lib/use-document-title.ts`).

| Need | Use |
|------|-----|
| Routes | `app/screens.ts` `SCREENS`: one entry per screen id (`id`, `name`, Vietnamese `path`, `area` = `auth \| gv \| hv \| selfStudy`). `app/routes.tsx` `createAppRoutes()` turns each into a lazy route showing `PlaceholderPage` ("Đang xây dựng · T05 …"). **A module replaces its screens' placeholder with the real page** by making `lazy` import `features/<domain>/<Page>` for those ids (keep id/path in `screens.ts`; add a screen there only if the prototype has it) |
| Shells | Chosen by area: `AuthLayout` (A01–A03), `TeacherShell` (desktop sidebar Dashboard … Tài khoản), `StudentShell` (mobile tab bar). Pages render only their content |
| Guards | `RequireRole role="GV"\|"HV" otherwise=<path>` (`features/session/RequireRole.tsx`) wraps each area: not signed in → A01 `/dang-nhap?returnTo=…`; HV on T* → S01; GV on S01–S12 → T01; GV on S13–S20 → A05 `/khong-tim-thay`. Paths: `homePath(role)`, `LOGIN_PATH`, `NOT_FOUND_PATH`, `loginPathWithReturn()` (`lib/home-path.ts`) |
| Session | `useSessionStore` (`features/session/session-store.ts`): `status`, `user { id, role, displayName }`, `workspace { id, name }`, `load()`, `clear()` |
| Toasts | `useToastStore((s) => s.push)` then `push(message, kind?)` with kind `success \| warn \| error \| info` (`features/toast/toast-store.ts`); `<Toaster />` is already mounted in `RootLayout` |
| HTTP | `apiRequest<T>(path, init?)` (`lib/api-client.ts`): `path` is relative to `/api` (`'/classes'`), cookies sent same-origin, JSON `Accept`/`Content-Type` set, **`body` must already be `JSON.stringify`-ed**; parse the result with the shared Zod schema. Non-2xx → `ApiError { status, code, message, requestId }`. A 401 calls the handler `RootLayout` registers (clear session, go to A01 with `returnTo`); pass `handleUnauthorized: false` when 401 is an expected answer |
| Not found / errors | `NotFoundPage` (A05, "Không tìm thấy nội dung") for 404 / wrong workspace — render it or navigate to `NOT_FOUND_PATH`. `ErrorBoundary` / `ErrorFallback` (`app/ErrorBoundary.tsx`, in `RootLayout`) render A05 for a thrown `ApiError` 404 and otherwise an error with the `requestId` |
| UI kit | Import only from the barrel `components/index.ts`: `Button`, `IconButton`, `StatusChip` (`done, todo, doing, late, overdue, notOpen, draft, published, archived, locked`), `HskBadge`, `Tabs`, `SegmentedControl`, `TextField`, `Textarea`, `Select`, `Checkbox`, `Switch`, `FormField` (render-prop gives `id`/`aria-*`), `DatePicker` (dd/MM/yyyy, VN), `Dialog`, `ConfirmDialog`, `Drawer`, `BottomSheet`, `Toast`/`ToastViewport`, `DataTable`, `EmptyState`, `ErrorState`, `Skeleton`, `Avatar`, `Pagination`, `HanziText`, `PinyinText`, `AudioButton`. Live catalogue: `/dev/ui` (dev only, `pages/dev/UiCatalog.tsx`) — add new shared components there with a test |
| Styles | `styles/tokens.css` (from `docs/design/DESIGN.md`) + `styles/base.css` + `styles/patterns.css` (prototype page patterns: `.page-head`, `.page-sub`, `.toolbar`, `.inp-search`, `.card`, `.tbl`, `.tbl-foot`, `.empty`, `.bulk-bar`, `.err-msg`), loaded once by `main.tsx`. Icons: `Icon name=…` (prototype set, `components/Icon/icon-paths.ts`). Use tokens only — colours `--brand`, `--text`, `--surface`, `--border`, `--st-*`, `--hsk1…9`; spacing `--sp-*`; radius `--r-*`; type `--fs-*`, `--font-ui`, `--font-han`, `--font-pinyin`; shadows `--shadow-*`; motion `--dur-*`, `--ease`. Plain CSS file per component/feature with BEM-like classes; no hard-coded colours or fonts. Chinese text via `HanziText`/`PinyinText` (correct `lang` + font) |
| Formatting (`@sat/shared`) | `formatVnDate` (dd/MM/yyyy), `formatVnTime` (HH:mm), `formatVnDateTime`, `parseVnDate`, `startOfVnDay`, `endOfVnDay` (23:59:59.999 VN), `toVnParts`, `isoUtc`; `formatNumber(v, decimals)` / `formatScore(v)` (75,9 · 1.000); `numberedToToneMarks('hao3')` → hǎo, `stripTones`, `normalizePinyinQuery`; `hskLabel`, `HSK_BANDS`, `compareHsk`; `roleSchema`, `objectId`, `paginationQuerySchema`, `sessionResponseSchema`, `apiErrorSchema` |

## Testing Conventions

**Two testing models (constitution II v2):**

| Code | How it is verified | Who |
|------|--------------------|-----|
| Foundation: `packages/*`, `apps/api/src/common/**`, `apps/web/src/{app,layouts,lib,components,styles}/**`, `tests/e2e/**` | Automated tests written first, co-located `*.test.ts(x)` (Vitest) + `tests/e2e/*.spec.ts` (Playwright); CI runs them | test-engineer / foundation implementer |
| Feature modules (`specs/NNN-*`) | **No hand-written test code.** `/module NNN` writes `test-cases.md` (user-level steps per AC) before coding; `/test-module NNN` (QA agent, separate session) runs every case like a real user with **Playwright MCP**, saves `specs/NNN-*/testing/e2e/TC-###.spec.ts` (replayable, title cites `<NNN>:AC-n.m` for `sdd trace`) and results in `specs/NNN-*/testing/runs/<YYYY-MM-DD-HHmm>/` (report.md, results.json, screenshots/) | QA agent; the implementer never edits saved scripts or expected results |

- Replay a module's saved scripts without AI: `node .sdd/scripts/sdd.mjs run test:modules -- <NNN> [TC-…]` (same hermetic
  server as e2e; results in `testing/runs/<stamp>-replay/`). `/module` uses it in fix mode.
- Playwright MCP is configured per project: `claude mcp add --scope project playwright -- npx -y @playwright/mcp@0.0.83`.
- Foundation tests still cite their AC/task token when one exists. Vitest only — no Jest.

| Layer | Kit | Use |
|-------|-----|-----|
| API HTTP | `createTestApp({ clock?, imports?, controllers?, providers?, env? })` (`apps/api/src/test/index.js`) | Real `AppModule` + in-memory MongoDB + temp uploads, logger silent, `CLOCK` = shared `FixedClock`. Returns `{ app, http, clock, origin, close }`; `http` is a supertest agent that already sends `Origin`. Create in `beforeAll`, `close()` in `afterAll` |
| API sign-in | `loginAs(t.app, 'GV' \| 'HV', { workspaceId?, userId? })` → `{ cookie, token, userId, workspaceId }`; send `.set('Cookie', cookie)` | Creates a session directly (no login flow) |
| API data | `makeWorkspace(app, { name? })`, `makeGv(app, { workspaceId?, displayName? })`, `makeHv(…)` | Write the real `users` / `workspaces` (module 001); `loginAs` without `userId` creates an active user; always test cross-workspace access returns 404 |
| API time / ports | `t.clock.set(…)` / `t.clock.advance(ms)`; mail via `GET /api/dev/outbox` or `t.app.get(DevOutboxReader)`; service tests without HTTP: `PortsModule.forRoot({ mode: 'test', clock })` → `FixedClock`, `MemoryEmailSender` (`.sent`, `.find(to, tag)`), `MemoryStorage`, `ManualScheduler` (`runDue()`) | |
| API persistence only | `withMongo()` → `uri()` | Starts/stops an in-memory MongoDB around the file |
| Web | `renderWithProviders(ui, { route?, session? })` and `renderRoutes(createAppRoutes(), { route, session })` (`apps/web/src/test/render.tsx`); `session: { role, displayName?, workspaceName? }` presets `useSessionStore`, stores are reset each render | Memory router + `RootLayout` (toasts, 401 redirect) |
| Web HTTP | `stubFetch({ 'GET /api/session': { body }, 'POST /api/x': (init) => ({ status, body }) })` (`apps/web/src/test/stub-fetch.ts`) returns the `vi.fn`; `unauthenticated` = ready 401 reply; unmatched → 404 | Call `vi.unstubAllGlobals()` in `afterEach`; never real network |
| E2E | `loginAs(page, 'GV' \| 'HV')` from `tests/e2e/fixtures.ts` (uses `POST /api/dev/session`) | Playwright runs the production build with an in-memory MongoDB (`tests/e2e/server.mjs`); check GV at 1280 px, HV at 390 px |

## Approved Dependencies

Runtime — api: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/mongoose`,
`reflect-metadata`, `rxjs`, `express`, `mongoose`, `zod`, `pino`, `pino-http`, `nestjs-pino`, `helmet`;
web: `react`, `react-dom`, `zustand`, `react-router` (ADR-0007); workspace: `@sat/shared` (api + web; its only
dependency is `zod`).
Anything new requires a line (why, alternatives, licence) in the feature's `plan.md`.

## Installed skills vs. these conventions

Skills in `.claude/skills/` that come from outside this repo (`nestjs-expert`, `api-designer`,
`typescript-pro`, `react-expert`, `architecture-designer`, `test-master`, `playwright-expert`,
`frontend-design`) carry generic best practice. Use them for anything the project documents leave open.
**Where a skill conflicts with the constitution, this file, `structure.md` or a feature's `plan.md`, the
project document wins — even when the skill says MUST.** Known conflicts:

| Skill says | This project does |
|------------|-------------------|
| class-validator DTOs + global `ValidationPipe` | Zod `parse(schema, input)` in the controller |
| Throw `NotFoundException` / `ConflictException` in services | Throw `AppError` / `notFound()` |
| `@nestjs/config`, `@nestjs/swagger`, TypeORM/Prisma, Passport, JWT, tRPC | Not approved — justify in `plan.md` first |
| Jest, `*.spec.ts`, `nest g …` | Vitest, co-located `*.test.ts`, files written by hand |
| RFC 7807 `application/problem+json` errors | The error contract above |
| Version every API (`/v1`) | `/api/<resource>`, unversioned until a spec needs it |
| snake_case JSON fields | camelCase |
| Next.js / Server Components / Suspense for data | Vite SPA; Zustand stores with an explicit `status` |
| Tailwind / CSS-in-JS / a component library | `styles/tokens.css` + plain CSS + the UI kit in `components/` |
| Run `npx …`, `tsc --noEmit`, `npm run lint` directly | `node .sdd/scripts/sdd.mjs run <task>` |
| Their ADR format | `.sdd/templates/adr-template.md` |
