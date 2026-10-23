---
feature: {{NNN}}
generated: {{YYYY-MM-DD}}
last_run: {{YYYY-MM-DD HH:mm}}
---

# Test cases — {{NNN}} {{Tên module}}

<!--
Viết bởi /module NNN (trước khi code, cập nhật lại khi code xong); trạng thái do /test-module NNN ghi sau mỗi lần chạy
(agent QA chạy từng test case như người dùng thật bằng Playwright MCP). scripts/sync-state.mjs đọc file này cho dashboard:
  - mỗi test case một dòng bảng, ô đầu "TC-###", ô CUỐI = trạng thái: Pass | Fail | Chưa chạy | Thủ công | Bị chặn
  - front-matter last_run = thời điểm chạy gần nhất (giờ Việt Nam)
Quy tắc viết:
  - Mỗi AC của spec.md có ≥ 1 test case; NFR kiểm được (hiệu năng, truy cập…) cũng vậy.
  - Viết như kịch bản cho người dùng thật: vai trò (GV / HV), tiền điều kiện (dữ liệu cần có, đăng nhập), các bước bằng thao
    tác trên giao diện, kết quả mong đợi dùng ĐÚNG câu chữ trong AC ("Lưu nháp", "Không tìm thấy nội dung bạn yêu cầu.").
  - Màn hình: mã màn hình + liên kết prototype specs/screen-flow-design.html#T07.
  - Loại: E2E (thao tác giao diện) | API (gọi API trong trình duyệt, khi không có giao diện) | Thủ công (cần người: email
    thật, thiết bị thật, cảm nhận thẩm mỹ).
  - Cột Script: đường dẫn script do agent QA lưu lại (testing/e2e/TC-###.spec.ts) — để trống khi chưa chạy.
  - Không viết code test trong module; code test duy nhất là script agent QA sinh ra từ lần chạy thật.
Văn xuôi tiếng Việt; mã TC, mã AC và đường dẫn giữ nguyên.
-->

## Tóm tắt

| Tổng | Pass | Fail | Bị chặn | Chưa chạy | Thủ công | Lần chạy cuối |
|------|------|------|---------|-----------|----------|---------------|
| 0 | 0 | 0 | 0 | 0 | 0 | {{YYYY-MM-DD HH:mm}} |

## Dữ liệu và tài khoản dùng chung

<!-- Dữ liệu mẫu mọi test case dùng (workspace, GV, HV, lớp, giáo trình…) và cách tạo: qua giao diện, qua API, hay có sẵn
     từ seed (`npm run seed -w @sat/api`: workspace "Workspace của Cô Lan", GV "Cô Lan", 3 HV). -->

## Danh sách test case

| TC | AC / NFR | Loại | Vai trò | Tiền điều kiện | Các bước | Kết quả mong đợi | Màn hình | Script | Trạng thái |
|----|----------|------|---------|----------------|----------|------------------|----------|--------|------------|
| TC-001 | AC-1.1 | E2E | GV | … | 1. … 2. … | … | [T01](../screen-flow-design.html#T01) | | Chưa chạy |

## Ghi chú lần chạy

<!-- Mới nhất ở trên: thời điểm, người chạy (/test-module), báo cáo testing/runs/<thời điểm>/report.md, tóm tắt
     x/y Pass, các lỗi tìm thấy (TC, hiện tượng, mong đợi, ảnh chụp). -->
