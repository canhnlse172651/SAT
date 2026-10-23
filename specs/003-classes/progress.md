# Progress — 003 Class Management

## Handoff 2026-10-23 19:40 — /module 003 (implementer)
- Status: 003-classes implementing · 28/28 tasks   Branch: feat/003-classes @ b9c8b3b (branched from feat/002-curriculum: 003 builds on 002's code, 001/002 not merged/verified yet)
- Done this session: lean plan, tasks, test-cases (92 TC, every AC covered), analysis PASS; T001 T002 (290744c), T010–T052 (b9c8b3b).
  Backend `apps/api/src/modules/classes/` (GV `/api/classes/*`, HV `/api/my-classes/*`, dev `/api/dev/classes/*`, 08:00 reminder sweep +
  catch-up); 002 exports `CurriculumReader`, 001 exports `StudentDirectory`; 003 binds `CURRICULUM_CLASSES` (002) and `STUDENT_LINKS` (001).
  Web `apps/web/src/features/classes/` replaces T02, T03, T04, S01, S02, S11. Foundation: `Calendar` in the UI kit (+ test),
  `@sat/shared/classes.ts` (+ test), optional `note` line in 001's mail content, `NotFoundPage` back target; `routes.test.tsx` now uses
  T10 / the HV tab bar instead of the former T02 / S01 placeholders.
  Checks this session: lint ✔, typecheck ✔, `run test` 60 files / 308 passed, build ✔, `run test:e2e` 10 passed. API smoke walk (38 checks)
  and a Playwright UI walk of T02 → T03 (all 4 steps, create) → T04 tabs → S01 → S02 → members → S11 on the hermetic server: no console errors.
- In progress: —
- Next: `/test-module 003` trong phiên mới (agent QA, Playwright MCP).
- Blockers / questions:
  - Environment: this machine's Node is v20; the repo pins 24 (`.nvmrc`) and the web (jsdom) tests do not start on 20. This session used a
    portable Node 24 on PATH. Install Node 24 for QA.
  - For the QA / spec agent: spec §8 says an HV with sets due in two classes gets "một email liệt kê bộ của cả hai lớp"; AC-24.1 / AC-24.5
    (one e-mail per class per day) were implemented and the test cases follow the ACs.
  - 004/005/006/008/009/011 do not exist: S03–S07, S09, S10, S12 and the T04 tabs Tiến độ / Xếp hạng are placeholders; their 003 parts are
    checked through the API and dev stand-ins described in test-cases.md ("Dữ liệu và tài khoản dùng chung").
- Verify with: node .sdd/scripts/sdd.mjs run test && node .sdd/scripts/sdd.mjs run test:e2e
