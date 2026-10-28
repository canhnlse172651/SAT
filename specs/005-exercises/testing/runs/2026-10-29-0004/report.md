# QA run 005 — 2026-10-29-0004

- **Ngày:** 2026-10-28 23:50 → 2026-10-29 00:30 (giờ Việt Nam) · **Commit:** c1798b7 (feat/005-exercises) · **Người chạy:** /test-module 005
- **Máy chủ:** `tests/e2e/server.mjs` (bản build `run build` của commit này, MongoDB trong bộ nhớ, NODE_ENV=test, seed "Workspace của Cô Lan"),
  `http://127.0.0.1:4173`. Lần chạy hồi quy đầy đủ bắt đầu trên cơ sở dữ liệu sạch.
- **Trình duyệt:** Chromium (Playwright), GV 1280 × 800, HV 390 × 844 (TC-119: 360 / 430 px; TC-110: múi giờ America/Bogota).
- **Cách chạy:**
  1. Cập nhật script theo test case đã đổi (V19-1 / V19-2): TC-012, TC-100, TC-103, TC-105; viết script mới TC-130 (AC-21.9). Mỗi ca chạy riêng
     (`node .sdd/scripts/sdd.mjs run test:modules -- 005 TC-###`) và đối chiếu với kết quả mong đợi của test case.
  2. Hồi quy toàn bộ 125 script: `node .sdd/scripts/sdd.mjs run test:modules -- 005` — Playwright chạy **3 worker song song** (cấu hình replay
     không đặt `workers`): 113/125 Pass trong 6,8 phút. Kết quả thô: [playwright.json](playwright.json).
  3. 12 ca Fail ở bước 2 được chạy lại **từng ca một, tuần tự** trên một máy chủ sạch: 10 Pass, TC-130 Fail (lỗi thật), TC-122 Bị chặn
     (môi trường). TC-118 chạy lại 1 lần vì ECONNRESET của máy chủ in-memory. Kết quả thô: [reruns/](reruns/).
- **Playwright MCP không dùng được:** hồ sơ `mcp-chrome-7c84bcd` vẫn bị một Chrome giữ (tiến trình MCP `node …@playwright/mcp/cli.js` PID 40720,
  khởi động 2026-10-28 14:06, của phiên trước) → "Browser is already in use". Không đóng tiến trình của phiên khác; mọi ca chạy bằng script
  Playwright trên Chromium thật (như lần chạy 2026-10-28-1452), quan sát bằng ảnh chụp và error-context thay cho `browser_snapshot`.
- **Thứ tự / phụ thuộc:** các ca độc lập (mỗi ca tạo giáo trình, lớp riêng) nhưng dùng chung 3 HV seed và **đồng hồ máy chủ chung**: TC-109,
  TC-110, TC-125 dời đồng hồ (làm hết hạn phiên của ca khác → 401 `expired`), TC-116/123/124 đo thời gian. Vì vậy kết quả chính thức của các
  ca đó lấy từ lần chạy tuần tự. TC-027, TC-028, TC-115, TC-118 dùng workspace GV riêng.

## Tóm tắt

**123/126 ca tự động Pass** (E2E + API), **1 Fail** (TC-130), **2 Bị chặn** (TC-102 — chờ 006; TC-122 — thiếu dung lượng ổ đĩa), **4 Thủ công**
(TC-126 … TC-129, hướng dẫn trong test-cases.md). Tổng 130.

- Mọi lỗi B1–B16 của lần chạy 2026-10-28-1452 đã hết: TC-019, 029, 038, 042, 051, 075, 080, 082, 083, 088, 095, 117, 119, 120, 123, 124 nay Pass;
  TC-012, 100, 103, 105 Pass theo test case mới (V19-1 / V19-2).
- Lỗi mới: **F1** — AC-21.9, HV bị gỡ khỏi lớp trong lúc làm bài: lưu / nộp bị từ chối đúng thông báo nhưng HV không được đưa về S01.
- `sdd trace 005`: mọi AC có task và script, trừ **AC-20.7** (TC-102, 006 chưa xây).
- Ghi chú công cụ (không phải lỗi của 005, chủ sở hữu: `scripts/replay-module-tests.mjs` / `playwright.modules.config.ts`):
  (a) trên Windows, `run test:modules -- 005 TC-a TC-b` hỏng — bộ lọc `-g "TC-a\b|TC-b\b"` đi qua `cmd` (`shell: true`) và `|` bị hiểu là ống
  dẫn ("The system cannot find the path specified."), chỉ chạy được một TC mỗi lần; (b) replay chạy song song theo số CPU nên các ca dời đồng
  hồ / đo thời gian làm hỏng ca khác — nên đặt `workers: 1` cho replay module; (c) các lần chạy trong cùng một phút ghi đè thư mục
  `<stamp>-replay` của nhau.
- TC-124 (NFR-13) đạt sát ngưỡng: quay lại tab Bài tập 963 ms (≤ 1 000 ms) khi chạy riêng, 1 244 ms khi máy đang tải.

| TC | AC / NFR | Kết quả | Bằng chứng | Ghi chú |
|----|----------|---------|------------|---------|
| TC-001 | AC-1.1, AC-1.8 | Pass | [TC-001-1.png](screenshots/TC-001-1.png) |  |
| TC-002 | AC-1.1 | Pass | [TC-002-1.png](screenshots/TC-002-1.png) |  |
| TC-003 | AC-1.2 | Pass | [TC-003-1.png](screenshots/TC-003-1.png) [TC-003-2.png](screenshots/TC-003-2.png) |  |
| TC-004 | AC-1.3 | Pass | [TC-004-1.png](screenshots/TC-004-1.png) |  |
| TC-005 | AC-1.4 | Pass | [TC-005-1.png](screenshots/TC-005-1.png) |  |
| TC-006 | AC-1.5 | Pass | [TC-006-1.png](screenshots/TC-006-1.png) [TC-006-2.png](screenshots/TC-006-2.png) |  |
| TC-007 | AC-1.6 | Pass | [TC-007-1.png](screenshots/TC-007-1.png) [TC-007-2.png](screenshots/TC-007-2.png) |  |
| TC-008 | AC-1.7 | Pass | [TC-008-1.png](screenshots/TC-008-1.png) |  |
| TC-009 | AC-1.9, AC-1.12 | Pass | [TC-009-1.png](screenshots/TC-009-1.png) [TC-009-2.png](screenshots/TC-009-2.png) |  |
| TC-010 | AC-1.10 | Pass | [TC-010-1.png](screenshots/TC-010-1.png) [TC-010-2.png](screenshots/TC-010-2.png) |  |
| TC-011 | AC-1.11 | Pass | [TC-011-1.png](screenshots/TC-011-1.png) |  |
| TC-012 | AC-1.13, AC-21.2 | Pass | [TC-012-1.png](screenshots/TC-012-1.png) [TC-012-2.png](screenshots/TC-012-2.png) [TC-012-3.png](screenshots/TC-012-3.png) | Script cập nhật (V19-1): HV → S01. |
| TC-013 | AC-1.14, AC-12.10 | Pass | [TC-013-1.png](screenshots/TC-013-1.png) |  |
| TC-014 | AC-1.15 | Pass | [TC-014-1.png](screenshots/TC-014-1.png) |  |
| TC-015 | AC-1.8 | Pass | [TC-015-1.png](screenshots/TC-015-1.png) |  |
| TC-016 | AC-2.1, AC-2.3 | Pass | [TC-016-1.png](screenshots/TC-016-1.png) [TC-016-2.png](screenshots/TC-016-2.png) |  |
| TC-017 | AC-2.2 | Pass | [TC-017-1.png](screenshots/TC-017-1.png) |  |
| TC-018 | AC-2.4, AC-2.6, AC-12.14 | Pass | [TC-018-1.png](screenshots/TC-018-1.png) |  |
| TC-019 | AC-2.5 | Pass | [TC-019-1.png](screenshots/TC-019-1.png) | Lần trước Fail, nay Pass. |
| TC-020 | AC-2.6, AC-12.2 | Pass | [TC-020-1.png](screenshots/TC-020-1.png) [TC-020-2.png](screenshots/TC-020-2.png) |  |
| TC-021 | AC-2.6, AC-10.2 | Pass | [TC-021-1.png](screenshots/TC-021-1.png) |  |
| TC-022 | AC-2.7, AC-12.1 | Pass | [TC-022-1.png](screenshots/TC-022-1.png) [TC-022-2.png](screenshots/TC-022-2.png) |  |
| TC-023 | AC-3.1 | Pass | [TC-023-1.png](screenshots/TC-023-1.png) |  |
| TC-024 | AC-3.2 | Pass | [TC-024-1.png](screenshots/TC-024-1.png) [TC-024-2.png](screenshots/TC-024-2.png) |  |
| TC-025 | AC-3.3 | Pass | [TC-025-1.png](screenshots/TC-025-1.png) [TC-025-2.png](screenshots/TC-025-2.png) |  |
| TC-026 | AC-3.4 | Pass | [TC-026-1.png](screenshots/TC-026-1.png) [TC-026-2.png](screenshots/TC-026-2.png) |  |
| TC-027 | AC-3.5 | Pass | [TC-027-1.png](screenshots/TC-027-1.png) |  |
| TC-028 | AC-3.6 | Pass | [TC-028-1.png](screenshots/TC-028-1.png) [TC-028-2.png](screenshots/TC-028-2.png) |  |
| TC-029 | AC-4.1 | Pass | [TC-029-1.png](screenshots/TC-029-1.png) [TC-029-2.png](screenshots/TC-029-2.png) | Lần trước Fail, nay Pass. |
| TC-030 | AC-4.2, AC-4.3, AC-4.4 | Pass | [TC-030-1.png](screenshots/TC-030-1.png) |  |
| TC-031 | AC-4.5, AC-4.7 | Pass | [TC-031-1.png](screenshots/TC-031-1.png) [TC-031-2.png](screenshots/TC-031-2.png) |  |
| TC-032 | AC-4.6, AC-4.8 | Pass | [TC-032-1.png](screenshots/TC-032-1.png) [TC-032-2.png](screenshots/TC-032-2.png) |  |
| TC-033 | AC-5.1 | Pass | [TC-033-1.png](screenshots/TC-033-1.png) |  |
| TC-034 | AC-5.2, AC-5.3, AC-5.4 | Pass | [TC-034-1.png](screenshots/TC-034-1.png) |  |
| TC-035 | AC-5.5 | Pass | [TC-035-1.png](screenshots/TC-035-1.png) [TC-035-2.png](screenshots/TC-035-2.png) |  |
| TC-036 | AC-6.1, AC-6.2 | Pass | [TC-036-1.png](screenshots/TC-036-1.png) |  |
| TC-037 | AC-6.3 | Pass | [TC-037-1.png](screenshots/TC-037-1.png) |  |
| TC-038 | AC-6.4, AC-6.5 | Pass | [TC-038-1.png](screenshots/TC-038-1.png) [TC-038-2.png](screenshots/TC-038-2.png) | Lần trước Fail, nay Pass. |
| TC-039 | AC-7.1, AC-7.2, AC-7.3 | Pass |  |  |
| TC-040 | AC-7.4 | Pass | [TC-040-1.png](screenshots/TC-040-1.png) |  |
| TC-041 | AC-7.5 | Pass | [TC-041-1.png](screenshots/TC-041-1.png) [TC-041-2.png](screenshots/TC-041-2.png) |  |
| TC-042 | AC-8.1, AC-8.2 | Pass | [TC-042-1.png](screenshots/TC-042-1.png) [TC-042-2.png](screenshots/TC-042-2.png) | Lần trước Fail, nay Pass. |
| TC-043 | AC-8.3 | Pass | [TC-043-1.png](screenshots/TC-043-1.png) |  |
| TC-044 | AC-8.4, AC-14.7 | Pass | [TC-044-1.png](screenshots/TC-044-1.png) [TC-044-2.png](screenshots/TC-044-2.png) |  |
| TC-045 | AC-8.5, AC-8.6 | Pass | [TC-045-1.png](screenshots/TC-045-1.png) [TC-045-2.png](screenshots/TC-045-2.png) |  |
| TC-046 | AC-8.7 | Pass |  |  |
| TC-047 | AC-9.1, AC-9.2, AC-9.3 | Pass | [TC-047-1.png](screenshots/TC-047-1.png) [TC-047-2.png](screenshots/TC-047-2.png) |  |
| TC-048 | AC-9.4, AC-9.5, AC-9.6 | Pass | [TC-048-1.png](screenshots/TC-048-1.png) [TC-048-2.png](screenshots/TC-048-2.png) | Chạy song song: Fail do race của script (đọc dòng trả lời ngay sau "Tiếp tục làm"), script sửa bằng chờ; chạy riêng: Pass. |
| TC-049 | AC-9.7 | Pass |  |  |
| TC-050 | AC-10.1, AC-10.3 | Pass | [TC-050-1.png](screenshots/TC-050-1.png) |  |
| TC-051 | AC-10.4 | Pass | [TC-051-1.png](screenshots/TC-051-1.png) | Lần trước Fail, nay Pass. |
| TC-052 | AC-10.5 | Pass |  |  |
| TC-053 | AC-11.1, AC-11.2 | Pass | [TC-053-1.png](screenshots/TC-053-1.png) [TC-053-2.png](screenshots/TC-053-2.png) |  |
| TC-054 | AC-11.3, AC-11.4 | Pass | [TC-054-1.png](screenshots/TC-054-1.png) [TC-054-2.png](screenshots/TC-054-2.png) |  |
| TC-055 | AC-11.5 | Pass |  |  |
| TC-056 | AC-12.3, AC-12.4, AC-12.8 | Pass | [TC-056-1.png](screenshots/TC-056-1.png) [TC-056-2.png](screenshots/TC-056-2.png) [TC-056-3.png](screenshots/TC-056-3.png) |  |
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
| TC-073 | AC-14.7, NFR-3 | Pass | [TC-073-1.png](screenshots/TC-073-1.png) [TC-073-2.png](screenshots/TC-073-2.png) |  |
| TC-074 | AC-14.8, NFR-3 | Pass |  |  |
| TC-075 | AC-14.9, AC-17.7 | Pass | [TC-075-1.png](screenshots/TC-075-1.png) [TC-075-2.png](screenshots/TC-075-2.png) | Chạy song song: Fail (đồng hồ máy chủ bị ca khác dời / timeout); chạy riêng: Pass. Lần trước Fail. |
| TC-076 | AC-15.1 | Pass | [TC-076-1.png](screenshots/TC-076-1.png) [TC-076-2.png](screenshots/TC-076-2.png) |  |
| TC-077 | AC-15.2 | Pass | [TC-077-1.png](screenshots/TC-077-1.png) | Chạy song song: Fail (đồng hồ máy chủ bị ca khác dời / timeout); chạy riêng: Pass. |
| TC-078 | AC-15.3 | Pass | [TC-078-1.png](screenshots/TC-078-1.png) | Chạy song song: Fail (đồng hồ máy chủ bị ca khác dời / timeout); chạy riêng: Pass. |
| TC-079 | AC-15.4 | Pass | [TC-079-1.png](screenshots/TC-079-1.png) [TC-079-2.png](screenshots/TC-079-2.png) |  |
| TC-080 | AC-15.5, NFR-3 | Pass |  | Lần trước Fail, nay Pass. |
| TC-081 | AC-16.1, AC-17.6 | Pass | [TC-081-1.png](screenshots/TC-081-1.png) |  |
| TC-082 | AC-16.2, AC-16.3, AC-16.4 | Pass | [TC-082-1.png](screenshots/TC-082-1.png) [TC-082-2.png](screenshots/TC-082-2.png) | Lần trước Fail, nay Pass. |
| TC-083 | AC-16.2 | Pass | [TC-083-1.png](screenshots/TC-083-1.png) [TC-083-2.png](screenshots/TC-083-2.png) | Lần trước Fail, nay Pass. |
| TC-084 | AC-16.5, NFR-9 | Pass | [TC-084-1.png](screenshots/TC-084-1.png) |  |
| TC-085 | AC-16.6 | Pass | [TC-085-1.png](screenshots/TC-085-1.png) |  |
| TC-086 | AC-17.1, AC-17.2 | Pass |  |  |
| TC-087 | AC-17.3, AC-17.5 | Pass | [TC-087-1.png](screenshots/TC-087-1.png) [TC-087-2.png](screenshots/TC-087-2.png) [TC-087-3.png](screenshots/TC-087-3.png) [TC-087-4.png](screenshots/TC-087-4.png) [TC-087-5.png](screenshots/TC-087-5.png) |  |
| TC-088 | AC-17.6 | Pass |  | Lần trước Fail, nay Pass. |
| TC-089 | AC-18.1, AC-18.2 | Pass | [TC-089-1.png](screenshots/TC-089-1.png) |  |
| TC-090 | AC-18.3 | Pass | [TC-090-1.png](screenshots/TC-090-1.png) [TC-090-2.png](screenshots/TC-090-2.png) |  |
| TC-091 | AC-18.4 | Pass | [TC-091-1.png](screenshots/TC-091-1.png) |  |
| TC-092 | AC-18.5 | Pass | [TC-092-1.png](screenshots/TC-092-1.png) |  |
| TC-093 | AC-18.6 | Pass | [TC-093-1.png](screenshots/TC-093-1.png) |  |
| TC-094 | AC-18.7 | Pass | [TC-094-1.png](screenshots/TC-094-1.png) |  |
| TC-095 | AC-19.1 | Pass | [TC-095-1.png](screenshots/TC-095-1.png) [TC-095-2.png](screenshots/TC-095-2.png) | Lần trước Fail, nay Pass. |
| TC-096 | AC-19.2, AC-19.3 | Pass | [TC-096-1.png](screenshots/TC-096-1.png) [TC-096-2.png](screenshots/TC-096-2.png) |  |
| TC-097 | AC-19.4, AC-19.5 | Pass | [TC-097-1.png](screenshots/TC-097-1.png) [TC-097-2.png](screenshots/TC-097-2.png) |  |
| TC-098 | AC-19.6 | Pass | [TC-098-1.png](screenshots/TC-098-1.png) |  |
| TC-099 | AC-20.1, AC-20.2, AC-20.3 | Pass | [TC-099-1.png](screenshots/TC-099-1.png) [TC-099-2.png](screenshots/TC-099-2.png) |  |
| TC-100 | AC-20.5, NFR-9 | Pass | [TC-100-1.png](screenshots/TC-100-1.png) [TC-100-2.png](screenshots/TC-100-2.png) [TC-100-3.png](screenshots/TC-100-3.png) [TC-100-4.png](screenshots/TC-100-4.png) | Script cập nhật (V19-1): HV → S01; GV khác / không có bài nộp → A05; chưa đăng nhập → A01. |
| TC-101 | AC-20.6 | Pass | [TC-101-1.png](screenshots/TC-101-1.png) [TC-101-2.png](screenshots/TC-101-2.png) |  |
| TC-102 | AC-20.7 | Bị chặn |  | **Bị chặn** — 006 chưa xây. |
| TC-103 | AC-21.1, AC-21.3 | Pass | [TC-103-1.png](screenshots/TC-103-1.png) [TC-103-2.png](screenshots/TC-103-2.png) [TC-103-3.png](screenshots/TC-103-3.png) | Script cập nhật (V19-2): HV ngoài lớp chuyển sang TC-130. Bài Nháp → A05; lớp chưa bắt đầu → thông báo 003 AC-14.3 (xung đột AC-21.3 đã ghi trong test case); bài nộp của HV khác: S06 chỉ "Bạn chưa nộp bài này.", API T14 / danh sách bài nộp với phiên HV → 404. |
| TC-104 | AC-21.4, AC-21.5, AC-21.7 | Pass | [TC-104-1.png](screenshots/TC-104-1.png) [TC-104-2.png](screenshots/TC-104-2.png) |  |
| TC-105 | AC-21.6 | Pass | [TC-105-1.png](screenshots/TC-105-1.png) [TC-105-2.png](screenshots/TC-105-2.png) [TC-105-3.png](screenshots/TC-105-3.png) | Script cập nhật (V19-2): bỏ trường hợp gỡ HV (TC-130). |
| TC-106 | AC-21.8 | Pass | [TC-106-1.png](screenshots/TC-106-1.png) [TC-106-2.png](screenshots/TC-106-2.png) |  |
| TC-107 | AC-22.1, AC-22.2 | Pass | [TC-107-1.png](screenshots/TC-107-1.png) [TC-107-2.png](screenshots/TC-107-2.png) |  |
| TC-108 | AC-22.3, AC-22.4, AC-22.5, AC-22.6 | Pass | [TC-108-1.png](screenshots/TC-108-1.png) [TC-108-2.png](screenshots/TC-108-2.png) [TC-108-3.png](screenshots/TC-108-3.png) [TC-108-4.png](screenshots/TC-108-4.png) |  |
| TC-109 | AC-23.1, AC-23.2 | Pass | [TC-109-1.png](screenshots/TC-109-1.png) |  |
| TC-110 | AC-23.3, AC-23.6 | Pass | [TC-110-1.png](screenshots/TC-110-1.png) [TC-110-2.png](screenshots/TC-110-2.png) [TC-110-3.png](screenshots/TC-110-3.png) | Chạy song song: Fail (đồng hồ máy chủ bị ca khác dời / timeout); chạy riêng: Pass. |
| TC-111 | AC-23.5 | Pass | [TC-111-1.png](screenshots/TC-111-1.png) [TC-111-2.png](screenshots/TC-111-2.png) | Chạy song song: Fail (đồng hồ máy chủ bị ca khác dời / timeout); chạy riêng: Pass. |
| TC-112 | AC-23.7, AC-23.8 | Pass | [TC-112-1.png](screenshots/TC-112-1.png) |  |
| TC-113 | AC-23.9, AC-23.11 | Pass | [TC-113-1.png](screenshots/TC-113-1.png) [TC-113-2.png](screenshots/TC-113-2.png) |  |
| TC-114 | AC-23.10 | Pass | [TC-114-1.png](screenshots/TC-114-1.png) |  |
| TC-115 | NFR-1 | Pass |  |  |
| TC-116 | NFR-2 | Pass | [TC-116-1.png](screenshots/TC-116-1.png) [TC-116-2.png](screenshots/TC-116-2.png) | Chạy song song: p95 S05 3 188 ms; chạy riêng: S05 p95 1 518 ms, T14 p95 1 213 ms. |
| TC-117 | NFR-4 | Pass |  | Lần trước Fail, nay Pass. |
| TC-118 | NFR-5 | Pass |  | Chạy riêng lần 1: ECONNRESET (máy chủ in-memory); chạy lại 1 lần: Pass, chấm lại 5 000 bài 2 002 ms. |
| TC-119 | NFR-6 | Pass | [TC-119-1.png](screenshots/TC-119-1.png) [TC-119-2.png](screenshots/TC-119-2.png) [TC-119-3.png](screenshots/TC-119-3.png) [TC-119-4.png](screenshots/TC-119-4.png) [TC-119-5.png](screenshots/TC-119-5.png) [TC-119-6.png](screenshots/TC-119-6.png) | Lần trước Fail, nay Pass. |
| TC-120 | NFR-7 | Pass | [TC-120-1.png](screenshots/TC-120-1.png) [TC-120-2.png](screenshots/TC-120-2.png) | Lần trước Fail, nay Pass. |
| TC-121 | NFR-9 | Pass |  |  |
| TC-122 | NFR-10 | Bị chặn |  | **Bị chặn** (môi trường) — xem bên dưới. |
| TC-123 | NFR-11 | Pass |  | Chạy song song: 401 expired (đồng hồ bị ca khác dời); chạy riêng: duyệt 30 × 100 câu 373 ms. Lần trước Fail. |
| TC-124 | NFR-12, NFR-13 | Pass | [TC-124-1.png](screenshots/TC-124-1.png) | Chạy song song: quay lại tab 1 244 ms; chạy riêng: mở lần đầu 2 029 ms, quay lại 963 ms (sát ngưỡng 1 s). Lần trước Fail. |
| TC-125 | NFR-14 | Pass |  |  |
| TC-126 | NFR-8 | Thủ công |  |  |
| TC-127 | NFR-6 | Thủ công |  |  |
| TC-128 | NFR-8 | Thủ công |  |  |
| TC-129 | NFR-7 | Thủ công |  |  |
| TC-130 | AC-21.9, NFR-9 | Fail | [TC-130-1.png](screenshots/TC-130-1.png) [TC-130-2.png](screenshots/TC-130-2.png) [TC-130-3.png](screenshots/TC-130-3.png) [TC-130-4.png](screenshots/TC-130-4.png) [TC-130-5.png](screenshots/TC-130-5.png) [TC-130-6.png](screenshots/TC-130-6.png) | **Fail** — xem F1. |

## Lỗi (để `/module 005` sửa)

Chạy lại: `node .sdd/scripts/sdd.mjs run test:modules -- 005 TC-130`.

### F1 — HV bị gỡ khỏi lớp trong lúc làm: lưu / nộp bị từ chối nhưng HV ở lại S05 · TC-130 (AC-21.9, NFR-9)

- **Tiền điều kiện:** lớp L (chỉ HV A) có bộ "Bộ thành viên" (2 câu trắc nghiệm, hạn nộp +7 ngày). HV A bấm "Bắt đầu làm", chọn "A Đúng" ở câu 1
  ("Đã lưu"); một tab thứ hai của HV A mở S05 → "Tiếp tục làm".
- **Bước 2:** GV gỡ HV A khỏi L (`DELETE /api/classes/<L>/students/<A>`). Tab 1: "Câu sau", chọn "A Đúng" ở câu 2. Tab 2: "Nộp bài" → xác nhận
  "Nộp bài".
- **Mong đợi (AC-21.9):** từ chối, hiển thị "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" và **đưa HV về S01 "Lớp của tôi"**, không lộ nội
  dung bộ bài tập; không có bài nộp nào.
- **Thực tế:** cả hai tab hiện đúng thông báo trong khung `role="alert"` (refusalBox) nhưng **ở lại S05**
  (`/hv/lop/<L>/bai-tap/<bộ>`, tiêu đề trang "Bộ thành viên · SAT"); tiêu đề bộ, câu hỏi ("Câu hai?" ở tab 1, "Câu một?" ở tab 2) và câu trả lời
  vẫn hiển thị; "Nộp bài" bị vô hiệu. Ảnh: [TC-130-3.png](screenshots/TC-130-3.png), [TC-130-4.png](screenshots/TC-130-4.png).
- **Phần đạt của TC-130:** bước 1 (HV B ngoài lớp mở S05, S06 → thông báo + S01, không lộ nội dung — [TC-130-1.png](screenshots/TC-130-1.png),
  [TC-130-2.png](screenshots/TC-130-2.png)); bước 3 (HV A mở lại S05 → thông báo + S01 — [TC-130-5.png](screenshots/TC-130-5.png)); bước 4 (thêm lại
  HV A: không có bài nộp, lượt dở giữ đúng 1 câu trả lời, "Tiếp tục làm" thấy câu 1 "A Đúng" đã chọn — [TC-130-6.png](screenshots/TC-130-6.png)).
  Không có lỗi console ngoài các phản hồi từ chối mong đợi.
- **Gợi ý:** `ExercisePage.tsx:58` chỉ gọi `useHvRefusal(error)` cho lỗi khi tải trang; lỗi `CLASS_NOT_MEMBER` khi lưu / nộp (store
  `answer` / `submit`) đi vào `refusalBox` mà không chuyển về S01. Cho lỗi lưu / nộp có mã `CLASS_NOT_MEMBER` đi qua cùng `useHvRefusal`.

### Bị chặn — TC-122 (NFR-10)

TC-122 dựng một máy chủ hermetic thứ hai (cổng 4174, `LOG_LEVEL=info`) với MongoDB trong bộ nhớ riêng. Seed thất bại:
`available disk space of 168099840 bytes is less than required minimum of 524288000` — ổ C chỉ còn ≈ 0,5 GB khi máy chủ chính đang chạy.
%TEMP% còn 54 thư mục `mongo-mem-*` mồ côi (≈ 10 GB, từ các phiên trước, không có `mongod` nào chạy); phiên này chỉ xóa 3 thư mục do chính nó
tạo. **Cần người dùng:** xóa `%TEMP%\mongo-mem-*` (khi không có test nào đang chạy), rồi `node .sdd/scripts/sdd.mjs run test:modules -- 005 TC-122`.
Lần chạy 2026-10-28-1452 TC-122 đã Pass.

### Bị chặn — TC-102 (AC-20.7)

006 (Bài thi, T16) chưa được xây: không có bài nộp bài thi để mở T14. Chạy lại sau khi 006 xong.
