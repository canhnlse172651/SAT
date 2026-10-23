# Repository Structure

<!-- Where things live and why. Agents must follow this layout; changes need an ADR. -->

```text
.
├── CLAUDE.md                 # Agent operating manual (always loaded)
├── .claude/
│   ├── agents/               # Role subagents: product-analyst, architect, task-planner, test-engineer,
│   │                         #   implementer, reviewer, security-auditor, release-engineer
│   ├── skills/               # Pipeline commands: /sdd-init, /sdd-spec … /sdd-ship, /sdd-auto, /sdd-status
│   ├── rules/                # Path-scoped rules (loaded only when matching files are touched)
│   ├── hooks/                # Guardrails: bash guard, file guard, auto-format, session context
│   └── settings.json         # Permissions + hook wiring (shared). Personal overrides: settings.local.json
├── .sdd/                     # Spec-Driven Development machinery (stack-agnostic, zero dependencies)
│   ├── config.json           # Toolchain contract + gates + pipeline settings
│   ├── templates/            # spec / plan / tasks / analysis / verification / ADR templates
│   └── scripts/              # `sdd` CLI (node) + its tests
├── docs/
│   ├── constitution.md       # Non-negotiable principles
│   ├── steering/             # product.md, tech.md, structure.md (always loaded) + decisions.md, roadmap.md
│   ├── adr/                  # Architecture Decision Records
│   ├── runbooks/             # deploy, rollback, incident
│   ├── WORKFLOW.md           # Human guide to the pipeline
│   └── AGENT-PLAYBOOK.md     # SAT: context layers, module order, hand-off and resume
├── specs/
│   ├── NNN-slug/             # One folder per module: spec.md (contract) + spec.html → plan → tasks → test-cases.md → progress (Handoff) → state.json (generated)
│   │   └── testing/          #   QA agent (/test-module): e2e/TC-###.spec.ts (replayable scripts) + runs/<stamp>/ (report.md, results.json, screenshots/)
│   ├── modules.json          # Module registry = scope: names, waves, dependencies, screens
│   ├── dashboard.html        # Generated progress dashboard (node scripts/sync-state.mjs)
│   ├── index.html            # Spec overview: decisions, modules, open questions
│   ├── screen-flow-design.html  # Role-based clickable prototype; screens deep-linked by ID (#T18, #S05)
│   └── assets/               # Shared CSS/JS + spec-template.html for spec.html pages
├── apps/
│   ├── api/                  # @sat/api — NestJS 12 + Mongoose (see Source Layout)
│   └── web/                  # @sat/web — React 19 + Vite + Zustand + React Router 8
├── packages/
│   └── shared/               # @sat/shared — contracts shared by api and web (ADR-0007)
├── tests/e2e/                # Playwright specs + fixtures.ts (loginAs) + hermetic server (production build + in-memory MongoDB)
├── scripts/
│   ├── smoke.mjs             # Post-deploy smoke test (toolchain "smoke")
│   ├── check-spec-html.mjs   # spec.html mirrors spec.md (AC, NFR), screen IDs, Mermaid sanity
│   ├── check-spec-prototype.mjs  # Screen IDs + UI strings quoted in ACs exist in screen-flow-design.html
│   ├── find-in-prototype.mjs     # Shows where a UI string appears in the prototype (to resolve check gaps)
│   ├── sync-state.mjs        # Generates specs/NNN/state.json + specs/dashboard.html from the real sources
│   ├── list-modules.mjs      # Prints the module table (used by /module without an id)
│   └── design/verify-prototype.cjs  # Click-through regression test of the prototype
├── Dockerfile, docker-compose.yml, .dockerignore
├── package.json              # npm workspaces root: lint / typecheck / test / build / e2e scripts
├── tsconfig.base.json        # Shared strict TypeScript settings
├── eslint.config.js, .prettierrc.json, vitest.config.ts, playwright.config.ts
└── .github/                  # CI, Claude review / @claude, spec-to-PR pipeline, deploy
```

## Source Layout

Decided in [ADR-0002](../adr/0002-tech-stack.md), [ADR-0004](../adr/0004-backend-nestjs.md) and
ADR-0005 … 0008 (sessions, tenancy, shared package + router, ports). How to use each piece: [tech.md](tech.md).

```text
packages/shared/src/          # @sat/shared — api imports dist/ (tsc build), web + Vitest alias src/
├── index.ts                  # Barrel: import everything from '@sat/shared'
├── roles.ts                  # ROLES, roleSchema, Role ('GV' | 'HV')
├── hsk.ts                    # HSK_BANDS (1–6, '7-9'), hskBandSchema, hskLabel, hskOrder, compareHsk
├── errors.ts                 # ERROR_CODES + constants (NOT_FOUND, CONFLICT…), apiErrorSchema
├── ids.ts                    # objectId Zod schema (24-hex public id)
├── time.ts                   # Vietnam time: formatVnDate/Time/DateTime, parseVnDate, start/endOfVnDay, toVnParts, isoUtc
├── numbers.ts                # formatNumber, formatScore (75,9 · 1.000)
├── pinyin.ts                 # numberedToToneMarks, stripTones, normalizePinyinQuery
├── api/pagination.ts         # paginationQuerySchema, MAX_PAGE_LIMIT, PageResult
├── api/session.ts            # sessionResponseSchema (GET /api/session), session failure reasons
└── *.test.ts

apps/api/src/
├── main.ts                   # Process entry: config → NestFactory → listen → graceful shutdown (no logic)
├── app.module.ts             # AppModule.forRoot(config): logger, context, database, ports, tenancy, directory, auth, feature modules, dev
├── app.ts                    # configureApp(app): helmet, body limit, /api prefix, error filter, SPA hosting
├── config.ts                 # Zod-validated environment (the only place that reads process.env)
├── logger.ts                 # nestjs-pino params (request ids, userId/workspaceId mixin, redaction)
├── database.module.ts        # MongooseModule connection + DB_READY probe
├── errors.ts                 # AppError + ApiExceptionFilter (the JSON error contract)
├── seed.ts                   # `npm run seed -w @sat/api`: dev data (refuses NODE_ENV=production)
├── common/                   # Foundation building blocks — reuse, do not copy
│   ├── context/              # RequestContext (AsyncLocalStorage): requestId, userId, role, workspaceId; requireContext()
│   ├── auth/                 # index.ts barrel: AuthModule, global AuthGuard, @Public/@Roles/@CurrentUser, SessionService
│   │                         #   (+ session.model), cookie helpers (sat_sid), scrypt password utils, Origin check
│   ├── tenancy/              # scoped(), WorkspaceScopedRepository, WORKSPACE_PROVIDER, notFound()/orNotFound()
│   ├── persistence/          # base-schema.ts (baseSchemaOptions, workspaceIdField, versionField, workspaceIndex, toDto),
│   │                         #   version.ts (updateWithVersion → 409), pagination.ts (paginate, cursorPage)
│   ├── validation/parse.ts   # parse(schema, input) for controllers
│   ├── ports/                # index.ts barrel: CLOCK, EMAIL_SENDER, FILE_STORAGE, JOB_SCHEDULER + dev/test adapters,
│   │                         #   PortsModule.forRoot({ mode: 'dev' | 'test' }), assertNoDevAdaptersInProduction
│   ├── directory/            # FOUNDATION-ONLY: WORKSPACE_DIRECTORY over dev_workspaces/dev_users (module 001 replaces)
│   └── dev/                  # DevModule (dev/test only): POST /api/dev/session, GET /api/dev/outbox; seedDev()
├── modules/
│   ├── health/               # GET /api/health, /api/ready (public)
│   ├── session/              # GET /api/session — who is signed in (infrastructure, not the 001 login flow)
│   ├── files/                # GET /api/files/:id — stream a stored file of the caller's workspace
│   └── <domain>/
│       ├── <domain>.module.ts    # Nest module: controller + service (+ repository) + MongooseModule.forFeature
│       ├── <domain>.controller.ts # HTTP: parse(schema, input) → call service → DTO; @Roles, @CurrentUser
│       ├── <domain>.service.ts   # @Injectable business rules; no Express types, no HttpExceptions
│       ├── <domain>.repository.ts # optional: extends WorkspaceScopedRepository
│       ├── <domain>.model.ts     # Mongoose schema (baseSchemaOptions, workspaceIndex), DTO mapping
│       ├── <domain>.schemas.ts   # Zod request/response schemas
│       └── *.test.ts             # Co-located unit/integration tests
└── test/                     # index.ts barrel: createTestApp, loginAs, makeWorkspace/makeGv/makeHv, withMongo

apps/web/src/
├── main.tsx, App.tsx         # Bootstrap (styles/index.css) → AppRouter
├── app/
│   ├── screens.ts            # SCREENS: route table keyed by screen id (A/T/S), path, area
│   ├── routes.tsx            # createAppRoutes(): areas → RequireRole → shell → lazy screen (placeholder until built)
│   ├── router.tsx            # createBrowserRouter + RouterProvider
│   ├── RootLayout.tsx        # ErrorBoundary + Toaster + ScrollRestoration + 401 → A01 handler
│   └── ErrorBoundary.tsx     # ErrorBoundary / ErrorFallback (A05 for 404, requestId otherwise)
├── layouts/                  # AuthLayout (A01–A03), TeacherShell (sidebar), StudentShell (mobile tab bar), layouts.css
├── features/
│   ├── session/              # session-store.ts, RequireRole, HomeRedirect ("/")
│   ├── toast/                # toast-store.ts (push/dismiss), Toaster
│   ├── health/               # health-store + HealthStatus (walking-skeleton example)
│   └── <domain>/             # Pages + components + <domain>-store.ts (Zustand) + *.test.tsx
├── components/               # UI kit, one folder per component (Name.tsx + Name.css + Name.test.tsx); index.ts barrel
├── pages/                    # NotFoundPage (A05), PlaceholderPage, dev/UiCatalog (/dev/ui, dev only)
├── lib/                      # api-client.ts (apiRequest, ApiError, setUnauthorizedHandler), home-path.ts, use-document-title.ts
├── styles/                   # tokens.css (DESIGN.md tokens), base.css, index.css
└── test/                     # setup.ts, render.tsx (renderWithProviders, renderRoutes), stub-fetch.ts (stubFetch)
```

Layering rules:

- `controller → service → model`; never the reverse. Services never import Express or Nest HTTP
  exceptions; models never import services. Modules talk to each other only through exported providers.
- The web app talks to the API only through `lib/api-client.ts`; components talk to data only through stores.
- Feature modules use `common/*` and never the reverse; `common/` must not import from `modules/`.
- No cross-imports between `apps/web` and `apps/api`. Contracts both sides need (Zod schemas, enums, error
  codes, formatting) go to `packages/shared` (`@sat/shared`), which depends on nothing but `zod`.
