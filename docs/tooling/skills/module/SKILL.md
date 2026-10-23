---
name: module
description: Lean implementation of one SAT module from its ready spec - read specs/NNN-*/spec.md, implement it following the project's fullstack patterns (NestJS + React/Zustand + TypeScript skills and docs/steering conventions), generate test-cases.md, run the tests, and keep state.json + the dashboard in sync. Single session, no sub-agents. Use when the user types /module <NNN>.
argument-hint: "[NNN]  (để trống để xem danh sách module)"
disable-model-invocation: true
---

# /module — lean flow: read spec → implement → test cases → run tests

Module `$ARGUMENTS` (e.g. `003`). The spec is written and clarified by another agent; your job is to build it.
Work **in this session only** — do not spawn sub-agents. Save tokens: read only what the current step needs.

## No module id given (`/module` alone, or an id that matches no folder)

Run `node scripts/list-modules.mjs` and show its table to the user as-is (ID, module, wave, status, tasks, next step),
then ask which module to work on — suggest the "Sẵn sàng implement" ones first. Do nothing else until the user picks one.
Use `node scripts/list-modules.mjs --all` if the user asks for deferred modules too.

## 0. Sync and check (always first)

1. `node scripts/sync-state.mjs <NNN>` → read `specs/<NNN>-*/state.json` (status, tasks, last hand-off, tests, deps).
2. Stop with a one-line reason when:
   - `mvp` is false (006, 007 are deferred);
   - status is `draft` with open questions → "spec chưa sẵn sàng: <n> câu hỏi mở";
   - status is `draft` without open questions → run `node .sdd/scripts/sdd.mjs set-status <NNN> clarified`, then stop and ask the human to approve;
   - status is `clarified` → "chờ duyệt: node .sdd/scripts/sdd.mjs approve <NNN> --by \"Tên\"" (agents cannot approve).
3. If `depsReady` is false, say which modules are missing and continue only with what does not need them.
4. If there is a Handoff with "In progress", resume there: re-run its "Verify with" command first.

## 1. Read (once per session, nothing more)

- `specs/<NNN>-*/spec.md` — the contract. Do **not** read spec.html or other modules' specs.
- `docs/steering/tech.md` and `structure.md` are already in context (CLAUDE.md) — they are the fullstack conventions.
- Existing code you must integrate with: find it with Grep/Glob (module names, routes, store names); read only the files you will touch.
- The UI reference for this module's screens (`screens` in state.json): open `specs/screen-flow-design.html#<ID>` only when building that screen.
- Load the pattern skills **only for the layers this module touches**, once each:
  backend → `nestjs-expert` (+ `api-designer` for new endpoints); frontend → `react-expert`; shared types → `typescript-pro`;
  tests → `test-master` (unit/integration) and `playwright-expert` (e2e). Project conventions win over generic skill advice.

## 2. Lean plan + tasks (only if `tasks.md` does not exist yet; status must be `approved`)

Write both files yourself, short:
- `plan.md` (≤ 60 lines): per REQ the backend module/files, endpoints, schema changes, frontend feature folder/store/components;
  new dependencies with a reason; a `## Constitution Check` line per principle (one line each).
- `tasks.md`: **one task per REQ** (not per AC), in dependency order, each listing all its ACs and files:
  `- [ ] T010 REQ-3 <what> (AC-3.1, AC-3.2, AC-3.3) — files: \`apps/api/src/modules/x/…\`, \`apps/web/src/features/x/…\``
  plus `[infra]` tasks when needed. Every AC of spec.md must appear in some task.
- `analysis.md`: run `node .sdd/scripts/sdd.mjs check <NNN>` and record its summary under `Mode: lean — automated coverage check only`,
  then `**Verdict:** PASS` only if it reports 0 errors (otherwise fix tasks.md first).
- `sdd set-status <NNN> planned` → `sdd set-status <NNN> tasked`; commit `docs(<NNN>): lean plan and tasks`; `node scripts/sync-state.mjs <NNN>`.

## 3. Implement, task by task (TDD inside each task)

For the next task (`sdd next-task <NNN>`; `sdd task T### doing`):
1. Write the tests for its ACs first — title cites `<NNN>:AC-x.y` (e.g. `it('[003:AC-8.2] …')`). Run them scoped:
   `node .sdd/scripts/sdd.mjs run test -- <module path>` and see them fail for the right reason.
2. Implement following the conventions (routes → service → model; Zod validation at the boundary; AppError contract; DTO mapping;
   Zustand store per feature with selectors; api-client only; accessible components). Match the prototype screen.
3. Re-run the scoped tests until green; run `node .sdd/scripts/sdd.mjs run typecheck` when types changed.
4. `sdd task T### done --note "<1 line>"`, commit `feat(<NNN>): T### <summary>`, `node scripts/sync-state.mjs <NNN>`.
- Same test still failing after 3 honest attempts → `sdd task T### blocked --note "<diagnosis>"`, Handoff, stop.
- Spec contradiction found → `sdd set-status <NNN> draft --reason "<what>"`, Handoff, stop. Never change requirements yourself.
- First task done moves status to implementing: `sdd set-status <NNN> implementing` (once).

## 4. Generate test cases (when all tasks are done)

Create `specs/<NNN>-*/test-cases.md` from `specs/assets/test-cases-template.md`:
- ≥ 1 row per AC (and per testable NFR). For automated rows, use `node .sdd/scripts/sdd.mjs trace <NNN>` to name the real test
  (`file › [NNN:AC-x.y] title`). Add manual rows for UI look & feel / e-mail content with the prototype screen link.
- An AC without an automated test is a gap: add the missing test now (then re-run), or mark the row "Chưa chạy" with the reason.

## 5. Run the tests and close

1. Full run once: `node .sdd/scripts/sdd.mjs run lint`, `run typecheck`, `run test`; `run test:e2e` if the module has UI flows.
2. Write each test case's status (Pass / Fail / Thủ công) from the **actual** output; set `last_run`; paste the runner summary lines
   under "Ghi chú lần chạy". Fix failures (max 3 rounds), re-run, update.
3. `verification.md` (short): the summary lines, `sdd trace <NNN>` result, failures and fixes, and `**Verdict:** PASS` only when
   everything is green and trace has no gaps — then `sdd set-status <NNN> verified`. Otherwise leave it implementing and say why.
4. Always end with: a `## Handoff` block in `progress.md` (format: docs/steering/roadmap.md §5), commit, `node scripts/sync-state.mjs <NNN>`,
   and a ≤ 6-line report (done, tests x/y pass, status, next: `/module <NNN>` or `/sdd-ship <NNN>`).
