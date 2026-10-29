# Verification — 008-scoring-leaderboard

## QA — Playwright MCP

- **Lần chạy:** 2026-10-29-2303 (23:03 → 23:20 giờ Việt Nam), commit 9662093, server e2e hermetic (`tests/e2e/server.mjs`), Chromium;
  GV 1280 × 800 (TC-064 1024 × 768), HV 390 × 844. Báo cáo: [testing/runs/2026-10-29-2303/report.md](testing/runs/2026-10-29-2303/report.md),
  kết quả máy đọc: [results.json](testing/runs/2026-10-29-2303/results.json) (+ `playwright.json`, `playwright-TC-014-replay.json`,
  `full-run.log`), ảnh: `testing/runs/2026-10-29-2303/screenshots/`. Lần trước: [2026-10-29-1806](testing/runs/2026-10-29-1806/report.md)
  (60/64, F1–F4 — đã sửa ở 6c533aa).
- **Kết quả:** **64/64 ca E2E + API Pass**, 0 Fail, 0 Bị chặn, 2 Thủ công (TC-065 tương phản / huy hiệu, TC-066 log `score.change` —
  hướng dẫn trong test-cases.md).
- **Cách chạy:** cả 64 script tuần tự (`--workers=1`, 9,4 phút): 63 Pass; TC-014 Fail vì bước "+1 giờ" vượt nửa đêm giờ Việt Nam và script
  so định dạng giờ cũ → sửa script (`roomToday`, `dd/mm/yyyy HH:mm`), `run test:modules -- 008 TC-014` Pass. Playwright MCP: TC-030, TC-049,
  TC-064 (1024 px) kiểm như người dùng, Pass. TC-063: API p95 GV 482 ms / HV 416 ms; màn hình p95 S09 1 431 ms, T04 1 481 ms.
- **Độc lập:** chạy trong cùng phiên với `/module 008` (fix mode) theo yêu cầu người dùng.
- **Traceability:** `node .sdd/scripts/sdd.mjs trace 008` → 87/87 AC (AC-1.1 … AC-13.5) có task và script trích dẫn `008:AC-n.m`, đều ✅;
  `## Gaps` → `None.`
- **Kiểm tra script:** `run lint` ✔, `run typecheck` ✔.

**Verdict:** PASS — mọi ca E2E / API Pass, 87/87 AC được trace, 2 ca thủ công có hướng dẫn.
