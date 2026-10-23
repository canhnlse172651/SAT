---
id: 014
slug: listening-speaking
title: Listening and speaking practice
status: draft
branch: feat/014-listening-speaking
created: 2026-10-22
updated: 2026-10-22
approved_by:
approved_at:
---

# Listening and speaking practice (Luyện nghe & nói)

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

Học viên (HV) muốn luyện nghe và nói tiếng Trung ngoài giờ lớp, nhưng nội dung lớp học chỉ có bài tập tự chấm và
nhiều HV không có người bản xứ để nghe và nói theo. Stakeholder yêu cầu (2026-10-22, V14): "Luyện nghe và nói — Nghe
người bản xứ đọc từ và câu. Thu âm giọng nói của học viên. Nhận xét phát âm và thanh điệu bằng công nghệ nhận diện
giọng nói. Nghe hội thoại rồi chọn đáp án. Luyện đóng vai: gọi món, mua sắm, phỏng vấn, giao tiếp công sở." Module
này thuộc khu **Tự học**, **chỉ dành cho HV** (V15): mọi HV đã kích hoạt, không bị khóa của workspace dùng được, không
phụ thuộc lớp (V14-1); GV không dùng Tự học, GV chỉ quản lý nội dung. Nội dung lấy từ **"Kho nội dung tự học" của
workspace của HV** (016; GV quản lý trên T23–T27; nạp sẵn bộ nội dung HSK khởi tạo rồi GV sửa / thêm / ẩn tùy ý —
V15). Module định nghĩa hai màn hình: **S17 "Luyện nghe"** (nghe từ và câu bản xứ với tốc độ,
lặp lại, ẩn/hiện pinyin và nghĩa; nghe hiểu hội thoại → chọn đáp án, tự chấm kèm giải thích và lời thoại; lịch sử
và độ chính xác theo cấp HSK) và **S18 "Luyện nói"** (nói theo: nghe mẫu → thu âm → so sánh, tự đánh giá "Giống" /
"Chưa giống"; đóng vai theo kịch bản: ứng dụng đóng vai kia, người học thu lượt thoại của mình, xem "Gợi ý", nghe
lại cả hội thoại, làm lại). MVP **không có AI** (V14-3): chấm phát âm, thanh điệu bằng nhận diện giọng nói và đóng
vai tự do với AI là giai đoạn 2. Giọng nói là dữ liệu cá nhân: **bản thu chỉ ở trên thiết bị** trong lúc luyện và
tự xóa khi rời bài; dữ liệu tự học riêng tư của từng HV, GV không xem được, không ảnh hưởng xếp hạng hay dashboard
của lớp.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Người học dùng Luyện nghe & nói đều đặn | Tỷ lệ HV đã kích hoạt mở S17 hoặc S18 ít nhất 1 lần mỗi tháng | ≥ 30% |
| Bài nghe được làm trọn | Tỷ lệ bài nghe đã mở được nộp (không thoát giữa chừng) | ≥ 70% |
| Đóng vai được làm trọn | Tỷ lệ lần đóng vai đã "Bắt đầu" đi tới "Hoàn thành hội thoại" | ≥ 50% |
| Thu âm hoạt động trên điện thoại | Tỷ lệ lần chạm "Thu âm" (quyền micro đã cấp, trình duyệt được hỗ trợ — NFR-5) tạo được bản thu nghe lại được | ≥ 98% |
| Nghe ngay không phải chờ | Thời gian từ khi chạm phát đến khi nghe âm thanh bản xứ, p95 trên 4G | ≤ 1 giây (NFR-1) |
| Giọng nói không rời thiết bị | Số byte dữ liệu âm thanh từ micro được gửi ra khỏi thiết bị | 0 (NFR-8) |

## 3. Actors & Context

- **Học viên (HV)** — tài khoản do GV tạo và kích hoạt (001, V4-6), dùng điện thoại là chính (360–430 px). Mở S17 /
  S18 từ trang Tự học S13 (012) bất kỳ lúc nào, kể cả khi chưa thuộc lớp nào hoặc mọi lớp đã kết thúc (V14-1).
  Luyện nghe theo cấp HSK của mình, nói theo người bản xứ, đóng vai các tình huống đời sống và công sở.
- **Giáo viên (GV)** — chủ workspace (D1) và là người quản lý duy nhất của "Kho nội dung tự học" của workspace (016,
  T23–T27, V15): sửa, thêm, ẩn mục từ và câu có âm thanh bản xứ, bài nghe kèm câu hỏi, kịch bản đóng vai (kho được nạp
  sẵn bộ nội dung HSK khởi tạo). GV **không** dùng S17 / S18 (mở → A05, AC-1.6), chỉ xem trước nội dung bên trong
  T23–T27; **không** xem được dữ liệu tự học của HV và **không** giao bài nghe / nói cho lớp trong MVP.
- **Hệ thống** — phát âm thanh, thu âm trên thiết bị, chấm tự động câu hỏi nghe hiểu, lưu lịch sử và tự đánh giá
  riêng cho từng HV.
- Chỉ có hai vai trò GV và HV (V15); vai trò "Quản trị nội dung" không còn.
- **Hiện nay** HV chỉ nghe được âm thanh trong khối Âm thanh / Từ vựng của bài học do GV soạn (004); không có nơi
  luyện nói, không có bài nghe theo cấp ngoài lớp.

**Thuật ngữ dùng trong spec này** (V15)

- **Người dùng / người học** — một HV đã đăng nhập, đã kích hoạt và không bị khóa. GV không bao giờ là người dùng của
  S17 / S18.
- **Kho** — "Kho nội dung tự học" của workspace của HV (016), do GV của workspace quản lý; HV chỉ thấy kho của workspace
  mình.
- **Đang phát hành** — nội dung trong kho mà GV đang cho HV thấy theo trạng thái của 016 (không ở nháp, bị ẩn hay
  lưu trữ).

## 4. User Stories

- US-1 (P1): Là HV, tôi muốn nghe người bản xứ đọc từ và câu theo cấp HSK, chỉnh tốc độ, lặp lại và ẩn/hiện
  pinyin, nghĩa, để luyện tai và bắt chước phát âm chuẩn.
  - Why this priority: là nền của mọi phần còn lại (nói theo, đóng vai đều dùng cùng trình phát) và là nội dung đầu
    tiên trong yêu cầu "Nghe người bản xứ đọc từ và câu".
  - Independent test: HV chưa thuộc lớp nào mở S13 → "Luyện nghe" → S17 tab "Nghe từ & câu", chọn HSK2 → chạm phát
    "谢谢 · xièxie · cảm ơn" → nghe âm thanh ≤ 1 giây; chọn "0,75×" và bật "Lặp lại" → âm thanh lặp chậm hơn mà
    không đổi giọng; tắt "Pinyin" → chỉ còn chữ Hán và nghĩa.
- US-2 (P1): Là HV, tôi muốn nghe một đoạn hội thoại rồi chọn đáp án, xem ngay đúng/sai, đáp án đúng, giải
  thích và lời thoại, để biết mình nghe hiểu tới đâu.
  - Why this priority: "Nghe hội thoại rồi chọn đáp án" là yêu cầu trực tiếp; tự chấm được nên không cần AI.
  - Independent test: mở bài nghe "Ở nhà hàng" (HSK2, 3 câu) → chưa thấy lời thoại; chọn 3 đáp án → "Nộp bài" →
    "2/3 câu đúng", câu sai hiển thị đáp án đúng và giải thích, lời thoại chữ Hán kèm công tắc "Pinyin", "Nghĩa".
- US-3 (P2): Là HV, tôi muốn xem lịch sử các lần làm bài nghe và độ chính xác theo từng cấp HSK, để thấy
  mình tiến bộ.
  - Why this priority: tăng động lực nhưng chức năng nghe vẫn dùng được khi chưa có lịch sử.
  - Independent test: sau 2 lượt cùng bài nghe HSK2 "Ở nhà hàng" (lượt đầu 2/3, làm lại 3/3) → tab "Lịch sử" hiển thị
    "HSK2 · 67% · 1 bài" và 2 dòng lượt làm mới nhất trước (3/3 rồi 2/3); chạm một dòng → xem lại kết quả chỉ xem.
- US-4 (P1): Là HV, tôi muốn nghe mẫu một từ hoặc câu, thu giọng mình, nghe lại ngay cạnh âm thanh mẫu và tự
  đánh giá "Giống" / "Chưa giống", để luyện phát âm và thanh điệu khi chưa có chấm tự động.
  - Why this priority: "Thu âm giọng nói của học viên" là yêu cầu trực tiếp; tự so sánh là cách MVP thay cho chấm
    bằng nhận diện giọng nói (giai đoạn 2).
  - Independent test: S18 tab "Nói theo" → "我想要一杯咖啡。" → "Nghe mẫu" → "Thu âm" (lần đầu: giải thích quyền micro
    → cho phép) → nói → "Dừng" → "So sánh" phát mẫu rồi bản thu → chọn "Giống" → danh sách hiển thị nhãn "Giống".
- US-5 (P1): Là HV, tôi muốn đóng vai trong một kịch bản (gọi món, mua sắm, phỏng vấn, giao tiếp công sở),
  để ứng dụng đóng vai kia, tôi nói lượt của mình, xem gợi ý khi cần và nghe lại cả cuộc hội thoại.
  - Why this priority: "Luyện đóng vai" là yêu cầu trực tiếp; kịch bản có sẵn nên làm được không cần AI.
  - Independent test: tab "Đóng vai" → "Gọi món ở quán mì" (HSK2, vai "Khách hàng" / "Nhân viên phục vụ") → chọn
    "Khách hàng" → "Bắt đầu" → ứng dụng tự phát lượt của nhân viên → "Đến lượt bạn" → "Gợi ý" hiện pinyin và nghĩa →
    thu âm → "Tiếp tục" … → "Hoàn thành hội thoại" → "Nghe lại cả hội thoại" phát xen kẽ âm thanh mẫu và bản thu.
- US-6 (P1): Là HV, tôi muốn giọng nói của tôi không rời khỏi thiết bị và kết quả tự học của tôi không ai
  khác xem được hay tính vào lớp, để yên tâm luyện tập.
  - Why this priority: giọng nói là dữ liệu cá nhân (HV có thể là trẻ vị thành niên); V14-1 yêu cầu dữ liệu tự học
    riêng tư và tách khỏi xếp hạng lớp.
  - Independent test: theo dõi lưu lượng mạng trong toàn bộ luồng Nói theo và Đóng vai → 0 byte âm thanh gửi đi; rời
    mục → bản thu biến mất; GV của HV mở T15 → không có dữ liệu Luyện nghe & nói; GV mở đường dẫn S17 → A05; Điểm
    xếp hạng lớp không đổi.
- US-7 (P2): Là HV, tôi muốn xem tiến độ luyện nói (bao nhiêu từ, câu tôi đã tự đánh giá "Giống" ở mỗi cấp,
  kịch bản nào đã hoàn thành) và luyện lại các mục "Chưa giống", để biết cần luyện gì tiếp.
  - Why this priority: hữu ích nhưng không chặn việc luyện nói.
  - Independent test: tự đánh giá 3 mục HSK2 "Giống", 1 mục "Chưa giống", hoàn thành 1 kịch bản → tab "Tiến độ"
    hiển thị "HSK2 · Giống 3/40 · Chưa giống 1" và kịch bản "Đã hoàn thành 1 lần"; "Luyện lại mục Chưa giống" mở
    đúng 1 mục.

## 5. Functional Requirements

### REQ-1: Access and entry — Truy cập và lối vào

<!-- Story: US-1, US-6 · Priority: P1 · Screens: S13, S17, S18, A01, A05 -->

- AC-1.1: WHEN HV đã đăng nhập bằng tài khoản đã kích hoạt, không bị khóa chọn "Luyện nghe" hoặc "Luyện nói" trên trang Tự học S13 THE SYSTEM SHALL mở tương ứng S17 "Luyện nghe" hoặc S18 "Luyện nói" kèm nút "Quay lại" về S13.
- AC-1.2: THE SYSTEM SHALL cho mọi HV đã kích hoạt, không bị khóa của workspace dùng toàn bộ chức năng của S17 và S18 như nhau với nội dung của Kho nội dung tự học thuộc workspace của HV (016), không yêu cầu HV thuộc lớp nào, kể cả HV không thuộc lớp nào hoặc chỉ thuộc lớp Đã kết thúc.
- AC-1.3: WHEN người dùng mở S17 THE SYSTEM SHALL hiển thị ba tab "Nghe từ & câu", "Nghe hiểu" và "Lịch sử", với tab "Nghe từ & câu" được chọn sẵn.
- AC-1.4: WHEN người dùng mở S18 THE SYSTEM SHALL hiển thị ba tab "Nói theo", "Đóng vai" và "Tiến độ", với tab "Nói theo" được chọn sẵn.
- AC-1.5: IF người chưa đăng nhập mở S17 hoặc S18, kể cả bằng đường dẫn trực tiếp THEN THE SYSTEM SHALL chuyển tới A01 và sau khi đăng nhập thành công bằng tài khoản HV mở lại đúng màn hình đó, hoặc hiển thị A05 theo AC-1.6 khi tài khoản đã đăng nhập là GV.
- AC-1.6: IF tài khoản GV mở S17 hoặc S18, kể cả bằng đường dẫn trực tiếp THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." (001) và không hiển thị nội dung, lượt làm hay dữ liệu Luyện nghe & nói nào.

### REQ-2: Browse by HSK level and topic — Chọn nội dung theo cấp HSK và chủ đề

<!-- Story: US-1, US-2, US-4, US-5 · Priority: P1 · Screens: S17, S18 -->

- AC-2.1: THE SYSTEM SHALL hiển thị ở đầu các tab "Nghe từ & câu", "Nghe hiểu", "Nói theo" và "Đóng vai" bộ lọc "Cấp HSK" gồm các cấp HSK1 … HSK9 và bộ lọc "Chủ đề" (ở tab "Đóng vai" là "Tình huống") gồm "Tất cả" cùng các chủ đề hoặc tình huống của Kho nội dung tự học (016) thuộc workspace của HV có nội dung đang phát hành ở cấp đang chọn.
- AC-2.2: WHEN người dùng mở S17 hoặc S18 THE SYSTEM SHALL chọn sẵn cấp HSK mà người dùng đã chọn gần nhất ở bất kỳ tab nào của S17 hoặc S18, hoặc HSK1 nếu chưa từng chọn, và chọn sẵn "Tất cả" cho bộ lọc "Chủ đề" / "Tình huống".
- AC-2.3: WHEN người dùng đổi cấp HSK hoặc chủ đề / tình huống THE SYSTEM SHALL chỉ liệt kê các nội dung đang phát hành trong Kho nội dung tự học (016) thuộc workspace của HV, đúng cấp và chủ đề / tình huống đó, theo thứ tự của kho, và tải thêm 20 mục mỗi lần khi người dùng cuộn tới cuối danh sách.
- AC-2.4: IF không có nội dung nào đang phát hành cho cấp và chủ đề / tình huống đang chọn THEN THE SYSTEM SHALL hiển thị "Chưa có nội dung cho cấp và chủ đề này." và giữ nguyên bộ lọc để người dùng chọn lại.
- AC-2.5: IF không tải được danh sách nội dung THEN THE SYSTEM SHALL hiển thị "Không tải được nội dung. Vui lòng thử lại." kèm nút "Thử lại" và không hiển thị danh sách trống thay thế.

### REQ-3: Native audio player — Trình phát âm thanh bản xứ

<!-- Story: US-1, US-2, US-4, US-5 · Priority: P1 · Screens: S17, S18 -->

- AC-3.1: THE SYSTEM SHALL cung cấp cho mọi âm thanh bản xứ (từ, câu, bài nghe, lượt thoại) nút "Phát" / "Tạm dừng", nút tốc độ và nút "Lặp lại", và riêng với âm thanh bài nghe thêm thanh tiến trình kéo được kèm thời gian đã phát và tổng thời lượng dạng m:ss.
- AC-3.2: WHEN người dùng chọn nút tốc độ THE SYSTEM SHALL cho chọn "0,5×", "0,75×", "1×" (mặc định) hoặc "1,25×", phát ở tốc độ đã chọn mà không làm thay đổi cao độ giọng đọc, và giữ tốc độ đó cho mọi âm thanh mẫu tiếp theo trong S17 và S18 trên thiết bị đó cho tới khi người dùng đổi.
- AC-3.3: WHILE "Lặp lại" đang bật THE SYSTEM SHALL phát lại âm thanh hiện tại từ đầu sau khoảng nghỉ 1 giây mỗi khi phát hết, cho tới khi người dùng tắt "Lặp lại", chọn "Tạm dừng" hoặc rời mục đó.
- AC-3.4: WHEN người dùng phát một âm thanh trong khi một âm thanh khác (âm thanh mẫu hoặc bản thu) đang phát THE SYSTEM SHALL dừng âm thanh đang phát và chỉ phát âm thanh mới.
- AC-3.5: WHILE âm thanh đang được tải trước khi phát THE SYSTEM SHALL hiển thị trạng thái đang tải trên nút "Phát" và không phát hai lần khi người dùng chạm nhiều lần.
- AC-3.6: IF không tải hoặc không phát được âm thanh THEN THE SYSTEM SHALL hiển thị "Không phát được âm thanh. Vui lòng thử lại." kèm nút "Thử lại" ngay tại trình phát đó và giữ các phần khác của màn hình dùng được.

### REQ-4: Words and sentences listening — Nghe từ và câu

<!-- Story: US-1 · Priority: P1 · Screens: S17, S18 -->

- AC-4.1: WHEN người dùng mở tab "Nghe từ & câu" THE SYSTEM SHALL liệt kê các mục từ và câu có âm thanh bản xứ của cấp và chủ đề đang chọn, mỗi mục gồm chữ Hán giản thể, pinyin có dấu thanh, nghĩa tiếng Việt, nút phát và nút "Nói theo", cùng bộ chọn "Tất cả" / "Từ" / "Câu" (mặc định "Tất cả").
- AC-4.2: WHEN người dùng chạm nút phát của một mục THE SYSTEM SHALL phát âm thanh bản xứ của mục đó theo REQ-3 và đánh dấu mục đang phát cho tới khi phát xong.
- AC-4.3: WHEN người dùng tắt hoặc bật công tắc "Pinyin" hoặc "Nghĩa" THE SYSTEM SHALL ẩn hoặc hiện pinyin hoặc nghĩa của mọi mục trong danh sách, luôn giữ chữ Hán hiển thị, và giữ lựa chọn đó cho các lần mở S17 sau trên cùng thiết bị.
- AC-4.4: WHEN người dùng chọn "Nói theo" ở một mục THE SYSTEM SHALL mở S18 tab "Nói theo" tại màn hình luyện của đúng mục đó (REQ-10).
- AC-4.5: THE SYSTEM SHALL không tự phát mục tiếp theo khi một mục phát xong; mỗi lần chạm phát chỉ phát một mục (kèm lặp lại nếu "Lặp lại" đang bật).

### REQ-5: Listening comprehension — Làm bài nghe hiểu

<!-- Story: US-2 · Priority: P1 · Screens: S17 -->

- AC-5.1: WHEN người dùng mở tab "Nghe hiểu" THE SYSTEM SHALL liệt kê các bài nghe của cấp và chủ đề đang chọn, mỗi bài gồm tên bài, loại "Hội thoại" hoặc "Đoạn văn", thời lượng âm thanh dạng m:ss, số câu hỏi và kết quả gần nhất của chính người dùng dạng "Gần nhất: x/y câu đúng" hoặc "Chưa làm".
- AC-5.2: WHEN người dùng mở một bài nghe THE SYSTEM SHALL hiển thị tên bài, trình phát âm thanh của bài (REQ-3) và mọi câu hỏi của bài theo thứ tự của kho, mỗi câu có từ 2 đến 4 phương án và chỉ chọn được một phương án.
- AC-5.3: WHILE người dùng chưa nộp bài nghe THE SYSTEM SHALL không hiển thị lời thoại, pinyin, bản dịch hay đáp án của bài.
- AC-5.4: WHILE người dùng chưa nộp bài nghe THE SYSTEM SHALL cho phát lại, tua và đổi tốc độ âm thanh không giới hạn số lần và cho đổi phương án đã chọn.
- AC-5.5: WHILE còn câu hỏi chưa được chọn phương án THE SYSTEM SHALL vô hiệu nút "Nộp bài" và hiển thị "Đã trả lời x/y câu".
- AC-5.6: WHEN người dùng rời bài nghe khi đã chọn ít nhất một phương án mà chưa nộp THE SYSTEM SHALL hỏi "Thoát bài nghe? Các câu đã chọn sẽ không được lưu." với "Thoát" và "Ở lại", và khi người dùng chọn "Thoát" không lưu lượt làm nào.

### REQ-6: Listening result and review — Kết quả và xem lại bài nghe

<!-- Story: US-2 · Priority: P1 · Screens: S17 -->

- AC-6.1: WHEN người dùng chọn "Nộp bài" THE SYSTEM SHALL chấm tự động, lưu lượt làm vào lịch sử của người dùng và hiển thị kết quả "x/y câu đúng" kèm, cho từng câu, phương án người dùng đã chọn, nhãn "Đúng" hoặc "Sai", đáp án đúng và giải thích của kho.
- AC-6.2: WHEN kết quả bài nghe được hiển thị THE SYSTEM SHALL hiển thị lời thoại đầy đủ của bài theo từng câu bằng chữ Hán (kèm tên người nói với bài "Hội thoại") cùng công tắc "Pinyin" và "Nghĩa", và vẫn cho phát lại âm thanh của bài theo REQ-3.
- AC-6.3: WHEN người dùng chọn "Làm lại" trên màn hình kết quả THE SYSTEM SHALL mở lại bài nghe với mọi câu chưa chọn phương án, coi lần nộp kế tiếp là một lượt làm mới và giữ nguyên các lượt trước trong lịch sử.
- AC-6.4: WHEN người dùng chọn "Bài tiếp theo" trên màn hình kết quả THE SYSTEM SHALL mở bài nghe kế tiếp trong danh sách của cấp và chủ đề đang chọn.
- AC-6.5: IF bài vừa nộp là bài cuối của danh sách đang chọn THEN THE SYSTEM SHALL không hiển thị "Bài tiếp theo" và hiển thị "Về danh sách".
- AC-6.6: IF không gửi được bài nộp do mất kết nối hoặc lỗi THEN THE SYSTEM SHALL giữ nguyên các phương án đã chọn, hiển thị "Không nộp được bài. Kiểm tra kết nối và thử lại." kèm nút "Thử lại", và chỉ ghi một lượt làm khi lần thử lại thành công.

### REQ-7: Listening history and accuracy — Lịch sử và độ chính xác bài nghe

<!-- Story: US-3 · Priority: P2 · Screens: S17 -->

- AC-7.1: WHEN người dùng mở tab "Lịch sử" của S17 THE SYSTEM SHALL hiển thị khối "Độ chính xác theo cấp" gồm mỗi cấp HSK mà người dùng đã nộp ít nhất một lượt, với tỷ lệ phần trăm số câu đúng trên tổng số câu chỉ tính lượt nộp đầu tiên của mỗi bài nghe ở cấp đó, làm tròn tới số nguyên, và số bài nghe đã làm ở cấp đó dạng "{n} bài".
- AC-7.2: THE SYSTEM SHALL liệt kê dưới khối "Độ chính xác theo cấp" mọi lượt làm bài nghe của người dùng, mới nhất trước, mỗi lượt gồm tên bài, cấp HSK, thời điểm nộp dạng "dd/mm/yyyy HH:mm" theo giờ Việt Nam và "x/y câu đúng", tải thêm 20 lượt mỗi lần.
- AC-7.3: WHEN người dùng chọn một lượt trong lịch sử THE SYSTEM SHALL hiển thị kết quả của lượt đó ở dạng chỉ xem như AC-6.1 và AC-6.2, đúng nội dung câu hỏi, phương án, đáp án, giải thích và lời thoại tại thời điểm nộp, kèm nút "Làm lại" khi bài nghe còn trong kho.
- AC-7.4: IF người dùng chưa nộp lượt bài nghe nào THEN THE SYSTEM SHALL hiển thị trên tab "Lịch sử" thông điệp "Bạn chưa làm bài nghe nào." kèm nút "Đến Nghe hiểu" mở tab "Nghe hiểu".
- AC-7.5: WHEN người dùng nộp một lượt cho bài nghe đã có lượt nộp trước đó THE SYSTEM SHALL thêm lượt đó vào danh sách lịch sử với "x/y câu đúng" của chính lượt đó và giữ nguyên "Độ chính xác theo cấp".

### REQ-8: Microphone permission and errors — Quyền micro và lỗi micro

<!-- Story: US-4, US-5 · Priority: P1 · Screens: S18 -->

- AC-8.1: WHEN người dùng chọn "Thu âm" lần đầu khi trình duyệt chưa được cấp quyền micro cho SAT THE SYSTEM SHALL hiển thị trước lời giải thích "SAT cần dùng micro để thu giọng của bạn. Bản thu chỉ lưu trên thiết bị này và tự xóa khi bạn rời bài." với "Tiếp tục" và "Để sau", và chỉ yêu cầu quyền micro của trình duyệt khi người dùng chọn "Tiếp tục".
- AC-8.2: IF người dùng từ chối hoặc trước đó đã chặn quyền micro THEN THE SYSTEM SHALL hiển thị "Bạn đã chặn quyền dùng micro. Hãy cho phép micro cho trang này trong cài đặt trình duyệt rồi chọn Thử lại." kèm nút "Thử lại", không bắt đầu thu, và vẫn cho nghe âm thanh mẫu và đi tiếp đóng vai bằng "Bỏ qua".
- AC-8.3: IF thiết bị không có hoặc không tìm thấy micro THEN THE SYSTEM SHALL hiển thị "Không tìm thấy micro trên thiết bị này." và vô hiệu nút "Thu âm" cho tới khi người dùng chọn "Thử lại".
- AC-8.4: IF trình duyệt không hỗ trợ thu âm THEN THE SYSTEM SHALL hiển thị ngay khi mở S18 "Trình duyệt này không hỗ trợ thu âm. Hãy dùng phiên bản mới của Chrome, Safari, Edge hoặc Firefox.", vô hiệu nút "Thu âm" và vẫn cho dùng mọi chức năng nghe.
- AC-8.5: IF micro đang bị ứng dụng khác dùng hoặc việc thu âm bị gián đoạn (cuộc gọi đến, ngắt tai nghe, chuyển ứng dụng hoặc khóa màn hình) THEN THE SYSTEM SHALL dừng thu, bỏ phần đang thu dở, giữ bản thu hoàn chỉnh trước đó của cùng mục hoặc lượt thoại nếu có, và hiển thị "Thu âm bị gián đoạn. Vui lòng thu lại."

### REQ-9: Recording takes and limits — Thu âm và giới hạn bản thu

<!-- Story: US-4, US-5 · Priority: P1 · Screens: S18 -->

- AC-9.1: WHEN người dùng chọn "Thu âm" khi đã có quyền micro THE SYSTEM SHALL dừng mọi âm thanh đang phát, bắt đầu thu và hiển thị "Đang thu…" kèm đồng hồ đếm giây, mức âm lượng thời gian thực và nút "Dừng".
- AC-9.2: WHEN người dùng chọn "Dừng" THE SYSTEM SHALL kết thúc bản thu và hiển thị các nút "Nghe bản thu", "Thu lại" và "Xóa bản thu".
- AC-9.3: WHEN thời lượng đang thu đạt giới hạn 15 giây với một mục ở "Nói theo" hoặc 30 giây với một lượt thoại ở "Đóng vai" THE SYSTEM SHALL tự dừng thu, giữ bản thu đã có và hiển thị "Đã đạt thời lượng tối đa 15 giây." hoặc "Đã đạt thời lượng tối đa 30 giây."
- AC-9.4: IF bản thu ngắn hơn 0,5 giây THEN THE SYSTEM SHALL bỏ bản thu đó, giữ bản thu hoàn chỉnh trước đó nếu có và hiển thị "Bản thu quá ngắn. Hãy chọn Thu âm, nói rồi chọn Dừng."
- AC-9.5: WHEN người dùng hoàn tất một bản thu mới sau khi chọn "Thu lại" THE SYSTEM SHALL thay bản thu cũ của cùng mục hoặc cùng lượt thoại bằng bản thu mới, để mỗi mục hoặc lượt thoại chỉ có tối đa một bản thu.
- AC-9.6: WHEN người dùng chọn "Xóa bản thu" THE SYSTEM SHALL xóa ngay bản thu đó khỏi thiết bị mà không hỏi xác nhận và đưa mục hoặc lượt thoại về trạng thái chưa thu.
- AC-9.7: WHEN người dùng chọn "Nghe mẫu" hoặc phát một âm thanh khác trong lúc đang thu THE SYSTEM SHALL kết thúc bản thu như khi chọn "Dừng" rồi mới phát âm thanh đó.

### REQ-10: Shadowing and self-compare — Nói theo và tự so sánh

<!-- Story: US-4 · Priority: P1 · Screens: S18 -->

- AC-10.1: WHEN người dùng mở tab "Nói theo" THE SYSTEM SHALL liệt kê các mục từ và câu có âm thanh bản xứ của cấp và chủ đề đang chọn (cùng nguồn với tab "Nghe từ & câu"), mỗi mục gồm chữ Hán, pinyin có dấu thanh, nghĩa và nhãn tự đánh giá gần nhất "Giống" hoặc "Chưa giống" của người dùng, không có nhãn khi chưa tự đánh giá.
- AC-10.2: WHEN người dùng chọn một mục ở tab "Nói theo" THE SYSTEM SHALL mở màn hình luyện của mục gồm chữ Hán cỡ lớn, pinyin có dấu thanh luôn hiển thị, nghĩa tiếng Việt, nút "Nghe mẫu" (trình phát REQ-3), nút "Thu âm", dòng quyền riêng tư của AC-15.3 và các nút "Trước" / "Tiếp" để chuyển sang mục liền kề trong danh sách.
- AC-10.3: WHEN người dùng chọn "Nghe bản thu" THE SYSTEM SHALL phát bản thu của người dùng ở tốc độ 1×.
- AC-10.4: WHILE mục ở tab "Nói theo" đang có bản thu THE SYSTEM SHALL hiển thị nút "So sánh" cạnh "Nghe bản thu".
- AC-10.5: WHEN người dùng chọn "So sánh" THE SYSTEM SHALL phát âm thanh mẫu ở tốc độ đang chọn, nghỉ 1 giây rồi phát bản thu của người dùng ở tốc độ 1×, lần lượt đánh dấu "Mẫu" và "Bạn" trong lúc mỗi phần đang phát.
- AC-10.6: WHILE màn hình luyện đang ở mục đầu hoặc mục cuối của danh sách "Nói theo" THE SYSTEM SHALL vô hiệu tương ứng nút "Trước" hoặc nút "Tiếp".

### REQ-11: Self-assessment and speaking progress — Tự đánh giá và tiến độ luyện nói

<!-- Story: US-4, US-7 · Priority: P1 (tự đánh giá), P2 (tab Tiến độ) · Screens: S18 -->

- AC-11.1: WHILE mục ở tab "Nói theo" đang có bản thu THE SYSTEM SHALL hiển thị câu hỏi "Bạn thấy mình nói giống mẫu chưa?" với hai nút "Giống" và "Chưa giống".
- AC-11.2: WHEN người dùng chọn "Giống" hoặc "Chưa giống" THE SYSTEM SHALL lưu lựa chọn đó làm tự đánh giá gần nhất của người dùng cho mục, thay lựa chọn trước, và hiển thị nhãn tương ứng trên danh sách "Nói theo" ở lần hiển thị kế tiếp.
- AC-11.3: THE SYSTEM SHALL không tự chấm, không cho điểm và không nhận xét phát âm hay thanh điệu trong MVP; nhãn "Giống" / "Chưa giống" chỉ do chính người dùng chọn.
- AC-11.4: WHEN người dùng mở tab "Tiến độ" của S18 THE SYSTEM SHALL hiển thị, cho mỗi cấp HSK có nội dung "Nói theo" đang phát hành, "Giống x/y" (x là số mục đang phát hành của cấp có tự đánh giá gần nhất "Giống", y là tổng số mục đang phát hành của cấp) và "Chưa giống z", cùng danh sách kịch bản đóng vai người dùng đã hoàn thành với số lần hoàn thành, vai của lần gần nhất và ngày gần nhất dạng dd/mm/yyyy.
- AC-11.5: WHEN người dùng chọn "Luyện lại mục Chưa giống" ở một cấp trên tab "Tiến độ" THE SYSTEM SHALL mở tab "Nói theo" của cấp đó chỉ với các mục có tự đánh giá gần nhất "Chưa giống", kèm nút "Bỏ lọc" để xem lại toàn bộ danh sách.
- AC-11.6: IF người dùng chưa có tự đánh giá nào và chưa hoàn thành kịch bản nào THEN THE SYSTEM SHALL hiển thị trên tab "Tiến độ" thông điệp "Bạn chưa luyện nói. Hãy thử Nói theo hoặc Đóng vai."

### REQ-12: Role-play scenario and role selection — Chọn kịch bản và vai đóng

<!-- Story: US-5 · Priority: P1 · Screens: S18 -->

- AC-12.1: WHEN người dùng mở tab "Đóng vai" THE SYSTEM SHALL liệt kê các kịch bản đóng vai đang phát hành của cấp đang chọn, nhóm theo tình huống của kho (ví dụ "Gọi món", "Mua sắm", "Phỏng vấn", "Giao tiếp công sở"), mỗi kịch bản gồm tên, cấp HSK, số lượt thoại và "Đã hoàn thành n lần" hoặc "Chưa luyện".
- AC-12.2: WHEN người dùng chọn một kịch bản THE SYSTEM SHALL hiển thị mô tả bối cảnh bằng tiếng Việt, danh sách các vai của kịch bản kèm số lượt thoại của mỗi vai, nút "Xem trước kịch bản" và nút "Bắt đầu" chỉ được bật khi người dùng đã chọn đúng một vai.
- AC-12.3: WHEN người dùng chọn "Xem trước kịch bản" THE SYSTEM SHALL hiển thị toàn bộ lượt thoại theo thứ tự (vai, chữ Hán, pinyin có dấu thanh, nghĩa tiếng Việt), cho phát âm thanh mẫu của từng lượt, và không ghi nhận đó là một lần luyện.
- AC-12.4: WHEN người dùng chọn "Bắt đầu" THE SYSTEM SHALL bắt đầu một lần đóng vai với vai đã chọn, trong đó ứng dụng đóng mọi vai còn lại.

### REQ-13: Turn-by-turn role-play — Đóng vai theo lượt

<!-- Story: US-5 · Priority: P1 · Screens: S18 -->

- AC-13.1: WHILE một lần đóng vai đang diễn ra THE SYSTEM SHALL hiển thị các lượt thoại đã tới theo thứ tự kịch bản dạng khung hội thoại, mỗi lượt gắn tên vai, lượt của người dùng nằm ở một phía và lượt của vai khác ở phía còn lại, cùng nút "Làm lại từ đầu".
- AC-13.2: WHEN tới lượt của một vai do ứng dụng đóng THE SYSTEM SHALL hiển thị chữ Hán của lượt đó, tự phát âm thanh mẫu của lượt ở tốc độ đang chọn và tự chuyển sang lượt kế tiếp sau khi phát xong.
- AC-13.3: IF trình duyệt chặn tự phát âm thanh của lượt do ứng dụng đóng THEN THE SYSTEM SHALL dừng ở lượt đó, hiển thị nút "Phát" và tiếp tục như AC-13.2 sau khi người dùng chạm "Phát".
- AC-13.4: WHEN tới lượt của người dùng THE SYSTEM SHALL dừng tự chuyển lượt và hiển thị "Đến lượt bạn" cùng chữ Hán của lượt cần nói và các nút "Gợi ý", "Nghe mẫu", "Thu âm" và "Bỏ qua".
- AC-13.5: WHEN người dùng chọn "Gợi ý" ở một lượt bất kỳ THE SYSTEM SHALL hiện pinyin có dấu thanh và nghĩa tiếng Việt của lượt đó, và ẩn lại khi người dùng chọn "Gợi ý" lần nữa.
- AC-13.6: WHEN lượt của người dùng đã có bản thu THE SYSTEM SHALL hiển thị "Nghe bản thu", "Thu lại" và "Tiếp tục", và chỉ chuyển sang lượt kế tiếp khi người dùng chọn "Tiếp tục".
- AC-13.7: WHEN người dùng chọn "Bỏ qua" ở lượt của mình THE SYSTEM SHALL đánh dấu lượt đó "Đã bỏ qua" và chuyển sang lượt kế tiếp.
- AC-13.8: WHEN người dùng chạm "Nghe lại" ở một lượt đã qua THE SYSTEM SHALL phát âm thanh mẫu của lượt đó nếu là lượt của vai khác hoặc lượt đã bỏ qua, hoặc bản thu của người dùng nếu là lượt đã thu, mà không thay đổi lượt hiện tại.

### REQ-14: Completion, replay and restart — Hoàn thành, nghe lại và làm lại đóng vai

<!-- Story: US-5 · Priority: P1 · Screens: S18 -->

- AC-14.1: WHEN lượt cuối cùng của kịch bản kết thúc THE SYSTEM SHALL hiển thị "Hoàn thành hội thoại" kèm "Đã thu x/y lượt của bạn", các nút "Nghe lại cả hội thoại", "Làm lại", "Đổi vai" và "Về danh sách", và ghi nhận cho người dùng một lần hoàn thành kịch bản với vai đã chọn và ngày hoàn thành.
- AC-14.2: WHEN người dùng chọn "Nghe lại cả hội thoại" THE SYSTEM SHALL phát lần lượt mọi lượt thoại theo thứ tự kịch bản, với lượt của vai khác bằng âm thanh mẫu, lượt người dùng đã thu bằng bản thu của người dùng và lượt đã bỏ qua bằng âm thanh mẫu kèm nhãn "Bản mẫu", nghỉ 0,5 giây giữa hai lượt và đánh dấu lượt đang phát.
- AC-14.3: WHILE đang nghe lại cả hội thoại THE SYSTEM SHALL cho "Tạm dừng", "Phát tiếp" và chạm vào một lượt để phát tiếp từ lượt đó.
- AC-14.4: WHEN người dùng chọn "Làm lại" ở màn hình hoàn thành hoặc "Làm lại từ đầu" trong lúc đóng vai THE SYSTEM SHALL hỏi "Bắt đầu lại? Các bản thu của lần này sẽ bị xóa." với "Bắt đầu lại" và "Hủy", và khi người dùng xác nhận xóa mọi bản thu của lần đó, giữ vai đã chọn và bắt đầu lại từ lượt đầu tiên.
- AC-14.5: WHEN người dùng chọn "Đổi vai" ở màn hình hoàn thành THE SYSTEM SHALL xóa mọi bản thu của lần đóng vai vừa xong và đưa người dùng về bước chọn vai của cùng kịch bản.
- AC-14.6: WHEN người dùng rời một lần đóng vai trước khi tới lượt cuối THE SYSTEM SHALL hỏi "Thoát đóng vai? Các bản thu của lần này sẽ bị xóa." với "Thoát" và "Ở lại", và khi người dùng chọn "Thoát" xóa các bản thu đó và không ghi nhận lần hoàn thành nào.

### REQ-15: Voice recording privacy and retention — Riêng tư và thời hạn giữ bản thu

<!-- Story: US-6 · Priority: P1 · Screens: S18 -->

- AC-15.1: THE SYSTEM SHALL chỉ giữ bản thu giọng nói trên thiết bị của người dùng trong trang đang mở và không gửi bản thu hay bất kỳ dữ liệu âm thanh nào thu từ micro ra khỏi thiết bị.
- AC-15.2: WHEN người dùng rời màn hình luyện của một mục "Nói theo" (chuyển mục bằng "Trước" / "Tiếp", quay lại danh sách hoặc rời S18), kết thúc một lần đóng vai bằng "Làm lại", "Đổi vai", "Về danh sách" hoặc "Thoát", đăng xuất, tải lại hoặc đóng trang THE SYSTEM SHALL xóa vĩnh viễn khỏi thiết bị mọi bản thu của mục hoặc lần đóng vai đó.
- AC-15.3: THE SYSTEM SHALL hiển thị cạnh nút "Thu âm" ở tab "Nói theo" và trong lần đóng vai dòng "Bản thu chỉ lưu trên thiết bị này và tự xóa khi bạn rời bài."
- AC-15.4: THE SYSTEM SHALL không cung cấp cách tải xuống, chia sẻ hay gửi bản thu cho GV hay bất kỳ ai trong MVP.
- AC-15.5: WHEN bản thu kết thúc, bị hủy hoặc người dùng rời màn hình đang thu THE SYSTEM SHALL ngừng dùng micro ngay, để chỉ báo micro của trình duyệt và hệ điều hành tắt, và chỉ dùng micro trong lúc hiển thị "Đang thu…".

### REQ-16: Self-study data privacy and class independence — Dữ liệu tự học riêng tư, tách khỏi lớp

<!-- Story: US-6 · Priority: P1 · Screens: S17, S18, A05 -->

- AC-16.1: THE SYSTEM SHALL lưu cho mỗi HV các lượt làm bài nghe, tự đánh giá "Giống" / "Chưa giống" gần nhất của từng mục và các lần hoàn thành đóng vai, gắn với tài khoản HV chứ không với lớp, và chỉ hiển thị chúng cho chính HV đó.
- AC-16.2: THE SYSTEM SHALL không hiển thị dữ liệu Luyện nghe & nói của một HV cho bất kỳ GV nào, kể cả GV của workspace của HV, hay cho HV khác, trên bất kỳ màn hình nào (kể cả T01, T04, T15, các màn hình quản lý kho T23–T27, S09, S12).
- AC-16.3: THE SYSTEM SHALL không tính dữ liệu Luyện nghe & nói vào Điểm xếp hạng, hạng (008), tiến độ "Bộ bài tập x/y" hay trạng thái "Đã làm" / "Chưa làm" (009) của bất kỳ lớp nào.
- AC-16.4: IF người dùng mở đường dẫn tới một lượt làm bài nghe không thuộc tài khoản của mình hoặc không tồn tại THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." giống hệt nhau trong cả hai trường hợp.
- AC-16.5: WHEN một tài khoản HV bị xóa theo 001 THE SYSTEM SHALL xóa vĩnh viễn toàn bộ dữ liệu Luyện nghe & nói của HV đó trong vòng 24 giờ.
- AC-16.6: WHILE tài khoản HV bị khóa theo 001 THE SYSTEM SHALL giữ nguyên dữ liệu Luyện nghe & nói của HV và hiển thị lại đầy đủ khi tài khoản được mở khóa.

### REQ-17: Library content changes — Thay đổi nội dung trong kho

<!-- Story: US-2, US-3, US-4, US-5 · Priority: P1 · Screens: S17, S18 -->

- AC-17.1: WHEN GV ẩn, lưu trữ hoặc gỡ khỏi phát hành một mục từ hoặc câu, bài nghe hoặc kịch bản trong Kho nội dung tự học (016) của workspace THE SYSTEM SHALL không còn liệt kê nội dung đó trong S17 và S18 cho HV của workspace từ lần mở hoặc tải lại kế tiếp.
- AC-17.2: THE SYSTEM SHALL giữ lượt làm bài nghe trong lịch sử, và giữ lượt nộp đầu tiên của bài nghe trong "Độ chính xác theo cấp", kể cả khi GV sau đó sửa, ẩn hoặc gỡ bài nghe khỏi kho, và gắn nhãn "Bài không còn trong kho" cho lượt của bài không còn đang phát hành, không kèm nút "Làm lại".
- AC-17.3: IF GV sửa, ẩn hoặc gỡ khỏi kho bài nghe hoặc kịch bản người dùng đang mở trong lúc người dùng đang làm THEN THE SYSTEM SHALL cho người dùng làm xong theo nội dung đã mở và chấm bài nghe theo đáp án của nội dung đó.
- AC-17.4: WHEN GV sửa âm thanh mẫu hoặc nội dung chữ của một mục từ hoặc câu trong kho THE SYSTEM SHALL giữ tự đánh giá gần nhất của người dùng cho mục đó.

## 6. Non-Functional Requirements

- NFR-1: Performance: âm thanh bản xứ bắt đầu phát p95 ≤ 1 giây sau khi chạm phát lần đầu trên mạng di động 4G (≥ 10 Mbps), và ≤ 300 ms khi phát lại âm thanh đã tải trong cùng phiên.
- NFR-2: Performance: thu âm bắt đầu p95 ≤ 500 ms sau khi chạm "Thu âm" khi quyền micro đã được cấp, không mất quá 100 ms đầu của lời nói; "Nghe bản thu" và "So sánh" bắt đầu phát p95 ≤ 300 ms.
- NFR-3: Performance: 20 mục đầu của mọi danh sách trên S17 / S18 hiển thị p95 ≤ 2 giây trên 4G ở màn hình 360 px với cấp có 500 mục; kết quả bài nghe hiển thị p95 ≤ 1 giây sau khi chọn "Nộp bài".
- NFR-4: Capacity: mỗi bản thu ≤ 15 giây ở "Nói theo" và ≤ 30 giây ở "Đóng vai", ≤ 1 MB mỗi bản thu; một lần đóng vai giữ tối đa 40 bản thu với tổng ≤ 40 MB bộ nhớ thiết bị và mọi bản thu được giải phóng ≤ 1 giây sau khi bị xóa.
- NFR-5: Compatibility: 100% chức năng của S17 và S18 (kể cả thu âm, nghe bản thu, "So sánh", đóng vai) hoạt động trên Safari iOS 16.4 trở lên, Chrome Android 10 trở lên và 2 phiên bản chính mới nhất của Chrome, Edge, Firefox, Safari trên máy tính, kiểm chứng trên ≥ 2 iPhone và ≥ 2 điện thoại Android thật trước mỗi bản phát hành.
- NFR-6: Usability: S17 và S18 dùng được ở chiều rộng 360–430 px (HV trên điện thoại) và ≥ 1280 px (HV trên màn hình rộng) không có cuộn ngang, vùng chạm ≥ 44×44 px; chữ Hán ở màn hình luyện "Nói theo" và lượt thoại cao ≥ 32 px; 100% pinyin hiển thị đúng dấu thanh (ā á ǎ à và ü).
- NFR-7: Accessibility: 100% âm thanh có văn bản tương đương (chữ Hán + pinyin + nghĩa cho từ, câu, lượt thoại; lời thoại đầy đủ cho bài nghe sau khi nộp); 100% điều khiển phát, tốc độ, thu âm, tự đánh giá thao tác được bằng bàn phím và có nhãn đọc được bằng trình đọc màn hình; trạng thái "Đang thu…" và kết quả "Đúng" / "Sai" được thông báo cho trình đọc màn hình; tương phản chữ ≥ 4,5:1 (WCAG 2.1 AA).
- NFR-8: Privacy: 0 byte dữ liệu âm thanh từ micro được gửi ra khỏi thiết bị, kiểm chứng bằng kiểm thử tự động ghi toàn bộ lưu lượng mạng trong các luồng "Nói theo" và "Đóng vai"; chỉ báo micro tắt ≤ 1 giây sau khi dừng thu hoặc rời màn hình; 0 dữ liệu Luyện nghe & nói của HV xuất hiện trong phản hồi tới tài khoản khác (kể cả GV của workspace của HV) và 100% lần tài khoản GV mở S17 / S18 nhận A05, trong bộ kiểm thử phân quyền bao phủ 100% dữ liệu của S17 / S18.
- NFR-9: Reliability: 0 lượt làm bài nghe bị mất hoặc bị ghi trùng trong 100 lần kiểm thử nộp bài với mất kết nối và thử lại.
- NFR-10: Observability: 100% lượt nộp bài nghe, lần tự đánh giá, lần hoàn thành đóng vai, lỗi phát âm thanh và lỗi micro (loại lỗi, trình duyệt) được ghi nhật ký có cấu trúc gồm thời điểm, mã tài khoản, mã nội dung, loại thao tác và kết quả, không chứa họ tên, email hay dữ liệu âm thanh, truy vết được trong ≥ 90 ngày.

## 7. Key Entities

- **Mục từ và câu** (thuộc 016 — Kho nội dung tự học của workspace, GV quản lý) — một từ hoặc câu của kho: loại (Từ / Câu), chữ Hán giản thể, pinyin có dấu thanh,
  nghĩa tiếng Việt, âm thanh bản xứ, cấp HSK, chủ đề, thứ tự, trạng thái phát hành. Dùng chung cho "Nghe từ & câu" và
  "Nói theo".
- **Bài nghe** (thuộc 016) — một âm thanh hội thoại hoặc đoạn văn: tên, loại ("Hội thoại" / "Đoạn văn"), cấp HSK,
  chủ đề, âm thanh, lời thoại theo từng câu (người nói, chữ Hán, pinyin, nghĩa), các câu hỏi một lựa chọn (2–4 phương
  án, đáp án đúng, giải thích), trạng thái phát hành.
- **Kịch bản đóng vai** (thuộc 016) — tên, tình huống ("Gọi món", "Mua sắm", "Phỏng vấn", "Giao tiếp công sở" …), cấp
  HSK, mô tả bối cảnh tiếng Việt, ≥ 2 vai, các lượt thoại theo thứ tự (vai, chữ Hán, pinyin, nghĩa, âm thanh bản xứ),
  trạng thái phát hành.
- **Lượt làm bài nghe** (014) — một lần nộp một bài nghe của một HV: bài nghe, cấp HSK, thời điểm nộp, phương án
  đã chọn từng câu, số câu đúng / tổng số câu, bản lưu nội dung câu hỏi, đáp án, giải thích và lời thoại tại thời điểm
  nộp. Chỉ chính HV đó xem; giữ tới khi tài khoản HV bị xóa. Chỉ lượt được ghi nhận đầu tiên của mỗi bài nghe tính vào
  độ chính xác theo cấp.
- **Tự đánh giá nói theo** (014) — tự đánh giá gần nhất của một HV cho một mục từ hoặc câu: "Giống" / "Chưa
  giống", thời điểm. Tối đa một bản ghi mỗi HV mỗi mục.
- **Lần hoàn thành đóng vai** (014) — một lần một HV đi tới lượt cuối của một kịch bản: kịch bản, vai đã chọn,
  ngày hoàn thành, số lượt đã thu / tổng số lượt của vai.
- **Bản thu** (014, chỉ trên thiết bị) — âm thanh người dùng thu cho một mục "Nói theo" hoặc một lượt thoại trong một
  lần đóng vai: thời lượng ≤ 15 / 30 giây. Không bao giờ được lưu ngoài thiết bị; tự xóa theo AC-15.2.
- Tham chiếu (không thuộc module này): tài khoản HV / GV, trạng thái kích hoạt / khóa / xóa (001); trang Tự học S13 và
  cấp HSK dùng chung của khu Tự học (012); Kho nội dung tự học của mỗi workspace, bộ nội dung khởi tạo, trạng thái
  phát hành / ẩn / lưu trữ và các màn hình quản lý T23–T27 của GV (016).

## 8. Edge Cases & Error Handling

- Điện thoại đang ở chế độ im lặng hoặc âm lượng 0: âm thanh có thể không nghe được do hệ điều hành; đây không phải lỗi
  phát, thông báo lỗi chỉ hiện khi không tải hoặc không phát được (AC-3.6).
- Người dùng chạm "Thu âm" khi âm thanh mẫu đang phát: âm thanh mẫu dừng, rồi mới thu, để bản thu không lẫn tiếng mẫu
  (AC-9.1).
- Người dùng chạm "Nghe mẫu" trong lúc đang thu: bản thu kết thúc như khi chọn "Dừng" rồi mới phát mẫu (AC-9.7).
- Bản thu im lặng hoặc rất nhỏ (≥ 0,5 giây): được giữ; người dùng tự nghe và tự đánh giá — MVP không phân tích âm thanh
  (AC-9.4, AC-11.3).
- Thu đúng 15,0 giây ở "Nói theo" / 30,0 giây ở "Đóng vai", hoặc chỉ 0,49 giây: tự dừng và giữ bản thu ở giới hạn; bản
  thu 0,49 giây bị bỏ (AC-9.3, AC-9.4).
- Cuộc gọi đến, chuyển ứng dụng, khóa màn hình trong lúc thu: phần đang thu bị bỏ, bản thu trước giữ nguyên (AC-8.5).
- Người dùng cấp quyền micro rồi thu hồi trong cài đặt trình duyệt: lần "Thu âm" kế tiếp hiển thị thông báo chặn quyền
  kèm "Thử lại" (AC-8.2).
- Người dùng chọn "Để sau" ở lời giải thích micro: không thu; lần "Thu âm" kế tiếp hiển thị lại lời giải thích (AC-8.1).
- Trình duyệt trong ứng dụng (mở link từ Zalo / Facebook) không hỗ trợ thu âm: thông báo trình duyệt không hỗ trợ thu
  âm, các chức năng nghe vẫn dùng được (AC-8.4).
- Không có micro và người dùng đóng vai: đi hết kịch bản bằng "Bỏ qua"; "Nghe lại cả hội thoại" phát toàn bộ bằng âm
  thanh mẫu kèm nhãn "Bản mẫu"; vẫn ghi nhận một lần hoàn thành với "Đã thu 0/y lượt của bạn" (AC-8.2, AC-14.1, AC-14.2).
- Trình duyệt chặn tự phát lượt của vai khác (thường gặp trên iOS): dừng ở lượt đó với nút "Phát" (AC-13.3).
- Kịch bản có 3 vai trở lên: người dùng chọn một vai, ứng dụng đóng mọi vai còn lại (AC-12.4).
- Kịch bản mà vai đã chọn nói lượt đầu tiên: "Đến lượt bạn" hiển thị ngay sau "Bắt đầu" (AC-13.4).
- Hai lượt liên tiếp của vai người dùng: mỗi lượt có bản thu riêng; chuyển lượt chỉ khi chọn "Tiếp tục" / "Bỏ qua"
  (AC-13.6, AC-13.7).
- Tải lại trang giữa lần đóng vai: bản thu bị xóa, không ghi nhận hoàn thành; người dùng bắt đầu lại từ bước chọn vai
  (AC-14.6, AC-15.2).
- Mất kết nối khi đang làm bài nghe nhưng âm thanh đã tải xong: vẫn nghe và chọn đáp án được; nộp bài bị lỗi thì giữ
  phương án và cho "Thử lại" (AC-6.6).
- Nộp cùng một bài nghe từ hai thiết bị: hai lượt làm riêng biệt, cả hai vào lịch sử; lượt được ghi nhận trước là lượt
  đầu tiên tính vào độ chính xác theo cấp (AC-6.1, AC-7.1, AC-7.2, AC-7.5).
- Tự đánh giá cùng một mục trên hai thiết bị: lựa chọn sau cùng là tự đánh giá gần nhất (AC-11.2).
- Làm lại một bài nghe nhiều lần: mỗi lần nộp là một lượt trong lịch sử với điểm riêng, nhưng chỉ lượt nộp đầu tiên của
  bài tính vào độ chính xác theo cấp; làm lại để học không làm tăng độ chính xác (AC-6.3, AC-7.1, AC-7.5).
- Lần nộp đầu tiên bị lỗi rồi "Thử lại" thành công: lượt thành công đó là lượt đầu tiên của bài (AC-6.6, AC-7.1).
- GV sửa đáp án của bài nghe trong kho sau khi HV đã nộp: lượt cũ giữ kết quả và nội dung tại thời điểm nộp, không
  chấm lại (AC-7.3, AC-17.2).
- GV ẩn một bài nghe khi HV đang làm: HV làm xong và được chấm theo nội dung đã mở; từ lần mở sau bài không còn trong
  danh sách, lượt cũ mang nhãn "Bài không còn trong kho" (AC-17.1, AC-17.2, AC-17.3).
- Kho của workspace chưa có nội dung cho cấp cao (ví dụ HSK8), hoặc GV đã ẩn hết nội dung của một cấp: "Chưa có nội dung
  cho cấp và chủ đề này." (AC-2.4).
- Workspace mới, GV chưa chỉnh kho: HV thấy đúng bộ nội dung HSK khởi tạo đang phát hành (AC-1.2, AC-2.3).
- Nội dung GV khác thêm vào kho của workspace khác: không bao giờ hiển thị cho HV của workspace này (AC-2.3).
- HV bị gỡ khỏi mọi lớp hoặc mọi lớp kết thúc: vẫn dùng S17 / S18 và giữ toàn bộ dữ liệu (AC-1.2, AC-16.1).
- HV bị khóa giữa lúc luyện: phiên kết thúc theo 001; bản thu trên thiết bị mất theo AC-15.2; dữ liệu đã lưu được giữ
  (AC-16.6).
- GV mở S17 / S18 (kể cả bằng đường dẫn trực tiếp hoặc sau khi đăng nhập từ A01): A05, không lộ dữ liệu; GV xem trước
  nội dung chỉ bên trong T23–T27 (016) (AC-1.5, AC-1.6).
- HV dùng S17 / S18 trên máy tính màn hình rộng: cùng chức năng, không cuộn ngang (AC-1.2, NFR-6).
- Người dùng chuyển tốc độ sang "0,5×" rồi mở mục khác: tốc độ được giữ (AC-3.2); "Nghe bản thu" luôn 1× (AC-10.3).

## 9. Out of Scope

- **Giai đoạn 2 (V14-3):** nhận xét và chấm phát âm, thanh điệu bằng nhận diện giọng nói; đóng vai tự do / hội thoại với
  AI; mọi việc gửi giọng nói lên máy chủ (sẽ cần yêu cầu đồng ý riêng khi tới giai đoạn 2).
- GV giao bài nghe, bài nói hoặc kịch bản cho lớp; GV xem kết quả tự học của HV; tính tự học vào xếp hạng / dashboard.
- Lưu bản thu lâu dài (trên thiết bị qua các lần mở hay trên máy chủ), tải xuống, chia sẻ, gửi bản thu cho GV.
- Hiển thị dạng sóng âm, đường cao độ / thanh điệu, chấm điểm tự động hoặc so khớp bản thu với mẫu.
- HV tự tạo nội dung nghe / nói hay tải âm thanh của riêng mình. Việc GV sửa / thêm / ẩn nội dung trong Kho nội dung tự
  học thuộc 016 (T23–T27), không thuộc 014.
- GV dùng S17 / S18 để tự luyện hay xem trước nội dung (V15) — GV xem trước bên trong T23–T27 (016).
- Phát tự động cả danh sách từ / câu, danh sách phát, chế độ nghe khi tắt màn hình, tải nội dung để dùng ngoại tuyến.
- Câu hỏi nghe hiểu ngoài loại một lựa chọn (điền từ, nhiều lựa chọn, sắp xếp); giới hạn số lần nghe kiểu đề thi HSK
  (thi thử HSK thuộc 015).
- Phụ đề chạy theo thời gian thực (karaoke) cho bài nghe; tốc độ khác 0,5× / 0,75× / 1× / 1,25×.
- Bảng xếp hạng, huy hiệu, chuỗi ngày luyện cho Luyện nghe & nói.

**Removed (2026-10-22, V15)** — không mã AC nào bị bỏ (không có mã bỏ trống); các hành vi sau không còn:

- GV dùng S17 / S18 như một người học (tự luyện, lượt làm, tự đánh giá, lần hoàn thành của chính GV) — AC-1.1, AC-1.2,
  AC-1.5, AC-16.1 viết lại chỉ cho HV; GV mở S17 / S18 → A05 (AC-1.6).
- Lối vào S13 và bố cục máy tính dành cho GV; giữ hiển thị trên màn hình rộng cho HV (NFR-6).
- Vai trò "Quản trị nội dung" và việc chuyển vai trò này về màn hình Q01 (AC-1.6 cũ) — vai trò không còn tồn tại.
- Kho nội dung hệ thống dùng chung cho mọi workspace — thay bằng Kho nội dung tự học của từng workspace do GV quản lý
  (AC-1.2, AC-2.1, AC-2.3, AC-17.1 … AC-17.4).

## 10. Assumptions & Dependencies

Quyết định của stakeholder được dùng: D1 (workspace riêng của GV), D4 / V4-6 (GV tạo và kích hoạt tài khoản HV; không
tự đăng ký), V14-1 (Tự học không phụ thuộc lớp; riêng tư; không vào xếp hạng / dashboard), V14-3 (MVP không AI: thu và
nghe lại, đóng vai theo kịch bản; chấm phát âm / thanh điệu và đóng vai AI ở giai đoạn 2), **V15** (chỉ hai vai trò GV
và HV; Tự học chỉ dành cho HV — mọi HV đã kích hoạt, không bị khóa của workspace, không phụ thuộc lớp; GV chỉ quản lý
"Kho nội dung tự học" của workspace mình, nạp sẵn bộ nội dung HSK khởi tạo, GV sửa / thêm / ẩn tùy ý — 016), V12-4
(phong cách "Mực & giấy"). V14-2 (kho nội dung hệ thống do Quản trị nội dung duy trì) [thay thế 2026-10-22 V15].

Giả định được dùng: A4 (HV mobile-first 360–430 px, vẫn dùng được trên màn hình rộng), A5 (giao diện tiếng Việt, chữ Hán
giản thể, pinyin có dấu thanh), A7 (giờ Việt Nam UTC+7). Các giả định riêng của module ở §12 Session 2026-10-22 (V14) và
Session 2026-10-22 (V15 — Tự học chỉ cho HV).

Phụ thuộc module:

- **016** — nguồn duy nhất của nội dung là "Kho nội dung tự học" của workspace của HV (GV quản lý trên T23–T27, nạp sẵn
  bộ nội dung HSK khởi tạo; GV xem trước nội dung ở đó): mục từ và câu có âm thanh bản xứ (loại Từ / Câu, chữ Hán, pinyin, nghĩa, cấp,
  chủ đề, thứ tự); bài nghe (loại "Hội thoại" / "Đoạn văn", âm thanh, lời thoại theo câu có người nói, pinyin, nghĩa;
  câu hỏi một lựa chọn 2–4 phương án kèm đáp án và giải thích); kịch bản đóng vai (tình huống, mô tả bối cảnh tiếng
  Việt, ≥ 2 vai, lượt thoại có vai, chữ Hán, pinyin, nghĩa, âm thanh); trạng thái phát hành / ẩn / lưu trữ do GV đặt.
  **Cần 016 bảo đảm:**
  mọi nội dung đang phát hành có đủ âm thanh và văn bản (NFR-7); danh mục tình huống gồm ít nhất "Gọi món", "Mua sắm",
  "Phỏng vấn", "Giao tiếp công sở"; giới hạn ≤ 10 câu hỏi mỗi bài nghe, âm thanh bài nghe ≤ 5 phút, ≤ 40 lượt thoại mỗi
  kịch bản (NFR-4); 014 lưu bản sao nội dung câu hỏi / lời thoại vào lượt làm nên GV được sửa kho tự do; các màn hình
  quản lý kho T23–T27 không hiển thị dữ liệu tự học của HV (AC-16.2).
- **012** — trang Tự học S13 (chỉ HV) với lối vào "Luyện nghe" → S17 và "Luyện nói" → S18 (AC-1.1). **Cần 012 bổ sung /
  xác nhận:** hai ô lối vào trên S13; có dùng chung "cấp HSK chọn gần nhất" cho cả khu Tự học hay không (AC-2.2 hiện chỉ
  dùng chung trong S17 / S18).
- **001** — đăng nhập, A01 và chuyển về màn hình ban đầu sau đăng nhập, A05, khóa / xóa tài khoản. **Cần 001 bổ sung:**
  quy tắc định tuyến cho S17 / S18 (chỉ HV được vào; GV mở → A05 — AC-1.6); xóa tài khoản HV kéo theo xóa dữ liệu tự
  học trong 24 giờ (AC-16.5).
- **008, 009** — chỉ ràng buộc âm: dữ liệu 014 không xuất hiện trên S09, T01, T04, T15 và không vào Điểm xếp hạng / tiến
  độ (AC-16.2, AC-16.3).
- **015** — thi thử HSK có phần nghe riêng (cùng Kho nội dung tự học của workspace); 014 không chia sẻ lượt làm hay độ
  chính xác với 015.
- **Prototype** — S17, S18 chưa có trong `specs/screen-flow-design.html`; cần bổ sung theo spec này (V13-5: tính năng mới
  sau V12-1 thì spec dẫn).

## 11. Open Questions

Không còn câu hỏi mở.

- Q-1 (AC-7.1) đã đóng 2026-10-22: độ chính xác theo cấp chỉ tính lượt nộp đầu tiên của mỗi bài nghe; lịch sử vẫn liệt kê
  mọi lượt với điểm riêng (AC-7.1, AC-7.5, AC-17.2; xem §12 Session 2026-10-22 (chốt câu hỏi mở)).

## 12. Clarifications Log

### Session 2026-10-22 (V14)

- Q: Yêu cầu của module? → A: Nguyên văn: "giờ sẽ thêm các module feature global cho tất cả user để có thể dùng được và không phân biệt lớp: 5. Luyện nghe và nói — Nghe người bản xứ đọc từ và câu. Thu âm giọng nói của học viên. Nhận xét phát âm và thanh điệu bằng công nghệ nhận diện giọng nói. Nghe hội thoại rồi chọn đáp án. Luyện đóng vai: gọi món, mua sắm, phỏng vấn, giao tiếp công sở." (source: stakeholder)
- [thay thế 2026-10-22 V15: chỉ HV dùng; GV mở S17 / S18 → A05] Q: Ai được dùng? → A: Mọi tài khoản HV và GV hiện có, không cần lớp, không tự đăng ký công khai (AC-1.1, AC-1.2) (source: stakeholder — V14-1)
- [thay thế 2026-10-22 V15: nguồn là Kho nội dung tự học của workspace của HV, GV quản lý] Q: Nội dung lấy từ đâu? → A: Kho nội dung hệ thống (016): âm thanh bản xứ cho từ và câu, bài nghe và hội thoại kèm câu hỏi, kịch bản đóng vai có vai, lượt thoại, pinyin, nghĩa và âm thanh (REQ-2, §7) (source: stakeholder — V14-2)
- Q: MVP gồm gì, phần nào để sau? → A: MVP = nghe âm thanh bản xứ (tốc độ, lặp lại, ẩn/hiện pinyin và bản dịch), nghe hiểu (hội thoại → chọn đáp án, tự chấm kèm giải thích), thu giọng và nghe lại cạnh âm thanh mẫu (nói theo / tự so sánh), đóng vai theo kịch bản (ứng dụng đóng vai kia, người học đọc / thu lượt của mình, xem gợi ý, nghe lại cả hội thoại); giai đoạn 2 = chấm phát âm và thanh điệu bằng nhận diện giọng nói, đóng vai tự do với AI (REQ-3…REQ-14, §9) (source: stakeholder — V14-3)
- Q: Ai xem được dữ liệu tự học? → A: Riêng từng người dùng, GV không xem được, không ảnh hưởng xếp hạng / dashboard của lớp (REQ-16) (source: stakeholder — V14-1)
- Q: Vào từ đâu? → A: Từ trang Tự học S13 (012) (AC-1.1) (source: stakeholder)
- Q: Bản thu có được lưu không? → A: Chỉ trên thiết bị, trong trang đang mở; không gửi đi; tự xóa khi rời mục / lần đóng vai, đăng xuất, tải lại hay đóng trang; mỗi mục / lượt tối đa một bản thu; có "Xóa bản thu" (REQ-15, AC-9.5, AC-9.6) (source: assumption — giọng nói là dữ liệu cá nhân, HV có thể là trẻ vị thành niên; MVP không cần máy chủ xử lý giọng nên lưu giữ là rủi ro không có lợi ích; không phải xin đồng ý hay đặt thời hạn lưu trữ trên máy chủ)
- Q: Giới hạn thời lượng bản thu? → A: 15 giây mỗi mục "Nói theo", 30 giây mỗi lượt "Đóng vai", tối thiểu 0,5 giây (AC-9.3, AC-9.4, NFR-4) (source: assumption — câu HSK dài nhất đọc chậm < 10 giây, lượt thoại dài < 20 giây; giới hạn ngăn thu quên tắt)
- Q: Xin quyền micro thế nào? → A: Giải thích trước bằng lời của SAT rồi mới hỏi quyền trình duyệt; từ chối / không có micro / trình duyệt không hỗ trợ đều có thông báo riêng và vẫn dùng được phần nghe (REQ-8) (source: assumption — giảm tỷ lệ từ chối quyền trên điện thoại; không chặn người không có micro)
- Q: Tự đánh giá trong MVP? → A: "Giống" / "Chưa giống" cho từng mục "Nói theo", chỉ lưu lựa chọn gần nhất; đóng vai chỉ ghi nhận lần hoàn thành (REQ-11, AC-14.1) (source: assumption — gợi ý của brief; đơn giản, không giả lập chấm điểm)
- Q: Tốc độ phát và lặp lại? → A: 0,5× / 0,75× / 1× / 1,25×, giữ cao độ, nhớ trên thiết bị; "Lặp lại" nghỉ 1 giây giữa hai lần (AC-3.2, AC-3.3) (source: assumption — giữ cao độ quan trọng với thanh điệu; khoảng nghỉ để người học nói theo)
- [thay thế 2026-10-22 — một phần: mỗi lần nộp vẫn là một lượt trong lịch sử, nhưng chỉ lượt đầu tiên của mỗi bài tính vào độ chính xác theo cấp] Q: Bài nghe được làm lại không, nghe mấy lần? → A: Làm lại không giới hạn, mỗi lần nộp là một lượt; nghe, tua, đổi tốc độ không giới hạn trước khi nộp; lời thoại chỉ hiện sau khi nộp (AC-5.3, AC-5.4, AC-6.3) (source: assumption — đây là tự học, khác quy tắc một lần làm của bài tập lớp V11; giới hạn số lần nghe thuộc thi thử 015)
- Q: Câu hỏi nghe hiểu loại nào? → A: Một lựa chọn, 2–4 phương án, bắt buộc trả lời đủ trước khi nộp (AC-5.2, AC-5.5) (source: assumption — "chọn đáp án" trong yêu cầu; tránh câu bỏ trống làm sai lệch độ chính xác)
- Q: Lịch sử giữ bao lâu, lưu gì? → A: Mọi lượt nộp, tới khi tài khoản bị xóa; mỗi lượt lưu bản sao nội dung tại thời điểm nộp để xem lại đúng dù kho thay đổi (AC-7.3, AC-16.5, AC-17.2) (source: assumption — dữ liệu nhỏ, không nhạy cảm, có ích cho người học)
- Q: Đóng vai: bỏ qua lượt, gợi ý, tự phát? → A: Ứng dụng tự phát và tự chuyển lượt của vai khác; lượt của người học dừng chờ, có "Gợi ý" (pinyin + nghĩa), "Nghe mẫu", "Bỏ qua"; lượt bỏ qua phát bằng âm thanh mẫu khi nghe lại; hoàn thành được ghi nhận khi tới lượt cuối kể cả có lượt bỏ qua (REQ-13, REQ-14) (source: assumption — người không có micro vẫn luyện đọc được; tránh mắc kẹt giữa kịch bản)
- [thay thế 2026-10-22 V15: vai trò Quản trị nội dung không còn; AC-1.6 nay chặn GV bằng A05] Q: Quản trị nội dung có dùng S17 / S18? → A: Không; chuyển về màn hình của vai trò (AC-1.6) (source: assumption — V14-2 mô tả vai trò chỉ quản lý nội dung, không có dữ liệu người học; xem trước nội dung thuộc 016)
- Q: Cấp HSK mặc định? → A: Cấp chọn gần nhất trong S17 / S18, hoặc HSK1 (AC-2.2) (source: assumption — 012 có thể mở rộng thành cấp dùng chung cho cả khu Tự học, xem §10)
- Q: Dữ liệu khi tài khoản bị khóa / xóa? → A: Khóa: giữ nguyên; xóa: xóa vĩnh viễn trong 24 giờ (AC-16.5, AC-16.6) (source: assumption — nhất quán với 011 NFR-5 về xóa ảnh trong 24 giờ)

### Session 2026-10-22 (chốt câu hỏi mở)

- Q: Q-1 — Độ chính xác theo cấp tính trên mọi lượt nộp (kể cả làm lại cùng một bài) hay chỉ lượt đầu tiên của mỗi bài nghe? → A: Chỉ lượt nộp đầu tiên (lượt được ghi nhận sớm nhất) của mỗi bài nghe tính vào độ chính xác; lịch sử vẫn liệt kê mọi lượt với điểm riêng; làm lại để học, không làm tăng độ chính xác; khối hiển thị "{n} bài" thay cho số lượt (sửa AC-7.1, AC-17.2, US-3; thêm AC-7.5; cập nhật §7, §8, §11; thay giả định tạm "mọi lượt nộp" ở §11 cũ và mục "Bài nghe được làm lại không" được gắn "[thay thế 2026-10-22 — một phần]") (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối)

### Session 2026-10-22 (V15 — Tự học chỉ cho HV)

- Q: Ai dùng Tự học và ai quản lý nội dung tự học? → A: Nguyên văn: "Hệ thống hiện tại chỉ có 2 role là GV và học viên, và phần quản lí các nội dung tự học sẽ làm chung phần quản lí của GV luôn, và GV chỉ quản lí thôi, chức năng tự học chỉ dành cho user học viên. Gom quản lí hệ thống vào cho GV." → Chỉ hai vai trò GV và HV; S17 / S18 chỉ dành cho HV (mọi HV đã kích hoạt, không bị khóa của workspace, không phụ thuộc lớp); GV không dùng S17 / S18, mở → A05; vai trò Quản trị nội dung bị bỏ (AC-1.1, AC-1.2, AC-1.5, AC-1.6, AC-16.1, AC-16.5, US-1 … US-7, §3, §8, §9 "Removed (2026-10-22, V15)", §10) (source: stakeholder — V15)
- Q: Nội dung tự học lấy từ kho nào khi không còn kho hệ thống? → A: Mỗi GV có "Kho nội dung tự học" riêng trong workspace, được nạp sẵn bộ nội dung HSK khởi tạo, GV sửa / thêm / ẩn tùy ý (016, T23–T27); HV chỉ thấy kho của workspace mình (AC-1.2, AC-2.1, AC-2.3, AC-17.1 … AC-17.4, §7, §10) (source: stakeholder — V15, câu trả lời cho câu hỏi tiếp theo)
- Q: GV xem trước nội dung nghe / nói ở đâu? → A: Chỉ bên trong T23–T27 của 016; 014 không cung cấp chế độ xem trước cho GV (§3, §9) (source: assumption — V15 "GV chỉ quản lí thôi"; tránh GV tạo dữ liệu tự học hay thấy dữ liệu của HV qua S17 / S18)
- Q: GV mở S17 / S18 thì thấy gì? → A: A05 "Không tìm thấy nội dung bạn yêu cầu.", giống trường hợp nội dung không tồn tại; sau đăng nhập từ A01 bằng tài khoản GV cũng là A05 (AC-1.5, AC-1.6, NFR-8) (source: assumption — quy ước A05 của sản phẩm cho nội dung không thuộc quyền; không lộ việc màn hình tồn tại)
- Q: Màn hình rộng còn được hỗ trợ không? → A: Có, cho HV dùng máy tính (≥ 1280 px); bỏ mọi bố cục dành riêng cho GV (NFR-6) (source: assumption — NFR-6 đã quy định ≥ 1280 px; HV vẫn có thể học trên máy tính)
- Q: Lượt làm và tự đánh giá khi GV sửa / ẩn nội dung kho? → A: Giữ nguyên quy tắc cũ, nay do GV kích hoạt: lượt giữ bản sao lúc nộp, không chấm lại; nội dung bị ẩn / gỡ biến mất khỏi danh sách, lượt cũ mang nhãn "Bài không còn trong kho"; đang làm thì làm xong theo nội dung đã mở (AC-17.1 … AC-17.4) (source: assumption — quy tắc giữ lịch sử của V14 không đổi, chỉ đổi người thao tác)
- Q: Dữ liệu tự học có hiện cho GV trên màn hình quản lý kho không? → A: Không; T23–T27 không hiển thị dữ liệu Luyện nghe & nói của HV, kể cả số liệu từng HV (AC-16.2) (source: assumption — quyền riêng tư của V14-1 không đổi theo V15)
