---
feature: 001
mode: lean
created: 2026-10-23
---

# Plan — 001 Accounts and Authentication (lean)

**Backend** `apps/api/src/modules/accounts/` (one Nest module, `@Global`): `users` + `workspaces` collections replace the
foundation's `dev_*` stand-ins (binds `WORKSPACE_DIRECTORY` and `SESSION_PRINCIPAL_RESOLVER`; test factories, dev sign-in and
seed are repointed). Controllers: `auth.controller.ts` (`/api/auth/*`, public), `account.controller.ts` (`/api/account/*`),
`students.controller.ts` (`/api/students/*`, `@Roles('GV')`). Services: `auth.service.ts`, `account.service.ts`,
`students.service.ts`, `student-mail.service.ts` (password e-mails + delivery state), `student-import.service.ts`,
`throttle.service.ts` (Mongo counters), `audit.service.ts`. Collections: `users` (GV + HV, unique `emailKey` system-wide —
Q-1), `workspaces`, `account_emails` (kind, status, reason, batchId; no body), `password_resets` (token hash, 60 min),
`throttles` (TTL), `student_imports` (parsed rows, TTL 1 day), `audit_events` (TTL 90 days). **Frontend** `apps/web/src/features/auth/`
(A01–A03, `auth-store.ts`), `features/students/` (T11, T12 dialog, e-mail preview drawer, `students-store.ts`),
`features/account/` (T17 + the 001 part of S10, `account-store.ts`, `LogoutButton`). Contracts in `@sat/shared/accounts.ts`.

| REQ | Backend | Endpoints | Frontend / screens |
|-----|---------|-----------|--------------------|
| REQ-1 | `auth.service.register` creates workspace + GV in one go, opens session; seeding the 016 library is 016's job (hook `WORKSPACE_CREATED` not needed yet) | `POST /api/auth/register` | A02 `RegisterPage` |
| REQ-2 | shared Zod field rules + messages; `randomPassword()` (node:crypto, 10 chars, no 0 O o 1 l I) | all forms | `PasswordRules` checklist, field errors under inputs |
| REQ-3 | `auth.service.login` (one generic error) | `POST /api/auth/login` | A01 `LoginPage` (returnTo, role home) |
| REQ-4 | `throttle.service` key `login:<email>` 5/15 min, lock 15 min, reset on success / new password | (login) | A01 message |
| REQ-5 | session TTLs exist (foundation); 401 `details.reason` gains `too_many_attempts`; logout ends one session | `POST /api/auth/logout` | `LogoutButton` + ConfirmDialog (T17, S10, GV sidebar); A01 notices from `location.state` |
| REQ-6 | `password_resets` (sha256 token, 60 min, newest only), 3 mails / 60 min | `POST /api/auth/password-reset`, `GET /api/auth/password-reset/:token`, `POST /api/auth/password-reset/confirm` | A03 `ForgotPasswordPage` (request · sent · new password · invalid link) |
| REQ-7 | `students.service.activate` + bulk (ids or filter, ≤ 500, re-check status) | `POST /api/students/:id/activate`, `POST /api/students/bulk/preview`, `POST /api/students/bulk/activate` | T11 row + bulk bar, confirm dialog, batch summary |
| REQ-8 | `students.service.create` (status `pending`, no mail) | `POST /api/students` | T12 tab "Thêm từng người", "Vừa thêm" list |
| REQ-9 | `student-import.service.validate`: fflate unzip (first sheet, shared strings, cached formula values), header by name; template built in code | `GET /api/students/import-template`, `POST /api/students/imports` (raw .xlsx body, ≤ 2 MB) | T12 tab "Import Excel" report |
| REQ-10 | `confirm`: re-validate, insert all-or-nothing (compensate by `importId`) | `POST /api/students/imports/:id/confirm` (409 + new report) | T12 result list |
| REQ-11 | list with `searchKey` (diacritics folded), status counts, page 50, newest first; edit (version-free, last write wins) | `GET /api/students`, `PATCH /api/students/:id` | T11 table, search, `SegmentedControl` filters, empty states, edit dialog |
| REQ-12 | reset password / lock (revoke sessions) / unlock (restore `statusBeforeLock`) | `POST /api/students/:id/{reset-password,lock,unlock}` | row actions by status, confirm dialogs |
| REQ-13 | delete if `STUDENT_LINKS.hasSubmissions` false (005 overrides); ends sessions; e-mail reusable | `DELETE /api/students/:id` (409 `HAS_SUBMISSIONS`) | delete dialog, "Khóa tài khoản" fallback |
| REQ-14 | `account.service` profile + change e-mail (current password, shared wrong-password counter) | `GET /api/account`, `PATCH /api/account/profile`, `POST /api/account/email` | T17 cards |
| REQ-15 | change password GV + HV, keep current session, `passwordSource` | `POST /api/account/password` | T17 card; S10 (001 part: Đổi mật khẩu, Đăng xuất; 011 adds the profile) |
| REQ-16 | `scoped()` on every student query; `@Roles('GV')`; same 404 everywhere; HV has no student endpoints | — | guards exist (foundation) |
| REQ-17 | `account-mail.templates.ts` (text + html, "SAT", footer, no phone/note/GV e-mail) | `GET /api/students/email-templates` (password masked) | "Xem mẫu email" drawer (3 kinds) |
| REQ-18 | async delivery with retries ≤ 10 min (lazy sweep of stale `sending`), bounce events ≤ 24 h, limits 3/HV/60 min and 1 000/workspace/24 h | `POST /api/students/:id/resend`, `POST /api/students/bulk/resend`, `GET /api/students/email-batches/:id` | "Đang gửi email" polling, toasts, failed banner + "Xem" |
| REQ-20 | entry points exist (foundation guards + nav); `STUDENT_LINKS.removeStudent` lets 012–015 purge self-study data on delete | — | HV tab "Tự học", GV "Kho tự học"; logout warning hook `logout-guard` for 012 (AC-20.9) |

**E-mail delivery (ports).** `EmailSender` gains an event bus (`EMAIL_EVENTS`: `bounced`) and a permanent-rejection error. The dev
outbox adapter simulates a provider for QA: recipients `reject@….invalid` are refused (→ "Chưa gửi được thư"), other `….invalid`
recipients are accepted then bounce (→ "Địa chỉ email không nhận được thư"); messages are delayed `DEV_EMAIL_DELAY_MS`
(default 1 500 ms) so "Đang gửi email" is visible. Passwords live only in memory until handed to the sender (NFR-4).

**New dependency:** `fflate@0.8.3` (api) — unzip/zip of .xlsx for import and the template. Why: Node has no zip reader; MIT,
zero dependencies, ~30 kB. Alternatives rejected: `exceljs` (large dependency tree, archived sub-deps), SheetJS (npm build
outdated). Import parsing (sheet XML) is hand-written and size-bounded (zip entries ≤ 20 MB uncompressed).

**Foundation changes (with tests):** `@sat/shared` accounts contracts; `common/ports/email.ts` (events, rejection, dev
simulation); `common/directory` loses the dev adapter, port gains `findSignInCandidate`; `test/factories.ts` + dev session +
seed (`src/seed.ts`, accounts with dev passwords `LanHSK2026` / `HocVien2026`) on real collections; `lib/api-client.ts`
`ApiError.details`; session store keeps the 401 reason; `RequireRole` passes it to A01.

## Constitution Check

- I Spec is truth: every endpoint/screen maps to a REQ above; no behaviour outside spec.md.
- II Verified: module has no hand-written tests (test-cases.md → QA); foundation changes keep/extend their Vitest tests.
- III Traceability: tasks.md one task per REQ citing all ACs; test-cases.md cites AC per TC.
- IV Simplicity: one Nest module, Mongo counters instead of a cache, lazy sweep instead of a job runner; one new dep (fflate).
- V Security: Zod at every boundary, scrypt hashes, sha256 reset tokens, generic login/reset answers, throttles (REQ-4, NFR-5), Origin check, `scoped()`; raw (unscoped) `users` access only for sign-in, e-mail uniqueness and the session resolver.
- VI Observability: `audit_events` (90 days) + structured logs with ids only (no e-mail, name, password).
- VII Small changes: one commit per task; collections are new (no migration).
- VIII Toolchain: all checks via `node .sdd/scripts/sdd.mjs run …`.
