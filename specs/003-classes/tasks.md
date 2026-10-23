---
feature: 003
plan: ./plan.md
created: 2026-10-23
---

# Tasks — Class Management

<!--
Line format (machine-parsed by sdd):
  - [ ] T### [tags] <imperative description> (AC-x.y, AC-x.z) — files: `path/a`, `path/b`
State: [ ] todo · [~] in progress · [x] done · [!] blocked — change with: node .sdd/scripts/sdd.mjs task T### <state>
Lean mode (constitution 2.0.0): one task per REQ; module behaviour is verified by test-cases.md (QA, /test-module 003);
foundation files touched by [infra] tasks keep their Vitest tests.
-->

## Phase 1: Foundation

- [x] T001 [infra] Shared class contracts (schemas, messages, error codes, status/deadline helpers) and a `Calendar` grid in the UI kit (extracted from `DatePicker`) — files: `packages/shared/src/classes.ts`, `packages/shared/src/index.ts`, `apps/web/src/components/Calendar/Calendar.tsx`, `apps/web/src/components/DatePicker/DatePicker.tsx`, `apps/web/src/components/index.ts`
- [x] T002 [infra] Classes module skeleton: models, ports for 005/006 with the dev links adapter and dev controller, `CurriculumReader` (002), `StudentDirectory` (001), `CURRICULUM_CLASSES` / `STUDENT_LINKS` bindings, web feature folder and routes — files: `apps/api/src/modules/classes/classes.module.ts`, `apps/api/src/modules/classes/classes.model.ts`, `apps/api/src/modules/classes/classes.ports.ts`, `apps/api/src/modules/classes/classes-dev.controller.ts`, `apps/api/src/modules/curriculum/curriculum-reader.ts`, `apps/api/src/modules/accounts/student-directory.ts`, `apps/api/src/app.module.ts`, `apps/web/src/app/screen-pages.ts`

## Phase 2: Classes for the teacher (US-1, US-2, US-3, US-7, US-8, US-9)

- [ ] T010 REQ-6 T02 list: columns, status filter with counts, folded search, 20 per page, empty and no-match states (AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5) — files: `apps/api/src/modules/classes/classes.service.ts`, `apps/api/src/modules/classes/classes.controller.ts`, `apps/web/src/features/classes/ClassesPage.tsx`, `apps/web/src/features/classes/classes-store.ts`
- [ ] T011 REQ-1 T03 wizard navigation: stepper, Tiếp tục / Quay lại / browser Back, earlier steps only, leave confirm, beforeunload (AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6) — files: `apps/web/src/features/classes/CreateClassPage.tsx`, `apps/web/src/features/classes/class-wizard-store.ts`
- [ ] T012 REQ-2 Step 1 class information: fields, counters, name rules incl. uniqueness, date range, "Đang học ngay" notice (AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6) — files: `apps/web/src/features/classes/ClassInfoFields.tsx`, `apps/api/src/modules/classes/classes.service.ts`
- [ ] T013 REQ-3 Step 2 add students: workspace list A→Z with status labels, folded search, selection kept, T12 auto-select, 100 cap, empty state, zero allowed (AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6, AC-3.7) — files: `apps/web/src/features/classes/StudentPicker.tsx`, `apps/web/src/features/students/AddStudentsDialog.tsx`, `apps/api/src/modules/accounts/student-directory.ts`
- [ ] T014 REQ-4 Step 3 curriculum: non-archived list sorted HSK then name, HSK filter + search, single choice, required, no-published warning, empty state with reload (AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.6) — files: `apps/web/src/features/classes/CurriculumPicker.tsx`, `apps/api/src/modules/curriculum/curriculum-reader.ts`
- [ ] T015 REQ-5 Step 4 confirm and create: summary with Sửa, warnings, create once, re-validation back to the earliest step, connection error (AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6) — files: `apps/web/src/features/classes/CreateClassPage.tsx`, `apps/api/src/modules/classes/classes.service.ts`
- [ ] T016 REQ-7 T04 header, tabs, Tổng quan and "Sửa thông tin lớp" with version check and start-date rules (AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5) — files: `apps/web/src/features/classes/ClassPage.tsx`, `apps/web/src/features/classes/OverviewTab.tsx`, `apps/web/src/features/classes/EditClassDialog.tsx`, `apps/api/src/modules/classes/classes.service.ts`
- [ ] T017 REQ-8 Tab Học viên: list, add dialog (Đã trong lớp, cap with concurrency), remove with confirm, data kept on removal, unactivated counted but not tracked (AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6, AC-8.7, AC-8.8, AC-8.9) — files: `apps/web/src/features/classes/StudentsTab.tsx`, `apps/api/src/modules/classes/members.service.ts`
- [ ] T018 REQ-9 Change curriculum when no exercise submission, reset hidden sections and deadlines (AC-9.1, AC-9.2, AC-9.3, AC-9.4) — files: `apps/web/src/features/classes/ChangeCurriculumDialog.tsx`, `apps/api/src/modules/classes/classes.service.ts`
- [ ] T019 REQ-10 End and reopen a class, locked actions while ended, never auto-ended (AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5, AC-10.6) — files: `apps/web/src/features/classes/ClassPage.tsx`, `apps/api/src/modules/classes/classes.service.ts`, `apps/api/src/modules/classes/class-access.ts`
- [ ] T020 REQ-11 Delete a class without submissions (005 and 006), keep accounts, free the name, drop it from exams (AC-11.1, AC-11.2, AC-11.3, AC-11.4, AC-11.5) — files: `apps/api/src/modules/classes/classes.service.ts`, `apps/web/src/features/classes/ClassPage.tsx`
- [ ] T021 REQ-14 Derived class status in VN time, upcoming lock, ended banner, non-member and foreign-workspace refusals (AC-14.1, AC-14.2, AC-14.3, AC-14.4, AC-14.5, AC-14.6) — files: `apps/api/src/modules/classes/class-status.ts`, `apps/api/src/modules/classes/class-access.ts`

## Phase 3: Content of a class (US-6, US-11)

- [ ] T030 REQ-15 Tab Nội dung: summary line, every Bài incl. drafts, section cells with counts and visibility, empty curriculum (AC-15.1, AC-15.2, AC-15.3, AC-15.4) — files: `apps/web/src/features/classes/ContentTab.tsx`, `apps/api/src/modules/classes/content.service.ts`
- [ ] T031 REQ-16 Hide / show per class: single, column and row bulk with confirms and in-progress count, all-or-nothing, already-in-state (AC-16.1, AC-16.2, AC-16.3, AC-16.4, AC-16.5, AC-16.6) — files: `apps/web/src/features/classes/ContentTab.tsx`, `apps/api/src/modules/classes/content.service.ts`
- [ ] T032 REQ-21 Deadline per set per class: cell, popup calendar (±365 days, warnings), apply, clear, "Chưa mở với học viên" (AC-21.1, AC-21.2, AC-21.3, AC-21.4, AC-21.5, AC-21.6, AC-21.7, AC-21.8) — files: `apps/web/src/features/classes/DeadlinePopover.tsx`, `apps/api/src/modules/classes/content.service.ts`
- [ ] T033 REQ-22 Bulk deadline per Bài, failure keeps cells, class-only scope, kept-but-ineffective deadlines and the hidden-section note (AC-22.1, AC-22.2, AC-22.3, AC-22.4, AC-22.5, AC-22.6) — files: `apps/web/src/features/classes/ContentTab.tsx`, `apps/api/src/modules/classes/class-visibility.ts`

## Phase 4: Classes for the student (US-4, US-5, US-10, US-12, US-14)

- [ ] T040 REQ-17 Visibility rules for HV (published Bài/items, hidden sections, per class, no traces, A05 with back to S02, no AI labels, exams unaffected) (AC-17.1, AC-17.2, AC-17.3, AC-17.4, AC-17.5, AC-17.6, AC-17.7, AC-17.8) — files: `apps/api/src/modules/classes/class-visibility.ts`, `apps/api/src/modules/classes/learn-classes.service.ts`
- [ ] T041 REQ-12 S01 class cards, order, upcoming line, empty state (AC-12.1, AC-12.2, AC-12.3) — files: `apps/web/src/features/classes/MyClassesPage.tsx`, `apps/web/src/features/classes/my-classes-store.ts`, `apps/api/src/modules/classes/learn-classes.service.ts`
- [ ] T042 REQ-13 S02 class page: info, Bài list with section labels and progress, empty labels, "Bài tập chưa mở", exam entry (AC-13.1, AC-13.2, AC-13.3, AC-13.4, AC-13.5, AC-13.6, AC-13.7, AC-13.8) — files: `apps/web/src/features/classes/ClassHomePage.tsx`, `apps/api/src/modules/classes/learn-classes.service.ts`
- [ ] T043 REQ-19 S11 lesson page: header, tabs, steps and sets with status, open any order, "Chưa mở" rows, no "Làm lại" (AC-19.1, AC-19.2, AC-19.3, AC-19.4, AC-19.5, AC-19.6, AC-19.7, AC-19.8, AC-19.9) — files: `apps/web/src/features/classes/LessonUnitPage.tsx`, `apps/api/src/modules/classes/learn-classes.service.ts`
- [ ] T044 REQ-20 S02 members: entry with count, list (me first "Bạn", A→Z, avatar + name only), activated only, open S12/S10, alone message, refusal (AC-20.1, AC-20.2, AC-20.3, AC-20.4, AC-20.5, AC-20.6, AC-20.7) — files: `apps/web/src/features/classes/MembersSheet.tsx`, `apps/api/src/modules/classes/learn-classes.service.ts`
- [ ] T045 REQ-23 Deadline labels for HV: Hạn nộp dd/MM(/yyyy), Hạn hôm nay, Quá hạn priority, late work allowed, none without deadline, ended class, live updates (AC-23.1, AC-23.2, AC-23.3, AC-23.4, AC-23.5, AC-23.6, AC-23.7) — files: `apps/api/src/modules/classes/class-visibility.ts`, `apps/web/src/features/classes/LessonUnitPage.tsx`
- [ ] T046 REQ-18 Hidden while active: item access and work gate for S03–S06 (004/005), redirect targets, effective within 5 s (AC-18.1, AC-18.2, AC-18.3) — files: `apps/api/src/modules/classes/class-access.ts`, `apps/api/src/modules/classes/learn-classes.controller.ts`

## Phase 5: Deadline reminders (US-13)

- [ ] T050 REQ-24 08:00 reminder sweep: eligibility at sweep time, one e-mail per student per class per day, rerun-safe, moved deadlines, catch-up before 20:00 (AC-24.1, AC-24.2, AC-24.3, AC-24.4, AC-24.5, AC-24.6) — files: `apps/api/src/modules/classes/reminder.service.ts`
- [ ] T051 REQ-25 Reminder e-mail content: subject, greeting, items in curriculum order, 20 max + "Và {M} bài tập khác", "Làm bài ngay" target, Vietnamese sender and footer, nothing private (AC-25.1, AC-25.2, AC-25.3, AC-25.4, AC-25.5) — files: `apps/api/src/modules/classes/reminder-mail.ts`
- [ ] T052 REQ-26 Delivery failures logged without retry or account change, outside 001 limits, sent info per set for 009 (AC-26.1, AC-26.2, AC-26.3) — files: `apps/api/src/modules/classes/reminder.service.ts`
