# QA run 002 — 2026-10-23-2227

- **Ngày giờ:** 2026-10-23 22:27 (giờ Việt Nam) · **Người chạy:** /test-module 002 (agent QA)
- **Mã nguồn:** `feat/002-curriculum` @ `7722ec8` (bản bàn giao của 002), chạy trong git worktree riêng `../sat-002-qa` vì bản làm việc
  chính đang ở `feat/004-lessons-flashcards` (003 đã thay cổng "lớp đang dùng" — các TC dựa trên stand-in `/api/dev/curriculum/classes`).
- **Máy chủ:** `node tests/e2e/server.mjs` (NODE_ENV=test, MongoDB trong bộ nhớ, seed Cô Lan + 3 HV), `http://127.0.0.1:4173`, cơ sở dữ
  liệu mới cho lần chạy chính thức; build `sdd run build`; Node 24.22.1.
- **Trình duyệt:** Chromium của `@playwright/test` (headless), **không qua Playwright MCP** — trình duyệt MCP đang bị một phiên Claude khác
  giữ ("Browser is already in use"); người dùng chọn chạy bằng Playwright của dự án. Mỗi TC được thực hiện bằng chính script đã lưu.
- **Khung nhìn:** GV 1280 × 800, HV 390 × 844 (TC-038, TC-078).
- **Thứ tự:** chạy tuần tự theo thứ tự file (`--workers=1`); các TC tự tạo dữ liệu riêng (tên có hậu tố ngẫu nhiên, hoặc GV mới đăng ký ở
  A02 khi cần workspace trống), không phụ thuộc thứ tự.

## Tóm tắt

**73/76 E2E/API Pass** · Fail 2 · Bị chặn 1 · Thủ công 2 · tổng 78 TC.
Truy vết `sdd trace 002`: 117/117 AC có script, không có khoảng trống ([trace.md](trace.md)).

Chạy lại bằng toolchain `sdd run test:modules -- 002` (song song, không có AI): [2026-10-23-2231-replay](../2026-10-23-2231-replay/report.md)
72/76 — TC-018, TC-038, TC-059 đỏ tại đúng kỳ vọng như lần chạy chính; TC-019 đỏ do script chưa đủ chặt khi chạy song song (đã sửa
script, chạy lại riêng: Pass; TC-039, TC-052 cùng chỉnh sửa, chạy lại riêng: Pass).

| TC | AC | Kết quả | Bằng chứng | Ghi chú |
|----|----|---------|------------|---------|
| TC-001 | AC-1.1, AC-1.2, AC-4.2 | Pass | [TC-001-1.png](screenshots/TC-001-1.png), [TC-001-2.png](screenshots/TC-001-2.png) |  |
| TC-002 | AC-1.3 | Pass | [TC-002-1.png](screenshots/TC-002-1.png) |  |
| TC-003 | AC-1.4 | Pass | [TC-003-1.png](screenshots/TC-003-1.png) |  |
| TC-004 | AC-1.5 | Pass | [TC-004-1.png](screenshots/TC-004-1.png) |  |
| TC-005 | AC-1.6, AC-1.2 | Pass | [TC-005-1.png](screenshots/TC-005-1.png), [TC-005-2.png](screenshots/TC-005-2.png) |  |
| TC-006 | AC-3.1, AC-3.4 | Pass | [TC-006-1.png](screenshots/TC-006-1.png), [TC-006-2.png](screenshots/TC-006-2.png) | Thời điểm hiển thị dạng "HH:mm dd/MM/yyyy" (đúng giờ Việt Nam; TC ghi dd/MM/yyyy HH:mm — AC chỉ yêu cầu giờ Việt Nam). |
| TC-007 | AC-3.2, AC-3.3, AC-3.5 | Pass | [TC-007-1.png](screenshots/TC-007-1.png) |  |
| TC-008 | AC-3.6, NFR-1 | Pass | [TC-008-1.png](screenshots/TC-008-1.png) | NFR-1: trang đầu T05 với 300 giáo trình 281 ms. |
| TC-009 | AC-2.1, AC-2.2 | Pass | [TC-009-1.png](screenshots/TC-009-1.png), [TC-009-2.png](screenshots/TC-009-2.png) |  |
| TC-010 | AC-2.3, AC-2.4 | Pass | [TC-010-1.png](screenshots/TC-010-1.png), [TC-010-2.png](screenshots/TC-010-2.png) |  |
| TC-011 | AC-4.1, AC-4.3 | Pass | [TC-011-1.png](screenshots/TC-011-1.png), [TC-011-2.png](screenshots/TC-011-2.png) |  |
| TC-012 | AC-4.4 | Pass | [TC-012-1.png](screenshots/TC-012-1.png) |  |
| TC-013 | AC-13.1 | Pass | [TC-013-1.png](screenshots/TC-013-1.png), [TC-013-2.png](screenshots/TC-013-2.png) |  |
| TC-014 | AC-13.2, AC-13.5 | Pass | [TC-014-1.png](screenshots/TC-014-1.png), [TC-014-2.png](screenshots/TC-014-2.png) |  |
| TC-015 | AC-13.3 | Pass | [TC-015-1.png](screenshots/TC-015-1.png) |  |
| TC-016 | AC-13.4 | Pass | [TC-016-1.png](screenshots/TC-016-1.png), [TC-016-2.png](screenshots/TC-016-2.png) |  |
| TC-017 | AC-13.6 | Pass | [TC-017-1.png](screenshots/TC-017-1.png) |  |
| TC-018 | AC-5.1, AC-5.2, AC-7.1 | Fail | [TC-018-1.png](screenshots/TC-018-1.png), [TC-018-2.png](screenshots/TC-018-2.png), [TC-018-fail.png](screenshots/TC-018-fail.png) | Lỗi: tên điền sẵn "Bài 1" thay vì "Bài 2" khi bấm "Thêm bài" lúc T06 còn hiển thị dữ liệu cũ. |
| TC-019 | AC-5.3, AC-5.4, NFR-8 | Pass | [TC-019-1.png](screenshots/TC-019-1.png) |  |
| TC-020 | AC-5.5 | Pass | [TC-020-1.png](screenshots/TC-020-1.png) |  |
| TC-021 | AC-6.1, AC-6.3 | Pass | [TC-021-1.png](screenshots/TC-021-1.png) |  |
| TC-022 | AC-6.2, AC-6.3, NFR-5 | Pass | [TC-022-1.png](screenshots/TC-022-1.png) |  |
| TC-023 | AC-6.4 | Pass | [TC-023-1.png](screenshots/TC-023-1.png), [TC-023-2.png](screenshots/TC-023-2.png) | Lần chạy đầu bị lỗi thời gian của script (offline trước khi danh sách tải xong); sửa script, chạy lại 1 lần: Pass. |
| TC-024 | AC-6.5, AC-6.6, AC-8.1 | Pass | [TC-024-1.png](screenshots/TC-024-1.png) |  |
| TC-025 | AC-7.3, AC-7.4, AC-7.2 | Pass | [TC-025-1.png](screenshots/TC-025-1.png) |  |
| TC-026 | AC-7.5, AC-7.11, AC-7.14, AC-8.3 | Pass | [TC-026-1.png](screenshots/TC-026-1.png) |  |
| TC-027 | AC-7.6, AC-7.10 | Pass | [TC-027-1.png](screenshots/TC-027-1.png) |  |
| TC-028 | AC-7.8 | Pass | [TC-028-1.png](screenshots/TC-028-1.png) |  |
| TC-029 | AC-7.9 | Pass | [TC-029-1.png](screenshots/TC-029-1.png) |  |
| TC-030 | AC-7.12, AC-7.13 | Pass | [TC-030-1.png](screenshots/TC-030-1.png), [TC-030-2.png](screenshots/TC-030-2.png) |  |
| TC-031 | AC-8.2 | Pass | — |  |
| TC-032 | AC-8.3, AC-10.2 | Pass | [TC-032-1.png](screenshots/TC-032-1.png) |  |
| TC-033 | AC-9.1, AC-9.2 | Pass | [TC-033-1.png](screenshots/TC-033-1.png) |  |
| TC-034 | AC-9.3, AC-9.4 | Pass | [TC-034-1.png](screenshots/TC-034-1.png) |  |
| TC-035 | AC-9.5, AC-9.3 | Pass | [TC-035-1.png](screenshots/TC-035-1.png) |  |
| TC-036 | AC-9.6, AC-9.3 | Pass | [TC-036-1.png](screenshots/TC-036-1.png) |  |
| TC-037 | AC-10.1, AC-10.3 | Pass | — |  |
| TC-038 | AC-10.5, AC-17.3 | Bị chặn | [TC-038-1.png](screenshots/TC-038-1.png), [TC-038-2.png](screenshots/TC-038-2.png), [TC-038-fail.png](screenshots/TC-038-fail.png) | Bị chặn ở bước cuối: S11 (003) chưa có. Mọi kỳ vọng khác (404 đồng nhất, chuyển về S01) Pass. |
| TC-039 | AC-10.4, AC-11.2, AC-11.3 | Pass | [TC-039-1.png](screenshots/TC-039-1.png) |  |
| TC-040 | AC-10.6, NFR-4 | Pass | — |  |
| TC-041 | AC-10.7 | Pass | [TC-041-1.png](screenshots/TC-041-1.png) |  |
| TC-042 | AC-11.1 | Pass | [TC-042-1.png](screenshots/TC-042-1.png), [TC-042-2.png](screenshots/TC-042-2.png) |  |
| TC-043 | AC-11.4 | Pass | [TC-043-1.png](screenshots/TC-043-1.png) |  |
| TC-044 | AC-11.5, AC-11.7, AC-19.2, AC-19.3, AC-19.6 | Pass | [TC-044-1.png](screenshots/TC-044-1.png) |  |
| TC-045 | AC-11.6 | Pass | — |  |
| TC-046 | AC-19.1 | Pass | — |  |
| TC-047 | AC-19.4 | Pass | — |  |
| TC-048 | AC-19.5 | Pass | — |  |
| TC-049 | AC-12.1, AC-12.2 | Pass | [TC-049-1.png](screenshots/TC-049-1.png) |  |
| TC-050 | AC-12.3, AC-12.6 | Pass | [TC-050-1.png](screenshots/TC-050-1.png) |  |
| TC-051 | AC-12.4 | Pass | [TC-051-1.png](screenshots/TC-051-1.png) |  |
| TC-052 | AC-12.5, AC-12.6 | Pass | [TC-052-1.png](screenshots/TC-052-1.png), [TC-052-2.png](screenshots/TC-052-2.png) |  |
| TC-053 | AC-12.7 | Pass | [TC-053-1.png](screenshots/TC-053-1.png) |  |
| TC-054 | AC-18.1, AC-18.2, AC-18.4 | Pass | [TC-054-1.png](screenshots/TC-054-1.png) |  |
| TC-055 | AC-18.3 | Pass | [TC-055-1.png](screenshots/TC-055-1.png) |  |
| TC-056 | AC-18.5 | Pass | [TC-056-1.png](screenshots/TC-056-1.png) |  |
| TC-057 | AC-14.1, AC-14.2, AC-14.3 | Pass | [TC-057-1.png](screenshots/TC-057-1.png) |  |
| TC-058 | AC-14.1, AC-14.4 | Pass | — | Tên bản sao = 90 ký tự gốc + " (bản sao)" = 100 ký tự (TC ghi "89 ký tự đầu" — nhầm số học, 89 + 10 = 99; AC-14.1 chỉ yêu cầu tổng ≤ 100). |
| TC-059 | AC-14.5, AC-15.5 | Fail | [TC-059-1.png](screenshots/TC-059-1.png), [TC-059-fail.png](screenshots/TC-059-fail.png) | Lỗi: nhân bản giáo trình thất bại báo "Không thể kết nối tới máy chủ. Vui lòng thử lại.". Phần nhân bản Bài: Pass. |
| TC-060 | AC-15.1 | Pass | [TC-060-1.png](screenshots/TC-060-1.png) |  |
| TC-061 | AC-15.2, AC-15.3, AC-15.4 | Pass | [TC-061-1.png](screenshots/TC-061-1.png) | Tiền điều kiện điều chỉnh: bộ AI ở trạng thái Đã xuất bản (mục AI duyệt luôn bắt đầu ở Đã xuất bản — AC-9.6, AC-11.5), không thể là Nháp. |
| TC-062 | AC-15.6, AC-17.5 | Pass | [TC-062-1.png](screenshots/TC-062-1.png) |  |
| TC-063 | AC-16.1, AC-16.10 | Pass | [TC-063-1.png](screenshots/TC-063-1.png) |  |
| TC-064 | AC-16.1, AC-16.2 | Pass | [TC-064-1.png](screenshots/TC-064-1.png) |  |
| TC-065 | AC-16.3, AC-16.4, AC-16.5 | Pass | [TC-065-1.png](screenshots/TC-065-1.png) |  |
| TC-066 | AC-16.6 | Pass | [TC-066-1.png](screenshots/TC-066-1.png) |  |
| TC-067 | AC-16.7, AC-16.8, AC-16.9 | Pass | [TC-067-1.png](screenshots/TC-067-1.png) |  |
| TC-068 | AC-17.1, AC-17.2, NFR-6 | Pass | [TC-068-1.png](screenshots/TC-068-1.png) |  |
| TC-069 | AC-17.4 | Pass | [TC-069-1.png](screenshots/TC-069-1.png), [TC-069-2.png](screenshots/TC-069-2.png) |  |
| TC-070 | AC-17.5 | Pass | [TC-070-1.png](screenshots/TC-070-1.png) |  |
| TC-071 | NFR-2 | Pass | — | NFR-2: T06 262 ms, T18 179 ms, Lên trên 132 ms, xuất bản mục 133 ms, lưu trữ 124 ms, đổi tên 18 ms, Web→Mobile 45 ms, duyệt AI 30+30 17 ms. |
| TC-072 | NFR-3 | Pass | — | NFR-3: nhân bản Bài 60 mục 29 ms; giáo trình 20 Bài / 400 mục 100 ms. |
| TC-073 | NFR-5 | Thủ công | — | Thủ công — hướng dẫn trong test-cases.md. |
| TC-074 | NFR-7 | Thủ công | — | Thủ công — hướng dẫn trong test-cases.md. |
| TC-075 | NFR-8, AC-3.3 | Pass | [TC-075-1.png](screenshots/TC-075-1.png) |  |
| TC-076 | AC-2.4, AC-10.6 | Pass | — |  |
| TC-077 | AC-7.2, AC-8.2 | Pass | [TC-077-1.png](screenshots/TC-077-1.png) |  |
| TC-078 | AC-17.3 | Pass | [TC-078-1.png](screenshots/TC-078-1.png) |  |

## Fail

### TC-018 — Tên bài điền sẵn sai khi T06 còn hiển thị dữ liệu cũ (AC-5.1)

- **Bước:** GV thêm "Bài 1" từ T06 (T18 mở) → bấm đường dẫn về giáo trình → bấm ngay "Thêm bài" (mạng chậm: `GET /api/curricula/<id>`
  trả lời sau 1,5 s — script dùng `page.route` để tái hiện ổn định; khi chạy song song lỗi cũng xảy ra không cần làm chậm).
- **Mong đợi:** hộp "Thêm bài" điền sẵn "Bài 2" (N = số Bài hiện có + 1).
- **Thực tế:** điền sẵn "Bài 1"; danh sách phía sau đã cập nhật "1 bài" nhưng tên trong hộp vẫn là "Bài 1".
- **Bằng chứng:** [TC-018-2.png](screenshots/TC-018-2.png), [TC-018-fail.png](screenshots/TC-018-fail.png).
- **Chẩn đoán (gợi ý cho /module 002):** T06 vẽ ngay bản chi tiết giáo trình còn trong store (trước khi thêm Bài) trong lúc tải lại;
  `LessonNameDialog` lấy `initialName` một lần khi mở. Cần lấy tên điền sẵn từ dữ liệu mới nhất (ví dụ không cho "Thêm bài" khi đang
  tải lại, hoặc tính lại tên khi danh sách cập nhật mà GV chưa sửa ô).

### TC-059 — Nhân bản giáo trình thất bại hiển thị sai thông báo (AC-15.5)

- **Bước:** `POST /api/dev/curriculum/faults {"op":"duplicate-curriculum","fail":true}` → T06 "Nhân bản" → "Nhân bản".
- **Mong đợi:** "Nhân bản không thành công. Vui lòng thử lại." và không có bản sao.
- **Thực tế:** hộp thoại hiện "Không thể kết nối tới máy chủ. Vui lòng thử lại."; không có bản sao (T05 tìm "… (bản sao" → "Không tìm thấy
  giáo trình phù hợp", kiểm qua API: không có giáo trình bản sao). API trả đúng 503 `COPY_FAILED` với thông báo đúng.
- **Bằng chứng:** [TC-059-1.png](screenshots/TC-059-1.png) (nhân bản Bài thất bại — đúng), [TC-059-fail.png](screenshots/TC-059-fail.png).
- **Chẩn đoán:** `CurriculumFormDialog` dùng `formFailure(err)`, hàm này đổi mọi lỗi ≥ 500 thành thông báo mất kết nối; cần hiển thị
  `err.message` cho mã `COPY_FAILED` (như `messageOf` trong `features/curriculum/errors.ts` đã làm cho nhân bản Bài).

## Bị chặn

### TC-038 — A05 trên trang Bài của HV (AC-10.5, phần giao diện)

- Mọi kỳ vọng phía API và chuyển hướng đều đạt: 5 yêu cầu `/api/learn/*` tới Bài Nháp, mục Nháp, mục Lưu trữ, Bài của giáo trình
  không thuộc lớp nào của HV, mục đã xóa → cùng 404 `NOT_FOUND` "Không tìm thấy nội dung bạn yêu cầu.", không lộ tên; HV mở T05, T06,
  T18, T07, T21 → về S01 (AC-17.3 Pass).
- Bước cuối "mở `/hv/lop/x/bai/<Bài 2>` hiển thị A05" không thực hiện được: S11 "Trang bài" thuộc module 003, trong bản 002 chỉ là trang
  tạm "Đang xây dựng · S11 Trang bài" ([TC-038-2.png](screenshots/TC-038-2.png)). Chạy lại TC-038 khi 002 được tích hợp cùng 003.

## Thủ công

- **TC-073 (NFR-5):** dùng chỉ bàn phím và trình đọc màn hình (NVDA/VoiceOver) trên T05, T06, T18, T07, T21; chạy axe DevTools trên từng
  màn. Đạt khi mọi thao tác làm được bằng bàn phím và 0 lỗi WCAG 2.1 AA nghiêm trọng. (Đã kiểm tự động phần bàn phím của sắp xếp Bài —
  TC-022 — và các công tắc / nhóm chọn T21.)
- **TC-074 (NFR-7):** `npm run dev`, thực hiện tạo, sửa, sắp xếp, xuất bản, xóa, nhân bản, lưu trữ, khôi phục, duyệt AI; mỗi thao tác phải
  có một dòng log `msg: "curriculum"` với `action`, `result`, id người thực hiện / đối tượng (duyệt AI kèm `newCount`, `deletedCount`,
  `archivedCount`), không có nội dung bài học, tên hay e-mail.

## Ghi chú cho lần chạy sau

- Lỗi giả lập `/api/dev/curriculum/faults` là toàn máy chủ: khi `test:modules` chạy song song, một TC nhân bản khác (TC-061) có thể dùng
  mất lỗi giả lập của TC-059 / TC-062. Nếu hai TC này đỏ bất thường khi chạy song song, chạy lại riêng từng TC.
- `sdd run test:modules -- 002 TC-a TC-b` (nhiều TC) không chạy được trên Windows: runner ghép bộ lọc bằng `|` và shell Windows hiểu là
  pipe ("0/0 Pass"). Chạy từng TC một.
