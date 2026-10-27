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

## Handoff 2026-10-27 09:50 — /test-module 004 (QA)
- Status: 004-lessons-flashcards implementing · 22/22 tasks   Branch: feat/004-lessons-flashcards @ 37ad27c (code under test)
- Done this session: QA run 2026-10-27-0932 — 101 replayable scripts (`testing/e2e/TC-###.spec.ts` + `helpers.ts`), 94/101 E2E/API Pass,
  4 manual cases with instructions; report `testing/runs/2026-10-27-0932/report.md`; `verification.md` (QA section, Verdict FAIL);
  `sdd trace 004`: no gaps. This QA ran in the same session as the implementation (not an independent QA session).
- In progress: —
- Next: `/module 004` — sửa TC-024, TC-028 (B1: giữ đậm/nghiêng/gạch chân — bỏ `styleWithCSS` hoặc nhận các span định dạng trong
  `sanitizeRichText`), TC-045 (B2: pha "Đang xử lý…" không khóa "Lưu nháp"), TC-067 (B3: T08 chỉ có "Xong"), TC-080 (B5: thao tác tiếp theo
  kiểm tra bước đang xem còn mở không), TC-099 (B6: hiệu năng mở T07 30 bước); TC-077 (B4) chờ agent spec thống nhất 004 AC-13.4 với 003 AC-14.5.
  Sau khi sửa: `/test-module 004` — chạy lại TC-024 TC-028 TC-045 TC-067 TC-077 TC-080 TC-099.
- Blockers / questions: B4 là xung đột spec (004 AC-13.4 vs 003 AC-14.5). `scripts/replay-module-tests.mjs` không lọc được nhiều TC trên Windows
  (`|` qua `shell: true`) — chạy cả module hoặc từng TC.
- Verify with: node .sdd/scripts/sdd.mjs run test:modules -- 004

## Handoff 2026-10-27 11:00 — /module 004 (fix mode)
- Status: 004-lessons-flashcards implementing · 22/22 tasks   Branch: feat/004-lessons-flashcards @ afee525
- Done this session (fixes for QA run 2026-10-27-0932, application code only; scripts and expected results untouched):
  - B1 TC-024, TC-028 (5bb376c): the editor writes `<b>/<i>/<u>/<font>` (no `styleWithCSS`); `sanitizeRichText` also turns
    `font-weight` / `font-style` / `text-decoration` / palette-colour spans (editor, pasted Word / Docs) into b / i / u / colour (+ tests);
    Enter starts a plain line (the browser carried bold into the next line).
  - B2 TC-045 (a160e40): `uploadPhase()` — "Đang xử lý…" keeps "Lưu nháp" enabled, "Xuất bản" / "Lưu thay đổi" stay blocked.
  - B3 TC-067 (fbd8e15): `Dialog`/`Overlay` option `closeButton` (+ test); T08 has only "Xong".
  - B5 TC-080 (68844df): "Trước" / "Tiếp" send `from=<viewed step>`; the API checks it first → "Bước học này hiện không còn khả dụng." + S11.
  - B6 TC-099 (afee525 + toolbar part of 5bb376c): steps off screen skip layout (`content-visibility`), text-editor toolbars built near the
    screen only (DOM 21 k → 16 k elements), web fonts loaded after the page (`lib/fonts.ts`, + tests; index.html no longer blocks on
    Google Fonts), session asked at start, `/assets` scripts and styles sent gzip-compressed (`node:zlib` in `app.ts`, no new
    dependency, + test). T07 30 steps: 1,1–1,6 s (was 2,5 s); S03 cold 4G + CPU 4×: 2,3–2,8 s (was 2,9–3,1 s).
  - Checks (portable Node 24): lint ✔, typecheck ✔, `run test` 62 files / 339 passed, build ✔, `run test:e2e` 10 passed. Full serial replay
    of the 101 scripts: 99 pass; TC-077 fails (B4, below); TC-072 failed once in the full run (download timing) and passes alone.
- In progress: —
- Next: `/test-module 004` — chạy lại TC-024 TC-028 TC-045 TC-067 TC-080 TC-098 TC-099 (và TC-072, TC-077); nên chạy lại cả module.
- Blockers / questions:
  - B4 TC-077 not fixed — spec conflict for the spec agent: 004 AC-13.4 wants A05 "Không tìm thấy nội dung bạn yêu cầu." for an HV
    outside the class; 003 AC-14.5 answers "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" (404 `CLASS_NOT_MEMBER`). Needs one rule.
  - TC-098 (NFR-1) passes now but its p95 of 5 cold loads stays within ~0,2–0,7 s of 3 s on the simulated phone; further gains would need
    smaller bundles or a CDN/brotli in hosting (ADR-0003 pending).
  - Web fonts now arrive after the page has loaded (fallback font shown briefly on the first visit) — design owner to confirm.
- Verify with: node .sdd/scripts/sdd.mjs run test:modules -- 004

## Handoff 2026-10-27 11:10 — /test-module 004 (QA)
- Status: 004-lessons-flashcards implementing · 22/22 tasks   Branch: feat/004-lessons-flashcards @ a04568f (code under test)
- Done this session: QA run 2026-10-27-1057 — all 101 saved scripts (unchanged), serial: 100/101 E2E/API Pass, 4 manual cases with
  instructions; TC-024 and TC-067 also walked by hand with Playwright MCP. B1, B2, B3, B5, B6 fixed (T07 30 steps 1 145 ms; S03 p95 2 667 ms).
  Report `testing/runs/2026-10-27-1057/report.md`; `verification.md` Verdict FAIL (only TC-077); `sdd trace 004`: no gaps. Same session as the
  fixes (not an independent QA session).
- In progress: —
- Next: agent spec — thống nhất 004 AC-13.4 với 003 AC-14.5 (HV ngoài lớp: A05 hay "Bạn không thuộc lớp này…"); sau đó `/module 004` — sửa
  TC-077 nếu spec giữ A05 (hoặc cập nhật test case theo spec mới), rồi `/test-module 004` — chạy lại TC-077.
- Blockers / questions: B4 là xung đột spec, không sửa được bằng code khi chưa có quyết định. Font web nay tải sau khi trang tải xong (chủ thiết kế
  xác nhận).
- Verify with: node .sdd/scripts/sdd.mjs run test:modules -- 004 TC-077
