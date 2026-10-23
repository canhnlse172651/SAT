---
feature: {{NNN}}
generated: {{YYYY-MM-DD}}
last_run: {{YYYY-MM-DD HH:mm}}
---

# Test cases — {{NNN}} {{Tên module}}

<!--
Written by the test-engineer after implementation (step "Test cases" of /module NNN), kept up to date
after every re-run. scripts/sync-state.mjs reads this file for the dashboard:
  - one table row per test case, first cell "TC-###", LAST cell = status: Pass | Fail | Chưa chạy | Thủ công
  - front-matter last_run = time of the last automated run (Vietnam time)
Rules:
  - Every AC of spec.md has ≥ 1 test case; testable NFRs too (performance, accessibility…).
  - Automated cases name the real test: `path/to/file.test.ts › [NNN:AC-x.y] title` (same AC tag sdd trace scans).
  - Manual cases (UI look & feel, e-mail content, real devices) reference the prototype screen: specs/screen-flow-design.html#T07.
  - Status comes from an actual run in this session (`node .sdd/scripts/sdd.mjs run test`, `… run test:e2e`) — never guessed.
Prose in Vietnamese; IDs, AC tags and file paths stay as-is.
-->

## Tóm tắt

| Tổng | Pass | Fail | Chưa chạy | Thủ công | Lần chạy cuối |
|------|------|------|-----------|----------|---------------|
| 0 | 0 | 0 | 0 | 0 | {{YYYY-MM-DD HH:mm}} |

## Danh sách test case

| TC | AC / NFR | Loại | Tiền điều kiện | Các bước | Kết quả mong đợi | Test tự động | Trạng thái |
|----|----------|------|----------------|----------|------------------|--------------|------------|
| TC-001 | AC-1.1 | unit | … | 1. … 2. … | … | `apps/api/src/modules/…/x.test.ts › [NNN:AC-1.1] …` | Chưa chạy |

## Ghi chú lần chạy

<!-- Newest first: date, command, summary line of the runner output, failures and their cause. -->
