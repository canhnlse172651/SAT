---
id: 006
slug: exams
title: Exams
status: tasked
branch: feat/006-exams
created: 2026-10-18
updated: 2026-10-28
approved_by: “canh
node .sdd/scripts/sdd.mjs approve 006 --by “canh
approved_at: 2026-10-28
---

# Exams — Bài thi độc lập theo lịch, giao cho lớp

<!--
SPEC = WHAT the system must do and WHY. Never HOW: no frameworks, tables, endpoints, class names.
Audience: product owner, QA, and the agents downstream. Every statement must be testable.

Machine-checked format (sdd check):
- Requirement heading:  ### REQ-<n>: <title>
- Acceptance criterion: - AC-<n>.<m>: <EARS sentence>      (n = parent REQ number)
- Non-functional:       - NFR-<n>: <category>: <measurable target with a number>
- EARS keywords stay in ENGLISH UPPERCASE even when the prose is in another language:
    Ubiquitous  THE SYSTEM SHALL <response>
    Event       WHEN <trigger> THE SYSTEM SHALL <response>
    State       WHILE <state> THE SYSTEM SHALL <response>
    Unwanted    IF <condition> THEN THE SYSTEM SHALL <response>
    Optional    WHERE <feature is included> THE SYSTEM SHALL <response>
- Every unknown → [NEEDS CLARIFICATION: <specific question>]. Never guess silently.
- Frontmatter status changes ONLY through the CLI (sdd set-status / sdd approve).
-->

Bản trình bày chi tiết (luồng, quy tắc, màn hình, trạng thái): [spec.html](spec.html).

> **Cập nhật 2026-10-22 (stakeholder — bài thi độc lập):** module 006 trở lại MVP với mô hình mới. **Bài thi không còn là section thứ ba của mỗi Bài** và không gắn với Giáo trình: đây là một mục riêng trong workspace của GV (mục "Bài thi" trên thanh điều hướng). GV soạn tay bài thi bằng các dạng câu hỏi tự chấm của 005, **giao cho một hoặc nhiều lớp** và đặt **một lịch duy nhất** cho bài thi: giờ mở, thời lượng làm bài (phút), giờ đóng. Mọi HV của lớp được giao vào thi được trong khoảng mở; mỗi HV làm **một lần**, có đủ thời lượng tính từ lúc bấm bắt đầu nhưng không quá giờ đóng (nộp tự động lúc sớm hơn giữa bắt đầu + thời lượng và giờ đóng). Điểm 0–100 hiện ngay sau khi nộp; đáp án và giải thích chỉ hiện sau giờ đóng. Điểm bài thi là đầu vào của điểm xếp hạng (008: trung bình bài tập 30 % + trung bình bài thi 70 %). Toàn bộ REQ/AC được viết lại và đánh số lại; mô hình cũ (bài thi theo Bài, lịch theo lớp, nhiều lượt, chính sách công bố, phiên bản mới, ẩn theo lớp, ngoại lệ cho từng HV) bị bỏ — xem §9 và §12.

## 1. Summary

Giáo viên (GV) dạy tiếng Trung cần tổ chức bài kiểm tra có giờ cho các lớp của mình — "tạo bài thi, chọn lớp, đến giờ thì học viên vào thi" — và dùng kết quả để xếp hạng lớp; hiện GV phải thi trên giấy hoặc biểu mẫu rời, tự canh giờ, tự chấm và tự tổng hợp điểm. Module này cho GV soạn tay một **Bài thi** độc lập trong workspace (tên, hướng dẫn, câu hỏi tự chấm theo 005), giao bài thi cho một hoặc nhiều lớp và đặt một lịch chung gồm **giờ mở, thời lượng, giờ đóng**. Học viên (HV) của các lớp được giao thấy bài thi trong danh sách "Bài thi" với giờ mở, vào thi trong khoảng mở, làm bài trên điện thoại với đồng hồ đếm ngược, tự lưu, không mất bài khi mất mạng và được nộp tự động khi hết giờ; mỗi HV làm đúng **một lần**. Bài nộp được chấm ngay, HV thấy điểm 0–100 ngay sau khi nộp, còn đáp án và giải thích chỉ hiện sau giờ đóng để đề không bị lộ. GV theo dõi từng lớp: Đã nộp / Đang làm / Chưa làm, mở bài nộp chỉ đọc; điểm bài thi (hoặc 0 khi đã qua giờ đóng mà không nộp) được cung cấp cho 008 để tính 70 % điểm xếp hạng.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| GV tổ chức bài thi mà không cần công cụ ngoài | Thời gian trung vị để GV soạn bài thi 20 câu Trắc nghiệm, giao cho 2 lớp và lên lịch (kiểm thử khả dụng với 5 GV) | ≤ 20 phút |
| Thời gian thi công bằng | Tỷ lệ lượt làm được nộp tự động trong ≤ 60 giây sau thời điểm kết thúc của lượt (NFR-2) | 100 % |
| Không mất bài làm | Số câu trả lời đã hiển thị "Đã lưu" nhưng thiếu trong bài nộp (NFR-3) | 0 |
| Mỗi HV chỉ thi một lần | Số tổ hợp HV × bài thi có hơn một lượt làm hoặc hơn một bài nộp (30 ngày đầu vận hành) | 0 |
| HV biết điểm ngay | Thời gian từ khi xác nhận nộp tới khi thấy điểm trên S08 (NFR-6) | p95 ≤ 2 giây |
| Đề thi không bị lộ | Số lần nội dung câu hỏi tới thiết bị HV ngoài lượt đang làm, hoặc đáp án / giải thích tới thiết bị HV trước mốc công bố (NFR-7) | 0 |
| Xếp hạng có dữ liệu bài thi đúng hạn | Tỷ lệ HV được tính của bài thi đã đóng có kết quả (Đã nộp hoặc Không làm bài) cung cấp cho 008 trong ≤ 60 giây sau giờ đóng | 100 % |

## 3. Actors & Context

- **Giáo viên (GV)** — chủ duy nhất của workspace (D1), làm việc trên máy tính ≥ 1280 px. Mở mục "Bài thi" (T10) để xem mọi bài thi; soạn bài thi, chọn lớp được giao và đặt lịch trên T22 "Soạn bài thi"; theo dõi kết quả theo từng lớp trên T16 và mở bài nộp chỉ đọc trên T14 (005). Hiện nay: đề giấy / biểu mẫu rời, canh giờ thủ công, tổng hợp điểm bằng bảng tính.
- **Học viên (HV)** — tài khoản do GV tạo và kích hoạt qua email (001), dùng điện thoại 360–430 px là chính. Mở mục "Bài thi" (S07) để xem các bài thi của lớp mình kèm giờ mở, vào sảnh, bắt đầu, làm bài và xem kết quả trên S08. Có thể thuộc nhiều lớp của cùng GV; một bài thi giao cho nhiều lớp mà HV cùng thuộc vẫn chỉ được làm một lần.
- **Đồng hồ hệ thống** — tác nhân thời gian: mở và đóng bài thi theo lịch, nộp tự động khi hết giờ, ghi nhận "Không làm bài" khi đóng, công bố đáp án sau khi đóng. Mọi mốc thời gian theo đồng hồ hệ thống (không theo đồng hồ thiết bị), hiển thị theo giờ Việt Nam (UTC+7).
- **Module liên quan** — 001 (tài khoản, đăng nhập, khóa tài khoản, A05), 003 (lớp, thành viên, trạng thái lớp Sắp bắt đầu / Đang học / Đã kết thúc), 005 (dạng câu hỏi, trình soạn câu hỏi, quy tắc chấm, cách trình bày S05 / S06, T14), 008 (điểm xếp hạng: trung bình bài tập 30 % + trung bình bài thi 70 %), 009 (dashboard — có thể dùng kết quả bài thi). 007 (chấm tay) vẫn hoãn; 002, 004, 010 không liên quan tới bài thi.

## 4. User Stories

- US-1 (P1): Là GV, tôi muốn soạn tay một bài thi (tên, hướng dẫn, câu hỏi tự chấm), giao cho một hoặc nhiều lớp và đặt giờ mở, thời lượng, giờ đóng rồi lên lịch, để mọi HV của các lớp đó thi cùng một đề trong cùng khoảng thời gian.
  - Why this priority: không có bài thi đã lên lịch thì không có gì để thi; là điều kiện cho mọi câu chuyện còn lại.
  - Independent test: trên T10 bấm "Tạo bài thi" → T22; nhập tên, 3 câu (Trắc nghiệm, Nối cặp, Viết chữ Hán theo pinyin), chọn lớp A và lớp B, giờ mở 20:00 ngày mai, thời lượng 45 phút, giờ đóng 22:00 ngày mai, bấm "Lên lịch" → trạng thái "Đã lên lịch", T10 hiển thị dòng bài thi với 2 lớp; thử lên lịch một bài thi chưa chọn lớp → bị chặn kèm danh sách điều kiện chưa đạt.
- US-2 (P1): Là HV, tôi muốn thấy bài thi của lớp mình với giờ mở và đếm ngược, vào thi khi tới giờ, xem sảnh (thời lượng, số câu) và xác nhận bắt đầu, để biết khi nào thi và bắt đầu đúng lúc.
  - Why this priority: lối vào duy nhất của HV tới bài thi.
  - Independent test: HV lớp A mở S07 lúc 19:59 thấy "Mở lúc 20:00 …" với đếm ngược; lúc 20:00 dòng chuyển sang "Đang mở" và nút "Vào thi" trong ≤ 5 giây mà không tải lại; "Vào thi" → sảnh hiển thị 3 câu, 45 phút, giờ đóng 22:00 và không có câu hỏi nào; "Bắt đầu làm bài" → S08 tại câu 1 với đồng hồ 45:00.
- US-3 (P1): Là HV, tôi muốn làm bài với đồng hồ đếm ngược, được tự lưu, tiếp tục được sau khi mất mạng, đóng trang hoặc đổi thiết bị, rồi nộp bài hoặc được nộp tự động khi hết giờ, để kết quả công bằng và tôi không mất công sức.
  - Why this priority: giá trị cốt lõi của module; HV dùng mạng di động.
  - Independent test: HV bắt đầu lúc 21:40 (giờ đóng 22:00) → sảnh cảnh báo chỉ còn 20 phút, đồng hồ 20:00; trả lời 2 câu, đóng trình duyệt, đăng nhập trên thiết bị khác lúc 21:45 → cùng lượt, 2 câu đã lưu, còn khoảng 15 phút; để hết giờ → bài được nộp tự động lúc 22:00 với nhãn "Nộp tự động" dù không thiết bị nào đang mở.
- US-4 (P1): Là HV, tôi muốn thấy điểm 0–100 ngay sau khi nộp và xem đáp án, giải thích từng câu sau khi bài thi đóng, để biết kết quả ngay mà đề không bị lộ cho bạn đang thi.
  - Why this priority: stakeholder yêu cầu điểm hiện ngay, đáp án chỉ sau giờ đóng.
  - Independent test: HV nộp lúc 20:30 → S08 hiển thị "80/100" và "Đáp án và giải thích sẽ hiển thị sau khi bài thi đóng lúc 22:00 …", không có kết quả từng câu; sau 22:00 (khi mọi lượt đã nộp) → S08 hiển thị thêm mục "Từng câu · đáp án và giải thích".
- US-5 (P1): Là GV, tôi muốn xem kết quả của bài thi theo từng lớp được giao (Đã nộp kèm điểm và thời điểm, Đang làm, Chưa làm) và mở từng bài nộp ở chế độ chỉ đọc, để theo dõi buổi thi và đánh giá lớp.
  - Why this priority: GV cần biết ai đã thi, ai chưa, điểm bao nhiêu.
  - Independent test: lớp A có 4 HV (1 chưa làm, 1 đang làm, 2 đã nộp) → T16 chọn lớp A hiển thị đúng 4 trạng thái, số liệu "Đã nộp 2 · Đang làm 1 · Chưa làm 1" và điểm trung bình của 2 HV đã nộp; "Xem bài nộp" → T14 chỉ đọc; sau giờ đóng HV chưa làm hiển thị "Không làm bài · 0/100".
- US-6 (P1): Là GV, tôi muốn sửa bài thi sau khi lên lịch trong giới hạn an toàn (sửa tự do khi chưa ai làm, sau đó chỉ thêm lớp và lùi giờ đóng), xóa bài thi chưa ai làm và lưu trữ bài thi đã đóng, để điều chỉnh buổi thi mà không làm sai lệch hay mất bài làm của HV.
  - Why this priority: lịch và lớp thường thay đổi; dữ liệu bài nộp không bao giờ được mất (nguyên tắc sản phẩm).
  - Independent test: bài thi đang mở có 1 HV đã bắt đầu → T22 khóa câu hỏi, giờ mở, thời lượng; đổi giờ đóng sớm hơn → bị chặn; lùi giờ đóng 30 phút → đồng hồ của HV bị giới hạn bởi giờ đóng cũ tăng thêm trong ≤ 10 giây; "Xóa" → bị chặn; sau giờ đóng "Lưu trữ" → bài thi biến khỏi T10 và S07, điểm vẫn được cung cấp cho 008.
- US-7 (P2): Là GV, tôi muốn nhân bản một bài thi thành bản Nháp (giữ đề, bỏ lớp và lịch), để dùng lại đề cho lớp khác vào thời điểm khác.
  - Why this priority: mỗi bài thi chỉ có một lịch; nhân bản là cách dùng lại đề với lịch khác. Có cách tạm (soạn lại) nên không chặn MVP.
  - Independent test: nhân bản bài thi "Kiểm tra HSK2 giữa kỳ" đã đóng → T22 mở bản "Kiểm tra HSK2 giữa kỳ (bản sao)" ở trạng thái Nháp, đủ câu hỏi, đáp án, giải thích, thời lượng; không có lớp, giờ mở, giờ đóng hay bài nộp nào.
- US-8 (P1): Là GV, tôi muốn điểm bài thi của mỗi HV — điểm của bài nộp, hoặc 0 khi đã qua giờ đóng mà HV không nộp — được ghi nhận cho từng lớp được giao, để bảng xếp hạng lớp (008) tính phần bài thi (70 %) đúng và kịp thời.
  - Why this priority: stakeholder đặt bài thi chiếm 70 % điểm xếp hạng.
  - Independent test: HV X thuộc lớp A và B (cả hai được giao) nộp được 85 → 008 nhận kết quả "Đã nộp · 85" của X ở cả lớp A và lớp B; HV Y lớp A không làm → trong ≤ 60 giây sau giờ đóng 008 nhận "Không làm bài · 0" của Y ở lớp A; HV Z vào lớp A sau giờ đóng → không có kết quả của bài thi này.

## 5. Functional Requirements

### REQ-1: Teacher exam list — Danh sách bài thi (T10)

<!-- Story: US-1, US-5, US-6 · Priority: P1 · Screen: T10 -->

- AC-1.1: WHEN GV chọn mục "Bài thi" trên thanh điều hướng của GV THE SYSTEM SHALL mở T10 "Danh sách bài thi" liệt kê mọi bài thi không ở trạng thái "Lưu trữ" của workspace, mỗi dòng gồm tên, tên các lớp được giao, giờ mở, thời lượng (phút), giờ đóng, trạng thái và số HV đã nộp trên tổng số HV dự thi dạng "<đã nộp>/<tổng>", cùng nút "Tạo bài thi".
- AC-1.2: THE SYSTEM SHALL sắp xếp T10 theo nhóm trạng thái "Đang mở" → "Đã lên lịch" → "Nháp" → "Đã đóng", trong đó nhóm "Đang mở" và "Đã lên lịch" theo giờ mở sớm nhất trước, nhóm "Nháp" theo thời điểm lưu gần nhất trước và nhóm "Đã đóng" theo giờ đóng gần nhất trước.
- AC-1.3: WHEN GV chọn bộ lọc trạng thái ("Tất cả", "Nháp", "Đã lên lịch", "Đang mở", "Đã đóng") hoặc nhập từ khóa trên T10 THE SYSTEM SHALL chỉ hiển thị các bài thi khớp cả hai điều kiện (tên chứa từ khóa, không phân biệt chữ hoa/thường và dấu tiếng Việt) và hiển thị "Không có bài thi phù hợp" khi không có bài thi nào khớp.
- AC-1.4: WHILE workspace chưa có bài thi nào không ở trạng thái "Lưu trữ" THE SYSTEM SHALL hiển thị trên T10 "Chưa có bài thi nào" kèm nút "Tạo bài thi".
- AC-1.5: WHILE workspace có ít nhất một bài thi "Lưu trữ" THE SYSTEM SHALL hiển thị trên T10 công tắc "Hiện bài thi lưu trữ (<n>)" và, khi GV bật công tắc, hiển thị thêm các bài thi đó với nhãn "Lưu trữ" sau nhóm "Đã đóng".
- AC-1.6: WHEN GV chọn tên một bài thi trên T10 THE SYSTEM SHALL mở T22 "Soạn bài thi" của bài thi đó, và hiển thị trên mỗi dòng không ở trạng thái "Nháp" nút "Xem kết quả" mở T16 (AC-15.1).

### REQ-2: Exam editor — Soạn bài thi (T22)

<!-- Story: US-1 · Priority: P1 · Screen: T22 · Câu hỏi dùng trình soạn và quy tắc của 005 (REQ-2 … REQ-11, AC-12.3) -->

- AC-2.1: WHEN GV chọn "Tạo bài thi" trên T10 THE SYSTEM SHALL mở T22 với một bài thi mới chưa lưu gồm Tên trống, Hướng dẫn trống, chưa có câu hỏi, chưa có lớp được giao, Giờ mở, Thời lượng và Giờ đóng trống, và chỉ tạo bài thi ở trạng thái "Nháp" khi GV lưu lần đầu.
- AC-2.2: WHEN GV chọn "Lưu nháp" cho một bài thi "Nháp" THE SYSTEM SHALL lưu Tên (bắt buộc, 1–150 ký tự), Hướng dẫn (tùy chọn, tối đa 2.000 ký tự), danh sách câu hỏi (kể cả câu chưa hoàn chỉnh theo 005 AC-2.7), lớp được giao, Giờ mở, Thời lượng và Giờ đóng (được để trống) và hiển thị "Đã lưu lúc HH:mm".
- AC-2.3: IF khi GV lưu, Tên trống hoặc dài hơn 150 ký tự, Hướng dẫn dài hơn 2.000 ký tự, Thời lượng đã nhập không phải số nguyên từ 1 đến 300, hoặc một trường câu hỏi là "trường chưa hợp lệ" theo 005 AC-2.6 THEN THE SYSTEM SHALL không lưu bài thi và hiển thị thông báo lỗi cụ thể ngay dưới từng trường vi phạm.
- AC-2.4: WHEN GV thêm, sửa, xóa hoặc di chuyển câu hỏi trên T22 THE SYSTEM SHALL chỉ cho dùng các dạng câu hỏi tự chấm của 005 (Trắc nghiệm, Trắc nghiệm từ vựng – Chọn nghĩa, Chọn chữ Hán, Chọn pinyin, Điền chỗ trống, Nối cặp, Sắp xếp từ thành câu, Viết chữ Hán theo pinyin, Đọc hiểu) với cách soạn, đáp án, giải thích, điểm, kiểm tra tại chỗ và điều kiện hoàn chỉnh như định nghĩa trong 005 (REQ-2 … REQ-11), và đánh số câu liên tục từ 1 theo thứ tự hiển thị.
- AC-2.5: THE SYSTEM SHALL hiển thị thường trực trên T22 số câu hỏi và tổng điểm tối đa của bài thi, cập nhật ngay khi câu hỏi hoặc điểm thay đổi.
- AC-2.6: IF GV thêm câu hỏi khi bài thi đã có 100 câu hỏi THEN THE SYSTEM SHALL không thêm và hiển thị "Bài thi có tối đa 100 câu hỏi".
- AC-2.7: IF GV lưu bài thi trong khi bài thi đó đã được lưu thay đổi mới hơn từ một cửa sổ hoặc thiết bị khác sau khi T22 tải nó THEN THE SYSTEM SHALL không ghi đè, giữ nguyên nội dung GV đang soạn trên màn hình và hiển thị "Bài thi đã được thay đổi ở cửa sổ khác. Hãy tải lại để xem bản mới nhất."
- AC-2.8: IF GV rời T22 (chọn mục khác, đóng hoặc tải lại tab) khi còn thay đổi chưa lưu THEN THE SYSTEM SHALL hiển thị xác nhận "Bạn có thay đổi chưa lưu. Rời trang và bỏ thay đổi?" (khi đóng hoặc tải lại tab: cảnh báo rời trang của trình duyệt) và chỉ rời trang khi GV xác nhận.

### REQ-3: Assigned classes, schedule and scheduling — Lớp được giao, lịch thi và "Lên lịch"

<!-- Story: US-1 · Priority: P1 · Screen: T22, T10 · Một lịch cho mỗi bài thi, áp dụng cho mọi lớp được giao -->

- AC-3.1: WHEN GV mở ô "Lớp được giao" trên T22 THE SYSTEM SHALL liệt kê các lớp của workspace đang ở trạng thái Sắp bắt đầu hoặc Đang học (tên lớp, trạng thái, sĩ số), cho chọn nhiều lớp và không liệt kê lớp Đã kết thúc.
- AC-3.2: THE SYSTEM SHALL nhận Giờ mở và Giờ đóng là ngày giờ theo giờ Việt Nam (UTC+7) chính xác tới phút, nhận Thời lượng là số nguyên phút từ 1 đến 300, và hiển thị mọi thời điểm của bài thi, lượt làm và bài nộp dạng dd/MM/yyyy HH:mm theo giờ Việt Nam, không phụ thuộc múi giờ của thiết bị.
- AC-3.3: IF khi GV lên lịch hoặc lưu một bài thi không ở trạng thái "Nháp", Giờ đóng sớm hơn Giờ mở cộng Thời lượng, hoặc Giờ đóng không ở tương lai THEN THE SYSTEM SHALL không lưu và hiển thị dưới trường Giờ đóng tương ứng "Giờ đóng phải sau giờ mở ít nhất bằng thời lượng làm bài (<n> phút)." hoặc "Giờ đóng phải ở tương lai."
- AC-3.4: WHEN GV chọn "Lên lịch" cho một bài thi "Nháp" có Tên hợp lệ, từ 1 đến 100 câu hỏi và mọi câu hoàn chỉnh theo điều kiện của 005 (AC-12.3), ít nhất một lớp được giao, Giờ mở không sớm hơn phút hiện tại, Thời lượng và Giờ đóng hợp lệ theo AC-3.3 THE SYSTEM SHALL lưu bài thi, chuyển bài thi sang trạng thái theo AC-3.6, hiển thị "Đã lên lịch · mở lúc HH:mm dd/MM/yyyy" và hiển thị bài thi cho HV dự thi theo AC-7.1.
- AC-3.5: IF GV chọn "Lên lịch" khi bài thi chưa đạt một hoặc nhiều điều kiện ở AC-3.4 THEN THE SYSTEM SHALL giữ trạng thái "Nháp" và liệt kê từng điều kiện chưa đạt, mỗi mục dẫn tới trường hoặc câu hỏi cần sửa.
- AC-3.6: THE SYSTEM SHALL xác định trạng thái của một bài thi đã lên lịch và không ở "Lưu trữ" theo đồng hồ hệ thống mà không cần thao tác của GV: "Đã lên lịch" khi thời điểm hiện tại trước Giờ mở, "Đang mở" từ Giờ mở tới trước Giờ đóng, "Đã đóng" từ Giờ đóng.
- AC-3.7: WHEN GV lên lịch hoặc lưu lịch khi một lớp được giao ở trạng thái Sắp bắt đầu có ngày bắt đầu sau ngày của Giờ mở THE SYSTEM SHALL vẫn lưu và hiển thị cảnh báo "Lớp <tên lớp> bắt đầu ngày dd/MM/yyyy — học viên lớp này chỉ vào thi được từ ngày đó.", hoặc "Lớp <tên lớp> bắt đầu sau giờ đóng — học viên lớp này sẽ không làm được bài thi." khi ngày bắt đầu sau Giờ đóng.
- AC-3.8: WHEN GV chọn "Hủy lịch" cho một bài thi "Đã lên lịch" hoặc "Đang mở" chưa có lượt làm nào và xác nhận "Hủy lịch bài thi «<tên>»? Học viên sẽ không còn thấy bài thi này." THE SYSTEM SHALL chuyển bài thi về "Nháp", giữ nguyên nội dung, lớp được giao và lịch đã nhập, và không còn hiển thị bài thi cho HV.

### REQ-4: Locking the exam after the first attempt — Sửa bài thi trước và sau lượt làm đầu tiên

<!-- Story: US-6 · Priority: P1 · Screen: T22 · Đề khóa khi có HV bắt đầu làm bài (không phải khi xuất bản) -->

- AC-4.1: WHILE bài thi "Đã lên lịch" hoặc "Đang mở" chưa có lượt làm nào THE SYSTEM SHALL cho GV sửa mọi nội dung, lớp được giao và lịch trên T22 và lưu bằng "Lưu thay đổi" chỉ khi bài thi vẫn đạt mọi điều kiện của AC-3.4 (điều kiện Giờ mở không sớm hơn phút hiện tại chỉ xét khi Giờ mở bị đổi), nếu không thì không lưu và liệt kê điều kiện chưa đạt như AC-3.5.
- AC-4.2: WHILE bài thi đã có ít nhất một lượt làm THE SYSTEM SHALL không cho thêm, xóa, di chuyển hoặc sửa câu hỏi, đáp án, giải thích hay điểm, không cho đổi Giờ mở hay Thời lượng, và hiển thị trên T22 "Đề thi đã khóa vì đã có học viên bắt đầu làm bài. Chỉ sửa được tên, hướng dẫn, lớp được giao và lùi giờ đóng."
- AC-4.3: IF GV lưu thay đổi câu hỏi, Giờ mở hoặc Thời lượng khi bài thi đã có lượt làm đầu tiên sau lúc T22 tải bài thi THEN THE SYSTEM SHALL không lưu các thay đổi đó, giữ nguyên nội dung GV đang soạn trên màn hình và hiển thị "Đề thi vừa bị khóa vì học viên đã bắt đầu làm bài. Thay đổi câu hỏi và lịch không được lưu."
- AC-4.4: WHILE bài thi ở trạng thái "Đã đóng" THE SYSTEM SHALL chỉ cho sửa Tên và Hướng dẫn, không cho đổi câu hỏi, lớp được giao, Giờ mở, Thời lượng hay Giờ đóng, và hiển thị trên T22 "Bài thi đã đóng — không thể đổi đề, lớp được giao hoặc lịch."

### REQ-5: Changing classes and close time of a running exam — Đổi lớp được giao và giờ đóng khi đã có lượt làm

<!-- Story: US-6 · Priority: P1 · Screen: T22, S07, S08 -->

- AC-5.1: IF GV đổi Giờ đóng của một bài thi đã có lượt làm sang thời điểm sớm hơn Giờ đóng hiện tại THEN THE SYSTEM SHALL không lưu và hiển thị "Khi đã có học viên làm bài, chỉ có thể lùi giờ đóng muộn hơn."
- AC-5.2: WHEN GV lưu Giờ đóng muộn hơn cho một bài thi "Đang mở" THE SYSTEM SHALL tính lại thời điểm kết thúc của mỗi lượt đang làm bằng thời điểm sớm hơn giữa (thời điểm bắt đầu của lượt + Thời lượng) và Giờ đóng mới, và hiển thị thời gian còn lại mới trên đồng hồ của HV đang làm trong vòng 10 giây.
- AC-5.3: WHEN GV thêm một lớp vào bài thi chưa ở trạng thái "Đã đóng" THE SYSTEM SHALL hiển thị bài thi cho HV dự thi của lớp đó theo AC-7.1 và cho họ vào thi trong khoảng mở như mọi HV dự thi khác.
- AC-5.4: IF GV bỏ một lớp khỏi bài thi khi có ít nhất một HV hiện thuộc lớp đó đã có lượt làm của bài thi THEN THE SYSTEM SHALL không bỏ lớp và hiển thị "Không thể bỏ lớp <tên lớp> vì đã có học viên của lớp làm bài thi này."
- AC-5.5: WHEN GV bỏ một lớp không có HV nào đã có lượt làm khỏi bài thi THE SYSTEM SHALL không còn hiển thị bài thi cho HV của lớp đó, trừ HV còn thuộc một lớp được giao khác.

### REQ-6: Delete, archive, restore and duplicate — Xóa, lưu trữ, khôi phục, nhân bản bài thi

<!-- Story: US-6, US-7 · Priority: P1 (AC-6.6: P2) · Screen: T10, T22 · Không bao giờ mất bài nộp: bài thi có lượt làm chỉ được lưu trữ -->

- AC-6.1: WHEN GV chọn "Xóa" cho một bài thi chưa có lượt làm nào và xác nhận "Xóa bài thi «<tên>»? Thao tác không hoàn tác được." THE SYSTEM SHALL xóa bài thi, không còn hiển thị bài thi cho HV nào, đưa GV về T10 và hiển thị "Đã xóa bài thi".
- AC-6.2: IF GV chọn "Xóa" (hoặc xác nhận xóa) khi bài thi đã có ít nhất một lượt làm, kể cả lượt bắt đầu sau lúc mở hộp xác nhận THEN THE SYSTEM SHALL không xóa và hiển thị "Bài thi đã có học viên làm bài nên không xóa được — hãy Lưu trữ sau khi bài thi đóng."
- AC-6.3: WHEN GV chọn "Lưu trữ" cho một bài thi "Đã đóng" THE SYSTEM SHALL ngay lập tức chuyển bài thi sang "Lưu trữ", ẩn bài thi khỏi T10 (trừ khi bật công tắc của AC-1.5), không hiển thị bài thi và kết quả của nó cho HV trên S07, S08, và giữ nguyên mọi lượt làm, bài nộp, điểm bài thi và kết quả đã cung cấp cho 008, 009.
- AC-6.4: THE SYSTEM SHALL chỉ cung cấp thao tác "Lưu trữ" cho bài thi ở trạng thái "Đã đóng".
- AC-6.5: WHEN GV chọn "Khôi phục" cho một bài thi "Lưu trữ" THE SYSTEM SHALL ngay lập tức chuyển bài thi về "Đã đóng" và hiển thị lại bài thi cùng kết quả cho HV dự thi như trước khi lưu trữ.
- AC-6.6: WHEN GV chọn "Nhân bản" cho một bài thi THE SYSTEM SHALL tạo một bài thi mới ở trạng thái "Nháp" tên "<tên gốc> (bản sao)" (cắt còn 150 ký tự), sao chép Hướng dẫn, mọi câu hỏi, đáp án, giải thích, điểm và Thời lượng, không sao chép lớp được giao, Giờ mở, Giờ đóng, lượt làm hay bài nộp, và mở T22 của bản sao.

### REQ-7: Student exam list — Danh sách bài thi của học viên (S07)

<!-- Story: US-2 · Priority: P1 · Screen: S07 -->

- AC-7.1: THE SYSTEM SHALL cho một HV thấy một bài thi khi và chỉ khi bài thi ở trạng thái "Đã lên lịch", "Đang mở" hoặc "Đã đóng" và HV là thành viên hiện tại của ít nhất một lớp được giao của bài thi mà lớp đó không ở trạng thái Sắp bắt đầu.
- AC-7.2: WHEN HV chọn mục "Bài thi" trên thanh điều hướng của HV THE SYSTEM SHALL mở S07 liệt kê mọi bài thi HV thấy được theo AC-7.1, mỗi bài thi đúng một dòng kể cả khi HV thuộc nhiều lớp được giao, gồm tên, tên các lớp được giao mà HV thuộc, số câu hỏi, Thời lượng, dòng trạng thái và nút theo AC-7.3.
- AC-7.3: THE SYSTEM SHALL hiển thị cho mỗi bài thi trên S07 đúng một trạng thái của HV, xét theo thứ tự ưu tiên: "Đã nộp · <điểm>/100" kèm nút "Xem kết quả" khi HV có bài nộp; "Đang làm · còn <thời gian còn lại>" kèm nút "Tiếp tục làm bài" khi HV có lượt đang làm; "Đã đóng · Không làm bài" kèm nút "Xem kết quả" khi HV có kết quả "Không làm bài" (AC-13.3); "Đã đóng" khi đã qua Giờ đóng; "Mở lúc HH:mm dd/MM/yyyy" khi chưa tới Giờ mở; "Lớp đã kết thúc — không thể vào thi." khi không lớp được giao nào mà HV thuộc đang ở trạng thái Đang học; còn lại "Đang mở · đóng lúc HH:mm dd/MM/yyyy" kèm nút "Vào thi".
- AC-7.4: THE SYSTEM SHALL sắp xếp S07 theo nhóm: bài thi HV đang làm, bài thi đang mở mà HV chưa làm (Giờ đóng sớm nhất trước), bài thi chưa mở (Giờ mở sớm nhất trước), rồi các bài thi còn lại (Giờ đóng gần nhất trước).
- AC-7.5: WHILE còn dưới 24 giờ tới Giờ mở của một bài thi "Đã lên lịch" THE SYSTEM SHALL hiển thị trên dòng của bài thi đó trên S07 đồng hồ đếm ngược "Mở sau hh:mm:ss" theo đồng hồ hệ thống.
- AC-7.6: WHEN tới Giờ mở hoặc Giờ đóng của một bài thi trong khi HV đang mở S07 THE SYSTEM SHALL cập nhật dòng của bài thi đó sang trạng thái mới theo AC-7.3 (kèm hoặc bỏ nút "Vào thi") trong vòng 5 giây mà HV không cần tải lại trang.
- AC-7.7: WHILE HV không thấy bài thi nào theo AC-7.1 THE SYSTEM SHALL hiển thị trên S07 "Chưa có bài thi nào."
- AC-7.8: WHEN HV được thêm vào một lớp được giao (003) khi bài thi đang ở trạng thái "Đã lên lịch" hoặc "Đang mở" THE SYSTEM SHALL hiển thị bài thi trên S07 của HV từ lần mở tiếp theo và cho HV vào thi trong khoảng mở như mọi HV dự thi khác.

### REQ-8: Lobby and start — Sảnh và bắt đầu làm bài (S07)

<!-- Story: US-2 · Priority: P1 · Screen: S07, S08 · Một lượt làm cho mỗi HV mỗi bài thi -->

- AC-8.1: WHEN HV chọn "Vào thi" THE SYSTEM SHALL hiển thị sảnh của bài thi trên S07 gồm tên, hướng dẫn, số câu hỏi, Thời lượng, Giờ đóng, các dòng "Bạn chỉ được làm bài thi này một lần." và "Đồng hồ chạy liên tục kể cả khi bạn thoát ra hoặc mất kết nối.", nút "Bắt đầu làm bài" và "Quay lại", và không hiển thị nội dung câu hỏi nào.
- AC-8.2: IF thời gian từ lúc sảnh được hiển thị tới Giờ đóng ngắn hơn Thời lượng THEN THE SYSTEM SHALL hiển thị thêm trên sảnh cảnh báo "Bài thi đóng lúc HH:mm — bạn chỉ còn <N> phút để làm bài." với N là số phút còn lại làm tròn xuống.
- AC-8.3: WHEN HV chọn "Bắt đầu làm bài" khi được phép bắt đầu THE SYSTEM SHALL tạo lượt làm duy nhất của HV cho bài thi, ghi thời điểm bắt đầu theo đồng hồ hệ thống, đặt thời điểm kết thúc của lượt bằng thời điểm sớm hơn giữa (thời điểm bắt đầu + Thời lượng) và Giờ đóng, và mở S08 tại câu 1 với đồng hồ đếm ngược.
- AC-8.4: IF HV chọn "Vào thi" hoặc "Bắt đầu làm bài" khi không còn được bắt đầu — chưa tới Giờ mở, đã qua Giờ đóng, HV đã có lượt làm hoặc bài nộp, không lớp được giao nào mà HV thuộc đang ở trạng thái Đang học, hoặc bài thi không còn hiển thị với HV theo AC-7.1 THEN THE SYSTEM SHALL không tạo lượt làm mới và hiển thị tình trạng hiện tại: mở lượt đang làm nếu có, S07 với trạng thái mới, hoặc A05 "Không tìm thấy nội dung" khi bài thi không còn hiển thị với HV.
- AC-8.5: IF HV chọn "Bắt đầu làm bài" nhiều lần hoặc gần như đồng thời từ hai thẻ hay thiết bị THEN THE SYSTEM SHALL tạo đúng một lượt làm và mở cùng lượt đó ở các nơi (quyền làm bài theo AC-10.4).
- AC-8.6: THE SYSTEM SHALL tính lượt làm là đã dùng ngay khi được tạo, kể cả khi HV chưa trả lời câu nào hay rời bài thi ngay sau đó.

### REQ-9: Taking a timed exam — Làm bài có giới hạn thời gian (S08)

<!-- Story: US-3 · Priority: P1 · Screen: S08 · Trình bày và cách trả lời từng dạng câu như S05 của 005 -->

- AC-9.1: WHILE HV đang làm bài THE SYSTEM SHALL hiển thị thường trực đồng hồ đếm ngược thời gian còn lại tới thời điểm kết thúc của lượt, dạng mm:ss khi còn dưới 60 phút và h:mm:ss khi còn từ 60 phút trở lên, tính theo đồng hồ hệ thống chứ không theo đồng hồ của thiết bị.
- AC-9.2: WHILE HV đang làm bài THE SYSTEM SHALL hiển thị từng câu một kèm "Câu <n>/<tổng>", nút "Câu trước" / "Câu sau" và bảng số câu chuyển được tới câu bất kỳ (phân biệt câu đã hoàn thành, trả lời một phần và chưa trả lời theo 005 AC-14.3), cho trả lời mọi dạng câu như trên S05 của 005, và không hiển thị đáp án đúng, giải thích hay kết quả của câu nào.
- AC-9.3: WHEN HV thay đổi một câu trả lời THE SYSTEM SHALL tự động lưu câu trả lời trong vòng 3 giây sau thay đổi cuối cùng, hiển thị "Đang lưu…" trong khi lưu và "Đã lưu lúc HH:mm:ss" khi hệ thống đã ghi nhận.
- AC-9.4: WHEN thời gian còn lại của lượt làm chạm mốc 5 phút hoặc mốc 1 phút THE SYSTEM SHALL hiển thị cảnh báo không chặn thao tác "Còn 5 phút" hoặc "Còn 1 phút", mỗi mốc một lần, và bỏ qua mốc đã qua tại lúc lượt làm bắt đầu.
- AC-9.5: THE SYSTEM SHALL trình bày các câu hỏi cho mọi HV theo cùng thứ tự GV đã soạn, và tạo thứ tự hiển thị các mục của câu Nối cặp và các mảnh của câu Sắp xếp từ thành câu theo quy tắc của 005 một lần cho mỗi lượt làm, giữ nguyên thứ tự đó khi HV tiếp tục lượt.

### REQ-10: Connection loss, reload and device switch — Mất kết nối, tải lại và đổi thiết bị (S08)

<!-- Story: US-3 · Priority: P1 · Screen: S08 -->

- AC-10.1: WHILE thiết bị của HV mất kết nối trong lúc làm bài THE SYSTEM SHALL hiển thị cảnh báo "Mất kết nối — đồng hồ vẫn chạy. Câu trả lời chưa lưu sẽ không được tính nếu không kết nối lại trước khi hết giờ." kèm số câu chưa lưu, và vẫn cho HV xem các câu đã tải và nhập câu trả lời.
- AC-10.2: WHEN thiết bị kết nối lại chậm nhất 10 giây sau thời điểm kết thúc của lượt làm THE SYSTEM SHALL tự động gửi các câu trả lời chưa lưu, hiển thị "Đã lưu lúc HH:mm:ss" và ẩn cảnh báo mất kết nối.
- AC-10.3: WHEN HV mở lại bài thi (tải lại trang, mở lại trình duyệt, đăng nhập trên thiết bị khác hoặc đăng nhập lại sau khi hết phiên) trước thời điểm kết thúc của lượt đang làm THE SYSTEM SHALL tiếp tục chính lượt đó với mọi câu trả lời đã lưu và thứ tự đã tạo cho lượt, mở tại câu HV xem gần nhất, với thời gian còn lại bằng thời điểm kết thúc trừ thời điểm hiện tại.
- AC-10.4: WHEN cùng một lượt làm được mở ở thiết bị hoặc thẻ trình duyệt thứ hai THE SYSTEM SHALL chuyển quyền làm bài sang nơi mở sau cùng, còn nơi mở trước hiển thị "Bài thi đang được làm ở thiết bị hoặc cửa sổ khác" và không ghi nhận thêm câu trả lời từ đó.
- AC-10.5: IF HV rời hoặc đóng trang khi còn câu trả lời chưa được lưu THEN THE SYSTEM SHALL cảnh báo "Một số câu trả lời chưa được lưu. Rời trang có thể làm mất chúng." trước khi rời trang.

### REQ-11: Submitting — Nộp bài

<!-- Story: US-3 · Priority: P1 · Screen: S08 -->

- AC-11.1: WHEN HV chọn "Nộp bài" THE SYSTEM SHALL hiển thị hộp xác nhận nêu số câu chưa hoàn thành kèm số thứ tự của chúng (hoặc "Bạn đã hoàn thành tất cả câu hỏi"), dòng "Sau khi nộp bạn không thể làm lại." và hai nút "Nộp bài" và "Làm tiếp".
- AC-11.2: WHEN HV xác nhận nộp THE SYSTEM SHALL ghi nhận bài nộp gồm các câu trả lời đã lưu, thời điểm nộp và thời gian làm bài (thời điểm nộp trừ thời điểm bắt đầu), khóa mọi câu trả lời của lượt và hiển thị kết quả trên S08 (AC-14.1), kể cả khi HV chưa trả lời câu nào.
- AC-11.3: IF HV nộp thủ công cùng lúc với lúc hệ thống nộp tự động, gửi nộp nhiều lần, hoặc nộp từ hai thiết bị gần như đồng thời THEN THE SYSTEM SHALL ghi nhận đúng một bài nộp cho lượt làm và đưa HV tới kết quả của bài nộp đó.
- AC-11.4: IF việc nộp không hoàn tất do mất kết nối THEN THE SYSTEM SHALL giữ nguyên bài làm trên màn hình, hiển thị "Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại." kèm nút "Thử lại", và khi lượt đã được nộp tự động trước lúc thử lại thì hiển thị bài nộp tự động đó theo AC-12.3.

### REQ-12: Auto-submit and class changes during an attempt — Nộp tự động và thay đổi lớp khi đang làm

<!-- Story: US-3 · Priority: P1 · Screen: S08 -->

- AC-12.1: WHEN tới thời điểm kết thúc của một lượt làm chưa nộp THE SYSTEM SHALL tự động nộp lượt đó với các câu trả lời hệ thống đã ghi nhận trong vòng 60 giây, kể cả khi HV đã đóng trình duyệt, mất kết nối, bị khóa tài khoản hoặc bị gỡ khỏi lớp, và gắn nhãn "Nộp tự động" cho bài nộp.
- AC-12.2: THE SYSTEM SHALL ghi nhận vào bài nộp mọi câu trả lời tới hệ thống chậm nhất 10 giây sau thời điểm kết thúc của lượt làm và không ghi nhận câu trả lời tới sau mốc đó.
- AC-12.3: WHEN lượt làm được nộp tự động trong khi HV đang mở bài, hoặc HV mở lại bài thi sau khi lượt đã được nộp tự động THE SYSTEM SHALL khóa mọi ô trả lời và hiển thị "Hết giờ — bài thi đã được nộp tự động lúc HH:mm" kèm nút "Xem kết quả".
- AC-12.4: WHEN một lớp được giao chuyển sang Đã kết thúc (003) trong khi HV của lớp có lượt làm chưa nộp THE SYSTEM SHALL cho lượt đó tiếp tục và ghi nhận câu trả lời tới khi HV nộp hoặc tới khi lượt được nộp tự động theo AC-12.1.
- AC-12.5: IF HV bị gỡ khỏi mọi lớp được giao mà HV thuộc trong khi có lượt làm chưa nộp THEN THE SYSTEM SHALL không ghi nhận thêm câu trả lời, hiển thị "Bạn không còn thuộc lớp được giao bài thi này. Câu trả lời đã lưu sẽ được nộp tự động khi hết giờ." và nộp tự động lượt đó theo AC-12.1.

### REQ-13: Auto-grading, exam score and results for ranking — Chấm tự động, điểm bài thi, kết quả cho 008 và 009

<!-- Story: US-4, US-8 · Priority: P1 · Công thức 30 % / 70 % do 008 sở hữu; 006 cung cấp điểm bài thi theo HV × lớp -->

- AC-13.1: WHEN một bài nộp được ghi nhận (thủ công hoặc tự động) THE SYSTEM SHALL chấm ngay mọi câu theo quy tắc chấm của dạng câu trong 005 (kể cả điểm một phần), cho 0 điểm mọi câu, câu hỏi con, chỗ trống hoặc cặp chưa trả lời, mà không cần GV chấm.
- AC-13.2: THE SYSTEM SHALL tính điểm bài thi của một bài nộp bằng (điểm đạt ÷ tổng điểm tối đa của bài thi) × 100, làm tròn đến số nguyên gần nhất (phần lẻ từ 0,5 làm tròn lên), trong khoảng 0–100.
- AC-13.3: WHEN bài thi chuyển sang "Đã đóng" THE SYSTEM SHALL ghi nhận kết quả "Không làm bài" với điểm bài thi 0 cho mỗi HV không có bài nộp mà tại Giờ đóng là thành viên của một lớp được giao và có tài khoản đã kích hoạt (kể cả "Đã khóa"), riêng cho từng lớp được giao HV thuộc, và không ghi nhận kết quả nào cho HV vào lớp sau Giờ đóng.
- AC-13.4: THE SYSTEM SHALL dùng bài nộp duy nhất của HV cho bài thi làm kết quả của HV ở mọi lớp được giao mà HV là thành viên, cùng điểm bài thi ở mọi lớp đó.
- AC-13.5: WHEN một bài nộp có điểm, kết quả "Không làm bài" được ghi nhận, HV được thêm vào hoặc gỡ khỏi một lớp được giao, hoặc bài thi được lưu trữ hay khôi phục THE SYSTEM SHALL cung cấp cho 008 và 009 trong vòng 60 giây kết quả bài thi của HV theo từng lớp được giao: bài thi, lớp, HV, loại kết quả ("Đã nộp" hoặc "Không làm bài"), điểm bài thi 0–100, thời điểm nộp và nhãn "Nộp tự động" (nếu có), Giờ đóng và việc bài thi có đang "Lưu trữ" hay không.
- AC-13.6: THE SYSTEM SHALL không cung cấp cho 008 kết quả nào của HV cho một bài thi khi HV chưa có bài nộp và bài thi chưa "Đã đóng" (đang làm dở hoặc chưa làm).

### REQ-14: Student result — Kết quả bài thi của học viên (S08)

<!-- Story: US-4 · Priority: P1 · Screen: S08 · Điểm ngay sau khi nộp, đáp án và giải thích sau giờ đóng (stakeholder 2026-10-22) -->

- AC-14.1: WHEN bài nộp của HV được ghi nhận, hoặc HV chọn "Xem kết quả" của bài thi đã nộp THE SYSTEM SHALL hiển thị trên S08 tên bài thi, "Đã nộp lúc HH:mm dd/MM/yyyy", nhãn "Nộp tự động" nếu có, điểm bài thi dạng "<điểm>/100", dòng "<đạt> / <tổng> điểm", thời gian làm bài và dòng "Bạn chỉ làm bài thi này một lần."
- AC-14.2: WHILE bài thi chưa "Đã đóng" hoặc còn lượt làm của bài thi chưa được nộp THE SYSTEM SHALL không hiển thị cho HV đáp án đúng, giải thích hay kết quả từng câu và hiển thị trên S08 "Đáp án và giải thích sẽ hiển thị sau khi bài thi đóng lúc HH:mm dd/MM/yyyy."
- AC-14.3: WHILE bài thi đã "Đã đóng" và mọi lượt làm của bài thi đã được nộp THE SYSTEM SHALL hiển thị thêm trên S08 của HV có bài nộp mục "Từng câu · đáp án và giải thích" với mọi câu theo thứ tự: số thứ tự, tên dạng câu, kết quả (Đúng / Đúng một phần / Sai / Chưa trả lời theo 005 AC-16.3), điểm đạt trên điểm tối đa, "Bạn trả lời:", "Đáp án đúng:" và "Giải thích:" (khi câu có giải thích) như S06 của 005 (AC-16.2, AC-16.4).
- AC-14.4: WHEN HV có kết quả "Không làm bài" chọn "Xem kết quả" THE SYSTEM SHALL hiển thị trên S08 "Bạn đã không làm bài thi này." kèm điểm "0/100", và không hiển thị câu hỏi, đáp án hay giải thích nào.
- AC-14.5: WHEN HV không có lượt làm và không có kết quả của một bài thi "Đã đóng" (ví dụ vào lớp sau Giờ đóng) mở bài thi đó THE SYSTEM SHALL hiển thị "Bài thi đã đóng." mà không hiển thị điểm, câu hỏi, đáp án hay giải thích nào.

### REQ-15: Teacher results per class — Kết quả bài thi theo lớp (T16, T14)

<!-- Story: US-5 · Priority: P1 · Screen: T16, T14 (005, chỉ đọc) -->

- AC-15.1: WHEN GV chọn "Xem kết quả" của một bài thi không ở trạng thái "Nháp" (trên T10 hoặc T22) THE SYSTEM SHALL mở T16 với đầu trang gồm tên, Giờ mở, Thời lượng, Giờ đóng, trạng thái của bài thi và bộ chọn lớp gồm các lớp được giao (mặc định lớp đầu tiên theo tên A→Z).
- AC-15.2: THE SYSTEM SHALL liệt kê trên T16 mọi HV hiện thuộc lớp đang chọn có tài khoản đã kích hoạt (kể cả "Đã khóa"), mỗi HV đúng một trạng thái: "Đã nộp" kèm điểm "<điểm>/100", thời điểm nộp, thời gian làm bài và nhãn "Nộp tự động" nếu có; "Đang làm" kèm thời điểm bắt đầu và thời gian còn lại; "Không làm bài · 0/100" khi HV có kết quả "Không làm bài" (AC-13.3); "Vào lớp sau khi bài thi đóng" khi bài thi đã đóng mà HV không có kết quả; còn lại "Chưa làm".
- AC-15.3: THE SYSTEM SHALL hiển thị trên T16 số HV ở từng trạng thái của lớp đang chọn và điểm trung bình (làm tròn một chữ số thập phân) của các HV "Đã nộp", hoặc "—" khi lớp chưa có HV nào "Đã nộp".
- AC-15.4: WHEN GV lọc theo trạng thái, tìm theo họ tên HV hoặc sắp xếp theo họ tên, điểm hoặc thời điểm nộp trên T16 THE SYSTEM SHALL cập nhật danh sách tương ứng mà không thay đổi số liệu của lớp.
- AC-15.5: WHEN GV chọn "Xem bài nộp" của một HV "Đã nộp" trên T16 THE SYSTEM SHALL mở bài nộp trên T14 ở chế độ chỉ đọc của 005 (AC-20.2, AC-20.3) với họ tên HV, lớp, tên bài thi, thời điểm bắt đầu, thời điểm nộp, thời gian làm bài, nhãn "Nộp tự động" nếu có, điểm "<điểm>/100" và "<đạt> / <tổng> điểm", kể cả khi bài thi chưa đóng.
- AC-15.6: WHILE lớp đang chọn trên T16 không có HV nào có tài khoản đã kích hoạt THE SYSTEM SHALL hiển thị "Lớp chưa có học viên" thay cho danh sách và số liệu.
- AC-15.7: WHILE GV đang mở T16 của một bài thi "Đang mở" THE SYSTEM SHALL cập nhật trạng thái, điểm và số liệu trong vòng 60 giây sau khi một HV của lớp đang chọn bắt đầu làm hoặc nộp bài, mà GV không cần tải lại trang.

### REQ-16: Access control and exam secrecy — Phân quyền và bảo mật đề thi

<!-- Story: US-1, US-2, US-4, US-5 · Priority: P1 · Screen: T10, T22, T16, T14, S07, S08, A05 -->

- AC-16.1: IF một GV mở bài thi, kết quả hoặc bài nộp thuộc workspace của GV khác, hoặc không tồn tại, kể cả bằng đường dẫn trực tiếp THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung" như với nội dung không tồn tại.
- AC-16.2: IF HV mở, kể cả bằng đường dẫn trực tiếp, một bài thi không thấy được theo AC-7.1, hoặc lượt làm, bài nộp hay kết quả của HV khác THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung" mà không tiết lộ nội dung hay sự tồn tại của bài thi.
- AC-16.3: IF HV yêu cầu nội dung câu hỏi của bài thi khi HV không có lượt đang làm của bài thi đó và chưa tới mốc của AC-14.3 với bài nộp của chính HV THEN THE SYSTEM SHALL từ chối và chỉ hiển thị S07 (danh sách hoặc sảnh) hoặc kết quả trên S08 không kèm câu hỏi.
- AC-16.4: THE SYSTEM SHALL không gửi đáp án đúng hay giải thích của bất kỳ câu nào của bài thi tới thiết bị của HV trước mốc của AC-14.3, kể cả trong lúc HV làm bài và ngay sau khi nộp.
- AC-16.5: THE SYSTEM SHALL không áp dụng thiết lập ẩn/hiện section theo lớp (003) cho bài thi: việc HV thấy bài thi chỉ phụ thuộc AC-7.1.

## 6. Non-Functional Requirements

- NFR-1: Timing: đồng hồ đếm ngược trên thiết bị HV (S08) và đếm ngược "Mở sau" (S07) lệch ≤ 2 giây so với thời gian theo đồng hồ hệ thống, kể cả khi đồng hồ thiết bị sai tới 24 giờ hoặc đặt múi giờ khác UTC+7, và trở lại độ lệch ≤ 2 giây trong ≤ 5 giây sau khi thiết bị thoát chế độ ngủ.
- NFR-2: Reliability: 100 % lượt làm chưa nộp được nộp tự động trong ≤ 60 giây sau thời điểm kết thúc của lượt, kiểm chứng với 200 lượt kết thúc cùng lúc tại Giờ đóng và không thiết bị nào đang mở; kết quả "Không làm bài" (AC-13.3) được ghi nhận cho 100 % HV được tính trong ≤ 60 giây sau Giờ đóng.
- NFR-3: Reliability: 0 câu trả lời đã hiển thị "Đã lưu" bị thiếu trong bài nộp, 0 lượt làm thứ hai và 0 bài nộp thứ hai cho cùng HV × bài thi, kiểm chứng bằng 1.000 lượt làm mô phỏng có ngắt kết nối, tải lại trang, đổi thiết bị, bấm "Bắt đầu làm bài" và "Nộp bài" đồng thời trên 2 thiết bị.
- NFR-4: Performance: p95 thời gian từ thay đổi câu trả lời cuối cùng tới khi hiển thị "Đã lưu" ≤ 3 giây trên mạng di động mô phỏng 4G (10 Mbps, độ trễ 100 ms) khi 300 HV đang làm bài đồng thời trong toàn hệ thống; sau khi kết nối lại, các câu trả lời chưa lưu được ghi nhận và hiển thị "Đã lưu" trong ≤ 5 giây (p95).
- NFR-5: Performance: p95 thời gian từ khi HV chọn "Bắt đầu làm bài" hoặc "Tiếp tục làm bài" tới khi hiển thị câu hỏi đầu tiên ≤ 3 giây với bài thi 100 câu (không tính tải hình ảnh) khi 200 HV cùng bắt đầu một bài thi trong cùng 60 giây; chuyển giữa các câu ≤ 300 ms (p95).
- NFR-6: Performance: p95 thời gian từ khi HV xác nhận nộp tới khi S08 hiển thị điểm ≤ 2 giây với bài thi 100 câu khi 200 HV nộp trong cùng 60 giây; T16 hiển thị đầy đủ danh sách và số liệu của một lớp 100 HV trong ≤ 2 giây (p95) trên máy tính.
- NFR-7: Security: 0 trường hợp nội dung câu hỏi tới thiết bị HV ngoài lượt đang làm của chính HV hoặc trước mốc AC-14.3, và 0 trường hợp đáp án đúng hay giải thích tới thiết bị HV trước mốc AC-14.3, kiểm chứng bằng kiểm thử bảo mật trên cả 9 dạng câu của 005; 100 % ca truy cập chéo (GV workspace khác, HV ngoài lớp được giao, HV của lớp Sắp bắt đầu, HV khác, người chưa đăng nhập) bị từ chối bằng A05 mà không lộ nội dung.
- NFR-8: Usability: S07 và S08 dùng được ở chiều rộng 360–430 px không cuộn ngang; đồng hồ đếm ngược luôn nhìn thấy khi cuộn câu hỏi; vùng chạm của nút, số câu trên bảng điều hướng, mục Nối cặp và mảnh Sắp xếp ≥ 44×44 px; chữ Hán ≥ 18 px và pinyin có dấu thanh hiển thị đúng trên 2 phiên bản mới nhất của Chrome Android và Safari iOS.
- NFR-9: Correctness: trạng thái bài thi (T10, S07), thời điểm kết thúc của lượt, trạng thái HV trên T16 và kết quả "Không làm bài" đúng 100 % trên bộ ≥ 50 ca kiểm thử biên (bắt đầu sát Giờ đóng, Giờ mở bằng phút hiện tại, lùi Giờ đóng khi có lượt bị giới hạn bởi Giờ đóng cũ, thiết bị ở múi giờ khác UTC+7, HV vào lớp trước và sau Giờ đóng, HV thuộc 2 lớp được giao, lớp kết thúc khi HV đang làm, HV bị gỡ khỏi lớp khi đang làm, tài khoản bị khóa khi đang làm).
- NFR-10: Observability: 100 % thao tác tạo, lưu, lên lịch, hủy lịch, đổi lịch hoặc lớp được giao, xóa, lưu trữ, khôi phục, nhân bản bài thi, bắt đầu lượt, nộp bài, nộp tự động và ghi nhận "Không làm bài" được ghi nhật ký có cấu trúc (mã bài thi, mã lớp, mã lượt, mã người thực hiện, thời điểm, kết quả hoặc lý do bị chặn); 0 dòng nhật ký chứa nội dung câu hỏi, câu trả lời, đáp án, mật khẩu, email hoặc họ tên.

## 7. Key Entities

- **Bài thi (Exam)** — một bài kiểm tra có giờ thuộc workspace của một GV, không gắn với Giáo trình hay Bài. Thuộc tính: tên, hướng dẫn, danh sách câu hỏi có thứ tự (dạng tự chấm, đáp án, giải thích, điểm theo 005), tổng điểm tối đa, lớp được giao (một hoặc nhiều lớp của GV), lịch thi gồm Giờ mở, Thời lượng (phút), Giờ đóng — **một lịch cho mọi lớp được giao**; trạng thái: Nháp / Đã lên lịch / Đang mở / Đã đóng / Lưu trữ (ba trạng thái giữa tính theo đồng hồ, AC-3.6); đề đã khóa hay chưa (có lượt làm hay chưa).
- **Lớp được giao (Exam assignment)** — liên kết bài thi × lớp (lớp thuộc 003). Thêm được khi bài thi chưa đóng; bỏ được khi chưa HV nào của lớp làm bài thi.
- **HV dự thi** — HV có tài khoản đã kích hoạt (kể cả "Đã khóa", dù HV bị khóa không đăng nhập được — 001), là thành viên hiện tại của ít nhất một lớp được giao không ở trạng thái Sắp bắt đầu. Được bắt đầu làm bài khi bài thi "Đang mở", HV chưa có lượt làm và ít nhất một lớp được giao mà HV thuộc đang ở trạng thái Đang học.
- **Lượt làm (Attempt)** — lần làm bài duy nhất của một HV cho một bài thi. Thuộc tính: thời điểm bắt đầu, thời điểm kết thúc = min(bắt đầu + Thời lượng, Giờ đóng) (tính lại khi Giờ đóng được lùi, AC-5.2), thứ tự mục Nối cặp / mảnh Sắp xếp của lượt, câu trả lời đã lưu (kèm thời điểm hệ thống ghi nhận), câu xem gần nhất, thiết bị đang giữ quyền làm bài, trạng thái (Đang làm / Đã nộp).
- **Bài nộp (Submission)** — lượt làm đã kết thúc. Thuộc tính: thời điểm nộp, thời gian làm bài, cách nộp (thủ công / "Nộp tự động"), kết quả và điểm từng câu, điểm đạt / tổng điểm, điểm bài thi 0–100.
- **Kết quả bài thi của HV theo lớp (Exam result)** — HV × bài thi × lớp được giao: "Đã nộp" (điểm của bài nộp duy nhất, dùng chung cho mọi lớp được giao HV thuộc) hoặc "Không làm bài" (0, ghi nhận khi đóng, AC-13.3). Là dữ liệu 006 cung cấp cho 008 và 009.

## 8. Edge Cases & Error Handling

- HV bắt đầu khi còn ít hơn Thời lượng tới Giờ đóng → sảnh cảnh báo số phút thực có; lượt kết thúc đúng Giờ đóng (AC-8.2, AC-8.3).
- Lượt bắt đầu khi còn dưới 5 phút → không hiện "Còn 5 phút", chỉ "Còn 1 phút" nếu còn trên 1 phút (AC-9.4).
- HV đang ở hộp xác nhận nộp bài khi hết giờ → bài được nộp tự động, hộp xác nhận được thay bằng thông báo hết giờ (AC-12.1, AC-12.3).
- HV bấm "Bắt đầu làm bài" hai lần hoặc trên hai thiết bị cùng lúc → đúng một lượt (AC-8.5); bấm "Vào thi" ở một thẻ cũ sau khi đã nộp → S07 với "Đã nộp" (AC-8.4).
- HV mở sảnh rồi để quá Giờ đóng mới bấm "Bắt đầu làm bài" → không tạo lượt, S07 hiển thị "Đã đóng" (AC-8.4).
- Nộp thủ công trùng nộp tự động → một bài nộp duy nhất (AC-11.3).
- HV mất mạng và chỉ kết nối lại sau thời điểm kết thúc + 10 giây → câu trả lời chưa lưu không được tính; HV đã được báo trước trong cảnh báo (AC-10.1, AC-12.2).
- Đồng hồ thiết bị HV sai giờ hoặc khác múi giờ → đồng hồ đếm ngược và mọi mốc thời gian vẫn theo hệ thống và giờ Việt Nam (AC-3.2, AC-9.1, NFR-1).
- HV nộp bài mà chưa trả lời câu nào → được nộp, điểm 0 (AC-11.2, AC-13.1) — khác bộ bài tập của 005 (005 AC-15.2) vì bài thi có giờ và phải kết thúc.
- HV thuộc hai lớp cùng được giao → một dòng trên S07, một lượt làm, kết quả và điểm như nhau ở cả hai lớp (AC-7.2, AC-13.4); trên T16 HV xuất hiện ở cả hai lớp.
- Một lớp được giao còn Sắp bắt đầu khi bài thi mở → HV lớp đó chưa thấy bài thi; nếu lớp bắt đầu trước Giờ đóng, HV thấy và làm được từ ngày bắt đầu; GV đã được cảnh báo khi lên lịch (AC-3.7, AC-7.1).
- HV chỉ thuộc lớp đã kết thúc → thấy bài thi, không bắt đầu được ("Lớp đã kết thúc — không thể vào thi."); nếu đang làm khi lớp kết thúc thì làm tiếp tới khi nộp hoặc hết giờ (AC-7.3, AC-8.4, AC-12.4). Kết quả "Không làm bài" vẫn được ghi nhận khi đóng nếu HV còn là thành viên (AC-13.3); 008 quyết định cách tính ở lớp đã kết thúc.
- HV được thêm vào lớp được giao khi bài thi đang mở → làm được như mọi HV (AC-7.8); thêm sau Giờ đóng → S07 "Đã đóng", không có kết quả, không bị tính 0 (AC-13.3, AC-14.5, AC-15.2).
- HV bị gỡ khỏi lớp được giao khi đang làm (và không thuộc lớp được giao nào khác) → không lưu thêm, nộp tự động khi hết giờ; bài nộp được giữ, HV không còn xuất hiện trên T16 của lớp đó (AC-12.5, AC-15.2; 003 AC-8.6).
- Tài khoản HV bị khóa khi đang làm → HV không đăng nhập lại được (001); lượt được nộp tự động với câu trả lời đã lưu (AC-12.1).
- GV lùi Giờ đóng khi có HV bị giới hạn bởi Giờ đóng cũ → thời điểm kết thúc của HV được tính lại, tối đa bằng bắt đầu + Thời lượng (AC-5.2); GV không thể kéo Giờ đóng sớm hơn khi đã có lượt làm (AC-5.1).
- GV sửa câu hỏi đúng lúc HV đầu tiên bắt đầu → thay đổi câu hỏi không được lưu, HV làm theo đề đã lưu trước đó (AC-4.3).
- GV muốn mở lại bài thi đã đóng → không được (AC-4.4); dùng "Nhân bản" và lên lịch mới cho lớp cần thi lại (AC-6.6) — bản sao là bài thi khác, có kết quả riêng.
- GV bỏ lớp cuối cùng của bài thi đã lên lịch → không lưu vì bài thi cần ít nhất một lớp được giao (AC-4.1, AC-3.4).
- GV xóa lớp (003) đang được giao cho bài thi chưa có lượt làm → lớp không còn trong danh sách lớp được giao; nếu đó là lớp duy nhất, bài thi vẫn ở trạng thái hiện tại nhưng không có HV dự thi (cần 003 xác nhận, xem §10).
- Hai cửa sổ của GV cùng sửa bài thi → cửa sổ lưu sau bị chặn, không ghi đè (AC-2.7).
- GV xóa bài thi trong khi HV vừa bấm "Bắt đầu làm bài" → nếu lượt được tạo trước, xóa bị chặn (AC-6.2); nếu xóa trước, HV thấy A05 (AC-8.4).
- Bài thi có HV đang làm lúc Giờ đóng → mọi lượt được nộp tự động trong ≤ 60 giây; đáp án chỉ hiện cho HV sau khi lượt cuối cùng đã được nộp (AC-12.1, AC-14.2, AC-14.3).
- Đáp án sai được phát hiện sau khi đề đã khóa → không sửa được và không chấm lại (AC-4.2, Q-5 đã đóng); GV nhân bản đề để dùng cho lần thi sau.
- Điện thoại HV chưa có bàn phím tiếng Trung khi gặp câu Viết chữ Hán theo pinyin → HV vẫn làm các câu khác, đồng hồ không dừng (AC-9.1, 005).
- Bài thi đã lưu trữ → HV không thấy trên S07 và đường dẫn trực tiếp tới S08 hiển thị A05; điểm vẫn được cung cấp cho 008 kèm cờ "Lưu trữ" (AC-6.3, AC-13.5, AC-16.2).

## 9. Out of Scope

- **Mô hình cũ (thay thế 2026-10-22):** bài thi là section Bài thi của mỗi Bài, một bài thi mỗi Bài, tạo từ T18; lịch thi riêng cho từng lớp (X4); nhiều lượt làm và "điểm cao nhất"; ba chính sách công bố kết quả và nút "Công bố kết quả"; tùy chọn "Hiện đáp án và giải thích khi công bố"; "Tạo phiên bản mới" / "Đã thay thế" / "Phiên bản trước"; ẩn/hiện section Bài thi theo lớp và hệ quả của nó; ngoại lệ cho từng HV ("Cho thêm lượt", "Lịch riêng"); trạng thái HV "Vắng"; thống kê biểu đồ phân bố điểm trên T16.
- Chấm tay, câu Nói / Nghe / Viết đoạn tự do và trạng thái "Chờ chấm" — module 007 vẫn hoãn; chấm bằng AI.
- Tạo bài thi bằng AI (010 không tạo bài thi); lấy câu hỏi từ bộ bài tập hay ngân hàng câu hỏi; rút câu ngẫu nhiên.
- Xáo trộn thứ tự câu hỏi hoặc phương án; đánh dấu "xem lại" câu hỏi; chia bài thi thành phần có thời gian riêng.
- Lịch khác nhau cho từng lớp hoặc từng HV, gia hạn hay tạm dừng một lượt đang làm, cho HV làm lại; đóng sớm hoặc mở lại bài thi đã đóng.
- Sửa đáp án và chấm lại bài thi đã khóa (Q-5: không, stakeholder 2026-10-22).
- Email, thông báo đẩy hay nhắc lịch thi, nhắc làm bài thi, báo có điểm — chỉ hiển thị trong ứng dụng (email nhắc hạn nộp của 003 chỉ áp dụng cho bộ bài tập).
- Chống gian lận: phát hiện chuyển tab/ứng dụng, khóa trình duyệt, giám sát camera/micro, chặn sao chép, giới hạn địa chỉ mạng.
- GV xem trước bài thi như HV / làm thử; xuất kết quả ra tệp (Excel/PDF); điểm đạt/trượt, quy đổi thang HSK, chứng chỉ.
- Công thức điểm xếp hạng và cách hiển thị bài thi trên bảng xếp hạng (→ 008); khu theo dõi bài thi trên dashboard (→ 009, nếu cần).
- Làm bài thi ngoại tuyến hoàn toàn hoặc trên ứng dụng native.

## 10. Assumptions & Dependencies

- Dựa trên D1, D3 v2, D4, V4-6, V11 (một lần làm), V12-1 và yêu cầu stakeholder 2026-10-22 (§12). X4 và phần "exams (006) deferred" của V3-2 không còn hiệu lực với 006.
- **001** — tài khoản HV (Chưa kích hoạt / Đã kích hoạt / Gửi email thất bại / Đã khóa), đăng nhập, hết phiên (AC-10.3), HV bị khóa không đăng nhập được, cô lập workspace và A05 "Không tìm thấy nội dung" (AC-16.1, AC-16.2). Thanh điều hướng GV và HV có thêm mục "Bài thi" (T10, S07).
- **003** — lớp, thành viên hiện tại, ngày vào lớp, trạng thái lớp Sắp bắt đầu / Đang học / Đã kết thúc (AC-3.1, AC-7.1, AC-7.3, AC-12.4), sự kiện "HV được thêm vào / gỡ khỏi lớp", "Lớp kết thúc / mở lại", "Lớp bị xóa". Cần 003 xác nhận: (1) bài nộp bài thi của HV thuộc lớp được tính là "bài nộp của lớp" khi chặn xóa lớp (003 AC-11.3) và khi chặn đổi giáo trình không bị ảnh hưởng; (2) xóa lớp chưa có bài nộp sẽ bỏ lớp đó khỏi các bài thi được giao; (3) tùy chọn: S02 (Trang lớp) có lối vào "Bài thi của lớp" dẫn tới S07. Ẩn/hiện section theo lớp không áp dụng cho bài thi (AC-16.5).
- **005** — dạng câu hỏi, trình soạn câu hỏi và kiểm tra tại chỗ (REQ-2 … REQ-11, AC-2.6, AC-2.7), điều kiện hoàn chỉnh (AC-12.3), quy tắc chấm và kết quả từng câu (AC-16.1, AC-16.3), cách trình bày và trả lời trên S05 (AC-14.2, AC-14.3), cách trình bày "Xem lại bài làm" trên S06 (AC-16.2, AC-16.4) được S08 dùng lại; **T14 "Xem bài nộp (chỉ đọc)" phải mở được bài nộp bài thi** với phần đầu riêng của bài thi (AC-15.5).
- **008** — sở hữu công thức điểm xếp hạng (trung bình điểm bộ bài tập × 30 % + trung bình điểm bài thi × 70 %); nhận kết quả bài thi theo HV × lớp (AC-13.5): bài thi được tính cho HV khi đã nộp hoặc đã có "Không làm bài" (0); chưa nộp và chưa đóng thì không được tính (AC-13.6). Cần 008 quyết định cách xử lý: bài thi "Lưu trữ" (006 giữ điểm và gắn cờ), HV thuộc lớp chưa có bài thi nào được tính, lớp đã kết thúc.
- **009** — có thể dùng kết quả bài thi (AC-13.5); MVP không bắt buộc hiển thị bài thi trên dashboard.
- **011** — hạng của HV trên hồ sơ lấy từ 008; không cần thay đổi riêng cho 006.
- **002, 004, 010** — không phụ thuộc: bài thi không thuộc Giáo trình / Bài, không có trong T07, T18, T20, T21.
- **Prototype** `specs/screen-flow-design.html` chưa có T10, T16, T22, S07, S08 cho mô hình mới; khi được bổ sung, câu chữ prototype là chuẩn theo V12-1 và spec được đồng bộ lại.
- **007** — vẫn hoãn; 006 không phụ thuộc.

## 11. Open Questions

- Q-5 đã đóng 2026-10-22: không sửa đáp án hay chấm lại khi đề đã khóa (xem §12).
- Đã đóng ngày 2026-10-22 (không còn áp dụng với mô hình mới): Q-2 (xem đáp án sau khi công bố — stakeholder: đáp án và giải thích luôn hiển thị sau giờ đóng) và Q-4 (điểm của phiên bản bị thay thế — không còn khái niệm phiên bản). Q-1, Q-3 đã đóng ngày 2026-10-19.

## 12. Clarifications Log

### Session 2026-10-22 (bài thi độc lập)

Yêu cầu stakeholder 2026-10-22 (nguyên văn): "thêm module bài thi — sẽ tạo bài thi chọn lớp add vào bài thi thì tất cả học viên trong lớp đó có thể tham gia bài thi khi GV set ngày giờ, đến thời gian thì có thể vào thi. quy tắc tính điểm xếp hạng: điểm làm những bài tập trên lớp cộng lại chia trung bình chiếm 30%, điểm của những bài thi cộng lại chia trung bình chiếm 70%, tổng 2 điểm này lại ra final xếp hạng."

- Q: Đáp án sai phát hiện sau khi đề đã khóa — GV có được sửa và chấm lại không (Q-5)? → A: Không. Đề khóa hoàn toàn từ lượt làm đầu tiên (AC-4.2); GV chịu trách nhiệm soạn và kiểm tra đề đúng trước giờ mở; muốn đề khác thì nhân bản (AC-6.6) và giao lại. Q-5 đóng. (source: stakeholder 2026-10-22 "không vì sẽ đảm bảo đề thi soạn luôn đúng")
- Q: Bài thi nằm ở đâu và ai được thi? → A: Bài thi là mục độc lập trong workspace của GV (mục "Bài thi"), không gắn với Bài hay Giáo trình; GV chọn một hoặc nhiều lớp được giao; mọi HV của lớp được giao (tài khoản đã kích hoạt, thành viên hiện tại) được thi; HV vào lớp sau vẫn thi được nếu bài thi còn mở; mỗi HV làm một lần (REQ-3, REQ-7, REQ-8, AC-7.8). (source: stakeholder)
- Q: Lịch thi gồm những gì và thời gian làm bài tính thế nào? → A: GV đặt giờ mở, thời lượng làm bài (phút) và giờ đóng — một lịch cho mọi lớp được giao. HV bắt đầu bất kỳ lúc nào trong khoảng mở; mỗi HV có đủ thời lượng tính từ lúc bấm bắt đầu nhưng không quá giờ đóng — nộp tự động lúc min(bắt đầu + thời lượng, giờ đóng) (AC-3.2, AC-3.6, AC-8.3, AC-12.1). (source: stakeholder)
- Q: Nội dung bài thi và hiển thị kết quả? → A: GV soạn tay bằng các dạng câu tự chấm của 005 (Trắc nghiệm + dạng từ vựng, Điền chỗ trống, Nối cặp, Sắp xếp từ thành câu, Viết chữ Hán theo pinyin, Đọc hiểu); không dùng AI cho bài thi. Điểm 0–100 hiện cho HV ngay sau khi nộp; đáp án đúng và giải thích chỉ hiện sau giờ đóng để tránh lộ đề (REQ-2, REQ-14, AC-16.4). (source: stakeholder)
- Q: Điểm bài thi được tính vào xếp hạng thế nào? → A: Điểm xếp hạng = trung bình điểm bài tập × 30 % + trung bình điểm bài thi × 70 % (008 sở hữu). Mỗi bài thi cho điểm 0–100; bài thi được tính cho HV khi HV đã nộp, hoặc khi đã qua giờ đóng mà HV không nộp (= 0) (REQ-13). (source: stakeholder)
- Q: Trạng thái của bài thi? → A: Nháp → (Lên lịch) → Đã lên lịch → Đang mở → Đã đóng theo đồng hồ; "Hủy lịch" về Nháp khi chưa có lượt làm; "Lưu trữ" ⇄ "Khôi phục" chỉ cho bài thi đã đóng (AC-3.4, AC-3.6, AC-3.8, AC-6.3 … AC-6.5). (source: assumption — tên trạng thái theo gợi ý của orchestrator; trạng thái theo đồng hồ để GV không phải thao tác lúc mở/đóng)
- Q: Khoảng mở có được ngắn hơn thời lượng không? Giờ mở có được ở quá khứ? → A: Không: giờ đóng ≥ giờ mở + thời lượng; giờ mở không sớm hơn phút hiện tại khi lên lịch (được bằng — mở ngay) (AC-3.3, AC-3.4). (source: assumption — bảo đảm HV bắt đầu đúng giờ mở luôn có đủ thời lượng; tránh lên lịch nhầm vào quá khứ)
- Q: Khi nào đề bị khóa và GV được sửa gì sau đó? → A: Trước lượt làm đầu tiên sửa mọi thứ (bài thi đã lên lịch vẫn phải hợp lệ); từ lượt làm đầu tiên khóa câu hỏi, đáp án, điểm, giờ mở, thời lượng; chỉ sửa tên, hướng dẫn, thêm lớp, bỏ lớp chưa có HV làm bài, lùi giờ đóng muộn hơn; khi đã đóng chỉ sửa tên, hướng dẫn (REQ-4, REQ-5). (source: assumption — mọi HV làm cùng một đề và cùng điều kiện thời gian; lùi giờ đóng không làm ai thiệt; đóng là chốt để tính 0 cho 008)
- Q: Lùi giờ đóng thì HV đang làm có thêm thời gian không? → A: Có, thời điểm kết thúc được tính lại theo min(bắt đầu + thời lượng, giờ đóng mới) (AC-5.2). (source: assumption — đúng quy tắc "đủ thời lượng nhưng không quá giờ đóng" của stakeholder)
- Q: Xóa bài thi? → A: Chỉ xóa được khi chưa có lượt làm; có lượt làm thì chỉ lưu trữ sau khi đóng; lưu trữ ẩn bài thi khỏi T10 (mặc định) và khỏi HV, giữ mọi bài nộp, điểm và kết quả cho 008 kèm cờ "Lưu trữ" (REQ-6). (source: assumption — nguyên tắc "không bao giờ mất dữ liệu học tập"; thống nhất với Lưu trữ của 005 và 002)
- Q: HV thuộc hai lớp cùng được giao? → A: Một lượt làm duy nhất; kết quả và điểm dùng chung cho mọi lớp được giao HV thuộc (AC-7.2, AC-13.4). (source: assumption — stakeholder nói "một lần mỗi HV mỗi bài thi"; không bắt HV thi hai lần cùng một đề)
- Q: HV nào bị tính "Không làm bài" (0)? → A: HV có tài khoản đã kích hoạt (kể cả Đã khóa) là thành viên của lớp được giao tại giờ đóng và không có bài nộp, riêng cho từng lớp; HV vào lớp sau giờ đóng không có kết quả, không bị tính 0 (AC-13.3). (source: assumption — không phạt HV chưa có cơ hội thi; HV Chưa kích hoạt không đăng nhập được nên không tính, thống nhất 003 AC-8.9)
- Q: Lớp chưa bắt đầu hoặc đã kết thúc? → A: HV của lớp Sắp bắt đầu chưa thấy bài thi (003 A9); HV chỉ thuộc lớp Đã kết thúc thấy bài thi nhưng không bắt đầu được; lượt đang làm khi lớp kết thúc được làm tiếp tới khi nộp hoặc hết giờ; chỉ giao được lớp Sắp bắt đầu hoặc Đang học (AC-3.1, AC-7.1, AC-7.3, AC-12.4). (source: assumption — thống nhất 003 AC-10.3, AC-14.3 và quyết định cũ R1 của 006)
- Q: HV bị gỡ khỏi lớp khi đang làm? → A: Không lưu thêm câu trả lời; lượt được nộp tự động khi hết giờ với câu trả lời đã lưu; bài nộp được giữ (AC-12.5). (source: assumption — thống nhất 003 AC-14.5 và AC-8.6: HV không còn thuộc lớp thì không thao tác được, dữ liệu không mất)
- Q: Đáp án hiện đúng lúc nào sau giờ đóng? → A: Khi bài thi đã đóng và mọi lượt làm đã được nộp (tối đa khoảng 60 giây sau giờ đóng); trước đó HV chỉ thấy điểm, không thấy kết quả từng câu (vì Đúng/Sai cũng làm lộ đáp án) (AC-14.2, AC-14.3, AC-16.4). (source: assumption — giữ đúng mục tiêu "tránh lộ đề" khi còn HV đang được nộp tự động hoặc trong 10 giây dung sai)
- Q: HV không làm bài có được xem đề và đáp án sau khi đóng? → A: Không; chỉ thấy "Bạn đã không làm bài thi này." và 0/100 (AC-14.4). (source: assumption — phương án thận trọng; đề có thể được nhân bản dùng cho lớp khác)
- Q: Câu trả lời tới trễ do mạng? → A: Ghi nhận câu trả lời tới chậm nhất 10 giây sau thời điểm kết thúc của lượt; nộp tự động trong ≤ 60 giây kể cả khi HV ngoại tuyến (AC-12.1, AC-12.2). (source: assumption — giữ từ bản trước: dung sai độ trễ mạng nhưng không cho kéo dài giờ bằng cách ngắt mạng)
- Q: Cách quy đổi điểm 0–100? → A: Làm tròn(điểm đạt ÷ tổng điểm × 100), 0,5 làm tròn lên — cùng cách 008 quy đổi bộ bài tập (AC-13.2). (source: assumption — thống nhất với 008 AC-1.2)
- Q: Giới hạn dữ liệu? → A: Tên 1–150 ký tự, hướng dẫn ≤ 2.000 ký tự, thời lượng 1–300 phút, 1–100 câu hỏi (AC-2.2, AC-2.3, AC-2.6). (source: assumption — 100 câu khớp giới hạn bộ bài tập của 005 và bao trùm đề HSK thật; 300 phút bao trùm HSK 7–9 khoảng 210 phút)
- Q: Được nộp khi chưa trả lời câu nào? → A: Được, điểm 0 (AC-11.2). (source: assumption — bài thi có giờ và chỉ một lần; khác 005 AC-15.2 vốn chặn nộp trống)
- Q: Có xáo trộn, đánh dấu xem lại, ngoại lệ cho từng HV, nhiều lượt? → A: Không trong phiên bản này (§9). (source: assumption — không có yêu cầu từ stakeholder; giữ thiết kế đơn giản nhất — Hiến chương IV)
- Q: Dùng lại đề cho lớp khác vào thời điểm khác? → A: "Nhân bản" tạo bản Nháp giữ đề và thời lượng, bỏ lớp, lịch và bài nộp — P2 (AC-6.6, US-7). (source: assumption — mỗi bài thi chỉ có một lịch nên nhân bản thay cho lịch theo lớp)
- Q: GV xem bài nộp ở đâu? → A: T14 "Xem bài nộp (chỉ đọc)" của 005, mở từ T16, xem được cả khi bài thi chưa đóng (AC-15.5). (source: assumption — dùng lại màn hình đã có, X3)
- Q: Có email nhắc lịch thi không? → A: Không trong phiên bản này; chỉ hiển thị trong ứng dụng (S07 có đếm ngược) (§9). (source: assumption — stakeholder không yêu cầu; email nhắc của 003 chỉ cho bộ bài tập)
- Q: Mã màn hình? → A: Dùng lại mã đã hoãn: T10 "Danh sách bài thi", T16 "Kết quả bài thi", S07 "Bài thi" (danh sách + sảnh), S08 "Làm bài thi" (làm bài + kết quả); mã mới T22 "Soạn bài thi" (mã T kế tiếp còn trống). (source: assumption — theo hướng dẫn của orchestrator, kiểm tra danh mục trong product.md, modules.json, scripts/check-spec-html.mjs)
- [thay thế 2026-10-22: Q-5 đã đóng] Q: Câu hỏi còn mở? → A: Q-5 (sửa đáp án và chấm lại khi đề đã khóa); spec tạm viết theo phương án khóa hoàn toàn. (source: assumption — phương án thận trọng cho tới khi stakeholder trả lời)

### Session 2026-10-18

Ghi chú: mã AC trong phiên này đã được cập nhật theo cách đánh số v2; các mục bị quyết định v2 thay thế được đánh dấu "[thay thế 2026-10-19]". Ghi chú 2026-10-22: spec đã được viết lại và đánh số lại hoàn toàn — mã AC trong phiên này và phiên 2026-10-19 là mã của bản cũ, không khớp spec hiện hành; mục nào không còn áp dụng được đánh dấu "[thay thế 2026-10-22]".

- Q: Ai quản trị dữ liệu bài thi? → A: D1 — mỗi GV là admin duy nhất của workspace; GV không thấy bài thi, lịch, kết quả của GV khác (AC-16.1). (source: stakeholder)
- [thay thế 2026-10-22: bài thi độc lập trong workspace] Q: Bài thi nằm ở đâu? → A: D2 — Bài thi là phần thứ ba cố định của mỗi Giáo trình (cùng Bài học, Bài tập); Giáo trình gắn với một cấp HSK. [thay thế 2026-10-19: Bài thi là section của mỗi Bài] (source: stakeholder)
- Q: Câu nào chấm tự động, câu nào chấm tay? → A: D3 — Trắc nghiệm, Điền chỗ trống, Đọc hiểu chấm tự động; Viết và Nói do GV chấm tay (007), không có chấm AI. [thay thế 2026-10-19: MVP chỉ tự chấm, 007 hoãn] (source: stakeholder)
- Q: HV có tài khoản thế nào? → A: D4 — GV tạo tài khoản HV; HV đăng nhập bằng email + mật khẩu. 006 chỉ dựa vào việc HV đã đăng nhập. (source: stakeholder)
- [thay thế 2026-10-22: một lịch cho mỗi bài thi, giao cho nhiều lớp] Q: Một Giáo trình dùng cho bao nhiêu lớp? → A: A2 — một lớp dùng đúng một Giáo trình, một Giáo trình dùng cho nhiều lớp; vì vậy lịch thi đặt theo lớp (đã được X4 xác nhận ngày 2026-10-19). (source: assumption — shared working assumption A2, owner 003)
- [thay thế 2026-10-22: một lượt làm mỗi HV mỗi bài thi, kết quả dùng chung cho mọi lớp được giao HV thuộc] Q: HV có thể thuộc nhiều lớp? → A: A3 — có; lịch, lượt làm và kết quả bài thi tách riêng theo lớp. (source: assumption — shared working assumption A3, owner 001/003)
- Q: Thiết bị? → A: A4 — GV dùng máy tính; HV dùng điện thoại 360–430 px là chính (NFR-6). (source: assumption — shared working assumption A4)
- Q: Ngôn ngữ và chữ Hán? → A: A5 — giao diện tiếng Việt; chữ Hán giản thể và pinyin phải hiển thị đúng trong câu hỏi, câu trả lời và kết quả (NFR-6). (source: assumption — shared working assumption A5)
- Q: Có thông báo mở thi / công bố kết quả qua email hay push không? → A: A6 — không; chỉ hiển thị trạng thái trong ứng dụng. (source: assumption — shared working assumption A6)
- Q: Múi giờ? → A: A7 — mọi thời điểm hiển thị theo giờ Việt Nam UTC+7 (AC-5.6). (source: assumption — shared working assumption A7)
- Q: Sửa/xóa bài thi đã có bài nộp? → A: A8 — nội dung đã có bài nộp không xóa được; 006 khóa nội dung câu hỏi ngay khi có lượt làm đầu tiên (AC-3.3) để mọi HV làm cùng một đề. "Chỉ ẩn" ở cấp Giáo trình [thay thế 2026-10-19: ẩn section theo lớp (D5)] [thay thế 2026-10-22: "ẩn" thay bằng Lưu trữ bài thi đã đóng]. (source: assumption — shared working assumption A8, owner 002)
- Q: HV xem bài thi trước ngày bắt đầu lớp? → A: A9 — không; trước ngày bắt đầu lớp HV thấy lớp "Sắp bắt đầu" và không mở được nội dung (AC-16.5). (source: assumption — shared working assumption A9, owner 003)
- [thay thế 2026-10-22: mỗi HV làm một lần] Q: Số lượt làm bài thi? → A: A10 — GV đặt số lượt, mặc định 1 (AC-1.1), tối đa 10 (AC-2.1). (source: assumption — shared working assumption A10, owner 006)
- Q: Điểm xếp hạng tính ở đâu? → A: A11 — theo lớp, công thức thuộc 008; 006 cung cấp điểm bài thi theo lớp (AC-11.4). (source: assumption — shared working assumption A11, owner 008)
- [thay thế 2026-10-22: một lượt duy nhất] Q: Khi có nhiều lượt, lượt nào được tính? → A: điểm cuối cùng cao nhất; bằng điểm lấy bài nộp sớm hơn (AC-11.4). (source: assumption — nhất quán với quy tắc "lấy lượt tốt nhất" của Bài tập, dễ giải thích cho HV)
- Q: HV bắt đầu muộn gần giờ đóng thì được bao nhiêu thời gian? → A: thời gian bị giới hạn tại thời điểm đóng; hộp xác nhận cảnh báo trước (AC-7.5, AC-7.6). (source: assumption — giữ đúng thời điểm đóng mà GV đã công bố cho cả lớp, phương án thận trọng)
- Q: Lượt được tính là đã dùng khi nào? → A: ngay khi HV xác nhận bắt đầu, không phải khi nộp (AC-7.5). (source: assumption — tránh HV xem đề rồi thoát ra để làm lại)
- [thay thế 2026-10-22: điểm hiện ngay sau khi nộp, đáp án và giải thích sau giờ đóng] Q: Chính sách công bố kết quả? → A: GV chọn theo từng bài thi một trong ba: "Ngay sau khi nộp", "Sau khi lịch thi đóng" (mặc định), "Khi giáo viên công bố"; công bố thủ công chỉ sau khi lịch lớp đóng; không có hủy công bố (REQ-12, AC-13.6, AC-13.7). (source: assumption — mặc định thận trọng tránh lộ đề giữa các HV đang thi)
- [thay thế 2026-10-22: điểm hiện cho HV ngay sau khi nộp; bài thi chỉ được tính cho 008 khi đã nộp hoặc đã đóng] Q: Điểm bài thi có hiện trên Bảng xếp hạng trước khi công bố? → A: không (AC-12.8). (source: assumption — nếu không, Bảng xếp hạng làm lộ kết quả trước thời điểm GV chọn)
- Q: Khi mất kết nối / hết giờ, câu trả lời nào được tính? → A: câu trả lời tới hệ thống chậm nhất 10 giây sau thời điểm kết thúc; nộp tự động trong ≤ 60 giây kể cả khi HV ngoại tuyến (AC-9.3, AC-9.5). (source: assumption — dung sai độ trễ mạng nhưng không cho kéo dài giờ bằng cách ngắt mạng)
- Q: Làm cùng lúc trên nhiều thiết bị? → A: chỉ nơi mở sau cùng được làm bài (AC-10.4). (source: assumption — tránh ghi đè câu trả lời lẫn nhau, vẫn cho đổi thiết bị khi gặp sự cố)
- Q: Câu Viết/Nói bỏ trống có cần GV chấm? → A: không; tự động 0 điểm. [thay thế 2026-10-19: không còn câu Viết/Nói; mọi câu bỏ trống 0 điểm — AC-11.2] (source: assumption — giảm việc thừa cho GV)
- Q: HV thấy điểm tạm khi bài còn Chờ chấm? → A: không. [thay thế 2026-10-19: không còn trạng thái Chờ chấm] (source: assumption — tránh hiểu nhầm điểm tạm là điểm cuối)
- Q: Bài thi có chia phần (section) không? → A: không trong MVP; danh sách câu phẳng, Đọc hiểu đã nhóm câu con theo đoạn văn (§9). (source: assumption — đơn giản nhất thỏa nhu cầu "tạo bài thi cho học viên thi")
- [thay thế 2026-10-22: không có ngoại lệ cho từng HV] Q: Ngoại lệ cho từng HV có trong phạm vi không? → A: có, ưu tiên P2: cho thêm lượt và lịch riêng; không gia hạn lượt đang làm (REQ-15, §9). (source: assumption — tình huống HV ốm/sự cố thường gặp, chi phí thấp)
- Q: Chống gian lận? → A: ngoài phạm vi MVP (§9). (source: assumption — không có yêu cầu từ stakeholder; giám sát làm tăng độ phức tạp và vấn đề quyền riêng tư)
- [thay thế 2026-10-22: tối đa 100 câu, không có số lượt — xem Session 2026-10-22] Q: Giới hạn dữ liệu? → A: tiêu đề 1–150 ký tự, hướng dẫn ≤ 2.000 ký tự, thời gian làm bài 1–300 phút, số lượt 1–10, tối đa 150 câu (AC-2.1, AC-2.5). (source: assumption — bao trùm đề HSK thật: HSK 7–9 khoảng 98 câu, 210 phút)
- [thay thế 2026-10-22: T16 chỉ còn số HV theo trạng thái và điểm trung bình] Q: Thống kê T16 tính trên ai? → A: chỉ HV đã nộp (có điểm bài thi); HV "Vắng" và "Chưa thi" không tính vào điểm trung bình/cao nhất/thấp nhất (AC-13.3). (source: assumption — tránh làm sai lệch thống kê bằng điểm 0 giả định; việc tính 0 cho xếp hạng thuộc 008)

### Session 2026-10-19

- [thay thế 2026-10-22: bài thi độc lập, không thuộc Bài] Q: Bài thi thuộc về đâu trong cấu trúc mới? → A: D2 v2 — Giáo trình → danh sách Bài → mỗi Bài có 3 section cố định Bài học · Bài tập · Bài thi; bài thi là section Bài thi của một Bài, tạo từ tab Bài thi của T18 (AC-1.1). (source: stakeholder)
- [thay thế 2026-10-22] Q: Một Bài có một hay nhiều bài thi? → A: tối đa một bài thi hiện hành mỗi Bài (cộng tối đa một phiên bản mới đang Nháp); tạo bài thi thứ hai bị chặn (AC-1.2, AC-4.1). Xác nhận đề xuất của brief v2. (source: assumption — lộ trình đặt Bài thi ở cuối mỗi Bài, điểm và tiến độ theo Bài đơn giản; thi lại đã có số lượt và ngoại lệ; thi giữa kỳ/cuối kỳ làm bằng một Bài riêng chỉ có section Bài thi)
- Q: Loại câu hỏi và cách chấm? → A: D3 v2 — chỉ các loại tự chấm của 005 (Trắc nghiệm kể cả dạng từ vựng, Điền chỗ trống, Nối cặp, Sắp xếp từ thành câu, Viết chữ Hán theo pinyin, Đọc hiểu); mọi bài nộp có điểm ngay; bỏ Viết/Nói, chấm tay, "Chờ chấm" và mọi phụ thuộc vào 007 (hoãn) (AC-2.3, REQ-11, §9). (source: stakeholder)
- [thay thế 2026-10-22: một lịch cho mỗi bài thi] Q: Lịch thi đặt theo lớp hay một lần cho Giáo trình (v1 Q-1)? → A: X4 — theo từng lớp. Q-1 đóng. Ô lịch thi nằm trong tab Nội dung của T04 (màn hình của 003), danh sách trong tab Kết quả thi → T16; 006 sở hữu hộp thoại lịch thi và quy tắc của nó (REQ-5, REQ-6). (source: stakeholder)
- Q: Sửa đáp án sau khi đã có bài nộp (v1 Q-3)? → A: X5 — nội dung câu hỏi khóa từ lượt làm đầu tiên; muốn đổi thì nhân bản. Q-3 đóng (AC-3.3). [Ghi chú 2026-10-22: khóa từ lượt làm đầu tiên vẫn áp dụng (AC-4.2); "Nhân bản" là AC-6.6; việc sửa đáp án và chấm lại được hỏi lại ở Q-5] (source: stakeholder)
- [thay thế 2026-10-22: không còn phiên bản] Q: "Nhân bản để sửa" hoạt động thế nào khi mỗi Bài chỉ có một bài thi? → A: "Tạo phiên bản mới" tạo một bản Nháp trong cùng Bài; bài hiện hành vẫn dùng cho tới khi phiên bản mới được xuất bản; không xuất bản khi còn HV đang thi; khi xuất bản, bài cũ "Đã thay thế" (chỉ xem), lịch thi không chuyển sang, số lượt tính lại (REQ-4). (source: assumption — giữ "một bài thi hiện hành mỗi Bài", không cắt ngang HV đang thi, GV đặt lịch mới có chủ đích)
- [thay thế 2026-10-22] Q: Điểm của phiên bản cũ khi bị thay thế? → A: chưa quyết — Q-4; spec tạm viết theo (a) "không tính điểm, giữ làm lịch sử" (AC-4.4, AC-11.4). (source: assumption — tạm theo phương án đề xuất cho tới khi stakeholder trả lời)
- Q: GV xem bài nộp của HV ở đâu? → A: X3 — trên T14 "Xem bài nộp (chỉ đọc)" do 005 sở hữu, mở từ T16 (AC-13.5); chế độ chấm của T14 thuộc 007 (hoãn). (source: stakeholder)
- [thay thế 2026-10-22: ẩn theo lớp không áp dụng cho bài thi] Q: Khi lớp ẩn section Bài thi của một Bài thì sao? → A: D5 + X2 — HV của lớp đó không thấy bài thi, bài nộp, kết quả; điểm đã đạt được giữ; lớp khác không bị ảnh hưởng; hiện lại thì khôi phục (AC-14.1, AC-14.4, AC-14.5). (source: stakeholder)
- [thay thế 2026-10-22] Q: Lịch thi đang mở khi section bị ẩn? → A: giữ nguyên, thời điểm mở/đóng vẫn tính theo đồng hồ; GV vẫn đặt/sửa lịch và được cảnh báo rằng HV chưa thấy (AC-14.4, AC-14.6, AC-5.5). (source: assumption — không tự sửa dữ liệu GV đã đặt; hiện lại khôi phục đúng trạng thái theo thời gian thực, dễ đoán)
- [thay thế 2026-10-22] Q: HV đang làm bài khi section bị ẩn? → A: R1 — lượt đang chạy không bao giờ bị cắt ngang: HV làm tiếp trên S07, câu trả lời vẫn được ghi nhận tới khi nộp hoặc hết giờ (nộp tự động); sau đó HV thấy "Đã nộp bài thi. Kết quả hiện chưa thể xem." và không thấy kết quả khi section còn ẩn; không có lượt mới khi còn ẩn; hộp xác nhận ẩn của 003 vẫn báo số HV đang thi (AC-14.1, AC-14.2, AC-14.3, AC-14.7). Thay giả định trước đó trong phiên này (ngừng ghi nhận câu trả lời từ thời điểm ẩn). (source: assumption — cross-module alignment (orchestrator), khớp 003 AC-18.3, AC-18.4)
- [thay thế 2026-10-22] Q: Kết quả và công bố khi section bị ẩn? → A: X2 — kết quả không hiển thị cho HV; việc công bố theo chính sách vẫn diễn ra và HV thấy khi section được hiện lại; điểm đã ghi nhận cho 008 giữ nguyên (AC-14.1, AC-14.4, AC-14.5). (source: stakeholder X2; phần công bố là assumption — tách "công bố" khỏi "hiển thị" để không phải tính lại khi hiện lại)
- Q: AI có tạo bài thi không? → A: không trong MVP; GV soạn thủ công trên T10; tạo hoặc tạo lại nội dung Bài bằng AI không tạo và không sửa bài thi (AC-1.3). [Ghi chú 2026-10-22: vẫn áp dụng — nay soạn trên T22; stakeholder xác nhận "không AI cho bài thi"] (source: stakeholder — D6 v2)
- Q: Lớp kết thúc khi HV đang thi? → A: R1 — lượt tiếp tục, câu trả lời vẫn được ghi nhận tới khi HV nộp hoặc hết giờ (nộp tự động); không ai bắt đầu được lượt mới (AC-9.7). Thay giả định trước đó trong phiên này (nộp tự động ngay). (source: assumption — cross-module alignment (orchestrator), khớp 003 AC-10.3)
- [thay thế 2026-10-22: Nháp / Đã lên lịch / Đang mở / Đã đóng / Lưu trữ] Q: Trạng thái nội dung của bài thi? → A: Nháp → Đã xuất bản (không quay lại Nháp) → Đã thay thế (khi có phiên bản mới); bỏ "Đã ẩn" cấp Giáo trình (AC-3.1, AC-4.2). (source: stakeholder — brief v2 §2)
- [thay thế 2026-10-22: quy tắc hiển thị mới AC-7.1] Q: Khi nào HV thấy bài thi? → A: Bài Đã xuất bản, bài thi Đã xuất bản, section Bài thi không bị ẩn với lớp, lớp đã bắt đầu (A9); thêm lịch thi để làm bài — chưa có lịch HV thấy "Chưa mở" (AC-7.1, AC-7.2, AC-14.1, AC-16.2, AC-16.5). (source: stakeholder — brief v2 §2)
- [thay thế 2026-10-22: Đã nộp / Đang làm / Chưa làm / Không làm bài] Q: Trạng thái HV trên T16? → A: Chưa thi / Đang thi / Đã nộp / Vắng — bỏ "Chờ chấm" và "Đã có điểm" vì mọi bài nộp có điểm ngay (AC-13.2). (source: assumption — hệ quả trực tiếp của D3 v2)
- Q: Xóa bài thi? → A: được khi chưa có lượt làm nào (kể cả đã xuất bản, xóa kèm lịch thi); đã có lượt làm thì chặn (AC-1.4, AC-1.5). [Ghi chú 2026-10-22: vẫn áp dụng (AC-6.1, AC-6.2), thêm Lưu trữ cho bài thi đã đóng] (source: assumption — brief v2 §2: nội dung có dữ liệu học tập không xóa được)
- [thay thế 2026-10-22: stakeholder — đáp án và giải thích luôn hiện sau giờ đóng] Q: Tùy chọn xem đáp án đặt tên thế nào? → A: "Hiện đáp án và giải thích khi công bố", gồm cả giải thích cho khớp 005; v1 Q-2 vẫn mở vì stakeholder chưa trả lời (AC-12.6, Q-2). (source: assumption — dùng cùng khái niệm với 005)
- Q: Thứ tự hiển thị Nối cặp và Sắp xếp từ thành câu? → A: theo quy tắc của 005, tạo riêng cho mỗi lượt và giữ nguyên khi tiếp tục (AC-8.8). (source: assumption — cùng lý do với xáo trộn phương án: HV tiếp tục đúng màn hình đã thấy)
- [thay thế 2026-10-22: bài thi mới có tên trống, GV tự nhập] Q: Tiêu đề mặc định của bài thi mới? → A: "Bài thi – {tên Bài}" (AC-1.1). (source: assumption — giảm thao tác, GV sửa được)
- [thay thế 2026-10-22] Q: Section Bài thi chứa những phiên bản nào và 002 hiển thị thế nào? → A: R2 — tối đa 1 bài thi hiện hành, tối đa 1 phiên bản mới Nháp, không giới hạn phiên bản "Đã thay thế" (lịch sử); lộ trình chỉ hiện bài thi hiện hành, luôn ở cuối; T18 có thẻ bài thi hiện hành, thẻ phiên bản mới và danh sách thu gọn "Phiên bản trước"; nhân bản Bài chỉ sao chép bài thi hiện hành thành Nháp, không kèm lịch, lượt làm, kết quả (REQ-1, REQ-4, §7, §10). (source: assumption — cross-module alignment (orchestrator))
- [thay thế 2026-10-22] Q: Q-4 liên quan 008 thế nào? → A: R7 — 008 tham chiếu Q-4; nếu Q-4 = (a), điểm của phiên bản bị thay thế bị trừ khi phiên bản mới được xuất bản, hiển thị là "Điều chỉnh điểm" với lý do "Bài thi được thay thế" (Q-4, §10). Đã rà soát: không AC nào phụ thuộc Chờ chấm, T13 hay 007. (source: assumption — cross-module alignment (orchestrator))
