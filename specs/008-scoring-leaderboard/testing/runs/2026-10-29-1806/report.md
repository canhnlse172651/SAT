# QA 008 Điểm & Xếp hạng — lần chạy 2026-10-29-1806

- **Thời điểm:** 2026-10-29 17:30 → 18:30 (giờ Việt Nam). **Commit:** e4b1e7d (`feat/008-scoring-leaderboard`, ứng dụng không đổi trong lượt).
- **Máy chủ:** e2e hermetic `node tests/e2e/server.mjs` (build production + MongoDB trong bộ nhớ, seed dev), cổng 4173. Lượt cuối khởi động
  server mới (CSDL sạch) qua `webServer` của `playwright.modules.config.ts`; mỗi ca tự tạo HV / giáo trình "R1" / lớp / bài thi riêng; các ca
  dời đồng hồ máy chủ trả đồng hồ về giờ thật sau khi xong (`useClockReset`).
- **Trình duyệt:** Playwright MCP (Chromium) cho các ca chạy tay; script replay: Chromium headless. GV 1280 × 800, HV 390 × 844 (TC-063 S09
  360 × 740 + giới hạn 10 Mbps; TC-064 360 / 430 px và 1024 / 1280 px).
- **Kết quả:** **60/64 ca E2E + API Pass, 4 Fail** (F1–F4), 0 Bị chặn, 2 Thủ công (TC-065, TC-066 — hướng dẫn trong test-cases.md).
  Lượt cuối: cả 64 script chạy tuần tự một lần (`--workers=1`, 12,7 phút): [full-run.log](full-run.log), [playwright.json](playwright.json),
  [results.json](results.json), ảnh trong `screenshots/` (`TC-###-n.png` của script, `TC-###-mcp-*.png` của lượt MCP, `TC-###-fail*.png` tại
  điểm lỗi).

## Cách chạy

1. **Playwright MCP:** hồ sơ `mcp-chrome-7c84bcd` lúc đầu bị Chrome của phiên khác giữ (PID 47336); người dùng đồng ý đóng tiến trình đó.
   Chạy như người dùng qua MCP (HV: tab "Xếp hạng" ở thanh tab, phân đoạn "Điểm của tôi", chạm dòng; GV: T04 → tab "Xếp hạng", ô "Tìm học
   viên", đổi khung nhìn): TC-001, TC-029, TC-036, TC-051 Pass; F2 (TC-049) và F3 (TC-064, 1024 px) thấy đúng như script; TC-030 chạy biến thể
   không có bước 2 để khoanh vùng F1 (xem dưới). Dữ liệu tiền điều kiện tạo qua API như "Dữ liệu và tài khoản dùng chung".
2. **Script:** mỗi ca một `testing/e2e/TC-###.spec.ts` (tiêu đề trích `008:AC-n.m`), dùng chung `testing/e2e/helpers.ts` (HV An / Bình / Chi /
   Dũng / Hà, giáo trình R1 4 Bài · 7 bộ, Hạn nộp, bài nộp chọn điểm `POST /api/dev/classes/…/submit`, bài nộp thật 005, đề E3 của 006, đồng
   hồ, thao tác S09 / T04). Thao tác của GV ở module khác (ẩn section, lưu trữ, chấm lại, khóa / xóa / kích hoạt HV, gỡ / thêm HV, kết thúc lớp,
   Hạn nộp) đi qua API của module đó như test-cases.md mô tả; mọi bước trên S09 và tab Xếp hạng đi qua giao diện.
3. **Replay qua toolchain:** `node .sdd/scripts/sdd.mjs run test:modules -- 008 TC-001` → 1/1 Pass; `… -- 008 TC-030` → Fail cùng chỗ
   ([../2026-10-29-1823-replay/](../2026-10-29-1823-replay/report.md), thư mục chứa kết quả lần replay sau). Truyền hai mã TC trong một lệnh
   bị lỗi "The system cannot find the path specified." trên Windows (bộ lọc `-g` có `|` bị cmd hiểu là pipe — như đã ghi ở QA 006).
4. **Phải chạy tuần tự:** 20 script dời đồng hồ máy chủ dùng chung; `run test:modules -- 008` (nhiều worker) sẽ làm các ca ảnh hưởng nhau.
   Lượt cuối dùng `npx playwright test -c playwright.modules.config.ts --workers=1` với cùng biến `SAT_MODULE_TEST_DIR` / `SAT_MODULE_RUN_DIR`.
5. Kiểm tra script: `run lint` ✔, `run typecheck` ✔ (tsconfig gốc gồm `specs/*/testing/e2e`).

## Kết quả từng ca

| TC | AC / NFR | Kết quả | Bằng chứng | Ghi chú |
|----|----------|---------|-----------|---------|
| TC-001 | AC-1.1, AC-1.2, AC-1.6, AC-2.1, AC-11.1, AC-11.2, AC-13.5 | Pass | [TC-001-1.png](screenshots/TC-001-1.png) [TC-001-mcp-1.png](screenshots/TC-001-mcp-1.png) | Cũng chạy qua MCP (TC-001-mcp-1) |
| TC-002 | AC-1.2 | Pass | [TC-002-1.png](screenshots/TC-002-1.png) [TC-002-2.png](screenshots/TC-002-2.png) |  |
| TC-003 | AC-1.3 | Pass | [TC-003-1.png](screenshots/TC-003-1.png) |  |
| TC-004 | AC-1.4 | Pass | [TC-004-1.png](screenshots/TC-004-1.png) |  |
| TC-005 | AC-1.5, AC-1.7, AC-1.10 | Pass | [TC-005-1.png](screenshots/TC-005-1.png) |  |
| TC-006 | AC-1.8, AC-2.5, AC-1.9, AC-11.1 | Pass | [TC-006-1.png](screenshots/TC-006-1.png) [TC-006-2.png](screenshots/TC-006-2.png) |  |
| TC-007 | AC-2.8, AC-11.8 | Pass | [TC-007-1.png](screenshots/TC-007-1.png) [TC-007-2.png](screenshots/TC-007-2.png) |  |
| TC-008 | AC-1.11, AC-11.2 | Pass | [TC-008-1.png](screenshots/TC-008-1.png) |  |
| TC-009 | AC-1.12, AC-2.7 | Pass | [TC-009-1.png](screenshots/TC-009-1.png) [TC-009-2.png](screenshots/TC-009-2.png) [TC-009-3.png](screenshots/TC-009-3.png) |  |
| TC-010 | AC-2.2, AC-2.3 | Pass | [TC-010-1.png](screenshots/TC-010-1.png) [TC-010-2.png](screenshots/TC-010-2.png) |  |
| TC-011 | AC-2.4, NFR-3 | Pass | — |  |
| TC-012 | AC-2.6, AC-11.1 | Pass | [TC-012-1.png](screenshots/TC-012-1.png) |  |
| TC-013 | AC-2.9 | Pass | [TC-013-1.png](screenshots/TC-013-1.png) |  |
| TC-014 | AC-3.1, AC-3.3 | Pass | [TC-014-1.png](screenshots/TC-014-1.png) [TC-014-2.png](screenshots/TC-014-2.png) [TC-014-3.png](screenshots/TC-014-3.png) |  |
| TC-015 | AC-3.2 | Pass | [TC-015-1.png](screenshots/TC-015-1.png) [TC-015-2.png](screenshots/TC-015-2.png) |  |
| TC-016 | AC-4.1, AC-4.2, AC-4.5, AC-11.3 | Pass | [TC-016-1.png](screenshots/TC-016-1.png) [TC-016-2.png](screenshots/TC-016-2.png) [TC-016-3.png](screenshots/TC-016-3.png) |  |
| TC-017 | AC-4.3 | Pass | [TC-017-1.png](screenshots/TC-017-1.png) |  |
| TC-018 | AC-4.4 | Pass | [TC-018-1.png](screenshots/TC-018-1.png) [TC-018-2.png](screenshots/TC-018-2.png) |  |
| TC-019 | AC-4.6, AC-11.3 | Pass | [TC-019-1.png](screenshots/TC-019-1.png) [TC-019-2.png](screenshots/TC-019-2.png) [TC-019-3.png](screenshots/TC-019-3.png) |  |
| TC-020 | AC-4.7 | Pass | [TC-020-1.png](screenshots/TC-020-1.png) [TC-020-2.png](screenshots/TC-020-2.png) |  |
| TC-021 | AC-4.8 | Pass | [TC-021-1.png](screenshots/TC-021-1.png) [TC-021-2.png](screenshots/TC-021-2.png) |  |
| TC-022 | AC-4.9, AC-11.10 | Pass | [TC-022-1.png](screenshots/TC-022-1.png) [TC-022-2.png](screenshots/TC-022-2.png) [TC-022-3.png](screenshots/TC-022-3.png) |  |
| TC-023 | AC-5.1, AC-5.2 | Pass | [TC-023-1.png](screenshots/TC-023-1.png) [TC-023-2.png](screenshots/TC-023-2.png) [TC-023-3.png](screenshots/TC-023-3.png) |  |
| TC-024 | AC-5.3 | Pass | [TC-024-1.png](screenshots/TC-024-1.png) [TC-024-2.png](screenshots/TC-024-2.png) |  |
| TC-025 | AC-5.4, AC-10.1 | Pass | [TC-025-1.png](screenshots/TC-025-1.png) [TC-025-2.png](screenshots/TC-025-2.png) |  |
| TC-026 | AC-5.5, AC-8.6 | Pass | [TC-026-1.png](screenshots/TC-026-1.png) [TC-026-2.png](screenshots/TC-026-2.png) |  |
| TC-027 | AC-5.6 | Pass | [TC-027-1.png](screenshots/TC-027-1.png) [TC-027-2.png](screenshots/TC-027-2.png) |  |
| TC-028 | AC-5.7, AC-7.2, AC-10.1 | Pass | [TC-028-1.png](screenshots/TC-028-1.png) [TC-028-2.png](screenshots/TC-028-2.png) [TC-028-3.png](screenshots/TC-028-3.png) |  |
| TC-029 | AC-6.1, AC-7.4 | Pass | [TC-029-1.png](screenshots/TC-029-1.png) [TC-029-mcp-1.png](screenshots/TC-029-mcp-1.png) | Cũng chạy qua MCP |
| TC-030 | AC-6.2 | Fail | [TC-030-1.png](screenshots/TC-030-1.png) [TC-030-fail.png](screenshots/TC-030-fail.png) [TC-030-mcp-no-step2-view.png](screenshots/TC-030-mcp-no-step2-view.png) | F1 |
| TC-031 | AC-6.3, AC-7.3 | Pass | [TC-031-1.png](screenshots/TC-031-1.png) [TC-031-2.png](screenshots/TC-031-2.png) |  |
| TC-032 | AC-6.4, AC-6.5 | Pass | [TC-032-1.png](screenshots/TC-032-1.png) [TC-032-2.png](screenshots/TC-032-2.png) |  |
| TC-033 | AC-6.6 | Pass | [TC-033-1.png](screenshots/TC-033-1.png) |  |
| TC-034 | AC-7.1, AC-7.2 | Pass | [TC-034-1.png](screenshots/TC-034-1.png) [TC-034-2.png](screenshots/TC-034-2.png) |  |
| TC-035 | AC-7.5 | Pass | [TC-035-1.png](screenshots/TC-035-1.png) |  |
| TC-036 | AC-7.6 | Pass | [TC-036-1.png](screenshots/TC-036-1.png) [TC-036-2.png](screenshots/TC-036-2.png) | Cũng chạy qua MCP |
| TC-037 | AC-7.7 | Pass | [TC-037-1.png](screenshots/TC-037-1.png) |  |
| TC-038 | AC-8.1 | Pass | [TC-038-1.png](screenshots/TC-038-1.png) [TC-038-2.png](screenshots/TC-038-2.png) |  |
| TC-039 | AC-8.2 | Pass | [TC-039-1.png](screenshots/TC-039-1.png) [TC-039-2.png](screenshots/TC-039-2.png) |  |
| TC-040 | AC-8.3 | Pass | [TC-040-1.png](screenshots/TC-040-1.png) |  |
| TC-041 | AC-8.4 | Pass | [TC-041-1.png](screenshots/TC-041-1.png) |  |
| TC-042 | AC-8.5 | Pass | [TC-042-1.png](screenshots/TC-042-1.png) |  |
| TC-043 | AC-9.1, NFR-7 | Pass | — |  |
| TC-044 | AC-9.2 | Pass | [TC-044-1.png](screenshots/TC-044-1.png) [TC-044-2.png](screenshots/TC-044-2.png) [TC-044-3.png](screenshots/TC-044-3.png) |  |
| TC-045 | AC-9.3 | Pass | — |  |
| TC-046 | AC-9.4 | Pass | [TC-046-1.png](screenshots/TC-046-1.png) |  |
| TC-047 | AC-9.5 | Pass | [TC-047-1.png](screenshots/TC-047-1.png) [TC-047-2.png](screenshots/TC-047-2.png) |  |
| TC-048 | AC-9.6 | Pass | [TC-048-1.png](screenshots/TC-048-1.png) [TC-048-2.png](screenshots/TC-048-2.png) | Phần S10/S12 chờ 011 |
| TC-049 | AC-10.1 | Fail | [TC-049-fail.png](screenshots/TC-049-fail.png) [TC-049-mcp-1.png](screenshots/TC-049-mcp-1.png) | F2 (cũng thấy qua MCP) |
| TC-050 | AC-10.2 | Pass | [TC-050-1.png](screenshots/TC-050-1.png) [TC-050-2.png](screenshots/TC-050-2.png) |  |
| TC-051 | AC-10.3, AC-10.4 | Pass | [TC-051-1.png](screenshots/TC-051-1.png) [TC-051-2.png](screenshots/TC-051-2.png) [TC-051-mcp-1.png](screenshots/TC-051-mcp-1.png) | Cũng chạy qua MCP |
| TC-052 | AC-10.5 | Pass | [TC-052-1.png](screenshots/TC-052-1.png) |  |
| TC-053 | AC-11.4 | Pass | [TC-053-1.png](screenshots/TC-053-1.png) |  |
| TC-054 | AC-11.5 | Pass | [TC-054-1.png](screenshots/TC-054-1.png) [TC-054-2.png](screenshots/TC-054-2.png) |  |
| TC-055 | AC-11.6, AC-11.9 | Pass | [TC-055-1.png](screenshots/TC-055-1.png) |  |
| TC-056 | AC-11.7 | Pass | [TC-056-1.png](screenshots/TC-056-1.png) |  |
| TC-057 | AC-11.8 | Pass | [TC-057-1.png](screenshots/TC-057-1.png) [TC-057-2.png](screenshots/TC-057-2.png) |  |
| TC-058 | AC-11.11, AC-11.12 | Pass | [TC-058-1.png](screenshots/TC-058-1.png) [TC-058-2.png](screenshots/TC-058-2.png) |  |
| TC-059 | AC-13.1 | Pass | [TC-059-1.png](screenshots/TC-059-1.png) [TC-059-2.png](screenshots/TC-059-2.png) |  |
| TC-060 | AC-13.2, AC-13.3 | Pass | [TC-060-1.png](screenshots/TC-060-1.png) [TC-060-2.png](screenshots/TC-060-2.png) |  |
| TC-061 | AC-13.4 | Pass | [TC-061-1.png](screenshots/TC-061-1.png) [TC-061-2.png](screenshots/TC-061-2.png) [TC-061-3.png](screenshots/TC-061-3.png) [TC-061-4.png](screenshots/TC-061-4.png) |  |
| TC-062 | NFR-1 | Pass | — |  |
| TC-063 | NFR-2, NFR-4 | Fail | [TC-063-fail-s09.png](screenshots/TC-063-fail-s09.png) [TC-063-fail-t04.png](screenshots/TC-063-fail-t04.png) | F4 |
| TC-064 | NFR-5 | Fail | [TC-064-1.png](screenshots/TC-064-1.png) [TC-064-2.png](screenshots/TC-064-2.png) [TC-064-3.png](screenshots/TC-064-3.png) [TC-064-4.png](screenshots/TC-064-4.png) [TC-064-5.png](screenshots/TC-064-5.png) [TC-064-fail-1024.png](screenshots/TC-064-fail-1024.png) [TC-064-mcp-1024.png](screenshots/TC-064-mcp-1024.png) | F3 (cũng thấy qua MCP) |
| TC-065 | NFR-6 | Thủ công | — | Hướng dẫn trong test-cases.md |
| TC-066 | NFR-8 | Thủ công | — | Hướng dẫn trong test-cases.md |

## F1 — TC-030 (AC-6.2, AC-6.6): "Cập nhật lần cuối" không đổi khi điểm đổi mà không ai xem bảng

- **Bước:** lớp có Bình, Chi; S1a, S3b Hạn nộp hôm nay. Chi nộp S1a 8/10, rồi Bình nộp 8/10. GV mở T04 tab Xếp hạng (Chi trước Bình — đúng).
  Dời đồng hồ +24 giờ (S3b "Quá hạn" của cả hai → 12,0). GV ẩn section Bài tập của Bài 3 (→ cả hai 24,0), bấm "Làm mới".
- **Mong đợi:** cả hai đổi điểm cùng lúc (cùng "Cập nhật lần cuối" = lúc ẩn) → Bình đứng trước Chi (tên "Bình" < "Chi").
- **Thực tế:** Chi trước Bình; "Cập nhật lần cuối" của cả hai vẫn là thời điểm nộp ("18:13 29/10/2026") trong khi đồng hồ đã ở 30/10
  ([TC-030-fail.png](screenshots/TC-030-fail.png)).
- **Khoanh vùng:** nếu GV bấm "Làm mới" lúc +24 giờ (trước khi ẩn), bảng hiện 12,0 với "23:59 29/10/2026" và sau khi ẩn ra 24,0 với thời điểm
  ẩn, thứ tự Bình–Chi đúng. Lượt MCP không có bước 2 (chưa ai mở tab trước khi dời giờ) cũng cho thứ tự đúng
  ([TC-030-mcp-no-step2-view.png](screenshots/TC-030-mcp-no-step2-view.png)). Tức là thời điểm đạt điểm được suy từ ảnh chụp lúc *đọc*
  (`rank_scores`): thay đổi 24 → 12 → 24 không có ai đọc ở giữa bị coi là "không đổi" và giữ thời điểm cũ. AC-6.6 / AC-2.5 yêu cầu thời điểm
  điểm thực sự thay đổi (qua Hạn nộp lúc 23:59:59, ẩn section lúc ẩn). Ghi chú "Known limits" trong progress.md của /module 008 đã nêu giới hạn
  này — nó làm sai AC-6.2.
- Console / network: không có lỗi.

## F2 — TC-049 (AC-10.1): định dạng "Cập nhật lần cuối" khác test case

- **Bước:** dữ liệu TC-029 + Hà "Chưa kích hoạt" + một HV "Gửi email thất bại" (e-mail bị dội) + Bình bị khóa; GV mở T04 tab "Xếp hạng".
- **Mong đợi (TC-049):** cột "Cập nhật lần cuối (dd/mm/yyyy HH:mm)".
- **Thực tế:** "18:16 29/10/2026" (`HH:mm dd/mm/yyyy`, `formatVnDateTime`) ([TC-049-fail.png](screenshots/TC-049-fail.png),
  [TC-049-mcp-1.png](screenshots/TC-049-mcp-1.png)). Mọi kỳ vọng khác của TC-049 đạt: 4 dòng An, Bình, Chi, Dũng theo hạng 1, 2, 2, 4; không có Hà
  và HV gửi lỗi; Bình kèm "Đã khóa"; đủ cột và ảnh đại diện.
- **Lưu ý:** AC-10.1 không quy định thứ tự ngày / giờ; dòng "Đóng HH:mm dd/mm/yyyy" của AC-11.8 dùng giờ trước ngày. Sửa giao diện hoặc sửa
  câu chữ TC-049 — quyết định của `/module 008` (QA không sửa kỳ vọng).

## F3 — TC-064 (NFR-5): tab Xếp hạng không dùng được ở 1024 px

- **Bước:** dữ liệu TC-029 (tên Dũng rất dài); S09 ở 360 và 430 px (đạt: không cuộn ngang, tên dài "…", vùng chạm ≥ 44 × 44); GV mở T04 tab
  "Xếp hạng" ở 1024 px.
- **Mong đợi:** "T04 dùng được ở 1024 px".
- **Thực tế:** bảng tràn khỏi thẻ và bị cắt: đầu cột "Cập nhật lần cuối" kết thúc ở x = 1090 (chỉ 53 % trong khung nhìn), nút "Chi tiết điểm
  của …" bắt đầu ở x = 1104 (ngoài màn hình); trang không cuộn ngang (`scrollWidth` = 1024), thẻ chứa bảng kết thúc ở x = 981 — GV không mở
  được dòng chi tiết ([TC-064-fail-1024.png](screenshots/TC-064-fail-1024.png), [TC-064-mcp-1024.png](screenshots/TC-064-mcp-1024.png)).
  Gợi ý: bọc bảng bằng `.tbl-scroll` (patterns.css) hoặc thu gọn cột.
- Script dừng ở 1024 px nên phần 1280 px chưa được khẳng định trong lượt này (các ca GV khác ở 1280 px đều thấy đủ cột).

## F4 — TC-063 (NFR-2, NFR-4): thời gian tải vượt 2 giây với lớp lớn

- **Bước:** workspace riêng, 100 HV đã kích hoạt; 30 Bài × 10 bộ = 300 bộ có Hạn nộp; 50 bài thi giao lớp; 2 000 bài nộp (20 bộ × 100 HV);
  dời đồng hồ +24 giờ (mọi Hạn nộp và giờ đóng đã qua → mỗi HV có 300 bộ + 50 bài thi được tính). Đo 20 lần mỗi API, 10 lần mỗi màn hình.
- **Mong đợi:** p95 hiển thị đầy đủ ≤ 2 giây cho cả hai màn hình.
- **Thực tế:** API p95 — GV `GET /api/classes/<lớp>/ranking` **3 113 ms**, HV `GET /api/learn/ranking/<lớp>` **3 079 ms**; màn hình p95 —
  S09 (360 px, 10 Mbps) **3 987 ms**, T04 tab Xếp hạng **4 498 ms** ([TC-063-fail-s09.png](screenshots/TC-063-fail-s09.png),
  [TC-063-fail-t04.png](screenshots/TC-063-fail-t04.png); số đo trong [full-run.log](full-run.log)). Dữ liệu đúng (HV: 300 bộ, 50 bài thi
  được tính).
- **Lưu ý môi trường:** server hermetic (MongoDB trong bộ nhớ) trên máy Windows của dev, chung máy với trình duyệt — không phải phần cứng
  production; nhưng mỗi lần đọc tốn ~3 giây ngay ở API, tức là chi phí nằm ở việc tính lại toàn bộ điểm khi đọc (plan: "scores derived on every
  read"), không phải ở mạng.

## Quan sát (không chặn)

- Console: chỉ có 401 `GET /api/session` trước khi đăng nhập (đúng) và cảnh báo React Router "No `HydrateFallback` element" (không thuộc 008).
- S06 của 005 có tiêu đề "Kết quả bài tập" (AC-11.4 gọi là "Xem lại bài làm") — TC-053 kiểm đúng Bài nộp (tên bộ, "1 / 1 điểm (100%)").
- HV có e-mail kích hoạt bị dội đi qua `sending → active → failed`; trong khoảng "active" ngắn (≈ 1 giây) HV đó tạm có trong bảng — sau khi
  thành "Gửi email thất bại" thì không (TC-049 chờ trạng thái `failed`).
- TC-048: phần so sánh với S10 / S12 chờ module 011.
