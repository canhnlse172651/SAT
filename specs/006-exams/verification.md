# Verification — 006-exams

## QA — Playwright MCP

- **Lần chạy:** 2026-10-29-0304 (03:04 → 03:40 giờ Việt Nam), commit e91a5aa, server e2e hermetic (`tests/e2e/server.mjs`), Chromium;
  GV 1280 × 800, HV 390 × 844. Báo cáo: [testing/runs/2026-10-29-0304/report.md](testing/runs/2026-10-29-0304/report.md), kết quả máy
  đọc: [results.json](testing/runs/2026-10-29-0304/results.json) (+ `playwright.json`, `full-run.log`), ảnh:
  `testing/runs/2026-10-29-0304/screenshots/`.
- **Kết quả:** 106/112 ca E2E + API Pass, 6 Fail (F1–F5), 0 Bị chặn, 3 Thủ công (TC-112 hiệu năng dưới tải, TC-114 thiết bị thật,
  TC-115 đọc log — hướng dẫn trong test-cases.md).
- **Cách chạy:** 112 script `testing/e2e/TC-###.spec.ts` (+ `helpers.ts`) chạy tuần tự một lượt (`--workers=1`, 12,5 phút) — các ca dời
  đồng hồ máy chủ không chạy song song được (xem báo cáo).
- **Playwright MCP:** không dùng được (hồ sơ `mcp-chrome-7c84bcd` bị Chrome của phiên MCP cũ giữ, PID 33248); các ca chạy bằng script
  Playwright trên Chromium thật.
- **Tính độc lập:** chạy trong cùng phiên với agent cài đặt 006 — nên có thêm một lượt `/test-module 006` ở phiên mới.
- **Traceability:** `node .sdd/scripts/sdd.mjs trace 006` → mọi AC có task và script trích dẫn `006:AC-n.m`; `## Gaps — None.`

| Lỗi | TC | AC | Tóm tắt |
|-----|----|----|---------|
| F1 | TC-035, TC-036 | AC-5.2 | Lùi giờ đóng khi có lượt đang làm → 500 (update pipeline của Mongoose 9 thiếu `updatePipeline`); `endsAt` không đổi |
| F2 | TC-019 | AC-3.3 | Lỗi giờ đóng chỉ ở danh sách điều kiện, không dưới trường "Giờ đóng" |
| F3 | TC-021 | AC-3.5 | Mục trong danh sách điều kiện không đưa tới Tên / Giờ mở / Thời lượng / Giờ đóng (`id` của ô bị `FormField` ghi đè) |
| F4 | TC-044 | AC-6.5 | Menu "⋯" của hàng "Lưu trữ" trên T10 bị hàng sau che → không bấm được "Khôi phục" (trừ hàng cuối) |
| F5 | TC-059 | AC-8.4 | Tab cũ bấm "Bắt đầu làm bài" sau khi đã nộp → sang S08 thay vì S07 với "Đã nộp · …" |

**Verdict:** FAIL — 6 ca Fail (F1–F5, sửa qua `/module 006`); trace đủ, các ca thủ công có hướng dẫn.
