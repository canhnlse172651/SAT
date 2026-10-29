# Progress — 008 Scoring and Leaderboard

## Handoff 2026-10-29 17:30 — /module 008 (implementer)
- Status: 008-scoring-leaderboard [implementing], 8/8 tasks done   Branch: feat/008-scoring-leaderboard @ 7140edd
- Done this session: lean plan / tasks / 66 test cases (9cd7230); T001 shared `scoring.ts` + Vitest (f5809e6); T002 inputs (e6dd15c);
  T003–T005 engine (13d413b, one commit: one pure engine for REQ-1…REQ-6); T006–T007 S09 (4a4934e); T008 T04 tab (7140edd).
  - API `modules/scoring`: scores derived on every read (`scoring.engine.ts` pure, `scoring.service.ts` gathers inputs through the
    owners' providers); `rank_scores` keeps only "thời điểm đạt" (AC-6.6) + before-values for the `score.change` log (NFR-8).
    HV `GET /api/learn/ranking/classes`, `GET /api/learn/ranking/:classId`; GV `GET /api/classes/:classId/ranking[/:studentId]`.
  - Additive changes elsewhere: 003 `class_members.addedAt` + `history` (membership periods, AC-5.2); 005 `submission.regradedAt`;
    006 `ExamResultsService.scoringData()`; 001 `StudentDirectory.activatedAt()`; `NotFoundPage` optional `title` (AC-9.4); S02 link
    `?lop=` (AC-8.3).
  - Smoke-walked against the hermetic server (scratch script, not committed): TC-016 numbers exact (26,5 / 14,0 → hide 21,0 + "1 bộ ·
    80"), exam submit / "Không làm bài" / archive ("Bài thi đã gỡ: 1 · 25"), 404s; S09 at 390 px and T04 at 1280 px screenshotted.
- Checks: `run lint` ✔ ("All matched files use Prettier code style!"), `run typecheck` ✔ (0 errors), `run test` ✔ (35 files, 1231 tests),
  `run build` ✔, `run test:e2e` ✔ (10 passed).
- In progress: —
- Next: `/test-module 008` trong phiên mới (agent QA, Playwright MCP).
- Blockers / questions:
  - Known limits (plan, Complexity Tracking): change log and "Cập nhật lần cuối" are detected at the next read of the class; a cause
    without its own time (section shown again, deadline removed) gets the read time. Removing a class from an exam (006 AC-5.4, only
    without attempts) drops the exam from 008 entirely.
  - AC-9.6 needs 011 (S10/S12) — TC-048 checks S09 ↔ T04 only.
  - §7 counts "Đang gửi email" as activated; 003/006 `isActivated` do not (only active/locked) — transient, flag for the spec owner.
  - spec.md frontmatter `approved_by` is garbled by the approve command's curly quotes — a human should fix it.
  - The commit for T003 left the API unable to start (module wiring); fixed in 4a4934e.
- Verify with: node .sdd/scripts/sdd.mjs run test && node .sdd/scripts/sdd.mjs run test:e2e
