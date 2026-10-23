---
id: 016
slug: content-library
title: Self-study content library
status: draft
branch: feat/016-content-library
created: 2026-10-22
updated: 2026-10-22
approved_by:
approved_at:
---

# Self-study content library (Kho nội dung tự học)

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

Quyết định V14 của stakeholder (2026-10-22) thêm khu **Tự học** không cần lớp: học từ vựng thông minh (012), luyện
viết chữ Hán (013), luyện nghe & nói (014) và thi thử HSK (015). Quyết định V15 cùng ngày chốt rằng hệ thống **chỉ có
hai vai trò, GV và HV**: việc quản lý nội dung tự học **gom vào phần quản lý của GV**, GV chỉ quản lý, còn chức năng tự
học **chỉ dành cho HV**. Vì vậy module 016 là **Kho nội dung tự học của từng workspace**: mỗi GV có kho riêng, được
nạp sẵn **"Bộ nội dung mẫu HSK"** (do đội nội dung SAT chuẩn bị ngoài sản phẩm, HSK 1–6 và "HSK 7–9") ngay khi
workspace được tạo; sau khi nạp, nội dung thuộc về GV — sửa, thêm, ẩn (lưu trữ) tùy ý. GV quản lý kho trên năm màn
hình T23–T27 (mục "Kho tự học" trên thanh bên): từ vựng HSK kèm âm thanh và câu ví dụ, dữ liệu chữ Hán (thứ tự nét,
bộ thủ, cấu tạo), bài nghe và hội thoại, kịch bản đóng vai, đề thi thử và đề kiểm tra cuối chương — nhập tệp có báo
cáo lỗi theo dòng, xuất bản, lưu trữ mà không làm hỏng lịch sử học, phiên bản đề đã có người làm, **nguồn / giấy
phép** và lịch sử thay đổi. Mọi HV đã kích hoạt, không bị khóa của workspace dùng nội dung "Đã xuất bản" của kho đó
qua 012–015 (S13–S20). Kết quả mong muốn: HV của mỗi GV có nội dung tự học chuẩn HSK ngay từ ngày đầu, GV toàn quyền
điều chỉnh nội dung cho HV của mình, HV không bao giờ thấy bản nháp, và không dữ liệu nào lọt sang workspace khác hay
lộ dữ liệu tự học riêng của HV cho GV.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Kho có nội dung ngay khi GV bắt đầu | Tỷ lệ workspace mới có Kho tự học nạp xong Bộ nội dung mẫu HSK trong ≤ 5 phút sau khi tạo | ≥ 95% (NFR-11) |
| Bộ mẫu đủ từ vựng cho khu Tự học | Tỷ lệ từ trong danh sách từ vựng chuẩn của mỗi cấp HSK 1–4 có trong Bộ nội dung mẫu HSK và được nạp ở trạng thái "Đã xuất bản" | ≥ 95% mỗi cấp (điều kiện ra mắt — §10) |
| Từ vựng có phát âm bản xứ | Tỷ lệ mục từ vựng "Đã xuất bản" của Bộ nội dung mẫu HSK có âm thanh phát âm | ≥ 90% (T23 hiển thị "Từ thiếu âm thanh") |
| 013 luyện viết được mọi chữ đã học | Tỷ lệ chữ Hán xuất hiện trong từ vựng "Đã xuất bản" HSK 1–4 của Bộ nội dung mẫu có dữ liệu chữ "Đã xuất bản" với "Đủ dữ liệu nét" | ≥ 98% |
| Nhập nội dung nhanh | Thời gian từ khi chọn tệp 5 000 dòng tới khi có báo cáo kiểm tra theo dòng | ≤ 60 giây p95 (NFR-1) |
| Không làm hỏng dữ liệu học | Số bộ từ cá nhân, trạng thái ôn tập, lịch sử luyện hoặc kết quả thi thử không mở được sau khi nội dung bị lưu trữ hoặc có phiên bản mới | 0 (NFR-7) |
| Cô lập workspace | Số trường hợp GV xem/sửa được mục kho của workspace khác, hoặc HV dùng được nội dung kho của workspace khác (kiểm thử bảo mật + vận hành) | 0 (NFR-5) |
| Riêng tư dữ liệu tự học | Số trường hợp GV xem được dữ liệu tự học của một HV cụ thể trên T23–T27 | 0 (NFR-5) |
| Nội dung hợp pháp | Tỷ lệ mục kho có "Nguồn / giấy phép" | 100% (AC-14.1) |

## 3. Actors & Context

- **Giáo viên (GV)** — chủ và quản trị viên duy nhất của workspace (001), dùng máy tính (≥ 1280 px). Quản lý Kho tự
  học của workspace mình trên T23–T27, mở từ mục "Kho tự học" trên thanh bên (001 AC-20.2): sửa nội dung mẫu cho phù
  hợp HV, thêm từ, chữ, bài nghe, kịch bản, đề, nhập tệp, tải âm thanh, xuất bản, lưu trữ. **Chỉ quản lý**: GV không
  dùng khu Tự học S13–S20 với tư cách người học (001 AC-20.4); GV kiểm tra nội dung bằng "Nghe thử", "Xem thử", "Xem
  thứ tự nét", "Xem trước" ngay trong T24–T27. Hiện nay GV chỉ soạn nội dung theo lớp (002, 010) và chưa có nội dung tự
  học nào cho HV.
- **Học viên (HV)** — mọi HV đã kích hoạt, không bị khóa của workspace (001 AC-20.3), không cần lớp. Dùng nội dung
  "Đã xuất bản" của Kho tự học thuộc workspace của mình qua 012–015 (S13–S20). Không bao giờ vào T23–T27 (001
  AC-20.10); không bao giờ thấy "Nháp" hay nội dung của workspace khác.
- **Đội nội dung SAT (ngoài sản phẩm)** — chuẩn bị và cập nhật "Bộ nội dung mẫu HSK" (HSK 1–6 và "HSK 7–9": từ vựng +
  âm thanh, chữ Hán + dữ liệu nét + bộ thủ, bài nghe, kịch bản đóng vai, đề thi thử và kiểm tra cuối chương, kèm nguồn
  / giấy phép). Không có tài khoản hay màn hình trong SAT; hệ thống chỉ sao bộ mẫu vào kho của workspace (REQ-15).
- **Các module 012–015** — đọc nội dung kho của workspace của HV: 012 (từ vựng, câu ví dụ, âm thanh, chương, chủ đề),
  013 (dữ liệu chữ Hán, nét, bộ thủ, cấu tạo), 014 (bài nghe, hội thoại, kịch bản đóng vai, âm thanh từ và câu), 015 (đề
  thi thử, đề kiểm tra cuối chương, phiên bản, đáp án, giải thích, thẻ kiến thức). Chúng ghi dữ liệu học riêng của từng
  HV và cung cấp cho 016 chỉ số đếm tổng hợp ẩn danh của workspace (AC-13.4, AC-11.6).

## 4. User Stories

- US-8 (P1): Là GV, tôi muốn Kho tự học của workspace có sẵn Bộ nội dung mẫu HSK ngay khi tôi bắt đầu, để HV của tôi
  tự học được ngay mà tôi không phải soạn từ đầu, và tôi vẫn sửa được mọi thứ cho phù hợp lớp của mình.
  - Why this priority: không có nội dung thì khu Tự học (012–015) không dùng được; GV cá nhân không thể tự soạn hàng
    nghìn từ, âm thanh và dữ liệu nét.
  - Independent test: GV mới đăng ký ở A02 → mở "Kho tự học" → T23 hiển thị "Đang chuẩn bị Bộ nội dung mẫu HSK…" rồi
    trong ≤ 5 phút hiển thị số mục "Đã xuất bản" theo 7 cấp đúng như bộ mẫu; HV vừa kích hoạt mở S13 → thấy từ HSK 1;
    GV sửa nghĩa của 你好 → HV của GV này thấy nghĩa mới trong ≤ 5 phút, HV của GV khác vẫn thấy nghĩa gốc.
- US-1 (P1): Là GV, tôi muốn thêm, sửa và nhập hàng nghìn mục từ vựng HSK từ tệp, kèm âm thanh bản xứ và câu ví dụ, rồi
  xuất bản, để HV của tôi có bộ từ vựng phù hợp cho học từ vựng và ôn tập lặp lại (012).
  - Why this priority: 012 là lối vào chính của khu Tự học; GV cần bổ sung từ của giáo trình riêng ngoài bộ mẫu.
  - Independent test: GV tải tệp mẫu, điền 5 000 dòng HSK 3 (có 12 dòng lỗi, 3 dòng trùng với kho) → báo cáo "4 985 hợp
    lệ · 12 lỗi · 3 trùng" kèm số dòng, cột, lý do trong ≤ 60 giây → "Nhập 4 985 từ hợp lệ" → 4 985 từ ở "Nháp"; tải
    tệp âm thanh hàng loạt → từ có âm thanh; chọn và "Xuất bản" → HV của workspace thấy từ ở S13 trong ≤ 5 phút.
- US-2 (P1): Là GV, tôi muốn quản lý dữ liệu chữ Hán (thứ tự nét, số nét, bộ thủ, cấu tạo) và biết chữ nào còn thiếu
  dữ liệu, để luyện viết (013) kiểm được từng nét theo nét mẫu cho mọi chữ HV của tôi học.
  - Why this priority: 013 không thể kiểm từng nét nếu chữ thiếu dữ liệu nét; từ GV thêm có thể chứa chữ ngoài bộ mẫu.
  - Independent test: T27 báo "HSK 1 · 7 chữ chưa có dữ liệu" → "Tạo mục nháp cho các chữ này" → tải tệp dữ liệu chữ →
    chữ 你 "Đủ dữ liệu nét", 7 nét, bộ 亻 → "Xem thứ tự nét" phát đủ 7 nét đúng thứ tự → "Xuất bản".
- US-3 (P1): Là GV, tôi muốn soạn bài nghe, hội thoại có câu hỏi và kịch bản đóng vai có âm thanh từng lời thoại, để
  luyện nghe & nói (014) có bài nghe chọn đáp án và đóng vai theo kịch bản phù hợp HV của tôi.
  - Why this priority: là nguồn nội dung duy nhất của 014.
  - Independent test: GV tạo kịch bản "Gọi món ở quán mì" (HSK 2, vai "Khách" và "Phục vụ", 8 lời thoại); "Xuất bản"
    khi một lời thiếu âm thanh → bị chặn với lý do "Lời thoại 5 chưa có âm thanh."; thêm âm thanh → xuất bản được.
- US-4 (P1): Là GV, tôi muốn soạn đề thi thử và đề kiểm tra cuối chương theo cấp, với phần thi, thời gian, đáp án, giải
  thích, và sửa đề đã có HV làm mà không làm sai kết quả cũ, để thi thử HSK (015) tự chấm và giải thích được.
  - Why this priority: là nguồn nội dung duy nhất của 015; sửa đề sai cách sẽ làm sai kết quả của HV.
  - Independent test: đề "HSK 3 – Đề thi thử số 1" (từ bộ mẫu) đã có lượt làm → "Sửa" tạo "Phiên bản 2" ở Nháp; sửa
    đáp án câu 12 → "Xuất bản" → lượt làm mới dùng phiên bản 2; các kết quả cũ vẫn hiển thị câu hỏi, đáp án và điểm của
    phiên bản 1.
- US-5 (P1): Là HV, tôi muốn bộ từ cá nhân, lịch ôn tập và kết quả thi thử của tôi vẫn mở được khi GV lưu trữ hoặc sửa
  nội dung, để không mất công học.
  - Why this priority: nguyên tắc sản phẩm "Never lose learning data".
  - Independent test: HV có từ 爱 trong bộ từ cá nhân và lịch ôn → GV "Lưu trữ" 爱 → HV vẫn mở được bộ từ và ôn 爱 với
    nội dung đã xuất bản cuối cùng; HV khác của workspace tìm 爱 ở S13 → không thấy.
- US-6 (P1): Là GV, tôi muốn kho của tôi tách biệt hoàn toàn khỏi workspace khác, mọi thay đổi có lịch sử lúc nào, làm
  gì, và mọi mục có nguồn / giấy phép, để kiểm soát nội dung HV của tôi học và chứng minh quyền sử dụng nội dung.
  - Why this priority: workspace cô lập là quyết định gốc (D1); nội dung không rõ nguồn là rủi ro pháp lý.
  - Independent test: GV B mở đường dẫn mục từ vựng của GV A → A05 "Không tìm thấy nội dung bạn yêu cầu."; tab "Lịch sử
    thay đổi" của từ 你好 hiển thị "Sao từ Bộ nội dung mẫu HSK" và "22/10/2026 09:14 · Sửa · Nghĩa tiếng Việt: "xin
    chào" → "xin chào; chào bạn"" và không có cách sửa hay xóa dòng đó.
- US-7 (P2): Là GV, tôi muốn một trang tổng quan số lượng nội dung theo cấp và loại, cảnh báo chất lượng, thay đổi gần
  đây và số đếm sử dụng ẩn danh của HV, để biết kho còn thiếu gì và nội dung nào được dùng.
  - Why this priority: hữu ích để lập kế hoạch nhưng không chặn việc soạn nội dung.
  - Independent test: T23 hiển thị ô "Từ vựng × HSK 3: 980 đã xuất bản · 15 nháp · 2 lưu trữ"; bấm ô → T24 lọc sẵn
    HSK 3; "Từ thiếu âm thanh: 15" → T24 lọc "Thiếu âm thanh"; workspace có 3 HV → khối "Sử dụng 30 ngày qua" hiển thị
    "Chưa đủ dữ liệu để hiển thị" thay cho số đếm.

## 5. Functional Requirements

### REQ-1: Self-study library area, workspace isolation and privacy — Khu Kho tự học, cô lập workspace và quyền riêng tư

<!-- Story: US-6 · Priority: P1 · Screens: T23–T27, A05, S13–S20 (012–015) · Lối vào, định tuyến theo vai trò: 001 REQ-20 -->

- AC-1.1: WHEN GV mở bất kỳ màn hình nào của Kho tự học THE SYSTEM SHALL hiển thị màn hình trong khung giao diện GV với mục "Kho tự học" trên thanh bên được đánh dấu đang chọn, kèm thanh điều hướng của kho gồm "Tổng quan" (T23), "Từ vựng tự học" (T24), "Nghe & hội thoại" (T25), "Đề thi thử HSK" (T26) và "Chữ Hán & bộ thủ" (T27).
- AC-1.2: THE SYSTEM SHALL chỉ cho mỗi GV xem và thao tác trên Kho tự học của workspace của chính GV đó, và mọi danh sách, kết quả tìm kiếm, bộ đếm, lô nhập, lịch sử thay đổi và tổng quan trên T23–T27 chỉ chứa dữ liệu của workspace đó.
- AC-1.3: IF GV mở một mục kho không tồn tại, đã bị xóa vĩnh viễn hoặc thuộc workspace khác, kể cả bằng đường dẫn trực tiếp THEN THE SYSTEM SHALL không hiển thị dữ liệu nào, không thực hiện thao tác và hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." giống hệt nhau cho mọi trường hợp đó.
- AC-1.5: IF GV lưu một mục mà chính GV đó đã lưu thay đổi khác cho mục này từ một tab hoặc thiết bị khác sau khi mở mục ở màn hình hiện tại THEN THE SYSTEM SHALL không ghi đè, giữ nguyên các giá trị đang nhập trên màn hình và hiển thị "Nội dung này vừa được cập nhật lúc {HH:mm} ở một cửa sổ khác. Tải lại để xem bản mới nhất trước khi lưu." kèm nút "Tải lại".
- AC-1.6: THE SYSTEM SHALL không hiển thị trên T23–T27 bất kỳ dữ liệu tự học nào gắn với một HV cụ thể (tên, email, bộ từ cá nhân, trạng thái ôn tập, lịch sử luyện, thu âm, lượt thi hay kết quả thi thử), và chỉ hiển thị số liệu sử dụng dưới dạng số đếm tổng hợp ẩn danh theo AC-11.6 và AC-13.4.
- AC-1.7: WHILE HV dùng khu Tự học (S13–S20) THE SYSTEM SHALL chỉ cung cấp cho HV nội dung của Kho tự học thuộc workspace của HV đó, và không bao giờ cung cấp nội dung của Kho tự học thuộc workspace khác.
- AC-1.8: IF một HV yêu cầu một mục kho thuộc workspace khác, hoặc một mục mà HV không được dùng theo AC-3.2, AC-3.5 và AC-3.6, kể cả bằng đường dẫn trực tiếp THEN THE SYSTEM SHALL không hiển thị nội dung của mục đó và hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu."

### REQ-2: HSK levels, chapters and topics — Cấp HSK, chương và chủ đề

<!-- Story: US-1, US-4 · Priority: P1 · Screens: T24 (tab "Chương & chủ đề"), T25, T26 -->

- AC-2.1: THE SYSTEM SHALL gắn mỗi mục kho với đúng một cấp HSK chọn từ danh sách cố định gồm 7 cấp "HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6", "HSK 7–9", trong đó "HSK 7–9" là một cấp duy nhất theo chuẩn HSK chính thức, không tách thành HSK 7, HSK 8, HSK 9.
- AC-2.2: WHEN GV mở tab "Chương & chủ đề" của T24 và chọn một cấp THE SYSTEM SHALL liệt kê các chương của cấp đó trong kho của workspace theo thứ tự (số thứ tự, tên chương, số mục từ vựng, số đề kiểm tra cuối chương) và cho GV "Thêm chương" (tên 1–60 ký tự, không trùng trong cùng cấp), đổi tên và sắp xếp lại bằng kéo thả hoặc nút "Lên" / "Xuống", tối đa 40 chương mỗi cấp.
- AC-2.3: IF GV chọn "Xóa" một chương còn mục từ vựng hoặc đề kiểm tra cuối chương gắn với nó THEN THE SYSTEM SHALL không xóa và hiển thị "Chương còn {n} từ vựng và {m} đề kiểm tra. Hãy chuyển chúng sang chương khác trước khi xóa."
- AC-2.4: THE SYSTEM SHALL cho GV quản lý ở tab "Chương & chủ đề" một danh mục "Chủ đề" của kho dùng chung cho mọi cấp (tên 1–40 ký tự, không trùng khi so không phân biệt hoa thường, tối đa 200 chủ đề) và cho gắn 0–5 chủ đề vào mỗi mục từ vựng, bài nghe và kịch bản đóng vai.
- AC-2.5: WHEN GV xóa một chủ đề đang được gắn vào ít nhất một mục và xác nhận "Gỡ chủ đề "{tên}" khỏi {n} mục và xóa chủ đề?" THE SYSTEM SHALL gỡ chủ đề khỏi mọi mục đó, xóa chủ đề và không đổi trạng thái của các mục.

### REQ-3: Content lifecycle — Vòng đời nội dung: Nháp, Đã xuất bản, Lưu trữ

<!-- Story: US-1, US-5 · Priority: P1 · Screens: T24, T25, T26, T27 -->

- AC-3.1: THE SYSTEM SHALL gán cho mọi mục kho (mục từ vựng, chữ Hán, bài nghe, kịch bản đóng vai, đề) đúng một trong ba trạng thái "Nháp", "Đã xuất bản", "Lưu trữ", và mọi mục do GV mới tạo, mới nhập hoặc mới tạo phiên bản đều ở "Nháp" (trạng thái ban đầu của mục được sao từ Bộ nội dung mẫu HSK theo AC-15.2).
- AC-3.2: WHILE một mục ở trạng thái "Nháp" THE SYSTEM SHALL không cho bất kỳ HV nào thấy hoặc dùng mục đó ở khu Tự học (012–015).
- AC-3.3: WHEN GV chọn "Xuất bản" cho một mục, hoặc cho tối đa 500 mục đã chọn, đạt điều kiện xuất bản của loại mục đó (AC-4.9, AC-7.6, AC-8.3, AC-9.3, AC-10.6) THE SYSTEM SHALL chuyển các mục đó sang "Đã xuất bản" và cung cấp chúng cho mọi HV đã kích hoạt, không bị khóa của workspace ở khu Tự học trong thời hạn của NFR-3.
- AC-3.4: IF trong các mục được chọn để xuất bản có mục chưa đạt điều kiện xuất bản THEN THE SYSTEM SHALL chỉ xuất bản các mục đạt và hiển thị "Đã xuất bản {x} mục. {y} mục chưa đủ điều kiện:" kèm danh sách các mục chưa đạt và mọi lý do của từng mục.
- AC-3.5: WHEN GV chọn "Lưu trữ" cho một hoặc nhiều mục "Đã xuất bản" (tối đa 500) và xác nhận "Lưu trữ {n} mục? Người học sẽ không thấy các mục này khi tìm kiếm hoặc bắt đầu học mới; dữ liệu học đã có được giữ nguyên." THE SYSTEM SHALL chuyển các mục sang "Lưu trữ" và gỡ chúng khỏi danh sách duyệt, tìm kiếm, việc thêm vào bộ từ và việc bắt đầu bài luyện hay lượt thi mới ở khu Tự học trong thời hạn của NFR-3.
- AC-3.6: WHILE một mục ở trạng thái "Lưu trữ" THE SYSTEM SHALL tiếp tục cung cấp nội dung đã xuất bản cuối cùng của mục đó cho mọi dữ liệu học của HV đã tham chiếu tới nó trước khi lưu trữ (bộ từ cá nhân, trạng thái ôn tập lặp lại, từ đã đánh dấu khó, lịch sử luyện viết, luyện nghe, đóng vai, kết quả thi thử) để các dữ liệu đó vẫn mở và hiển thị đầy đủ.
- AC-3.7: WHEN GV chọn "Khôi phục" một mục "Lưu trữ" THE SYSTEM SHALL đưa mục về "Đã xuất bản" nếu mục vẫn đạt điều kiện xuất bản, nếu không thì đưa về "Nháp" và hiển thị "Đã chuyển về Nháp vì chưa đủ điều kiện xuất bản:" kèm danh sách lý do.
- AC-3.8: THE SYSTEM SHALL chỉ cung cấp thao tác "Xóa" (sau hộp thoại "Xóa vĩnh viễn "{tên mục}"? Thao tác này không thể hoàn tác.") cho mục chưa từng được xuất bản, và không cung cấp bất kỳ cách xóa nào cho mục đã từng ở trạng thái "Đã xuất bản", kể cả mục được sao từ Bộ nội dung mẫu HSK ở trạng thái "Đã xuất bản" (GV ẩn các mục này bằng "Lưu trữ").
- AC-3.9: IF GV lưu thay đổi một mục "Đã xuất bản" làm mục không còn đạt điều kiện xuất bản THEN THE SYSTEM SHALL không lưu và hiển thị "Không lưu được vì mục đang xuất bản sẽ không còn đủ điều kiện:" kèm danh sách lý do, còn khi mục vẫn đạt điều kiện thì lưu và áp dụng thay đổi cho HV của workspace trong thời hạn của NFR-3 (đề đã có lượt làm theo REQ-11).
- AC-3.10: THE SYSTEM SHALL gán cho mỗi mục kho một mã nhận diện ổn định không bao giờ đổi khi mục được sửa, xuất bản, lưu trữ hay khôi phục, và không bao giờ dùng lại mã của mục khác (mỗi mục được sao từ Bộ nội dung mẫu HSK vào một workspace có mã riêng của workspace đó; mỗi phiên bản đề có mã riêng gắn với mã của đề), để dữ liệu học của 012–015 luôn trỏ đúng mục.

### REQ-4: Vocabulary entries — Mục từ vựng (T24)

<!-- Story: US-1 · Priority: P1 · Screens: T24 -->

- AC-4.1: WHEN GV chọn "Thêm từ" hoặc mở một mục từ vựng trên T24 THE SYSTEM SHALL mở biểu mẫu mục từ gồm "Chữ Hán", "Pinyin", "Từ loại", "Nghĩa tiếng Việt", "Cách dùng", "Cấp HSK", "Chương", "Thứ tự", "Chủ đề", "Âm thanh phát âm", "Câu ví dụ", "Nguồn / giấy phép", nhãn trạng thái và tab "Lịch sử thay đổi", trong đó "Chữ Hán", "Pinyin", "Từ loại", "Nghĩa tiếng Việt", "Cấp HSK" và "Nguồn / giấy phép" là bắt buộc để lưu.
- AC-4.2: IF "Chữ Hán" dài hơn 12 ký tự, chứa ký tự không phải chữ Hán, hoặc chứa chữ phồn thể có dạng giản thể khác (ví dụ 學) THEN THE SYSTEM SHALL không lưu và hiển thị tương ứng "Chữ Hán chỉ gồm 1–12 chữ Hán." hoặc "Hãy dùng chữ giản thể: {chữ phồn thể} → {chữ giản thể}."
- AC-4.3: WHEN GV nhập Pinyin dùng số thanh (ví dụ "ni3 hao3", "lv4", thanh nhẹ bằng 5 hoặc không số) THE SYSTEM SHALL chuyển thành pinyin có dấu thanh ("nǐ hǎo", "lǜ") khi GV rời ô và lưu dạng có dấu.
- AC-4.4: IF Pinyin chứa âm tiết không có trong bảng âm tiết tiếng Phổ thông, hoặc số âm tiết khác số chữ Hán (chữ 儿 đứng cuối âm tiết được ghi bằng "r" và không tính thành âm tiết riêng) THEN THE SYSTEM SHALL không lưu và hiển thị "Pinyin không khớp với chữ Hán: cần {n} âm tiết, đang có {m}." hoặc "Âm tiết không hợp lệ: {âm tiết}."
- AC-4.5: THE SYSTEM SHALL cho chọn "Từ loại" 1–3 giá trị từ danh mục cố định "Danh từ", "Động từ", "Tính từ", "Phó từ", "Đại từ", "Số từ", "Lượng từ", "Giới từ", "Liên từ", "Trợ từ", "Thán từ", "Từ tượng thanh", "Cụm từ cố định", nhận "Nghĩa tiếng Việt" là 1–5 nghĩa có thứ tự (mỗi nghĩa 1–150 ký tự, sắp xếp lại được bằng "Lên" / "Xuống", nghĩa đầu tiên là nghĩa chính) và "Cách dùng" tùy chọn 0–500 ký tự.
- AC-4.6: WHEN GV thêm "Câu ví dụ" (0–5 câu mỗi từ, có thứ tự, sắp xếp lại được bằng "Lên" / "Xuống") THE SYSTEM SHALL yêu cầu mỗi câu có "Câu" bằng chữ Hán giản thể 2–80 ký tự có chứa đúng chuỗi "Chữ Hán" của mục, "Pinyin của câu" có dấu thanh (chuyển từ số thanh như AC-4.3), "Nghĩa của câu" 1–300 ký tự và cho thêm âm thanh ngắn tùy chọn, và nếu câu không chứa từ thì hiển thị "Câu ví dụ phải chứa từ "{Chữ Hán}"."
- AC-4.7: IF cặp "Chữ Hán" + "Pinyin" (so khớp bỏ khoảng trắng, không phân biệt hoa thường, có phân biệt dấu thanh) trùng với một mục từ vựng khác trong kho của workspace ở bất kỳ trạng thái nào THEN THE SYSTEM SHALL không lưu và hiển thị "Từ "{Chữ Hán} {Pinyin}" đã có trong kho ({Cấp HSK} · {trạng thái})." kèm liên kết "Mở mục đã có".
- AC-4.8: WHEN "Chữ Hán" của mục trùng với mục từ vựng khác trong kho của workspace nhưng "Pinyin" khác THE SYSTEM SHALL cho lưu và hiển thị cảnh báo "Kho đã có {n} từ cùng chữ Hán với cách đọc khác:" kèm danh sách các mục đó.
- AC-4.9: THE SYSTEM SHALL coi một mục từ vựng đạt điều kiện xuất bản khi mọi trường bắt buộc của AC-4.1 hợp lệ theo AC-4.2 đến AC-4.7 (âm thanh và câu ví dụ không bắt buộc), và WHILE mục chưa có "Âm thanh phát âm" hiển thị nhãn "Thiếu âm thanh" trên dòng của mục ở T24.
- AC-4.10: WHEN một mục từ vựng được thêm hoặc nhập THE SYSTEM SHALL gán "Thứ tự" của mục trong cấp HSK tiếp sau mục cuối cùng của cấp đó (một lô nhập giữ đúng thứ tự dòng trong tệp), và cho GV sửa "Thứ tự" (số nguyên 1–99 999) hoặc sắp xếp lại các từ của một chương bằng kéo thả hoặc "Lên" / "Xuống" ở tab "Chương & chủ đề".

### REQ-5: Vocabulary import — Nhập từ vựng từ tệp (T24)

<!-- Story: US-1 · Priority: P1 · Screens: T24 (hộp thoại "Nhập từ vựng") -->

- AC-5.1: WHEN GV chọn "Nhập từ tệp" trên T24 THE SYSTEM SHALL mở hộp thoại "Nhập từ vựng" gồm nút "Tải tệp mẫu" (tệp .xlsx có trang "Hướng dẫn" và các cột "Chữ Hán", "Pinyin", "Từ loại", "Nghĩa tiếng Việt" (các nghĩa theo thứ tự, ngăn bằng dấu ";"), "Cách dùng", "Cấp HSK", "Chương", "Chủ đề", "Câu ví dụ 1", "Pinyin câu 1", "Nghĩa câu 1" đến bộ cột của câu 3, "Nguồn / giấy phép"), ô chọn tệp và ô bắt buộc "Nguồn / giấy phép của lô" (3–200 ký tự).
- AC-5.2: IF tệp không phải .xlsx hoặc .csv mã hóa UTF-8 (xác định theo nội dung), lớn hơn 10 MB, có nhiều hơn 5 000 dòng dữ liệu, không đọc được hoặc thiếu một cột bắt buộc THEN THE SYSTEM SHALL từ chối cả tệp, không thêm gì và hiển thị "Tệp không hợp lệ: {lý do}. Hãy dùng tệp mẫu (.xlsx hoặc .csv UTF-8, tối đa 5 000 dòng, 10 MB)."
- AC-5.3: WHEN tệp hợp lệ được chọn THE SYSTEM SHALL kiểm tra từng dòng theo các quy tắc của REQ-4 mà chưa thêm gì vào kho, hiển thị tiến trình theo phần trăm, rồi hiển thị báo cáo gồm số dòng hợp lệ, số dòng lỗi, số dòng trùng và bảng các dòng lỗi hoặc trùng với số dòng trong tệp, tên cột và lý do.
- AC-5.4: THE SYSTEM SHALL đánh dấu "Trùng với kho" cho dòng có cặp "Chữ Hán" + "Pinyin" đã có trong kho của workspace (so khớp như AC-4.7, kể cả mục được sao từ Bộ nội dung mẫu HSK) và "Trùng với dòng {k}" cho dòng trùng một dòng đứng trước trong cùng tệp, và không bao giờ nhập các dòng trùng.
- AC-5.5: WHEN GV chọn "Tải báo cáo lỗi" THE SYSTEM SHALL tải về tệp .xlsx chứa nguyên văn các dòng lỗi và trùng theo đúng cột của tệp mẫu kèm cột "Lý do", để GV sửa và nhập lại.
- AC-5.6: WHEN GV chọn "Nhập {n} từ hợp lệ" THE SYSTEM SHALL thêm toàn bộ {n} dòng hợp lệ ở trạng thái "Nháp" vào kho của workspace trong một lần trọn gói (thêm tất cả hoặc không thêm dòng nào), gán "Nguồn / giấy phép của lô" cho các dòng để trống cột "Nguồn / giấy phép", ghi lô nhập vào lịch sử thay đổi và hiển thị "Đã nhập {n} từ ở trạng thái Nháp."
- AC-5.7: IF tại lúc GV xác nhận nhập, kho của workspace đã có thêm mục trùng với một dòng đã được báo hợp lệ (ví dụ do một lần nhập khác của chính GV ở tab khác vừa hoàn tất) THEN THE SYSTEM SHALL không nhập dòng nào và hiển thị lại báo cáo đã cập nhật với các dòng đó được đánh dấu "Trùng với kho".

### REQ-6: Audio files — Âm thanh: tải lên, nghe thử, thay, gỡ và ghép hàng loạt

<!-- Story: US-1, US-3, US-4 · Priority: P1 · Screens: T24, T25, T26 -->

- AC-6.1: THE SYSTEM SHALL chỉ nhận tệp âm thanh MP3, M4A hoặc WAV (xác định theo nội dung tệp), với giới hạn 2 MB và 30 giây cho âm thanh ngắn (phát âm từ, câu ví dụ, lời thoại đóng vai) và 20 MB và 5 phút cho âm thanh dài (bài nghe, hội thoại, đoạn nghe của đề).
- AC-6.2: IF tệp âm thanh sai định dạng, vượt dung lượng, vượt thời lượng hoặc không đọc được THEN THE SYSTEM SHALL từ chối tệp, giữ âm thanh hiện có và hiển thị tương ứng "Chỉ hỗ trợ âm thanh MP3, M4A hoặc WAV.", "Tệp âm thanh vượt quá {2 MB | 20 MB}.", "Âm thanh dài quá {30 giây | 5 phút}." hoặc "Không đọc được tệp âm thanh này."
- AC-6.3: WHEN một tệp âm thanh hợp lệ được tải lên cho một mục THE SYSTEM SHALL hiển thị trình phát gồm nút phát/tạm dừng và thời lượng, cùng các nút "Thay âm thanh" và "Gỡ âm thanh", và lưu âm thanh cùng mục khi GV lưu mục.
- AC-6.4: WHEN GV chọn "Tải âm thanh hàng loạt" trên T24 và chọn tối đa 500 tệp THE SYSTEM SHALL ghép mỗi tệp với mục từ vựng trong kho của workspace có "Chữ Hán" trùng tên tệp (bỏ phần mở rộng), hoặc trùng "Chữ Hán" và pinyin số thanh khi tên tệp có dạng "{Chữ Hán}_{pinyin số thanh}" (ví dụ "行_xing2.mp3"), rồi hiển thị báo cáo "Ghép được", "Không tìm thấy từ", "Nhiều từ cùng chữ Hán — cần ghi kèm pinyin", "Từ đã có âm thanh" và "Tệp lỗi" (kèm lý do của AC-6.2) trước khi GV chọn "Lưu {x} âm thanh".
- AC-6.5: WHERE GV đánh dấu "Thay âm thanh đã có" trong hộp thoại tải hàng loạt THE SYSTEM SHALL thay âm thanh của các từ đã có âm thanh bằng tệp ghép được, còn khi không đánh dấu thì giữ nguyên âm thanh cũ của các từ đó.

### REQ-7: Hanzi character data — Dữ liệu chữ Hán và nét (T27)

<!-- Story: US-2 · Priority: P1 · Screens: T27 -->

- AC-7.1: WHEN GV mở T27 THE SYSTEM SHALL liệt kê các mục chữ Hán của kho với chữ, pinyin, âm Hán Việt, số nét, bộ thủ, cấp HSK, trạng thái dữ liệu nét ("Đủ dữ liệu nét", "Thiếu dữ liệu nét" hoặc "Lệch số nét") và trạng thái xuất bản, lọc được theo cấp, bộ thủ, trạng thái dữ liệu nét và trạng thái.
- AC-7.2: THE SYSTEM SHALL hiển thị ở đầu T27, cho từng cấp, số "Chữ chưa có dữ liệu" là các chữ Hán xuất hiện trong mục từ vựng "Đã xuất bản" của cấp đó trong kho mà chưa có mục chữ Hán "Đã xuất bản", kèm "Xem danh sách" và "Tạo mục nháp cho các chữ này" (tạo mục chữ Hán ở "Nháp" với chữ và cấp HSK thấp nhất của các từ chứa chữ đó).
- AC-7.3: WHEN GV mở hoặc tạo một mục chữ Hán THE SYSTEM SHALL hiển thị biểu mẫu gồm "Chữ" (đúng 1 chữ Hán giản thể, không trùng mục chữ Hán khác trong kho của workspace), "Pinyin" (1–5 cách đọc có dấu thanh), "Âm Hán Việt" (tùy chọn), "Nghĩa" (1–200 ký tự), "Cấp HSK", "Số nét" (1–64), "Bộ thủ" (chọn từ danh mục 214 bộ thủ kèm tên Hán Việt, ví dụ "氵 Thủy"), "Cấu tạo" (một kiểu trong "Độc thể", "Trái – phải", "Trên – dưới", "Trái – giữa – phải", "Trên – giữa – dưới", "Bao quanh", "Bao ba phía", "Bao hai phía", "Khảm" và 0–6 thành phần, mỗi thành phần là một chữ Hán hoặc bộ thủ), "Mẹo nhớ" (tùy chọn, 0–300 ký tự), "Dữ liệu nét" và "Nguồn / giấy phép".
- AC-7.4: WHEN GV chọn "Nhập dữ liệu nét" trên T27 và tải một tệp theo định dạng của "Tải tệp mẫu dữ liệu nét" (tối đa 3 000 chữ, 20 MB) THE SYSTEM SHALL ghi nhận cho mỗi chữ trong tệp thứ tự các nét cùng hình dạng và hướng viết của từng nét, tạo mục chữ Hán "Nháp" cho chữ chưa có mục, không đổi các trường khác của mục đã có, và hiển thị báo cáo số chữ đã nhận, số chữ lỗi kèm lý do.
- AC-7.5: WHEN GV chọn "Xem thứ tự nét" của một chữ có dữ liệu nét THE SYSTEM SHALL phát minh họa viết lần lượt từng nét theo đúng thứ tự và hướng của dữ liệu, có số thứ tự trên mỗi nét, cùng các nút "Phát lại" và "Từng nét".
- AC-7.6: IF GV xuất bản một chữ chưa có dữ liệu nét hoặc có số nét trong dữ liệu nét khác "Số nét" THEN THE SYSTEM SHALL không xuất bản và nêu lý do "Chưa có dữ liệu nét." hoặc "Dữ liệu nét có {a} nét nhưng Số nét là {b}." (trạng thái dữ liệu nét lần lượt là "Thiếu dữ liệu nét", "Lệch số nét").
- AC-7.7: WHEN GV mở tab "Bộ thủ" của T27 THE SYSTEM SHALL liệt kê đủ 214 bộ thủ theo thứ tự chuẩn, mỗi bộ gồm số thứ tự, dạng chính và các dạng biến thể, tên Hán Việt, nghĩa tiếng Việt, số nét và số chữ "Đã xuất bản" thuộc bộ đó trong kho, cho GV sửa tên Hán Việt và nghĩa tiếng Việt (chỉ trong kho của workspace), và không cho thêm hay xóa bộ thủ.
- AC-7.8: WHEN GV nhập từ khóa vào ô tìm kiếm của T27 THE SYSTEM SHALL trả về các chữ trùng với chữ Hán đã nhập, có một cách đọc khớp từ khóa khi bỏ qua dấu thanh (ví dụ "ni" tìm ra 你 và 泥), hoặc có "Nghĩa" hay "Âm Hán Việt" chứa từ khóa khi so không phân biệt hoa thường và dấu tiếng Việt.

### REQ-8: Listening items — Bài nghe và hội thoại (T25, tab "Bài nghe")

<!-- Story: US-3 · Priority: P1 · Screens: T25 -->

- AC-8.1: WHEN GV chọn "Thêm bài nghe" ở tab "Bài nghe" của T25 THE SYSTEM SHALL mở biểu mẫu gồm "Tiêu đề" (1–100 ký tự), "Loại" ("Nghe câu" hoặc "Hội thoại"), "Cấp HSK", "Chủ đề", "Âm thanh" (âm thanh dài), "Người nói" (với "Hội thoại": 2–6 tên, mỗi tên 1–30 ký tự), "Lời thoại" (1–60 dòng, mỗi dòng gồm người nói, chữ Hán 1–200 ký tự, pinyin có dấu thanh, nghĩa tiếng Việt 1–300 ký tự), "Câu hỏi" (0–10) và "Nguồn / giấy phép".
- AC-8.2: WHEN GV thêm một câu hỏi cho bài nghe THE SYSTEM SHALL yêu cầu nội dung câu hỏi (1–300 ký tự, chữ Hán hoặc tiếng Việt), 2–4 lựa chọn khác nhau (mỗi lựa chọn 1–100 ký tự), đúng một đáp án đúng và "Giải thích" (1–500 ký tự).
- AC-8.3: THE SYSTEM SHALL coi một bài nghe đạt điều kiện xuất bản khi có âm thanh, có ít nhất một dòng lời thoại, mọi dòng đủ chữ Hán, pinyin và nghĩa, bài "Hội thoại" có ít nhất 2 người nói, và mọi câu hỏi đủ theo AC-8.2, và nêu từng lý do còn thiếu (ví dụ "Chưa có âm thanh.", "Câu hỏi 2 chưa có giải thích.").
- AC-8.4: WHEN GV chọn "Nghe thử" một bài nghe THE SYSTEM SHALL phát âm thanh cùng toàn bộ lời thoại (chữ Hán, pinyin, nghĩa) và các câu hỏi kèm đáp án đúng.

### REQ-9: Role-play scenarios — Kịch bản đóng vai (T25, tab "Đóng vai")

<!-- Story: US-3 · Priority: P1 · Screens: T25 -->

- AC-9.1: WHEN GV chọn "Thêm kịch bản" ở tab "Đóng vai" của T25 THE SYSTEM SHALL mở biểu mẫu gồm "Tiêu đề" (1–100 ký tự), "Tình huống" (một trong "Gọi món", "Mua sắm", "Phỏng vấn", "Giao tiếp công sở"), "Cấp HSK", "Chủ đề", "Bối cảnh" (tiếng Việt 1–500 ký tự), 2–4 "Vai" (mỗi vai có tên tiếng Việt 1–40 ký tự và tên tiếng Trung tùy chọn), "Lời thoại" (4–40 dòng theo thứ tự, mỗi dòng gồm vai, chữ Hán 1–200 ký tự, pinyin có dấu thanh, nghĩa tiếng Việt 1–300 ký tự, âm thanh ngắn và "Gợi ý cho người học" tùy chọn 0–200 ký tự) và "Nguồn / giấy phép".
- AC-9.2: WHEN GV chọn "Thêm lời thoại", "Xóa", "Lên" hoặc "Xuống" trên một dòng, hoặc kéo thả một dòng THE SYSTEM SHALL cập nhật ngay thứ tự và số thứ tự hiển thị của các dòng lời thoại.
- AC-9.3: THE SYSTEM SHALL coi một kịch bản đạt điều kiện xuất bản khi có 4–40 dòng lời thoại đủ trường bắt buộc, mỗi dòng có âm thanh và mỗi vai có ít nhất 2 dòng, và nêu từng lý do còn thiếu (ví dụ "Lời thoại 5 chưa có âm thanh.", "Vai "Phục vụ" cần ít nhất 2 lời thoại.").
- AC-9.4: WHEN GV chọn "Xem thử" một kịch bản THE SYSTEM SHALL phát lần lượt âm thanh từng lời thoại theo thứ tự, hiển thị vai, chữ Hán, pinyin, nghĩa và gợi ý của dòng đang phát, kèm "Tạm dừng" và "Phát lại".

### REQ-10: HSK mock tests and chapter tests — Đề thi thử và đề kiểm tra cuối chương (T26)

<!-- Story: US-4 · Priority: P1 · Screens: T26 -->

- AC-10.1: WHEN GV chọn "Tạo đề" trên T26 THE SYSTEM SHALL yêu cầu "Loại đề" ("Đề thi thử" hoặc "Kiểm tra cuối chương"), "Tên đề" (1–100 ký tự), "Cấp HSK", "Chương" (chỉ và bắt buộc với "Kiểm tra cuối chương", chọn từ chương của cấp đó — REQ-2), "Thời gian làm bài" (5–180 phút), "Điểm đạt (%)" (0–100, mặc định 60) và "Nguồn / giấy phép", rồi mở trình soạn đề ở trạng thái "Nháp".
- AC-10.2: THE SYSTEM SHALL cho đề có 1–10 phần theo thứ tự, mỗi phần có loại "Từ vựng", "Ngữ pháp", "Nghe", "Đọc hiểu" hoặc "Sắp xếp câu", "Hướng dẫn" (0–500 ký tự) và "Thời gian riêng" tùy chọn (phút), và IF tổng thời gian riêng của các phần vượt "Thời gian làm bài" THEN THE SYSTEM SHALL không lưu và hiển thị "Tổng thời gian các phần ({a} phút) vượt thời gian làm bài ({b} phút)."
- AC-10.3: THE SYSTEM SHALL cho thêm vào mỗi phần các câu hỏi chấm tự động thuộc một trong các dạng "Trắc nghiệm" (2–4 lựa chọn, đúng một đáp án), "Đúng / Sai", "Điền chỗ trống" (1–3 đáp án được chấp nhận, so khớp sau khi bỏ khoảng trắng đầu/cuối), "Sắp xếp từ thành câu" (2–12 mảnh, 1–3 thứ tự đúng), "Nghe chọn đáp án" (đoạn âm thanh và trắc nghiệm) và "Đọc hiểu" (đoạn văn 1–1 500 ký tự và 1–5 câu trắc nghiệm con), mỗi câu (và mỗi câu con) có "Điểm" 1–10 (mặc định 1), "Giải thích" bắt buộc 1–1 000 ký tự và 0–5 "Thẻ kiến thức" (mỗi thẻ 1–40 ký tự).
- AC-10.4: THE SYSTEM SHALL yêu cầu mỗi câu "Nghe chọn đáp án" có âm thanh và "Số lần được nghe" từ 1 đến 3 (mặc định 2).
- AC-10.5: THE SYSTEM SHALL giới hạn mỗi đề tối đa 200 câu hỏi (câu con của "Đọc hiểu" tính riêng từng câu) và hiển thị liên tục trong trình soạn đề số câu và tổng điểm của từng phần và của cả đề, và IF GV thêm câu thứ 201 THEN THE SYSTEM SHALL không thêm và hiển thị "Mỗi đề tối đa 200 câu hỏi."
- AC-10.6: THE SYSTEM SHALL coi một đề đạt điều kiện xuất bản khi có ít nhất một phần, mỗi phần có ít nhất một câu, mọi câu có đáp án đúng và giải thích, mọi câu nghe có âm thanh, và thời gian hợp lệ theo AC-10.1, AC-10.2, và nêu từng lý do còn thiếu kèm phần và số câu (ví dụ "Phần 2 · Câu 7: chưa có giải thích.").
- AC-10.7: WHEN GV chọn "Xem trước" một đề THE SYSTEM SHALL hiển thị đề như HV sẽ thấy, cho trả lời thử và "Hiện đáp án" từng câu, không đếm giờ bắt buộc và không lưu bất kỳ kết quả, lượt làm hay số đếm sử dụng nào.

### REQ-11: Mock test versioning — Phiên bản đề đã có người làm (T26)

<!-- Story: US-4, US-5 · Priority: P1 · Screens: T26 -->

- AC-11.1: WHILE một đề "Đã xuất bản" chưa có lượt làm nào của HV (kể cả lượt đang làm dở) THE SYSTEM SHALL cho GV sửa trực tiếp đề đó theo AC-3.9.
- AC-11.2: WHEN GV chọn "Sửa" một đề "Đã xuất bản" đã có ít nhất một lượt làm THE SYSTEM SHALL không sửa phiên bản đang dùng mà tạo "Phiên bản {n+1}" ở trạng thái "Nháp" sao chép toàn bộ nội dung phiên bản {n}, mở phiên bản mới trong trình soạn và hiển thị "Đề đã có người làm. Bạn đang sửa phiên bản {n+1}; phiên bản {n} vẫn được dùng cho tới khi bạn xuất bản phiên bản mới."
- AC-11.3: IF đề đã có một phiên bản "Nháp" chưa xuất bản THEN THE SYSTEM SHALL mở phiên bản nháp đó khi GV chọn "Sửa" thay vì tạo thêm phiên bản.
- AC-11.4: WHEN GV xuất bản "Phiên bản {n+1}" THE SYSTEM SHALL dùng phiên bản mới cho mọi lượt làm bắt đầu sau thời điểm đó, cho các lượt đang làm dở hoàn tất trên phiên bản {n}, và chuyển phiên bản {n} sang "Lưu trữ".
- AC-11.5: THE SYSTEM SHALL giữ cho mỗi kết quả thi thử đã có đúng câu hỏi, đáp án đúng, giải thích, điểm và thời gian của phiên bản HV đã làm, và không chấm lại kết quả đó khi một phiên bản sau thay đổi đáp án; đáp án đã sửa chỉ áp dụng cho lượt làm bắt đầu sau khi phiên bản mới được xuất bản (AC-11.4).
- AC-11.6: WHEN GV mở một đề trên T26 THE SYSTEM SHALL hiển thị phiên bản hiện hành, nhãn "Đã có người làm" khi đề có ít nhất một lượt làm (kèm tổng số lượt làm chỉ khi các lượt đó thuộc ít nhất 5 HV khác nhau, không bao giờ kèm tên hay danh tính người làm) và mục "Lịch sử phiên bản" liệt kê từng phiên bản với số phiên bản, trạng thái, thời điểm xuất bản và nguồn tạo ("Bộ nội dung mẫu HSK" hoặc "GV").

### REQ-12: Lists, search and filters — Danh sách, tìm kiếm và bộ lọc (T24–T27)

<!-- Story: US-1, US-2, US-3, US-4 · Priority: P1 · Screens: T24, T25, T26, T27 -->

- AC-12.1: WHEN GV mở T24, T25 (mỗi tab), T26 hoặc T27 THE SYSTEM SHALL hiển thị danh sách mục của kho theo trang 50 mục, mặc định sắp theo thời điểm cập nhật mới nhất, mỗi dòng có các trường nhận diện của loại mục (T24: Chữ Hán, Pinyin, Nghĩa rút gọn, Cấp, Chương, Từ loại, nhãn "Thiếu âm thanh"; T25: Tiêu đề, Loại hoặc Tình huống, Cấp, số câu hỏi hoặc số lời thoại; T26: Tên đề, Loại đề, Cấp, Chương, số câu, Thời gian làm bài, phiên bản; T27: như AC-7.1), trạng thái và thời điểm cập nhật.
- AC-12.2: WHEN GV nhập từ khóa vào ô tìm kiếm của T24 THE SYSTEM SHALL trả về các mục có "Chữ Hán" chứa từ khóa, có "Pinyin" khớp từ khóa khi bỏ qua dấu thanh và khoảng trắng (ví dụ "nihao", "ni hao" và "nǐ hǎo" đều tìm ra 你好), hoặc có "Nghĩa tiếng Việt" chứa từ khóa khi so không phân biệt hoa thường và dấu tiếng Việt.
- AC-12.3: THE SYSTEM SHALL cung cấp trên mọi danh sách bộ lọc "Cấp HSK", "Trạng thái", "Nguồn / giấy phép" và bộ lọc riêng theo loại (T24: "Chương", "Chủ đề", "Từ loại", "Thiếu âm thanh"; T25: "Loại", "Tình huống", "Chủ đề"; T26: "Loại đề", "Chương", "Đã có người làm"; T27: "Bộ thủ", "Trạng thái dữ liệu nét"), áp dụng đồng thời mọi bộ lọc và từ khóa, và hiển thị "{n} kết quả".
- AC-12.4: IF không có mục nào khớp bộ lọc hoặc từ khóa THEN THE SYSTEM SHALL hiển thị "Không có nội dung phù hợp." kèm nút "Xóa bộ lọc".
- AC-12.5: WHEN GV chọn nhiều mục trên một danh sách (từng dòng hoặc "Chọn tất cả {n} kết quả", tối đa 500) THE SYSTEM SHALL cung cấp các thao tác hàng loạt "Xuất bản" (AC-3.3, AC-3.4) và "Lưu trữ" (AC-3.5), và IF số mục được chọn vượt 500 THEN THE SYSTEM SHALL không thực hiện và hiển thị "Mỗi lần chỉ thao tác tối đa 500 mục."

### REQ-13: Library overview — Tổng quan kho (T23)

<!-- Story: US-7 · Priority: P2 · Screens: T23 -->

- AC-13.1: WHEN GV mở T23 THE SYSTEM SHALL hiển thị bảng số lượng của kho với mỗi hàng là một loại nội dung ("Từ vựng", "Chữ Hán", "Bài nghe", "Kịch bản đóng vai", "Đề thi thử", "Kiểm tra cuối chương") và mỗi cột là một trong 7 cấp HSK của AC-2.1 (từ "HSK 1" đến "HSK 7–9") cùng cột "Tổng", mỗi ô gồm số "Đã xuất bản" và số "Nháp", "Lưu trữ" (đề tính theo phiên bản hiện hành).
- AC-13.2: WHEN GV chọn một ô của bảng số lượng THE SYSTEM SHALL mở danh sách tương ứng (T24, T25, T26 hoặc T27) với bộ lọc cấp HSK của ô đó đã được áp dụng.
- AC-13.3: THE SYSTEM SHALL hiển thị trên T23 khối "Cần xử lý" gồm số "Từ thiếu âm thanh", "Chữ chưa có dữ liệu" (AC-7.2) và "Chữ lệch số nét", mỗi số mở danh sách đã lọc tương ứng, và khối "Thay đổi gần đây" gồm 20 mục lịch sử thay đổi mới nhất của kho (thời điểm dd/MM/yyyy HH:mm giờ Việt Nam, người thực hiện, thao tác, mục) với liên kết tới mục và "Xem tất cả" mở toàn bộ lịch sử thay đổi của kho lọc được theo thao tác và khoảng ngày.
- AC-13.4: THE SYSTEM SHALL hiển thị trên T23 khối "Sử dụng 30 ngày qua" chỉ gồm số đếm tổng hợp của HV thuộc workspace — số HV đã dùng khu Tự học, số lượt ôn từ vựng, số lượt luyện viết, số lượt luyện nghe và đóng vai, số lượt thi thử theo từng cấp — không hiển thị tên, email, danh sách HV hay số liệu của bất kỳ HV riêng lẻ nào, và IF ít hơn 5 HV khác nhau của workspace đã dùng khu Tự học trong 30 ngày qua THEN THE SYSTEM SHALL thay các số đếm bằng "Chưa đủ dữ liệu để hiển thị (cần ít nhất 5 học viên dùng Tự học)."

### REQ-14: Source/licence and change history — Nguồn / giấy phép và lịch sử thay đổi

<!-- Story: US-6 · Priority: P1 · Screens: T23–T27 -->

- AC-14.1: THE SYSTEM SHALL yêu cầu mọi mục kho và mọi lô nhập có "Nguồn / giấy phép" (3–200 ký tự, ghi nguồn gốc nội dung và căn cứ được phép sử dụng), và IF trường này trống khi lưu một mục hoặc bắt đầu một lô nhập THEN THE SYSTEM SHALL không lưu, không nhập và hiển thị "Vui lòng nhập nguồn / giấy phép."
- AC-14.2: WHEN một mục kho được sao từ Bộ nội dung mẫu HSK, tạo, sửa, nhập theo lô, xuất bản, lưu trữ, khôi phục, xóa hoặc tạo phiên bản mới THE SYSTEM SHALL ghi một mục lịch sử thay đổi gồm thời điểm, người thực hiện (GV, hoặc "Bộ nội dung mẫu HSK" với lần sao của REQ-15), mục, thao tác và với thao tác sửa là từng trường đã đổi kèm giá trị trước và sau (với âm thanh hoặc dữ liệu nét là tên tệp trước và sau).
- AC-14.3: WHEN GV mở tab "Lịch sử thay đổi" của một mục THE SYSTEM SHALL liệt kê mọi mục lịch sử của mục đó, mới nhất trước, kể cả lần sao từ Bộ nội dung mẫu HSK hoặc lần nhập theo lô đã tạo ra mục.
- AC-14.4: THE SYSTEM SHALL không cung cấp cho bất kỳ ai cách sửa hay xóa một mục lịch sử thay đổi, kể cả khi mục kho liên quan đã bị xóa vĩnh viễn.

### REQ-15: Starter HSK content set — Nạp Bộ nội dung mẫu HSK vào kho của workspace

<!-- Story: US-8 · Priority: P1 · Screens: T23–T27 · Tạo workspace: 001 AC-1.1 · Thêm 2026-10-22 (V15) -->

- AC-15.1: WHEN một workspace mới được tạo (001 AC-1.1) THE SYSTEM SHALL sao vào Kho tự học của workspace đó toàn bộ phiên bản hiện hành của Bộ nội dung mẫu HSK — mục từ vựng (kèm câu ví dụ và âm thanh), mục chữ Hán (kèm dữ liệu nét), tên Hán Việt và nghĩa của 214 bộ thủ, chương, chủ đề, bài nghe, kịch bản đóng vai và đề (mỗi đề thành "Phiên bản 1") cho 7 cấp của AC-2.1 — mỗi mục giữ "Nguồn / giấy phép" ghi trong bộ mẫu.
- AC-15.2: THE SYSTEM SHALL đặt mỗi mục được sao ở trạng thái "Đã xuất bản" nếu mục đạt điều kiện xuất bản của loại mục (AC-4.9, AC-7.6, AC-8.3, AC-9.3, AC-10.6), nếu không thì ở "Nháp", và ghi cho mỗi mục một mục lịch sử thay đổi "Sao từ Bộ nội dung mẫu HSK ({phiên bản bộ mẫu})".
- AC-15.3: WHEN lần sao Bộ nội dung mẫu HSK của một workspace hoàn tất THE SYSTEM SHALL coi mọi mục được sao là mục của workspace đó: GV sửa, thêm, xuất bản, lưu trữ và khôi phục theo REQ-2 đến REQ-14 như mục do GV tạo, và mọi thay đổi chỉ có hiệu lực trong workspace đó, không ảnh hưởng Bộ nội dung mẫu HSK hay kho của workspace khác.
- AC-15.4: THE SYSTEM SHALL không tự áp dụng vào kho của một workspace đã được nạp bất kỳ thay đổi hay phiên bản mới nào của Bộ nội dung mẫu HSK xuất hiện sau lần sao của workspace đó; phiên bản mới chỉ được sao cho workspace tạo sau thời điểm phiên bản đó có hiệu lực.
- AC-15.5: WHILE lần sao Bộ nội dung mẫu HSK của một workspace chưa hoàn tất THE SYSTEM SHALL hiển thị trên T23–T27 "Đang chuẩn bị Bộ nội dung mẫu HSK cho kho tự học của bạn…" thay cho nội dung kho, không cho GV thêm, nhập hay sửa mục nào, và không cung cấp cho HV của workspace bất kỳ mục nào của lần sao đó.
- AC-15.6: IF lần sao Bộ nội dung mẫu HSK bị gián đoạn hoặc lỗi THEN THE SYSTEM SHALL không để lại trong kho một phần của lần sao đó (sao trọn gói), tự thực hiện lại cho tới khi hoàn tất trong thời hạn của NFR-11, và ghi nhật ký sự cố theo NFR-10.
- AC-15.7: WHEN Kho tự học được ra mắt THE SYSTEM SHALL sao Bộ nội dung mẫu HSK theo AC-15.1 đến AC-15.6 cho mọi workspace đã tồn tại trước thời điểm đó.
- AC-15.8: WHEN GV mở T23 sau khi lần sao hoàn tất THE SYSTEM SHALL hiển thị dòng "Kho được khởi tạo từ Bộ nội dung mẫu HSK ({phiên bản bộ mẫu}) ngày {dd/MM/yyyy}."

## 6. Non-Functional Requirements

- NFR-1: Performance: với tệp từ vựng 5 000 dòng (≤ 10 MB), báo cáo kiểm tra theo dòng (AC-5.3) hiển thị p95 ≤ 60 giây và việc nhập (AC-5.6) hoàn tất p95 ≤ 60 giây; tiến trình được cập nhật ít nhất mỗi 2 giây; tải âm thanh hàng loạt 500 tệp (≤ 2 MB mỗi tệp) có báo cáo ghép p95 ≤ 120 giây trên kết nối ≥ 10 Mbps.
- NFR-2: Performance: danh sách, tìm kiếm và lọc của T24–T27 hiển thị kết quả p95 ≤ 1 giây với kho của một workspace có 15 000 mục từ vựng, 5 000 chữ Hán, 3 000 bài nghe và kịch bản đóng vai, 1 000 đề (tính cả phiên bản), khi hệ thống có 2 000 workspace; T23 hiển thị đầy đủ p95 ≤ 2 giây với cùng quy mô.
- NFR-3: Freshness: mọi lần xuất bản, lưu trữ, khôi phục hoặc lưu thay đổi một mục "Đã xuất bản" có hiệu lực với HV của workspace ở khu Tự học trong ≤ 5 phút (p99) kể từ khi GV xác nhận.
- NFR-4: Performance: một tệp âm thanh 20 MB tải lên xong và nghe thử được trên T25/T26 p95 ≤ 30 giây trên kết nối ≥ 10 Mbps; âm thanh ngắn bắt đầu phát p95 ≤ 1 giây sau khi bấm phát trên T24; 100% tệp âm thanh tuân theo định dạng và giới hạn của AC-6.1.
- NFR-5: Security: trong bộ kiểm thử phân quyền, 100% yêu cầu của GV tới mục kho, lô nhập, lịch sử thay đổi hay số liệu của workspace khác bị từ chối với cùng phản hồi như mục không tồn tại, 100% yêu cầu của HV tới nội dung kho của workspace khác hoặc tới chức năng của T23–T27 bị từ chối, 100% yêu cầu của người chưa đăng nhập bị từ chối, và 0 phản hồi cho GV chứa dữ liệu tự học của một HV cụ thể; 100% tệp tải lên được kiểm tra theo nội dung, 0 công thức hoặc macro trong tệp được thực thi, và 100% ô bắt đầu bằng "=", "+", "-" hoặc "@" trong tệp báo cáo tải về được vô hiệu hóa để không chạy như công thức.
- NFR-6: Auditability: 100% thao tác thay đổi kho của AC-14.2 có mục lịch sử thay đổi, lưu ít nhất 3 năm, không ai sửa hay xóa được; mỗi mục kho truy được về đúng lần sao Bộ nội dung mẫu HSK hoặc lô nhập và "Nguồn / giấy phép" đã tạo ra nó.
- NFR-7: Integrity: 0 bộ từ cá nhân, trạng thái ôn tập, lịch sử luyện hoặc kết quả thi thử mất khả năng mở hay hiển thị sau khi mục liên quan bị lưu trữ hoặc có phiên bản mới, kiểm chứng bằng kiểm thử tự động cho cả 5 loại mục; 0 lần nhập hay lần sao Bộ nội dung mẫu HSK dở dang khi lỗi xảy ra giữa chừng (100% lô nhập và lần sao trọn gói theo AC-5.6, AC-15.6) trong kiểm thử gây lỗi.
- NFR-8: Accessibility: T23–T27 đạt WCAG 2.1 AA (tương phản chữ ≥ 4,5:1, 100% trường nhập có nhãn đọc được bằng trình đọc màn hình, 100% thao tác — kể cả sắp xếp kéo thả, có thay thế "Lên" / "Xuống" — thực hiện được bằng bàn phím); dùng đầy đủ ở chiều rộng ≥ 1280 px và dùng được ở ≥ 1024 px; chữ Hán trong biểu mẫu và danh sách hiển thị cỡ ≥ 20 px.
- NFR-9: Correctness: 100% văn bản tiếng Trung được lưu ở cùng một dạng chuẩn hóa Unicode; chuyển pinyin số thanh sang pinyin có dấu (AC-4.3) đúng 100% trên bộ kiểm thử 1 000 âm tiết gồm ü/v, thanh nhẹ và vị trí dấu theo quy tắc chuẩn.
- NFR-10: Observability: 100% lần sao Bộ nội dung mẫu HSK (bắt đầu, hoàn tất, lỗi, thử lại), lần nhập tệp, tải âm thanh, xuất bản, lưu trữ, khôi phục, xóa, tạo phiên bản và mọi yêu cầu bị từ chối theo NFR-5 được ghi nhật ký có cấu trúc gồm thời điểm, mã workspace, mã tài khoản, mã mục hoặc lô, thao tác, kết quả và thời lượng xử lý, không chứa mật khẩu, email hay nội dung tệp; lưu ít nhất 90 ngày.
- NFR-11: Performance: lần sao Bộ nội dung mẫu HSK (khoảng 11 000 mục từ vựng kèm âm thanh, 3 000 chữ Hán kèm dữ liệu nét, bài nghe, kịch bản và đề) cho một workspace mới hoàn tất p95 ≤ 5 phút và p99 ≤ 15 phút kể từ khi workspace được tạo, với tối đa 20 workspace được tạo trong cùng một phút, và không làm tăng thời gian từ A02 tới T01 của GV quá 1 giây; khi ra mắt (AC-15.7), mọi workspace đã tồn tại được sao xong trong ≤ 24 giờ.

## 7. Key Entities

| Thực thể | Ý nghĩa | Thuộc tính nghiệp vụ chính | Quan hệ |
|----------|---------|----------------------------|---------|
| Kho tự học | Toàn bộ nội dung tự học của một workspace | Workspace, phiên bản Bộ nội dung mẫu HSK đã nạp, thời điểm nạp, trạng thái nạp (Đang chuẩn bị / Sẵn sàng) | Thuộc đúng 1 Workspace (001); chứa mọi thực thể bên dưới; chỉ GV của workspace quản lý; chỉ HV của workspace dùng |
| Bộ nội dung mẫu HSK | Bộ nội dung chuẩn do đội nội dung SAT chuẩn bị ngoài sản phẩm | Phiên bản, ngày hiệu lực, nội dung theo 7 cấp, Nguồn / giấy phép của từng mục | Được sao vào 1..n Kho tự học (REQ-15); không ai sửa trong SAT; phiên bản mới không áp vào kho đã nạp |
| Cấp HSK | Nhóm trình độ của nội dung | Một trong 7 cấp: HSK 1–6 và một cấp chung "HSK 7–9" (AC-2.1) | Mỗi mục kho thuộc đúng 1 cấp |
| Chương | Nhóm có thứ tự trong một cấp, dùng để tổ chức từ vựng và đề kiểm tra cuối chương | Cấp, số thứ tự, tên | Thuộc 1 Kho tự học; 0..n Mục từ vựng; 0..n Đề kiểm tra cuối chương |
| Chủ đề | Nhãn dùng chung mọi cấp của một kho (ví dụ "Ẩm thực", "Công sở") | Tên | Thuộc 1 Kho tự học; gắn 0..5 cho Mục từ vựng, Bài nghe, Kịch bản đóng vai |
| Mục từ vựng | Một từ HSK cho 012 (và âm thanh cho 014) | Mã ổn định (AC-3.10), Chữ Hán giản thể, Pinyin có dấu, Từ loại (1–3), Nghĩa tiếng Việt (1–5 nghĩa có thứ tự), Cách dùng (tùy chọn), Cấp, Chương, Thứ tự, Chủ đề, Âm thanh phát âm (tùy chọn), Nguồn / giấy phép, trạng thái | Thuộc 1 Kho tự học; có 0..5 Câu ví dụ có thứ tự; duy nhất theo Chữ Hán + Pinyin trong kho; các chữ của nó tham chiếu Mục chữ Hán |
| Câu ví dụ | Câu minh họa cách dùng từ | Thứ tự, Câu chữ Hán (chứa từ), Pinyin, Nghĩa, Âm thanh (tùy chọn) | Thuộc 1 Mục từ vựng |
| Mục chữ Hán | Dữ liệu một chữ cho 013 | Mã ổn định, Chữ, Pinyin (1–5), Âm Hán Việt, Nghĩa, Cấp, Số nét, Bộ thủ, Kiểu cấu tạo + thành phần, Mẹo nhớ (tùy chọn), Dữ liệu nét, trạng thái dữ liệu nét, Nguồn / giấy phép, trạng thái | Thuộc 1 Kho tự học; duy nhất theo Chữ trong kho; thuộc đúng 1 Bộ thủ |
| Bộ thủ | Danh mục 214 bộ thủ cố định (AC-7.7) | Số thứ tự, dạng chính + biến thể, tên Hán Việt, nghĩa tiếng Việt (sửa được trong kho), số nét | 0..n Mục chữ Hán; không thêm/xóa được |
| Dữ liệu nét | Thứ tự, hình dạng, hướng viết của từng nét | Danh sách nét có thứ tự | Thuộc 1 Mục chữ Hán; số nét phải bằng Số nét |
| Bài nghe | Nội dung nghe cho 014 | Tiêu đề, Loại (Nghe câu / Hội thoại), Cấp, Chủ đề, Âm thanh dài, Người nói, Lời thoại, Câu hỏi (0–10), Nguồn / giấy phép, trạng thái | Thuộc 1 Kho tự học; Câu hỏi: nội dung, 2–4 lựa chọn, 1 đáp án, Giải thích |
| Kịch bản đóng vai | Hội thoại theo kịch bản cho 014 | Tiêu đề, Tình huống (4 giá trị cố định), Cấp, Chủ đề, Bối cảnh, 2–4 Vai, Lời thoại 4–40 (vai, chữ Hán, pinyin, nghĩa, âm thanh, gợi ý), Nguồn / giấy phép, trạng thái | Thuộc 1 Kho tự học |
| Đề | Đề thi thử hoặc kiểm tra cuối chương cho 015 | Loại đề, Tên, Cấp, Chương, Thời gian làm bài, Điểm đạt (%), Nguồn / giấy phép | Thuộc 1 Kho tự học; có 1..n Phiên bản đề; đúng 1 phiên bản hiện hành khi đã xuất bản |
| Phiên bản đề | Một bản nội dung bất biến của đề sau khi có người làm | Số phiên bản, trạng thái, thời điểm xuất bản, nguồn tạo (Bộ nội dung mẫu HSK / GV), Phần (1–10: loại, hướng dẫn, thời gian riêng), Câu hỏi (≤ 200: dạng, nội dung, đáp án, Điểm, Giải thích, Thẻ kiến thức, âm thanh + Số lần được nghe) | Kết quả thi thử (015) tham chiếu đúng 1 phiên bản |
| Lần sao bộ mẫu | Một lần nạp Bộ nội dung mẫu HSK vào một kho | Phiên bản bộ mẫu, thời điểm bắt đầu / hoàn tất, kết quả, số lần thử | Thuộc 1 Kho tự học; tạo các mục ban đầu của kho (REQ-15) |
| Lô nhập | Một lần GV nhập tệp từ vựng hoặc dữ liệu nét | Tệp, Nguồn / giấy phép của lô, báo cáo (hợp lệ / lỗi / trùng + lý do), kết quả, thời điểm | Thuộc 1 Kho tự học; tạo 0..5 000 Mục từ vựng hoặc 0..3 000 Mục chữ Hán |
| Mục lịch sử thay đổi | Một thao tác thay đổi kho | Thời điểm, người thực hiện (GV / Bộ nội dung mẫu HSK), mục, thao tác, trường đổi + giá trị trước/sau | Thuộc 1 Kho tự học; không sửa/xóa được; lưu ≥ 3 năm |
| Tham chiếu dữ liệu học | Dữ liệu riêng của HV trỏ tới mục kho của workspace (thuộc 012–015) | — | Giữ mục "Lưu trữ" vẫn đọc được (AC-3.6) |

## 8. Edge Cases & Error Handling

| Tình huống | Hành vi mong đợi | AC |
|------------|------------------|----|
| GV vừa đăng ký mở "Kho tự học" khi bộ mẫu đang được sao | T23–T27 hiển thị "Đang chuẩn bị Bộ nội dung mẫu HSK cho kho tự học của bạn…", chưa thêm/nhập/sửa được; HV chưa thấy mục nào | AC-15.5 |
| Lần sao bộ mẫu lỗi giữa chừng | Không còn mục nào của lần sao dở; hệ thống tự sao lại; nhật ký có sự cố | AC-15.6, NFR-10 |
| GV sửa nghĩa của 你好 (từ bộ mẫu) | Chỉ HV của workspace đó thấy nghĩa mới trong ≤ 5 phút; kho của GV khác và bộ mẫu không đổi; lịch sử có dòng "Sửa" sau dòng "Sao từ Bộ nội dung mẫu HSK" | AC-15.3, AC-3.9, AC-14.3 |
| GV muốn xóa một từ của bộ mẫu | Không có "Xóa" (mục đã xuất bản); GV "Lưu trữ" để ẩn khỏi HV | AC-3.8, AC-3.5 |
| Bộ mẫu có mục chưa đủ điều kiện xuất bản (ví dụ chữ thiếu dữ liệu nét) | Mục được sao ở "Nháp"; T23 tính vào "Cần xử lý" | AC-15.2, AC-13.3 |
| Đội nội dung SAT phát hành phiên bản bộ mẫu mới | Kho đã nạp không đổi; chỉ workspace tạo sau dùng phiên bản mới | AC-15.4 |
| GV thêm từ đã có trong bộ mẫu của kho mình | Bị chặn như mọi từ trùng, kèm "Mở mục đã có" | AC-4.7 |
| GV B mở đường dẫn mục kho, lô nhập hoặc lịch sử của GV A | A05 "Không tìm thấy nội dung bạn yêu cầu." như mục không tồn tại | AC-1.3, NFR-5 |
| HV của GV A mở đường dẫn tới một mục kho của GV B | A05; HV chỉ dùng nội dung kho của workspace mình | AC-1.7, AC-1.8 |
| HV mở đường dẫn T24 | Về S01 (001) | 001 AC-20.10 |
| GV mở đường dẫn S13 | A05 (001); GV xem trước nội dung bằng "Nghe thử", "Xem thử", "Xem trước", "Xem thứ tự nét" | 001 AC-20.4, AC-8.4, AC-9.4, AC-10.7, AC-7.5 |
| HV chưa thuộc lớp nào | Vẫn dùng nội dung "Đã xuất bản" của kho workspace mình (001) | 001 AC-20.3 |
| Workspace có ít hơn 5 HV dùng Tự học trong 30 ngày | Khối "Sử dụng 30 ngày qua" hiển thị "Chưa đủ dữ liệu để hiển thị (cần ít nhất 5 học viên dùng Tự học)." | AC-13.4 |
| Đề có lượt làm của chỉ 1–4 HV | Nhãn "Đã có người làm" (cần cho việc tạo phiên bản), không kèm số lượt | AC-11.6 |
| HV bị xóa | Dữ liệu tự học của HV bị xóa trong vòng 24 giờ (001); số đếm 30 ngày chỉ tính dữ liệu còn tồn tại | 001 AC-20.6, AC-13.4 |
| Từ có 儿 hóa (一点儿 → yìdiǎnr) | 儿 cuối âm tiết ghi bằng "r", không tính thành âm tiết riêng; 3 chữ, pinyin 2 âm tiết hợp lệ | AC-4.4 |
| Biến điệu 一, 不 (yí gè, bú shì) | Kho lưu thanh gốc hoặc thanh biến điệu như GV nhập; cả hai đều là âm tiết hợp lệ; cách hiển thị biến điệu do 012 quyết định | AC-4.3, AC-4.4 |
| Chữ đa âm (行 xíng / háng) | Hai mục từ vựng riêng (cặp Chữ Hán + Pinyin khác nhau) có cảnh báo; mục chữ Hán 行 có 2 cách đọc | AC-4.7, AC-4.8, AC-7.3 |
| Nhập "lv4", "nü3" | Chuyển thành "lǜ", "nǚ" | AC-4.3, NFR-9 |
| Chữ phồn thể trong tệp nhập (學習) | Dòng lỗi "Hãy dùng chữ giản thể: 學 → 学" | AC-4.2, AC-5.3 |
| Tệp .csv không phải UTF-8 (chữ Hán thành ký tự lạ) | Từ chối cả tệp với lý do mã hóa | AC-5.2 |
| Tệp có cột thừa hoặc thứ tự cột khác mẫu | Cột nhận theo tên tiêu đề (không phân biệt hoa thường, bỏ khoảng trắng đầu/cuối); cột thừa bị bỏ qua | AC-5.1, AC-5.3 |
| Ô dùng công thức hoặc tệp có macro | Đọc giá trị hiển thị; không thực thi gì; ô báo cáo tải về bắt đầu bằng "=" được vô hiệu hóa | AC-5.3, NFR-5 |
| Cùng từ ở hai cấp trong tệp hoặc trong kho | Coi là trùng (khóa không gồm cấp); GV sửa cấp của mục có sẵn nếu cần | AC-4.7, AC-5.4 |
| GV nhập hai tệp chồng nhau ở hai tab gần như cùng lúc | Lần xác nhận sau không nhập gì, báo cáo cập nhật đánh dấu "Trùng với kho" | AC-5.7 |
| GV sửa cùng một mục ở hai tab | Lần lưu sau nhận cảnh báo "…vừa được cập nhật lúc {HH:mm} ở một cửa sổ khác…", không ghi đè | AC-1.5 |
| Mất kết nối khi đang nhập | Lô trọn gói: hoặc đã nhập đủ (thấy trong lịch sử) hoặc không có dòng nào; nhập lại sẽ báo "Trùng với kho" nếu đã nhập | AC-5.6, NFR-7 |
| Âm thanh im lặng hoặc sai từ | Không tự phát hiện; GV nghe thử trước khi xuất bản; HV báo lỗi ngoài phạm vi | AC-6.3 |
| Tên tệp âm thanh "行.mp3" khi kho có 行 xíng và 行 háng | Báo "Nhiều từ cùng chữ Hán — cần ghi kèm pinyin", không ghép | AC-6.4 |
| Lưu trữ một từ đang nằm trong bộ từ cá nhân của 200 HV | Từ biến mất khỏi tìm kiếm và thêm mới; 200 bộ từ và lịch ôn vẫn hiển thị nội dung cuối cùng | AC-3.5, AC-3.6 |
| GV sửa đề trong lúc HV đang làm | Phiên bản mới chỉ dùng cho lượt bắt đầu sau khi xuất bản; lượt đang làm hoàn tất trên phiên bản cũ | AC-11.2, AC-11.4 |
| Đề có đáp án sai đã có lượt làm | Tạo phiên bản mới sửa đáp án; kết quả cũ giữ nguyên, không chấm lại | AC-11.5 |
| Lưu trữ một đề đã có lượt làm | Không bắt đầu được lượt mới; mọi kết quả cũ vẫn mở với đúng phiên bản | AC-3.5, AC-3.6, AC-11.5 |
| Chữ trong từ vựng đã xuất bản nhưng chữ Hán chưa có dữ liệu | Được tính vào "Chữ chưa có dữ liệu"; 013 quyết định cách hiển thị chữ đó | AC-7.2 |
| Mục chữ Hán đã xuất bản nhưng không có từ vựng nào chứa | Vẫn hợp lệ; cấp HSK lấy theo cấp GV gán | AC-7.3 |
| Xóa chương còn từ | Bị chặn với số từ và số đề còn gắn | AC-2.3 |
| Thời điểm trong lịch sử thay đổi | Giờ Việt Nam (UTC+7), dd/MM/yyyy HH:mm | AC-13.3, AC-14.3 |
| GV lưu trữ hết nội dung một cấp | Ô của bảng tổng quan hiển thị 0 "Đã xuất bản"; HV không còn nội dung cấp đó để bắt đầu học mới | AC-13.1, AC-3.5 |
| Kho trống ở một cấp | Ô của bảng tổng quan hiển thị 0; danh sách lọc theo cấp đó hiển thị "Không có nội dung phù hợp." | AC-12.4, AC-13.1 |

## 9. Out of Scope

- **Giai đoạn 2 (V14):** nhận diện chữ viết tay tự do, chấm phát âm và thanh điệu bằng nhận diện giọng nói, hội thoại đóng vai với AI; mọi dữ liệu huấn luyện hay mẫu chấm cho các tính năng đó; tạo nội dung kho bằng AI; tạo âm thanh bằng giọng máy.
- Kho nội dung dùng chung toàn hệ thống; chia sẻ, sao chép hay đồng bộ nội dung kho giữa các GV; mọi vai trò quản trị ngoài GV (V15).
- Giao diện quản lý Bộ nội dung mẫu HSK trong SAT (đội nội dung SAT chuẩn bị ngoài sản phẩm); tự động đưa phiên bản bộ mẫu mới vào kho đã nạp; chức năng "Nạp mục mẫu mới" cho GV chọn nạp các mục mới của bộ mẫu (ý tưởng cho sau MVP); "Khôi phục về bản mẫu" cho một mục đã sửa; GV tự xóa toàn bộ kho hay nạp lại bộ mẫu.
- GV dùng khu Tự học với tư cách người học (001 AC-20.4); GV xem dữ liệu tự học của từng HV; số liệu sử dụng theo từng HV hay theo lớp; mọi phân tích ngoài các số đếm của AC-11.6, AC-13.4.
- Phân quyền theo cấp/loại nội dung; quy trình duyệt hai người; hẹn giờ xuất bản; nhiều người cùng quản lý một kho.
- GV dùng nội dung kho trong Giáo trình, Bài, bài tập hay bài thi của workspace (002–006, 010); HV đóng góp, báo lỗi hoặc bình luận nội dung kho; giao nội dung tự học theo lớp hoặc ẩn theo lớp (Tự học không phụ thuộc lớp).
- Truy cập công khai không đăng nhập; HV tự đăng ký (vẫn không có — V14, V15).
- Chữ phồn thể, nghĩa bằng ngôn ngữ khác tiếng Việt, giao diện bằng ngôn ngữ khác tiếng Việt.
- Mốc thời gian theo từng dòng lời thoại trong âm thanh bài nghe; video; hình ảnh minh họa cho từ vựng.
- Xuất toàn bộ kho ra tệp; nhập bài nghe, kịch bản, đề từ tệp (chỉ soạn trên T25, T26); nhập âm thanh câu ví dụ hàng loạt.
- Chấm lại kết quả thi thử cũ khi đáp án đổi (đã chốt: không chấm lại — AC-11.5); thống kê lỗi sai của HV (015 sở hữu; 016 chỉ cung cấp "Thẻ kiến thức").
- Nội dung cho Bài thi của GV (006) và chấm tự luận (007).

### Removed (2026-10-22, V15)

Mã bị bỏ không dùng lại:

- Mã AC-1.4 — "mọi tài khoản QTND đang hoạt động cùng một quyền trên toàn bộ kho, không phân quyền theo cấp HSK hay loại nội dung" (không còn nhiều người quản trị một kho; quyền của GV trên mục được sao nêu ở AC-15.3).
- Vai trò "Quản trị nội dung" (QTND), "Đơn vị vận hành", màn hình Q01–Q05 và menu tài khoản riêng của khu quản trị (AC-1.1 cũ); thay bằng GV trên T23–T27.
- Kho nội dung hệ thống dùng chung cho mọi workspace; HV và GV mọi workspace cùng dùng một kho (AC-3.3 cũ); GV là người học tự học (US-5 cũ "HV hoặc GV").
- Chỉ hiển thị cho QTND nội dung kho, không hiển thị Giáo trình, Lớp, tài khoản… (AC-1.2 cũ) — thay bằng cô lập workspace (AC-1.2, AC-1.3 mới) và quyền riêng tư (AC-1.6).
- Xung đột lưu giữa hai QTND với "{Họ tên}" (AC-1.5 cũ) — nay giữa hai cửa sổ của cùng GV.
- Số đếm sử dụng toàn hệ thống (AC-13.4 cũ), Họ tên QTND trong "Thay đổi gần đây", bộ lọc lịch sử theo QTND (AC-13.3 cũ), Họ tên QTND trong lịch sử thay đổi và lịch sử phiên bản (AC-14.2, AC-11.6 cũ).
- US-6 cũ "Là đơn vị vận hành…" — viết lại cho GV (cô lập workspace, lịch sử, nguồn / giấy phép).

## 10. Assumptions & Dependencies

**Giả định** (chi tiết và lý do ở §12):

- Mỗi workspace có đúng một Kho tự học, chỉ GV chủ workspace quản lý, chỉ HV của workspace dùng (V15).
- Bộ nội dung mẫu HSK được sao trọn vẹn khi tạo workspace (và khi ra mắt cho workspace đã có); mục đạt điều kiện được sao ở "Đã xuất bản" để HV học được ngay; sau khi sao, mục thuộc GV; phiên bản bộ mẫu mới không tự áp vào kho đã nạp (AC-15.2, AC-15.4).
- Mục được sao từ bộ mẫu ở "Đã xuất bản" không xóa được, chỉ lưu trữ (AC-3.8) — đúng nguyên tắc "never lose learning data".
- Số đếm sử dụng trên T23 và số lượt làm mỗi đề chỉ hiển thị khi có ít nhất 5 HV khác nhau, để số tổng hợp không lộ hoạt động của một HV (AC-13.4, AC-11.6).
- Cấp HSK của kho là HSK 1–6 và một cấp chung "HSK 7–9" theo chuẩn HSK chính thức (AC-2.1; Q-1 đã chốt 2026-10-22).
- Âm thanh phát âm từ không bắt buộc để xuất bản (nhãn "Thiếu âm thanh"); âm thanh bắt buộc với bài nghe, lời thoại đóng vai và câu nghe của đề.
- Khóa trùng của từ vựng là Chữ Hán + Pinyin trong kho của workspace, không gồm cấp; khóa trùng của chữ Hán là Chữ trong kho.
- Sửa mục "Đã xuất bản" có hiệu lực ngay (≤ 5 phút) với HV của workspace, trừ đề đã có lượt làm (tạo phiên bản); không chấm lại kết quả cũ (AC-11.5; Q-2 đã chốt 2026-10-22).
- **Điều kiện tiên quyết trước khi ra mắt (không phải điều kiện của spec):** đội nội dung SAT phải chuẩn bị Bộ nội dung mẫu HSK cho HSK 1–6 và "HSK 7–9" (khoảng 11 000 từ vựng, dữ liệu nét khoảng 3 000 chữ, âm thanh bản xứ, bài nghe, kịch bản, đề thi thử) với "Nguồn / giấy phép" cho phép **sao vào kho của mọi workspace và cho HV của mọi GV dùng**. Có được nội dung hợp pháp là trách nhiệm kinh doanh của SAT; hệ thống chỉ bắt buộc mọi mục và mọi lô nhập ghi "Nguồn / giấy phép" (AC-14.1).

**Phụ thuộc:**

- **001 Tài khoản & Xác thực:** tạo workspace (AC-1.1) kích hoạt lần sao bộ mẫu (AC-15.1); mục "Kho tự học" → T23 trên thanh bên GV (AC-20.2); quyền dùng Tự học chỉ cho HV đã kích hoạt, không bị khóa, với kho của workspace mình (AC-20.3); GV mở S13–S20 → A05 (AC-20.4); quyền riêng tư dữ liệu tự học (AC-20.5); xóa dữ liệu tự học khi xóa HV (AC-20.6); HV mở T23–T27 → S01 (AC-20.10); cô lập workspace và A05 (REQ-16).
- **009 Dashboard giáo viên:** thanh bên GV có mục "Kho tự học" → T23 (không có "Tự học").
- **012 Từ vựng thông minh:** đọc Mục từ vựng của kho thuộc workspace của HV (mã ổn định, Chữ Hán, Pinyin, Từ loại, Nghĩa tiếng Việt có thứ tự, Cách dùng, Cấp, Chương, Thứ tự, Chủ đề, Âm thanh phát âm, Câu ví dụ có thứ tự + âm thanh, trạng thái); chỉ mục "Đã xuất bản" cho duyệt/thêm mới; mục "Lưu trữ" (012 gọi là "ngừng xuất bản", nhãn "Không còn trong kho") vẫn đọc được với nội dung lần xuất bản cuối qua bộ từ cá nhân, từ khó và lịch ôn (AC-3.6); mục đã từng xuất bản không bao giờ bị xóa (AC-3.8). Cung cấp số đếm tổng hợp theo workspace cho AC-13.4.
- **013 Luyện viết chữ Hán:** đọc Mục chữ Hán của kho thuộc workspace của HV (mã ổn định, Chữ, Pinyin, Âm Hán Việt, Nghĩa, Cấp, Số nét, Bộ thủ, Cấu tạo + thành phần, Mẹo nhớ, Dữ liệu nét gồm thứ tự, hình dạng, hướng từng nét) và danh mục 214 Bộ thủ (AC-7.7); chỉ chữ "Đã xuất bản" (luôn "Đủ dữ liệu nét") được luyện; tìm kiếm theo pinyin không dấu và nghĩa không dấu như AC-7.8.
- **014 Luyện nghe & nói:** đọc Bài nghe (âm thanh ≤ 5 phút, lời thoại, ≤ 10 câu hỏi một đáp án, giải thích), Kịch bản đóng vai (tình huống "Gọi món" / "Mua sắm" / "Phỏng vấn" / "Giao tiếp công sở", 2–4 vai, ≤ 40 lời thoại có âm thanh, gợi ý), âm thanh phát âm từ và câu ví dụ làm mẫu thu âm — của kho thuộc workspace của HV.
- **015 Thi thử HSK:** đọc Đề và Phiên bản đề của kho thuộc workspace của HV (loại, cấp, chương, thời gian, phần, dạng câu, đáp án, điểm, giải thích, thẻ kiến thức, số lần được nghe, điểm đạt); mỗi kết quả trỏ đúng một phiên bản và không được chấm lại (AC-11.5) — 015 hiển thị trên kết quả của phiên bản cũ dòng "Đề này đã được cập nhật sau lượt làm của bạn. Kết quả được giữ theo phiên bản bạn đã làm." (015 AC-13.4); báo cho 016 số lượt làm và số HV khác nhau đã làm mỗi đề (tổng hợp, AC-11.6) và trạng thái "đã có lượt làm" (AC-11.2).
- **002–008, 010, 011:** không phụ thuộc; kho không chạm Giáo trình, Lớp, bài tập; không ảnh hưởng xếp hạng (008), dashboard (009) hay hồ sơ (011).

## 11. Open Questions

Không còn câu hỏi mở. Các câu đã đóng ngày 2026-10-22 (chi tiết ở §12 Session 2026-10-22 (chốt câu hỏi mở)):

- Q-1 (AC-2.1, AC-13.1) — đã đóng: một cấp chung "HSK 7–9" theo chuẩn chính thức; kho có đúng 7 cấp.
- Q-2 (AC-11.5) — đã đóng: không chấm lại kết quả cũ; mỗi lượt giữ phiên bản đã làm, đáp án đã sửa chỉ áp dụng qua phiên bản mới.
- Q-3 (§10) — đã đóng, cập nhật theo V15: spec không phụ thuộc nguồn nội dung; Bộ nội dung mẫu HSK hợp pháp (cấp phép cho mọi workspace hoặc tự biên soạn) là điều kiện tiên quyết trước khi ra mắt, ghi ở §10.

## 12. Clarifications Log

### Session 2026-10-22 (tự học toàn hệ thống)

Module mới theo quyết định V14 của stakeholder ngày 2026-10-22.

- Q: Yêu cầu của stakeholder? → A: Nguyên văn: "với dự án hiện tại thì các feature đang là theo học viên trong 1 lớp để GV dễ tracking và quản lí theo giáo trình và bài học, giờ sẽ thêm các module feature global cho tất cả user để có thể dùng được và không phân biệt lớp: 3. Học từ vựng thông minh (flashcard hai mặt chữ Hán – Pinyin – nghĩa; nghe phát âm; ví dụ câu; SRS; đánh dấu từ khó, bộ từ cá nhân) · 4. Luyện viết chữ Hán (thứ tự nét; khung luyện viết; nhận diện chữ viết và gợi ý sửa lỗi; bộ thủ, cấu tạo chữ) · 5. Luyện nghe và nói (nghe bản xứ; thu âm; nhận xét phát âm và thanh điệu bằng nhận diện giọng nói; nghe hội thoại chọn đáp án; đóng vai: gọi món, mua sắm, phỏng vấn, giao tiếp công sở) · 6. Mô phỏng thi thử HSK (trắc nghiệm từ vựng, ngữ pháp; nghe và đọc hiểu; sắp xếp từ thành câu; kiểm tra cuối chương và đề thi thử; chấm tự động, giải thích đáp án, thống kê lỗi sai)." (source: stakeholder)
- [thay thế 2026-10-22 V15 — chỉ HV dùng Tự học, với kho của workspace mình; GV chỉ quản lý] Q: Ai dùng khu Tự học? → A: Mọi tài khoản HV và GV hiện có, không cần lớp, không phân biệt workspace; vẫn không có tự đăng ký công khai (001 REQ-20). (source: stakeholder)
- [thay thế 2026-10-22 V15 — mỗi GV có Kho tự học riêng trong workspace, nạp sẵn Bộ nội dung mẫu HSK] Q: Nội dung dùng chung lấy từ đâu? → A: Từ một kho toàn hệ thống do vai trò mới "Quản trị nội dung" duy trì — module 016. (source: stakeholder)
- Q: Phạm vi MVP? → A: "MVP một phần, AI sau": MVP = từ vựng + SRS (012), thứ tự nét + khung viết kiểm từng nét theo nét mẫu (013), nghe + chọn đáp án + thu âm và nghe lại + đóng vai theo kịch bản (014), đề thi thử tự chấm (015). Giai đoạn 2 = nhận diện chữ viết tay tự do, chấm phát âm / thanh điệu, đóng vai hội thoại với AI (§9). (source: stakeholder)
- [thay thế 2026-10-22 V15 — một phần: GV (không còn QTND) chỉ thấy số đếm tổng hợp ẩn danh của workspace, có ngưỡng 5 HV (AC-1.6, AC-13.4)] Q: Dữ liệu tự học có ai thấy? → A: Riêng tư với từng người dùng, không bao giờ hiển thị cho GV, không ảnh hưởng xếp hạng lớp (008) hay dashboard (009); QTND chỉ thấy số đếm tổng hợp ẩn danh (AC-1.2, AC-13.4). (source: stakeholder)
- [thay thế 2026-10-22 V15 — không còn vai trò QTND] Q: Tài khoản QTND được tạo thế nào? → A: Đơn vị vận hành tạo và vô hiệu hóa bằng quy trình vận hành; không có màn hình tạo QTND, không đăng ký (001 AC-19.1). (source: assumption — brief yêu cầu không có giao diện tạo quản trị; ít bề mặt tấn công nhất cho một vai trò hiếm)
- [thay thế 2026-10-22 V15 — không còn vai trò QTND; GV quản lý kho của mình, AC-1.4 bị bỏ] Q: QTND có phân quyền theo cấp hay loại nội dung, có quy trình duyệt hai người? → A: Không; mọi QTND quyền như nhau, xuất bản trực tiếp; lịch sử thay đổi bù cho việc không có người duyệt (AC-1.4, REQ-14). (source: assumption — số QTND nhỏ; đơn giản nhất thỏa yêu cầu, có thể thêm sau)
- [thay thế 2026-10-22] Q: Cấp HSK của kho? → A: HSK 1–6 và nhóm "HSK 7–9" (AC-2.1, Q-1). (source: assumption — chuẩn HSK mới gộp từ vựng, chữ và bài thi cấp 7–9; tạm áp dụng tới khi stakeholder trả lời Q-1) — Thay bằng Session 2026-10-22 (chốt câu hỏi mở), Q-1.
- [thay thế 2026-10-22 V15 — một phần: chương và chủ đề thuộc kho của từng workspace, do GV quản lý] Q: Tổ chức từ vựng và đề kiểm tra cuối chương thế nào? → A: Mỗi cấp có danh sách "Chương" có thứ tự (≤ 40) do QTND quản lý; từ vựng gắn tùy chọn một chương; "Kiểm tra cuối chương" gắn đúng một chương; "Chủ đề" là nhãn dùng chung mọi cấp (REQ-2). (source: assumption — yêu cầu có "kiểm tra cuối chương" nhưng khu Tự học không có Giáo trình; chương trong kho là cấu trúc tối thiểu để 012 và 015 khớp nhau)
- Q: Vòng đời nội dung? → A: Nháp → Đã xuất bản → Lưu trữ (khôi phục được); chỉ xóa vĩnh viễn được mục chưa từng xuất bản; mục lưu trữ vẫn đọc được qua dữ liệu học đã có (REQ-3). (source: assumption — nguyên tắc "never lose learning data" của product.md)
- Q: Sửa mục đã xuất bản thì sao? → A: Lưu là có hiệu lực với người học ≤ 5 phút nếu mục vẫn đủ điều kiện; riêng đề đã có lượt làm thì tạo phiên bản mới, phiên bản cũ phục vụ lượt đang làm và kết quả cũ (AC-3.9, REQ-11). (source: assumption — sửa lỗi từ vựng phải đến người học ngay; kết quả thi phải khớp đúng đề đã làm)
- Q: Âm thanh có bắt buộc không, định dạng nào? → A: Bắt buộc với bài nghe, lời thoại đóng vai, câu nghe của đề; không bắt buộc với từ vựng (nhãn "Thiếu âm thanh"); MP3/M4A/WAV, ngắn ≤ 2 MB và 30 giây, dài ≤ 20 MB và 5 phút (AC-6.1, AC-4.9). (source: assumption — cho phép xuất bản danh sách từ trước khi thu âm xong; định dạng phổ biến của thiết bị thu)
- Q: Nhập từ vựng thế nào? → A: Tệp .xlsx hoặc .csv UTF-8 theo mẫu, ≤ 5 000 dòng, ≤ 10 MB; kiểm tra trước, báo cáo theo dòng, tải báo cáo lỗi; nhập trọn gói các dòng hợp lệ ở Nháp; dòng trùng bị bỏ qua (REQ-5). (source: assumption — cùng mô hình hai bước của import HV ở 001; 5 000 dòng đủ cho cấp lớn nhất của một lần nhập)
- Q: Âm thanh cho hàng nghìn từ được gắn thế nào? → A: Tải hàng loạt ≤ 500 tệp, ghép theo tên tệp = Chữ Hán (hoặc Chữ Hán_pinyin số thanh cho chữ đa âm) (AC-6.4). (source: assumption — không thể gắn tay hàng nghìn tệp; quy ước tên tệp đơn giản, kiểm được)
- Q: Phát hiện trùng? → A: Từ vựng trùng khi cùng Chữ Hán + Pinyin (chặn); cùng Chữ Hán khác Pinyin chỉ cảnh báo; chữ Hán trùng theo Chữ (AC-4.7, AC-4.8, AC-7.3). (source: assumption — chữ đa âm là từ khác nhau hợp lệ)
- Q: Nguồn / giấy phép? → A: Bắt buộc cho mọi mục và mọi lô nhập (3–200 ký tự); lọc được theo nguồn để xử lý khi một giấy phép hết hiệu lực (AC-14.1, AC-12.3). (source: stakeholder — yêu cầu của brief; độ dài là assumption)
- [thay thế 2026-10-22 V15 — GV thấy số đếm tổng hợp của workspace, chỉ khi có ≥ 5 HV (AC-13.4, AC-11.6)] Q: QTND thấy số liệu sử dụng nào? → A: Chỉ số đếm tổng hợp toàn hệ thống trong 30 ngày (tài khoản dùng Tự học, lượt ôn, lượt luyện, lượt thi theo cấp) và tổng số lượt làm mỗi đề (AC-13.4, AC-11.6). (source: assumption — brief "only aggregated, anonymous usage counts if anything"; đủ để biết nội dung nào được dùng)
- Q: Đề thi thử gồm gì? → A: Loại đề (Đề thi thử / Kiểm tra cuối chương), 1–10 phần (Từ vựng, Ngữ pháp, Nghe, Đọc hiểu, Sắp xếp câu), thời gian làm bài 5–180 phút và thời gian riêng tùy chọn mỗi phần, 6 dạng câu chấm tự động, điểm mỗi câu 1–10, giải thích bắt buộc, thẻ kiến thức cho thống kê lỗi sai, số lần được nghe 1–3, điểm đạt mặc định 60%, tối đa 200 câu (REQ-10). (source: assumption — bao phủ các dạng trong yêu cầu "trắc nghiệm từ vựng, ngữ pháp; nghe và đọc hiểu; sắp xếp từ thành câu"; giải thích bắt buộc vì 015 phải "giải thích đáp án")
- Q: 012–015 cần gì từ kho mà bản đầu chưa có? → A: Mã ổn định cho mọi mục (AC-3.10); nghĩa từ vựng là danh sách 1–5 nghĩa có thứ tự, câu ví dụ có thứ tự, trường "Cách dùng" tùy chọn và "Thứ tự" của từ trong cấp (AC-4.5, AC-4.6, AC-4.10); "Mẹo nhớ" cho chữ Hán, danh mục 214 bộ thủ, tìm chữ theo pinyin không dấu và nghĩa không dấu (AC-7.3, AC-7.7, AC-7.8); kịch bản đóng vai 2–4 vai; âm thanh dài tối đa 5 phút (AC-9.1, AC-6.1). (source: assumption — nhu cầu do điều phối viên tổng hợp từ spec 012–015 cùng ngày; bổ sung để các module tiêu thụ không phải tự suy đoán dữ liệu)
- Q: Từ đã từng xuất bản bị gỡ khỏi kho thì người học thấy gì? → A: Kho giữ nội dung lần xuất bản cuối và không bao giờ xóa (AC-3.6, AC-3.8); 012 hiển thị nhãn "Không còn trong kho" (012 REQ-19). (source: assumption — khớp 012)

### Session 2026-10-22 (chốt câu hỏi mở)

- Q: Q-1 — Cấp cao của HSK mới là một nhóm chung "HSK 7–9" hay ba cấp riêng HSK 7, HSK 8, HSK 9? → A: Một cấp chung "HSK 7–9" theo chuẩn chính thức; kho có đúng 7 cấp, mọi bộ lọc, cột tổng quan và bộ chọn cấp của 012–015 dùng cùng danh sách này (AC-2.1, AC-13.1) (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối)
- Q: Q-2 — Khi QTND sửa đáp án sai của một đề đã có người làm, có chấm lại kết quả cũ không? → A: Không; mỗi lượt giữ phiên bản đã làm, đáp án đã sửa tạo phiên bản mới và chỉ áp dụng cho lượt bắt đầu sau khi phiên bản đó được xuất bản; 015 hiển thị trên kết quả cũ dòng "Đề này đã được cập nhật sau lượt làm của bạn. Kết quả được giữ theo phiên bản bạn đã làm." (015 AC-13.4) (AC-11.4, AC-11.5) (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối) — Từ V15 người sửa đề là GV; quy tắc không đổi.
- [thay thế 2026-10-22 V15 — một phần: nội dung ban đầu là Bộ nội dung mẫu HSK do đội nội dung SAT chuẩn bị, giấy phép phải cho phép sao vào mọi workspace (§10)] Q: Q-3 — Nội dung ban đầu và giấy phép lấy từ đâu? → A: Spec không phụ thuộc nguồn; mọi mục và mọi lô nhập bắt buộc "Nguồn / giấy phép" (AC-14.1, không đổi); có được nội dung HSK đã cấp phép hoặc tự biên soạn là điều kiện tiên quyết kinh doanh trước khi ra mắt, không chặn spec (§10) (source: stakeholder — 'làm theo recommend tốt nhất của bạn', phương án đề xuất của điều phối)

### Session 2026-10-22 (V15 — gom quản lý vào GV)

Áp dụng quyết định V15 của stakeholder ngày 2026-10-22: viết lại module tại chỗ từ "Kho nội dung hệ thống" (vai trò QTND, Q01–Q05) thành "Kho nội dung tự học" của từng workspace do GV quản lý trên T23–T27. Giữ số REQ/AC nơi hành vi còn; viết lại tại chỗ AC-1.1, AC-1.2, AC-1.3, AC-1.5 và mọi AC nêu QTND hoặc Q01–Q05 (thay bằng GV, T23–T27, "kho của workspace", "HV của workspace"), cùng AC-3.1, AC-3.3, AC-3.8, AC-3.10, AC-4.7, AC-4.8, AC-5.4, AC-5.7, AC-10.7, AC-11.6, AC-13.3, AC-13.4, AC-14.2, AC-14.3; bỏ AC-1.4 (mã không dùng lại); thêm AC-1.6, AC-1.7, AC-1.8, REQ-15 (AC-15.1–AC-15.8), NFR-11; viết lại NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-7, NFR-8, NFR-10; viết lại §1–§4 (US-1 đến US-7 cho GV/HV, thêm US-8), §7–§11. Các mục cũ mâu thuẫn được gắn "[thay thế 2026-10-22 V15]".

- Q: Yêu cầu của stakeholder? → A: Nguyên văn: "Hệ thống hiện tại chỉ có 2 role là GV và học viên, và phần quản lí các nội dung tự học sẽ làm chung phần quản lí của GV luôn, và GV chỉ quản lí thôi, chức năng tự học chỉ dành cho user học viên. Gom quản lí hệ thống vào cho GV." (source: stakeholder)
- Q: Kho dùng chung một kho toàn hệ thống hay mỗi GV một kho? → A: Mỗi GV có Kho tự học riêng trong workspace, được nạp sẵn "Bộ nội dung mẫu HSK" mà GV sửa, thêm, ẩn tùy ý (REQ-15, AC-1.2, AC-1.7). (source: stakeholder)
- Q: Ai quản lý và ai dùng? → A: Chỉ GV quản lý kho của workspace mình trên T23–T27 (mục "Kho tự học", 001 AC-20.2); chỉ HV đã kích hoạt, không bị khóa của workspace dùng nội dung "Đã xuất bản" qua S13–S20, không cần lớp (001 AC-20.3); GV không dùng S13–S20 (001 AC-20.4) và xem trước bằng các chức năng xem thử của T24–T27. (source: stakeholder)
- Q: Bộ nội dung mẫu HSK do ai chuẩn bị, gồm gì? → A: Đội nội dung SAT chuẩn bị ngoài sản phẩm cho HSK 1–6 và "HSK 7–9": từ vựng + âm thanh, chữ Hán + dữ liệu nét + bộ thủ, bài nghe, kịch bản đóng vai, đề thi thử và kiểm tra cuối chương, kèm nguồn / giấy phép (AC-15.1, §3, §10). (source: stakeholder — mô hình chung của điều phối)
- Q: Khi nào kho được nạp? → A: Khi workspace được tạo (001 AC-1.1) và, với workspace đã có, tại thời điểm ra mắt Kho tự học (AC-15.1, AC-15.7). (source: stakeholder — mô hình chung của điều phối)
- Q: Mục được sao ở trạng thái nào? → A: "Đã xuất bản" nếu đạt điều kiện xuất bản của loại mục, nếu không thì "Nháp"; có lịch sử "Sao từ Bộ nội dung mẫu HSK" (AC-15.2). (source: assumption — HV phải học được ngay mà GV không phải xuất bản hàng nghìn mục; vẫn giữ quy tắc người học không bao giờ thấy mục chưa đủ điều kiện)
- Q: Bộ mẫu cập nhật sau đó có tự vào kho đã nạp không? → A: Không; phiên bản mới chỉ dùng cho workspace tạo sau; "Nạp mục mẫu mới" là ý tưởng ngoài phạm vi (AC-15.4, §9). (source: assumption — tránh ghi đè chỉnh sửa của GV và tránh trùng với từ GV đã thêm; đơn giản nhất)
- Q: GV có xóa được mục của bộ mẫu không? → A: Mục được sao ở "Đã xuất bản" chỉ lưu trữ được, không xóa (AC-3.8); mục được sao ở "Nháp" xóa được như mọi nháp. (source: assumption — áp dụng nguyên quy tắc vòng đời; "ẩn tùy ý" của stakeholder được đáp ứng bằng "Lưu trữ")
- Q: Trong lúc đang sao thì sao? → A: T23–T27 hiển thị "Đang chuẩn bị Bộ nội dung mẫu HSK cho kho tự học của bạn…", GV chưa thêm/nhập/sửa được, HV chưa thấy mục nào; sao trọn gói, lỗi thì tự sao lại; hoàn tất p95 ≤ 5 phút (AC-15.5, AC-15.6, NFR-11). (source: assumption — tránh xung đột trùng giữa mục GV thêm và mục bộ mẫu; tránh kho nửa vời)
- Q: Cô lập workspace với mục kho? → A: GV mở mục kho của workspace khác → A05 giống mục không tồn tại (AC-1.3); HV chỉ nhận nội dung kho của workspace mình, mục của workspace khác → A05 (AC-1.7, AC-1.8). (source: stakeholder cho cô lập workspace (D1, mô hình chung); câu chữ A05 theo product.md)
- Q: GV thấy số liệu sử dụng nào? → A: Chỉ số đếm tổng hợp ẩn danh của HV trong workspace trong 30 ngày; khi ít hơn 5 HV khác nhau dùng Tự học thì không hiển thị số; số lượt làm mỗi đề chỉ hiển thị khi có ít nhất 5 HV khác nhau (AC-13.4, AC-11.6, AC-1.6). (source: stakeholder cho "chỉ số đếm tổng hợp ẩn danh"; ngưỡng 5 HV là assumption — trong workspace nhỏ, số tổng hợp của 1–2 HV thực chất là dữ liệu cá nhân)
- Q: Hai người cùng sửa một mục? → A: Mỗi kho chỉ có một GV; xung đột lưu chỉ còn giữa hai tab/thiết bị của cùng GV, vẫn không ghi đè (AC-1.5). (source: assumption — giữ bảo vệ dữ liệu khi GV mở nhiều cửa sổ)
- Q: Lịch sử thay đổi còn ghi Họ tên người thực hiện? → A: Ghi "người thực hiện" là GV hoặc "Bộ nội dung mẫu HSK"; bỏ lọc theo người (AC-13.3, AC-14.2, AC-11.6). (source: assumption — một kho chỉ có một người quản lý)
- Q: Thời hạn xuất bản tới HV? → A: Giữ ≤ 5 phút (p99) tới HV của workspace (NFR-3). (source: assumption — không đổi so với V14)
