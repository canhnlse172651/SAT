# Verification — 002-curriculum

Verdict: FAIL
Date: 2026-10-23
Commit: 7722ec8

## QA — Playwright MCP

**Verdict:** FAIL

- Run: [testing/runs/2026-10-23-2227/report.md](testing/runs/2026-10-23-2227/report.md) — 2026-10-23 22:27 (giờ Việt Nam), `feat/002-curriculum`
  @ 7722ec8 in a separate worktree, hermetic server (`tests/e2e/server.mjs`, in-memory MongoDB, port 4173), GV 1280 × 800 / HV 390 × 844.
- Browser: the Playwright MCP browser was held by another Claude session; with the user's agreement every test case was executed with the
  project's `@playwright/test` Chromium through its saved script (`testing/e2e/TC-###.spec.ts`), serially, on a fresh database.
- Result: **73/76 E2E/API Pass**, 2 Fail, 1 Bị chặn, 2 Thủ công (78 TC). Toolchain replay `sdd run test:modules -- 002`
  ([2026-10-23-2231-replay](testing/runs/2026-10-23-2231-replay/report.md)) reproduces the same three non-passing cases at the same expectations.
- Traceability (`node .sdd/scripts/sdd.mjs trace 002`, [trace.md](testing/runs/2026-10-23-2227/trace.md)): 117/117 AC linked to a saved
  script citing `002:AC-n.m`; **Gaps: none**.

| Blocking item | AC | Kind | Summary |
|---------------|----|------|---------|
| TC-018 | AC-5.1 | Fail | Back on T06 while it still shows cached data, "Thêm bài" pre-fills "Bài 1" instead of "Bài 2" |
| TC-059 | AC-15.5 | Fail | Failed curriculum duplicate shows "Không thể kết nối tới máy chủ. Vui lòng thử lại." instead of "Nhân bản không thành công. Vui lòng thử lại." |
| TC-038 | AC-10.5 (UI part) | Bị chặn | S11 belongs to 003 and is a placeholder in 002; API 404s and HV redirects pass |

Manual cases with instructions in the report: TC-073 (NFR-5 accessibility), TC-074 (NFR-7 structured logs).

### Non-functional requirements measured in this run

| NFR | Target | Measured | Method | Result |
|-----|--------|----------|--------|--------|
| NFR-1 | T05 page 1 ≤ 2 s with 300 curricula | 281 ms | TC-008 | Pass |
| NFR-2 | T06 (100 Bài), T18 (30+30) ≤ 2 s; save actions ≤ 1 s; Web/Mobile ≤ 1 s; AI replace 30+30 ≤ 3 s | 262 ms; 179 ms; 18–133 ms; 45 ms; 17 ms | TC-071 | Pass |
| NFR-3 | Bài 60 items ≤ 10 s; curriculum 20 Bài / 400 items ≤ 30 s | 29 ms; 100 ms | TC-072 | Pass |
| NFR-4 | HV sees changes ≤ 5 s | next request | TC-040 | Pass |
| NFR-5 | WCAG 2.1 AA, keyboard only | keyboard sorting automated (TC-022) | TC-073 | Thủ công |
| NFR-6 | 0 out-of-scope access | 0 (21 endpoints, 5 screens, other GV + HV) | TC-068, TC-038 | Pass |
| NFR-7 | structured log per mutation | — | TC-074 | Thủ công |
| NFR-8 | Hanzi, pinyin, Vietnamese verbatim | verbatim on T05/T06/T18/T21 | TC-075, TC-019 | Pass |

Measured on a developer machine against an in-memory MongoDB — indicative, not a production benchmark.
