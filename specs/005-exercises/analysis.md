# Analysis — 005-exercises

**Verdict:** PASS
Date: 2026-10-27

Mode: lean — automated coverage check only

- `node .sdd/scripts/sdd.mjs check 005` → `✔ 005-exercises [approved] — 0 error(s), 0 warning(s)` (every REQ referenced
  in plan.md, every AC of spec.md covered by a task in tasks.md, Constitution Check present).
- test-cases.md: 129 TC (94 E2E, 31 API, 4 Thủ công), every AC covered — 168/168 ACs appear in at least one E2E or API test
  case, every NFR (1–14) has a test case (checked by script over the TC table, 2026-10-27).

## Notes for the QA agent

- 006 (exams, T16) does not exist yet: TC-102 (AC-20.7, T14 for an exam submission) can only run once 006 ships — mark it
  "Bị chặn" until then. 008 / 009 (T15) do not exist either: their data is checked through 005's GV endpoints and S11 (003).
- 010 (T20) does not exist: AI approval uses 002's `/api/dev/curriculum/ai-approve(/preview)` with `section: "exercise"`.
- Spec gap decided in the plan (flag to the spec owner, not blocking): re-grading runs inside the save request, so
  "Đang chấm lại <x>/<N> bài nộp…" (AC-19.6) is shown while that request runs.
