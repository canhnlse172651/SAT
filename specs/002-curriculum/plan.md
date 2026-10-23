---
feature: 002
mode: lean
created: 2026-10-23
---

# Plan — 002 Curriculum & Lessons (lean)

**Backend** `apps/api/src/modules/curriculum/` (one Nest module). Collections: `curricula` (name, `nameKey` unique per workspace —
folded, kept for archived ones; `searchKey`; `hsk` 1–9; description; `coverFileId`; `archivedAt`; **`lessonIds` = the Bài order**;
`copyState`/`copyLockAt` for duplication; `version`) and `lessons` (curriculumId, name, status, `version`, **embedded `items[]`** =
steps and sets in one array, each `{ _id, section: lesson|exercise, title, status draft|published|archived, ai, content, version }`;
section order = array order filtered by section). No replica set → no transactions, so every "one operation" rule (publish Bài +
items, reorder, AI replace, duplicate Bài) is a single-document update; adding/duplicating a Bài inserts the lesson then `$push`es
its id with a size guard (an unreferenced lesson is invisible and deleted on failure); duplicating a curriculum writes a hidden
`copyState: copying` copy, then flips it (a stale copy is swept). Ports in `curriculum.ports.ts` for modules not built yet —
`CURRICULUM_CLASSES` (003: using classes, curricula of an HV), `LEARNING_DATA` (005: sets with attempts/submissions),
`AI_DRAFTS` (010: Bài AI label, discard on delete) — bound to `DevCurriculumLinks` (reads `dev_curriculum_links`; empty in prod).
`curriculum-dev.controller.ts` (`/api/dev/curriculum/*`, dev/test only, registered via `CurriculumModule.forRoot`) lets QA create a
using class (+ HV members), mark a set as having learning data, set a Bài AI label, and **approve an AI section** (REQ-19 preview +
replace, the call 010 will make). Item content is owned by 004/005; until they exist `item-content.ts` defines an interim content
shape (step: text blocks; set: multiple-choice questions) and the publish-readiness reasons. Structured logs (NFR-7) via `Logger`.
**Frontend** `apps/web/src/features/curriculum/`: `curriculum-store.ts` (T05 list/filters, T06 detail, T18 Bài) and
`lesson-editor-store.ts` (T07 working copies + unsaved count, shared with the 004/005 tabs). Contracts: `@sat/shared/curriculum.ts`.

| REQ | Backend (service / endpoint under `/api`) | Frontend (screen → component) |
|-----|------------------------------------------|-------------------------------|
| REQ-1 | `create`, cover upload: `POST curricula`, `POST curricula/covers` (raw body; JPG/PNG/WebP by magic bytes, ≤ 2 MB → `FILE_STORAGE`) | T05 `CurriculumFormDialog` |
| REQ-2 | `update` (`expectedVersion`), usage count for the HSK confirm: `PATCH curricula/:id` | T06 "Sửa thông tin" dialog + HSK confirm |
| REQ-3 | `list` (`hsk`, `q` folded, `archived`, page 20; per-level counts): `GET curricula` | T05 `CurriculaPage` (filter kept in session) |
| REQ-4 | `detail` (lessons in order, summaries, usage, labels): `GET curricula/:id`, `GET curricula/:id/classes` | T06 `CurriculumPage`, "Lớp sử dụng" popover |
| REQ-5 | `addLesson` (≤ 100), `renameLesson`: `POST curricula/:id/lessons`, `PATCH lessons/:id` | T06/T18 `LessonNameDialog` |
| REQ-6 | `reorderLessons` (`expectedOrder`), `moveItem` (`expectedOrder` of the section): `PUT curricula/:id/lesson-order`, `POST lessons/:id/items/:itemId/move` | T06 drag-drop + keyboard + ▲▼ + menu; T07 ▲▼ |
| REQ-7 | `getLesson`, `addItem` (≤ 30 non-archived, after an item): `GET lessons/:id`, `POST lessons/:id/items` | T18 `LessonPage` (Thủ công summary, AI panel frame), T07/T09 `ManualEditorPage` (header, tabs, leave guard) |
| REQ-8 | section is fixed per item; moves stay in-section (`AC-8.2` → 409) | same order in T07, T21, HV API |
| REQ-9 | `saveItem`, `publishItem` (save + publish), `publishLesson` (lesson + chosen items, one update): `PUT/POST lessons/:id/items/:itemId[/publish]`, `POST lessons/:id/publish` | T07 item bar, `PublishLessonDialog` (T06, T18, T07) |
| REQ-10 | `visibleCurriculum`/`visibleLesson` for HV via `CURRICULUM_CLASSES`: `GET learn/curricula/:id`, `GET learn/lessons/:id` (`@Roles('HV')`, 404 otherwise) | warning on T06/T18 (S02/S11 are 003) |
| REQ-11 | AI label from `AI_DRAFTS` in DTOs; replace via REQ-19 | T18 right panel frame "Tạo bằng AI" (body = 010), AI chip → T20/T18 |
| REQ-12 | `deleteItem`, `deleteLesson` (learning-data check at confirm, AI discard): `DELETE lessons/:id/items/:itemId`, `DELETE lessons/:id` | T07 delete confirm, T06/T18 "Xóa bài" |
| REQ-13 | `remove`, `archive`, `restore`: `DELETE curricula/:id`, `POST curricula/:id/archive|restore` | T05 "Đã lưu trữ" switch + "Khôi phục", T06 menu |
| REQ-14 | `duplicateLesson` (single insert, lock): `POST lessons/:id/duplicate` | T06/T18 "Nhân bản bài" |
| REQ-15 | `duplicate` (hidden copy then flip, lock): `POST curricula/:id/duplicate` | T06 "Nhân bản" dialog ("Đang nhân bản…") |
| REQ-16 | `preview` (published [+ drafts], no recording): `GET lessons/:id/preview` | T21 `PreviewPage` (tabs, "Gồm cả mục Nháp", Web/Mobile in session storage) |
| REQ-17 | `@Roles('GV')`, `scoped()`, uniform 404, versions/expected orders → 409 `CONFLICT` | `RequireRole` (HV → S01), conflict toast + reload, busy buttons |
| REQ-18 | `archiveItem`, `restoreItem`: `POST lessons/:id/items/:itemId/archive|restore` | T07 "Lưu trữ"/"Khôi phục", "Hiện mục lưu trữ (n)" |
| REQ-19 | `replacementPreview`, `replaceSection` (one update; archive sets with learning data after the new items) | dev endpoint until 010's T20 |

Schema changes: new `curricula`, `lessons`, `dev_curriculum_links`. `@sat/shared`: `HSK_LEVELS` 1–9 (`HskBadge` accepts a level),
`foldSearch`. Route table: T05, T06, T07, T09, T18, T21 replace their placeholders in `app/screen-pages.ts`.
New dependencies: none (drag-and-drop with native events).

## Constitution Check

- I Spec is truth — every endpoint/screen traces to a REQ above; 003/004/005/010 parts are ports or interim, not new behaviour.
- II Verified — module: test-cases.md + QA; foundation edits (`hsk.ts`, `HskBadge`, `foldSearch`) come with Vitest tests.
- III Traceability — tasks.md one task per REQ; test-cases cite every AC.
- IV Simplicity — embedded items + order arrays instead of transactions; no new dependency.
- V Security — `@Roles('GV'|'HV')`, `scoped()` on every query, Zod at the boundary, cover type by magic bytes, dev endpoints dev/test only.
- VI Observability — one structured log line per mutation (actor, target ids, result, counts; no content/PII).
- VII Small changes — one commit per task; no destructive migration.
- VIII Toolchain — checks via `node .sdd/scripts/sdd.mjs run …`.
