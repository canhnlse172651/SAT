# QA 006 Bài thi — lần chạy 2026-10-29-0304

- **Thời điểm:** 2026-10-29 03:04 → 03:40 (giờ Việt Nam). **Commit:** e91a5aa (`feat/006-exams`).
- **Máy chủ:** e2e hermetic `node tests/e2e/server.mjs` (build production + MongoDB trong bộ nhớ, seed dev), cổng 4173, một cơ sở dữ
  liệu cho cả lượt (mỗi ca tự tạo HV / lớp / bài thi riêng; các ca dời đồng hồ máy chủ trả đồng hồ về sau khi xong).
- **Trình duyệt:** Chromium (Playwright 1.x headless); GV 1280 × 800, HV 390 × 844 (TC-113: 360 × 740; TC-073 thiết bị 2: 412 × 915;
  TC-017 múi giờ `America/New_York`; TC-109 `Asia/Tokyo` + đồng hồ thiết bị lệch +3 giờ).
- **Kết quả:** **106/112 ca E2E + API Pass, 6 Fail** (5 lỗi F1–F5), 0 Bị chặn, 3 Thủ công (TC-112, TC-114, TC-115 — hướng dẫn trong
  test-cases.md). Lượt cuối: chạy tuần tự toàn bộ 112 script một lần (`--workers=1`, 12,5 phút), [full-run.log](full-run.log),
  [playwright.json](playwright.json), [results.json](results.json), ảnh trong `screenshots/` (115), dấu vết lỗi trong `artifacts/`.

## Cách chạy và giới hạn (đọc trước khi dùng kết quả)

- **Playwright MCP không dùng được:** hồ sơ `mcp-chrome-7c84bcd` bị Chrome của một tiến trình MCP phiên cũ giữ (PID 33248, mở
  2026-10-28 14:24; cùng lỗi lần QA 005). Không tắt tiến trình của phiên khác khi chưa được người dùng đồng ý. Mọi ca được viết thành script
  Playwright từ đúng các bước của test-cases.md (định vị theo vai trò / nhãn / chữ người dùng thấy) và chạy trên Chromium thật — chính là
  các script replay đã lưu.
- **Tính độc lập:** lượt QA này chạy trong cùng phiên với agent đã cài đặt 006 (người dùng gọi `/test-module 006` ngay sau `/module 006`).
  Kết quả là bằng chứng máy chạy được, nhưng nên có một lượt QA ở phiên mới, độc lập trước khi coi 006 là "verified".
- **Phải chạy tuần tự:** 30 script dời đồng hồ máy chủ (`/api/dev/clock`) — đồng hồ dùng chung cho cả máy chủ. `node .sdd/scripts/sdd.mjs run
  test:modules -- 006` chạy song song (số worker mặc định) nên các ca này sẽ ảnh hưởng nhau. Lượt này chạy bằng
  `npx playwright test -c playwright.modules.config.ts --workers=1` với cùng biến `SAT_MODULE_TEST_DIR` / `SAT_MODULE_RUN_DIR` mà công cụ
  replay đặt. Đề nghị (release-engineer / foundation): `workers: 1` trong `playwright.modules.config.ts`; trên Windows bộ lọc `-g` có `|`
  bị cmd hiểu là pipe — gọi qua bash.
- **Script dùng chung** `testing/e2e/helpers.ts`: dữ liệu qua API như phần "Dữ liệu và tài khoản dùng chung" (HV mới đã kích hoạt cho mỗi ca,
  lớp, bài thi, đề "E3"); bộ dựng câu hỏi lấy từ helpers của 005.

## Kết quả từng ca

| TC | AC / NFR | Kết quả | Bằng chứng | Ghi chú |
|----|----------|---------|-----------|---------|
| TC-001 | AC-1.1 | Pass | [TC-001-1.png](screenshots/TC-001-1.png) |  |
| TC-002 | AC-1.2 | Pass | [TC-002-1.png](screenshots/TC-002-1.png) | T10 tính trạng thái theo giờ thiết bị ≤ 1 s trước khi đồng bộ giờ máy chủ (thoáng thấy thứ tự cũ) — quan sát |
| TC-003 | AC-1.3 | Pass | [TC-003-1.png](screenshots/TC-003-1.png) |  |
| TC-004 | AC-1.4 | Pass | [TC-004-1.png](screenshots/TC-004-1.png) |  |
| TC-005 | AC-1.5 | Pass | [TC-005-1.png](screenshots/TC-005-1.png) | Bấm chữ "Hiện bài thi lưu trữ (n)" không bật được; phải bấm công tắc — quan sát UX |
| TC-006 | AC-1.6 | Pass | [TC-006-1.png](screenshots/TC-006-1.png) |  |
| TC-007 | AC-2.1 | Pass | [TC-007-1.png](screenshots/TC-007-1.png) |  |
| TC-008 | AC-2.2 | Pass | [TC-008-1.png](screenshots/TC-008-1.png) |  |
| TC-009 | AC-2.3 | Pass | [TC-009-1.png](screenshots/TC-009-1.png) | Bước 4 dùng điểm 0,3 (trường chưa hợp lệ thật của 005); TC ghi "phương án trùng" nhưng 005 xếp đó là chưa hoàn chỉnh — cần sửa câu chữ TC |
| TC-010 | AC-2.3 | Pass | — |  |
| TC-011 | AC-2.4 | Pass | [TC-011-1.png](screenshots/TC-011-1.png) |  |
| TC-012 | AC-2.5 | Pass | [TC-012-1.png](screenshots/TC-012-1.png) |  |
| TC-013 | AC-2.6 | Pass | [TC-013-1.png](screenshots/TC-013-1.png) |  |
| TC-014 | AC-2.7 | Pass | [TC-014-1.png](screenshots/TC-014-1.png) |  |
| TC-015 | AC-2.8 | Pass | [TC-015-1.png](screenshots/TC-015-1.png) [TC-015-2.png](screenshots/TC-015-2.png) |  |
| TC-016 | AC-3.1 | Pass | [TC-016-1.png](screenshots/TC-016-1.png) |  |
| TC-017 | AC-3.2 | Pass | [TC-017-1.png](screenshots/TC-017-1.png) |  |
| TC-018 | AC-3.2 | Pass | [TC-018-1.png](screenshots/TC-018-1.png) |  |
| TC-019 | AC-3.3 | Fail | — | F2 |
| TC-020 | AC-3.4 | Pass | [TC-020-1.png](screenshots/TC-020-1.png) [TC-020-2.png](screenshots/TC-020-2.png) |  |
| TC-021 | AC-3.5 | Fail | — | F3 |
| TC-022 | AC-3.5 | Pass | [TC-022-1.png](screenshots/TC-022-1.png) |  |
| TC-023 | AC-3.6 | Pass | [TC-023-1.png](screenshots/TC-023-1.png) [TC-023-2.png](screenshots/TC-023-2.png) |  |
| TC-024 | AC-3.7 | Pass | [TC-024-1.png](screenshots/TC-024-1.png) [TC-024-2.png](screenshots/TC-024-2.png) |  |
| TC-025 | AC-3.8 | Pass | [TC-025-1.png](screenshots/TC-025-1.png) [TC-025-2.png](screenshots/TC-025-2.png) |  |
| TC-026 | AC-3.8 | Pass | [TC-026-1.png](screenshots/TC-026-1.png) |  |
| TC-027 | AC-4.1 | Pass | [TC-027-1.png](screenshots/TC-027-1.png) [TC-027-2.png](screenshots/TC-027-2.png) |  |
| TC-028 | AC-4.1 | Pass | — |  |
| TC-029 | AC-4.2 | Pass | [TC-029-1.png](screenshots/TC-029-1.png) |  |
| TC-030 | AC-4.2 | Pass | — |  |
| TC-031 | AC-4.3 | Pass | [TC-031-1.png](screenshots/TC-031-1.png) |  |
| TC-032 | AC-4.4 | Pass | [TC-032-1.png](screenshots/TC-032-1.png) |  |
| TC-033 | AC-4.4 | Pass | — |  |
| TC-034 | AC-5.1 | Pass | [TC-034-1.png](screenshots/TC-034-1.png) |  |
| TC-035 | AC-5.2 | Fail | — | F1 |
| TC-036 | AC-5.2 | Fail | — | F1 |
| TC-037 | AC-5.3 | Pass | [TC-037-1.png](screenshots/TC-037-1.png) |  |
| TC-038 | AC-5.4 | Pass | [TC-038-1.png](screenshots/TC-038-1.png) |  |
| TC-039 | AC-5.5 | Pass | [TC-039-1.png](screenshots/TC-039-1.png) [TC-039-2.png](screenshots/TC-039-2.png) |  |
| TC-040 | AC-6.1 | Pass | [TC-040-1.png](screenshots/TC-040-1.png) [TC-040-2.png](screenshots/TC-040-2.png) |  |
| TC-041 | AC-6.2 | Pass | [TC-041-1.png](screenshots/TC-041-1.png) |  |
| TC-042 | AC-6.3 | Pass | [TC-042-1.png](screenshots/TC-042-1.png) [TC-042-2.png](screenshots/TC-042-2.png) |  |
| TC-043 | AC-6.4 | Pass | [TC-043-1.png](screenshots/TC-043-1.png) |  |
| TC-044 | AC-6.5 | Fail | — | F4 |
| TC-045 | AC-6.6 | Pass | [TC-045-1.png](screenshots/TC-045-1.png) [TC-045-2.png](screenshots/TC-045-2.png) |  |
| TC-046 | AC-6.6 | Pass | — |  |
| TC-047 | AC-7.1 | Pass | [TC-047-1.png](screenshots/TC-047-1.png) [TC-047-2.png](screenshots/TC-047-2.png) |  |
| TC-048 | AC-7.2 | Pass | [TC-048-1.png](screenshots/TC-048-1.png) |  |
| TC-049 | AC-7.3 | Pass | [TC-049-1.png](screenshots/TC-049-1.png) |  |
| TC-050 | AC-7.4 | Pass | [TC-050-1.png](screenshots/TC-050-1.png) |  |
| TC-051 | AC-7.5 | Pass | [TC-051-1.png](screenshots/TC-051-1.png) |  |
| TC-052 | AC-7.6 | Pass | [TC-052-1.png](screenshots/TC-052-1.png) [TC-052-2.png](screenshots/TC-052-2.png) |  |
| TC-053 | AC-7.7 | Pass | [TC-053-1.png](screenshots/TC-053-1.png) |  |
| TC-054 | AC-7.8 | Pass | [TC-054-1.png](screenshots/TC-054-1.png) |  |
| TC-055 | AC-8.1 | Pass | [TC-055-1.png](screenshots/TC-055-1.png) |  |
| TC-056 | AC-8.2 | Pass | [TC-056-1.png](screenshots/TC-056-1.png) [TC-056-2.png](screenshots/TC-056-2.png) |  |
| TC-057 | AC-8.3 | Pass | [TC-057-1.png](screenshots/TC-057-1.png) [TC-057-2.png](screenshots/TC-057-2.png) |  |
| TC-058 | AC-8.4 | Pass | [TC-058-1.png](screenshots/TC-058-1.png) |  |
| TC-059 | AC-8.4 | Fail | — | F5 |
| TC-060 | AC-8.4 | Pass | [TC-060-1.png](screenshots/TC-060-1.png) |  |
| TC-061 | AC-8.4 | Pass | — |  |
| TC-062 | AC-8.5 | Pass | [TC-062-1.png](screenshots/TC-062-1.png) [TC-062-2.png](screenshots/TC-062-2.png) |  |
| TC-063 | AC-8.6 | Pass | [TC-063-1.png](screenshots/TC-063-1.png) |  |
| TC-064 | AC-9.1 | Pass | [TC-064-1.png](screenshots/TC-064-1.png) [TC-064-2.png](screenshots/TC-064-2.png) |  |
| TC-065 | AC-9.2 | Pass | [TC-065-1.png](screenshots/TC-065-1.png) |  |
| TC-066 | AC-9.3 | Pass | [TC-066-1.png](screenshots/TC-066-1.png) [TC-066-2.png](screenshots/TC-066-2.png) |  |
| TC-067 | AC-9.4 | Pass | [TC-067-1.png](screenshots/TC-067-1.png) [TC-067-2.png](screenshots/TC-067-2.png) |  |
| TC-068 | AC-9.4 | Pass | [TC-068-1.png](screenshots/TC-068-1.png) |  |
| TC-069 | AC-9.5 | Pass | [TC-069-1.png](screenshots/TC-069-1.png) |  |
| TC-070 | AC-10.1 | Pass | [TC-070-1.png](screenshots/TC-070-1.png) |  |
| TC-071 | AC-10.2 | Pass | [TC-071-1.png](screenshots/TC-071-1.png) |  |
| TC-072 | AC-10.2, AC-12.2 | Pass | — |  |
| TC-073 | AC-10.3 | Pass | [TC-073-1.png](screenshots/TC-073-1.png) |  |
| TC-074 | AC-10.3 | Pass | [TC-074-1.png](screenshots/TC-074-1.png) |  |
| TC-075 | AC-10.4 | Pass | [TC-075-1.png](screenshots/TC-075-1.png) [TC-075-2.png](screenshots/TC-075-2.png) |  |
| TC-076 | AC-10.5 | Pass | [TC-076-1.png](screenshots/TC-076-1.png) |  |
| TC-077 | AC-11.1 | Pass | [TC-077-1.png](screenshots/TC-077-1.png) [TC-077-2.png](screenshots/TC-077-2.png) |  |
| TC-078 | AC-11.2 | Pass | [TC-078-1.png](screenshots/TC-078-1.png) |  |
| TC-079 | AC-11.3 | Pass | — |  |
| TC-080 | AC-11.4 | Pass | [TC-080-1.png](screenshots/TC-080-1.png) [TC-080-2.png](screenshots/TC-080-2.png) |  |
| TC-081 | AC-11.4 | Pass | [TC-081-1.png](screenshots/TC-081-1.png) |  |
| TC-082 | AC-12.1 | Pass | — |  |
| TC-083 | AC-12.1 | Pass | — |  |
| TC-084 | AC-12.3 | Pass | [TC-084-1.png](screenshots/TC-084-1.png) [TC-084-2.png](screenshots/TC-084-2.png) |  |
| TC-085 | AC-12.3 | Pass | [TC-085-1.png](screenshots/TC-085-1.png) |  |
| TC-086 | AC-12.4 | Pass | [TC-086-1.png](screenshots/TC-086-1.png) |  |
| TC-087 | AC-12.5 | Pass | [TC-087-1.png](screenshots/TC-087-1.png) |  |
| TC-088 | AC-13.1 | Pass | [TC-088-1.png](screenshots/TC-088-1.png) |  |
| TC-089 | AC-13.2 | Pass | — |  |
| TC-090 | AC-13.3 | Pass | — |  |
| TC-091 | AC-13.4 | Pass | — |  |
| TC-092 | AC-13.5 | Pass | — |  |
| TC-093 | AC-13.6 | Pass | — |  |
| TC-094 | AC-14.1 | Pass | [TC-094-1.png](screenshots/TC-094-1.png) [TC-094-2.png](screenshots/TC-094-2.png) |  |
| TC-095 | AC-14.2 | Pass | [TC-095-1.png](screenshots/TC-095-1.png) [TC-095-2.png](screenshots/TC-095-2.png) |  |
| TC-096 | AC-14.3 | Pass | [TC-096-1.png](screenshots/TC-096-1.png) |  |
| TC-097 | AC-14.4 | Pass | [TC-097-1.png](screenshots/TC-097-1.png) |  |
| TC-098 | AC-14.5 | Pass | [TC-098-1.png](screenshots/TC-098-1.png) |  |
| TC-099 | AC-15.1 | Pass | [TC-099-1.png](screenshots/TC-099-1.png) |  |
| TC-100 | AC-15.2, AC-15.3 | Pass | [TC-100-1.png](screenshots/TC-100-1.png) [TC-100-2.png](screenshots/TC-100-2.png) |  |
| TC-101 | AC-15.3 | Pass | [TC-101-1.png](screenshots/TC-101-1.png) |  |
| TC-102 | AC-15.4 | Pass | [TC-102-1.png](screenshots/TC-102-1.png) |  |
| TC-103 | AC-15.5 | Pass | [TC-103-1.png](screenshots/TC-103-1.png) |  |
| TC-104 | AC-15.6 | Pass | [TC-104-1.png](screenshots/TC-104-1.png) |  |
| TC-105 | AC-15.7 | Pass | [TC-105-1.png](screenshots/TC-105-1.png) |  |
| TC-106 | AC-16.1, NFR-7 | Pass | [TC-106-1.png](screenshots/TC-106-1.png) |  |
| TC-107 | AC-16.2, AC-16.3, AC-16.4, NFR-7 | Pass | [TC-107-1.png](screenshots/TC-107-1.png) |  |
| TC-108 | AC-16.5 | Pass | [TC-108-1.png](screenshots/TC-108-1.png) |  |
| TC-109 | NFR-1 | Pass | [TC-109-1.png](screenshots/TC-109-1.png) |  |
| TC-110 | NFR-2, NFR-9 | Pass | — |  |
| TC-111 | NFR-3 | Pass | — | Hai lần nộp đồng thời cùng submitKey: một lần 200, lần kia có thể 409 (UI vẫn tới kết quả) — quan sát |
| TC-112 | NFR-4, NFR-5, NFR-6 | Thủ công | — | Hướng dẫn trong test-cases.md |
| TC-113 | NFR-8 | Pass | [TC-113-1.png](screenshots/TC-113-1.png) [TC-113-2.png](screenshots/TC-113-2.png) |  |
| TC-114 | NFR-8 | Thủ công | — | Hướng dẫn trong test-cases.md |
| TC-115 | NFR-10 | Thủ công | — | Hướng dẫn trong test-cases.md |

# Lỗi (Fail)

## F1 — Lùi giờ đóng khi đang có lượt làm trả 500 (TC-035, TC-036 · AC-5.2)

- **Bước:** bài thi đang mở, 1 HV đang làm; GV đổi Giờ đóng muộn hơn và "Lưu thay đổi" (hoặc `PUT /api/exams/<id>` với `closesAt` muộn hơn).
- **Mong đợi:** lưu được; thời điểm kết thúc của mỗi lượt đang làm = min(bắt đầu + Thời lượng, Giờ đóng mới); đồng hồ HV cập nhật trong ≤ 10 giây.
- **Thực tế:** `500 INTERNAL` "Internal server error". Log máy chủ: `MongooseError: Cannot pass an array to query updates unless the
  updatePipeline option is set.` tại `ExamsService.extend` (`apps/api/src/modules/exams/exams.service.ts`, `updateMany` với pipeline).
  Giờ đóng mới đã được lưu (bản ghi bài thi đổi trước) nhưng `endsAt` của lượt đang làm không đổi → đồng hồ HV vẫn ≈ 19 phút
  (TC-035: mong > 44 phút). Hệ quả phụ: GV thấy lỗi dù giờ đóng đã đổi.
- **Gợi ý sửa:** truyền `{ updatePipeline: true }` (Mongoose 9) cho update dạng pipeline — `scoped().updateMany` hiện chỉ nhận
  `arrayFilters` — hoặc tính lại `endsAt` từng lượt bằng `bulkWrite`.

## F2 — Lỗi giờ đóng (AC-3.3) không hiện dưới trường "Giờ đóng" (TC-019 · AC-3.3)

- **Bước:** T22 bài Nháp đủ điều kiện; Giờ mở ngày mai, Thời lượng 45, Giờ đóng = mở + 30 phút → "Lên lịch"; rồi Giờ đóng ở quá khứ → "Lên lịch".
- **Mong đợi:** dưới trường Giờ đóng: "Giờ đóng phải sau giờ mở ít nhất bằng thời lượng làm bài (45 phút)." / "Giờ đóng phải ở tương lai."
- **Thực tế:** câu chữ chỉ có trong danh sách "Chưa lên lịch được — còn n điều kiện chưa đạt"; mô tả truy cập của ô Giờ đóng chỉ là
  "Giờ Việt Nam (UTC+7)". (Lỗi "Khi đã có học viên làm bài, chỉ có thể lùi giờ đóng muộn hơn." của AC-5.1 thì hiện đúng dưới trường.)

## F3 — Mục trong danh sách điều kiện không đưa tới trường (TC-021 · AC-3.5)

- **Bước:** T22 bài Nháp trống → "Lên lịch" → bấm "Chưa nhập giờ mở".
- **Mong đợi:** mỗi mục dẫn tới trường cần sửa (con trỏ vào ô Giờ mở).
- **Thực tế:** không có gì xảy ra với Giờ mở / Thời lượng / Giờ đóng / Tên bài thi ("Chưa chọn lớp được giao" thì đúng — nút "Chọn lớp…"
  nhận tiêu điểm). Nguyên nhân thấy được: `TextField` → `FormField` đặt `id` của riêng nó lên ô nhập, ghi đè `id="xm-open"`… mà
  `focusTarget()` của `ExamEditorPage` tìm.

## F4 — "Khôi phục" trên T10 bị hàng kế tiếp che (TC-044 · AC-6.5)

- **Bước:** T10 → bật "Hiện bài thi lưu trữ (n)" → menu "⋯" của một bài "Lưu trữ" (không phải hàng cuối) → "Khôi phục".
- **Mong đợi:** bấm được "Khôi phục"; bài thi về "Đã đóng".
- **Thực tế:** menu mở nhưng không bấm được: `<a … >Xem kết quả</a> from <tr class="is-arch" …> subtree intercepts pointer events` —
  hàng lưu trữ có `opacity: .7` (`.xm-tbl tr.is-arch`) tạo stacking context riêng, menu (`z-index: 20`) nằm dưới hàng sau. Ở hàng cuối thì
  bấm được. Nút "Khôi phục" trên T22 vẫn dùng được (cách tạm).

## F5 — Tab cũ bấm "Bắt đầu làm bài" sau khi đã nộp: sang S08 thay vì S07 (TC-059 · AC-8.4)

- **Bước:** HV mở sảnh ở thẻ 1; ở thẻ 2 làm và nộp bài; quay lại thẻ 1 bấm "Bắt đầu làm bài".
- **Mong đợi (AC-8.4):** không tạo lượt mới; "S07 với trạng thái mới" → dòng "Đã nộp · 100/100".
- **Thực tế:** không tạo lượt mới (đúng) nhưng chuyển sang S08 (trang kết quả) — `MyExamsPage.begin()` điều hướng tới S08 khi nhận
  `409 EXAM_SUBMITTED`.

## Quan sát (không phải Fail)

- TC-002: ngay khi danh sách vừa tải, T10 tính trạng thái theo giờ thiết bị trong ≤ 1 giây (`useServerNow` cập nhật mỗi giây, đồng bộ sau `syncServer`) — một bài vừa đóng có thể thoáng hiện trong nhóm cũ.
- TC-005: chữ "Hiện bài thi lưu trữ (n)" là `span`, không phải `label` — bấm chữ không bật công tắc.
- TC-009: test case ghi "phương án trùng" là "trường chưa hợp lệ" của 005, nhưng 005 xếp lỗi đó là "chưa hoàn chỉnh" (bản nháp được lưu). Script dùng "Điểm 0,3" (chưa hợp lệ thật). Cần sửa câu chữ TC-009 (chủ: `/module 006`).
- TC-111: hai lần "Nộp bài" đồng thời cùng `submitKey` — một lần 200, lần kia đôi khi 409 `EXAM_SUBMITTED` (không có bài nộp thứ hai; giao diện vẫn tới kết quả).
- 005 test-cases.md ghi câu trả lời trắc nghiệm `{"choice":[…]}`; API dùng `optionIds` và bỏ qua khóa lạ — tài liệu 005 cần sửa.
