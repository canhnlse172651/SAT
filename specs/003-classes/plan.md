---
feature: 003
mode: lean
created: 2026-10-23
---

# Plan — 003 Class Management (lean)

**Backend** `apps/api/src/modules/classes/` (one Nest module, `@Global` so 001/002 can resolve its port bindings). Collections:
`classes` (name, `nameKey` = `foldSearch(name)` unique per workspace, description ≤ 500, schedule ≤ 200, `startDate` = VN day
`YYYY-MM-DD`, `endedAt`/`endDate`, `curriculumId`, `memberCount` (atomic cap 100), **embedded `hidden[]`** `{ lessonId, section, by, at }`
and **embedded `deadlines[]`** `{ setId, date, by, at, reminded? }`, `createKey` unique per workspace for one-class-per-wizard (AC-5.6),
`version`), `class_members` (classId, studentId, `joinedAt`, `removedAt` — kept on removal, unique per class+student),
`deadline_reminders` (unique workspace+student+class+date: one e-mail per class per day) and `reminder_runs` (one per VN date,
`running|finished`). Status is **derived** (`endedAt` → ended; VN today < startDate → upcoming; else active), so 00:00 needs no job.
Adds to the cap use a guarded `$inc` reservation before inserting memberships (no transactions); hide/show and deadlines are single
updates of the class document. Reads of other modules: 002 through a new exported `CurriculumReader` (curriculum options, ordered
lessons with items); 001 through a new exported `StudentDirectory` (search by name A→Z, by ids, with status/e-mail). Ports in
`classes.ports.ts` for modules not built yet — `CLASS_LEARNING` (005: attempts, submissions + score, late), `CLASS_EXAMS` (006: exam
submissions, visible exam count, remove class) — bound to `DevClassLinks` (reads `dev_class_links`; empty in prod). 003 binds
`CURRICULUM_CLASSES` (002 — merged with 002's dev rows outside production) and `STUDENT_LINKS` (001). Progress (009 not built) is
computed by `class-visibility.ts` with 009's definition (done / visible sets with an effective deadline). `classes-dev.controller.ts`
(`/api/dev/classes/*`, dev/test) lets QA save/submit an attempt through 003's gate (the call 005 will make), add exam rows and run the
08:00 reminder sweep or the catch-up. Reminder job: `JOB_SCHEDULER.every('class-deadline-reminders', '08:00')` + catch-up on start
(< 20:00). Logs (NFR-8): one structured line per mutation and per sweep, ids and counts only.
**Frontend** `apps/web/src/features/classes/`: `classes-store.ts` (T02), `class-wizard-store.ts` (T03, memory only), `class-store.ts`
(T04), `my-classes-store.ts` (S01/S02/S11); `StudentPicker` and `CurriculumPicker` shared by T03 and the T04 dialogs; T12
(`AddStudentsDialog`) gets an `onAdded` callback. Contracts: `@sat/shared/classes.ts`. UI kit: `Calendar` (grid of `DatePicker`) for
the deadline popup.

| REQ | Backend (service / endpoint under `/api`) | Frontend (screen → component) |
|-----|------------------------------------------|-------------------------------|
| REQ-1 | — (client wizard) | T03 `CreateClassPage` stepper, leave guard, `beforeunload` |
| REQ-2 | `GET classes/name-available` | T03 step 1 `ClassInfoFields` (shared with edit) |
| REQ-3 | `GET classes/student-options?q&page&classId` (StudentDirectory, A→Z, 20) | T03 step 2 `StudentPicker` + T12 `onAdded` |
| REQ-4 | `GET classes/curriculum-options?hsk&q` (CurriculumReader + usage) | T03 step 3 `CurriculumPicker` |
| REQ-5 | `create` (`createKey`, re-checks name/students/curriculum → 409 details): `POST classes` | T03 step 4 summary, warnings, create |
| REQ-6 | `list` (status filter derived in the query, folded `q`, page 20, counts): `GET classes` | T02 `ClassesPage` |
| REQ-7 | `detail`, `update` (`expectedVersion`, start-date rules): `GET/PATCH classes/:id` | T04 `ClassPage` header + tabs, `OverviewTab`, `EditClassDialog` |
| REQ-8 | `students`, `addStudents` (reservation), `removeStudent`, `tracked` (activated): `GET/POST classes/:id/students`, `DELETE classes/:id/students/:sid`, `GET classes/:id/tracked-students` | T04 `StudentsTab`, `AddStudentsToClassDialog` |
| REQ-9 | `changeCurriculum` (no exercise submission, resets hidden + deadlines): `PUT classes/:id/curriculum` | `ChangeCurriculumDialog` |
| REQ-10 | `end`, `reopen`; ended → 409 `CLASS_ENDED` on locked actions: `POST classes/:id/end|reopen` | header actions, confirms, hints |
| REQ-11 | `remove` (no submission of 005/006 → delete class + members + remove from exams): `DELETE classes/:id` | delete confirm / disabled hint |
| REQ-12 | `myClasses`: `GET my-classes` | S01 `MyClassesPage` |
| REQ-13 | `myClass` (visible Bài, labels, progress, exam count): `GET my-classes/:id` | S02 `ClassHomePage` |
| REQ-14 | derived status; HV guard: non-member → 404 `CLASS_NOT_MEMBER`, upcoming → 409 `CLASS_NOT_STARTED`; GV `scoped()` + uniform 404 | redirects to S01 / A05 |
| REQ-15 | `content` (all Bài incl. drafts, published counts, hidden, sets + deadlines): `GET classes/:id/content` | T04 `ContentTab` |
| REQ-16 | `visibilityPreview` (K, in-progress count), `setVisibility` (single → 409 `ALREADY_IN_STATE`): `POST classes/:id/visibility/preview`, `PUT classes/:id/visibility` | single / column / row confirms |
| REQ-17 | `class-visibility.ts` rules used by every HV read | — |
| REQ-18 | `ClassAccess.assertCanView/assertCanWork` (exported for 004/005): `GET my-classes/:id/items/:itemId` | S03/S05 belong to 004/005 |
| REQ-19 | `myLesson` (steps, sets + status, deadline label): `GET my-classes/:id/lessons/:lessonId` | S11 `LessonUnitPage` |
| REQ-20 | `members` (activated only, avatar = initials until 011): `GET my-classes/:id/members` | S02 `MembersSheet` → S12 / S10 |
| REQ-21 | `setDeadlines` (`setIds` or `lessonId`, `date` or null): `PUT classes/:id/deadlines` | `DeadlinePopover` (Calendar, warnings) |
| REQ-22 | same endpoint, bulk per Bài; effectiveness in `class-visibility.ts` | bulk cell, hidden-section note |
| REQ-23 | deadline label + status in S11 DTO | S11 chips |
| REQ-24 | `ReminderService.sweep(date)` (eligibility, one per student+class+day, run once, catch-up < 20:00) | — |
| REQ-25 | `reminder-mail.ts` (subject, ≤ 20 items, button S05/S02), `renderMail` of 001 | — |
| REQ-26 | failures logged, no retry, no 001 throttle; `deadlines[].reminded` for 009 | — |

Schema changes: new `classes`, `class_members`, `deadline_reminders`, `reminder_runs`, `dev_class_links`. `@sat/shared/classes.ts`.
002: export `CurriculumReader`; `CURRICULUM_CLASSES` binding moves to 003. 001: export `StudentDirectory`; `STUDENT_LINKS` bound by 003;
T12 `onAdded`. Route table: T02, T03, T04, S01, S02, S11 replace their placeholders in `app/screen-pages.ts`. New dependencies: none.

## Constitution Check

- I Spec is truth — every endpoint/screen traces to a REQ; 005/006/009/011 parts are ports, stand-ins or their published definitions.
- II Verified — module: test-cases.md + QA; foundation edits (`Calendar` in the UI kit, shared contracts) come with Vitest tests.
- III Traceability — tasks.md one task per REQ; test-cases cite every AC.
- IV Simplicity — derived status, embedded hidden/deadline arrays, guarded counters instead of transactions; no new dependency.
- V Security — `@Roles`, `scoped()` on every workspace query (reminder sweep reads across workspaces: system job, justified), Zod at the boundary, members DTO = name + id only, dev endpoints dev/test only.
- VI Observability — structured log per mutation and per reminder sweep (counts, failures with reason; no e-mail/name).
- VII Small changes — one commit per task group; new collections only.
- VIII Toolchain — checks via `node .sdd/scripts/sdd.mjs run …`.
