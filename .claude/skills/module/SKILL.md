---
name: module
description: Lean implementation of one SAT module from its ready spec - read specs/NNN-*/spec.md, write test-cases.md (user-level test cases, no test code), implement following the project's fullstack patterns (NestJS + React/Zustand + TypeScript), keep the build and the foundation tests green, and hand over to /test-module for verification by a QA agent with Playwright MCP. Also fixes the failures a QA run reported. Single session, no sub-agents. Use when the user types /module <NNN>.
argument-hint: "[NNN]  (để trống để xem danh sách module)"
disable-model-invocation: true
---

# /module — spec → test cases → implement → hand over to QA

Module `$ARGUMENTS` (e.g. `003`). The spec is written and clarified by another agent; your job is to build it.
Work **in this session only** — do not spawn sub-agents. Save tokens: read only what the current step needs.

**Testing model (constitution II, v2):** feature modules get **no test code** from you. You write `test-cases.md`
(what a real user does and sees, per AC); a separate QA agent runs them with Playwright MCP (`/test-module <NNN>`) and saves
the replayable scripts + results in the module folder. Only foundation code keeps automated tests: if you must change
`packages/shared`, `apps/api/src/common/**`, `apps/web/src/{app,layouts,lib,components,styles}/**` or `tests/e2e/**`,
change/add its tests like any foundation work.

## No module id given (`/module` alone, or an id that matches no folder)

Run `node scripts/list-modules.mjs` and show its table to the user as-is (ID, module, wave, status, tasks, next step),
then ask which module to work on — suggest the "Sẵn sàng implement" ones first. Do nothing else until the user picks one.
Use `node scripts/list-modules.mjs --all` if the user asks for deferred modules too.

## 0. Sync and check (always first)

1. `node scripts/sync-state.mjs <NNN>` → read `specs/<NNN>-*/state.json` (status, tasks, last hand-off, tests, deps).
2. Stop with a one-line reason when:
   - `mvp` is false (deferred module);
   - status is `draft` with open questions → "spec chưa sẵn sàng: <n> câu hỏi mở";
   - status is `draft` without open questions → run `node .sdd/scripts/sdd.mjs set-status <NNN> clarified`, then stop and ask the human to approve;
   - status is `clarified` → "chờ duyệt: node .sdd/scripts/sdd.mjs approve <NNN> --by \"Tên\"" (agents cannot approve).
3. If `depsReady` is false, say which modules are missing and continue only with what does not need them.
4. **Fix mode:** if `test-cases.md` has rows with status `Fail` or `Bị chặn` (a QA run found bugs), go to §5 instead of §3.
5. If there is a Handoff with "In progress", resume there: re-run its "Verify with" command first.

## 1. Read (once per session, nothing more)

- `specs/<NNN>-*/spec.md` — the contract. Do **not** read spec.html or other modules' specs.
- `docs/steering/tech.md` and `structure.md` are already in context (CLAUDE.md) — fullstack conventions, incl. the foundation
  building blocks (auth decorators, `scoped()`, ports, route table, UI kit) you must reuse.
- Existing code you must integrate with: find it with Grep/Glob; read only the files you will touch.
- UI reference for this module's screens (`screens` in state.json): open `specs/screen-flow-design.html#<ID>` only when building
  that screen (never read the file whole — `node scripts/find-in-prototype.mjs "<text>"`).
- Load the pattern skills only for the layers this module touches, once each: backend → `nestjs-expert` (+ `api-designer` for new
  endpoints); frontend → `react-expert`; shared types → `typescript-pro`. Project conventions win over generic skill advice.

## 2. Lean plan, tasks and test cases (only if `tasks.md` does not exist yet; status must be `approved`)

Write these files yourself, short:
- `plan.md` (≤ 60 lines): per REQ the backend module/files, endpoints, schema changes, frontend feature folder/store/components,
  screens to replace in `apps/web/src/app/routes.tsx`; new dependencies with a reason; `## Constitution Check` (one line each).
- `tasks.md`: **one task per REQ**, in dependency order, each listing all its ACs and files:
  `- [ ] T010 REQ-3 <what> (AC-3.1, AC-3.2, AC-3.3) — files: \`apps/api/src/modules/x/…\`, \`apps/web/src/features/x/…\``
  plus `[infra]` tasks when needed. Every AC of spec.md must appear in some task.
- **`test-cases.md`** from `specs/assets/test-cases-template.md` — acceptance first, before any code:
  - ≥ 1 test case per AC and per testable NFR; **every AC needs at least one `E2E` or `API` case** (the QA agent's saved script
    for it is what `sdd trace` links to the AC); `Thủ công` rows only in addition (real e-mail inbox, real device, look & feel).
  - Written for a real user: role, preconditions (data + sign-in), numbered UI steps, expected result with the AC's exact wording,
    screen id + prototype link. Fill "Dữ liệu và tài khoản dùng chung". Status `Chưa chạy`, Script empty.
- `analysis.md`: run `node .sdd/scripts/sdd.mjs check <NNN>` and record its summary under `Mode: lean — automated coverage check only`,
  plus "test-cases.md: <n> TC, every AC covered" (verify by grep), then `**Verdict:** PASS` only if both hold.
- `sdd set-status <NNN> planned` → `sdd set-status <NNN> tasked`; commit `docs(<NNN>): lean plan, tasks and test cases`;
  `node scripts/sync-state.mjs <NNN>`.

## 3. Implement, task by task (no test code)

For the next task (`sdd next-task <NNN>`; `sdd task T### doing`):
1. Re-read the task's ACs and their test cases — they define "done".
2. Implement following the conventions (controller → service → model; Zod at the boundary; `AppError`; `scoped()` for every
   workspace query; `@Roles`; DTO mapping; Zustand store per feature with selectors; `apiRequest` only; UI kit components and
   tokens; accessible names that match the test cases' wording). Replace the screen's placeholder in `routes.tsx`. Match the
   prototype screen.
3. Keep it green: `node .sdd/scripts/sdd.mjs run lint`, `run typecheck`, `run test` (foundation tests), `run build`.
   Optionally walk the happy path yourself in `npm run dev` — do not create test files for it.
4. `sdd task T### done --note "<1 line>"`, commit `feat(<NNN>): T### <summary>`, `node scripts/sync-state.mjs <NNN>`.
- Build/foundation tests still failing after 3 honest attempts → `sdd task T### blocked --note "<diagnosis>"`, Handoff, stop.
- Spec contradiction found → `sdd set-status <NNN> draft --reason "<what>"`, Handoff, stop. Never change requirements yourself.
- First task done moves status to implementing: `sdd set-status <NNN> implementing` (once).

## 4. Hand over to QA (when all tasks are done)

1. Update `test-cases.md` to what was built (exact labels, data setup the QA agent can do through the UI or API) — never weaken
   an expected result below the AC.
2. Full check once: `node .sdd/scripts/sdd.mjs run lint`, `run typecheck`, `run test`, `run build`, `run test:e2e` (foundation e2e).
3. Status stays `implementing` — **only `/test-module` may move it to `verified`**.
4. End with: a `## Handoff` block in `progress.md` (format: docs/steering/roadmap.md §5) whose Next is
   "`/test-module <NNN>` trong phiên mới (agent QA, Playwright MCP)", commit, `node scripts/sync-state.mjs <NNN>`,
   and a ≤ 6-line report.

## 5. Fix mode (after a QA run reported failures)

1. Read the newest `specs/<NNN>-*/testing/runs/<newest>/report.md` and the failing rows of `test-cases.md`.
2. For each failure: reproduce (`node .sdd/scripts/sdd.mjs run test:modules -- <NNN> TC-###` replays the saved script, or walk it
   in `npm run dev`), fix the **application code**. Never edit the saved scripts under `testing/e2e/` or the expected results in
   `test-cases.md` — if you believe a test case contradicts the spec, say so in the Handoff for the QA agent / spec agent.
3. Replay the fixed TCs until they pass, keep lint/typecheck/test/build green, commit `fix(<NNN>): TC-### <summary>`.
4. Handoff Next: "`/test-module <NNN>` — chạy lại TC-…" ; `node scripts/sync-state.mjs <NNN>`.
