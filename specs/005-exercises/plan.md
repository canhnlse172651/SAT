---
feature: 005
mode: lean
created: 2026-10-27
---

# Plan — 005 Exercises and Auto Grading (lean)

**Where it lives.** 002 already stores a set as an item of the Bài (`lessons.items[]`, section `exercise`, `title`, `status`, `ai`,
`content`, per-item `version`) and owns its lifecycle (add / move / save / publish / archive / restore / delete / AI replace, T07 frame).
005 owns the set **content**, the learner attempts and everything around them: (1) `@sat/shared/exercises.ts` — question schemas (9
kinds: `mcq`, `vocab` meaning|hanzi|pinyin, `cloze`, `match`, `order`, `write`, `reading`; stable ids on questions, options, blanks,
pairs, tiles, subs), set content `{ instructions, stepId, questions }`, limits and exact messages, field rules (AC-2.6), completeness
rules (AC-x.y "chưa hoàn chỉnh"), publish issues "Câu n: …", answer normalisation (AC-7.1 – 7.3), pinyin syllable validator (AC-7.4),
grading (REQ-4 … REQ-11), learner-safe view + shuffles, answered / complete (AC-14.3), review rows (S06 / T14 text of answer and key);
002's `setContentSchema` / `newItemContent` / `itemNotReadyReason('exercise')` delegate to it (legacy interim MCQ content upgraded on
parse). (2) API module `apps/api/src/modules/exercises/` (`@Global`) — attempts, grading, re-grading, HV S05/S06 endpoints, T14,
duplication, and the bindings of 002 `LEARNING_DATA`, 003 `CLASS_LEARNING`, 004 `STEP_PRACTICE`, 001 `STUDENT_LINKS` (merged with the
dev stand-ins in development/test so 002–004 QA scripts keep working). (3) Web feature `apps/web/src/features/exercises/` — the set
body inside 002's `ItemEditor` (T09), S05, S06, T14, and the question views reused by T21.

Collection `exercise_attempts` (workspace, class, set, lesson, student; unique class+set+student = one attempt, AC-14.8): `status`
doing|submitted, `startedAt`, `submittedAt`, `submitKey`, `lastIndex`, `shuffles` (match column B, order bank — AC-8.4, AC-9.4),
`answers` by question id, `score`/`maxScore`/`results`, `gradedVersion` (item version graded against), `regrades[]` {at, from, to},
`notice` (AC-18.4). Question images are 004 files of a new kind `questionImage` (5 MB, JPG/PNG/WebP/GIF) registered in `lesson_files`:
the 10 GB quota, "counted once" and release-when-unreferenced come from 004 (`FILE_PATHS` gains the question / option image paths).

| REQ | Backend (`/api/...`) | Frontend |
|-----|----------------------|----------|
| REQ-1 | 002 `addItem` (new set = 1 sample MCQ), `move`; `GET exercises/lessons/:id/sets` (submission counts, regrade state); set `content.stepId` | `SetEditor` in `ItemEditor`: Tiêu đề, Hướng dẫn, "Bước học liên kết", counts bar, empty state, archived toggle (002) |
| REQ-2 | 002 `saveItem` → `SET_HOOKS.prepare`: invalid field → 422 `INVALID_CONTENT` "Chưa lưu được: …" | question list (Lên trên / Xuống dưới / Xóa câu), "Thêm câu hỏi" menu, total points, field errors on blur |
| REQ-3 | `POST steps/files?kind=questionImage` (004 endpoint, quota pre/post check) | stem text + image (+ zoom on S05), upload retry, "Giải thích" |
| REQ-4, REQ-5, REQ-6, REQ-7, REQ-8, REQ-9, REQ-10, REQ-11 | shared schemas, completeness, grading (REQ-7: normalisation + pinyin validator) | `QuestionEditors` (one per kind) and `QuestionView` (S05 / T21) per kind, tap + keyboard + drag |
| REQ-12 | 002 `saveItem` / `publishItem` + shared `setIssues` (422 `NOT_READY` `details.issues`) | "Lưu nháp" / "Lưu thay đổi" / "Xuất bản", issue list on the set, scroll to first, "Chưa lưu" |
| REQ-13 | 002 `AiReplaceService` exercise branch: AC-12.3 per set, AC-13.4 rejects, `ai` on questions, step link kept if present, confirmation lines (AC-13.11) | (T20 is 010's — dev API) |
| REQ-14 | `GET/POST learn/classes/:classId/sets/:setId(/start)`, `PUT …/attempt` (per-question last write wins), gate = 003 `ClassAccess` + 005 rules | `ExercisePage` (S05): intro, board, Câu trước/sau, autosave queue with offline retry, leave warning |
| REQ-15 | `POST …/submit {submitKey}` idempotent per key; other key after submit → 409 `ALREADY_SUBMITTED` | confirm dialog, offline retry |
| REQ-16 | grading at submit with the current key; `GET …/review` (S06 rows or `submitted:false`) | `ReviewPage` (S06) |
| REQ-17 | one attempt per HV×set×class; status from 003 `learnerSetStatus`; ports for 008/009 | status chip + score on S05 |
| REQ-18 | `SET_HOOKS.prepare`: structure lock when submitted (409 `SET_LOCKED`); attempts notified on structure change; `POST exercises/lessons/:id/sets/:setId/duplicate` (002 `duplicateItem`) | lock banner, disabled controls, "Nhân bản"; T21 renders sets with `QuestionView` |
| REQ-19 | save with changed scores → 409 `REGRADE_REQUIRED {count}` unless `confirmRegrade`; regrade every class, `gradedVersion` sweep | "Chấm lại và lưu" dialog, "Đang chấm lại …" |
| REQ-20 | `GET exercises/submissions?classId&setId&studentId`, `GET exercises/classes/:classId/sets/:setId/submissions` (T04 entry) | `SubmissionPage` (T14), "Xem bài nộp" list on T04 Nội dung |
| REQ-21 | access through 003 `ClassAccess.item` (member, started, visible); set content never sent to HV by 002 / 003 learn endpoints | A05 / refusal messages |
| REQ-22 | 002 archive / restore / delete (learning data = attempts) | "Lưu trữ" / "Khôi phục" / "Xóa" (002) |
| REQ-23 | 003 `effectiveDeadline`, `vnDayEnd`; late derived at read time | deadline lines, "Nộp muộn", "Chưa mở" |

Screens replaced in `screen-pages.ts`: S05 → `ExercisePage`, S06 → `ReviewPage`, T14 → `SubmissionPage` (`/gv/bai-nop?lop&hv&bo`).
Logs (NFR-10): publish / archive / restore / delete (002), duplicate, start, submit, grade, regrade (count), autosave / submit failures —
ids, counts and codes only. **No new dependency.** Changed foundation (tests updated): `packages/shared` (exercises, curriculum, steps).
Spec gaps decided here: re-grading runs inside the save request, so "Đang chấm lại <x>/<N>" shows while it runs (≤ 60 s for 5 000).

## Constitution Check

- I Spec: every behaviour maps to an AC of the approved spec; the regrade progress note above is flagged, not a new rule.
- II Verified: module verified by test-cases.md + QA; foundation changes keep Vitest tests (shared exercises: schemas, pinyin, grading).
- III Traceability: one task per REQ, every AC in tasks.md and test-cases.md.
- IV Simplicity: content stays in 002's item; one attempts collection; images reuse 004 storage; no job queue for regrading.
- V Security: Zod at every boundary, answers never sent before submission, `scoped()` everywhere, A05 for foreign / hidden data.
- VI Observability: structured logs listed above, no question text, answers or PII.
- VII Small changes: one commit per task; legacy interim set content upgraded on read, no migration.
- VIII Toolchain: only `node .sdd/scripts/sdd.mjs run …`.
