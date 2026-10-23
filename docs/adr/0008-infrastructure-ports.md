---
status: accepted
date: 2026-10-23
deciders: project lead (approved 2026-10-23), architect
feature: —
---

# ADR-0008: Infrastructure ports — `Clock`, `EmailSender`, `FileStorage`, `JobScheduler` with dev adapters

Wave 0 foundation decision ([foundation plan](../plans/foundation-plan.md) §3, §5.5). It defines the **seams**;
the real providers are separate, still-open ADRs listed in [roadmap §2](../steering/roadmap.md) (email provider,
file storage, scheduled jobs, AI provider, hosting ADR-0003).

## Context and Problem Statement

Modules need side effects that depend on external services or on time:

- **Time** — idle session expiry (ADR-0005), 23:59 Vietnam-time deadlines and "Nộp muộn"/"Quá hạn" (003, 005),
  exam timing and spaced repetition (006, 012).
- **Email** — HV activation with a random password, password reset (001), 08:00 deadline reminders (003).
- **Files** — lesson media and documents (004), AI source uploads (010), avatars (011), audio (014, 016).
- **Scheduled jobs** — 08:00 reminders (003 wave 4b), retention clean-ups.

Providers are undecided and hosting is undecided (ADR-0003). Tests must be deterministic (Constitution II):
no real clock, no network, no shared disk state.

## Decision Drivers

- Business code must not depend on a vendor SDK; providers are chosen later without touching modules.
- Deterministic tests: a controllable clock, inspectable email, temp-dir file storage, jobs triggered on demand.
- E2E can read the activation email (future 001 flow) without a mail server.
- No new dependency now (Constitution IV); fail fast instead of silently dropping mail in production.

## Considered Options

1. **Ports (abstract classes as Nest DI tokens) + dev/test adapters now, real adapters per provider ADR**
2. Call Node/vendor APIs directly (`Date.now()`, an SMTP library, `fs`) and mock them in tests (`vi.mock`, fake timers)
3. Pick the real providers now

## Decision Outcome

Chosen option: **1**, because it gives deterministic tests and vendor independence immediately and defers provider
choices to the point where requirements (volume, cost, hosting) are known.

### Mechanism

- Ports live in `apps/api/src/common/ports/`. Each port is a TypeScript **abstract class** used directly as the Nest
  injection token (a runtime value, so constructor injection by type works — tech.md ESM/decorator rule).
- A global `PortsModule` (registered in `AppModule.forRoot(config)`) binds each port to an adapter chosen from
  `config.ts`. Tests replace any port with `overrideProvider(Clock).useValue(new FixedClock(…))` or via the test kit
  (`createTestApp({ clock })`, F07).
- **Production guard:** with `NODE_ENV=production`, configuration validation refuses to start while `EmailSender` or
  `JobScheduler` is bound to a dev adapter (activation mail would otherwise vanish silently). The provider ADRs add the
  production adapters. The hermetic e2e server therefore runs the production build with `NODE_ENV=test` (it currently
  sets `production`; changed in F06/F13 together with the dev-only `DevModule`).

### Ports and wave-0 adapters

| Port | Contract (summary) | Dev/test adapters |
|------|--------------------|-------------------|
| `Clock` | `now(): Date` | `SystemClock`; `FixedClock` (`set(date)`, `advance(ms)`) for tests |
| `EmailSender` | `send({ to, subject, text, html?, category, workspaceId? }): Promise<{ messageId }>`; failures throw a typed error with a reason so callers can log the per-email result (001 NFR-6) | `OutboxEmailSender`: inserts into collection `dev_outbox` `{ to, subject, text, html, category, workspaceId, createdAt }` and logs `{ messageId, category }` (never the address or body). Read by `GET /api/dev/outbox` (dev/test only, F06) |
| `FileStorage` | `put(stream, { workspaceId, contentType, size, originalName }) → { fileId }`, `open(fileId) → { stream, contentType, size, originalName }`, `remove(fileId)` | `LocalDiskFileStorage`: bytes under `var/uploads/<workspaceId>/<fileId>` (`var/` git-ignored; tests use a temp dir). Metadata in a workspace-scoped `files` collection (ADR-0006) |
| `JobScheduler` | `register({ name, schedule: { dailyAt: 'HH:mm', timeZone: 'Asia/Ho_Chi_Minh' }, run })`, `runNow(name)` | `ManualJobScheduler`: records registrations and runs a job only through `runNow` (tests, dev) — never on a timer |

### Rules for module code

- **Time:** services get "now" only from `Clock` — no `Date.now()` / argument-less `new Date()` in `apps/api/src/modules/**`
  (an ESLint `no-restricted-syntax` rule is added in F05). Vietnam-time calculations use the pure helpers of
  `@sat/shared` with the injected `now`.
- **Email:** callers pass a `category` (e.g. `activation`, `reminder`) for logs and later provider templates; they never
  log recipients or bodies. Messages may contain secrets (random passwords) — the dev outbox exists only outside
  production and holds fake seed data.
- **Files:** files are served only through **`GET /api/files/:id`**: session required, the file's `workspaceId` must equal
  the caller's, otherwise `404 NOT_FOUND` (ADR-0006); responses set the stored `Content-Type`, `Content-Disposition`
  and `X-Content-Type-Options: nosniff` (helmet). Storage keys are generated ids, never user-supplied names (no path
  traversal). Finer rules (e.g. an HV may read only files of content visible to their class) belong to the owning
  module. Upload endpoints (multipart parsing, size limits such as video ≤ 500 MB) are **not** decided here — they come
  with 004/010 and the storage ADR.
- **Jobs:** run outside a request, so they use `scoped(model, workspaceId)` explicitly (ADR-0006), must be idempotent
  (e.g. one reminder per HV, set, class and day) and log a summary (counts, duration) per run.

### Consequences

- Good: every time- or I/O-dependent rule is unit-testable with `FixedClock`, the outbox and a temp dir; no fake timers.
- Good: providers (email, storage, scheduler, AI) can be chosen later by adding an adapter and an ADR; modules stay unchanged.
- Good: e2e can read activation emails from the outbox once 001 exists.
- Bad: a production deploy is impossible until the email and scheduler provider ADRs exist — intended (fail fast).
- Bad: the local-disk adapter does not survive container replacement; acceptable for dev/test only, unless the
  storage ADR decides otherwise.
- Follow-up: F05 implements the ports, adapters and the lint rule; F06 the dev endpoints and the e2e `NODE_ENV=test`
  switch; roadmap §2 tracks the provider ADRs: email (001), file storage (004), scheduled jobs (003 wave 4b),
  AI provider (010), hosting ADR-0003 (first `/sdd-ship`). An `AiProvider` port is defined with the AI ADR, not now.

## Pros and Cons of the Options

### 1. Ports + dev adapters

- Good: explicit seams, deterministic tests, vendor independence, no dependency now.
- Bad: a little indirection per port.

### 2. Direct calls, mocked in tests

- Good: less code up front.
- Bad: module mocks and fake timers are brittle and leak between tests; vendor SDK types spread into business code;
  switching providers touches every caller.

### 3. Choose real providers now

- Good: production-ready earlier.
- Bad: hosting, volumes and the AI data-handling answers (010 Q-1…Q-3) are unknown; risk of choosing twice.
