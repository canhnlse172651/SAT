---
id: 007
slug: manual-grading
title: Manual Grading
status: draft
branch: feat/007-manual-grading
created: 2026-10-18
updated: 2026-10-18
approved_by:
approved_at:
---

# Chấm bài tự luận (Manual Grading)

> **HOÃN — ngoài MVP (stakeholder, 2026-10-19).** MVP chỉ có các dạng câu hỏi tự chấm. Nói, Nghe, Viết đoạn tự do và việc chấm tay để giai đoạn sau. Spec này được giữ nguyên để dùng lại khi đưa các dạng đó vào; không lên plan/implement trong MVP. Màn hình T14 trong MVP là "Xem bài nộp (chỉ đọc)" do 005 sở hữu; chế độ chấm của T14 và T13 thuộc giai đoạn sau.

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

## 1. Summary

Câu hỏi Viết (bài viết gõ phím) và Nói (bản ghi âm) không thể chấm tự động; theo quyết định D3, Giáo viên (GV) chấm thủ công bằng điểm và nhận xét, không dùng AI. Nếu không có một nơi tập trung, GV không biết bài nào đang chờ, phải tự tìm câu trả lời của từng Học viên (HV), còn HV chờ kết quả lâu và dễ bị bỏ sót. Module này cung cấp **Hàng chờ chấm (T13)** gom mọi bài nộp Bài tập (005) và Bài thi (006) có câu Viết/Nói chưa chấm, và màn hình **Chấm bài nộp (T14)** để đọc/nghe câu trả lời, cho điểm từng câu trong thang điểm của câu, nhận xét, lưu nháp, hoàn tất và chấm lại có lịch sử. Khi GV hoàn tất, bài nộp có điểm cuối cùng (điểm tự động + điểm chấm tay), HV thấy điểm và nhận xét, còn điểm xếp hạng (008) và tiến độ (009) được cập nhật.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| HV nhận phản hồi Viết/Nói nhanh | Trung vị thời gian chờ chấm (từ lúc HV nộp đến lúc GV hoàn tất lần đầu) của các bài nộp trong một workspace, tính theo tháng | ≤ 48 giờ, từ tháng sử dụng thứ 2 |
| Không bỏ sót bài | Tỷ lệ bài nộp Cần chấm đã chờ quá 7 ngày trên tổng số bài nộp Cần chấm, đo cuối mỗi tuần | ≤ 5% |
| Chấm nhanh, không cần hướng dẫn | Tỷ lệ GV trong thử nghiệm khả dụng (ít nhất 5 GV) chấm xong một bài nộp mẫu gồm 1 câu Viết và 1 câu Nói (bản ghi 60 giây) không cần trợ giúp, trong ≤ 4 phút | ≥ 90% |
| Kết quả chính xác và kín đáo | Số sự cố HV thấy điểm/nhận xét nháp, hoặc thấy kết quả khác với kết quả GV đã xác nhận | 0 |
| Chấm lại minh bạch | Tỷ lệ lần hoàn tất và chấm lại có mục tương ứng trong Lịch sử chấm | 100% |

## 3. Actors & Context

- **Giáo viên (GV)** — chủ và quản trị viên duy nhất của workspace (D1). Chấm bài trên máy tính (thiết kế cho ≥ 1280 px, dùng được từ 1024 px — A4), thường theo đợt: mở hàng chờ, chấm lần lượt từ bài cũ nhất. Ngoài hệ thống, GV hiện thường nhận bài viết/ghi âm qua ứng dụng nhắn tin và ghi điểm thủ công, khó biết bài nào chưa chấm và khó trả nhận xét cho từng HV.
- **Học viên (HV)** — người nộp Bài tập/Bài thi có câu Viết/Nói (005/006), chủ yếu dùng điện thoại (A4). HV không thao tác trong T13/T14; HV chỉ thấy kết quả sau khi GV hoàn tất, trên S06/S08.
- **Các module liên quan** — 005/006 tạo bài nộp và điểm câu chấm tự động; 008 dùng điểm cuối cùng để tính điểm xếp hạng; 009 hiển thị số bài chờ chấm và thời gian chờ chấm; 001/002/003 cung cấp trạng thái tài khoản, nội dung và lớp.

Thuật ngữ dùng trong module này (bổ sung cho glossary chung):

- **Câu chấm tay**: câu Viết hoặc Nói. **Câu chấm tự động**: Trắc nghiệm, Điền chỗ trống, Đọc hiểu.
- **Trạng thái chấm** của một bài nộp: "Chờ chấm" (chưa có gì được lưu), "Đang chấm" (đã lưu nháp, chưa hoàn tất), "Đã chấm" (đã hoàn tất), "Đã thay thế" (lượt Bài tập bị thay bởi lượt mới hơn của cùng HV trước khi được chấm).
- **Cần chấm**: trạng thái "Chờ chấm" hoặc "Đang chấm".
- **Câu trả lời trống**: câu Viết rỗng hoặc chỉ có khoảng trắng; câu Nói không có bản ghi âm.
- **Thời gian chờ chấm**: khoảng thời gian từ lúc HV nộp đến lúc GV hoàn tất lần đầu (với bài nộp Cần chấm: đến thời điểm hiện tại).
- **Điểm cuối cùng**: tổng điểm các câu chấm tự động cộng tổng điểm các câu chấm tay của một bài nộp đã hoàn tất.

## 4. User Stories

- US-1 (P1): Là GV, tôi muốn xem một hàng chờ chung gồm mọi bài nộp có câu Viết/Nói chưa chấm của tất cả các lớp, lọc và sắp xếp được, để biết cần chấm gì và chấm bài cũ nhất trước.
  - Why this priority: Không có hàng chờ thì GV không biết bài nào cần chấm; mọi luồng chấm bắt đầu từ đây.
  - Independent test: Tạo sẵn bài nộp có câu Viết/Nói ở 2 lớp (cả Bài tập và Bài thi) rồi mở T13: thấy đúng các mục, đúng cột, thứ tự cũ nhất trước, bộ lọc và huy hiệu đúng số lượng; workspace không có bài thì thấy trạng thái rỗng.
- US-2 (P1): Là GV, tôi muốn đọc câu trả lời Viết của HV cùng đề bài, nhập điểm trong thang điểm của câu, viết nhận xét và lưu nháp, để chấm chính xác và có thể làm tiếp sau.
  - Why this priority: Là nửa cốt lõi của D3; thiếu nó thì câu Viết không bao giờ có điểm.
  - Independent test: Mở một bài nộp có 2 câu Viết, nhập điểm và nhận xét, lưu nháp, tải lại trang: dữ liệu còn nguyên, trạng thái "Đang chấm", HV vẫn thấy "Chờ chấm"; nhập điểm vượt điểm tối đa bị chặn.
- US-3 (P1): Là GV, tôi muốn nghe bản ghi âm câu Nói với phát/tạm dừng, tua và đổi tốc độ, để đánh giá phát âm, nội dung rồi cho điểm.
  - Why this priority: Là nửa còn lại của D3; không nghe được thì không chấm được câu Nói.
  - Independent test: Mở bài nộp có câu Nói, phát, tua tới giữa, đổi sang 1,25x, cho điểm; với bản ghi âm hỏng thấy thông báo lỗi và vẫn cho điểm được.
- US-4 (P1): Là GV, tôi muốn hoàn tất chấm một bài nộp sau khi xác nhận tổng điểm, để HV nhận điểm và nhận xét, và điểm cuối cùng được dùng cho xếp hạng và tiến độ.
  - Why this priority: Đây là lúc giá trị đến tay HV và vòng 005/006 → 007 → 008/009 khép lại.
  - Independent test: Hoàn tất một bài nộp đủ điểm: trạng thái "Đã chấm", rời bộ lọc "Cần chấm", huy hiệu giảm 1, HV mở S06 thấy tổng điểm (tự động + chấm tay) và nhận xét; với Bài thi chưa công bố kết quả, HV chưa thấy gì.
- US-5 (P2): Là GV, tôi muốn chuyển ngay sang bài kế tiếp trong hàng chờ (và dùng phím tắt nếu có), để chấm cả loạt bài mà không phải quay lại danh sách.
  - Why this priority: Tăng tốc độ chấm, nhưng chấm từng bài qua T13 vẫn đủ dùng cho MVP.
  - Independent test: Với bộ lọc còn 3 bài, hoàn tất bài 1, bấm "Chấm bài tiếp theo" thì mở bài 2 đúng thứ tự; hết bài thì quay về T13 với thông báo.
- US-6 (P2): Là GV, tôi muốn chấm lại một bài đã hoàn tất và có lịch sử các lần chấm, để sửa sai sót mà vẫn minh bạch với HV.
  - Why this priority: Sai sót hiếm nhưng cần sửa được; luồng chính vẫn hoạt động nếu chưa có.
  - Independent test: Chấm lại bài đã chấm, đổi điểm 1 câu, hoàn tất: HV thấy điểm mới với nhãn "Điểm đã được giáo viên cập nhật lúc …", T14 có 2 mục Lịch sử chấm, thời gian chờ chấm không đổi.
- US-7 (P1): Là GV, tôi muốn chỉ mình tôi xem và chấm được bài nộp trong workspace của mình, và việc chấm vẫn đúng khi có tình huống bất thường (hai cửa sổ, HV rời lớp, bài bị ẩn, HV nộp lượt mới), để điểm không bị lộ, mất hoặc ghi đè.
  - Why this priority: Bảo mật và toàn vẹn điểm là điều kiện bắt buộc (Constitution V); lỗi ở đây làm mất niềm tin vào toàn bộ hệ thống điểm.
  - Independent test: GV khác mở đường dẫn bài nộp → "Không tìm thấy bài nộp."; hai tab cùng lưu → tab sau bị từ chối với thông báo; bài nộp của HV đã rời lớp vẫn chấm được.

## 5. Functional Requirements

### REQ-1: Tiếp nhận bài nộp vào hàng chờ

<!-- Story: US-1 · Priority: P1 -->

- AC-1.1: WHEN HV nộp một lượt Bài tập hoặc Bài thi có ít nhất một câu Viết hoặc Nói có câu trả lời không trống THE SYSTEM SHALL đưa bài nộp đó vào Hàng chờ chấm (T13) của GV sở hữu workspace thành đúng một mục với trạng thái "Chờ chấm".
- AC-1.2: IF bài nộp không chứa câu Viết hoặc Nói nào THEN THE SYSTEM SHALL không đưa bài nộp đó vào Hàng chờ chấm.
- AC-1.3: IF bài nộp có câu Viết/Nói nhưng mọi câu đó đều có câu trả lời trống THEN THE SYSTEM SHALL chấm 0 điểm cho các câu đó, chuyển bài nộp sang "Đã chấm" ngay khi nộp với điểm cuối cùng bằng tổng điểm câu chấm tự động, phát sinh "Bài nộp đã chấm xong" và "Bài nộp có điểm cuối cùng", không đưa vào Hàng chờ chấm và không ghi nhận thời gian chờ chấm cho bài nộp này [NEEDS CLARIFICATION: Bài nộp mà mọi câu Viết/Nói đều bỏ trống có được tự động chấm 0 và bỏ qua hàng chờ như đề xuất, hay vẫn vào hàng chờ để GV nhận xét?]
- AC-1.4: WHEN HV nộp một lượt mới của cùng Bài tập trong cùng Lớp trong khi lượt trước của HV đó đang ở trạng thái "Chờ chấm" THE SYSTEM SHALL chuyển lượt trước sang "Đã thay thế", gỡ nó khỏi Hàng chờ chấm và không ghi nhận điểm cuối cùng cho lượt đó [NEEDS CLARIFICATION: Khi HV nộp lượt mới của cùng Bài tập, lượt cũ còn "Chờ chấm" có bị thay thế (không chấm, không tính điểm) như đề xuất, hay GV phải chấm mọi lượt để giữ đúng quy tắc lấy điểm lượt cao nhất (A10)?]
- AC-1.5: WHEN HV nộp một lượt mới của cùng Bài tập trong cùng Lớp trong khi lượt trước của HV đó đang ở trạng thái "Đang chấm" THE SYSTEM SHALL giữ lượt trước trong Hàng chờ chấm kèm nhãn "Có lượt mới hơn" và đưa lượt mới vào hàng chờ thành một mục riêng.
- AC-1.6: WHEN HV nộp thêm một lượt Bài thi THE SYSTEM SHALL giữ nguyên trạng thái chấm của mọi lượt thi trước đó của HV, tức là lượt Bài thi không bao giờ bị thay thế.

### REQ-2: Danh sách Hàng chờ chấm (T13)

<!-- Story: US-1 · Priority: P1 -->

- AC-2.1: WHEN GV mở T13 THE SYSTEM SHALL hiển thị danh sách bài nộp của workspace với các cột Học viên, Lớp, Bài (tên và lượt thứ mấy), Loại (Bài tập/Bài thi), Câu cần chấm (số câu Viết và số câu Nói), Nộp lúc, Thời gian chờ và Trạng thái, tối đa 50 mục mỗi trang kèm tổng số mục phù hợp.
- AC-2.2: WHEN GV mở T13 lần đầu trong phiên đăng nhập THE SYSTEM SHALL áp dụng bộ lọc Trạng thái "Cần chấm" và sắp xếp theo Nộp lúc từ cũ nhất đến mới nhất.
- AC-2.3: THE SYSTEM SHALL hiển thị Nộp lúc theo giờ Việt Nam (UTC+7) dạng dd/MM/yyyy HH:mm và Thời gian chờ dạng "{n} phút" khi dưới 1 giờ, "{n} giờ" khi dưới 24 giờ và "{n} ngày" khi từ 24 giờ trở lên, làm tròn xuống.
- AC-2.4: WHILE một bài nộp Cần chấm đã chờ quá 48 giờ THE SYSTEM SHALL đánh dấu mục đó trên T13 bằng nhãn "Chờ lâu" [NEEDS CLARIFICATION: Ngưỡng "Chờ lâu" là 48 giờ (đề xuất, khớp mục tiêu trung vị ≤ 48 giờ) hay giá trị khác, và GV có cần tự chỉnh ngưỡng này không?]
- AC-2.5: THE SYSTEM SHALL hiển thị trên mục "Chấm bài" của thanh điều hướng bên trái một huy hiệu bằng số bài nộp Cần chấm của workspace, hiển thị "99+" khi vượt quá 99 và ẩn huy hiệu khi bằng 0.
- AC-2.6: IF workspace không có bài nộp Cần chấm nào và bộ lọc đang ở mặc định THEN THE SYSTEM SHALL hiển thị trạng thái rỗng "Không có bài nào cần chấm. Bài Viết/Nói học viên nộp sẽ xuất hiện tại đây."

### REQ-3: Lọc, tìm kiếm và sắp xếp hàng chờ

<!-- Story: US-1 · Priority: P1 -->

- AC-3.1: THE SYSTEM SHALL cung cấp trên T13 các bộ lọc kết hợp được: Lớp, Bài, Loại bài (Bài tập/Bài thi), Loại câu hỏi (Viết/Nói) và Trạng thái (Cần chấm, Chờ chấm, Đang chấm, Đã chấm), trong đó bộ lọc Bài chỉ liệt kê Bài tập/Bài thi có bài nộp chấm tay, thuộc Lớp đã chọn nếu có.
- AC-3.2: WHEN GV chọn Loại câu hỏi "Viết" hoặc "Nói" THE SYSTEM SHALL chỉ hiển thị bài nộp có ít nhất một câu thuộc loại đã chọn.
- AC-3.3: WHEN GV nhập từ khóa vào ô "Tìm học viên" THE SYSTEM SHALL chỉ hiển thị bài nộp của HV có họ tên hoặc email chứa từ khóa, không phân biệt chữ hoa/thường và dấu tiếng Việt.
- AC-3.4: WHEN GV bấm tiêu đề cột "Nộp lúc" THE SYSTEM SHALL đảo thứ tự sắp xếp giữa cũ nhất trước và mới nhất trước.
- AC-3.5: IF không có bài nộp nào phù hợp với bộ lọc hoặc từ khóa THEN THE SYSTEM SHALL hiển thị "Không có bài nộp phù hợp với bộ lọc." kèm nút "Xóa bộ lọc" đưa bộ lọc, từ khóa và thứ tự sắp xếp về mặc định.
- AC-3.6: WHEN GV quay lại T13 từ T14 trong cùng phiên đăng nhập THE SYSTEM SHALL giữ nguyên bộ lọc, từ khóa, thứ tự sắp xếp và trang đang xem.

### REQ-4: Xem bài nộp trên màn hình chấm (T14)

<!-- Story: US-2 · Priority: P1 -->

- AC-4.1: WHEN GV mở một bài nộp từ T13 hoặc từ liên kết chấm bài ở màn hình khác THE SYSTEM SHALL hiển thị T14 với phần đầu gồm tên HV, Lớp, tên Bài, Loại bài, lượt làm thứ mấy, Nộp lúc, Thời gian chờ và Trạng thái chấm.
- AC-4.2: THE SYSTEM SHALL liệt kê các câu Viết/Nói của bài nộp theo đúng thứ tự trong bài, mỗi câu gồm số thứ tự, loại câu, đề bài (kèm hình ảnh/âm thanh của đề nếu có) và điểm tối đa đúng như tại thời điểm HV nộp, kể cả khi đề đã được sửa sau đó.
- AC-4.3: WHEN câu là Viết THE SYSTEM SHALL hiển thị nguyên văn câu trả lời của HV (giữ xuống dòng, chữ Hán và pinyin), kèm "Số ký tự: {n}" không tính khoảng trắng và yêu cầu độ dài của đề nếu đề có quy định.
- AC-4.4: IF một câu Viết/Nói có câu trả lời trống THEN THE SYSTEM SHALL hiển thị "Học viên không trả lời câu này.", đặt sẵn điểm 0 không sửa được cho câu đó và vẫn cho nhập nhận xét.
- AC-4.5: THE SYSTEM SHALL hiển thị các câu chấm tự động của cùng bài nộp ở chế độ chỉ đọc, mỗi câu gồm câu trả lời của HV, đáp án đúng và điểm đạt được/điểm tối đa, và không cho GV sửa điểm các câu này.
- AC-4.6: WHEN GV thay đổi điểm của bất kỳ câu Viết/Nói nào THE SYSTEM SHALL cập nhật ngay trên T14 bảng tổng hợp gồm Điểm tự động (đạt/tối đa), Điểm chấm tay (đã nhập/tối đa) và Tổng dự kiến (tổng hai phần/tổng điểm tối đa của bài).

### REQ-5: Nghe câu trả lời Nói

<!-- Story: US-3 · Priority: P1 -->

- AC-5.1: WHEN câu là Nói THE SYSTEM SHALL hiển thị trình phát bản ghi âm của HV gồm nút Phát/Tạm dừng, thanh tua, thời điểm đang phát và tổng thời lượng dạng mm:ss.
- AC-5.2: WHEN GV kéo hoặc bấm vào một vị trí trên thanh tua THE SYSTEM SHALL phát tiếp từ vị trí đó.
- AC-5.3: WHEN GV chọn tốc độ phát 0,75x, 1x, 1,25x hoặc 1,5x THE SYSTEM SHALL phát bản ghi âm ở tốc độ đã chọn và giữ tốc độ đó cho các bản ghi âm GV mở tiếp theo trong cùng phiên đăng nhập.
- AC-5.4: WHEN GV bắt đầu phát một bản ghi âm hoặc âm thanh đề khác trên T14 THE SYSTEM SHALL tạm dừng âm thanh đang phát.
- AC-5.5: IF bản ghi âm bị thiếu hoặc không phát được THEN THE SYSTEM SHALL hiển thị "Không phát được bản ghi âm của học viên." kèm nút "Thử lại" và vẫn cho GV nhập điểm và nhận xét cho câu đó.

### REQ-6: Nhập điểm và nhận xét

<!-- Story: US-2, US-3 · Priority: P1 -->

- AC-6.1: THE SYSTEM SHALL cung cấp cho mỗi câu Viết/Nói một ô "Điểm" nhận giá trị từ 0 đến điểm tối đa của câu, là bội số của 0,25 hoặc bằng đúng điểm tối đa, chấp nhận dấu phẩy hoặc dấu chấm thập phân.
- AC-6.2: IF điểm nhập nhỏ hơn 0 hoặc lớn hơn điểm tối đa của câu THEN THE SYSTEM SHALL hiển thị "Điểm phải từ 0 đến {điểm tối đa}." dưới ô điểm và không cho lưu nháp hay hoàn tất cho tới khi sửa.
- AC-6.3: IF điểm nhập không phải là số hoặc không phải bội số của 0,25 và khác điểm tối đa THEN THE SYSTEM SHALL hiển thị "Điểm phải là bội số của 0,25 (ví dụ: 1; 1,25; 1,5)." dưới ô điểm và không cho lưu nháp hay hoàn tất cho tới khi sửa.
- AC-6.4: THE SYSTEM SHALL cung cấp ô "Nhận xét" không bắt buộc tối đa 2000 ký tự cho mỗi câu Viết/Nói và ô "Nhận xét chung" không bắt buộc tối đa 3000 ký tự cho cả bài nộp, mỗi ô có bộ đếm ký tự và chấp nhận chữ Hán, pinyin và xuống dòng.
- AC-6.5: IF nhận xét, nhận xét chung hoặc lý do chấm lại vượt giới hạn ký tự THEN THE SYSTEM SHALL hiển thị "Nhận xét tối đa 2000 ký tự.", "Nhận xét chung tối đa 3000 ký tự." hoặc "Lý do chấm lại tối đa 500 ký tự." tương ứng và không cho lưu nháp hay hoàn tất cho tới khi sửa.

### REQ-7: Lưu nháp

<!-- Story: US-2 · Priority: P1 -->

- AC-7.1: WHEN GV bấm "Lưu nháp" THE SYSTEM SHALL lưu mọi điểm và nhận xét đã nhập kể cả khi còn câu chưa có điểm, chuyển bài nộp sang "Đang chấm" và hiển thị "Đã lưu nháp lúc {HH:mm}".
- AC-7.2: WHEN GV mở lại một bài nộp "Đang chấm" THE SYSTEM SHALL điền sẵn điểm và nhận xét của lần lưu nháp gần nhất.
- AC-7.3: WHILE bài nộp ở trạng thái "Chờ chấm" hoặc "Đang chấm" THE SYSTEM SHALL không hiển thị cho HV bất kỳ điểm hay nhận xét nào của câu Viết/Nói và nhận xét chung, và hiển thị các câu đó cho HV là "Chờ chấm".
- AC-7.4: WHEN GV rời T14 trong khi còn thay đổi chưa lưu THE SYSTEM SHALL hỏi "Bạn có thay đổi chưa lưu. Rời trang mà không lưu?" với lựa chọn "Ở lại" (mặc định) và "Rời trang".
- AC-7.5: IF lưu nháp thất bại do mất kết nối hoặc phiên đăng nhập đã hết hạn THEN THE SYSTEM SHALL giữ nguyên mọi dữ liệu GV đã nhập trên màn hình và hiển thị "Chưa lưu được. Kiểm tra kết nối và thử lại." hoặc "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để lưu." tương ứng.

### REQ-8: Hoàn tất chấm và điểm cuối cùng

<!-- Story: US-4 · Priority: P1 -->

- AC-8.1: WHEN GV bấm "Hoàn tất chấm" và mọi câu Viết/Nói đã có điểm hợp lệ THE SYSTEM SHALL hiển thị hộp xác nhận nêu "Tổng điểm: {tổng}/{tối đa}" và "Sau khi hoàn tất, học viên sẽ thấy điểm và nhận xét." (với Bài thi chưa công bố kết quả: "Học viên sẽ thấy điểm và nhận xét khi kết quả bài thi được công bố.") cùng nút "Xác nhận" và "Hủy".
- AC-8.2: IF GV bấm "Hoàn tất chấm" khi còn câu Viết/Nói chưa có điểm THEN THE SYSTEM SHALL không mở hộp xác nhận, hiển thị "Còn {n} câu chưa nhập điểm.", hiển thị "Vui lòng nhập điểm cho câu này." tại từng câu thiếu và cuộn tới câu thiếu đầu tiên.
- AC-8.3: WHEN GV bấm "Xác nhận" trong hộp xác nhận hoàn tất THE SYSTEM SHALL ghi nhận điểm cuối cùng của bài nộp bằng tổng điểm các câu chấm tự động cộng tổng điểm các câu Viết/Nói, chuyển bài nộp sang "Đã chấm" và không còn tính bài nộp đó trong "Cần chấm" và huy hiệu "Chấm bài".
- AC-8.4: WHEN một bài nộp được hoàn tất lần đầu THE SYSTEM SHALL ghi nhận thời điểm hoàn tất và thời gian chờ chấm (thời điểm hoàn tất lần đầu trừ thời điểm nộp), hiển thị giá trị này ở cột Thời gian chờ của bài nộp trên T13 và cung cấp nó cho Dashboard (009).
- AC-8.5: WHEN một bài nộp được hoàn tất THE SYSTEM SHALL phát sinh các sự kiện nghiệp vụ "Bài nộp đã chấm xong" (cho 005/006) và "Bài nộp có điểm cuối cùng" (cho 005/006, 008 và 009) kèm điểm cuối cùng của bài nộp.
- AC-8.6: IF việc hoàn tất không thành công vì bất kỳ lý do nào THEN THE SYSTEM SHALL giữ bài nộp ở trạng thái trước đó, không công bố điểm hay nhận xét nào cho HV, giữ nguyên dữ liệu GV đã nhập trên màn hình và hiển thị "Chưa hoàn tất được. Kiểm tra kết nối và thử lại."

### REQ-9: HV xem kết quả sau khi chấm

<!-- Story: US-4 · Priority: P1 -->

- AC-9.1: WHEN một bài nộp được hoàn tất THE SYSTEM SHALL hiển thị cho HV đã nộp, trên S06 (Bài tập) hoặc S08 (Bài thi), tổng điểm cuối cùng, điểm và nhận xét của từng câu Viết/Nói, và nhận xét chung của GV.
- AC-9.2: IF bài nộp thuộc Bài thi mà kết quả chưa được công bố theo cài đặt của Bài thi (006) THEN THE SYSTEM SHALL không hiển thị điểm và nhận xét cho HV cho tới khi kết quả được công bố.
- AC-9.3: WHILE HV chưa mở một kết quả vừa hiển thị cho mình (lần đầu hoặc sau khi chấm lại) THE SYSTEM SHALL gắn nhãn "Có kết quả mới" cho Bài tập/Bài thi đó trên S02.
- AC-9.4: WHEN một lượt Bài tập chuyển sang "Đã thay thế" THE SYSTEM SHALL hiển thị cho HV ở lượt đó "Không chấm — đã có lượt làm mới hơn" thay cho điểm và nhận xét câu Viết/Nói.

### REQ-10: Chấm lại bài đã chấm

<!-- Story: US-6 · Priority: P2 -->

- AC-10.1: WHEN GV mở một bài nộp "Đã chấm" THE SYSTEM SHALL hiển thị điểm và nhận xét đã hoàn tất ở chế độ chỉ đọc kèm nút "Chấm lại" và mục "Lịch sử chấm".
- AC-10.2: WHEN GV bấm "Chấm lại" THE SYSTEM SHALL cho sửa điểm và nhận xét từng câu Viết/Nói, nhận xét chung và ô "Lý do chấm lại" không bắt buộc tối đa 500 ký tự, không cung cấp "Lưu nháp", và HV vẫn thấy kết quả đã hoàn tất trước đó cho tới khi GV hoàn tất chấm lại.
- AC-10.3: WHEN GV bấm "Hoàn tất chấm lại" và xác nhận THE SYSTEM SHALL thay kết quả HV thấy bằng kết quả mới, cập nhật điểm cuối cùng và, nếu HV đã từng thấy kết quả trước đó, hiển thị cho HV nhãn "Điểm đã được giáo viên cập nhật lúc {dd/MM/yyyy HH:mm}".
- AC-10.4: THE SYSTEM SHALL lưu mỗi lần hoàn tất (lần đầu và mỗi lần chấm lại) thành một mục trong "Lịch sử chấm" gồm lần thứ, thời điểm, tổng điểm, điểm và nhận xét từng câu, nhận xét chung và lý do chấm lại; chỉ GV xem được Lịch sử chấm, còn HV chỉ thấy kết quả mới nhất.
- AC-10.5: WHEN GV bấm "Hủy chấm lại" THE SYSTEM SHALL bỏ mọi thay đổi chưa hoàn tất và giữ nguyên kết quả hiện hành.
- AC-10.6: WHEN một lần chấm lại được hoàn tất THE SYSTEM SHALL phát sinh lại sự kiện "Bài nộp có điểm cuối cùng" với điểm mới và giữ nguyên thời gian chờ chấm đã ghi nhận ở lần hoàn tất đầu tiên.

### REQ-11: Chấm liên tục và phím tắt

<!-- Story: US-5 · Priority: P2 (AC-11.5: P3) -->

- AC-11.1: WHEN GV hoàn tất chấm thành công THE SYSTEM SHALL hiển thị "Đã hoàn tất chấm bài của {tên HV}." kèm nút "Chấm bài tiếp theo" và "Về hàng chờ".
- AC-11.2: WHEN GV bấm "Chấm bài tiếp theo" THE SYSTEM SHALL mở bài nộp Cần chấm kế tiếp theo bộ lọc và thứ tự sắp xếp hiện tại của T13, hoặc theo bộ lọc mặc định nếu GV không mở T14 từ T13.
- AC-11.3: IF GV bấm "Chấm bài tiếp theo" khi không còn bài nộp Cần chấm nào theo bộ lọc hiện tại THEN THE SYSTEM SHALL hiển thị "Bạn đã chấm hết các bài trong danh sách." và đưa GV về T13.
- AC-11.4: THE SYSTEM SHALL hiển thị trên T14 vị trí của bài nộp trong danh sách hiện tại dạng "Bài {i}/{n}" cùng nút "Bài trước" và "Bài tiếp theo" để chuyển giữa các bài nộp của danh sách đó.
- AC-11.5: WHERE phím tắt được cung cấp THE SYSTEM SHALL hỗ trợ Ctrl+S (⌘+S trên macOS) để lưu nháp, Ctrl+Enter để hoàn tất chấm, Alt+→ và Alt+← để sang bài tiếp theo/bài trước, phím Space để phát/tạm dừng bản ghi âm đang chọn khi con trỏ không ở ô nhập, và liệt kê các phím này trong mục "Phím tắt" trên T14.

### REQ-12: Phân quyền và bảo vệ dữ liệu chấm

<!-- Story: US-7 · Priority: P1 -->

- AC-12.1: THE SYSTEM SHALL chỉ cho GV sở hữu workspace xem T13, mở T14, chấm, chấm lại và xem Lịch sử chấm của các bài nộp thuộc HV trong workspace đó.
- AC-12.2: IF GV mở một bài nộp không thuộc workspace của mình hoặc không tồn tại THEN THE SYSTEM SHALL hiển thị cùng một thông báo "Không tìm thấy bài nộp." cho cả hai trường hợp và không tiết lộ thông tin nào về bài nộp.
- AC-12.3: IF một HV đã đăng nhập truy cập T13 hoặc T14 THEN THE SYSTEM SHALL không hiển thị dữ liệu nào và chuyển HV về S01.
- AC-12.4: IF người chưa đăng nhập truy cập T13 hoặc T14 THEN THE SYSTEM SHALL chuyển tới A01 và sau khi GV đăng nhập thành công thì mở lại đúng trang đã yêu cầu.
- AC-12.5: IF người dùng không phải HV đã ghi âm và không phải GV sở hữu workspace yêu cầu nghe một bản ghi âm câu Nói THEN THE SYSTEM SHALL từ chối và không phát nội dung bản ghi âm.

### REQ-13: Tình huống đặc biệt và xung đột khi chấm

<!-- Story: US-7 · Priority: P1 -->

- AC-13.1: IF Bài tập hoặc Bài thi của một bài nộp Cần chấm đã bị ẩn THEN THE SYSTEM SHALL giữ bài nộp trong Hàng chờ chấm với nhãn "Bài đã ẩn" và cho chấm như bình thường.
- AC-13.2: IF HV của một bài nộp Cần chấm đã bị gỡ khỏi lớp hoặc lớp đã kết thúc THEN THE SYSTEM SHALL giữ bài nộp trong Hàng chờ chấm với nhãn "HV đã rời lớp" hoặc "Lớp đã kết thúc" tương ứng và cho chấm như bình thường.
- AC-13.3: IF tài khoản của HV bị khóa THEN THE SYSTEM SHALL vẫn cho chấm bài nộp của HV đó, gắn nhãn "Tài khoản bị khóa" trên T13 và T14, và hiển thị kết quả cho HV khi HV đăng nhập lại được.
- AC-13.4: IF tài khoản của HV bị xóa theo quy định của module 001 THEN THE SYSTEM SHALL gỡ mọi bài nộp Cần chấm của HV đó khỏi Hàng chờ chấm và khỏi huy hiệu "Chấm bài".
- AC-13.5: IF bài nộp đã được lưu nháp, hoàn tất hoặc chấm lại ở một cửa sổ hay phiên khác sau khi GV mở nó THEN THE SYSTEM SHALL từ chối lần lưu của cửa sổ hiện tại, giữ nguyên dữ liệu GV đang nhập trên màn hình và hiển thị "Bài nộp này vừa được cập nhật ở cửa sổ khác. Tải lại để xem bản mới nhất."
- AC-13.6: IF bài nộp GV đang mở hoặc định lưu đã ở trạng thái "Đã thay thế" THEN THE SYSTEM SHALL hiển thị bài nộp ở chế độ chỉ đọc với thông báo "Học viên đã nộp lượt làm mới hơn; lượt này không cần chấm." kèm liên kết "Mở lượt mới nhất" và không lưu bất kỳ thay đổi nào.

## 6. Non-Functional Requirements

- NFR-1: Performance: T13 hiển thị trang đầu (50 mục) với bộ lọc bất kỳ trong ≤ 2 giây ở p95, với workspace có tới 5.000 bài nộp Cần chấm và 50.000 bài nộp Đã chấm.
- NFR-2: Performance: T14 hiển thị đầy đủ đề, câu trả lời Viết và câu chấm tự động của bài nộp tới 50 câu trong ≤ 2 giây ở p95; bản ghi âm dài tới 5 phút bắt đầu phát trong ≤ 3 giây ở p95 sau khi bấm Phát trên đường truyền 10 Mbps; Lưu nháp và Hoàn tất phản hồi trong ≤ 1 giây ở p95.
- NFR-3: Timeliness: bài nộp mới xuất hiện trong T13 và trong huy hiệu "Chấm bài" chậm nhất 60 giây sau khi HV nộp; kết quả đã hoàn tất hoặc chấm lại hiển thị cho HV ở lần mở S06/S08 kế tiếp, chậm nhất 60 giây sau khi GV xác nhận.
- NFR-4: Reliability: 100% thao tác hoàn tất và chấm lại là trọn vẹn — điểm, nhận xét, trạng thái, Lịch sử chấm và điểm cuối cùng cùng được ghi nhận hoặc không có gì thay đổi — kiểm chứng bằng kiểm thử giả lập lỗi tại mỗi bước; 0 trường hợp mất dữ liệu của một lần lưu nháp đã báo thành công.
- NFR-5: Security: 100% yêu cầu xem bài nộp, nghe bản ghi âm, chấm hoặc chấm lại bài nộp của workspace khác bị từ chối trong bộ kiểm thử phân quyền (GV khác, HV, người chưa đăng nhập); liên kết bản ghi âm bị sao chép ra ngoài ngừng phát được sau tối đa 15 phút và không bao giờ phát được với tài khoản khác.
- NFR-6: Accessibility: T13 và T14 đạt WCAG 2.1 mức AA; 100% thao tác chấm (lọc, mở bài, phát/tạm dừng/tua/đổi tốc độ, nhập điểm, nhận xét, lưu nháp, hoàn tất, chấm lại) thực hiện được chỉ bằng bàn phím và có nhãn cho trình đọc màn hình.
- NFR-7: Compatibility: T13 và T14 hoạt động đầy đủ trên 2 phiên bản mới nhất của Chrome, Edge, Firefox và Safari máy tính ở độ rộng 1024–1920 px; 100% mẫu kiểm thử chữ Hán giản thể và pinyin có dấu thanh hiển thị đúng (không có ô vuông hay ký tự lỗi).
- NFR-8: Observability: 100% thao tác lưu nháp, hoàn tất, chấm lại và truy cập bị từ chối tạo đúng một bản ghi nhật ký có cấu trúc (người thực hiện, mã bài nộp, thao tác, thời điểm, kết quả) và 0 bản ghi chứa nội dung câu trả lời, nhận xét, email hay mật khẩu.

## 7. Key Entities

- **Bài nộp (Submission)** — do 005/006 tạo khi HV nộp một lượt làm; thuộc một HV, một Lớp, một Bài tập hoặc Bài thi, có số thứ tự lượt và thời điểm nộp. Module này bổ sung: Trạng thái chấm (Chờ chấm / Đang chấm / Đã chấm / Đã thay thế), điểm cuối cùng, nhận xét chung, thời điểm hoàn tất lần đầu, thời gian chờ chấm, thời điểm cập nhật kết quả gần nhất, và việc HV đã mở kết quả mới hay chưa.
- **Câu trả lời chấm tay** — câu trả lời của HV cho một câu Viết (văn bản) hoặc Nói (bản ghi âm có thời lượng) trong bài nộp, kèm đề bài và điểm tối đa của câu tại thời điểm nộp.
- **Kết quả chấm câu** — điểm (0 đến điểm tối đa, bước 0,25) và nhận xét (≤ 2000 ký tự) GV cho một câu trả lời chấm tay; ở dạng nháp (chỉ GV thấy) hoặc đã hoàn tất.
- **Lần chấm (mục Lịch sử chấm)** — ảnh chụp một lần hoàn tất: lần thứ, thời điểm, tổng điểm, điểm và nhận xét từng câu, nhận xét chung, lý do chấm lại (nếu có). Chỉ GV xem; một bài nộp có một hoặc nhiều lần chấm.
- **Hàng chờ chấm** — tập các bài nộp Cần chấm của một workspace; là một cách nhìn trên Bài nộp chứ không phải dữ liệu riêng.
- **Dữ kiện nghiệp vụ cung cấp cho module khác** — "Bài nộp đã chấm xong" (→ 005/006), "Bài nộp có điểm cuối cùng" (→ 005/006, 008, 009), số bài nộp Cần chấm theo workspace và theo lớp (→ 009), thời gian chờ chấm của từng bài nộp đã chấm (→ 009, để tính trung vị).

## 8. Edge Cases & Error Handling

- Bài nộp có nhiều câu (tới 50 câu): T14 cuộn được, bảng tổng hợp và các nút Lưu nháp/Hoàn tất luôn trong tầm nhìn (NFR-2).
- Câu trả lời Viết rất dài (tới giới hạn do 005 quy định): hiển thị đầy đủ, cuộn trong khung câu trả lời; "Số ký tự" đếm đủ (AC-4.3).
- Bản ghi âm rất ngắn hoặc im lặng: vẫn là câu trả lời không trống, vì hệ thống không phân tích âm thanh; GV tự đánh giá và cho điểm.
- Điểm tối đa của câu không phải bội số của 0,25 (ví dụ 0,1): chỉ nhận 0 hoặc đúng điểm tối đa (AC-6.1); khuyến nghị 005 chỉ cho đặt điểm câu là bội số của 0,25.
- Tổng điểm có phần lẻ: hiển thị tối đa 2 chữ số thập phân, dấu phẩy thập phân, bỏ số 0 thừa (7,5 chứ không phải 7,50).
- Đề hoặc điểm tối đa bị sửa sau khi HV nộp (A8 — giáo trình được tham chiếu trực tiếp): T14 dùng đề và điểm tối đa tại thời điểm nộp (AC-4.2); điều này phụ thuộc 005/006 lưu lại đề tại thời điểm nộp.
- Lớp đổi giáo trình (003) sau khi HV nộp: bài nộp cũ vẫn chấm được như bình thường.
- HV bị gỡ khỏi lớp rồi được thêm lại: kết quả đã hoàn tất hiển thị lại theo quyền xem lớp của 003.
- HV nộp lượt mới trong lúc GV đang mở lượt cũ "Chờ chấm" mà chưa lưu: lượt cũ bị thay thế; khi GV lưu sẽ thấy thông báo và liên kết mở lượt mới (AC-1.4, AC-13.6).
- Hai cửa sổ cùng chấm một bài nộp: lần lưu dựa trên dữ liệu cũ bị từ chối, dữ liệu đang nhập được giữ để GV sao chép (AC-13.5).
- Phiên đăng nhập hết hạn khi đang chấm (001): dữ liệu trên màn hình được giữ, GV được yêu cầu đăng nhập lại (AC-7.5, AC-8.6). Không có tự động lưu nháp trong MVP.
- Đóng tab trình duyệt khi còn thay đổi chưa lưu: trình duyệt hiển thị hộp cảnh báo chuẩn của nó (nội dung không tùy chỉnh được); điều hướng trong ứng dụng dùng hộp thoại của AC-7.4.
- Bài thi bị tự nộp khi hết giờ (006) với một số câu Viết/Nói trống: câu trống được đặt 0 và khóa điểm (AC-4.4); nếu mọi câu Viết/Nói đều trống thì áp dụng AC-1.3.
- Chấm lại Bài thi khi kết quả chưa công bố: HV không thấy gì cho tới khi công bố, và không hiển thị nhãn cập nhật vì HV chưa từng thấy kết quả (AC-9.2, AC-10.3).
- Chấm lại làm điểm một lượt Bài tập thấp hơn lượt khác: điểm cao nhất (A10) do 005/008 tính lại từ sự kiện "Bài nộp có điểm cuối cùng" (AC-10.6).
- HV nộp bài trong lúc GV đang ở T13: danh sách không tự chèn mục mới (tránh nhảy dòng khi GV đang bấm); mục mới xuất hiện khi tải lại hoặc đổi bộ lọc, huy hiệu cập nhật chậm nhất 60 giây (NFR-3).
- Múi giờ: mọi thời điểm hiển thị theo UTC+7 bất kể múi giờ máy GV (A7); Thời gian chờ tính theo thời gian thực đã trôi qua.
- Nhận xét chỉ gồm khoảng trắng được coi là không có nhận xét; khoảng trắng đầu/cuối nhận xét bị bỏ khi lưu.
- Huy hiệu khi có hơn 99 bài Cần chấm: hiển thị "99+" (AC-2.5).

## 9. Out of Scope

- Chấm tự động hoặc bằng AI cho câu Viết/Nói, nhận dạng giọng nói, chấm phát âm tự động (D3).
- Sửa hoặc ghi đè điểm câu chấm tự động; nhận xét riêng cho từng câu chấm tự động (GV dùng Nhận xét chung). Quy tắc chấm tự động thuộc 005/006.
- Thang tiêu chí (rubric) nhiều thành phần, điểm âm, điểm thưởng vượt điểm tối đa.
- Nhận xét bằng giọng nói, tệp đính kèm, chú thích hoặc sửa lỗi trực tiếp trên bài viết.
- Trả bài cho HV làm lại, hoặc cấp thêm lượt thi (số lượt thi thuộc 006; HV tự làm lại Bài tập theo 005).
- Bỏ qua hoặc loại một bài nộp khỏi hàng chờ mà không chấm.
- Chấm hàng loạt (một câu cho nhiều HV cùng lúc), phân công người chấm khác hoặc trợ giảng.
- Tải xuống hoặc xuất bản ghi âm, bài viết, danh sách hàng chờ.
- HV phản hồi/khiếu nại điểm; HV xem Lịch sử chấm.
- Thông báo email/push khi có bài mới hoặc khi có kết quả (A6).
- Tự động lưu nháp.
- Bố cục hiển thị kết quả trên S06/S08 (thuộc 005/006); module này chỉ quy định nội dung nào hiển thị và khi nào.

## 10. Assumptions & Dependencies

**Giả định dựa vào (chi tiết trong §12):** D1, D3, D4; A3, A4, A5, A6, A7, A8, A10, A11. Các quyết định riêng của module (bước điểm 0,25; nhận xét không bắt buộc; chấm lại không giới hạn và có lịch sử; giữ bài của HV rời lớp/bị khóa; xử lý hai cửa sổ) được ghi là giả định trong §12.

**Phụ thuộc:**

- **005 Bài tập** — phát sinh "Bài nộp có câu Viết/Nói chờ chấm"; lưu đề, điểm tối đa và câu trả lời tại thời điểm nộp; cung cấp điểm câu chấm tự động; nhận "Bài nộp đã chấm xong" và "Bài nộp có điểm cuối cùng"; hiển thị trên S06 trạng thái "Chờ chấm", kết quả, nhận xét và trạng thái "Đã thay thế"; quy tắc điểm lượt cao nhất (A10) bỏ qua lượt "Đã thay thế". Đề xuất cho 005: S05 cảnh báo HV khi nộp lượt mới trong lúc lượt trước đang chờ chấm.
- **006 Bài thi** — như 005 cho Bài thi; cung cấp chính sách công bố kết quả (AC-9.2) và S08; T16 có thể liên kết sang T14.
- **008 Điểm & Xếp hạng** — nhận "Bài nộp có điểm cuối cùng" ở cả lần hoàn tất đầu và mỗi lần chấm lại.
- **009 Dashboard giáo viên** — hiển thị số bài nộp Cần chấm (T01) và trung vị thời gian chờ chấm từ dữ kiện module này cung cấp; T15 có thể liên kết sang T14.
- **003 Lớp học** — trạng thái lớp (Đã kết thúc), sự kiện HV được thêm vào/gỡ khỏi lớp; hiển thị nhãn "Có kết quả mới" trên S02 (AC-9.3).
- **001 Tài khoản & Xác thực** — sự kiện tài khoản HV bị khóa/xóa; phiên đăng nhập và chuyển hướng qua A01.
- **002 Giáo trình** — trạng thái ẩn của Bài tập/Bài thi.

## 11. Open Questions

- Q-1 (AC-1.4): [NEEDS CLARIFICATION: Khi HV nộp lượt mới của cùng Bài tập, lượt cũ còn "Chờ chấm" có bị thay thế (không chấm, không tính điểm) như đề xuất, hay GV phải chấm mọi lượt để giữ đúng quy tắc lấy điểm lượt cao nhất (A10)?] — Ảnh hưởng: khối lượng chấm của GV, điểm cao nhất của HV, hiển thị trên S06 (005). Đề xuất: thay thế, vì HV làm lại không giới hạn có thể tạo nhiều lượt thừa; lượt đã lưu nháp được giữ.
- Q-2 (AC-1.3): [NEEDS CLARIFICATION: Bài nộp mà mọi câu Viết/Nói đều bỏ trống có được tự động chấm 0 và bỏ qua hàng chờ như đề xuất, hay vẫn vào hàng chờ để GV nhận xét?] — Ảnh hưởng: số lượng hàng chờ, việc HV nhận kết quả ngay. Đề xuất: tự động chấm 0; GV vẫn có thể "Chấm lại" để thêm nhận xét.
- Q-3 (AC-2.4): [NEEDS CLARIFICATION: Ngưỡng "Chờ lâu" là 48 giờ (đề xuất, khớp mục tiêu trung vị ≤ 48 giờ) hay giá trị khác, và GV có cần tự chỉnh ngưỡng này không?] — Ảnh hưởng: giao diện T13 và mục tiêu §2. Đề xuất: cố định 48 giờ trong MVP, không cho chỉnh.

## 12. Clarifications Log

### Session 2026-10-18

- Q: Câu Viết/Nói được chấm thế nào? → A: GV chấm thủ công bằng điểm và nhận xét; không chấm bằng AI trong MVP. (source: stakeholder — D3)
- Q: Ai được xem và chấm bài nộp? → A: Chỉ GV sở hữu workspace; không có tổ chức hay super-admin; GV không bao giờ thấy dữ liệu của GV khác. (source: stakeholder — D1)
- Q: Tài khoản HV do ai quản lý? → A: GV tạo và quản lý tài khoản HV; khóa/xóa tài khoản theo quy định của 001 — module này chỉ phản ứng với sự kiện khóa/xóa. (source: stakeholder — D4)
- Q: Một HV có thể học nhiều lớp của cùng GV? → A: Có (A3); hàng chờ gom bài nộp của mọi lớp, quy tắc thay thế lượt áp dụng trong từng Lớp. (source: assumption — A3, owner 001/003)
- Q: Thiết bị? → A: T13/T14 thiết kế cho máy tính ≥ 1280 px, dùng được từ 1024 px; HV xem kết quả trên điện thoại (S06/S08). (source: assumption — A4)
- Q: Ngôn ngữ và chữ Hán? → A: Giao diện tiếng Việt; chữ Hán giản thể và pinyin trong đề, câu trả lời và nhận xét phải hiển thị đúng. (source: assumption — A5)
- Q: HV biết có kết quả bằng cách nào? → A: Không có email/push; chỉ có nhãn trong ứng dụng "Có kết quả mới" và nhãn cập nhật điểm. (source: assumption — A6)
- Q: Múi giờ hiển thị? → A: UTC+7. (source: assumption — A7)
- Q: Bài nộp của Bài tập/Bài thi đã bị ẩn? → A: Nội dung đã có bài nộp chỉ bị ẩn, không bị xóa, nên bài nộp vẫn chấm được với nhãn "Bài đã ẩn". (source: assumption — A8, owner 002)
- Q: Số lượt làm? → A: Bài tập làm lại không giới hạn, lấy điểm lượt cao nhất; Bài thi giới hạn lượt — vì vậy chỉ lượt Bài tập có thể bị thay thế. (source: assumption — A10, owner 005/006)
- Q: Điểm xếp hạng? → A: Theo lớp, công thức thuộc 008; module này chỉ cung cấp điểm cuối cùng. (source: assumption — A11)
- Q: Mỗi lượt làm là một mục trong hàng chờ hay chỉ lượt mới nhất? → A: Mỗi bài nộp là một mục; riêng Bài tập, lượt còn "Chờ chấm" bị thay thế khi HV nộp lượt mới trong cùng Lớp, lượt "Đang chấm" được giữ kèm nhãn "Có lượt mới hơn"; lượt Bài thi không bao giờ bị thay thế. (source: assumption — tránh chấm thừa khi HV làm lại không giới hạn; chờ xác nhận ở Q-1)
- Q: Bước điểm? → A: Từ 0 đến điểm tối đa của câu, bước 0,25 (hoặc đúng điểm tối đa). (source: assumption — đủ mịn cho câu 1–2 điểm, quen thuộc với cách chấm ở Việt Nam)
- Q: Nhận xét có bắt buộc? → A: Không; tối đa 2000 ký tự mỗi câu, 3000 ký tự cho nhận xét chung. (source: assumption — không làm chậm GV khi bài đạt điểm tối đa)
- Q: Câu trả lời trống? → A: Hiển thị "Học viên không trả lời câu này.", điểm 0 bị khóa, vẫn nhận xét được. (source: assumption — không có gì để chấm, tránh cho điểm nhầm)
- Q: Có cho chấm lại sau khi hoàn tất? → A: Có, không giới hạn số lần; mỗi lần hoàn tất lưu vào Lịch sử chấm (chỉ GV xem); HV chỉ thấy kết quả mới nhất kèm nhãn cập nhật; chấm lại không có lưu nháp. (source: assumption — cần sửa được sai sót, minh bạch, giữ trạng thái đơn giản)
- Q: HV rời lớp, lớp kết thúc, tài khoản bị khóa hoặc bài bị ẩn khi bài nộp còn chờ chấm? → A: Bài nộp vẫn ở hàng chờ, có nhãn và chấm được bình thường; chỉ khi tài khoản bị xóa thì bài nộp rời hàng chờ. (source: assumption — không làm mất công sức HV đã làm)
- Q: Hai cửa sổ cùng chấm một bài nộp? → A: Lần lưu dựa trên dữ liệu cũ bị từ chối, dữ liệu đang nhập được giữ trên màn hình. (source: assumption — tránh ghi đè âm thầm)
- Q: GV có sửa được điểm câu chấm tự động? → A: Không trong MVP; các câu này chỉ đọc trên T14. (source: assumption — D3 xác định các câu này chấm tự động; quy tắc chấm thuộc 005/006)
- Q: Mặc định của hàng chờ? → A: Lọc "Cần chấm", cũ nhất trước, 50 mục mỗi trang. (source: assumption — chấm theo thứ tự đến, công bằng cho HV)
- Q: Tốc độ phát bản ghi âm? → A: 0,75x / 1x / 1,25x / 1,5x. (source: assumption — đủ để nghe chậm phát âm hoặc nghe nhanh bài dài)
