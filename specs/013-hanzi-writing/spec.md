---
id: 013
slug: hanzi-writing
title: Hanzi writing practice
status: draft
branch: feat/013-hanzi-writing
created: 2026-10-22
updated: 2026-10-22
approved_by:
approved_at:
---

# Hanzi writing practice (Luyện viết chữ Hán)

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

Người học tiếng Trung khó nhớ mặt chữ và hay viết sai thứ tự, sai hướng nét vì trên lớp không ai sửa từng nét cho
từng người; hiện họ tự tập trên giấy theo sách hoặc dùng ứng dụng ngoài. Theo quyết định của stakeholder ngày
2026-10-22 (V14, V15), module này thêm một tính năng **tự học** chỉ dành cho **Học viên (HV)** — mọi HV đã kích hoạt
của workspace, không cần lớp: màn hình **S16 "Luyện viết chữ Hán"**, mở từ trang **S13 "Tự học"** (012). **Giáo viên
(GV) không dùng S16**; GV chỉ quản lý dữ liệu chữ trong "Kho nội dung tự học" của workspace mình (016, T23–T27). Người
dùng chọn chữ theo cấp HSK, theo bộ thủ, từ một từ hoặc bộ từ của 012, hoặc tìm chữ; xem **minh họa thứ tự nét**
(phát lại, tốc độ, từng nét, số thứ tự nét); luyện **"Tô theo mẫu"** và **"Viết từ trí nhớ"** trong khung 田字格 / 米字格,
trong đó **từng nét được kiểm tra ngay với nét mẫu** (thứ tự, hướng, vị trí và hình dạng gần đúng), có gợi ý sau 3 lỗi
liên tiếp và nhận xét "Tốt" / "Cần luyện thêm" cho mỗi chữ; xem bộ thủ, thành phần, loại cấu tạo và mẹo nhớ; và tự ôn
qua "Lịch sử" và "Chữ cần luyện". Dữ liệu chữ lấy từ Kho nội dung tự học của workspace của HV (016: nạp sẵn bộ nội
dung HSK mẫu, GV sửa / thêm / ẩn tùy ý). Dữ liệu luyện viết là **riêng tư của từng HV**, GV không xem được và không ảnh hưởng xếp hạng hay dashboard của lớp. Nhận diện chữ viết tự do và
gợi ý sửa lỗi bằng AI thuộc **giai đoạn 2**.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Người học dùng tính năng | Tỷ lệ HV đã đăng nhập trong tháng hoàn thành ít nhất 1 lượt viết trên S16 | ≥ 25% sau 60 ngày ra mắt |
| Viết đúng thứ tự nét | Tỷ lệ chữ trong "Chữ cần luyện" được bỏ khỏi danh sách nhờ một lượt "Viết từ trí nhớ" đạt "Tốt" trong 14 ngày kể từ khi vào danh sách | ≥ 50% |
| Kiểm tra nét đáng tin | Tỷ lệ nét viết đúng bị từ chối trên bộ kiểm thử chuẩn (NFR-6) | ≤ 5% |
| Phản hồi tức thì | Thời gian từ khi nhấc nét tới khi có phản hồi | p95 ≤ 100 ms (NFR-1) |
| Dễ dùng trên điện thoại | Người dùng mới hoàn thành chữ đầu tiên ở "Tô theo mẫu" không cần trợ giúp | ≥ 9/10 người trong kiểm thử khả dụng (NFR-7) |
| Riêng tư | Số dữ liệu luyện viết của một tài khoản hiển thị cho tài khoản khác hoặc làm đổi chỉ số lớp | 0 (NFR-9) |

## 3. Actors & Context

- **Học viên (HV)** — tài khoản do GV tạo và kích hoạt (001); dùng điện thoại là chính (360–430 px), viết bằng ngón
  tay. Dùng S16 bất kỳ lúc nào, kể cả khi chưa thuộc hoặc không còn thuộc lớp nào, để nhớ mặt chữ của bài đang học, ôn
  chữ của một cấp HSK, hoặc luyện chữ của từ vựng đã lưu ở 012. Khi HV dùng trình duyệt rộng (máy tính, viết bằng
  chuột hoặc bút cảm ứng), S16 hiển thị bố cục rộng ("HV trên màn hình rộng", AC-1.5). Trong spec này **"người dùng"
  luôn là một HV**.
- **Giáo viên (GV)** — chủ workspace, dùng máy tính (≥ 1280 px). **Không dùng S16** (V15): không có lối vào, mở bằng
  đường dẫn trực tiếp thì thấy A05 (AC-1.4), không có dữ liệu luyện viết riêng. GV quản lý dữ liệu chữ và bộ thủ trong
  "Kho nội dung tự học" của workspace (016, T23–T27) và xem trước thứ tự nét ngay trong T23–T27. GV **không** xem được
  dữ liệu luyện viết của HV và không giao bài luyện viết trong MVP.
- **Kho nội dung tự học của workspace (016)** — nguồn duy nhất của dữ liệu chữ cho HV của workspace, khởi tạo từ bộ nội
  dung HSK mẫu rồi do GV sở hữu: chữ Hán giản thể, pinyin, nghĩa tiếng Việt, cấp HSK, số nét, nét mẫu theo thứ tự (hình
  nét và đường giữa có hướng), tên nét (nếu có), bộ thủ, thành phần, loại cấu tạo, mẹo nhớ (nếu có), các nét thuộc bộ
  thủ (nếu có), và danh sách bộ thủ. Trong spec này "kho" luôn là kho của workspace của HV; HV không thấy kho của
  workspace khác.
- **Hiện nay** người học tự viết trên giấy theo sách hoặc dùng ứng dụng bên ngoài; không ai kiểm tra thứ tự và hướng
  nét của từng người.

## 4. User Stories

- US-1 (P1): Là HV, tôi muốn chọn một chữ theo cấp HSK hoặc bằng tìm kiếm và xem minh họa thứ tự nét (phát
  lại, đổi tốc độ, xem từng nét có số thứ tự), để biết viết chữ đúng thứ tự và hướng.
  - Why this priority: là nền của mọi chế độ khác và là phần "Hướng dẫn thứ tự các nét" của yêu cầu V14.
  - Independent test: HV mở S13 → "Luyện viết chữ Hán" → tab "Theo cấp HSK" → "HSK 1" → chạm 你 → màn hình luyện
    hiển thị "nǐ", "bạn", "HSK 1", "7 nét", minh họa tự vẽ 7 nét theo thứ tự với số thứ tự; "Từng nét" → "Nét 3/7".
- US-2 (P1): Là HV, tôi muốn tô theo đường viền mẫu và được báo ngay khi một nét sai thứ tự, sai hướng hoặc
  lệch, để sửa thói quen viết sai từ đầu.
  - Why this priority: là "Khung luyện viết trực tiếp trên màn hình" có kiểm tra từng nét — giá trị cốt lõi của MVP.
  - Independent test: ở 你 chế độ "Tô theo mẫu", người dùng viết nét 2 trước nét 1 → "Sai thứ tự nét — nét này chưa
    đến lượt.", vệt mực đỏ biến mất; viết đúng 7 nét → kết quả "Tốt · Số lỗi: 1 · Gợi ý: 0".
- US-3 (P1): Là HV, tôi muốn viết chữ từ trí nhớ khi chỉ thấy pinyin và nghĩa, có gợi ý khi bí, rồi nhận nhận
  xét và chuyển sang chữ tiếp theo, để ghi nhớ mặt chữ.
  - Why this priority: là phần "ghi nhớ mặt chữ" và "gợi ý sửa lỗi" (theo nét) của V14.
  - Independent test: danh sách luyện HSK 1, chữ 好 chế độ "Viết từ trí nhớ": màn hình hiển thị "hǎo", "tốt, hay",
    "6 nét", không hiển thị 好; viết sai nét 1 ba lần liên tiếp → đường viền nét 1 hiện kèm hướng viết; hoàn thành →
    "Cần luyện thêm · Số lỗi: 3 · Gợi ý: 1", chữ vào "Chữ cần luyện"; "Chữ tiếp theo" mở chữ kế tiếp.
- US-4 (P2): Là HV, tôi muốn xem bộ thủ, thành phần, loại cấu tạo và mẹo nhớ của chữ và luyện theo danh sách
  bộ thủ, để hiểu cấu tạo chữ và nhớ lâu hơn.
  - Why this priority: là phần "Luyện bộ thủ, cấu tạo chữ" của V14; S16 vẫn dùng được khi chỉ có US-1 đến US-3.
  - Independent test: tab "Bộ thủ" → nhóm "4 nét" → 水 · 氵 (bộ Thủy) → trang chi tiết với "Luyện viết bộ này" và các chữ
    thuộc bộ theo cấp HSK; chạm 没 → màn hình luyện; "Cấu tạo chữ" hiển thị "Trái – phải".
- US-5 (P2): Là HV, tôi muốn luyện viết các chữ của một từ hoặc của bộ từ vựng cá nhân ở 012, để luyện đúng những chữ
  tôi đang học.
  - Why this priority: nối hai tính năng tự học; cần 012 có nút "Luyện viết".
  - Independent test: HV chọn "Luyện viết" ở từ 妈妈 trên 012 → danh sách luyện chỉ có 妈 ("Chữ 1/1"); chọn "Luyện viết"
    ở một bộ 20 từ → danh sách luyện gồm các chữ khác nhau của bộ theo thứ tự xuất hiện.
- US-6 (P2): Là HV, tôi muốn xem lịch sử luyện viết và danh sách "Chữ cần luyện" rồi luyện lại cả danh sách,
  để tập trung vào chữ tôi còn viết sai.
  - Why this priority: tạo vòng ôn tập; S16 vẫn dùng được khi chưa có.
  - Independent test: sau một lượt "Cần luyện thêm" ở 好, tab "Chữ cần luyện (1)" có 好; "Luyện tất cả" → "Viết từ
    trí nhớ" → đạt "Tốt" → 好 rời danh sách, tab "Lịch sử" ghi "Đã luyện 2 lần".
- US-7 (P1): Là HV, tôi muốn dữ liệu luyện viết của tôi là riêng tư và không ảnh hưởng điểm lớp, để tự luyện thoải mái
  mà không sợ GV hay bạn cùng lớp đánh giá.
  - Why this priority: điều kiện của stakeholder (V14, V15); sai phân quyền là lỗi riêng tư.
  - Independent test: HV luyện 10 chữ; GV của lớp mở T04, T15, T23–T27 và mọi màn hình GV → không có dữ liệu luyện
    viết nào; GV mở S16 bằng đường dẫn trực tiếp → A05; Điểm xếp hạng và tiến độ của HV ở 008/009 không đổi; tài khoản
    khác mở đường dẫn dữ liệu luyện viết của HV → A05.
- US-8 (P2): Là HV thuận tay trái, dùng bút trên máy tính bảng hoặc dùng trình đọc màn hình, tôi muốn S16 thích
  ứng với cách tôi dùng, để vẫn học được thứ tự nét.
  - Why this priority: trợ năng cơ bản thuộc NFR-8; các tùy chọn bổ sung có thể ra sau P1.
  - Independent test: bật "Thuận tay trái" → thanh công cụ dồn về bên trái; với trình đọc màn hình, "Danh sách nét"
    của 你 đọc "Nét 1: Phẩy, từ trên phải xuống dưới trái" … và mỗi nét viết được thông báo "Đúng nét 1".

## 5. Functional Requirements

### REQ-1: Access and entry — Truy cập và lối vào S16

<!-- Story: US-1, US-7 · Priority: P1 · Screens: S13 (012), S16, A01, A05 -->

- AC-1.1: WHEN HV đã đăng nhập chọn thẻ "Luyện viết" trên S13 "Tự học" (012) THE SYSTEM SHALL mở trang chính của S16 "Luyện viết chữ Hán" gồm ô tìm kiếm "Tìm chữ Hán, pinyin hoặc nghĩa" và bốn tab "Theo cấp HSK", "Bộ thủ", "Chữ cần luyện ({n})" và "Lịch sử", với tab "Theo cấp HSK" được chọn sẵn.
- AC-1.2: THE SYSTEM SHALL cho mọi tài khoản HV đã kích hoạt và không bị khóa dùng toàn bộ chức năng của S16 trên dữ liệu chữ của Kho nội dung tự học thuộc workspace của GV đã tạo tài khoản HV đó (016), không phụ thuộc HV có thuộc lớp nào hay lớp đã kết thúc.
- AC-1.3: IF người chưa đăng nhập mở S16 (kể cả đường dẫn trực tiếp tới một chữ) THEN THE SYSTEM SHALL chuyển đến A01 và, sau khi đăng nhập thành công bằng tài khoản HV, mở lại đúng màn hình đã yêu cầu.
- AC-1.4: IF tài khoản GV mở S16 (kể cả đường dẫn trực tiếp tới một chữ hoặc sau khi đăng nhập theo AC-1.3) THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." và không hiển thị dữ liệu chữ hay dữ liệu luyện viết nào.
- AC-1.5: THE SYSTEM SHALL hiển thị S16 theo bố cục điện thoại ở chiều rộng 360–430 px và, cho HV trên màn hình rộng, theo bố cục rộng ở chiều rộng ≥ 1024 px, với cùng chức năng ở cả hai bố cục.
- AC-1.6: WHEN người dùng mở đường dẫn trực tiếp tới một chữ trên S16 THE SYSTEM SHALL mở màn hình luyện của chữ đó với danh sách luyện chỉ gồm chữ đó.
- AC-1.7: IF HV mở đường dẫn trực tiếp tới một chữ không có trong Kho nội dung tự học của workspace của HV (kể cả chữ chỉ có trong kho của workspace khác) THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." giống hệt chữ không tồn tại.

### REQ-2: Choose by HSK level — Chọn chữ theo cấp HSK

<!-- Story: US-1 · Priority: P1 · Screens: S16 -->

- AC-2.1: WHEN người dùng chọn tab "Theo cấp HSK" THE SYSTEM SHALL hiển thị 7 nút cấp theo kho 016: "HSK 1" đến "HSK 6" và "HSK 7–9", với cấp người dùng chọn lần gần nhất được chọn sẵn (lần đầu: "HSK 1").
- AC-2.2: WHEN người dùng chọn một cấp HSK THE SYSTEM SHALL liệt kê mọi chữ có dữ liệu nét mà kho gán cho cấp đó theo thứ tự của kho, kèm tổng "{n} chữ", mỗi chữ hiển thị chữ Hán, pinyin và nhãn trạng thái luyện của chính người dùng theo AC-13.5.
- AC-2.3: WHEN người dùng chạm một chữ trong danh sách của một cấp HSK THE SYSTEM SHALL mở màn hình luyện của chữ đó với danh sách luyện là toàn bộ danh sách của cấp đó theo cùng thứ tự, bắt đầu từ chữ được chạm, và hiển thị "Chữ {k}/{n}".
- AC-2.4: IF cấp HSK được chọn chưa có chữ nào có dữ liệu nét THEN THE SYSTEM SHALL hiển thị "Cấp này chưa có chữ nào để luyện viết."

### REQ-3: Search a character — Tìm chữ

<!-- Story: US-1 · Priority: P1 · Screens: S16 -->

- AC-3.1: WHEN người dùng nhập vào ô "Tìm chữ Hán, pinyin hoặc nghĩa" ít nhất 1 chữ Hán hoặc ít nhất 2 ký tự khác THE SYSTEM SHALL hiển thị tối đa 50 chữ của kho khớp với nội dung nhập, sắp theo cấp HSK tăng dần rồi theo thứ tự của kho, mỗi kết quả gồm chữ Hán, pinyin, nghĩa tiếng Việt, cấp HSK và nhãn trạng thái luyện theo AC-13.5.
- AC-3.2: THE SYSTEM SHALL coi một chữ là khớp khi nội dung nhập chứa chính chữ đó, hoặc trùng một cách đọc pinyin của chữ (viết có dấu thanh, có số thanh như "hao3" hoặc không dấu, không phân biệt hoa thường), hoặc là một phần nghĩa tiếng Việt của chữ (không phân biệt hoa thường và dấu tiếng Việt).
- AC-3.3: WHEN nội dung nhập gồm từ 2 chữ Hán trở lên (ví dụ "你好") THE SYSTEM SHALL liệt kê các chữ đó trước mọi kết quả khác theo thứ tự xuất hiện, mỗi chữ một lần, kèm nút "Luyện cả {n} chữ" mở danh sách luyện gồm các chữ có dữ liệu nét trong số đó theo cùng thứ tự.
- AC-3.4: IF không có chữ nào khớp THEN THE SYSTEM SHALL hiển thị "Không tìm thấy chữ phù hợp. Hãy thử chữ Hán giản thể, pinyin hoặc nghĩa tiếng Việt."
- AC-3.5: WHEN người dùng chạm một kết quả tìm kiếm THE SYSTEM SHALL mở màn hình luyện của chữ đó với danh sách luyện chỉ gồm chữ đó.

### REQ-4: Practise from vocabulary (012) — Luyện viết từ một từ hoặc bộ từ vựng cá nhân

<!-- Story: US-5 · Priority: P2 · Screens: S14, S15 (012), S16 -->

- AC-4.1: WHEN người dùng chọn "Luyện viết" ở một từ trên màn hình của 012 THE SYSTEM SHALL mở màn hình luyện của S16 với danh sách luyện gồm các chữ Hán của từ đó theo thứ tự trong từ, mỗi chữ một lần, và hiển thị từ đó cùng pinyin và nghĩa của từ ở đầu màn hình luyện.
- AC-4.2: WHEN người dùng chọn "Luyện viết" ở một bộ từ vựng cá nhân của 012 THE SYSTEM SHALL mở màn hình luyện với danh sách luyện gồm các chữ Hán của mọi từ trong bộ theo thứ tự từ trong bộ rồi thứ tự chữ trong từ, mỗi chữ chỉ giữ lần xuất hiện đầu tiên.
- AC-4.3: IF danh sách luyện tạo từ một từ hoặc bộ từ có hơn 100 chữ khác nhau THEN THE SYSTEM SHALL chỉ giữ 100 chữ đầu tiên và hiển thị "Danh sách luyện chỉ gồm 100 chữ đầu tiên."
- AC-4.4: WHEN một từ hoặc bộ từ có ký tự không phải chữ Hán (chữ Latinh, chữ số, dấu câu, khoảng trắng) THE SYSTEM SHALL bỏ qua các ký tự đó khi tạo danh sách luyện mà không báo lỗi.
- AC-4.5: IF một từ hoặc bộ từ có chữ Hán chưa có dữ liệu nét trong kho THEN THE SYSTEM SHALL bỏ các chữ đó khỏi danh sách luyện và hiển thị "Bỏ qua {n} chữ chưa có dữ liệu nét: {các chữ}", và hiển thị "Chưa có chữ nào trong mục này để luyện viết." thay cho màn hình luyện khi không còn chữ nào.
- AC-4.6: WHEN người dùng chọn "Quay lại" trên màn hình luyện mở từ 012 THE SYSTEM SHALL đưa người dùng về đúng màn hình 012 đã mở S16.

### REQ-5: Character information and structure — Thông tin chữ, bộ thủ và cấu tạo

<!-- Story: US-1, US-4 · Priority: P1 (thông tin cơ bản), P2 (cấu tạo) · Screens: S16 -->

- AC-5.1: WHEN màn hình luyện mở một chữ ở chế độ "Xem thứ tự nét" hoặc "Tô theo mẫu" THE SYSTEM SHALL hiển thị trong thẻ thông tin chữ: chữ Hán giản thể, mọi cách đọc pinyin có dấu thanh mà kho có (ngăn bởi " · "), nghĩa tiếng Việt, "HSK {n}", "{n} nét" và "Bộ thủ: {bộ} ({tên Hán Việt} – {nghĩa})".
- AC-5.2: WHEN người dùng mở "Cấu tạo chữ" trong thẻ thông tin THE SYSTEM SHALL hiển thị loại cấu tạo của chữ theo kho (ví dụ "Độc thể", "Trái – phải", "Trên – dưới", "Bao quanh"), các thành phần của chữ theo kho và "Mẹo nhớ" khi kho có văn bản mẹo nhớ cho chữ.
- AC-5.3: IF kho không có một trường thông tin của chữ (nghĩa, bộ thủ, loại cấu tạo, thành phần hoặc mẹo nhớ) THEN THE SYSTEM SHALL ẩn dòng tương ứng thay vì hiển thị dòng trống, và ẩn "Cấu tạo chữ" khi không có cả loại cấu tạo, thành phần lẫn mẹo nhớ.
- AC-5.4: WHEN người dùng chạm bộ thủ trong thẻ thông tin chữ THE SYSTEM SHALL mở trang chi tiết của bộ thủ đó theo AC-12.3.
- AC-5.5: WHEN người dùng chạm một thành phần là chữ có trong kho THE SYSTEM SHALL mở màn hình luyện của thành phần đó với danh sách luyện chỉ gồm thành phần đó, kèm nút "Quay lại" trở về chữ ban đầu ở đúng chế độ trước đó.
- AC-5.6: WHERE kho đánh dấu các nét thuộc bộ thủ của chữ THE SYSTEM SHALL cho người dùng bật "Tô màu bộ thủ" để hiển thị các nét đó bằng màu nhấn trong "Xem thứ tự nét" và "Tô theo mẫu", kèm chú thích "Phần tô màu: bộ {bộ}".

### REQ-6: Practice modes and grid — Chế độ luyện và khung chữ

<!-- Story: US-1, US-2, US-3 · Priority: P1 · Screens: S16 -->

- AC-6.1: THE SYSTEM SHALL hiển thị trên màn hình luyện bộ chọn chế độ "Xem thứ tự nét", "Tô theo mẫu", "Viết từ trí nhớ", khung luyện hình vuông có lưới, nút "Cài đặt", nút "Quay lại" và, khi danh sách luyện có hơn 1 chữ, "Chữ {k}/{n}" cùng nút "‹" và "›".
- AC-6.2: WHEN người dùng mở một chữ trên màn hình luyện THE SYSTEM SHALL chọn sẵn chế độ người dùng dùng gần nhất (lần đầu: "Xem thứ tự nét"), trừ khi chế độ được chỉ định bởi lối vào (AC-11.3, AC-13.6).
- AC-6.3: WHEN người dùng đổi chế độ, chọn "‹" hoặc "›", hoặc rời màn hình luyện khi đang viết dở một chữ THE SYSTEM SHALL bỏ lượt viết dở đó mà không ghi vào lịch sử và không hỏi xác nhận.
- AC-6.4: WHEN người dùng chọn "Khung chữ" là "田字格" hoặc "米字格" trong "Cài đặt" THE SYSTEM SHALL vẽ lưới tương ứng bằng nét đứt nhạt (田字格: đường giữa ngang và dọc; 米字格: thêm hai đường chéo) mà không ảnh hưởng tới việc kiểm tra nét, mặc định "田字格".
- AC-6.5: THE SYSTEM SHALL ghi nhớ cho từng tài khoản, trên mọi thiết bị, chế độ dùng gần nhất, cấp HSK chọn gần nhất, "Khung chữ", tốc độ minh họa, "Hiện số thứ tự nét", "Tô màu bộ thủ" và "Thuận tay trái".

### REQ-7: Stroke order animation — Xem thứ tự nét

<!-- Story: US-1 · Priority: P1 · Screens: S16 -->

- AC-7.1: WHEN chế độ "Xem thứ tự nét" được mở cho một chữ THE SYSTEM SHALL tự phát một lần minh họa vẽ lần lượt từng nét theo thứ tự của kho, mỗi nét chạy từ điểm đầu đến điểm cuối theo đúng hướng viết, trừ khi áp dụng AC-7.6.
- AC-7.2: THE SYSTEM SHALL ở tốc độ "1×" vẽ mỗi nét trong 0,6 giây và nghỉ 0,2 giây giữa hai nét, còn ở "0,5×" và "2×" các thời lượng đó lần lượt gấp đôi và giảm một nửa.
- AC-7.3: THE SYSTEM SHALL cung cấp trong "Xem thứ tự nét" các nút "Phát" / "Tạm dừng", "Phát lại" (vẽ lại từ nét 1), bộ chọn tốc độ "0,5×", "1×", "2×" (mặc định "1×") và công tắc "Hiện số thứ tự nét" (mặc định bật) để hiển thị số thứ tự cạnh điểm đầu của mỗi nét đã vẽ.
- AC-7.4: WHEN người dùng chọn "Từng nét" THE SYSTEM SHALL dừng minh họa, hiển thị các nét 1 đến k với nét k tô màu nhấn, dòng "Nét {k}/{n}" (kèm tên nét khi kho có, ví dụ "Nét 2/6: Ngang") và các nút "Nét trước" / "Nét sau" để giảm hoặc tăng k trong khoảng 1 đến n.
- AC-7.5: WHEN minh họa phát xong nét cuối THE SYSTEM SHALL hiển thị chữ hoàn chỉnh cùng nút "Tô theo mẫu" chuyển sang chế độ đó cho cùng chữ.
- AC-7.6: WHILE thiết bị bật tùy chọn giảm chuyển động THE SYSTEM SHALL không tự phát minh họa mà hiển thị chữ hoàn chỉnh kèm số thứ tự nét và mở sẵn "Từng nét" ở nét 1.

### REQ-8: Stroke input on the writing frame — Nhập nét trên khung luyện

<!-- Story: US-2, US-3, US-8 · Priority: P1 · Screens: S16 -->

- AC-8.1: WHILE chế độ "Tô theo mẫu" hoặc "Viết từ trí nhớ" đang mở THE SYSTEM SHALL nhận nét viết trong khung bằng ngón tay, chuột (nhấn giữ và kéo) hoặc bút cảm ứng, mỗi nét tính từ lúc chạm hoặc nhấn xuống tới lúc nhấc lên, và vẽ vệt mực bám theo đầu ngón tay, con trỏ hoặc đầu bút trong khi viết.
- AC-8.2: WHILE người dùng đang viết một nét trong khung THE SYSTEM SHALL không cuộn, không phóng to trang và bỏ qua mọi điểm chạm khác (kể cả lòng bàn tay khi viết bằng bút) cho tới khi nét được nhấc lên.
- AC-8.3: IF một nét bắt đầu ngoài khung luyện hoặc có quãng di chuyển dưới 2% cạnh khung THEN THE SYSTEM SHALL bỏ qua nét đó, không vẽ lại và không tính lỗi.
- AC-8.4: WHEN người dùng chọn "Hoàn tác" THE SYSTEM SHALL gỡ nét được chấp nhận gần nhất khỏi khung và đưa nét đó trở lại làm nét cần viết, không thay đổi số lỗi và số gợi ý đã tính; nút "Hoàn tác" bị vô hiệu khi chưa có nét nào được chấp nhận.
- AC-8.5: WHEN người dùng chọn "Viết lại" khi đang viết dở THE SYSTEM SHALL xóa mọi nét trên khung, đặt số lỗi và số gợi ý về 0 và bắt đầu lại từ nét 1 mà không ghi lượt viết dở vào lịch sử.
- AC-8.6: WHEN kích thước khung thay đổi khi đang viết dở (xoay màn hình, đổi cỡ cửa sổ) THE SYSTEM SHALL giữ các nét đã được chấp nhận ở đúng vị trí tương đối trong khung, giữ số lỗi và số gợi ý.

### REQ-9: Stroke checking — Kiểm tra từng nét

<!-- Story: US-2, US-3 · Priority: P1 · Screens: S16 · "Nét cần viết" = nét mẫu có số thứ tự nhỏ nhất chưa được chấp nhận -->

- AC-9.1: THE SYSTEM SHALL coi một nét viết là "khớp" với một nét mẫu khi đồng thời: điểm đầu nét viết cách điểm đầu nét mẫu không quá 20% cạnh khung, điểm cuối nét viết cách điểm cuối nét mẫu không quá 20% cạnh khung, khoảng cách trung bình từ các điểm của nét viết tới đường giữa của nét mẫu không quá 12% cạnh khung, và độ dài nét viết từ 50% đến 150% độ dài nét mẫu (với nét mẫu ngắn hơn 10% cạnh khung: từ 2% đến 20% cạnh khung).
- AC-9.2: WHEN người dùng nhấc lên một nét khớp với nét cần viết THE SYSTEM SHALL chấp nhận nét, thay vệt mực bằng nét mẫu tô màu mực tại đúng vị trí của nét mẫu và chuyển nét cần viết sang nét kế tiếp.
- AC-9.3: IF nét viết không khớp với nét cần viết nhưng khớp với nét cần viết khi đảo hướng (điểm đầu và điểm cuối hoán đổi) THEN THE SYSTEM SHALL tính 1 lỗi cho nét cần viết và hiển thị "Sai hướng nét — viết lại nét này theo đúng hướng."
- AC-9.4: IF nét viết không khớp với nét cần viết theo cả hai hướng nhưng khớp với một nét mẫu khác chưa được chấp nhận THEN THE SYSTEM SHALL tính 1 lỗi cho nét cần viết và hiển thị "Sai thứ tự nét — nét này chưa đến lượt."
- AC-9.5: IF nét viết không thuộc trường hợp của AC-9.2, AC-9.3 hay AC-9.4 THEN THE SYSTEM SHALL tính 1 lỗi cho nét cần viết và hiển thị "Nét chưa đúng vị trí hoặc hình dạng."
- AC-9.6: WHEN một nét bị tính lỗi THE SYSTEM SHALL hiển thị vệt mực của nét đó bằng màu báo lỗi trong 0,8 giây rồi xóa vệt mực, giữ nguyên các nét đã được chấp nhận và giữ nguyên nét cần viết.

### REQ-10: Trace and memory modes, hints — Tô theo mẫu, Viết từ trí nhớ và gợi ý

<!-- Story: US-2, US-3 · Priority: P1 · Screens: S16 -->

- AC-10.1: WHILE chế độ "Tô theo mẫu" đang mở THE SYSTEM SHALL hiển thị đường viền nhạt của toàn bộ chữ trong khung luyện.
- AC-10.2: WHILE chế độ "Viết từ trí nhớ" đang mở và chữ chưa hoàn thành THE SYSTEM SHALL không hiển thị chữ đang luyện hay đường viền của chữ ở bất kỳ đâu trên màn hình luyện (ngoài gợi ý của AC-10.3 và "Xem chữ" của AC-10.5), và hiển thị làm đề bài pinyin, nghĩa tiếng Việt và "{n} nét" của chữ (khi mở từ 012: thêm từ chứa chữ với chữ đang luyện thay bằng "□").
- AC-10.3: WHEN người dùng mắc lỗi thứ 3 liên tiếp ở cùng một nét cần viết THE SYSTEM SHALL tự hiển thị gợi ý cho nét đó: ở "Tô theo mẫu" tô nét đó trên đường viền bằng màu gợi ý và chạy minh họa hướng viết của nét một lần; ở "Viết từ trí nhớ" hiện đường viền nhạt của riêng nét đó kèm minh họa hướng viết và giữ hiển thị cho tới khi nét được chấp nhận.
- AC-10.4: WHEN người dùng chọn "Gợi ý" ở "Tô theo mẫu" hoặc "Viết từ trí nhớ" THE SYSTEM SHALL hiển thị ngay gợi ý của nét cần viết như AC-10.3.
- AC-10.5: WHEN người dùng chọn "Xem chữ" ở "Viết từ trí nhớ" THE SYSTEM SHALL hiển thị chữ hoàn chỉnh trong khung 2 giây rồi ẩn đi, giữ các nét đã được chấp nhận.
- AC-10.6: THE SYSTEM SHALL tính số gợi ý của một lượt viết bằng số nét đã được hiển thị gợi ý (tự động hoặc do chọn "Gợi ý", mỗi nét tính tối đa 1 lần) cộng số lần chọn "Xem chữ".

### REQ-11: Character result and next character — Kết quả chữ, viết lại và chữ tiếp theo

<!-- Story: US-2, US-3 · Priority: P1 · Screens: S16 -->

- AC-11.1: WHEN nét cuối của chữ được chấp nhận ở "Tô theo mẫu" hoặc "Viết từ trí nhớ" THE SYSTEM SHALL hiển thị chữ hoàn chỉnh cùng thẻ thông tin chữ và bảng kết quả gồm nhận xét, "Số lỗi: {m}", "Gợi ý: {h}", và đánh dấu bằng màu báo lỗi kèm số thứ tự mọi nét đã có ít nhất một lỗi.
- AC-11.2: THE SYSTEM SHALL đặt nhận xét "Tốt" khi lượt viết có tối đa 2 lỗi và 0 gợi ý, và "Cần luyện thêm" trong mọi trường hợp khác.
- AC-11.3: THE SYSTEM SHALL cung cấp trên bảng kết quả nút "Viết lại" (lượt mới của cùng chữ, cùng chế độ), "Chữ tiếp theo" khi danh sách luyện còn chữ phía sau, "Xong" khi chữ là chữ cuối của danh sách luyện, và thêm nút "Viết từ trí nhớ" (lượt mới của cùng chữ ở chế độ đó) khi lượt vừa xong ở "Tô theo mẫu".
- AC-11.4: WHEN người dùng chọn "Chữ tiếp theo" THE SYSTEM SHALL mở chữ kế tiếp của danh sách luyện ở cùng chế độ và cập nhật "Chữ {k}/{n}".
- AC-11.5: WHEN người dùng chọn "Xong" THE SYSTEM SHALL hiển thị tóm tắt "Đã luyện {a}/{n} chữ · Tốt: {b} · Cần luyện thêm: {c}" (a = số chữ của danh sách có ít nhất một lượt hoàn thành trong lần luyện này, b và c đếm theo nhận xét của lượt cuối của mỗi chữ đó) cùng nút "Về trang chính" đưa về trang chính S16, hoặc về màn hình 012 khi S16 được mở từ 012.
- AC-11.6: WHEN người dùng chọn "‹" hoặc "›" trên màn hình luyện THE SYSTEM SHALL mở chữ trước hoặc sau trong danh sách luyện ở cùng chế độ, với "‹" bị vô hiệu ở chữ đầu và "›" bị vô hiệu ở chữ cuối.

### REQ-12: Radicals — Luyện bộ thủ

<!-- Story: US-4 · Priority: P2 · Screens: S16 -->

- AC-12.1: WHEN người dùng chọn tab "Bộ thủ" THE SYSTEM SHALL liệt kê mọi bộ thủ trong danh sách bộ thủ của kho (016), nhóm theo số nét ("1 nét", "2 nét", …) và trong mỗi nhóm theo số thứ tự của kho, mỗi bộ gồm dạng chính, các dạng biến thể (ví dụ "水 · 氵"), tên Hán Việt, nghĩa tiếng Việt và "{n} chữ" là số chữ có dữ liệu nét trong kho thuộc bộ đó.
- AC-12.2: WHEN người dùng nhập vào ô "Lọc bộ thủ" THE SYSTEM SHALL chỉ giữ các bộ có dạng chính, dạng biến thể, tên Hán Việt hoặc nghĩa chứa nội dung nhập (không phân biệt hoa thường và dấu tiếng Việt), và hiển thị "Không có bộ thủ phù hợp." khi không còn bộ nào.
- AC-12.3: WHEN người dùng chạm một bộ thủ THE SYSTEM SHALL mở trang chi tiết bộ thủ gồm dạng chính và biến thể, tên Hán Việt, nghĩa, số nét, nút "Luyện viết bộ này" (khi kho có dữ liệu nét của ít nhất một dạng) và danh sách chữ thuộc bộ đó nhóm theo cấp HSK tăng dần, mỗi chữ kèm nhãn trạng thái luyện theo AC-13.5.
- AC-12.4: WHEN người dùng chọn "Luyện viết bộ này" THE SYSTEM SHALL mở màn hình luyện với danh sách luyện gồm dạng chính rồi các dạng biến thể có dữ liệu nét của bộ thủ, với cùng ba chế độ và cùng quy tắc kiểm tra nét như một chữ.
- AC-12.5: WHEN người dùng chạm một chữ trên trang chi tiết bộ thủ THE SYSTEM SHALL mở màn hình luyện của chữ đó với danh sách luyện là danh sách chữ của bộ thủ theo thứ tự hiển thị, bắt đầu từ chữ được chạm.
- AC-12.6: IF một bộ thủ chưa có chữ nào có dữ liệu nét trong kho THEN THE SYSTEM SHALL hiển thị trên trang chi tiết của bộ đó "Chưa có chữ nào thuộc bộ này để luyện viết."

### REQ-13: History and characters to review — Lịch sử và Chữ cần luyện

<!-- Story: US-6 · Priority: P2 · Screens: S16 -->

- AC-13.1: WHEN một lượt viết hoàn thành ở "Tô theo mẫu" hoặc "Viết từ trí nhớ" THE SYSTEM SHALL ghi vào lịch sử luyện viết của chính người dùng chữ, chế độ, nhận xét, số lỗi, số gợi ý và thời điểm hoàn thành; lượt viết bỏ dở và việc xem "Xem thứ tự nét" không được ghi.
- AC-13.2: WHEN người dùng chọn tab "Lịch sử" THE SYSTEM SHALL liệt kê mỗi chữ đã có lượt hoàn thành một dòng, chữ luyện gần nhất trước, gồm chữ Hán, pinyin, nhận xét của lượt gần nhất, "Đã luyện {n} lần" và ngày luyện gần nhất dạng dd/mm/yyyy theo giờ Việt Nam, tải thêm 50 dòng mỗi khi cuộn tới cuối danh sách.
- AC-13.3: WHEN một lượt viết hoàn thành với nhận xét "Cần luyện thêm" THE SYSTEM SHALL thêm chữ đó vào "Chữ cần luyện" nếu chữ chưa có trong danh sách.
- AC-13.4: WHEN một lượt "Viết từ trí nhớ" hoàn thành với nhận xét "Tốt" THE SYSTEM SHALL bỏ chữ đó khỏi "Chữ cần luyện", còn lượt "Tô theo mẫu" đạt "Tốt" không bỏ chữ khỏi danh sách.
- AC-13.5: THE SYSTEM SHALL hiển thị ở mọi danh sách chữ của S16 nhãn "Cần luyện" cho chữ đang ở "Chữ cần luyện", nhãn "Tốt" cho chữ đã có lượt hoàn thành nhưng không ở "Chữ cần luyện", và không nhãn cho chữ chưa luyện, mỗi nhãn gồm cả chữ và màu.
- AC-13.6: WHEN người dùng chọn tab "Chữ cần luyện ({n})" THE SYSTEM SHALL liệt kê các chữ trong danh sách theo thời điểm được thêm (sớm nhất trước), mỗi chữ có nút "Bỏ khỏi danh sách", kèm nút "Luyện tất cả" mở danh sách luyện gồm các chữ đó theo cùng thứ tự ở chế độ "Viết từ trí nhớ".
- AC-13.7: IF "Chữ cần luyện" hoặc "Lịch sử" chưa có chữ nào THEN THE SYSTEM SHALL hiển thị tương ứng "Chưa có chữ nào cần luyện. Chữ viết chưa tốt sẽ xuất hiện ở đây." hoặc "Bạn chưa luyện viết chữ nào. Hãy chọn một chữ để bắt đầu."

### REQ-14: Private self-study data — Dữ liệu tự học riêng tư, tách khỏi lớp

<!-- Story: US-7 · Priority: P1 · Screens: S16, A05; không xuất hiện trên S09, S10, S12, T04, T15, T01 -->

- AC-14.1: THE SYSTEM SHALL chỉ cho chính chủ tài khoản xem lịch sử luyện viết, "Chữ cần luyện", nhãn trạng thái luyện và cài đặt S16 của tài khoản đó.
- AC-14.2: THE SYSTEM SHALL không hiển thị và không gửi tới thiết bị của GV (kể cả GV chủ workspace hay GV của lớp HV đang học, và trên các màn hình Kho nội dung tự học T23–T27) hoặc của HV khác (kể cả bạn cùng lớp trên S12) bất kỳ dữ liệu luyện viết nào của một HV.
- AC-14.3: THE SYSTEM SHALL không để dữ liệu luyện viết làm thay đổi Điểm xếp hạng, hạng (008), tiến độ, trạng thái "Đã làm" / "Chưa làm" (009), email nhắc hạn nộp (003) hay bất kỳ chỉ số nào của lớp.
- AC-14.4: IF một người dùng yêu cầu dữ liệu luyện viết của tài khoản khác (kể cả qua đường dẫn trực tiếp) THEN THE SYSTEM SHALL không trả dữ liệu đó và hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu."
- AC-14.5: WHEN một tài khoản HV bị xóa theo 001 THE SYSTEM SHALL xóa vĩnh viễn lịch sử luyện viết, "Chữ cần luyện" và cài đặt S16 của tài khoản đó trong vòng 24 giờ.
- AC-14.6: THE SYSTEM SHALL giữ "Chữ cần luyện" là danh sách riêng của S16: việc thêm hoặc bỏ một chữ khỏi "Chữ cần luyện" không thay đổi thẻ ôn tập, lịch ôn tập hay đánh dấu "từ khó" của người dùng trong 012, và thao tác ôn tập trong 012 không thêm hay bỏ chữ nào khỏi "Chữ cần luyện".

### REQ-15: Accessibility, handedness and input devices — Trợ năng, thuận tay trái và thiết bị nhập

<!-- Story: US-8 · Priority: P2 · Screens: S16 -->

- AC-15.1: WHEN người dùng bật "Thuận tay trái" trong "Cài đặt" THE SYSTEM SHALL dồn thanh công cụ của khung luyện ("Hoàn tác", "Viết lại", "Gợi ý", "Xem chữ") về phía bên trái khung (mặc định: bên phải) mà không thay đổi quy tắc kiểm tra nét.
- AC-15.2: THE SYSTEM SHALL cho thao tác bằng bàn phím mọi điều khiển của S16 trừ việc vẽ nét (tab, tìm kiếm, chọn chữ, chọn chế độ, phát/tạm dừng, tốc độ, "Từng nét", "Nét trước"/"Nét sau", "Hoàn tác", "Viết lại", "Gợi ý", "Xem chữ", nút trên bảng kết quả, "‹"/"›", "Cài đặt"), mỗi điều khiển có nhãn đọc được bằng trình đọc màn hình.
- AC-15.3: THE SYSTEM SHALL cung cấp cho mỗi chữ có dữ liệu nét mục "Danh sách nét" dạng văn bản liệt kê từng nét theo thứ tự với số thứ tự, tên nét khi kho có và hướng viết suy ra từ nét mẫu (ví dụ "Nét 1: Ngang, từ trái sang phải").
- AC-15.4: THE SYSTEM SHALL gắn cho khung luyện nhãn đọc được "Khung viết: vẽ bằng ngón tay, chuột hoặc bút. Thứ tự nét có trong Danh sách nét." và thông báo qua vùng thông báo trực tiếp mỗi kết quả kiểm tra nét ("Đúng nét {k}", "Sai hướng nét", "Sai thứ tự nét", "Nét chưa đúng") và nhận xét của chữ.
- AC-15.5: WHILE "Từng nét" đang mở THE SYSTEM SHALL thông báo qua vùng thông báo trực tiếp dòng mô tả nét k của "Danh sách nét" mỗi khi k thay đổi.

### REQ-16: Missing data, library changes and connectivity — Dữ liệu thiếu, thay đổi kho và mất mạng

<!-- Story: US-1, US-6 · Priority: P1 · Screens: S16 -->

- AC-16.1: IF một chữ trong kết quả tìm kiếm hoặc một thành phần chưa có dữ liệu nét trong kho THEN THE SYSTEM SHALL hiển thị chữ đó với nhãn "Chưa có dữ liệu nét" và, khi mở, chỉ hiển thị thẻ thông tin chữ kèm "Chữ này chưa có dữ liệu nét để luyện viết." với ba chế độ bị vô hiệu.
- AC-16.2: WHEN GV cập nhật dữ liệu nét của một chữ trong Kho nội dung tự học của workspace (016) trong lúc HV đang luyện chữ đó THE SYSTEM SHALL để lượt hiện tại tiếp tục với dữ liệu đã tải và dùng dữ liệu mới từ lần mở chữ kế tiếp.
- AC-16.3: IF một chữ trong "Lịch sử" hoặc "Chữ cần luyện" không còn dữ liệu nét trong kho (kể cả khi GV ẩn, lưu trữ chữ hoặc gỡ dữ liệu nét của chữ) THEN THE SYSTEM SHALL giữ dòng của chữ đó với nhãn "Không còn dữ liệu luyện", không mở màn hình luyện khi chạm, và vẫn cho "Bỏ khỏi danh sách" ở "Chữ cần luyện".
- AC-16.4: WHILE thiết bị mất kết nối mạng sau khi một chữ đã tải xong THE SYSTEM SHALL tiếp tục cho dùng đủ ba chế độ, kiểm tra nét, gợi ý và bảng kết quả của chữ đó.
- AC-16.5: IF không lưu được kết quả của một lượt viết THEN THE SYSTEM SHALL vẫn hiển thị bảng kết quả kèm "Chưa lưu được kết quả vào lịch sử. Hệ thống sẽ tự thử lại khi có mạng.", tự lưu lại khi có kết nối trong lúc S16 còn mở và hiển thị "Đã lưu kết quả." khi lưu được.
- AC-16.6: IF không tải được một danh sách hoặc dữ liệu của một chữ THEN THE SYSTEM SHALL hiển thị "Không tải được dữ liệu. Vui lòng thử lại." kèm nút "Thử lại" và không hiển thị danh sách rỗng như thể không có chữ.

## 6. Non-Functional Requirements

- NFR-1: Performance: phản hồi kiểm tra nét (chấp nhận hoặc báo lỗi) hiển thị p95 ≤ 100 ms sau khi nhấc nét, kể cả khi mất mạng, đo trên điện thoại Android tầm trung (≥ 4 GB RAM, ra mắt từ 2022) và trên máy tính để bàn.
- NFR-2: Performance: vệt mực trễ so với đầu ngón tay hoặc con trỏ p95 ≤ 50 ms; minh họa thứ tự nét chạy trung bình ≥ 50 khung hình/giây với ≤ 1% khung hình dài hơn 50 ms, trên cùng loại thiết bị của NFR-1.
- NFR-3: Performance: mở màn hình luyện của một chữ (thông tin và dữ liệu nét) p95 ≤ 1,5 giây trên mạng 4G (≥ 10 Mbps); danh sách một cấp HSK tới 1.500 chữ trong Kho nội dung tự học của một workspace hiển thị 60 chữ đầu p95 ≤ 2 giây; kết quả tìm kiếm hiển thị p95 ≤ 1 giây sau khi người dùng ngừng gõ 300 ms; lưu một kết quả p95 ≤ 500 ms ở 100 lượt lưu mỗi giây.
- NFR-4: Efficiency: dữ liệu tải về để mở một chữ (thông tin và nét mẫu) p95 ≤ 20 KB và tối đa 40 KB với chữ tới 30 nét.
- NFR-5: Reliability: sau khi một chữ đã tải xong, 100% thao tác của ba chế độ trên chữ đó (minh họa, kiểm tra nét, gợi ý, bảng kết quả) hoạt động khi ngắt mạng trong bộ kiểm thử ngoại tuyến; 100% kết quả chưa lưu được lưu trong vòng 10 giây kể từ khi có lại mạng nếu S16 còn mở.
- NFR-6: Accuracy: trên bộ kiểm thử chuẩn gồm ≥ 200 chữ HSK 1–4 do ≥ 5 người viết đúng bằng ngón tay trên điện thoại 360 px và bằng chuột trên máy tính, ≥ 95% nét viết đúng được chấp nhận ngay lần đầu, ≥ 95% nét viết sai thứ tự hoặc sai hướng được báo đúng loại lỗi và ≤ 2% nét viết sai bị chấp nhận.
- NFR-7: Usability: ở chiều rộng 360 px khung luyện có cạnh ≥ 300 px và khung, bộ chọn chế độ, thanh công cụ cùng hiển thị không cần cuộn ở chiều cao ≥ 640 px; ở bố cục rộng (HV trên màn hình rộng) khung có cạnh ≥ 400 px; không có cuộn ngang ở 360–430 px; vùng chạm ≥ 44×44 px; ≥ 9/10 người dùng mới trong kiểm thử khả dụng hoàn thành chữ đầu tiên ở "Tô theo mẫu" không cần trợ giúp.
- NFR-8: Accessibility: mọi điều khiển của S16 trừ việc vẽ nét đạt WCAG 2.1 AA (chữ tương phản ≥ 4,5:1, đường viền mẫu tương phản ≥ 3:1 với nền khung, thao tác được bằng bàn phím, có nhãn cho trình đọc màn hình); 100% chữ có dữ liệu nét có "Danh sách nét"; 100% nhãn trạng thái và nhận xét có chữ kèm màu; 100% minh họa tôn trọng tùy chọn giảm chuyển động của thiết bị.
- NFR-9: Privacy: 0 dữ liệu luyện viết của một HV được gửi tới thiết bị của tài khoản khác hoặc xuất hiện trên màn hình GV, và 0 thay đổi giá trị của 008/009 do luyện viết, kiểm chứng bằng kiểm thử tự động bao phủ 100% dữ liệu của S16, S09, S10, S12, T04, T15 và T23–T27 với HV của ít nhất 2 workspace; 100% lần GV mở S16 trong kiểm thử nhận A05.
- NFR-10: Observability: 100% lần mở chữ, lượt viết hoàn thành (chế độ, nhận xét, số lỗi, số gợi ý), lỗi tải dữ liệu và lỗi lưu kết quả được ghi nhật ký có cấu trúc gồm thời điểm, mã HV, mã workspace, mã chữ và kết quả, không chứa họ tên, email hay tọa độ nét viết, truy vết được trong ≥ 90 ngày.

## 7. Key Entities

- **Chữ (dữ liệu Kho nội dung tự học của một workspace — 016, chỉ đọc với 013)** — khởi tạo từ bộ nội dung HSK mẫu,
  sau đó GV của workspace sửa / thêm / ẩn; chữ Hán giản thể; một hoặc nhiều cách đọc pinyin có dấu thanh; nghĩa tiếng
  Việt; cấp HSK (1–9, một cấp mỗi chữ); số nét; danh sách **nét mẫu** theo thứ tự, mỗi nét có hình nét (để vẽ đường
  viền) và đường giữa có hướng (điểm đầu → điểm cuối, dùng cho minh họa và kiểm tra), tên nét nếu có; bộ thủ; thành
  phần; loại cấu tạo; mẹo nhớ nếu có; các nét thuộc bộ thủ nếu có. Một chữ "có dữ liệu nét" khi có đủ nét mẫu cho
  mọi nét.
- **Bộ thủ (dữ liệu Kho nội dung tự học của một workspace — 016, chỉ đọc với 013)** — dạng chính, các dạng biến thể, tên Hán Việt, nghĩa tiếng Việt, số nét, số
  thứ tự trong danh sách của kho (mặc định 214 bộ Khang Hy), dữ liệu nét của từng dạng nếu có.
- **Danh sách luyện** — dãy chữ có thứ tự được tạo khi người dùng vào màn hình luyện (từ cấp HSK, bộ thủ, tìm kiếm,
  012, "Chữ cần luyện" hoặc một chữ đơn), tối đa 100 chữ khi tạo từ 012; chỉ tồn tại trong lần luyện đó.
- **Lượt viết** — một lần viết trọn một chữ ở "Tô theo mẫu" hoặc "Viết từ trí nhớ": chữ, chế độ, số lỗi theo từng
  nét, số gợi ý, nhận xét ("Tốt" / "Cần luyện thêm"), thời điểm hoàn thành. Chỉ lượt hoàn thành được lưu.
- **Lịch sử luyện viết** — các lượt viết đã lưu của một HV; tổng hợp theo chữ: số lần luyện, nhận xét và ngày
  của lượt gần nhất. Thuộc đúng một HV, riêng tư.
- **Chữ cần luyện** — tập chữ của một HV, mỗi chữ kèm thời điểm được thêm; thêm khi có lượt "Cần luyện thêm",
  bỏ khi có lượt "Viết từ trí nhớ" đạt "Tốt" hoặc khi người dùng chọn "Bỏ khỏi danh sách". Tách riêng khỏi ôn tập
  SRS và "từ khó" của 012 (AC-14.6).
- **Cài đặt luyện viết** — theo HV: chế độ gần nhất, cấp HSK gần nhất, "Khung chữ", tốc độ minh họa, "Hiện số
  thứ tự nét", "Tô màu bộ thủ", "Thuận tay trái".
- Tham chiếu (không thuộc module này): tài khoản, vai trò, đăng nhập, xóa tài khoản (001); S13 "Tự học", từ vựng và
  bộ từ vựng cá nhân (012); kho chữ và bộ thủ của Kho nội dung tự học, do GV quản lý và xem trước trên T23–T27 (016).

## 8. Edge Cases & Error Handling

- Người dùng viết hai nét liền một mạch (ví dụ nối nét 1 và 2 của 口): nét viết không khớp nét nào → "Nét chưa đúng
  vị trí hoặc hình dạng." (AC-9.5).
- Người dùng viết lại đúng một nét đã được chấp nhận: không khớp nét chưa được chấp nhận nào → "Nét chưa đúng…", tính
  1 lỗi cho nét cần viết (AC-9.5).
- Nét viết khớp đồng thời nét cần viết và một nét khác (hai nét song song gần nhau như 三): nét cần viết được ưu tiên,
  nét được chấp nhận (AC-9.2).
- Nét viết đảo hướng của một nét khác chưa tới lượt: không khớp nét nào theo hướng đúng → "Nét chưa đúng…" (AC-9.5).
- Chạm nhẹ, chạm nhầm hoặc nét dưới 2% cạnh khung, nét bắt đầu ngoài khung: bỏ qua, không tính lỗi (AC-8.3).
- Nét bắt đầu trong khung rồi đi ra ngoài: phần ngoài khung không được vẽ; nét vẫn được kiểm tra với các điểm trong
  khung (AC-8.1, AC-9.1).
- Nét chấm rất ngắn (点) viết bằng một cái chạm có kéo nhẹ ≥ 2% cạnh khung: được kiểm tra theo ngưỡng của nét mẫu ngắn
  (AC-9.1).
- Hai ngón tay cùng chạm khi đang viết, lòng bàn tay chạm màn hình khi viết bằng bút: chỉ nét đầu tiên được ghi
  nhận (AC-8.2).
- Trang không cuộn khi người dùng kéo trong khung trên điện thoại; kéo ngoài khung vẫn cuộn bình thường (AC-8.2).
- Xoay điện thoại giữa lượt viết: nét đã chấp nhận, số lỗi, số gợi ý giữ nguyên (AC-8.6).
- "Hoàn tác" ngay sau khi chữ hoàn thành: không có — bảng kết quả thay thế; người dùng chọn "Viết lại" (AC-11.3).
- "Hoàn tác" rồi viết lại nét đó sai: lỗi tiếp tục được tính, số lỗi cũ giữ nguyên (AC-8.4).
- Sai 3 lần liên tiếp ở nét 2, đúng nét 2, rồi sai 3 lần ở nét 3: hai gợi ý, h = 2 (AC-10.3, AC-10.6).
- Sai 2 lần ở nét 1, đúng nét 1, sai 1 lần ở nét 2: không có gợi ý (bộ đếm liên tiếp theo từng nét), m = 3 → "Cần luyện
  thêm" (AC-10.3, AC-11.2).
- Chọn "Gợi ý" rồi lại sai 3 lần ở cùng nét: nét đó vẫn chỉ tính 1 gợi ý (AC-10.6).
- Chữ 1 nét (一, 乙): chữ hoàn thành ngay khi nét đó được chấp nhận; 0 lỗi → "Tốt" (AC-11.1, AC-11.2).
- Chữ nhiều nét (ví dụ 18 nét) với 2 lỗi và không gợi ý: "Tốt" — ngưỡng không phụ thuộc số nét (AC-11.2; giả định §12).
- Chữ đa âm (行 xíng · háng, 好 hǎo · hào): thẻ thông tin và đề bài "Viết từ trí nhớ" hiển thị mọi cách đọc (AC-5.1,
  AC-10.2); khi mở từ 012, từ chứa chữ giúp phân biệt.
- Hai chữ cùng pinyin và nghĩa gần nhau ở "Viết từ trí nhớ" (ví dụ 他 / 她 tā): đề bài có nghĩa và số nét; người dùng
  có thể chọn "Xem chữ" (tính 1 gợi ý) (AC-10.2, AC-10.5).
- Từ 012 có chữ lặp (妈妈, 谢谢): mỗi chữ một lần (AC-4.1); bộ từ có chữ lặp giữa các từ: giữ lần xuất hiện đầu (AC-4.2).
- Từ có chữ Latinh hoặc số (卡拉OK, 3D打印): bỏ qua ký tự không phải chữ Hán (AC-4.4).
- Bộ từ 012 có > 100 chữ khác nhau: chỉ 100 chữ đầu, có thông báo (AC-4.3).
- Tìm bằng chữ phồn thể (ví dụ 學): kho chỉ có giản thể → "Không tìm thấy chữ phù hợp…" (AC-3.4); phồn thể ngoài phạm vi.
- Tìm "hao" (không dấu): khớp 好 và mọi chữ đọc "hao" với bất kỳ thanh nào; tìm "nước" hoặc "nuoc": khớp 水, 氵… (AC-3.2).
- Nội dung tìm 1 ký tự Latinh ("a"): chưa tìm (cần ≥ 2 ký tự khác chữ Hán) (AC-3.1).
- Thành phần không phải chữ trong kho (ví dụ một nét hoặc một bộ phận không đứng riêng): hiển thị nhưng không chạm được
  (AC-5.5).
- Bộ thủ có biến thể không có dữ liệu nét (ví dụ một dạng hiếm): "Luyện viết bộ này" chỉ gồm các dạng có dữ liệu
  (AC-12.4).
- Đổi chế độ hoặc chuyển chữ giữa lượt viết: lượt dở bị bỏ, không ghi lịch sử, không hỏi xác nhận (AC-6.3).
- Rời S16 khi kết quả chưa lưu được (mất mạng): kết quả đó không được lưu; người dùng đã thấy cảnh báo của AC-16.5.
- Cùng tài khoản luyện trên hai thiết bị cùng lúc: mọi lượt hoàn thành đều được ghi; "Chữ cần luyện" theo lượt hoàn
  thành sau cùng của từng chữ (AC-13.3, AC-13.4).
- GV cập nhật nét của chữ đang luyện trong Kho nội dung tự học: lượt hiện tại không bị ảnh hưởng (AC-16.2); GV ẩn hoặc
  lưu trữ chữ, hoặc gỡ dữ liệu nét: lịch sử giữ dòng với "Không còn dữ liệu luyện" (AC-16.3).
- GV sửa nét một chữ của bộ HSK mẫu đã nạp sẵn: chỉ HV của workspace đó luyện theo nét mới; HV của workspace khác không
  bị ảnh hưởng (AC-1.2, AC-16.2).
- HV mở đường dẫn trực tiếp tới một chữ không có trong kho của workspace mình (kể cả chữ chỉ có ở workspace khác): A05
  (AC-1.7); chữ có trong kho nhưng chưa có dữ liệu nét: thẻ thông tin kèm "Chữ này chưa có dữ liệu nét để luyện viết."
  (AC-16.1).
- HV bị gỡ khỏi mọi lớp, lớp kết thúc: vẫn dùng S16 với nguyên dữ liệu (AC-1.2). HV bị khóa: không đăng nhập được
  (001), dữ liệu giữ nguyên; tài khoản bị xóa: dữ liệu xóa trong 24 giờ (AC-14.5).
- GV mở S16 bằng đường dẫn trực tiếp, hoặc đăng nhập bằng tài khoản GV từ A01 sau khi mở đường dẫn S16: A05, không lộ
  dữ liệu chữ hay dữ liệu luyện viết (AC-1.3, AC-1.4); GV xem trước thứ tự nét chỉ trong T23–T27 (016). GV không thấy
  dữ liệu luyện viết của HV ở bất kỳ màn hình nào (AC-14.2).
- Thiết bị bật giảm chuyển động: không tự phát minh họa; gợi ý hướng viết hiển thị dưới dạng số thứ tự và mũi tên tĩnh
  thay cho minh họa chạy (AC-7.6, NFR-8).

## 9. Out of Scope

- **Giai đoạn 2 (V14):** nhận diện chữ viết tự do (viết cả chữ một lần, không kiểm tra từng nét) và gợi ý sửa lỗi bằng AI.
- Chấm điểm thư pháp hay độ đẹp (độ dày, lực bút, nét móc/nét thanh), chấm theo thời gian viết.
- Chữ phồn thể, chữ dị thể ngoài kho; viết cả từ nhiều chữ trong một khung; bàn phím viết tay để nhập chữ.
- GV giao bài luyện viết cho lớp, GV xem kết quả luyện viết của HV, xếp hạng hay thi đua luyện viết.
- Đồng bộ "Chữ cần luyện" với SRS 012: tự động đưa chữ viết chưa tốt vào ôn tập lặp lại ngắt quãng hoặc đánh dấu "từ khó"
  của 012, hay ngược lại (ý tưởng cho sau MVP; MVP giữ hai danh sách tách riêng — Q-1 đã chốt 2026-10-22, AC-14.6).
- Phát âm chữ đơn lẻ trên S16 (phát âm thuộc thẻ từ của 012).
- In hoặc xuất phiếu luyện viết, tải trước cả cấp HSK để dùng ngoại tuyến, cài đặt như ứng dụng.
- HV tự xóa lịch sử luyện viết; HV tự tạo hay sửa dữ liệu nét; GV soạn hoặc xem trước dữ liệu nét trên S16 (thuộc 016,
  T23–T27).
- Thông báo, email hay nhắc lịch luyện viết.
- GV tự luyện viết trên S16 như một người học (V15: GV chỉ quản lý nội dung); kho chữ dùng chung giữa các workspace.

### Removed (2026-10-22, V15)

Không mã AC nào bị bỏ (AC-1.4 được viết lại tại chỗ; thêm AC-1.7); các hành vi sau không còn:

- **GV dùng S16** (AC-1.1, AC-1.2, AC-1.3 cũ; US-1 … US-4, US-6 cũ "Là HV hoặc GV"): lối vào S16 cho GV trên bố cục máy
  tính, GV tự luyện và kiểm tra thứ tự nét trước khi dạy trên S16, lịch sử / "Chữ cần luyện" / cài đặt riêng của GV —
  nay GV mở S16 thấy A05 (AC-1.4) và xem trước dữ liệu nét trong T23–T27 (016).
- **Vai trò "Quản trị nội dung"** bị chặn bằng A05 (AC-1.4 cũ) và **một kho chữ hệ thống dùng chung** cho mọi tài khoản
  (AC-1.2 cũ) — nay mỗi workspace có Kho nội dung tự học riêng do GV quản lý.

## 10. Assumptions & Dependencies

Quyết định của stakeholder được dùng: **V14** (2026-10-22: tính năng tự học không cần lớp, nội dung từ kho 016, MVP =
minh họa thứ tự nét + khung viết kiểm tra từng nét với nét mẫu + gợi ý sau lỗi; nhận diện chữ viết tự do + AI ở giai
đoạn 2; dữ liệu riêng tư, không ảnh hưởng xếp hạng/dashboard; lối vào từ S13 — phần "mọi HV và GV" và "kho hệ thống"
đã bị V15 thay thế), **V15** (2026-10-22: chỉ hai vai trò GV và HV; tự học chỉ dành cho HV; mỗi workspace có Kho nội
dung tự học riêng nạp sẵn bộ HSK mẫu, GV sửa / thêm / ẩn tùy ý; GV chỉ quản lý, không dùng S16), D4 (không tự đăng ký), V12-4 (phong cách "Mực & giấy", chữ Hán có serif, `lang="zh-Hans"`). Nguyên tắc sản phẩm: giao diện
tiếng Việt, chữ Hán giản thể, pinyin có dấu thanh, giờ Việt Nam.

Giả định được dùng (chi tiết ở §12): HV mobile-first 360–430 px, bố cục rộng khi HV dùng màn hình rộng; ngưỡng kiểm tra nét, ngưỡng gợi ý và
ngưỡng "Tốt" như REQ-9 đến REQ-11, hiệu chỉnh bằng NFR-6 trước khi phê duyệt triển khai.

Phụ thuộc module:

- **016 Kho nội dung tự học (GV, T23–T27)** — mỗi workspace một kho, khởi tạo từ bộ nội dung HSK mẫu (có dữ liệu nét
  và danh sách bộ thủ) rồi do GV sở hữu; GV xem trước thứ tự nét trong T23–T27. **Cần cung cấp:** cho mỗi chữ: pinyin (mọi cách đọc), nghĩa tiếng Việt, một cấp HSK,
  số nét, nét mẫu theo thứ tự (hình nét + đường giữa có hướng), tên nét (tùy chọn), bộ thủ, thành phần, loại cấu tạo
  theo một danh mục cố định, mẹo nhớ (tùy chọn), các nét thuộc bộ thủ (tùy chọn); danh sách bộ thủ (dạng chính, biến
  thể, tên Hán Việt, nghĩa, số nét, thứ tự, dữ liệu nét của từng dạng); tìm chữ theo pinyin không dấu/số thanh và theo
  nghĩa không dấu; thứ tự chữ trong mỗi cấp. GV cập nhật, ẩn, lưu trữ hay gỡ dữ liệu nét không được làm hỏng lượt đang
  luyện hay lịch sử của HV (AC-16.2, AC-16.3); không hiển thị dữ liệu luyện viết của HV trên T23–T27 (AC-14.2).
- **012 Từ vựng thông minh** — **cần bổ sung:** thẻ "Luyện viết chữ Hán" trên S13 (AC-1.1); nút "Luyện viết" ở một từ
  (S14/S15) và ở một bộ từ vựng cá nhân, mở S16 và nhận người dùng quay lại (AC-4.1, AC-4.2, AC-4.6). **Đã chốt với 012 (2026-10-22, Q-1):** "Chữ cần luyện" là danh sách riêng của 013; trong
  MVP không tự động đưa chữ vào SRS hay "từ khó" của 012 và 012 không thay đổi "Chữ cần luyện" (AC-14.6).
- **001 Tài khoản & Xác thực** — vai trò HV/GV, đăng nhập và quay lại màn hình đã yêu cầu (A01), A05, xóa tài khoản.
  **Cần 001 bổ sung:** S13/S16 chỉ thuộc nhóm màn hình của HV trong quy tắc định tuyến, kể cả mở lại màn hình sau đăng
  nhập (AC-1.2, AC-1.3); tài khoản GV mở S16 → A05 (AC-1.4); xóa dữ liệu luyện viết khi xóa tài khoản HV (AC-14.5).
- **008, 009, 003, 011** — không nhận gì từ 013; phải không hiển thị hay dùng dữ liệu luyện viết (AC-14.2, AC-14.3).
- **Thiết kế** — `specs/screen-flow-design.html` chưa có S16; cần thêm S16 (trang chính, màn hình luyện ở ba chế độ,
  bảng kết quả, chi tiết bộ thủ, "Cài đặt") theo `docs/design/DESIGN.md`.

## 11. Open Questions

Không còn câu hỏi mở.

- Q-1 (§10, 012) đã đóng 2026-10-22: "Chữ cần luyện" là danh sách riêng của 013 trong MVP, không tự động nối với SRS
  hay "từ khó" của 012 (AC-14.6, §9; xem §12 Session 2026-10-22 (chốt câu hỏi mở)).

## 12. Clarifications Log

### Session 2026-10-22 (V14 — tự học toàn hệ thống)

- Q: Yêu cầu gốc? → A: Nguyên văn: "giờ sẽ thêm các module feature global cho tất cả user để có thể dùng được và không phân biệt lớp: 4. Luyện viết chữ Hán — Hướng dẫn thứ tự các nét. Khung luyện viết trực tiếp trên màn hình. Nhận diện chữ viết và gợi ý sửa lỗi. Luyện bộ thủ, cấu tạo chữ và ghi nhớ mặt chữ." (source: stakeholder)
- [thay thế 2026-10-22 V15] Q: Ai được dùng? → A: Mọi tài khoản HV và GV hiện có, không cần lớp; không mở đăng ký công khai (AC-1.2, AC-1.3) (source: stakeholder)
- [thay thế 2026-10-22 V15] Q: Nội dung lấy từ đâu? → A: Kho hệ thống (016): mỗi chữ có dữ liệu thứ tự nét, số nét, bộ thủ, thành phần, pinyin, nghĩa, cấp HSK; danh sách bộ thủ (REQ-5, REQ-12, §10) (source: stakeholder)
- Q: MVP gồm gì và phần nào để sau? → A: MVP = minh họa thứ tự nét + khung viết, người học viết từng nét và mỗi nét được kiểm tra với nét mẫu (hướng, thứ tự, hình dạng gần đúng), có gợi ý sau khi sai; giai đoạn 2 = nhận diện chữ viết tự do (cả chữ) và gợi ý sửa lỗi bằng AI (REQ-7 đến REQ-11, §9) (source: stakeholder)
- Q: Ai thấy dữ liệu luyện viết? → A: Chỉ chính người dùng; GV không thấy; không ảnh hưởng xếp hạng hay dashboard của lớp (REQ-14) (source: stakeholder)
- Q: Lối vào? → A: Từ trang S13 "Tự học" (012) (AC-1.1) (source: stakeholder)
- Q: Khi nào một nét được chấp nhận và thế nào là lỗi? → A: Khớp = điểm đầu và điểm cuối cách nét mẫu ≤ 20% cạnh khung, độ lệch trung bình ≤ 12% cạnh khung, độ dài 50–150% (nét ngắn: 2–20% cạnh khung); lỗi chia 3 loại theo thứ tự ưu tiên "Sai hướng nét" → "Sai thứ tự nét" → "Nét chưa đúng", mỗi nét sai tính 1 lỗi cho nét cần viết (REQ-9) (source: assumption — mức dung sai thường dùng của công cụ luyện viết theo nét, đủ rộng cho ngón tay trên màn hình 360 px; hiệu chỉnh bằng NFR-6)
- Q: Gợi ý xuất hiện khi nào? → A: Tự động sau 3 lỗi liên tiếp ở cùng một nét, hoặc khi chọn "Gợi ý"; "Xem chữ" ở "Viết từ trí nhớ" hiện cả chữ 2 giây; mỗi gợi ý được tính (REQ-10) (source: assumption — 3 lần đủ để người học tự sửa trước khi được nhắc)
- Q: Nhận xét của chữ? → A: "Tốt" khi ≤ 2 lỗi và 0 gợi ý, ngược lại "Cần luyện thêm"; không phụ thuộc số nét (AC-11.2) (source: assumption — quy tắc đơn giản, dễ hiểu, kiểm thử được; brief nêu ví dụ "Tốt" / "Cần luyện thêm")
- Q: Chữ vào và rời "Chữ cần luyện" thế nào? → A: Vào khi một lượt bất kỳ đạt "Cần luyện thêm"; rời khi lượt "Viết từ trí nhớ" đạt "Tốt" hoặc người dùng bỏ thủ công (AC-13.3, AC-13.4, AC-13.6) (source: assumption — chỉ viết từ trí nhớ chứng minh đã nhớ mặt chữ; tô theo mẫu thì chưa)
- [thay thế 2026-10-22] Q: Có nối với SRS của 012 không? → A: Chưa trong MVP; xem Q-1 (source: assumption — 012 SRS dựa trên từ, chưa có spec; tránh ràng buộc chéo)
- Q: "Viết từ trí nhớ" hiển thị gì làm đề bài? → A: Pinyin, nghĩa, số nét (và từ chứa chữ khi mở từ 012), không hiển thị chữ (AC-10.2) (source: assumption — nếu thấy chữ thì không còn là viết từ trí nhớ)
- Q: Nét được chấp nhận hiển thị thế nào? → A: Thay vệt mực bằng nét mẫu tô màu mực (AC-9.2) (source: assumption — người học luôn thấy hình nét chuẩn; tránh nhầm nét lệch là đúng)
- Q: Khung chữ nào là mặc định? → A: "田字格", có thể đổi sang "米字格"; lưới không ảnh hưởng kiểm tra (AC-6.4) (source: assumption — 田字格 phổ biến nhất trong sách HSK)
- Q: Tốc độ minh họa? → A: "1×" = 0,6 giây mỗi nét, nghỉ 0,2 giây; có "0,5×" và "2×" (AC-7.2) (source: assumption — đủ chậm để theo dõi hướng nét, chữ 10 nét xong trong 8 giây)
- Q: Lượt viết dở có được lưu? → A: Không; đổi chế độ, chuyển chữ, "Viết lại" hoặc rời màn hình bỏ lượt dở không hỏi xác nhận (AC-6.3, AC-8.5) (source: assumption — một lượt chỉ vài chục giây, xác nhận gây phiền)
- Q: Người dùng trình đọc màn hình (không vẽ được) nhận được gì? → A: "Danh sách nét" dạng văn bản (số thứ tự, tên nét, hướng viết), "Từng nét" đọc từng nét, mọi điều khiển dùng được bằng bàn phím; khung viết vẫn cần vẽ bằng tay, chuột hoặc bút (REQ-15) (source: assumption — học thứ tự nét vẫn có giá trị khi không vẽ được)
- Q: Người thuận tay trái? → A: Tùy chọn "Thuận tay trái" dồn thanh công cụ sang trái; quy tắc kiểm tra không đổi (AC-15.1) (source: assumption — tránh tay che nút; thứ tự và hướng nét chuẩn không đổi theo tay thuận)
- Q: Có dùng được khi mất mạng? → A: Có, với chữ đã tải; kết quả lưu lại khi có mạng nếu S16 còn mở (AC-16.4, AC-16.5) (source: assumption — kiểm tra nét không cần mạng; không tải trước cả cấp trong MVP)
- Q: Giới hạn danh sách luyện từ 012? → A: Tối đa 100 chữ (AC-4.3) (source: assumption — một lần luyện thực tế; tránh danh sách vô hạn)
- [thay thế 2026-10-22 V15] Q: Vai trò Quản trị nội dung (016) có dùng S16? → A: Không; mở S16 → A05 (AC-1.4) (source: assumption — V14 chỉ nêu HV và GV; Quản trị nội dung xem trước dữ liệu ở màn hình của 016)
- Q: Dữ liệu luyện viết giữ bao lâu? → A: Tới khi tài khoản bị xóa; xóa trong 24 giờ sau đó (AC-14.5) (source: assumption — dữ liệu cá nhân tối thiểu, nhất quán với 011 AC-11.4)

### Session 2026-10-22 (chốt câu hỏi mở)

- Q: Q-1 — Chữ có lượt "Cần luyện thêm" trên S16 có được tự động đưa vào ôn tập lặp lại ngắt quãng (SRS) hoặc đánh dấu "từ khó" của 012, hay hai danh sách tách riêng? → A: Tách riêng trong MVP: "Chữ cần luyện" ở lại trong 013, không tự động nối với 012 theo chiều nào (thêm AC-14.6; §9 ghi "đồng bộ Chữ cần luyện với SRS 012" là ý tưởng sau MVP; §10, §11 cập nhật; mục "Có nối với SRS của 012 không?" của Session 2026-10-22 (V14) được gắn "[thay thế 2026-10-22]") (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối)

### Session 2026-10-22 (V15 — Tự học chỉ cho HV)

- Q: Yêu cầu gốc? → A: Nguyên văn: "Hệ thống hiện tại chỉ có 2 role là GV và học viên, và phần quản lí các nội dung tự học sẽ làm chung phần quản lí của GV luôn, và GV chỉ quản lí thôi, chức năng tự học chỉ dành cho user học viên. Gom quản lí hệ thống vào cho GV." (source: stakeholder)
- Q: Dữ liệu chữ lấy từ đâu khi không còn "Quản trị nội dung"? → A: Mỗi GV có kho tự học riêng trong workspace ("Kho nội dung tự học", 016, T23–T27), nạp sẵn một bộ nội dung HSK mẫu (gồm dữ liệu nét và bộ thủ) mà GV sửa / thêm / ẩn tùy ý; HV luyện trên kho của workspace mình (AC-1.2, §3, §7, §10) (source: stakeholder)
- Q: Ai dùng S16? → A: Chỉ HV: mọi HV đã kích hoạt, không bị khóa, không phân biệt lớp. GV không dùng S16, không có lối vào, không có dữ liệu luyện viết riêng (AC-1.1, AC-1.2, AC-1.3, US-1 … US-4, US-6, §9 Removed) (source: stakeholder)
- Q: GV mở S16 bằng đường dẫn trực tiếp thì sao? → A: A05 "Không tìm thấy nội dung bạn yêu cầu.", không lộ dữ liệu; GV xem trước thứ tự nét chỉ trong T23–T27 (AC-1.4 viết lại tại chỗ thay cho AC chặn vai trò "Quản trị nội dung") (source: assumption — nhất quán với quy tắc A05 của sản phẩm và với 012 AC-1.4)
- Q: Bố cục máy tính của S16 còn không? → A: Còn, chỉ như "HV trên màn hình rộng" (≥ 1024 px, khung ≥ 400 px, viết bằng chuột hoặc bút) (AC-1.5, NFR-7) (source: assumption — spec đã mô tả bố cục rộng; HV vẫn có thể luyện trên máy tính hoặc máy tính bảng)
- Q: Đường dẫn tới một chữ không có trong kho của workspace HV? → A: A05 giống hệt chữ không tồn tại (thêm AC-1.7); chữ có trong kho nhưng chưa có dữ liệu nét vẫn theo AC-16.1 (source: assumption — quy tắc cách ly workspace A05 của sản phẩm)
- Q: GV sửa / ẩn chữ thì dữ liệu của HV ra sao? → A: Giữ nguyên các quy tắc hiện có, nay do GV kích hoạt và chỉ ảnh hưởng HV của workspace đó: lượt đang luyện dùng dữ liệu đã tải, lần mở sau dùng dữ liệu mới (AC-16.2); chữ bị ẩn, lưu trữ hoặc gỡ nét giữ dòng trong "Lịch sử" / "Chữ cần luyện" với "Không còn dữ liệu luyện" (AC-16.3) (source: assumption — thống nhất với 012 REQ-19 và 016; nguyên tắc "không bao giờ mất dữ liệu học")
- Q: Riêng tư thay đổi gì? → A: Không đổi: dữ liệu luyện viết riêng tư của HV, GV không thấy kể cả trên T23–T27, không ảnh hưởng 008/009; xóa trong 24 giờ khi xóa tài khoản HV (AC-14.2, AC-14.5, NFR-9) (source: stakeholder — V15 không đổi điều kiện riêng tư của V14)
- Q: Khối lượng dữ liệu? → A: Tính theo kho của từng workspace: một cấp HSK tới 1.500 chữ trong kho của một workspace; tổng tải lưu kết quả giữ 100 lượt mỗi giây trên toàn hệ thống (NFR-3) (source: assumption — bộ HSK mẫu giống nhau ở mọi workspace lúc khởi tạo; GV thêm chữ không làm một cấp vượt quá danh sách chữ HSK chuẩn nhiều)
