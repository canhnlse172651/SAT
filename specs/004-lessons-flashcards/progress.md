# Progress — 004 Lessons and Flashcards

## Handoff 2026-10-26 17:35 — /module 004 (implementer)
- Status: 004-lessons-flashcards implementing · 22/22 tasks   Branch: feat/004-lessons-flashcards @ 3d50a06 (branched from
  feat/003-classes: 004 builds on 002/003 code, which is not merged or verified yet)
- Done this session: spec clarified (be823a4); lean plan, tasks, test-cases (105 TC, all 118 ACs and 8 NFRs covered), analysis PASS
  (f09f005); T001 shared step contracts + tests (b95948b); T002 `uploadRequest` + tests (c666cc1); T003 steps module (814918e);
  T010–T019, T030, T031 authoring, uploads, storage, Excel, AI replacement (40fe2ff); T016, T020, T021, T040–T044 S03, S04, T21 (3d50a06).
  - Backend `apps/api/src/modules/steps/` (`@Global`): GV `/api/steps/*` (T07 info, storage, uploads, document preview, Excel template /
    import), HV `/api/learn/*` (step view, signed file links with byte ranges, marks), dev `/api/dev/steps/storage|practice`; binds 002's new
    `STEP_HOOKS` port (prepare / saved / removed / audience / linked sets). Collections `lesson_files` (storage = Σ size), `card_marks`.
  - 002 changes: step save rules (invalid → 422 `INVALID_CONTENT`, published/archived readiness → 422 `NOT_READY` with `issues`), conflict
    `details { currentVersion, updatedAt }`, `sectionReplacedAt.lesson` + 409 `SECTION_REPLACED`, AI approval issues per step/block and the
    004 confirmation (`confirm`), `ItemEditor` hosts 004's `StepBody`, T21 renders `StepPreview`. 003: `ClassAccess.stepsAudience`,
    `LearnClassesService` exported. Files module: lesson media refused to HV by id (+ test).
  - Foundation: `@sat/shared/steps.ts` (+ tests), `uploadRequest` in `lib/api-client.ts` (+ tests), byte ranges in `FileStorage.get` (+ tests),
    7 block icons (+ test), helmet CSP `frame-src` youtube-nocookie, `UPLOAD_MAX_BYTES` default 500 MiB (+ config test). New dependency
    `pdfjs-dist@6.3.289` (web, Apache-2.0, lazy-loaded; reason in plan.md).
  - Checks this session (portable Node 24.22.1): lint ✔, typecheck ✔, `run test` 61 files / 334 passed, build ✔, `run test:e2e` 10 passed.
    API smoke walk on the hermetic server (38 checks, all OK) and a Playwright UI walk: T07 (blocks, pinyin conversion, deck from words,
    T08, publish issue list, save), S03 at 390 px (all block types, PDF pages, no horizontal scroll), S04 (marks, summary, only unknown),
    Tiếp / Về trang bài, T21 preview.
- In progress: —
- Next: `/test-module 004` trong phiên mới (agent QA, Playwright MCP).
- Blockers / questions:
  - Environment: this machine's Node is v20; the repo pins 24 (`.nvmrc`) and the web (jsdom) tests do not start on 20. A portable Node 24
    was used on PATH. Install Node 24 for QA.
  - Spec gaps decided in the plan (for the spec owner, not blocking): YouTube blocks use YouTube's own controls (AC-14.2 is checked on
    uploaded video / audio); a DOCX "page" is a page break of the file, else ~3 000 characters; DOCX / PPTX show their text per page /
    slide, not their layout; video is not transcoded ("Đang xử lý…" is the server check after 100 %). Storage on T08 is shown in the dialog
    header (gap #3 of the clarification). The AC-5.6 message still says "Hãy xóa bớt tệp không dùng…" as written in the spec.
  - Not covered by 004 (other owners): 010 must apply AC-5.6 to its source uploads; files of 005 / 016 are outside the quota; card marks of
    a deleted HV are not purged yet (`STUDENT_LINKS` is bound by 003; a later change should add 004's marks); `npm audit` lists pre-existing
    high findings in Nest / multer / undici (not from pdfjs-dist).
  - The dev `LocalDiskStorage` buffers an upload in memory before writing it (fine for QA; a production storage adapter must stream).
- Verify with: node .sdd/scripts/sdd.mjs run test && node .sdd/scripts/sdd.mjs run test:e2e
