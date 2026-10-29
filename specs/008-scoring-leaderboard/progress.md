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

## Handoff 2026-10-29 18:30 — /test-module 008 (QA)
- Status: 008-scoring-leaderboard [implementing], 8/8 tasks done   Branch: feat/008-scoring-leaderboard @ e4b1e7d
- Done this session: QA run 2026-10-29-1806 — 60/64 E2E + API Pass, 4 Fail, 2 Thủ công; 64 replayable scripts in `testing/e2e/` (+ `helpers.ts`);
  report `testing/runs/2026-10-29-1806/report.md`; `verification.md` QA section, **Verdict: FAIL**; trace 87/87 AC, no gaps.
- Failures (details, steps, screenshots in the report):
  - F1 TC-030 (AC-6.2/6.6): "Cập nhật lần cuối" comes from read-time snapshots (`rank_scores`); a 24 → 12 → 24 change nobody read in between
    keeps the old time → wrong order inside a tie. Needs the time the score really changed (deadline passed 23:59:59, section hidden, …).
  - F2 TC-049 (AC-10.1): column shows `HH:mm dd/mm/yyyy`; TC says `dd/mm/yyyy HH:mm` — fix the UI or the TC wording (spec is silent).
  - F3 TC-064 (NFR-5): T04 tab at 1024 px — table clipped, "Cập nhật lần cuối" and the "Chi tiết điểm của …" buttons off screen (e.g. `.tbl-scroll`).
  - F4 TC-063 (NFR-2/4): 100 HV / 300 sets / 50 exams — API p95 ≈ 3,1 s, S09 4,0 s, T04 4,5 s (target ≤ 2 s); cost is in the full recompute per read.
- Notes: scripts must run serially (clock moves): `npx playwright test -c playwright.modules.config.ts --workers=1` with `SAT_MODULE_TEST_DIR` /
  `SAT_MODULE_RUN_DIR`, or one TC per `run test:modules -- 008 TC-###` (a `|` filter breaks on Windows).
- Next: `/module 008` — sửa TC-030, TC-049, TC-064, TC-063; then `/test-module 008`.
- Verify with: node .sdd/scripts/sdd.mjs run test:modules -- 008 TC-030 (one TC per call)
