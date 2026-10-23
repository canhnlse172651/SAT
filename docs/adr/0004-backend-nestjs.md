---
status: accepted
date: 2026-10-22
deciders: project leads, architect
feature: —
---

# ADR-0004: Backend framework — NestJS 12 (on Express) replaces plain Express

Supersedes the **Backend** row (and the "NestJS — team mandate is Express" rejection) of
[ADR-0002](0002-tech-stack.md). Everything else in ADR-0002 stands.

## Context and Problem Statement

The team decided to build the API with **NestJS** instead of plain Express. The product has ~10
domain modules (accounts, curriculum, classes, lessons, exercises, exams, grading, scoring,
dashboard, AI generation) built by agents; a framework with enforced module boundaries and
dependency injection keeps that code uniform. No feature code existed yet — only the walking
skeleton (health/readiness, error contract, SPA hosting, MongoDB connection) — so switching now is cheap.

## Decision Drivers

- Team mandate: NestJS.
- Keep every other ADR-0002 decision: Node 24, TypeScript strict, **ESM everywhere**, MongoDB/Mongoose,
  Zod, pino, Vitest, Playwright, one Docker image serving `/api` + the SPA, one toolchain contract.
- Same external behaviour: `/api/health`, `/api/ready`, the JSON error contract, request ids, security headers.
- Minimum new dependencies (Constitution IV/V).

## Considered Options

1. NestJS 12 on `@nestjs/platform-express`, tsc build, Vitest, Zod validation
2. NestJS 12 with the Nest CLI toolchain (`nest build`/`nest start`, SWC/Rspack builder)
3. NestJS on `@nestjs/platform-fastify`

## Decision Outcome

Chosen option: **1**, because it adopts NestJS while leaving the rest of the stack and the toolchain
contract unchanged.

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | **NestJS 12** (`@nestjs/common`, `core`, `platform-express`) | v12 is ESM-only — matches the repo's ESM rule. Express 5 underneath, so `helmet`/`express.static` keep working |
| Module format | `"type": "module"`, `module`/`moduleResolution: nodenext` | Relative imports end in `.js` |
| DI metadata | `experimentalDecorators` + `emitDecoratorMetadata` (api tsconfig only) | Vitest 5 (Vite 8/Oxc) and tsc both emit it — verified by test |
| Build | `tsc -p tsconfig.build.json` → `dist/main.js` | Replaces esbuild (no decorator metadata) and tsx; no Nest CLI |
| Dev | `tsc --watch` + `node --watch` (via `concurrently`, already a root dev dep) | |
| MongoDB | **`@nestjs/mongoose`** (`MongooseModule.forRoot`, `@InjectModel`) | Connection lifecycle owned by Nest; fail fast at boot (`retryAttempts: 0`) |
| Validation | **Zod 4** in controllers; global `ApiExceptionFilter` maps `ZodError` → 400 | Not class-validator: one validation library for env, API and (later) shared contracts |
| Logging | **`nestjs-pino`** (wraps pino-http) | Request logs + Nest's own logs in one structured pino stream |
| Errors | `AppError` from services; `ApiExceptionFilter` renders `{ error: { code, message, details?, requestId } }` | Contract unchanged; services never throw Nest `HttpException`s |
| Tests | Vitest + `@nestjs/testing` + Supertest; mongodb-memory-server | Jest is not used |

### Consequences

- Good: enforced module boundaries and constructor injection for ~10 domains; fakes swap in through
  Nest providers instead of hand-built `createApp(deps)` factories.
- Good: zero external behaviour change — the e2e suite and smoke test pass unchanged.
- Bad: decorators and reflection metadata — classes injected by type must be value imports (ESLint is
  configured so `consistent-type-imports` does not break this).
- Bad: generic NestJS material (docs, the `nestjs-expert` skill, Nest CLI generators) assumes
  class-validator, Swagger, `@nestjs/config` and Jest. Project conventions in `docs/steering/tech.md` win.
- Follow-up: adding `@nestjs/swagger`, `@nestjs/config`, Passport/JWT etc. needs a dependency line in that
  feature's `plan.md`.

## Pros and Cons of the Options

### 1. Platform-express, tsc, Vitest, Zod

- Good: smallest change to ADR-0002; no new build tool; same middleware ecosystem.
- Bad: no Nest CLI generators (they would scaffold class-validator/Jest files that violate conventions anyway).

### 2. Nest CLI toolchain

- Good: `nest g resource` scaffolding, SWC speed.
- Bad: extra dev dependencies (CLI, schematics, SWC/Rspack); generated code does not match project conventions.

### 3. Platform-fastify

- Good: faster HTTP layer.
- Bad: replaces helmet/express.static with Fastify plugins; performance is not a current driver.
