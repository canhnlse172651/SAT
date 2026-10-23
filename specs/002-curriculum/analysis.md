# Analysis — 002-curriculum

**Verdict:** PASS
Date: 2026-10-23

Mode: lean — automated coverage check only

- `node .sdd/scripts/sdd.mjs check 002` → `✔ 002-curriculum [approved] — 0 error(s), 0 warning(s)` (every REQ referenced in
  plan.md, every AC of spec.md covered by a task in tasks.md, Constitution Check present).
- test-cases.md: 78 TC (76 E2E/API, 2 Thủ công), every AC covered — 117/117 ACs appear in at least one E2E or API test case,
  every NFR (1–8) has a test case (checked by script over the TC table, 2026-10-23).

## Notes for the QA agent

- 003 (classes), 005 (learning data) and 010 (AI generation, T20) do not exist yet. 002 reads them through ports bound to a
  dev/test stand-in: `POST /api/dev/curriculum/classes`, `/learning-data`, `/ai-label`, `/ai-approve[/preview]`, `/faults`
  (see "Dữ liệu và tài khoản dùng chung"). HV-side checks (REQ-10) use `GET /api/learn/*` because S02/S11 belong to 003.
- Item content editing belongs to 004/005; until then T07 shows an interim editor (name + text blocks for a step, multiple-choice
  questions for a set) with the readiness reasons listed in test-cases.md.
