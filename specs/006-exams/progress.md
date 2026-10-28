# Progress — 006-exams

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
