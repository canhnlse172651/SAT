# Progress — 002 Curriculum & Lessons

## Handoff 2026-10-23 17:40 — /module 002 (implementer)
- Status: 002-curriculum implementing, 21/21 tasks done   Branch: feat/002-curriculum (based on feat/001-accounts-auth)
- Done this session: plan.md, tasks.md, test-cases.md (78 TC, every AC covered), analysis.md (PASS); T001 shared contracts;
  T002 API module (curricula + lessons with embedded items, ports for 003/005/010 with dev stand-ins); T010–T036 screens T05, T06,
  T18, T07/T09, T21.
- Checks run this session (portable Node 24.22.1 — this machine's default `node` is 20 and the web tests need ≥ 22):
  lint ✔, typecheck ✔, `run test` 58 files / 296 passed, build ✔, `run test:e2e` 10 passed. An API smoke script and a UI walk
  (Playwright, throwaway, not committed) covered create/validate/search, Bài add/rename/order (buttons, keyboard, drag),
  item add/move/publish/save, leave guard, publish dialog, T21 Mobile, duplicates, AI replacement, isolation — all passing.
- In progress: none.
- Next: `/test-module 002` trong phiên mới (agent QA, Playwright MCP).
- Notes for QA / later modules:
  - 003, 005, 010 do not exist yet; 002 reads them through `CURRICULUM_CLASSES`, `LEARNING_DATA`, `AI_DRAFTS`
    (`apps/api/src/modules/curriculum/curriculum.ports.ts`). In dev/test, `/api/dev/curriculum/*` fakes them (classes with HV
    members, learning data, AI label, AI approval, duplicate faults) — see test-cases.md "Dữ liệu và tài khoản dùng chung".
    Each module re-binds its token when it ships; 010 calls `AiReplaceService.preview/replace`.
  - HV-side ACs (REQ-10) are checked via `GET /api/learn/*` because S02/S11 belong to 003.
  - T07 tabs hold an interim editor (text blocks / multiple-choice) and interim readiness rules in `@sat/shared`
    (`itemNotReadyReason`); 004/005 replace them with their editors and publish conditions.
  - No replica set → no transactions: atomic rules rely on single-document writes (items embedded in `lessons`, Bài order in
    `curricula.lessonIds`); a curriculum copy is written hidden (`copyState: copying`) and swept if abandoned.
  - Toasts now auto-dismiss (2.8 s, warnings/errors 5 s, max 2 on screen, as in the prototype) — a foundation-level change in
    `features/toast/toast-store.ts` that also affects 001's toasts.
  - `POST /api/dev/session {"role":"GV"}` always signs in the seed GV; an empty or second workspace needs a GV registered at A02.
- Blockers / questions: none. Recommend installing Node 24 on this machine (`.nvmrc`).
- Verify with: `node .sdd/scripts/sdd.mjs run test` and `node .sdd/scripts/sdd.mjs run test:e2e`
