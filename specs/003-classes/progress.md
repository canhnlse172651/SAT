# Progress — 003 Class Management

## Handoff 2026-10-23 19:40 — /module 003 (implementer)
- Status: 003-classes implementing · 28/28 tasks   Branch: feat/003-classes @ b9c8b3b (branched from feat/002-curriculum: 003 builds on 002's code, 001/002 not merged/verified yet)
- Done this session: lean plan, tasks, test-cases (92 TC, every AC covered), analysis PASS; T001 T002 (290744c), T010–T052 (b9c8b3b).
  Backend `apps/api/src/modules/classes/` (GV `/api/classes/*`, HV `/api/my-classes/*`, dev `/api/dev/classes/*`, 08:00 reminder sweep +
  catch-up); 002 exports `CurriculumReader`, 001 exports `StudentDirectory`; 003 binds `CURRICULUM_CLASSES` (002) and `STUDENT_LINKS` (001).
  Web `apps/web/src/features/classes/` replaces T02, T03, T04, S01, S02, S11. Foundation: `Calendar` in the UI kit (+ test),
  `@sat/shared/classes.ts` (+ test), optional `note` line in 001's mail content, `NotFoundPage` back target; `routes.test.tsx` now uses
  T10 / the HV tab bar instead of the former T02 / S01 placeholders.
  Checks this session: lint ✔, typecheck ✔, `run test` 60 files / 308 passed, build ✔, `run test:e2e` 10 passed. API smoke walk (38 checks)
  and a Playwright UI walk of T02 → T03 (all 4 steps, create) → T04 tabs → S01 → S02 → members → S11 on the hermetic server: no console errors.
- In progress: —
- Next: `/test-module 003` trong phiên mới (agent QA, Playwright MCP).
- Blockers / questions:
  - Environment: this machine's Node is v20; the repo pins 24 (`.nvmrc`) and the web (jsdom) tests do not start on 20. This session used a
    portable Node 24 on PATH. Install Node 24 for QA.
  - For the QA / spec agent: spec §8 says an HV with sets due in two classes gets "một email liệt kê bộ của cả hai lớp"; AC-24.1 / AC-24.5
    (one e-mail per class per day) were implemented and the test cases follow the ACs.
  - 004/005/006/008/009/011 do not exist: S03–S07, S09, S10, S12 and the T04 tabs Tiến độ / Xếp hạng are placeholders; their 003 parts are
    checked through the API and dev stand-ins described in test-cases.md ("Dữ liệu và tài khoản dùng chung").
- Verify with: node .sdd/scripts/sdd.mjs run test && node .sdd/scripts/sdd.mjs run test:e2e

## Handoff 2026-10-23 23:25 — /test-module 003 (QA)
- Status: 003-classes implementing · 28/28 tasks · QA 87/88 E2E/API Pass   Branch: feat/003-classes @ dfbe561 (worktree ../sat-003-qa)
- Done this session: QA run 2026-10-23-2311 — one replayable script per E2E/API case (`testing/e2e/TC-001…TC-088.spec.ts`, shared
  `helpers.ts`), report + results + 134 screenshots in `testing/runs/2026-10-23-2311/`, test-cases.md statuses, verification.md (Verdict FAIL).
- In progress: —
- Next: `/module 003` — sửa TC-002 (AC-1.3: sau "Quay lại", nút Back của trình duyệt phải về bước liền trước — hiện "Quay lại"/"Sửa" đẩy
  thêm một mục lịch sử nên Back trở lại bước 4), rồi `/test-module 003` chạy lại TC-002.
- Blockers / questions:
  - Tooling (not 003): Playwright configs hard-code port 4173 (two worktrees collide — this run used an uncommitted `SAT_E2E_PORT`
    override); `replay-module-tests.mjs` breaks on Windows with ≥ 2 TC ids (`-g "A|B"` through cmd.exe); replays of 003 need `--workers=1`
    (scripts move the server clock). See the report's "Notes".
  - Playwright MCP browser was held by the 002 QA session; this run used the Playwright library in an isolated browser.
  - Thủ công TC-089 … TC-092 need a person / a real mail provider (instructions in the report).
- Verify with: PORT=4183 SAT_E2E_PORT=4183 node .sdd/scripts/sdd.mjs run test:modules -- 003 TC-002   (server: PORT=4183 node tests/e2e/server.mjs)

## Handoff 2026-10-25 23:40 — /module 003 (fix mode)
- Status: 003-classes implementing · 28/28 tasks   Branch: feat/003-classes (worktree ../sat-003-qa)
- Done this session: TC-002 (AC-1.3) fixed — every move back in T03 ("Quay lại", progress bar, "Sửa", re-validation after "Tạo lớp")
  goes back through the browser history, so the wizard's history is always [bước 1 … bước hiện tại] and Back lands on the step before.
  The fix exposed a race on AC-5.6 (3 quick "Tạo lớp": a late duplicate got "Tên lớp đã tồn tại" and sent the GV back into the wizard):
  the API now answers the class the same `createKey` created instead of a name conflict, and T03 sends one create at a time (ref guard)
  and ignores late failures once T04 is open. Replay `testing/runs/2026-10-25-2337-replay/` (TC-002 Pass); full replay of the 88
  scripts (one worker, port 4183): 86 Pass — TC-007 and TC-070 failed, see below. lint ✔, `run test` 60 files / 308 passed (a first run
  during the replay had 1 failure that did not repeat), build ✔.
- In progress: —
- Next: `/test-module 003` — chạy lại TC-002 (và TC-018 … TC-020: tạo lớp), sửa script TC-070, xem TC-007.
- Blockers / questions (for the QA agent — saved scripts are not edited in fix mode):
  - **TC-070 script is date-dependent and breaks typecheck:** `run typecheck` reports `TC-070.spec.ts(55,…): 'fd' is possibly
    'undefined'` (scripts are type-checked with the repo); and the step "mở lại → hôm nay có aria-current" assumes today is in the month the
    popup opens on. Its deadline is today + 7, so from 25/10 the popup opens on November and today (25/10) is not on screen — the app
    behaves per AC-21.2 (the popup opens on the selected day's month; today is marked when shown).
  - **TC-007** timed out before its first step in the full replay (waiting for "Tên lớp" on T03), passed twice alone right after — the
    dev sign-in + `goto` opening looks racy under load.
- Verify with: PORT=4183 SAT_E2E_PORT=4183 node .sdd/scripts/sdd.mjs run test:modules -- 003 TC-002   (server: PORT=4183 node tests/e2e/server.mjs)
