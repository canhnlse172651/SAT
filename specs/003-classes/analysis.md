# Analysis — 003-classes

**Verdict:** PASS
Date: 2026-10-23

Mode: lean — automated coverage check only

- `node .sdd/scripts/sdd.mjs check 003` → `✔ 003-classes [approved] — 0 error(s), 0 warning(s)` (every REQ referenced in
  plan.md, every AC of spec.md covered by a task in tasks.md, Constitution Check present).
- test-cases.md: 92 TC (70 E2E, 18 API, 4 Thủ công), every AC covered — 154/154 ACs appear in at least one E2E or API test case,
  every NFR (1–10) has a test case (checked by script over the TC table, 2026-10-23).

## Notes for the QA agent

- 005 (attempts, submissions, S05/S06), 006 (exams, S07), 009 (progress), 011 (avatars, S12) and 004 (S03/S04) do not exist yet.
  003 reads 005/006 through ports bound to a dev/test stand-in (`/api/dev/classes/*`, see "Dữ liệu và tài khoản dùng chung");
  progress uses 009's published definition; avatars are the default (initials). S03/S05/S06/S07/S12 are placeholders — checks
  that would happen there use the 003 API (`GET /api/my-classes/<lớp>/items/<mục>` and the dev attempt/submission calls).
- Spec §8 says an HV with sets due in two classes gets "một email liệt kê bộ của cả hai lớp"; AC-24.1 / AC-24.5 (one e-mail per
  class per day) win — test cases follow the ACs.
