# Progress — 005 Exercises and Auto Grading

## Handoff 2026-10-27 15:20 — /module 005 (implementer)
- Status: 005-exercises implementing · 1/25 tasks   Branch: feat/005-exercises @ de4a4b3
- Done this session: T001 (de4a4b3) — `packages/shared/src/exercises.ts`: 9 question kinds with stable ids (`mcq`, `vocab`
  meaning|hanzi|pinyin, `cloze` with `[[blankId]]` tokens, `match` with `bId` per Cột B item, `order` with accepted orders as tile-id
  lists, `write`, `reading` with mcq / cloze subs), set content `{ instructions, stepId, questions }` (interim 002 MCQ upgraded on parse),
  field rules (`invalid` blocks every save) vs completeness (`incomplete` blocks publishing), `setIssues` ("Câu n: …"), pinyin syllable
  validator (`pinyinProblem`), `normalizeAnswer` / `matchesAccepted` / `matchesHanzi`, `gradeSet`, `answerState`, `makeShuffles`,
  `learnQuestion` (no key, no explanation), `reviewRows`, `scorePercent`. 002 `setContentSchema` / `newItemContent` /
  `itemNotReadyReason` delegate to it; 002 `learnItemDto` now sends `learnQuestion` (it used to strip only the old `answer` field).
  Interim web set editor (`ItemEditor` SetFields, `PreviewPage` SetView) moved onto the new shape, MCQ only — T010/T011/T022 replace them.
  Checks: lint ✔, typecheck ✔, build ✔, `run test` 32 files / 267 passed (57 new in `exercises.test.ts`).
- In progress: —
- Next: T002 [infra] — exercises module skeleton (`exercise_attempts` model, `SET_HOOKS` port called by 002, re-bind `LEARNING_DATA` /
  `CLASS_LEARNING` / `STEP_PRACTICE` / `STUDENT_LINKS` merged with the dev stand-ins, `questionImage` file kind, routes S05 / S06 / T14).
  Read spec REQ-14 … REQ-23 (spec.md lines 287–406) only when the task needs them; the spec is ~120k tokens, never read it whole.
- Blockers / questions:
  - Pre-existing, not caused by 005: `run test` reports "31 errors" — Vitest cannot start fork workers for the 31 `apps/web` test files
    (`Pool.schedule … Cannot read properties of undefined (reading 'bind')`), so web foundation tests do not run on this machine. Same count
    with the 005 changes stashed. Needs a look by whoever owns the toolchain (Vitest 5 pool config on Windows).
  - Decisions made in T001 (not new behaviour, flagged for QA / spec agent): a syllable starting with a/o/e directly after another needs an
    apostrophe unless a tone number separates them (standard pinyin spelling; rejects "hǎo3", "haǒ"); a blank with no accepted answer is
    incomplete ("Chỗ trống n chưa có đáp án được chấp nhận"); an empty write answer row is incomplete ("Đáp án n đang trống"); publish
    issues for pinyin name the field — "Pinyin không hợp lệ: x (Pinyin của từ)" / "(Phương án B)" (AC-5.4).
  - API output of one reply was blocked by the content filter while generating one very large file; writing files in smaller parts avoided it.
- Verify with: node .sdd/scripts/sdd.mjs run test -- packages/shared
