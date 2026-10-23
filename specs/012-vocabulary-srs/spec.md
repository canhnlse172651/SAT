---
id: 012
slug: vocabulary-srs
title: Smart vocabulary SRS
status: draft
branch: feat/012-vocabulary-srs
created: 2026-10-22
updated: 2026-10-22
approved_by:
approved_at:
---

# Smart vocabulary SRS (Từ vựng thông minh)

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

Đến nay mọi tính năng của SAT gắn với một lớp: HV chỉ học từ vựng qua các bộ flashcard GV đặt trong bài (004),
và không có cách tự ôn từ theo nhịp riêng, tra từ, nghe phát âm hay giữ danh sách từ của mình. Quyết định V14
(2026-10-22) thêm nhóm tính năng **Tự học** không cần lớp; quyết định **V15** (2026-10-22) chốt rằng hệ thống chỉ có
hai vai trò GV và HV, **Tự học chỉ dành cho HV** (mọi HV đã kích hoạt của workspace, không phân biệt lớp) còn **GV chỉ
quản lý nội dung** tự học trong "Kho nội dung tự học" của workspace mình (016, T23–T27: nạp sẵn bộ nội dung HSK mẫu,
GV sửa / thêm / ẩn tùy ý) và không dùng Tự học. Module này
định nghĩa **S13 "Tự học"** (trang chung dẫn tới Từ vựng 012, Luyện viết 013, Luyện nghe & nói 014, Thi thử HSK
015), **S14 "Từ vựng"** (duyệt kho từ HSK 1–9 trong Kho nội dung tự học của workspace của HV (016) theo cấp và chủ đề, tìm theo chữ
Hán / pinyin có hoặc không dấu thanh / nghĩa tiếng Việt, chi tiết từ với phát âm bản xứ, ví dụ và cách dùng, đánh
dấu từ khó, bộ từ cá nhân và từ tự thêm) và **S15 "Ôn tập"** (flashcard hai mặt, bốn mức đánh giá "Quên" / "Khó" /
"Nhớ" / "Dễ" với quy tắc lặp lại ngắt quãng (SRS) kiểu SM-2 kiểm chứng được, hạn mức từ mới và lượt ôn mỗi ngày theo
giờ Việt Nam, tổng kết phiên, chịu được mất mạng). Dữ liệu tự học là riêng tư của từng HV, không bao giờ hiển
thị cho GV và không ảnh hưởng xếp hạng (008), theo dõi (009) hay hồ sơ (011). Kết quả mong muốn: HV học và
nhớ lâu từ vựng HSK mỗi ngày với vài phút ôn tập, độc lập với lớp học.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Người dùng tự học đều đặn | Tỷ lệ HV đã kích hoạt có ≥ 1 phiên ôn tập (S15) mỗi tuần, đo sau 60 ngày phát hành | ≥ 30% |
| SRS giữ trí nhớ tốt | Tỷ lệ lượt đánh giá từ đến hạn (không phải từ mới) khác "Quên" | 80–90% |
| Ôn kịp lịch | Trung vị, trên các người dùng có ≥ 1 phiên trong ngày, của tỷ lệ "từ đến hạn trong hạn mức đã được ôn trong ngày" | ≥ 80% |
| Ôn tập trôi chảy | Thời gian từ khi chọn mức đánh giá tới khi thẻ kế tiếp hiện | p95 ≤ 150 ms (NFR-1) |
| Tra từ nhanh | Thời gian từ lần gõ phím cuối tới khi có kết quả tìm kiếm | p95 ≤ 1 giây (NFR-2) |
| Không lẫn với dữ liệu lớp | Số dữ liệu Tự học xuất hiện trên màn hình GV, xếp hạng, dashboard hoặc hồ sơ | 0 (AC-20.3, NFR-8) |

## 3. Actors & Context

- **Học viên (HV)** — tài khoản do GV tạo và kích hoạt (001); dùng điện thoại là chính (360–430 px). Mở "Tự học" từ
  thanh tab dưới để ôn từ mỗi ngày (thường 5–15 phút, nhiều khi trên xe buýt, mạng chập chờn), tra từ gặp trong bài,
  nghe phát âm, gom từ khó và tạo bộ từ riêng (ví dụ "Từ bài 3", "Từ đi chợ"). Dùng được cả khi chưa hoặc không còn
  thuộc lớp nào. Khi HV dùng trình duyệt rộng (máy tính), S13–S15 hiển thị bố cục rộng ("HV trên màn hình rộng", AC-1.5).
  Trong spec này **"người dùng" luôn là một HV**.
- **Giáo viên (GV)** — chủ workspace (D1), dùng máy tính (≥ 1280 px). **Không dùng Tự học** (V15): không có lối vào
  S13–S15, mở bằng đường dẫn trực tiếp thì thấy A05 (AC-1.4), không có dữ liệu tự học riêng. GV quản lý "Kho nội dung
  tự học" của workspace (016, T23–T27): sửa, thêm, ẩn / ngừng xuất bản và xem trước mục từ ngay trong T23–T27; mọi
  thay đổi được 012 phản ánh cho HV của workspace theo REQ-19. GV không bao giờ thấy dữ liệu tự học của từng HV.
- **"Kho" / "kho từ"** trong spec này = phần từ vựng của **Kho nội dung tự học thuộc workspace của GV đã tạo tài khoản
  HV** (016): khởi tạo từ bộ nội dung HSK mẫu, sau đó do GV sở hữu. Mỗi workspace một kho; HV chỉ thấy kho của
  workspace mình.
- **Hệ thống** — tính lịch ôn, đếm hạn mức theo ngày giờ Việt Nam (UTC+7), đồng bộ đánh giá giữa các thiết bị.
- **Hiện nay** HV chỉ có flashcard của bài trong lớp (S04, 004) với đánh dấu "Đã thuộc / Chưa thuộc" không có lịch ôn;
  ngoài lớp HV dùng ứng dụng khác (Anki, Pleco, SuperChinese…), không gắn với kho HSK và giao diện tiếng Việt của SAT.

## 4. User Stories

- US-1 (P1): Là HV, tôi muốn chọn một cấp HSK, học mỗi ngày một số từ mới và ôn lại đúng lúc sắp quên bằng
  flashcard hai mặt, để nhớ từ lâu mà không phải tự lên lịch.
  - Why this priority: là lõi của yêu cầu "Ôn tập theo phương pháp lặp lại ngắt quãng (SRS)" và lý do người dùng quay
    lại mỗi ngày; mọi phần khác dựa trên tiến độ ôn tập này.
  - Independent test: người dùng mới mở "Tự học" → S13 → "Từ vựng" → "HSK 1" → "Học HSK 1" → S15 hiện 10 từ mới; chọn
    "Nhớ" cho cả 10 → tổng kết "10 từ mới"; S13 hiện "Ôn hôm nay: 0 từ" và "Từ mới hôm nay: 10/10"; ngày hôm sau (giờ
    Việt Nam) S13 hiện "Ôn hôm nay: 10 từ", chọn "Ôn tập ngay" ôn 10 từ đó rồi 10 từ mới tiếp theo của HSK 1.
- US-2 (P1): Là HV, tôi muốn tìm một từ bằng chữ Hán, pinyin (có hoặc không dấu thanh) hoặc nghĩa tiếng Việt và
  xem chi tiết từ với phát âm bản xứ, ví dụ câu và cách dùng, để hiểu và dùng đúng từ.
  - Why this priority: stakeholder yêu cầu "Nghe phát âm từng từ. Ví dụ câu và cách dùng từ"; tra cứu là lối vào phổ
    biến nhất tới từ cần học.
  - Independent test: gõ "nihao" → thấy 你好 nǐ hǎo "xin chào" nhãn "HSK 1"; mở chi tiết → nghe phát âm, thấy 2 câu ví
    dụ có pinyin và nghĩa; gõ "xin chao" → cùng từ; gõ "你" → các từ chứa 你.
- US-3 (P1): Là người học, tôi muốn đánh dấu từ khó và ôn riêng nhóm từ khó, để tập trung vào những từ hay quên.
  - Why this priority: stakeholder yêu cầu "Đánh dấu từ khó"; chi phí thấp, giá trị cao.
  - Independent test: đánh dấu 3 từ khó (chi tiết từ, thẻ ôn tập, tổng kết phiên) → tab "Từ khó (3)" liệt kê 3 từ →
    "Ôn từ khó" chỉ phục vụ 3 từ đó; lịch ôn của chúng không đổi vì việc đánh dấu.
- US-4 (P1): Là người học, tôi muốn tạo bộ từ của riêng mình, đổi tên, xóa, thêm / bớt từ và học theo bộ, để ôn đúng
  nhóm từ tôi cần (theo bài, theo chủ đề tôi tự chọn).
  - Why this priority: stakeholder yêu cầu "tự tạo bộ từ vựng cá nhân".
  - Independent test: tạo bộ "Từ bài 3" → thêm 5 từ từ chi tiết từ và 7 từ bằng "Chọn nhiều" (2 đã có) → "Đã thêm 5 từ
    vào "Từ bài 3" (2 từ đã có sẵn)."; bộ có 10 từ → "Học" → S15 chỉ phục vụ từ của bộ; xóa bộ → tiến độ của 10 từ vẫn
    còn.
- US-5 (P2): Là người học, tôi muốn tự thêm một từ không có trong kho (chữ Hán, pinyin, nghĩa, ví dụ) vào bộ từ của mình,
  để ôn cả những từ gặp ngoài giáo trình HSK.
  - Why this priority: mở rộng "bộ từ vựng cá nhân"; bộ HSK mẫu nạp sẵn trong kho của workspace (016) đã phủ ~11.000
    từ HSK nên phần lớn nhu cầu được đáp ứng không cần tính năng này.
  - Independent test: trong bộ "Từ đi chợ" chọn "Thêm từ của tôi" → nhập 砍价 / kǎn jià / mặc cả → "Lưu" → từ có nhãn
    "Từ của tôi", không có nút phát âm, được ôn như từ khác; HV khác tìm "kanjia" không thấy từ này.
- US-6 (P2): Là người học, tôi muốn chỉnh số từ mới / lượt ôn mỗi ngày, mặt trước của thẻ, tự phát âm, hoàn tác một đánh
  giá bấm nhầm và đặt lại tiến độ một từ, để việc ôn hợp với thời gian và cách học của tôi.
  - Why this priority: mặc định hợp lý đủ cho MVP; tùy chỉnh tăng độ hài lòng của người học lâu dài.
  - Independent test: đặt "Từ mới mỗi ngày" = 5 và "Mặt trước thẻ" = "Nghĩa tiếng Việt" → phiên kế tiếp tối đa 5 từ mới,
    mặt trước hiện nghĩa; bấm nhầm "Quên" → "Hoàn tác" → thẻ hiện lại, lịch ôn như trước khi bấm.
- US-7 (P1): Là HV ôn trên điện thoại khi mạng chập chờn, tôi muốn tiếp tục ôn khi mất mạng và không mất kết quả, để
  không phải ôn lại.
  - Why this priority: HV ôn ở nơi công cộng; mất kết quả ôn làm hỏng lịch SRS và niềm tin vào tính năng.
  - Independent test: tải phiên 30 thẻ → tắt mạng sau thẻ 5 → ôn tiếp 20 thẻ, thấy "Đang ngoại tuyến — kết quả sẽ được
    lưu khi có mạng." → bật mạng → trong 30 giây 25 đánh giá được lưu đúng một lần; HV mở trên máy tính (màn hình rộng)
    thấy cùng lịch ôn.
- US-8 (P1): Là HV, tôi muốn dữ liệu tự học là của riêng tôi, không bị GV hay bạn khác xem, không ảnh hưởng điểm lớp, và
  không bị mất khi kho từ thay đổi, để tự học thoải mái và an toàn.
  - Why this priority: điều kiện của V14 ("không phân biệt lớp", không tính vào xếp hạng) và V15 (GV chỉ quản lý nội
    dung); dữ liệu học không được mất.
  - Independent test: HV ôn 50 từ → GV mở T04, T15, T01 và T23–T27 không thấy dữ liệu tự học nào của HV; GV mở S13 bằng
    đường dẫn trực tiếp → A05; Điểm xếp hạng không đổi; GV ngừng xuất bản (ẩn) 1 từ HV đang học trong Kho nội dung tự
    học → từ vẫn trong bộ của HV với nhãn "Không còn trong kho" và vẫn đến hạn ôn.

## 5. Functional Requirements

### REQ-1: Access and entry to self-study — Quyền truy cập và lối vào Tự học

<!-- Story: US-1, US-8 · Priority: P1 · Screens: S13, S14, S15, A01, A05 · Nav item owned by 001 -->

- AC-1.1: WHEN HV đã đăng nhập chọn mục "Tự học" trên thanh tab dưới (theo 001) THE SYSTEM SHALL mở S13 "Tự học".
- AC-1.2: THE SYSTEM SHALL cho mọi tài khoản HV đã kích hoạt và không bị khóa dùng S13, S14 và S15 với cùng chức năng, trên nội dung của Kho nội dung tự học thuộc workspace của GV đã tạo tài khoản HV đó (016), không đòi hỏi thuộc lớp nào và không phụ thuộc lớp, giáo trình hay trạng thái lớp.
- AC-1.3: IF người chưa đăng nhập mở S13, S14 hoặc S15 (kể cả qua đường dẫn trực tiếp) THEN THE SYSTEM SHALL chuyển đến A01 và, sau khi đăng nhập thành công bằng tài khoản HV, mở lại đúng màn hình đã yêu cầu.
- AC-1.4: IF tài khoản GV mở S13, S14 hoặc S15 (kể cả qua đường dẫn trực tiếp hoặc sau khi đăng nhập theo AC-1.3) THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." và không hiển thị nội dung, số liệu hay dữ liệu Tự học nào.
- AC-1.5: THE SYSTEM SHALL hiển thị S13, S14 và S15 theo bố cục điện thoại ở chiều rộng 360–1023 px và, cho HV trên màn hình rộng, theo bố cục rộng (không có thanh bên của GV) ở chiều rộng từ 1024 px.

### REQ-2: Self-study hub — Trang Tự học (S13)

<!-- Story: US-1 · Priority: P1 · Screens: S13, S14, S15, S16, S17, S19 -->

- AC-2.1: WHEN người dùng mở S13 THE SYSTEM SHALL hiển thị tiêu đề "Tự học", dòng "Học theo nhịp của bạn — không tính vào điểm lớp." và bốn thẻ theo thứ tự "Từ vựng", "Luyện viết", "Luyện nghe & nói", "Thi thử HSK", mỗi thẻ có tên và một dòng mô tả ngắn.
- AC-2.2: THE SYSTEM SHALL hiển thị trên thẻ "Từ vựng" dòng "Ôn hôm nay: {n} từ" (n theo AC-14.4), dòng "Từ mới hôm nay: {x}/{y}" (x = số từ mới đã học hôm nay, y = hạn mức từ mới của hôm nay theo AC-14.5), dòng "Từ mới từ: {tên nguồn}" khi người dùng đã có "Nguồn từ mới" (AC-11.3) và nút "Ôn tập ngay".
- AC-2.3: WHEN người dùng chọn thẻ "Từ vựng" ở vị trí khác nút "Ôn tập ngay" THE SYSTEM SHALL mở S14.
- AC-2.4: WHEN người dùng chọn thẻ "Luyện viết", "Luyện nghe & nói" hoặc "Thi thử HSK" THE SYSTEM SHALL mở lần lượt S16, S17 hoặc S19.
- AC-2.5: WHEN người dùng chọn "Ôn tập ngay" THE SYSTEM SHALL bắt đầu phiên "Ôn hôm nay" trên S15 theo AC-11.1.
- AC-2.6: IF phiên "Ôn hôm nay" không có từ nào để phục vụ (n = 0 và không có từ mới nào theo AC-11.1) trong khi người dùng đã có "Nguồn từ mới" THEN THE SYSTEM SHALL thay nút "Ôn tập ngay" bằng dòng "Bạn đã ôn xong hôm nay." kèm "Ngày mai: {k} từ đến hạn" (k = số từ có ngày đến hạn là ngày mai hoặc sớm hơn mà chưa được ôn).
- AC-2.7: IF người dùng chưa có "Nguồn từ mới" và n = 0 THEN THE SYSTEM SHALL thay nút "Ôn tập ngay" bằng dòng "Chọn cấp HSK, chủ đề hoặc bộ từ để bắt đầu học từ mới." kèm nút "Chọn từ để học" mở S14.
- AC-2.8: IF không tải được số liệu của thẻ "Từ vựng" THEN THE SYSTEM SHALL hiển thị trên thẻ đó "Không tải được số liệu ôn tập." kèm nút "Thử lại", không hiển thị số 0 thay thế, và vẫn cho mở cả bốn thẻ.
- AC-2.9: THE SYSTEM SHALL không hiển thị trên S13 chuỗi ngày học, mục tiêu ngày, điểm, huy hiệu hay xếp hạng.

### REQ-3: Browse the library by HSK level and topic — Duyệt kho từ theo cấp HSK và chủ đề (S14)

<!-- Story: US-1 · Priority: P1 · Screens: S14 · Content: 016 -->

- AC-3.1: WHEN người dùng mở S14 THE SYSTEM SHALL hiển thị tiêu đề "Từ vựng", ô tìm kiếm có gợi ý "Tìm chữ Hán, pinyin hoặc nghĩa", nút "Cài đặt ôn tập", ba tab "Kho từ", "Bộ từ của tôi", "Từ khó ({n})" và mở sẵn tab "Kho từ".
- AC-3.2: THE SYSTEM SHALL liệt kê trong tab "Kho từ" mỗi cấp HSK có ít nhất một từ đang xuất bản trong Kho nội dung tự học của workspace của HV (016), theo thứ tự cấp tăng dần, mỗi cấp dạng "HSK {c}" kèm "{y} từ · Đã học {x}/{y}", với y là số từ đang xuất bản của cấp và x là số từ trong đó người dùng có nhãn khác "Chưa học".
- AC-3.3: WHEN người dùng chọn một cấp HSK THE SYSTEM SHALL hiển thị danh sách từ đang xuất bản của cấp theo thứ tự của kho, mỗi dòng gồm chữ Hán, pinyin có dấu thanh, nghĩa tiếng Việt đầu tiên, nhãn trạng thái học và dấu sao khi từ được đánh dấu khó, cùng bộ lọc "Chủ đề" (mặc định "Tất cả chủ đề"), nút "Chọn nhiều" và nút "Học HSK {c}".
- AC-3.4: WHEN người dùng chọn một chủ đề trong bộ lọc "Chủ đề" THE SYSTEM SHALL chỉ hiển thị các từ của cấp đang chọn mang thẻ chủ đề đó, hiển thị "{y'} từ · Đã học {x'}/{y'}" của bộ lọc và đổi nút học thành "Học HSK {c} · {chủ đề}".
- AC-3.5: THE SYSTEM SHALL gán cho mỗi từ nhãn trạng thái học riêng của người dùng: "Chưa học" khi từ chưa có tiến độ ôn tập, "Đang học" khi khoảng ôn hiện tại dưới 21 ngày, "Đã thuộc" khi khoảng ôn hiện tại từ 21 ngày trở lên.
- AC-3.6: THE SYSTEM SHALL hiển thị danh sách từ theo từng phần 50 từ và tự tải 50 từ tiếp theo khi người dùng cuộn tới cuối phần đang hiển thị.
- AC-3.7: IF cấp và chủ đề đang chọn không có từ nào đang xuất bản THEN THE SYSTEM SHALL hiển thị "Chưa có từ nào cho bộ lọc này." và vô hiệu nút học.
- AC-3.8: IF không tải được danh sách cấp hoặc danh sách từ THEN THE SYSTEM SHALL hiển thị "Không tải được danh sách từ. Vui lòng thử lại." kèm nút "Thử lại".

### REQ-4: Vocabulary search — Tìm kiếm từ vựng

<!-- Story: US-2 · Priority: P1 · Screens: S14 -->

- AC-4.1: WHEN người dùng nhập vào ô tìm kiếm của S14 một chuỗi có 1–50 ký tự sau khi bỏ khoảng trắng đầu và cuối THE SYSTEM SHALL hiển thị kết quả tìm trong toàn bộ từ đang xuất bản của kho và các từ tự thêm của chính người dùng, không phụ thuộc tab, cấp hay chủ đề đang chọn, mỗi kết quả hiển thị như một dòng của AC-3.3 kèm nhãn "HSK {c}" hoặc "Từ của tôi".
- AC-4.2: WHEN chuỗi tìm kiếm chứa ít nhất một chữ Hán THE SYSTEM SHALL trả về các từ có chữ Hán chứa nguyên chuỗi đó (ví dụ "你" trả về 你, 你好, 你们).
- AC-4.3: WHEN chuỗi tìm kiếm chỉ gồm chữ cái Latin, chữ có dấu thanh pinyin, ü/v, số 1–5, khoảng trắng hoặc dấu ' THE SYSTEM SHALL trả về các từ có pinyin bắt đầu bằng chuỗi đó, không phân biệt hoa thường, bỏ qua khoảng trắng và dấu ', trong đó âm tiết không có dấu thanh hay số thanh khớp mọi thanh điệu ("ma" khớp mā, má, mǎ, mà, ma; "nihao" và "ni hao" khớp nǐ hǎo) còn âm tiết có dấu thanh hoặc số thanh chỉ khớp đúng thanh đó ("mā" và "ma1" chỉ khớp mā; "ni3hao3" khớp nǐ hǎo).
- AC-4.4: WHEN chuỗi tìm kiếm không chứa chữ Hán THE SYSTEM SHALL đồng thời trả về các từ có một nghĩa tiếng Việt chứa chuỗi đó như một hoặc nhiều từ trọn vẹn liên tiếp, không phân biệt hoa thường, trong đó chuỗi viết không dấu khớp cả nghĩa có dấu ("xin chao" khớp "xin chào") còn chuỗi có dấu tiếng Việt chỉ khớp đúng dấu ("chào" không khớp "chảo").
- AC-4.5: THE SYSTEM SHALL sắp xếp kết quả theo ba nhóm — (1) chữ Hán hoặc pinyin khớp toàn bộ, (2) chữ Hán chứa chuỗi hoặc pinyin bắt đầu bằng chuỗi, (3) khớp nghĩa — mỗi từ chỉ xuất hiện một lần ở nhóm cao nhất, trong mỗi nhóm theo cấp HSK tăng dần (từ tự thêm sau cùng) rồi theo pinyin bỏ dấu theo thứ tự chữ cái.
- AC-4.6: IF tìm kiếm không có kết quả THEN THE SYSTEM SHALL hiển thị "Không tìm thấy từ phù hợp với "{chuỗi}". Thử tìm bằng chữ Hán, pinyin hoặc nghĩa tiếng Việt." kèm nút "Thêm từ của tôi" (REQ-10).
- AC-4.7: WHEN người dùng xóa hết nội dung ô tìm kiếm THE SYSTEM SHALL trở về đúng tab, cấp, chủ đề và vị trí cuộn đang có trước khi tìm.

### REQ-5: Word detail — Chi tiết từ

<!-- Story: US-2 · Priority: P1 · Screens: S14 (khung hoặc màn hình chi tiết từ), A05 -->

- AC-5.1: WHEN người dùng chọn một từ trong danh sách cấp, kết quả tìm kiếm, một bộ từ hoặc tab "Từ khó" THE SYSTEM SHALL mở chi tiết từ gồm chữ Hán cỡ tối thiểu 48 px, pinyin có dấu thanh, nút phát âm, từ loại, mọi nghĩa tiếng Việt theo thứ tự của kho, nhãn "HSK {c}" (hoặc "Từ của tôi"), các thẻ chủ đề, nhãn trạng thái học, nút "Đánh dấu từ khó" (hoặc "Bỏ đánh dấu từ khó") và nút "Thêm vào bộ từ".
- AC-5.2: THE SYSTEM SHALL hiển thị trong chi tiết từ mục "Ví dụ" gồm mọi câu ví dụ của từ theo thứ tự của kho, mỗi câu có chữ Hán với từ đang xem được làm nổi bật, pinyin và nghĩa tiếng Việt, kèm nút phát âm câu khi câu có âm thanh.
- AC-5.3: WHERE từ có nội dung "Cách dùng" trong kho THE SYSTEM SHALL hiển thị mục "Cách dùng" với nội dung đó trong chi tiết từ, và không hiển thị mục này khi từ không có nội dung "Cách dùng".
- AC-5.4: WHILE từ đã có tiến độ ôn tập của người dùng THE SYSTEM SHALL hiển thị trong chi tiết từ khối "Tiến độ ôn tập" gồm "Lần ôn tới: {dd/mm/yyyy}" (hoặc "Hôm nay" khi từ đến hạn), "Khoảng ôn: {I} ngày", "Số lần quên: {L}" và nút "Đặt lại tiến độ" (REQ-17).
- AC-5.5: WHILE chiều rộng màn hình từ 1024 px THE SYSTEM SHALL hiển thị chi tiết từ ở khung bên phải cạnh danh sách; ở chiều rộng nhỏ hơn chi tiết từ mở thành màn hình riêng có nút "Quay lại" đưa về danh sách với bộ lọc và vị trí cuộn được giữ nguyên.
- AC-5.6: IF người dùng mở (kể cả qua đường dẫn trực tiếp) chi tiết của một từ không tồn tại, chưa từng được xuất bản, đã ngừng xuất bản mà người dùng không có trong bộ từ, tab "Từ khó" hay tiến độ ôn tập, thuộc Kho nội dung tự học của workspace khác, hoặc từ tự thêm của người khác THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." giống hệt nhau cho mọi trường hợp đó.

### REQ-6: Pronunciation audio — Phát âm bản xứ

<!-- Story: US-2 · Priority: P1 · Screens: S14, S15 -->

- AC-6.1: WHEN người dùng chọn nút phát âm của một từ hoặc một câu ví dụ THE SYSTEM SHALL phát âm thanh bản xứ tương ứng của kho một lần từ đầu và dừng mọi âm thanh khác đang phát.
- AC-6.2: WHEN người dùng chọn lại nút phát âm trong khi chính âm thanh đó đang phát THE SYSTEM SHALL phát lại từ đầu.
- AC-6.3: IF một từ hoặc câu ví dụ không có âm thanh trong kho (kể cả mọi từ tự thêm) THEN THE SYSTEM SHALL không hiển thị nút phát âm cho mục đó.
- AC-6.4: IF không phát được âm thanh THEN THE SYSTEM SHALL hiển thị "Không phát được âm thanh. Vui lòng thử lại." và không chặn thao tác nào khác.

### REQ-7: Difficult-word marks — Đánh dấu từ khó

<!-- Story: US-3 · Priority: P1 · Screens: S14, S15 -->

- AC-7.1: WHEN người dùng chọn "Đánh dấu từ khó" (hoặc dấu sao) trong chi tiết từ, trên thẻ ôn tập hoặc trong danh sách tổng kết phiên THE SYSTEM SHALL đánh dấu từ đó là từ khó cho riêng người dùng, hiển thị dấu sao ở mọi nơi từ xuất hiện, đổi nút thành "Bỏ đánh dấu từ khó" và tăng n của tab "Từ khó ({n})" thêm 1.
- AC-7.2: WHEN người dùng chọn "Bỏ đánh dấu từ khó" (hoặc chọn lại dấu sao đang bật) THE SYSTEM SHALL bỏ dấu từ khó, bỏ từ khỏi tab "Từ khó" và giảm n đi 1.
- AC-7.3: WHEN người dùng mở tab "Từ khó" THE SYSTEM SHALL liệt kê mọi từ người dùng đã đánh dấu khó, đánh dấu gần nhất trước, mỗi dòng như AC-3.3, kèm nút "Ôn từ khó" bắt đầu phiên với nguồn "Từ khó" theo AC-11.2.
- AC-7.4: IF người dùng chưa đánh dấu từ khó nào THEN THE SYSTEM SHALL hiển thị trong tab "Từ khó" dòng "Bạn chưa đánh dấu từ khó nào. Chạm ☆ trên một từ để thêm vào đây." và không hiển thị nút "Ôn từ khó".
- AC-7.5: THE SYSTEM SHALL không thay đổi khoảng ôn, hệ số dễ, số lần nhớ liên tiếp hay ngày đến hạn của một từ khi từ được đánh dấu hoặc bỏ đánh dấu khó; dấu từ khó chỉ ảnh hưởng thứ tự phục vụ (AC-14.3), chế độ "Luyện thêm" (AC-11.8) và nguồn "Từ khó".
- AC-7.6: THE SYSTEM SHALL chỉ đánh dấu hoặc bỏ đánh dấu từ khó khi chính người dùng thao tác, không bao giờ tự động.

### REQ-8: Personal decks — Bộ từ của tôi

<!-- Story: US-4 · Priority: P1 · Screens: S14 -->

- AC-8.1: WHEN người dùng mở tab "Bộ từ của tôi" THE SYSTEM SHALL liệt kê các bộ từ của chính người dùng, bộ tạo gần nhất trước, mỗi bộ gồm tên, "{m} từ", "Đến hạn: {d}" (số từ của bộ đang đến hạn) và nút "Học", cùng nút "Tạo bộ từ".
- AC-8.2: WHEN người dùng chọn "Tạo bộ từ", nhập "Tên bộ từ" hợp lệ và chọn "Tạo" THE SYSTEM SHALL tạo bộ từ rỗng, hiển thị bộ ở đầu danh sách và hiển thị "Đã tạo bộ từ "{tên}"."
- AC-8.3: IF "Tên bộ từ" sau khi bỏ khoảng trắng đầu và cuối rỗng hoặc dài hơn 60 ký tự THEN THE SYSTEM SHALL không lưu và hiển thị dưới trường "Tên bộ từ cần từ 1 đến 60 ký tự."
- AC-8.4: IF "Tên bộ từ" sau khi bỏ khoảng trắng đầu và cuối trùng, không phân biệt hoa thường, với tên một bộ khác của chính người dùng THEN THE SYSTEM SHALL không lưu và hiển thị dưới trường "Bạn đã có bộ từ tên này."
- AC-8.5: IF người dùng đã có 50 bộ từ THEN THE SYSTEM SHALL không tạo bộ mới và hiển thị "Bạn đã có tối đa 50 bộ từ. Hãy xóa bớt bộ không dùng."
- AC-8.6: WHEN người dùng chọn "Đổi tên" trên một bộ, nhập tên hợp lệ theo AC-8.3 và AC-8.4 và chọn "Lưu" THE SYSTEM SHALL đổi tên bộ ở mọi nơi tên bộ xuất hiện (kể cả "Từ mới từ: {tên nguồn}" trên S13) và hiển thị "Đã đổi tên bộ từ."
- AC-8.7: WHEN người dùng chọn "Xóa bộ" và xác nhận "Xóa bộ "{tên}"? Các từ vẫn giữ tiến độ ôn tập và dấu từ khó." THE SYSTEM SHALL xóa bộ khỏi danh sách, hiển thị "Đã xóa bộ từ." và giữ nguyên tiến độ ôn tập, dấu từ khó của mọi từ trong bộ cùng mọi từ tự thêm.
- AC-8.8: IF bộ từ người dùng đang thao tác đã bị xóa trên thiết bị khác THEN THE SYSTEM SHALL không thực hiện thao tác, hiển thị "Bộ từ này không còn tồn tại." và làm mới danh sách bộ từ.

### REQ-9: Deck contents — Thêm và bớt từ trong bộ

<!-- Story: US-4 · Priority: P1 · Screens: S14 -->

- AC-9.1: WHEN người dùng chọn "Thêm vào bộ từ" trong chi tiết từ THE SYSTEM SHALL hiển thị bảng chọn liệt kê mọi bộ từ của người dùng với ô chọn đã tích sẵn ở các bộ đang chứa từ cùng mục "Tạo bộ từ mới", và lưu ngay mỗi lần tích hoặc bỏ tích kèm thông báo "Đã thêm vào "{tên}"." hoặc "Đã bỏ khỏi "{tên}"."
- AC-9.2: WHEN người dùng dùng "Chọn nhiều" trong danh sách từ hoặc kết quả tìm kiếm, chọn một hoặc nhiều từ, chọn "Thêm vào bộ từ" rồi chọn một bộ THE SYSTEM SHALL thêm vào bộ các từ chưa có trong bộ, bỏ qua các từ đã có và hiển thị "Đã thêm {a} từ vào "{tên}"." kèm " ({b} từ đã có sẵn)" khi b > 0.
- AC-9.3: WHEN người dùng mở một bộ từ THE SYSTEM SHALL hiển thị tên bộ, "{m} từ", "Đến hạn: {d}", các nút "Học", "Đổi tên", "Xóa bộ", "Thêm từ của tôi" và danh sách từ của bộ theo thứ tự thêm vào (thêm sớm nhất trước), mỗi dòng như AC-3.3 kèm nút "Bỏ khỏi bộ".
- AC-9.4: WHEN người dùng chọn "Bỏ khỏi bộ" trên một từ THE SYSTEM SHALL bỏ từ khỏi bộ ngay, hiển thị "Đã bỏ khỏi bộ." kèm nút "Hoàn tác" trong 5 giây (khôi phục đúng vị trí cũ), và giữ nguyên tiến độ ôn tập cùng dấu từ khó của từ.
- AC-9.5: IF việc thêm làm bộ vượt 1.000 từ THEN THE SYSTEM SHALL chỉ thêm đến khi bộ đủ 1.000 từ (theo thứ tự đã chọn) và hiển thị "Bộ "{tên}" đã đủ 1.000 từ. {c} từ chưa được thêm."
- AC-9.6: WHILE một bộ từ chưa có từ nào THE SYSTEM SHALL hiển thị trong bộ "Bộ từ chưa có từ nào. Tìm hoặc duyệt kho từ để thêm." và vô hiệu nút "Học".

### REQ-10: Custom words — Từ tự thêm

<!-- Story: US-5 · Priority: P2 · Screens: S14 -->

Quy tắc trường của biểu mẫu "Từ của tôi" (giá trị được bỏ khoảng trắng đầu và cuối trước khi kiểm tra):

| Trường | Bắt buộc | Quy tắc | Thông báo khi sai |
|--------|----------|---------|-------------------|
| Chữ Hán | Có | 1–20 ký tự, chỉ chữ Hán (không chữ Latin, số, ký hiệu, khoảng trắng) | "Chữ Hán cần 1–20 chữ Hán, không có chữ cái, số hay ký hiệu." |
| Pinyin | Có | 1–100 ký tự, chỉ chữ cái Latin, chữ có dấu thanh pinyin, ü, số 1–5, khoảng trắng, dấu ' | "Pinyin chỉ gồm chữ cái, dấu thanh, số thanh 1–5, khoảng trắng hoặc dấu ' (tối đa 100 ký tự)." |
| Nghĩa tiếng Việt | Có | 1–200 ký tự | "Nghĩa tiếng Việt cần từ 1 đến 200 ký tự." |
| Từ loại | Không | Một giá trị trong danh sách từ loại của kho (016) | — (chọn từ danh sách) |
| Câu ví dụ | Không | ≤ 100 ký tự, phải có chữ Hán; bắt buộc khi "Pinyin câu ví dụ" hoặc "Nghĩa câu ví dụ" có nội dung | "Câu ví dụ tối đa 100 ký tự và phải có chữ Hán." |
| Pinyin câu ví dụ | Không | ≤ 300 ký tự | "Tối đa 300 ký tự." |
| Nghĩa câu ví dụ | Không | ≤ 300 ký tự | "Tối đa 300 ký tự." |
| Ghi chú | Không | ≤ 500 ký tự; hiển thị trong mục "Cách dùng" của chi tiết từ | "Tối đa 500 ký tự." |

- AC-10.1: WHEN người dùng chọn "Thêm từ của tôi" (trong một bộ từ hoặc khi tìm kiếm không có kết quả) THE SYSTEM SHALL hiển thị biểu mẫu "Từ của tôi" gồm các trường "Chữ Hán", "Pinyin", "Nghĩa tiếng Việt", "Từ loại", "Câu ví dụ", "Pinyin câu ví dụ", "Nghĩa câu ví dụ", "Ghi chú" cùng nút "Lưu" và "Hủy", với ô tìm kiếm vừa nhập (nếu có) được điền sẵn vào "Chữ Hán" khi là chữ Hán hoặc vào "Pinyin" khi là chữ Latin.
- AC-10.2: IF một trường của biểu mẫu "Từ của tôi" không đạt quy tắc trong bảng của REQ-10 THEN THE SYSTEM SHALL không lưu, hiển thị thông báo tương ứng dưới đúng trường đó và giữ nguyên các giá trị đã nhập.
- AC-10.3: IF kho có một từ đang xuất bản cùng chữ Hán với từ sắp lưu THEN THE SYSTEM SHALL trước khi lưu hiển thị "Kho đã có từ này: {chữ Hán} – {pinyin} – {nghĩa đầu tiên}." với hai lựa chọn "Dùng từ trong kho" (thêm từ của kho vào bộ đang mở thay cho từ tự thêm, không tạo từ tự thêm) và "Vẫn tạo từ riêng".
- AC-10.4: WHEN người dùng lưu biểu mẫu hợp lệ THE SYSTEM SHALL tạo từ tự thêm chỉ người dùng đó thấy, gắn nhãn "Từ của tôi", thêm từ vào bộ đang mở (khi tạo từ trong một bộ) và hiển thị "Đã thêm từ "{chữ Hán}"."
- AC-10.5: WHEN người dùng chọn "Sửa" trong chi tiết một từ tự thêm và lưu thay đổi hợp lệ THE SYSTEM SHALL hiển thị nội dung mới ở mọi bộ từ, tab "Từ khó" và thẻ ôn tập, và giữ nguyên tiến độ ôn tập, dấu từ khó và các bộ chứa từ.
- AC-10.6: WHEN người dùng chọn "Xóa từ" trong chi tiết một từ tự thêm và xác nhận "Xóa từ "{chữ Hán}"? Từ sẽ bị bỏ khỏi mọi bộ từ và mất tiến độ ôn tập." THE SYSTEM SHALL xóa vĩnh viễn từ đó cùng tiến độ ôn tập và dấu từ khó của nó, bỏ từ khỏi mọi bộ và hiển thị "Đã xóa từ."
- AC-10.7: IF người dùng đã có 2.000 từ tự thêm THEN THE SYSTEM SHALL không tạo từ mới và hiển thị "Bạn đã có tối đa 2.000 từ tự thêm."
- AC-10.8: THE SYSTEM SHALL hiển thị mọi nội dung do người dùng nhập (tên bộ từ, các trường của từ tự thêm) đúng như văn bản thuần, không diễn giải thành định dạng, liên kết hay mã thực thi.

### REQ-11: Starting a study session and new-word sources — Bắt đầu phiên học và nguồn từ mới

<!-- Story: US-1, US-3, US-4 · Priority: P1 · Screens: S13, S14, S15 -->

Nguồn của một phiên: "Ôn hôm nay" (mọi từ của người dùng), một cấp HSK, một cấp HSK kèm chủ đề, một bộ từ, hoặc
"Từ khó". "Hạn mức ôn còn lại" và "hạn mức từ mới còn lại" theo AC-14.5.

- AC-11.1: WHEN người dùng bắt đầu phiên "Ôn hôm nay" THE SYSTEM SHALL mở S15 với hàng đợi gồm trước hết các từ đã chọn "Quên" hôm nay mà chưa được đánh giá lại, rồi các từ đến hạn khác thuộc mọi nguồn trong hạn mức ôn còn lại (thứ tự AC-14.3), rồi các từ mới của "Nguồn từ mới" (AC-11.3) trong hạn mức từ mới còn lại.
- AC-11.2: WHEN người dùng chọn nút học của một cấp HSK, của một cấp kèm chủ đề, "Học" của một bộ từ hoặc "Ôn từ khó" THE SYSTEM SHALL mở S15 với hàng đợi chỉ gồm các từ của nguồn đó: trước hết các từ đến hạn trong hạn mức ôn còn lại (thứ tự AC-14.3), rồi các từ mới của nguồn trong hạn mức từ mới còn lại.
- AC-11.3: WHEN người dùng bắt đầu phiên từ một cấp HSK, một cấp kèm chủ đề hoặc một bộ từ THE SYSTEM SHALL ghi nguồn đó làm "Nguồn từ mới" của người dùng (thay nguồn trước), dùng cho mọi phiên "Ôn hôm nay" sau đó.
- AC-11.4: THE SYSTEM SHALL lấy từ mới của một cấp HSK hoặc cấp kèm chủ đề theo thứ tự của kho, của một bộ từ theo thứ tự thêm vào bộ, của nguồn "Từ khó" theo thứ tự của tab "Từ khó", và chỉ lấy các từ đang xuất bản hoặc từ tự thêm mà người dùng chưa có tiến độ ôn tập.
- AC-11.5: IF nguồn còn từ mới chưa học, hàng đợi không có từ nào và hạn mức từ mới hôm nay đã hết THEN THE SYSTEM SHALL không mở phiên mà hiển thị "Bạn đã học đủ {y} từ mới hôm nay." kèm nút "Học thêm 5 từ mới" (tăng hạn mức từ mới của riêng hôm nay thêm 5 rồi mở phiên) và "Để mai".
- AC-11.6: IF nguồn còn từ đến hạn, hàng đợi không có từ nào và hạn mức ôn hôm nay đã hết THEN THE SYSTEM SHALL không mở phiên mà hiển thị "Bạn đã ôn đủ {r} từ hôm nay." kèm nút "Ôn thêm 50 từ" (tăng hạn mức ôn của riêng hôm nay thêm 50 rồi mở phiên) và "Để mai".
- AC-11.7: IF nguồn không có từ đến hạn và không còn từ mới chưa học THEN THE SYSTEM SHALL không mở phiên mà hiển thị "Không có từ nào cần ôn trong {tên nguồn} hôm nay." kèm nút "Luyện thêm" (chỉ khi nguồn có ít nhất 1 từ đã có tiến độ ôn tập) và "Quay lại".
- AC-11.8: WHEN người dùng chọn "Luyện thêm" THE SYSTEM SHALL mở S15 ở chế độ luyện thêm với tối đa 20 từ đã có tiến độ của nguồn (từ khó trước, còn lại ngẫu nhiên), hiển thị nhãn "Luyện thêm — không thay đổi lịch ôn", không hiển thị khoảng ôn dưới các nút đánh giá, và không thay đổi tiến độ ôn tập hay số liệu hôm nay của bất kỳ từ nào.
- AC-11.9: IF bộ từ đang là "Nguồn từ mới" bị xóa THEN THE SYSTEM SHALL bỏ "Nguồn từ mới" của người dùng về trạng thái chưa chọn.

### REQ-12: Two-sided flashcard review — Thẻ hai mặt trên S15

<!-- Story: US-1 · Priority: P1 · Screens: S15 -->

- AC-12.1: WHILE S15 đang mở THE SYSTEM SHALL hiển thị ở phần đầu tên nguồn, "Còn {r}" (số thẻ còn trong hàng đợi, kể cả thẻ được đưa lại sau "Quên"), nút "Cài đặt ôn tập" và nút "Kết thúc".
- AC-12.2: WHEN S15 hiển thị một thẻ THE SYSTEM SHALL hiển thị mặt trước theo cài đặt "Mặt trước thẻ" — "Chữ Hán" (mặc định): chỉ chữ Hán cỡ tối thiểu 48 px; "Nghĩa tiếng Việt": chỉ từ loại và các nghĩa tiếng Việt; "Pinyin": chỉ pinyin có dấu thanh kèm nút phát âm — cùng nhãn "Mới" nếu là từ mới, dấu sao từ khó bật/tắt được và nút "Hiện đáp án".
- AC-12.3: WHEN người dùng chạm vào thẻ hoặc chọn "Hiện đáp án" THE SYSTEM SHALL lật sang mặt sau gồm chữ Hán, pinyin có dấu thanh, từ loại, các nghĩa tiếng Việt, câu ví dụ đầu tiên của từ (chữ Hán, pinyin, nghĩa) nếu có và nút phát âm, rồi hiển thị bốn nút đánh giá "Quên", "Khó", "Nhớ", "Dễ".
- AC-12.4: THE SYSTEM SHALL không hiển thị các nút đánh giá trước khi thẻ được lật sang mặt sau lần đầu.
- AC-12.5: WHILE mặt sau đã được hiển thị THE SYSTEM SHALL cho chạm vào thẻ để lật qua lại giữa hai mặt mà các nút đánh giá vẫn hiển thị.
- AC-12.6: THE SYSTEM SHALL hiển thị dưới mỗi nút đánh giá khoảng ôn mà nút đó sẽ tạo theo REQ-13: "Hôm nay" dưới "Quên" và "{k} ngày" dưới "Khó", "Nhớ", "Dễ".
- AC-12.7: WHEN người dùng chọn một nút đánh giá THE SYSTEM SHALL ghi đánh giá theo REQ-13, hiển thị nút "Hoàn tác" và hiển thị thẻ kế tiếp ở mặt trước.
- AC-12.8: WHERE cài đặt "Tự phát âm khi lật thẻ" được bật THE SYSTEM SHALL phát âm thanh của từ một lần khi thẻ được lật sang mặt sau lần đầu; khi cài đặt tắt (mặc định) THE SYSTEM SHALL không tự phát âm thanh.
- AC-12.9: THE SYSTEM SHALL hỗ trợ trên S15 các phím tắt Space hoặc Enter (lật thẻ), 1, 2, 3, 4 (chọn "Quên", "Khó", "Nhớ", "Dễ", chỉ sau khi thẻ đã lật), P (phát âm), U (hoàn tác) và Esc (kết thúc phiên), và hiển thị phím tắt tương ứng trên các nút ở bố cục rộng (HV trên màn hình rộng).

### REQ-13: SRS grading and scheduling rule — Quy tắc đánh giá và lập lịch SRS

<!-- Story: US-1 · Priority: P1 · Screens: S15 -->

Mỗi cặp người dùng–từ có **một tiến độ ôn tập**: n = số lần nhớ liên tiếp, I = khoảng ôn (ngày, số nguyên), E = hệ số
dễ, L = số lần quên, D = ngày đến hạn (ngày theo giờ Việt Nam). Từ mới (chưa có tiến độ): n = 0, I = 0, E = 2,50,
L = 0. Mỗi đánh giá ở ngày T (giờ Việt Nam) dùng n, I, E **ngay trước** đánh giá:

| Đánh giá | I mới khi n = 0 | I mới khi n = 1 | I mới khi n ≥ 2 | E mới | n mới | L |
|----------|-----------------|-----------------|-----------------|-------|-------|---|
| "Quên" | 0 | 0 | 0 | E − 0,20 khi n ≥ 1; giữ nguyên khi n = 0 | 0 | +1 khi n ≥ 1 |
| "Khó" | 1 | 2 | max(I + 1, làm tròn(I × 1,2)) | E − 0,15 | n + 1 | giữ |
| "Nhớ" | 1 | 3 | max(I + 1, làm tròn(I × E)) | giữ nguyên | n + 1 | giữ |
| "Dễ" | 3 | 5 | max(I + 1, làm tròn(I × E × 1,3)) | E + 0,15 | n + 1 | giữ |

D mới = T + I mới. "làm tròn" = làm tròn tới số nguyên gần nhất, .5 làm tròn lên. E mới không nhỏ hơn 1,30; I mới
không lớn hơn 365.

- AC-13.1: WHEN người dùng chọn một mức đánh giá cho một từ (ngoài chế độ luyện thêm) THE SYSTEM SHALL tính khoảng ôn mới, hệ số dễ mới, số lần nhớ liên tiếp mới và số lần quên theo đúng bảng quy tắc của REQ-13 từ giá trị ngay trước đánh giá, và đặt ngày đến hạn = ngày đánh giá theo giờ Việt Nam + khoảng ôn mới.
- AC-13.2: THE SYSTEM SHALL làm tròn kết quả I × 1,2, I × E và I × E × 1,3 tới số nguyên gần nhất (.5 làm tròn lên), giới hạn khoảng ôn mới tối đa 365 ngày và giữ hệ số dễ mới tối thiểu 1,30.
- AC-13.3: WHEN người dùng chọn "Quên" THE SYSTEM SHALL đưa từ trở lại hàng đợi của phiên hiện tại ngay sau 3 thẻ kế tiếp (hoặc cuối hàng đợi khi còn ít hơn 3 thẻ), và lần đánh giá lại tính theo cột n = 0.
- AC-13.4: THE SYSTEM SHALL tính khoảng ôn mới chỉ từ khoảng ôn đã lên lịch I, không cộng hay trừ theo số ngày ôn trễ hoặc sớm, để một từ được ôn trễ d ngày nhận cùng kết quả như khi ôn đúng ngày đến hạn.
- AC-13.5: THE SYSTEM SHALL cho kết quả đúng ví dụ kiểm chứng A: một từ mới được đánh giá lần lượt, mỗi lần vào đúng ngày đến hạn, "Nhớ", "Nhớ", "Nhớ", "Khó", "Quên", "Nhớ", "Nhớ", "Nhớ" có khoảng ôn lần lượt 1, 3, 8, 10, 0, 1, 3, 6 ngày, hệ số dễ cuối 2,15 và số lần quên 1.
- AC-13.6: THE SYSTEM SHALL cho kết quả đúng ví dụ kiểm chứng B: một từ mới được đánh giá lần lượt "Dễ", "Dễ", "Dễ" có khoảng ôn 3, 5, 18 ngày và hệ số dễ cuối 2,95; một từ có n = 5, I = 300, E = 2,50 được đánh giá "Nhớ" có khoảng ôn mới 365 ngày.
- AC-13.7: THE SYSTEM SHALL dùng một tiến độ ôn tập duy nhất cho mỗi cặp người dùng–từ, dùng chung cho mọi nguồn chứa từ đó (cấp HSK, chủ đề, bộ từ, "Từ khó", "Ôn hôm nay"), để một từ được ôn ở nguồn này không xuất hiện là đến hạn ở nguồn khác trong cùng ngày.

### REQ-14: Due dates, daily limits and backlog — Ngày đến hạn, hạn mức mỗi ngày và từ tồn

<!-- Story: US-1 · Priority: P1 · Screens: S13, S14, S15 -->

- AC-14.1: THE SYSTEM SHALL coi một từ là "đến hạn" khi ngày đến hạn của từ nhỏ hơn hoặc bằng ngày hiện tại theo giờ Việt Nam (UTC+7), với mỗi ngày bắt đầu lúc 00:00:00 giờ Việt Nam bất kể múi giờ cài trên thiết bị.
- AC-14.2: WHILE một từ đến hạn chưa được ôn THE SYSTEM SHALL giữ từ đó ở trạng thái đến hạn qua các ngày sau, không tự đặt lại tiến độ, không giảm hệ số dễ và không phạt vì ngày bị bỏ lỡ, cho tới khi từ được đánh giá.
- AC-14.3: THE SYSTEM SHALL sắp xếp các từ đến hạn trong hàng đợi theo ngày đến hạn cũ nhất trước; cùng ngày đến hạn thì từ khó trước; còn lại theo thứ tự ngẫu nhiên.
- AC-14.4: THE SYSTEM SHALL tính "Ôn hôm nay: {n} từ" = số từ đã chọn "Quên" hôm nay mà chưa được đánh giá lại + min(số từ đến hạn khác chưa được ôn hôm nay, hạn mức ôn còn lại hôm nay).
- AC-14.5: THE SYSTEM SHALL tính hạn mức từ mới còn lại = "Từ mới mỗi ngày" + số từ mới được thêm bằng "Học thêm 5 từ mới" hôm nay − số từ có lần đánh giá đầu tiên trong hôm nay, và hạn mức ôn còn lại = "Lượt ôn tối đa mỗi ngày" + số lượt được thêm bằng "Ôn thêm 50 từ" hôm nay − số từ đã có tiến độ từ trước hôm nay và được đánh giá ít nhất một lần trong hôm nay, mỗi hạn mức không nhỏ hơn 0.
- AC-14.6: WHILE số từ đến hạn chưa được ôn hôm nay lớn hơn hạn mức ôn còn lại THE SYSTEM SHALL hiển thị dưới "Ôn hôm nay: {n} từ" trên S13 dòng "Còn {m} từ quá hạn sẽ chuyển sang ngày sau." với m là phần chênh lệch.
- AC-14.7: WHEN một ngày mới bắt đầu lúc 00:00:00 giờ Việt Nam THE SYSTEM SHALL đặt lại về 0 số từ mới đã học, số từ đã ôn và phần "Học thêm" / "Ôn thêm" của ngày.
- AC-14.8: WHILE một phiên đang mở qua thời điểm 00:00:00 giờ Việt Nam THE SYSTEM SHALL tính mỗi đánh giá vào ngày theo giờ Việt Nam của thời điểm đánh giá và lấy ngày đó làm ngày gốc của ngày đến hạn mới.

### REQ-15: Study settings — Cài đặt ôn tập

<!-- Story: US-6 · Priority: P2 · Screens: S14, S15 -->

- AC-15.1: WHEN người dùng chọn "Cài đặt ôn tập" (trên S14 hoặc S15) THE SYSTEM SHALL hiển thị "Từ mới mỗi ngày" (số nguyên 0–50, mặc định 10), "Lượt ôn tối đa mỗi ngày" (số nguyên 20–500, mặc định 200), "Mặt trước thẻ" ("Chữ Hán" | "Nghĩa tiếng Việt" | "Pinyin", mặc định "Chữ Hán"), "Tự phát âm khi lật thẻ" (mặc định tắt) cùng nút "Lưu" và "Hủy".
- AC-15.2: IF "Từ mới mỗi ngày" không phải số nguyên từ 0 đến 50 hoặc "Lượt ôn tối đa mỗi ngày" không phải số nguyên từ 20 đến 500 THEN THE SYSTEM SHALL không lưu và hiển thị dưới trường tương ứng "Nhập số nguyên từ 0 đến 50." hoặc "Nhập số nguyên từ 20 đến 500."
- AC-15.3: WHEN người dùng lưu cài đặt hợp lệ THE SYSTEM SHALL hiển thị "Đã lưu cài đặt.", tính lại ngay hạn mức còn lại của hôm nay theo AC-14.5, áp dụng mặt trước và tự phát âm từ thẻ kế tiếp (thẻ đang hiển thị giữ nguyên), và áp dụng cùng cài đặt trên mọi thiết bị của người dùng ở lần mở kế tiếp.
- AC-15.4: WHEN người dùng giảm hạn mức xuống thấp hơn số đã học hoặc đã ôn hôm nay THE SYSTEM SHALL giữ nguyên mọi đánh giá đã thực hiện và coi hạn mức còn lại của hôm nay là 0.

### REQ-16: Session end and summary — Kết thúc phiên và tổng kết

<!-- Story: US-1 · Priority: P1 · Screens: S15, S13, S14 -->

- AC-16.1: WHEN hàng đợi của phiên hết hoặc người dùng chọn "Kết thúc" sau khi đã đánh giá ít nhất một thẻ THE SYSTEM SHALL hiển thị màn tổng kết "Kết quả phiên ôn" gồm số từ đã ôn, số từ mới, số lần chọn mỗi mức "Quên", "Khó", "Nhớ", "Dễ", "Tỷ lệ nhớ: {p}%" và thời lượng phiên "{m} phút {s} giây".
- AC-16.2: THE SYSTEM SHALL tính "Tỷ lệ nhớ" là phần trăm, làm tròn tới số nguyên, của các từ trong phiên có lần đánh giá đầu tiên trong phiên khác "Quên".
- AC-16.3: THE SYSTEM SHALL liệt kê trong màn tổng kết mục "Từ đã quên trong phiên" gồm các từ được chọn "Quên" ít nhất một lần trong phiên, mỗi từ có chữ Hán, pinyin, nghĩa đầu tiên và dấu sao để đánh dấu hoặc bỏ đánh dấu từ khó.
- AC-16.4: THE SYSTEM SHALL hiển thị trên màn tổng kết nút "Ôn tiếp ({n})" khi "Ôn hôm nay" còn n > 0 từ, cùng nút "Về Từ vựng" (mở S14) và "Về Tự học" (mở S13).
- AC-16.5: IF người dùng chọn "Kết thúc" khi chưa đánh giá thẻ nào trong phiên THEN THE SYSTEM SHALL đóng S15 và trở về màn hình đã mở phiên mà không hiển thị tổng kết.
- AC-16.6: WHEN người dùng rời S15 mà không qua "Kết thúc" (quay lại, đóng ứng dụng, mất phiên đăng nhập) THE SYSTEM SHALL giữ mọi đánh giá đã thực hiện và giữ nguyên tiến độ của các từ chưa được đánh giá.
- AC-16.7: WHILE ở chế độ luyện thêm THE SYSTEM SHALL hiển thị màn tổng kết có nhãn "Luyện thêm — không thay đổi lịch ôn" và không tính phiên đó vào số từ đã ôn hay số từ mới của hôm nay.

### REQ-17: Undo and reset — Hoàn tác và đặt lại tiến độ

<!-- Story: US-6 · Priority: P2 · Screens: S15, S14 -->

- AC-17.1: WHEN người dùng chọn "Hoàn tác" trên S15 THE SYSTEM SHALL khôi phục tiến độ ôn tập, số liệu hôm nay và hàng đợi về đúng trạng thái ngay trước đánh giá gần nhất của phiên, rồi hiển thị lại thẻ đó ở mặt trước.
- AC-17.2: THE SYSTEM SHALL chỉ cho hoàn tác đánh giá gần nhất trong phiên hiện tại và ẩn nút "Hoàn tác" sau khi đã hoàn tác cho tới đánh giá kế tiếp.
- AC-17.3: WHEN người dùng chọn "Đặt lại tiến độ" trong chi tiết từ và xác nhận "Đặt lại tiến độ của "{chữ Hán}"? Từ sẽ trở về "Chưa học" và được học lại như từ mới." THE SYSTEM SHALL xóa tiến độ ôn tập của từ (n, I, E, L, ngày đến hạn), đổi nhãn thành "Chưa học", hiển thị "Đã đặt lại tiến độ." và giữ nguyên dấu từ khó cùng các bộ chứa từ.
- AC-17.4: THE SYSTEM SHALL không thay đổi số từ mới đã học và số từ đã ôn của hôm nay khi người dùng đặt lại tiến độ một từ.

### REQ-18: Offline tolerance and rating sync — Ôn khi mất mạng và đồng bộ đánh giá

<!-- Story: US-7 · Priority: P1 · Screens: S15 -->

- AC-18.1: WHEN người dùng chọn một mức đánh giá THE SYSTEM SHALL hiển thị thẻ kế tiếp ngay mà không chờ việc lưu đánh giá hoàn tất.
- AC-18.2: IF mất kết nối trong lúc phiên đang mở THEN THE SYSTEM SHALL cho người dùng tiếp tục với các thẻ đã tải (ít nhất 50 thẻ kế tiếp của hàng đợi, hoặc toàn bộ hàng đợi khi ít hơn), hiển thị "Đang ngoại tuyến — kết quả sẽ được lưu khi có mạng." và giữ các đánh giá chưa lưu trên thiết bị, kể cả khi đóng rồi mở lại trình duyệt.
- AC-18.3: WHEN kết nối trở lại hoặc người dùng mở lại ứng dụng trên cùng thiết bị khi còn đánh giá chưa lưu THE SYSTEM SHALL tự gửi mọi đánh giá chưa lưu theo đúng thứ tự thực hiện, ghi mỗi đánh giá đúng một lần với ngày đánh giá là thời điểm thực hiện, rồi bỏ thông báo ngoại tuyến.
- AC-18.4: IF phiên ngoại tuyến đã dùng hết các thẻ đã tải THEN THE SYSTEM SHALL hiển thị "Cần kết nối mạng để tải thêm thẻ." và màn tổng kết của các thẻ đã ôn.
- AC-18.5: IF cùng một từ được đánh giá trên hai thiết bị THEN THE SYSTEM SHALL áp dụng mọi đánh giá của từ đó theo thứ tự thời điểm thực hiện, mỗi đánh giá tính từ tiến độ do đánh giá liền trước tạo ra theo REQ-13.
- AC-18.6: IF người dùng chọn "Đăng xuất" khi thiết bị còn đánh giá chưa lưu THEN THE SYSTEM SHALL hiển thị "Còn {k} kết quả ôn tập chưa được lưu. Đăng xuất bây giờ sẽ mất các kết quả này." với nút "Ở lại" (mặc định) và "Vẫn đăng xuất".

### REQ-19: Library changes — Từ trong kho bị sửa hoặc ngừng xuất bản

<!-- Story: US-8 · Priority: P1 · Screens: S14, S15 · Content events from 016 (GV trên T23–T27) -->

Mọi thay đổi ở REQ-19 do GV thực hiện trên Kho nội dung tự học của workspace mình (016) và chỉ ảnh hưởng HV của
workspace đó. "Ngừng xuất bản" gồm mọi thao tác của 016 làm từ không còn hiển thị cho HV (ẩn, lưu trữ).

- AC-19.1: WHEN GV sửa một từ đang xuất bản trong Kho nội dung tự học của workspace (016) THE SYSTEM SHALL hiển thị nội dung mới (chữ Hán, pinyin, từ loại, nghĩa, ví dụ, cách dùng, âm thanh, cấp, chủ đề) ở mọi nơi từ xuất hiện từ lần mở hoặc tải lại kế tiếp, và giữ nguyên tiến độ ôn tập, dấu từ khó và các bộ chứa từ của mọi HV của workspace.
- AC-19.2: WHEN cấp HSK hoặc chủ đề của một từ thay đổi trong kho THE SYSTEM SHALL hiển thị từ ở cấp và chủ đề mới, tính lại "Đã học {x}/{y}" của các cấp liên quan và lấy từ làm từ mới theo cấp, chủ đề mới.
- AC-19.3: WHEN GV ngừng xuất bản (ẩn hoặc lưu trữ) một từ trong Kho nội dung tự học của workspace (016) THE SYSTEM SHALL bỏ từ đó khỏi danh sách cấp, chủ đề, kết quả tìm kiếm và nguồn từ mới của mọi HV của workspace.
- AC-19.4: WHILE một từ đã ngừng xuất bản có trong bộ từ, tab "Từ khó" hoặc có tiến độ ôn tập của một người dùng THE SYSTEM SHALL tiếp tục hiển thị từ đó cho người dùng ở các nơi ấy với nội dung của lần xuất bản cuối kèm nhãn "Không còn trong kho", và tiếp tục lên lịch ôn từ đó theo REQ-13.
- AC-19.5: WHEN một từ đã ngừng xuất bản được xuất bản lại THE SYSTEM SHALL bỏ nhãn "Không còn trong kho", đưa từ trở lại danh sách cấp, chủ đề và tìm kiếm, và giữ nguyên tiến độ ôn tập, dấu từ khó và các bộ chứa từ.

### REQ-20: Privacy and separation from classes — Riêng tư và tách biệt khỏi lớp học

<!-- Story: US-8 · Priority: P1 · Screens: S13–S15, A05; không có màn hình GV nào hiển thị dữ liệu này -->

- AC-20.1: THE SYSTEM SHALL chỉ hiển thị và chỉ gửi tới thiết bị của chính người dùng các bộ từ, từ tự thêm, dấu từ khó, tiến độ ôn tập, cài đặt, số liệu hôm nay và tổng kết phiên của người dùng đó.
- AC-20.2: IF người dùng mở (kể cả qua đường dẫn trực tiếp) một bộ từ của người khác hoặc một bộ từ không tồn tại THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." giống hệt nhau cho cả hai trường hợp.
- AC-20.3: THE SYSTEM SHALL không hiển thị bất kỳ dữ liệu Tự học nào của HV trên màn hình của GV (kể cả T04, T11, T15, T01 và các màn hình Kho nội dung tự học T23–T27), trên S10, S12 hay bất kỳ màn hình nào của người dùng khác, và không dùng dữ liệu đó cho Điểm xếp hạng (008), tiến độ và theo dõi (009) hay hồ sơ (011).
- AC-20.4: THE SYSTEM SHALL giữ tách biệt dữ liệu của 012 với đánh dấu "Đã thuộc" / "Chưa thuộc" của flashcard trong bài (004, S04): thao tác ở bên này không thay đổi dữ liệu hay số liệu bên kia.
- AC-20.5: WHILE HV không thuộc lớp nào, đã bị gỡ khỏi mọi lớp hoặc mọi lớp của HV đã kết thúc THE SYSTEM SHALL giữ nguyên toàn bộ dữ liệu Tự học và quyền dùng S13, S14, S15 của HV.
- AC-20.6: WHEN tài khoản HV bị xóa theo 001 THE SYSTEM SHALL xóa vĩnh viễn mọi dữ liệu Tự học của tài khoản (bộ từ, từ tự thêm, dấu từ khó, tiến độ ôn tập, lịch sử đánh giá, cài đặt) trong vòng 24 giờ

## 6. Non-Functional Requirements

- NFR-1: Performance: sau khi người dùng chọn một mức đánh giá, thẻ kế tiếp hiển thị p95 ≤ 150 ms và lật thẻ hoàn tất p95 ≤ 100 ms trên điện thoại tầm trung (4 GB RAM, ra mắt từ 2021), như nhau khi trực tuyến và ngoại tuyến.
- NFR-2: Performance: S13 và 50 từ đầu tiên của S14 hiển thị đầy đủ p95 ≤ 2 giây trên mạng 4G (≥ 10 Mbps) ở chiều rộng 360 px với Kho nội dung tự học của workspace có 11.000 từ và HV có 13.000 từ đã có tiến độ; kết quả tìm kiếm hiển thị p95 ≤ 1 giây sau lần gõ phím cuối; thẻ đầu tiên của S15 hiển thị p95 ≤ 2 giây sau khi bắt đầu phiên.
- NFR-3: Performance: âm thanh của từ bắt đầu phát p95 ≤ 1 giây sau khi chạm ở lần phát đầu trên 4G (≥ 10 Mbps) và ≤ 300 ms ở lần phát lại; trên S15 âm thanh của 3 thẻ kế tiếp bắt đầu phát p95 ≤ 300 ms.
- NFR-4: Reliability: trong một lần mất kết nối kéo dài tới 60 phút, người dùng ôn tiếp được ít nhất 50 thẻ đã tải; 100% đánh giá thực hiện khi ngoại tuyến (tối đa 500 đánh giá) được lưu đúng một lần trong ≤ 30 giây sau khi có mạng, kể cả khi trình duyệt bị đóng rồi mở lại trên cùng thiết bị trong vòng 7 ngày.
- NFR-5: Capacity: Kho nội dung tự học của mỗi workspace ≥ 11.000 từ đang xuất bản (mỗi workspace một bản riêng); mỗi HV tới 13.000 từ có tiến độ, 50 bộ từ × 1.000 từ và 2.000 từ tự thêm; việc lưu đánh giá đạt p95 ≤ 500 ms với 1.000 HV ôn tập đồng thời trên toàn hệ thống (khoảng 100 đánh giá mỗi giây), trong đó tới 300 HV thuộc cùng một workspace.
- NFR-6: Accessibility: S13, S14, S15 đạt WCAG 2.1 AA (tương phản chữ ≥ 4,5:1); 100% thao tác dùng được bằng bàn phím với tiêu điểm nhìn thấy được; 100% nút đánh giá có tên đọc được gồm mức và khoảng ôn (ví dụ "Nhớ, ôn lại sau 3 ngày"); 100% chữ Hán và pinyin được trình đọc màn hình đọc bằng tiếng Trung; 100% phím tắt của AC-12.9 hoạt động trên 3 trình duyệt máy tính phổ biến nhất.
- NFR-7: Usability: S13, S14, S15 dùng được ở chiều rộng 360–430 px không có cuộn ngang với vùng chạm ≥ 44×44 px; bốn nút đánh giá nằm trong 40% dưới của màn hình S15 ở chiều cao ≥ 640 px; chữ Hán trên thẻ và trong chi tiết từ cỡ ≥ 48 px; với HV trên màn hình rộng, ở chiều rộng ≥ 1280 px S14 hiển thị danh sách và chi tiết từ cạnh nhau.
- NFR-8: Privacy: 0 dữ liệu Tự học (bộ từ, từ tự thêm, dấu từ khó, tiến độ, cài đặt, số liệu ngày) của một HV được gửi tới thiết bị của HV khác hoặc của GV, hoặc hiển thị trên màn hình GV, kiểm chứng bằng kiểm thử tự động bao phủ 100% màn hình S13–S15, T01, T04, T11, T15, T23–T27, S10, S12 với ít nhất 2 HV có dữ liệu Tự học ở ít nhất 2 workspace; 100% lần GV mở S13–S15 trong kiểm thử nhận A05.
- NFR-9: Correctness: 100% ô của bảng quy tắc SRS (REQ-13), hai ví dụ kiểm chứng (AC-13.5, AC-13.6) và các mốc 23:59:59 / 00:00:00 giờ Việt Nam được kiểm thử tự động với thiết bị đặt ở ít nhất 3 múi giờ (UTC−5, UTC+0, UTC+9).
- NFR-10: Observability: 100% lần tạo, đổi tên, xóa bộ từ; tạo, sửa, xóa từ tự thêm; đặt lại tiến độ; lưu cài đặt; lưu đánh giá thất bại và mỗi lần đồng bộ đánh giá ngoại tuyến được ghi nhật ký có cấu trúc gồm thời điểm, mã HV, mã workspace, loại thao tác, số lượng và kết quả, không chứa tên bộ từ, nội dung từ tự thêm, email hay họ tên; truy vết được ≥ 90 ngày.

## 7. Key Entities

- **Mục từ của kho** (tham chiếu, do 016 sở hữu) — một từ HSK trong Kho nội dung tự học của **một workspace** (khởi tạo
  từ bộ nội dung HSK mẫu, sau đó GV của workspace sửa / thêm / ẩn): chữ Hán giản thể, pinyin có dấu thanh, từ loại, một
  hoặc nhiều nghĩa tiếng Việt, câu ví dụ (chữ Hán + pinyin + nghĩa, có thể kèm âm thanh), âm thanh bản xứ, cấp HSK, thẻ
  chủ đề, nội dung "Cách dùng" (tùy chọn), thứ tự trong kho, trạng thái xuất bản. Hai mục cùng chữ Hán khác pinyin (đa
  âm, ví dụ 行 xíng / háng) là hai từ riêng. Chỉ HV của cùng workspace thấy mục từ.
- **Từ tự thêm** — từ do một HV tạo (REQ-10): các trường của bảng REQ-10, thuộc đúng một HV, không có
  âm thanh, không có cấp HSK; không thuộc Kho nội dung tự học và GV không thấy.
- **Bộ từ** — danh sách từ có thứ tự do một người dùng tạo: tên (duy nhất trong các bộ của người đó), thời điểm tạo,
  các từ (mục từ của kho hoặc từ tự thêm, mỗi từ một lần, tối đa 1.000). Xóa bộ không xóa từ hay tiến độ.
- **Dấu từ khó** — quan hệ người dùng–từ kèm thời điểm đánh dấu. Không ảnh hưởng công thức lập lịch.
- **Tiến độ ôn tập** — một bản ghi cho mỗi cặp người dùng–từ đã được đánh giá ít nhất một lần: n, I, E, L, ngày đến hạn,
  ngày đánh giá đầu tiên, ngày đánh giá gần nhất. Suy ra nhãn "Chưa học" / "Đang học" / "Đã thuộc".
- **Lượt đánh giá** — một lần người dùng chọn "Quên" / "Khó" / "Nhớ" / "Dễ" cho một từ: thời điểm thực hiện, mức, giá
  trị trước và sau. Dùng cho hoàn tác, đồng bộ nhiều thiết bị và tổng kết phiên; không hiển thị dạng lịch sử trong MVP.
- **Cài đặt ôn tập** — theo người dùng: từ mới mỗi ngày, lượt ôn tối đa mỗi ngày, mặt trước thẻ, tự phát âm.
- **Số liệu ngày** — theo người dùng và ngày giờ Việt Nam: số từ mới đã học, số từ đã ôn, phần "Học thêm" / "Ôn thêm".
- **Nguồn từ mới** — nguồn (cấp, cấp + chủ đề, hoặc bộ từ) được dùng để lấy từ mới cho "Ôn hôm nay"; tối đa một.
- **Phiên ôn tập** — một lần mở S15: nguồn, chế độ (thường / luyện thêm), hàng đợi, các lượt đánh giá, thời lượng.

## 8. Edge Cases & Error Handling

- Người dùng ôn lúc 23:59 rồi 00:01 giờ Việt Nam: hai đánh giá thuộc hai ngày khác nhau; hạn mức ngày mới bắt đầu từ 0
  (AC-14.1, AC-14.7, AC-14.8).
- Thiết bị đặt múi giờ UTC−5 hoặc UTC+9: "đến hạn", "hôm nay" và mọi ngày hiển thị vẫn theo giờ Việt Nam (AC-14.1).
- Người dùng bỏ ôn 10 ngày: mọi từ quá hạn dồn lại, cũ nhất trước, mỗi ngày tối đa theo "Lượt ôn tối đa mỗi ngày", phần
  dư báo "Còn {m} từ quá hạn sẽ chuyển sang ngày sau."; từ ôn trễ được tính như đúng hạn (AC-14.2, AC-14.3, AC-14.6, AC-13.4).
- "Từ mới mỗi ngày" = 0: phiên chỉ có từ đến hạn; nút học một cấp chưa học từ nào báo "Bạn đã học đủ 0 từ mới hôm nay."
  kèm "Học thêm 5 từ mới" (AC-11.5).
- Chọn "Quên" ở thẻ cuối cùng: thẻ được đưa lại cuối hàng đợi và hiện ngay (AC-13.3).
- Chọn "Quên" nhiều lần liên tiếp cho cùng một từ trong một phiên: chỉ lần đầu (khi n ≥ 1) giảm hệ số dễ và tăng số lần
  quên; các lần sau tính theo cột n = 0 (AC-13.1, AC-13.3).
- Rời phiên khi một từ vừa chọn "Quên": từ vẫn đến hạn hôm nay và được tính trong "Ôn hôm nay" (AC-11.1, AC-14.4).
- Hệ số dễ chạm 1,30 sau nhiều lần quên: không giảm thêm (AC-13.2).
- Khoảng ôn tính ra lớn hơn 365: dùng 365 (AC-13.2, AC-13.6).
- Một từ nằm trong 3 bộ từ, một cấp và tab "Từ khó": chỉ có một tiến độ; ôn ở bộ A rồi mở bộ B cùng ngày, từ không còn
  đến hạn (AC-13.7).
- Hai mục đa âm (行 xíng và 行 háng): hai từ, hai tiến độ, tìm "行" ra cả hai (AC-4.2).
- Tìm "lv" hoặc "lü": khớp lǜ; tìm "v" được coi như "ü" (AC-4.3).
- Tìm chuỗi trộn chữ Hán và Latin ("你hao"): xử lý như chuỗi có chữ Hán (AC-4.2).
- Tìm chuỗi 51 ký tự: chỉ 50 ký tự đầu được dùng (AC-4.1).
- Đánh dấu khó cùng lúc trên điện thoại và máy tính: trạng thái cuối cùng là thao tác sau cùng (AC-7.1, AC-7.2).
- Đổi tên bộ trên hai thiết bị cùng lúc thành hai tên khác nhau: tên lưu sau cùng thắng; trùng tên với bộ khác thì báo lỗi
  AC-8.4.
- Xóa bộ đang mở trên thiết bị khác: thao tác tiếp theo báo "Bộ từ này không còn tồn tại." (AC-8.8).
- Xóa bộ đang là "Nguồn từ mới": S13 trở về trạng thái AC-2.7 nếu không có từ đến hạn (AC-11.9).
- Thêm 1.200 từ vào bộ trống bằng "Chọn nhiều": 1.000 từ được thêm, báo 200 từ chưa được thêm (AC-9.5).
- Từ tự thêm trùng chữ Hán với kho: hỏi "Dùng từ trong kho" / "Vẫn tạo từ riêng" (AC-10.3).
- Nội dung từ tự thêm chứa thẻ HTML hoặc đường dẫn: hiển thị nguyên văn, không chạy, không thành liên kết (AC-10.8).
- Từ của kho bị ngừng xuất bản giữa phiên ôn: thẻ đã tải vẫn ôn được; từ vẫn được lên lịch vì đã có tiến độ (AC-19.4).
- Từ bị ngừng xuất bản khi người dùng chưa từng học: biến mất khỏi danh sách; đường dẫn chi tiết → A05 (AC-19.3, AC-5.6).
- Âm thanh của từ bị gỡ khỏi kho: nút phát âm biến mất ở lần tải kế tiếp (AC-6.3, AC-19.1).
- Mất mạng giữa phiên và đóng trình duyệt: đánh giá được gửi khi mở lại trên cùng thiết bị (AC-18.2, AC-18.3).
- Đánh giá ngoại tuyến trên điện thoại lúc 10:00 về một từ đã được ôn trên máy tính lúc 11:00: áp dụng theo thứ tự thời điểm
  10:00 rồi 11:00 (AC-18.5).
- Đăng xuất khi còn kết quả chưa lưu: cảnh báo, mặc định "Ở lại" (AC-18.6).
- "Hoàn tác" sau khi đánh giá ngoại tuyến: khôi phục trên thiết bị; đánh giá bị hoàn tác không được gửi (AC-17.1, AC-18.3).
- HV bị khóa tài khoản (001): không đăng nhập được; dữ liệu Tự học được giữ nguyên và dùng lại khi mở khóa (AC-20.5).
- HV chưa từng thuộc lớp nào hoặc mọi lớp đã kết thúc: dùng Tự học đầy đủ (AC-1.2, AC-20.5).
- GV mở S13, S14 hoặc S15 bằng đường dẫn trực tiếp, hoặc đăng nhập bằng tài khoản GV từ A01 sau khi mở đường dẫn S13:
  A05, không lộ nội dung hay số liệu (AC-1.3, AC-1.4). GV xem trước mục từ chỉ trong T23–T27 (016).
- HV mở đường dẫn chi tiết của một từ thuộc kho của workspace khác: A05 giống hệt từ không tồn tại (AC-5.6).
- GV sửa một từ trong bộ HSK mẫu đã nạp sẵn: chỉ HV của workspace đó thấy nội dung mới; HV của workspace khác không bị
  ảnh hưởng (AC-19.1).
- GV ẩn mọi từ của một cấp HSK: cấp biến mất khỏi tab "Kho từ" (AC-3.2); từ đã có tiến độ vẫn được ôn với nhãn "Không còn trong
  kho" (AC-19.4).
- Không tải được số liệu S13: thẻ "Từ vựng" báo lỗi, ba thẻ còn lại vẫn mở được (AC-2.8).
- Thẻ có nghĩa rất dài (≥ 200 ký tự) hoặc câu ví dụ dài: thẻ cuộn bên trong, các nút đánh giá luôn hiển thị (NFR-7).

## 9. Out of Scope

- Mọi tính năng AI (giai đoạn 2): gợi ý từ cần học, tạo câu ví dụ, giải thích cách dùng, chấm phát âm khi đọc theo, tạo bộ
  từ từ văn bản hoặc từ bài học của lớp.
- Chia sẻ bộ từ giữa người dùng, bộ từ công khai, sao chép bộ của người khác.
- GV giao bộ từ hoặc mục tiêu ôn tập cho HV hay lớp; GV xem tiến độ Tự học của HV.
- Tính dữ liệu Tự học vào Điểm xếp hạng (008), dashboard (009) hay hồ sơ (011).
- Chuỗi ngày học (streak), mục tiêu ngày, huy hiệu, điểm thưởng, bảng xếp hạng Tự học.
- Thống kê dài hạn (biểu đồ dự báo, lịch sử ôn theo ngày, heatmap).
- Âm thanh hoặc giọng đọc máy cho từ tự thêm; tải lên âm thanh hay ảnh cho từ tự thêm.
- Chế độ ngoại tuyến hoàn toàn (tải trước cả bộ để học không mạng nhiều ngày) ngoài phạm vi AC-18.2.
- Các kiểu ôn khác ngoài lật thẻ tự đánh giá: gõ đáp án, trắc nghiệm, nghe chọn từ, viết chữ (viết chữ thuộc 013).
- Chữ phồn thể, chú âm (bopomofo), dịch sang ngôn ngữ khác tiếng Việt.
- Nhập / xuất bộ từ (Excel, CSV, Anki).
- Tạm hoãn ("ẩn") một từ khỏi lịch ôn; đặt lại tiến độ hàng loạt theo cấp hoặc bộ.
- Thêm trực tiếp từ flashcard của bài trong lớp (S04) vào bộ từ — nhu cầu đã ghi cho 004 (§10), chưa thuộc MVP của 012.
- Đăng ký tài khoản công khai để dùng Tự học (V15: chỉ tài khoản HV do GV tạo).
- GV dùng Tự học như một người học (ôn từ, bộ từ, từ khó của GV) — V15: GV chỉ quản lý và xem trước nội dung ở 016.
- Kho từ dùng chung giữa các workspace; HV xem kho của workspace khác.

### Removed (2026-10-22, V15)

Không mã AC nào bị bỏ (AC-1.4 được viết lại tại chỗ); các hành vi sau không còn:

- **GV dùng S13–S15** (AC-1.1, AC-1.2, AC-1.3 cũ; US-1, US-2 cũ "Là HV hoặc GV"): mục "Tự học" trên thanh bên của GV,
  bố cục máy tính kèm thanh bên của GV (AC-1.5 cũ), dữ liệu Tự học riêng của GV (bộ từ, từ khó, tiến độ, cài đặt) —
  nay GV mở S13–S15 thấy A05 (AC-1.4).
- **Vai trò "Quản trị nội dung"** và việc chuyển vai trò này về màn hình mặc định của 016 (AC-1.4 cũ); kho từ hệ thống
  dùng chung, không phụ thuộc workspace (AC-1.2 cũ) — nay mỗi workspace có Kho nội dung tự học riêng do GV quản lý.

## 10. Assumptions & Dependencies

Quyết định của stakeholder được dùng: D1 (GV là quản trị viên workspace riêng), D4 / V4-6 (tài khoản HV do GV tạo, không
tự đăng ký), V12-4 (giao diện "Mực & giấy"), V14 (2026-10-22: Tự học không cần lớp, dữ liệu riêng tư, không tính xếp
hạng, AI ở giai đoạn 2 — phần "mọi HV và GV" và "kho hệ thống do Quản trị nội dung duy trì" đã bị V15 thay thế), V15
(2026-10-22: chỉ hai vai trò GV và HV; Tự học chỉ dành cho HV; mỗi workspace có Kho nội dung tự học riêng nạp sẵn bộ HSK
mẫu, GV sửa / thêm / ẩn tùy ý; GV chỉ quản lý, không dùng Tự học). Giả định chung: A4 (HV mobile-first 360–430 px, GV
desktop), A5 (giao diện tiếng Việt, chữ Hán giản thể, pinyin có dấu thanh), A7 (giờ Việt Nam UTC+7). Giả định riêng của
module ở §12.

Phụ thuộc module:

- **016 — Kho nội dung tự học (GV, T23–T27)** (bắt buộc). Mỗi workspace một kho, khởi tạo từ bộ nội dung HSK mẫu rồi do
  GV sở hữu; GV xem trước mục từ ngay trong T23–T27. 012 dùng các trường của mục từ: định danh ổn định qua các lần sửa, chữ Hán
  giản thể, pinyin có dấu thanh, từ loại (danh sách giá trị cố định, dùng cả cho từ tự thêm), một hoặc nhiều nghĩa tiếng
  Việt có thứ tự, câu ví dụ có thứ tự (chữ Hán, pinyin, nghĩa, âm thanh tùy chọn), âm thanh bản xứ của từ, cấp HSK (1–9 —
  016 quyết định cấp 7–9 là một hay ba cấp), thẻ chủ đề, thứ tự trong kho, trạng thái xuất bản. **Cần 016 bổ sung:** trường
  "Cách dùng" (văn bản, tùy chọn) cho mục từ (AC-5.3); giữ nội dung của lần xuất bản cuối của từ bị ngừng xuất bản và không
  xóa hẳn mục từ đã từng xuất bản, kể cả khi GV ẩn hoặc lưu trữ (AC-19.4); thông báo sửa / ngừng / xuất bản lại để 012
  phản ánh ở lần tải kế tiếp (REQ-19); không hiển thị dữ liệu tự học của từng HV trên T23–T27 (AC-20.3).
- **001 — Tài khoản & Xác thực.** **Cần 001 bổ sung:** mục "Tự học" trên thanh tab dưới của HV mở S13 (AC-1.1); S13–S20
  chỉ thuộc quy tắc định tuyến của HV, kể cả mở lại màn hình sau đăng nhập (AC-1.3); tài khoản GV mở S13–S20 → A05
  (AC-1.4); không có mục "Tự học" trên thanh bên của GV; hộp thoại "Đăng xuất" kiểm tra kết quả ôn chưa lưu (AC-18.6); khi
  xóa tài khoản HV thì xóa dữ liệu Tự học (AC-20.6, Q-1). Tài khoản bị khóa giữ nguyên dữ liệu Tự học.
- **013, 014, 015** — S13 dẫn tới S16 (013), S17 (014, từ đó tới S18) và S19 (015, từ đó tới S20). Các module này có thể
  bổ sung một dòng số liệu riêng trên thẻ của mình ở S13 (thuộc spec của họ); 012 chỉ sở hữu bố cục S13 và thẻ "Từ vựng".
- **004 — flashcard trong bài.** Tách biệt hoàn toàn (AC-20.4). **Nhu cầu tùy chọn cho 004 (giai đoạn sau):** nút "Thêm vào
  bộ từ của tôi" trên S04, thêm từ của kho cùng chữ Hán và pinyin, hoặc tạo từ tự thêm khi kho không có (dùng REQ-9, REQ-10).
- **008, 009, 011** — không thay đổi; xác nhận không đọc dữ liệu Tự học (AC-20.3).
- **docs/steering/product.md** — cần bổ sung thuật ngữ Tự học, Bộ từ, Từ khó, Tiến độ ôn tập, SRS vào Domain Glossary và
  mục 012 vào bảng Scope (thuộc người điều phối; không sửa trong lượt này).

## 11. Open Questions

- Q-1 đã đóng 2026-10-22: xóa vĩnh viễn trong vòng 24 giờ, không giữ dạng ẩn danh (AC-20.6).

## 12. Clarifications Log

### Session 2026-10-22 (V14 — Tự học toàn hệ thống)

- Q: Yêu cầu gốc? → A: Nguyên văn: "với dự án hiện tại thì các feature đang là theo học viên trong 1 lớp để GV dễ tracking và quản lí theo giáo trình và bài học, giờ sẽ thêm các module feature global cho tất cả user để có thể dùng được và không phân biệt lớp: 3. Học từ vựng thông minh — Flashcard hai mặt: chữ Hán – Pinyin – nghĩa tiếng Việt. Nghe phát âm từng từ. Ví dụ câu và cách dùng từ. Ôn tập theo phương pháp lặp lại ngắt quãng (SRS). Đánh dấu từ khó và tự tạo bộ từ vựng cá nhân." (source: stakeholder)
- [thay thế 2026-10-22 V15] Q: Ai dùng được? → A: Mọi tài khoản HV và GV hiện có, không cần thuộc lớp; vẫn không có tự đăng ký công khai (AC-1.2, §9) (source: stakeholder)
- [thay thế 2026-10-22 V15] Q: Nội dung từ vựng lấy từ đâu? → A: Kho hệ thống do vai trò "Quản trị nội dung" duy trì ở 016: mục từ HSK 1–9 gồm chữ Hán, pinyin, từ loại, nghĩa, câu ví dụ kèm pinyin và nghĩa, âm thanh bản xứ, cấp, thẻ chủ đề (REQ-3, REQ-5, §10) (source: stakeholder)
- Q: Có cần AI? → A: Không cho module này; MVP một phần, AI ở giai đoạn 2 (§9) (source: stakeholder)
- Q: Dữ liệu tự học có hiển thị cho GV hay ảnh hưởng lớp? → A: Không — riêng tư từng người dùng, không hiển thị cho GV, không ảnh hưởng xếp hạng (008) hay dashboard (009) (REQ-20) (source: stakeholder)
- [thay thế 2026-10-22 V15] Q: Lối vào? → A: Mục "Tự học" trên thanh điều hướng (tab dưới của HV, thanh bên của GV — 001) → S13 (AC-1.1) (source: stakeholder)
- Q: S13 có chuỗi ngày học / mục tiêu ngày? → A: Không trong MVP; S13 chỉ có "Ôn hôm nay", "Từ mới hôm nay" và bốn thẻ (AC-2.9) (source: assumption — không được yêu cầu; chuỗi ngày thêm quy tắc múi giờ và áp lực không cần thiết; để giai đoạn sau)
- [thay thế 2026-10-22 V15] Q: Vai trò "Quản trị nội dung" có dùng Tự học? → A: Không (AC-1.4) (source: assumption — V14 nêu "mọi HV và GV"; vai trò này xem trước nội dung ở màn hình Q của 016)
- Q: Có cho tự thêm từ không có trong kho? → A: Có, mức P2: từ tự thêm riêng tư, không âm thanh, tối đa 2.000 mỗi người dùng, cảnh báo khi trùng chữ Hán với kho (REQ-10) (source: assumption — "tự tạo bộ từ vựng cá nhân" gợi ý người dùng cần cả từ ngoài HSK; giữ P2 để không chặn MVP)
- Q: Bao nhiêu mức đánh giá và quy tắc lập lịch? → A: Bốn mức "Quên" / "Khó" / "Nhớ" / "Dễ" theo bảng kiểu SM-2 của REQ-13: E đầu 2,50, tối thiểu 1,30; khoảng 1/3 ngày cho hai lần nhớ đầu, sau đó I × E; "Khó" × 1,2 và E − 0,15; "Dễ" × E × 1,3 và E + 0,15; "Quên" về 0, lặp lại trong phiên, E − 0,20; khoảng tối đa 365 ngày; ôn trễ không thưởng không phạt (source: assumption — SM-2/Anki là chuẩn phổ biến; bản rút gọn theo ngày dễ kiểm thử, không cần bước học tính theo phút)
- Q: "Đến hạn" và ranh giới ngày? → A: Theo ngày giờ Việt Nam, ngày mới lúc 00:00:00 UTC+7 bất kể múi giờ thiết bị (AC-14.1) (source: assumption — nhất quán với Hạn nộp 23:59 giờ Việt Nam của toàn sản phẩm)
- Q: Ngày bị bỏ lỡ xử lý thế nào? → A: Từ đến hạn dồn lại, cũ nhất trước, giới hạn theo "Lượt ôn tối đa mỗi ngày", không tự đặt lại hay phạt (AC-14.2, AC-14.3, AC-14.6) (source: assumption — tránh làm người dùng nản sau khi nghỉ; giới hạn ngày chống quá tải)
- Q: Hạn mức mặc định? → A: 10 từ mới (0–50) và 200 lượt ôn (20–500) mỗi ngày; "Học thêm 5 từ mới" / "Ôn thêm 50 từ" cho riêng hôm nay (REQ-14, REQ-15) (source: assumption — 10 từ mới/ngày ≈ 10–15 phút ôn khi ổn định, phù hợp HV bận)
- Q: Từ mới của "Ôn hôm nay" lấy từ đâu? → A: Từ "Nguồn từ mới" = cấp, cấp + chủ đề hoặc bộ từ người dùng bắt đầu học gần nhất; chưa chọn thì chỉ ôn từ đến hạn (AC-11.1, AC-11.3, AC-2.7) (source: assumption — một nút "Ôn tập ngay" đủ cho thói quen hằng ngày mà người dùng vẫn kiểm soát nguồn)
- Q: Từ khó tương tác với SRS thế nào? → A: Chỉ do người dùng đánh dấu; không đổi công thức hay ngày đến hạn; từ khó được ưu tiên khi cùng ngày đến hạn, trong "Luyện thêm" và có nguồn "Từ khó" riêng (REQ-7) (source: assumption — dễ hiểu, kiểm thử được, không tự sửa dữ liệu của người dùng)
- Q: Đặt lại tiến độ một từ? → A: Có, trong chi tiết từ, có xác nhận; từ về "Chưa học", giữ dấu khó và các bộ (AC-17.3) (source: assumption — cần khi người dùng muốn học lại từ đầu)
- Q: Mặt trước thẻ? → A: Chữ Hán (mặc định), có thể đổi sang Nghĩa tiếng Việt hoặc Pinyin trong "Cài đặt ôn tập" (AC-12.2, AC-15.1) (source: assumption — đáp ứng "flashcard hai mặt" và yêu cầu ôn theo cả hai chiều)
- Q: Quan hệ với flashcard trong bài (004)? → A: Tách biệt hoàn toàn; nút "Thêm vào bộ từ của tôi" trên S04 là nhu cầu tùy chọn ghi cho 004 (AC-20.4, §10) (source: assumption — giữ 004 đã duyệt nguyên vẹn; dữ liệu lớp và dữ liệu tự học không trộn)
- Q: Khi 016 sửa hoặc ngừng xuất bản một từ? → A: Sửa: hiển thị nội dung mới, giữ tiến độ. Ngừng xuất bản: biến mất khỏi duyệt / tìm / từ mới, nhưng vẫn hiển thị và lên lịch cho người đã có trong bộ, từ khó hoặc tiến độ, với nội dung lần xuất bản cuối và nhãn "Không còn trong kho" (REQ-19) (source: assumption — nguyên tắc sản phẩm "không bao giờ mất dữ liệu học")
- Q: Chịu mất mạng tới đâu? → A: Ôn tiếp ≥ 50 thẻ đã tải, đánh giá lưu trên thiết bị và gửi lại đúng một lần, kể cả sau khi đóng trình duyệt (REQ-18, NFR-4); không có chế độ ngoại tuyến hoàn toàn (§9) (source: assumption — HV ôn trên điện thoại ở nơi mạng chập chờn; nhất quán với 004 AC-16.6)
- [thay thế 2026-10-22] Q: Xóa tài khoản thì dữ liệu Tự học ra sao? → A: Đang áp dụng tạm: xóa vĩnh viễn trong 30 ngày; chờ Q-1 (AC-20.6) (source: assumption — tối thiểu dữ liệu cá nhân)
- Q: Giới hạn bộ từ? → A: Tối đa 50 bộ mỗi người dùng, 1.000 từ mỗi bộ, tên 1–60 ký tự duy nhất trong các bộ của người dùng (REQ-8, REQ-9) (source: assumption — đủ cho mọi nhu cầu thực tế, chặn lạm dụng)
- Q: Thời hạn xóa dữ liệu Tự học khi xóa tài khoản? → A: Xóa vĩnh viễn trong vòng 24 giờ, không giữ dạng ẩn danh — thống nhất 012–015 và 001, theo tiền lệ 011 (xóa ảnh trong 24 giờ). (source: assumption — điều phối 2026-10-22, tối thiểu dữ liệu cá nhân)

### Session 2026-10-22 (V15 — Tự học chỉ cho HV)

- Q: Yêu cầu gốc? → A: Nguyên văn: "Hệ thống hiện tại chỉ có 2 role là GV và học viên, và phần quản lí các nội dung tự học sẽ làm chung phần quản lí của GV luôn, và GV chỉ quản lí thôi, chức năng tự học chỉ dành cho user học viên. Gom quản lí hệ thống vào cho GV." (source: stakeholder)
- Q: Nội dung tự học lấy từ đâu khi không còn "Quản trị nội dung"? → A: Mỗi GV có kho tự học riêng trong workspace của mình ("Kho nội dung tự học", 016, T23–T27), nạp sẵn một bộ nội dung HSK mẫu mà GV sửa / thêm / ẩn tùy ý; HV dùng kho của workspace mình (AC-1.2, AC-3.2, REQ-19, §7, §10) (source: stakeholder)
- Q: Ai dùng S13–S15? → A: Chỉ HV: mọi HV đã kích hoạt, không bị khóa của workspace, không phân biệt lớp. GV không dùng Tự học, không có lối vào, không có dữ liệu tự học riêng (AC-1.1, AC-1.2, AC-1.3, §9 Removed) (source: stakeholder)
- Q: GV mở S13–S15 bằng đường dẫn trực tiếp thì sao? → A: A05 "Không tìm thấy nội dung bạn yêu cầu.", không lộ nội dung hay số liệu; GV xem trước mục từ chỉ trong T23–T27 (AC-1.4 viết lại tại chỗ thay cho AC chặn vai trò "Quản trị nội dung") (source: assumption — nhất quán với quy tắc A05 cho nội dung không xem được của sản phẩm; không tiết lộ màn hình tồn tại)
- Q: Bố cục máy tính của S13–S15 còn không? → A: Còn, chỉ như "HV trên màn hình rộng" (≥ 1024 px, không có thanh bên của GV); phím tắt S15 giữ cho HV dùng bàn phím (AC-1.5, AC-5.5, AC-12.9, NFR-7) (source: assumption — spec đã mô tả bố cục rộng; HV vẫn có thể học trên máy tính)
- Q: GV sửa / ẩn từ thì dữ liệu học của HV ra sao? → A: Giữ nguyên các quy tắc REQ-19 (sửa: nội dung mới, giữ tiến độ; ngừng xuất bản gồm ẩn và lưu trữ: biến mất khỏi duyệt / tìm / từ mới, vẫn ôn được với nhãn "Không còn trong kho"), nay do GV kích hoạt và chỉ ảnh hưởng HV của workspace đó (AC-19.1, AC-19.3) (source: assumption — chia sẻ với 013–016; nguyên tắc "không bao giờ mất dữ liệu học")
- Q: Riêng tư thay đổi gì? → A: Không đổi: dữ liệu tự học của HV riêng tư, không hiển thị cho GV từng HV (kể cả trên T23–T27), không vào xếp hạng / dashboard; xóa trong 24 giờ khi xóa tài khoản HV (AC-20.3, AC-20.6, NFR-8) (source: stakeholder — V15 không đổi điều kiện riêng tư của V14)
- Q: Đường dẫn tới từ của kho workspace khác? → A: A05 giống hệt từ không tồn tại (AC-5.6) (source: assumption — quy tắc cách ly workspace A05 của sản phẩm)
- Q: Khối lượng dữ liệu? → A: Tính theo workspace: kho ≥ 11.000 từ mỗi workspace; 1.000 HV ôn đồng thời trên toàn hệ thống, tới 300 HV cùng một workspace (NFR-2, NFR-5) (source: assumption — GV cá nhân hiếm khi có hơn vài trăm HV hoạt động cùng lúc; giữ tổng tải như trước)
