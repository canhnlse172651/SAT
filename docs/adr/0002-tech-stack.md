---
status: accepted — Backend row superseded by ADR-0004 (NestJS)
date: 2026-10-15
deciders: project leads, architect
---

# ADR-0002: Tech stack — React + Zustand / Express / MongoDB, TypeScript monorepo

## Context and Problem Statement

The team mandated the core stack: **React** (frontend), **Zustand** (client state), **Express**
(backend), **MongoDB** (database). Remaining choices — language, tooling, repository layout, test
stack, packaging — must make agent-written code verifiable by machines, and keep the stack mainstream
so agents (and humans) have abundant, current documentation.

## Decision Drivers

- Deterministic gates for agent output: type checking, lint, fast tests, hermetic e2e.
- One runtime and one package manager for all apps; reproducible installs.
- Simple deployment and operations for a small team.
- Supported runtimes only (Node 20 reached end-of-life in April 2026).

## Decision Outcome

| Concern | Choice | Notes |
|---------|--------|-------|
| Runtime | **Node.js 24 LTS** (`.nvmrc`, `engines >=24.15`) | Active LTS; Vitest 5 / jsdom 30 no longer support Node 20 |
| Language | **TypeScript 6.0** (strict) for web and api | TS 7 (native) is not yet supported by typescript-eslint (`<6.1`); revisit when it is |
| Repo layout | **npm workspaces** monorepo: `apps/web`, `apps/api` | Shared packages (`packages/*`) only when a feature needs them |
| Frontend | **React 19 + Vite 8**, **Zustand 5** | Feature folders; one store per domain; no router/UI kit until a spec needs one |
| Backend | **Express 5**, **Zod 4** (validation + env config), **pino** (structured logs), **helmet** | Express 5 forwards async errors; one JSON error contract |
| Database | **MongoDB 8** via **Mongoose 9** | Schemas/indexes in code; `strictQuery` on |
| Unit/integration tests | **Vitest 5** (projects per app), Testing Library, Supertest, **mongodb-memory-server** | Real MongoDB in tests without Docker |
| E2E | **Playwright** against the production build + in-memory MongoDB | Hermetic: same command locally and in CI |
| Lint/format | **ESLint 10** (typescript-eslint, react-hooks, react-refresh) + **Prettier** | `npm run lint` fails on warnings and unformatted files |
| API build | **esbuild** bundle (`--packages=external`) | Fast, no ESM extension friction; dev uses `tsx` |
| Packaging | **One Docker image**: Express serves `/api` and the built SPA | Same origin → no CORS; one deployable; `node:24-alpine`, non-root, HEALTHCHECK |
| Local infra | `docker compose up -d mongo` | `--profile full` runs the production image + MongoDB |
| Install scripts | npm 11 `allowScripts`: esbuild + mongodb-memory-server **denied** | Neither is needed; supply-chain hardening |

### Consequences

- Good: every agent change is checked by `tsc`, ESLint, Prettier, Vitest and Playwright through one
  contract (`node .sdd/scripts/sdd.mjs ci --e2e`).
- Good: no CORS, one image, one health/readiness model (`/api/health`, `/api/ready`).
- Bad: the SPA and API scale and deploy together. If the frontend needs a CDN or independent
  releases, split into a static host + API (new ADR).
- Bad: developers must run Node 24 locally (Node 20 is EOL anyway).
- Follow-up: choose the hosting target and fill `deploy:staging` / `deploy:production` (ADR-0003).

## Considered and rejected

- **JavaScript without types** — loses the cheapest deterministic gate on agent-written code.
- **Redux Toolkit** instead of Zustand — team mandate; Zustand is smaller for this scope.
  Server-state caching (e.g. TanStack Query) is deferred until a feature has real caching needs.
- **NestJS / Fastify** — team mandate is Express.
- **Native MongoDB driver** instead of Mongoose — schemas, validation and middleware are worth the
  abstraction for a product team; revisit for heavy aggregation workloads.
- **Testcontainers** for MongoDB in tests — requires Docker on every machine; in-memory server is enough.
- **Separate web/api containers** — more moving parts with no current benefit.
