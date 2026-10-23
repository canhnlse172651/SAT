---
feature: 002
plan: ./plan.md
created: 2026-10-23
---

# Tasks — Curriculum & Lessons

<!--
Line format (machine-parsed by sdd):
  - [ ] T### [tags] <imperative description> (AC-x.y, AC-x.z) — files: `path/a`, `path/b`
State: [ ] todo · [~] in progress · [x] done · [!] blocked — change with: node .sdd/scripts/sdd.mjs task T### <state>
Lean mode (constitution 2.0.0): one task per REQ; module behaviour is verified by test-cases.md (QA, /test-module 002);
foundation files touched by [infra] tasks keep their Vitest tests.
-->

## Phase 1: Foundation

- [x] T001 [infra] Shared curriculum contracts (schemas, messages, error codes), HSK levels 1–9 + `HskBadge` level, `foldSearch` — files: `packages/shared/src/curriculum.ts`, `packages/shared/src/hsk.ts`, `packages/shared/src/text.ts`, `apps/web/src/components/HskBadge/HskBadge.tsx`
- [x] T002 [infra] Curriculum module skeleton: `curricula` / `lessons` models, ports for 003/005/010 with the dev links adapter and dev controller, interim item content, web feature folder and routes — files: `apps/api/src/modules/curriculum/curriculum.module.ts`, `apps/api/src/modules/curriculum/curriculum.model.ts`, `apps/api/src/modules/curriculum/curriculum.ports.ts`, `apps/api/src/modules/curriculum/item-content.ts`, `apps/api/src/modules/curriculum/curriculum-dev.controller.ts`, `apps/api/src/app.module.ts`, `apps/web/src/app/screen-pages.ts`

## Phase 2: Curricula (US-1, US-9)

- [x] T010 REQ-1 Create a curriculum on T05 with field rules, unique name and cover image (AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6) — files: `apps/api/src/modules/curriculum/curriculum.controller.ts`, `apps/api/src/modules/curriculum/curriculum.service.ts`, `apps/web/src/features/curriculum/CurriculumFormDialog.tsx`, `apps/web/src/features/curriculum/curriculum-store.ts`
- [x] T011 REQ-3 T05 list: cards, HSK filter kept in session, accent-insensitive search, empty/no-match states, 20 per page (AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6) — files: `apps/api/src/modules/curriculum/curriculum.service.ts`, `apps/web/src/features/curriculum/CurriculaPage.tsx`
- [x] T012 REQ-2 Edit curriculum info, HSK change confirm when used, changes visible to using classes (AC-2.1, AC-2.2, AC-2.3, AC-2.4) — files: `apps/api/src/modules/curriculum/curriculum.service.ts`, `apps/web/src/features/curriculum/CurriculumFormDialog.tsx`
- [ ] T013 REQ-4 T06 detail: header, usage notice, "Lớp sử dụng", lesson rows with summaries and labels, empty state (AC-4.1, AC-4.2, AC-4.3, AC-4.4) — files: `apps/api/src/modules/curriculum/curriculum.service.ts`, `apps/web/src/features/curriculum/CurriculumPage.tsx`, `apps/web/src/features/curriculum/LessonRow.tsx`
- [ ] T014 REQ-13 Delete (guarded by classes and learning data), archive and restore curricula (AC-13.1, AC-13.2, AC-13.3, AC-13.4, AC-13.5, AC-13.6) — files: `apps/api/src/modules/curriculum/curriculum.service.ts`, `apps/web/src/features/curriculum/CurriculumPage.tsx`, `apps/web/src/features/curriculum/CurriculaPage.tsx`

## Phase 3: Bài and items (US-2, US-3, US-4, US-6)

- [ ] T020 REQ-5 Add a Bài ("Bài N", max 100) and rename it on T06/T18 (AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5) — files: `apps/api/src/modules/curriculum/lessons.service.ts`, `apps/api/src/modules/curriculum/lessons.controller.ts`, `apps/web/src/features/curriculum/LessonNameDialog.tsx`
- [ ] T021 REQ-6 Order Bài on T06 (drag, keyboard, ▲▼, menu, Esc, rollback) and items in T07 (▲▼ incl. hidden archived) (AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6) — files: `apps/api/src/modules/curriculum/curriculum.service.ts`, `apps/api/src/modules/curriculum/lessons.service.ts`, `apps/web/src/features/curriculum/use-sortable.ts`, `apps/web/src/features/curriculum/CurriculumPage.tsx`
- [ ] T022 REQ-7 T18 "Soạn bài" (header, Thủ công summary, AI panel frame) and T07/T09 "Soạn bài thủ công" (header, tabs, add item, immediate saves, unsaved kept across tabs, leave guard) (AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-7.6, AC-7.8, AC-7.9, AC-7.10, AC-7.11, AC-7.12, AC-7.13, AC-7.14) — files: `apps/web/src/features/curriculum/LessonPage.tsx`, `apps/web/src/features/curriculum/ManualEditorPage.tsx`, `apps/web/src/features/curriculum/lesson-editor-store.ts`, `apps/api/src/modules/curriculum/lessons.service.ts`
- [ ] T023 REQ-8 Separate order per section, no cross-section moves, same order everywhere (AC-8.1, AC-8.2, AC-8.3) — files: `apps/api/src/modules/curriculum/lessons.service.ts`
- [ ] T024 REQ-9 Publish an item (save + publish), publish a Bài with the item-choice dialog, allowed transitions only (AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6) — files: `apps/api/src/modules/curriculum/lessons.service.ts`, `apps/web/src/features/curriculum/PublishLessonDialog.tsx`, `apps/web/src/features/curriculum/ItemEditor.tsx`
- [ ] T025 REQ-18 Archive / restore steps and sets, "Hiện mục lưu trữ", archive disabled while unsaved (AC-18.1, AC-18.2, AC-18.3, AC-18.4, AC-18.5) — files: `apps/api/src/modules/curriculum/lessons.service.ts`, `apps/web/src/features/curriculum/ManualEditorPage.tsx`
- [ ] T026 REQ-12 Delete items and Bài with learning-data guards and AI-content warning (AC-12.1, AC-12.2, AC-12.3, AC-12.4, AC-12.5, AC-12.6, AC-12.7) — files: `apps/api/src/modules/curriculum/lessons.service.ts`, `apps/web/src/features/curriculum/ManualEditorPage.tsx`, `apps/web/src/features/curriculum/CurriculumPage.tsx`

## Phase 4: Học viên, AI, copies, preview (US-4, US-5, US-7, US-8)

- [ ] T030 REQ-10 HV-visible content (published Bài + published items, order, empty sections hidden, A05 otherwise) and the "no content for HV" warning (AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5, AC-10.6, AC-10.7) — files: `apps/api/src/modules/curriculum/learn.controller.ts`, `apps/api/src/modules/curriculum/visible-content.ts`
- [ ] T031 REQ-11 "Tạo bằng AI" panel frame on every Bài, AI label on T06/T18 with links, approved items published with "AI tạo" (AC-11.1, AC-11.2, AC-11.3, AC-11.4, AC-11.5, AC-11.6, AC-11.7) — files: `apps/web/src/features/curriculum/AiPanelFrame.tsx`, `apps/api/src/modules/curriculum/lessons.service.ts`
- [ ] T032 REQ-19 AI section replacement: preview list, delete old items, archive sets with learning data after the new ones, readiness and change checks (AC-19.1, AC-19.2, AC-19.3, AC-19.4, AC-19.5, AC-19.6) — files: `apps/api/src/modules/curriculum/ai-replace.service.ts`, `apps/api/src/modules/curriculum/curriculum-dev.controller.ts`
- [ ] T033 REQ-14 Duplicate a Bài right after the original, all drafts, AI marks kept, nothing learner-related (AC-14.1, AC-14.2, AC-14.3, AC-14.4, AC-14.5) — files: `apps/api/src/modules/curriculum/lessons.service.ts`
- [ ] T034 REQ-15 Duplicate a curriculum with name/HSK dialog, same statuses, all-or-nothing, "Đang nhân bản…" (AC-15.1, AC-15.2, AC-15.3, AC-15.4, AC-15.5, AC-15.6) — files: `apps/api/src/modules/curriculum/curriculum.service.ts`, `apps/web/src/features/curriculum/CurriculumFormDialog.tsx`
- [ ] T035 REQ-16 T21 "Xem như học viên" from T06: tabs, drafts switch, full item content, try answers without recording, Web / Mobile remembered in the session (AC-16.1, AC-16.2, AC-16.3, AC-16.4, AC-16.5, AC-16.6, AC-16.7, AC-16.8, AC-16.9, AC-16.10) — files: `apps/web/src/features/curriculum/PreviewPage.tsx`, `apps/api/src/modules/curriculum/lessons.service.ts`
- [ ] T036 REQ-17 Owner-only access, uniform A05 for other workspaces, HV sent to S01, stale-data conflicts, single submit (AC-17.1, AC-17.2, AC-17.3, AC-17.4, AC-17.5) — files: `apps/api/src/modules/curriculum/curriculum.controller.ts`, `apps/web/src/features/curriculum/conflict.ts`
