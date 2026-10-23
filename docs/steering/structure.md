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
│   ├── NNN-slug/             # One folder per module: spec.md (contract) + spec.html → plan → tasks → progress (Handoff) → test-cases.md → state.json (generated)
│   ├── modules.json          # Module registry = scope: names, waves, dependencies, screens
│   ├── dashboard.html        # Generated progress dashboard (node scripts/sync-state.mjs)
│   ├── index.html            # Spec overview: decisions, modules, open questions
│   ├── screen-flow-design.html  # Role-based clickable prototype; screens deep-linked by ID (#T18, #S05)
│   └── assets/               # Shared CSS/JS + spec-template.html for spec.html pages
├── apps/
│   ├── api/                  # @sat/api — NestJS 12 + Mongoose (see Source Layout)
│   └── web/                  # @sat/web — React 19 + Vite + Zustand
├── tests/e2e/                # Playwright specs + hermetic server (production build + in-memory MongoDB)
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

Decided in [ADR-0002](../adr/0002-tech-stack.md) and [ADR-0004](../adr/0004-backend-nestjs.md).
Conventions per layer: [tech.md](tech.md).

```text
apps/api/src/
├── main.ts                   # Process entry: config → NestFactory → listen → graceful shutdown (no logic)
├── app.module.ts             # AppModule.forRoot(config): logger, database, feature modules
├── app.ts                    # configureApp(app): helmet, body limit, /api prefix, error filter, SPA hosting
├── config.ts                 # Zod-validated environment (the only place that reads process.env)
├── logger.ts                 # nestjs-pino params (request ids, redaction)
├── database.module.ts        # MongooseModule connection + DB_READY probe
├── errors.ts                 # AppError + ApiExceptionFilter (the JSON error contract)
└── modules/<domain>/
    ├── <domain>.module.ts    # Nest module: controller + service + MongooseModule.forFeature
    ├── <domain>.controller.ts # HTTP: parse + validate (Zod) → call service → map to DTO
    ├── <domain>.service.ts   # @Injectable business rules; no Express types, no HttpExceptions
    ├── <domain>.model.ts     # Mongoose schema, indexes, DTO mapping
    ├── <domain>.schemas.ts   # Zod request/response schemas
    └── *.test.ts             # Co-located unit/integration tests

apps/web/src/
├── main.tsx, App.tsx         # Bootstrap + top-level layout
├── features/<domain>/        # Components + <domain>-store.ts (Zustand) + *.test.tsx
├── components/               # Shared presentational components (create when needed)
├── lib/                      # api-client.ts and other framework-free utilities
└── test/setup.ts             # Testing Library / jest-dom setup
```

Layering rules:

- `controller → service → model`; never the reverse. Services never import Express or Nest HTTP
  exceptions; models never import services. Modules talk to each other only through exported providers.
- The web app talks to the API only through `lib/api-client.ts`; components talk to data only through stores.
- No cross-imports between `apps/web` and `apps/api`. Shared contracts, when a feature needs them,
  go to a new workspace `packages/shared` (decided in that feature's plan).
