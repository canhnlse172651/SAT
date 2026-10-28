---
feature: 006
plan: ./plan.md
created: 2026-10-29
---

# Tasks — Exams

<!--
Line format (machine-parsed by sdd):
  - [ ] T### [tags] <imperative description> (AC-x.y, AC-x.z) — files: `path/a`, `path/b`
State: [ ] todo · [~] in progress · [x] done · [!] blocked — change with: node .sdd/scripts/sdd.mjs task T### <state>
Lean mode (constitution 2.0.0): one task per REQ; module behaviour is verified by test-cases.md (QA, /test-module 006);
foundation files touched by [infra] tasks keep their Vitest tests.
-->

## Phase 1: Foundation

- [ ] T001 [infra] Shared exam contracts: messages, error codes, state from the clock, attempt end, schedule checks, `dd/MM/yyyy HH:mm` parsing, clock formats, HV row state, Zod schemas of every endpoint — files: `packages/shared/src/exams.ts`, `packages/shared/src/exams.test.ts`, `packages/shared/src/index.ts`
- [ ] T002 [infra] Exams module skeleton: models (`exams`, `exam_attempts`, `exam_noshows`), log, `CLASS_EXAMS` bound by 006 (merged with the 003 dev stand-in), `purgeStudent` on 001 delete, routes T10 / T22 / T16 / S07 / S08, 005 editor generalised (`steps` optional, `patchImage`) — files: `apps/api/src/modules/exams/exams.module.ts`, `apps/api/src/modules/exams/exams.model.ts`, `apps/api/src/modules/exams/exams.log.ts`, `apps/api/src/modules/exams/exam-links.ts`, `apps/api/src/modules/classes/classes.module.ts`, `apps/api/src/modules/classes/classes.ports.ts`, `apps/api/src/modules/classes/class-links.ts`, `apps/api/src/app.module.ts`, `apps/web/src/app/screen-pages.ts`, `apps/web/src/features/exercises/SetEditor.tsx`, `apps/web/src/features/exercises/set-editing.tsx`, `apps/web/src/features/exercises/ImageField.tsx`

## Phase 2: Teacher authoring (US-1, US-6, US-7)

- [ ] T003 REQ-2 Exam editor T22: new exam created on first save, save draft with field rules, 005 question editor and limits, count and total points, concurrent-save refusal, unsaved-changes guard (AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-2.7, AC-2.8) — files: `apps/api/src/modules/exams/exams.service.ts`, `apps/api/src/modules/exams/exams.controller.ts`, `apps/web/src/features/exams/ExamEditorPage.tsx`, `apps/web/src/features/exams/exams-store.ts`, `apps/web/src/features/exams/exams.css`
- [ ] T004 REQ-3 Assigned classes, schedule and "Lên lịch" / "Hủy lịch": class picker, VN date-times, close-time rules, conditions list, derived state, upcoming-class warnings (AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6, AC-3.7, AC-3.8) — files: `apps/api/src/modules/exams/exams.service.ts`, `apps/api/src/modules/exams/exams.controller.ts`, `apps/web/src/features/exams/ExamEditorPage.tsx`, `apps/web/src/features/exams/ScheduleCard.tsx`
- [ ] T005 REQ-1 Teacher exam list T10: columns, grouped order, status filter + search, empty state, archived switch, links to T22 / T16 (AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6) — files: `apps/api/src/modules/exams/exams.service.ts`, `apps/web/src/features/exams/ExamsPage.tsx`, `apps/web/src/features/exams/exams-store.ts`
- [ ] T006 REQ-4 Lock after the first attempt: free edits before, locked questions / open / duration after, refusal when locked meanwhile, closed exam only name and instructions (AC-4.1, AC-4.2, AC-4.3, AC-4.4) — files: `apps/api/src/modules/exams/exams.service.ts`, `apps/web/src/features/exams/ExamEditorPage.tsx`
- [ ] T007 REQ-5 Classes and close time of a running exam: only later close, running attempts' end recomputed, add class, remove class only without attempts (AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5) — files: `apps/api/src/modules/exams/exams.service.ts`, `apps/web/src/features/exams/ExamEditorPage.tsx`
- [ ] T008 REQ-6 Delete, archive, restore, duplicate (AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6) — files: `apps/api/src/modules/exams/exams.service.ts`, `apps/api/src/modules/exams/exams.controller.ts`, `apps/web/src/features/exams/ExamsPage.tsx`, `apps/web/src/features/exams/ExamEditorPage.tsx`

## Phase 3: Student taking the exam (US-2, US-3)

- [ ] T009 REQ-7 Student exam list S07: visibility, one row per exam, state line + button by priority, order, "Mở sau" countdown, live transitions, empty state, newly added member (AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-7.6, AC-7.7, AC-7.8) — files: `apps/api/src/modules/exams/learn-exams.service.ts`, `apps/api/src/modules/exams/learn-exams.controller.ts`, `apps/web/src/features/exams/MyExamsPage.tsx`, `apps/web/src/features/exams/learn-exams-store.ts`, `apps/web/src/features/exams/server-clock.ts`
- [ ] T010 REQ-8 Lobby and start: lobby facts and rules, short-time warning, one attempt with end = min(start + duration, close), refusals, concurrent start, attempt used once created (AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6) — files: `apps/api/src/modules/exams/learn-exams.service.ts`, `apps/web/src/features/exams/MyExamsPage.tsx`
- [ ] T011 REQ-9 Timed attempt S08: server-time countdown, one question at a time with board, autosave ≤ 3 s, 5 / 1 minute notices, authored order with per-attempt shuffles (AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5) — files: `apps/api/src/modules/exams/learn-exams.service.ts`, `apps/web/src/features/exams/ExamTakePage.tsx`, `apps/web/src/features/exams/learn-exams-store.ts`
- [ ] T012 REQ-10 Connection loss, reload, device switch: offline banner with unsaved count, resend on reconnect, resume the same attempt, last device holds the attempt, leave warning (AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5) — files: `apps/api/src/modules/exams/learn-exams.service.ts`, `apps/web/src/features/exams/ExamTakePage.tsx`, `apps/web/src/features/exams/learn-exams-store.ts`
- [ ] T013 REQ-11 Submitting: confirmation with unfinished numbers, one submission, retry after a lost connection (AC-11.1, AC-11.2, AC-11.3, AC-11.4) — files: `apps/api/src/modules/exams/learn-exams.service.ts`, `apps/web/src/features/exams/ExamTakePage.tsx`
- [ ] T014 REQ-12 Auto-submit and class changes during an attempt: settle service + `exams.settle` jobs, 10 s grace, "Hết giờ" view, ended class keeps the attempt, removed HV stops saving (AC-12.1, AC-12.2, AC-12.3, AC-12.4, AC-12.5) — files: `apps/api/src/modules/exams/exam-settle.service.ts`, `apps/api/src/modules/exams/learn-exams.service.ts`, `apps/web/src/features/exams/ExamTakePage.tsx`

## Phase 4: Results (US-4, US-5, US-8)

- [ ] T015 REQ-13 Grading, exam score, "Không làm bài" at close, one result per assigned class, results for 008 / 009 (AC-13.1, AC-13.2, AC-13.3, AC-13.4, AC-13.5, AC-13.6) — files: `apps/api/src/modules/exams/exam-settle.service.ts`, `apps/api/src/modules/exams/exam-results.service.ts`, `apps/api/src/modules/exams/exams.controller.ts`
- [ ] T016 REQ-14 Student result S08: score now, answers and explanations after close, "Không làm bài" and "Bài thi đã đóng." views (AC-14.1, AC-14.2, AC-14.3, AC-14.4, AC-14.5) — files: `apps/api/src/modules/exams/learn-exams.service.ts`, `apps/web/src/features/exams/ExamTakePage.tsx`
- [ ] T017 REQ-15 Teacher results T16 and T14: header and class selector, one state per HV, counts and average, filter / search / sort, read-only submission on T14, empty class, live refresh (AC-15.1, AC-15.2, AC-15.3, AC-15.4, AC-15.5, AC-15.6, AC-15.7) — files: `apps/api/src/modules/exams/exam-results.service.ts`, `apps/api/src/modules/exams/exams.controller.ts`, `apps/web/src/features/exams/ExamResultsPage.tsx`, `apps/web/src/features/exercises/SubmissionPage.tsx`
- [ ] T018 REQ-16 Access control and exam secrecy: A05 for foreign / missing / not visible, questions only inside the own attempt, keys never before close + settle, no per-class section hiding (AC-16.1, AC-16.2, AC-16.3, AC-16.4, AC-16.5) — files: `apps/api/src/modules/exams/learn-exams.service.ts`, `apps/api/src/modules/exams/exams.service.ts`, `apps/api/src/modules/exams/exam-results.service.ts`
