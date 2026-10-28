# QA run 005 — 2026-10-28-1452

- **Ngày:** 2026-10-28 14:52 (giờ Việt Nam) · **Commit:** 25e2d28 (feat/005-exercises) · **Người chạy:** /test-module 005
- **Máy chủ:** `tests/e2e/server.mjs` (bản build, MongoDB trong bộ nhớ, NODE_ENV=test, seed "Workspace của Cô Lan"), `http://127.0.0.1:4173`.
  Lần chạy chính thức bắt đầu trên cơ sở dữ liệu sạch (máy chủ khởi động lại). TC-122 tự dựng thêm một máy chủ hermetic cổng 4174 với
  `LOG_LEVEL=info` (máy chủ e2e ép `warn`) để đọc log.
- **Trình duyệt:** Chromium (Playwright), GV 1280 × 800, HV 390 × 844 (TC-119: 360 / 430 px; TC-110: múi giờ America/Bogota).
- **Cách chạy:** mỗi test case được viết thành script người dùng (`testing/e2e/TC-###.spec.ts`, dữ liệu dựng sẵn qua API như cột "Tiền điều
  kiện", thao tác qua vai trò / nhãn trên màn hình) và chạy thật trên trình duyệt. Lần chạy chính thức: toàn bộ 124 script, **tuần tự
  (1 worker)**: `npx playwright test -c playwright.modules.config.ts --workers=1` (102 Pass trong 10,9 phút); TC-073 và TC-118 chạy lại
  1 lần (xem bảng). Chạy lại không cần AI: `node .sdd/scripts/sdd.mjs run test:modules -- 005` (TC-115 / TC-118 tạo 100 HV trong
  workspace riêng; TC-118 dựng 5 000 bài nộp, ~3–4 phút).
- **Playwright MCP không dùng được trong phiên này:** hồ sơ trình duyệt `mcp-chrome-7c84bcd` đang bị một Chrome của phiên `/module 005`
  trước giữ (lỗi "Browser is already in use"), và lệnh đóng tiến trình đó bị từ chối quyền. Mọi ca vì vậy chạy bằng script Playwright trên
  Chromium thật (giống cách QA 004 chạy), quan sát bằng ảnh chụp và error-context của Playwright thay cho `browser_snapshot`.
- **Thứ tự / phụ thuộc:** các ca độc lập (mỗi ca tạo giáo trình, lớp riêng); dùng chung 3 HV seed, vì vậy các ca chạy tuần tự. TC-109,
  TC-110, TC-125 dời đồng hồ máy chủ và đặt lại khi kết thúc. TC-027, TC-028, TC-115, TC-118 dùng workspace GV riêng.

## Tóm tắt

**104/125 ca tự động Pass** (E2E + API), **20 Fail**, **1 Bị chặn** (TC-102 — chờ 006), **4 Thủ công** (TC-126 … TC-129, hướng dẫn trong
test-cases.md). `sdd trace 005`: mọi AC có script trừ **AC-20.7** (TC-102, 006 chưa xây).

Lỗi gom thành 16 mã (B1–B16) ở cuối báo cáo. Nghiêm trọng nhất cho người dùng: B9 (định dạng điểm "7,0 / 12,0" trên S06, T14), B11 (GV không
thêm được đáp án chấp nhận cho bộ đã có bài nộp), B5 (S06 không cho kết quả từng chỗ trống / cặp), B7 (tab cũ "Tiếp tục làm" sau khi đã nộp),
B16 (đổi tab 1,3 s), B15 (duyệt AI 30 × 100 câu bị 413). B1/B2 là xung đột giữa hành vi 003 (đưa HV về S01) và yêu cầu A05 của 005 — cùng
loại với B4 của QA 004.

| TC | AC / NFR | Kết quả | Bằng chứng | Ghi chú |
|----|----------|---------|------------|---------|
| TC-001 | AC-1.1, AC-1.8 | Pass | [TC-001-1.png](screenshots/TC-001-1.png) |  |
| TC-002 | AC-1.1 | Pass | [TC-002-1.png](screenshots/TC-002-1.png) |  |
| TC-003 | AC-1.2 | Pass | [TC-003-1.png](screenshots/TC-003-1.png) [TC-003-2.png](screenshots/TC-003-2.png) |  |
| TC-004 | AC-1.3 | Pass | [TC-004-1.png](screenshots/TC-004-1.png) |  |
| TC-005 | AC-1.4 | Pass | [TC-005-1.png](screenshots/TC-005-1.png) | Xóa bước học trả 200 (không phải 204); `content.stepId` về null đúng. |
| TC-006 | AC-1.5 | Pass | [TC-006-1.png](screenshots/TC-006-1.png) [TC-006-2.png](screenshots/TC-006-2.png) |  |
| TC-007 | AC-1.6 | Pass | [TC-007-1.png](screenshots/TC-007-1.png) [TC-007-2.png](screenshots/TC-007-2.png) |  |
| TC-008 | AC-1.7 | Pass | [TC-008-1.png](screenshots/TC-008-1.png) |  |
| TC-009 | AC-1.9, AC-1.12 | Pass | [TC-009-1.png](screenshots/TC-009-1.png) [TC-009-2.png](screenshots/TC-009-2.png) |  |
| TC-010 | AC-1.10 | Pass | [TC-010-1.png](screenshots/TC-010-1.png) [TC-010-2.png](screenshots/TC-010-2.png) |  |
| TC-011 | AC-1.11 | Pass | [TC-011-1.png](screenshots/TC-011-1.png) |  |
| TC-012 | AC-1.13, AC-21.2 | Fail | [TC-012-1.png](screenshots/TC-012-1.png) [TC-012-2.png](screenshots/TC-012-2.png) [TC-012-3.png](screenshots/TC-012-3.png) | B1 — HV mở đường dẫn T09 bị chuyển về S01 "Lớp của tôi" thay vì A05 (không lộ nội dung). (1), (2) đạt. |
| TC-013 | AC-1.14, AC-12.10 | Pass | [TC-013-1.png](screenshots/TC-013-1.png) |  |
| TC-014 | AC-1.15 | Pass | [TC-014-1.png](screenshots/TC-014-1.png) |  |
| TC-015 | AC-1.8 | Pass | [TC-015-1.png](screenshots/TC-015-1.png) |  |
| TC-016 | AC-2.1, AC-2.3 | Pass | [TC-016-1.png](screenshots/TC-016-1.png) [TC-016-2.png](screenshots/TC-016-2.png) |  |
| TC-017 | AC-2.2 | Pass | [TC-017-1.png](screenshots/TC-017-1.png) |  |
| TC-018 | AC-2.4, AC-2.6, AC-12.14 | Pass | [TC-018-1.png](screenshots/TC-018-1.png) |  |
| TC-019 | AC-2.5 | Fail | [TC-019-1.png](screenshots/TC-019-1.png) | B3 — API từ chối 101 câu bằng 400 VALIDATION_ERROR, test case ghi 422. Phần T09 đạt. |
| TC-020 | AC-2.6, AC-12.2 | Pass | [TC-020-1.png](screenshots/TC-020-1.png) [TC-020-2.png](screenshots/TC-020-2.png) |  |
| TC-021 | AC-2.6, AC-10.2 | Pass | [TC-021-1.png](screenshots/TC-021-1.png) |  |
| TC-022 | AC-2.7, AC-12.1 | Pass | [TC-022-1.png](screenshots/TC-022-1.png) [TC-022-2.png](screenshots/TC-022-2.png) |  |
| TC-023 | AC-3.1 | Pass | [TC-023-1.png](screenshots/TC-023-1.png) |  |
| TC-024 | AC-3.2 | Pass | [TC-024-1.png](screenshots/TC-024-1.png) [TC-024-2.png](screenshots/TC-024-2.png) |  |
| TC-025 | AC-3.3 | Pass | [TC-025-1.png](screenshots/TC-025-1.png) [TC-025-2.png](screenshots/TC-025-2.png) |  |
| TC-026 | AC-3.4 | Pass | [TC-026-1.png](screenshots/TC-026-1.png) [TC-026-2.png](screenshots/TC-026-2.png) |  |
| TC-027 | AC-3.5 | Pass | [TC-027-1.png](screenshots/TC-027-1.png) |  |
| TC-028 | AC-3.6 | Pass | [TC-028-1.png](screenshots/TC-028-1.png) [TC-028-2.png](screenshots/TC-028-2.png) |  |
| TC-029 | AC-4.1 | Fail | [TC-029-1.png](screenshots/TC-029-1.png) [TC-029-2.png](screenshots/TC-029-2.png) | B4 — Ở 6 phương án, "Thêm phương án" bị vô hiệu nhưng không có "Câu trắc nghiệm cần từ 2 đến 6 phương án". Xóa ở 2 phương án có lý do (title). Các phần khác đạt. |
| TC-030 | AC-4.2, AC-4.3, AC-4.4 | Pass | [TC-030-1.png](screenshots/TC-030-1.png) |  |
| TC-031 | AC-4.5, AC-4.7 | Pass | [TC-031-1.png](screenshots/TC-031-1.png) [TC-031-2.png](screenshots/TC-031-2.png) |  |
| TC-032 | AC-4.6, AC-4.8 | Pass | [TC-032-1.png](screenshots/TC-032-1.png) [TC-032-2.png](screenshots/TC-032-2.png) |  |
| TC-033 | AC-5.1 | Pass | [TC-033-1.png](screenshots/TC-033-1.png) |  |
| TC-034 | AC-5.2, AC-5.3, AC-5.4 | Pass | [TC-034-1.png](screenshots/TC-034-1.png) |  |
| TC-035 | AC-5.5 | Pass | [TC-035-1.png](screenshots/TC-035-1.png) [TC-035-2.png](screenshots/TC-035-2.png) |  |
| TC-036 | AC-6.1, AC-6.2 | Pass | [TC-036-1.png](screenshots/TC-036-1.png) |  |
| TC-037 | AC-6.3 | Pass | [TC-037-1.png](screenshots/TC-037-1.png) |  |
| TC-038 | AC-6.4, AC-6.5 | Fail | [TC-038-1.png](screenshots/TC-038-1.png) [TC-038-2.png](screenshots/TC-038-2.png) | B5 — S06 không có kết quả theo từng chỗ trống (AC-16.3): chỉ "Đúng một phần" của câu + "(2) 中国; (3) —". Phần làm bài, chấm điểm đạt. |
| TC-039 | AC-7.1, AC-7.2, AC-7.3 | Pass |  | Chấm theo từng ô kiểm bằng điểm 1, 2, 4, 8, 16, 32 (API không trả kết quả từng ô — xem B5). |
| TC-040 | AC-7.4 | Pass | [TC-040-1.png](screenshots/TC-040-1.png) |  |
| TC-041 | AC-7.5 | Pass | [TC-041-1.png](screenshots/TC-041-1.png) [TC-041-2.png](screenshots/TC-041-2.png) |  |
| TC-042 | AC-8.1, AC-8.2 | Fail | [TC-042-1.png](screenshots/TC-042-1.png) [TC-042-2.png](screenshots/TC-042-2.png) | B4 — Ở 8 cặp, "Thêm cặp" bị vô hiệu nhưng không có "Câu nối cặp cần từ 2 đến 8 cặp". Các lỗi khác đạt. |
| TC-043 | AC-8.3 | Pass | [TC-043-1.png](screenshots/TC-043-1.png) |  |
| TC-044 | AC-8.4, AC-14.7 | Pass | [TC-044-1.png](screenshots/TC-044-1.png) [TC-044-2.png](screenshots/TC-044-2.png) |  |
| TC-045 | AC-8.5, AC-8.6 | Pass | [TC-045-1.png](screenshots/TC-045-1.png) [TC-045-2.png](screenshots/TC-045-2.png) |  |
| TC-046 | AC-8.7 | Pass |  |  |
| TC-047 | AC-9.1, AC-9.2, AC-9.3 | Pass | [TC-047-1.png](screenshots/TC-047-1.png) [TC-047-2.png](screenshots/TC-047-2.png) |  |
| TC-048 | AC-9.4, AC-9.5, AC-9.6 | Pass | [TC-048-1.png](screenshots/TC-048-1.png) [TC-048-2.png](screenshots/TC-048-2.png) |  |
| TC-049 | AC-9.7 | Pass |  |  |
| TC-050 | AC-10.1, AC-10.3 | Pass | [TC-050-1.png](screenshots/TC-050-1.png) |  |
| TC-051 | AC-10.4 | Fail | [TC-051-1.png](screenshots/TC-051-1.png) | B6 — S05 hiện "Nghĩa: xin chào", test case/AC-10.4: "Nghĩa gợi ý: xin chào". Phần còn lại đạt. |
| TC-052 | AC-10.5 | Pass |  |  |
| TC-053 | AC-11.1, AC-11.2 | Pass | [TC-053-1.png](screenshots/TC-053-1.png) [TC-053-2.png](screenshots/TC-053-2.png) |  |
| TC-054 | AC-11.3, AC-11.4 | Pass | [TC-054-1.png](screenshots/TC-054-1.png) [TC-054-2.png](screenshots/TC-054-2.png) |  |
| TC-055 | AC-11.5 | Pass |  |  |
| TC-056 | AC-12.3, AC-12.4, AC-12.8 | Pass | [TC-056-1.png](screenshots/TC-056-1.png) [TC-056-2.png](screenshots/TC-056-2.png) [TC-056-3.png](screenshots/TC-056-3.png) | Hạn nộp chỉ đặt được cho bộ đã xuất bản (003): đặt hạn sau bước 2. |
| TC-057 | AC-12.5, AC-12.6 | Pass | [TC-057-1.png](screenshots/TC-057-1.png) [TC-057-2.png](screenshots/TC-057-2.png) |  |
| TC-058 | AC-12.7 | Pass | [TC-058-1.png](screenshots/TC-058-1.png) |  |
| TC-059 | AC-12.9 | Pass | [TC-059-1.png](screenshots/TC-059-1.png) |  |
| TC-060 | AC-12.11 | Pass | [TC-060-1.png](screenshots/TC-060-1.png) |  |
| TC-061 | AC-13.1, AC-13.8, AC-13.10 | Pass | [TC-061-1.png](screenshots/TC-061-1.png) [TC-061-2.png](screenshots/TC-061-2.png) |  |
| TC-062 | AC-13.2, AC-13.3 | Pass |  |  |
| TC-063 | AC-13.4 | Pass |  |  |
| TC-064 | AC-13.5 | Pass | [TC-064-1.png](screenshots/TC-064-1.png) |  |
| TC-065 | AC-13.6, AC-13.7 | Pass | [TC-065-1.png](screenshots/TC-065-1.png) |  |
| TC-066 | AC-13.9, AC-13.11 | Pass |  |  |
| TC-067 | AC-13.12 | Pass |  |  |
| TC-068 | AC-14.1 | Pass | [TC-068-1.png](screenshots/TC-068-1.png) [TC-068-2.png](screenshots/TC-068-2.png) |  |
| TC-069 | AC-14.2, AC-14.3 | Pass | [TC-069-1.png](screenshots/TC-069-1.png) |  |
| TC-070 | AC-14.4 | Pass | [TC-070-1.png](screenshots/TC-070-1.png) |  |
| TC-071 | AC-14.5 | Pass | [TC-071-1.png](screenshots/TC-071-1.png) [TC-071-2.png](screenshots/TC-071-2.png) |  |
| TC-072 | AC-14.6 | Pass | [TC-072-1.png](screenshots/TC-072-1.png) |  |
| TC-073 | AC-14.7, NFR-3 | Pass | [TC-073-1.png](screenshots/TC-073-1.png) [TC-073-2.png](screenshots/TC-073-2.png) | Lần chạy chính thức đỏ do script đọc Cột B trước khi hiển thị (lỗi script, đã sửa: chờ 3 mục); chạy lại 1 lần: Pass. |
| TC-074 | AC-14.8, NFR-3 | Pass |  |  |
| TC-075 | AC-14.9, AC-17.7 | Fail | [TC-075-1.png](screenshots/TC-075-1.png) [TC-075-2.png](screenshots/TC-075-2.png) | B7 — Tab C còn "Tiếp tục làm": bấm vào thì vào lại lượt làm cũ, không hiện "Bài đã nộp — mỗi bộ bài tập chỉ làm một lần" (AC-17.7). Tab B: lưu bị từ chối đúng thông điệp + "Xem lại bài làm"; "Nộp bài" bị vô hiệu. |
| TC-076 | AC-15.1 | Pass | [TC-076-1.png](screenshots/TC-076-1.png) [TC-076-2.png](screenshots/TC-076-2.png) |  |
| TC-077 | AC-15.2 | Pass | [TC-077-1.png](screenshots/TC-077-1.png) |  |
| TC-078 | AC-15.3 | Pass | [TC-078-1.png](screenshots/TC-078-1.png) |  |
| TC-079 | AC-15.4 | Pass | [TC-079-1.png](screenshots/TC-079-1.png) [TC-079-2.png](screenshots/TC-079-2.png) |  |
| TC-080 | AC-15.5, NFR-3 | Fail |  | B8 — 3 lần nộp song song cùng submitKey: 1 × 200, 2 × 409 ALREADY_SUBMITTED. Đúng 1 bài nộp được ghi nhận. |
| TC-081 | AC-16.1, AC-17.6 | Pass | [TC-081-1.png](screenshots/TC-081-1.png) |  |
| TC-082 | AC-16.2, AC-16.3, AC-16.4 | Fail | [TC-082-1.png](screenshots/TC-082-1.png) [TC-082-2.png](screenshots/TC-082-2.png) | B9 — Điểm hiện "7,0 / 12,0 điểm (58%)" thay vì "7 / 12 điểm (58%)". Mọi phần khác của S06 đạt. |
| TC-083 | AC-16.2 | Fail | [TC-083-1.png](screenshots/TC-083-1.png) [TC-083-2.png](screenshots/TC-083-2.png) | B9 — "0,5 / 3,0 điểm (17%)" và "5,0 / 8,0 điểm (63%)": phần trăm đúng, định dạng điểm sai. |
| TC-084 | AC-16.5, NFR-9 | Pass | [TC-084-1.png](screenshots/TC-084-1.png) |  |
| TC-085 | AC-16.6 | Pass | [TC-085-1.png](screenshots/TC-085-1.png) |  |
| TC-086 | AC-17.1, AC-17.2 | Pass |  |  |
| TC-087 | AC-17.3, AC-17.5 | Pass | [TC-087-1.png](screenshots/TC-087-1.png) [TC-087-2.png](screenshots/TC-087-2.png) [TC-087-3.png](screenshots/TC-087-3.png) [TC-087-4.png](screenshots/TC-087-4.png) [TC-087-5.png](screenshots/TC-087-5.png) |  |
| TC-088 | AC-17.6 | Fail |  | B10 — Sau "Bắt đầu làm" (chưa trả lời) trạng thái S05 và S11 vẫn "Chưa làm" (máy chủ chỉ tính "Đang làm" khi đã có câu trả lời). Nộp, chấm lại, đổi hạn: đạt. |
| TC-089 | AC-18.1, AC-18.2 | Pass | [TC-089-1.png](screenshots/TC-089-1.png) |  |
| TC-090 | AC-18.3 | Pass | [TC-090-1.png](screenshots/TC-090-1.png) [TC-090-2.png](screenshots/TC-090-2.png) |  |
| TC-091 | AC-18.4 | Pass | [TC-091-1.png](screenshots/TC-091-1.png) |  |
| TC-092 | AC-18.5 | Pass | [TC-092-1.png](screenshots/TC-092-1.png) |  |
| TC-093 | AC-18.6 | Pass | [TC-093-1.png](screenshots/TC-093-1.png) |  |
| TC-094 | AC-18.7 | Pass | [TC-094-1.png](screenshots/TC-094-1.png) |  |
| TC-095 | AC-19.1 | Fail | [TC-095-1.png](screenshots/TC-095-1.png) [TC-095-2.png](screenshots/TC-095-2.png) | B11 — Bộ có bài nộp: "Thêm đáp án" của chỗ trống bị vô hiệu (khóa cấu trúc) nên GV không thêm được "shì" trên T09. Qua API: lưu được, không hỏi chấm lại, S06 không ghi chú. |
| TC-096 | AC-19.2, AC-19.3 | Pass | [TC-096-1.png](screenshots/TC-096-1.png) [TC-096-2.png](screenshots/TC-096-2.png) |  |
| TC-097 | AC-19.4, AC-19.5 | Pass | [TC-097-1.png](screenshots/TC-097-1.png) [TC-097-2.png](screenshots/TC-097-2.png) |  |
| TC-098 | AC-19.6 | Pass | [TC-098-1.png](screenshots/TC-098-1.png) | Khối bộ hiện "Đang chấm lại 0/201 bài nộp…" (x không tăng — chấm lại trong cùng request, theo plan.md); bài nộp mới được chấm theo đáp án mới. |
| TC-099 | AC-20.1, AC-20.2, AC-20.3 | Pass | [TC-099-1.png](screenshots/TC-099-1.png) [TC-099-2.png](screenshots/TC-099-2.png) |  |
| TC-100 | AC-20.5, NFR-9 | Fail | [TC-100-1.png](screenshots/TC-100-1.png) [TC-100-2.png](screenshots/TC-100-2.png) | B1 — HV mở đường dẫn T14 bị chuyển về S01 thay vì A05. GV khác, HV không có bài nộp: A05; chưa đăng nhập: A01. |
| TC-101 | AC-20.6 | Pass | [TC-101-1.png](screenshots/TC-101-1.png) [TC-101-2.png](screenshots/TC-101-2.png) |  |
| TC-102 | AC-20.7 | Bị chặn |  | 006 (Bài thi, T16) chưa được xây — không có bài nộp bài thi để mở T14. |
| TC-103 | AC-21.1, AC-21.3 | Fail | [TC-103-1.png](screenshots/TC-103-1.png) [TC-103-2.png](screenshots/TC-103-2.png) [TC-103-3.png](screenshots/TC-103-3.png) [TC-103-4.png](screenshots/TC-103-4.png) | B2 — HV ngoài lớp mở S05 / S06: chuyển về S01 + "Bạn không thuộc lớp này…" (hành vi 003) thay vì A05. Bài Nháp: A05; lớp chưa bắt đầu: thông báo 003. Không lộ nội dung. |
| TC-104 | AC-21.4, AC-21.5, AC-21.7 | Pass | [TC-104-1.png](screenshots/TC-104-1.png) [TC-104-2.png](screenshots/TC-104-2.png) |  |
| TC-105 | AC-21.6 | Fail | [TC-105-1.png](screenshots/TC-105-1.png) [TC-105-2.png](screenshots/TC-105-2.png) [TC-105-3.png](screenshots/TC-105-3.png) [TC-105-4.png](screenshots/TC-105-4.png) | B2 — Gỡ HV khỏi lớp: "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" thay vì thông điệp AC-21.6. Ẩn phần, lưu trữ, kết thúc lớp: đạt; câu 1 còn nguyên khi khôi phục. |
| TC-106 | AC-21.8 | Pass | [TC-106-1.png](screenshots/TC-106-1.png) [TC-106-2.png](screenshots/TC-106-2.png) |  |
| TC-107 | AC-22.1, AC-22.2 | Pass | [TC-107-1.png](screenshots/TC-107-1.png) [TC-107-2.png](screenshots/TC-107-2.png) |  |
| TC-108 | AC-22.3, AC-22.4, AC-22.5, AC-22.6 | Pass | [TC-108-1.png](screenshots/TC-108-1.png) [TC-108-2.png](screenshots/TC-108-2.png) [TC-108-3.png](screenshots/TC-108-3.png) [TC-108-4.png](screenshots/TC-108-4.png) |  |
| TC-109 | AC-23.1, AC-23.2 | Pass | [TC-109-1.png](screenshots/TC-109-1.png) | Đồng hồ máy chủ dời qua /api/dev/clock (đặt lại sau ca). |
| TC-110 | AC-23.3, AC-23.6 | Pass | [TC-110-1.png](screenshots/TC-110-1.png) [TC-110-2.png](screenshots/TC-110-2.png) [TC-110-3.png](screenshots/TC-110-3.png) | Trình duyệt múi giờ America/Bogota (UTC−5); đồng hồ máy chủ dời qua /api/dev/clock. |
| TC-111 | AC-23.5 | Pass | [TC-111-1.png](screenshots/TC-111-1.png) [TC-111-2.png](screenshots/TC-111-2.png) |  |
| TC-112 | AC-23.7, AC-23.8 | Pass | [TC-112-1.png](screenshots/TC-112-1.png) |  |
| TC-113 | AC-23.9, AC-23.11 | Pass | [TC-113-1.png](screenshots/TC-113-1.png) [TC-113-2.png](screenshots/TC-113-2.png) |  |
| TC-114 | AC-23.10 | Pass | [TC-114-1.png](screenshots/TC-114-1.png) |  |
| TC-115 | NFR-1 | Pass |  | 100 HV nộp bộ 100 câu trong 2,1 s; submit + review p95 272 ms (≤ 2 s). Workspace riêng, 100 HV kích hoạt qua API 001. |
| TC-116 | NFR-2 | Pass | [TC-116-1.png](screenshots/TC-116-1.png) [TC-116-2.png](screenshots/TC-116-2.png) | 10 Mbps / 100 ms: S05 tới câu đầu p95 1 322 ms (≤ 3 s); T14 bài nộp 100 câu p95 1 090 ms (≤ 2 s). |
| TC-117 | NFR-4 | Fail |  | B12 — Bộ ca chuẩn chỉ có 72 ca (Vitest), NFR-4 cần ≥ 400 ca chấm (≥ 150 ca pinyin). 72/72 và 20/20 mẫu qua API đúng. |
| TC-118 | NFR-5 | Pass |  | Chấm lại 5 000 bài nộp: 2 101–2 412 ms; 5 020 bài nộp đủ, mỗi HV một lần, đều theo đáp án mới. Lần chạy chính thức đứt kết nối (ECONNRESET, máy chủ in-memory sau ~120 ca) lúc tạo dữ liệu; chạy lại 1 lần: Pass. |
| TC-119 | NFR-6 | Fail | [TC-119-1.png](screenshots/TC-119-1.png) [TC-119-2.png](screenshots/TC-119-2.png) [TC-119-3.png](screenshots/TC-119-3.png) [TC-119-4.png](screenshots/TC-119-4.png) [TC-119-5.png](screenshots/TC-119-5.png) [TC-119-6.png](screenshots/TC-119-6.png) | B13 — S06 ở 360 và 430 px: 3 đoạn chữ Hán 15 px (< 18 px) trong các dòng câu trả lời / đáp án. S05: đạt (vùng chạm ≥ 44, chữ Hán ≥ 18 px); không cuộn ngang. |
| TC-120 | NFR-7 | Fail | [TC-120-1.png](screenshots/TC-120-1.png) [TC-120-2.png](screenshots/TC-120-2.png) | B14 — axe: T14 `scrollable-region-focusable` (main). S05, S06, T09: 0 lỗi; mọi thao tác bằng bàn phím được. axe-core 4.10.2 nạp từ cdnjs, context bỏ qua CSP. |
| TC-121 | NFR-9 | Pass |  | Mọi endpoint bộ / lượt làm / bài nộp / review / T14 / T09: 404 cho người ngoài, 401 khi chưa đăng nhập; bộ "Chưa mở" không tạo lượt làm. |
| TC-122 | NFR-10 | Pass |  | Log: item.publish/archive/restore/delete/duplicate, attempt.start/submit, set.regrade (kèm số bài) — không có nội dung câu hỏi, đáp án, tên, e-mail. Máy chủ hermetic thứ hai (cổng 4174, LOG_LEVEL=info). |
| TC-123 | NFR-11 | Fail |  | B15 — Duyệt 30 bộ × 100 câu bị từ chối 413 (giới hạn JSON 100 kB của API, `app.ts`) — không đo được NFR-11 qua đường duyệt (stand-in 010). |
| TC-124 | NFR-12, NFR-13 | Fail |  | B16 — Quay lại tab Bài tập (10 bộ × 30 câu): 1 281–1 307 ms > 1 s (đo 3 lần). Mở lần đầu 1,9–2,0 s (≤ 3 s), không mất thay đổi. |
| TC-125 | NFR-14 | Pass |  |  |
| TC-126 | NFR-8 | Thủ công |  | Hướng dẫn: test-cases.md |
| TC-127 | NFR-6 | Thủ công |  | Hướng dẫn: test-cases.md |
| TC-128 | NFR-8 | Thủ công |  | Hướng dẫn: test-cases.md |
| TC-129 | NFR-7 | Thủ công |  | Hướng dẫn: test-cases.md |

## Lỗi (để `/module 005` sửa)

Mỗi mục: test case, bước, mong đợi, thực tế, bằng chứng. Chạy lại một ca: `node .sdd/scripts/sdd.mjs run test:modules -- 005 TC-###`.

### B1 — HV mở đường dẫn màn hình GV (T09, T14) không thấy A05 · TC-012 (AC-21.2), TC-100 (AC-20.5)
- **Bước:** HV đã đăng nhập mở `/gv/giao-trinh/<gt>/bai/<bài>/thu-cong` (TC-012 bước 3) hoặc `/gv/bai-nop?lop=…&hv=…&bo=…` (TC-100 bước 2).
- **Mong đợi:** A05 "Không tìm thấy nội dung", không lộ nội dung.
- **Thực tế:** chuyển về S01 "Lớp của tôi" (guard `RequireRole` của foundation: "HV on T* → S01", tech.md). Không lộ nội dung. GV khác và
  bài nộp không tồn tại → A05 đúng; chưa đăng nhập → A01.
- **Bằng chứng:** [TC-012-3.png](screenshots/TC-012-3.png), [TC-100-2.png](screenshots/TC-100-2.png).
- **Ghi chú:** xung đột giữa quy ước route của foundation và AC-21.2 / AC-20.5 — cần agent spec quyết định (sửa guard cho T09/T14 hoặc sửa AC).

### B2 — HV ngoài lớp / bị gỡ khỏi lớp nhận thông điệp của 003 · TC-103 (AC-21.3), TC-105 (AC-21.6)
- **TC-103 bước "HV ngoài lớp":** mở S05 / S06 của bộ trong lớp mình không thuộc. **Mong đợi:** A05. **Thực tế:** về S01 kèm thông báo
  "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" (`useHvRefusal`, 003 AC-14.5). Không lộ nội dung.
  [TC-103-3.png](screenshots/TC-103-3.png), [TC-103-4.png](screenshots/TC-103-4.png).
- **TC-105 trường hợp "gỡ HV":** HV đang làm, GV gỡ HV khỏi lớp, HV trả lời câu 2. **Mong đợi:** "Bài tập này hiện không khả dụng. Câu trả
  lời đã lưu của bạn được giữ lại." **Thực tế:** alert "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" (409/404 CLASS_NOT_MEMBER của
  003). Ba trường hợp khác (ẩn phần, lưu trữ, kết thúc lớp) đúng. [TC-105-3.png](screenshots/TC-105-3.png).
- **Ghi chú:** cùng loại xung đột 003/005 như B4 của QA 004 — cần agent spec.

### B3 — 101 câu bị từ chối bằng 400, không phải 422 · TC-019 (AC-2.5)
- **Bước 2:** `PUT /api/lessons/<bài>/items/<bộ>` với 101 câu. **Mong đợi (test case):** 422. **Thực tế:** 400 `VALIDATION_ERROR` (Zod
  `too_big` ở `questions`). Bộ không đổi (100 câu). T09 "Mỗi bộ bài tập có tối đa 100 câu hỏi": đạt.
- **Ghi chú:** việc từ chối đúng; chỉ mã trạng thái khác test case — sửa test case hoặc trả 422 `INVALID_CONTENT` như các lỗi nội dung khác.

### B4 — Không nói lý do khi chặn thêm phương án thứ 7 / cặp thứ 9 · TC-029 (AC-4.1), TC-042 (AC-8.1, AC-8.2)
- **Bước:** thêm tới 6 phương án (TC-029) / 8 cặp (TC-042). **Mong đợi:** không thêm, kèm "Câu trắc nghiệm cần từ 2 đến 6 phương án" /
  "Câu nối cặp cần từ 2 đến 8 cặp". **Thực tế:** "Thêm phương án" / "Thêm cặp" bị vô hiệu, không có thông điệp nào (nút xóa ở mức tối thiểu
  có lý do trong `title`). [TC-029-1.png](screenshots/TC-029-1.png), [TC-042-1.png](screenshots/TC-042-1.png).
- **Gợi ý:** `AddButton` trong `editor-fields.tsx` nhận `title` / mô tả giống `RowButtons.minReason`.

### B5 — S06 không có kết quả từng chỗ trống / từng cặp · TC-038 (AC-16.3)
- **Bước 2:** nộp câu 3 ô với ô 1 đúng, ô 2 sai, ô 3 trống, mở S06. **Mong đợi:** ô 2 "Sai", ô 3 "Chưa trả lời" (AC-16.3 gán kết quả cho mỗi
  câu, câu hỏi con, **chỗ trống và cặp**). **Thực tế:** chỉ kết quả câu "Đúng một phần" và "Bạn trả lời: (1) 是; (2) 中国; (3) —". Điểm 1/3
  đúng. [TC-038-2.png](screenshots/TC-038-2.png). `reviewRows` (shared) không đưa kết quả từng phần ra; T14 cũng vậy.

### B6 — Nhãn gợi ý của câu Viết chữ Hán · TC-051 (AC-10.4)
- **Mong đợi:** "Nghĩa gợi ý: xin chào". **Thực tế:** "Nghĩa: xin chào" (`QuestionView.tsx`, `Write`). [TC-051-1.png](screenshots/TC-051-1.png).

### B7 — "Tiếp tục làm" ở tab cũ sau khi đã nộp nơi khác · TC-075 (AC-17.7)
- **Bước 3:** tab C mở S05 trước khi tab A nộp, sau đó bấm "Tiếp tục làm". **Mong đợi:** không vào bài, hiện "Bài đã nộp — mỗi bộ bài tập chỉ
  làm một lần" kèm "Xem lại bài làm". **Thực tế:** vào lại lượt làm đã tải (store `start()` không gọi máy chủ khi đã có `view.attempt`), không
  có thông điệp; chỉ lần lưu sau mới bị từ chối. Bài nộp, điểm không đổi (đúng). [TC-075-2.png](screenshots/TC-075-2.png).

### B8 — Nộp song song cùng `submitKey` · TC-080 (AC-15.5, NFR-3)
- **Bước:** 3 `POST …/submit` song song, cùng `submitKey`. **Mong đợi:** một bài nộp, cả 3 phản hồi dẫn tới kết quả của nó. **Thực tế:**
  `[200 {submitted:true}, 409 ALREADY_SUBMITTED, 409 ALREADY_SUBMITTED]` (409 kèm `details.review`). Đúng 1 bài nộp được ghi nhận.
  Nộp lặp tuần tự cùng key thì trả 200 (theo progress.md) — chỉ trường hợp đồng thời sai.

### B9 — Định dạng điểm "7,0 / 12,0" · TC-082, TC-083 (AC-16.2)
- **Mong đợi:** "7 / 12 điểm (58%)", "0,5 / 3 điểm (17%)", "5 / 8 điểm (63%)". **Thực tế:** "7,0 / 12,0 điểm (58%)", "0,5 / 3,0 điểm (17%)",
  "5,0 / 8,0 điểm (63%)" — phần trăm đúng. Cùng định dạng ở T14, ngăn "Bài nộp" (T04), chip "Đã hoàn thành · 1,0 / 1,0" (S05) và dòng
  chấm lại "1,0 → 0,0". [TC-082-1.png](screenshots/TC-082-1.png), [TC-083-1.png](screenshots/TC-083-1.png).
- **Gợi ý:** `formatScore` giữ một chữ số thập phân; điểm số bài tập cần bỏ ",0".

### B10 — "Đang làm" chỉ khi đã có câu trả lời · TC-088 (AC-17.5, AC-17.6)
- **Bước:** HV bấm "Bắt đầu làm" (chưa trả lời), đọc trạng thái. **Mong đợi:** "Đang làm" (AC-17.5 "có lượt làm dở"; AC-17.6 "WHEN HV bắt đầu
  một lượt làm … cập nhật ngay"). **Thực tế:** S05 và S11 (`my-classes/:id/lessons/:id`) đều "Chưa làm" — `exercise-links.ts:64` đặt
  `inProgress` chỉ khi `answers` không rỗng. Các sự kiện khác (nộp, chấm lại làm giảm điểm, đổi hạn → "Nộp muộn") cập nhật đúng.
- **Ghi chú:** nếu đây là chủ ý, cần ghi vào spec (agent spec quyết định).

### B11 — Không thêm được đáp án chấp nhận cho bộ đã có bài nộp · TC-095 (AC-19.1, AC-18.1)
- **Bước 1:** bộ có 3 bài nộp, ở chỗ trống 1 bấm "Thêm đáp án". **Mong đợi:** thêm "shì", "Lưu thay đổi" lưu ngay không hỏi chấm lại (AC-18.1
  vẫn cho sửa đáp án). **Thực tế:** "Thêm đáp án" bị vô hiệu vì `AddButton` tắt mọi nút khi `locked`. Thay đổi đó qua API thì được nhận
  (200, không 409, S06 không ghi chú chấm lại). [TC-095-1.png](screenshots/TC-095-1.png). Cũng ảnh hưởng "Thêm đáp án" của câu Viết chữ Hán.

### B12 — Bộ ca chuẩn của quy tắc chấm quá nhỏ · TC-117 (NFR-4)
- **Mong đợi:** ≥ 400 ca chấm (≥ 150 ca pinyin), 100% đúng. **Thực tế:** `run test -- packages/shared/src/exercises` → "Tests 72 passed (72)"
  (khoảng 30 ca pinyin). Tất cả đúng; 20/20 ca mẫu qua bài nộp thật đúng.

### B13 — Chữ Hán trên S06 nhỏ hơn 18 px · TC-119 (NFR-6)
- **Bước:** S06 của bộ Nối cặp 8 cặp + 4 nhiễu và Sắp xếp 12 mảnh ở 360 và 430 px. **Mong đợi:** chữ Hán ≥ 18 px. **Thực tế:** 3 đoạn
  `lang="zh-Hans"` 15 px (các dòng câu trả lời / đáp án của S06). Không cuộn ngang; S05 đạt (vùng chạm ≥ 44 × 44, chữ Hán ≥ 18 px).
  [TC-119-5.png](screenshots/TC-119-5.png), [TC-119-6.png](screenshots/TC-119-6.png).

### B14 — T14: vùng cuộn không nhận tiêu điểm · TC-120 (NFR-7)
- **Bước 3:** axe-core (WCAG 2.0/2.1 A, AA) trên S05, S06, T09, T14. **Thực tế:** T14 `scrollable-region-focusable ×1 (main)` — trang chỉ đọc,
  `<main>` cuộn nhưng không có phần tử nào nhận tiêu điểm. S05, S06, T09: 0 lỗi. Mọi thao tác S05, T21, T09 bằng bàn phím: đạt.

### B15 — Duyệt AI 30 bộ × 100 câu bị 413 · TC-123 (NFR-11)
- **Bước 1:** `POST /api/dev/curriculum/ai-approve/preview` với 30 bộ × 100 câu (mỗi câu 2 phương án). **Mong đợi:** duyệt ≤ 5 s, không mất
  dữ liệu. **Thực tế:** 413 — `app.useBodyParser('json', { limit: '100kb' })` (`apps/api/src/app.ts:27`). Không đo được NFR-11.
- **Ghi chú:** 100 kB cũng có thể chặn việc lưu một bộ hợp lệ lớn trên T09 (100 câu Đọc hiểu, đoạn đọc tới 5 000 ký tự) — chưa có test case
  nào ở cỡ đó.

### B16 — Đổi tab Bài học → Bài tập chậm · TC-124 (NFR-13)
- **Bước 2:** Bài 10 bộ × 30 câu, sang tab Bài học rồi về Bài tập. **Mong đợi:** ≤ 1 s. **Thực tế:** 1 281 ms, 1 283 ms, 1 307 ms (3 lần đo).
  Mở lần đầu 1,9–2,0 s (≤ 3 s, NFR-12 đạt); không thay đổi nào mất hay bị lưu ngoài ý muốn.

### Bị chặn — TC-102 (AC-20.7)
006 (Bài thi, T16) chưa được xây: không có bài nộp bài thi để mở T14. Chạy lại sau khi 006 xong.
