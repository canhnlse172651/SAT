---
feature: 006
mode: lean
created: 2026-10-29
---

# Plan — 006 Exams (lean)

**Where it lives.** A standalone module: shared contracts `packages/shared/src/exams.ts` (+ `exams.test.ts`, foundation), API
`apps/api/src/modules/exams/` (`@Global`), web `apps/web/src/features/exams/`. Questions reuse 005 as-is: content is an
`ExerciseSetContent` (`{ instructions, stepId: null, questions }` — "Hướng dẫn" = `content.instructions`), editor `SetBody`, field and
completeness rules (`setProblems` / `setIssues`), `learnQuestion` + `makeShuffles`, `gradeSet`, `scorePercent`, `reviewRows`, question
images = 004 files of kind `questionImage` checked through `StepFilesService` (like 005 `SetHooksService.prepare`).

**Data.** `exams` (workspace): `name`, `searchKey` (`foldSearch`), `content`, `classIds[]`, `opensAt`, `durationMin`, `closesAt` (nullable
in Nháp), `phase` draft|scheduled|archived|deleted (Đã lên lịch / Đang mở / Đã đóng are derived from the clock, AC-3.6 —
`examStateAt()` in shared), `locked` (set atomically by the first start, AC-4.2/4.3/6.2), `settledAt` (close processed), `version`.
`exam_attempts`: `examId`, `studentId` (unique pair = one attempt, AC-8.5/NFR-3), `startedAt`, `endsAt` = min(start + duration, close)
(recomputed on a later close, AC-5.2), `holder` (device token, AC-10.4), `shuffles`, `answers`, `lastIndex`, `status` doing|submitted,
`submittedAt`, `auto`, `submitKey`, `score`/`maxScore`/`percent`/`results`. `exam_noshows`: `examId`, `classId`, `studentId` (AC-13.3).

**Time (REQ-3, REQ-9, REQ-12).** Answers are accepted until `endsAt + 10 s` (AC-12.2). `ExamSettleService.settle(ws, exam?)` auto-submits
every attempt past `endsAt + 10 s` (`submittedAt = endsAt`, `auto`) and, once `closesAt + 10 s` passed, records "Không làm bài" for each
activated member (locked included) of each assigned class at `closesAt` without a submission (member row not removed before close,
`joinedAt` ≤ close day and created before close) and sets `settledAt`. It runs (a) at the start of every exam read/write path (lazy,
so results are exact for any reader even with the dev `NoopScheduler`), and (b) as `JobScheduler` job `exams.settle` scheduled at
each attempt's `endsAt + 10 s` and the exam's `closesAt + 10 s` (production scheduler adapter = pending ADR). The client sends
pending answers when its timer hits 0, then `submit` — a submit at/after `endsAt` is recorded as "Nộp tự động" at `endsAt`. Device clock
is never used: every HV/GV payload carries `serverNow`; the web keeps an offset (`server-clock.ts`, NFR-1).

**Endpoints.** GV (`@Roles('GV')`, `/api/exams`): `GET /` (T10 list; filters client-side), `POST /` (create on first save, AC-2.1),
`GET /:id`, `PUT /:id` {expectedVersion, name, content, classIds, opensAt, durationMin, closesAt} (save draft / "Lưu thay đổi"; lock and
close rules REQ-4/5; later close → `endsAt` of running attempts), `POST /:id/schedule`, `/:id/unschedule`, `/:id/archive`, `/:id/restore`,
`/:id/duplicate`, `DELETE /:id`, `GET /classes` (assignable classes AC-3.1), `GET /:id/results?classId=` (T16), `GET /:id/submissions/:studentId?classId=`
(T14), `GET /results?classId=` (AC-13.5 rows for 008/009 — also `ExamResultsReader`, exported provider). Errors: 409 `CONFLICT`
(AC-2.7), 409 `EXAM_LOCKED` (AC-4.3), 422 `EXAM_NOT_READY` with `details.issues[]` (AC-3.5/4.1), 422 `INVALID_CONTENT`, 409 `EXAM_HAS_ATTEMPTS`
(AC-6.2, AC-5.4). HV (`@Roles('HV')`, `/api/learn/exams`): `GET /` (S07), `GET /:id` (lobby / attempt state / result: one view keyed by
`mode`), `POST /:id/start` {holder}, `POST /:id/open` {holder} (resume → takes the device, AC-10.3/10.4), `PUT /:id/attempt` {holder, answers,
lastIndex}, `POST /:id/submit` {holder, submitKey, answers}, `GET /:id/clock` (poll 5 s: serverNow, endsAt, status, holder — AC-5.2, AC-10.4,
AC-12.3). Answer keys/explanations only in `result.rows` after close + settle (AC-14.3, AC-16.3/16.4).

**003 integration.** 006 binds `CLASS_EXAMS` (`exam-links.ts`; merged with 003's `DevClassExams` when `devHelpers`): submissions per class
(AC-11.3 of 003), `visibleCount`, `studentHasSubmissions`, `removeClass` (pull the class from exams), new `purgeStudent` (attempts in
progress of a deleted HV). `ClassesModule` stops providing it. Members / classes read through the models 003 exports, names and
statuses through 001's `StudentDirectory`.

**Web.** `features/exams/`: `exams-store.ts` (T10 + T22 working copy + T16), `learn-exams-store.ts` (S07, S08: autosave ≤ 1 s debounce,
offline queue, holder token per page load, 5 s clock poll), `ExamsPage` (T10), `ExamEditorPage` (T22: `SetBody` with `steps` omitted,
class picker, schedule fields `dd/MM/yyyy HH:mm`, side card, `useBlocker` + `beforeunload`), `ExamResultsPage` (T16, 15 s poll),
`MyExamsPage` (S07 list + lobby), `ExamTakePage` (S08: `QuestionView`, board, timer, banners, result with `ReviewRowView`). T14:
`SubmissionPage` gets an exam variant (`?thi=<exam>&lop=&hv=`). `screen-pages.ts`: T10, T22, T16, S07, S08. 005 web generalisation:
`SetBody` `steps` optional + `limitMessage`, `SetEditingContext.patchImage` (default = T09 behaviour).

| REQ | Backend | Frontend |
|-----|---------|----------|
| REQ-1, REQ-2, REQ-3, REQ-4, REQ-5, REQ-6 | `exams.service.ts`, `exams.controller.ts`, `exams.model.ts` | `ExamsPage`, `ExamEditorPage`, `exams-store.ts` |
| REQ-7, REQ-8, REQ-9, REQ-10, REQ-11 | `learn-exams.service.ts`, `learn-exams.controller.ts` | `MyExamsPage`, `ExamTakePage`, `learn-exams-store.ts` |
| REQ-12, REQ-13 | `exam-settle.service.ts`, `exam-results.service.ts`, `exam-links.ts` | — (T16/S08 show the results) |
| REQ-14, REQ-15, REQ-16 | `learn-exams.service.ts`, `exam-results.service.ts`, `@Roles` + `scoped()` + `notFound()` | `ExamTakePage`, `ExamResultsPage`, `SubmissionPage` |

**Decisions (spec gaps, recorded in decisions.md).** AC-4.3: a refused save is refused as a whole (name/instructions included), the
editor keeps the GV's text. AC-2.3: name message "Tên bài thi bắt buộc, tối đa 150 ký tự". Deleting an exam = `phase: deleted` (soft).
No new dependency.

## Constitution Check

- I Spec — every behaviour maps to an AC of the approved spec; gaps above go to decisions.md, not silently into code.
- II Verified — shared helpers (`exams.ts`) test-first in `exams.test.ts`; module behaviour via test-cases.md + `/test-module 006`.
- III Traceability — tasks cite every AC; TC-### cite `006:AC-n.m`.
- IV Simplicity — reuses 005 content/grading/editor/views; no scheduler infrastructure beyond the existing port; no dependency.
- V Security — Zod on every input, `scoped()` everywhere, A05 for foreign/missing/wrong role, keys never sent before close (AC-16.4).
- VI Observability — `logExam()` structured events for every NFR-10 action, ids only (no content, answers, names, e-mails).
- VII Small changes — one commit per task; no migration of existing collections (new collections only).
- VIII Toolchain — checks via `node .sdd/scripts/sdd.mjs run …`.
