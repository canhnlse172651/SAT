# Verification — 005-exercises

## QA — Playwright MCP

- **Lần chạy:** 2026-10-28 14:52 (giờ Việt Nam), commit 25e2d28, server e2e hermetic (`tests/e2e/server.mjs`, cơ sở dữ liệu sạch), Chromium;
  GV 1280 × 800, HV 390 × 844 (360 / 430 px cho NFR-6). Báo cáo: [testing/runs/2026-10-28-1452/report.md](testing/runs/2026-10-28-1452/report.md),
  kết quả máy đọc: [results.json](testing/runs/2026-10-28-1452/results.json) (+ `playwright.json`), ảnh: `testing/runs/2026-10-28-1452/screenshots/`.
- **Kết quả:** 104/125 ca E2E + API Pass, 20 Fail (16 lỗi B1–B16), 1 Bị chặn (TC-102 — 006 chưa xây), 4 Thủ công (TC-126 … TC-129 —
  hướng dẫn trong test-cases.md). TC-073 (lỗi script, đã sửa) và TC-118 (ECONNRESET của máy chủ in-memory) chạy lại 1 lần: Pass.
- **Playwright MCP:** không dùng được trong phiên này — hồ sơ `mcp-chrome-7c84bcd` bị Chrome của phiên `/module 005` trước giữ, lệnh đóng bị từ
  chối quyền. Các ca chạy bằng script Playwright trên Chromium thật (như QA 004); phiên QA tiếp theo nên dùng MCP sau khi đóng trình duyệt đó.
- **Script:** 124 script trong `testing/e2e/` (+ `helpers.ts`), tiêu đề trích `005:AC-n.m` / `005:NFR-n`; lint sạch. Chạy lại:
  `node .sdd/scripts/sdd.mjs run test:modules -- 005` (tuần tự; TC-118 dựng 5 000 bài nộp, ~3–4 phút).
- **Traceability:** `node .sdd/scripts/sdd.mjs trace 005` → mọi AC có task và script, trừ một khoảng trống:
  `Gaps: - AC-20.7 has no test citing "005:AC-20.7"` (TC-102, chờ 006).

| Lỗi | TC | AC / NFR | Tóm tắt |
|-----|----|----------|---------|
| B1 | TC-012, TC-100 | AC-21.2, AC-20.5 | HV mở đường dẫn T09 / T14 bị đưa về S01 thay vì A05 (guard foundation) — cần agent spec |
| B2 | TC-103, TC-105 | AC-21.3, AC-21.6 | HV ngoài lớp / bị gỡ nhận thông điệp 003 "Bạn không thuộc lớp này…" thay vì A05 / thông điệp AC-21.6 — xung đột 003/005 |
| B3 | TC-019 | AC-2.5 | 101 câu bị từ chối 400 VALIDATION_ERROR, test case ghi 422 |
| B4 | TC-029, TC-042 | AC-4.1, AC-8.1 | Chặn phương án thứ 7 / cặp thứ 9 mà không có thông điệp lý do |
| B5 | TC-038 | AC-16.3 | S06 / T14 không có kết quả từng chỗ trống, từng cặp |
| B6 | TC-051 | AC-10.4 | "Nghĩa: …" thay vì "Nghĩa gợi ý: …" |
| B7 | TC-075 | AC-17.7 | "Tiếp tục làm" ở tab cũ sau khi đã nộp nơi khác vào lại bài, không báo "Bài đã nộp…" |
| B8 | TC-080 | AC-15.5, NFR-3 | Nộp song song cùng submitKey: 2/3 phản hồi 409 thay vì kết quả bài nộp |
| B9 | TC-082, TC-083 | AC-16.2 | Điểm "7,0 / 12,0 điểm" thay vì "7 / 12 điểm" (S06, T14, T04, S05) |
| B10 | TC-088 | AC-17.5, AC-17.6 | Bắt đầu làm chưa trả lời vẫn "Chưa làm" |
| B11 | TC-095 | AC-19.1, AC-18.1 | Bộ có bài nộp: "Thêm đáp án" bị vô hiệu, không thêm được đáp án chấp nhận |
| B12 | TC-117 | NFR-4 | Bộ ca chuẩn 72 ca, cần ≥ 400 (≥ 150 pinyin) |
| B13 | TC-119 | NFR-6 | Chữ Hán trên S06 15 px (< 18 px) |
| B14 | TC-120 | NFR-7 | axe: T14 `scrollable-region-focusable` (main) |
| B15 | TC-123 | NFR-11 | Duyệt 30 × 100 câu bị 413 (giới hạn JSON 100 kB) |
| B16 | TC-124 | NFR-13 | Quay lại tab Bài tập 1,28–1,31 s (> 1 s) |

**Verdict:** FAIL — 20 ca E2E/API chưa Pass (B1–B16), TC-102 bị chặn và AC-20.7 chưa có script (chờ 006). B1, B2 và B10 cần agent spec
quyết định trước khi sửa; các lỗi còn lại sửa qua `/module 005`. Các ca thủ công có hướng dẫn.
