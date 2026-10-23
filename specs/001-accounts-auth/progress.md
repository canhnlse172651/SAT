# Progress — 001 Accounts and Authentication

## Handoff 2026-10-23 15:20 — /module 001 (implementer)
- Status: 001-accounts-auth implementing, 21/21 tasks done   Branch: feat/001-accounts-auth @ c088b0b
- Done this session: plan/tasks/test-cases (docs commit), T001–T002 (foundation: shared contracts, e-mail events + dev
  provider simulation, dev clock, 401 reason → A01 notice, accounts module replacing `dev_*`), T010–T015 (sign-up, sign-in,
  lockout, sessions/logout, GV reset — one commit), T016–T028 (students T11/T12, account e-mails, import, T17, S10 001 part —
  one commit), QA helpers + docs (c088b0b). Phases were committed per group, not per task: the tasks share one service/store.
- Checks run this session (Node 24.22.1): lint ✔, typecheck ✔, `run test` 55 files / 281 tests passed, build ✔,
  `run test:e2e` 10 passed. Smoke-walked the API (scratch scripts) and T11/T12/T17/S10/A01 in Playwright MCP.
- In progress: none.
- Next: `/test-module 001` trong phiên mới (agent QA, Playwright MCP).
- Notes for QA:
  - Dev/test helpers: `POST/DELETE /api/dev/clock` (time travel), `DELETE /api/dev/throttles` (call before tests that
    register GVs or type wrong passwords — NFR-5 blocks after 10 sign-ups per address per hour), outbox
    `GET /api/dev/outbox?to=&tag=`; `reject@….invalid` is refused, `late-bounce@….invalid` bounces after 10 s, other
    `….invalid` addresses bounce after 1 s. Seed: `lan@sat.dev` / `LanHSK2026`, `hv1–3@sat.dev` / `HocVien2026`.
  - AC-13.3 and the self-study parts of AC-20.5–20.7, AC-20.9 can only be fully checked once 005 / 012–015 exist
    (`STUDENT_LINKS` and `logout-guard` are the hooks); TC-055, TC-074, TC-077, TC-078 say what is checkable now.
  - After "Đăng xuất" the A01 URL may carry `?returnTo=` (the area guard redirects first); the notice is "Đã đăng xuất.".
- Blockers / questions:
  - Environment: this machine's default `node` is 20.20 — web tests need Node ≥ 22 (`.nvmrc` = 24). Checks ran with a
    portable Node 24.22.1; install Node 24 for future sessions.
  - Production e-mail provider and scheduler are still undecided (ADR pending): real bounce webhooks must publish to
    `EMAIL_EVENTS`; NFR-7 (TC-083) needs that provider.
- Verify with: `node .sdd/scripts/sdd.mjs run test` and `node .sdd/scripts/sdd.mjs run test:e2e`

## Handoff 2026-10-23 15:50 — /module 001 (implementer, UI to prototype)
- Status: 001-accounts-auth implementing, 21/21 tasks done   Branch: feat/001-accounts-auth
- Done this session: UI rebuilt to match specs/screen-flow-design.html (user request "giống prototype 100%"):
  GV shell (logo, icon nav, footer card, top bar with crumb; search + bell shown disabled — no spec yet), HV shell (dark
  app bar, icon tab bar), auth frame (desk brand panel / phone header), A01–A03, A05 inside the role shell, T11, T12
  (import steps, full-row report, footer action), e-mail drawer, T17, S10 (profile header with default cover/initials,
  info rows incl. phone, full-screen "Đổi mật khẩu"). Kit: Icon (prototype set), coloured Avatar + xxl, Button sm +
  danger-outline, Overlay/ConfirmDialog/Tabs/SegmentedControl metrics, field errors with icon, styles/patterns.css.
  API: session `user.email`, account `phone`, import report `rows`.
- Checks (Node 24.22.1): lint ✔, typecheck ✔, test 56 files / 284 passed, build ✔, test:e2e 10 passed; visual
  comparison A01 (desk + phone), T11, T12 (both tabs, report, result), drawer, T17, confirm, S10, FSD.
- Decisions (user, 2026-10-23): top-bar search/bell shown disabled ("Sắp có") until a spec owns them; S10 shows the
  011 frame with 001 data only (no photo buttons, no "Lớp đang học").
- Next: `/test-module 001` trong phiên mới (agent QA, Playwright MCP). Labels changed — see test-cases.md "Nhãn trên giao diện".
- Blockers / questions: none new (Node 24 install still recommended).
- Verify with: `node .sdd/scripts/sdd.mjs run test` and `node .sdd/scripts/sdd.mjs run test:e2e`
