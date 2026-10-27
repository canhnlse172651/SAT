# QA run 004 — 2026-10-27-0932

- **Ngày:** 2026-10-27 09:32 (giờ Việt Nam) · **Commit:** 37ad27c (feat/004-lessons-flashcards) · **Người chạy:** /test-module 004
- **Máy chủ:** `tests/e2e/server.mjs` (bản build, MongoDB trong bộ nhớ, NODE_ENV=test, seed "Workspace của Cô Lan"), `http://127.0.0.1:4173`
- **Trình duyệt:** Chromium (Playwright 1.64), GV 1280 × 800 (một số ca mở khung cao hơn để kéo-thả), HV 390 × 844 / 360 px
- **Cách chạy:** mỗi test case được viết thành script người dùng (`testing/e2e/TC-###.spec.ts`) theo đúng các bước của test case, chạy thật trên
  trình duyệt; Playwright MCP dùng để quan sát và chẩn đoán các ca hỏng. Lần chạy chính thức: toàn bộ script, **tuần tự (1 worker)**,
  `npx playwright test -c playwright.modules.config.ts --workers=1`.
- **Lưu ý độc lập:** lần QA này chạy trong cùng phiên với lần code module (agent vừa code vừa kiểm). Kịch bản bám test-cases.md và AC; nên có một
  lần chạy lại bởi phiên QA độc lập (`node .sdd/scripts/sdd.mjs run test:modules -- 004`).

## Tóm tắt

**94/101 ca tự động Pass** (E2E + API), 7 Fail, 4 Thủ công (có hướng dẫn trong test-cases.md).
`sdd trace 004`: 118/118 AC có script, không có khoảng trống.

| TC | AC / NFR | Kết quả | Bằng chứng | Ghi chú |
|----|----------|---------|------------|---------|
| TC-001 | AC-1.1, AC-1.8, AC-7.7 | Pass | [TC-001-1.png](screenshots/TC-001-1.png) |  |
| TC-002 | AC-1.1 | Pass | [TC-002-1.png](screenshots/TC-002-1.png) |  |
| TC-003 | AC-1.2, AC-1.3 | Pass | [TC-003-1.png](screenshots/TC-003-1.png) |  |
| TC-004 | AC-1.2, AC-1.3 | Pass | [TC-004-1.png](screenshots/TC-004-1.png) |  |
| TC-005 | AC-1.2 | Pass | [TC-005-1.png](screenshots/TC-005-1.png) [TC-005-2.png](screenshots/TC-005-2.png) |  |
| TC-006 | AC-1.4, AC-2.1 | Pass | [TC-006-1.png](screenshots/TC-006-1.png) |  |
| TC-007 | AC-1.4, AC-2.8 | Pass | [TC-007-1.png](screenshots/TC-007-1.png) |  |
| TC-008 | AC-1.5 | Pass | [TC-008-1.png](screenshots/TC-008-1.png) [TC-008-2.png](screenshots/TC-008-2.png) | T18 (002) chỉ hiện tóm tắt phần, không liệt kê bước: thứ tự kiểm trên T07, T21 và S11. |
| TC-009 | AC-1.5 | Pass | [TC-009-1.png](screenshots/TC-009-1.png) |  |
| TC-010 | AC-1.6 | Pass | [TC-010-1.png](screenshots/TC-010-1.png) |  |
| TC-011 | AC-1.7 | Pass | [TC-011-1.png](screenshots/TC-011-1.png) |  |
| TC-012 | AC-2.1, AC-2.5 | Pass | [TC-012-1.png](screenshots/TC-012-1.png) [TC-012-2.png](screenshots/TC-012-2.png) |  |
| TC-013 | AC-2.2 | Pass | [TC-013-1.png](screenshots/TC-013-1.png) [TC-013-2.png](screenshots/TC-013-2.png) |  |
| TC-014 | AC-2.2, AC-2.6 | Pass | [TC-014-1.png](screenshots/TC-014-1.png) |  |
| TC-015 | AC-2.3 | Pass | [TC-015-1.png](screenshots/TC-015-1.png) [TC-015-2.png](screenshots/TC-015-2.png) |  |
| TC-016 | AC-2.3 | Pass | [TC-016-1.png](screenshots/TC-016-1.png) |  |
| TC-017 | AC-2.4 | Pass | [TC-017-1.png](screenshots/TC-017-1.png) [TC-017-2.png](screenshots/TC-017-2.png) |  |
| TC-018 | AC-2.8, AC-4.4 | Pass | [TC-018-1.png](screenshots/TC-018-1.png) |  |
| TC-019 | AC-2.8 | Pass |  |  |
| TC-020 | AC-3.1 | Pass | [TC-020-1.png](screenshots/TC-020-1.png) [TC-020-2.png](screenshots/TC-020-2.png) |  |
| TC-021 | AC-3.2 | Pass | [TC-021-1.png](screenshots/TC-021-1.png) |  |
| TC-022 | AC-3.3 | Pass | [TC-022-1.png](screenshots/TC-022-1.png) |  |
| TC-023 | AC-3.4 | Pass | [TC-023-1.png](screenshots/TC-023-1.png) |  |
| TC-024 | AC-3.5 | Fail | [TC-024-fail-1.png](screenshots/TC-024-fail-1.png) [TC-024-fail-2.png](screenshots/TC-024-fail-2.png) | Lỗi B1. |
| TC-025 | AC-3.6, NFR-5 | Pass | [TC-025-1.png](screenshots/TC-025-1.png) [TC-025-2.png](screenshots/TC-025-2.png) |  |
| TC-026 | AC-3.7, NFR-6 | Pass | [TC-026-1.png](screenshots/TC-026-1.png) [TC-026-2.png](screenshots/TC-026-2.png) |  |
| TC-027 | AC-4.1 | Pass | [TC-027-1.png](screenshots/TC-027-1.png) [TC-027-2.png](screenshots/TC-027-2.png) |  |
| TC-028 | AC-4.2 | Fail | [TC-028-fail-1.png](screenshots/TC-028-fail-1.png) [TC-028-fail-2.png](screenshots/TC-028-fail-2.png) | Lỗi B1 (Giải thích). |
| TC-029 | AC-4.3 | Pass | [TC-029-1.png](screenshots/TC-029-1.png) [TC-029-2.png](screenshots/TC-029-2.png) |  |
| TC-030 | AC-4.4 | Pass | [TC-030-1.png](screenshots/TC-030-1.png) [TC-030-2.png](screenshots/TC-030-2.png) |  |
| TC-031 | AC-4.5 | Pass | [TC-031-1.png](screenshots/TC-031-1.png) |  |
| TC-032 | AC-4.6 | Pass | [TC-032-1.png](screenshots/TC-032-1.png) |  |
| TC-033 | AC-4.7 | Pass | [TC-033-1.png](screenshots/TC-033-1.png) |  |
| TC-034 | AC-5.1, AC-5.2 | Pass | [TC-034-1.png](screenshots/TC-034-1.png) [TC-034-2.png](screenshots/TC-034-2.png) |  |
| TC-035 | AC-5.3 | Pass | [TC-035-1.png](screenshots/TC-035-1.png) |  |
| TC-036 | AC-5.4 | Pass | [TC-036-1.png](screenshots/TC-036-1.png) |  |
| TC-037 | AC-5.5 | Pass | [TC-037-1.png](screenshots/TC-037-1.png) [TC-037-2.png](screenshots/TC-037-2.png) [TC-037-3.png](screenshots/TC-037-3.png) | Tiền điều kiện 3,2995 GB (thay 3,25 GB) để ảnh 2 MB đổi được con số làm tròn 0,1 GB. |
| TC-038 | AC-5.5, AC-18.1 | Pass |  |  |
| TC-039 | AC-5.6 | Pass | [TC-039-1.png](screenshots/TC-039-1.png) [TC-039-2.png](screenshots/TC-039-2.png) |  |
| TC-040 | AC-5.6 | Pass |  |  |
| TC-041 | AC-5.7 | Pass | [TC-041-1.png](screenshots/TC-041-1.png) [TC-041-2.png](screenshots/TC-041-2.png) |  |
| TC-042 | AC-6.1, AC-6.2 | Pass | [TC-042-1.png](screenshots/TC-042-1.png) [TC-042-2.png](screenshots/TC-042-2.png) |  |
| TC-043 | AC-6.3 | Pass | [TC-043-1.png](screenshots/TC-043-1.png) [TC-043-2.png](screenshots/TC-043-2.png) | Mất kết nối giữa chừng giả lập bằng hủy yêu cầu sau 1,5 s (route abort). |
| TC-044 | AC-6.4 | Pass | [TC-044-1.png](screenshots/TC-044-1.png) |  |
| TC-045 | AC-6.5 | Fail | [TC-045-fail-1.png](screenshots/TC-045-fail-1.png) [TC-045-fail-2.png](screenshots/TC-045-fail-2.png) | Lỗi B2. Trạng thái thoáng qua được ghi bằng MutationObserver. |
| TC-046 | AC-6.6 | Pass | [TC-046-1.png](screenshots/TC-046-1.png) |  |
| TC-047 | AC-6.7 | Pass | [TC-047-1.png](screenshots/TC-047-1.png) [TC-047-2.png](screenshots/TC-047-2.png) |  |
| TC-048 | AC-7.1 | Pass | [TC-048-1.png](screenshots/TC-048-1.png) |  |
| TC-049 | AC-7.1, AC-7.2 | Pass | [TC-049-1.png](screenshots/TC-049-1.png) [TC-049-2.png](screenshots/TC-049-2.png) |  |
| TC-050 | AC-7.1 | Pass |  |  |
| TC-051 | AC-7.3 | Pass | [TC-051-1.png](screenshots/TC-051-1.png) [TC-051-2.png](screenshots/TC-051-2.png) |  |
| TC-052 | AC-7.4 | Pass | [TC-052-1.png](screenshots/TC-052-1.png) [TC-052-2.png](screenshots/TC-052-2.png) |  |
| TC-053 | AC-7.6 | Pass | [TC-053-1.png](screenshots/TC-053-1.png) [TC-053-2.png](screenshots/TC-053-2.png) |  |
| TC-054 | AC-7.7 | Pass | [TC-054-1.png](screenshots/TC-054-1.png) [TC-054-2.png](screenshots/TC-054-2.png) |  |
| TC-055 | AC-7.8 | Pass | [TC-055-1.png](screenshots/TC-055-1.png) |  |
| TC-056 | AC-8.1, AC-8.2 | Pass | [TC-056-1.png](screenshots/TC-056-1.png) [TC-056-2.png](screenshots/TC-056-2.png) |  |
| TC-057 | AC-8.3, AC-8.5 | Pass | [TC-057-1.png](screenshots/TC-057-1.png) [TC-057-2.png](screenshots/TC-057-2.png) |  |
| TC-058 | AC-8.4 | Pass | [TC-058-1.png](screenshots/TC-058-1.png) [TC-058-2.png](screenshots/TC-058-2.png) |  |
| TC-059 | AC-9.1, AC-9.4 | Pass | [TC-059-1.png](screenshots/TC-059-1.png) [TC-059-2.png](screenshots/TC-059-2.png) |  |
| TC-060 | AC-9.2 | Pass | [TC-060-1.png](screenshots/TC-060-1.png) |  |
| TC-061 | AC-9.3 | Pass |  |  |
| TC-062 | AC-9.5 | Pass |  |  |
| TC-063 | AC-9.6 | Pass | [TC-063-1.png](screenshots/TC-063-1.png) |  |
| TC-064 | AC-10.1 | Pass | [TC-064-1.png](screenshots/TC-064-1.png) [TC-064-2.png](screenshots/TC-064-2.png) |  |
| TC-065 | AC-10.2 | Pass | [TC-065-1.png](screenshots/TC-065-1.png) |  |
| TC-066 | AC-10.3 | Pass | [TC-066-1.png](screenshots/TC-066-1.png) [TC-066-2.png](screenshots/TC-066-2.png) |  |
| TC-067 | AC-11.1, AC-11.9 | Fail | [TC-067-fail-1.png](screenshots/TC-067-fail-1.png) [TC-067-fail-2.png](screenshots/TC-067-fail-2.png) | Lỗi B3. |
| TC-068 | AC-11.3 | Pass | [TC-068-1.png](screenshots/TC-068-1.png) [TC-068-2.png](screenshots/TC-068-2.png) |  |
| TC-069 | AC-11.4 | Pass | [TC-069-1.png](screenshots/TC-069-1.png) |  |
| TC-070 | AC-11.5 | Pass | [TC-070-1.png](screenshots/TC-070-1.png) [TC-070-2.png](screenshots/TC-070-2.png) |  |
| TC-071 | AC-11.6, AC-11.7 | Pass | [TC-071-1.png](screenshots/TC-071-1.png) [TC-071-2.png](screenshots/TC-071-2.png) |  |
| TC-072 | AC-12.1 | Pass | [TC-072-1.png](screenshots/TC-072-1.png) |  |
| TC-073 | AC-12.2 | Pass | [TC-073-1.png](screenshots/TC-073-1.png) |  |
| TC-074 | AC-12.3, AC-12.4 | Pass | [TC-074-1.png](screenshots/TC-074-1.png) [TC-074-2.png](screenshots/TC-074-2.png) |  |
| TC-075 | AC-12.5, AC-12.6 | Pass | [TC-075-1.png](screenshots/TC-075-1.png) [TC-075-2.png](screenshots/TC-075-2.png) |  |
| TC-076 | AC-13.1 | Pass | [TC-076-1.png](screenshots/TC-076-1.png) |  |
| TC-077 | AC-13.2, AC-13.4, NFR-6 | Fail | [TC-077-fail-1.png](screenshots/TC-077-fail-1.png) [TC-077-fail-2.png](screenshots/TC-077-fail-2.png) | Lỗi B4 (HV ngoài lớp). Các điều kiện còn lại đạt (kiểm mềm). |
| TC-078 | AC-13.3 | Pass | [TC-078-1.png](screenshots/TC-078-1.png) |  |
| TC-079 | AC-13.4, AC-13.7 | Pass | [TC-079-1.png](screenshots/TC-079-1.png) [TC-079-2.png](screenshots/TC-079-2.png) |  |
| TC-080 | AC-13.5 | Fail | [TC-080-1.png](screenshots/TC-080-1.png) [TC-080-2.png](screenshots/TC-080-2.png) [TC-080-3.png](screenshots/TC-080-3.png) | Lỗi B5 (kịch bản 1). Kịch bản 2 ẩn cả Bài (cả hai phần) để Bài không còn mở được; kịch bản 2 và 3 đạt. |
| TC-081 | AC-13.6 | Pass | [TC-081-1.png](screenshots/TC-081-1.png) [TC-081-2.png](screenshots/TC-081-2.png) |  |
| TC-082 | AC-13.8 | Pass | [TC-082-1.png](screenshots/TC-082-1.png) [TC-082-2.png](screenshots/TC-082-2.png) |  |
| TC-083 | AC-14.1, AC-14.7, AC-14.8 | Pass | [TC-083-1.png](screenshots/TC-083-1.png) [TC-083-2.png](screenshots/TC-083-2.png) |  |
| TC-084 | AC-14.2, AC-14.3 | Pass | [TC-084-1.png](screenshots/TC-084-1.png) [TC-084-2.png](screenshots/TC-084-2.png) |  |
| TC-085 | AC-14.4 | Pass | [TC-085-1.png](screenshots/TC-085-1.png) |  |
| TC-086 | AC-14.5 | Pass | [TC-086-1.png](screenshots/TC-086-1.png) |  |
| TC-087 | AC-14.6 | Pass | [TC-087-1.png](screenshots/TC-087-1.png) [TC-087-2.png](screenshots/TC-087-2.png) |  |
| TC-088 | AC-15.1, AC-15.2, AC-15.3, AC-15.4 | Pass | [TC-088-1.png](screenshots/TC-088-1.png) [TC-088-2.png](screenshots/TC-088-2.png) |  |
| TC-089 | AC-16.1, AC-16.2, AC-16.3, AC-16.4 | Pass | [TC-089-1.png](screenshots/TC-089-1.png) [TC-089-2.png](screenshots/TC-089-2.png) | Lần chạy song song đầu hỏng do thời gian tải ảnh; chạy lại 1 lần đạt (cho phép theo quy trình). |
| TC-090 | AC-16.5, AC-16.7, AC-17.1, AC-17.2, AC-17.3, AC-17.4, NFR-6 | Pass | [TC-090-1.png](screenshots/TC-090-1.png) [TC-090-2.png](screenshots/TC-090-2.png) |  |
| TC-091 | AC-16.6, AC-17.5 | Pass | [TC-091-1.png](screenshots/TC-091-1.png) [TC-091-2.png](screenshots/TC-091-2.png) |  |
| TC-092 | AC-18.1, AC-18.2, AC-18.3 | Pass | [TC-092-1.png](screenshots/TC-092-1.png) [TC-092-2.png](screenshots/TC-092-2.png) [TC-092-3.png](screenshots/TC-092-3.png) |  |
| TC-093 | AC-19.1, AC-19.3 | Pass |  |  |
| TC-094 | AC-19.2, AC-19.3 | Pass |  |  |
| TC-095 | AC-19.4, NFR-4 | Pass |  |  |
| TC-096 | AC-19.5 | Pass | [TC-096-1.png](screenshots/TC-096-1.png) |  |
| TC-097 | AC-19.6 | Pass |  |  |
| TC-098 | NFR-1, NFR-2 | Pass | [TC-098-1.png](screenshots/TC-098-1.png) | Đo trên 4G mô phỏng + CPU chậm 4×. Số đo: `{"open":2958,"next":518,"toggle":19.09999990463257,"playStart":11.299999952316284,"flip":12.5,"markSaved":221}` |
| TC-099 | NFR-3 | Fail | [TC-099-1.png](screenshots/TC-099-1.png) [TC-099-fail-1.png](screenshots/TC-099-fail-1.png) [TC-099-fail-2.png](screenshots/TC-099-fail-2.png) | Lỗi B6 (hiệu năng, sát ngưỡng). Số đo: `{"openMs":2555,"tabMs":907,"typing":69.60000002384186,"excelMs":666,"approveMs":29}` |
| TC-100 | NFR-7 | Pass | [TC-100-1.png](screenshots/TC-100-1.png) [TC-100-2.png](screenshots/TC-100-2.png) |  |
| TC-101 | — | Thủ công | — | NFR-7 — cần người: WCAG AA, vùng chạm, phóng 200% với trình đọc màn hình trên điện thoại thật. |
| TC-102 | — | Thủ công | — | NFR-5 — cần thiết bị thật: Chrome Android, Safari iOS 16+, Edge/Safari desktop. |
| TC-103 | — | Thủ công | — | NFR-8 — cần đọc nhật ký API ở mức info (server e2e chạy LOG_LEVEL=warn). |
| TC-104 | NFR-6 | Pass |  |  |
| TC-105 | — | Thủ công | — | NFR-3/4 — cần mạng thật 20 Mbps, tệp 500 MB, 20 lần. |

## Lỗi tìm thấy

### B1 — Đậm, nghiêng, gạch chân (và màu chữ gõ sau chữ đậm) bị mất khi lưu · TC-024, TC-028 · AC-3.5, AC-4.2
- **Bước:** T07 → khối Văn bản (hoặc "Giải thích" của Ngữ pháp) → chọn chữ → "Đậm" (hoặc "Nghiêng", "Gạch chân") → "Lưu nháp"/"Xuất bản".
- **Mong đợi:** nội dung lưu giữ `<b>`, `<i>`, `<u>`; S03 hiển thị đúng định dạng.
- **Thực tế:** trình soạn tạo `<span style="font-weight: bold;">…</span>` (đậm), `<span style="font-style: italic;">` (nghiêng); chữ màu gõ
  sau chữ đậm thành `<span style="font-weight: bold; color: rgb(220, 38, 38);">`. `sanitizeRichText` chỉ giữ span có duy nhất màu trong bảng →
  bỏ hết; nội dung lưu chỉ còn `<p>Chữ đậm</p>`. Quan sát trực tiếp bằng Playwright MCP (innerHTML sau khi bấm "Đậm").
- **Nguyên nhân khả dĩ:** `RichTextEditor` gọi `execCommand('styleWithCSS', false, 'true')` trước mọi lệnh. Tiêu đề, danh sách, liên kết,
  màu (khi chữ không đậm) vẫn đúng.
- **Bằng chứng:** screenshots/TC-024-fail-1.png, TC-028-fail-1.png; results.json.

### B2 — "Đang xử lý…" khóa cả "Lưu nháp" · TC-045 · AC-6.5
- **Bước:** khối Tài liệu, mạng chậm, chọn PDF 20 MB; khi thanh tiến độ đạt 100 % khối hiện "Đang xử lý…".
- **Mong đợi:** trong lúc "Đang xử lý…": "Xuất bản" bị vô hiệu, **"Lưu nháp" vẫn bấm được**.
- **Thực tế:** cả "Lưu nháp" và "Xuất bản" đều bị vô hiệu (bản ghi trạng thái: `{ publishDisabled: true, saveDisabled: true }`) vì bước được
  coi là "đang tải" cả ở pha xử lý.

### B3 — Hộp thoại T08 có thêm nút "Đóng" · TC-067 · AC-11.1
- **Mong đợi:** T08 có **chỉ một** nút đóng "Xong".
- **Thực tế:** đầu hộp thoại có nút biểu tượng "Đóng" (X) của khung Dialog dùng chung, ngoài nút "Xong" (screenshots/TC-067-fail-1.png).

### B4 — HV không thuộc lớp nhận thông báo của 003 thay vì A05 · TC-077 · AC-13.4
- **Bước:** HV khác (không trong lớp) mở bước học của lớp (đường dẫn trực tiếp / API `GET /api/learn/classes/<lớp>/steps/<bước>`).
- **Mong đợi (AC-13.4):** 404 và A05 "Không tìm thấy nội dung bạn yêu cầu.", không tiết lộ gì.
- **Thực tế:** 404 `CLASS_NOT_MEMBER` "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" (S03 chuyển về S01 kèm thông báo). Không lộ nội dung.
- **Ghi chú cho agent spec:** câu này là quy tắc của 003 (AC-14.5) cho người không thuộc lớp; 004 AC-13.4 yêu cầu A05 — hai spec cần thống nhất
  trước khi sửa.

### B5 — Bước đang xem bị lưu trữ: "Tiếp" vẫn mở bước sau · TC-080 · AC-13.5
- **Bước:** HV ở S03 bước 1 (có bước 2); GV lưu trữ bước 1; HV bấm "Tiếp".
- **Mong đợi:** thao tác không được ghi nhận, hiện "Bước học này hiện không còn khả dụng." và về S11 của Bài.
- **Thực tế:** S03 mở bước 2 bình thường, không có thông báo (URL `/buoc/<bước 2>`). Hai kịch bản còn lại (ẩn Bài khi ở S04 → S02; bị gỡ khỏi
  lớp → S01) đúng.

### B6 — T07 với 30 bước / 300 khối mở chậm hơn 2 s · TC-099 · NFR-3
- **Số đo thời gian tới khi bước 30 sửa được:** 2 555 ms (lần chạy chính thức, tuần tự), 1 745 ms (chạy riêng), 3 049 ms (chạy song song 2 ca).
  Mục tiêu ≤ 2 000 ms (p95) — không đạt ổn định. Các số khác đạt: đổi tab 907 ms, gõ 70 ms, Excel 200 dòng 666 ms, duyệt 15/30 bước 29 ms (API).
- S03 (TC-098) đạt nhưng sát ngưỡng: mở bước 2 958 ms (≤ 3 000 ms) trên 4G mô phỏng + CPU 4×.

## Vấn đề công cụ (không thuộc ứng dụng)

- `scripts/replay-module-tests.mjs` với **nhiều** TC trên Windows: bộ lọc `TC-008\b|TC-009\b` truyền qua `shell: true` nên `|` bị cmd hiểu là
  pipe ("The system cannot find the path specified."). Chạy cả module (không lọc) hoặc một TC thì ổn.
- Các script dùng chung workspace dev; ca về dung lượng (TC-037–042, 056, 062, 092) tạo GV mới (A02) để có workspace riêng. Ca hiệu năng cần
  chạy tuần tự.
