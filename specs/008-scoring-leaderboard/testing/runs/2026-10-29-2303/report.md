# QA 008 Điểm & Xếp hạng — lần chạy 2026-10-29-2303 (chạy lại sau fix mode)

- **Thời điểm:** 2026-10-29 23:03 → 23:20 (giờ Việt Nam). **Commit:** 9662093 (`feat/008-scoring-leaderboard`; ứng dụng không đổi trong lượt,
  chỉ script QA được sửa — xem "Sửa script").
- **Máy chủ:** e2e hermetic `node tests/e2e/server.mjs` (build production + MongoDB trong bộ nhớ, seed dev), cổng 4173, chạy nền suốt lượt;
  script dùng lại server này (`reuseExistingServer`); các ca dời đồng hồ trả đồng hồ về giờ thật sau khi xong (`useClockReset`).
- **Trình duyệt:** Playwright MCP (Chromium) cho các ca kiểm như người dùng; script: Chromium headless. GV 1280 × 800 (TC-064: 1024 × 768),
  HV 390 × 844 (TC-063 S09 360 × 740 + 10 Mbps; TC-064 360 / 430 px).
- **Kết quả:** **64/64 ca E2E + API Pass**, 0 Fail, 0 Bị chặn, 2 Thủ công (TC-065, TC-066 — hướng dẫn trong test-cases.md).
- **Lưu ý độc lập:** lượt này chạy trong cùng phiên với `/module 008` (fix mode) theo yêu cầu người dùng, không phải phiên QA mới.

## Cách chạy

1. **Script:** cả 64 `testing/e2e/TC-###.spec.ts` chạy tuần tự một lượt (`npx playwright test -c playwright.modules.config.ts --workers=1`,
   9,4 phút): 63 Pass, TC-014 Fail (xem dưới) — [full-run.log](full-run.log), [playwright.json](playwright.json). Sau khi sửa script TC-014:
   `node .sdd/scripts/sdd.mjs run test:modules -- 008 TC-014` → 1/1 Pass ([../2026-10-29-2314-replay/](../2026-10-29-2314-replay/report.md),
   bản sao [playwright-TC-014-replay.json](playwright-TC-014-replay.json)). Kết quả gộp: [results.json](results.json).
2. **Playwright MCP** trên dữ liệu các script vừa tạo (tìm lớp qua API của GV, rồi mở như người dùng: T04 → tab "Xếp hạng"):
   - TC-030 (1280 px): Bình hạng 1, Chi hạng 1, cùng "Cập nhật lần cuối" "30/10/2026 23:06" (lúc ẩn section, đồng hồ đã dời), Bình đứng trước
     Chi — [TC-030-mcp-1.png](screenshots/TC-030-mcp-1.png).
   - TC-049 (1280 px): 4 dòng An 1, Bình 2 (kèm "Đã khóa"), Chi 2, Dũng 4; không có Hà / HV gửi lỗi; đủ cột; "Cập nhật lần cuối" dạng
     "29/10/2026 23:09" — [TC-049-mcp-1.png](screenshots/TC-049-mcp-1.png).
   - TC-064 (1024 px): khung nhìn 1024, trang không cuộn ngang (`scrollWidth` 1024); thẻ bảng x 264–981, không cuộn trong thẻ (715 = 715);
     đầu cột "Cập nhật lần cuối" x 819–928, nút "Chi tiết điểm của …" x 936–972; bấm nút của Dũng mở dòng chi tiết
     ("30% × 70,0 + 70% × 0,0 = 21,0") — [TC-064-mcp-1024.png](screenshots/TC-064-mcp-1024.png).
3. **Kiểm tra script:** `run lint` ✔ ("All matched files use Prettier code style!"), `run typecheck` ✔ (0 lỗi, tsconfig gốc gồm
   `specs/*/testing/e2e`).

## Sửa script (không đổi kỳ vọng)

- **TC-014:** dòng so "Cập nhật lần cuối" chuyển chuỗi về `HH:mm dd/mm/yyyy` (định dạng cũ của giao diện). TC-014 không quy định định dạng;
  định dạng của cột là `dd/mm/yyyy HH:mm` (TC-049, prototype T04) → script so trực tiếp với `vnDateTime`. Lượt đầy đủ bắt đầu 23:03 nên bước 2
  "+1 giờ" vượt nửa đêm giờ Việt Nam: Hạn nộp "hôm nay" của S1b qua → An 7,5 / TB 25,0 thay vì 15,0 / 50,0 (đúng nghiệp vụ, sai tiền điều
  kiện của TC). Thêm `roomToday(page, needMs)` vào `helpers.ts`: khi ngày giờ Việt Nam của server không còn đủ `needMs`, dời đồng hồ đến 08:00
  hôm sau trước khi tạo dữ liệu (GV đăng nhập lại vì phiên 8 giờ). TC-014 gọi `roomToday(gv, HOUR)`.
- **`helpers.ts#openS09`:** chờ S09 tải xong (`settle`) trước khi kiểm bộ chọn lớp — trước đây `isVisible()` chạy khi danh sách lớp chưa về
  nên bỏ qua `selectOption` (TC-039 chập chờn, cả ở d3cad77).

## Kết quả từng ca

| TC | AC / NFR | Kết quả | Bằng chứng | Ghi chú |
|----|----------|---------|-----------|---------|
| TC-001 … TC-013 | AC-1.1 … AC-2.9, NFR-3 | Pass | `screenshots/TC-0xx-n.png` | |
| TC-014 | AC-3.1, AC-3.3 | Pass | [TC-014-1.png](screenshots/TC-014-1.png) | Lượt đầy đủ Fail do vượt nửa đêm; sửa script, replay 2314 Pass |
| TC-015 … TC-029 | AC-3.2 … AC-7.4 | Pass | `screenshots/TC-0xx-n.png` | |
| TC-030 | AC-6.2 | Pass | [TC-030-1.png](screenshots/TC-030-1.png) [TC-030-mcp-1.png](screenshots/TC-030-mcp-1.png) | F1 đã sửa; cũng kiểm qua MCP |
| TC-031 … TC-048 | AC-6.3 … AC-9.6, NFR-7 | Pass | `screenshots/TC-0xx-n.png` | TC-039 Pass (helper sửa); TC-048 phần S10 / S12 chờ 011 |
| TC-049 | AC-10.1 | Pass | [TC-049-mcp-1.png](screenshots/TC-049-mcp-1.png) | F2 đã sửa; cũng kiểm qua MCP |
| TC-050 … TC-062 | AC-10.2 … AC-13.4, NFR-1 | Pass | `screenshots/TC-0xx-n.png` | |
| TC-063 | NFR-2, NFR-4 | Pass | — | F4 đã sửa: API p95 GV 482 ms, HV 416 ms; màn hình p95 S09 1 431 ms, T04 1 481 ms (≤ 2 000 ms) |
| TC-064 | NFR-5 | Pass | [TC-064-mcp-1024.png](screenshots/TC-064-mcp-1024.png) | F3 đã sửa; cũng kiểm qua MCP ở 1024 px |
| TC-065 | NFR-6 | Thủ công | — | Hướng dẫn trong test-cases.md |
| TC-066 | NFR-8 | Thủ công | — | Hướng dẫn trong test-cases.md |

Từng ca với thời gian và ảnh: [results.json](results.json).

## Quan sát (không chặn)

- Console: chỉ 401 `GET /api/session` trước khi đăng nhập (đúng) và cảnh báo React Router "No `HydrateFallback` element" (không thuộc 008).
- Script phụ thuộc giờ trong ngày: các ca "Hạn nộp hôm nay" + dời đồng hồ chạy gần nửa đêm giờ Việt Nam có thể đổi tiền điều kiện. Lượt
  này chỉ TC-014 bị ảnh hưởng; ca khác gặp hiện tượng tương tự thì dùng `roomToday`.
- Ổ C: còn ~2,4 GB khi chạy; `%TEMP%\mongo-mem-*` (135 thư mục, ~18 GB) là CSDL thử bỏ lại — nên dọn trước lượt sau.
