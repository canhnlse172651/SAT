# QA run 2026-10-26 08:59 — 003 Lớp học (re-run after fix)

- **Run by:** `/test-module 003` (QA agent), same Claude session as the implementation (user's choice); QA rules applied — no
  application code, spec, task or expected result changed.
- **Commit:** `1a9c93a` (feat/003-classes — includes `4ab7f6c fix(003): TC-002 …`), worktree `../sat-003-qa`.
- **Server:** hermetic `tests/e2e/server.mjs` (production build, in-memory MongoDB, NODE_ENV=test, seed "Workspace của Cô Lan"),
  **port 4183**, restarted with a clean database right before this run. Node 24.22.1.
- **Viewports:** GV 1280 × 800, HV 390 × 844 (e-mail HTML also at 360 and 430).
- **How:** TC-002 was walked by hand in the **Playwright MCP browser** (free again): T03 → step 4 → "Quay lại" (step 3) → browser Back
  → "Bước 2/4 · Thêm học viên" with "Đã chọn (2)" kept → … → "Tạo lớp" opened T04 — console: one React Router `HydrateFallback`
  warning, no errors ([TC-002-mcp-T04](screenshots/TC-002-mcp-T04.png)). Then the full pass of every saved script:
  `npx playwright test -c playwright.modules.config.ts --workers=1` with `PORT=4183 SAT_E2E_PORT=4183`, file order, one worker
  (clock-moving cases restore the clock in `finally`).
- **Script maintenance in this run (QA-owned, no expected result weakened):** TC-070 no longer assumes today is in the month the deadline
  popup opens on (it moves to today's month, then to the first allowed month) and type-checks; TC-018 and TC-053 wait for the screen to
  load before checking that something is absent, and TC-018 matches "Đang ẩn" exactly (its loose match also hit the summary line
  "… 0 phần đang ẩn …" — its earlier passes were vacuous); the shared `signIn` waits for the signed-out app to settle and confirms the
  session (TC-007 had timed out once at its first step under load).

## Summary

**88 / 88 E2E/API test cases Pass** (89 Playwright tests: TC-037 has two), 0 Fail, 0 Bị chặn, 4 Thủ công (TC-089 … TC-092 — instructions
below). `node .sdd/scripts/sdd.mjs trace 003`: 154 / 154 ACs traced — **Gaps: None.**

| TC | AC | Kết quả | Bằng chứng | Ghi chú |
|----|----|---------|------------|---------|
| TC-001 | AC-1.1, AC-1.2 | Pass | [TC-001-1](screenshots/TC-001-1.png) [TC-001-2](screenshots/TC-001-2.png) [TC-001-3](screenshots/TC-001-3.png) |  |
| TC-002 | AC-1.3, AC-1.4 | Pass | [TC-002-1](screenshots/TC-002-1.png) [TC-002-2](screenshots/TC-002-2.png) [TC-002-mcp-T04](screenshots/TC-002-mcp-T04.png) |  |
| TC-003 | AC-1.5 | Pass | [TC-003-1](screenshots/TC-003-1.png) [TC-003-2](screenshots/TC-003-2.png) |  |
| TC-004 | AC-1.6 | Pass | [TC-004-1](screenshots/TC-004-1.png) |  |
| TC-005 | AC-2.1 | Pass | [TC-005-1](screenshots/TC-005-1.png) |  |
| TC-006 | AC-2.2, AC-2.3, AC-2.4 | Pass | [TC-006-1](screenshots/TC-006-1.png) |  |
| TC-007 | AC-2.5, AC-2.6 | Pass | [TC-007-1](screenshots/TC-007-1.png) [TC-007-2](screenshots/TC-007-2.png) |  |
| TC-008 | AC-3.1, AC-14.6 | Pass | [TC-008-1](screenshots/TC-008-1.png) [TC-008-2](screenshots/TC-008-2.png) |  |
| TC-009 | AC-3.2, NFR-2 | Pass | [TC-009-1](screenshots/TC-009-1.png) [TC-009-2](screenshots/TC-009-2.png) | NFR-2: search "nguyen" shown after 434 ms |
| TC-010 | AC-3.3, AC-3.7 | Pass | [TC-010-1](screenshots/TC-010-1.png) [TC-010-2](screenshots/TC-010-2.png) |  |
| TC-011 | AC-3.4 | Pass | [TC-011-1](screenshots/TC-011-1.png) |  |
| TC-012 | AC-3.5 | Pass | [TC-012-1](screenshots/TC-012-1.png) [TC-012-2](screenshots/TC-012-2.png) |  |
| TC-013 | AC-3.6 | Pass | [TC-013-1](screenshots/TC-013-1.png) |  |
| TC-014 | AC-4.1, AC-4.2 | Pass | [TC-014-1](screenshots/TC-014-1.png) [TC-014-2](screenshots/TC-014-2.png) |  |
| TC-015 | AC-4.3, AC-4.4, AC-4.5 | Pass | [TC-015-1](screenshots/TC-015-1.png) |  |
| TC-016 | AC-4.6 | Pass | [TC-016-1](screenshots/TC-016-1.png) [TC-016-2](screenshots/TC-016-2.png) |  |
| TC-017 | AC-5.1, AC-5.2 | Pass | [TC-017-1](screenshots/TC-017-1.png) [TC-017-2](screenshots/TC-017-2.png) |  |
| TC-018 | AC-5.3, AC-5.6, NFR-1 | Pass | [TC-018-1](screenshots/TC-018-1.png) [TC-018-2](screenshots/TC-018-2.png) | NFR-1: create with 100 HV: 67 ms |
| TC-019 | AC-5.4 | Pass | [TC-019-1](screenshots/TC-019-1.png) [TC-019-2](screenshots/TC-019-2.png) [TC-019-3](screenshots/TC-019-3.png) |  |
| TC-020 | AC-5.5, AC-5.6 | Pass | [TC-020-1](screenshots/TC-020-1.png) [TC-020-2](screenshots/TC-020-2.png) |  |
| TC-021 | AC-6.1, AC-6.5, AC-14.1 | Pass | [TC-021-1](screenshots/TC-021-1.png) [TC-021-2](screenshots/TC-021-2.png) |  |
| TC-022 | AC-6.2, AC-6.3, NFR-1 | Pass | [TC-022-1](screenshots/TC-022-1.png) [TC-022-2](screenshots/TC-022-2.png) | NFR-1: T02 with 300 classes shown in 131 ms |
| TC-023 | AC-6.4 | Pass | [TC-023-1](screenshots/TC-023-1.png) |  |
| TC-024 | AC-7.1, AC-7.2 | Pass | [TC-024-1](screenshots/TC-024-1.png) [TC-024-2](screenshots/TC-024-2.png) |  |
| TC-025 | AC-7.3, AC-7.4 | Pass | [TC-025-1](screenshots/TC-025-1.png) [TC-025-2](screenshots/TC-025-2.png) [TC-025-3](screenshots/TC-025-3.png) |  |
| TC-026 | AC-7.5 | Pass | [TC-026-1](screenshots/TC-026-1.png) |  |
| TC-027 | AC-8.1, AC-8.7, NFR-1, NFR-6 | Pass | [TC-027-1](screenshots/TC-027-1.png) [TC-027-2](screenshots/TC-027-2.png) | NFR-1: tab Học viên with 100 HV in 181 ms |
| TC-028 | AC-8.2, AC-8.3 | Pass | [TC-028-1](screenshots/TC-028-1.png) [TC-028-2](screenshots/TC-028-2.png) |  |
| TC-029 | AC-8.4, AC-8.3 | Pass | [TC-029-1](screenshots/TC-029-1.png) |  |
| TC-030 | AC-8.5, AC-8.6 | Pass | [TC-030-1](screenshots/TC-030-1.png) [TC-030-2](screenshots/TC-030-2.png) [TC-030-3](screenshots/TC-030-3.png) |  |
| TC-031 | AC-8.9 | Pass | — |  |
| TC-032 | AC-8.8 | Pass | [TC-032-1](screenshots/TC-032-1.png) [TC-032-2](screenshots/TC-032-2.png) |  |
| TC-033 | AC-9.1, AC-9.2 | Pass | [TC-033-1](screenshots/TC-033-1.png) [TC-033-2](screenshots/TC-033-2.png) [TC-033-3](screenshots/TC-033-3.png) |  |
| TC-034 | AC-9.3, AC-9.4 | Pass | [TC-034-1](screenshots/TC-034-1.png) [TC-034-2](screenshots/TC-034-2.png) |  |
| TC-035 | AC-10.1, AC-10.6, AC-14.4 | Pass | [TC-035-1](screenshots/TC-035-1.png) [TC-035-2](screenshots/TC-035-2.png) |  |
| TC-036 | AC-10.2, AC-10.3 | Pass | [TC-036-1](screenshots/TC-036-1.png) [TC-036-2](screenshots/TC-036-2.png) |  |
| TC-037 | AC-10.4, AC-10.5 | Pass | [TC-037-1](screenshots/TC-037-1.png) |  |
| TC-038 | AC-11.1, AC-11.2 | Pass | [TC-038-1](screenshots/TC-038-1.png) |  |
| TC-039 | AC-11.3, AC-11.4 | Pass | [TC-039-1](screenshots/TC-039-1.png) [TC-039-2](screenshots/TC-039-2.png) |  |
| TC-040 | AC-11.5 | Pass | — |  |
| TC-041 | AC-12.1, AC-12.2, NFR-3 | Pass | [TC-041-1](screenshots/TC-041-1.png) | NFR-3: S01 with 10 classes in 96 ms (desktop CPU, local network) |
| TC-042 | AC-12.3 | Pass | [TC-042-1](screenshots/TC-042-1.png) |  |
| TC-043 | AC-13.1, AC-13.2, AC-13.3 | Pass | [TC-043-1](screenshots/TC-043-1.png) |  |
| TC-044 | AC-13.4, AC-13.5, AC-13.7 | Pass | [TC-044-1](screenshots/TC-044-1.png) [TC-044-2](screenshots/TC-044-2.png) |  |
| TC-045 | AC-13.6, AC-17.3, AC-22.4 | Pass | [TC-045-1](screenshots/TC-045-1.png) [TC-045-2](screenshots/TC-045-2.png) [TC-045-3](screenshots/TC-045-3.png) |  |
| TC-046 | AC-13.8, AC-17.8 | Pass | [TC-046-1](screenshots/TC-046-1.png) [TC-046-2](screenshots/TC-046-2.png) |  |
| TC-047 | AC-14.2 | Pass | [TC-047-1](screenshots/TC-047-1.png) [TC-047-2](screenshots/TC-047-2.png) |  |
| TC-048 | AC-14.3 | Pass | [TC-048-1](screenshots/TC-048-1.png) [TC-048-2](screenshots/TC-048-2.png) |  |
| TC-049 | AC-14.5, AC-20.7 | Pass | [TC-049-1](screenshots/TC-049-1.png) [TC-049-2](screenshots/TC-049-2.png) |  |
| TC-050 | AC-14.6, NFR-7 | Pass | [TC-050-1](screenshots/TC-050-1.png) |  |
| TC-051 | AC-15.1, AC-15.2, AC-15.3, NFR-1 | Pass | [TC-051-1](screenshots/TC-051-1.png) [TC-051-2](screenshots/TC-051-2.png) | NFR-1: tab Nội dung with 50 Bài in 590 ms |
| TC-052 | AC-15.4 | Pass | [TC-052-1](screenshots/TC-052-1.png) |  |
| TC-053 | AC-16.1, AC-16.2, AC-17.4, AC-17.6 | Pass | [TC-053-1](screenshots/TC-053-1.png) [TC-053-2](screenshots/TC-053-2.png) [TC-053-3](screenshots/TC-053-3.png) |  |
| TC-054 | AC-16.3 | Pass | [TC-054-1](screenshots/TC-054-1.png) |  |
| TC-055 | AC-16.4, NFR-4 | Pass | [TC-055-1](screenshots/TC-055-1.png) [TC-055-2](screenshots/TC-055-2.png) | NFR-4: bulk hide on 50 Bài in 20 ms |
| TC-056 | AC-16.5 | Pass | [TC-056-1](screenshots/TC-056-1.png) |  |
| TC-057 | AC-16.6 | Pass | [TC-057-1](screenshots/TC-057-1.png) |  |
| TC-058 | AC-17.1, AC-17.2, AC-17.5 | Pass | [TC-058-1](screenshots/TC-058-1.png) [TC-058-2](screenshots/TC-058-2.png) |  |
| TC-059 | AC-17.7 | Pass | [TC-059-1](screenshots/TC-059-1.png) |  |
| TC-060 | AC-18.1, AC-18.3 | Pass | — |  |
| TC-061 | AC-18.2 | Pass | — |  |
| TC-062 | AC-19.1, AC-19.2, AC-19.6, NFR-3 | Pass | [TC-062-1](screenshots/TC-062-1.png) [TC-062-2](screenshots/TC-062-2.png) | NFR-3: S11 with 40 items in 108 ms (desktop CPU, local network) |
| TC-063 | AC-19.3, AC-19.5, AC-19.7 | Pass | [TC-063-1](screenshots/TC-063-1.png) [TC-063-2](screenshots/TC-063-2.png) |  |
| TC-064 | AC-19.4, AC-19.8 | Pass | [TC-064-1](screenshots/TC-064-1.png) [TC-064-2](screenshots/TC-064-2.png) |  |
| TC-065 | AC-19.9, AC-23.5 | Pass | [TC-065-1](screenshots/TC-065-1.png) |  |
| TC-066 | AC-20.1, AC-20.2, AC-20.5, NFR-3 | Pass | [TC-066-1](screenshots/TC-066-1.png) | NFR-3: members list of 100 in 166 ms (desktop CPU, local network) |
| TC-067 | AC-20.3, AC-20.4, NFR-7 | Pass | — |  |
| TC-068 | AC-20.6 | Pass | [TC-068-1](screenshots/TC-068-1.png) |  |
| TC-069 | AC-21.1, AC-21.7 | Pass | [TC-069-1](screenshots/TC-069-1.png) |  |
| TC-070 | AC-21.2, NFR-6 | Pass | [TC-070-1](screenshots/TC-070-1.png) [TC-070-2](screenshots/TC-070-2.png) |  |
| TC-071 | AC-21.3, AC-21.6 | Pass | [TC-071-1](screenshots/TC-071-1.png) [TC-071-2](screenshots/TC-071-2.png) |  |
| TC-072 | AC-21.4, AC-21.5 | Pass | [TC-072-1](screenshots/TC-072-1.png) [TC-072-2](screenshots/TC-072-2.png) |  |
| TC-073 | AC-21.8 | Pass | [TC-073-1](screenshots/TC-073-1.png) [TC-073-2](screenshots/TC-073-2.png) |  |
| TC-074 | AC-22.1, AC-22.2, NFR-4 | Pass | [TC-074-1](screenshots/TC-074-1.png) [TC-074-2](screenshots/TC-074-2.png) | NFR-4: bulk deadline 2026-11-08 for 20 sets in 22 ms; NFR-4: bulk deadline clear for 20 sets in 12 ms |
| TC-075 | AC-22.3 | Pass | [TC-075-1](screenshots/TC-075-1.png) |  |
| TC-076 | AC-22.5, AC-22.6 | Pass | [TC-076-1](screenshots/TC-076-1.png) [TC-076-2](screenshots/TC-076-2.png) |  |
| TC-077 | AC-23.1, AC-23.2, AC-23.3, AC-23.4 | Pass | [TC-077-1](screenshots/TC-077-1.png) [TC-077-2](screenshots/TC-077-2.png) |  |
| TC-078 | AC-23.6 | Pass | [TC-078-1](screenshots/TC-078-1.png) |  |
| TC-079 | AC-23.7, NFR-4 | Pass | [TC-079-1](screenshots/TC-079-1.png) [TC-079-2](screenshots/TC-079-2.png) |  |
| TC-080 | AC-24.1, AC-24.2, NFR-10 | Pass | — |  |
| TC-081 | AC-24.3, AC-24.5 | Pass | — |  |
| TC-082 | AC-24.4 | Pass | — |  |
| TC-083 | AC-24.6 | Pass | — |  |
| TC-084 | AC-25.1, AC-25.2, AC-25.5, NFR-6 | Pass | [TC-084-360](screenshots/TC-084-360.png) [TC-084-430](screenshots/TC-084-430.png) |  |
| TC-085 | AC-25.3 | Pass | — |  |
| TC-086 | AC-25.4 | Pass | [TC-086-1](screenshots/TC-086-1.png) [TC-086-2](screenshots/TC-086-2.png) [TC-086-3](screenshots/TC-086-3.png) |  |
| TC-087 | AC-26.1, AC-26.2 | Pass | — |  |
| TC-088 | AC-26.3 | Pass | [TC-088-1](screenshots/TC-088-1.png) |  |
| TC-089 | NFR-5 | Thủ công | — |  |
| TC-090 | NFR-6 | Thủ công | — |  |
| TC-091 | NFR-8 | Thủ công | — |  |
| TC-092 | NFR-9 | Thủ công | — |  |

## Since the previous run (2026-10-23-2311)

- **TC-002 (AC-1.3): Fail → Pass.** Browser Back after "Quay lại" now lands on the step before (fix `4ab7f6c`).
- TC-018 … TC-020 (create, one class per wizard run) re-checked after the related AC-5.6 change in the same fix: Pass.

## Measurements (NFR, this environment)

Local server on the same machine (desktop CPU, loopback, no throttling) — single samples, not field p95.

| NFR | Measured | Target |
|-----|----------|--------|
| NFR-1 | T02 300 classes 131 ms · tab Học viên 100 HV 181 ms · tab Nội dung 50 Bài 590 ms · "Tạo lớp" with 100 HV 67 ms (API) | ≤ 2 s |
| NFR-2 | search "nguyen" among 2 000 HV shown 434 ms after the last keystroke (250 ms debounce included) | ≤ 1 s |
| NFR-3 | S01 10 classes 96 ms · S11 40 items 108 ms · members list of 100 166 ms (390 px) | ≤ 3 s |
| NFR-4 | bulk hide 50 Bài 20 ms · bulk deadline set / clear 20 sets 22 / 12 ms (API) · deadline change seen by HV on the next load (< 5 s) | ≤ 3 s / ≤ 5 s |

## Thủ công (need a person)

- **TC-089 (NFR-5):** 5 first-time GV: create a class of 10 existing HV + 1 curriculum, then hide Bài tập of every Bài of a class; time
  each without guidance; ≥ 80 % within 3 min / 30 s.
- **TC-090 (NFR-6):** keyboard + screen reader over T03, tab Nội dung incl. the deadline popup, S01, S02, S11; axe; contrast ≥ 4.5:1;
  no horizontal scroll (S01/S02/S11 at 360–430 px, T02–T04 at 1024 px). Automated parts covered by TC-070, TC-051, TC-077, TC-027,
  TC-066, TC-084, TC-041.
- **TC-091 (NFR-8):** in `npm run dev` perform every class action and a reminder sweep; one structured log line each (actor, class,
  action, result, counts), nothing with password / e-mail / name (TC-087 checks the reminder failure line when `QA_SERVER_LOG` is set).
- **TC-092 (NFR-9):** needs a real mail provider (hosting / e-mail ADR pending): 20 000 reminders in one sweep handed over before 08:15,
  ≥ 95 % accepted before 08:30.

## Notes (tooling, not 003 code — unchanged since the previous run)

- `playwright.config.ts` / `playwright.modules.config.ts` hard-code port 4173 with `reuseExistingServer`: parallel worktrees can replay
  against each other's server. This run used a local, uncommitted `SAT_E2E_PORT` override.
- `scripts/replay-module-tests.mjs` with ≥ 2 TC ids breaks on Windows (`-g "A|B"` through cmd.exe).
- The replay config sets no `workers`; 003's scripts move the shared server clock — replay with one worker.
