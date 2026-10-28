# Analysis — 006-exams

**Verdict:** PASS
Date: 2026-10-29

Mode: lean — automated coverage check only

- `node .sdd/scripts/sdd.mjs check 006` → `✔ 006-exams [approved] — 0 error(s), 0 warning(s)` (every REQ referenced in plan.md, every AC
  of spec.md covered by a task in tasks.md, Constitution Check present).
- test-cases.md: 115 TC (92 E2E, 20 API, 3 Thủ công), every AC covered — 93/93 ACs appear in at least one E2E or API test case, every NFR
  (1–10) has a test case (checked by script over the TC table, 2026-10-29).

## Notes for the QA agent

- 008 / 009 do not exist yet: the results 006 provides to them (AC-13.5, AC-13.6) are read through `GET /api/exams/results?classId=`.
- Auto-submit and "Không làm bài" are settled on every exam read and by the `exams.settle` job; the dev / e2e scheduler is a no-op, so
  after moving the server clock read T16, S07 or the results endpoint to observe them (plan § Time).
- Spec gaps decided in the plan (flag to the spec owner, not blocking): AC-4.3 refuses the whole save; the AC-2.3 name message wording.
