# Verification — 008-scoring-leaderboard

## QA — Playwright MCP

- **Lần chạy:** 2026-10-29-1806 (17:30 → 18:30 giờ Việt Nam), commit e4b1e7d, server e2e hermetic (`tests/e2e/server.mjs`), Chromium;
  GV 1280 × 800, HV 390 × 844. Báo cáo: [testing/runs/2026-10-29-1806/report.md](testing/runs/2026-10-29-1806/report.md), kết quả máy đọc:
  [results.json](testing/runs/2026-10-29-1806/results.json) (+ `playwright.json`, `full-run.log`), ảnh: `testing/runs/2026-10-29-1806/screenshots/`.
- **Kết quả:** **60/64 ca E2E + API Pass, 4 Fail**, 0 Bị chặn, 2 Thủ công (TC-065 tương phản / huy hiệu, TC-066 log `score.change` —
  hướng dẫn trong test-cases.md).
- **Cách chạy:** TC-001, TC-029, TC-036, TC-051 chạy như người dùng qua Playwright MCP (Pass); F2, F3 thấy lại qua MCP; F1 khoanh vùng bằng
  một biến thể MCP. Cả 64 script `testing/e2e/TC-###.spec.ts` chạy tuần tự một lượt (`--workers=1`, 12,7 phút) trên server mới. Replay
  qua toolchain: `run test:modules -- 008 TC-001` Pass, `… TC-030` Fail cùng chỗ.
- **Lỗi (chủ: `/module 008`):**
  - **F1 — TC-030 (AC-6.2, AC-6.6):** "Cập nhật lần cuối" lấy từ ảnh chụp lúc đọc; điểm đổi 24 → 12 → 24 không ai xem ở giữa bị coi là
    không đổi → thứ tự trong nhóm đồng hạng sai (Chi trước Bình).
  - **F2 — TC-049 (AC-10.1):** "Cập nhật lần cuối" hiện `HH:mm dd/mm/yyyy`, TC ghi `dd/mm/yyyy HH:mm` (spec không quy định — sửa giao diện
    hoặc câu chữ TC).
  - **F3 — TC-064 (NFR-5):** tab Xếp hạng ở 1024 px: bảng bị cắt, cột "Cập nhật lần cuối" và nút "Chi tiết điểm của …" ngoài màn hình.
  - **F4 — TC-063 (NFR-2, NFR-4):** 100 HV / 300 bộ / 50 bài thi: p95 API 3 113 ms (GV) / 3 079 ms (HV); màn hình S09 3 987 ms, T04
    4 498 ms (mong đợi ≤ 2 000 ms; đo trên server hermetic của máy dev).
- **Traceability:** `node .sdd/scripts/sdd.mjs trace 008` → 87/87 AC (AC-1.1 … AC-13.5) có task và script trích dẫn `008:AC-n.m`, đều ✅;
  `## Gaps` → `None.`
- **Kiểm tra script:** `run lint` ✔, `run typecheck` ✔.

**Verdict:** FAIL — TC-030 (F1), TC-049 (F2), TC-064 (F3), TC-063 (F4) chưa Pass; trace không thiếu; 2 ca thủ công có hướng dẫn.
