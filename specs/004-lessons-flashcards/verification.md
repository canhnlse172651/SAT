# Verification — 004-lessons-flashcards

## QA — Playwright MCP

- **Lần chạy:** 2026-10-27 10:57 (giờ Việt Nam), commit a04568f, server e2e hermetic (`tests/e2e/server.mjs`), Chromium; GV 1280 × 800,
  HV 390 × 844 / 360 px. Báo cáo: [testing/runs/2026-10-27-1057/report.md](testing/runs/2026-10-27-1057/report.md), kết quả máy đọc:
  [results.json](testing/runs/2026-10-27-1057/results.json), ảnh: `testing/runs/2026-10-27-1057/screenshots/`.
- **Kết quả:** 100/101 ca E2E + API Pass, 1 Fail (TC-077), 4 Thủ công (TC-101, TC-102, TC-103, TC-105 — hướng dẫn trong test-cases.md).
  Các lỗi B1, B2, B3, B5, B6 của lần chạy 2026-10-27-0932 đã đạt; TC-024 và TC-067 được kiểm thêm bằng tay qua Playwright MCP.
- **Script:** 101 script trong `testing/e2e/` (không đổi so với lần trước; tiêu đề trích `004:AC-n.m` / `004:NFR-n`), chạy lại bằng
  `node .sdd/scripts/sdd.mjs run test:modules -- 004` (chạy tuần tự cho các ca hiệu năng).
- **Lưu ý:** lần QA này chạy trong cùng phiên với lần sửa lỗi, không phải phiên QA độc lập.
- **Traceability:** `node .sdd/scripts/sdd.mjs trace 004` → 118/118 AC có task và script; mục "Gaps": **None.**

| Lỗi | TC | AC / NFR | Tóm tắt |
|-----|----|----------|---------|
| B4 | TC-077 | AC-13.4 | HV ngoài lớp nhận "Bạn không thuộc lớp này…" (003 AC-14.5) thay vì A05 — xung đột spec 003/004, chờ agent spec |

**Verdict:** FAIL — 1 ca API chưa Pass (TC-077, B4: xung đột spec). Trace đầy đủ; các ca thủ công có hướng dẫn.
