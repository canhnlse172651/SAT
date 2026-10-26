---
feature: 004
mode: lean
created: 2026-10-26
---

# Plan — 004 Lessons and Flashcards (lean)

**Where it lives.** 002 already stores a step as an item of the Bài (`lessons.items[]`, section `lesson`, `title`, `status`, `ai`,
`content`, per-item `version`) and owns its lifecycle (add / move / save / publish / archive / restore / delete / AI replace, T07 frame).
004 owns the step **content** and everything around it: (1) `@sat/shared/steps.ts` — block schemas (9 types, ids on blocks and cards),
limits, exact messages, field rules (Hanzi present, tone-number pinyin, required), publish issues, rich-text sanitizer, YouTube parsing,
storage formatting; 002's `stepContentSchema` / `newItemContent` / `itemNotReadyReason('lesson')` delegate to it (legacy `{type:'text',
text}` blocks are upgraded on parse). (2) API module `apps/api/src/modules/steps/` (`@Global`) — uploads + storage, Excel, T07 side data,
HV viewer + marks, and the `STEP_EVENTS` port that 002 calls after a step is saved / deleted / replaced. (3) Web feature
`apps/web/src/features/steps/` — the step body inside 002's `ItemEditor`, T08 dialog, S03, S04, and the HV-view blocks reused by T21.

Collections: `lesson_files` (registry of 004/010 media: `fileId`, `kind` block|card|ai-source|filler, `size`, `name`, `contentType`,
`preview` = text pages of DOCX/PPTX) — **storage used = Σ size** (each file once; unreferenced files are released on save / delete /
replace, orphans > 24 h swept daily at 03:00); `card_marks` (workspace, student, cardId, deckId, `known|unknown`, unique
student+card; shared by every class); `dev_step_links` (stand-in for 005's "Bước học liên kết"). Steps get `content.goal`; the Bài gets
`sectionReplacedAt.lesson` (set by AI replace) so a write to a replaced step answers 409 `SECTION_REPLACED` (AC-19.5).

| REQ | Backend (`/api/...`) | Frontend |
|-----|----------------------|----------|
| REQ-1 | 002 `addItem` (empty step = goal '' + one text block), `move`; `GET steps/lessons/:id/info` → audience N (003 `ClassAccess.stepsAudience`), storage, practice | `StepBody` in `ItemEditor` (title "Tên bước học", "Mục tiêu bước học"), tab bar texts, Draft-Bài notice |
| REQ-2 | 002 `saveItem`: invalid values → 422 `INVALID_CONTENT` "Chưa lưu được: …", stale version → 409 with `{currentVersion, updatedAt}`, overwrite = resend with current version | per-step notices: conflict ("Tải lại bản mới nhất" / "Ghi đè bằng bản của tôi"), network failure + "Thử lại", invalid |
| REQ-3 | content schema + `sanitizeRichText` on save | `RichTextEditor` (toolbar, 8 colours, paste filter), block list (add menu, drag / "Lên"/"Xuống", delete) |
| REQ-4 | field rules in shared | `VocabEditor`, `GrammarEditor`, `DialogueEditor`, `PinyinInput` (tone numbers → marks on blur), "Tạo bộ thẻ từ danh sách này" |
| REQ-5 | `POST steps/files?kind=` (stream, ext + size + quota pre-check, magic-byte sniff, DOCX/PPTX parse, post-check for parallel uploads) | `FileBlockEditor`, `StorageMeter` (T07 bar + T08) |
| REQ-6 | same endpoint (cancel = aborted request, partial file never registered) | `upload-store.ts` (XHR progress via `uploadRequest`), "Đang xử lý…", "Thay tệp", save/publish blocked while uploading |
| REQ-7 | 002 `publishItem` / save of published+archived → readiness 422 `NOT_READY` `details.issues` | issue list per step (click → scroll to block); archived toggle (002) |
| REQ-8 | `STEP_EVENTS.deleted` → marks deleted, files released, practice unlinked | delete confirm warnings (N classes, m decks) |
| REQ-9 | 002 `AiReplaceService`: 30 limit + issues per step/block, `STEP_EVENTS.replaced`, `sectionReplacedAt` | "AI tạo" chip (002) |
| REQ-10 | `StepPractice` port (dev links) in `info` and HV view; set state from 003 `LearnClassesService.lesson` | read-only "Bài tập luyện tập" + "Mở bộ bài tập"; S03 "Luyện tập: …" buttons |
| REQ-11 | deck = block `{name, cards[]}` saved with the step | `DeckDialog` (T08, "Xong"), deck summary on the block |
| REQ-12 | `GET steps/template.xlsx`, `POST steps/import?target=deck|vocab` (≤ 5 MB raw body, reuses 001's `xlsx.ts`) | `ExcelImport` preview + "Thêm {N} từ hợp lệ" (dedupe against the working copy) |
| REQ-13 | `GET learn/classes/:classId/steps/:stepId[?continue=1]` via 003 `ClassAccess` (A05 / "Lớp chưa bắt đầu…" / "Bước học này hiện không còn khả dụng." + back); HV refused on `/api/files/:id` for registered lesson media | redirects S11 / S02 / S01 |
| REQ-14 | view DTO: Bài, step, x/y, prev/next among visible steps, signed file URLs (`.../files/:fileId?exp&sig`, HMAC, 60 min, re-checks access) | `StepViewPage` (S03), `MediaPlayer` (speeds, no download, one at a time), `ImageLightbox` (4×), `DocumentViewer` (PDF via pdf.js; DOCX/PPTX text pages) |
| REQ-15 | — | `VocabView`, `GrammarView`, `DialogueView` + "Pinyin"/"Bản dịch" switches (localStorage) |
| REQ-16 | `PUT learn/marks` (access re-checked, one doc per student+card), marks in the view DTO | `FlashcardsPage` (S04), retry queue while offline |
| REQ-17 | stats over current cards only | shuffle / only-unknown / summary |
| REQ-18 | block `video.youtube` = id from youtube.com/watch, youtu.be, /shorts; helmet CSP `frame-src` youtube-nocookie | paste field, nocookie iframe, `onError` → "Video không còn khả dụng. Hãy báo giáo viên." |
| REQ-19 | `ai-approve/preview` returns the lesson-section confirmation lines (counts by status, N, m decks, s sets, published / draft note); replace stays one write | (T20 is 010's — dev API) |

Screens replaced in `screen-pages.ts`: S03 → `StepViewPage`, S04 → `FlashcardsPage`; T08 path opens T07 (the deck is a dialog).
T21 (002 `PreviewPage`) renders steps with 004's `StepBlocksView` (AC-7.6). Logs (NFR-8): one structured line per upload failure,
import, publish / save of a published step, delete / archive / restore, AI replace — ids, counts, codes only.

**New dependency:** `pdfjs-dist@6.3.289` (web, Apache-2.0) — renders PDF pages inline on mobile, where browsers do not show PDFs in a
frame (AC-14.5); alternatives (iframe / Google viewer) fail on Android or leak the file. Lazy-loaded on S03/T21 only.
Changed foundation (tests updated): `packages/shared` (steps, curriculum), `apps/web/src/lib/api-client.ts` (`uploadRequest`);
config `UPLOAD_MAX_BYTES` default 500 MiB; helmet CSP `frame-src` for YouTube.

## Constitution Check

- I Spec: every behaviour maps to an AC of the approved spec; gaps (YouTube speed controls, DOCX page count) follow the plan notes above.
- II Verified: module verified by test-cases.md + QA; foundation changes keep Vitest tests (shared steps, api-client upload).
- III Traceability: one task per REQ, every AC in tasks.md and test-cases.md.
- IV Simplicity: content stays in 002's item; one registry collection for storage; no transcoding service (files ready on upload).
- V Security: Zod at every boundary, whitelist HTML sanitizer, magic-byte checks, signed expiring HV file links, `scoped()` everywhere.
- VI Observability: structured logs listed above, no PII / content / live file links.
- VII Small changes: one commit per task; no destructive migration (legacy text blocks upgraded on read).
- VIII Toolchain: only `node .sdd/scripts/sdd.mjs run …`.
