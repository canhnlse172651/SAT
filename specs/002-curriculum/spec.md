---
id: 002
slug: curriculum
title: Curriculum & Lessons
status: implementing
branch: feat/002-curriculum
created: 2026-10-18
updated: 2026-10-23
approved_by: canh
approved_at: 2026-10-23
---

# Curriculum & Lessons

<!--
SPEC = WHAT the system must do and WHY. Never HOW: no frameworks, tables, endpoints, class names.
Audience: product owner, QA, and the agents downstream. Every statement must be testable.

Machine-checked format (sdd check):
- Requirement heading:  ### REQ-<n>: <title>
- Acceptance criterion: - AC-<n>.<m>: <EARS sentence>      (n = parent REQ number)
- Non-functional:       - NFR-<n>: <category>: <measurable target with a number>
- EARS keywords stay in ENGLISH UPPERCASE even when the prose is in another language.
- Every unknown → [NEEDS CLARIFICATION: <specific question>]. Never guess silently.
- Frontmatter status changes ONLY through the CLI (sdd set-status / sdd approve).
- Human-readable view with flows, rules, states and screens: spec.html (mirrors this file).
- v2 (2026-10-19): rewritten for the stakeholder answers of 2026-10-19 (D2 v2, D3 v2, D5, D6, X1–X5).
- v3 (2026-10-20): simplified for the stakeholder input of 2026-10-20 (V3-1 … V3-4): Bài = 2 sections,
  no learning path, no exams (006 deferred), T18 "Soạn bài" with 2 panels, AI content saved only on approval.
- v4 (2026-10-20, second round): V4-2, V4-3, V4-4 — approved AI content lands as Đã xuất bản and replaces the
  section's content (new REQ-19); changing the HSK level of a used curriculum is allowed and live (Q-1 closed).
- v6 (2026-10-21): V6-1, V6-3 — the T18 "Thủ công" panel shows only the two sections (summary by status + "Mở"),
  "Mở" opens the section editor T07 (Bài học) / T09 (Bài tập); adding and ordering items happen there ("Lên" / "Xuống",
  saved immediately); T21 reuses the "Web / Mobile" switch (default Web, Mobile = 375 px frame, remembered per GV per session).
- v10 (2026-10-21): V10-1, V10-2 (supersedes v6 section editors and the v9 proposal) — T18 "Thủ công" panel =
  summary of both sections + one "Soạn thủ công" button; T07 "Soạn bài thủ công" is one edit-only screen with tabs
  Bài học | Bài tập (002 owns the shell, 004 the Bài học tab, 005 the Bài tập tab = T09); no "Xem trước", "Xong",
  "Web / Mobile" or "Xem như học viên" in T07; T21 opens only from T06 (one action per Bài) and previews the
  whole Bài with "Web / Mobile"; the remembered choice is shared by T20 and T21 only (AC-16.8).
-->

## 1. Summary

Giáo viên (GV) dạy tiếng Trung cần tổ chức nội dung giảng dạy theo cấp độ HSK, chia thành từng **Bài** giống giáo trình giấy, và dùng lại nội dung đó cho nhiều lớp. Module này cho GV tạo và quản lý **Giáo trình** (đúng một cấp độ HSK1–HSK9) gồm một danh sách Bài có thứ tự; mỗi Bài luôn có **đúng 2 phần cố định Bài học · Bài tập**, mỗi phần có thứ tự riêng do GV sắp xếp (V3-2). GV soạn Bài trên màn hình **T18 "Soạn bài"** gồm 2 panel đặt cạnh nhau: panel trái **Thủ công** (module này — tóm tắt hai phần và một nút "Soạn thủ công" mở **T07 "Soạn bài thủ công"**, một màn hình chỉ để chỉnh sửa với hai tab Bài học | Bài tập, nơi GV thêm, sửa và sắp xếp từng mục — V10-1) và panel phải **Tạo bằng AI** (module 010 — tải tài liệu, nhập mô tả ngắn, review); nội dung do AI tạo chỉ được lưu vào Bài khi GV duyệt (V3-3, V3-4); duyệt một phần là xuất bản luôn và thay toàn bộ nội dung cũ của phần đó — mục cũ chưa có dữ liệu học tập bị xóa, bộ bài tập cũ đã có dữ liệu học tập được lưu trữ và giữ điểm (V4-2, V4-3). GV đổi tên, sắp xếp, xuất bản Bài và từng mục (Nháp → Đã xuất bản, không quay lại), lưu trữ bước học hoặc bộ bài tập, nhân bản một Bài hoặc cả giáo trình, xóa an toàn và xem trước cả một Bài hoàn chỉnh đúng như học viên (HV) thấy (T21, chỉ mở từ danh sách Bài T06, với công tắc "Web / Mobile" — V6-3, V10-2). Vì lớp tham chiếu giáo trình trực tiếp (A8), mọi thay đổi — kể cả đổi cấp độ HSK của giáo trình đang được dùng (V4-4) — hiện ngay ở các lớp nhưng không bao giờ làm mất bài làm của HV; việc ẩn từng phần cho riêng một lớp thuộc 003 (D5).

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| GV dựng khung giáo trình và Bài đầu tiên nhanh | Thời gian từ lúc bấm "Tạo giáo trình" đến khi T18 của Bài đầu tiên mở ra, thử nghiệm khả dụng với GV dùng lần đầu | ≤ 90 s với ≥ 90% GV |
| Tái sử dụng nội dung giữa các khóa / lớp | Tỉ lệ giáo trình mới được tạo bằng "Nhân bản" sau 3 tháng vận hành | ≥ 30% |
| HV chỉ thấy nội dung GV đã xuất bản | Số Bài hoặc mục Nháp / Lưu trữ hiển thị với HV (kiểm thử tự động + báo lỗi người dùng) | 0 |
| Nội dung AI chỉ vào Bài sau khi GV duyệt | Số mục do AI tạo xuất hiện trong phần Bài học / Bài tập của một Bài mà không qua thao tác "Duyệt" của GV | 0 |
| Không mất dữ liệu học tập do chỉnh sửa giáo trình | Số sự cố mất lượt làm, bài nộp hoặc điểm xếp hạng bài tập của HV do thao tác xóa hoặc duyệt nội dung AI thay thế phần trong module này | 0 |
| Sắp xếp nội dung dễ dàng | Thời gian chuyển một Bài hoặc một mục trong một phần tới vị trí mới trong danh sách 30 phần tử (kéo-thả hoặc bàn phím với Bài trên T06; "Lên" / "Xuống" với mục trong tab Bài học / Bài tập của T07) | ≤ 15 s với ≥ 90% GV |

## 3. Actors & Context

- **Giáo viên (GV)** — chủ workspace và là người duy nhất quản trị giáo trình của mình (D1). Làm việc trên máy tính (thiết kế cho ≥ 1280 px, dùng được từ 1024 px — A4). Hiện nay GV soạn tài liệu rời rạc (tệp Word/PDF, video, nhóm chat) theo từng bài của giáo trình giấy; GV muốn dựng một lần theo cấp độ HSK, chia theo Bài, tự soạn từ các bước và khối của hệ thống hoặc nhờ AI tạo từ tài liệu có sẵn, review rồi mới lưu, và dùng lại cho nhiều lớp.
- **Học viên (HV)** — không thao tác trong module này nhưng chịu ảnh hưởng trực tiếp: chỉ thấy Bài và mục Đã xuất bản của giáo trình qua lớp mình tham gia (S02, S11 của 003; S03–S06 của 004/005), chủ yếu trên điện thoại 360–430 px.
- **Các module liên quan (tác nhân hệ thống)** — 003 gán giáo trình cho lớp, ẩn/hiện từng phần của từng Bài theo lớp (D5) và hiển thị S02/S11; 004/005 soạn nội dung bước học và bộ bài tập, 005 ghi nhận lượt làm và bài nộp; 010 sở hữu panel "Tạo bằng AI" của T18 và T20 (review, hộp xác nhận duyệt) và giao nội dung đã duyệt để 002 thay nội dung của phần; 008/009 dùng tập bộ bài tập Đã xuất bản để tính điểm xếp hạng và tiến độ. 006 (bài thi) và 007 (chấm tự luận) hoãn sau MVP — module này không phụ thuộc vào chúng.

Bối cảnh sử dụng: GV tạo giáo trình (ví dụ "HSK1") → "Thêm bài" → T18 "Soạn bài" mở ra → soạn tay từ panel Thủ công ("Soạn thủ công" → T07, tab Bài học và tab Bài tập) hoặc tải tài liệu ở panel Tạo bằng AI, review ở T20 và duyệt (phần được thay bằng nội dung mới, ở trạng thái Đã xuất bản) → xuất bản Bài → gán giáo trình cho lớp (003). Trong khi lớp đang học, GV tiếp tục thêm, sắp xếp và xuất bản dần các Bài tiếp theo. Khi cần phiên bản khác, GV nhân bản một Bài hoặc cả giáo trình.

## 4. User Stories

- US-1 (P1): Là GV, tôi muốn tạo, sửa và tìm giáo trình theo cấp độ HSK, để quản lý nội dung giảng dạy của mình theo từng cấp độ.
  - Why this priority: là điểm vào của mọi nội dung; 003 không thể gán giáo trình cho lớp nếu chưa có giáo trình.
  - Independent test: tạo giáo trình "Giáo trình HSK1 cơ bản" cấp HSK1 → T06 mở với trạng thái "Giáo trình chưa có bài nào"; thấy giáo trình trên T05; lọc HSK1 và tìm "giao trinh" đều ra; sửa mô tả thành công; tạo giáo trình thứ hai cùng tên bị từ chối.
- US-2 (P1): Là GV, tôi muốn chia giáo trình thành các Bài có thứ tự — thêm, đổi tên và sắp xếp — để nội dung đi theo đúng từng bài của giáo trình tôi dạy.
  - Why this priority: Bài là đơn vị tổ chức của mọi nội dung; không có Bài thì không có chỗ đặt bước học và bài tập.
  - Independent test: giáo trình rỗng → "Thêm bài" → tên điền sẵn "Bài 1" → xác nhận → T18 "Soạn bài" mở với 2 panel; thêm "Bài 2", kéo lên đầu (rồi lặp lại chỉ bằng bàn phím), tải lại thấy thứ tự mới; đổi tên thành "Bài 1 – 你好" hiển thị đúng trên T06 và T18.
- US-3 (P1): Là GV, tôi muốn mỗi Bài có sẵn 2 phần Bài học · Bài tập và soạn cả hai trong một màn hình chỉnh sửa hai tab mở từ panel Thủ công, tự soạn nội dung và sắp xếp thứ tự trong từng phần, để HV học theo trình tự tôi muốn.
  - Why this priority: quyết định V3-2, V6-1 và V10-1; 004/005 cần nơi đặt nội dung, HV cần một thứ tự học.
  - Independent test: mở Bài mới → panel Thủ công có tóm tắt "Chưa có bước học nào", "Chưa có bộ bài tập nào" và một nút "Soạn thủ công", không có nút "Xem như học viên"; bấm "Soạn thủ công" → T07 mở ở tab Bài học, không có "Xem trước", "Xong" hay "Web / Mobile"; thêm 2 bước học; chuyển sang tab Bài tập (T09), thêm 2 bộ bài tập; quay lại T18 → tóm tắt "2 bước học · 2 nháp" và "2 bộ bài tập · 2 nháp"; mở lại T07, trên tab Bài học bấm "Lên" trên bước học thứ 2 → bước đó lên đầu phần Bài học ngay, tải lại vẫn thấy thứ tự mới, thứ tự phần Bài tập không đổi; T07 không có thao tác chuyển mục sang phần kia.
- US-4 (P1): Là GV, tôi muốn xuất bản Bài và từng mục khi đã sẵn sàng, để HV chỉ thấy nội dung tôi đã duyệt.
  - Why this priority: không có trạng thái xuất bản thì mọi nội dung đang soạn dở đều lộ ra cho HV.
  - Independent test: Bài Nháp có 2 mục sẵn sàng và 1 bước học trống → "Xuất bản bài" → hộp thoại chọn sẵn 2 mục, bước học trống không chọn được kèm lý do → xác nhận → HV của lớp dùng giáo trình thấy Bài với đúng 2 mục ở đúng phần; không có thao tác đưa Bài hoặc mục về Nháp.
- US-5 (P1): Là GV, tôi muốn có panel "Tạo bằng AI" ngay cạnh panel soạn tay trong cùng màn hình Soạn bài, chỉ nhận nội dung AI vào Bài khi tôi đã duyệt, và khi duyệt thì nội dung mới thay hẳn nội dung cũ của phần và được xuất bản luôn, để tận dụng AI mà không bao giờ lộ nội dung chưa duyệt hay làm mất điểm của HV.
  - Why this priority: yêu cầu của stakeholder (V3-3, V3-4, V4-2, V4-3); 002 cung cấp khung T18 và quy tắc lưu, thay thế, hiển thị nội dung AI đã duyệt.
  - Independent test: mở T18 của một Bài Đã xuất bản có phần Bài tập gồm 3 bộ (1 bộ có bài nộp) → panel "Tạo bằng AI" hiện bên cạnh panel Thủ công; chạy tạo bằng AI (010) → Bài mang nhãn AI trên T06 và T18, panel Thủ công không đổi, HV không thấy gì mới; bấm "Duyệt" phần Bài tập ở T20 gồm 4 bộ → hộp xác nhận nêu đúng 2 bộ sẽ bị xóa và 1 bộ sẽ được lưu trữ → xác nhận → phần Bài tập có 4 bộ mới ở trạng thái Đã xuất bản, dấu "AI tạo", theo thứ tự đã duyệt, rồi bộ có bài nộp ở trạng thái Lưu trữ; HV thấy 4 bộ mới khi tải lại và điểm xếp hạng cũ không đổi.
- US-6 (P1): Là GV, tôi muốn sửa và xóa nội dung của giáo trình đang được lớp dùng một cách an toàn — thay đổi hiện ngay ở các lớp, nhưng không thể xóa thứ gì làm mất bài làm của HV.
  - Why this priority: giáo trình được tham chiếu trực tiếp (A8); một thao tác xóa sai có thể xóa bài làm và điểm của cả lớp.
  - Independent test: bộ bài tập có bài nộp → "Xóa" trong T07 bị từ chối kèm gợi ý lưu trữ; bấm "Lưu trữ" → bộ chuyển ngay sang Lưu trữ (không hỏi xác nhận), HV mọi lớp không thấy bộ đó, khôi phục → thấy lại với dữ liệu cũ; Bài có bộ bài tập đã có bài nộp → không xóa được; mục chưa có dữ liệu → xóa được và phần được đánh số lại; giáo trình đang được 1 lớp dùng → không xóa được; đổi tên Bài đã xuất bản → HV thấy tên mới khi tải lại; đổi cấp độ HSK của giáo trình đang được 2 lớp dùng → xác nhận → cả 2 lớp hiển thị cấp độ mới khi tải lại.
- US-7 (P2): Là GV, tôi muốn nhân bản một Bài hoặc cả giáo trình, để làm nhanh phiên bản mới mà không ảnh hưởng bản gốc.
  - Why this priority: tiết kiệm nhiều giờ soạn lại, nhưng MVP vẫn dùng được khi chưa có.
  - Independent test: nhân bản một Bài đã xuất bản có bài nộp → bản sao nằm ngay sau Bài gốc, Bài và mọi mục ở Nháp, không có nhãn "Có dữ liệu học viên", mục AI giữ dấu "AI tạo"; nhân bản giáo trình → bản sao "Dùng bởi 0 lớp" với cùng Bài và mục theo cùng thứ tự; sửa bản sao không làm đổi bản gốc.
- US-8 (P2): Là GV, tôi muốn từ danh sách Bài xem trước cả một Bài hoàn chỉnh — bài học và bài tập — đúng như HV thấy, để kiểm tra trước khi HV dùng.
  - Why this priority: giảm lỗi hiển thị trên điện thoại của HV; không bắt buộc để vận hành; stakeholder chỉ muốn xem như HV ở danh sách Bài và cho cả Bài (V10-2).
  - Independent test: trên T06, thao tác "Xem như học viên" của một Bài có 2 bước học (1 Nháp) và 1 bộ bài tập Đã xuất bản → T21 mở ở tab "Bài học" với 1 bước, tab "Bài tập" có 1 bộ; bật "Gồm cả mục Nháp" → bước Nháp hiện thêm với nhãn "Nháp"; ở tab "Bài tập" chọn thử đáp án được nhưng không nộp được và không có lượt làm nào được ghi nhận; công tắc "Web / Mobile" mặc định ở "Web", chọn "Mobile" → cùng nội dung trong khung rộng 375 px, thoát về T06 rồi mở lại T21 trong cùng phiên đăng nhập vẫn ở "Mobile"; T18 và T07 không có nút "Xem như học viên".
- US-9 (P2): Là GV, tôi muốn lưu trữ giáo trình không còn dùng cho lớp mới, để danh sách gọn mà các lớp đang dùng vẫn hoạt động bình thường.
  - Why this priority: là lối thoát an toàn khi giáo trình không được phép xóa (US-6).
  - Independent test: lưu trữ giáo trình đang được 1 lớp dùng → biến khỏi T05 mặc định và khỏi danh sách chọn ở T03, HV lớp đó vẫn học bình thường; khôi phục → xuất hiện lại.

## 5. Functional Requirements

### REQ-1: Tạo giáo trình

<!-- Story: US-1 · Priority: P1 · Screen: T05, T06 -->

- AC-1.1: WHEN GV bấm "Tạo giáo trình" trên T05 THE SYSTEM SHALL hiển thị biểu mẫu gồm Tên (bắt buộc), Cấp độ HSK (bắt buộc, chọn đúng một giá trị từ HSK1 đến HSK9, không chọn sẵn), Mô tả (không bắt buộc) và Ảnh bìa (không bắt buộc).
- AC-1.2: WHEN GV gửi biểu mẫu tạo với dữ liệu hợp lệ THE SYSTEM SHALL tạo giáo trình thuộc workspace của GV, chưa có Bài nào, hiển thị "Đã tạo giáo trình" và mở T06 của giáo trình đó.
- AC-1.3: IF Tên rỗng sau khi bỏ khoảng trắng đầu/cuối hoặc dài hơn 100 ký tự THEN THE SYSTEM SHALL không tạo giáo trình và hiển thị tại trường Tên "Vui lòng nhập tên giáo trình" hoặc "Tên giáo trình tối đa 100 ký tự".
- AC-1.4: IF Tên trùng với tên một giáo trình khác trong cùng workspace (không phân biệt hoa/thường, sau khi bỏ khoảng trắng thừa, kể cả giáo trình Đã lưu trữ) THEN THE SYSTEM SHALL không tạo giáo trình và hiển thị tại trường Tên "Tên giáo trình đã tồn tại".
- AC-1.5: IF chưa chọn Cấp độ HSK hoặc Mô tả dài hơn 2000 ký tự THEN THE SYSTEM SHALL không tạo giáo trình và hiển thị tại đúng trường "Vui lòng chọn cấp độ HSK" hoặc "Mô tả tối đa 2000 ký tự".
- AC-1.6: IF Ảnh bìa không phải tệp JPG, PNG hoặc WebP hoặc lớn hơn 2 MB THEN THE SYSTEM SHALL từ chối ảnh, giữ nguyên các trường đã nhập và hiển thị "Ảnh bìa phải là JPG, PNG hoặc WebP, tối đa 2 MB".

### REQ-2: Sửa thông tin giáo trình

<!-- Story: US-1, US-6 · Priority: P1 · Screen: T06, T05 -->

- AC-2.1: WHEN GV lưu thay đổi hợp lệ cho Tên, Mô tả hoặc Ảnh bìa (thay mới hoặc gỡ bỏ), hoặc cho Cấp độ HSK của giáo trình chưa được lớp nào sử dụng, THE SYSTEM SHALL lưu ngay mà không cần xác nhận thêm, hiển thị "Đã lưu thay đổi" và hiển thị thông tin mới trên T05 và T06.
- AC-2.2: IF dữ liệu sửa vi phạm một quy tắc kiểm tra của AC-1.3, AC-1.4, AC-1.5 hoặc AC-1.6 (khi so trùng tên thì bỏ qua chính giáo trình đang sửa) THEN THE SYSTEM SHALL không lưu bất kỳ thay đổi nào và hiển thị cùng thông báo lỗi tại đúng trường.
- AC-2.3: WHEN GV đổi Cấp độ HSK của giáo trình đang được ít nhất một lớp sử dụng THE SYSTEM SHALL cho phép đổi mà không có hạn chế nào khác ngoài hộp xác nhận "Giáo trình đang được dùng bởi N lớp. Bạn có chắc muốn đổi cấp độ HSK?", lưu cấp độ mới và hiển thị "Đã lưu thay đổi" khi GV xác nhận, và giữ nguyên cấp độ cũ khi GV hủy.
- AC-2.4: WHEN GV lưu thay đổi tên, cấp độ HSK, mô tả hoặc ảnh bìa của giáo trình đang được lớp sử dụng THE SYSTEM SHALL hiển thị thông tin mới ở mọi lớp dùng giáo trình (cho GV và HV của các lớp đó) ở lần mở hoặc tải lại trang kế tiếp, không cần GV thao tác thêm ở từng lớp và không thay đổi Bài, mục hay dữ liệu học tập nào.

### REQ-3: Danh sách giáo trình

<!-- Story: US-1 · Priority: P1 · Screen: T05 -->

- AC-3.1: WHEN GV mở T05 THE SYSTEM SHALL hiển thị các giáo trình Hoạt động của workspace, sắp xếp theo thời điểm cập nhật gần nhất giảm dần, mỗi giáo trình gồm ảnh bìa (hoặc ảnh mặc định mang nhãn cấp độ nếu chưa có), tên, nhãn cấp độ HSK, số Bài và số Bài Đã xuất bản (ví dụ "12 bài · 10 đã xuất bản"), "Dùng bởi N lớp" và thời điểm cập nhật gần nhất theo giờ Việt Nam.
- AC-3.2: WHEN GV chọn một giá trị trong bộ lọc cấp độ (Tất cả, HSK1 … HSK9) THE SYSTEM SHALL chỉ hiển thị giáo trình thuộc cấp độ đó và giữ lựa chọn này khi GV quay lại T05 trong cùng phiên đăng nhập.
- AC-3.3: WHEN GV nhập từ khóa vào ô tìm kiếm THE SYSTEM SHALL chỉ hiển thị giáo trình có tên chứa từ khóa, không phân biệt hoa/thường và dấu (dấu tiếng Việt, dấu thanh pinyin; ví dụ "giao trinh" khớp "Giáo trình"), kết hợp với bộ lọc cấp độ đang chọn.
- AC-3.4: WHILE workspace chưa có giáo trình nào THE SYSTEM SHALL hiển thị trên T05 trạng thái trống "Bạn chưa có giáo trình nào" kèm nút "Tạo giáo trình".
- AC-3.5: IF bộ lọc và từ khóa không khớp giáo trình nào THEN THE SYSTEM SHALL hiển thị "Không tìm thấy giáo trình phù hợp" kèm nút "Xóa bộ lọc" đưa danh sách về trạng thái không lọc.
- AC-3.6: WHILE có hơn 20 giáo trình phù hợp với bộ lọc hiện tại THE SYSTEM SHALL phân trang 20 giáo trình mỗi trang và hiển thị tổng số giáo trình phù hợp.

### REQ-4: Chi tiết giáo trình và danh sách Bài

<!-- Story: US-2, US-6 · Priority: P1 · Screen: T06, T18, T04 -->

- AC-4.1: WHEN GV mở một giáo trình THE SYSTEM SHALL hiển thị T06 gồm tên, cấp độ HSK, mô tả, ảnh bìa, "Dùng bởi N lớp" và danh sách Bài theo thứ tự hiện tại, mỗi Bài gồm số thứ tự, tên, trạng thái (Nháp / Đã xuất bản), tóm tắt 2 phần (ví dụ "8 bước học · 5 bộ bài tập · 2 mục nháp"), nhãn AI của Bài theo AC-11.3 và nhãn "Có dữ liệu học viên" khi áp dụng, và thời điểm cập nhật gần nhất theo giờ Việt Nam.
- AC-4.2: WHILE giáo trình chưa có Bài nào THE SYSTEM SHALL hiển thị trên T06 trạng thái trống "Giáo trình chưa có bài nào" kèm nút "Thêm bài".
- AC-4.3: WHILE giáo trình đang được ít nhất một lớp sử dụng THE SYSTEM SHALL hiển thị trên T06 và T18 thông báo "Giáo trình đang được dùng bởi N lớp. Thay đổi với nội dung đã xuất bản sẽ hiển thị ngay cho học viên các lớp này."
- AC-4.4: WHEN GV mở danh sách "Lớp sử dụng" trên T06 THE SYSTEM SHALL liệt kê tên, trạng thái (Sắp bắt đầu / Đang học / Đã kết thúc) và ngày bắt đầu của từng lớp dùng giáo trình, mỗi lớp dẫn tới tab Nội dung của T04 của lớp đó, hoặc "Chưa có lớp nào." khi giáo trình chưa được lớp nào dùng.

### REQ-5: Thêm và đổi tên Bài

<!-- Story: US-2 · Priority: P1 · Screen: T06, T18 -->

- AC-5.1: WHEN GV bấm "Thêm bài" trên T06 (kể cả nút ở trạng thái trống) THE SYSTEM SHALL hiển thị hộp thoại có trường Tên bài (bắt buộc) điền sẵn "Bài N" với N bằng số Bài hiện có cộng 1, GV sửa được.
- AC-5.2: WHEN GV xác nhận hộp thoại với Tên bài hợp lệ THE SYSTEM SHALL tạo Bài ở trạng thái Nháp tại cuối danh sách Bài với đúng 2 phần rỗng Bài học và Bài tập, hiển thị "Đã thêm bài" và mở T18 "Soạn bài" của Bài đó.
- AC-5.3: IF Tên bài rỗng sau khi bỏ khoảng trắng đầu/cuối hoặc dài hơn 100 ký tự THEN THE SYSTEM SHALL không lưu và hiển thị tại trường Tên bài "Vui lòng nhập tên bài" hoặc "Tên bài tối đa 100 ký tự".
- AC-5.4: WHEN GV lưu một tên mới hợp lệ bằng thao tác "Đổi tên" của Bài trên T06 hoặc T18 THE SYSTEM SHALL lưu ngay, hiển thị "Đã đổi tên bài" và hiển thị tên mới trên T06 và T18 mà không thay đổi thứ tự, trạng thái hay nội dung của Bài.
- AC-5.5: IF giáo trình đã có 100 Bài THEN THE SYSTEM SHALL vô hiệu "Thêm bài" và "Nhân bản bài" kèm chú thích "Mỗi giáo trình tối đa 100 bài" và từ chối mọi yêu cầu tạo Bài mới vào giáo trình đó.

### REQ-6: Sắp xếp thứ tự Bài và mục

<!-- Story: US-2, US-3 · Priority: P1 · Screen: T06 (Bài), T07 tab Bài học / tab Bài tập T09 (mục — V10-1) -->

- AC-6.1: WHEN GV kéo-thả một Bài tới vị trí mới trong danh sách Bài trên T06 THE SYSTEM SHALL lưu thứ tự mới ngay, đánh số lại danh sách và hiển thị "Đã cập nhật thứ tự" mà không cần bấm lưu.
- AC-6.2: WHEN GV di chuyển một Bài trên T06 bằng bàn phím (Space trên tay nắm kéo để nhấc, mũi tên Lên/Xuống để di chuyển, Space để thả) hoặc bằng nút "Lên trên" / "Xuống dưới" trên dòng Bài và mục "Lên đầu" / "Xuống cuối" trong menu của Bài THE SYSTEM SHALL lưu thứ tự như khi kéo-thả và thông báo vị trí mới cho trình đọc màn hình (ví dụ "Vị trí 5 trên 12").
- AC-6.3: IF GV thả Bài ra ngoài danh sách hoặc nhấn Esc khi đang di chuyển THEN THE SYSTEM SHALL đưa Bài về vị trí cũ và không thay đổi thứ tự.
- AC-6.4: IF việc lưu thứ tự mới của danh sách Bài hoặc của một phần không thành công THEN THE SYSTEM SHALL đưa danh sách về thứ tự trước khi di chuyển và hiển thị "Không lưu được thứ tự. Vui lòng thử lại."
- AC-6.5: WHEN GV bấm "Lên trên" (▲) hoặc "Xuống dưới" (▼) trên một bước học hoặc bộ bài tập trong tab Bài học hoặc tab Bài tập (T09) của T07 THE SYSTEM SHALL đổi chỗ mục đó với mục liền trước hoặc liền sau trong thứ tự của phần (kể cả mục Lưu trữ đang ẩn), lưu thứ tự mới ngay mà không cần GV bấm lưu, đánh số lại phần và hiển thị "Đã chuyển tới vị trí {k}/{n} · Đã lưu" (k = vị trí mới, n = số mục của phần), thông báo này cũng được đọc cho trình đọc màn hình.
- AC-6.6: THE SYSTEM SHALL vô hiệu "Lên trên" trên mục đầu tiên và "Xuống dưới" trên mục cuối cùng trong thứ tự của phần, tính cả các mục Lưu trữ dù chúng đang được hiện hay ẩn trong tab của T07.

### REQ-7: Màn hình Soạn bài (T18), panel Thủ công và khung T07 "Soạn bài thủ công"

<!-- Story: US-3, US-5 · Priority: P1 · Screen: T18, T07 (khung và tab), T09 (tab Bài tập) -->

- AC-7.1: WHEN GV bấm vào một Bài trên T06 THE SYSTEM SHALL mở T18 "Soạn bài" gồm phần đầu (đường dẫn về giáo trình, tên Bài, trạng thái và các nhãn của Bài) và 2 panel đặt cạnh nhau: panel trái "Thủ công" và panel phải "Tạo bằng AI".
- AC-7.2: THE SYSTEM SHALL đảm bảo mỗi Bài luôn có đúng 2 phần theo thứ tự Bài học, Bài tập, không cung cấp thao tác thêm, xóa, đổi tên hay đổi thứ tự phần, và không cung cấp thao tác chuyển mục sang phần, Bài hoặc giáo trình khác.
- AC-7.3: WHEN T18 mở THE SYSTEM SHALL hiển thị trong panel Thủ công phần Bài học rồi phần Bài tập, mỗi phần gồm tên phần, tóm tắt gồm tổng số mục và số mục theo từng trạng thái (ví dụ "5 bước học · 3 đã xuất bản · 1 nháp · 1 lưu trữ", không nêu trạng thái có 0 mục) và thời điểm cập nhật gần nhất của phần, cùng một nút "Soạn thủ công" duy nhất cho cả panel, và không hiển thị danh sách mục, thao tác trên từng mục hay nút "Mở" riêng cho từng phần.
- AC-7.4: WHILE một phần của Bài chưa có mục nào THE SYSTEM SHALL hiển thị trong phần đó, thay cho tóm tắt, trạng thái trống "Chưa có bước học nào" hoặc "Chưa có bộ bài tập nào".
- AC-7.5: WHEN GV bấm "Soạn thủ công" trên panel Thủ công THE SYSTEM SHALL mở T07 "Soạn bài thủ công" của Bài ở tab Bài học, với toàn bộ bước học của phần Bài học theo thứ tự của phần.
- AC-7.6: WHEN GV bấm "Thêm bước học" / "Thêm bộ bài tập" trên thanh công cụ của tab, hoặc "Thêm sau" trên một mục, trong T07 THE SYSTEM SHALL tạo và lưu ngay một mục mới ở trạng thái Nháp trong phần tương ứng của Bài — bước học gồm một khối Văn bản trống, bộ bài tập gồm một câu trắc nghiệm mẫu — tại cuối phần hoặc ngay sau mục đó, đánh số lại phần, hiển thị "Đã thêm {bước học | bộ bài tập} mới (Nháp) · Đã lưu" và đặt tiêu điểm vào ô tên của mục mới; mục mới không được tính là mục có thay đổi chưa lưu.
- AC-7.8: WHEN GV quay lại T18 từ T07 THE SYSTEM SHALL hiển thị tóm tắt mới nhất của cả hai phần và đặt tiêu điểm vào nút "Soạn thủ công".
- AC-7.9: IF GV bấm một nút thêm mục trong tab Bài học hoặc tab Bài tập của T07 khi phần tương ứng đã có 30 mục không ở trạng thái Lưu trữ THEN THE SYSTEM SHALL không tạo mục mới và hiển thị "Mỗi bài có tối đa 30 {bước học | bộ bài tập}.", trong đó các nút thêm mục luôn ở trạng thái bật và mục Lưu trữ không được tính vào giới hạn 30.
- AC-7.10: THE SYSTEM SHALL áp dụng ngay khi GV thực hiện hoặc xác nhận mọi thao tác của module này trên mục trong T07 — thêm mục, sắp xếp, xuất bản, lưu trữ, khôi phục và xóa — và không hoàn tác thao tác nào đã lưu khi GV chuyển tab hoặc rời T07.
- AC-7.11: WHILE T07 đang mở THE SYSTEM SHALL hiển thị phần đầu của T07 gồm đường dẫn về giáo trình, nút quay lại T18, tên Bài, trạng thái Bài, thao tác "Xuất bản bài…" khi Bài còn Nháp hoặc "Xuất bản… ({k} Nháp)" khi Bài Đã xuất bản còn k mục Nháp (cả hai mở hộp thoại của AC-9.3) và hai tab theo thứ tự "Bài học" | "Bài tập", mỗi tab kèm số mục của phần tương ứng.
- AC-7.12: WHEN GV chọn một tab của T07, hoặc mở đường dẫn tới T09 THE SYSTEM SHALL hiển thị nội dung soạn của phần tương ứng (tab Bài học do 004, tab Bài tập — T09 — do 005 trình bày) trong cùng T07, mở T07 ở tab Bài tập khi đường dẫn là T09, và giữ nguyên các mục có thay đổi chưa lưu của tab còn lại — không lưu, không bỏ, giữ nhãn "Chưa lưu" của chúng.
- AC-7.13: WHEN GV rời T07 (quay lại T18 hoặc đi tới màn hình khác) trong khi còn mục có thay đổi chưa lưu ở bất kỳ tab nào THE SYSTEM SHALL yêu cầu xác nhận "Có {k} mục chưa lưu. Rời trang và bỏ các thay đổi này?" kèm "Các thay đổi chưa lưu sẽ bị bỏ; nội dung đã lưu không đổi." và hai nút "Rời đi" / "Ở lại", với k là tổng số mục chưa lưu của cả hai tab, và chỉ rời T07 khi GV chọn "Rời đi"; chuyển tab không phải là rời T07.
- AC-7.14: THE SYSTEM SHALL không hiển thị ở phần đầu hay ở bất kỳ tab nào của T07 chế độ "Xem trước", nút "Chỉnh sửa" / "Xong", công tắc "Web / Mobile" hay nút "Xem như học viên", và trình bày T07 ở bố cục web.

### REQ-8: Thứ tự mục trong từng phần

<!-- Story: US-3 · Priority: P1 · Screen: T07 (tab Bài học, tab Bài tập T09), T21, S11 (003) -->

- AC-8.1: THE SYSTEM SHALL giữ cho mỗi phần của Bài một thứ tự riêng, sao cho việc đổi thứ tự trong phần Bài học không làm thay đổi thứ tự trong phần Bài tập và ngược lại.
- AC-8.2: IF một thao tác di chuyển hoặc thêm mục sẽ đặt một mục vào phần còn lại của Bài (ví dụ một bộ bài tập vào phần Bài học) THEN THE SYSTEM SHALL từ chối thao tác, giữ mục ở phần và vị trí cũ và không thay đổi thứ tự của phần nào.
- AC-8.3: THE SYSTEM SHALL dùng cùng một thứ tự của phần Bài học cho tab Bài học của T07, cho T21 và cho trang Bài của HV, và cùng một thứ tự của phần Bài tập cho tab Bài tập (T09) của T07, cho T21 và cho trang Bài của HV.

### REQ-9: Xuất bản Bài và mục

<!-- Story: US-4 · Priority: P1 · Screen: T06, T18 -->

- AC-9.1: WHEN GV bấm "Xuất bản" trên một mục Nháp trong tab Bài học hoặc tab Bài tập của T07 THE SYSTEM SHALL lưu cùng lúc các thay đổi chưa lưu của mục, chuyển mục sang Đã xuất bản ngay mà không hỏi xác nhận và hiển thị "Đã xuất bản · Đã lưu lúc {HH:mm}".
- AC-9.2: IF mục cần xuất bản chưa đạt điều kiện xuất bản của module soạn thảo — bước học theo 004, bộ bài tập theo 005; mục trống luôn không đạt — THEN THE SYSTEM SHALL giữ mục ở Nháp, không lưu gì và hiển thị "Không thể xuất bản — Chưa hoàn chỉnh: {lý do}" với lý do do module soạn thảo cung cấp.
- AC-9.3: WHEN GV chọn "Xuất bản bài" cho một Bài Nháp trên T06 hoặc T18, hoặc chọn thao tác xuất bản cho một Bài Đã xuất bản còn mục Nháp trên T18 hay T07 (AC-7.11), THE SYSTEM SHALL hiển thị hộp thoại "Xuất bản “{tên Bài}”" liệt kê theo từng phần Bài học, Bài tập các mục Nháp sẵn sàng theo AC-9.2 (được chọn sẵn, GV bỏ chọn được), các mục Nháp chưa sẵn sàng kèm lý do (không chọn được), và cảnh báo "Bài sẽ hiển thị với học viên của N lớp (trừ các phần đang ẩn ở từng lớp)." khi giáo trình đang được sử dụng.
- AC-9.4: WHEN GV xác nhận hộp thoại xuất bản bài THE SYSTEM SHALL chuyển Bài và mọi mục được chọn sang Đã xuất bản trong cùng một thao tác (không thay đổi gì nếu thao tác không thành công), giữ các mục còn lại ở Nháp và hiển thị "Đã xuất bản bài".
- AC-9.5: IF sau khi xác nhận Bài sẽ không có mục Đã xuất bản nào (Bài chưa có mục Đã xuất bản và không mục nào được chọn) THEN THE SYSTEM SHALL vô hiệu nút xác nhận của hộp thoại kèm chú thích "Cần ít nhất một mục sẵn sàng để xuất bản bài".
- AC-9.6: THE SYSTEM SHALL chỉ cho phép các chuyển trạng thái: Bài Nháp → Đã xuất bản; bước học và bộ bài tập Nháp → Đã xuất bản, Đã xuất bản → Lưu trữ, Lưu trữ → Đã xuất bản (REQ-18), trong đó mục được lưu từ nội dung AI đã duyệt bắt đầu ngay ở Đã xuất bản (AC-11.5); không cung cấp thao tác đưa Bài hoặc mục về Nháp, và chỉ hiển thị trên mỗi Bài và mục các thao tác hợp lệ với trạng thái hiện tại.

### REQ-10: Nội dung học viên được thấy

<!-- Story: US-4, US-5, US-6 · Priority: P1 · Screen: S02, S11, S03–S06 (003–005), A05, T06, T18 -->

- AC-10.1: THE SYSTEM SHALL chỉ đưa vào nội dung HV được thấy những Bài Đã xuất bản của giáo trình mà lớp HV đang học sử dụng và, trong mỗi Bài đó, chỉ những mục Đã xuất bản (không gồm mục Nháp và mục Lưu trữ); các điều kiện theo lớp (ngày bắt đầu A9 và phần bị ẩn ở lớp D5 — 003) được áp dụng thêm.
- AC-10.2: THE SYSTEM SHALL trình bày cho HV các Bài theo đúng thứ tự GV sắp xếp trên T06 và, trong mỗi Bài, phần Bài học trước phần Bài tập với các mục theo đúng thứ tự của từng phần.
- AC-10.3: THE SYSTEM SHALL không hiển thị cho HV một phần không có mục nào HV được thấy, và không hiển thị một Bài không có mục nào HV được thấy.
- AC-10.4: THE SYSTEM SHALL không bao giờ đưa nội dung AI chưa được GV duyệt (đang tạo, đang chờ review hoặc đã bị bỏ theo 010) vào nội dung HV được thấy hay vào T21.
- AC-10.5: IF HV mở bằng đường dẫn trực tiếp một Bài hoặc mục mà HV không được thấy theo AC-10.1 (Nháp, Lưu trữ, thuộc Bài Nháp, đã bị xóa, hoặc không thuộc giáo trình của lớp nào HV đang học) THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." mà không tiết lộ thông tin nào của nội dung đó.
- AC-10.6: WHEN GV lưu thay đổi về tên, thứ tự, trạng thái hoặc nội dung của Bài hay mục trong giáo trình đang được lớp sử dụng THE SYSTEM SHALL áp dụng thay đổi cho HV của mọi lớp dùng giáo trình ở lần HV mở hoặc tải lại trang kế tiếp, không cần GV thao tác thêm ở từng lớp.
- AC-10.7: WHILE một Bài Đã xuất bản nhưng không có mục Đã xuất bản nào THE SYSTEM SHALL hiển thị trên T06 và T18 cảnh báo "Bài đã xuất bản nhưng chưa có nội dung hiển thị cho học viên".

### REQ-11: Panel "Tạo bằng AI" và nội dung AI đã duyệt

<!-- Story: US-5 · Priority: P1 · Screen: T18, T06, T20 · Panel phải của T18 và T20 thuộc 010; 002 sở hữu khung T18 và quy tắc lưu/thay thế/hiển thị nội dung đã duyệt (chi tiết thay thế: REQ-19). -->

- AC-11.1: THE SYSTEM SHALL hiển thị panel "Tạo bằng AI" trên T18 của mọi Bài, dù Bài ở trạng thái Nháp hay Đã xuất bản và dù Bài đã có mục hay chưa, với nội dung và hành vi của panel (tải tài liệu, "Mô tả ngắn", nút "Tạo bằng AI", tiến trình và mở review) theo 010.
- AC-11.2: WHILE nội dung AI của một Bài đang được tạo hoặc đang chờ GV review THE SYSTEM SHALL không thêm, sửa hay xóa mục nào trong phần Bài học hoặc Bài tập của Bài đó và vẫn cho GV dùng mọi thao tác của panel Thủ công, của T07 (cả hai tab) và của Bài (soạn, sắp xếp, xuất bản, lưu trữ, nhân bản, đổi tên, xóa).
- AC-11.3: WHILE một Bài có nội dung AI đang được tạo hoặc đang chờ GV review THE SYSTEM SHALL hiển thị trên Bài ở T06 và ở phần đầu T18 nhãn AI do 010 cung cấp (ví dụ "AI · Đang tạo 45%" hoặc "AI · Chờ duyệt") và gỡ nhãn khi Bài không còn nội dung AI đang tạo hay chờ review.
- AC-11.4: WHEN GV bấm nhãn AI của một Bài trên T06 hoặc T18 THE SYSTEM SHALL mở T20 của Bài khi nội dung AI đang chờ review, hoặc T18 của Bài với panel "Tạo bằng AI" khi nội dung đang được tạo.
- AC-11.5: WHEN GV xác nhận duyệt một phần do AI tạo theo 010 THE SYSTEM SHALL thay toàn bộ nội dung hiện có của phần tương ứng trong Bài bằng các mục đã duyệt theo thứ tự đã duyệt, trong cùng một thao tác (không thay đổi gì trong phần nếu thao tác không thành công), mỗi mục mới ở trạng thái Đã xuất bản và mang dấu "AI tạo", còn các mục cũ được xử lý theo REQ-19.
- AC-11.6: IF số mục được duyệt của một phần nhiều hơn 30 THEN THE SYSTEM SHALL không thay đổi gì trong phần, giữ nguyên nội dung đang review và hiển thị "Mỗi bài có tối đa 30 {bước học | bộ bài tập}. Hãy xóa bớt mục trong review rồi duyệt lại." — giới hạn này chỉ tính các mục mới, không tính bộ bài tập cũ được lưu trữ theo AC-19.3.
- AC-11.7: THE SYSTEM SHALL áp dụng cho mục mang dấu "AI tạo" đúng các quy tắc sửa, sắp xếp, xuất bản, lưu trữ, xóa và nhân bản của mục thêm thủ công, và chỉ hiển thị dấu "AI tạo" cho GV, không bao giờ cho HV.

### REQ-12: Xóa mục và xóa Bài

<!-- Story: US-6 · Priority: P1 · Screen: T06, T18 -->

- AC-12.1: WHEN GV bấm "Xóa" trên một mục chưa có dữ liệu học tập của HV trong tab Bài học hoặc tab Bài tập của T07 THE SYSTEM SHALL hiển thị hộp xác nhận có tiêu đề Xóa “{tên mục}”? kèm "Thao tác có hiệu lực ngay và không hoàn tác được." và nút "Xóa", và chỉ xóa khi GV bấm "Xóa".
- AC-12.2: WHEN GV xác nhận xóa mục THE SYSTEM SHALL xóa mục cùng toàn bộ nội dung và mọi thay đổi chưa lưu của mục, đánh số lại các mục còn lại của phần và hiển thị "Đã xóa · Đã lưu".
- AC-12.3: IF GV bấm "Xóa" trên một bộ bài tập đã có dữ liệu học tập của HV THEN THE SYSTEM SHALL không xóa và không mở hộp xác nhận, giữ nguyên bộ bài tập và hiển thị "Bộ bài tập đã có dữ liệu học tập nên không xóa được — hãy Lưu trữ." (lưu trữ theo REQ-18).
- AC-12.4: WHEN GV chọn "Xóa bài" cho một Bài không có mục nào có dữ liệu học tập THE SYSTEM SHALL hiển thị hộp xác nhận nêu tên Bài và số bước học, bộ bài tập sẽ bị xóa (kèm cảnh báo "Bài đang hiển thị với học viên của N lớp." khi Bài Đã xuất bản và giáo trình đang được sử dụng) và, khi GV xác nhận, xóa Bài cùng mọi mục, đánh số lại danh sách Bài và đưa GV về T06 với thông báo "Đã xóa bài".
- AC-12.5: IF Bài có ít nhất một mục có dữ liệu học tập của HV THEN THE SYSTEM SHALL không xóa Bài và hiển thị "Không thể xóa bài vì học viên đã có dữ liệu học tập. Bạn có thể lưu trữ từng bước học, bộ bài tập, hoặc ẩn từng phần của bài ở từng lớp (Chi tiết lớp → Nội dung)."
- AC-12.6: IF dữ liệu học tập đầu tiên với mục hoặc Bài phát sinh sau khi hộp xác nhận xóa đã mở THEN THE SYSTEM SHALL không xóa khi GV xác nhận và hiển thị thông báo tương ứng của AC-12.3 hoặc AC-12.5.
- AC-12.7: WHEN GV chọn "Xóa bài" cho một Bài có nội dung AI đang được tạo hoặc đang chờ review và không có dữ liệu học tập THE SYSTEM SHALL bổ sung vào hộp xác nhận của AC-12.4 cảnh báo "Bài có nội dung AI đang tạo hoặc chờ duyệt. Xóa bài sẽ hủy nội dung này." và, khi GV xác nhận, xóa Bài và hủy nội dung AI chưa duyệt của Bài theo 010.

### REQ-13: Xóa và lưu trữ giáo trình

<!-- Story: US-6, US-9 · Priority: P1 (xóa), P2 (lưu trữ) · Screen: T05, T06 -->

- AC-13.1: WHEN GV chọn "Xóa giáo trình" cho giáo trình không được lớp nào sử dụng và không có mục nào có dữ liệu học tập THE SYSTEM SHALL hiển thị hộp xác nhận "Xóa giáo trình {tên}?" kèm "Sẽ xóa {N} bài cùng mọi mục. Thao tác không thể hoàn tác." và nút "Xóa giáo trình", và chỉ khi GV bấm "Xóa giáo trình" mới xóa vĩnh viễn giáo trình cùng mọi Bài, mục và nội dung AI chưa duyệt của nó, rồi đưa GV về T05 với thông báo "Đã xóa giáo trình".
- AC-13.2: IF giáo trình đang được ít nhất một lớp sử dụng (ở bất kỳ trạng thái nào) THEN THE SYSTEM SHALL không xóa, hiển thị "Không thể xóa: giáo trình đang được dùng bởi N lớp." kèm tên các lớp và gợi ý "Lưu trữ" thay thế.
- AC-13.3: IF giáo trình không được lớp nào sử dụng nhưng có ít nhất một mục có dữ liệu học tập của HV THEN THE SYSTEM SHALL không xóa và hiển thị "Không thể xóa: học viên đã có dữ liệu học tập trong giáo trình này. Bạn có thể lưu trữ giáo trình."
- AC-13.4: IF giáo trình được gán cho một lớp hoặc phát sinh dữ liệu học tập sau khi hộp xác nhận xóa đã mở THEN THE SYSTEM SHALL không xóa khi GV xác nhận và hiển thị thông báo tương ứng của AC-13.2 hoặc AC-13.3.
- AC-13.5: WHEN GV chọn "Lưu trữ" cho một giáo trình Hoạt động THE SYSTEM SHALL chuyển giáo trình sang Đã lưu trữ, ẩn nó khỏi danh sách mặc định của T05 và khỏi danh sách giáo trình có thể chọn cho lớp, trong khi các lớp đang dùng vẫn hiển thị nội dung cho HV như trước và GV vẫn mở, sửa được giáo trình.
- AC-13.6: WHEN GV bật bộ lọc "Đã lưu trữ" trên T05 và chọn "Khôi phục" cho một giáo trình THE SYSTEM SHALL chuyển giáo trình về Hoạt động, hiển thị lại trong danh sách mặc định và cho phép chọn lại cho lớp.

### REQ-14: Nhân bản Bài

<!-- Story: US-7 · Priority: P2 · Screen: T06, T18 -->

- AC-14.1: WHEN GV chọn "Nhân bản bài" trên T06 hoặc T18 THE SYSTEM SHALL tạo trong cùng giáo trình một Bài mới đặt ngay sau Bài gốc, có tên là tên gốc kèm hậu tố " (bản sao)" (rút gọn phần tên gốc để tổng không quá 100 ký tự), gồm bản sao đầy đủ nội dung của mọi bước học và bộ bài tập không ở trạng thái Lưu trữ, với cùng thứ tự trong từng phần và liên kết luyện tập của bộ bài tập (005, nếu có) trỏ sang bước học bản sao, rồi mở T18 của bản sao với thông báo "Đã nhân bản bài".
- AC-14.2: THE SYSTEM SHALL đặt Bài bản sao và mọi mục của nó ở trạng thái Nháp, đồng thời giữ nguyên dấu "AI tạo" của từng mục như ở Bài gốc.
- AC-14.3: THE SYSTEM SHALL không mang sang Bài bản sao bất kỳ dữ liệu học tập, lượt làm, kết quả, điểm, thiết lập theo lớp (phần bị ẩn) hay nội dung AI đang tạo hoặc đang chờ review nào của Bài gốc.
- AC-14.4: WHEN GV sửa, sắp xếp, xuất bản hoặc xóa nội dung ở Bài bản sao hoặc ở Bài gốc THE SYSTEM SHALL không làm thay đổi Bài còn lại.
- AC-14.5: IF việc nhân bản Bài không hoàn tất THEN THE SYSTEM SHALL không để lại Bài bản sao nào, kể cả bản sao dở dang, và hiển thị "Nhân bản không thành công. Vui lòng thử lại."

### REQ-15: Nhân bản giáo trình

<!-- Story: US-7 · Priority: P2 · Screen: T05, T06 -->

- AC-15.1: WHEN GV chọn "Nhân bản" cho một giáo trình THE SYSTEM SHALL hiển thị hộp thoại với Tên điền sẵn bằng tên gốc kèm hậu tố " (bản sao)" (hoặc " (bản sao 2)", " (bản sao 3)"… nếu tên đó đã tồn tại, rút gọn phần tên gốc để tổng không quá 100 ký tự) và Cấp độ HSK điền sẵn cấp độ của giáo trình gốc, cả hai GV đều sửa được và tuân theo quy tắc kiểm tra của AC-1.3, AC-1.4 và AC-1.5.
- AC-15.2: WHEN GV xác nhận nhân bản với Tên và Cấp độ HSK hợp lệ THE SYSTEM SHALL tạo giáo trình mới ở tình trạng Hoạt động gồm mô tả, ảnh bìa và bản sao đầy đủ mọi Bài theo cùng thứ tự, mỗi Bài với các bước học và bộ bài tập được sao chép theo cùng phạm vi và thứ tự như AC-14.1 kèm dấu "AI tạo", giữ nguyên trạng thái của từng Bài và mục như ở giáo trình gốc, rồi mở T06 của bản sao với thông báo "Đã nhân bản giáo trình".
- AC-15.3: THE SYSTEM SHALL tạo bản sao ở tình trạng chưa được lớp nào sử dụng và không mang theo bất kỳ dữ liệu học tập, điểm, thiết lập theo lớp hay nội dung AI chưa duyệt nào.
- AC-15.4: WHEN GV sửa, sắp xếp, xuất bản hoặc xóa nội dung ở bản sao hoặc ở giáo trình gốc THE SYSTEM SHALL không làm thay đổi giáo trình còn lại.
- AC-15.5: IF việc nhân bản giáo trình không hoàn tất THEN THE SYSTEM SHALL không để lại giáo trình bản sao nào, kể cả bản sao dở dang, và hiển thị "Nhân bản không thành công. Vui lòng thử lại."
- AC-15.6: WHILE việc nhân bản một giáo trình hoặc một Bài đang thực hiện THE SYSTEM SHALL hiển thị "Đang nhân bản…" và không nhận thêm yêu cầu nhân bản cùng giáo trình hoặc Bài gốc từ GV.

### REQ-16: Xem trước như học viên

<!-- Story: US-8 · Priority: P2 · Screen: T06, T21 (V10-2: T21 chỉ mở từ T06) -->

- AC-16.1: WHEN GV chọn thao tác "Xem như học viên" của một Bài trên T06 THE SYSTEM SHALL mở T21 "Xem như học viên" gồm tên Bài, trạng thái Bài, tên giáo trình, nút "Thoát xem trước", hai tab "Bài học" | "Bài tập" (mỗi tab kèm số mục đang hiển thị, tab "Bài học" được chọn khi mở) và thanh công cụ có ghi chú "Không ghi nhận lượt làm, bài nộp hay điểm", trong đó tab đang chọn hiển thị các bước học hoặc bộ bài tập Đã xuất bản của phần theo thứ tự của phần ở chế độ hiển thị của AC-16.8, hoặc "Bài chưa có bước học nào đã xuất bản." / "Bài chưa có bộ bài tập nào đã xuất bản." khi phần không có mục nào được hiển thị, kèm thông báo "Bài đang ở trạng thái Nháp — học viên chưa thấy bài này cho tới khi bài được xuất bản." khi Bài còn Nháp.
- AC-16.2: WHEN GV bật công tắc "Gồm cả mục Nháp" trên T21 THE SYSTEM SHALL hiển thị thêm mọi bước học và bộ bài tập Nháp của Bài ở đúng vị trí trong phần, mỗi mục kèm nhãn "Nháp", và khi GV tắt công tắc thì chỉ còn các mục Đã xuất bản; công tắc tắt mỗi lần T21 được mở.
- AC-16.3: WHILE GV xem một tab của T21 THE SYSTEM SHALL hiển thị đầy đủ ngay trong tab nội dung của từng mục được hiển thị như HV sẽ thấy khi mở mục — bước học như S03 theo quy tắc hiển thị của 004 (004 AC-7.6), bộ bài tập như S05 với mọi câu hỏi, GV chọn thử đáp án được theo 005 — mà không cần mở từng mục.
- AC-16.4: WHILE GV ở chế độ xem trước THE SYSTEM SHALL không ghi nhận bất kỳ lượt làm, bài nộp hay điểm xếp hạng nào và không hiển thị đáp án mà HV không được thấy.
- AC-16.5: WHILE GV ở chế độ xem trước THE SYSTEM SHALL cho GV chọn thử đáp án của các câu hỏi nhưng không hiển thị nút nộp bài, không chấm câu trả lời thử và bỏ chúng khi GV rời màn hình.
- AC-16.6: WHEN GV bấm "Thoát xem trước" THE SYSTEM SHALL đưa GV về T06 tại đúng vị trí của Bài vừa xem trước.
- AC-16.7: WHILE GV ở T21 THE SYSTEM SHALL hiển thị công tắc "Web / Mobile", trong đó "Web" trình bày nội dung theo bố cục của HV ở độ rộng màn hình máy tính và "Mobile" trình bày cùng nội dung trong khung mô phỏng điện thoại rộng 375 px đúng như HV thấy trên điện thoại.
- AC-16.8: WHEN GV mở T21 THE SYSTEM SHALL dùng lựa chọn "Web" hoặc "Mobile" gần nhất của GV trong phiên đăng nhập hiện tại — một lựa chọn dùng chung với chế độ "Xem trước" của T20 — hoặc "Web" khi GV chưa chọn lần nào trong phiên đó.
- AC-16.9: WHEN GV chuyển giữa "Web" và "Mobile" trên T21 THE SYSTEM SHALL giữ nguyên tab đang chọn, các lựa chọn đáp án đang thử và trạng thái công tắc "Gồm cả mục Nháp", và không ghi nhận lượt làm, bài nộp hay điểm nào.
- AC-16.10: THE SYSTEM SHALL chỉ cung cấp lối vào T21 qua thao tác "Xem như học viên" của từng Bài trên T06, và không hiển thị nút "Xem như học viên" trên T18 hay T07 (kể cả tab Bài học và tab Bài tập).

### REQ-17: Quyền truy cập, cô lập workspace và thao tác đồng thời

<!-- Story: US-1 … US-9 · Priority: P1 -->

- AC-17.1: THE SYSTEM SHALL chỉ cho GV chủ workspace xem, tạo, sửa, đổi tên, sắp xếp, xuất bản, nhân bản, lưu trữ, khôi phục, xóa và xem trước giáo trình, Bài và mục của workspace đó.
- AC-17.2: IF một GV mở hoặc thao tác trên giáo trình, Bài hoặc mục thuộc workspace khác (ví dụ qua đường dẫn trực tiếp) THEN THE SYSTEM SHALL không thực hiện thao tác và hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." giống hệt trường hợp nội dung không tồn tại, không tiết lộ tên hay bất kỳ thông tin nào.
- AC-17.3: IF HV mở T05, T06, T18, T07 hoặc T21 THEN THE SYSTEM SHALL không hiển thị nội dung quản trị và đưa HV về S01.
- AC-17.4: IF thao tác của GV dựa trên dữ liệu đã bị thay đổi hoặc xóa ở tab hay thiết bị khác (thông tin giáo trình, tên Bài, thứ tự Bài hoặc thứ tự mục trong phần, trạng thái, sự tồn tại của Bài hay mục) THEN THE SYSTEM SHALL không áp dụng thao tác, hiển thị dữ liệu mới nhất, giữ nguyên nội dung GV đang nhập (nếu có) và thông báo "Dữ liệu đã thay đổi ở nơi khác. Vui lòng kiểm tra lại."
- AC-17.5: WHEN GV gửi cùng một yêu cầu tạo giáo trình, thêm Bài, xuất bản hoặc nhân bản nhiều lần liên tiếp THE SYSTEM SHALL vô hiệu nút gửi trong lúc xử lý và chỉ thực hiện thao tác đúng một lần.

### REQ-18: Lưu trữ bước học và bộ bài tập

<!-- Story: US-6 · Priority: P1 · Screen: T07 (tab Bài học, tab Bài tập T09), T18 · Quy tắc chung do 002 sở hữu; 004 (bước học) và 005 (bộ bài tập) áp dụng. -->

- AC-18.1: WHEN GV bấm "Lưu trữ" trên một bước học hoặc bộ bài tập Đã xuất bản không có thay đổi chưa lưu trong tab Bài học hoặc tab Bài tập của T07 THE SYSTEM SHALL chuyển mục sang Lưu trữ ngay mà không hỏi xác nhận, giữ mục ở vị trí cũ trong phần và hiển thị "Đã lưu trữ · Đã lưu".
- AC-18.2: WHILE một mục ở trạng thái Lưu trữ THE SYSTEM SHALL không hiển thị mục cho HV ở bất kỳ lớp nào và giữ nguyên mọi dữ liệu học tập của HV với mục.
- AC-18.3: WHILE một mục ở trạng thái Lưu trữ THE SYSTEM SHALL giữ vị trí của mục trong phần, tính mục vào tóm tắt của phần trên T18, hiển thị mục cho GV trong tab tương ứng của T07 với nhãn "Lưu trữ" chỉ khi GV bật công tắc "Hiện mục lưu trữ" của tab đó (công tắc kèm số mục Lưu trữ, chỉ có khi phần có mục Lưu trữ, mặc định tắt), và vẫn cho GV sửa và lưu nội dung mục bằng "Lưu thay đổi" mà không đổi trạng thái Lưu trữ.
- AC-18.4: WHEN GV bấm "Khôi phục" trên một mục Lưu trữ trong T07 THE SYSTEM SHALL chuyển mục về Đã xuất bản ngay ở đúng vị trí trong phần mà không hỏi xác nhận, hiển thị "Đã khôi phục · Đã lưu" và hiển thị lại mục cho HV đủ điều kiện cùng dữ liệu học tập trước đó.
- AC-18.5: WHILE một mục Đã xuất bản trong T07 có thay đổi chưa lưu THE SYSTEM SHALL vô hiệu nút "Lưu trữ" của mục đó kèm chú thích "Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ" cho tới khi thay đổi được lưu hoặc bỏ.

### REQ-19: Duyệt nội dung AI thay thế nội dung của phần

<!-- Story: US-5, US-6 · Priority: P1 · Screen: T20 (hộp xác nhận duyệt, thuộc 010), T18 · 002 sở hữu quy tắc thay thế và nội dung danh sách; 010 sở hữu nút "Duyệt" và cách trình bày hộp xác nhận. -->

- AC-19.1: WHEN GV bấm "Duyệt" cho một phần do AI tạo THE SYSTEM SHALL hiển thị trong hộp xác nhận duyệt số mục mới sẽ được xuất bản và, khi phần tương ứng của Bài đang có mục, danh sách theo tên của các mục sẽ bị xóa vĩnh viễn và các bộ bài tập sẽ chuyển sang Lưu trữ vì đã có dữ liệu học tập (kèm ghi chú "Bài làm và điểm của học viên được giữ lại."), bổ sung cảnh báo "Nội dung mới sẽ hiển thị ngay với học viên của N lớp (trừ các phần đang ẩn ở từng lớp)." khi Bài Đã xuất bản và giáo trình đang được sử dụng, và chỉ thay thế khi GV xác nhận.
- AC-19.2: WHEN GV xác nhận duyệt một phần THE SYSTEM SHALL xóa vĩnh viễn, cùng toàn bộ nội dung, mọi mục cũ của phần chưa có dữ liệu học tập — mọi bước học và mọi bộ bài tập chưa có lượt làm hay bài nộp, ở bất kỳ trạng thái nào (Nháp, Đã xuất bản, Lưu trữ).
- AC-19.3: WHEN GV xác nhận duyệt phần Bài tập mà phần đang có bộ bài tập đã có dữ liệu học tập THE SYSTEM SHALL chuyển các bộ đó sang Lưu trữ (bộ đã ở Lưu trữ giữ nguyên), giữ nguyên mọi lượt làm, bài nộp và điểm xếp hạng của HV với chúng, và đặt chúng sau các mục mới theo thứ tự tương đối trước đó.
- AC-19.4: IF một mục trong phần được duyệt chưa đạt điều kiện xuất bản của module soạn thảo (bước học theo 004, bộ bài tập theo 005) THEN THE SYSTEM SHALL không thay đổi gì trong phần, giữ nguyên nội dung đang review và hiển thị "Không thể duyệt:" kèm tên mục và lý do do module soạn thảo cung cấp.
- AC-19.5: IF sau khi hộp xác nhận duyệt đã mở, nội dung của phần trong Bài thay đổi (mục được thêm, xóa, xuất bản, lưu trữ hay khôi phục) hoặc một bộ bài tập cũ phát sinh dữ liệu học tập đầu tiên THEN THE SYSTEM SHALL không thay thế khi GV xác nhận, giữ nguyên nội dung đang review và hiển thị lại hộp xác nhận với danh sách mới kèm thông báo "Nội dung của phần đã thay đổi. Vui lòng kiểm tra lại."
- AC-19.6: WHEN việc thay thế nội dung của một phần hoàn tất THE SYSTEM SHALL giữ nguyên trạng thái của Bài và thiết lập ẩn phần theo lớp (003), sao cho HV chỉ thấy các mục mới khi Bài Đã xuất bản và phần không bị ẩn ở lớp của HV, ở lần mở hoặc tải lại trang kế tiếp.

## 6. Non-Functional Requirements

- NFR-1: Performance: T05 hiển thị trang đầu danh sách (20 giáo trình) trong ≤ 2 s ở p95 với workspace có 300 giáo trình, đo trên máy tính với kết nối 10 Mbps.
- NFR-2: Performance: T06 hiển thị giáo trình có 100 Bài và T18 hiển thị panel Thủ công của Bài có 30 bước học và 30 bộ bài tập, mỗi màn hình trong ≤ 2 s ở p95; thao tác sắp xếp (kể cả "Lên" / "Xuống" trong T07), đổi tên, xuất bản hoặc lưu trữ được xác nhận đã lưu trong ≤ 1 s ở p95; chuyển "Web / Mobile" trên T21 hiển thị xong trong ≤ 1 s ở p95; duyệt nội dung AI thay thế một phần (tới 30 mục mới và 30 mục cũ) được xác nhận đã lưu trong ≤ 3 s ở p95.
- NFR-3: Performance: Nhân bản một Bài có tới 60 mục hoàn tất trong ≤ 10 s ở p95; nhân bản giáo trình có 20 Bài (khoảng 400 mục) hoàn tất trong ≤ 30 s ở p95; giáo trình lớn nhất cho phép (100 Bài) hoàn tất trong ≤ 180 s.
- NFR-4: Freshness: Thay đổi đã lưu về thông tin giáo trình (tên, cấp độ HSK, mô tả, ảnh bìa) và về tên, thứ tự, trạng thái hoặc nội dung của Bài và mục (kể cả nội dung AI vừa duyệt thay thế phần) hiển thị với HV ở lần mở hoặc tải lại trang kế tiếp, chậm nhất 5 s sau khi GV nhận xác nhận đã lưu.
- NFR-5: Accessibility: T05, T06, T18 (khung màn hình và panel Thủ công), khung T07 (phần đầu và tab) và T21 đạt WCAG 2.1 mức AA; 100% thao tác của module (kể cả sắp xếp Bài, nút "Soạn thủ công", chuyển tab Bài học / Bài tập của T07, "Lên" / "Xuống" của mục, thao tác "Xem như học viên" của từng Bài trên T06, công tắc "Gồm cả mục Nháp" và "Web / Mobile" của T21) thực hiện được chỉ bằng bàn phím.
- NFR-6: Security: 100% thao tác của REQ-17 và AC-10.5 được kiểm thử tự động với tài khoản GV của workspace khác và tài khoản HV, với 0 trường hợp xem hoặc thay đổi được dữ liệu ngoài phạm vi.
- NFR-7: Observability: 100% thao tác thay đổi (tạo, sửa, đổi tên, sắp xếp, xuất bản, xóa, nhân bản, lưu trữ, khôi phục, duyệt nội dung AI thay thế phần) được ghi nhật ký có cấu trúc gồm người thực hiện, đối tượng, kết quả và thời điểm — với thao tác thay thế phần, kèm số mục mới, số mục bị xóa và số bộ bài tập được lưu trữ; 0 bản ghi nhật ký chứa nội dung bài học hoặc thông tin cá nhân của HV.
- NFR-8: Internationalization: 100% tên giáo trình, tên Bài và mô tả trong bộ kiểm thử chứa chữ Hán giản thể, pinyin có dấu thanh (ví dụ "nǐ hǎo") và tiếng Việt có dấu được lưu và hiển thị đúng nguyên văn trên T05, T06, T18 và T21.

## 7. Key Entities

- **Giáo trình (Curriculum)** — khóa học có tên, thuộc workspace của đúng một GV. Thuộc tính nghiệp vụ: tên (duy nhất trong workspace), cấp độ HSK (đúng một giá trị HSK1…HSK9), mô tả, ảnh bìa (tùy chọn), tình trạng (Hoạt động / Đã lưu trữ), thời điểm tạo và cập nhật gần nhất. Chứa danh sách có thứ tự gồm 0–100 Bài. Được 0..n Lớp tham chiếu (A2).
- **Bài (Lesson unit)** — một đơn vị bài của giáo trình (ví dụ "Bài 1 – 你好"). Thuộc tính: vị trí trong giáo trình, tên (1–100 ký tự, không bắt buộc duy nhất), trạng thái (Nháp / Đã xuất bản), thời điểm cập nhật gần nhất. Luôn có đúng 2 Phần. Nhãn AI của Bài (do 010 cung cấp khi có nội dung AI đang tạo hoặc chờ review) và "Có dữ liệu học viên" được suy ra.
- **Phần (Section)** — Bài học / Bài tập; cố định, tự có khi tạo Bài, không đổi tên, không thêm/bớt. Khi thêm thủ công, phần Bài học có tối đa 30 Bước học và phần Bài tập tối đa 30 Bộ bài tập không ở trạng thái Lưu trữ (mục Lưu trữ không tính — AC-7.9); sau khi duyệt nội dung AI thay thế phần, phần có tối đa 30 mục mới cộng các bộ bài tập Lưu trữ có dữ liệu học tập (REQ-19). Mỗi phần có thứ tự riêng. Trên T18 phần chỉ hiện dạng tóm tắt; nội dung và thứ tự được soạn trong tab Bài học hoặc tab Bài tập (T09) của T07 "Soạn bài thủ công" (V10-1).
- **Lựa chọn xem trước (Preview viewport choice)** — "Web" hoặc "Mobile" (khung 375 px); theo GV, chỉ trong một phiên đăng nhập; dùng chung cho chế độ xem trước của T20 và cho T21; mặc định "Web" (V6-2, V6-3, V10-2). T07 (cả hai tab) không có lựa chọn này — luôn bố cục web (V10-1).
- **Mục (Item)** — một Bước học (004) hoặc Bộ bài tập (005) đặt trong một Phần của một Bài. Thuộc tính do module này quản lý: vị trí trong phần, trạng thái (Nháp / Đã xuất bản / Lưu trữ; mục soạn tay được tạo và lưu ngay ở Nháp khi GV bấm thêm trong T07, mục từ nội dung AI đã duyệt bắt đầu ở Đã xuất bản), thời điểm cập nhật, dấu "AI tạo" (chỉ GV thấy). Nội dung (khối, thẻ từ vựng, câu hỏi, đáp án) và liên kết luyện tập của bộ bài tập do 004/005 quản lý.
- **Nội dung AI chưa duyệt (Pending AI content)** — kết quả AI đang tạo hoặc đang chờ GV review, do 010 quản lý; không thuộc Bài và không phải Mục cho tới khi GV duyệt. Module này chỉ dùng nó để hiển thị nhãn AI của Bài và hủy nó khi Bài hoặc giáo trình bị xóa.
- **Dữ liệu học tập (Learning data)** — lượt làm (kể cả đang làm dở) và bài nộp của HV với một bộ bài tập, do 005 ghi nhận. Bước học không có dữ liệu học tập (V3-1). Module này chỉ dùng để quyết định mục, Bài hoặc giáo trình có được xóa hay không, và khi duyệt nội dung AI thay thế phần thì mục cũ bị xóa hay được lưu trữ (REQ-19).
- **Lớp sử dụng (Using class)** — một Lớp (003) đang tham chiếu giáo trình, ở bất kỳ trạng thái nào (Sắp bắt đầu, Đang học, Đã kết thúc). "Giáo trình đang được sử dụng" nghĩa là có ít nhất một lớp sử dụng.
- **Bản sao (Copy)** — Bài hoặc giáo trình mới tạo bằng thao tác Nhân bản; sau khi tạo hoàn toàn độc lập với bản gốc.

## 8. Edge Cases & Error Handling

- GV bấm "Tạo giáo trình", "Thêm bài", "Xuất bản" hoặc "Nhân bản" nhiều lần liên tiếp: chỉ một thao tác được thực hiện (AC-17.5, AC-15.6).
- Tên có khoảng trắng thừa: bỏ khoảng trắng đầu/cuối và gộp khoảng trắng liên tiếp trước khi lưu và so trùng (AC-1.3, AC-1.4, AC-5.3).
- Hai Bài cùng tên trong một giáo trình: hợp lệ; số thứ tự phân biệt chúng (AC-5.3).
- Đổi thứ tự Bài không đổi tên Bài: Bài tên "Bài 1 – 你好" kéo xuống vị trí 3 vẫn giữ tên; GV tự đổi tên nếu muốn (AC-5.4, AC-6.1).
- Hai GV khác nhau đặt cùng tên giáo trình: hợp lệ — tính duy nhất chỉ xét trong một workspace (AC-1.4).
- Tìm kiếm bằng chữ Hán: khớp chứa nguyên văn; tìm "ni hao" khớp tên chứa "nǐ hǎo" (AC-3.3).
- Giáo trình đạt 100 Bài trong lúc GV thêm hoặc nhân bản Bài ở tab khác: yêu cầu tạo Bài bị từ chối (AC-5.5).
- Phần đạt 30 mục không Lưu trữ trong lúc GV mở T07 ở tab trình duyệt khác: bấm thêm mục ở tab đó không tạo mục nào và hiển thị thông báo giới hạn (AC-7.9).
- Phần có 30 bộ bài tập, trong đó 2 bộ Lưu trữ: nút "Thêm bộ bài tập" vẫn tạo được bộ mới vì chỉ 28 bộ được tính (AC-7.9).
- GV khôi phục một mục Lưu trữ khi phần đã có 30 mục không Lưu trữ: được phép, phần có 31 mục được tính; mọi lần bấm thêm mục bị từ chối theo AC-7.9 cho tới khi phần còn dưới 30 mục được tính (AC-18.4, AC-7.9).
- GV bấm "Thêm bước học" rồi rời T07 ngay mà không sửa gì: bước học trống vẫn ở trong phần với trạng thái Nháp, không có cảnh báo rời trang vì không có thay đổi chưa lưu; bước trống không xuất bản được cho tới khi có nội dung (AC-7.6, AC-7.13, AC-9.2).
- GV sửa một bộ bài tập Đã xuất bản rồi muốn lưu trữ nó: "Lưu trữ" bị vô hiệu kèm "Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ" cho tới khi GV lưu hoặc bỏ thay đổi (AC-18.5).
- GV sửa và lưu nội dung một mục Lưu trữ trong T07: được phép; mục vẫn Lưu trữ, HV vẫn không thấy cho tới khi khôi phục (AC-18.3, AC-18.2).
- GV duyệt phần Bài tập do AI tạo gồm 8 bộ khi phần đã có 25 bộ, trong đó 3 bộ có bài nộp: 22 bộ bị xóa, 3 bộ chuyển sang Lưu trữ và nằm sau 8 bộ mới Đã xuất bản; điểm xếp hạng của HV với 3 bộ đó giữ nguyên (AC-11.5, AC-19.2, AC-19.3).
- GV duyệt một phần do AI tạo gồm 32 mục: không có gì thay đổi; review giữ nguyên để GV bỏ bớt 2 mục (AC-11.6).
- Sau khi thay thế, phần có 8 bộ mới và 25 bộ Lưu trữ (tổng 33): GV vẫn thêm được bộ bài tập trong tab Bài tập (T09) vì chỉ 8 bộ không Lưu trữ được tính vào giới hạn 30; GV vẫn có thể duyệt nội dung AI lần sau (AC-7.9, AC-11.6).
- Duyệt khi phần trong Bài đang trống: hộp xác nhận chỉ nêu số mục mới; không có mục nào bị xóa hay lưu trữ (AC-19.1).
- Duyệt phần Bài học: mọi bước học cũ bị xóa vì bước học không có dữ liệu học tập; liên kết luyện tập của bộ bài tập trỏ tới bước học bị xóa được xử lý theo quy tắc của 005 khi bước học bị xóa (AC-19.2).
- Bộ bài tập cũ đã ở Lưu trữ và có dữ liệu học tập: vẫn Lưu trữ, được đặt sau các mục mới; bộ Lưu trữ chưa có dữ liệu học tập bị xóa (AC-19.2, AC-19.3).
- Duyệt phần của Bài còn Nháp: các mục mới Đã xuất bản nhưng HV chưa thấy cho tới khi Bài được xuất bản (AC-19.6, AC-10.1).
- HV bắt đầu lượt làm đầu tiên với một bộ bài tập cũ đúng lúc GV đang xác nhận duyệt: không thay thế; hộp xác nhận hiện lại với bộ đó trong danh sách lưu trữ (AC-19.5).
- HV đang làm dở một bộ bài tập bị chuyển sang Lưu trữ do thay thế: xử lý như lưu trữ thông thường; lượt làm được giữ (AC-19.3, AC-18.2; 005).
- GV đang sửa một mục cũ ở T07 trong một tab trình duyệt khác khi phần bị thay thế: lần lưu kế tiếp bị từ chối vì mục đã bị xóa hoặc đã đổi trạng thái sang Lưu trữ (AC-17.4); sau khi tải lại, mục Lưu trữ vẫn sửa được (AC-18.3).
- Một mục trong phần được duyệt chưa đạt điều kiện xuất bản của 004/005: không có gì thay đổi, review giữ nguyên kèm lý do (AC-19.4).
- Đổi cấp độ HSK của giáo trình đang được 3 lớp dùng: hộp xác nhận nêu 3 lớp; sau khi xác nhận, cả 3 lớp và T05/T06 hiển thị cấp độ mới; Bài, mục và dữ liệu học tập không đổi (AC-2.3, AC-2.4).
- Yêu cầu di chuyển (ví dụ từ một tab cũ) đặt một bộ bài tập vào phần Bài học: bị từ chối, thứ tự hai phần không đổi (AC-8.2); hai tab của T07 không có thao tác chuyển mục sang phần kia (AC-7.2).
- GV bấm "Thêm sau" trên bước 2 trong tab Bài học của T07: bước mới được tạo và lưu ngay ở vị trí 3 với trạng thái Nháp, các bước sau được đánh số lại (AC-7.6).
- GV bấm "Lên trên" trên mục ngay sau một mục Lưu trữ đang ẩn: mục đổi chỗ với mục Lưu trữ đó (số thứ tự của mục giảm 1, thông báo nêu vị trí mới) dù mục Lưu trữ không hiển thị (AC-6.5, AC-6.6).
- GV đổi thứ tự trong tab Bài học của T07 rồi rời T07 ngay: thứ tự mới đã được lưu và HV thấy ở lần tải trang kế tiếp (AC-6.5, AC-7.10, AC-10.6).
- GV có 2 bước học có thay đổi chưa lưu ở tab Bài học và 1 bộ bài tập có thay đổi chưa lưu ở tab Bài tập, chuyển qua lại giữa hai tab: không mục nào được lưu hay bị bỏ, nhãn "Chưa lưu" giữ nguyên (AC-7.12); bấm quay lại T18 → hỏi xác nhận kèm "3 mục chưa lưu" (AC-7.13).
- GV mở đường dẫn tới T09 của một Bài: T07 mở ở tab Bài tập; chọn tab Bài học thì thấy phần Bài học của cùng Bài (AC-7.12).
- Hai tab trình duyệt cùng mở T07 của một Bài và đổi thứ tự: thao tác dựa trên thứ tự cũ bị từ chối, hiển thị thứ tự mới nhất (AC-17.4).
- Phần có mục nhưng tất cả đều Lưu trữ: tóm tắt trên T18 nêu số mục Lưu trữ (ví dụ "2 bộ bài tập · 2 lưu trữ"), không phải trạng thái trống (AC-7.3, AC-7.4).
- GV chọn "Mobile" trên T21 rồi mở "Xem trước" của T20 trong cùng phiên: T20 cũng ở "Mobile"; T07 không có công tắc nên không bị ảnh hưởng; phiên đăng nhập mới mở lại ở "Web" (AC-16.8, AC-7.14).
- GV muốn xem như HV khi đang ở T18 hoặc T07: không có nút "Xem như học viên"; GV quay lại T06 và chọn "Xem như học viên" của Bài đó (AC-16.10, AC-16.1).
- Bài chỉ có mục Nháp: T21 hiển thị Bài không có mục nào như HV thấy; bật "Gồm cả mục Nháp" thì thấy các mục kèm nhãn "Nháp" (AC-16.1, AC-16.2).
- Xóa mục Đã xuất bản cuối cùng của một Bài Đã xuất bản: Bài biến khỏi trang của HV và T06/T18 hiển thị cảnh báo "Bài đã xuất bản nhưng chưa có nội dung hiển thị cho học viên" (AC-10.3, AC-10.7).
- Bài Đã xuất bản có phần Bài tập trống: HV chỉ thấy phần Bài học, không có phần Bài tập rỗng (AC-10.3).
- Mục Đã xuất bản nằm trong Bài Nháp (ví dụ sau khi xuất bản lẻ một mục): HV không thấy cho tới khi Bài được xuất bản (AC-10.1).
- Bộ bài tập sai đáp án đã có bài nộp: không xóa được; GV sửa nội dung (chấm lại theo 005, X5) hoặc lưu trữ bộ đó — có hiệu lực ngay, không hỏi xác nhận — để mọi lớp không thấy nữa (AC-12.3, AC-18.1).
- Bước học Đã xuất bản đang được HV xem: bước học không có dữ liệu học tập nên xóa được sau khi GV xác nhận; HV mở lại thấy A05 (AC-12.1, AC-10.5).
- Lưu trữ mục Đã xuất bản cuối cùng của một Bài Đã xuất bản: như xóa — Bài biến khỏi trang của HV và GV thấy cảnh báo (AC-18.2, AC-10.3, AC-10.7); khôi phục làm Bài hiện lại (AC-18.4).
- AI tạo xong trong lúc GV đang sắp xếp hoặc soạn ở T07: phần Bài học và Bài tập không thay đổi cho tới khi GV duyệt (AC-11.2).
- GV xuất bản Bài trong khi nội dung AI của Bài đang chờ review: được phép; nội dung chờ review không thuộc Bài, không được xuất bản và vẫn ở review (AC-11.2, AC-10.4).
- GV bỏ (không duyệt) nội dung AI ở T20: không mục nào được thêm hay bị thay; nhãn AI của Bài biến mất (AC-11.3, AC-10.4).
- Nhân bản Bài đang có nội dung AI chờ review: bản sao chỉ có các mục đã lưu, không có nội dung chờ review và không có nhãn AI (AC-14.3).
- Xóa Bài trong lúc AI đang tạo hoặc chờ review: hộp xác nhận cảnh báo nội dung AI sẽ bị hủy (AC-12.7).
- Hai tab cùng thao tác trên một giáo trình: sửa thông tin, đổi tên, sắp xếp, xuất bản, xóa — không bao giờ ghi đè âm thầm (AC-17.4).
- Mất kết nối hoặc phiên đăng nhập hết hạn khi đang sắp xếp: thứ tự hoàn lại như trước khi di chuyển (AC-6.4); đăng nhập lại theo 001.
- HV bắt đầu lượt làm đầu tiên đúng lúc GV đang xác nhận xóa bộ bài tập hoặc Bài: xóa bị từ chối (AC-12.6).
- Lớp đổi sang giáo trình khác (003): "Dùng bởi N lớp" của giáo trình cũ giảm, nhưng dữ liệu học tập HV đã có với giáo trình cũ vẫn chặn xóa (AC-13.3).
- Giáo trình bị lưu trữ hoặc xóa trong lúc GV đang chọn nó ở bước 3 của T03 trong tab khác: 003 phải kiểm tra lại khi xác nhận tạo lớp (AC-13.4, AC-13.5).
- Nhân bản một giáo trình Đã lưu trữ: được phép; bản sao ở tình trạng Hoạt động (AC-15.2).
- Nhân bản bị gián đoạn: không còn bản sao dở dang nào; thông báo thử lại (AC-14.5, AC-15.5).
- Xem trước một Bài chưa có mục Đã xuất bản nào: T21 hiển thị trạng thái trống đúng như HV thấy (AC-16.1).
- GV mở đường dẫn giáo trình hoặc Bài của GV khác, hoặc đã bị xóa: A05 "Không tìm thấy nội dung bạn yêu cầu.", không lộ thông tin (AC-17.2).
- HV học ở hai lớp cùng dùng một giáo trình (A3): mỗi lớp hiển thị cùng tập nội dung Đã xuất bản, sau đó áp dụng phần bị ẩn riêng của từng lớp (003).
- Thời điểm cập nhật luôn hiển thị theo giờ Việt Nam UTC+7 (AC-3.1, AC-4.1).

## 9. Out of Scope

- Soạn nội dung bước học, bộ thẻ từ vựng, bộ bài tập (→ 004, 005); module này chỉ quản lý Bài, vị trí, thứ tự trong phần và trạng thái xuất bản.
- Nội dung và hành vi của panel "Tạo bằng AI" trên T18 và của T20 (tải tài liệu, mô tả ngắn, tạo, review, sửa, bỏ, tạo lại, duyệt, hạn mức, chất lượng) (→ 010); module này chỉ cung cấp khung T18, nhãn AI của Bài và quy tắc lưu/hiển thị nội dung đã duyệt.
- Ẩn/hiện từng phần của Bài cho riêng một lớp (→ 003, D5).
- Ẩn hoặc lưu trữ cả một Bài ở cấp giáo trình (chỉ bước học và bộ bài tập được lưu trữ — REQ-18), đưa Bài hoặc mục về Nháp, hẹn giờ xuất bản.
- Sao chép hoặc di chuyển một Bài hay mục sang giáo trình khác; di chuyển mục sang phần hoặc Bài khác; chèn Bài vào giữa danh sách khi tạo (thêm vào cuối rồi sắp xếp); thao tác hàng loạt (xuất bản / xóa nhiều Bài hoặc mục một lúc).
- Lịch sử phiên bản, hoàn tác, thùng rác để khôi phục Bài, mục hoặc giáo trình đã xóa.
- Bản nháp thay đổi cho nội dung đã xuất bản (soạn thay đổi rồi mới "phát hành"); thay đổi được lưu là có hiệu lực ngay (A8).
- Chia sẻ giáo trình giữa các GV, kho giáo trình mẫu, nhập/xuất giáo trình ra tệp.
- Nhiều cấp độ HSK cho một giáo trình; chương/nhóm Bài; thêm, bớt hay đổi tên phần.
- Trạng thái xuất bản ở cấp giáo trình (giáo trình nào Hoạt động cũng có thể được chọn cho lớp).
- Nội dung Nói, Nghe, Viết đoạn tự do và chấm tay (D3 v2; 007 hoãn sau MVP).
- Thông báo cho HV khi có nội dung mới (A6).

Ngoài phạm vi / Hoãn (v3, 2026-10-20):

- Lộ trình học của Bài (một thứ tự chung trộn bước học và bộ bài tập, tab Lộ trình, dòng "Luyện tập cho:" trên lộ trình, lộ trình do AI đề xuất, mở khóa tuần tự) — bỏ theo V3-2; thay bằng thứ tự riêng của từng phần (REQ-8).
- Phần Bài thi và mọi quy tắc bài thi (thêm bài thi, bài thi hiện hành, phiên bản mới và phiên bản Đã thay thế, giới hạn 1 bài thi, điều kiện xuất bản bài thi, lịch thi theo lớp, xem trước bài thi không đếm giờ) — 006 hoãn sau MVP (V3-2); các màn hình T10, S07, S08 hoãn.
- Màn hình T19 (gộp vào panel "Tạo bằng AI" của T18 — 010); lựa chọn "Tạo bằng AI từ PDF" trong menu "Thêm bài" và nút "Tạo nội dung bằng AI từ PDF" cho Bài trống; tạo Bài khi bắt đầu phân tích; khóa phần Bài học / Bài tập trong lúc AI tạo; trạng thái duyệt "Chờ duyệt" / "Đã duyệt", nhãn "AI · Chờ duyệt (n)" và dấu "Đã chỉnh sửa" trên mục đã lưu; tài liệu nguồn của Bài — bỏ theo V3-3, V3-4.
- "Đánh dấu đã học", tiến độ học flashcard và thời lượng học như dữ liệu học tập chặn xóa — bỏ theo V3-1.

Ngoài phạm vi (v4, 2026-10-20):

- Khi duyệt nội dung AI: nối thêm vào cuối phần thay vì thay thế, chọn giữ lại từng mục cũ, đưa mục AI vừa duyệt vào Nháp, hoàn tác việc thay thế — bỏ theo V4-2, V4-3 (duyệt = xuất bản và thay toàn bộ nội dung của phần).
- Chặn hoặc hạn chế đổi cấp độ HSK của giáo trình đang được lớp dùng; phiên bản giáo trình riêng cho từng lớp — bỏ theo V4-4.

Ngoài phạm vi (v6, 2026-10-21):

- Danh sách mục, nút thêm mục, kéo-thả mục và menu thao tác từng mục (Sửa, Xem trước, Xuất bản, Lưu trữ / Khôi phục, Lên / Xuống, Xóa) trên T18 — chuyển vào T07 (V6-1, V10-1); panel Thủ công chỉ còn tóm tắt và nút "Soạn thủ công".
- Khung xem trước cho máy tính bảng, nhiều kích thước điện thoại hoặc màn hình xoay ngang; nhớ lựa chọn "Web / Mobile" sang phiên đăng nhập khác.

Ngoài phạm vi (v10, 2026-10-21):

- Hai trình soạn phần riêng T07 "Soạn phần Bài học" / T09 "Soạn phần Bài tập" và nút "Mở" của từng phần trên T18 — thay bằng một T07 "Soạn bài thủ công" hai tab (T09 là ID của tab Bài tập) và một nút "Soạn thủ công" (V10-1).
- Chế độ "Xem trước", nút "Chỉnh sửa" / "Xong", công tắc "Web / Mobile" và nút "Xem như học viên" trong T07 (cả hai tab) — T07 chỉ để chỉnh sửa (AC-7.14; đề xuất v9 bỏ "Web / Mobile" trên T07 nằm trong thay đổi này).
- Xem như HV cho từng mục riêng lẻ và nút "Xem như học viên" trên T18 — xem như HV chỉ có trên T21, mở từ thao tác của từng Bài trên T06 (AC-16.10).
- Xem trước cả giáo trình (danh sách Bài như HV thấy) trên T21 — T21 nay xem trước một Bài hoàn chỉnh (AC-16.1).

Ngoài phạm vi (2026-10-22, theo prototype):

- Mục mới chỉ tồn tại trên màn hình cho tới lần lưu đầu — mục được tạo và lưu ngay ở Nháp khi GV bấm thêm (AC-7.6).
- Hộp xác nhận khi xuất bản, lưu trữ hay khôi phục một mục trong T07; nút "Lưu trữ" trong thông báo từ chối xóa; cảnh báo "đang hiển thị với học viên của N lớp" khi xóa mục — các thao tác này có hiệu lực ngay theo prototype (AC-9.1, AC-12.1, AC-12.3, AC-18.1, AC-18.4).
- Vô hiệu nút thêm mục khi phần đủ 30 mục, và tính mục Lưu trữ vào giới hạn 30 (AC-7.9).
- Chế độ chỉ xem cho mục Lưu trữ — mục Lưu trữ sửa được trong T07 (AC-18.3).

Removed (2026-10-22, theo prototype):

- **Mục mới chưa lưu lần nào thì không vào Bài khi GV bỏ mục hoặc rời T07** (AC-7.7 cũ, bỏ, mã không dùng lại) — không còn ý nghĩa vì mục được tạo và lưu ngay khi bấm thêm (AC-7.6).

## 10. Assumptions & Dependencies

Giả định (chi tiết nguồn ở §12):

- D1, D3 v2, D5, X1, X2, X3, X5 (phần bài tập), V3-1 … V3-4, V4-2, V4-3, V4-4, V6-1, V6-3, V10-1, V10-2 (stakeholder) và A2, A3, A4, A5, A6, A7, A8, A9 (giả định chung của dự án).
- M-1 (v3, cập nhật 2026-10-22): Mỗi giáo trình tối đa 100 Bài; mỗi Bài tối đa 30 bước học và 30 bộ bài tập không ở trạng thái Lưu trữ (mục Lưu trữ không tính, theo prototype) khi thêm thủ công — nút thêm luôn bật, vượt giới hạn thì báo "Mỗi bài có tối đa 30 …" và không tạo mục — khi duyệt nội dung AI, giới hạn 30 chỉ tính mục mới (v4, AC-11.6); không giới hạn số giáo trình (hiệu năng cam kết tới 300 giáo trình — NFR-1).
- M-2 (v3): "Dữ liệu học tập" chặn xóa chỉ gồm lượt làm (kể cả đang làm dở) và bài nộp của bộ bài tập; bước học không có dữ liệu học tập.
- M-4: "Đang được sử dụng" tính mọi lớp tham chiếu giáo trình, kể cả lớp Đã kết thúc.
- M-5: Có tình trạng Đã lưu trữ cho giáo trình; giáo trình Đã lưu trữ vẫn phục vụ các lớp đang dùng và vẫn sửa được.
- M-6: Tên giáo trình duy nhất trong workspace, không phân biệt hoa/thường, kể cả giáo trình Đã lưu trữ.
- M-7 (v2, cập nhật 2026-10-22): Xóa giáo trình, xóa Bài và xóa mục chỉ cần một hộp xác nhận (không gõ lại tên — theo prototype). Không có thùng rác.
- M-8: Tên Bài do GV đặt tự do (điền sẵn "Bài N"), không bắt buộc duy nhất, không tự đánh số lại khi sắp xếp.
- M-9 (v6, cập nhật v10): Mỗi phần có thứ tự riêng do 002 sở hữu; Bài được sắp xếp trên T06 (kéo-thả, bàn phím, menu); mục được sắp xếp trong tab Bài học hoặc tab Bài tập (T09) của T07 bằng "Lên" / "Xuống", lưu ngay, mục Lưu trữ đang ẩn giữ vị trí (AC-6.5, AC-6.6); nếu 004 / 005 thêm cách di chuyển khác thì vẫn theo AC-6.4 và AC-8.2; không chuyển mục giữa hai phần; HV thấy Bài học trước Bài tập; không khóa tuần tự.
- M-10 (v3, cập nhật 2026-10-22): Bài: Nháp → Đã xuất bản. Bước học, bộ bài tập: Nháp → Đã xuất bản ⇄ Lưu trữ. Không quay về Nháp; xuất bản, lưu trữ và khôi phục một mục trong T07 có hiệu lực ngay, không hỏi xác nhận (theo prototype); xuất bản Bài đi kèm hộp thoại chọn mục sẵn sàng (điều kiện của 004, 005) và yêu cầu ít nhất một mục Đã xuất bản.
- M-11: Phần hoặc Bài không có mục nào HV được thấy thì không hiển thị với HV.
- M-12 (v4): Nội dung AI chỉ vào Bài khi GV duyệt (010); duyệt một phần thay toàn bộ nội dung của phần bằng các mục mới ở Đã xuất bản, mang dấu "AI tạo" (V4-2, V4-3); mục cũ chưa có dữ liệu học tập bị xóa, bộ bài tập cũ có dữ liệu học tập được lưu trữ (giữ điểm) và đặt sau các mục mới; quá 30 mục mới thì không lưu gì; mục mới phải đạt điều kiện xuất bản của 004/005; nếu phần thay đổi sau khi hộp xác nhận mở thì không thay thế mà hiện lại danh sách; trạng thái Bài và thiết lập ẩn phần theo lớp giữ nguyên; không khóa thao tác nào của Bài trong lúc AI tạo hoặc chờ review; xóa Bài hoặc giáo trình hủy nội dung AI chưa duyệt.
- M-13 (v3): Nhân bản Bài tạo bản sao trong cùng giáo trình, ngay sau Bài gốc; bỏ mục Lưu trữ; Bài và mọi mục ở Nháp; giữ dấu "AI tạo"; không mang nội dung AI chưa duyệt.
- M-14 (v3, cập nhật v10): Xem trước không ghi nhận dữ liệu; không có bộ chọn "xem như HV của lớp X" trong MVP; T21 mặc định chỉ hiện mục Đã xuất bản, công tắc "Gồm cả mục Nháp" (mặc định tắt) hiện thêm mục Nháp kèm nhãn "Nháp" (AC-16.1, AC-16.2).
- M-15 (v3, cập nhật 2026-10-22): Lưu trữ (REQ-18) là quy tắc chung do 002 sở hữu cho bước học và bộ bài tập: chỉ từ Đã xuất bản (do GV bấm "Lưu trữ" trong T07 — có hiệu lực ngay, không hỏi xác nhận, bị vô hiệu khi mục có thay đổi chưa lưu — hoặc tự động với bộ bài tập có dữ liệu học tập khi duyệt nội dung AI thay thế phần — REQ-19); ẩn với HV ở mọi lớp; giữ dữ liệu và vị trí trong phần; mục Lưu trữ vẫn sửa được trong T07 và không tính vào giới hạn 30; "Khôi phục" đưa về Đã xuất bản ngay.
- M-17 (v3): Từ vựng AI trong 002: dấu "AI tạo" trên mục (chỉ GV thấy) và nhãn AI của Bài do 010 cung cấp khi có nội dung đang tạo hoặc chờ review.
- M-18 (v3): T18 "Soạn bài" luôn có 2 panel; panel "Tạo bằng AI" dùng được cho mọi Bài (trống hoặc đã có mục, Nháp hoặc Đã xuất bản); "Thêm bài" luôn tạo Bài trước khi GV dùng một trong hai cách soạn.
- M-19 (v4): Đổi cấp độ HSK của giáo trình đang được lớp dùng luôn được phép, chỉ cần một hộp xác nhận; mọi thay đổi thông tin giáo trình hiện ngay ở mọi lớp dùng nó (V4-4, A8).
- M-20 (v6, cập nhật v10): Panel Thủ công của T18 chỉ còn tóm tắt 2 phần theo trạng thái và một nút "Soạn thủ công" mở T07 "Soạn bài thủ công" ở tab Bài học; 002 sở hữu khung T07 (phần đầu, tab Bài học | Bài tập, xuất bản Bài, cảnh báo rời T07 có số mục chưa lưu của cả hai tab), 004 sở hữu tab Bài học, 005 sở hữu tab Bài tập (ID T09; đường dẫn T09 mở T07 ở tab này); mục mới được tạo và lưu ngay ở Nháp (bước học: một khối Văn bản trống; bộ bài tập: một câu trắc nghiệm mẫu) ở cuối phần hoặc ngay sau mục GV chọn ("Thêm sau") khi GV bấm thêm (cập nhật 2026-10-22, theo prototype). Mô hình lưu của 002 trong T07: mọi thao tác 002 sở hữu (thêm, sắp xếp, xuất bản, lưu trữ, khôi phục, xóa) có hiệu lực ngay khi thực hiện hoặc xác nhận — chỉ xóa có hộp xác nhận; chuyển tab không lưu và không bỏ mục chưa lưu; lưu nội dung từng mục, kiểm tra xung đột và kiểm tra trường do 004 / 005 quy định; xung đột về thứ tự hoặc trạng thái theo AC-17.4 (AC-6.5, AC-7.10 … AC-7.14).
- M-21 (v6, cập nhật v10, 2026-10-22): T21 chỉ mở từ thao tác "Xem như học viên" của từng Bài trên T06 và xem trước cả Bài theo hai tab Bài học | Bài tập, mỗi tab hiển thị đầy đủ nội dung mọi mục (bước học như S03, bộ bài tập như S05, chọn thử đáp án được, không ghi nhận); công tắc "Web / Mobile": mặc định "Web", "Mobile" = khung 375 px; lựa chọn được nhớ theo GV trong phiên đăng nhập và dùng chung giữa T20 và T21 (AC-16.1, AC-16.7 … AC-16.10). T07 không có công tắc này và không có nút "Xem như học viên".

Phụ thuộc:

- 001 — danh tính GV, workspace, vai trò GV/HV dùng cho REQ-17; màn hình dùng chung A05 "Không tìm thấy nội dung bạn yêu cầu." (AC-10.5, AC-17.2). Nếu 001 xóa tài khoản HV kèm dữ liệu của HV đó thì dữ liệu ấy không còn chặn xóa.
- 003 — biết lớp nào đang dùng giáo trình nào và trạng thái lớp (AC-3.1, AC-4.3, AC-4.4, AC-13.2); ẩn/hiện từng phần (Bài học, Bài tập) của từng Bài theo lớp ở T04 tab "Nội dung" (D5) — đích của hướng dẫn trong AC-12.5; áp dụng ngày bắt đầu (A9) và phần bị ẩn lên tập nội dung của AC-10.1 khi hiển thị S02/S11, theo thứ tự AC-10.2 và quy tắc AC-10.3; bước 3 của T03 chỉ liệt kê giáo trình Hoạt động (AC-13.5); Bài mới xuất bản mặc định không bị ẩn ở lớp nào; xóa thiết lập theo lớp của Bài/mục bị xóa; giữ nguyên thiết lập ẩn phần khi nội dung của phần được thay bằng nội dung AI đã duyệt (AC-19.6); hiển thị thông tin giáo trình mới nhất, kể cả cấp độ HSK, cho các lớp đang dùng (AC-2.4).
- 004 / 005 — sở hữu tab Bài học (004) và tab Bài tập T09 (005) trong khung T07 "Soạn bài thủ công" của 002 (V10-1), mở bằng nút "Soạn thủ công" cho đúng Bài (AC-7.5, AC-7.12); cả hai tab chỉ để chỉnh sửa, bố cục web, không có "Xem trước", "Xong", "Web / Mobile" hay "Xem như học viên" (AC-7.14); tạo mục mẫu (bước học một khối Văn bản trống, bộ bài tập một câu trắc nghiệm mẫu) ngay khi GV bấm thêm, tại vị trí GV chọn (AC-7.6); hiển thị mục theo thứ tự của phần (AC-8.3); cung cấp "Lên" / "Xuống" theo quy tắc sắp xếp của 002 (AC-6.4 … AC-6.6, AC-8.2) và các thao tác xuất bản, lưu trữ, khôi phục, xóa có hiệu lực ngay (AC-7.10); giữ mục chưa lưu khi chuyển tab và cho 002 biết số mục chưa lưu của tab để cảnh báo rời T07 (AC-7.12, AC-7.13); ẩn mục Lưu trữ mặc định kèm công tắc "Hiện mục lưu trữ" của từng tab (AC-18.3); cung cấp cách hiển thị bước học (004 AC-7.6) và bộ bài tập như HV cho T21 (AC-16.3); từ chối thêm kèm thông báo khi phần đủ 30 mục không Lưu trữ, nút thêm vẫn bật (AC-7.9); vô hiệu "Lưu trữ" khi mục có thay đổi chưa lưu và cho sửa mục Lưu trữ (AC-18.3, AC-18.5); cung cấp điều kiện xuất bản (AC-9.2); liên kết luyện tập là thuộc tính của bộ bài tập (005), được trỏ lại khi nhân bản (AC-14.1); 005 báo dữ liệu học tập phát sinh — lượt làm bắt đầu, bài nộp (AC-12.3, AC-12.5, AC-12.6, AC-13.3); hiển thị chế độ xem trước không ghi nhận (AC-16.3 … AC-16.5); 004 và 005 áp dụng quy tắc lưu trữ chung của REQ-18; mục AI đã duyệt không có trạng thái duyệt riêng, được lưu ở Đã xuất bản và phải đạt điều kiện xuất bản của 004/005 lúc duyệt (AC-11.5, AC-11.7, AC-19.4); 005 cho biết bộ bài tập nào có dữ liệu học tập để quyết định xóa hay lưu trữ khi thay thế phần (AC-19.2, AC-19.3) và xử lý liên kết luyện tập trỏ tới bước học bị xóa.
- 010 — sở hữu nội dung và hành vi panel "Tạo bằng AI" của T18 và T20 (AC-11.1); cung cấp tên nhãn AI của Bài và cho biết Bài có nội dung đang tạo hay chờ review (AC-11.3, AC-11.4); hiển thị hộp xác nhận duyệt với số mục mới, danh sách mục bị xóa và bộ bài tập được lưu trữ do 002 xác định (AC-19.1, AC-19.5); khi GV xác nhận duyệt một phần, giao các mục đã duyệt để 002 thay nội dung của phần và xuất bản (AC-11.5, AC-11.6, AC-19.2 … AC-19.4); không bao giờ đưa nội dung chưa duyệt vào Bài (AC-11.2, AC-10.4); hủy nội dung chưa duyệt khi Bài hoặc giáo trình bị xóa (AC-12.7, AC-13.1). Mục AI đã duyệt được xuất bản ngay khi duyệt (AC-11.5); xuất bản Bài luôn theo REQ-9. Chế độ "Xem trước" của T20 dùng chung lựa chọn "Web / Mobile" của GV trong phiên với T21 — chỉ hai màn hình này dùng lựa chọn đó (V6-2, V10-2, AC-16.8).
- 008 / 009 — dùng tập bộ bài tập Đã xuất bản của các Bài Đã xuất bản làm cơ sở tính điểm và tiến độ (bước học không được tính — V3-1); nhận "Bài/mục được xuất bản", "Bài/mục bị xóa" (chỉ xảy ra khi chưa có dữ liệu học tập); mục Lưu trữ được 008 coi như nội dung bị ẩn (giữ điểm) và 009 loại khỏi tiến độ, khôi phục tính lại (AC-18.2, AC-18.4); khi nội dung AI đã duyệt thay thế phần Bài tập, bộ bài tập mới Đã xuất bản được tính ngay (nếu Bài Đã xuất bản), bộ cũ bị lưu trữ giữ điểm như trên và bộ cũ bị xóa chưa từng có điểm (AC-19.2, AC-19.3). 009 dùng số Bài đang mang nhãn AI "chờ review" cho chỉ số "Bài AI chờ duyệt" (AC-11.3).
- 006 / 007 — hoãn sau MVP; module này không phụ thuộc.

## 11. Open Questions

Không còn câu hỏi mở.

Đã đóng: Q-1 (đổi cấp độ HSK của giáo trình đang được dùng) — stakeholder cho phép, thay đổi hiện ngay ở mọi lớp (V4-4, phiên 2026-10-20 v4; AC-2.3, AC-2.4). Q-3 (trạng thái khi nhân bản cả giáo trình) — giữ nguyên trạng thái như bản gốc, theo prototype (phiên 2026-10-22; AC-15.2).

Không có câu hỏi mở mới ở v6 (2026-10-21): các chi tiết V6-1, V6-3 chưa được nêu được ghi thành giả định ở §12, Session 2026-10-21 (v6). Q-3 không bị ảnh hưởng ở v6 (đã đóng ở phiên 2026-10-22). Phiên 2026-10-22 (đồng bộ prototype) không mở câu hỏi mới.

## 12. Clarifications Log

### Session 2026-10-18

- Q: Ai quản trị giáo trình và ai được xem? → A: Mỗi GV là quản trị duy nhất của workspace mình; GV không bao giờ thấy giáo trình của GV khác (D1) — áp dụng ở REQ-13. (source: stakeholder)
- [thay thế 2026-10-19] Q: Cấu trúc của một giáo trình? → A: Mỗi giáo trình thuộc đúng một cấp độ HSK1…HSK9 và luôn có đúng 3 phần cố định Bài học / Bài tập / Bài thi; "giáo án" trong yêu cầu gốc = giáo trình (D2) — áp dụng ở REQ-1, REQ-4. (source: stakeholder)
- Q: Một lớp dùng bao nhiêu giáo trình? → A: Một lớp dùng đúng một giáo trình; một giáo trình dùng được cho nhiều lớp (A2) — cơ sở cho "Dùng bởi N lớp". (source: assumption — giả định chung A2, chủ sở hữu 003)
- Q: HV có thể ở nhiều lớp cùng dùng một giáo trình? → A: Có, một HV có thể ở nhiều lớp của cùng GV (A3); module này chỉ quyết định mục nào hiển thị. (source: assumption — giả định chung A3, chủ sở hữu 001/003)
- [thay thế 2026-10-21 v6 — một phần: khung xem trước nay là công tắc "Web / Mobile", "Mobile" rộng 375 px (AC-16.7)] Q: Thiết bị sử dụng? → A: GV trên máy tính (≥ 1280 px, dùng được từ 1024 px); HV trên điện thoại 360–430 px — khung xem trước rộng 390 px (A4). (source: assumption — giả định chung A4)
- Q: Ngôn ngữ giao diện và nội dung? → A: Giao diện tiếng Việt; tên/mô tả có thể chứa chữ Hán giản thể và pinyin, phải hiển thị đúng (A5) — NFR-8. (source: assumption — giả định chung A5)
- Q: Có thông báo cho HV khi xuất bản mục mới không? → A: Không trong MVP; chỉ hiển thị trong ứng dụng (A6). (source: assumption — giả định chung A6)
- Q: Múi giờ hiển thị? → A: Giờ Việt Nam UTC+7 (A7). (source: assumption — giả định chung A7)
- [thay thế 2026-10-19] Q: Lớp tham chiếu giáo trình thế nào? → A: Tham chiếu trực tiếp; thay đổi hiện ngay ở các lớp; nội dung đã có dữ liệu của HV không được xóa, chỉ ẩn (A8) — 002 đồng ý và làm rõ "dữ liệu học tập" ở M-2 (REQ-8, REQ-9, REQ-10). (source: assumption — giả định chung A8, chủ sở hữu 002)
- [thay thế 2026-10-19] Q: Nội dung mở cho HV khi nào? → A: Trước ngày bắt đầu lớp, HV không mở được nội dung; từ ngày bắt đầu mọi mục Đã xuất bản đều mở, không mở khóa tuần tự (A9) — vì vậy không có hiển thị theo từng lớp. (source: assumption — giả định chung A9, chủ sở hữu 003)
- [thay thế 2026-10-19] Q: Giới hạn số mục mỗi phần? → A: 200 mục mỗi phần (M-1). (source: assumption — một khóa HSK thông thường có dưới 50 bài mỗi loại; 200 đủ dư mà vẫn giữ danh sách và nhân bản trong ngưỡng NFR-2, NFR-3)
- [thay thế 2026-10-19] Q: Thế nào là dữ liệu học tập chặn xóa? → A: Lượt làm (kể cả đang làm dở), bài nộp, dấu hoàn thành bài học, tiến độ học flashcard (M-2). (source: assumption — phương án thận trọng nhất để không bao giờ mất dữ liệu của HV)
- [thay thế 2026-10-19] Q: Bộ thẻ từ vựng có là mục độc lập trong phần Bài học không? → A: Không, nằm trong một bài học theo bảng thuật ngữ (M-3). (source: assumption — bảng thuật ngữ chung: "Bài học … may include Bộ thẻ từ vựng"; 004 xác nhận)
- Q: Lớp Đã kết thúc có tính là "đang sử dụng"? → A: Có (M-4). (source: assumption — lớp đã kết thúc vẫn cần xem lại nội dung và kết quả; xóa giáo trình sẽ phá lịch sử)
- Q: Có cần lưu trữ giáo trình không? → A: Có, P2 (M-5). (source: assumption — là lối thoát an toàn khi không được phép xóa; không làm ảnh hưởng lớp đang dùng)
- Q: Tên giáo trình có phải duy nhất không? → A: Duy nhất trong workspace, không phân biệt hoa/thường, kể cả giáo trình Đã lưu trữ (M-6). (source: assumption — tránh nhầm lẫn khi chọn giáo trình ở bước 3 của T03)
- [thay thế 2026-10-19] Q: Mức xác nhận khi xóa? → A: Xóa giáo trình phải gõ lại tên; xóa mục chỉ cần xác nhận; không có thùng rác (M-7). (source: assumption — xóa giáo trình là thao tác lớn và không hoàn tác được)

### Session 2026-10-19

Ghi chú: phiên này viết lại spec theo câu trả lời của stakeholder ngày 2026-10-19 (brief v2). Các tham chiếu REQ/AC ở phiên 2026-10-18 là số hiệu của v1; những mục bị thay thế được ghi rõ dưới đây. Các tham chiếu REQ/AC ở phiên này là số hiệu của v2.

- [thay thế 2026-10-20] Q: Cấu trúc giáo trình theo v2? → A: Giáo trình (một cấp độ HSK) → danh sách Bài có thứ tự → mỗi Bài có đúng 3 phần cố định Bài học · Bài tập · Bài thi; 3 phần ở cấp giáo trình của v1 bị bỏ (D2 v2, thay D2 v1) — áp dụng ở REQ-4, REQ-5, REQ-7. (source: stakeholder)
- Q: Loại nội dung và cách chấm trong MVP? → A: Chỉ dạng tự chấm; Nói, Nghe, Viết tự do và chấm tay hoãn, 007 hoãn (D3 v2) — 002 bỏ mọi phụ thuộc vào 007 và trạng thái "Chờ chấm". (source: stakeholder)
- [thay thế 2026-10-20] Q: Ẩn nội dung với HV thế nào? → A: "Ẩn theo từng lớp": GV ẩn một trong 3 phần của một Bài cho riêng một lớp, HV lớp đó không thấy phần đó nữa, lớp khác không bị ảnh hưởng (X2, D5, chủ sở hữu 003) — 002 bỏ trạng thái "Ẩn" và thao tác Ẩn/Hiện lại ở cấp giáo trình của v1 (AC-7.2, AC-7.3, AC-8.4 v1); khi không được xóa, 002 hướng GV tới T04 tab "Nội dung" (AC-12.3, AC-12.5). (source: stakeholder)
- Q: v1 Q-2 — Khi nội dung bị ẩn, HV có còn xem kết quả cũ không? → A: Đã giải quyết: phần bị ẩn ở một lớp vô hình hoàn toàn với HV lớp đó, kể cả kết quả cũ; điểm xếp hạng đã có được giữ; tiến độ của lớp không tính phần bị ẩn (X2, D5) — thuộc 003/008/009, không còn là câu hỏi của 002. (source: stakeholder)
- [thay thế 2026-10-20] Q: Tạo bài bằng AI? → A: GV tạo giáo trình → tạo Bài → tải PDF nội dung Bài → hệ thống dùng AI phân tích, thiết kế lộ trình học bám sát tài liệu và tạo phần Bài học, Bài tập dạng thao tác trên web; mọi thứ là Nháp, "GV duyệt rồi mới xuất bản" (D6, chủ sở hữu 010) — 002 cung cấp điểm vào (AC-11.1, AC-11.2), nhãn nhận diện (AC-11.4) và chặn xuất bản nội dung chưa duyệt (AC-9.3, AC-10.4). (source: stakeholder)
- Q: Bài tập thuộc đâu, làm lại thế nào? → A: Bài tập thuộc từng Bài (phần Bài tập), HV làm lại không giới hạn, xếp hạng lấy lần cao nhất (X1, chủ sở hữu 005/008) — 002 đặt bộ bài tập trong phần Bài tập của Bài (AC-7.2, AC-7.5). (source: stakeholder)
- [thay thế 2026-10-20] Q: Lịch thi theo lớp hay theo giáo trình? → A: Theo từng lớp (X4, chủ sở hữu 006, đặt ở T04) — AC-10.1 tham chiếu điều kiện lịch thi của 006; nhân bản không mang lịch thi (AC-14.3, AC-15.3). (source: stakeholder)
- [thay thế 2026-10-20] Q: Sửa nội dung đã có bài nộp? → A: Sửa đáp án bộ bài tập → chấm lại sau khi GV xác nhận; nội dung bài thi khóa ở lượt làm đầu tiên, muốn đổi thì nhân bản (X5, chủ sở hữu 005/006) — 002: xem trước không khóa bài thi (AC-16.4); bản sao Bài/giáo trình có bài thi chưa khóa (AC-14.3, AC-15.3). (source: stakeholder)
- [thay thế 2026-10-20 v4] Q: v1 Q-1 — Đổi cấp độ HSK của giáo trình đang được dùng? → A: Câu trả lời v2 không đề cập; vẫn còn ý nghĩa vì cấp độ hiển thị ở T05, T03 và trang lớp của HV — giữ mở là Q-1 (AC-2.3). (source: assumption — kiểm tra lại theo brief v2; không có câu trả lời của stakeholder)
- Q: v1 Q-3 — Nhân bản giữ trạng thái? → A: Vẫn mở cho nhân bản giáo trình (Q-3, AC-15.2). Với nhân bản một Bài, 002 chọn phương án thận trọng: Bài và mọi mục về Nháp, vì bản sao nằm ngay trong giáo trình đang được lớp dùng và nếu giữ trạng thái thì nội dung trùng lặp sẽ hiện ngay cho HV (M-13, AC-14.2). (source: assumption — tránh hiển thị trùng lặp cho HV; phù hợp nguyên tắc "GV duyệt rồi mới xuất bản")
- [thay thế 2026-10-20] Q: Giới hạn số lượng? → A: Tối đa 100 Bài mỗi giáo trình; 30 bước học và 30 bộ bài tập mỗi Bài (kể cả mục Lưu trữ) và 1 bài thi hiện hành (M-1 v2, thay 200 mục mỗi phần của v1; đã hạ từ 50 xuống 30 để khớp 004 AC-1.2 và 005 AC-1.2) — AC-5.5, AC-7.8. (source: assumption — giáo trình HSK chuẩn có khoảng 15–40 bài mỗi cấp, một bài thường có dưới 15 bước; giới hạn dư mà vẫn giữ T06/T18 và nhân bản trong ngưỡng NFR-2, NFR-3; một con số chung cho 002/004/005)
- Q: Đặt tên và đánh số Bài thế nào? → A: Tên Bài do GV đặt tự do, điền sẵn "Bài N"; không bắt buộc duy nhất; sắp xếp không tự đổi tên; T06 hiển thị số thứ tự riêng (M-8) — AC-5.1, AC-5.3, AC-5.4. (source: assumption — tên Bài thường theo giáo trình giấy, ví dụ "Bài 1 – 你好"; tự đánh số dễ xung đột với cách GV đặt tên)
- [thay thế 2026-10-20] Q: Lộ trình học do ai sắp xếp, ở đâu? → A: Một thứ tự duy nhất của bước học và bộ bài tập trong Bài, bài thi luôn ở cuối, do 002 sở hữu và chỉ sắp xếp ở tab Lộ trình của T18; các tab phần hiển thị theo thứ tự tương đối (M-9) — REQ-8. (source: assumption — tránh hai thứ tự mâu thuẫn; brief v2 §2: "002 owns ordering on T18")
- [thay thế 2026-10-20] Q: Lộ trình có khóa tuần tự không? → A: Không, chỉ là thứ tự gợi ý trong MVP. (source: assumption — brief v2 §2; 010 có thể đề xuất khác)
- [thay thế 2026-10-20] Q: Quy tắc xuất bản? → A: Bài và mục không bao giờ quay về Nháp, không có Ẩn ở cấp giáo trình (vòng đời đầy đủ của từng loại mục ở mục đối chiếu R2, R4 bên dưới); xuất bản mục cần xác nhận vì không hoàn tác được; "Xuất bản bài" mở hộp thoại chọn sẵn các mục Nháp sẵn sàng và yêu cầu ít nhất một mục Đã xuất bản (M-10) — REQ-9. (source: assumption — brief v2 §2 "no going back to Nháp"; hộp thoại giúp GV duyệt lần cuối trước khi HV thấy)
- Q: Bài đã xuất bản có phần trống thì HV thấy gì? → A: Phần không có mục nào HV được thấy thì không hiển thị; Bài không có mục nào HV được thấy thì không hiển thị; GV thấy cảnh báo trên T06/T18 (M-11) — AC-10.3, AC-10.7. (source: assumption — tránh tab rỗng trên điện thoại của HV; nhất quán với "phần bị ẩn thì vắng mặt")
- [thay thế 2026-10-20] Q: Nội dung AI chưa duyệt và Bài đang tạo? → A: Mục "Chờ duyệt" không xuất bản được và không bao giờ hiển thị cho HV; khi lượt tạo bằng AI ở trạng thái khóa của 010 AC-15.2, phần Bài học và Bài tập cùng "Xuất bản bài", "Nhân bản bài" và nhân bản/xóa giáo trình bị khóa; xóa Bài vẫn được và hủy lượt (010 AC-15.3) (M-12) — AC-9.3, AC-10.4, AC-11.7, AC-12.8. (source: assumption — thực thi "GV duyệt rồi mới xuất bản"; tránh xung đột giữa thao tác của GV và nội dung 010 đang ghi; khớp danh sách trạng thái khóa của 010)
- [thay thế 2026-10-20] Q: Nhân bản Bài? → A: Bản sao trong cùng giáo trình, ngay sau Bài gốc, tên "(bản sao)"; không sao chép mục Lưu trữ; chỉ sao chép bài thi hiện hành; Bài và mọi mục Nháp; giữ dấu "AI tạo", "Đã chỉnh sửa" và trạng thái duyệt; không mang dữ liệu học tập, thiết lập theo lớp hay tình trạng khóa bài thi (M-13) — REQ-14. Sao chép Bài sang giáo trình khác ngoài phạm vi. (source: assumption — yêu cầu "duplicate a Bài" của brief v2; phương án thận trọng nhất)
- [thay thế 2026-10-20] Q: Nhân bản giáo trình có còn không? → A: Có — sao chép sâu mọi Bài, phần, mục và lộ trình, không mang dữ liệu học tập (REQ-15). (source: assumption — brief v2 yêu cầu giữ; v1 US-6)
- Q: Lưu trữ giáo trình có còn hợp lý khi bỏ "Ẩn"? → A: Có — giữ nguyên REQ-13 (Lưu trữ / Khôi phục, M-5) làm lối thoát khi không được xóa. (source: assumption — không liên quan đến ẩn theo lớp; vẫn là cách duy nhất để dọn T05 và T03)
- [thay thế 2026-10-20] Q: Xem trước như HV ở màn hình nào? → A: T21 (thay T18* đề xuất ở v1); từ T06 xem danh sách Bài như HV, từ T18 xem cả Bài kể cả mục Nháp (gắn nhãn "Nháp"); không ghi nhận dữ liệu, không khóa bài thi; không có bộ chọn lớp trong MVP (M-14) — REQ-16. (source: assumption — brief v2 §4; xem nháp trước khi xuất bản là mục đích chính; phần bị ẩn theo lớp đã nhìn thấy được ở T04 tab "Nội dung")
- Q: HV mở nội dung không được phép hoặc GV mở dữ liệu workspace khác thì thấy gì? → A: Màn hình dùng chung A05 "Không tìm thấy nội dung bạn yêu cầu." (A05 đã được nhận vào danh mục v2, chủ sở hữu 001) — AC-10.5, AC-17.2. (source: assumption — danh mục màn hình brief v2 §4; thông điệp thống nhất với 001 AC-16.2)
- Q: Thao tác đồng thời ở nhiều tab? → A: Một quy tắc chung: thao tác dựa trên dữ liệu cũ bị từ chối, hiển thị dữ liệu mới nhất, giữ nội dung đang nhập (AC-17.4), thay cho các AC xung đột riêng lẻ của v1. (source: assumption — cùng hành vi, ít AC trùng lặp hơn)
- [thay thế 2026-10-20] Q: (Đối chiếu R2) Một Bài có thể có bao nhiêu bài thi khi 006 cho "Tạo phiên bản mới"? → A: Phần Bài thi chứa tối đa 1 bài thi hiện hành, tối đa 1 phiên bản mới ở Nháp và mọi phiên bản Đã thay thế (chỉ xem); lộ trình chỉ chứa bài thi hiện hành, luôn ở cuối; tab Bài thi của T18 có thẻ bài thi hiện hành, thẻ "Phiên bản mới · Nháp" và danh sách thu gọn "Phiên bản trước"; trạng thái bài thi Nháp / Đã xuất bản / Đã thay thế; bài thi đã có bài làm không xóa được mà dùng phiên bản mới; nhân bản Bài chỉ sao chép bài thi hiện hành ở Nháp, không lịch thi, lượt làm hay kết quả (M-16) — AC-7.8, AC-7.9, AC-8.1, AC-8.3, AC-9.7, AC-12.7, AC-14.1 … AC-14.3, AC-15.2. (source: assumption — cross-module alignment (orchestrator))
- [thay thế 2026-10-20] Q: (Đối chiếu R4) Gỡ một bước học hoặc bộ bài tập đã có dữ liệu học tập khỏi mọi lớp thế nào? → A: 002 sở hữu quy tắc chung "Lưu trữ": vòng đời Nháp → Đã xuất bản ⇄ Lưu trữ; chỉ xóa được khi chưa có dữ liệu học tập, nếu có thì lưu trữ; mục Lưu trữ biến mất với HV ở mọi lớp, giữ dữ liệu và vị trí trong lộ trình, "Khôi phục" đưa về Đã xuất bản; bài thi dùng cơ chế phiên bản; giáo trình giữ lưu trữ riêng (REQ-13); 004 và 005 áp dụng, 008 giữ điểm như nội dung bị ẩn, 009 loại khỏi tiến độ (M-15) — REQ-18, AC-9.7, AC-10.1, AC-10.5, AC-12.3, AC-12.5. (source: assumption — cross-module alignment (orchestrator))
- [thay thế 2026-10-20] Q: (Đối chiếu R6) Từ vựng và quy tắc duyệt nội dung AI? → A: Theo 010: dấu "AI tạo" (vĩnh viễn), trạng thái duyệt "Chờ duyệt" → "Đã duyệt", nút "Duyệt" trên T20 và T07/T08/T09, dấu "Đã chỉnh sửa" khi GV lưu thay đổi nội dung (không đổi trạng thái duyệt), nhãn Bài "AI · Chờ duyệt (n)" và nhãn trạng thái lượt theo tên trạng thái của 010 (ví dụ "AI · Đang phân tích 45%"); Bài được tạo khi GV bấm "Bắt đầu phân tích"; mục "Chờ duyệt" không bao giờ được xuất bản; xuất bản Bài/mục áp dụng điều kiện 004 AC-7.1, AC-9.4 và 005 AC-12.3 (M-17) — AC-4.1, AC-9.2, AC-9.3, AC-11.3 … AC-11.7, AC-14.2. (source: assumption — cross-module alignment (orchestrator))
- Q: (Đối chiếu R7) Dọn dẹp? → A: Các mục của phiên 2026-10-18 đã bị v2 thay thế được gắn "[thay thế 2026-10-19]"; không AC nào phụ thuộc "Chờ chấm", T13 hay 007; giới hạn bước học / bộ bài tập thống nhất 30 với 004 và 005. (source: assumption — cross-module alignment (orchestrator))

### Session 2026-10-20

Ghi chú: phiên này đơn giản hóa spec theo ý kiến stakeholder ngày 2026-10-20 (brief v3, V3-1 … V3-4). Các tham chiếu REQ/AC ở phiên 2026-10-19 là số hiệu của v2; số hiệu REQ giữ nguyên, AC trong REQ-7, REQ-8, REQ-9, REQ-11, REQ-12, REQ-16 được đánh lại. Các mục bị thay thế ở phiên trước được gắn "[thay thế 2026-10-20]".

- Q: Hệ thống theo dõi việc học của HV đến đâu? → A: "chỉ tracking học viên làm bài tập của buổi học chứ không tracking thời lượng và nội dung học" (V3-1) — 002: dữ liệu học tập chặn xóa chỉ còn lượt làm và bài nộp của bộ bài tập; bước học không có dữ liệu học tập; xem trước không có gì để ghi nhận ngoài lượt làm, bài nộp, điểm (M-2 v3, AC-12.3, AC-12.5, AC-16.4). (source: stakeholder)
- Q: Cấu trúc giáo trình theo v3? → A: "phần giáo trình tinh gọn lại sẽ chỉ có section bài học và bài tập, bỏ lộ trình và bài thi" (V3-2) — mỗi Bài có đúng 2 phần Bài học · Bài tập; bỏ lộ trình học, phần Bài thi và mọi quy tắc bài thi (phiên bản, giới hạn, điều kiện xuất bản, lịch thi, xem trước bài thi); 006 hoãn sau MVP; ẩn phần theo lớp (D5) nay áp dụng cho 2 phần (AC-5.2, AC-7.2, REQ-8, §9). (source: stakeholder)
- Q: Có những cách nào để tạo nội dung của Bài? → A: "2 cách: 1 là thủ công GV sẽ tạo tay dựa vào các bước và khối của hệ thống; 2 là tạo bằng AI: sẽ upload tài liệu là file PDF, WORD… AI sẽ phân tích và tự tạo bài học và bài tập tự động dựa vào nội dung được upload … và tạo bằng AI sẽ được có chức năng review các section bài học và bài tập AI tạo — chỉ save khi GV approve" (V3-3, V3-4) — 002 sở hữu panel Thủ công; nội dung AI chỉ vào Bài khi GV duyệt; bỏ trạng thái "Chờ duyệt" / "Đã duyệt" và nhãn "AI · Chờ duyệt (n)" trên mục đã lưu (REQ-7, REQ-11). (source: stakeholder)
- Q: Giao diện soạn bài? → A: "về UI sẽ chia ra 2 panel là 1 bên tạo manual và 1 bên AI; bên AI thì chỉ cần upload, có input nhập mô tả ngắn, và chức năng review" — T18 "Soạn bài" có panel trái Thủ công (002) và panel phải Tạo bằng AI (010); T19 gộp vào T18 (AC-7.1, AC-11.1). (source: stakeholder)
- Q: v2 "Thêm bài → Tạo bằng AI từ PDF" trên T06 còn không? → A: Không; "Thêm bài" luôn tạo một Bài Nháp có tên rồi mở T18, nơi GV chọn soạn tay hoặc dùng panel Tạo bằng AI; Bài luôn tồn tại trước khi dùng AI nên 010 không tạo Bài (M-18, AC-4.2, AC-5.1, AC-5.2). (source: assumption — cách đơn giản nhất với giao diện 2 panel; tránh Bài rỗng do AI thất bại; bỏ nhánh "tạo Bài khi bắt đầu phân tích")
- [thay thế 2026-10-20 v4] Q: Duyệt một phần do AI tạo thì thay thế hay nối thêm vào nội dung có sẵn của phần? → A: Nối thêm vào cuối phần, theo thứ tự đã duyệt, ở Nháp, mang dấu "AI tạo"; không thay thế hay xóa mục nào; nếu vượt 30 mục thì không lưu gì và giữ review (M-12 v3, AC-11.5, AC-11.6). (source: assumption — phương án thận trọng: không bao giờ xóa nội dung GV đã soạn hay bộ bài tập đã có bài làm; 010 quyết định cách hiển thị trên T20 và có thể đề xuất khác)
- Q: Có khóa thao tác của Bài khi AI đang tạo hoặc chờ review không? → A: Không; nội dung AI nằm ngoài Bài cho tới khi duyệt nên GV vẫn soạn, sắp xếp, xuất bản, nhân bản và đổi tên; xóa Bài hoặc giáo trình hủy nội dung AI chưa duyệt (M-12 v3, AC-11.2, AC-12.7, AC-13.1, AC-14.3) — thay M-12 v2. (source: assumption — hệ quả trực tiếp của V3-4)
- [thay thế 2026-10-21 v6] Q: Thứ tự trong Bài khi bỏ lộ trình? → A: Mỗi phần có thứ tự riêng, sắp xếp ở panel Thủ công (bước học cũng sắp xếp được trên T07 theo cùng thứ tự); không kéo mục giữa hai phần; HV thấy phần Bài học trước phần Bài tập (M-9 v3, AC-6.1, REQ-8, AC-10.2) — thay M-9 v2. (source: assumption — V3-2 "inside a section the GV still orders steps and sets, each section on its own")
- Q: Nội dung AI sau khi duyệt mang dấu gì? → A: Chỉ dấu "AI tạo", chỉ GV thấy; mục đó tuân theo mọi quy tắc của mục thủ công; Bài mang nhãn AI do 010 cung cấp khi có nội dung đang tạo hoặc chờ review (ví dụ "AI · Đang tạo 45%", "AI · Chờ duyệt"); bỏ "Đã chỉnh sửa" khỏi 002 (M-17 v3, AC-7.3, AC-11.3, AC-11.7) — thay M-17 v2 và R6. (source: assumption — V3-4 "After approval, content behaves exactly like manual content … keeps the AI tạo mark for the GV only")
- Q: Bước học còn được lưu trữ không khi không còn dữ liệu học tập? → A: Có; lưu trữ là cách rút bước học hoặc bộ bài tập khỏi mọi lớp mà không xóa nội dung; quy tắc REQ-18 giữ nguyên, vị trí lưu trong phần (M-15 v3). Trạng thái thẻ cá nhân của HV (nếu 004 giữ như công cụ học cá nhân) không chặn xóa bước học. (source: assumption — brief v3 §2 "Keep … archive … rules for … steps and sets"; 004 quyết định thẻ cá nhân)
- [thay thế 2026-10-22 — một phần: mục Lưu trữ không tính vào giới hạn 30 (AC-7.9)] Q: Giới hạn số lượng theo v3? → A: 100 Bài mỗi giáo trình; 30 bước học và 30 bộ bài tập mỗi Bài (kể cả mục Lưu trữ); bỏ giới hạn bài thi (M-1 v3, AC-5.5, AC-7.9, NFR-2, NFR-3). (source: assumption — giữ con số chung với 004/005; chỉ bỏ phần bài thi)
- [thay thế 2026-10-20 v4 — Q-1 đã đóng, Q-3 vẫn mở] Q: Câu hỏi mở Q-1 và Q-3 còn không? → A: Còn; v3 không ảnh hưởng tới việc đổi cấp độ HSK hay trạng thái khi nhân bản giáo trình — giữ mở (§11). (source: assumption — kiểm tra lại theo brief v3)

### Session 2026-10-20 (v4)

Ghi chú: phiên này áp dụng brief v4 (V4-2, V4-3, V4-4). Số hiệu REQ/AC cũ giữ nguyên; AC-2.3, AC-9.6, AC-11.5, AC-11.6 được viết lại; thêm AC-2.4 và REQ-19 (AC-19.1 … AC-19.6). Các mục bị thay thế ở phiên trước được gắn "[thay thế 2026-10-20 v4]".

- Q: Q-1 — Có cho phép đổi cấp độ HSK của giáo trình đang được lớp sử dụng không? → A: "cho phép, chỉ cần edit nội dung mới của giáo trình, thì giáo trình sẽ update mới nhất cho các lớp đang dùng" (V4-4) — cho phép, chỉ có hộp xác nhận; mọi thay đổi của giáo trình hiện ngay ở mọi lớp dùng nó (AC-2.3, AC-2.4, NFR-4, M-19). Q-1 đóng. (source: stakeholder)
- Q: 005 Q-3 — Nội dung AI sau khi GV duyệt là Nháp hay Đã xuất bản? → A: "vẫn là nháp sau khi GV approve thì mới xuất bản", xác nhận lại: "Duyệt = xuất bản luôn" (V4-2) — trước khi duyệt, nội dung AI chỉ là bản nháp trong review của 010; bấm "Duyệt" một phần lưu các mục vào Bài ở Đã xuất bản; HV thấy khi Bài Đã xuất bản và phần không bị ẩn ở lớp (AC-11.5, AC-9.6, AC-19.6). (source: stakeholder)
- Q: 010 Q-7 — Duyệt một phần thì nối thêm hay thay thế nội dung cũ? → A: "khi duyệt thì thay thế nội dung cũ bằng bài mới hoàn toàn" (V4-3) — thay toàn bộ nội dung của phần: mục cũ chưa có dữ liệu học tập (mọi bước học, bộ bài tập chưa có lượt làm hay bài nộp) bị xóa; bộ bài tập cũ có dữ liệu học tập được lưu trữ theo REQ-18, giữ bài làm và điểm; hộp xác nhận nêu chính xác những gì bị xóa hoặc lưu trữ; giới hạn 30 mục chỉ tính nội dung mới (AC-11.5, AC-11.6, REQ-19, M-12 v4) — thay mục "nối thêm" của phiên 2026-10-20. (source: stakeholder)
- Q: Bộ bài tập cũ bị lưu trữ do thay thế nằm ở đâu trong phần? → A: Sau các mục mới, giữ thứ tự tương đối trước đó; "Khôi phục" đưa chúng về Đã xuất bản tại vị trí đó (AC-19.3, AC-18.4). (source: assumption — nội dung mới là nội dung chính của phần nên đứng đầu; vị trí cũ không còn ý nghĩa khi mọi mục khác đã bị thay)
- Q: Bộ bài tập cũ đã ở Lưu trữ trước khi duyệt thì sao? → A: Có dữ liệu học tập thì vẫn Lưu trữ (đặt sau các mục mới); chưa có dữ liệu học tập thì bị xóa như mọi mục cũ khác (AC-19.2, AC-19.3). (source: assumption — áp một quy tắc duy nhất "có dữ liệu thì giữ, không có thì xóa" cho mọi trạng thái)
- Q: Mục AI được duyệt nhưng chưa đạt điều kiện xuất bản thì sao? → A: Không thay đổi gì trong phần, review giữ nguyên kèm lý do của 004/005 — vì duyệt là xuất bản, không được để mục không hợp lệ tới HV (AC-19.4). (source: assumption — phương án thận trọng; khớp việc 005 kiểm tra hợp lệ lúc duyệt)
- Q: Nội dung của phần thay đổi (hoặc HV vừa bắt đầu làm một bộ cũ) trong lúc hộp xác nhận duyệt đang mở? → A: Không thay thế; hiện lại hộp xác nhận với danh sách mới để GV xác nhận lại — không bao giờ xóa một bộ vừa có dữ liệu học tập (AC-19.5). (source: assumption — cùng nguyên tắc với AC-12.6 và AC-17.4)
- Q: Duyệt thay thế có đổi trạng thái Bài hoặc thiết lập ẩn phần theo lớp không? → A: Không; Bài Nháp vẫn Nháp (HV chưa thấy cho tới khi xuất bản Bài), phần đang bị ẩn ở một lớp vẫn bị ẩn (AC-19.6). (source: assumption — V4-2 "HV see it when the Bài itself is published and the section isn't hidden in their class")
- [thay thế 2026-10-22 — nút thêm không bị vô hiệu và mục Lưu trữ không tính vào giới hạn (AC-7.9)] Q: Sau khi thay thế, phần có thể vượt 30 mục (mục mới + bộ Lưu trữ) không? → A: Có; khi đó nút thêm thủ công bị vô hiệu theo AC-7.9 (giới hạn tính cả mục Lưu trữ) cho tới khi phần còn dưới 30 mục (§8). (source: assumption — V4-3 "the 30-item limit applies to the new content only"; giữ nguyên AC-7.9 cho thêm thủ công)

### Session 2026-10-21 (v6)

Ghi chú: phiên này áp dụng brief v6 (V6-1, V6-3; V6-2 thuộc 010). Số hiệu REQ/AC cũ giữ nguyên; AC-6.1 … AC-6.4, AC-7.3 … AC-7.9, AC-8.2, AC-8.3, AC-11.2, AC-16.1, AC-16.3, AC-18.1, AC-18.3 được viết lại; thêm AC-6.5, AC-6.6, AC-7.10, AC-16.7 … AC-16.9. Các mục bị thay thế ở phiên trước được gắn "[thay thế 2026-10-21 v6]".

- [thay thế 2026-10-21 v10 — một phần: panel Thủ công có một nút "Soạn thủ công" mở T07 hai tab thay cho nút "Mở" tới T07 / T09 (AC-7.3, AC-7.5, AC-7.11 … AC-7.14)] Q: Soạn tay theo phần hoạt động thế nào? → A: "phần review giáo trình của manual cũng làm giống AI là review hết tất cả segment trong một section, nhưng để là giao diện (mặc định) web và có button chuyển view mobile" (V6-1) — panel Thủ công của T18 chỉ còn 2 phần, mỗi phần có tóm tắt theo trạng thái và nút "Mở" tới T07 "Soạn phần Bài học" hoặc T09 "Soạn phần Bài tập" (004 / 005); thêm, sửa, sắp xếp, xuất bản, lưu trữ và xóa từng mục diễn ra trong T07 / T09 (AC-7.3 … AC-7.8, AC-18.1, AC-18.3, M-20). (source: stakeholder)
- [thay thế 2026-10-22 — một phần: "Lên trên" / "Xuống dưới" đổi chỗ với mục liền kề trong thứ tự của phần, kể cả mục Lưu trữ đang ẩn (AC-6.5, AC-6.6)] [thay thế 2026-10-21 v10 — một phần: mục được sắp xếp trong tab Bài học / Bài tập của T07, không còn chế độ "Chỉnh sửa" (AC-6.5)] Q: Quy tắc sắp xếp của 002 được thực hiện ở đâu? → A: Bài: trên T06, giữ kéo-thả, bàn phím và menu (AC-6.1 … AC-6.3). Mục: trong chế độ "Chỉnh sửa" của T07 / T09 bằng "Lên" / "Xuống", đổi chỗ với mục liền kề đang hiển thị trong cùng phần, lưu ngay không chờ "Xong", thất bại thì hoàn lại (AC-6.4 … AC-6.6); thứ tự riêng của từng phần và việc không chuyển mục giữa hai phần giữ nguyên (REQ-8, M-9 v6). (source: assumption — brief V6-1 "reorder ▲▼" và yêu cầu giữ quy tắc sắp xếp; lưu ngay là mô hình lưu thứ tự hiện có của 002 (AC-6.1), áp vào phạm vi phần)
- [thay thế 2026-10-22 — một phần: không còn "lưu lần đầu"; thêm mục lưu ngay (AC-7.6, AC-7.10)] [thay thế 2026-10-21 v10 — một phần: không còn "Xong"; chuyển tab không lưu, không bỏ; cảnh báo rời T07 có số mục chưa lưu (AC-7.10, AC-7.12, AC-7.13)] Q: Mô hình lưu của 002 trong trình soạn phần là gì? → A: Mọi thao tác 002 sở hữu trong T07 / T09 — lưu lần đầu mục mới, sắp xếp, xuất bản, lưu trữ, khôi phục, xóa — có hiệu lực ngay khi GV thực hiện hoặc xác nhận, không chờ "Xong" và không bị hoàn tác khi bấm "Xong" hay rời màn hình; lưu nội dung từng trường, kiểm tra xung đột và cảnh báo thay đổi chưa lưu do 004 / 005 quy định; xung đột thứ tự / trạng thái theo AC-17.4 (AC-6.5, AC-7.10, M-20). (source: assumption — brief V6-1 "keep the module's current save model … state it explicitly"; nội dung soạn tay là nội dung thật, khác nội dung chờ duyệt của T20)
- [thay thế 2026-10-22 — một phần: mục được tạo và lưu ngay ở Nháp khi GV bấm thêm; AC-7.7 bị bỏ (AC-7.6)] Q: Mục mới được đặt ở đâu trong phần? → A: Ở cuối phần hoặc ngay sau mục GV chọn khi thêm, trạng thái Nháp, chỉ vào Bài sau lần lưu đầu; bỏ hoặc rời đi trước lần lưu đầu thì không thêm gì (AC-7.6, AC-7.7). (source: stakeholder — V6-1 "add a new segment at the end or after a given segment"; phần "chỉ vào Bài sau lần lưu đầu" là assumption — giữ quy tắc cũ)
- [thay thế 2026-10-21 v10 — một phần: không còn nút "Mở" của từng phần; tiêu điểm về nút "Soạn thủ công" (AC-7.3, AC-7.4, AC-7.8)] Q: Tóm tắt phần trên T18 gồm gì? → A: Tổng số mục và số mục theo trạng thái Đã xuất bản / Nháp / Lưu trữ (không nêu nhóm 0), thời điểm cập nhật gần nhất và nút "Mở"; phần trống hiển thị "Chưa có bước học nào" / "Chưa có bộ bài tập nào" kèm "Mở"; quay lại từ T07 / T09 thì tiêu điểm ở nút "Mở" của phần vừa soạn; không còn danh sách mục hay thao tác từng mục trên T18 (AC-7.3, AC-7.4, AC-7.8). (source: assumption — brief "summary (counts by status)"; mục Lưu trữ vẫn được đếm vì giới hạn 30 mục tính cả Lưu trữ (AC-7.9))
- [thay thế 2026-10-22 — một phần: mục Lưu trữ sửa được, không chỉ xem; "Lên trên" / "Xuống dưới" đổi chỗ cả với mục Lưu trữ đang ẩn (AC-18.3, AC-6.5, AC-6.6)] [thay thế 2026-10-21 v10 — một phần: hiển thị trong tab tương ứng của T07 qua công tắc "Hiện mục lưu trữ" (AC-18.3)] Q: Mục Lưu trữ hiển thị ở đâu khi T18 không còn danh sách mục? → A: Trong T07 / T09, mặc định ẩn, hiện khi GV bật, mang nhãn "Lưu trữ", chỉ xem; vẫn giữ vị trí và được tính trong tóm tắt; "Lên" / "Xuống" trong lúc mục Lưu trữ đang ẩn không làm đổi vị trí của chúng (AC-18.3, AC-6.6). (source: stakeholder — V6-1 "archived items are hidden by default, with a toggle"; giữ vị trí khi ẩn là assumption — để "Khôi phục" vẫn về đúng chỗ (AC-18.4))
- [thay thế 2026-10-21 v10 — một phần: T21 chỉ mở từ T06, xem trước cả Bài, không còn xem danh sách Bài hay mở từ T18 (AC-16.1, AC-16.10); công tắc "Web / Mobile" giữ nguyên] Q: (V6-3) T21 có dùng công tắc "Web / Mobile" không? → A: Có; T21 vẫn là xem trước cả Bài (từ T18) và danh sách Bài (từ T06), nhưng thay khung điện thoại cố định 390 px bằng công tắc "Web / Mobile" như T07 / T09 / T20: mặc định "Web", "Mobile" là khung 375 px (AC-16.1, AC-16.7, M-21). (source: assumption — brief cho 002 quyết định; một cách xem trước thống nhất trên mọi màn hình của GV, 375 px theo brief)
- [thay thế 2026-10-21 v10 — một phần: lựa chọn chỉ dùng chung giữa T20 và T21; T07 (cả tab T09) không có công tắc (AC-16.8)] Q: Lựa chọn "Web / Mobile" được nhớ thế nào? → A: Theo GV, trong phiên đăng nhập hiện tại, dùng chung giữa T07, T09, T20 và T21; phiên đăng nhập mới bắt đầu ở "Web"; chuyển chế độ không làm mất Bài / mục đang mở, lựa chọn đáp án đang thử và không ghi nhận dữ liệu (AC-16.8, AC-16.9). (source: assumption — brief "remembered per GV for the session (decide)"; dùng chung để GV đã chọn "Mobile" không phải chọn lại ở từng màn hình; cần 004, 005, 010 áp cùng quy tắc)
- [thay thế 2026-10-21 v10 — T07 không còn chế độ "Xem trước"; xem như HV chỉ có trên T21 cho cả Bài, mở từ T06 (AC-7.14, AC-16.10)] Q: Còn "Xem trước" từng mục trên T18 không? → A: Không; xem trước nội dung một phần dùng chế độ "Xem trước" của T07 / T09 (004 / 005), xem trước cả Bài dùng T21 (AC-16.3, §9). (source: assumption — T18 không còn danh sách mục; tránh ba cách xem trước chồng nhau)

### Session 2026-10-21 (v10)

Ghi chú: phiên này áp dụng brief v10 (V10-1, V10-2), thay thế trình soạn phần của v6 và đề xuất v9 cùng ngày (v9 chỉ bỏ công tắc "Web / Mobile" khỏi T07 và không có phiên riêng). Không đánh số lại; AC-6.5, AC-6.6, AC-7.3 … AC-7.10, AC-8.3, AC-11.2, AC-16.1 … AC-16.3, AC-16.6, AC-16.8, AC-17.3, AC-18.1, AC-18.3 được viết lại; thêm AC-7.11 … AC-7.14, AC-16.10. Các mục bị thay thế ở phiên trước được gắn "[thay thế 2026-10-21 v10]".

- Q: Soạn tay trên T18 và T07 thay đổi thế nào? → A: Bối cảnh (đề xuất v9): "ở phần Soạn phần Bài học chỉ cần giữ lại giao diện web bỏ mobile đi vì đã có phần xem trước như học viên rồi => thừa". Stakeholder (v10): "về soạn manual thì cũng gom bài học và bài tập edit chung 1 section như bên AI và sẽ không có mục view như học viên chi tiết từng mục. chức năng view như học viên chỉ có ngoài màn index list bài học bên ngoài và sẽ view hết như học viên hết bài học hoàn chỉnh gồm bài tập và bài học". Panel Thủ công của T18 chỉ còn tóm tắt hai phần và một nút "Soạn thủ công"; nút này mở T07 "Soạn bài thủ công" — một màn hình hai tab Bài học | Bài tập như T20, chỉ để chỉnh sửa, bố cục web; 002 sở hữu khung (phần đầu, tab, xuất bản Bài), 004 tab Bài học, 005 tab Bài tập (ID T09; đường dẫn T09 mở T07 ở tab này) — AC-7.3 … AC-7.5, AC-7.11 … AC-7.14, M-20. (source: stakeholder — V10-1, brief v10)
- Q: Xem như học viên ở đâu và xem những gì? → A: Chỉ trên T21, mở bằng thao tác "Xem như học viên" của từng Bài trên T06; T21 hiển thị cả Bài (phần Bài học như S11/S03, phần Bài tập như S05, làm thử được, không ghi nhận) với công tắc "Web / Mobile" mặc định "Web"; T18 và T07 không còn nút "Xem như học viên"; lựa chọn "Web / Mobile" dùng chung chỉ giữa T20 và T21 — AC-16.1, AC-16.3, AC-16.6, AC-16.8, AC-16.10, M-21. (source: stakeholder — V10-2, brief v10)
- Q: T21 có hiện mục Nháp không? → A: Mặc định chỉ hiện mục Đã xuất bản như HV thấy; công tắc "Gồm cả mục Nháp" (mặc định tắt mỗi lần mở T21) hiện thêm mục Nháp ở đúng vị trí kèm nhãn "Nháp" — AC-16.1, AC-16.2, M-14. (source: assumption — phương án brief v10 khuyến nghị; "view như học viên" nghĩa là đúng những gì HV thấy, nhưng GV vẫn cần kiểm tra mục chưa xuất bản trước khi xuất bản Bài)
- Q: Còn xem trước danh sách Bài của cả giáo trình trên T21 không? → A: Không; T21 nay xem trước một Bài hoàn chỉnh, mở từ thao tác của từng Bài trên T06 — AC-16.1, §9. (source: assumption — brief v10 "per-Bài action" và "previews the whole Bài"; danh sách Bài trên T06 đã cho GV thấy thứ tự và trạng thái)
- Q: Chuyển tab và rời T07 khi còn mục chưa lưu? → A: Chuyển tab không lưu, không bỏ, không hỏi; nhãn "Chưa lưu" giữ nguyên; rời T07 hỏi xác nhận kèm tổng số mục chưa lưu của cả hai tab — AC-7.12, AC-7.13. (source: stakeholder — brief v10 "switching tabs keeps unsaved items and does not save them; their labels stay" và "leave warning with a count")
- Q: Phần đầu của T07 gồm gì? → A: Đường dẫn về giáo trình, nút quay lại T18, tên Bài, trạng thái Bài, "Xuất bản bài" khi Bài còn Nháp và hai tab kèm số mục; nút thêm mục ("+ Thêm bước học" / "+ Thêm bộ bài tập") và số theo trạng thái thuộc từng tab (004 / 005) — AC-7.11. (source: stakeholder cho "header: counts by status, + Thêm… for the active tab, Bài publish" — brief v10; source: assumption cho việc đặt nút thêm và số theo trạng thái trong tab để mỗi module tự quản lý)

### Session 2026-10-22 (đồng bộ prototype)

Ghi chú: quyết định của stakeholder ngày 2026-10-22 — prototype `specs/screen-flow-design.html` là chuẩn cho câu chữ giao diện và cho hành vi mà nó thể hiện. Không đánh số lại REQ/AC.

- Q: T21 có cho trả lời thử và nộp không? → A: [sửa cùng ngày] T21 đang dùng của prototype (v10) cho GV chọn thử đáp án như "Xem trước" của T20 nhưng không có nút "Nộp bài", không chấm, không hiện đáp án; bản T21 cũ (câu hỏi chỉ đọc, nút nộp bị vô hiệu) không còn được dùng — 002 AC-16.5, 005 AC-18.6. (source: stakeholder "prototype là chuẩn")
- Q: Xóa giáo trình có cần gõ lại tên không? → A: Không; hộp xác nhận "Xóa giáo trình {tên}?" kèm "Sẽ xóa {N} bài cùng mọi mục. Thao tác không thể hoàn tác." và nút "Xóa giáo trình" như prototype (AC-13.1, M-7 — thay mục M-7 của phiên 2026-10-18 và 2026-10-19). (source: stakeholder "prototype là chuẩn")
- Q: Q-3 — Nhân bản cả giáo trình giữ trạng thái Bài và mục không? → A: Có, giữ nguyên trạng thái như bản gốc (prototype sao chép nguyên trạng thái), kèm thông báo "Đã nhân bản giáo trình"; nhân bản một Bài vẫn đưa mọi thứ về Nháp (AC-15.2, AC-14.2). Q-3 đóng. (source: stakeholder "prototype là chuẩn")
- Q: T21 trình bày cả Bài thế nào? → A: Hai tab "Bài học" | "Bài tập" kèm số mục, mở ở tab Bài học; mỗi tab hiển thị đầy đủ nội dung mọi mục ngay trên trang (không mở từng mục), câu hỏi chọn thử đáp án được; thanh công cụ ghi "Không ghi nhận lượt làm, bài nộp hay điểm"; phần không có mục hiện "Bài chưa có bước học nào đã xuất bản." / "Bài chưa có bộ bài tập nào đã xuất bản."; Bài Nháp có thông báo riêng; bỏ dải nhãn "Chế độ xem trước — học viên sẽ thấy như thế này" (AC-16.1, AC-16.3, AC-16.9, M-21). AC-16.5 giữ nguyên. (source: stakeholder "prototype là chuẩn")
- Q: Bài Đã xuất bản còn mục Nháp có thao tác "Xuất bản bài" không? → A: Có — trên T18 nút "Xuất bản bài" hiện khi Bài Nháp hoặc còn mục Nháp; trong T07 là "Xuất bản bài…" (Bài Nháp) hoặc "Xuất bản… ({k} Nháp)"; cùng hộp thoại "Xuất bản “{tên Bài}”" của AC-9.3 (AC-7.11, AC-9.3). (source: stakeholder "prototype là chuẩn")
- Q: Danh sách "Lớp sử dụng" trên T06 dẫn tới đâu? → A: Tab Nội dung của T04; khi chưa có lớp nào hiện "Chưa có lớp nào." (AC-4.4). (source: stakeholder "prototype là chuẩn")
- Q: Các thay đổi chỉ về câu chữ? → A: [sửa cùng ngày — phần AC-18.1 bị thay: lưu trữ trong T07 không còn hộp xác nhận, xem mục "Lưu trữ / Khôi phục" bên dưới] AC-18.1 (hộp xác nhận lưu trữ "Lưu trữ mục “{tên}”?" kèm "Học viên ở mọi lớp sẽ không thấy mục này nữa; dữ liệu và điểm được giữ lại.", thông báo "Đã lưu trữ — giữ vị trí trong phần (chỉ giáo viên thấy).") , AC-6.2 (nút "Lên trên" / "Xuống dưới" trên dòng Bài, "Lên đầu" / "Xuống cuối" trong menu) và AC-7.13 (hỏi khi rời T07: "Có {k} mục chưa lưu. Rời trang và bỏ các thay đổi này?", nút "Rời đi" / "Ở lại"). Các chuỗi prototype không mô phỏng (lỗi kiểm tra Mô tả / Ảnh bìa, lỗi mạng khi lưu thứ tự hay nhân bản, xung đột dữ liệu, lỗi duyệt AI) giữ nguyên theo spec. (source: stakeholder "prototype là chuẩn")
- Q: Mục mới trong T07 được lưu khi nào? → A: Ngay khi GV bấm "Thêm bước học", "Thêm bộ bài tập" hoặc "Thêm sau": mục được tạo ở Nháp (bước học một khối Văn bản trống, bộ bài tập một câu trắc nghiệm mẫu) và báo "Đã thêm … mới (Nháp) · Đã lưu"; bỏ quy tắc "chỉ vào Bài sau lần lưu đầu" — AC-7.6, AC-7.10, AC-8.2 viết lại, AC-7.7 bị bỏ (§9), M-20. (source: stakeholder "cứ sửa spec theo prototype")
- Q: Giới hạn 30 mục mỗi phần tính thế nào, đạt giới hạn thì sao? → A: Chỉ tính mục không ở trạng thái Lưu trữ; nút thêm luôn bật, bấm khi đã đủ thì báo "Mỗi bài có tối đa 30 bước học." / "Mỗi bài có tối đa 30 bộ bài tập." và không tạo mục — AC-7.9, M-1, §7, §8. (source: stakeholder "cứ sửa spec theo prototype")
- Q: Lưu trữ / Khôi phục một mục trong T07 có hỏi xác nhận không, mục Lưu trữ có sửa được không? → A: Không hỏi xác nhận: "Lưu trữ" có hiệu lực ngay ("Đã lưu trữ · Đã lưu"), bị vô hiệu kèm "Hãy lưu hoặc bỏ thay đổi trước khi lưu trữ" khi mục có thay đổi chưa lưu; "Khôi phục" đưa về Đã xuất bản ngay ("Đã khôi phục · Đã lưu"); mục Lưu trữ vẫn sửa và lưu được trong T07. Hộp xác nhận "Lưu trữ mục “{tên}”?" chỉ có trong mã cũ không còn dùng của T18 nên bị bỏ — AC-18.1, AC-18.3, AC-18.4 viết lại, thêm AC-18.5, M-15. (source: stakeholder "cứ sửa spec theo prototype")
- Q: Xuất bản một mục trong T07 có hỏi xác nhận không? → A: Không; "Xuất bản" lưu luôn thay đổi chưa lưu của mục và chuyển sang Đã xuất bản ("Đã xuất bản · Đã lưu lúc HH:mm"); mục chưa hoàn chỉnh báo "Không thể xuất bản — Chưa hoàn chỉnh: {lý do}" — AC-9.1, AC-9.2, M-10. Hộp thoại "Xuất bản bài" (AC-9.3) giữ nguyên. (source: stakeholder "cứ sửa spec theo prototype")
- Q: Xóa một mục trong T07 trông thế nào? → A: Hộp xác nhận Xóa “{tên mục}”? kèm "Thao tác có hiệu lực ngay và không hoàn tác được." và nút "Xóa", báo "Đã xóa · Đã lưu"; bộ bài tập có dữ liệu học tập không mở hộp xác nhận mà báo "Bộ bài tập đã có dữ liệu học tập nên không xóa được — hãy Lưu trữ." (không có nút "Lưu trữ" trong thông báo); không còn cảnh báo số lớp đang thấy mục — AC-12.1 … AC-12.3. (source: stakeholder "cứ sửa spec theo prototype")
- Q: "Lên trên" / "Xuống dưới" đổi chỗ với mục nào khi mục Lưu trữ đang ẩn? → A: Với mục liền kề trong thứ tự của phần, kể cả mục Lưu trữ đang ẩn; nút bị vô hiệu ở mục đầu / cuối của phần; thông báo "Đã chuyển tới vị trí {k}/{n} · Đã lưu" — AC-6.5, AC-6.6. (source: stakeholder "cứ sửa spec theo prototype")
- Q: Duyệt một phần AI có hơn 30 mục thì báo gì? → A: "Mỗi bài có tối đa 30 bước học. Hãy xóa bớt mục trong review rồi duyệt lại." (phần Bài học) hoặc "Mỗi bài có tối đa 30 bộ bài tập. Hãy xóa bớt mục trong review rồi duyệt lại." (phần Bài tập); không thay đổi gì trong phần — AC-11.6. (source: stakeholder "cứ sửa spec theo prototype")
