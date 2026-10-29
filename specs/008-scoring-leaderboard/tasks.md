---
feature: 008
plan: ./plan.md
created: 2026-10-29
---

# Tasks — Scoring and Leaderboard

<!--
Line format (machine-parsed by sdd):
  - [ ] T### [tags] <imperative description> (AC-x.y, AC-x.z) — files: `path/a`, `path/b`
State: [ ] todo · [~] in progress · [x] done · [!] blocked — change with: node .sdd/scripts/sdd.mjs task T### <state>
Lean mode (constitution 2.0.0): module behaviour is verified by test-cases.md (QA, /test-module 008); foundation files touched by
[infra] tasks keep their Vitest tests. REQ-1 … REQ-6 share one pure engine, so they are split by concern, not by file.
-->

## Phase 1: Foundation

- [x] T001 [infra] Shared scoring contracts: half-up rounding (item %, TB, Điểm xếp hạng), competition ranks and tie order, messages, Zod response schemas of every endpoint — files: `packages/shared/src/scoring.ts`, `packages/shared/src/scoring.test.ts`, `packages/shared/src/index.ts`
- [x] T002 [infra] Scoring inputs and module skeleton: membership `addedAt` / `history` (003), `submission.regradedAt` (005), `ExamResultsService.scoringData` (006), `StudentDirectory.activation` (001), `rank_scores` model, log, module + routes registered — files: `apps/api/src/modules/classes/classes.model.ts`, `apps/api/src/modules/classes/members.service.ts`, `apps/api/src/modules/classes/classes.service.ts`, `apps/api/src/modules/classes/classes.ports.ts`, `apps/api/src/modules/exercises/exercise-links.ts`, `apps/api/src/modules/exams/exam-results.service.ts`, `apps/api/src/modules/accounts/student-directory.ts`, `apps/api/src/modules/scoring/scoring.module.ts`, `apps/api/src/modules/scoring/scoring.model.ts`, `apps/api/src/modules/scoring/scoring.log.ts`, `apps/api/src/app.module.ts`

## Phase 2: Score engine (US-1, US-6 … US-9)

- [x] T003 REQ-1 REQ-2 REQ-3 Item scores, counted items, TB bài tập / TB bài thi, Điểm xếp hạng; effects of submissions, late submissions, deadlines and closes, one exam submission in every assigned class, re-grades (AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6, AC-1.7, AC-1.8, AC-1.9, AC-1.10, AC-1.11, AC-1.12, AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-2.7, AC-2.8, AC-2.9, AC-3.1, AC-3.2, AC-3.3) — files: `apps/api/src/modules/scoring/scoring.engine.ts`, `apps/api/src/modules/scoring/scoring.service.ts`
- [x] T004 REQ-4 REQ-5 Hidden sections, archived sets, deadline set / changed / removed, exams removed or archived; removed, re-added, deleted, locked, late-joining and late-activated students; ended classes (AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.7, AC-4.8, AC-4.9, AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6, AC-5.7) — files: `apps/api/src/modules/scoring/scoring.engine.ts`, `apps/api/src/modules/scoring/scoring.service.ts`
- [x] T005 REQ-6 Ranks with ties, tie order by time reached / name / e-mail, unranked 0,0, time reached kept in `rank_scores` and the `score.change` log (AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6) — files: `apps/api/src/modules/scoring/scoring.engine.ts`, `apps/api/src/modules/scoring/scoring.service.ts`, `apps/api/src/modules/scoring/scoring.model.ts`

## Phase 3: Student screen S09 (US-2, US-4, US-5)

- [x] T006 REQ-7 REQ-8 REQ-9 HV endpoints and S09 "Xếp hạng": class picker and remembered class, upcoming / ended / no class states, top 10 with podium and medals, pinned "Vị trí của tôi", links to S10 / S12, privacy and 404s, sign-in return (AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-7.6, AC-7.7, AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6, AC-9.1, AC-9.2, AC-9.3, AC-9.5, AC-9.6) — files: `apps/api/src/modules/scoring/learn-scoring.controller.ts`, `apps/api/src/modules/scoring/scoring.service.ts`, `apps/web/src/features/scoring/RankingPage.tsx`, `apps/web/src/features/scoring/ranking-store.ts`, `apps/web/src/features/scoring/scoring.css`, `apps/web/src/app/screen-pages.ts`, `apps/web/src/features/classes/ClassHomePage.tsx`
- [x] T007 REQ-11 REQ-13 S09 "Điểm của tôi" and transparency: summary with formula, groups by Bài, statuses, "Nội dung đã ẩn" / "Bài thi đã gỡ" lines, S06 / S08 links, empty states; "Cách tính điểm", "Cập nhật lúc …" + "Làm mới", load error + "Thử lại" (AC-11.1, AC-11.2, AC-11.3, AC-11.4, AC-11.5, AC-11.6, AC-11.7, AC-11.8, AC-11.9, AC-11.10, AC-11.11, AC-11.12, AC-13.1, AC-13.2, AC-13.3, AC-13.4, AC-13.5) — files: `apps/web/src/features/scoring/MyScore.tsx`, `apps/web/src/features/scoring/RankInfo.tsx`, `apps/web/src/features/scoring/RankingPage.tsx`, `apps/web/src/features/scoring/scoring.css`

## Phase 4: Teacher tab T04 "Xếp hạng" (US-3)

- [x] T008 REQ-10 GV endpoints and T04 "Xếp hạng" tab: full table with TBs and "Cập nhật lần cuối", locked label, expandable breakdown with labels and "Không tính", "Xem hồ sơ học tập", search, empty states, foreign class answer (AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5, AC-9.4) — files: `apps/api/src/modules/scoring/scoring.controller.ts`, `apps/api/src/modules/scoring/scoring.service.ts`, `apps/web/src/features/scoring/RankingTab.tsx`, `apps/web/src/features/scoring/ScoreBreakdown.tsx`, `apps/web/src/features/classes/ClassPage.tsx`, `apps/web/src/pages/NotFoundPage.tsx`
