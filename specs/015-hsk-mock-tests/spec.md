---
id: 015
slug: hsk-mock-tests
title: HSK mock tests
status: draft
branch: feat/015-hsk-mock-tests
created: 2026-10-22
updated: 2026-10-22
approved_by:
approved_at:
---

# HSK mock tests (Thi thử HSK)

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

Học viên (HV) muốn tự luyện cho kỳ thi HSK nhưng hiện chỉ có bài tập và bài thi do GV soạn cho lớp (005, 006),
không có đề chuẩn theo cấp, không làm lại được và không biết mình hay sai ở đâu. Stakeholder quyết định ngày 2026-10-22
(V14) thêm các module tự học không phụ thuộc lớp; module này là **"Mô phỏng thi thử HSK"**. Theo V15 (2026-10-22), khu
Tự học **chỉ dành cho HV** — mọi HV đã kích hoạt, không bị khóa của workspace; GV không dùng Tự học mà chỉ quản lý nội
dung. Module định nghĩa **S19 "Thi thử HSK"** — chọn cấp HSK 1–9 và một trong ba loại bài:
**"Luyện theo dạng"** (một kỹ năng/dạng câu, không giới hạn thời gian, tạm dừng được, kiểm tra từng câu),
**"Kiểm tra cuối chương"** (bài ngắn theo chương/chủ đề của kho) và **"Đề thi thử"** (đề đầy đủ, các phần theo thứ tự,
tính giờ theo phần hoặc toàn bài như kho quy định, âm thanh phát như thi thật, không tạm dừng, nộp tự động khi hết giờ)
— cùng **S20 "Kết quả & thống kê lỗi"** (điểm từng phần và tổng, Đạt/Chưa đạt, xem lại từng câu với đáp án và giải
thích, thống kê lỗi sai theo kỹ năng, dạng câu, điểm ngữ pháp/từ vựng và xu hướng qua các lượt, "Luyện lại câu sai",
thêm từ sai vào bộ từ cá nhân của 012). Nội dung lấy từ **"Kho nội dung tự học" của workspace của HV** (016; GV quản
lý trên T23–T27; nạp sẵn bộ nội dung HSK khởi tạo gồm câu hỏi, bài kiểm tra và đề thi thử, GV sửa / thêm / ẩn tùy ý —
V15); làm không giới hạn số lượt, mọi lượt được giữ trong lịch sử theo đúng phiên bản đề đã làm. Dữ liệu tự học là riêng
tư của từng HV, GV không xem được và không ảnh hưởng xếp hạng, tiến độ hay dashboard của lớp. Kết quả mong muốn: HV tự
đánh giá mức sẵn sàng thi HSK và biết chính xác cần luyện điểm nào, mà không cần GV soạn đề riêng cho từng lớp.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Người học dùng thi thử | Tỷ lệ HV đã kích hoạt bắt đầu ít nhất 1 lượt 015 trong 30 ngày sau khi module ra mắt | ≥ 25% |
| Luyện tập đều đặn | Số lượt đã nộp trung bình mỗi tháng của người học có ≥ 1 lượt | ≥ 6 |
| Tiến bộ đo được | Tỷ lệ người học có ≥ 3 lượt "Đề thi thử" cùng cấp mà điểm tổng lượt thứ 3 cao hơn lượt thứ 1 | ≥ 60% |
| Thống kê lỗi được dùng | Tỷ lệ lượt có lỗi mà người học mở "Luyện lại câu sai" hoặc "Luyện" một điểm yếu trong 7 ngày | ≥ 30% |
| Mô phỏng đáng tin | Độ lệch đồng hồ thi so với đồng hồ hệ thống | ≤ 2 giây (NFR-1) |
| Riêng tư tuyệt đối | Số dữ liệu 015 của người học hiển thị cho GV, người học khác hoặc tính vào 008/009 | 0 (NFR-10) |

## 3. Actors & Context

- **Học viên (HV)** — tài khoản do GV tạo và kích hoạt (001); dùng điện thoại là chính (360–430 px). Mở S19 từ trang
  "Tự học" S13 (012) bất kỳ lúc nào, kể cả khi không thuộc lớp nào hay lớp đã kết thúc. Luyện theo kỹ năng yếu, làm
  bài kiểm tra cuối chương sau khi học một chủ đề, làm đề thi thử trước kỳ thi HSK thật, xem lại lỗi và luyện lại.
- **Giáo viên (GV)** — chủ workspace (D1) và là người quản lý duy nhất của "Kho nội dung tự học" của workspace (016,
  T23–T27, V15): sửa, thêm, ẩn, xuất bản phiên bản mới, lưu trữ câu hỏi, bài kiểm tra cuối chương và đề thi thử (câu
  hỏi, âm thanh, đáp án, giải thích, nhãn kỹ năng và điểm ngữ pháp/từ vựng, thời gian, điểm đạt); kho được nạp sẵn bộ
  nội dung HSK khởi tạo. GV **không** dùng S19/S20 (mở → A05, AC-1.4), chỉ xem trước đề bên trong T23–T27, và **không**
  xem được dữ liệu tự học của HV nào, kể cả HV trong workspace của mình.
- **Hệ thống** — đồng hồ hệ thống cho mọi tính giờ; nhận từ kho (016) các phiên bản đã xuất bản; gọi 012 khi thêm từ vào
  bộ từ.
- Chỉ có hai vai trò GV và HV (V15); vai trò "Quản trị nội dung" không còn.
- **Hiện nay** HV chỉ có bộ bài tập (một lượt mỗi bộ trong lớp, 005) và bài thi do GV soạn (006, tính 70% Điểm
  xếp hạng). Không có đề chuẩn theo cấp HSK, không làm lại được, không có thống kê lỗi. 015 **không** thay thế 006:
  006 là bài thi GV giao cho lớp và tính điểm xếp hạng; 015 là HV tự luyện từ Kho nội dung tự học của workspace và
  không bao giờ tính vào lớp.

**Thuật ngữ dùng trong spec này**

- **Người học** — một tài khoản HV đã kích hoạt, không bị khóa (V15: GV không bao giờ là người học của 015).
- **Kho** — "Kho nội dung tự học" của workspace của người học (016), do GV của workspace quản lý; người học chỉ thấy kho
  của workspace mình. "Đã xuất bản" = nội dung GV đang cho HV thấy theo trạng thái của 016 (không nháp, không bị ẩn,
  không lưu trữ).
- **Đề** — một "Bài kiểm tra cuối chương" hoặc một "Đề thi thử" của kho, gồm một hoặc nhiều **phần** (Nghe, Đọc hiểu,
  Từ vựng – Ngữ pháp, Viết/Sắp xếp câu… theo kho).
- **Lượt** — một lần làm của người học: lượt luyện ("Luyện theo dạng", kể cả "Luyện lại câu sai" và luyện điểm yếu)
  hoặc lượt làm một đề. Trạng thái: Đang làm, Đang tạm dừng (chỉ lượt không giới hạn thời gian), Đã nộp.
- **Mục chấm** — một câu thường, hoặc một câu hỏi con của câu nhóm (Đọc hiểu, Nghe).
- **Lỗi** — mục chấm có kết quả Sai, Đúng một phần hoặc Chưa trả lời (AC-14.1).
- **Kỹ năng** — "Từ vựng", "Ngữ pháp", "Nghe", "Đọc hiểu", "Sắp xếp câu" (nhãn của kho cho mỗi câu).

## 4. User Stories

- US-1 (P1): Là người học, tôi muốn làm một đề thi thử HSK đầy đủ, tính giờ và phát âm thanh như thi thật, để biết mình
  đã sẵn sàng cho kỳ thi chưa.
  - Why this priority: lõi của yêu cầu "đề thi thử … chấm điểm tự động"; là lý do chính để người học mở module.
  - Independent test: HV Trần Minh Anh chọn HSK 3 → "Đề thi thử" → "Đề số 1" (Nghe 40 câu 35 phút, Đọc hiểu 30 câu 30
    phút, Viết 10 câu 15 phút, tính giờ theo phần, điểm đạt 180/300) → "Đang tải âm thanh… 100%" → "Bắt đầu làm bài" →
    phần Nghe tự phát, không có nút tạm dừng; thoát ở phút 12 và mở lại trên điện thoại khác sau 3 phút → đồng hồ phần
    Nghe còn 20:00 ± 2 giây, âm thanh phát tiếp từ phút 15; không mở lại trước khi hết giờ → lượt "Nộp tự động" → S20
    "Nghe 70/100 · Đọc hiểu 80/100 · Viết 40/100 · Tổng 190/300 · Đạt".
- US-2 (P1): Là người học, tôi muốn luyện riêng một kỹ năng hoặc một dạng câu không giới hạn thời gian, xem đáp án và
  giải thích ngay sau từng câu, tạm dừng và làm tiếp sau, để luyện đúng chỗ mình yếu.
  - Why this priority: yêu cầu "trắc nghiệm từ vựng, ngữ pháp, bài nghe và đọc hiểu, sắp xếp từ thành câu"; dùng được
    hằng ngày, kể cả khi chưa đủ thời gian làm cả đề.
  - Independent test: HSK 2 → "Luyện theo dạng" → "Ngữ pháp" → "Tất cả dạng" → 10 câu → "Bắt đầu luyện"; trả lời câu
    1 → "Kiểm tra" → thấy "Sai", đáp án đúng và giải thích; "Tạm dừng" ở câu 4 → S19 "Đang tạm dừng · 4/10 câu đã trả
    lời" → "Tiếp tục" ở câu 4 → nộp → S20 "70/100 · 7/10 câu đúng".
- US-3 (P1): Là người học, tôi muốn xem điểm từng phần, điểm tổng, Đạt/Chưa đạt và xem lại từng câu với câu trả lời của
  tôi, đáp án đúng và giải thích, để hiểu vì sao mình sai.
  - Why this priority: "chấm điểm tự động, giải thích đáp án" là yêu cầu trực tiếp.
  - Independent test: sau US-1, S20 "Xem lại từng câu" → bộ lọc "Câu sai (25)" → câu 12 (Nghe) có trình phát, "Lời
    thoại", "Bạn trả lời: B", "Đáp án đúng: C", "Giải thích: …".
- US-4 (P1): Là người học, tôi muốn thấy lỗi của tôi được thống kê theo kỹ năng, dạng câu, điểm ngữ pháp/từ vựng và xu
  hướng qua các lượt, để biết cần luyện gì tiếp.
  - Why this priority: "thống kê lỗi sai" là yêu cầu trực tiếp và là giá trị khác biệt so với bài tập lớp.
  - Independent test: người học có 3 lượt HSK 3 → S19 "Thống kê lỗi sai" → "Điểm yếu" đầu danh sách "补语 (bổ ngữ kết quả)
    · Sai 7/9"; "Xu hướng" Nghe 55% → 62% → 70%; một lượt duy nhất ở HSK 4 → "Cần ít nhất 2 lượt làm để xem xu hướng."
- US-5 (P2): Là người học, tôi muốn làm bài kiểm tra cuối chương ngắn theo chủ đề của kho, để kiểm tra nhanh sau khi học
  xong một chủ đề.
  - Why this priority: yêu cầu "bài kiểm tra cuối chương"; dùng chung gần như toàn bộ hành vi của US-1/US-2 nên làm sau.
  - Independent test: HSK 1 → "Kiểm tra cuối chương" → "Chương 3 · Gia đình" (15 câu, 10 phút) → hết giờ → nộp tự động
    → S20 "80/100 · 12/15 câu đúng"; lịch sử có lượt này.
- US-6 (P2): Là người học, tôi muốn luyện lại đúng những câu tôi đã sai, hoặc luyện một điểm yếu, để sửa lỗi một cách
  có chủ đích.
  - Why this priority: biến thống kê thành hành động; cần US-3/US-4 trước.
  - Independent test: S20 của lượt có 6 câu sai → "Luyện lại câu sai" → lượt luyện 6 câu "Luyện lại câu sai · Đề số 1";
    một câu đã bị kho gỡ → "1 câu không còn trong kho nên đã được bỏ qua."
- US-7 (P2): Là người học, tôi muốn thêm các từ gắn với câu tôi làm sai vào bộ từ cá nhân của mình ở "Từ vựng thông minh"
  (012), để ôn lại bằng lặp lại ngắt quãng.
  - Why this priority: nối 015 với 012; cần 012 có bộ từ cá nhân.
  - Independent test: S20 → "Thêm từ sai vào bộ từ" → chọn "Tạo bộ mới" "Từ sai · HSK 3" → "Đã thêm 8 từ vào bộ Từ sai ·
    HSK 3."; lặp lại → "Đã thêm 0 từ vào bộ Từ sai · HSK 3. 8 từ đã có trong bộ."
- US-8 (P1): Là HV, tôi muốn dữ liệu tự học của tôi là riêng tư và không ảnh hưởng tới lớp, để tôi luyện thoải mái mà
  không sợ bị đánh giá.
  - Why this priority: điều kiện bắt buộc của stakeholder (V14); sai phân quyền là rủi ro nghiêm trọng.
  - Independent test: GV của Minh Anh mở đường dẫn S20 một lượt của Minh Anh → A05, giống hệt lượt không tồn tại; GV mở
    S19 → A05; Điểm xếp hạng và tiến độ của Minh Anh trên S09/T04/T15 không đổi sau 5 lượt thi thử.
- US-9 (P1): Là người học, tôi muốn làm lại đề bao nhiêu lần cũng được và xem lại mọi lượt cũ đúng như lúc tôi làm,
  kể cả khi kho đã sửa đề, để theo dõi tiến bộ.
  - Why this priority: "làm không giới hạn" và "lịch sử theo phiên bản đã làm" là điều kiện của brief.
  - Independent test: làm "Đề số 1" hai lần; GV xuất bản trong kho phiên bản 2 với một đáp án được sửa → S20 của lượt 1 vẫn
    hiển thị câu và điểm theo phiên bản 1 kèm "Đề này đã được cập nhật sau lượt làm của bạn. Kết quả được giữ theo
    phiên bản bạn đã làm."; lượt 3 dùng phiên bản 2.

## 5. Functional Requirements

### REQ-1: Access and entry — Quyền dùng và lối vào Thi thử HSK

<!-- Story: US-1, US-2, US-8 · Priority: P1 · Screens: S13, S19, S20, A01, A05 -->

- AC-1.1: WHEN người học chọn ô "Thi thử HSK" trên trang "Tự học" S13 (012) THE SYSTEM SHALL mở S19 "Thi thử HSK".
- AC-1.2: THE SYSTEM SHALL cho mọi tài khoản HV đã kích hoạt, không bị khóa dùng toàn bộ chức năng của S19 và S20 với nội dung của Kho nội dung tự học thuộc workspace của HV (016), không yêu cầu HV thuộc lớp nào, kể cả HV không thuộc lớp nào hoặc chỉ thuộc lớp Đã kết thúc.
- AC-1.3: IF người chưa đăng nhập mở S19, S20 hoặc một lượt (kể cả bằng đường dẫn trực tiếp) THEN THE SYSTEM SHALL chuyển đến A01 và, sau khi đăng nhập thành công, mở lại đúng màn hình đã yêu cầu nếu người đó có quyền xem theo AC-1.2 và AC-17.1, nếu không (kể cả khi tài khoản đăng nhập là GV — AC-1.4) thì hiển thị A05.
- AC-1.4: IF tài khoản GV mở S19, S20 hoặc một lượt, kể cả bằng đường dẫn trực tiếp THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." (001) và không hiển thị nội dung đề, lượt hay thống kê nào.

### REQ-2: Level and type selection — Chọn cấp HSK và loại bài (S19)

<!-- Story: US-1, US-2, US-5 · Priority: P1 · Screens: S19 -->

- AC-2.1: WHEN người học mở S19 THE SYSTEM SHALL hiển thị bộ chọn cấp gồm các cấp mà kho (016) định nghĩa — "HSK 1" đến "HSK 6" và một cấp chung "HSK 7–9" — theo thứ tự tăng dần, với cấp người học chọn gần nhất được chọn sẵn (HSK 1 ở lần đầu), ba thẻ "Luyện theo dạng", "Kiểm tra cuối chương", "Đề thi thử" của cấp đang chọn, mục "Lịch sử làm bài" và nút "Thống kê lỗi sai".
- AC-2.2: WHEN người học đổi cấp trên S19 THE SYSTEM SHALL hiển thị ba thẻ, mục "Đang làm dở" và "Lịch sử làm bài" theo cấp mới, và chọn sẵn cấp đó ở lần mở S19 kế tiếp trên mọi thiết bị của người học.
- AC-2.3: THE SYSTEM SHALL hiển thị trên mỗi thẻ loại bài số lượng nội dung đã xuất bản của cấp đang chọn: "<n> câu hỏi" cho "Luyện theo dạng", "<n> bài kiểm tra" cho "Kiểm tra cuối chương" và "<n> đề" cho "Đề thi thử".
- AC-2.4: THE SYSTEM SHALL hiển thị ở đầu S19 mục "Đang làm dở" liệt kê mọi lượt chưa nộp của người học ở cấp đang chọn, mỗi lượt gồm tên, loại bài và "Đang tạm dừng · <x>/<y> câu đã trả lời" hoặc "Đang làm · còn <thời gian>", kèm nút "Tiếp tục", và ẩn mục này khi không có lượt nào.
- AC-2.5: IF cấp đang chọn chưa có nội dung đã xuất bản cho một loại bài THEN THE SYSTEM SHALL hiển thị thẻ đó với dòng "Chưa có nội dung cho HSK <n>." và không cho bắt đầu lượt mới của loại đó.
- AC-2.6: THE SYSTEM SHALL chỉ dùng cho lượt mới câu hỏi, bài kiểm tra và đề thi thử ở trạng thái đã xuất bản trong Kho nội dung tự học (016) thuộc workspace của người học, không bao giờ dùng nội dung nháp, bị GV ẩn, đã lưu trữ hay thuộc kho của workspace khác.
- AC-2.7: IF không tải được dữ liệu của S19 THEN THE SYSTEM SHALL hiển thị "Không tải được dữ liệu. Vui lòng thử lại." kèm nút "Thử lại" và không hiển thị số 0 hay danh sách trống thay thế.

### REQ-3: Skill practice setup — Thiết lập "Luyện theo dạng"

<!-- Story: US-2 · Priority: P1 · Screens: S19 -->

- AC-3.1: WHEN người học chọn thẻ "Luyện theo dạng" THE SYSTEM SHALL hiển thị bước chọn gồm kỹ năng ("Từ vựng", "Ngữ pháp", "Nghe", "Đọc hiểu", "Sắp xếp câu" — chỉ những kỹ năng có câu hỏi đã xuất bản ở cấp đang chọn), dạng câu trong kỹ năng đó (mặc định "Tất cả dạng", chỉ liệt kê dạng có câu hỏi), số câu "10", "20" hoặc "30" (mặc định 10) và nút "Bắt đầu luyện".
- AC-3.2: WHEN người học chọn "Bắt đầu luyện" THE SYSTEM SHALL tạo một lượt luyện không giới hạn thời gian gồm số mục chấm đã chọn lấy từ các câu đã xuất bản thuộc cấp, kỹ năng và dạng đã chọn, ưu tiên ngẫu nhiên các câu người học chưa gặp trong lượt đã nộp nào, rồi tới các câu đã gặp lâu nhất, và mở câu 1.
- AC-3.3: THE SYSTEM SHALL tính mỗi câu thường là một mục chấm và mỗi câu hỏi con của câu nhóm (Đọc hiểu, Nghe) là một mục chấm, không tách câu nhóm khi lấy câu, và chỉ cho lượt vượt số câu đã chọn ít hơn số câu hỏi con của câu nhóm cuối cùng được lấy.
- AC-3.4: IF số mục chấm có sẵn cho lựa chọn ít hơn số câu đã chọn THEN THE SYSTEM SHALL tạo lượt với mọi câu có sẵn và hiển thị "Chỉ có <n> câu cho lựa chọn này."
- AC-3.5: IF người học đã có một lượt "Luyện theo dạng" chưa nộp ở cùng cấp khi chọn "Bắt đầu luyện", "Luyện lại câu sai" hoặc "Luyện" một điểm yếu THEN THE SYSTEM SHALL hiển thị "Bạn có một lượt luyện chưa xong (<x>/<y> câu đã trả lời)." với hai nút "Tiếp tục lượt cũ" và "Bỏ lượt cũ, bắt đầu mới", và chỉ tạo lượt mới sau khi lượt cũ bị bỏ theo AC-6.5.

### REQ-4: Chapter tests, mock tests and the start screen — Danh sách đề và màn hình bắt đầu

<!-- Story: US-1, US-5 · Priority: P1 · Screens: S19 -->

- AC-4.1: WHEN người học chọn thẻ "Kiểm tra cuối chương" THE SYSTEM SHALL liệt kê các bài kiểm tra đã xuất bản của cấp theo chương và thứ tự của kho, mỗi bài gồm "Chương <n> · <tên chủ đề>", tên bài, số câu, thời gian làm bài (hoặc "Không giới hạn thời gian"), số lượt đã nộp, điểm của lượt gần nhất (hoặc "Chưa làm") và nút "Bắt đầu", hoặc "Tiếp tục" khi người học có lượt chưa nộp của bài đó.
- AC-4.2: WHEN người học chọn thẻ "Đề thi thử" THE SYSTEM SHALL liệt kê các đề thi thử đã xuất bản của cấp theo thứ tự của kho, mỗi đề gồm tên đề, các phần kèm số câu, tổng thời gian, điểm đạt (khi kho có quy định), số lượt đã nộp, điểm cao nhất và điểm gần nhất (hoặc "Chưa làm"), và nút "Bắt đầu", hoặc "Tiếp tục" khi người học có lượt chưa nộp của đề đó.
- AC-4.3: WHEN người học chọn "Bắt đầu" một bài kiểm tra hoặc đề thi thử THE SYSTEM SHALL hiển thị màn hình bắt đầu gồm tên, hướng dẫn của kho, danh sách phần (tên, số câu và thời gian của phần khi đề tính giờ theo phần), tổng thời gian, điểm đạt (khi có), nút "Bắt đầu làm bài" và "Quay lại", và không hiển thị nội dung câu hỏi nào.
- AC-4.4: WHERE đề có giới hạn thời gian THE SYSTEM SHALL hiển thị thêm trên màn hình bắt đầu dòng "Đồng hồ chạy liên tục kể cả khi bạn thoát ra hoặc mất kết nối. Không thể tạm dừng."
- AC-4.5: WHERE đề thi thử có phần Nghe THE SYSTEM SHALL hiển thị trên màn hình bắt đầu dòng "Âm thanh phát tự động như khi thi thật, không tạm dừng hay nghe lại được. Hãy dùng tai nghe." cùng nút "Nghe thử", tải trước toàn bộ âm thanh của đề với tiến trình "Đang tải âm thanh… <n>%", và chỉ bật "Bắt đầu làm bài" khi đã tải xong.
- AC-4.6: IF việc tải trước âm thanh của đề thất bại THEN THE SYSTEM SHALL hiển thị "Không tải được âm thanh của đề. Kiểm tra kết nối và thử lại." kèm nút "Thử lại", và không tạo lượt.
- AC-4.7: WHEN người học chọn "Bắt đầu làm bài" THE SYSTEM SHALL tạo lượt gắn với phiên bản đang xuất bản của đề, ghi thời điểm bắt đầu theo đồng hồ hệ thống, đặt thời điểm kết thúc khi đề có giới hạn thời gian, và mở câu 1 của phần đầu tiên.
- AC-4.8: IF người học chọn "Bắt đầu làm bài" nhiều lần, gần như đồng thời ở hai thẻ hay thiết bị, hoặc khi đã có lượt chưa nộp của cùng đề THEN THE SYSTEM SHALL không tạo lượt thứ hai cho đề đó mà mở lượt chưa nộp hiện có ở mọi nơi.

### REQ-5: Answering questions — Làm bài, các dạng câu, tự lưu, tiếp tục

<!-- Story: US-1, US-2, US-5 · Priority: P1 · Screens: S19 (màn hình làm bài) · Quy tắc dạng câu: 005; quy tắc lưu/tiếp tục: 005, 006 -->

- AC-5.1: THE SYSTEM SHALL trình bày và cho người học trả lời các dạng câu Trắc nghiệm (gồm các biến thể từ vựng), Điền chỗ trống, Nối cặp, Sắp xếp từ thành câu, Viết chữ Hán theo pinyin và Đọc hiểu đúng như phía học viên của 005 (REQ-4 đến REQ-11), kể cả hiển thị pinyin theo 005 AC-7.5, thao tác bàn phím và thứ tự xáo trộn của Nối cặp, Sắp xếp từ thành câu được tạo một lần cho mỗi lượt.
- AC-5.2: THE SYSTEM SHALL trình bày câu Nghe do kho định nghĩa — một đoạn ghi âm kèm 1–10 câu hỏi con dạng Trắc nghiệm có phương án chữ, hình ảnh hoặc "Đúng"/"Sai" — với các câu hỏi con đánh số "<số câu>.<số câu con>" và đoạn ghi âm phát theo REQ-8.
- AC-5.3: WHILE người học đang làm bài THE SYSTEM SHALL hiển thị tên phần hiện tại, "Câu <n>/<tổng>", nút "Câu trước" / "Câu sau" và bảng số câu phân biệt câu đã hoàn thành, trả lời một phần và chưa trả lời theo 005 AC-14.3, và không hiển thị đáp án đúng, giải thích hay kết quả của câu nào ngoài trường hợp của AC-6.3.
- AC-5.4: WHEN người học thay đổi một câu trả lời THE SYSTEM SHALL tự động lưu trong vòng 3 giây sau thay đổi cuối cùng, hiển thị "Đang lưu…" trong khi lưu và "Đã lưu lúc HH:mm:ss" khi hệ thống đã ghi nhận.
- AC-5.5: WHEN người học mở lại một lượt chưa nộp (tải lại trang, mở lại trình duyệt, dùng thiết bị khác hoặc đăng nhập lại) THE SYSTEM SHALL tiếp tục chính lượt đó với mọi câu trả lời đã lưu, thứ tự xáo trộn của lượt và câu xem gần nhất, và với lượt có giới hạn thời gian thì thời gian còn lại bằng thời điểm kết thúc trừ thời điểm hiện tại theo đồng hồ hệ thống.
- AC-5.6: WHEN cùng một lượt được mở ở thẻ hoặc thiết bị thứ hai THE SYSTEM SHALL chuyển quyền làm bài sang nơi mở sau cùng, còn nơi mở trước hiển thị "Bài đang được làm ở thiết bị hoặc cửa sổ khác" và không ghi nhận thêm câu trả lời từ đó.
- AC-5.7: WHILE thiết bị mất kết nối trong lúc làm bài THE SYSTEM SHALL vẫn cho xem các câu đã tải và nhập câu trả lời, hiển thị "Mất kết nối — câu trả lời chưa được lưu" kèm số câu chưa lưu (thêm "Đồng hồ vẫn chạy." với lượt có giới hạn thời gian), và tự gửi các câu trả lời chưa lưu ngay khi có kết nối lại.
- AC-5.8: IF người học rời hoặc đóng trang khi còn câu trả lời chưa được lưu THEN THE SYSTEM SHALL cảnh báo "Một số câu trả lời chưa được lưu. Rời trang có thể làm mất chúng." trước khi rời trang.

### REQ-6: Untimed attempts — Lượt không giới hạn thời gian: tạm dừng, kiểm tra từng câu, bỏ lượt

<!-- Story: US-2, US-5 · Priority: P1 · Screens: S19 -->

- AC-6.1: WHILE người học làm một lượt không giới hạn thời gian ("Luyện theo dạng", hoặc "Kiểm tra cuối chương" mà kho không đặt thời gian) THE SYSTEM SHALL không hiển thị đồng hồ đếm ngược mà hiển thị thời gian đã làm dạng mm:ss (h:mm:ss từ 60 phút) cùng nút "Tạm dừng" và "Bỏ lượt".
- AC-6.2: WHEN người học chọn "Tạm dừng" THE SYSTEM SHALL lưu mọi câu trả lời, ngừng tính thời gian đã làm, đưa người học về S19 với lượt hiển thị trong mục "Đang làm dở" là "Đang tạm dừng · <x>/<y> câu đã trả lời", và giữ lượt không thời hạn cho tới khi được nộp hoặc bị bỏ.
- AC-6.3: WHILE người học làm một lượt "Luyện theo dạng" THE SYSTEM SHALL hiển thị ở mỗi câu nút "Kiểm tra" (chỉ bật khi câu đã có phần trả lời) và, khi người học chọn "Kiểm tra", chấm câu đó theo 005, khóa câu trả lời của câu và hiển thị ngay kết quả (Đúng / Đúng một phần / Sai), đáp án đúng và giải thích như S06 của 005.
- AC-6.4: THE SYSTEM SHALL chỉ tính vào thời gian đã làm của lượt không giới hạn thời gian những khoảng màn hình làm bài của lượt đang mở và hiển thị trên thiết bị, không tính khoảng tạm dừng, khi ứng dụng đóng hoặc chạy nền.
- AC-6.5: WHEN người học chọn "Bỏ lượt" (hoặc "Bỏ lượt cũ, bắt đầu mới" theo AC-3.5) và xác nhận "Bỏ lượt này? Câu trả lời sẽ bị xóa và không được lưu vào lịch sử." THE SYSTEM SHALL xóa lượt đó mà không chấm, không đưa vào lịch sử hay thống kê, và đưa người học về S19 hoặc tạo lượt mới đã yêu cầu.
- AC-6.6: THE SYSTEM SHALL không cung cấp "Kiểm tra" cho lượt "Kiểm tra cuối chương" (kể cả khi kho không đặt thời gian) hay "Đề thi thử" — đáp án và giải thích của các lượt này chỉ hiển thị sau khi nộp (REQ-11) — và không cung cấp "Tạm dừng" hay "Bỏ lượt" cho lượt có giới hạn thời gian.

### REQ-7: Timed attempts — Lượt có giới hạn thời gian: đồng hồ, phần thi, thoát ra

<!-- Story: US-1, US-5 · Priority: P1 · Screens: S19 · Quy tắc đồng hồ dựa theo 006 REQ-9 -->

- AC-7.1: WHILE người học làm một lượt có giới hạn thời gian THE SYSTEM SHALL hiển thị thường trực đồng hồ đếm ngược thời gian còn lại của phần hiện tại (đề tính giờ theo phần) hoặc của cả bài (đề tính giờ toàn bài), dạng mm:ss khi còn dưới 60 phút và h:mm:ss từ 60 phút trở lên, tính theo đồng hồ hệ thống chứ không theo đồng hồ thiết bị.
- AC-7.2: WHEN thời gian còn lại của phần hiện tại hoặc của bài chạm mốc 5 phút hoặc mốc 1 phút THE SYSTEM SHALL hiển thị cảnh báo không chặn thao tác "Còn 5 phút" hoặc "Còn 1 phút", mỗi mốc một lần cho mỗi phần hoặc cho bài, và bỏ qua mốc đã qua tại lúc phần hoặc bài bắt đầu.
- AC-7.3: WHERE đề tính giờ theo phần THE SYSTEM SHALL trình bày các phần theo thứ tự của kho, chỉ cho xem và trả lời câu của phần hiện tại, đặt thời điểm kết thúc của mỗi phần bằng thời điểm phần đó bắt đầu cộng thời gian của phần, và không cho quay lại phần đã qua.
- AC-7.4: WHEN người học chọn "Sang phần tiếp theo" và xác nhận "Bạn sẽ không thể quay lại phần <tên phần>. Thời gian còn lại của phần này không được cộng sang phần sau." THE SYSTEM SHALL kết thúc phần hiện tại và bắt đầu phần kế tiếp ngay.
- AC-7.5: WHEN hết thời gian của một phần không phải phần cuối, kể cả khi người học đã thoát ra hoặc mất kết nối THE SYSTEM SHALL kết thúc phần đó theo đồng hồ hệ thống với các câu trả lời của phần tới hệ thống chậm nhất 10 giây sau thời điểm kết thúc của phần, bắt đầu phần kế tiếp, và hiển thị "Hết giờ phần <tên phần>. Chuyển sang phần <tên phần kế tiếp>." khi người học đang mở hoặc mở lại lượt.
- AC-7.6: WHERE đề tính giờ toàn bài THE SYSTEM SHALL cho người học chuyển tự do giữa mọi câu của mọi phần, trừ phần Nghe được trình bày trước tiên theo AC-8.2 và không mở lại được sau khi phần Nghe kết thúc.
- AC-7.7: WHEN người học chọn "Thoát" trong lượt có giới hạn thời gian và xác nhận "Đồng hồ vẫn chạy khi bạn thoát. Bài sẽ được nộp tự động khi hết giờ." THE SYSTEM SHALL đưa người học về S19, tiếp tục tính giờ và hiển thị lượt trong mục "Đang làm dở" là "Đang làm · còn <thời gian>" kèm nút "Tiếp tục".

### REQ-8: Listening audio — Âm thanh phần Nghe: chế độ thi và chế độ luyện

<!-- Story: US-1, US-2 · Priority: P1 · Screens: S19, S20 -->

- AC-8.1: WHILE lượt "Đề thi thử" ở phần Nghe THE SYSTEM SHALL tự động phát các đoạn ghi âm theo thứ tự câu, mỗi đoạn đúng số lần phát và khoảng nghỉ do kho quy định cho đề (1 lần, không nghỉ khi kho không quy định), không cung cấp nút tạm dừng, tua, nghe lại hay đổi tốc độ, và hiển thị "Đang phát: câu <n> · lần <k>/<m>".
- AC-8.2: WHILE lượt "Đề thi thử" ở phần Nghe THE SYSTEM SHALL cho người học chuyển tới và trả lời mọi câu của phần Nghe có đoạn ghi âm đã bắt đầu phát, kết thúc phần Nghe khi hết thời gian của phần do kho quy định, và luôn trình bày phần Nghe trước các phần khác.
- AC-8.3: WHEN người học mở lại lượt "Đề thi thử" trong lúc phần Nghe đang diễn ra (tải lại trang, thiết bị khác, sau khi mất kết nối) THE SYSTEM SHALL phát tiếp từ vị trí ứng với thời gian đã trôi qua của phần theo đồng hồ hệ thống và không phát lại phần âm thanh đã qua.
- AC-8.4: IF trình duyệt chặn tự động phát âm thanh khi người học mở lại lượt trong phần Nghe THEN THE SYSTEM SHALL hiển thị nút "Chạm để tiếp tục nghe" và, khi được chạm, phát tiếp theo AC-8.3.
- AC-8.5: IF một đoạn ghi âm không phát được THEN THE SYSTEM SHALL hiển thị "Không phát được âm thanh." kèm nút "Thử lại" để phát lại từ vị trí ứng với đồng hồ thi (Đề thi thử) hoặc từ đầu đoạn (chế độ luyện), và trong Đề thi thử vẫn tiếp tục tính giờ.
- AC-8.6: WHILE người học làm câu Nghe trong lượt "Luyện theo dạng" hoặc "Kiểm tra cuối chương" THE SYSTEM SHALL hiển thị trình phát của đoạn ghi âm với "Phát"/"Tạm dừng", thanh tiến trình tua được, nghe lại không giới hạn và tốc độ "0,75×" / "1×" (mặc định 1×), và không tự phát.
- AC-8.7: THE SYSTEM SHALL không hiển thị và không gửi tới thiết bị lời thoại của đoạn ghi âm trước khi lượt được nộp, hoặc với lượt "Luyện theo dạng" trước khi người học chọn "Kiểm tra" câu đó.

### REQ-9: Submitting and auto-submit — Nộp bài và nộp tự động

<!-- Story: US-1, US-2, US-5 · Priority: P1 · Screens: S19, S20 · Dựa theo 005 REQ-15 và 006 REQ-11, REQ-12 -->

- AC-9.1: WHEN người học chọn "Nộp bài" THE SYSTEM SHALL hiển thị hộp xác nhận nêu số câu chưa hoàn thành kèm số thứ tự của chúng (hoặc "Bạn đã hoàn thành tất cả câu hỏi"), dòng "Các phần chưa làm sẽ được tính 0 điểm." khi còn phần chưa bắt đầu, dòng "Sau khi nộp, lượt này được chấm và lưu vào lịch sử." và hai nút "Nộp bài" và "Làm tiếp".
- AC-9.2: IF người học chọn "Nộp bài" trong lượt không giới hạn thời gian khi chưa trả lời câu nào THEN THE SYSTEM SHALL không cho nộp và hiển thị "Bạn cần trả lời ít nhất 1 câu trước khi nộp bài".
- AC-9.3: WHEN người học xác nhận nộp THE SYSTEM SHALL ghi nhận bài nộp gồm các câu trả lời đã lưu, thời điểm nộp và thời gian làm bài, khóa mọi câu trả lời của lượt, chấm theo REQ-10 và mở S20 với kết quả của lượt, kể cả khi lượt có giới hạn thời gian chưa có câu trả lời nào.
- AC-9.4: WHEN tới thời điểm kết thúc của một lượt có giới hạn thời gian chưa nộp THE SYSTEM SHALL tự động nộp lượt đó trong vòng 60 giây với các câu trả lời tới hệ thống chậm nhất 10 giây sau thời điểm kết thúc, kể cả khi người học đã đóng trình duyệt, mất kết nối hoặc bị khóa tài khoản, và gắn nhãn "Nộp tự động" cho bài nộp.
- AC-9.5: WHEN lượt được nộp tự động trong khi người học đang mở, hoặc người học mở lại một lượt đã được nộp tự động THE SYSTEM SHALL khóa mọi ô trả lời và hiển thị "Hết giờ — bài đã được nộp tự động lúc HH:mm" kèm nút "Xem kết quả".
- AC-9.6: IF người học gửi nộp nhiều lần, nộp từ hai thiết bị gần như đồng thời, hoặc nộp cùng lúc với nộp tự động THEN THE SYSTEM SHALL ghi nhận đúng một bài nộp cho lượt và đưa người học tới kết quả của bài nộp đó.
- AC-9.7: IF việc nộp không hoàn tất do mất kết nối THEN THE SYSTEM SHALL giữ nguyên bài làm trên màn hình, hiển thị "Chưa nộp được bài do mất kết nối. Bài làm của bạn vẫn được giữ lại." kèm nút "Thử lại", và khi lượt đã được nộp tự động trước lúc thử lại thì hiển thị theo AC-9.5.

### REQ-10: Grading and scores — Chấm điểm, điểm phần, điểm tổng, Đạt / Chưa đạt

<!-- Story: US-3, US-8 · Priority: P1 · Screens: S20 · Quy tắc chấm từng dạng: 005 -->

- AC-10.1: WHEN một bài nộp được ghi nhận THE SYSTEM SHALL chấm ngay mọi mục chấm theo quy tắc của dạng câu tương ứng trong 005 (kể cả điểm một phần và kết quả Đúng / Đúng một phần / Sai / Chưa trả lời theo 005 AC-16.3) với đáp án của phiên bản câu hỏi trong lượt, cho 0 điểm mục chưa trả lời, và giữ nguyên kết quả của câu đã "Kiểm tra" theo AC-6.3.
- AC-10.2: THE SYSTEM SHALL tính điểm của lượt "Luyện theo dạng" và "Kiểm tra cuối chương" bằng (điểm đạt ÷ điểm tối đa) × 100 làm tròn đến số nguyên gần nhất (phần lẻ từ 0,5 làm tròn lên), hiển thị "<điểm>/100" kèm "<x>/<y> câu đúng" với y là số mục chấm của lượt và x là số mục có kết quả Đúng.
- AC-10.3: THE SYSTEM SHALL tính cho lượt "Đề thi thử" điểm mỗi phần bằng (điểm đạt của phần ÷ điểm tối đa của phần) × thang điểm của phần do kho quy định (100 khi kho không quy định), làm tròn như AC-10.2, và điểm tổng bằng tổng điểm các phần trên thang bằng tổng thang các phần.
- AC-10.4: WHERE kho quy định điểm đạt cho đề THE SYSTEM SHALL gắn cho lượt nhãn "Đạt" khi điểm tổng (Đề thi thử) hoặc điểm trên 100 (Kiểm tra cuối chương) lớn hơn hoặc bằng điểm đạt, ngược lại gắn "Chưa đạt", và không gắn nhãn nào khi kho không quy định điểm đạt.
- AC-10.5: THE SYSTEM SHALL không cung cấp lượt, điểm hay thống kê nào của 015 cho 008, 009 hay bất kỳ màn hình GV nào (kể cả các màn hình quản lý kho T23–T27 của 016), và không làm thay đổi Điểm xếp hạng, hạng, tiến độ, trạng thái bộ bài tập hay bài thi của người học ở bất kỳ lớp nào.

### REQ-11: Result and review — Kết quả và xem lại từng câu (S20)

<!-- Story: US-3 · Priority: P1 · Screens: S20 · Trình bày đáp án như S06 của 005 -->

- AC-11.1: WHEN bài nộp được chấm xong, hoặc người học mở một lượt từ "Lịch sử làm bài" THE SYSTEM SHALL hiển thị S20 gồm tên đề (hoặc "Luyện <kỹ năng> · <dạng câu>" với lượt luyện), loại bài, cấp, "Nộp lúc HH:mm dd/MM/yyyy", nhãn "Nộp tự động" nếu có, thời gian làm bài, điểm theo AC-10.2 hoặc điểm từng phần và điểm tổng dạng "<điểm>/<thang>" theo AC-10.3, nhãn "Đạt"/"Chưa đạt" kèm "Điểm đạt: <điểm đạt>/<thang>" khi có, và dòng "Kết quả mô phỏng — không phải điểm thi HSK chính thức."
- AC-11.2: THE SYSTEM SHALL hiển thị trên S20 mục "Xem lại từng câu" với mọi câu của lượt theo thứ tự và nhóm theo phần, mỗi câu gồm số thứ tự, kỹ năng, dạng câu, kết quả, điểm đạt trên điểm tối đa, "Bạn trả lời:", "Đáp án đúng:" và "Giải thích:" (khi kho có giải thích) như S06 của 005 (AC-16.3, AC-16.4).
- AC-11.3: WHEN người học chọn bộ lọc "Tất cả", "Câu sai" hoặc "Chưa trả lời" trong "Xem lại từng câu" THE SYSTEM SHALL chỉ hiển thị các câu tương ứng (Câu sai gồm câu có mục kết quả Sai hoặc Đúng một phần), mỗi bộ lọc kèm số câu.
- AC-11.4: THE SYSTEM SHALL hiển thị cho mỗi câu Nghe trong "Xem lại từng câu" trình phát của đoạn ghi âm như AC-8.6 và mục "Lời thoại" (chữ Hán, kèm pinyin khi kho có) khi kho cung cấp lời thoại.
- AC-11.5: THE SYSTEM SHALL hiển thị cuối S20 các nút "Làm lại đề này" (Kiểm tra cuối chương, Đề thi thử — mở màn hình bắt đầu của phiên bản đang xuất bản), "Luyện tiếp" (Luyện theo dạng — mở bước chọn với lựa chọn của lượt), "Luyện lại câu sai" (REQ-15) và "Về Thi thử HSK".
- AC-11.6: IF không tải được S20 THEN THE SYSTEM SHALL hiển thị "Không tải được kết quả. Vui lòng thử lại." kèm nút "Thử lại", và không hiển thị điểm hay danh sách câu thiếu như thể là đầy đủ.

### REQ-12: Unlimited attempts and history — Làm không giới hạn và lịch sử làm bài

<!-- Story: US-9 · Priority: P1 · Screens: S19, S20 -->

- AC-12.1: THE SYSTEM SHALL cho người học làm mỗi bài kiểm tra, mỗi đề thi thử và mỗi lựa chọn luyện không giới hạn số lượt và không đặt hạn mức số lượt mới theo ngày, với nhiều nhất một lượt chưa nộp cho mỗi đề (AC-4.8) và một lượt "Luyện theo dạng" chưa nộp cho mỗi cấp (AC-3.5); số lượt mới bất thường chỉ được ghi nhận để xem xét theo NFR-13, không bị chặn.
- AC-12.2: THE SYSTEM SHALL lưu mọi lượt đã nộp (kể cả nộp tự động) vào lịch sử của người học với câu trả lời, kết quả từng mục chấm, điểm, thời gian làm bài và phiên bản nội dung đã làm, không giới hạn số lượng, cho tới khi tài khoản bị xóa.
- AC-12.3: WHEN người học mở "Lịch sử làm bài" trên S19 THE SYSTEM SHALL liệt kê các lượt đã nộp của cấp đang chọn, mới nhất trước, 20 lượt mỗi lần kèm "Xem thêm", mỗi lượt gồm thời điểm nộp, loại bài, tên đề hoặc "Luyện <kỹ năng> · <dạng câu>", điểm, nhãn "Đạt"/"Chưa đạt" khi có, thời gian làm bài và nhãn "Nộp tự động" nếu có, cùng bộ lọc loại bài "Tất cả", "Luyện theo dạng", "Kiểm tra cuối chương", "Đề thi thử".
- AC-12.4: WHEN người học chọn một lượt trong "Lịch sử làm bài" THE SYSTEM SHALL mở S20 của lượt đó.
- AC-12.5: IF người học chưa có lượt đã nộp nào ở cấp đang chọn thỏa bộ lọc THEN THE SYSTEM SHALL hiển thị trong "Lịch sử làm bài" dòng "Bạn chưa có lượt làm nào ở HSK <n>."
- AC-12.6: THE SYSTEM SHALL không cho người học xóa hay sửa một lượt đã nộp.

### REQ-13: Content versions — Phiên bản đề khi kho sửa hoặc lưu trữ

<!-- Story: US-9 · Priority: P1 · Screens: S19, S20 · Phiên bản do 016 quản lý, GV kích hoạt trên T23–T27 -->

- AC-13.1: THE SYSTEM SHALL gắn mỗi lượt với phiên bản của đề và của từng câu hỏi tại thời điểm lượt được tạo, và dùng đúng phiên bản đó cho việc làm bài, chấm, S20, lịch sử và thống kê của lượt, kể cả khi GV sau đó sửa nội dung, đáp án, giải thích, thời gian, điểm đạt, ẩn hay lưu trữ đề hoặc câu hỏi trong Kho nội dung tự học (016).
- AC-13.2: WHEN GV xuất bản trong kho phiên bản mới của một đề trong khi người học có lượt chưa nộp của đề đó THE SYSTEM SHALL cho lượt đó tiếp tục với phiên bản cũ (kể cả thời gian và thời điểm kết thúc) và chỉ dùng phiên bản mới cho lượt tạo sau đó.
- AC-13.3: THE SYSTEM SHALL không chấm lại lượt đã nộp khi GV sửa đáp án hay điểm của câu hỏi trong kho.
- AC-13.4: WHILE đề của một lượt đã có phiên bản xuất bản mới hơn phiên bản của lượt THE SYSTEM SHALL hiển thị trên S20 của lượt dòng "Đề này đã được cập nhật sau lượt làm của bạn. Kết quả được giữ theo phiên bản bạn đã làm."
- AC-13.5: WHEN GV lưu trữ hoặc ẩn một đề trong kho THE SYSTEM SHALL không còn liệt kê đề đó cho lượt mới trên S19, vẫn hiển thị mọi lượt đã nộp của đề trong lịch sử, S20 và thống kê, và cho lượt chưa nộp của đề tiếp tục từ mục "Đang làm dở" tới khi được nộp hoặc nộp tự động.

### REQ-14: Error statistics — Thống kê lỗi sai theo lượt và qua các lượt

<!-- Story: US-4 · Priority: P1 · Screens: S20 -->

- AC-14.1: THE SYSTEM SHALL coi một mục chấm là lỗi khi kết quả là Sai, Đúng một phần hoặc Chưa trả lời, và tính tỷ lệ đúng của một nhóm bằng số mục Đúng ÷ tổng số mục của nhóm × 100, làm tròn đến số nguyên gần nhất.
- AC-14.2: THE SYSTEM SHALL hiển thị trên S20 của một lượt mục "Thống kê lỗi sai" gồm ba bảng — theo kỹ năng, theo dạng câu, theo điểm ngữ pháp/từ vựng (nhãn của kho) — mỗi dòng gồm tên nhóm, "<số lỗi>/<số mục> câu sai" và tỷ lệ đúng, sắp xếp theo số lỗi giảm dần, trong đó bảng điểm ngữ pháp/từ vựng hiển thị 10 dòng đầu kèm "Xem tất cả".
- AC-14.3: WHEN người học chọn "Thống kê lỗi sai" trên S19 THE SYSTEM SHALL mở S20 ở chế độ thống kê tổng hợp của cấp đang chọn với bộ lọc loại bài ("Tất cả" mặc định, "Luyện theo dạng", "Kiểm tra cuối chương", "Đề thi thử") và khoảng thời gian ("30 ngày gần nhất" mặc định, "Tất cả"), gồm tỷ lệ đúng theo kỹ năng, theo dạng câu và danh sách "Điểm yếu" tính trên mọi lượt đã nộp thỏa bộ lọc.
- AC-14.4: THE SYSTEM SHALL lập danh sách "Điểm yếu" gồm tối đa 10 điểm ngữ pháp/từ vựng có tỷ lệ lỗi cao nhất trong phạm vi bộ lọc, chỉ xét điểm có ít nhất 3 mục chấm, hòa tỷ lệ thì xếp điểm có nhiều lỗi hơn trước, mỗi dòng gồm tên điểm, "Sai <số lỗi>/<số mục>", ngày gặp gần nhất và nút "Luyện".
- AC-14.5: THE SYSTEM SHALL hiển thị trong thống kê tổng hợp mục "Xu hướng" gồm biểu đồ tỷ lệ đúng của từng kỹ năng qua tối đa 10 lượt đã nộp gần nhất thỏa bộ lọc có mục thuộc kỹ năng đó theo thứ tự thời gian, và biểu đồ điểm tổng của tối đa 10 lượt "Đề thi thử" gần nhất kèm đường điểm đạt khi có, mỗi biểu đồ có nút "Xem dạng bảng" hiển thị cùng số liệu dạng bảng.
- AC-14.6: IF một biểu đồ xu hướng có ít hơn 2 lượt THEN THE SYSTEM SHALL hiển thị "Cần ít nhất 2 lượt làm để xem xu hướng." thay cho biểu đồ đó.
- AC-14.7: IF người học chưa có lượt đã nộp nào thỏa bộ lọc của thống kê tổng hợp THEN THE SYSTEM SHALL hiển thị "Chưa có dữ liệu. Hãy làm một bài luyện để xem thống kê." kèm nút "Bắt đầu luyện".
- AC-14.8: WHEN một lượt được nộp THE SYSTEM SHALL đưa lượt đó vào thống kê tổng hợp chậm nhất khi S20 của lượt hiển thị kết quả.

### REQ-15: Retry wrong answers — "Luyện lại câu sai" và luyện điểm yếu

<!-- Story: US-6 · Priority: P2 · Screens: S20, S19 -->

- AC-15.1: WHEN người học chọn "Luyện lại câu sai" trên S20 của một lượt THE SYSTEM SHALL tạo một lượt "Luyện theo dạng" không giới hạn thời gian, có "Kiểm tra" từng câu, tên "Luyện lại câu sai · <tên lượt gốc>", gồm mọi câu của lượt gốc có ít nhất một mục là lỗi (với câu nhóm chỉ giữ các câu hỏi con là lỗi, kèm đoạn đọc hoặc đoạn ghi âm), theo thứ tự của lượt gốc.
- AC-15.2: THE SYSTEM SHALL dùng cho lượt luyện lại phiên bản đang xuất bản của mỗi câu, bỏ qua câu không còn được xuất bản và hiển thị "<n> câu không còn trong kho nên đã được bỏ qua." khi có ít nhất 1 câu bị bỏ qua.
- AC-15.3: IF lượt không có mục nào là lỗi THEN THE SYSTEM SHALL không hiển thị nút "Luyện lại câu sai" và hiển thị "Bạn đã làm đúng tất cả các câu."
- AC-15.4: WHEN người học chọn "Luyện" ở một dòng "Điểm yếu" THE SYSTEM SHALL tạo một lượt "Luyện theo dạng" không giới hạn thời gian, có "Kiểm tra" từng câu, gồm tối đa 20 mục chấm lấy từ các câu đang xuất bản của cấp gắn điểm đó, ưu tiên câu người học từng làm sai (lần sai gần nhất trước), rồi câu chưa gặp, rồi các câu còn lại.
- AC-15.5: IF không còn câu nào để tạo lượt luyện lại hoặc lượt luyện điểm yếu THEN THE SYSTEM SHALL không tạo lượt và hiển thị "Không còn câu nào để luyện."

### REQ-16: Add wrong words to a personal deck — Thêm từ sai vào bộ từ cá nhân (012)

<!-- Story: US-7 · Priority: P2 · Screens: S20 · Bộ từ cá nhân thuộc 012 -->

- AC-16.1: WHERE một câu có mục là lỗi được kho gắn với từ vựng của kho THE SYSTEM SHALL hiển thị trong "Xem lại từng câu" của câu đó mục "Từ vựng trong câu" liệt kê từng từ (chữ Hán, pinyin có dấu thanh, nghĩa tiếng Việt) kèm nút "Thêm vào bộ từ".
- AC-16.2: WHEN người học chọn "Thêm vào bộ từ" ở một từ, hoặc "Thêm từ sai vào bộ từ" ở đầu "Xem lại từng câu" THE SYSTEM SHALL hiển thị hộp chọn gồm các bộ từ cá nhân của người học (012) và "Tạo bộ mới" với tên gợi ý "Từ sai · HSK <n>", và sau khi người học chọn bộ thì thêm từ đó, hoặc mọi từ gắn với các câu có lỗi của lượt, vào bộ đã chọn.
- AC-16.3: WHEN việc thêm từ hoàn tất THE SYSTEM SHALL hiển thị "Đã thêm <x> từ vào bộ <tên bộ>." và, khi có từ đã nằm sẵn trong bộ, thêm "<y> từ đã có trong bộ." mà không thêm trùng.
- AC-16.4: IF lượt không có câu có lỗi nào được gắn từ vựng THEN THE SYSTEM SHALL không hiển thị nút "Thêm từ sai vào bộ từ".
- AC-16.5: IF không thêm được từ vào bộ (mất kết nối hoặc bộ từ từ chối theo quy tắc của 012) THEN THE SYSTEM SHALL hiển thị "Không thêm được từ vào bộ từ. Vui lòng thử lại." kèm lý do của 012 khi có, và không báo là đã thêm.

### REQ-17: Privacy and access control — Riêng tư và phân quyền dữ liệu tự học

<!-- Story: US-8 · Priority: P1 · Screens: S19, S20, A05 -->

- AC-17.1: THE SYSTEM SHALL chỉ cho chính người học xem lượt, câu trả lời, kết quả, lịch sử và thống kê 015 của mình; không GV nào (kể cả GV chủ workspace của HV, trên mọi màn hình kể cả T23–T27) hay HV khác xem được.
- AC-17.2: IF người dùng mở, kể cả bằng đường dẫn trực tiếp, một lượt, S20 hoặc thống kê của người khác, hoặc một lượt hay đề không tồn tại THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." giống hệt nhau cho mọi trường hợp đó.
- AC-17.3: THE SYSTEM SHALL chỉ gửi nội dung câu hỏi tới thiết bị trong một lượt của chính người học, và không gửi đáp án đúng, giải thích hay lời thoại của câu nào trước khi lượt được nộp (hoặc, với lượt "Luyện theo dạng", trước khi người học chọn "Kiểm tra" câu đó).
- AC-17.4: THE SYSTEM SHALL giữ nguyên dữ liệu 015 và quyền dùng 015 của HV khi HV được thêm vào hoặc bị gỡ khỏi lớp, hoặc khi lớp kết thúc hay bị xóa (003).
- AC-17.5: WHEN tài khoản của người học bị xóa theo 001 THE SYSTEM SHALL xóa vĩnh viễn mọi lượt, lịch sử, thống kê và lựa chọn cấp gần nhất 015 của tài khoản đó trong vòng 24 giờ.
- AC-17.6: THE SYSTEM SHALL không gửi email hay thông báo nào cho bất kỳ ai về hoạt động 015 của người học.

## 6. Non-Functional Requirements

- NFR-1: Timing: đồng hồ đếm ngược của lượt có giới hạn thời gian lệch ≤ 2 giây so với đồng hồ hệ thống, kể cả khi đồng hồ thiết bị sai tới 24 giờ hoặc đặt múi giờ khác UTC+7, và trở lại độ lệch ≤ 2 giây trong ≤ 5 giây sau khi thiết bị thoát chế độ ngủ; việc chuyển phần theo AC-7.5 hiển thị trong ≤ 2 giây sau thời điểm kết thúc của phần khi lượt đang mở.
- NFR-2: Reliability: tự lưu hiển thị "Đã lưu" p95 ≤ 3 giây sau thay đổi cuối cùng trên mạng di động mô phỏng 4G (10 Mbps, độ trễ 100 ms) khi 500 lượt đang làm đồng thời trong toàn hệ thống; 0 câu trả lời đã hiển thị "Đã lưu" bị thiếu trong bài nộp và 0 lượt chưa nộp thứ hai cho cùng người học × đề, kiểm chứng bằng 1.000 lượt mô phỏng có ngắt kết nối, tải lại trang, đổi thiết bị và bấm "Bắt đầu làm bài" / "Nộp bài" đồng thời trên 2 thiết bị.
- NFR-3: Reliability: 100% lượt có giới hạn thời gian chưa nộp được nộp tự động trong ≤ 60 giây sau thời điểm kết thúc, kiểm chứng với 500 lượt kết thúc trong cùng 60 giây khi không thiết bị nào đang mở.
- NFR-4: Audio: trong Đề thi thử, đoạn ghi âm đầu tiên của phần Nghe bắt đầu phát ≤ 1 giây (p95) sau khi phần bắt đầu và mỗi khoảng nghỉ giữa các lần phát lệch ≤ 1 giây so với quy định của kho; khi mở lại lượt, vị trí phát tiếp lệch ≤ 2 giây so với vị trí theo đồng hồ hệ thống; tải trước âm thanh của một đề tối đa 40 MB hoàn tất ≤ 45 giây trên kết nối 10 Mbps; trong chế độ luyện, âm thanh bắt đầu phát ≤ 2 giây (p95) sau khi chạm "Phát" trên mạng 4G.
- NFR-5: Performance: p95 thời gian từ khi người học xác nhận nộp tới khi S20 hiển thị điểm ≤ 3 giây với đề 120 câu khi 200 lượt được nộp trong cùng 60 giây; "Xem lại từng câu" của đề 120 câu hiển thị đầy đủ ≤ 3 giây (p95); thống kê tổng hợp hiển thị ≤ 3 giây (p95) với 500 lượt trong lịch sử của người học.
- NFR-6: Performance: S19 hiển thị đầy đủ ≤ 2 giây (p95) trên mạng 4G ở màn hình 360 px; từ "Bắt đầu làm bài", "Bắt đầu luyện" hoặc "Tiếp tục" tới khi hiển thị câu đầu tiên ≤ 3 giây (p95, không tính tải trước âm thanh); chuyển giữa các câu ≤ 300 ms (p95).
- NFR-7: Offline tolerance: câu trả lời nhập trong lúc mất kết nối tới 10 phút (không tải lại trang) được giữ trên thiết bị và được hệ thống ghi nhận ≤ 5 giây (p95) sau khi có kết nối lại, 0 câu bị mất (với lượt có giới hạn thời gian: khi kết nối lại trong mốc 10 giây của AC-9.4); phần Nghe của Đề thi thử phát đủ 100% âm thanh khi mất kết nối sau lúc bắt đầu làm bài.
- NFR-8: Accessibility: S19, màn hình làm bài và S20 đạt WCAG 2.1 AA (tương phản ≥ 4,5:1 cho chữ thường, ≥ 3:1 cho thành phần đồ họa của biểu đồ); 100% thao tác (chọn đáp án, Nối cặp, Sắp xếp, trình phát âm thanh, chuyển câu, chuyển phần, nộp bài) dùng được bằng bàn phím và có nhãn đọc được bằng trình đọc màn hình; đồng hồ chỉ được trình đọc màn hình đọc tự động ở mốc 5 phút và 1 phút; 100% biểu đồ có dạng bảng tương đương.
- NFR-9: Usability: S19, màn hình làm bài và S20 dùng được ở chiều rộng 360–430 px (HV trên điện thoại) và ≥ 1280 px (HV trên màn hình rộng) không cuộn ngang; vùng chạm ≥ 44×44 px; đồng hồ luôn nhìn thấy khi cuộn câu hỏi; chữ Hán ≥ 18 px và pinyin có dấu thanh hiển thị đúng trên 2 phiên bản mới nhất của Chrome Android, Safari iOS, Chrome và Edge máy tính.
- NFR-10: Security: 0 trường hợp đáp án đúng, giải thích hay lời thoại tới thiết bị trước mốc của AC-17.3, kiểm chứng trên mọi dạng câu (gồm câu Nghe) và cả ba loại bài; 100% ca truy cập chéo (người học khác, GV kể cả GV của HV, người chưa đăng nhập) vào lượt, S20 và thống kê, và 100% lần tài khoản GV mở S19 / S20, bị từ chối bằng A05 hoặc A01 mà không lộ dữ liệu; 0 dữ liệu 015 xuất hiện trên màn hình GV, trong 008 hoặc 009.
- NFR-11: Correctness: chấm và tính điểm khớp 100% với kết quả mong đợi trên bộ ≥ 200 ca kiểm thử bao phủ mọi dạng câu theo quy tắc 005 và câu Nghe, cùng ≥ 30 ca biên về điểm phần, điểm tổng, làm tròn, điểm đạt (bằng đúng điểm đạt, thiếu 1 điểm), nộp không câu nào và nộp khi còn phần chưa bắt đầu.
- NFR-12: Observability: 100% thao tác bắt đầu lượt, tạm dừng, tiếp tục, bỏ lượt, chuyển phần, nộp bài, nộp tự động, tạo lượt luyện lại hoặc luyện điểm yếu, thêm từ vào bộ từ và truy cập bị từ chối được ghi nhật ký có cấu trúc (mã lượt, mã đề và phiên bản, loại bài, cấp, mã người dùng, thời điểm, kết quả hoặc lý do); 0 dòng nhật ký chứa nội dung câu hỏi, câu trả lời, đáp án, họ tên hay email; lưu ≥ 90 ngày.
- NFR-13: Abuse monitoring: khi một người dùng bắt đầu nhiều hơn 50 lượt mới trong 24 giờ liên tiếp (ngưỡng xem xét, không phải hạn mức), 100% trường hợp được ghi một dòng nhật ký cảnh báo có cấu trúc "Khối lượng lượt bất thường" (mã người dùng, số lượt mới trong 24 giờ, cấp, thời điểm) trong ≤ 5 phút sau lượt vượt ngưỡng, tối đa 1 dòng mỗi người dùng mỗi 24 giờ, để đội vận hành xem xét; 0 lượt bị chặn, làm chậm hay kèm thông báo cho người học vì ngưỡng này.

## 7. Key Entities

- **Nội dung kho (tham chiếu 016 — Kho nội dung tự học của workspace, GV quản lý; chỉ đọc với 015)** — câu hỏi đã
  xuất bản theo cấp (dạng câu theo 005 hoặc câu Nghe; điểm; đáp
  án; giải thích; nhãn kỹ năng, dạng câu, điểm ngữ pháp/từ vựng; từ vựng liên quan; đoạn ghi âm và lời thoại cho câu
  Nghe); **Bài kiểm tra cuối chương** (chương/chủ đề, thứ tự, các phần, thời gian tùy chọn, điểm đạt tùy chọn); **Đề thi
  thử** (các phần theo thứ tự, cách tính giờ "theo phần" hoặc "toàn bài", thời gian, thang điểm mỗi phần, điểm đạt tùy
  chọn, số lần phát và khoảng nghỉ của âm thanh). Mỗi đề và câu có **phiên bản** bất biến khi đã xuất bản.
- **Lượt** — một lần làm của một người học: loại bài ("Luyện theo dạng" / "Kiểm tra cuối chương" / "Đề thi thử"), cấp,
  đề và phiên bản (hoặc lựa chọn luyện: kỹ năng, dạng, số câu, nguồn "Luyện lại câu sai"/điểm yếu), danh sách câu và
  phiên bản câu, thứ tự xáo trộn, trạng thái (Đang làm / Đang tạm dừng / Đã nộp), thời điểm bắt đầu, thời điểm kết thúc
  của lượt và của từng phần (khi tính giờ), thời gian đã làm, thời điểm nộp, nhãn "Nộp tự động". Thuộc đúng một người học.
- **Câu trả lời** — câu trả lời của người học cho một mục chấm trong một lượt, thời điểm lưu gần nhất, đã "Kiểm tra"
  hay chưa.
- **Kết quả lượt** — kết quả từng mục chấm (Đúng / Đúng một phần / Sai / Chưa trả lời, điểm), điểm từng phần, điểm tổng,
  thang, nhãn "Đạt"/"Chưa đạt". Bất biến sau khi chấm (AC-13.3).
- **Thống kê lỗi** — số liệu suy ra (không nhập tay) từ kết quả các lượt đã nộp của một người học: theo kỹ năng, dạng
  câu, điểm ngữ pháp/từ vựng, điểm yếu, xu hướng.
- **Cấp gần nhất** — lựa chọn cấp HSK gần nhất của người học trên S19.
- Tham chiếu (không thuộc module này): tài khoản HV/GV, khóa/xóa (001); quy tắc dạng câu, chấm và trình bày đáp án
  (005); quy tắc đồng hồ, nộp tự động (006, chỉ dùng làm khuôn); bộ từ cá nhân và trang Tự học S13 (012); Kho nội dung tự
  học của mỗi workspace, bộ nội dung khởi tạo, phiên bản và các màn hình quản lý T23–T27 của GV (016).

## 8. Edge Cases & Error Handling

- Bấm "Bắt đầu làm bài" cùng lúc trên điện thoại và máy tính: một lượt duy nhất, nơi mở sau cùng có quyền làm bài
  (AC-4.8, AC-5.6).
- Hai đề khác nhau mở ở hai thẻ: được phép, mỗi đề một lượt riêng (AC-4.8).
- Thoát ở phút 12 của phần Nghe, mở lại sau 3 phút: âm thanh phát tiếp từ phút 15, không nghe lại đoạn đã lỡ; các câu
  có đoạn ghi âm đã bắt đầu vẫn trả lời được (AC-8.2, AC-8.3).
- Mở lại sau khi trình duyệt chặn tự phát âm thanh: nút "Chạm để tiếp tục nghe" (AC-8.4).
- Tai nghe Bluetooth ngắt giữa phần Nghe: âm thanh tiếp tục theo thiết bị phát mặc định; đồng hồ không dừng (AC-8.1).
- Đề tính giờ theo phần, người học vắng mặt khi phần Đọc hiểu hết giờ: mở lại vào thẳng phần Viết với thời gian còn
  lại theo đồng hồ hệ thống và thông báo chuyển phần (AC-7.5).
- Người học chọn "Sang phần tiếp theo" khi âm thanh Nghe còn phát: âm thanh dừng, không quay lại được, thời gian thừa
  không cộng sang phần sau (AC-7.4).
- Mở lại sau khi cả lượt đã hết giờ: "Hết giờ — bài đã được nộp tự động lúc HH:mm" + "Xem kết quả" (AC-9.5).
- Mất kết nối 20 giây trước hết giờ, có kết nối lại 5 giây sau thời điểm kết thúc: câu trả lời được tính; sau 15 giây:
  không được tính (AC-9.4).
- Đồng hồ thiết bị sai hoặc ở múi giờ khác: mọi tính giờ theo đồng hồ hệ thống (AC-7.1, NFR-1).
- Tài khoản bị khóa trong lúc làm Đề thi thử: lượt vẫn được nộp tự động khi hết giờ; lịch sử còn nguyên khi mở khóa
  (AC-9.4).
- Nộp khi còn phần chưa bắt đầu: các phần đó 0 điểm, hộp xác nhận báo trước (AC-9.1, AC-10.3).
- Nộp không trả lời câu nào: lượt luyện bị chặn; lượt có giới hạn thời gian được nộp với 0 điểm (AC-9.2, AC-9.3).
- Đã "Kiểm tra" một câu rồi tạm dừng: khi tiếp tục câu đó vẫn khóa kèm kết quả; khi nộp giữ nguyên kết quả (AC-6.3,
  AC-10.1).
- Chuyển ứng dụng khác trong lượt luyện: thời gian đã làm không chạy; trong Đề thi thử: đồng hồ vẫn chạy (AC-6.4, AC-7.1).
- Có lượt luyện chưa xong và chọn "Luyện lại câu sai": hỏi "Tiếp tục lượt cũ" hay "Bỏ lượt cũ, bắt đầu mới" (AC-3.5).
- Kho chỉ có 7 câu Nghe ở HSK 1 khi chọn 10 câu: lượt 7 câu, "Chỉ có 7 câu cho lựa chọn này." (AC-3.4).
- Đã lấy 8/10 mục và câu nhóm tiếp theo có 5 câu hỏi con: lượt có 13 mục chấm (AC-3.3).
- Cấp chưa có đề thi thử nào: thẻ "Chưa có nội dung cho HSK <n>." (AC-2.5).
- GV sửa đáp án trong kho sau khi người học nộp: không chấm lại; S20 có dòng "Đề này đã được cập nhật…" (AC-13.3,
  AC-13.4).
- GV đổi thời gian hoặc xuất bản phiên bản mới khi người học đang làm: lượt giữ phiên bản và thời gian cũ (AC-13.2).
- GV lưu trữ hoặc ẩn đề khi người học đang làm: đề biến mất khỏi danh sách nhưng lượt vẫn ở "Đang làm dở" và làm tiếp
  được (AC-13.5).
- Workspace mới, GV chưa chỉnh kho: người học thấy đúng bộ đề và câu hỏi HSK khởi tạo đã xuất bản (AC-1.2, AC-2.6).
- Đề GV khác thêm vào kho của workspace khác: không bao giờ xuất hiện cho người học của workspace này (AC-2.6).
- GV mở S19 hoặc đường dẫn một lượt (kể cả sau khi đăng nhập từ A01): A05, không lộ đề hay dữ liệu; GV xem trước đề chỉ
  bên trong T23–T27 (016) (AC-1.3, AC-1.4).
- Câu gốc đã bị gỡ khỏi kho khi "Luyện lại câu sai": câu bị bỏ qua kèm thông báo; nếu mọi câu bị bỏ qua: "Không còn
  câu nào để luyện." (AC-15.2, AC-15.5).
- Đạt đúng bằng điểm đạt (180/300): "Đạt"; 179/300: "Chưa đạt" (AC-10.4).
- Hai điểm yếu cùng tỷ lệ lỗi: điểm có nhiều lỗi hơn đứng trước (AC-14.4).
- Mới có 1 lượt ở một cấp: thống kê có số liệu nhưng xu hướng hiển thị "Cần ít nhất 2 lượt làm để xem xu hướng."
  (AC-14.6).
- Từ đã có trong bộ từ: không thêm trùng, báo "<y> từ đã có trong bộ." (AC-16.3).
- HV bị gỡ khỏi mọi lớp hoặc lớp kết thúc: vẫn dùng 015 như trước, dữ liệu giữ nguyên (AC-17.4).
- GV mở đường dẫn S20 của HV trong lớp mình: A05, giống hệt lượt không tồn tại (AC-17.2).
- Gõ pinyin bằng số thanh trong câu Điền chỗ trống: chấm theo 005 AC-7.2 (AC-5.1, AC-10.1).
- Mất kết nối khi đang nộp: giữ bài làm, "Thử lại"; nếu đã bị nộp tự động trong lúc đó thì hiển thị kết quả nộp tự
  động (AC-9.7).

## 9. Out of Scope

- Phần viết đoạn văn/viết câu tự do, phần nói (HSKK), chấm bằng AI hoặc chấm tay — giai đoạn 2 (V14 "MVP partially, AI
  later"; 007 hoãn).
- Giải thích đáp án bằng AI, gợi ý lộ trình học bằng AI, sinh câu hỏi hoặc đề bằng AI — giai đoạn 2.
- Bảng xếp hạng giữa người học, so sánh điểm với người khác, chia sẻ kết quả ra ngoài.
- GV giao đề thi thử hay bài kiểm tra cuối chương của kho cho lớp; GV xem kết quả tự học của HV (bài thi cho lớp dùng 006).
- Quy đổi sang điểm HSK chính thức, chứng chỉ, dự đoán đỗ/trượt kỳ thi thật.
- Người học tự soạn hoặc tải đề lên; đề tùy chỉnh trộn nhiều cấp; chọn độ khó.
- Làm bài hoàn toàn ngoại tuyến (tải đề về máy) — chỉ chịu được mất kết nối tạm thời (NFR-7).
- Tạm dừng Đề thi thử hay bài có giới hạn thời gian; thời gian chép đáp án sang phiếu giấy.
- Xóa từng lượt khỏi lịch sử; xuất kết quả ra PDF hoặc Excel.
- Email hoặc thông báo nhắc luyện tập; chuỗi ngày luyện, huy hiệu.
- Gói trả phí, giới hạn đề theo gói.
- Chữ phồn thể.
- GV dùng S19/S20 để tự luyện, thử đề hay xem trước đề (V15) — GV xem trước đề bên trong T23–T27 (016). Việc GV soạn,
  sửa, ẩn, xuất bản hay lưu trữ đề và câu hỏi trong Kho nội dung tự học thuộc 016, không thuộc 015.

**Removed (2026-10-22, V15)** — không mã AC nào bị bỏ (không có mã bỏ trống); các hành vi sau không còn:

- GV dùng S19/S20 với cùng quy tắc như HV cho bản thân (lượt, lịch sử, thống kê, cấp gần nhất của GV) — AC-1.2 viết lại
  chỉ cho HV; GV mở S19, S20 hoặc một lượt → A05 (AC-1.3, AC-1.4).
- Lối vào Tự học / S13 và bố cục máy tính dành cho GV; giữ hiển thị trên màn hình rộng cho HV (NFR-9).
- Vai trò "Quản trị nội dung" và việc chuyển vai trò này về Q01 (AC-1.4 cũ); loại trừ vai trò này trong AC-17.1, NFR-10.
- Kho hệ thống dùng chung cho mọi workspace — thay bằng Kho nội dung tự học của từng workspace do GV quản lý (AC-1.2,
  AC-2.6, AC-13.1 … AC-13.3, AC-13.5).

## 10. Assumptions & Dependencies

Quyết định của stakeholder được dùng: V14 (2026-10-22 — các module Tự học không phụ thuộc lớp; MVP một phần, AI sau; dữ
liệu riêng tư, GV không xem, không ảnh hưởng xếp hạng/dashboard; lối vào từ S13; phần "mọi tài khoản HV và GV" và "kho
hệ thống 016" [thay thế 2026-10-22 V15]), **V15** (2026-10-22 — chỉ hai vai trò GV và HV; Tự học chỉ dành cho HV, mọi HV
đã kích hoạt, không bị khóa của workspace, không phụ thuộc lớp; GV chỉ quản lý "Kho nội dung tự học" của workspace mình,
nạp sẵn bộ nội dung HSK khởi tạo, GV sửa / thêm / ẩn tùy ý — 016), D1 (workspace riêng của GV), D3-v2 (chỉ dạng câu tự
chấm trong MVP), D4 (không tự đăng ký), V11 (một lượt mỗi bộ bài tập trong lớp — **không** áp dụng cho 015), V12-4 (giao
diện "Mực & giấy").

Giả định được dùng: A4 (HV mobile-first 360–430 px, vẫn dùng được trên màn hình rộng ≥ 1280 px), A5 (giao diện tiếng
Việt, nội dung chữ Hán giản thể + pinyin có dấu thanh), A7 (giờ Việt Nam UTC+7). Các giả định riêng của module ở §12
Session 2026-10-22 (V14) và Session 2026-10-22 (V15 — Tự học chỉ cho HV).

Phụ thuộc module:

- **001** — đăng nhập, vai trò HV/GV, khóa/xóa tài khoản, A01, A05. **Cần 001 cập nhật:** quy tắc định tuyến theo vai
  trò: chỉ HV mở S19/S20 (AC-1.2); GV mở S19, S20 hoặc một lượt → A05 (AC-1.4); xóa dữ liệu tự học khi xóa tài khoản HV
  (AC-17.5).
- **005** — quy tắc trình bày, trả lời, chuẩn hóa, chấm và trình bày đáp án của 6 dạng câu tự chấm (REQ-4 đến REQ-11,
  AC-14.3, AC-16.3, AC-16.4); 015 tham chiếu, không sửa 005.
- **006** — khuôn hành vi đồng hồ, tự lưu, mất kết nối, đổi thiết bị, nộp tự động (REQ-9 đến REQ-12); 015 dùng lại
  hành vi, không dùng chung dữ liệu và không tính vào 008.
- **012** — trang "Tự học" S13 (**cần 012 bổ sung** ô "Thi thử HSK" mở S19, chỉ cho HV); bộ từ cá nhân (**cần 012 cung cấp**: liệt kê bộ từ của người học, tạo bộ mới, thêm một hoặc nhiều
  từ của kho vào bộ không trùng lặp, trả về số từ đã thêm/đã có và lý do từ chối, ví dụ giới hạn số từ của bộ — AC-16.2,
  AC-16.3, AC-16.5).
- **016** — "Kho nội dung tự học" của mỗi workspace, GV quản lý trên T23–T27, nạp sẵn bộ nội dung HSK khởi tạo; GV xem
  trước đề ở đó; T23–T27 không hiển thị dữ liệu 015 của HV (AC-10.5, AC-17.1). **Cần 016 cung cấp cho 015** (theo từng
  workspace): danh sách cấp; ngân hàng câu đã xuất bản theo cấp với nhãn
  kỹ năng ("Từ vựng", "Ngữ pháp", "Nghe", "Đọc hiểu", "Sắp xếp câu"), dạng câu, điểm ngữ pháp/từ vựng và từ vựng liên quan;
  dạng **câu Nghe** (đoạn ghi âm + 1–10 câu hỏi con trắc nghiệm, phương án chữ/hình/Đúng-Sai, lời thoại tùy chọn) dùng
  chung với 014; bài kiểm tra cuối chương (chương/chủ đề, thứ tự, thời gian tùy chọn, điểm đạt tùy chọn trên thang 100);
  đề thi thử (thứ tự phần, cách tính giờ theo phần/toàn bài, thời gian từng phần hoặc toàn bài, thang điểm mỗi phần, điểm
  đạt tùy chọn, số lần phát và khoảng nghỉ của âm thanh, thời gian phần Nghe ≥ tổng thời lượng phát); giải thích đáp án;
  **phiên bản bất biến** cho mỗi lần GV xuất bản đề và câu, biết phiên bản mới nhất của một đề; trạng thái ẩn / lưu trữ.
- **014** — không phụ thuộc trực tiếp; cùng Kho nội dung tự học của workspace; nên dùng chung định nghĩa câu Nghe của 016 để người học thấy cùng một cách trả lời.
- **008, 009, 003** — **không** nhận dữ liệu nào từ 015 (AC-10.5, AC-17.4).
- **006, 007, 010, 011** — không phụ thuộc trong MVP.

## 11. Open Questions

Không còn câu hỏi mở. Các câu đã đóng ngày 2026-10-22 (chi tiết ở §12 Session 2026-10-22 (chốt câu hỏi mở)):

- Q-1 (AC-6.3, AC-6.6) — đã đóng: "Luyện theo dạng" có nút "Kiểm tra" từng câu; "Kiểm tra cuối chương" và "Đề thi thử" chỉ hiển thị đáp án sau khi nộp.
- Q-2 (AC-12.1, NFR-13) — đã đóng: không đặt hạn mức số lượt mới trong MVP; lượng lượt bất thường được ghi nhật ký để xem xét, không chặn.

## 12. Clarifications Log

### Session 2026-10-22 (V14)

- Q: Yêu cầu gốc? → A: Nguyên văn: "giờ sẽ thêm các module feature global cho tất cả user để có thể dùng được và không phân biệt lớp: 6. Mô phỏng thi thử HSK — Trắc nghiệm từ vựng, ngữ pháp. Bài nghe và đọc hiểu. Sắp xếp từ thành câu. Bài kiểm tra cuối chương và đề thi thử. Chấm điểm tự động, giải thích đáp án và thống kê lỗi sai." (source: stakeholder)
- [thay thế 2026-10-22 V15: chỉ HV dùng; GV mở S19/S20 → A05] Q: Ai được dùng? → A: Mọi tài khoản HV và GV hiện có, không cần thuộc lớp; không có đăng ký công khai (AC-1.2) (source: stakeholder)
- [thay thế 2026-10-22 V15: nguồn là Kho nội dung tự học của workspace của HV, GV quản lý] Q: Nội dung lấy từ đâu? → A: Kho hệ thống (016): đề thi thử và bài kiểm tra cuối chương theo cấp với các phần từ vựng, ngữ pháp, nghe (có âm thanh), đọc hiểu, sắp xếp câu; thời gian làm bài; đáp án và giải thích; mỗi câu gắn kỹ năng và điểm ngữ pháp/từ vựng (§7, §10) (source: stakeholder)
- Q: Phạm vi MVP? → A: "MVP partially, AI later" — phần viết/nói cần AI hoặc chấm tay nằm ngoài MVP (§9) (source: stakeholder)
- Q: Ai thấy dữ liệu tự học, có ảnh hưởng lớp không? → A: Riêng tư từng người, GV không xem được, không ảnh hưởng xếp hạng, tiến độ hay dashboard của lớp (AC-10.5, REQ-17) (source: stakeholder)
- Q: Lối vào? → A: Từ trang Tự học S13 của 012 (AC-1.1) (source: stakeholder)
- Q: Ba loại bài khác nhau thế nào? → A: "Luyện theo dạng" chọn kỹ năng, dạng câu, 10/20/30 câu, không giới hạn thời gian; "Kiểm tra cuối chương" là bài cố định của kho theo chương, có thời gian khi kho đặt; "Đề thi thử" là đề đầy đủ, luôn có thời gian, phần theo thứ tự (REQ-3, REQ-4, REQ-6, REQ-7) (source: assumption — theo brief của orchestrator; kho 016 quyết định nội dung, 015 chỉ quyết định hành vi)
- Q: Tạm dừng được không? → A: Chỉ lượt không giới hạn thời gian ("Tạm dừng", giữ không thời hạn); lượt có giới hạn thời gian không tạm dừng, đồng hồ chạy cả khi thoát (AC-6.2, AC-6.6, AC-7.7) (source: assumption — brief "practice yes, mock test no"; mô phỏng sát thi thật)
- Q: Âm thanh nghe lại được không? → A: Đề thi thử: tự phát theo số lần và khoảng nghỉ của kho (mặc định 1 lần), không tạm dừng/tua/nghe lại, mở lại thì phát tiếp theo đồng hồ; Luyện theo dạng và Kiểm tra cuối chương: trình phát tự do, nghe lại không giới hạn, tốc độ 0,75×/1× (REQ-8) (source: assumption — Đề thi thử mô phỏng kỳ thi thật; chế độ luyện cần nghe lại để học)
- Q: Âm thanh có tải trước không? → A: Có, toàn bộ âm thanh của Đề thi thử tải trước trên màn hình bắt đầu; "Bắt đầu làm bài" chỉ bật khi tải xong (AC-4.5, AC-4.6) (source: assumption — tránh gián đoạn phần Nghe do mạng di động, NFR-7)
- [thay thế 2026-10-22] Q: Luyện có xem đáp án ngay không? → A: Có, nút "Kiểm tra" từng câu trong "Luyện theo dạng"; Kiểm tra cuối chương và Đề thi thử chỉ xem sau khi nộp (AC-6.3, AC-6.6) (source: assumption — chờ Q-1; phản hồi ngay giúp luyện tập) — Thay bằng Session 2026-10-22 (chốt câu hỏi mở), Q-1.
- Q: Tính giờ theo phần hay toàn bài? → A: Theo cấu hình của kho cho từng đề; theo phần thì không quay lại phần đã qua và thời gian thừa không cộng sang phần sau; toàn bài thì đi lại tự do trừ phần Nghe luôn ở đầu (AC-7.3–AC-7.6, AC-8.2) (source: assumption — giống cấu trúc kỳ thi HSK thật)
- [thay thế 2026-10-22 — một phần: hạn mức theo ngày đã chốt là không có, kèm NFR-13] Q: Số lượt? → A: Không giới hạn; tối đa một lượt chưa nộp mỗi đề và một lượt "Luyện theo dạng" chưa nộp mỗi cấp; lượt có giới hạn thời gian không bỏ được (AC-12.1, AC-3.5, AC-6.6) (source: assumption — brief "unlimited attempts"; tránh nhiều lượt dở dang; chờ Q-2 về hạn mức) — Thay bằng Session 2026-10-22 (chốt câu hỏi mở), Q-2.
- Q: Nộp khi chưa trả lời câu nào? → A: Lượt không giới hạn thời gian: chặn như 005 AC-15.2; lượt có giới hạn thời gian: được nộp (0 điểm) như 006 (AC-9.2, AC-9.3) (source: assumption — nhất quán với 005/006)
- Q: Cách tính điểm? → A: Luyện và kiểm tra cuối chương: thang 100 + "x/y câu đúng"; Đề thi thử: mỗi phần quy về thang của kho (mặc định 100), tổng = tổng các phần; "Đạt" khi tổng ≥ điểm đạt của kho, không có điểm sàn từng phần; luôn ghi "Kết quả mô phỏng — không phải điểm thi HSK chính thức." (REQ-10, AC-11.1) (source: assumption — giống cách báo điểm HSK; tránh hiểu nhầm là điểm chính thức)
- Q: Kho sửa hoặc lưu trữ đề người học đã làm? → A: Lượt giữ phiên bản lúc bắt đầu mãi mãi, không chấm lại; S20 báo đề đã cập nhật; đề lưu trữ biến mất khỏi danh sách nhưng lịch sử còn, lượt dở làm tiếp được (REQ-13) (source: assumption — brief "history keeps the version they took")
- Q: "Luyện lại câu sai" dùng phiên bản nào? → A: Phiên bản đang xuất bản của từng câu; câu đã gỡ bị bỏ qua (AC-15.2) (source: assumption — không luyện lại một đáp án kho đã sửa vì sai)
- Q: Thống kê lỗi định nghĩa thế nào? → A: Lỗi = Sai, Đúng một phần hoặc Chưa trả lời; nhóm theo kỹ năng, dạng câu, điểm ngữ pháp/từ vựng; điểm yếu = top 10, tối thiểu 3 mục; xu hướng = 10 lượt gần nhất, cần ≥ 2 lượt; mặc định 30 ngày gần nhất (REQ-14) (source: assumption — đủ dữ liệu để có ý nghĩa, gọn trên điện thoại)
- Q: Thêm từ sai vào đâu? → A: Vào một bộ từ cá nhân của 012 do người học chọn hoặc tạo mới (tên gợi ý "Từ sai · HSK n"), không trùng lặp (REQ-16) (source: assumption — 012 sở hữu bộ từ; cần 012 cung cấp thao tác thêm)
- Q: Người học có xóa lịch sử được không? → A: Không trong MVP; dữ liệu chỉ bị xóa khi tài khoản bị xóa, trong 24 giờ (AC-12.6, AC-17.5) (source: assumption — giữ thống kê nhất quán; thời hạn 24 giờ nhất quán với 011 AC-11.4)
- [thay thế 2026-10-22 V15: vai trò Quản trị nội dung không còn; AC-1.4 nay chặn GV bằng A05] Q: Quản trị nội dung có dùng S19/S20 không? → A: Không; xem trước nội dung ở màn hình của 016 (AC-1.4) (source: assumption — product.md: vai trò này không có dữ liệu người học)
- Q: Lượt luyện lấy câu nào? → A: Ngẫu nhiên, ưu tiên câu chưa gặp, rồi câu đã gặp lâu nhất (AC-3.2) (source: assumption — tăng độ phủ ngân hàng câu)

### Session 2026-10-22 (chốt câu hỏi mở)

- Q: Q-1 — Trong "Luyện theo dạng", người học xem đáp án và giải thích ngay sau từng câu bằng nút "Kiểm tra" hay chỉ sau khi nộp cả lượt? → A: Có nút "Kiểm tra" từng câu trong "Luyện theo dạng" (luyện không giới hạn thời gian là để học); "Kiểm tra cuối chương" (kể cả không giới hạn thời gian) và "Đề thi thử" chỉ hiển thị đáp án sau khi nộp (AC-6.3, AC-6.6, AC-17.3) (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối)
- Q: Q-2 — Có đặt hạn mức số lượt mới mỗi người mỗi ngày không? → A: Không trong MVP; mọi lượt được ghi nhật ký (NFR-12) và người dùng bắt đầu hơn 50 lượt mới trong 24 giờ được ghi cảnh báo "Khối lượng lượt bất thường" để xem xét, không chặn hay làm chậm (AC-12.1, NFR-13) (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối)
- Q: Cấp cao của HSK hiển thị thế nào trên S19? → A: Theo 016 (Q-1 của 016 đã chốt): "HSK 1" đến "HSK 6" và một cấp chung "HSK 7–9" (AC-2.1) (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối)
- Q: Kho sửa đáp án của đề đã có người làm thì kết quả cũ có được chấm lại? → A: Không (khớp 016 AC-11.5 đã chốt); lượt giữ phiên bản đã làm, S20 hiển thị dòng "Đề này đã được cập nhật sau lượt làm của bạn. Kết quả được giữ theo phiên bản bạn đã làm." (AC-13.3, AC-13.4 — không đổi) (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối)

### Session 2026-10-22 (V15 — Tự học chỉ cho HV)

- Q: Ai dùng Tự học và ai quản lý nội dung tự học? → A: Nguyên văn: "Hệ thống hiện tại chỉ có 2 role là GV và học viên, và phần quản lí các nội dung tự học sẽ làm chung phần quản lí của GV luôn, và GV chỉ quản lí thôi, chức năng tự học chỉ dành cho user học viên. Gom quản lí hệ thống vào cho GV." → Chỉ hai vai trò GV và HV; S19/S20 chỉ dành cho HV (mọi HV đã kích hoạt, không bị khóa của workspace, không phụ thuộc lớp); GV không dùng S19/S20, mở → A05; vai trò Quản trị nội dung bị bỏ (AC-1.2, AC-1.3, AC-1.4, AC-17.1, NFR-10, §1, §3, US-8, §8, §9 "Removed (2026-10-22, V15)", §10) (source: stakeholder — V15)
- Q: Đề và câu hỏi lấy từ kho nào khi không còn kho hệ thống? → A: Mỗi GV có "Kho nội dung tự học" riêng trong workspace, được nạp sẵn bộ nội dung HSK khởi tạo (câu hỏi, bài kiểm tra cuối chương, đề thi thử), GV sửa / thêm / ẩn tùy ý (016, T23–T27); người học chỉ thấy kho của workspace mình (AC-1.2, AC-2.6, §7, §10) (source: stakeholder — V15, câu trả lời cho câu hỏi tiếp theo)
- Q: 015 có còn khác 006 không khi GV quản lý cả hai? → A: Có. 006 là bài thi GV giao cho lớp, tính Điểm xếp hạng; 015 là HV tự luyện từ Kho nội dung tự học của workspace, không bao giờ vào xếp hạng, tiến độ hay dashboard của lớp (§3, AC-10.5) (source: assumption — V15 chỉ đổi người quản lý nội dung, không đổi ranh giới 015 / 006 của V14)
- Q: GV mở S19/S20 hay đường dẫn một lượt thì thấy gì, và xem trước đề ở đâu? → A: A05 "Không tìm thấy nội dung bạn yêu cầu.", giống lượt không tồn tại, kể cả sau khi đăng nhập từ A01; GV xem trước đề chỉ bên trong T23–T27 (016) (AC-1.3, AC-1.4, NFR-10, §9) (source: assumption — quy ước A05 của sản phẩm; V15 "GV chỉ quản lí thôi")
- Q: Phiên bản đề khi GV sửa / ẩn / lưu trữ? → A: Quy tắc phiên bản của V14 giữ nguyên, nay do GV kích hoạt: lượt giữ phiên bản lúc bắt đầu, không chấm lại, đề bị ẩn hoặc lưu trữ biến mất khỏi danh sách nhưng lượt dở làm tiếp được và lịch sử còn (AC-13.1, AC-13.2, AC-13.3, AC-13.5) (source: assumption — quy tắc giữ lịch sử không đổi theo V15; coi "ẩn" như "lưu trữ" đối với lượt mới)
- Q: Màn hình rộng còn được hỗ trợ không? → A: Có, cho HV dùng máy tính (≥ 1280 px); bỏ mọi bố cục dành riêng cho GV (NFR-9) (source: assumption — NFR-9 đã quy định ≥ 1280 px; HV vẫn có thể luyện trên máy tính)
- Q: Màn hình quản lý kho có hiện số liệu 015 của HV không? → A: Không; T23–T27 không hiển thị lượt, điểm hay thống kê 015 của HV (AC-10.5, AC-17.1) (source: assumption — quyền riêng tư của V14 không đổi theo V15)
