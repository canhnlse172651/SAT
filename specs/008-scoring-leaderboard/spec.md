---
id: 008
slug: scoring-leaderboard
title: Scoring and Leaderboard
status: tasked
branch: feat/008-scoring-leaderboard
created: 2026-10-18
updated: 2026-10-29
approved_by: “canh

node .sdd/scripts/sdd.mjs approve 008 --by “canh
approved_at: 2026-10-29
---

# Scoring and Leaderboard (Điểm & Xếp hạng)

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

Học viên (HV) cần thấy kết quả làm bài tập và bài thi trong lớp được quy thành một **Điểm xếp hạng** rõ ràng
để có động lực "leo rank"; Giáo viên (GV) cần xem "rank điểm của các học viên" trong từng Lớp của mình. Từ
quyết định của stakeholder ngày 2026-10-22, Điểm xếp hạng của một HV trong một Lớp là **trung bình có trọng số
trên thang 0–100: 30% × TB bài tập + 70% × TB bài thi**. TB bài tập là trung bình điểm (0–100) của các **bộ bài
tập được tính** — chỉ những bộ bài tập GV đã đặt **Hạn nộp** trong Lớp (bộ không có Hạn nộp vẫn hiển thị nhưng
không làm được và không tính điểm, 003/005); một bộ được tính khi HV đã nộp (điểm của Bài nộp duy nhất, nộp muộn
vẫn tính đủ) hoặc khi Hạn nộp đã qua mà HV chưa nộp (0 điểm). TB bài thi là trung bình điểm (0–100) của các **bài
thi được tính** — bài thi (module 006) được giao cho Lớp mà HV đã nộp (bài nộp duy nhất của HV được tính ở mọi
Lớp được giao mà HV là thành viên), hoặc đã qua giờ đóng mà HV chưa nộp (0 điểm). Điểm 0 chỉ áp cho HV đã kích hoạt
là thành viên của Lớp lúc Hạn nộp / giờ đóng qua. Chưa có mục nào được tính thì TB tương ứng bằng 0; nhờ vậy mọi HV
trong Lớp được so trên cùng một tập mục.
Việc xem bài học không được theo dõi và không tạo điểm. Module này định nghĩa công thức, quy tắc mục được tính,
làm tròn (một chữ số thập phân), các sự kiện làm điểm thay đổi (nộp bài, đến Hạn nộp / giờ đóng, chấm lại khi GV
sửa đáp án, ẩn section, lưu trữ, đổi/gỡ Hạn nộp, gỡ bài thi, thay đổi thành viên), quy tắc xếp hạng và phá hòa,
**Bảng xếp hạng** cho HV (S09, gồm đúng hai phân đoạn "Xếp hạng" và "Điểm của tôi"; từ "Điểm của tôi" HV mở S06
"Xem lại bài làm" của 005) và cho GV (T04 tab Xếp hạng, có cột TB bài tập, TB bài thi), mục "Cách tính điểm" và
quy tắc riêng tư. Điểm của từng Bài nộp do 005 sở hữu, điểm từng bài nộp bài thi do 006 sở hữu, Hạn nộp theo lớp
do 003 sở hữu; 008 chỉ quy đổi, lấy trung bình, xếp hạng và hiển thị. Mỗi dòng trên S09 và tab Xếp hạng có ảnh
đại diện; trên S09, chạm vào một bạn cùng lớp mở hồ sơ S12 (module 011) và chạm dòng của mình mở S10, nơi hạng
và Điểm xếp hạng hiển thị đúng giá trị do 008 tính.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Tạo động lực "leo rank" cho HV | Tỷ lệ HV của các Lớp Đang học mở S09 ít nhất 1 lần mỗi tuần | ≥ 50% sau 4 tuần sử dụng |
| Khuyến khích nộp bài đúng hạn | Tỷ lệ cặp HV–bộ bài tập có Hạn nộp đã qua mà HV nộp trước Hạn nộp, trung bình các Lớp Đang học | ≥ 70% sau 4 tuần sử dụng |
| Khuyến khích hoàn thành bộ bài tập | Tỷ lệ trung bình "Bộ bài tập đã nộp x/y" của HV trong các Lớp Đang học | ≥ 60% sau 4 tuần sử dụng |
| Điểm minh bạch, tự kiểm tra được | Sai lệch giữa Điểm xếp hạng hiển thị và kết quả tính tay từ TB bài tập, TB bài thi và các dòng chi tiết đang hiển thị (AC-1.5) | 0 sai lệch (NFR-3) |
| Điểm cập nhật kịp thời | Thời gian từ khi bài nộp có điểm / Hạn nộp hoặc giờ đóng qua đến khi điểm mới hiển thị trên S09/T04 | p95 ≤ 10 giây / ≤ 60 giây (NFR-1) |
| Không mất kết quả đã nộp | Số bài nộp (bộ bài tập hoặc bài thi) thôi được tính chỉ vì GV ẩn section, lưu trữ, đổi/gỡ Hạn nộp hoặc gỡ bài thi | 0 (AC-4.1, AC-4.6, AC-4.7, AC-4.9) |
| GV nắm thứ hạng nhanh | Thời gian GV tìm được hạng, TB bài tập, TB bài thi và chi tiết điểm của một HV trong tab Xếp hạng | ≤ 30 giây với 5/5 GV trong kiểm thử khả dụng |

## 3. Actors & Context

- **Học viên (HV)** — dùng điện thoại là chính (360–430 px). Mở tab "Xếp hạng" ở thanh tab dưới để xem
  mình đứng thứ mấy trong lớp, Điểm xếp hạng và hai thành phần TB bài tập, TB bài thi, bộ bài tập nào đã nộp,
  chưa làm hay đã quá hạn, bài thi nào đã thi hay vắng; mở lại bài làm đã nộp (S06 "Xem lại bài làm", 005) để
  xem đáp án và giải thích; chạm vào một bạn cùng lớp để xem hồ sơ của bạn đó (S12, module 011). Có thể thuộc
  nhiều Lớp của cùng một GV (A3).
- **Giáo viên (GV)** — dùng máy tính. Mở T04 › tab Xếp hạng để xem toàn bộ thứ hạng của lớp, TB bài tập,
  TB bài thi và chi tiết điểm từng HV (kể cả mục đã ẩn, đã lưu trữ, đã gỡ khỏi lớp) và động viên HV. GV
  không dùng S09. GV quyết định bộ bài tập nào được tính bằng cách đặt Hạn nộp (003) và bài thi nào được tính
  bằng cách giao bài thi cho lớp (006).
- **Hệ thống** — nhận các sự kiện nghiệp vụ "Bài nộp bộ bài tập có điểm" và "Bài nộp được chấm lại do GV sửa
  đáp án" (005), "Bài nộp bài thi có điểm", "Bài thi được giao / gỡ khỏi lớp / lưu trữ", "Giờ đóng bài thi
  trong lớp" (006), "Hạn nộp được đặt / đổi / gỡ trong lớp" (003), "Bộ bài tập được lưu trữ / khôi phục"
  (002/005), "Section được ẩn / hiện trong lớp", "HV được thêm vào / gỡ khỏi lớp", "Lớp kết thúc" (003), "Tài
  khoản HV bị khóa / xóa" (001); đồng hồ hệ thống báo thời điểm Hạn nộp qua; rồi cập nhật TB bài tập, TB bài
  thi, Điểm xếp hạng và thứ hạng.
- **Hiện nay** GV ghi điểm thủ công bằng Excel hoặc nhóm chat, tự tính trung bình và thứ hạng; HV không biết
  vị trí của mình cho đến khi GV công bố, và không biết bài nào kéo điểm lên hay xuống.

## 4. User Stories

- US-1 (P1): Là HV, tôi muốn điểm mỗi bộ bài tập và mỗi bài thi tôi nộp được tự động quy về thang 0–100 và
  tổng hợp thành Điểm xếp hạng theo công thức 30% × TB bài tập + 70% × TB bài thi, đồng thời xem được chi tiết
  điểm và phép tính, để công sức của tôi được ghi nhận công bằng.
  - Why this priority: là lõi của yêu cầu "tracking điểm để leo rank"; stakeholder chốt quy tắc 30/70 ngày
    2026-10-22 và "chỉ được làm bài tập 1 lần và tính điểm 1 lần" (V11-1).
  - Independent test: lớp chưa có mục nào được tính; HV nộp bộ bài tập "Luyện từ mới" của Bài 1 (có Hạn nộp,
    tối đa 20 điểm) đạt 18/20 → "Điểm của tôi" trên S09 hiển thị "18/20 · 90%" và "90/100" dưới nhóm "Bài 1 –
    你好", tóm tắt "TB bài tập 90,0 (1 bộ bài tập) · TB bài thi 0,0 (0 bài thi)" và "30% × 90,0 + 70% × 0,0 =
    27,0", Điểm xếp hạng 27,0; dòng đó không có "Làm lại" hay gợi ý cải thiện điểm.
- US-2 (P1): Là HV, tôi muốn xem Bảng xếp hạng của lớp với 10 hạng đầu và vị trí của tôi, để biết mình
  đứng đâu và cần cố gắng bao nhiêu.
  - Why this priority: là bề mặt "leo rank" mà HV nhìn thấy; tạo động lực luyện tập.
  - Independent test: lớp có 12 HV với điểm khác nhau → HV hạng 11 mở S09 thấy 10 dòng đầu đúng thứ tự,
    mỗi dòng có ảnh đại diện và Điểm xếp hạng một chữ số thập phân, dòng "Vị trí của tôi" ghi "Hạng 11/12" và
    đúng số điểm; chạm dòng hạng 1 → mở S12 hồ sơ của HV hạng 1.
- US-3 (P1): Là GV, tôi muốn xem xếp hạng đầy đủ của lớp kèm TB bài tập, TB bài thi và chi tiết điểm từng HV,
  để theo dõi và động viên học viên.
  - Why this priority: stakeholder yêu cầu dashboard có "rank điểm của các học viên".
  - Independent test: GV mở T04 › tab Xếp hạng của lớp 25 HV → thấy đủ 25 dòng đúng thứ tự với cột TB bài
    tập, TB bài thi, Điểm xếp hạng; mở rộng một dòng thấy điểm từng bộ bài tập nhóm theo Bài và từng bài thi,
    trung bình các mục được tính khớp TB hiển thị và 30% × TB bài tập + 70% × TB bài thi khớp Điểm xếp hạng.
- US-4 (P2): Là HV, tôi muốn từ "Điểm của tôi" mở lại bài làm đã nộp của một bộ bài tập, để xem kết quả,
  đáp án và giải thích mà không phải tìm lại bộ bài tập trong Bài.
  - Why this priority: stakeholder muốn "làm xong thì xem lại được phần kết quả làm + đáp án và giải
    thích" (V11-1); HV vẫn mở được S06 từ S11 (003) nên bảng xếp hạng và chi tiết điểm (P1) dùng được khi
    chưa có lối vào này.
  - Independent test: HV đã nộp bộ "Luyện từ mới" của Bài 2 được 16/20 → S09 chỉ có hai phân đoạn "Xếp
    hạng" và "Điểm của tôi"; chạm dòng "Luyện từ mới · 16/20 · 80%" → mở S06 "Xem lại bài làm" của đúng Bài
    nộp đó.
- US-5 (P1): Là HV, tôi muốn thông tin của mình chỉ được chia sẻ ở mức tối thiểu với bạn cùng lớp và
  không ai ngoài lớp/GV của tôi xem được, để bảo vệ quyền riêng tư.
  - Why this priority: bảng xếp hạng công khai trong lớp là dữ liệu cá nhân; sai phân quyền là rủi ro bảo mật.
  - Independent test: HV của lớp A mở đường dẫn bảng xếp hạng lớp B → "Không tìm thấy lớp."; trên S09 không
    có email, TB bài tập, TB bài thi hay điểm từng bài của bạn khác.
- US-6 (P1): Là GV, tôi muốn khi tôi ẩn section Bài tập của một Bài trong lớp, kết quả HV đã nộp vẫn được
  tính nhưng HV không còn thấy nội dung và kết quả từng bộ của section đó, và các bộ HV chưa nộp không còn bị
  tính 0, để tôi điều chỉnh chương trình cho lớp mà không làm mất kết quả của ai.
  - Why this priority: quyết định của stakeholder (D5, X2) và nguyên tắc "không mất dữ liệu học tập"; làm sai
    thì lộ nội dung đã ẩn hoặc HV bị phạt 0 điểm cho nội dung GV đã rút.
  - Independent test: lớp HSK1-K12; An đã nộp cả hai bộ của Bài 3 (100 và 75), Dũng đã nộp "Luyện từ mới" (80)
    nhưng "Luyện mẫu câu" đã Quá hạn (0); GV ẩn section Bài tập của Bài 3 → Điểm xếp hạng của An giữ 75,9,
    "Điểm của tôi" của An không còn bộ nào của Bài 3 và có dòng "Nội dung đã ẩn: 2 bộ bài tập · 175 điểm"; TB
    bài tập của Dũng 61,4 → 71,7, Điểm xếp hạng 67,4 → 70,5; lớp HSK1-K13 dùng cùng giáo trình không thay đổi;
    hiện lại section → mọi giá trị trở lại như trước khi ẩn.
- US-7 (P1): Là HV và GV, tôi muốn khi GV sửa đáp án của một bộ bài tập, điểm bộ đó, TB bài tập và Điểm xếp
  hạng được tính lại theo điểm đã chấm lại (tăng hoặc giảm), để thứ hạng luôn đúng.
  - Why this priority: quyết định của stakeholder (X5, giữ ở V11-2); nếu không, thứ hạng dựa trên đáp án sai.
  - Independent test: Bài nộp duy nhất của An ở bộ "Luyện từ mới" của Bài 2 là 17/20 (85); GV sửa đáp án câu 7
    và xác nhận chấm lại → Bài nộp còn 16/20 → điểm bộ 80, TB bài tập của An 83,8 → 83,0, Điểm xếp hạng 79,7 →
    79,5; cột "Cập nhật lần cuối" của An trên tab Xếp hạng là thời điểm chấm lại hoàn tất.
- US-8 (P1): Là GV, tôi muốn bảng xếp hạng phản ánh đúng việc thêm/gỡ HV, HV vào lớp muộn, khóa/xóa tài khoản
  và kết thúc lớp, để thứ hạng luôn đáng tin.
  - Why this priority: không xử lý các thay đổi này thì bảng xếp hạng sai ngay trong tuần đầu vận hành.
  - Independent test: gỡ HV hạng 1 khỏi lớp → HV hạng 2 trở thành hạng 1 trên S09 và T04; thêm lại HV đó →
    HV quay lại hạng 1 với số điểm cũ; HV mới vào lớp sau Hạn nộp của 3 bộ bài tập không bị tính 0 cho 3 bộ đó.
- US-9 (P1): Là GV, tôi muốn bộ bài tập đã qua Hạn nộp và bài thi đã qua giờ đóng mà HV chưa nộp được tính 0
  điểm cho HV đó, để mọi HV trong lớp được so trên cùng một tập bài và việc bỏ bài không làm điểm trung bình
  cao hơn.
  - Why this priority: là nửa còn lại của quyết định 2026-10-22 ("tính khi HV đã nộp, hoặc khi hạn đã qua mà
    không nộp = 0"); thiếu nó thì HV làm ít bài có thể đứng trên HV làm đủ bài.
  - Independent test: bộ "Đọc hiểu" của Bài 2 có Hạn nộp 23:59 15/11/2026; An chưa nộp → sau Hạn nộp, "Điểm
    của tôi" hiển thị "Quá hạn" và "0/100", TB bài tập của An 83,0 → 71,1, Điểm xếp hạng 79,5 → 75,9; bộ "Luyện
    ngữ pháp" của Bài 4 chưa có Hạn nộp không xuất hiện trong "Điểm của tôi" và không được tính; bài thi
    "Kiểm tra cuối kỳ" chưa đến giờ đóng không được tính.

## 5. Functional Requirements

### REQ-1: Công thức Điểm xếp hạng theo lớp

<!-- Story: US-1, US-9 · Priority: P1 -->

- AC-1.1: THE SYSTEM SHALL tính Điểm xếp hạng của một HV trong một Lớp bằng 30% × TB bài tập + 70% × TB bài thi của HV trong Lớp đó, trên thang 0–100, chỉ dựa trên các Bài nộp bộ bài tập HV đã thực hiện trong chính Lớp đó và các bài nộp bài thi được tính cho Lớp đó theo AC-1.9 và AC-1.12.
- AC-1.2: THE SYSTEM SHALL tính điểm của một bộ bài tập hoặc một bài thi cho một HV trong một Lớp bằng tỷ lệ (điểm đạt ÷ điểm tối đa) × 100 của bài nộp duy nhất của HV cho mục đó (với bộ bài tập: Bài nộp trong Lớp đó; với bài thi: bài nộp duy nhất của HV cho bài thi theo 006), làm tròn đến số nguyên gần nhất (phần lẻ từ 0,5 làm tròn lên), trong khoảng 0–100.
- AC-1.3: THE SYSTEM SHALL không tính bất kỳ hoạt động nào trong section Bài học, gồm xem bước học và học Bộ thẻ từ vựng, vào Điểm xếp hạng.
- AC-1.4: IF điểm tối đa của một bộ bài tập hoặc một bài thi bằng 0 THEN THE SYSTEM SHALL loại mục đó khỏi Điểm xếp hạng và khỏi chi tiết điểm của HV.
- AC-1.5: THE SYSTEM SHALL bảo đảm Điểm xếp hạng hiển thị luôn tính lại được đúng từ TB bài tập và TB bài thi hiển thị cùng lúc theo AC-1.10, và mỗi TB tính lại được đúng từ các dòng chi tiết điểm mà người xem thấy (với HV, kể cả dòng "Nội dung đã ẩn" và dòng "Bài thi đã gỡ"; với GV, kể cả các mục đã ẩn, đã lưu trữ hoặc đã gỡ khỏi Lớp).
- AC-1.6: THE SYSTEM SHALL tính TB bài tập của một HV trong một Lớp bằng trung bình cộng điểm của mọi bộ bài tập được tính của HV trong Lớp đó theo AC-1.8, và bằng 0 khi HV chưa có bộ bài tập nào được tính.
- AC-1.7: THE SYSTEM SHALL tính TB bài thi của một HV trong một Lớp bằng trung bình cộng điểm của mọi bài thi được tính của HV trong Lớp đó theo AC-1.9, và bằng 0 khi HV chưa có bài thi nào được tính.
- AC-1.8: THE SYSTEM SHALL coi một bộ bài tập là được tính cho một HV trong một Lớp khi và chỉ khi bộ bài tập đó có Hạn nộp trong Lớp và hoặc HV đã nộp nó trong Lớp (tính điểm của Bài nộp), hoặc Hạn nộp đã qua trong lúc HV là thành viên đã kích hoạt (§7) của Lớp mà HV chưa nộp (tính 0 điểm), trừ các trường hợp REQ-4 quy định khác.
- AC-1.9: THE SYSTEM SHALL coi một bài thi là được tính cho một HV trong một Lớp khi và chỉ khi bài thi đó được giao cho Lớp theo 006, HV là thành viên của Lớp và hoặc HV đã có bài nộp cho bài thi đó theo AC-1.12 (tính điểm bài thi), hoặc giờ đóng của bài thi đã qua trong lúc HV là thành viên đã kích hoạt (§7) của Lớp mà HV chưa nộp (tính 0 điểm), trừ các trường hợp REQ-4 quy định khác.
- AC-1.10: THE SYSTEM SHALL làm tròn TB bài tập và TB bài thi đến một chữ số thập phân (phần lẻ từ 0,05 làm tròn lên), tính Điểm xếp hạng từ hai giá trị đã làm tròn đó rồi làm tròn kết quả đến một chữ số thập phân theo cùng quy tắc, và hiển thị cả ba giá trị với đúng một chữ số thập phân và dấu phẩy thập phân (ví dụ "75,9", "80,0").
- AC-1.11: IF một bộ bài tập không có Hạn nộp trong Lớp và HV chưa có Bài nộp cho bộ đó trong Lớp THEN THE SYSTEM SHALL không tính bộ bài tập đó vào Điểm xếp hạng của HV và không liệt kê nó trong chi tiết điểm của HV.
- AC-1.12: WHILE HV có bài nộp duy nhất của một bài thi được giao cho nhiều Lớp THE SYSTEM SHALL tính cùng điểm bài thi đó cho HV ở mọi Lớp được giao mà HV đang là thành viên, kể cả Lớp HV được thêm vào sau khi nộp.

### REQ-2: Cập nhật điểm khi nộp bài và khi đến hạn

<!-- Story: US-1, US-9 · Priority: P1 -->

- AC-2.1: WHEN HV nộp một bộ bài tập trong một Lớp và Bài nộp đó được chấm tự động THE SYSTEM SHALL cập nhật điểm bộ bài tập, TB bài tập, Điểm xếp hạng và hạng của HV trong Lớp đó theo REQ-1 mà không chờ Hạn nộp hay bất kỳ thao tác nào của GV.
- AC-2.2: THE SYSTEM SHALL tính điểm của mỗi bộ bài tập và mỗi bài thi cho một HV trong một Lớp đúng một lần, khi bài nộp duy nhất của HV cho mục đó có điểm, và sau đó chỉ thay đổi điểm này khi bài nộp đó được chấm lại theo REQ-3.
- AC-2.3: IF hệ thống nhận thêm một bài nộp có điểm cho một bộ bài tập mà HV đã có Bài nộp trong cùng Lớp, hoặc cho một bài thi mà HV đã có bài nộp THEN THE SYSTEM SHALL giữ điểm tính từ bài nộp đã có và không thay đổi Điểm xếp hạng, hạng hay thời điểm đạt Điểm xếp hạng hiện tại của HV.
- AC-2.4: WHEN nhiều thay đổi điểm của cùng một HV trong cùng một Lớp được ghi nhận gần như đồng thời (bài nộp của các mục khác nhau, kết quả chấm lại, Hạn nộp hoặc giờ đóng qua) THE SYSTEM SHALL phản ánh tất cả các thay đổi đó vào TB bài tập, TB bài thi và Điểm xếp hạng, không bỏ sót và không tính trùng mục nào.
- AC-2.5: WHEN Hạn nộp của một bộ bài tập trong một Lớp qua THE SYSTEM SHALL tính 0 điểm cho bộ bài tập đó với mọi HV đã kích hoạt (§7) đang là thành viên của Lớp mà chưa nộp, và cập nhật TB bài tập, Điểm xếp hạng và hạng của các HV đó.
- AC-2.6: WHEN HV nộp muộn (sau Hạn nộp, theo 005) một bộ bài tập đang được tính 0 điểm THE SYSTEM SHALL thay 0 điểm đó bằng điểm của Bài nộp, tính đầy đủ như Bài nộp đúng hạn, và cập nhật TB bài tập, Điểm xếp hạng và hạng của HV.
- AC-2.7: WHEN HV nộp một bài thi (kể cả bài được nộp tự động khi hết thời lượng theo 006) và bài nộp đó có điểm THE SYSTEM SHALL cập nhật điểm bài thi, TB bài thi, Điểm xếp hạng và hạng của HV ở mọi Lớp được giao mà HV là thành viên, mà không chờ giờ đóng hay bất kỳ thao tác nào của GV.
- AC-2.8: WHEN giờ đóng của một bài thi được giao cho một Lớp qua THE SYSTEM SHALL tính 0 điểm cho bài thi đó với mọi HV đã kích hoạt (§7) đang là thành viên của Lớp mà chưa có bài nộp, và cập nhật TB bài thi, Điểm xếp hạng và hạng của các HV đó.
- AC-2.9: WHEN 006 ghi nhận sau giờ đóng bài nộp của một lượt làm bài thi HV đã bắt đầu trước giờ đóng THE SYSTEM SHALL thay 0 điểm của bài thi đó bằng điểm của bài nộp và cập nhật TB bài thi, Điểm xếp hạng và hạng của HV.

### REQ-3: Điều chỉnh điểm khi chấm lại

<!-- Story: US-7 · Priority: P1 -->

- AC-3.1: WHEN điểm của một hoặc nhiều bài nộp thay đổi do hệ thống chấm lại (bộ bài tập sau khi GV sửa đáp án và xác nhận theo 005, hoặc bài thi theo quy định chấm lại của 006) THE SYSTEM SHALL tính lại điểm của mục đó cho từng HV bị ảnh hưởng từ điểm hiện hành của bài nộp duy nhất của HV, rồi tính lại TB tương ứng và Điểm xếp hạng, kể cả khi kết quả làm giảm Điểm xếp hạng.
- AC-3.2: WHEN một lần chấm lại ảnh hưởng tới bài nộp ở nhiều Lớp THE SYSTEM SHALL cập nhật TB, Điểm xếp hạng và hạng của từng Lớp riêng biệt, mỗi Lớp chỉ từ các Bài nộp bộ bài tập làm trong Lớp đó và các bài nộp bài thi được tính cho Lớp đó theo AC-1.12.
- AC-3.3: WHEN chấm lại làm Điểm xếp hạng hiển thị của HV thay đổi THE SYSTEM SHALL lấy thời điểm chấm lại hoàn tất làm thời điểm đạt Điểm xếp hạng hiện tại của HV, hiển thị ở cột "Cập nhật lần cuối" của tab Xếp hạng.

### REQ-4: Ẩn, lưu trữ, đổi Hạn nộp và gỡ bài thi giữ nguyên kết quả đã nộp

<!-- Story: US-6 · Priority: P1 -->

- AC-4.1: WHEN GV ẩn section Bài tập của một Bài trong một Lớp THE SYSTEM SHALL tiếp tục tính mọi bộ bài tập của section đó mà HV đã nộp trong Lớp, với điểm của Bài nộp, vào TB bài tập của HV.
- AC-4.2: WHEN GV ẩn section Bài tập của một Bài trong một Lớp THE SYSTEM SHALL thôi tính các bộ bài tập của section đó mà HV chưa nộp, kể cả các bộ đang được tính 0 điểm vì Hạn nộp đã qua, cho tới khi section được hiện lại.
- AC-4.3: WHILE section Bài tập của một Bài bị ẩn trong một Lớp THE SYSTEM SHALL tính và cập nhật điểm của một bộ bài tập trong section đó khi Bài nộp của một bài làm HV đã bắt đầu trước lúc ẩn được ghi nhận theo 005 hoặc khi Bài nộp đã có được chấm lại theo REQ-3.
- AC-4.4: WHEN GV ẩn hoặc hiện lại một section trong một Lớp THE SYSTEM SHALL giữ nguyên điểm và cách hiển thị chi tiết điểm của HV ở mọi Lớp khác dùng cùng Giáo trình.
- AC-4.5: WHEN GV hiện lại section Bài tập đã ẩn trong một Lớp THE SYSTEM SHALL hiển thị lại cho HV của Lớp đó từng bộ bài tập của section với tên, trạng thái và điểm hiện hành, tính lại 0 điểm cho các bộ có Hạn nộp đã qua mà HV chưa nộp theo AC-1.8, và bỏ các bộ đó khỏi dòng "Nội dung đã ẩn".
- AC-4.6: WHEN GV lưu trữ một bộ bài tập theo quy định của 002 THE SYSTEM SHALL xử lý bộ bài tập đó ở mọi Lớp như bộ thuộc section đang bị ẩn (AC-4.1, AC-4.2, AC-4.3, AC-11.3) cho tới khi GV khôi phục.
- AC-4.7: WHEN GV gỡ Hạn nộp của một bộ bài tập trong một Lớp THE SYSTEM SHALL tiếp tục tính bộ bài tập đó cho các HV đã nộp và thôi tính nó cho các HV chưa nộp trong Lớp đó.
- AC-4.8: WHEN GV đặt hoặc đổi Hạn nộp của một bộ bài tập trong một Lớp THE SYSTEM SHALL xác định lại theo Hạn nộp mới các HV chưa nộp bị tính 0 điểm theo AC-1.8: thôi tính 0 điểm khi Hạn nộp mới chưa qua, và tính 0 điểm khi Hạn nộp mới đã qua.
- AC-4.9: WHEN một bài thi bị gỡ khỏi một Lớp hoặc bị lưu trữ theo 006 THE SYSTEM SHALL tiếp tục tính bài thi đó cho các HV đã nộp và thôi tính nó cho các HV chưa nộp trong Lớp đó.

### REQ-5: Thành viên lớp, tài khoản và lớp đã kết thúc

<!-- Story: US-8 · Priority: P1 -->

- AC-5.1: WHEN HV bị gỡ khỏi một Lớp THE SYSTEM SHALL loại HV khỏi Bảng xếp hạng của Lớp đó và tính lại hạng của các HV còn lại.
- AC-5.2: WHEN một HV đã bị gỡ được thêm lại vào cùng Lớp THE SYSTEM SHALL đưa HV trở lại Bảng xếp hạng với Điểm xếp hạng tính lại theo REQ-1 từ các bài nộp của HV được tính cho Lớp đó vẫn còn được lưu giữ và các Hạn nộp, giờ đóng đã qua trong lúc HV là thành viên đã kích hoạt (§7) của Lớp.
- AC-5.3: WHEN tài khoản HV bị xóa THE SYSTEM SHALL loại HV khỏi Bảng xếp hạng của mọi Lớp và tính lại hạng của các HV còn lại.
- AC-5.4: WHILE tài khoản HV bị khóa THE SYSTEM SHALL giữ HV cùng Điểm xếp hạng và hạng trên Bảng xếp hạng của các Lớp HV thuộc về.
- AC-5.5: WHILE Lớp ở trạng thái Đã kết thúc THE SYSTEM SHALL tiếp tục tính và cập nhật Điểm xếp hạng khi một bài nộp của Lớp có điểm hoặc được chấm lại, hoặc khi một Hạn nộp hay giờ đóng của Lớp qua.
- AC-5.6: WHEN HV được thêm vào một Lớp sau khi Hạn nộp của một bộ bài tập hoặc giờ đóng của một bài thi trong Lớp đã qua THE SYSTEM SHALL không tính 0 điểm cho HV với mục đó, và chỉ tính mục đó khi HV có bài nộp cho nó (bộ bài tập: Bài nộp muộn trong Lớp; bài thi: bài nộp duy nhất theo AC-1.12).
- AC-5.7: WHEN tài khoản của một HV là thành viên của một Lớp trở thành đã kích hoạt (§7) THE SYSTEM SHALL không tính 0 điểm cho HV với các bộ bài tập có Hạn nộp và các bài thi có giờ đóng trong Lớp đã qua trước thời điểm đó, và chỉ tính các mục đó khi HV có bài nộp cho chúng như AC-5.6.

### REQ-6: Xếp hạng và phá hòa

<!-- Story: US-2 · Priority: P1 -->

- AC-6.1: THE SYSTEM SHALL xếp hạng các HV có Điểm xếp hạng (giá trị đã làm tròn theo AC-1.10) lớn hơn 0 trong một Lớp theo Điểm xếp hạng giảm dần; các HV bằng điểm có cùng hạng và hạng kế tiếp bỏ qua số tương ứng (ví dụ 1, 2, 2, 4).
- AC-6.2: THE SYSTEM SHALL sắp thứ tự hiển thị các HV cùng hạng theo thời điểm đạt Điểm xếp hạng hiện tại (sớm hơn đứng trước), tiếp theo theo tên (từ cuối của họ tên) rồi họ tên đầy đủ theo thứ tự chữ cái tiếng Việt, cuối cùng theo email.
- AC-6.3: WHILE HV có Điểm xếp hạng bằng 0,0, kể cả khi HV chưa có bộ bài tập hay bài thi nào được tính, THE SYSTEM SHALL coi HV là chưa có hạng, hiển thị "—" ở vị trí hạng và xếp HV sau mọi HV có hạng, theo thứ tự tên như AC-6.2.
- AC-6.4: THE SYSTEM SHALL xếp hạng trên Điểm xếp hạng hiện hành tính từ mọi mục được tính của Lớp kể từ khi Lớp bắt đầu, không chia theo tuần hay tháng.
- AC-6.5: WHEN Điểm xếp hạng của bất kỳ HV nào trong Lớp thay đổi THE SYSTEM SHALL tính lại hạng của mọi HV trong Lớp đó.
- AC-6.6: THE SYSTEM SHALL lấy làm thời điểm đạt Điểm xếp hạng hiện tại của một HV thời điểm gần nhất mà Điểm xếp hạng hiển thị của HV thay đổi (bài nộp có điểm, chấm lại hoàn tất, thời điểm Hạn nộp hoặc giờ đóng, hoặc thao tác của GV theo REQ-4), và giữ nguyên thời điểm đó khi một sự kiện không làm Điểm xếp hạng hiển thị thay đổi.

### REQ-7: Bảng xếp hạng lớp cho học viên (S09)

<!-- Story: US-2, US-4 · Priority: P1 -->

- AC-7.1: WHEN HV mở S09 cho một Lớp Đang học hoặc Đã kết thúc THE SYSTEM SHALL hiển thị tối đa 10 HV có hạng đầu tiên theo thứ tự REQ-6, mỗi dòng gồm hạng, ảnh đại diện (hoặc ảnh đại diện mặc định theo module 011 khi HV chưa có ảnh), tên và Điểm xếp hạng với một chữ số thập phân.
- AC-7.2: THE SYSTEM SHALL ghim dòng "Vị trí của tôi" trên S09 gồm hạng dạng "Hạng r/N" (N là số HV hiện có trong Lớp, không tính HV có tài khoản chưa được kích hoạt — trạng thái "Chưa kích hoạt" hoặc "Gửi email thất bại" theo module 001) và Điểm xếp hạng của HV, kể cả khi HV nằm ngoài 10 hạng đầu, và làm nổi bật dòng của HV nếu HV có trong danh sách.
- AC-7.3: WHILE HV đang xem có 0 Điểm xếp hạng THE SYSTEM SHALL hiển thị ở dòng "Vị trí của tôi" thông báo "Bạn chưa có hạng. Hoàn thành bài tập để nhận điểm xếp hạng."
- AC-7.4: THE SYSTEM SHALL hiển thị huy hiệu Vàng, Bạc, Đồng kèm số hạng cho các HV hạng 1, 2 và 3; các HV đồng hạng nhận cùng huy hiệu.
- AC-7.5: IF chưa HV nào trong Lớp có Điểm xếp hạng lớn hơn 0 THEN THE SYSTEM SHALL hiển thị "Chưa có học viên nào có điểm. Hãy làm bài tập để ghi điểm đầu tiên!" thay cho danh sách.
- AC-7.6: WHEN HV chạm ảnh đại diện hoặc tên trên dòng của một bạn cùng lớp trong danh sách xếp hạng trên S09 THE SYSTEM SHALL mở S12 "Hồ sơ học viên" (module 011) của bạn đó, còn khi HV chạm dòng của chính mình hoặc dòng "Vị trí của tôi" thì mở S10 "Hồ sơ của tôi".
- AC-7.7: THE SYSTEM SHALL hiển thị trên S09 đúng hai phân đoạn "Xếp hạng" và "Điểm của tôi", không có phân đoạn, danh sách hay chỉ số nào về lịch sử thay đổi điểm (kể cả "Lịch sử điểm" và "7 ngày qua").

### REQ-8: Chọn lớp và trạng thái lớp trên S09

<!-- Story: US-2 · Priority: P1 -->

- AC-8.1: WHILE HV là thành viên của từ 2 Lớp trở lên THE SYSTEM SHALL hiển thị bộ chọn lớp trên S09 gồm các Lớp HV thấy trong S01, theo thứ tự Đang học (ngày bắt đầu mới nhất trước), Sắp bắt đầu, Đã kết thúc.
- AC-8.2: WHEN HV mở S09 từ thanh tab "Xếp hạng" THE SYSTEM SHALL chọn sẵn Lớp HV đã xem gần nhất trên S09 nếu HV vẫn là thành viên, nếu không thì Lớp đầu tiên trong bộ chọn.
- AC-8.3: WHEN HV mở S09 từ Trang lớp (S02) của một Lớp THE SYSTEM SHALL chọn sẵn Lớp đó.
- AC-8.4: IF HV không thuộc Lớp nào THEN THE SYSTEM SHALL hiển thị "Bạn chưa thuộc lớp nào. Khi giáo viên thêm bạn vào lớp, bảng xếp hạng sẽ hiển thị tại đây."
- AC-8.5: WHILE Lớp được chọn ở trạng thái Sắp bắt đầu THE SYSTEM SHALL hiển thị "Lớp bắt đầu ngày {dd/mm/yyyy}. Bảng xếp hạng sẽ có khi lớp bắt đầu." thay cho danh sách xếp hạng.
- AC-8.6: WHILE Lớp được chọn ở trạng thái Đã kết thúc THE SYSTEM SHALL hiển thị nhãn "Lớp đã kết thúc · Xếp hạng cuối cùng" phía trên danh sách xếp hạng.

### REQ-9: Quyền riêng tư và phân quyền

<!-- Story: US-5 · Priority: P1 -->

- AC-9.1: THE SYSTEM SHALL chỉ cho HV thấy trên S09 về bạn cùng lớp ảnh đại diện, họ tên đầy đủ như GV đã nhập (001, giống S10 và S12 của 011), hạng và Điểm xếp hạng của những người nằm trong 10 hạng đầu (hạng và Điểm xếp hạng của mọi bạn có lớp học chung, kể cả ngoài 10 hạng đầu, chỉ xem được trên S12 theo AC-9.6), không hiển thị email, TB bài tập, TB bài thi, chi tiết điểm, điểm từng bài hay trạng thái tài khoản của họ.
- AC-9.2: IF HV mở Bảng xếp hạng của một Lớp mà HV không phải thành viên THEN THE SYSTEM SHALL từ chối, hiển thị "Không tìm thấy lớp." và không tiết lộ Lớp đó có tồn tại hay không.
- AC-9.3: IF HV yêu cầu xem chi tiết điểm của một HV khác THEN THE SYSTEM SHALL từ chối và không cung cấp bất kỳ dữ liệu nào của HV đó.
- AC-9.4: IF GV mở xếp hạng của một Lớp không thuộc workspace của mình THEN THE SYSTEM SHALL từ chối và hiển thị "Không tìm thấy lớp."
- AC-9.5: IF người chưa đăng nhập mở S09 hoặc tab Xếp hạng của T04 THEN THE SYSTEM SHALL chuyển đến A01 và sau khi đăng nhập đúng vai trò thì đưa người dùng trở lại màn hình đã yêu cầu.
- AC-9.6: THE SYSTEM SHALL bảo đảm hạng ("Hạng r/N" hoặc "Chưa có hạng") và Điểm xếp hạng của một HV trong một Lớp hiển thị trên S10 và S12 (module 011) trùng với giá trị 008 tính theo REQ-1 và REQ-6 và với tab Xếp hạng của T04, kể cả khi HV nằm ngoài 10 hạng đầu, trong khi chi tiết điểm của HV đó vẫn không được cung cấp cho HV khác (AC-9.3).

### REQ-10: Xếp hạng lớp cho giáo viên (T04 tab Xếp hạng)

<!-- Story: US-3 · Priority: P1 -->

- AC-10.1: WHEN GV mở tab Xếp hạng của T04 THE SYSTEM SHALL liệt kê mọi HV đã được kích hoạt hiện có trong Lớp (kể cả tài khoản bị khóa, không gồm HV "Chưa kích hoạt" hoặc "Gửi email thất bại" theo module 001) theo thứ tự REQ-6, mỗi dòng gồm Hạng, ảnh đại diện (hoặc ảnh đại diện mặc định theo module 011), Họ tên (kèm nhãn "Đã khóa" khi tài khoản bị khóa), Email, TB bài tập, TB bài thi, Điểm xếp hạng và Cập nhật lần cuối (thời điểm đạt Điểm xếp hạng hiện tại).
- AC-10.2: WHEN GV mở rộng dòng của một HV THE SYSTEM SHALL hiển thị chi tiết điểm của HV đó gồm nhóm "Bài tập" theo Bài và nhóm "Bài thi" như AC-11.1 và AC-11.8, kể cả các bộ bài tập thuộc section Bài tập đang bị ẩn trong Lớp với nhãn "Đã ẩn trong lớp", các bộ bài tập đã lưu trữ với nhãn "Đã lưu trữ" và các bài thi đã gỡ khỏi Lớp hoặc đã lưu trữ với nhãn "Đã gỡ khỏi lớp", ghi "Không tính" cạnh mọi mục không được tính, kèm liên kết "Xem hồ sơ học tập" đến T15.
- AC-10.3: WHEN GV nhập từ khóa (tối đa 100 ký tự, bỏ khoảng trắng đầu cuối) vào ô tìm kiếm THE SYSTEM SHALL chỉ hiển thị các HV có họ tên hoặc email chứa từ khóa, không phân biệt hoa thường và dấu tiếng Việt, giữ nguyên số hạng gốc của từng HV; từ khóa rỗng hiển thị toàn bộ danh sách.
- AC-10.4: IF không HV nào khớp từ khóa tìm kiếm THEN THE SYSTEM SHALL hiển thị "Không có học viên nào khớp với “{từ khóa}”."
- AC-10.5: IF Lớp chưa có HV nào THEN THE SYSTEM SHALL hiển thị "Lớp chưa có học viên. Thêm học viên ở tab Học viên."

### REQ-11: Điểm của tôi (S09)

<!-- Story: US-1, US-4, US-6, US-9 · Priority: P1 -->

- AC-11.1: WHEN HV mở mục "Điểm của tôi" trên S09 THE SYSTEM SHALL liệt kê trong nhóm "Bài tập" mọi bộ bài tập đang hiển thị với HV trong Lớp mà có Hạn nộp trong Lớp hoặc HV đã nộp, nhóm theo Bài theo thứ tự Bài trong Giáo trình (tiêu đề nhóm là tên Bài, ví dụ "Bài 1 – 你好"), mỗi bộ bài tập gồm tên, trạng thái (Chưa làm kèm Hạn nộp, Đã có điểm kèm nhãn "Nộp muộn" khi nộp sau Hạn nộp, hoặc Quá hạn), điểm của Bài nộp (ví dụ "18/20 · 90%") và điểm bộ bài tập trên thang 100 (ví dụ "90/100", hoặc "0/100" khi Quá hạn).
- AC-11.2: THE SYSTEM SHALL hiển thị phần tóm tắt "Điểm của tôi" gồm Điểm xếp hạng, hạng ("Hạng r/N" hoặc "Chưa có hạng"), TB bài tập kèm số bộ bài tập được tính, TB bài thi kèm số bài thi được tính, và "Bộ bài tập đã nộp x/y", trong đó y là số bộ bài tập đang hiển thị với HV có Hạn nộp trong Lớp và x là số bộ trong đó HV đã nộp.
- AC-11.3: WHILE HV có ít nhất một bộ bài tập được tính thuộc section Bài tập đang bị ẩn trong Lớp hoặc đã lưu trữ THE SYSTEM SHALL hiển thị ở cuối nhóm "Bài tập" đúng một dòng "Nội dung đã ẩn: k bộ bài tập · S điểm" (k là số bộ đó, S là tổng điểm của chúng), không kèm tên Bài, tên bộ bài tập, trạng thái hay điểm từng bộ, và dòng này không mở được màn hình nào.
- AC-11.4: WHEN HV chọn một bộ bài tập ở trạng thái Đã có điểm trong "Điểm của tôi" THE SYSTEM SHALL mở S06 "Xem lại bài làm" (005) của Bài nộp duy nhất của HV cho bộ bài tập đó trong Lớp.
- AC-11.5: THE SYSTEM SHALL hiển thị đúng chữ Hán giản thể, pinyin có dấu thanh và tiếng Việt có dấu trong tên Bài, tên bộ bài tập, tên bài thi và họ tên HV trên S09 và tab Xếp hạng.
- AC-11.6: IF Lớp chưa có bộ bài tập nào đang hiển thị với HV mà có Hạn nộp trong Lớp hoặc HV đã nộp THEN THE SYSTEM SHALL hiển thị "Lớp chưa có bài tập nào để tính điểm." thay cho danh sách của nhóm "Bài tập".
- AC-11.7: THE SYSTEM SHALL không hiển thị trong "Điểm của tôi" bất kỳ nút, liên kết hay gợi ý làm lại hoặc cải thiện điểm nào (ví dụ "Làm lại", "Cải thiện điểm"), kể cả với bộ bài tập hoặc bài thi có điểm dưới 100.
- AC-11.8: WHEN HV mở mục "Điểm của tôi" trên S09 THE SYSTEM SHALL liệt kê trong nhóm "Bài thi" mọi bài thi được giao cho Lớp đang hiển thị với HV theo 006, trừ bài thi đã qua giờ đóng mà không được tính cho HV theo AC-1.9 (ví dụ giờ đóng qua trước khi HV vào Lớp và HV không có bài nộp), theo thứ tự giờ mở (sớm trước), mỗi bài thi gồm tên, giờ đóng, trạng thái (Chưa thi, Đã có điểm hoặc Không làm bài), điểm của bài nộp (ví dụ "42/50 · 84%") và điểm bài thi trên thang 100 (ví dụ "84/100", hoặc "0/100" khi Không làm bài).
- AC-11.9: IF nhóm "Bài thi" không có bài thi nào để liệt kê theo AC-11.8 THEN THE SYSTEM SHALL hiển thị "Lớp chưa có bài thi nào." thay cho danh sách của nhóm "Bài thi".
- AC-11.10: WHILE HV có ít nhất một bài thi được tính đã bị gỡ khỏi Lớp hoặc đã lưu trữ THE SYSTEM SHALL hiển thị ở cuối nhóm "Bài thi" đúng một dòng "Bài thi đã gỡ: k bài thi · S điểm" (k là số bài thi đó, S là tổng điểm của chúng), không kèm tên hay điểm từng bài thi, và dòng này không mở được màn hình nào.
- AC-11.11: WHEN HV chọn một bài thi ở trạng thái Đã có điểm trong "Điểm của tôi" THE SYSTEM SHALL mở kết quả bài nộp của HV cho bài thi đó trên S08 (006).
- AC-11.12: THE SYSTEM SHALL hiển thị các dòng bài thi ở trạng thái Chưa thi hoặc Không làm bài trong "Điểm của tôi" ở dạng không chọn được và không mở màn hình nào từ các dòng đó.

> REQ-12 "Lịch sử điểm của tôi" (AC-12.1 … AC-12.6) bị bỏ ở v11 (2026-10-22) cùng phân đoạn "Lịch sử điểm" của S09; số REQ-12 không được dùng lại.

### REQ-13: Minh bạch cách tính, độ mới dữ liệu và lỗi tải

<!-- Story: US-1, US-2, US-3 · Priority: P1 -->

- AC-13.1: THE SYSTEM SHALL cung cấp mục "Cách tính điểm" trên S09 và tab Xếp hạng, nêu công thức Điểm xếp hạng = 30% × TB bài tập + 70% × TB bài thi, thang 0–100 của mỗi bộ bài tập và bài thi, quy tắc mục được tính (chỉ bộ bài tập có Hạn nộp; mục đã nộp, hoặc đã qua Hạn nộp hay giờ đóng mà chưa nộp thì tính 0; TB bằng 0 khi chưa có mục nào được tính), quy tắc làm tròn, quy tắc điều chỉnh điểm khi chấm lại, quy tắc nội dung đã ẩn hoặc đã gỡ, quy tắc đồng hạng và một ví dụ tính.
- AC-13.2: THE SYSTEM SHALL hiển thị trên S09 và tab Xếp hạng thời điểm dữ liệu được tải dạng "Cập nhật lúc HH:mm · dd/mm/yyyy" theo giờ Việt Nam cùng nút "Làm mới".
- AC-13.3: WHEN người dùng bấm "Làm mới", đổi Lớp, hoặc mở lại S09 hay tab Xếp hạng THE SYSTEM SHALL tải dữ liệu xếp hạng mới nhất của Lớp.
- AC-13.4: IF không tải được dữ liệu xếp hạng THEN THE SYSTEM SHALL hiển thị "Không tải được bảng xếp hạng. Vui lòng thử lại." kèm nút "Thử lại" và không hiển thị danh sách cũ hoặc thiếu như thể là dữ liệu hiện tại.
- AC-13.5: THE SYSTEM SHALL hiển thị trong phần tóm tắt "Điểm của tôi" phép tính Điểm xếp hạng bằng số liệu của chính HV dạng "30% × {TB bài tập} + 70% × {TB bài thi} = {Điểm xếp hạng}" (ví dụ "30% × 71,1 + 70% × 78,0 = 75,9").

## 6. Non-Functional Requirements

- NFR-1: Freshness: điểm của một bài nộp bộ bài tập hoặc bài thi được phản ánh vào TB bài tập, TB bài thi, Điểm xếp hạng và hạng hiển thị khi tải lại S09/tab Xếp hạng trong ≤ 10 giây ở p95 và ≤ 60 giây trong 100% trường hợp; 0 điểm do Hạn nộp hoặc giờ đóng qua được phản ánh trong ≤ 60 giây sau thời điểm đó ở p95 và ≤ 5 phút trong 100% trường hợp; một lần chấm lại làm thay đổi điểm của tới 2.000 bài nộp, hoặc một thao tác của GV theo REQ-4, được phản ánh vào mọi Lớp liên quan trong ≤ 60 giây ở p95 kể từ khi thay đổi hoàn tất.
- NFR-2: Performance: S09 (10 hạng đầu + "Vị trí của tôi" + tóm tắt) hiển thị đầy đủ p95 ≤ 2 giây trên mạng di động 4G (≥ 10 Mbps) ở màn hình 360 px; tab Xếp hạng hiển thị đầy đủ p95 ≤ 2 giây với Lớp 100 HV, 300 bộ bài tập có Hạn nộp và 50 bài thi.
- NFR-3: Accuracy: tính lại toàn bộ TB bài tập, TB bài thi và Điểm xếp hạng từ điểm hiện hành của các bài nộp, các Hạn nộp và giờ đóng cho kết quả trùng 100% với giá trị và hạng đang hiển thị (0 sai lệch) trong kiểm thử đối soát với ≥ 1.000 bài nộp ngẫu nhiên, bao gồm các thay đổi ghi nhận đồng thời, chấm lại, Hạn nộp và giờ đóng qua, nộp muộn, ẩn/hiện section, lưu trữ/khôi phục bộ bài tập, đặt/đổi/gỡ Hạn nộp, gỡ bài thi và HV vào lớp muộn.
- NFR-4: Capacity: hỗ trợ ≥ 100 HV mỗi Lớp, ≥ 300 bộ bài tập có Hạn nộp và ≥ 50 bài thi tính điểm mỗi Lớp mà vẫn đạt NFR-1 và NFR-2.
- NFR-5: Usability: S09 dùng được ở chiều rộng 360–430 px không có cuộn ngang, vùng chạm ≥ 44×44 px; tab Xếp hạng dùng được ở chiều rộng ≥ 1024 px và tối ưu ở ≥ 1280 px.
- NFR-6: Accessibility: S09 và tab Xếp hạng đạt WCAG 2.1 AA về tương phản (≥ 4,5:1 cho chữ thường); huy hiệu hạng 1–3 và nhãn trạng thái luôn có chữ đi kèm, không chỉ dựa vào màu.
- NFR-7: Privacy: 0 trường dữ liệu của HV khác ngoài ảnh đại diện, họ tên, hạng và Điểm xếp hạng của 10 hạng đầu (không có TB bài tập, TB bài thi hay điểm từng mục) được gửi đến thiết bị của HV khi mở S09; 0 dữ liệu điểm của HV khác ngoài hạng và Điểm xếp hạng ở các lớp học chung được gửi khi mở S12 (011); và 0 tên, trạng thái hay điểm từng mục của bộ bài tập thuộc section đang bị ẩn trong Lớp hoặc đã lưu trữ, hay của bài thi đã gỡ khỏi Lớp, được gửi đến thiết bị của HV — kiểm chứng bằng kiểm thử tự động bao phủ 100% các phần của S09 và phần hạng, điểm của S12.
- NFR-8: Observability: 100% thay đổi Điểm xếp hạng được ghi nhật ký có cấu trúc (mã lớp, mã HV, mã bộ bài tập hoặc bài thi, TB bài tập, TB bài thi và Điểm xếp hạng trước/sau, lý do "Điểm mới", "Quá hạn", "Điều chỉnh điểm" hoặc "Thay đổi nội dung", thời điểm) không chứa họ tên hay email, và truy vết được trong ≥ 90 ngày.

## 7. Key Entities

- **Điểm xếp hạng (của một HV trong một Lớp)** — số 0–100 với một chữ số thập phân = 30% × TB bài tập + 70% ×
  TB bài thi (AC-1.10); kèm thời điểm đạt Điểm xếp hạng hiện tại (AC-6.6) và hạng (hoặc "chưa có hạng"). Tồn tại
  cho mỗi cặp HV–Lớp khi HV là thành viên của Lớp.
- **TB bài tập / TB bài thi (của một HV trong một Lớp)** — trung bình cộng điểm của các bộ bài tập được tính /
  bài thi được tính, làm tròn một chữ số thập phân; kèm số mục được tính; bằng 0 khi chưa có mục nào được tính.
- **HV đã kích hoạt** — HV có tài khoản ở trạng thái khác "Chưa kích hoạt" và "Gửi email thất bại" theo module 001
  (gồm "Đang gửi email", "Đã kích hoạt", "Đã khóa"); cùng tập HV được đếm vào N của "Hạng r/N" (AC-7.2) và liệt kê
  ở tab Xếp hạng (AC-10.1). Điểm 0 của mục chưa nộp chỉ áp cho HV đã kích hoạt là thành viên của Lớp tại thời điểm
  Hạn nộp hoặc giờ đóng qua (AC-1.8, AC-1.9, AC-2.5, AC-2.8, AC-5.7).
- **Điểm mục (của một HV cho một bộ bài tập hoặc một bài thi trong một Lớp)** — mục (bộ bài tập thuộc một Bài,
  hoặc bài thi), bài nộp duy nhất của HV nếu có (005: một Bài nộp cho mỗi HV, bộ bài tập và Lớp; 006: một bài nộp
  cho mỗi HV và bài thi, dùng chung ở mọi Lớp được giao mà HV là thành viên — AC-1.12), điểm đạt / điểm tối đa, tỷ lệ %, điểm 0–100,
  trạng thái (bộ bài tập: Chưa làm / Đã có điểm / Quá hạn; bài thi: Chưa thi / Đã có điểm / Không làm bài), nhãn
  "Nộp muộn", được tính hay không (AC-1.8, AC-1.9, REQ-4), cờ "Đã ẩn trong lớp", "Đã lưu trữ", "Đã gỡ khỏi
  lớp". Điểm 0 của mục Quá hạn / Không làm bài là giá trị suy ra từ Hạn nộp, giờ đóng và thành viên lớp, không phải
  bài nộp.
- **Dòng "Nội dung đã ẩn" / "Bài thi đã gỡ"** — dòng suy ra (không lưu riêng) trong chi tiết điểm của HV: số
  mục được tính đang bị ẩn, đã lưu trữ hoặc đã gỡ (k) và tổng điểm của chúng (S); chỉ hiện khi k > 0.
- **Bảng xếp hạng lớp** — danh sách suy ra (không nhập tay) các HV hiện có trong một Lớp, có thứ tự và hạng
  theo REQ-6. Hai cách nhìn: HV (10 hạng đầu + vị trí của mình; N không tính HV "Chưa kích hoạt") và GV
  (toàn bộ, kèm TB và chi tiết). Hạng và Điểm xếp hạng của từng HV còn được 011 hiển thị trên S10, S12 (AC-9.6).
- Thực thể "Mục lịch sử điểm" bị bỏ ở v11: không HV hay GV nào xem danh sách thay đổi điểm; mỗi thay đổi
  chỉ còn trong nhật ký vận hành (NFR-8).
- Tham chiếu (không thuộc module này): Bài nộp bộ bài tập (một Bài nộp cho mỗi HV, bộ bài tập và Lớp — V11-1),
  điểm, nộp muộn, chấm lại khi sửa đáp án và S06 "Xem lại bài làm" (005); Hạn nộp của từng bộ bài tập theo lớp,
  Lớp, thành viên và trạng thái ẩn section theo lớp (003); bài thi, việc giao bài thi cho lớp, giờ mở, thời
  lượng, giờ đóng, bài nộp bài thi (một lượt) và điểm của nó (006); Bài, 2 section, thứ tự Bài, trạng thái xuất
  bản và lưu trữ (002); tài khoản HV và trạng thái kích hoạt (001); ảnh đại diện và hồ sơ HV (011).

## 8. Edge Cases & Error Handling

- HV thuộc 2 Lớp dùng cùng một Giáo trình: mỗi Lớp có Hạn nộp riêng và Điểm xếp hạng riêng; Bài nộp bộ bài tập
  chỉ tính cho Lớp mà HV đã làm bài trong đó (AC-1.1, AC-1.8); ẩn section ở Lớp này không ảnh hưởng Lớp kia (AC-4.4).
- HV thuộc 2 Lớp cùng được giao một bài thi: một lượt, một bài nộp, cùng điểm bài thi ở cả hai Lớp (AC-1.12; 006
  AC-13.4). HV đã nộp bài thi qua Lớp A rồi được thêm vào Lớp B cũng được giao bài thi đó (kể cả sau giờ đóng): bài
  nộp được tính cả ở Lớp B và bài thi hiện "Đã có điểm" trong "Điểm của tôi" của Lớp B (AC-1.12, AC-11.8).
- HV vào Lớp sau giờ đóng của một bài thi và không có bài nộp: bài thi không được tính và không có trong nhóm
  "Bài thi" của "Điểm của tôi" (AC-5.6, AC-11.8).
- Dòng bài thi "Đã có điểm" mở kết quả trên S08 (006); dòng "Chưa thi" và "Không làm bài" không chọn được
  (AC-11.11, AC-11.12).
- Bộ bài tập chưa có Hạn nộp trong lớp: HV vẫn thấy trong Bài nhưng không làm được (003/005); không được tính,
  không có trong "Điểm của tôi" và không vào y của "x/y" (AC-1.11, AC-11.2).
- Bộ bài tập có Hạn nộp chưa qua mà HV chưa nộp: "Chưa làm" kèm Hạn nộp, chưa được tính (AC-1.8, AC-11.1).
- Đầu kỳ, trước Hạn nộp đầu tiên: HV nộp sớm 1 bộ đạt 100 có TB bài tập 100,0 còn HV chưa nộp có 0,0; khi Hạn
  nộp qua, bộ đó được tính cho mọi HV (0 với người chưa nộp) và mẫu số trở nên như nhau (AC-1.6, AC-2.5).
- Lớp chưa có bài thi nào được tính: TB bài thi = 0 nên Điểm xếp hạng tối đa 30,0 cho tới khi có bài thi được
  tính; "Cách tính điểm" và phép tính trong tóm tắt giải thích điều này (AC-1.7, AC-13.1, AC-13.5).
- Chưa có mục nào được tính: TB bài tập 0,0, TB bài thi 0,0, Điểm xếp hạng 0,0 → chưa có hạng (AC-6.3).
- Điểm nhỏ bị làm tròn về 0,0 (ví dụ TB bài tập 0,1 và TB bài thi 0,0 → 0,03 → 0,0): HV chưa có hạng vì xếp hạng
  dùng giá trị đã làm tròn (AC-1.10, AC-6.1, AC-6.3).
- Hai HV có Điểm xếp hạng chính xác khác nhau nhưng cùng giá trị làm tròn (ví dụ 75,94 và 75,86): cùng hạng,
  thứ tự theo thời điểm đạt rồi tên (AC-1.10, AC-6.1, AC-6.2).
- Hệ thống nhận một bài nộp thứ hai cho mục HV đã nộp trong cùng Lớp (005/006 không cho nộp lần hai; ví dụ bấm
  "Nộp" hai lần khi mạng chậm): chỉ bài nộp đã có được tính (AC-2.3).
- Bài nộp đạt 0%: mục ở trạng thái Đã có điểm với 0/100, được tính như mọi mục khác và kéo TB xuống; không có
  cách nào để HV nâng điểm mục đó (AC-1.2, AC-2.2, AC-11.7).
- Hạn nộp qua khi HV đang làm dở một bộ bài tập: HV bị tính 0 ngay khi Hạn nộp qua; nếu sau đó HV nộp (nộp muộn
  theo 005), điểm Bài nộp thay cho 0 và mục có nhãn "Nộp muộn" (AC-2.5, AC-2.6, AC-11.1).
- Nộp muộn: tính đầy đủ như đúng hạn, không trừ điểm (AC-2.6).
- Giờ đóng bài thi qua mà HV chưa thi: "Không làm bài", 0/100 (AC-2.8, AC-11.8). HV đang thi lúc giờ đóng: bị tính 0
  cho tới khi 006 ghi nhận bài nộp của lượt đó, khi đó điểm bài nộp thay cho 0 (AC-2.8, AC-2.9; việc lượt làm
  có tiếp tục sau giờ đóng hay không do 006 quyết định).
- Bài thi chưa đến giờ đóng mà HV chưa thi: "Chưa thi", chưa được tính (AC-1.9, AC-11.8).
- GV dời Hạn nộp sang ngày sau khi Hạn nộp cũ đã qua: các 0 điểm của bộ đó thôi được tính cho tới Hạn nộp mới
  (AC-4.8). GV đặt Hạn nộp ở thời điểm đã qua (nếu 003 cho phép): HV đang là thành viên mà chưa nộp bị tính 0
  ngay (AC-4.8, AC-1.8).
- GV gỡ Hạn nộp của bộ đã có bài nộp: bài nộp vẫn được tính, HV chưa nộp thôi bị tính 0; bộ đó vẫn hiện trong
  "Điểm của tôi" của HV đã nộp (AC-4.7, AC-11.1).
- GV ẩn section Bài tập: HV đã nộp không đổi điểm; HV có bộ Quá hạn (0) trong section đó tăng TB bài tập; hiện
  lại thì các 0 điểm trở lại (AC-4.1, AC-4.2, AC-4.5).
- GV ẩn section Bài học: không ảnh hưởng điểm (AC-1.3).
- GV lưu trữ một bộ bài tập (kể cả khi "Duyệt" AI thay section — V4-3): bộ đã nộp vẫn được tính ở mọi Lớp, gộp
  vào dòng "Nội dung đã ẩn"; bộ chưa nộp thôi được tính; khôi phục thì trở lại như cũ (AC-4.6, AC-11.3). Bộ bài
  tập mới do AI tạo chỉ được tính khi GV đặt Hạn nộp trong lớp (AC-1.8).
- Bài thi bị gỡ khỏi lớp hoặc lưu trữ: bài đã nộp vẫn được tính và gộp vào dòng "Bài thi đã gỡ: k bài thi · S
  điểm"; HV chưa nộp thôi bị tính 0 (AC-4.9, AC-11.10).
- HV không có bộ được tính nào trong section bị ẩn (chưa nộp bộ nào): không có dòng "Nội dung đã ẩn" (AC-11.3).
- Mọi bộ đã nộp của HV đều thuộc section bị ẩn: nhóm "Bài tập" hiển thị thông báo rỗng (nếu không còn bộ nào có
  Hạn nộp đang hiển thị) và dòng "Nội dung đã ẩn"; TB bài tập vẫn tính từ các bộ đó (AC-4.1, AC-11.3, AC-11.6).
- HV đang làm dở một bộ bài tập thì section bị ẩn: nhận hay từ chối bài nộp do 005/003 quyết định; nếu được ghi
  nhận và có điểm, bộ đó được tính và gộp vào dòng "Nội dung đã ẩn" (AC-4.3, AC-11.3).
- Chấm lại làm tăng hoặc giảm điểm: TB và Điểm xếp hạng tính lại, có thể giảm; S06 và T14 có ghi chú chấm lại
  do 005 hiển thị (AC-3.1, AC-3.3). Chấm lại không làm đổi Điểm xếp hạng hiển thị: thời điểm đạt giữ nguyên
  (AC-6.6). Chấm lại cùng lúc cho nhiều HV: cùng thời điểm đạt, trong nhóm đồng hạng xếp theo tên (AC-6.2).
- Chấm lại làm Điểm xếp hạng về 0,0: HV trở thành "Chưa có hạng" (AC-3.1, AC-6.3).
- Chấm lại trên bộ bài tập thuộc section đang ẩn hoặc đã lưu trữ: điểm vẫn cập nhật; HV thấy S của dòng "Nội
  dung đã ẩn" thay đổi (AC-4.3, AC-11.3).
- Lớp Đã kết thúc: Điểm xếp hạng vẫn cập nhật khi có bài nộp, chấm lại hoặc Hạn nộp/giờ đóng qua; nhãn "Xếp hạng
  cuối cùng" giữ nguyên; HV vẫn mở được S06 từ "Điểm của tôi" (AC-5.5, AC-8.6, AC-11.4; làm bài mới do 003/005/006
  quyết định).
- HV vào lớp muộn: các mục đã qua Hạn nộp/giờ đóng trước khi HV vào lớp không bị tính 0; HV vẫn có thể nộp muộn
  các bộ bài tập đó và khi đó chúng được tính; bộ đó hiển thị "Chưa làm" (AC-5.6, AC-2.6, AC-11.1).
- HV bị gỡ khỏi lớp rồi được thêm lại: Điểm xếp hạng tính lại từ các bài nộp còn lưu giữ và các Hạn nộp, giờ đóng
  đã qua trong lúc HV là thành viên; Hạn nộp qua trong lúc HV không ở trong lớp không bị tính 0 (AC-5.1, AC-5.2).
- HV giảm điểm vì Hạn nộp qua mà không thấy lịch sử trên S09: lý do hiện ngay trong "Điểm của tôi" (mục "Quá
  hạn · 0/100", số mục được tính tăng) (AC-11.1, AC-11.2, AC-7.7).
- Mọi HV bằng điểm (> 0): tất cả cùng hạng 1, cùng huy hiệu Vàng (AC-6.1, AC-7.4).
- Lớp chỉ có 1 HV: "Hạng 1/1" khi có điểm, "Chưa có hạng" khi 0,0 (AC-7.2, AC-7.3).
- HV đang mở S09 thì bị gỡ khỏi lớp: lần tải tiếp theo hiển thị "Không tìm thấy lớp." (AC-9.2, AC-13.3).
- Họ tên trùng nhau trong lớp: HV phân biệt bằng ảnh đại diện hoặc mở S12; GV phân biệt bằng email (AC-7.1,
  AC-7.6, AC-10.1).
- HV chưa có ảnh đại diện hoặc ảnh đã bị GV gỡ (011): S09 hiển thị ảnh đại diện mặc định của 011 (AC-7.1).
- Bạn cùng lớp bị gỡ khỏi lớp sau khi S09 được tải rồi HV chạm dòng của bạn đó: S12 áp dụng quy tắc truy cập của
  011 (chỉ mở khi hai HV còn ít nhất một lớp chung); lần tải S09 kế tiếp không còn dòng đó (AC-7.6, AC-5.1).
- HV chưa được kích hoạt trong lớp ("Chưa kích hoạt" hoặc "Gửi email thất bại", V4-6): không làm được bài và
  không bị tính 0 cho Hạn nộp hay giờ đóng qua trong thời gian đó, nên có 0,0 điểm, chưa có hạng, không xuất hiện
  với HV khác; không tính vào N của "Hạng r/N"; không có trong tab Xếp hạng của GV (GV xem họ ở tab Học viên, 003).
  Sau khi kích hoạt thì được tính vào N và xuất hiện ở tab Xếp hạng; các mục đã qua Hạn nộp / giờ đóng trước khi
  kích hoạt được xử lý như HV vào lớp muộn: không tính 0, nộp muộn bộ bài tập thì được tính (AC-1.8, AC-1.9, AC-5.7,
  AC-7.2, AC-10.1).
- Hạng của một HV ngoài 10 hạng đầu: không hiện trên S09 của bạn cùng lớp nhưng hiện trên S12 của HV đó (011) với
  đúng giá trị như tab Xếp hạng của GV (AC-9.1, AC-9.6).
- Kết quả tạo bằng AI (010) chưa được GV "Duyệt": chưa thuộc Bài nên HV không thấy và không có điểm (AC-1.8).
- Họ tên hoặc tên bài thi rất dài: rút gọn bằng dấu "…" trên màn hình 360 px, không vỡ bố cục (NFR-5).
- Dữ liệu đang hiển thị cũ hơn thực tế (kể cả khi một Hạn nộp vừa qua): luôn có "Cập nhật lúc …" và nút "Làm mới";
  không tự cập nhật trực tiếp khi đang mở (AC-13.2, AC-13.3).
- Mất kết nối khi tải: thông báo lỗi và "Thử lại", không hiển thị danh sách cũ như dữ liệu hiện tại (AC-13.4).
- Tìm kiếm không dấu: "nguyen van an" khớp "Nguyễn Văn An" (AC-10.3).
- Tên Bài có chữ Hán và pinyin (Bài 1 – 你好 Nǐ hǎo): hiển thị đúng trên S09 và T04 (AC-11.5).

## 9. Out of Scope

- Bảng xếp hạng theo tuần/tháng, theo từng Bài, chỉ báo tăng/giảm hạng so với tuần trước, biểu đồ xu hướng
  điểm.
- **Bỏ ở v11 (2026-10-22):** làm lại bộ bài tập, "lượt cao nhất", "lượt được tính", số lượt và lịch sử lượt làm
  (V11-1, thay X1); phân đoạn "Lịch sử điểm" trên S09, "7 ngày qua", lý do "Cải thiện điểm"; nút, liên kết hay
  gợi ý "Làm lại" trong "Điểm của tôi"; nội dung S06 "Xem lại bài làm" (đáp án, giải thích — 005).
- **Removed (2026-10-22):** mô hình "Điểm xếp hạng = tổng điểm đóng góp của các bộ bài tập" (mỗi bộ cộng thêm
  0–100, Bài có 3 bộ tối đa 300, giáo trình HSK1 tối đa 3.800), tổng điểm theo nhóm Bài trong "Điểm của tôi",
  dòng "Nội dung đã ẩn: +N điểm" và mọi cách nói "cộng điểm"; tính điểm cho bộ bài tập không có Hạn nộp trong
  lớp. Không mã AC nào bị bỏ ở phiên này: mọi AC bị ảnh hưởng được viết lại tại chỗ (xem §12).
- Điểm cho section Bài học (xem bước học, Bộ thẻ từ vựng), thời lượng học hay việc xem nội dung; chuỗi ngày học
  (streak), huy hiệu/thành tích ngoài huy hiệu hạng 1–3, phần thưởng.
- Bảng xếp hạng liên lớp, toàn workspace hoặc toàn hệ thống.
- Trọng số khác 30% / 70%, trọng số khác nhau giữa các bộ bài tập, các Bài hoặc các bài thi; GV tự cấu hình
  trọng số hay thang điểm theo lớp; trừ điểm nộp muộn; GV cộng/trừ điểm thủ công; điểm thưởng.
- Xuất bảng xếp hạng ra Excel/PDF (việc xuất dữ liệu dashboard do 009 quyết định).
- Thông báo email/đẩy khi thay đổi điểm hoặc hạng, kể cả khi điểm giảm do chấm lại hoặc do Hạn nộp qua (A6);
  cập nhật trực tiếp khi màn hình đang mở.
- HV tự ẩn mình khỏi Bảng xếp hạng hoặc đặt biệt danh.
- Danh sách lịch sử thay đổi điểm cho GV hoặc HV (GV chỉ xem chi tiết điểm hiện tại, ghi chú chấm lại trên T14 của
  005 và hồ sơ học tập ở T15 thuộc 009).
- HV xem tên, trạng thái hay kết quả từng bộ bài tập của section đang bị ẩn trong lớp (X2) hoặc từng bài thi đã gỡ.
- Thuộc module khác: đặt Hạn nộp và việc bộ bài tập làm được hay không (003/005); soạn, giao, lên lịch (giờ mở,
  thời lượng, giờ đóng), làm, chấm và xem kết quả bài thi (006); chấm điểm Bài nộp (005); tính Tiến độ (009); tạo và
  duyệt nội dung bằng AI (010); hồ sơ HV (S10, S12), ảnh đại diện và ảnh bìa (011); lối vào S12 từ tab Xếp hạng của
  GV (011 không cho GV mở S12 — GV xem HV ở T15 qua "Xem hồ sơ học tập").
- **Hoãn (D3 v2, 007 hoãn):** điểm cho câu Nói, Nghe, Viết đoạn tự do; trạng thái "Chờ chấm"; chấm tay và chấm lại
  tay; số bài chờ chấm và liên kết hàng chờ chấm trên tab Xếp hạng.

## 10. Assumptions & Dependencies

Quyết định của stakeholder được dùng: D1 (GV chỉ thấy dữ liệu workspace của mình), V3-2 (Giáo trình → Bài → 2
section Bài học · Bài tập), V3-1 (không theo dõi xem bài học hay thời lượng), D3 v2 (MVP chỉ có câu chấm tự động;
007 hoãn), D4 (GV tạo tài khoản HV; họ tên hiển thị là họ tên GV đã nhập), D5 (ẩn section theo từng lớp), V8-1
(Hạn nộp theo từng bộ bài tập theo từng lớp, 23:59 giờ Việt Nam; nộp muộn được phép, nhãn "Nộp muộn"), V11-1 (mỗi HV
nộp mỗi bộ bài tập đúng một lần trong lớp, điểm tính một lần — thay X1), V11-2 (S09 bỏ "Lịch sử điểm", "Điểm của
tôi" không có làm lại), X2 (section ẩn: HV không thấy kể cả kết quả cũ, điểm đã đạt được giữ), X5 (sửa đáp án bộ
bài tập → chấm lại), V3-4 (nội dung AI chỉ vào Bài khi GV duyệt), và quyết định 2026-10-22: Điểm xếp hạng = 30% ×
TB bài tập + 70% × TB bài thi; chỉ bộ bài tập có Hạn nộp trong lớp làm được và được tính; một mục được tính khi HV
đã nộp hoặc khi Hạn nộp / giờ đóng qua mà không nộp (= 0); chưa có mục nào thì TB bằng 0; Bài thi (006) được đưa
trở lại thành module độc lập, giao cho lớp, lịch = giờ mở + thời lượng + giờ đóng, một lượt, có điểm ngay khi nộp.

Giả định chung được dùng: A2, A3, A4, A5, A6, A7, A9, A11. Giả định riêng của phiên 2026-10-22 (làm tròn, quy tắc
ẩn/lưu trữ/đổi hạn/gỡ bài thi, HV vào lớp muộn, dòng "Nội dung đã ẩn" có số bộ) ghi ở §12. Kết quả đã nộp không bao
giờ thôi được tính âm thầm; chỉ chấm lại (REQ-3) làm giảm điểm của một bài nộp, còn 0 điểm của mục chưa nộp chỉ xuất
hiện khi Hạn nộp hoặc giờ đóng qua và luôn hiển thị là "Quá hạn" / "Không làm bài" trong "Điểm của tôi".

Phụ thuộc module:

- **001** — họ tên, email HV; "Tài khoản HV bị khóa / xóa"; trạng thái tài khoản HV và thời điểm HV trở thành đã
  kích hoạt (§7, AC-5.7; "Chưa kích hoạt", "Gửi email thất bại" — V4-6); đăng nhập và
  định tuyến theo vai trò (A01); quy tắc tách biệt workspace.
- **002** — danh sách và thứ tự Bài trong Giáo trình; 2 section cố định của mỗi Bài; trạng thái Nháp / Đã xuất
  bản / Lưu trữ của Bài và của từng bộ bài tập (lưu trữ / khôi phục, AC-4.6); "Xem trước như học viên" (T21) không
  tạo Bài nộp.
- **003** — Hạn nộp của từng bộ bài tập theo lớp (đặt / đổi / gỡ, thời điểm Hạn nộp 23:59 giờ Việt Nam) và quy tắc
  chỉ bộ có Hạn nộp mới làm được; thành viên lớp kèm thời điểm được thêm vào / gỡ khỏi lớp (AC-1.8, AC-5.2, AC-5.6);
  trạng thái lớp; "Section được ẩn / hiện trong lớp"; Giáo trình của lớp; T04 chứa tab Xếp hạng; S01 quyết định
  lớp nào HV nhìn thấy; S02 có lối vào S09.
- **005** — "Bài nộp có điểm" cho bộ bài tập (điểm đạt, điểm tối đa, Lớp, thời điểm, có phải nộp muộn) ngay khi
  nộp, một Bài nộp cho mỗi HV, bộ bài tập và Lớp (V11-1); chặn làm bộ bài tập không có Hạn nộp; thứ tự bộ bài tập
  trong section; chấm lại sau khi GV sửa đáp án (điểm trước/sau từng Bài nộp, theo lớp) và ghi chú chấm lại trên
  S06, T14; nhận hay từ chối bài nộp khi section bị ẩn; S06 "Xem lại bài làm".
- **006** — bài thi được giao cho lớp (giao / gỡ / lưu trữ), giờ mở, thời lượng, giờ đóng theo lớp; một lượt làm;
  bài nộp bài thi có điểm ngay khi nộp, kể cả nộp tự động khi hết thời lượng (điểm đạt, điểm tối đa, thời điểm),
  dùng làm kết quả ở mọi lớp được giao mà HV là thành viên (006 AC-13.4 — 008 AC-1.12); "Không làm bài" chỉ cho HV
  đã kích hoạt theo cùng định nghĩa §7 (006 AC-13.3 cần hiểu "Gửi email thất bại" là chưa kích hoạt); bài nộp của lượt bắt đầu trước giờ đóng nhưng ghi nhận sau giờ đóng (AC-2.9); quy định chấm lại bài thi
  (nếu có); bài thi nào HV đang thấy trong lớp (AC-11.8); màn hình kết quả bài thi của HV.
- **009** — dùng Điểm xếp hạng, TB bài tập, TB bài thi, hạng và quy tắc xếp hạng của 008 cho "top ranks" trên T01
  và cho T15; định nghĩa tiến độ phải dùng cùng mẫu số "bộ bài tập đang hiển thị có Hạn nộp" như "x/y" của AC-11.2.
- **011** — ảnh đại diện và ảnh mặc định (AC-7.1, AC-10.1); S10, S12 nhận lối vào từ S09 (AC-7.6) và tự áp dụng
  quy tắc chỉ bạn cùng lớp xem, chỉ các lớp chung; S10, S12 hiển thị hạng và Điểm xếp hạng do 008 tính (AC-9.6).
- **010** — không phụ thuộc trực tiếp: kết quả AI chưa duyệt không thuộc Bài nên không tính; sau khi GV duyệt, bộ
  bài tập được tính khi có Hạn nộp như mọi bộ khác.
- **004** — không phụ thuộc: section Bài học không tạo Điểm xếp hạng (AC-1.3).
- **007** — hoãn; 008 không phụ thuộc trong MVP.

## 11. Open Questions

Không còn câu hỏi mở (2026-10-29). Q-1, Q-2 và Q-3 đã đóng — xem §12 (Session 2026-10-22 (điểm 30/70), Session
2026-10-19 và Session 2026-10-29).

## 12. Clarifications Log

### Session 2026-10-18

- Q: "Admin" xem "rank điểm của các học viên" là ai? → A: GV của workspace; GV chỉ thấy Lớp và HV của mình; GV khác nhận "Không tìm thấy lớp." (source: stakeholder — D1)
- [thay thế 2026-10-19] Q: Giáo trình gồm những phần nào? → A: 3 phần cố định Bài học / Bài tập / Bài thi; chỉ Bài tập và Bài thi tạo Điểm xếp hạng (source: stakeholder — D2)
- [thay thế 2026-10-19] Q: Câu Viết/Nói chấm thế nào? → A: GV chấm tay; trong lúc Chờ chấm, toàn bộ Bài nộp chưa được tính điểm (source: stakeholder — D3)
- Q: Họ tên HV trên Bảng xếp hạng lấy từ đâu? → A: Họ tên GV đã nhập khi tạo tài khoản HV (source: stakeholder — D4)
- [thay thế 2026-10-20] Q: Một Lớp dùng mấy Giáo trình? → A: Đúng một; danh sách Bài tập/Bài thi tính điểm lấy từ Giáo trình đó (source: assumption — A2, owner 003)
- Q: HV có thể thuộc nhiều Lớp? → A: Có, trong cùng workspace; Điểm xếp hạng tính riêng từng Lớp và S09 có bộ chọn lớp (source: assumption — A3, owner 001/003)
- Q: Thiết bị? → A: S09 thiết kế mobile-first 360–430 px; T04 cho desktop ≥ 1280 px, dùng được ≥ 1024 px (source: assumption — A4)
- Q: Ngôn ngữ hiển thị? → A: Giao diện tiếng Việt; tên bài có thể chứa chữ Hán và pinyin, phải hiển thị đúng (source: assumption — A5)
- Q: Có thông báo khi đổi hạng? → A: Không; chỉ hiển thị trong ứng dụng (source: assumption — A6)
- Q: Múi giờ? → A: Mọi thời điểm hiển thị theo giờ Việt Nam UTC+7 (source: assumption — A7)
- [thay thế 2026-10-19] Q: Nội dung đã có bài nộp có bị xóa được không? → A: Không, chỉ ẩn; 008 xử lý trường hợp ẩn ở AC-4.1 (đánh số v1; nay là REQ-4) (source: assumption — A8, owner 002)
- Q: Trước ngày bắt đầu lớp thì sao? → A: HV không mở được nội dung nên chưa có điểm; S09 hiển thị thông báo lớp sắp bắt đầu (source: assumption — A9, owner 003)
- [thay thế 2026-10-19] Q: Lượt làm nào được tính? → A: Bài tập làm lại không giới hạn, tính lượt cao nhất; Bài thi giới hạn lượt, lượt chính thức do 006 quy định (source: assumption — A10, owner 005/006)
- Q: Điểm xếp hạng tính theo phạm vi nào? → A: Theo từng Lớp; công thức do 008 sở hữu (source: assumption — A11)
- Q: Bài học/Flashcard có cộng điểm không? → A: Không (0 điểm); xếp hạng phản ánh kết quả làm bài, còn mức độ học bài thể hiện ở Tiến độ (009) (source: assumption — bám sát câu "làm bài tập sẽ có thống kê tracking điểm để leo rank")
- [thay thế 2026-10-20] Q: Quy đổi điểm từng bài thế nào? → A: Chuẩn hóa về 0–100 theo tỷ lệ điểm đạt/điểm tối đa rồi nhân hệ số, làm tròn một lần cho mỗi mục (0,5 làm tròn lên) (source: assumption — mỗi bài có trọng số như nhau dù số câu khác nhau; tổng luôn khớp chi tiết)
- Q: Đồng điểm hiển thị thế nào? → A: Cùng hạng, hạng kế tiếp nhảy số (1, 2, 2, 4); thứ tự trong nhóm đồng hạng: đạt tổng điểm sớm hơn, rồi tên, họ tên, email (source: assumption — công bằng, dễ giải thích, vẫn thưởng người đạt trước)
- Q: HV 0 điểm có hạng không? → A: Không; hiển thị "—", xếp cuối và không xuất hiện trong 10 hạng đầu của HV (source: assumption — tránh "hạng 1" khi cả lớp 0 điểm, bảo vệ HV chưa làm bài)
- [thay thế 2026-10-20 v4] Q: HV thấy bao nhiêu bạn cùng lớp? → A: 10 hạng đầu + vị trí của mình (source: assumption — đủ động lực cạnh tranh, không công khai nhóm điểm thấp)
- [thay thế 2026-10-22 v11] Q: Có bảng xếp hạng tuần, chỉ báo tăng/giảm hạng, xuất Excel không? → A: Không trong MVP; chỉ xếp hạng tích lũy theo lớp, có "7 ngày qua" trong lịch sử của HV (source: assumption — đơn giản theo Hiến chương IV; có thể bổ sung sau)
- [thay thế 2026-10-19] Q: Lớp đã kết thúc thì bảng xếp hạng đóng băng? → A: Gắn nhãn "Xếp hạng cuối cùng" nhưng vẫn cập nhật khi GV chấm xong/chấm lại bài nộp trước khi lớp kết thúc (source: assumption — không HV nào bị thiệt vì GV chấm muộn)
- Q: Tài khoản HV bị khóa có rời bảng xếp hạng? → A: Không, khóa có thể tạm thời; tài khoản bị xóa thì rời mọi bảng xếp hạng (source: assumption — giữ ổn định thứ hạng)
- Q: S09 có tự cập nhật trực tiếp? → A: Không; tải mới khi mở, đổi lớp hoặc bấm "Làm mới", luôn hiển thị "Cập nhật lúc …" (source: assumption — A6, đơn giản)

### Session 2026-10-19

Áp dụng brief v2 (câu trả lời của stakeholder ngày 2026-10-19). Khi khác với phiên 2026-10-18, phiên này thay thế. REQ/AC đã được đánh số lại (chưa có artifact hạ nguồn). Số REQ/AC trong các mục dưới đây là số của bản v2; bản v3 (Session 2026-10-20) đánh số lại.

- [thay thế 2026-10-20] Q: Điểm xếp hạng lấy từ đâu trong cấu trúc mới Giáo trình → Bài → 3 section? → A: Từ các bộ bài tập trong section Bài tập của mỗi Bài (mỗi bộ tính lượt cao nhất) và Bài thi của mỗi Bài; công thức tỷ lệ × 100 × hệ số giữ nguyên (source: stakeholder — D2 v2, X1: "về điểm để leo rank sẽ lấy lần cao nhất")
- [thay thế 2026-10-20] Q: Còn chấm tay / trạng thái "Chờ chấm" không? → A: Không trong MVP; mọi câu hỏi chấm tự động nên điểm được tính ngay khi nộp, trừ Bài thi chờ công bố kết quả theo 006; mọi điều kiện kích hoạt gắn với chấm tay (007) bị bỏ, chuyển sang "Hoãn" (source: stakeholder — D3 v2, X1; 007 hoãn)
- [thay thế 2026-10-22] Q: GV ẩn một section trong lớp thì điểm HV đã đạt từ section đó ra sao? → A: Giữ nguyên; Q-3 của phiên 2026-10-18 (phần ẩn) đã đóng (source: stakeholder — X2, D5)
- Q: HV có còn thấy section bị ẩn và kết quả cũ trong đó không? → A: Không, kể cả kết quả cũ; ẩn chỉ áp dụng cho lớp đó; hiện lại thì khôi phục mọi thứ (source: stakeholder — D5, X2)
- [thay thế 2026-10-22] Q: Điểm của nội dung bị ẩn hiển thị cho HV thế nào? → A: Gộp thành đúng một dòng "Nội dung đã ẩn: +N điểm" ở cuối "Điểm của tôi", không tên Bài, tên mục, số mục hay điểm từng mục; tóm tắt tách riêng "Nội dung đã ẩn"; số đếm "x/y" chỉ tính mục đang hiển thị (source: assumption — X2 cấm lộ kết quả của section ẩn, nhưng tổng vẫn phải khớp chi tiết để HV không thấy điểm "từ đâu ra")
- [thay thế 2026-10-22 v11] Q: Mục lịch sử của nội dung bị ẩn hiển thị thế nào? → A: Giữ thời điểm, mức thay đổi, tổng mới và lý do nhưng thay tên bằng "Nội dung đã ẩn"; hiện lại section thì tên trở lại (source: assumption — X2; lịch sử vẫn giải thích được mọi thay đổi tổng)
- [thay thế 2026-10-22] Q: Ẩn/hiện section có tạo mục lịch sử hay đổi thứ tự trong nhóm đồng hạng không? → A: Không; điểm không đổi nên lịch sử, hạng và thời điểm đạt tổng điểm không đổi (source: assumption — tránh "nhảy hạng" khó hiểu)
- [thay thế 2026-10-20] Q: Mục thuộc section bị ẩn có còn được cập nhật khi chấm lại hoặc công bố kết quả Bài thi không? → A: Có; thay đổi hiện trong dòng "Nội dung đã ẩn" (source: assumption — "giữ điểm" (X2) nghĩa là điểm vẫn đúng theo điểm hiện hành, không phải đóng băng)
- [thay thế 2026-10-20] Q: GV thấy gì với mục bị ẩn trên tab Xếp hạng? → A: Thấy đầy đủ, nhãn "Đã ẩn trong lớp"; cột Điểm bài tập/Điểm bài thi gồm cả mục bị ẩn (source: assumption — D1 GV là chủ dữ liệu; X2 chỉ giới hạn HV)
- [thay thế 2026-10-22 v11] Q: Sửa đáp án bộ bài tập sau khi đã có bài nộp thì sao? → A: Hệ thống chấm lại bài nộp cũ sau khi GV xác nhận; 008 tính lại lượt cao nhất, điểm có thể tăng hoặc giảm, ghi lịch sử "Điều chỉnh điểm"; mỗi Lớp tính riêng (source: stakeholder — X5)
- [thay thế 2026-10-20] Q: Bài thi có chấm lại không? → A: Không trong MVP; nội dung Bài thi khóa từ lượt làm đầu tiên, GV tạo phiên bản mới để sửa; điểm của phiên bản cũ theo 006 Q-4 (source: stakeholder — X5)
- [thay thế 2026-10-20] Q: Lịch mở/đóng Bài thi ảnh hưởng điểm thế nào? → A: Lịch đặt theo từng lớp (006/T04) chỉ quyết định Bài thi có hiển thị với HV; 008 tính điểm theo lượt chính thức khi kết quả được công bố (source: stakeholder — X4)
- Q: Đổi giáo trình của lớp có làm mất điểm đã đạt không? → A: Không xảy ra trong đề xuất hiện hành: 003 chỉ cho đổi giáo trình khi lớp chưa có bài nộp nào nên chưa có điểm nào bị ảnh hưởng; nhãn "Giáo trình cũ" bị bỏ và phần còn lại của Q-3 đóng. Nếu 003 chọn cho đổi khi đã có bài nộp, 008 phải mở lại câu hỏi này (source: assumption — dựa trên quy tắc hiện hành của 003)
- [thay thế 2026-10-20] Q: Một mục có điểm biến khỏi tầm nhìn của HV vì lý do khác ngoài ẩn section và lưu trữ (nếu 002/003/006 có) thì sao? → A: Xử lý như ẩn section: giữ điểm, gộp vào "Nội dung đã ẩn"; riêng Bài thi được thay thế theo quy định của 006 (source: assumption — điểm đã đạt không bao giờ mất âm thầm; nhất quán với X2)
- [thay thế 2026-10-20] Q: Lớp đã kết thúc có còn đổi điểm không khi không còn chấm tay? → A: Có, khi chấm lại do sửa đáp án hoặc khi kết quả Bài thi được công bố cho bài nộp trước khi lớp kết thúc; nhãn "Xếp hạng cuối cùng" giữ nguyên (source: assumption — tính đúng quan trọng hơn đóng băng)
- [thay thế 2026-10-20] Q: Tab Xếp hạng của GV thay cột "Số bài chờ chấm" và liên kết T13 bằng gì? → A: Bỏ cột và liên kết; thêm thông báo số Bài thi chưa công bố kết quả kèm liên kết "Xem kết quả thi" đến T16 (source: assumption — 007 hoãn; GV vẫn cần biết vì sao xếp hạng chưa gồm điểm thi)
- [thay thế 2026-10-20] Q: Chi tiết điểm sắp xếp thế nào? → A: Nhóm theo Bài theo thứ tự Bài trong Giáo trình, mỗi nhóm có tổng điểm của Bài; trong nhóm, bộ bài tập theo thứ tự của section Bài tập rồi đến Bài thi (source: assumption — khớp cấu trúc Bài mà HV thấy ở S02/S11)
- [thay thế 2026-10-20] Q: Bước học, lộ trình học, nội dung AI tạo có cộng điểm không? → A: Không cho bước học/lộ trình; bộ bài tập do AI tạo (010) chỉ tính sau khi GV xuất bản, như mọi bộ khác (source: assumption — D6: nháp không đến được HV; giữ nguyên quyết định Bài học 0 điểm)
- [thay thế 2026-10-20] Q: Hệ số ×1 / ×2 còn phù hợp với cấu trúc mới không? → A: Vẫn đề xuất ×1 / ×2 nhưng tỷ trọng Bài thi tăng lên ≈ 44% (giáo trình HSK1 15 Bài); Q-1 giữ mở, bổ sung phương án quy section Bài tập của mỗi Bài về 100 điểm (source: assumption — cần stakeholder xác nhận)
- [thay thế 2026-10-20] Q: Sĩ số dùng cho mục tiêu hiệu năng? → A: 100 HV mỗi Lớp theo giới hạn của 003 (thay cho 200 ở phiên trước); giáo trình lớn nhất 60 Bài × (5 bộ bài tập + 1 Bài thi) (source: assumption — nhất quán với giới hạn sĩ số của 003; dư cho HSK1–HSK9)
- [thay thế 2026-10-20] Q: (R1) Lượt Bài thi đang làm khi lớp kết thúc hoặc khi section Bài thi bị ẩn có được tính điểm không? → A: Có; lượt không bị cắt ngang, được nộp khi HV nộp hoặc hết giờ, và điểm được cộng khi kết quả được công bố; nếu section còn ẩn, điểm gộp vào "Nội dung đã ẩn" (source: assumption — cross-module alignment (orchestrator))
- [thay thế 2026-10-22] Q: (R4) Bộ bài tập bị lưu trữ thì điểm đã đạt ra sao? → A: Lưu trữ (002: Nháp → Đã xuất bản ⇄ Lưu trữ, áp dụng cho mọi lớp) được xử lý như nội dung đã ẩn: giữ điểm, HV chỉ thấy dòng "Nội dung đã ẩn", GV thấy nhãn "Đã lưu trữ"; khôi phục thì trở lại như cũ (source: assumption — cross-module alignment (orchestrator))
- [thay thế 2026-10-20] Q: (R7) Điểm của phiên bản Bài thi cũ khi được thay thế? → A: Phụ thuộc 006 Q-4; spec theo phương án đề xuất (a): khi phiên bản mới được xuất bản, điểm của phiên bản cũ bị trừ, lịch sử "Điều chỉnh điểm" kèm ghi chú "Bài thi được thay thế"; nếu 006 chọn (b) hoặc (c), phải sửa theo (source: assumption — cross-module alignment (orchestrator))
- [thay thế 2026-10-20] Q: (R7) Rủi ro của hệ số Q-1? → A: Bổ sung rủi ro 005 nêu (điểm bộ bài tập đo sự kiên trì vì làm lại không giới hạn và có phản hồi Đúng/Sai) vào phân tích Q-1; Q-1 vẫn mở (source: assumption — cross-module alignment (orchestrator))
- Q: (R7) Mục nào của phiên 2026-10-18 đã bị thay thế? → A: Gắn nhãn "[thay thế 2026-10-19]" cho các mục D2, D3 (chấm tay / Chờ chấm), A8 (chỉ ẩn), A10 (nay là X1) và lớp đã kết thúc (chấm muộn); giữ nguyên nội dung làm lịch sử (source: assumption — cross-module alignment (orchestrator))

### Session 2026-10-20

Áp dụng brief v3 (đơn giản hóa). Khi khác với các phiên trước, phiên này thay thế. REQ-3 cũ (Bài thi) bị bỏ; REQ-4…REQ-14 cũ thành REQ-3…REQ-13; AC-1.3 cũ (điểm Bài thi) và AC-11.5 cũ (thông báo bài thi chưa công bố) bị bỏ; các AC còn lại giữ thứ tự trong REQ (AC-1.4…1.6 cũ thành AC-1.3…1.5, AC-11.6 cũ thành AC-10.5). Chưa có artifact hạ nguồn và không module nào dẫn chiếu số AC của 008.

- [thay thế 2026-10-22 v11] Q: Ý kiến stakeholder ngày 2026-10-20? → A: Nguyên văn: "điều chỉnh lại spec — chỉ tracking học viên làm bài tập của buổi học chứ không tracking thời lượng và nội dung học" và "phần giáo trình tinh gọn lại sẽ chỉ có section bài học và bài tập, bỏ lộ trình và bài thi". Với 008: Điểm xếp hạng chỉ đến từ các bộ bài tập (lượt cao nhất của mỗi bộ, quy về 0–100); mọi quy tắc về Bài thi bị bỏ (source: stakeholder — V3-1, V3-2)
- [thay thế 2026-10-22] Q: Còn Bài thi, hệ số ×1 / ×2, chờ công bố kết quả, lượt chính thức, phiên bản Bài thi không? → A: Không; tất cả chuyển sang §9 "Hoãn (v3)" cùng 006; Q-1 đóng vì không còn gì để cân trọng số (source: stakeholder — V3-2; brief v3 §2)
- [thay thế 2026-10-22 v11] Q: Có giữ "hệ số bộ bài tập 1" không? → A: Bỏ khái niệm hệ số; điểm đóng góp = làm tròn(tỷ lệ lượt cao nhất × 100), 0–100 mỗi bộ bài tập (source: assumption — hệ số 1 không mang thông tin; Hiến chương IV)
- [thay thế 2026-10-22 v11] Q: Bài có 3 bộ bài tập nặng hơn Bài có 2 bộ, và làm lại không giới hạn khiến nhiều HV đạt tối đa — có cần cân lại hay mở câu hỏi mới? → A: Không; chấp nhận như hệ quả của quyết định tính theo từng bộ bài tập; đồng điểm được phá hòa theo thời điểm đạt tổng điểm (AC-6.2) (source: assumption — brief v3: bớt phạm vi, không thêm phạm vi mới)
- [thay thế 2026-10-22] Q: Tab Xếp hạng của GV còn những cột nào? → A: Hạng, Họ tên (+ "Đã khóa"), Email, Điểm xếp hạng, Cập nhật lần cuối; bỏ Điểm bài tập/Điểm bài thi (trùng Điểm xếp hạng khi chỉ còn bộ bài tập) và thông báo bài thi chưa công bố kèm liên kết kết quả thi (source: assumption — v3 bỏ Bài thi)
- [thay thế 2026-10-22] Q: Tóm tắt "Điểm của tôi" gồm gì? → A: Điểm xếp hạng, hạng, "Nội dung đã ẩn" (khi > 0) và "Bộ bài tập đã có điểm x/y"; trạng thái mỗi bộ chỉ còn Chưa làm / Đã có điểm (source: assumption — v3 bỏ Bài thi)
- [thay thế 2026-10-22 v11] Q: Lý do trong lịch sử điểm còn những gì? → A: "Điểm mới", "Cải thiện điểm", "Điều chỉnh điểm"; bỏ "Công bố kết quả bài thi" và "Đổi lượt được tính" (source: assumption — v3 bỏ Bài thi)
- Q: Việc xem bài học, thời lượng học có ảnh hưởng điểm không? → A: Không; không được theo dõi và không tạo điểm (AC-1.3) (source: stakeholder — V3-1)
- [thay thế 2026-10-22] Q: Ẩn section nào ảnh hưởng điểm? → A: Chỉ section Bài tập (giữ điểm, REQ-4); ẩn section Bài học không ảnh hưởng điểm và không ghi lịch sử (source: stakeholder — V3-2, D5, X2)
- [thay thế 2026-10-22] Q: Nội dung tạo bằng AI (010) được tính điểm khi nào? → A: Kết quả AI chưa được GV "Duyệt" không thuộc Bài, không đến HV và không tính; sau khi duyệt, bộ bài tập là nội dung thường và được tính khi HV thấy được theo quy tắc xuất bản của 002 (source: stakeholder — V3-4)
- [thay thế 2026-10-22] Q: Lớp đã kết thúc còn đổi điểm khi nào? → A: Khi lượt bắt đầu trước lúc kết thúc có điểm hoặc khi chấm lại do sửa đáp án; phạm vi chấm lại cho lớp đã kết thúc do 005 Q-2 quyết định (source: assumption — tính đúng quan trọng hơn đóng băng)
- [thay thế 2026-10-22] Q: Quy mô dùng cho mục tiêu hiệu năng? → A: 100 HV mỗi Lớp; giáo trình lớn nhất 60 Bài × 5 bộ bài tập = 300 bộ bài tập (source: assumption — bỏ Bài thi khỏi quy mô v2)
- [thay thế 2026-10-22] Q: Ví dụ tính dùng cấu trúc nào? → A: Giáo trình HSK1 gồm 15 Bài, mỗi Bài 2 section; section Bài tập có 2–3 bộ bài tập (8 Bài × 3 bộ + 7 Bài × 2 bộ = 38 bộ, tối đa 3.800 điểm) (source: assumption — brief v3)
- Q: Rà lại câu hỏi mở? → A: Q-1 đóng (moot); Q-2 (họ tên đầy đủ hay rút gọn trên S09) vẫn mở; Q-3 đã đóng từ v2 (source: assumption — brief v3 §4)

### Session 2026-10-20 (v4)

Áp dụng brief v4 (vòng hai, 2026-10-20). Khi khác với các phiên trước, phiên này thay thế. Thêm AC-7.6 vào cuối REQ-7 và AC-9.6 vào cuối REQ-9; cập nhật AC-7.1, AC-7.2, AC-9.1, AC-10.1 và NFR-7; không đánh số lại AC hiện có.

- [thay thế 2026-10-22] Q: Stakeholder bổ sung gì liên quan bảng xếp hạng? → A: Nguyên văn: "về phần setting profile học viên có thể change password, upload avt…, upload ảnh bìa, và show thông tin cá nhân như đang học lớp nào, tiến độ làm bài tập, và rank điểm đã làm bài thi trong lớp học đó, và các học viên có thể xem profile qua lại của nhau"; follow-up: xem hồ sơ = bạn cùng lớp, hồ sơ người khác chỉ hiện các lớp chung (không email/SĐT). V4-7: hồ sơ S10, S12 thuộc 011; S12 mở từ S09; vì Bài thi hoãn, "rank điểm đã làm bài thi" là hạng theo Điểm xếp hạng từ bộ bài tập của 008 (AC-7.6, AC-9.6) (source: stakeholder)
- Q: Chạm vào dòng nào trên S09 mở S12? → A: Dòng của bạn cùng lớp trong danh sách 10 hạng đầu mở S12 của bạn đó (AC-7.6) (source: stakeholder — V4-7 "Opened from the S09 leaderboard")
- Q: Dòng của chính HV và dòng "Vị trí của tôi" có mở gì không? → A: Mở S10 "Hồ sơ của tôi" thay cho S12 (AC-7.6) (source: assumption — theo quyết định của 011 (REQ-9 của 011) để mọi lối vào hồ sơ hành xử như nhau)
- Q: S09 hiển thị ảnh đại diện thế nào? → A: Mỗi dòng của 10 hạng đầu có ảnh đại diện cạnh tên, ảnh mặc định của 011 khi HV chưa có ảnh hoặc ảnh bị GV gỡ; ảnh đại diện là trường được phép gửi tới thiết bị HV (AC-7.1, AC-9.1, NFR-7) (source: stakeholder — V4-7 "upload avt"; vị trí và ảnh mặc định: assumption — đồng bộ với danh sách Thành viên của 003)
- Q: Bạn cùng lớp ngoài 10 hạng đầu có bị lộ hạng qua S12 không? → A: Có, và đó là ý của stakeholder ("rank điểm ... trong lớp học đó", "xem profile qua lại của nhau"), nhưng chỉ với bạn cùng lớp và chỉ các lớp chung (011); S09 vẫn chỉ hiển thị 10 hạng đầu; chi tiết điểm và lịch sử điểm vẫn riêng tư; hạng và điểm trên S10, S12 phải trùng với giá trị của 008 (AC-9.1, AC-9.3, AC-9.6). Thay mục "HV thấy bao nhiêu bạn cùng lớp?" của phiên 2026-10-18 (source: stakeholder — V4-7)
- Q: HV chưa được kích hoạt ("Chưa kích hoạt" hoặc "Gửi email thất bại") trong lớp ảnh hưởng S09 và tab Xếp hạng thế nào? → A: 0 điểm nên chưa có hạng và không hiện với HV khác; không tính vào N của "Hạng r/N"; GV thấy dòng của HV với nhãn trạng thái tương ứng (AC-7.2, AC-10.1) (source: assumption — 003 và 011 ẩn HV chưa được kích hoạt khỏi danh sách Thành viên nên N phải khớp số bạn cùng lớp HV có thể thấy)
- Q: Tab Xếp hạng của GV có ảnh đại diện và lối vào S12 không? → A: Có ảnh đại diện cạnh Họ tên (AC-10.1, theo REQ-12 của 011); không có lối vào S12 vì 011 không cho GV mở S10, S12 (REQ-10 của 011) — GV xem HV ở T15 qua "Xem hồ sơ học tập" (AC-10.2) (source: assumption — yêu cầu của orchestrator ngày 2026-10-20 về ảnh đại diện trên tab Xếp hạng; phần chạm mở S12 trên tab của GV được thay bằng T15 để không mâu thuẫn với 011)
- Q: AC-9.1 và NFR-7 ("chỉ 10 hạng đầu") có mâu thuẫn với S12 không? → A: Có nếu giữ nguyên, nên được sửa: S09 vẫn chỉ liệt kê 10 hạng đầu + dòng của mình; hạng và Điểm xếp hạng của mọi bạn có lớp học chung xem được trên S12; NFR-7 tách phạm vi S09 và S12 (AC-9.1, AC-9.6, NFR-7) (source: stakeholder — V4-7 "rank điểm ... trong lớp học đó", "xem profile qua lại của nhau")
- Q: A04 (đổi mật khẩu lần đầu) còn là điều kiện trước của S09 không? → A: Không; A04 bị bỏ, điều kiện trước chỉ còn "HV đã đăng nhập" (source: stakeholder — V4-6 "không bắt buộc đổi mật khẩu lần đầu")
- Q: Q-2 (họ tên đầy đủ hay rút gọn trên S09) đã đóng chưa? → A: Chưa; giữ mở. Hồ sơ S10, S12 của 011 cũng hiển thị họ tên đầy đủ nên đề xuất "họ tên đầy đủ" được củng cố (xem §11) (source: stakeholder — brief v4 §2 "008 Q-2 still open; profiles show the full name too")

### Session 2026-10-22 (v11)

Áp dụng brief v11 (một lần nộp cho mỗi bộ bài tập, xem lại bài làm kèm đáp án). Khi khác với các phiên trước, phiên này thay thế; X1 ("làm lại không giới hạn, tính lần cao nhất") bị thay thế. Không đánh số lại: REQ-12 (AC-12.1 … AC-12.6) bị bỏ và số không dùng lại; AC-2.2, AC-2.3, AC-3.3 viết lại nghĩa; thêm AC-7.7 và AC-11.7; sửa AC-1.2, AC-2.1, AC-2.4, AC-3.1, AC-4.2, AC-4.3, AC-4.6, AC-5.5, AC-9.1, AC-9.3, AC-9.6, AC-11.1, AC-11.4, AC-13.1, NFR-1, NFR-4, NFR-6, NFR-8; US-1, US-4, US-7 viết lại. Chưa có artifact hạ nguồn.

- Q: Ý kiến stakeholder ngày 2026-10-22? → A: Nguyên văn: "chỉ được làm bài tập 1 lần và tính điểm 1 lần, xong rồi sẽ được xem lại bài tập gồm đáp án và giải thích" và "view học viên bỏ phần lịch sử điểm, và phần điểm của tôi thì sẽ không có phần làm lại vì bài tập chỉ được làm 1 lần, và làm xong thì xem lại được phần kết quả làm + đáp án và giải thích". V11-1 (005) thay X1; V11-2 áp dụng cho 008 (source: stakeholder)
- Q: Điểm đóng góp của một bộ bài tập lấy từ đâu? → A: Từ Bài nộp duy nhất của HV cho bộ bài tập đó trong Lớp: làm tròn(điểm đạt ÷ điểm tối đa × 100), tính một lần khi nộp và chỉ đổi khi chấm lại; bỏ "lượt cao nhất", "lượt được tính", "lượt tốt hơn" (AC-1.2, AC-2.2) (source: stakeholder — V11-1, V11-2)
- Q: S09 còn phân đoạn "Lịch sử điểm" không? → A: Không; bỏ cả phân đoạn cùng "7 ngày qua", "Xem thêm", "Chưa có thay đổi điểm nào." và tên thay thế "Nội dung đã ẩn" trong lịch sử; REQ-12 bị bỏ; S09 chỉ còn "Xếp hạng" và "Điểm của tôi" (AC-7.7) (source: stakeholder — V11-2)
- Q: "Điểm của tôi" có làm lại hay gợi ý cải thiện điểm không? → A: Không có nút, liên kết hay gợi ý nào; chạm một bộ bài tập Đã có điểm mở S06 "Xem lại bài làm" (005) của Bài nộp duy nhất (AC-11.4, AC-11.7) (source: stakeholder — V11-2)
- [thay thế 2026-10-22] Q: Lý do "Cải thiện điểm" còn không? → A: Bỏ; mỗi thay đổi Điểm xếp hạng chỉ còn lý do "Điểm mới" hoặc "Điều chỉnh điểm", ghi trong nhật ký vận hành (NFR-8) (source: stakeholder — V11-2)
- Q: Phía GV giữ thông tin "Điều chỉnh điểm" nào? → A: Không thêm danh sách lịch sử hay nhãn mới cho GV. Chấm lại vẫn đổi điểm (REQ-3); GV thấy ghi chú chấm lại trên T14 (005 AC-19.5) và cột "Cập nhật lần cuối" đổi sang thời điểm chấm lại hoàn tất khi Điểm xếp hạng đổi (AC-3.3); mọi điều chỉnh có trong nhật ký "Điều chỉnh điểm" (NFR-8). HV thấy ghi chú chấm lại trên S06 (005) (source: assumption — brief V11-2 để 008 quyết định; chọn phương án ít phạm vi nhất (Hiến chương IV) vì 005 đã giải thích từng Bài nộp bị chấm lại trên S06/T14)
- Q: Nếu hệ thống nhận Bài nộp thứ hai cho cùng bộ bài tập (ví dụ bấm "Nộp" hai lần khi mạng chậm)? → A: Chỉ Bài nộp đã có được tính; không đổi Điểm xếp hạng, hạng hay thời điểm đạt tổng điểm (AC-2.3) (source: assumption — phòng thủ; 005 bảo đảm một lần nộp, 008 không cộng trùng)
- Q: Phá hòa, top 10, riêng tư, nội dung đã ẩn, quy tắc S12 có đổi không? → A: Không đổi; thứ tự đồng hạng vẫn theo "thời điểm đạt tổng điểm sớm hơn" (AC-6.2) (source: stakeholder — V11-2 "Tie-break"; orchestrator "Keep")
- Q: Bài nộp muộn được tính thế nào? → A: Đầy đủ như Bài nộp đúng hạn, theo 005 AC-23.2 (source: assumption — 008 không đổi theo quy tắc hạn nộp v8 của 005)
- Q: Mục tiêu "Khuyến khích làm lại" (≥ 30% HV có "Cải thiện điểm") và US-4 (lịch sử điểm) thay bằng gì? → A: Mục tiêu "Khuyến khích hoàn thành bộ bài tập" (tỷ lệ "x/y" trung bình ≥ 60% sau 4 tuần); US-4 thành "mở lại bài làm đã nộp từ Điểm của tôi" (P2) (source: assumption — làm lại không còn tồn tại; giữ số US để không đổi dẫn chiếu)
- [thay thế 2026-10-22] Q: Ví dụ tính đổi thế nào? → A: Mỗi bộ bài tập có đúng một Bài nộp; số liệu Ví dụ 1 giữ nguyên (An 498 điểm); F-3 dùng Bài nộp duy nhất của An 17/20 → 16/20 (85 → 80) và của Bình 15/20 → 16/20 (75 → 80) (source: assumption — giữ số liệu để các luồng vẫn khớp nhau)

### Session 2026-10-22 (đồng bộ prototype)

- Q: Tab Xếp hạng của GV có liệt kê HV chưa được kích hoạt không? → A: Không — như prototype, chỉ HV đã kích hoạt (kể cả "Đã khóa"); GV xem HV "Chưa kích hoạt" / "Gửi email thất bại" ở tab Học viên (003 AC-8.7, AC-8.9) — AC-10.1, §8. (source: stakeholder "cứ sửa spec theo prototype")

### Session 2026-10-22 (điểm 30/70)

Áp dụng quyết định của stakeholder ngày 2026-10-22 về công thức Điểm xếp hạng. Khi khác với các phiên trước, phiên này thay thế; mô hình "tổng điểm các bộ bài tập" bị bỏ. Không đánh số lại và không bỏ mã AC nào. Thêm AC-1.6 … AC-1.11, AC-2.5 … AC-2.9, AC-4.7 … AC-4.9, AC-5.6, AC-6.6, AC-11.8 … AC-11.10, AC-13.5 (20 AC mới); viết lại AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-3.1, AC-3.2, AC-3.3, AC-4.1, AC-4.2, AC-4.3, AC-4.5, AC-4.6, AC-5.2, AC-5.5, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-7.1, AC-9.1, AC-10.1, AC-10.2, AC-11.1, AC-11.2, AC-11.3, AC-11.5, AC-11.6, AC-11.7, AC-13.1; viết lại NFR-1, NFR-2, NFR-3, NFR-4, NFR-7, NFR-8; viết lại §1, §2, §3, US-1, US-3, US-5 … US-8, thêm US-9; §7–§10 viết lại. Chưa có artifact hạ nguồn.

- Q: Quy tắc tính Điểm xếp hạng mới? → A: Nguyên văn: "quy tắc tính điểm xếp hạng: điểm làm những bài tập trên lớp cộng lại chia trung bình chiếm 30%, điểm của những bài thi cộng lại chia trung bình chiếm 70%, tổng 2 điểm này lại ra final xếp hạng." → Điểm xếp hạng = 30% × TB bài tập + 70% × TB bài thi, thang 0–100 (AC-1.1, AC-1.6, AC-1.7) (source: stakeholder)
- Q: Bộ bài tập nào được làm và được tính? → A: Nguyên văn: "bài tập thì vẫn hiện full nhưng sẽ chỉ enable bài tập nào GV đã set deadline trước đó thì mới có thể làm được và tính điểm" → chỉ bộ bài tập có Hạn nộp trong lớp làm được (003/005) và được tính; bộ không có Hạn nộp không có trong "Điểm của tôi" (AC-1.8, AC-1.11) (source: stakeholder)
- Q: Trung bình gồm những mục nào? → A: Một bộ bài tập / bài thi được tính cho HV khi HV đã nộp (điểm của bài nộp), hoặc khi Hạn nộp / giờ đóng đã qua mà HV chưa nộp (= 0); chưa có mục nào được tính thì TB đó bằng 0; nhờ vậy mọi HV trong lớp có cùng mẫu số (AC-1.6 … AC-1.9, AC-2.5, AC-2.8) (source: stakeholder)
- Q: Bài thi trong công thức là gì? → A: Bài thi của module 006 (được đưa trở lại, độc lập với Bài): giao cho lớp, lịch = giờ mở + thời lượng + giờ đóng, một lượt làm, có điểm ngay sau khi nộp; 008 quy điểm về 0–100 như bộ bài tập (AC-1.2, AC-1.9, AC-2.7) (source: stakeholder — brief của orchestrator 2026-10-22)
- Q: Nộp muộn bộ bài tập tính thế nào trong mô hình mới? → A: Như trước, tính đầy đủ; nếu bộ đã bị tính 0 vì Quá hạn, điểm Bài nộp thay cho 0 và mục có nhãn "Nộp muộn" (AC-2.6, AC-11.1) (source: stakeholder — V8-1, brief 2026-10-22 "late submissions count fully")
- Q: Độ chính xác hiển thị và cách làm tròn? → A: Điểm mỗi bộ bài tập / bài thi vẫn là số nguyên 0–100 (0,5 làm tròn lên); TB bài tập và TB bài thi làm tròn một chữ số thập phân (0,05 làm tròn lên); Điểm xếp hạng tính từ hai TB đã làm tròn rồi làm tròn một chữ số thập phân; hiển thị dấu phẩy thập phân ("75,9"); xếp hạng và so bằng điểm trên giá trị đã làm tròn (AC-1.10, AC-6.1) (source: assumption — HV và GV tính tay lại được đúng từ các số hiển thị (REQ-13, AC-1.5); một chữ số thập phân đủ phân biệt HV trong lớp 100 người mà không tạo độ chính xác giả; so trên giá trị hiển thị để không có "đồng điểm mà khác hạng")
- Q: Bộ bài tập đã nộp thuộc section bị ẩn hoặc đã lưu trữ? → A: Vẫn được tính với điểm của Bài nộp (AC-4.1, AC-4.6) (source: assumption — "không bao giờ mất dữ liệu học tập"; X2 giữ điểm đã đạt)
- Q: Bộ bài tập chưa nộp thuộc section bị ẩn hoặc đã lưu trữ, kể cả đã Quá hạn? → A: Không được tính (0 điểm Quá hạn bị bỏ khỏi trung bình) cho tới khi hiện lại / khôi phục; hệ quả: ẩn section có thể làm tăng điểm của HV chưa nộp, không bao giờ làm giảm điểm của ai (AC-4.2, AC-4.5) (source: assumption — HV không còn nộp được nội dung đã ẩn nên phạt 0 là không công bằng; brief của orchestrator)
- Q: GV gỡ hoặc đổi Hạn nộp sau khi đã có bài nộp? → A: Gỡ: bài đã nộp vẫn được tính, HV chưa nộp thôi bị tính 0. Đổi: xác định lại 0 điểm theo Hạn nộp mới (AC-4.7, AC-4.8) (source: assumption — giữ kết quả đã nộp; Hạn nộp hiện hành là căn cứ duy nhất)
- Q: Bài thi bị gỡ khỏi lớp hoặc lưu trữ? → A: Bài đã nộp vẫn được tính, HV chưa nộp thôi bị tính 0; HV thấy một dòng "Bài thi đã gỡ: k bài thi · S điểm" (AC-4.9, AC-11.10) (source: assumption — nhất quán với ẩn section và lưu trữ bộ bài tập)
- Q: HV vào lớp muộn (hoặc bị gỡ rồi thêm lại)? → A: Mục có Hạn nộp / giờ đóng qua khi HV không là thành viên của lớp không bị tính 0 cho HV đó; HV vẫn có thể nộp muộn bộ bài tập và khi đó bộ được tính (AC-1.8, AC-1.9, AC-5.2, AC-5.6) (source: assumption — không phạt HV vì bài giao trước khi họ vào lớp; dùng "là thành viên tại thời điểm hạn qua" thay vì "lần thêm gần nhất" để gỡ rồi thêm lại không xóa được 0 điểm cũ)
- Q: Bài thi đang làm dở lúc giờ đóng? → A: Bị tính 0 khi giờ đóng qua; nếu 006 ghi nhận bài nộp của lượt đã bắt đầu trước giờ đóng thì điểm bài nộp thay cho 0 (AC-2.8, AC-2.9) (source: assumption — nhất quán với nộp muộn bộ bài tập; việc lượt làm có tiếp tục qua giờ đóng do 006 quyết định)
- Q: Ai chưa có hạng và phá hòa thế nào? → A: Giữ REQ-6: HV có Điểm xếp hạng (đã làm tròn) 0,0 — kể cả chưa có mục nào được tính — chưa có hạng; đồng hạng xếp theo thời điểm đạt Điểm xếp hạng hiện tại, rồi tên, họ tên, email; thời điểm đạt = lần gần nhất Điểm xếp hạng hiển thị thay đổi, kể cả thời điểm Hạn nộp / giờ đóng và thao tác của GV ở REQ-4 (AC-6.1, AC-6.3, AC-6.6) (source: assumption — giữ quy tắc đã có, mở rộng cho các sự kiện mới)
- Q: Dòng "Nội dung đã ẩn" có cần số bộ? → A: Có: "Nội dung đã ẩn: k bộ bài tập · S điểm" (và "Bài thi đã gỡ: k bài thi · S điểm"), vẫn không có tên, trạng thái hay điểm từng mục; thay mục "Điểm của nội dung bị ẩn hiển thị cho HV thế nào?" của phiên 2026-10-19 (AC-11.3, AC-11.10) (source: assumption — trung bình cần cả mẫu số để HV tự tính lại (AC-1.5); số lượng không lộ nội dung bị ẩn)
- Q: S09 có cho thấy TB bài tập, TB bài thi của bạn cùng lớp không? → A: Không; chỉ Điểm xếp hạng (AC-9.1, NFR-7) (source: assumption — tối thiểu dữ liệu chia sẻ; thành phần điểm là chi tiết điểm)
- Q: Lớp chưa có bài thi nào? → A: TB bài thi = 0 nên Điểm xếp hạng tối đa 30,0 cho tới khi có bài thi được tính; "Cách tính điểm" và phép tính trong tóm tắt nêu rõ (AC-1.7, AC-13.1, AC-13.5) (source: stakeholder — "If nothing counts yet, that average is 0"; hệ quả ghi lại để GV biết)
- Q: Tab Xếp hạng của GV có những cột nào? → A: Hạng, ảnh đại diện, Họ tên (+ "Đã khóa"), Email, TB bài tập, TB bài thi, Điểm xếp hạng, Cập nhật lần cuối; dòng mở rộng gồm nhóm Bài tập và nhóm Bài thi, mục không được tính ghi "Không tính"; thay mục "Tab Xếp hạng của GV còn những cột nào?" của phiên 2026-10-20 (AC-10.1, AC-10.2) (source: assumption — GV cần thấy thành phần để giải thích điểm cho HV)
- Q: "Điểm của tôi" gồm gì? → A: Tóm tắt (Điểm xếp hạng, hạng, TB bài tập + số bộ, TB bài thi + số bài, phép tính 30/70, "Bộ bài tập đã nộp x/y" với y = bộ đang hiển thị có Hạn nộp); nhóm "Bài tập" theo Bài (Chưa làm / Đã có điểm / Quá hạn, "Nộp muộn"), không còn tổng điểm theo Bài; nhóm "Bài thi" (Chưa thi / Đã có điểm / Không làm bài); thay mục "Tóm tắt Điểm của tôi gồm gì?" của phiên 2026-10-20 (AC-11.1, AC-11.2, AC-11.8, AC-13.5) (source: assumption — minh bạch theo REQ-13)
- Q: Lý do trong nhật ký vận hành? → A: "Điểm mới" (bài nộp có điểm), "Quá hạn" (0 điểm do Hạn nộp / giờ đóng qua), "Điều chỉnh điểm" (chấm lại), "Thay đổi nội dung" (ẩn/hiện, lưu trữ/khôi phục, đặt/đổi/gỡ Hạn nộp, gỡ bài thi, thay đổi thành viên) (NFR-8) (source: assumption — mỗi thay đổi Điểm xếp hạng truy được nguyên nhân)
- Q: Ví dụ tính đổi thế nào? → A: Ví dụ 1 (An, lớp HSK1-K12, 20/11): 7 bộ bài tập được tính tổng 498 → TB bài tập 71,1; 2 bài thi (84, 72) → TB bài thi 78,0; Điểm xếp hạng 30% × 71,1 + 70% × 78,0 = 75,9. Mốc thời gian các luồng: chấm lại 14/11 (F-3: 79,7 → 79,5), Hạn nộp "Đọc hiểu" 15/11 (F-8: 79,5 → 75,9), ẩn Bài 3 ngày 18/11 (F-2: An giữ 75,9, Dũng 67,4 → 70,5) (source: assumption — giữ số liệu cũ (498) để dễ đối chiếu)
- Q: Quy mô hiệu năng? → A: 100 HV, 300 bộ bài tập có Hạn nộp và 50 bài thi mỗi Lớp (NFR-2, NFR-4) (source: assumption — dư cho một khóa HSK; 006 chưa nêu số bài thi tối đa)

### Session 2026-10-29

/sdd-clarify tương tác; người dùng chọn phương án đề xuất cho cả 4 câu. Không đánh số lại, không bỏ mã AC nào. Thêm AC-1.12, AC-5.7, AC-11.11, AC-11.12; viết lại AC-1.1, AC-1.2, AC-1.8, AC-1.9, AC-2.3, AC-2.5, AC-2.7, AC-2.8, AC-3.2, AC-5.2, AC-5.6, AC-9.1, AC-11.8, AC-11.9; cập nhật §1, §7 (thêm "HV đã kích hoạt"), §8, §10; §11 không còn câu hỏi mở. Ghi vào docs/steering/decisions.md (V21-1 … V21-4). Chưa có artifact hạ nguồn.

- Q: Một bài thi giao cho nhiều Lớp mà HV cùng thuộc — bài nộp duy nhất được tính ở Lớp nào? → A: Ở mọi Lớp được giao mà HV đang là thành viên, kể cả Lớp HV được thêm vào sau khi nộp (đúng 006 AC-13.4); Bài nộp bộ bài tập vẫn tính theo từng Lớp. Thay câu chữ "bài nộp … trong chính Lớp đó" cho bài thi (AC-1.1, AC-1.2, AC-1.9, AC-1.12, AC-2.3, AC-2.7, AC-3.2, AC-5.2, AC-5.6) (source: user — /sdd-clarify 2026-10-29, phương án A "Mọi lớp HV đang thuộc")
- Q: Q-2 — Trên S09, bạn cùng lớp thấy họ tên đầy đủ hay tên rút gọn "An N."? → A: Họ tên đầy đủ như GV đã nhập, giống S10/S12 của 011 và prototype S09; Q-2 đóng (AC-9.1) (source: user — /sdd-clarify 2026-10-29, phương án A "Họ tên đầy đủ")
- Q: HV "Chưa kích hoạt" / "Gửi email thất bại" có bị tính 0 cho Hạn nộp, giờ đóng qua trước khi được kích hoạt không? → A: Không; như HV vào lớp muộn: 0 điểm chỉ áp cho Hạn nộp / giờ đóng qua khi HV là thành viên đã kích hoạt (kể cả "Đã khóa"); mục qua trước khi kích hoạt không tính 0, nộp muộn bộ bài tập thì được tính. "Đã kích hoạt" định nghĩa một lần ở §7, cùng tập với AC-7.2 và AC-10.1 (không gồm "Chưa kích hoạt" và "Gửi email thất bại"); nhất quán với 006 AC-13.3 (AC-1.8, AC-1.9, AC-2.5, AC-2.8, AC-5.2, AC-5.7, §8) (source: user — /sdd-clarify 2026-10-29, phương án A "Như HV vào muộn")
- Q: Dòng bài thi trong "Điểm của tôi" mở gì, và bài thi đã đóng trước khi HV vào lớp có được liệt kê không? → A: Theo prototype: dòng "Đã có điểm" mở kết quả trên S08 (006); dòng "Chưa thi" và "Không làm bài" không chọn được; bài thi đã qua giờ đóng mà không được tính cho HV (vào lớp sau giờ đóng, không có bài nộp) không được liệt kê (AC-11.8, AC-11.9, AC-11.11, AC-11.12) (source: user — /sdd-clarify 2026-10-29, phương án A "Theo prototype")
