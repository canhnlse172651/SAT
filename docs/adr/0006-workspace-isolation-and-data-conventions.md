---
status: accepted
date: 2026-10-23
deciders: project lead (approved 2026-10-23), architect
feature: —
---

# ADR-0006: Workspace isolation and data conventions

Wave 0 foundation decision ([foundation plan](../plans/foundation-plan.md) §3, §5.3–5.4). Applies to every
module's persistence and API code.

## Context and Problem Statement

All data of one GV forms a **workspace**; HV accounts belong to the workspace of the GV who created them.
Product rules (docs/steering/product.md):

- **Workspace isolation** — another GV's data or a missing item always shows the same "Không tìm thấy nội
  dung" (A05; 001 AC-16.2, AC-20.4).
- **Never lose learning data** — anything with submissions is archived or hidden, never deleted.
- Concurrent edits from two tabs/devices must be detected, never silently overwritten (004 AC-2.3, 016 AC-1.5),
  and the message shows when the other save happened ("lúc HH:mm").

With ~15 modules written by different agents, isolation cannot depend on every query remembering a filter.
We need one mechanism that makes the safe path the default and a test that proves it.

## Decision Drivers

- A missed `workspaceId` filter is a data-breach bug (OWASP A01 Broken Access Control) — fail closed.
- Uniform conventions so module agents only write business logic (foundation plan §1).
- Testability with mongodb-memory-server; no new dependency (Constitution IV).
- Observability without PII (Constitution VI).

## Considered Options

1. **`workspaceId` field on every business document + request context (AsyncLocalStorage) + `scoped(model)` helper**
2. Same field, but every service passes `workspaceId` explicitly into every query (discipline only)
3. Database (or collection) per workspace
4. A Mongoose global plugin that injects the filter into all query middleware

## Decision Outcome

Chosen option: **1**, because it makes the workspace filter automatic and testable while keeping plain Mongoose
models and one database.

### Tenancy

| Rule | Decision |
|------|----------|
| Field | Every business document has `workspaceId: ObjectId` (required, immutable after create). Collections that are not workspace data (e.g. `workspaces` itself, `dev_outbox`) are listed with a reason in the owning plan |
| Request context | `RequestContext` on `AsyncLocalStorage<{ requestId, userId?, role?, workspaceId? }>`. A middleware opens the context with `requestId` (the pino-http id); `AuthGuard` (ADR-0005) fills `userId`, `role`, `workspaceId` from the session |
| `scoped(model)` | Returns a thin wrapper with `create`, `find`, `findOne`, `findById`, `countDocuments`, `exists`, `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, `aggregate`. It adds `{ workspaceId }` from the context to every filter, sets it on `create`, and prepends `{ $match: { workspaceId } }` to every pipeline. Any `$lookup` must repeat the workspace condition in its sub-pipeline |
| Fail closed | If the context has no `workspaceId`, `scoped()` throws (500, logged) — it never runs an unfiltered query |
| Outside a request | Jobs and scripts (ADR-0008 `JobScheduler`, seed) use `scoped(model, workspaceId)` with an explicit id |
| Raw models | Services use `scoped()` for workspace data. Direct model access is allowed only for non-workspace collections and in `common/` infrastructure (sessions, login lookup by email in 001), and must be justified in the module plan |
| Proof | A shared tenancy test (F04) creates documents in workspaces A and B and asserts every `scoped()` method from B's context neither reads nor modifies A's documents. Every module adds at least one API test that a GET and a write on another workspace's id return exactly the same 404 body as a non-existent id |

### Not found, wrong workspace, wrong role → one answer

- Missing document, another workspace's document, a malformed id in the path, or a route for the other role
  (ADR-0005) all produce **`404 { error: { code: "NOT_FOUND", message: "Không tìm thấy nội dung bạn yêu cầu.", requestId } }`**.
  The SPA renders A05 for it. Services throw `AppError(404, 'NOT_FOUND', …)`; a helper `orNotFound(doc)` keeps it uniform.
- Denied cross-workspace attempts are logged at `info` with `userId`, `workspaceId`, route and target id (001 NFR-6),
  never with the other workspace's data.

### Identifiers, timestamps and DTOs

- Ids are MongoDB `ObjectId`s, exposed in JSON as `id` (24-char hex string). Path/body ids are validated with one shared
  Zod `objectId` schema exported from `@sat/shared` (ADR-0007); an invalid path id maps to `404 NOT_FOUND`, an invalid body id to `400 VALIDATION_ERROR`.
- `baseSchemaOptions`: `timestamps: true`, `versionKey: false` (Mongoose's `__v` is not used — see `version` below),
  and a `toJSON` transform that renames `_id` → `id` and removes internal fields. Controllers return DTOs from
  explicit mappers (`toDto`), never documents (tech.md).
- Dates are stored as UTC `Date`s and sent as ISO-8601 UTC strings; conversion to Vietnam time (UTC+7) happens only
  for display and for day boundaries such as the 23:59 deadline (`@sat/shared` time utilities).

### Optimistic concurrency

- Editable documents carry `version: number` (starts at 1).
- Edit requests send `expectedVersion`. The update is one atomic call:
  `findOneAndUpdate({ _id, workspaceId, version: expectedVersion }, { $set: changes, $inc: { version: 1 } }, { new: true })`
  via the helper `withVersion()`.
- No match → re-read by id: missing → `404 NOT_FOUND`; present → **`409 CONFLICT`** with
  `details: { currentVersion, updatedAt }` so the UI can show "…lúc HH:mm" (004 AC-2.3, 016 AC-1.5).
  "Ghi đè bằng bản của tôi" re-sends the same changes with `expectedVersion = currentVersion`.
- Granularity is the unit the spec saves (e.g. one step in 004), so saves to different units never conflict.

### Archive instead of delete

- Anything that has learning data (submissions, attempts, points, review history) — or is referenced by it — is
  never hard-deleted: it gets `archivedAt: Date` (and, where the spec needs it, a status such as `archived`) and is
  excluded by default from list queries. Hard delete is allowed only for data with no learning history, and only
  where the module spec allows deletion.
- Points already earned stay attached to archived sets (product rule for AI "Duyệt" and per-class hiding).

### Indexes

- Every compound index on workspace data starts with `workspaceId` (e.g. `{ workspaceId: 1, classId: 1, createdAt: -1 }`).
- Uniqueness is per workspace (`{ workspaceId: 1, code: 1 }, { unique: true }`) unless the spec requires global
  uniqueness (e.g. login email — decided in 001's plan).
- Indexes are declared in the schema; `autoIndex` stays on in development/test; production index builds are
  part of the deploy runbook once hosting is decided (ADR-0003).

### Pagination

- Default: `?page=1&limit=20`, `limit` max **100** (Zod rejects larger values with `400 VALIDATION_ERROR`); response
  `{ items, page, limit, total }`.
- For long or append-only lists the module may use a cursor instead: `?cursor&limit` → `{ items, nextCursor }`,
  cursor = opaque base64url of the last sort key + id. Shared Zod schemas live in `@sat/shared` (`api/pagination`).

### Logging

- The pino logger adds `requestId`, `userId`, `workspaceId` from `RequestContext` to every log line (mixin).
- Never log names, emails, phone numbers, passwords, session ids or cookies; `req.headers.cookie` and
  `res.headers["set-cookie"]` are redacted. Target ids (ObjectIds) are allowed.

### Consequences

- Good: the default data-access path is workspace-safe; forgetting the filter requires deliberately bypassing `scoped()`.
- Good: one uniform 404 removes existence oracles across workspaces and roles; one conflict model for all editors.
- Good: archived data keeps points and history (product principle).
- Bad: AsyncLocalStorage context is implicit — code running outside a request (jobs, scripts, tests) must pass a
  workspace explicitly; the fail-closed throw surfaces mistakes early.
- Bad: the wrapper exposes a subset of the Mongoose API; modules needing more extend `scoped()` (with tests)
  rather than going around it.
- Follow-up: F04 implements `RequestContext`, `scoped()`, `baseSchemaOptions`, `toDto`, `withVersion`, pagination
  and the tenancy test; F14 documents usage in tech.md.

## Pros and Cons of the Options

### 1. Field + request context + `scoped(model)`

- Good: automatic, explicit at the call site (`scoped(this.lessons)`), unit-testable, no dependency.
- Bad: a small wrapper to maintain; aggregation `$lookup`s need care.

### 2. Explicit `workspaceId` parameter everywhere

- Good: no implicit context.
- Bad: relies on every developer/agent remembering it on every query — the failure mode is a silent leak.

### 3. Database or collection per workspace

- Good: strongest physical isolation.
- Bad: connection and index management per GV, migrations multiplied, cross-workspace operations for ops
  impossible; overkill for individual teachers at MVP scale.

### 4. Global Mongoose plugin injecting the filter

- Good: invisible to module code.
- Bad: too invisible — hard to opt out for legitimate global collections, does not cover `aggregate` reliably,
  and failures are hard to debug; magic over explicitness.
