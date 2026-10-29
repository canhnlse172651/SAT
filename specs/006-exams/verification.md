# Verification — 006-exams

## QA — Playwright MCP

- **Lần chạy:** 2026-10-29-0835 (08:35 → 09:00 giờ Việt Nam), commit ea4d012, **phiên QA độc lập** (không phải phiên cài đặt), server e2e
  hermetic (`tests/e2e/server.mjs`), Chromium; GV 1280 × 800, HV 390 × 844. Báo cáo:
  [testing/runs/2026-10-29-0835/report.md](testing/runs/2026-10-29-0835/report.md), kết quả máy đọc:
  [results.json](testing/runs/2026-10-29-0835/results.json) (+ `playwright.json`, `full-run.log`, `retry/`), ảnh:
  `testing/runs/2026-10-29-0835/screenshots/`.
- **Kết quả:** **112/112 ca E2E + API Pass**, 0 Fail, 0 Bị chặn, 3 Thủ công (TC-112 hiệu năng dưới tải, TC-114 thiết bị thật,
  TC-115 đọc log — hướng dẫn trong test-cases.md).
- **Cách chạy:** 6 ca Fail của lần 2026-10-29-0304 (F1–F5: TC-019, TC-021, TC-035, TC-036, TC-044, TC-059) chạy lại qua Playwright MCP như
  người dùng (TC-036 qua API) — đều Pass. Hồi quy: cả 112 script `testing/e2e/TC-###.spec.ts` chạy tuần tự (`--workers=1`, 13,7 phút) →
  110 Pass; TC-040 và TC-110 Fail ở bước dựng HV (kích hoạt 001 chậm / tạo 200 HV), chưa tới bước bài thi; chạy lại một lần → Pass.
- **Traceability:** `node .sdd/scripts/sdd.mjs trace 006` → mọi AC (AC-1.1 … AC-16.5) có task và script trích dẫn `006:AC-n.m`, ✅;
  `## Gaps` → `None.`
- **Lần trước:** 2026-10-29-0304 — 106/112, Verdict FAIL (F1–F5); đã sửa ở commit f9bd893 và xác nhận ở lần chạy này.
- **Quan sát (không chặn):** câu chữ TC-019 bước 2 và TC-009 nên sửa (chủ: `/module 006`); kích hoạt HV (001) đôi khi > 15 s trên server
  e2e đã có nhiều HV.

**Verdict:** PASS — mọi ca E2E/API Pass trên code hiện tại, trace không thiếu, 3 ca thủ công có hướng dẫn.
