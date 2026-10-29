# Progress — 006-exams

## Handoff 2026-10-29 — /module 006 (implementer, fix mode)
- Status: 006-exams implementing · 18/18 done   Branch: feat/006-exams
- Done this session (commit f9bd893): sửa 5 lỗi QA của lần chạy 2026-10-29-0304:
  - F1 TC-035, TC-036 (AC-5.2): `ExamsService.extend` không dùng update pipeline nữa (Mongoose 9 trả 500); tính lại `endsAt` từng lượt đang làm = min(bắt đầu + thời lượng, giờ đóng mới).
  - F2 TC-019 (AC-3.3): điều kiện chưa đạt của một trường (tên, lớp, giờ mở, thời lượng, giờ đóng) hiện cả dưới trường đó (`withIssues` trong `exams-store.ts`).
  - F3 TC-021 (AC-3.5): mục trong danh sách điều kiện tìm trường qua `data-field` (UI kit thay `id` do trang truyền vào bằng id tự sinh).
  - F4 TC-044 (AC-6.5): hàng "Lưu trữ" làm mờ từng ô trừ ô thao tác, không làm mờ cả hàng → menu "⋯" không bị hàng sau che.
  - F5 TC-059 (AC-8.4): "Bắt đầu làm bài" bị từ chối (409 `EXAM_SUBMITTED`) ở sảnh cũ → về S07 với trạng thái mới, không mở S08.
- Checks run this session: `run lint` ✔ ("All matched files use Prettier code style!"); `npm run typecheck --workspaces` ✔ (shared, api, web);
  `run build` ✔; phát lại toàn bộ script 006 với `--workers=1`: TC-001…059 "59 passed (6.6m)", TC-060…113 "53 passed (6.0m)" = 112/112;
  `run test -- apps/api packages/shared`: 1208 passed, 3 file lỗi khởi động MongoDB in-memory (đĩa C: còn 3,4 GB), chạy lại riêng "3 passed (3)".
- In progress: —
- Next: `/test-module 006` — chạy lại TC-019 TC-021 TC-035 TC-036 TC-044 TC-059 (nên chạy cả bộ, trong phiên mới).
- Blockers / questions (cho QA):
  - `run typecheck` gốc đỏ vì script QA `testing/e2e/TC-022.spec.ts(9,25)`: `Property 'pairs' does not exist` (union kiểu câu hỏi chưa thu hẹp). Có từ commit 6e926cd; implementer không sửa script.
  - `run test:modules` chạy song song và lỗi lọc `-g a|b` trên Windows; ~30 script dời đồng hồ máy chủ → cần `workers: 1` trong `playwright.modules.config.ts` (đề xuất cho chủ hạ tầng test).
  - Node 20.20.2 trên PATH (dự án cần 24): web Vitest không khởi động được. Đĩa C: gần đầy.
- Verify with: node .sdd/scripts/sdd.mjs run test:modules -- 006 TC-019 TC-021 TC-035 TC-036 TC-044 TC-059

## Handoff 2026-10-29 03:45 — /test-module 006 (QA)
- Status: 006-exams implementing · 18/18 done   Branch: feat/006-exams
- Done this session: QA run 2026-10-29-0304 on commit e91a5aa — 112 replayable scripts `testing/e2e/TC-###.spec.ts` (+ `helpers.ts`),
  full sequential run 106/112 Pass, 6 Fail, 3 Thủ công; report `testing/runs/2026-10-29-0304/report.md`, results.json, screenshots;
  test-cases.md statuses + Script column; verification.md (Verdict FAIL); `sdd trace 006` → no gaps.
- In progress: —
- Next: `/module 006` — sửa TC-035 TC-036 (F1: `ExamsService.extend` → Mongoose 9 needs `{ updatePipeline: true }`), TC-019 (F2: AC-3.3
  messages under "Giờ đóng"), TC-021 (F3: issue list must focus Tên / Giờ mở / Thời lượng / Giờ đóng — FormField overrides the ids),
  TC-044 (F4: T10 row menu under the next row because of `tr.is-arch { opacity }`), TC-059 (F5: stay on S07 on `409 EXAM_SUBMITTED`);
  also reword TC-009 step 4 (duplicate options are "chưa hoàn chỉnh" in 005). Then `/test-module 006` in a new session — chạy lại
  TC-019 TC-021 TC-035 TC-036 TC-044 TC-059.
- Blockers / questions:
  - Playwright MCP unusable: profile `mcp-chrome-7c84bcd` held by Chrome PID 33248 (old MCP session, 2026-10-28 14:24) — close it or restart
    Claude Code before the next QA run.
  - Replay tool (owner: release-engineer / foundation): `playwright.modules.config.ts` needs `workers: 1` (30 scripts move the shared server
    clock); `-g` with `|` breaks through cmd on Windows.
  - This QA run was in the implementer's session; an independent run in a new session is recommended.
- Verify with: SAT_MODULE_TEST_DIR=specs/006-exams/testing/e2e SAT_MODULE_RUN_DIR=<dir> npx playwright test -c playwright.modules.config.ts --workers=1 -g "TC-0(19|21|35|36|44|59)\b"

## Handoff 2026-10-29 02:55 — /module 006 (implementer, runtime check)
- Status: 006-exams implementing · 18/18 done   Branch: feat/006-exams
- Done this session: disk freed by the user (6,4 GB). Checks: `run test -- apps/api` ✔ (17 files, 108 tests — boots the whole AppModule
  with ExamsModule), `run test:e2e` ✔ (10 passed), `run build` ✔, lint ✔, typecheck ✔. Runtime walk on the hermetic server (scratch scripts,
  not saved in the repo): API smoke 43/43 (create → schedule → start → lock / class / close refusals → submit → T16 / T14 → auto-submit at end
  + 10 s → "Không làm bài" per class at close → answers after close → archive / restore / duplicate → isolation); UI smoke (Playwright, GV
  1280 px in New York time zone, HV 390 px) T10, T22 (new, conditions list, field error, save, VN time), S07 lobby, S08 timer / autosave /
  confirm / result, T16, T14 — all pass, no console errors.
- Fixed: `toObject()` of the exams module dropped `_id` (schema transform) → every DTO after a write had `id: "undefined"`; now
  `toObject({ transform: false })`. test-cases.md: the answer format is spelled out (`optionIds`, not `choice` — 005's test-cases.md says
  `choice`, which the API silently ignores; flag for 005's QA owner).
- In progress: —
- Next: `/test-module 006` trong phiên mới (agent QA, Playwright MCP).
- Blockers / questions:
  - Node 20.20.2 still on PATH (project: 24) — the web Vitest suite (`apps/web`) still cannot start (`undici … 'bind'`); not run.
  - 88 `mongo-mem-*` folders (~11 GB) remain in %TEMP%; MongoDB runs again, but they should still be deleted.
- Verify with: node .sdd/scripts/sdd.mjs run test -- apps/api

## Handoff 2026-10-29 03:10 — /module 006 (implementer)
- Status: 006-exams implementing · 18/18 done   Branch: feat/006-exams (branched from feat/005-exercises — 006 builds on 005's code)
- Done this session: spec clarified → approved (by canh) → lean plan.md, tasks.md, test-cases.md (115 TC, every AC with an E2E/API case),
  analysis.md PASS; decisions V20-1 (AC-4.3 refuses the whole save), V20-2 (settle-on-read + `exams.settle` job). Code:
  - `@sat/shared/exams.ts` (+ 17 Vitest tests): messages, error codes, state from the clock, attempt end, schedule conditions, VN date-time
    input, countdowns, S07 row line, all HTTP schemas.
  - API `modules/exams`: `exams`, `exam_attempts` (unique exam × HV), `exam_noshows`; GV `/api/exams` (T10, T22 save / schedule / unschedule /
    archive / restore / duplicate / delete, T16 `…/results`, T14 `…/submissions/:hv`, 008/009 feed `GET /api/exams/results`), HV
    `/api/learn/exams` (list, view, start, open, attempt, submit, clock). Lock is set atomically by the first start (AC-4.3, AC-6.2);
    auto-submit + "Không làm bài" in `ExamSettleService` (lazy on every read + JobScheduler job). 006 now binds 003's `CLASS_EXAMS`
    (merged with the dev stand-in); new `purgeStudent` on it. 004 `StepFilesService` no longer releases images used by exams.
  - Web `features/exams`: T10 `ExamsPage`, T22 `ExamEditorPage` (005 `SetBody` reused: `steps` optional, `patchImage`, `allowEmpty`,
    `limitMessage`), T16 `ExamResultsPage`, T14 `ExamSubmissionView` (via `SubmissionPage ?thi=`), S07 `MyExamsPage` + `Lobby`, S08
    `ExamTakePage`; server-clock offset (`server-clock.ts`), 5 s clock poll, 15 s T16 poll. Routes T10 / T16 / T22 / S07 / S08 wired.
  - `routes.test.tsx` 401 tests moved from T10 (now a real page) to the T23 placeholder.
- Checks run this session: `run typecheck` ✔, `run lint` ✔ ("All matched files use Prettier code style!"), `run build` ✔ ("built in
  2.24s"), `run test -- packages/shared` ✔ (17 files, 1113 tests). **Not run:** API and web Vitest suites, `test:e2e`, and no manual
  walk-through — see Blockers. The module code has therefore not been exercised at runtime yet.
- In progress: —
- Next: free the environment (Blockers), then `node .sdd/scripts/sdd.mjs run test` + `run test:e2e` once; then
  `/test-module 006` trong phiên mới (agent QA, Playwright MCP).
- Blockers / questions:
  - **Disk C: ≈ 16 MB free.** %TEMP% holds 88 orphaned `mongo-mem-*` folders (~11.3 GB) from earlier test runs; mongod cannot start
    (`fassert() failure`), so every MongoDB-backed test and the dev / e2e server fail. The user must delete them (agent deletion was
    refused by the permission classifier).
  - **Node 20.20.2 on PATH, the project needs 24 (`.nvmrc`).** Web Vitest workers crash at start (`undici … reading 'bind'`).
  - Spec gaps decided in the plan (V20-1, V20-2) — flag to the spec owner, not blocking.
  - One commit for T003–T018 (shared files between tasks), not one per task.
- Verify with: node .sdd/scripts/sdd.mjs run test
