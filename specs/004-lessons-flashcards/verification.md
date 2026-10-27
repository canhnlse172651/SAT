# Verification — 004-lessons-flashcards

## QA — Playwright MCP

- **Lần chạy:** 2026-10-27 09:32 (giờ Việt Nam), commit 37ad27c, server e2e hermetic (`tests/e2e/server.mjs`), Chromium; GV 1280 × 800,
  HV 390 × 844 / 360 px. Báo cáo: [testing/runs/2026-10-27-0932/report.md](testing/runs/2026-10-27-0932/report.md), kết quả máy đọc:
  [results.json](testing/runs/2026-10-27-0932/results.json), ảnh: `testing/runs/2026-10-27-0932/screenshots/`.
- **Kết quả:** 94/101 ca E2E + API Pass, 7 Fail (TC-024, TC-028, TC-045, TC-067, TC-077, TC-080, TC-099), 4 Thủ công (TC-101, TC-102, TC-103,
  TC-105 — hướng dẫn trong test-cases.md).
- **Script:** 101 script trong `testing/e2e/` (tiêu đề trích `004:AC-n.m` / `004:NFR-n`), chạy lại bằng
  `node .sdd/scripts/sdd.mjs run test:modules -- 004` (chạy tuần tự cho các ca hiệu năng: xem report).
- **Lưu ý:** lần QA này chạy trong cùng phiên với lần code module, không phải phiên QA độc lập.
- **Traceability:** `node .sdd/scripts/sdd.mjs trace 004` → 118/118 AC có task và script; mục "Gaps": **None.**

| Lỗi | TC | AC / NFR | Tóm tắt |
|-----|----|----------|---------|
| B1 | TC-024, TC-028 | AC-3.5, AC-4.2 | Đậm, nghiêng, gạch chân (và màu chữ sau chữ đậm) bị bộ lọc HTML bỏ khi lưu — trình soạn dùng `styleWithCSS` |
| B2 | TC-045 | AC-6.5 | Khi "Đang xử lý…", "Lưu nháp" cũng bị vô hiệu |
| B3 | TC-067 | AC-11.1 | Hộp thoại T08 có thêm nút "Đóng" ngoài "Xong" |
| B4 | TC-077 | AC-13.4 | HV ngoài lớp nhận "Bạn không thuộc lớp này…" (003 AC-14.5) thay vì A05 — cần thống nhất spec 003/004 |
| B5 | TC-080 | AC-13.5 | Bước đang xem bị lưu trữ: "Tiếp" vẫn mở bước sau, không báo "Bước học này hiện không còn khả dụng." |
| B6 | TC-099 | NFR-3 | T07 với 30 bước / 300 khối mở 2,6 s (mục tiêu ≤ 2 s); S03 sát ngưỡng 3 s |

**Verdict:** FAIL — 7 ca E2E/API chưa Pass (B1–B6). Trace đầy đủ; các ca thủ công có hướng dẫn.
