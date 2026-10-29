# QA 006 Bài thi — lần chạy 2026-10-29-0835

- **Thời điểm:** 2026-10-29 08:35 → 09:00 (giờ Việt Nam). **Commit:** ea4d012 (`feat/006-exams`; ứng dụng không đổi so với f9bd893 — bản sửa F1–F5).
- **Máy chủ:** e2e hermetic `node tests/e2e/server.mjs` (build production + MongoDB trong bộ nhớ, seed dev), cổng 4173, một cơ sở dữ liệu cho
  cả lượt; đồng hồ máy chủ được trả về giờ thật sau mỗi ca có dời giờ.
- **Trình duyệt:** Playwright MCP (Chromium) — GV 1280 × 800, HV 390 × 844 (ngữ cảnh trình duyệt thứ hai); script replay: Chromium headless,
  cùng khung nhìn (TC-113 360 × 740, TC-073 thiết bị 2 412 × 915, TC-017 `America/New_York`, TC-109 `Asia/Tokyo` + lệch +3 giờ).
- **Kết quả:** **112/112 ca E2E + API Pass**, 0 Fail, 0 Bị chặn, 3 Thủ công (TC-112, TC-114, TC-115 — hướng dẫn trong test-cases.md).

## Cách chạy

1. **Phiên QA độc lập, Playwright MCP chạy được** (lần trước bị khóa hồ sơ). Sáu ca Fail của lần 2026-10-29-0304 (TC-019, TC-021, TC-035,
   TC-036, TC-044, TC-059) được chạy lại **như người dùng** qua MCP: điều hướng T10 → bấm tên bài thi, điền ô theo nhãn, bấm nút theo tên;
   dữ liệu tiền điều kiện (HV mới đã kích hoạt, lớp, bài thi E3 / 5 câu, dời đồng hồ) tạo qua API như test-cases.md "Dữ liệu và tài khoản
   dùng chung". TC-036 là ca API, chạy bằng lời gọi HTTP. Các bước ghi trong [results.json](results.json) (trường `steps`, `mcp`).
2. **Hồi quy toàn bộ:** cả 112 script `testing/e2e/TC-###.spec.ts` chạy tuần tự một lượt (`--workers=1`, 13,7 phút):
   [full-run.log](full-run.log), [playwright.json](playwright.json) — 110 passed, 2 failed (TC-040, TC-110), cả hai **ở bước dựng dữ liệu**,
   trước khi chạm tới bài thi (xem dưới). Chạy lại một lần hai ca này: 2 passed ([retry/retry.log](retry/retry.log), [retry/playwright.json](retry/playwright.json)).
3. Ảnh: `screenshots/` (`TC-###-n.png`; ảnh của 6 ca chạy MCP bị script replay ghi đè cùng tên, trừ `TC-019-3.png`, `TC-035-2.png` là ảnh MCP).
4. Script: `TC-022.spec.ts` sửa kiểu (ép kiểu câu nối cặp) để `run typecheck` gốc xanh — hành vi và kỳ vọng không đổi; không script nào khác đổi.

## Kết quả từng ca

| TC | AC / NFR | Kết quả | Bằng chứng | Ghi chú |
|----|----------|---------|-----------|---------|
| TC-001 | AC-1.1 | Pass | [TC-001-1.png](screenshots/TC-001-1.png) | |
| TC-002 | AC-1.2 | Pass | [TC-002-1.png](screenshots/TC-002-1.png) | |
| TC-003 | AC-1.3 | Pass | [TC-003-1.png](screenshots/TC-003-1.png) | |
| TC-004 | AC-1.4 | Pass | [TC-004-1.png](screenshots/TC-004-1.png) | |
| TC-005 | AC-1.5 | Pass | [TC-005-1.png](screenshots/TC-005-1.png) | |
| TC-006 | AC-1.6 | Pass | [TC-006-1.png](screenshots/TC-006-1.png) | |
| TC-007 | AC-2.1 | Pass | [TC-007-1.png](screenshots/TC-007-1.png) | |
| TC-008 | AC-2.2 | Pass | [TC-008-1.png](screenshots/TC-008-1.png) | |
| TC-009 | AC-2.3 | Pass | [TC-009-1.png](screenshots/TC-009-1.png) | |
| TC-010 | AC-2.3 | Pass | — | |
| TC-011 | AC-2.4 | Pass | [TC-011-1.png](screenshots/TC-011-1.png) | |
| TC-012 | AC-2.5 | Pass | [TC-012-1.png](screenshots/TC-012-1.png) | |
| TC-013 | AC-2.6 | Pass | [TC-013-1.png](screenshots/TC-013-1.png) | |
| TC-014 | AC-2.7 | Pass | [TC-014-1.png](screenshots/TC-014-1.png) | |
| TC-015 | AC-2.8 | Pass | [TC-015-1.png](screenshots/TC-015-1.png) [TC-015-2.png](screenshots/TC-015-2.png) | |
| TC-016 | AC-3.1 | Pass | [TC-016-1.png](screenshots/TC-016-1.png) | |
| TC-017 | AC-3.2 | Pass | [TC-017-1.png](screenshots/TC-017-1.png) | |
| TC-018 | AC-3.2 | Pass | [TC-018-1.png](screenshots/TC-018-1.png) | |
| TC-019 | AC-3.3 | Pass | [TC-019-1.png](screenshots/TC-019-1.png) [TC-019-2.png](screenshots/TC-019-2.png) [TC-019-3.png](screenshots/TC-019-3.png) | MCP + replay. F2 đã sửa: cả hai câu hiện dưới Giờ đóng (mô tả truy cập của ô). Xem quan sát Q1 |
| TC-020 | AC-3.4 | Pass | [TC-020-1.png](screenshots/TC-020-1.png) [TC-020-2.png](screenshots/TC-020-2.png) | |
| TC-021 | AC-3.5 | Pass | [TC-021-1.png](screenshots/TC-021-1.png) | MCP + replay. F3 đã sửa: từng mục đưa tiêu điểm tới Tên / Chọn lớp… / Giờ mở / Thời lượng / Giờ đóng. Xem quan sát Q2 |
| TC-022 | AC-3.5 | Pass | [TC-022-1.png](screenshots/TC-022-1.png) | |
| TC-023 | AC-3.6 | Pass | [TC-023-1.png](screenshots/TC-023-1.png) [TC-023-2.png](screenshots/TC-023-2.png) | |
| TC-024 | AC-3.7 | Pass | [TC-024-1.png](screenshots/TC-024-1.png) [TC-024-2.png](screenshots/TC-024-2.png) | |
| TC-025 | AC-3.8 | Pass | [TC-025-1.png](screenshots/TC-025-1.png) [TC-025-2.png](screenshots/TC-025-2.png) | |
| TC-026 | AC-3.8 | Pass | [TC-026-1.png](screenshots/TC-026-1.png) | |
| TC-027 | AC-4.1 | Pass | [TC-027-1.png](screenshots/TC-027-1.png) [TC-027-2.png](screenshots/TC-027-2.png) | |
| TC-028 | AC-4.1 | Pass | — | |
| TC-029 | AC-4.2 | Pass | [TC-029-1.png](screenshots/TC-029-1.png) | |
| TC-030 | AC-4.2 | Pass | — | |
| TC-031 | AC-4.3 | Pass | [TC-031-1.png](screenshots/TC-031-1.png) | |
| TC-032 | AC-4.4 | Pass | [TC-032-1.png](screenshots/TC-032-1.png) | |
| TC-033 | AC-4.4 | Pass | — | |
| TC-034 | AC-5.1 | Pass | [TC-034-1.png](screenshots/TC-034-1.png) | |
| TC-035 | AC-5.2 | Pass | [TC-035-1.png](screenshots/TC-035-1.png) [TC-035-2.png](screenshots/TC-035-2.png) | MCP + replay. F1 đã sửa: đồng hồ HV 19:06 → 48:42 trong < 10 s, không tải lại |
| TC-036 | AC-5.2 | Pass | — | API (Node) + replay. F1 đã sửa: PUT 200, endsAt không đổi |
| TC-037 | AC-5.3 | Pass | [TC-037-1.png](screenshots/TC-037-1.png) | |
| TC-038 | AC-5.4 | Pass | [TC-038-1.png](screenshots/TC-038-1.png) | |
| TC-039 | AC-5.5 | Pass | [TC-039-1.png](screenshots/TC-039-1.png) [TC-039-2.png](screenshots/TC-039-2.png) | |
| TC-040 | AC-6.1 | Pass | [TC-040-1.png](screenshots/TC-040-1.png) [TC-040-2.png](screenshots/TC-040-2.png) | Lần 1 Fail ở bước dựng dữ liệu (HV mới kẹt "sending" > 15 s, 001); chạy lại Pass (retry/) |
| TC-041 | AC-6.2 | Pass | [TC-041-1.png](screenshots/TC-041-1.png) | |
| TC-042 | AC-6.3 | Pass | [TC-042-1.png](screenshots/TC-042-1.png) [TC-042-2.png](screenshots/TC-042-2.png) | |
| TC-043 | AC-6.4 | Pass | [TC-043-1.png](screenshots/TC-043-1.png) | |
| TC-044 | AC-6.5 | Pass | [TC-044-1.png](screenshots/TC-044-1.png) [TC-044-2.png](screenshots/TC-044-2.png) | MCP + replay. F4 đã sửa: bấm được "Khôi phục" trong menu "⋯" |
| TC-045 | AC-6.6 | Pass | [TC-045-1.png](screenshots/TC-045-1.png) [TC-045-2.png](screenshots/TC-045-2.png) | |
| TC-046 | AC-6.6 | Pass | — | |
| TC-047 | AC-7.1 | Pass | [TC-047-1.png](screenshots/TC-047-1.png) [TC-047-2.png](screenshots/TC-047-2.png) | |
| TC-048 | AC-7.2 | Pass | [TC-048-1.png](screenshots/TC-048-1.png) | |
| TC-049 | AC-7.3 | Pass | [TC-049-1.png](screenshots/TC-049-1.png) | |
| TC-050 | AC-7.4 | Pass | [TC-050-1.png](screenshots/TC-050-1.png) | |
| TC-051 | AC-7.5 | Pass | [TC-051-1.png](screenshots/TC-051-1.png) | |
| TC-052 | AC-7.6 | Pass | [TC-052-1.png](screenshots/TC-052-1.png) [TC-052-2.png](screenshots/TC-052-2.png) | |
| TC-053 | AC-7.7 | Pass | [TC-053-1.png](screenshots/TC-053-1.png) | |
| TC-054 | AC-7.8 | Pass | [TC-054-1.png](screenshots/TC-054-1.png) | |
| TC-055 | AC-8.1 | Pass | [TC-055-1.png](screenshots/TC-055-1.png) | |
| TC-056 | AC-8.2 | Pass | [TC-056-1.png](screenshots/TC-056-1.png) [TC-056-2.png](screenshots/TC-056-2.png) | |
| TC-057 | AC-8.3 | Pass | [TC-057-1.png](screenshots/TC-057-1.png) [TC-057-2.png](screenshots/TC-057-2.png) | |
| TC-058 | AC-8.4 | Pass | [TC-058-1.png](screenshots/TC-058-1.png) | |
| TC-059 | AC-8.4 | Pass | [TC-059-1.png](screenshots/TC-059-1.png) | MCP + replay. F5 đã sửa: POST …/start 409 → ở lại S07, "Đã nộp · 100/100", thông báo "Bài thi đã được nộp." |
| TC-060 | AC-8.4 | Pass | [TC-060-1.png](screenshots/TC-060-1.png) | |
| TC-061 | AC-8.4 | Pass | — | |
| TC-062 | AC-8.5 | Pass | [TC-062-1.png](screenshots/TC-062-1.png) [TC-062-2.png](screenshots/TC-062-2.png) | |
| TC-063 | AC-8.6 | Pass | [TC-063-1.png](screenshots/TC-063-1.png) | |
| TC-064 | AC-9.1 | Pass | [TC-064-1.png](screenshots/TC-064-1.png) [TC-064-2.png](screenshots/TC-064-2.png) | |
| TC-065 | AC-9.2 | Pass | [TC-065-1.png](screenshots/TC-065-1.png) | |
| TC-066 | AC-9.3 | Pass | [TC-066-1.png](screenshots/TC-066-1.png) [TC-066-2.png](screenshots/TC-066-2.png) | |
| TC-067 | AC-9.4 | Pass | [TC-067-1.png](screenshots/TC-067-1.png) [TC-067-2.png](screenshots/TC-067-2.png) | |
| TC-068 | AC-9.4 | Pass | [TC-068-1.png](screenshots/TC-068-1.png) | |
| TC-069 | AC-9.5 | Pass | [TC-069-1.png](screenshots/TC-069-1.png) | |
| TC-070 | AC-10.1 | Pass | [TC-070-1.png](screenshots/TC-070-1.png) | |
| TC-071 | AC-10.2 | Pass | [TC-071-1.png](screenshots/TC-071-1.png) | |
| TC-072 | AC-10.2, AC-12.2 | Pass | — | |
| TC-073 | AC-10.3 | Pass | [TC-073-1.png](screenshots/TC-073-1.png) | |
| TC-074 | AC-10.3 | Pass | [TC-074-1.png](screenshots/TC-074-1.png) | |
| TC-075 | AC-10.4 | Pass | [TC-075-1.png](screenshots/TC-075-1.png) [TC-075-2.png](screenshots/TC-075-2.png) | |
| TC-076 | AC-10.5 | Pass | [TC-076-1.png](screenshots/TC-076-1.png) | |
| TC-077 | AC-11.1 | Pass | [TC-077-1.png](screenshots/TC-077-1.png) [TC-077-2.png](screenshots/TC-077-2.png) | |
| TC-078 | AC-11.2 | Pass | [TC-078-1.png](screenshots/TC-078-1.png) | |
| TC-079 | AC-11.3 | Pass | — | |
| TC-080 | AC-11.4 | Pass | [TC-080-1.png](screenshots/TC-080-1.png) [TC-080-2.png](screenshots/TC-080-2.png) | |
| TC-081 | AC-11.4 | Pass | [TC-081-1.png](screenshots/TC-081-1.png) | |
| TC-082 | AC-12.1 | Pass | — | |
| TC-083 | AC-12.1 | Pass | — | |
| TC-084 | AC-12.3 | Pass | [TC-084-1.png](screenshots/TC-084-1.png) [TC-084-2.png](screenshots/TC-084-2.png) | |
| TC-085 | AC-12.3 | Pass | [TC-085-1.png](screenshots/TC-085-1.png) | |
| TC-086 | AC-12.4 | Pass | [TC-086-1.png](screenshots/TC-086-1.png) | |
| TC-087 | AC-12.5 | Pass | [TC-087-1.png](screenshots/TC-087-1.png) | |
| TC-088 | AC-13.1 | Pass | [TC-088-1.png](screenshots/TC-088-1.png) | |
| TC-089 | AC-13.2 | Pass | — | |
| TC-090 | AC-13.3 | Pass | — | |
| TC-091 | AC-13.4 | Pass | — | |
| TC-092 | AC-13.5 | Pass | — | |
| TC-093 | AC-13.6 | Pass | — | |
| TC-094 | AC-14.1 | Pass | [TC-094-1.png](screenshots/TC-094-1.png) [TC-094-2.png](screenshots/TC-094-2.png) | |
| TC-095 | AC-14.2 | Pass | [TC-095-1.png](screenshots/TC-095-1.png) [TC-095-2.png](screenshots/TC-095-2.png) | |
| TC-096 | AC-14.3 | Pass | [TC-096-1.png](screenshots/TC-096-1.png) | |
| TC-097 | AC-14.4 | Pass | [TC-097-1.png](screenshots/TC-097-1.png) | |
| TC-098 | AC-14.5 | Pass | [TC-098-1.png](screenshots/TC-098-1.png) | |
| TC-099 | AC-15.1 | Pass | [TC-099-1.png](screenshots/TC-099-1.png) | |
| TC-100 | AC-15.2, AC-15.3 | Pass | [TC-100-1.png](screenshots/TC-100-1.png) [TC-100-2.png](screenshots/TC-100-2.png) | |
| TC-101 | AC-15.3 | Pass | [TC-101-1.png](screenshots/TC-101-1.png) | |
| TC-102 | AC-15.4 | Pass | [TC-102-1.png](screenshots/TC-102-1.png) | |
| TC-103 | AC-15.5 | Pass | [TC-103-1.png](screenshots/TC-103-1.png) | |
| TC-104 | AC-15.6 | Pass | [TC-104-1.png](screenshots/TC-104-1.png) | |
| TC-105 | AC-15.7 | Pass | [TC-105-1.png](screenshots/TC-105-1.png) | |
| TC-106 | AC-16.1, NFR-7 | Pass | [TC-106-1.png](screenshots/TC-106-1.png) | |
| TC-107 | AC-16.2, AC-16.3, AC-16.4, NFR-7 | Pass | [TC-107-1.png](screenshots/TC-107-1.png) | |
| TC-108 | AC-16.5 | Pass | [TC-108-1.png](screenshots/TC-108-1.png) | |
| TC-109 | NFR-1 | Pass | [TC-109-1.png](screenshots/TC-109-1.png) | |
| TC-110 | NFR-2, NFR-9 | Pass | — | Lần 1 Fail ở bước dựng dữ liệu (tạo 200 HV: "Request context disposed"); chạy lại Pass (retry/) |
| TC-111 | NFR-3 | Pass | — | |
| TC-112 | NFR-4, NFR-5, NFR-6 | Thủ công | — | Thủ công — hướng dẫn trong test-cases.md |
| TC-113 | NFR-8 | Pass | [TC-113-1.png](screenshots/TC-113-1.png) [TC-113-2.png](screenshots/TC-113-2.png) | |
| TC-114 | NFR-8 | Thủ công | — | Thủ công — hướng dẫn trong test-cases.md |
| TC-115 | NFR-10 | Thủ công | — | Thủ công — hướng dẫn trong test-cases.md |

## Hai ca Fail ở lượt đầu rồi Pass khi chạy lại (thời gian / dữ liệu, không phải 006)

- **TC-040** (AC-6.1): `freshStudents` — HV vừa tạo + "Kích hoạt" vẫn ở trạng thái `sending` sau 15 s (`GET /api/students/<id>`), lượt chạy
  dừng ở `helpers.ts:86` trước khi mở T10. Ca liền trước (TC-039) và liền sau (TC-041) dựng HV bình thường; chạy lại: Pass (4,2 s).
  Gợi ý cho chủ 001: gửi mail kích hoạt bất đồng bộ đôi khi > 15 s trên server e2e khi đã có hàng trăm HV — theo dõi, chưa đủ để báo lỗi.
- **TC-110** (NFR-2, NFR-9): dựng 200 HV qua `workspaceWithStudents` (005 helpers) → `apiRequestContext.fetch: Request context disposed`
  ở `POST /api/students` sau 12,8 s; chạy lại: Pass (19,0 s) — 200 lượt kết thúc cùng lúc đều tự nộp, mọi HV vắng có "Không làm bài".

## Quan sát (không phải Fail)

- **Q1 — TC-019 bước 2 (câu chữ TC):** làm đúng chữ "Giờ đóng hôm qua" khi Giờ mở vẫn là ngày mai 20:00 thì Giờ đóng vi phạm cả hai quy tắc
  của AC-3.3; trang hiện câu "…ít nhất bằng thời lượng làm bài (45 phút)." (AC ghi "hoặc" — chấp nhận được). Câu "Giờ đóng phải ở tương lai."
  hiện đúng dưới Giờ đóng khi Giờ mở cũng ở quá khứ (cách script làm; khi đó Giờ mở có thêm "Giờ mở không được sớm hơn thời điểm hiện tại").
  Đề nghị `/module 006` ghi rõ bước 2: "Giờ mở hôm kia, Giờ đóng hôm qua".
- **Q2 — TC-021:** mục "Bài thi cần ít nhất 1 câu hỏi" giữ tiêu điểm ở chính nó (không có ô để đưa tới); có thể đưa tới "Thêm câu hỏi". Không
  thuộc bước của TC.
- TC-009 (câu chữ "phương án trùng"), TC-005 (chữ cạnh công tắc không bấm được), TC-002, TC-111: như lần chạy 2026-10-29-0304, chưa đổi.
- Console: chỉ `401 /api/session` khi mở trang lúc chưa đăng nhập (đúng) và cảnh báo React Router "No `HydrateFallback`"; không có lỗi
  `/api` ngoài các 409 chờ đợi (TC-059).
