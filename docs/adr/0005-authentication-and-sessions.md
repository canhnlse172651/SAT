---
status: accepted
date: 2026-10-23
deciders: project lead (approved 2026-10-23), architect
feature: —
---

# ADR-0005: Authentication and sessions — server-side sessions in MongoDB, scrypt, Origin-checked writes

Wave 0 foundation decision ([foundation plan](../plans/foundation-plan.md) §3). It fixes the **mechanism** only:
the login, GV sign-up, HV activation, logout, password change/reset and account-lock **flows** are owned by
module 001 and are built only after `specs/001-*/spec.md` is approved.

## Context and Problem Statement

Every module needs to know who is calling (`userId`, `role` GV | HV, `workspaceId`). Module 001 sets hard
requirements on the session behaviour:

- idle expiry per role: a GV session ends after **8 h** without activity (001 AC-5.2), an HV session after
  **30 days** (AC-5.3); closing the browser does not end it (001 edge cases);
- an ended/expired session must be rejected and the user sent to A01 with the right message (AC-5.4), and a
  session ended **because the account was locked** must produce a different message (AC-12.3);
- several concurrent sessions per account; logout ends only the current device (AC-5.1, AC-5.6);
- password change keeps the current session and ends all others (AC-15.1); 5 wrong current-password attempts
  end the current session (AC-15.3); reset password / lock ends all sessions of the HV (AC-12.5) — **immediately**.

The app is one origin: the NestJS API serves `/api` and the SPA from the same Docker image (ADR-0002, ADR-0004).

## Decision Drivers

- Instant revocation (lock, password change, logout of one device) — no stale-token window.
- Per-role sliding idle expiry, testable with an injected clock (ADR-0008 `Clock`).
- Security by default (Constitution V, OWASP A01/A02/A07): no token readable by JavaScript, no secrets at rest
  in clear, CSRF protection, session-fixation protection.
- Simplicity and no new dependency (Constitution IV): MongoDB and `node:crypto` are already in the stack.

## Considered Options

1. **Server-side sessions in MongoDB + opaque random id in an `HttpOnly` cookie** (hand-written, `node:crypto`)
2. Stateless JWT (access token + refresh token)
3. Passport (`@nestjs/passport` + `passport-local`) with `express-session` + `connect-mongo`
4. External identity provider (Auth0, Keycloak, Firebase Auth, Cognito)

## Decision Outcome

Chosen option: **1. Server-side sessions in MongoDB + opaque cookie**, because it is the only option that gives
immediate revocation and per-role sliding expiry with zero new dependencies and no external service.

### Session id and storage

| Aspect | Decision |
|--------|----------|
| Session id | `crypto.randomBytes(32)` (256 bit) encoded base64url (43 chars). Generated on every successful login / activation login — never reused from a request (prevents session fixation) |
| Stored form | Only `tokenHash = SHA-256(id)` (hex), unique index. A fast hash is enough because the id is high-entropy; a database leak does not yield usable cookies |
| Collection `sessions` | `{ tokenHash, userId, workspaceId, role, createdAt, lastSeenAt, idleExpiresAt, endedAt?, endReason?, purgeAt }` + `timestamps` |
| `endReason` | `logout` · `expired` · `password_changed` · `password_reset` · `locked` · `too_many_attempts` — kept so the API can answer with the right error code (AC-5.4 vs AC-12.3) |
| Indexes | `{ tokenHash: 1 }` unique; `{ workspaceId: 1, userId: 1, endedAt: 1 }` (revoke-all); TTL `{ purgeAt: 1 }, expireAfterSeconds: 0` |
| Retention | `purgeAt = max(idleExpiresAt, endedAt) + 30 days`; MongoDB's TTL monitor deletes the record afterwards. Sessions hold no learning data |
| Concurrency | Unlimited concurrent sessions per user (AC-5.6) |

### Idle expiry (sliding)

- TTL per role from `config.ts`: `SESSION_TTL_GV_HOURS` (default **8**), `SESSION_TTL_HV_DAYS` (default **30**).
- On each authenticated request: if `now ≥ idleExpiresAt` → set `endedAt = now`, `endReason = 'expired'`, reject.
  Otherwise **touch**: `lastSeenAt = now`, `idleExpiresAt = now + ttl(role)`. To avoid one write per request, the touch
  is skipped when `lastSeenAt` is less than **60 s** old (maximum error 60 s on an 8 h / 30 day window).
- "Now" always comes from the injected `Clock` (ADR-0008) so expiry is tested with `FixedClock`, never with sleeps.

### Cookie

`Set-Cookie: sat_sid=<id>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<ttl(role) in seconds>`

- `Secure` is set whenever `APP_ORIGIN` (config) is `https://…`; it is omitted only for local `http://localhost`
  development and the hermetic e2e server.
- `Max-Age` equals the role's idle TTL and is re-sent on every touch, so the cookie survives a browser restart
  (sessions persist until idle expiry, per 001) and disappears client-side roughly when the server-side session would.
- The server is authoritative: a cookie without a live session is rejected; on any 401 the response clears the
  cookie (`Max-Age=0`).
- No cookie-parsing library: the `Cookie` header is parsed by a small tested helper (only `sat_sid` is read).

### Revocation API (`SessionService`, used by module 001 flows)

| Method | Effect | Used by |
|--------|--------|---------|
| `create(user)` | New id, new record, returns the cookie value | login / activation (001) |
| `validate(rawId)` | Hash → lookup → expiry check → touch; returns `{ sessionId, userId, role, workspaceId }` or throws | `AuthGuard` |
| `revoke(sessionId, reason)` | Ends the current session | logout (AC-5.1), too many attempts (AC-15.3) |
| `revokeAllExcept(userId, keepSessionId, reason)` | Ends every other session of the user | password change (AC-15.1) |
| `revokeAll(userId, reason)` | Ends every session of the user | lock (`locked`), password reset (`password_reset`) (AC-12.5) |

Because `validate` reads MongoDB on every request, a revocation takes effect on the user's **next request** —
there is no cache. Lock/reset flows call `revokeAll` in the same service call that changes the account.

### Guard, roles and errors

- A global `AuthGuard` requires a valid session on every route; `@Public()` opts a route out (health, login…).
- `@Roles('GV' | 'HV')` restricts a route; a **wrong role gets `404 NOT_FOUND`**, identical to a missing or
  other-workspace resource (ADR-0006, 001 AC-16.2–16.4) — the API never confirms that a resource exists. The
  redirects to S01 / T01 / A05 are done by the SPA router (ADR-0007).
- Every authentication failure is `401 UNAUTHENTICATED` (shared error code in `@sat/shared`) with
  `details: { reason }`: `missing` (no cookie / unknown id), `expired` (idle expiry or ended for `logout`,
  `password_changed`, `password_reset`, `too_many_attempts` — the SPA shows the AC-5.4 message, or the AC-15.3 message
  for `too_many_attempts`, which 001 returns from the request that ends the session), `locked` (ended with `locked` —
  the SPA shows the AC-12.3 message). The reason values are exported from `@sat/shared` with the session contract.
- After authentication the guard fills the request context `{ requestId, userId, role, workspaceId }` (ADR-0006).

### Password hashing

| Aspect | Decision |
|--------|----------|
| Algorithm | `node:crypto` **scrypt**, asynchronous API (`crypto.scrypt`, libuv thread pool — never `scryptSync` in request paths) |
| Parameters | **N = 2^15 (32768), r = 8, p = 1**, salt **16 bytes** (`randomBytes`), derived key **64 bytes**, `maxmem = 64 MiB` (Node's default 32 MiB rejects N=2^15/r=8 with `ERR_CRYPTO_INVALID_SCRYPT_PARAMS` — verified) |
| Encoded format | PHC-style string, parameters stored with the hash: `$scrypt$ln=15,r=8,p=1$<salt base64>$<key base64>` |
| Verify | Parse the parameters **from the stored string**, recompute, compare with `crypto.timingSafeEqual` (equal-length buffers) |
| Upgrade path | `needsRehash(encoded)` returns true when stored parameters differ from the current ones; the login flow (001) re-hashes on the next successful login. Raising the cost later needs no migration |
| Input bound | `hashPassword`/`verifyPassword` reject inputs longer than 1024 bytes (DoS guard). Password **policy** (length, characters) is 001 AC-2.3 |
| Cost | ~70 ms per hash on a developer laptop (measured); acceptable for login/activation rates. Rate limiting of login is owned by 001 |

Recommendation for 001: when the email is unknown, verify against a fixed dummy hash so response time does not
reveal whether an account exists. Random HV passwords (activation, reset) come from `crypto.randomInt`/`randomBytes`.

### CSRF and origin policy

- The SPA and API share one origin; the API sends **no CORS headers** (cross-origin JS cannot read responses).
- `SameSite=Lax` keeps the cookie off cross-site sub-requests and cross-site `POST` navigations.
- An **origin check** middleware rejects every state-changing request (`POST`, `PUT`, `PATCH`, `DELETE`) whose
  `Origin` header — or, when `Origin` is absent, the origin of `Referer` — is not exactly `APP_ORIGIN`; if both
  headers are missing the request is rejected too. Response: `403 FORBIDDEN` "Request origin not allowed".
  `GET`/`HEAD` must stay side-effect free (convention for every module).
- Dev: Vite (`:5173`) proxies `/api` to `:3000` without rewriting `Origin`, so `APP_ORIGIN=http://localhost:5173`
  in dev; production sets the public URL. Tests send `Origin: <APP_ORIGIN>` (the test kit does it by default).

### Consequences

- Good: lock, logout and password change are effective on the next request; the expiry rules of 001 map 1:1 to
  configuration and are unit-testable with `FixedClock`.
- Good: no new dependency; the cookie is invisible to JavaScript (XSS cannot steal it), the DB holds only hashes.
- Good: parameterised password hashes can be strengthened later without a migration.
- Bad: one MongoDB read per authenticated request (+ at most one write per minute per session). Indexed point
  lookup; acceptable at MVP scale. Revisit with a short in-process cache only if measurements require it — at the
  cost of the "immediate" guarantee.
- Bad: hand-written cookie/session code must be tested carefully (expiry boundaries, revocation reasons, cookie
  attributes, origin check) — covered by foundation task F03.
- Bad: a non-browser API client (scripts, future mobile app) must send an `Origin` header and handle cookies.
- Follow-up: 001 implements the flows (login, activation, logout, password change/reset, lock, rate limiting,
  audit log NFR-6) on top of `SessionService` and `hashPassword`/`verifyPassword`.
- Follow-up: when hosting is chosen (ADR-0003) set `APP_ORIGIN` per environment; behind a TLS-terminating proxy
  configure Express `trust proxy` so the scheme is known.

## Pros and Cons of the Options

### 1. Server-side sessions in MongoDB + opaque cookie

- Good: immediate revocation; per-role sliding expiry is a field update; per-device logout is natural.
- Good: no new dependency, no external service; fully deterministic tests.
- Bad: stateful (a DB read per request); own code for cookie handling and origin checks.

### 2. Stateless JWT (access + refresh)

- Good: no session lookup on each request; common in tutorials and the `nestjs-expert` skill.
- Bad: **cannot be revoked instantly** — lock and "log out other devices" would need a denylist or a very short
  access-token lifetime plus a refresh-token store, i.e. server-side state anyway, with more moving parts.
- Bad: tokens in `localStorage` are exposed to XSS; in cookies they bring the same CSRF needs as option 1.

### 3. Passport + express-session + connect-mongo

- Good: well-known building blocks.
- Bad: three or more new dependencies, Passport is not approved (tech.md); express-session's session model
  (one store, global `maxAge`) fits per-role idle TTL, revoke-all-except and revocation reasons poorly.

### 4. External identity provider

- Good: offloads password storage and MFA.
- Bad: cost and vendor lock-in; GV-created HV accounts activated by an emailed random password (001) do not match
  typical IdP flows; adds network dependency to every login and hosting is still undecided (ADR-0003).
