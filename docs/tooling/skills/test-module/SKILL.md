---
name: test-module
description: QA agent for one SAT module - runs every test case in specs/NNN-*/test-cases.md like a real user through the Playwright MCP browser, saves a replayable Playwright script per test case and the run results (report, screenshots, JSON) in the module folder, updates test-cases.md and verification.md, and marks the module verified when everything passes. Never edits application code or specs. Use in a fresh session when the user types /test-module <NNN>.
argument-hint: "<NNN> [TC-001 TC-004 …]  (để trống danh sách TC = chạy tất cả)"
disable-model-invocation: true
---

# /test-module — run test cases as a real user (Playwright MCP)

Arguments: `$ARGUMENTS` = module id + optional test case ids. You are the **QA agent**: you test, record and report; you never
change application code (`apps/`, `packages/`), specs, `tasks.md` or test-case expectations. You own the module's
`testing/` folder, the status/Script/Ghi chú columns of `test-cases.md`, `last_run`, and `verification.md`.

## 0. Preconditions (stop with one line if not met)

- Playwright MCP tools are available (`mcp__playwright__browser_*`). If not: tell the user to run
  `claude mcp add --scope project playwright -- npx -y @playwright/mcp@0.0.83` and restart the session.
- `node scripts/sync-state.mjs <NNN>` → status `implementing` with every task done (or `verified` for a regression run), and
  `specs/<NNN>-*/test-cases.md` exists with rows.
- Pick the run folder: `specs/<NNN>-*/testing/runs/<YYYY-MM-DD-HHmm>/` (Vietnam time) with `screenshots/`.

## 1. Start the app (hermetic, like CI)

1. `node .sdd/scripts/sdd.mjs run build`.
2. Start `node tests/e2e/server.mjs` **in the background** (in-memory MongoDB, dev seed: workspace "Workspace của Cô Lan",
   GV "Cô Lan", 3 HV; port 4173), wait until `http://127.0.0.1:4173/api/ready` answers 200.
3. Base URL `http://127.0.0.1:4173`. Desktop viewport 1280×800 for GV cases, 390×844 for HV cases (`browser_resize`).
4. Restart the server between test cases only when a case needs a clean database; otherwise keep the data and run cases in the
   order of the file (state the order dependency in the report).

## 2. Sign in

- While module 001 (real sign-in) is not built: open the base URL, then `browser_evaluate`
  `fetch('/api/dev/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'GV' }) })`
  (or `'HV'`), then navigate to the case's start screen. Dev sign-in is a test precondition, not a user step.
- Once 001 is built: test cases about signing in go through A01 like a user; other cases may use the dev endpoint for speed.

## 3. Run each test case like a user

For every selected TC (in file order):
1. Create the preconditions the way the TC says (through the UI as the user would, or via the API in `browser_evaluate` when the
   TC says so). Record what you created.
2. Perform each step with the MCP tools, reading the page through `browser_snapshot` (accessible names) — click what a user
   would click, type what a user would type. No shortcuts through URLs unless the step says "mở đường dẫn".
3. Check every expected result literally (exact Vietnamese wording, values, which screen you are on, what is NOT shown). Also
   check `browser_console_messages` for errors and failed `/api` requests in `browser_network_requests`.
4. Evidence: `browser_take_screenshot` of the final state (and of the failure point), copied into `runs/<ts>/screenshots/TC-###-<n>.png`.
5. Result: **Pass** (all expectations met), **Fail** (an expectation not met — write: step, expected, actual, screenshot),
   **Bị chặn** (could not execute: missing precondition/feature/environment — say what), **Thủ công** (needs a human; leave
   instructions). Retry a step once only when the failure looks like timing; say so.

## 4. Save a replayable script per test case

Write `specs/<NNN>-*/testing/e2e/TC-###.spec.ts` that reproduces exactly what you did:
- `import { test, expect } from '@playwright/test';` and `import { loginAs } from '../../../../tests/e2e/fixtures';`
- Title `[<NNN>:AC-x.y] TC-### <short name>` (cite every AC the TC covers — this is what `sdd trace` links to the AC).
- Locators by role/label/text as the user sees them (`getByRole('button', { name: 'Lưu nháp' })`), viewport via `test.use`,
  preconditions as in your run, assertions = the TC's expected results (never weaker; no `.skip`, no `test.fixme` for a Fail).
- Then replay it: `node .sdd/scripts/sdd.mjs run test:modules -- <NNN> TC-###` — the replay must give the same result you
  observed (Pass → green; Fail → red at the same expectation). Fix the script, not the app, until it reproduces faithfully.
- Scripts of earlier runs are kept and updated in place; a script is only rewritten when the test case itself changed.

## 5. Record the run

1. `runs/<ts>/report.md`: header (date, commit `git rev-parse --short HEAD`, server, viewports), summary x/y Pass, a table
   `TC | AC | Kết quả | Bằng chứng | Ghi chú`, then one section per Fail/Bị chặn (steps, expected, actual, screenshot, console/network
   errors) — written so `/module <NNN>` can fix it without re-running you.
2. `runs/<ts>/results.json`: `[{ tc, acs, type, role, status, durationMs, steps:[{action, target, value?}], evidence:[…], errors:[…] }]`.
3. `test-cases.md`: Script column (link to the .spec.ts), status per row, Tóm tắt counts, `last_run`, newest-first entry under
   "Ghi chú lần chạy" linking the report.
4. `verification.md` (section "QA — Playwright MCP"): run summary, link to the report, `node .sdd/scripts/sdd.mjs trace <NNN>`
   output, and `**Verdict:** PASS` only when every E2E/API case is Pass, every AC is traced, and manual cases have instructions;
   otherwise `**Verdict:** FAIL` with the list.
5. PASS → `node .sdd/scripts/sdd.mjs set-status <NNN> verified` (the gate re-checks tasks, verdict and trace).
   FAIL → status stays `implementing`; add a `## Handoff` to `progress.md` with Next "`/module <NNN>` — sửa TC-…".
6. Stop the server, `node scripts/sync-state.mjs <NNN>`, commit only test artefacts:
   `test(<NNN>): QA run <x>/<y> pass` (`specs/<NNN>-*/testing/`, `test-cases.md`, `verification.md`, `progress.md`).
7. Report in ≤ 6 lines: x/y Pass, failures (TC → one line), status, report path, next step.
