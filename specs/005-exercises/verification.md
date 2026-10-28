# Verification — 005-exercises

## QA — Playwright MCP

- **Lần chạy:** 2026-10-29-0004 (2026-10-28 23:50 → 2026-10-29 00:30 giờ Việt Nam), commit c1798b7, server e2e hermetic
  (`tests/e2e/server.mjs`, cơ sở dữ liệu sạch), Chromium; GV 1280 × 800, HV 390 × 844 (360 / 430 px cho NFR-6). Báo cáo:
  [testing/runs/2026-10-29-0004/report.md](testing/runs/2026-10-29-0004/report.md), kết quả máy đọc:
  [results.json](testing/runs/2026-10-29-0004/results.json) (+ `playwright.json`, `reruns/`), ảnh: `testing/runs/2026-10-29-0004/screenshots/`.
- **Kết quả:** 123/126 ca E2E + API Pass, 1 Fail (TC-130 — F1), 2 Bị chặn (TC-102 — 006 chưa xây; TC-122 — ổ C thiếu dung lượng cho máy chủ
  log thứ hai), 4 Thủ công (TC-126 … TC-129 — hướng dẫn trong test-cases.md). Mọi lỗi B1–B16 của lần chạy 2026-10-28-1452 đã hết.
- **Cách chạy:** script TC-012, TC-100, TC-103, TC-105 cập nhật theo V19-1 / V19-2, TC-130 mới; hồi quy toàn bộ bằng
  `node .sdd/scripts/sdd.mjs run test:modules -- 005` (3 worker song song: 113/125 Pass), 12 ca Fail chạy lại từng ca một trên máy chủ sạch
  (10 Pass; TC-048 là race của script, đã sửa; TC-118 chạy lại 1 lần vì ECONNRESET). Các ca dời đồng hồ máy chủ / đo thời gian chỉ đáng tin khi
  chạy tuần tự — xem ghi chú công cụ trong báo cáo.
- **Playwright MCP:** vẫn không dùng được — hồ sơ `mcp-chrome-7c84bcd` bị Chrome của một tiến trình MCP từ phiên trước giữ (PID 40720, 14:06);
  các ca chạy bằng script Playwright trên Chromium thật.
- **Traceability:** `node .sdd/scripts/sdd.mjs trace 005` → mọi AC có task và script (AC-21.9 → TC-130), trừ một khoảng trống:
  `Gaps: - AC-20.7 has no test citing "005:AC-20.7"` (TC-102, chờ 006).

| Lỗi | TC | AC / NFR | Tóm tắt |
|-----|----|----------|---------|
| F1 | TC-130 | AC-21.9, NFR-9 | HV bị gỡ khỏi lớp trong lúc làm: lưu / nộp bị từ chối đúng thông báo nhưng HV ở lại S05 (nội dung bộ còn hiển thị) thay vì về S01 |

**Verdict:** FAIL — TC-130 Fail (F1, sửa qua `/module 005`); TC-122 Bị chặn (môi trường: người dùng cần dọn `%TEMP%\mongo-mem-*` rồi chạy lại);
TC-102 Bị chặn và AC-20.7 chưa có script (chờ 006). Các ca thủ công có hướng dẫn.

Lần chạy trước: 2026-10-28-1452 (commit 25e2d28) — 104/125 Pass, B1–B16; báo cáo
[testing/runs/2026-10-28-1452/report.md](testing/runs/2026-10-28-1452/report.md).

