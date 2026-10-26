---
feature: 004
plan: ./plan.md
created: 2026-10-26
---

# Tasks — Lessons and Flashcards

<!--
Line format (machine-parsed by sdd):
  - [ ] T### [tags] <imperative description> (AC-x.y, AC-x.z) — files: `path/a`, `path/b`
State: [ ] todo · [~] in progress · [x] done · [!] blocked — change with: node .sdd/scripts/sdd.mjs task T### <state>
Lean mode (constitution 2.0.0): one task per REQ; module behaviour is verified by test-cases.md (QA, /test-module 004);
foundation files touched by [infra] tasks keep their Vitest tests.
-->

## Phase 1: Foundation

- [ ] T001 [infra] Shared step contracts: block schemas with ids, limits, messages, field rules (Hanzi, tone-number pinyin, required), publish issues, rich-text sanitizer, YouTube parser, storage / size formatting, file rules; 002 step helpers delegate to them — files: `packages/shared/src/steps.ts`, `packages/shared/src/steps.test.ts`, `packages/shared/src/curriculum.ts`, `packages/shared/src/index.ts`
- [ ] T002 [infra] `uploadRequest` in the API client (XHR progress, abort, ApiError) — files: `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/api-client.test.ts`
- [ ] T003 [infra] Steps module skeleton: models (`lesson_files`, `card_marks`, `dev_step_links`), `STEP_EVENTS` port called by 002, `StepPractice` dev port, dev controller, upload limit config, web feature folder and routes S03/S04/T08 — files: `apps/api/src/modules/steps/steps.module.ts`, `apps/api/src/modules/steps/steps.model.ts`, `apps/api/src/modules/steps/steps.ports.ts`, `apps/api/src/modules/steps/steps-dev.controller.ts`, `apps/api/src/modules/curriculum/curriculum.ports.ts`, `apps/api/src/app.module.ts`, `apps/api/src/config.ts`, `apps/web/src/app/screen-pages.ts`

## Phase 2: Authoring on T07 / T08 (US-1, US-2, US-3, US-5, US-6, US-9, US-10)

- [ ] T010 REQ-3 Content blocks: add menu (9 types, 50 max), order by drag / "Lên"/"Xuống", delete without confirm, captions, rich text with 8 colours and links, paste filter, Unicode kept (AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6, AC-3.7) — files: `apps/web/src/features/steps/StepBody.tsx`, `apps/web/src/features/steps/RichTextEditor.tsx`, `apps/web/src/features/steps/steps.css`, `apps/web/src/features/curriculum/ItemEditor.tsx`
- [ ] T011 REQ-4 Vocabulary, grammar and dialogue editors with field rules, pinyin conversion on blur and "Tạo bộ thẻ từ danh sách này" (AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.7) — files: `apps/web/src/features/steps/StructuredEditors.tsx`, `apps/web/src/features/steps/PinyinInput.tsx`
- [ ] T012 REQ-1 Bài học tab of T07: section bar counts, add step / add after (saved at once, 30 limit), name and goal fields, move, Draft-Bài notice, every step editable in one frame, edit-only (AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6, AC-1.7, AC-1.8) — files: `apps/web/src/features/curriculum/ManualEditorPage.tsx`, `apps/web/src/features/curriculum/ItemEditor.tsx`, `apps/api/src/modules/steps/steps.controller.ts`, `apps/api/src/modules/steps/steps.service.ts`, `apps/api/src/modules/classes/class-access.ts`
- [ ] T013 REQ-2 Saving per step: draft save, leave guard, conflict reload / overwrite, failure + retry, unsaved labels and counter, tabs keep edits, invalid values block the save (AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-2.8) — files: `apps/api/src/modules/curriculum/lessons.service.ts`, `apps/web/src/features/curriculum/lesson-editor-store.ts`, `apps/web/src/features/curriculum/ManualEditorPage.tsx`, `apps/web/src/features/steps/StepNotices.tsx`
- [ ] T014 REQ-5 File rules, magic-byte check and workspace storage: 10 GB quota, "Đã dùng {x} GB / 10 GB", 80 % warning, refusal when over (pre- and post-upload) (AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6, AC-5.7) — files: `apps/api/src/modules/steps/step-files.service.ts`, `apps/api/src/modules/steps/sniff.ts`, `apps/api/src/modules/steps/steps.controller.ts`, `apps/web/src/features/steps/StorageMeter.tsx`
- [ ] T015 REQ-6 Upload progress, cancel, failure + retry, processing state, unprocessable files, replace file; save/publish of the step blocked while uploading (AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6, AC-6.7) — files: `apps/web/src/features/steps/upload-store.ts`, `apps/web/src/features/steps/FileBlockEditor.tsx`, `apps/api/src/modules/steps/office.ts`
- [ ] T016 REQ-7 Publish rules and issue list per step and block, saves of published / archived steps need readiness, published notice with N classes, web-only layout, archived steps toggle (AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.6, AC-7.7, AC-7.8) — files: `apps/api/src/modules/curriculum/lessons.service.ts`, `apps/web/src/features/steps/StepNotices.tsx`, `apps/web/src/features/curriculum/PreviewPage.tsx`
- [ ] T017 REQ-8 Delete (warnings, marks / files / practice links cleaned), archive / restore at once, archive blocked while unsaved (AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5) — files: `apps/api/src/modules/steps/steps.service.ts`, `apps/web/src/features/curriculum/ManualEditorPage.tsx`
- [ ] T018 REQ-11 Deck dialog T08: open over T07 without saving, cards with files, card rules, add / order / delete, "Xong" keeps edits in the step, deck summary on the block, new deck block (AC-11.1, AC-11.3, AC-11.4, AC-11.5, AC-11.6, AC-11.7, AC-11.9) — files: `apps/web/src/features/steps/DeckDialog.tsx`, `apps/web/src/features/steps/StepBody.tsx`
- [ ] T019 REQ-12 Excel: template download, structural checks, preview with errors and duplicates, add valid rows, capacity and empty-file rules (AC-12.1, AC-12.2, AC-12.3, AC-12.4, AC-12.5, AC-12.6) — files: `apps/api/src/modules/steps/excel.service.ts`, `apps/web/src/features/steps/ExcelImport.tsx`
- [ ] T020 REQ-18 Video from a YouTube link: paste, validation, T07 preview, S03 player, not counted, unavailable message (AC-18.1, AC-18.2, AC-18.3) — files: `apps/web/src/features/steps/FileBlockEditor.tsx`, `apps/web/src/features/steps/YouTubePlayer.tsx`, `apps/api/src/app.ts`
- [ ] T021 REQ-10 Practice sets of a step: read-only list on T07 with "Mở bộ bài tập", removed links disappear, S03 "Luyện tập: …" buttons by set state (AC-10.1, AC-10.2, AC-10.3) — files: `apps/api/src/modules/steps/steps.ports.ts`, `apps/web/src/features/steps/PracticeList.tsx`

## Phase 3: AI-approved steps (US-4)

- [ ] T030 REQ-9 AI approval replaces the section: published "AI tạo" steps, nothing before approval, 30 limit + issues, old steps deleted with their marks / files / links, label never shown to HV (AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6) — files: `apps/api/src/modules/curriculum/ai-replace.service.ts`, `apps/api/src/modules/steps/steps.service.ts`
- [ ] T031 REQ-19 Replacement confirmation texts, all-or-nothing, writes to replaced steps refused with "Phần Bài học đã được thay…", no partial AI edits (AC-19.1, AC-19.2, AC-19.3, AC-19.4, AC-19.5, AC-19.6) — files: `apps/api/src/modules/curriculum/ai-replace.service.ts`, `apps/api/src/modules/curriculum/lessons.service.ts`, `apps/web/src/features/curriculum/ManualEditorPage.tsx`

## Phase 4: Learner (US-7, US-8)

- [ ] T040 REQ-13 HV access: GV isolation, the seven conditions, not started, A05 for everything else, next action after a change, no re-render while viewing, hidden → shown again, all steps open in any order (AC-13.1, AC-13.2, AC-13.3, AC-13.4, AC-13.5, AC-13.6, AC-13.7, AC-13.8) — files: `apps/api/src/modules/steps/learn-steps.service.ts`, `apps/api/src/modules/steps/learn-steps.controller.ts`, `apps/api/src/modules/files/files.service.ts`
- [ ] T041 REQ-14 S03 viewer: header and x/y, video / audio players, one at a time, image lightbox, inline documents, block errors, "Trước"/"Tiếp", nothing tracked (AC-14.1, AC-14.2, AC-14.3, AC-14.4, AC-14.5, AC-14.6, AC-14.7, AC-14.8) — files: `apps/web/src/features/steps/StepViewPage.tsx`, `apps/web/src/features/steps/StepBlocksView.tsx`, `apps/web/src/features/steps/DocumentViewer.tsx`, `apps/web/src/features/steps/learn-store.ts`
- [ ] T042 REQ-15 Vocabulary, grammar and dialogue views, "Pinyin"/"Bản dịch" switches remembered on the device (AC-15.1, AC-15.2, AC-15.3, AC-15.4) — files: `apps/web/src/features/steps/StepBlocksView.tsx`
- [ ] T043 REQ-16 S04 flashcards: deck summary on S03, card faces, flip, audio, marks saved per student and card, offline retry, marks private (AC-16.1, AC-16.2, AC-16.3, AC-16.4, AC-16.5, AC-16.6, AC-16.7) — files: `apps/web/src/features/steps/FlashcardsPage.tsx`, `apps/web/src/features/steps/marks-store.ts`, `apps/api/src/modules/steps/learn-steps.service.ts`
- [ ] T044 REQ-17 Shuffle, only unknown cards, all known, summary, marks after deck edits (AC-17.1, AC-17.2, AC-17.3, AC-17.4, AC-17.5) — files: `apps/web/src/features/steps/FlashcardsPage.tsx`
