# Verification — 003-classes

## QA — Playwright MCP

- **Run:** 2026-10-23 23:11 (VN), commit `dfbe561`, report [testing/runs/2026-10-23-2311/report.md](testing/runs/2026-10-23-2311/report.md),
  results [results.json](testing/runs/2026-10-23-2311/results.json), scripts [testing/e2e/](testing/e2e/).
- **Result:** **87 / 88 E2E/API test cases Pass, 1 Fail (TC-002), 0 Bị chặn**; 4 Thủ công (TC-089 … TC-092) with instructions in the report.
- **How:** hermetic server (production build, in-memory MongoDB, clean database) on port 4183, GV 1280 × 800, HV 390 × 844, one worker.
  The Playwright MCP browser was in use by the parallel 002 QA session, so every case ran through the project's Playwright library in an
  isolated browser (script written, executed and observed per case, then one full pass).
- **Failures:**
  - **TC-002 — AC-1.3:** after "Quay lại" from step 4 to step 3 of T03, the browser Back shows step 4 ("Bước 4/4 · Xác nhận") instead of
    step 2 ("Bước 2/4 · Thêm học viên"); "Quay lại" / "Sửa" push a new history entry. Screenshot
    [TC-002-fail](testing/runs/2026-10-23-2311/screenshots/TC-002-fail.png).
- **Traceability** — `node .sdd/scripts/sdd.mjs trace 003`: 154 / 154 ACs ✅ (REQ → AC → T### → saved script citing `003:AC-n.m`).
  Output tail:

  ```
  ## Gaps

  None.
  ```

- **NFR measurements** (local, single samples — see the report): NFR-1 ≤ 239 ms, NFR-2 362 ms, NFR-3 ≤ 147 ms, NFR-4 ≤ 19 ms; NFR-5, NFR-6
  (manual part), NFR-8, NFR-9 are Thủ công.

**Verdict:** FAIL — TC-002 (AC-1.3) fails on the current code. Every AC is traced and the manual cases have instructions; status stays
`implementing` until `/module 003` fixes TC-002 and a re-run passes.
