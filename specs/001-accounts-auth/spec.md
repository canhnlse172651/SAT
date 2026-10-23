---
id: 001
slug: accounts-auth
title: Accounts and Authentication
status: draft
branch: feat/001-accounts-auth
created: 2026-10-18
updated: 2026-10-22
approved_by:
approved_at:
---

# Accounts and Authentication — Tài khoản & Xác thực

<!--
Machine-checked format (sdd check): ### REQ-n: title · - AC-n.m: <EARS> · - NFR-n: <Category>: <target>.
Bản trình bày chi tiết (luồng, quy tắc, thông báo, trạng thái, màn hình): spec.html. Khi lệch nhau, file này là nguồn sự thật.
-->

## 1. Summary

SAT cần một cổng vào duy nhất và an toàn cho hai vai trò: Giáo viên (GV) tự đăng ký và là quản trị viên duy nhất của workspace riêng, còn Học viên (HV) chỉ dùng tài khoản do GV cấp. Hiện GV không có cách nào cấp và quản lý tài khoản cho học viên trên nền tảng, và việc tự phát mật khẩu qua lớp học hay Zalo vừa dễ lộ vừa dễ thất lạc. Module này cho phép GV đăng ký, đăng nhập và tự khôi phục mật khẩu qua email; thêm HV chỉ bằng Email và Họ tên (từng người hoặc bằng tệp Excel); kích hoạt HV từng người hoặc hàng loạt — khi đó hệ thống tạo tài khoản, sinh mật khẩu ngẫu nhiên và gửi thông tin đăng nhập thẳng tới email của HV, GV không bao giờ thấy mật khẩu; quản lý danh sách HV (sửa, gửi lại email, đặt lại mật khẩu qua email, khóa/mở khóa, xóa có điều kiện); cho HV đăng nhập và vào học ngay, không bắt buộc đổi mật khẩu; và bảo đảm không ai xem hay thao tác được dữ liệu ngoài workspace của mình. Giao diện hồ sơ của HV (S10 "Hồ sơ của tôi") thuộc module 011; module này giữ quy tắc đổi mật khẩu mà 011 tham chiếu. Hệ thống chỉ có **hai vai trò: GV và HV** (V15, 2026-10-22 — vai trò "Quản trị nội dung" của V14 đã bị bỏ). Module này định nghĩa lối vào khu Tự học (REQ-20): mục **"Tự học"** (S13, module 012) chỉ có trên giao diện HV, cho mọi HV đã kích hoạt, không bị khóa của workspace, không cần lớp, dùng **Kho nội dung tự học của workspace** đó; GV chỉ quản lý kho này qua mục **"Kho tự học"** trên thanh bên (T23, module 016) và không dùng khu Tự học với tư cách người học. Kết quả mong muốn: GV đưa cả lớp vào hệ thống và gửi tài khoản trong vài phút, HV tự vào học bằng thư nhận được mà không cần hỗ trợ, và dữ liệu giữa các GV tách biệt tuyệt đối.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| GV bắt đầu dùng ngay | Thời gian từ khi mở A02 đến khi thấy T01 | Trung vị ≤ 2 phút |
| Đưa cả lớp vào hệ thống nhanh | Thời gian GV đưa 30 HV vào bằng Import Excel rồi kích hoạt hàng loạt (từ lúc tải tệp mẫu đến lúc cả 30 HV ở trạng thái Đã kích hoạt), đo trong kiểm thử người dùng | ≤ 10 phút với ≥ 80% GV tham gia thử |
| HV vào học không cần hỗ trợ | Tỷ lệ HV đăng nhập thành công lần đầu trong 7 ngày kể từ khi được kích hoạt | ≥ 85% |
| Thư tài khoản tới được HV | Tỷ lệ HV được kích hoạt rơi vào trạng thái Gửi email thất bại, đo theo tháng | ≤ 5% |
| Ít phải hỗ trợ đăng nhập | Số lần GV đặt lại mật khẩu cho HV mỗi tháng / số HV Đã kích hoạt | ≤ 5% |
| Cô lập dữ liệu tuyệt đối | Số trường hợp xem hoặc thay đổi được dữ liệu của workspace khác (kiểm thử bảo mật + vận hành) | 0 |
| Chống dò mật khẩu | Số lần thử mật khẩu tối đa cho một email trong 15 phút | ≤ 5 |

## 3. Actors & Context

- **Khách (chưa đăng nhập):** bất kỳ ai mở A01, A02, A03. Có thể là GV mới muốn đăng ký, GV/HV đã có tài khoản, hoặc kẻ tấn công thử dò tài khoản.
- **Giáo viên (GV):** chủ và quản trị viên duy nhất của một workspace (D1). Làm việc trên máy tính (A4). Hiện quản lý danh sách học viên bằng Excel/sổ tay và phát thông tin đăng nhập thủ công; cần đưa cả lớp vào nhanh, gửi tài khoản cho HV mà không phải tự cầm mật khẩu, xử lý khi HV quên mật khẩu hoặc không nhận được thư, và khóa HV đã nghỉ học.
- **Học viên (HV):** người học do GV thêm vào (D4), dùng chủ yếu trên điện thoại (A4). Nhận thông tin đăng nhập (Email, mật khẩu ngẫu nhiên, liên kết đăng nhập) qua thư do hệ thống gửi tới Email mà GV đã nhập. Có thể đổi mật khẩu bất kỳ lúc nào ở S10 (module 011). Quên mật khẩu thì liên hệ GV để được gửi mật khẩu mới.
- **Dịch vụ gửi thư (hệ thống bên ngoài):** chuyển thư đặt lại mật khẩu cho GV, thư kích hoạt và thư mật khẩu mới cho HV; báo lại khi không nhận thư hoặc khi địa chỉ không nhận được thư.
- **Các module 002–011:** dựa vào danh tính, vai trò, trạng thái tài khoản HV và quy tắc cô lập workspace do module này định nghĩa; 011 dùng quy tắc đổi mật khẩu (REQ-15).
- **Các module 012–016 (từ 2026-10-22, sửa theo V15):** 012–015 (khu Tự học, S13–S20, chỉ dành cho HV) dựa vào quyền dùng và quy tắc riêng tư của REQ-20; 016 (Kho nội dung tự học của workspace, T23–T27, chỉ GV quản lý) dựa vào việc tạo workspace (AC-1.1), mục "Kho tự học" trên thanh bên GV (AC-20.2) và quy tắc cô lập workspace (REQ-16).

## 4. User Stories

- US-1 (P1): Là **giáo viên**, tôi muốn tự đăng ký tài khoản, đăng nhập và đăng xuất an toàn, để có workspace riêng và bắt đầu dạy ngay.
  - Why this priority: không có tài khoản GV thì không module nào khác dùng được.
  - Independent test: đăng ký ở A02 → được đưa tới T01; đăng xuất → A01; đăng nhập lại bằng email/mật khẩu vừa tạo → T01; nhập sai 5 lần → bị tạm khóa 15 phút.
- US-2 (P1): Là **học viên**, tôi muốn nhận thông tin đăng nhập qua email và vào học ngay, để không phải chờ giáo viên phát mật khẩu.
  - Why this priority: là con đường duy nhất để HV vào hệ thống (D4).
  - Independent test: với một HV vừa được kích hoạt, hộp thư của HV nhận thư "[SAT] Tài khoản học tập của bạn đã sẵn sàng" chứa Email, mật khẩu và liên kết đăng nhập; HV đăng nhập ở A01 bằng thông tin đó → tới thẳng S01, không bị yêu cầu đổi mật khẩu.
- US-3 (P1): Là **giáo viên**, tôi muốn thêm từng học viên bằng Email và Họ tên rồi bấm "Kích hoạt", để hệ thống tự tạo tài khoản và gửi thông tin đăng nhập cho học viên.
  - Why this priority: cách tối thiểu để có HV dùng được hệ thống; T03 (module 003) dùng lại chức năng thêm HV.
  - Independent test: ở T12 nhập Họ tên + Email → HV xuất hiện ở T11 với trạng thái "Chưa kích hoạt" và không đăng nhập được; bấm "Kích hoạt" → trạng thái "Đã kích hoạt", HV nhận thư; GV không thấy mật khẩu ở bất kỳ đâu.
- US-4 (P1): Là **giáo viên**, tôi muốn nhập danh sách học viên từ tệp Excel theo mẫu rồi kích hoạt hàng loạt, để đưa cả lớp vào hệ thống một lần mà không sai sót.
  - Why this priority: quyết định của bên liên quan (D4, V4-6); tiết kiệm thời gian lớn với lớp đông.
  - Independent test: tải tệp mẫu, điền 30 dòng (có 2 dòng lỗi) → báo cáo 28 hợp lệ / 2 lỗi kèm lý do; xác nhận → 28 HV "Chưa kích hoạt"; lọc "Chưa kích hoạt", chọn tất cả, "Kích hoạt" → 28 thư được gửi; một địa chỉ không tồn tại → HV đó "Gửi email thất bại"; sửa Email, bấm "Gửi lại" → "Đã kích hoạt".
- US-5 (P1): Là **giáo viên**, tôi muốn tìm, lọc, sửa thông tin, đặt lại mật khẩu, khóa/mở khóa và xóa học viên, để quản lý học viên suốt quá trình học.
  - Why this priority: HV quên mật khẩu chỉ có thể nhờ GV; HV nghỉ học cần bị khóa.
  - Independent test: ở T11 tìm "nguyen" thấy "Nguyễn …"; đặt lại mật khẩu → HV bị đăng xuất và nhận thư mật khẩu mới, mật khẩu cũ không dùng được; khóa → HV không đăng nhập được; mở khóa → đăng nhập lại được; xóa HV chưa có Bài nộp → biến mất khỏi T11.
- US-6 (P1): Là **giáo viên**, tôi muốn tự đặt lại mật khẩu qua liên kết gửi tới email khi quên, để không mất quyền truy cập workspace (không có quản trị viên cấp trên nào giúp được).
  - Why this priority: MVP không có super-admin (D1), nên quên mật khẩu mà không tự khôi phục được đồng nghĩa mất toàn bộ workspace.
  - Independent test: ở A03 nhập email GV → nhận thư trong vài phút; mở liên kết, đặt mật khẩu mới → A01; đăng nhập bằng mật khẩu mới thành công; mở lại liên kết cũ → báo không hợp lệ.
- US-7 (P2): Là **giáo viên hoặc học viên**, tôi muốn tự đổi mật khẩu (và GV sửa được thông tin tài khoản của mình), để giữ tài khoản an toàn và thông tin chính xác.
  - Why this priority: cần thiết nhưng không chặn việc dạy và học ban đầu.
  - Independent test: GV ở T17 đổi Họ tên và mật khẩu; HV đổi mật khẩu ở S10 (giao diện của module 011) theo đúng quy tắc REQ-15; phiên ở thiết bị khác bị kết thúc.
- US-8 (P1): Là **giáo viên**, tôi muốn chắc chắn rằng không giáo viên hay học viên nào khác xem hoặc thao tác được trên dữ liệu workspace của tôi, để bảo vệ thông tin học viên.
  - Why this priority: quyết định D1; vi phạm là sự cố lộ dữ liệu cá nhân.
  - Independent test: GV B mở đường dẫn trực tiếp tới HV của GV A → nhận "Không tìm thấy nội dung bạn yêu cầu." giống như HV không tồn tại; HV mở một màn hình GV → bị chuyển về S01.
- US-10 (P1): Là **học viên**, tôi muốn có mục "Tự học" để tự học từ vựng, luyện viết, nghe nói và thi thử với nội dung giáo viên của tôi quản lý mà không cần thuộc lớp nào; còn **giáo viên** có mục "Kho tự học" để quản lý nội dung đó.
  - Why this priority: quyết định V14 (khu Tự học không cần lớp) và V15 (chỉ HV tự học, GV chỉ quản lý, chỉ hai vai trò).
  - Independent test: HV đã kích hoạt nhưng chưa thuộc lớp nào chạm "Tự học" ở thanh tab dưới → mở S13 với nội dung kho của workspace mình; thanh bên của GV không có "Tự học" mà có "Kho tự học" → T23; GV mở đường dẫn S13 → A05; HV mở đường dẫn T23 → S01; GV của HV đó không thấy dữ liệu tự học của riêng HV ở bất kỳ màn hình nào.

> US-9 (Quản trị nội dung) đã bị bỏ ngày 2026-10-22 (V15); mã US-9 không dùng lại — xem §9 "Removed (2026-10-22, V15)".

## 5. Functional Requirements

### REQ-1: Đăng ký tài khoản giáo viên

<!-- Story: US-1 · Priority: P1 · Screens: A02 -->

- AC-1.1: WHEN một khách gửi biểu mẫu A02 với Họ tên, Email, Mật khẩu và Xác nhận mật khẩu đều hợp lệ THE SYSTEM SHALL tạo một tài khoản GV kèm một workspace mới chỉ thuộc về tài khoản đó (chưa có HV, Giáo trình hay Lớp; Kho nội dung tự học được nạp Bộ nội dung mẫu HSK theo module 016), đăng nhập GV ngay và chuyển đến T01.
- AC-1.2: IF Email nhập ở A02 đã được dùng cho bất kỳ tài khoản GV hoặc HV nào THEN THE SYSTEM SHALL không tạo tài khoản và hiển thị "Email này đã được sử dụng." mà không cho biết tài khoản đó có vai trò gì hay thuộc workspace nào.
- AC-1.3: IF Họ tên hoặc Email ở A02 không đúng quy tắc (Họ tên 2–100 ký tự sau khi bỏ khoảng trắng đầu/cuối; Email đúng định dạng địa chỉ thư, chỉ gồm ký tự ASCII, tối đa 254 ký tự) THEN THE SYSTEM SHALL không tạo tài khoản, hiển thị thông báo lỗi ngay dưới từng trường sai và giữ lại các giá trị đã nhập trừ hai ô mật khẩu.
- AC-1.4: THE SYSTEM SHALL chỉ cho phép tự đăng ký tài khoản vai trò GV và không cung cấp bất kỳ cách tự đăng ký nào tạo ra tài khoản HV.

> Phạm vi duy nhất của Email (áp dụng cho AC-1.2, AC-8.4, AC-9.4, AC-11.6, AC-14.2, AC-14.3): tạm áp dụng **duy nhất trên toàn hệ thống**, giữa mọi GV và HV (kể cả HV Chưa kích hoạt). [NEEDS CLARIFICATION: Email phải duy nhất trên toàn hệ thống (một người chỉ có một tài khoản, kể cả khi học với hai GV khác nhau) hay chỉ cần duy nhất trong từng workspace (khi đó A01 phải có thêm cách chọn workspace khi đăng nhập)?]
>
> A02 không có ô đồng ý Điều khoản sử dụng / Chính sách dữ liệu trong MVP (V4-5, xem §9).

### REQ-2: Quy tắc nhập liệu chung và mật khẩu

<!-- Story: US-1, US-2, US-3 · Priority: P1 · Screens: A01, A02, A03, T11, T12, T17, S10 (quy tắc đổi mật khẩu) -->

- AC-2.1: IF một trường bắt buộc trên biểu mẫu của module này để trống hoặc chỉ chứa khoảng trắng THEN THE SYSTEM SHALL không gửi biểu mẫu và hiển thị ngay dưới trường đó thông báo "Vui lòng nhập …" kèm tên trường (ví dụ "Vui lòng nhập email.").
- AC-2.2: THE SYSTEM SHALL bỏ khoảng trắng ở đầu và cuối của Email, so khớp Email không phân biệt chữ hoa/chữ thường ở mọi nơi (đăng nhập, kiểm tra trùng, tìm kiếm), và so khớp mật khẩu chính xác, có phân biệt chữ hoa/chữ thường.
- AC-2.3: IF một mật khẩu do người dùng tự đặt (ở A02, A03, T17, hoặc ở chức năng Đổi mật khẩu của S10 thuộc module 011) có ít hơn 8 hoặc nhiều hơn 64 ký tự, hoặc không chứa ít nhất một chữ cái và một chữ số THEN THE SYSTEM SHALL từ chối mật khẩu đó và hiển thị "Mật khẩu phải có 8–64 ký tự, gồm ít nhất một chữ cái và một chữ số."; trong lúc người dùng gõ mật khẩu mới, biểu mẫu luôn hiển thị hai quy tắc "8–64 ký tự" và "Có ít nhất một chữ cái và một chữ số", mỗi quy tắc được đánh dấu đạt hoặc chưa đạt theo giá trị đang nhập.
- AC-2.4: IF ô xác nhận mật khẩu không trùng khớp hoàn toàn với ô mật khẩu mới THEN THE SYSTEM SHALL từ chối và hiển thị "Mật khẩu xác nhận không khớp."
- AC-2.5: THE SYSTEM SHALL tạo mỗi mật khẩu ngẫu nhiên cho HV (khi kích hoạt, Gửi lại hoặc Đặt lại mật khẩu) gồm đúng 10 ký tự là chữ cái Latin hoặc chữ số, có ít nhất một chữ cái và một chữ số, không chứa các ký tự dễ nhầm 0, O, o, 1, l, I, và được chọn ngẫu nhiên cho mỗi lần tạo.
- AC-2.6: THE SYSTEM SHALL không bao giờ hiển thị cho GV, cho tải xuống hay đưa vào bất kỳ danh sách, tệp hoặc nhật ký nào mật khẩu của bất kỳ tài khoản nào; mật khẩu ngẫu nhiên của HV chỉ xuất hiện trong thư gửi tới chính Email của HV (AC-17.1, AC-17.2).

### REQ-3: Đăng nhập và điều hướng theo vai trò

<!-- Story: US-1, US-2 · Priority: P1 · Screens: A01, T01, S01 -->

- AC-3.1: WHEN một GV gửi ở A01 đúng Email và mật khẩu THE SYSTEM SHALL mở phiên đăng nhập và chuyển GV đến T01.
- AC-3.2: WHEN một HV đã được kích hoạt và không ở trạng thái Đã khóa gửi ở A01 đúng Email và mật khẩu THE SYSTEM SHALL mở phiên đăng nhập và chuyển HV thẳng đến S01, không yêu cầu đổi mật khẩu.
- AC-3.3: IF Email không thuộc tài khoản nào, thuộc một HV Chưa kích hoạt, mật khẩu sai, hoặc tài khoản đã bị xóa THEN THE SYSTEM SHALL từ chối đăng nhập với cùng một thông báo "Email hoặc mật khẩu không đúng." cho mọi trường hợp đó.
- AC-3.4: IF một HV gửi đúng Email và mật khẩu nhưng tài khoản đang Đã khóa THEN THE SYSTEM SHALL từ chối đăng nhập và hiển thị "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ giáo viên của bạn."
- AC-3.5: WHILE người dùng đang có phiên đăng nhập hợp lệ THE SYSTEM SHALL chuyển mọi lần mở A01, A02 hoặc biểu mẫu Quên mật khẩu của A03 về trang chủ theo vai trò (T01 cho GV, S01 cho HV).

### REQ-4: Tạm khóa đăng nhập khi nhập sai nhiều lần

<!-- Story: US-1, US-2 · Priority: P1 · Screens: A01 -->

- AC-4.1: IF có 5 lần đăng nhập sai liên tiếp cho cùng một Email trong vòng 15 phút THEN THE SYSTEM SHALL tạm khóa đăng nhập cho Email đó trong 15 phút kể từ lần sai thứ 5 và hiển thị "Bạn đã nhập sai quá 5 lần. Vui lòng thử lại sau 15 phút."
- AC-4.2: WHILE một Email đang bị tạm khóa đăng nhập THE SYSTEM SHALL từ chối mọi lần đăng nhập bằng Email đó, kể cả khi mật khẩu đúng, với cùng thông báo ở AC-4.1 và không kéo dài thời gian tạm khóa.
- AC-4.3: THE SYSTEM SHALL áp dụng cùng bộ đếm, cùng thời gian tạm khóa và cùng thông báo cho Email không thuộc tài khoản nào hoặc thuộc HV Chưa kích hoạt, để phản hồi không tiết lộ Email đó có tồn tại hay không.
- AC-4.4: WHEN đăng nhập thành công, hoặc hết thời gian tạm khóa, hoặc GV đặt lại mật khẩu qua A03, hoặc hệ thống tạo mật khẩu ngẫu nhiên mới cho một HV (kích hoạt, Gửi lại, Đặt lại mật khẩu) THE SYSTEM SHALL đưa bộ đếm lần sai của Email tương ứng về 0 và gỡ tạm khóa đăng nhập nếu đang có.

### REQ-5: Phiên đăng nhập, hết hạn phiên và đăng xuất

<!-- Story: US-1, US-2 · Priority: P1 · Screens: A01, T17, S10 -->

- AC-5.1: WHEN người dùng chọn "Đăng xuất" (ở T17 hoặc S10) THE SYSTEM SHALL hiển thị hộp thoại xác nhận "Đăng xuất khỏi SAT?" kèm dòng "Bạn sẽ cần email và mật khẩu để đăng nhập lại.", và khi người dùng xác nhận "Đăng xuất" thì kết thúc phiên trên thiết bị đó, chuyển về A01 với thông báo "Đã đăng xuất." và không hiển thị lại dữ liệu cần đăng nhập khi người dùng bấm Quay lại trên trình duyệt.
- AC-5.2: IF một phiên của GV không có thao tác nào trong 8 giờ liên tục THEN THE SYSTEM SHALL kết thúc phiên đó.
- AC-5.3: IF một phiên của HV không có thao tác nào trong 30 ngày liên tục THEN THE SYSTEM SHALL kết thúc phiên đó.
- AC-5.4: WHEN người dùng thực hiện một thao tác bằng phiên đã hết hạn hoặc đã bị kết thúc THE SYSTEM SHALL không thực hiện thao tác đó, chuyển đến A01 và hiển thị "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", trừ trường hợp tài khoản bị khóa (AC-12.3).
- AC-5.5: WHEN một người chưa đăng nhập mở một màn hình cần đăng nhập THE SYSTEM SHALL chuyển đến A01 và, sau khi đăng nhập thành công, đưa người dùng trở lại đúng màn hình đó nếu vai trò của họ được phép xem, nếu không thì về trang chủ theo vai trò.
- AC-5.6: THE SYSTEM SHALL cho phép một tài khoản có nhiều phiên đăng nhập đồng thời trên các thiết bị hoặc trình duyệt khác nhau, và đăng xuất ở một thiết bị không kết thúc phiên ở thiết bị khác.

### REQ-6: Quên và đặt lại mật khẩu giáo viên

<!-- Story: US-6 · Priority: P1 · Screens: A01, A03 -->

- AC-6.1: WHEN một người gửi ở A03 một Email đúng định dạng THE SYSTEM SHALL luôn hiển thị cùng một thông báo "Nếu email này thuộc một tài khoản giáo viên, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút. Nếu bạn là học viên, vui lòng liên hệ giáo viên của bạn để được cấp lại mật khẩu." bất kể Email có thuộc tài khoản nào hay không.
- AC-6.2: WHEN Email gửi ở A03 thuộc một tài khoản GV THE SYSTEM SHALL gửi tới Email đó thư đặt lại mật khẩu (nội dung theo AC-17.3) chứa liên kết dùng một lần, có hiệu lực 60 phút, và vô hiệu hóa mọi liên kết đặt lại trước đó của tài khoản này.
- AC-6.3: IF Email gửi ở A03 thuộc một HV (ở bất kỳ trạng thái nào) hoặc không thuộc tài khoản nào THEN THE SYSTEM SHALL không gửi bất kỳ thư nào.
- AC-6.4: IF đã có 3 thư đặt lại mật khẩu được gửi cho cùng một tài khoản GV trong 60 phút gần nhất THEN THE SYSTEM SHALL không gửi thêm thư cho tài khoản đó cho đến khi số thư trong 60 phút gần nhất dưới 3, nhưng vẫn hiển thị thông báo ở AC-6.1.
- AC-6.5: WHEN GV mở một liên kết đặt lại còn hiệu lực và gửi mật khẩu mới hợp lệ cùng xác nhận khớp THE SYSTEM SHALL cập nhật mật khẩu, vô hiệu hóa liên kết, kết thúc mọi phiên đang mở của GV đó, và chuyển đến A01 với thông báo "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới."
- AC-6.6: IF liên kết đặt lại đã quá 60 phút, đã được dùng, hoặc đã bị thay bằng một liên kết mới hơn THEN THE SYSTEM SHALL không cho đặt mật khẩu và hiển thị "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." kèm nút "Gửi lại liên kết" dẫn tới biểu mẫu Quên mật khẩu của A03.

### REQ-7: Kích hoạt tài khoản học viên

<!-- Story: US-3, US-4 · Priority: P1 · Screens: T11 -->

- AC-7.1: WHEN GV chọn "Kích hoạt" trên dòng của một HV đang Chưa kích hoạt THE SYSTEM SHALL tạo tài khoản đăng nhập dùng Email của HV, tạo một mật khẩu ngẫu nhiên (AC-2.5), gửi thư kích hoạt (AC-17.1) tới Email đó, hiển thị cho GV "Đang gửi email đăng nhập tới [Email]…" và hiển thị HV ở trạng thái "Đang gửi email" cho tới khi có kết quả gửi (AC-18.1, AC-18.2).
- AC-7.2: WHEN GV chọn nhiều HV ở T11 (từng dòng, cả trang, hoặc "Chọn tất cả N học viên khớp bộ lọc") rồi chọn "Kích hoạt" THE SYSTEM SHALL hiển thị hộp thoại xác nhận "Kích hoạt N học viên? Hệ thống sẽ tạo tài khoản và gửi email đăng nhập tới từng học viên.", trong đó N chỉ tính HV đang Chưa kích hoạt, kèm dòng "Z học viên sẽ được bỏ qua vì đang ở trạng thái khác." khi có HV bị bỏ qua; nếu không có HV Chưa kích hoạt nào trong các HV đã chọn thì không mở hộp thoại mà hiển thị "Không có học viên Chưa kích hoạt nào trong các học viên đã chọn."
- AC-7.3: WHEN GV xác nhận kích hoạt hàng loạt THE SYSTEM SHALL kích hoạt từng HV như AC-7.1, độc lập với nhau để thư của một HV gửi thất bại không ngăn các HV khác được kích hoạt, và khi mọi thư của lần đó đã có kết quả thì hiển thị trên T11 tóm tắt "Kích hoạt xong: X đã gửi email, Y gửi email thất bại, Z bỏ qua."
- AC-7.4: IF một lần kích hoạt hàng loạt có hơn 500 HV Chưa kích hoạt được chọn THEN THE SYSTEM SHALL không kích hoạt HV nào và hiển thị "Mỗi lần chỉ kích hoạt được tối đa 500 học viên. Vui lòng chọn ít hơn."
- AC-7.5: IF tại thời điểm thực hiện, một HV được chọn để kích hoạt không còn ở trạng thái Chưa kích hoạt (ví dụ vừa được kích hoạt ở tab khác) THEN THE SYSTEM SHALL bỏ qua HV đó, không tạo mật khẩu mới, không gửi thư và tính HV đó vào số "bỏ qua" của tóm tắt.
- AC-7.6: WHILE một HV đang Chưa kích hoạt THE SYSTEM SHALL cho phép GV thêm HV đó vào Lớp (module 003) như một HV đã kích hoạt, và giữ nguyên tư cách thành viên Lớp đó khi HV được kích hoạt sau này.

### REQ-8: Thêm từng học viên

<!-- Story: US-3 · Priority: P1 · Screens: T12 (cũng được mở từ T11 và từ bước 2 của T03 — module 003) -->

- AC-8.1: WHEN GV gửi biểu mẫu "Thêm học viên" ở T12 với Họ tên và Email hợp lệ, kèm Số điện thoại và Ghi chú tùy chọn THE SYSTEM SHALL thêm HV vào workspace của GV đó ở trạng thái Chưa kích hoạt, không tạo mật khẩu và không gửi thư.
- AC-8.2: WHEN một HV vừa được thêm ở T12 THE SYSTEM SHALL đưa HV vào mục "Vừa thêm" của T12 với Họ tên, Email và nhãn "Chưa kích hoạt", hiển thị dòng "Học viên chỉ đăng nhập được sau khi bạn bấm Kích hoạt ở danh sách học viên.", và đưa biểu mẫu về trạng thái trống để nhập HV tiếp theo.
- AC-8.3: WHEN GV đóng T12 THE SYSTEM SHALL đóng hộp thoại mà không hỏi xác nhận và hiển thị các HV vừa thêm ở đầu T11 với trạng thái Chưa kích hoạt.
- AC-8.4: IF Email nhập ở T12 đã được dùng cho bất kỳ tài khoản GV hoặc HV nào (kể cả HV Chưa kích hoạt) THEN THE SYSTEM SHALL không thêm HV và hiển thị "Email này đã được sử dụng." mà không cho biết tài khoản đó có vai trò gì hay thuộc workspace nào.
- AC-8.5: IF một trường ở T12 không đúng quy tắc (Họ tên 2–100 ký tự; Email đúng định dạng địa chỉ thư, chỉ gồm ký tự ASCII, tối đa 254 ký tự; Số điện thoại nếu có gồm 9–15 chữ số, có thể bắt đầu bằng dấu +; Ghi chú tối đa 500 ký tự) THEN THE SYSTEM SHALL không thêm HV và hiển thị thông báo lỗi dưới từng trường sai.

### REQ-9: Import học viên từ Excel — tệp mẫu và kiểm tra tệp

<!-- Story: US-4 · Priority: P1 · Screens: T12 (tab Import Excel) -->

- AC-9.1: WHEN GV chọn "Tải tệp mẫu" ở T12 THE SYSTEM SHALL cung cấp một tệp .xlsx có trang tính đầu tiên chứa đúng một dòng tiêu đề "Họ tên", "Email", "Số điện thoại", "Ghi chú" (cột Số điện thoại định dạng văn bản) và một trang tính "Hướng dẫn" mô tả quy tắc của từng cột.
- AC-9.2: IF tệp tải lên không đọc được dưới dạng tệp Excel .xlsx hoặc lớn hơn 2 MB THEN THE SYSTEM SHALL từ chối cả tệp, không thêm HV nào và hiển thị "Chỉ chấp nhận tệp Excel (.xlsx) tối đa 2 MB."
- AC-9.3: IF trang tính đầu tiên thiếu cột tiêu đề "Họ tên" hoặc "Email", không có dòng dữ liệu nào, hoặc có hơn 500 dòng dữ liệu THEN THE SYSTEM SHALL từ chối cả tệp, không thêm HV nào và hiển thị tương ứng "Tệp không đúng mẫu: thiếu cột Họ tên hoặc Email.", "Tệp không có dòng dữ liệu nào." hoặc "Tệp có hơn 500 dòng dữ liệu. Vui lòng chia thành nhiều tệp."
- AC-9.4: WHEN GV tải lên một tệp hợp lệ về cấu trúc THE SYSTEM SHALL kiểm tra từng dòng dữ liệu theo đúng quy tắc của AC-8.4 và AC-8.5, bỏ qua các dòng hoàn toàn trống, và hiển thị báo cáo kiểm tra gồm tổng số dòng, số dòng hợp lệ, số dòng lỗi, và với mỗi dòng lỗi: số thứ tự dòng trong tệp, Họ tên, Email và lý do lỗi — khi chưa thêm HV nào.
- AC-9.5: IF hai hay nhiều dòng trong cùng tệp có Email trùng nhau THEN THE SYSTEM SHALL đánh dấu lỗi tất cả các dòng đó với lý do "Email bị trùng trong tệp (dòng …)" liệt kê số thứ tự các dòng trùng.

### REQ-10: Import học viên từ Excel — xác nhận nhập

<!-- Story: US-4 · Priority: P1 · Screens: T12 (tab Import Excel) -->

- AC-10.1: WHEN báo cáo kiểm tra có ít nhất một dòng hợp lệ và GV chọn "Nhập N học viên hợp lệ" THE SYSTEM SHALL thêm HV cho đúng các dòng hợp lệ và bỏ qua mọi dòng lỗi, mỗi HV thuộc workspace của GV ở trạng thái Chưa kích hoạt.
- AC-10.2: WHEN việc nhập hoàn tất THE SYSTEM SHALL hiển thị dòng "Đã thêm N học viên ở trạng thái Chưa kích hoạt. Học viên chỉ đăng nhập được sau khi bạn bấm Kích hoạt ở danh sách học viên." và danh sách Họ tên, Email kèm nhãn "Chưa kích hoạt" của từng HV vừa thêm.
- AC-10.3: THE SYSTEM SHALL không tạo mật khẩu và không gửi bất kỳ thư nào cho HV khi GV thêm từng HV hoặc nhập từ Excel; thư cho HV chỉ được gửi khi GV kích hoạt (REQ-7), Gửi lại (AC-18.4) hoặc Đặt lại mật khẩu (AC-12.1).
- AC-10.4: IF báo cáo kiểm tra không có dòng hợp lệ nào THEN THE SYSTEM SHALL vô hiệu hóa nút nhập và hiển thị "Không có dòng hợp lệ để nhập. Vui lòng sửa tệp theo báo cáo và tải lên lại."
- AC-10.5: IF tại thời điểm GV xác nhận có dòng hợp lệ trở thành không hợp lệ (ví dụ Email vừa được dùng cho tài khoản khác) hoặc việc thêm bị gián đoạn giữa chừng THEN THE SYSTEM SHALL không thêm bất kỳ HV nào từ lần xác nhận đó và hiển thị báo cáo kiểm tra đã cập nhật để GV xác nhận lại.

### REQ-11: Danh sách học viên — xem, tìm kiếm, lọc và sửa thông tin

<!-- Story: US-5 · Priority: P1 · Screens: T11 -->

- AC-11.1: WHEN GV mở T11 THE SYSTEM SHALL chỉ hiển thị các HV thuộc workspace của GV, mỗi dòng gồm ảnh đại diện (theo module 011), Họ tên, Email, Số điện thoại, trạng thái (Chưa kích hoạt, Đang gửi email, Đã kích hoạt, Gửi email thất bại hoặc Đã khóa), số Lớp đang tham gia và thời điểm đăng nhập gần nhất theo giờ Việt Nam (hoặc "Chưa đăng nhập").
- AC-11.2: THE SYSTEM SHALL sắp xếp T11 mặc định theo ngày thêm mới nhất trước, phân trang 50 HV mỗi trang và hiển thị tổng số HV khớp điều kiện đang áp dụng.
- AC-11.3: WHEN GV nhập từ khóa vào ô tìm kiếm ở T11 THE SYSTEM SHALL chỉ hiển thị HV có Họ tên hoặc Email chứa từ khóa, không phân biệt chữ hoa/chữ thường và không phân biệt dấu tiếng Việt (ví dụ "nguyen" khớp "Nguyễn").
- AC-11.4: WHEN GV chọn bộ lọc trạng thái Tất cả, Chưa kích hoạt, Đã kích hoạt, Gửi email thất bại hoặc Đã khóa (mỗi bộ lọc hiển thị kèm số HV của trạng thái đó) THE SYSTEM SHALL chỉ hiển thị HV có trạng thái tương ứng, trong đó bộ lọc Đã kích hoạt gồm cả HV Đang gửi email, kết hợp với từ khóa tìm kiếm đang áp dụng.
- AC-11.5: IF danh sách cần hiển thị không có HV nào THEN THE SYSTEM SHALL hiển thị "Chưa có học viên nào." kèm nút "Thêm học viên" và "Import Excel" khi workspace chưa có HV, hoặc "Không tìm thấy học viên phù hợp." kèm nút "Xóa bộ lọc" khi đang tìm kiếm hoặc lọc.
- AC-11.6: WHEN GV lưu thay đổi Họ tên, Email, Số điện thoại hoặc Ghi chú của một HV và dữ liệu đúng quy tắc của AC-8.4 và AC-8.5 THE SYSTEM SHALL cập nhật thông tin đó mà không tự gửi thư, và nếu Email thay đổi thì mọi lần đăng nhập, Gửi lại và Đặt lại mật khẩu sau đó dùng Email mới.

### REQ-12: Đặt lại mật khẩu, khóa, mở khóa và thao tác theo trạng thái

<!-- Story: US-5 · Priority: P1 · Screens: T11 -->

- AC-12.1: WHEN GV xác nhận "Đặt lại mật khẩu" cho một HV Đã kích hoạt THE SYSTEM SHALL tạo mật khẩu ngẫu nhiên mới (AC-2.5), làm mật khẩu cũ mất hiệu lực, kết thúc mọi phiên của HV, gửi thư mật khẩu mới (AC-17.2) tới Email của HV, chuyển HV sang Đang gửi email và hiển thị cho GV "Mật khẩu mới đang được gửi tới [Email]." mà không hiển thị mật khẩu.
- AC-12.2: WHEN GV xác nhận "Khóa tài khoản" cho một HV Đã kích hoạt hoặc Gửi email thất bại THE SYSTEM SHALL chuyển HV sang Đã khóa, kết thúc mọi phiên của HV, và giữ nguyên thông tin cá nhân, Bài nộp, Điểm và tư cách thành viên các Lớp của HV.
- AC-12.3: IF HV thực hiện một thao tác bằng phiên đã bị kết thúc do tài khoản bị khóa THEN THE SYSTEM SHALL không thực hiện thao tác, chuyển HV về A01 và hiển thị "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ giáo viên của bạn."
- AC-12.4: WHEN GV chọn "Mở khóa" cho một HV Đã khóa THE SYSTEM SHALL đưa HV về đúng trạng thái trước khi bị khóa (Đã kích hoạt hoặc Gửi email thất bại), cho phép HV đăng nhập bằng mật khẩu hiện có, không tạo mật khẩu mới và không gửi thư.
- AC-12.5: WHEN GV chọn "Đặt lại mật khẩu" hoặc "Khóa tài khoản" cho một HV THE SYSTEM SHALL hiển thị hộp thoại xác nhận nêu Họ tên, Email của HV và hệ quả "Học viên sẽ bị đăng xuất khỏi mọi thiết bị." (với Đặt lại mật khẩu thêm "Mật khẩu mới sẽ được gửi tới email của học viên."; với Khóa tài khoản thêm "Thông tin, bài nộp, điểm và các lớp của học viên được giữ nguyên.") trước khi thực hiện.
- AC-12.6: THE SYSTEM SHALL chỉ cung cấp trên mỗi dòng T11 các thao tác theo trạng thái của HV: Chưa kích hoạt — Kích hoạt, Sửa, Xóa; Đang gửi email — Sửa (không đổi được Email), Xóa; Đã kích hoạt — Sửa, Đặt lại mật khẩu, Khóa tài khoản, Xóa; Gửi email thất bại — Gửi lại, Sửa, Khóa tài khoản, Xóa; Đã khóa — Mở khóa, Sửa, Xóa.

### REQ-13: Xóa học viên

<!-- Story: US-5 · Priority: P1 · Screens: T11 -->

- AC-13.1: WHEN GV chọn "Xóa" cho một HV THE SYSTEM SHALL hiển thị hộp thoại xác nhận nêu Họ tên, Email, số Lớp HV đang tham gia và cảnh báo "Thao tác này không thể hoàn tác." trước khi xóa.
- AC-13.2: WHEN GV xác nhận xóa một HV chưa có Bài nộp nào (ở bất kỳ trạng thái nào) THE SYSTEM SHALL xóa vĩnh viễn HV, tài khoản đăng nhập nếu có, thông tin cá nhân và mọi dữ liệu học tập của HV, gỡ HV khỏi mọi Lớp, kết thúc mọi phiên của HV, và cho phép dùng lại Email đó cho tài khoản mới.
- AC-13.3: IF HV đã có ít nhất một Bài nộp tại thời điểm GV xác nhận xóa THEN THE SYSTEM SHALL không xóa và hiển thị "Học viên đã có bài nộp nên không thể xóa để giữ kết quả học tập. Bạn có thể khóa tài khoản thay thế." kèm nút "Khóa tài khoản".

### REQ-14: Hồ sơ tài khoản giáo viên

<!-- Story: US-7 · Priority: P2 · Screens: T17 -->

- AC-14.1: WHEN GV mở T17 THE SYSTEM SHALL hiển thị Họ tên, Email và ngày tạo tài khoản của GV, và cho phép GV sửa và lưu Họ tên theo quy tắc 2–100 ký tự.
- AC-14.2: WHEN GV gửi ở T17 một Email mới đúng định dạng, chưa được dùng cho tài khoản nào, kèm đúng mật khẩu hiện tại THE SYSTEM SHALL cập nhật Email đăng nhập của GV và dùng Email mới cho mọi lần đăng nhập và thư đặt lại mật khẩu sau đó.
- AC-14.3: IF Email mới ở T17 đã được dùng cho tài khoản khác hoặc mật khẩu hiện tại không đúng THEN THE SYSTEM SHALL không đổi Email và hiển thị tương ứng "Email này đã được sử dụng." hoặc "Mật khẩu hiện tại không đúng."

> Hồ sơ của HV (S10 "Hồ sơ của tôi": thông tin cá nhân, ảnh, lớp, tiến độ, xếp hạng) thuộc module 011 (V4-7). Module này chỉ định nghĩa quy tắc đổi mật khẩu dùng ở S10 (REQ-15).

### REQ-15: Đổi mật khẩu

<!-- Story: US-7 · Priority: P2 · Screens: T17, S10 (giao diện thuộc module 011) -->

- AC-15.1: WHEN GV ở T17 hoặc HV ở chức năng Đổi mật khẩu của S10 gửi đúng Mật khẩu hiện tại cùng Mật khẩu mới hợp lệ (AC-2.3) và xác nhận khớp (AC-2.4) THE SYSTEM SHALL cập nhật mật khẩu, giữ phiên hiện tại, kết thúc mọi phiên khác của tài khoản đó và hiển thị "Đã đổi mật khẩu thành công."
- AC-15.2: IF Mật khẩu hiện tại nhập khi đổi mật khẩu không đúng THEN THE SYSTEM SHALL không đổi mật khẩu và hiển thị "Mật khẩu hiện tại không đúng."
- AC-15.3: IF Mật khẩu hiện tại bị nhập sai 5 lần liên tiếp trong cùng một phiên, tính cả khi đổi mật khẩu và khi GV đổi Email THEN THE SYSTEM SHALL kết thúc phiên đó và chuyển về A01 với thông báo "Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng đăng nhập lại."
- AC-15.4: IF Mật khẩu mới trùng với mật khẩu hiện tại THEN THE SYSTEM SHALL từ chối và hiển thị "Mật khẩu mới phải khác mật khẩu hiện tại."
- AC-15.5: THE SYSTEM SHALL ghi nhận với mỗi HV mật khẩu hiện tại là do hệ thống tạo khi mật khẩu được tạo bởi Kích hoạt, Gửi lại hoặc Đặt lại mật khẩu, và là do HV tự đặt ngay khi HV đổi mật khẩu thành công (AC-15.1), để S10 (module 011) hiển thị gợi ý đổi mật khẩu; thông tin này không bao giờ chặn HV dùng bất kỳ chức năng nào.

### REQ-16: Cô lập workspace và phân quyền theo vai trò

<!-- Story: US-8 · Priority: P1 · Screens: tất cả (quy tắc áp dụng cho mọi module 002–011) -->

- AC-16.1: THE SYSTEM SHALL chỉ cho mỗi GV xem, tìm kiếm và thao tác trên các HV thuộc workspace của chính GV đó, và mọi danh sách, kết quả tìm kiếm hay ô chọn HV (kể cả ở T03 của module 003) chỉ chứa HV của workspace đó.
- AC-16.2: IF một GV yêu cầu xem hoặc thao tác trên một HV hay bất kỳ dữ liệu nào thuộc workspace khác, kể cả bằng cách mở đường dẫn trực tiếp THEN THE SYSTEM SHALL không thực hiện gì và hiển thị đúng phản hồi "Không tìm thấy nội dung bạn yêu cầu." như khi dữ liệu không tồn tại.
- AC-16.3: IF một HV mở một màn hình hoặc yêu cầu một chức năng dành cho GV (T01–T21) THEN THE SYSTEM SHALL không hiển thị dữ liệu nào, không thực hiện thao tác và chuyển HV về S01.
- AC-16.4: IF một GV mở một màn hình dành cho HV (S01–S12) THEN THE SYSTEM SHALL không hiển thị màn hình đó và chuyển GV về T01.
- AC-16.5: IF một HV yêu cầu xem hoặc thay đổi Email, Số điện thoại, Ghi chú, trạng thái tài khoản hay mật khẩu của một HV khác THEN THE SYSTEM SHALL không thực hiện gì và hiển thị "Không tìm thấy nội dung bạn yêu cầu." như khi dữ liệu không tồn tại.

> Xem hồ sơ bạn cùng lớp (S12) theo quy tắc riêng của module 011; S12 không bao giờ hiển thị các thông tin nêu ở AC-16.5.

### REQ-17: Nội dung thư tài khoản

<!-- Story: US-2, US-3, US-5, US-6 · Priority: P1 · Screens: thư gửi HV và GV (liên kết tới A01, A03); xem mẫu thư ở T11 -->

- AC-17.1: WHEN hệ thống gửi thư kích hoạt cho một HV THE SYSTEM SHALL dùng tiêu đề "[SAT] Tài khoản học tập của bạn đã sẵn sàng" và nội dung gồm: "Chào [Họ tên HV],", câu "Giáo viên [Họ tên GV] đã tạo cho bạn một tài khoản học tập trên SAT.", Email đăng nhập, Mật khẩu, nút "Đăng nhập" dẫn tới A01, câu "Bạn có thể đổi mật khẩu bất kỳ lúc nào trong mục Hồ sơ của tôi." và câu "Nếu bạn không biết giáo viên này, hãy bỏ qua thư này."
- AC-17.2: WHEN hệ thống gửi thư mật khẩu mới cho một HV THE SYSTEM SHALL dùng tiêu đề "[SAT] Mật khẩu mới cho tài khoản của bạn" và nội dung gồm: "Chào [Họ tên HV],", câu "Giáo viên [Họ tên GV] đã đặt lại mật khẩu tài khoản SAT của bạn. Mật khẩu cũ không còn dùng được.", Email đăng nhập, Mật khẩu mới, nút "Đăng nhập" dẫn tới A01 và câu "Nếu bạn không đề nghị đặt lại mật khẩu, hãy liên hệ giáo viên của bạn."
- AC-17.3: WHEN hệ thống gửi thư đặt lại mật khẩu cho một GV THE SYSTEM SHALL dùng tiêu đề "[SAT] Đặt lại mật khẩu của bạn" và nội dung gồm: "Chào [Họ tên GV],", câu "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản giáo viên SAT của bạn.", nút "Đặt lại mật khẩu" (liên kết của AC-6.2), câu "Liên kết có hiệu lực trong 60 phút và chỉ dùng được một lần." và câu "Nếu bạn không yêu cầu, hãy bỏ qua thư này. Mật khẩu của bạn sẽ không thay đổi."
- AC-17.4: THE SYSTEM SHALL gửi mọi thư của module này bằng tiếng Việt với tên người gửi "SAT" và dòng cuối "Đây là thư tự động, vui lòng không trả lời.", và không đưa vào thư Số điện thoại, Ghi chú của HV hay Email của GV.
- AC-17.5: THE SYSTEM SHALL gửi thư nhắc hạn nộp bài tập của module 003 — một thư cho mỗi HV mỗi lớp mỗi ngày hạn nộp (gộp mọi bộ bài tập của lớp đó hết hạn hôm đó mà HV chưa nộp), tiêu đề "[SAT] Hôm nay là hạn nộp bài tập – {tên lớp}", đúng một nút "Làm bài ngay", câu về việc vẫn nộp được sau hạn với bài nộp được ghi "Nộp muộn", còn nội dung chi tiết, người nhận, thời điểm và cách xử lý kết quả gửi theo REQ-24, REQ-25, REQ-26 của 003 — bằng tiếng Việt với tên người gửi "SAT" và dòng cuối "Đây là thư tự động, vui lòng không trả lời." như AC-17.4.
- AC-17.6: WHEN GV chọn "Xem mẫu email" ở T11 THE SYSTEM SHALL mở ngăn chỉ đọc "Mẫu email tài khoản" có nút "Đóng" và các lựa chọn "Thư kích hoạt", "Thư mật khẩu mới", "Thư nhắc hạn nộp", hiển thị người gửi "SAT", người nhận mẫu, tiêu đề và nội dung đúng như AC-17.1, AC-17.2 (kể cả dòng cuối của AC-17.4); khi GV chọn "Thư nhắc hạn nộp" thì ngăn mang tiêu đề "Mẫu email nhắc hạn nộp" và hiển thị mẫu thư nhắc theo AC-17.5 (nội dung theo 003 REQ-25) kèm dòng giải thích thư gửi lúc 08:00 ngày hạn tới HV đã kích hoạt chưa nộp bộ đó và nhiều bộ cùng hạn trong một lớp được gộp vào một thư; với thư kích hoạt và thư mật khẩu mới thì mật khẩu luôn được che (••••••••••) và ngăn kèm dòng "Mẫu xem trước. Mật khẩu ngẫu nhiên 10 ký tự chỉ có trong thư gửi học viên — giáo viên không xem được."

### REQ-18: Kết quả gửi thư, Gửi lại và giới hạn gửi

<!-- Story: US-3, US-4 · Priority: P1 · Screens: T11 -->

- AC-18.1: WHEN dịch vụ gửi thư nhận thư kích hoạt hoặc thư mật khẩu mới của một HV THE SYSTEM SHALL chuyển HV từ Đang gửi email sang Đã kích hoạt và, khi thư thuộc một thao tác trên riêng HV đó (không phải kích hoạt hay Gửi lại hàng loạt), hiển thị cho GV "Đã gửi email đăng nhập tới [Email]." (thư kích hoạt) hoặc "Đã gửi email mật khẩu mới tới [Email]." (thư mật khẩu mới).
- AC-18.2: IF dịch vụ gửi thư không nhận thư của một HV sau mọi lần thử trong vòng 10 phút, hoặc báo trong vòng 24 giờ sau khi nhận rằng địa chỉ không nhận được thư THEN THE SYSTEM SHALL chuyển HV sang Gửi email thất bại và hiển thị trên dòng HV ở T11 lý do tương ứng "Chưa gửi được thư. Vui lòng gửi lại." hoặc "Địa chỉ email không nhận được thư. Hãy kiểm tra lại email." cùng nút "Gửi lại".
- AC-18.3: WHILE workspace có ít nhất một HV ở trạng thái Gửi email thất bại THE SYSTEM SHALL hiển thị ở đầu T11 dòng "Có N học viên gửi email thất bại." kèm nút "Xem" áp dụng bộ lọc Gửi email thất bại.
- AC-18.4: WHEN GV chọn "Gửi lại" cho một HV Gửi email thất bại, hoặc cho nhiều HV đã chọn (sau hộp thoại xác nhận "Gửi lại email cho N học viên? Mỗi học viên nhận một mật khẩu ngẫu nhiên mới." với N chỉ tính HV Gửi email thất bại; số bị bỏ qua, giới hạn 500 và tóm tắt "Gửi lại xong: X đã gửi email, Y gửi email thất bại, Z bỏ qua." như AC-7.2 đến AC-7.5; khi không có HV Gửi email thất bại nào trong các HV đã chọn thì chỉ hiển thị "Không có học viên Gửi email thất bại nào trong các học viên đã chọn.") THE SYSTEM SHALL với mỗi HV tạo mật khẩu ngẫu nhiên mới, làm mật khẩu trước đó mất hiệu lực, gửi lại đúng loại thư đã thất bại (kích hoạt hoặc mật khẩu mới) tới Email hiện tại của HV và chuyển HV sang Đang gửi email.
- AC-18.5: IF đã có 3 thư chứa mật khẩu được gửi cho cùng một HV trong 60 phút gần nhất THEN THE SYSTEM SHALL không thực hiện Gửi lại hay Đặt lại mật khẩu cho HV đó, giữ nguyên mật khẩu và trạng thái hiện có, và hiển thị "Đã gửi 3 email cho học viên này trong 60 phút qua. Vui lòng thử lại sau."
- AC-18.6: IF một thao tác Kích hoạt, Gửi lại hoặc Đặt lại mật khẩu sẽ làm số thư chứa mật khẩu mà workspace gửi trong 24 giờ gần nhất vượt quá 1.000 THEN THE SYSTEM SHALL không thực hiện thao tác đó cho HV nào và hiển thị "Đã đạt giới hạn 1.000 email tài khoản trong 24 giờ. Bạn còn gửi được N email. Vui lòng chọn ít học viên hơn hoặc thử lại sau."

> REQ-19 (Content admin role — Tài khoản Quản trị nội dung) đã bị bỏ ngày 2026-10-22 (V15: chỉ còn hai vai trò GV và HV, việc quản lý nội dung tự học gom vào GV — module 016). Mã REQ-19 và AC-19.1 đến AC-19.8 không dùng lại — xem §9 "Removed (2026-10-22, V15)".

### REQ-20: Self-study access — Lối vào "Tự học" cho HV và "Kho tự học" cho GV

<!-- Story: US-10 · Priority: P1 · Screens: thanh tab dưới của HV, thanh bên của GV, S13 (module 012), S13–S20 (012–015), T23–T27 (016), A05 · Thêm 2026-10-22 (V14), sửa 2026-10-22 (V15) -->

- AC-20.1: THE SYSTEM SHALL hiển thị mục "Tự học" trên thanh tab dưới ở mọi màn hình HV có thanh tab, và WHEN HV chạm "Tự học" THE SYSTEM SHALL mở S13.
- AC-20.2: THE SYSTEM SHALL hiển thị trên thanh bên của GV mục "Kho tự học" và không hiển thị mục "Tự học", và WHEN GV chọn "Kho tự học" THE SYSTEM SHALL mở T23 (module 016).
- AC-20.3: WHILE người dùng đăng nhập bằng tài khoản HV đã được kích hoạt và không ở trạng thái Đã khóa THE SYSTEM SHALL cho mở S13–S20 và dùng mọi chức năng tự học với nội dung của Kho nội dung tự học thuộc workspace của HV đó (module 016), mà không yêu cầu là thành viên của lớp nào, bất kể trạng thái các lớp của HV.
- AC-20.4: IF một GV mở một màn hình S13–S20 hoặc yêu cầu một chức năng tự học dành cho người học, kể cả bằng đường dẫn trực tiếp THEN THE SYSTEM SHALL không hiển thị dữ liệu nào, không thực hiện thao tác và hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." (GV xem trước nội dung tự học từ T23–T27 của module 016).
- AC-20.5: THE SYSTEM SHALL coi dữ liệu tự học của mỗi HV là riêng tư: không hiển thị cho bất kỳ GV nào (kể cả GV của workspace đã tạo tài khoản HV đó — GV chỉ thấy số đếm tổng hợp ẩn danh của workspace theo module 016) hay HV khác, và không tính vào Điểm xếp hạng (008), Dashboard và theo dõi bài tập (009) hay hồ sơ học viên (011).
- AC-20.6: WHEN GV xóa một HV theo REQ-13 THE SYSTEM SHALL làm dữ liệu tự học của HV đó không còn truy cập được ngay lập tức và xóa vĩnh viễn dữ liệu đó trong vòng 24 giờ, và không coi dữ liệu tự học (kể cả kết quả thi thử của module 015) là Bài nộp khi xét điều kiện xóa của AC-13.2, AC-13.3.
- AC-20.7: WHILE một HV ở trạng thái Đã khóa THE SYSTEM SHALL giữ nguyên dữ liệu tự học của HV (HV không đăng nhập được theo AC-3.4), và WHEN HV được mở khóa THE SYSTEM SHALL cho HV tiếp tục dùng dữ liệu tự học đó.
- AC-20.8: WHEN một người chưa đăng nhập mở một màn hình S13–S20 THE SYSTEM SHALL chuyển đến A01 và, sau khi đăng nhập thành công, đưa HV (đã kích hoạt, không bị khóa) trở lại đúng màn hình đó, còn GV thì đưa về T01 (AC-5.5).
- AC-20.9: IF HV chọn "Đăng xuất" khi thiết bị còn kết quả ôn tập từ vựng chưa được lưu (012 AC-18.6) THEN THE SYSTEM SHALL thay hộp thoại xác nhận của AC-5.1 bằng cảnh báo "Còn {k} kết quả ôn tập chưa được lưu. Đăng xuất bây giờ sẽ mất các kết quả này." với nút "Ở lại" (mặc định, giữ phiên) và "Vẫn đăng xuất" (đăng xuất theo AC-5.1).
- AC-20.10: IF một HV mở một màn hình T23–T27 hoặc yêu cầu một chức năng quản lý Kho nội dung tự học (module 016), kể cả bằng đường dẫn trực tiếp THEN THE SYSTEM SHALL không hiển thị dữ liệu nào, không thực hiện thao tác và chuyển HV về S01 như AC-16.3.

## 6. Non-Functional Requirements

- NFR-1: Performance: p95 thời gian từ lúc gửi đăng nhập ở A01 đến khi trang đích (T01 hoặc S01) bắt đầu hiển thị ≤ 2 giây khi có 20 lượt đăng nhập mỗi giây.
- NFR-2: Performance: p95 thời gian hiển thị kết quả của T11 sau khi mở, tìm kiếm, lọc hoặc chuyển trang ≤ 1 giây với workspace có 2.000 HV.
- NFR-3: Performance: với tệp 500 dòng, báo cáo kiểm tra (AC-9.4) hiển thị trong ≤ 10 giây và việc nhập (AC-10.1) hoàn tất trong ≤ 30 giây ở p95.
- NFR-4: Security: 0 mật khẩu được lưu ở dạng có thể đọc lại hay khôi phục (chỉ lưu dạng biến đổi một chiều); 0 mật khẩu hoặc liên kết đặt lại xuất hiện trong nhật ký, màn hình hay tệp tải xuống; 0 bản sao đọc được của thư chứa mật khẩu được giữ lại sau khi chuyển cho dịch vụ gửi thư; và 100% trang của module chỉ truy cập được qua kết nối mã hóa.
- NFR-5: Security: từ cùng một địa chỉ mạng, tối đa 10 lượt đăng ký GV mỗi giờ và tối đa 50 lần đăng nhập sai mỗi 15 phút; vượt ngưỡng thì các yêu cầu tương ứng bị từ chối trong 15 phút với thông báo "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau."
- NFR-6: Observability: 100% sự kiện đăng nhập thành công/thất bại, tạm khóa, yêu cầu và hoàn tất đặt lại mật khẩu GV, thêm/import/sửa/kích hoạt (từng HV và hàng loạt)/Gửi lại/đặt lại mật khẩu/khóa/mở khóa/xóa HV, kết quả gửi từng thư (đã nhận hoặc thất bại kèm lý do), lần bị chặn do giới hạn gửi (AC-18.5, AC-18.6) và truy cập bị từ chối theo AC-16.2–AC-16.5 được ghi nhật ký kèm thời điểm, tài khoản thực hiện, đối tượng và kết quả, không chứa mật khẩu; nhật ký được lưu ít nhất 90 ngày.
- NFR-7: Reliability: ≥ 95% thư đặt lại mật khẩu GV và thư tài khoản HV được dịch vụ gửi thư nhận trong ≤ 2 phút kể từ thao tác, đo theo tháng; với một lần kích hoạt hàng loạt 500 HV, 100% HV rời trạng thái Đang gửi email (sang Đã kích hoạt hoặc Gửi email thất bại) trong ≤ 15 phút.
- NFR-8: Usability: A01, A02, A03, A05 và mọi thư của REQ-17 dùng/đọc đầy đủ ở chiều rộng 360–430 px không cần cuộn ngang; T11, T12, T17 dùng đầy đủ ở chiều rộng ≥ 1024 px; 100% trường nhập có nhãn đọc được bằng trình đọc màn hình, mọi thao tác thực hiện được bằng bàn phím và độ tương phản chữ đạt tối thiểu 4.5:1 (WCAG 2.1 AA).

## 7. Key Entities

| Thực thể | Ý nghĩa | Thuộc tính nghiệp vụ chính | Quan hệ |
|----------|---------|----------------------------|---------|
| Tài khoản giáo viên | Danh tính của một GV | Họ tên, Email (định danh đăng nhập, duy nhất — Q-1), mật khẩu (không đọc lại được), ngày tạo | Sở hữu đúng 1 Workspace; có 0..n Phiên; có 0..n Liên kết đặt lại mật khẩu |
| Workspace | Toàn bộ dữ liệu của một GV (D1) | Chủ sở hữu | 1–1 với Tài khoản giáo viên; chứa HV, Giáo trình (002), Lớp (003), Kho nội dung tự học (016, nạp Bộ nội dung mẫu HSK khi tạo workspace) và mọi dữ liệu phát sinh |
| Học viên | Một HV do GV thêm vào workspace; có tài khoản đăng nhập từ khi được kích hoạt | Họ tên, Email (định danh đăng nhập, duy nhất — Q-1), Số điện thoại (tùy chọn), Ghi chú (tùy chọn, chỉ GV thấy), trạng thái (Chưa kích hoạt / Đang gửi email / Đã kích hoạt / Gửi email thất bại / Đã khóa), lý do gửi thất bại, trạng thái trước khi khóa, mật khẩu (chỉ có sau khi kích hoạt, không đọc lại được), nguồn mật khẩu hiện tại (do hệ thống tạo / do HV tự đặt — AC-15.5), ngày thêm, thời điểm kích hoạt, thời điểm đăng nhập gần nhất | Thuộc đúng 1 Workspace (A3); tham gia 0..n Lớp (003, kể cả khi Chưa kích hoạt); có 0..n Bài nộp (005); có hồ sơ (011); nhận 0..n Thư tài khoản |
| Thư tài khoản | Một thư hệ thống gửi cho HV hoặc GV | Loại (Kích hoạt / Mật khẩu mới / Đặt lại mật khẩu GV), người nhận, thời điểm, kết quả (Đang gửi / Đã nhận / Thất bại + lý do); không lưu nội dung chứa mật khẩu | Thuộc 1 Học viên hoặc 1 Tài khoản giáo viên; dùng để tính giới hạn gửi (AC-6.4, AC-18.5, AC-18.6) |
| Phiên đăng nhập | Một lần đăng nhập trên một thiết bị/trình duyệt | Thời điểm bắt đầu, thời điểm thao tác gần nhất | Thuộc 1 tài khoản; kết thúc khi đăng xuất, hết hạn, đổi/đặt lại mật khẩu, bị khóa hoặc bị xóa |
| Liên kết đặt lại mật khẩu | Liên kết gửi qua thư cho GV quên mật khẩu | Thời điểm tạo, hiệu lực 60 phút, trạng thái (Còn hiệu lực / Đã dùng / Hết hạn / Bị thay thế) | Thuộc 1 Tài khoản giáo viên |
| Bộ đếm đăng nhập sai | Theo dõi lần đăng nhập sai theo Email (kể cả Email không tồn tại) | Số lần sai liên tiếp, thời điểm hết tạm khóa | Gắn với 1 Email |
| Lượt import | Một lần GV tải tệp Excel lên T12 | Tệp, báo cáo kiểm tra (dòng hợp lệ / dòng lỗi + lý do), kết quả (danh sách HV đã thêm) | Thuộc 1 Workspace; thêm 0..500 Học viên ở trạng thái Chưa kích hoạt |
| Dữ liệu tự học (từ 2026-10-22, sửa theo V15) | Dữ liệu học riêng của một HV ở khu Tự học (012–015) | Do 012–015 định nghĩa | Thuộc đúng 1 HV; tham chiếu nội dung Kho tự học của workspace của HV (016); riêng tư (AC-20.5); xóa trong vòng 24 giờ khi HV bị xóa (AC-20.6); không phải Bài nộp |

## 8. Edge Cases & Error Handling

| Tình huống | Hành vi mong đợi | AC |
|------------|------------------|----|
| GV bấm lưu hai lần liên tiếp ở T12 | Chỉ một HV được thêm; lần gửi thứ hai không tạo bản trùng | AC-8.1, AC-8.4 |
| Email có chữ hoa hoặc khoảng trắng đầu/cuối | Được chuẩn hóa; " An@Mail.com " và "an@mail.com" là cùng một Email | AC-2.2 |
| Email có ký tự tiếng Việt có dấu hoặc ký tự không phải ASCII | Từ chối: "Email không đúng định dạng." | AC-1.3, AC-8.5 |
| Họ tên có dấu tiếng Việt hoặc chữ Hán | Chấp nhận và hiển thị đúng ở mọi màn hình và trong thư (A5) | AC-8.5, AC-11.1, AC-17.1 |
| Tệp Excel có cột thừa hoặc thứ tự cột khác mẫu | Cột được nhận diện theo tên tiêu đề (không phân biệt hoa thường, bỏ khoảng trắng đầu/cuối); cột thừa bị bỏ qua | AC-9.3, AC-9.4 |
| Tệp Excel có nhiều trang tính | Chỉ đọc trang tính đầu tiên | AC-9.1, AC-9.3 |
| Ô Số điện thoại bị Excel đổi thành số (mất số 0 đầu) | Tệp mẫu định dạng cột này là văn bản; hệ thống đọc giá trị như đang hiển thị trong ô; GV kiểm tra trên báo cáo | AC-9.1, AC-9.4 |
| Ô dùng công thức | Đọc giá trị kết quả hiển thị của ô | AC-9.4 |
| Tệp hỏng, có mật khẩu bảo vệ, hoặc đổi đuôi từ định dạng khác | Từ chối cả tệp: "Chỉ chấp nhận tệp Excel (.xlsx) tối đa 2 MB." | AC-9.2 |
| Hai lần import (hai tab) có Email trùng nhau, xác nhận gần như cùng lúc | Lần xác nhận sau không thêm HV nào và hiển thị báo cáo cập nhật với các dòng trùng bị đánh dấu lỗi | AC-10.5 |
| Mất kết nối ngay sau khi hệ thống đã thêm xong HV từ import | Các HV đã tồn tại ở trạng thái Chưa kích hoạt và hiện ở T11; tải lại tệp sẽ báo "Email này đã được sử dụng." cho các dòng đó | AC-9.4, AC-11.1 |
| GV gõ sai Email của HV thành một địa chỉ không tồn tại | Thư bị báo không nhận được → Gửi email thất bại kèm lý do; GV sửa Email rồi bấm "Gửi lại" → mật khẩu mới được gửi tới Email đúng | AC-18.2, AC-11.6, AC-18.4 |
| GV gõ sai Email của HV thành địa chỉ có thật của người khác | Người lạ nhận thư (thư có câu "Nếu bạn không biết giáo viên này, hãy bỏ qua thư này."); khi GV sửa Email, Email cũ không còn đăng nhập được; GV bấm "Đặt lại mật khẩu" để gửi mật khẩu mới tới Email đúng | AC-17.1, AC-11.6, AC-12.1 |
| HV báo không thấy thư dù trạng thái là Đã kích hoạt (thư vào mục thư rác) | GV hướng dẫn HV tìm trong thư rác, hoặc dùng "Đặt lại mật khẩu" (tối đa 3 thư/HV/60 phút) | AC-12.1, AC-18.5 |
| Thư bị báo không nhận được sau khi HV đã ở trạng thái Đã kích hoạt (trong 24 giờ) | HV chuyển sang Gửi email thất bại; báo cáo đến sau 24 giờ không làm đổi trạng thái | AC-18.2 |
| Dịch vụ gửi thư ngừng hoạt động trong lúc kích hoạt hàng loạt | Sau 10 phút các HV chưa gửi được chuyển sang Gửi email thất bại; GV chọn họ (bộ lọc Gửi email thất bại) và "Gửi lại" hàng loạt | AC-18.2, AC-18.3, AC-18.4 |
| GV bấm "Kích hoạt" cùng một HV ở hai tab | Chỉ một tài khoản, một mật khẩu và một thư được tạo; lần sau bị bỏ qua | AC-7.5 |
| Chọn hàng loạt có lẫn HV đã kích hoạt, đã khóa hoặc đang gửi email | Hộp thoại nêu số sẽ kích hoạt và số bị bỏ qua; chỉ HV Chưa kích hoạt được kích hoạt | AC-7.2, AC-7.3 |
| Kích hoạt hàng loạt khi workspace gần chạm giới hạn 1.000 thư/24 giờ | Cả lần bị từ chối, nêu số thư còn gửi được; GV chọn ít HV hơn | AC-18.6 |
| GV sửa HV đang ở trạng thái Đang gửi email | Sửa được Họ tên, Số điện thoại, Ghi chú; không đổi được Email cho tới khi có kết quả gửi | AC-12.6 |
| Trạng thái HV đã đổi ở tab khác trước khi GV chọn một thao tác | Hệ thống kiểm tra lại khi xác nhận; thao tác không còn hợp lệ thì không thực hiện, danh sách được làm mới theo trạng thái hiện tại | AC-12.6, AC-7.5 |
| HV Chưa kích hoạt thử đăng nhập hoặc dùng "Quên mật khẩu?" | Đăng nhập nhận thông báo chung; A03 hiển thị thông báo chung, không gửi thư | AC-3.3, AC-6.3 |
| HV Chưa kích hoạt được thêm vào Lớp | Được phép; HV có trong lớp nhưng chưa đăng nhập được cho tới khi được kích hoạt; cách hiển thị trong lớp do 003 quyết định | AC-7.6 |
| GV xóa HV trong lúc thư kích hoạt đang được gửi | HV bị xóa; thư có thể vẫn tới nhưng đăng nhập nhận "Email hoặc mật khẩu không đúng." | AC-13.2, AC-3.3 |
| GV khóa HV đang Gửi email thất bại rồi mở khóa | HV trở về Gửi email thất bại, vẫn có nút "Gửi lại" | AC-12.2, AC-12.4 |
| GV đặt lại mật khẩu khi HV đang đăng nhập | Mọi phiên của HV kết thúc; HV đăng nhập lại bằng mật khẩu mới trong thư | AC-12.1, AC-5.4 |
| HV đang làm bài tập thì bị khóa hoặc bị đặt lại mật khẩu | Thao tác kế tiếp bị từ chối như AC-12.3 / AC-5.4; cách xử lý lượt làm đang dở thuộc module 005 | AC-12.3, AC-5.4 |
| HV nộp bài trong lúc GV đang mở hộp thoại xóa HV đó | Khi GV xác nhận, hệ thống kiểm tra lại và từ chối xóa | AC-13.3 |
| GV xóa HV ở tab 1 rồi sửa HV đó ở tab 2 | Tab 2 nhận "Không tìm thấy nội dung bạn yêu cầu." | AC-16.2 |
| GV sửa cùng một HV ở hai tab | Lần lưu sau cùng có hiệu lực | AC-11.6 |
| GV đổi Email của HV khi HV đang đăng nhập | Phiên hiện tại của HV giữ nguyên; lần đăng nhập sau HV dùng Email mới; không có thư nào được gửi tự động | AC-11.6 |
| Kẻ xấu cố tình nhập sai để tạm khóa Email của GV | GV chờ 15 phút hoặc đặt lại mật khẩu qua A03 để gỡ tạm khóa ngay | AC-4.1, AC-4.4 |
| Cả lớp đăng nhập cùng lúc từ mạng của trường (chung một địa chỉ mạng) | Chỉ lần đăng nhập sai bị tính vào ngưỡng chung (50 lần/15 phút); đăng nhập đúng không bị ảnh hưởng | AC-4.1, NFR-5 |
| GV mở liên kết đặt lại trong khi đang đăng nhập (trên thiết bị khác hoặc cùng thiết bị) | Liên kết vẫn dùng được; sau khi đặt lại, mọi phiên của GV (kể cả phiên hiện tại) kết thúc | AC-6.5 |
| GV yêu cầu đặt lại nhiều lần | Chỉ liên kết mới nhất còn hiệu lực | AC-6.2, AC-6.6 |
| Dịch vụ gửi thư lỗi khi GV yêu cầu đặt lại | Màn hình vẫn hiển thị thông báo chung (không tiết lộ tài khoản); sự cố được ghi nhật ký; GV có thể yêu cầu lại | AC-6.1, NFR-6 |
| GV gõ sai Email khi đăng ký rồi quên mật khẩu | Không khôi phục được trong MVP (không có quản trị viên cấp trên); giảm thiểu: GV đang đăng nhập có thể sửa Email ở T17 | AC-14.2 |
| HV không có địa chỉ email riêng | GV dùng một Email khác (ví dụ của phụ huynh); thư chứa mật khẩu sẽ tới hộp thư đó; với Email duy nhất toàn hệ thống (Q-1), hai HV không thể dùng chung một Email | AC-8.4, AC-17.1 |
| Đóng trình duyệt mà không đăng xuất trên máy dùng chung | Phiên còn tới khi hết hạn (8 giờ GV, 30 ngày HV); người dùng cần đăng xuất | AC-5.1, AC-5.2, AC-5.3 |
| Thời điểm đăng nhập gần nhất | Hiển thị theo giờ Việt Nam (UTC+7), định dạng dd/MM/yyyy HH:mm | AC-11.1 |
| GV nhập sai mật khẩu hiện tại liên tục ở T17 (kể cả khi đổi Email) | Lần 1–4: "Mật khẩu hiện tại không đúng."; lần 5 liên tiếp trong phiên: phiên kết thúc, về A01 | AC-14.3, AC-15.2, AC-15.3 |
| GV lọc "Gửi email thất bại" khi đang có từ khóa tìm kiếm | Kết quả thỏa cả hai điều kiện; không có kết quả → "Không tìm thấy học viên phù hợp." + "Xóa bộ lọc" | AC-11.4, AC-11.5 |
| HV chưa thuộc lớp nào, hoặc mọi lớp đã kết thúc | Vẫn mở được "Tự học" và mọi chức năng tự học với nội dung kho của workspace mình | AC-20.3 |
| GV mở S01 (màn hình HV) và S13 (Tự học) | S01 → chuyển về T01 (AC-16.4); S13 → A05 "Không tìm thấy nội dung bạn yêu cầu." | AC-16.4, AC-20.4 |
| GV muốn xem nội dung tự học như HV sẽ thấy | Dùng "Xem trước" / "Nghe thử" / "Xem thử" trong T23–T27 (016); không vào được S13–S20 | AC-20.4 |
| HV mở đường dẫn T23 (Kho tự học) | Chuyển về S01, không hiển thị dữ liệu | AC-20.10, AC-16.3 |
| GV mới đăng ký | Workspace mới có Kho tự học được nạp Bộ nội dung mẫu HSK (016); việc nạp không làm chậm việc vào T01 | AC-1.1 |
| GV chưa đăng nhập mở đường dẫn S13 rồi đăng nhập | Về T01 (không phải S13) | AC-20.8, AC-5.5 |
| HV có kết quả thi thử tự học nhưng chưa có Bài nộp nào | GV vẫn xóa được HV; dữ liệu tự học bị xóa cùng | AC-20.6 |
| HV bị khóa rồi được mở khóa | Dữ liệu tự học còn nguyên, dùng tiếp | AC-20.7 |

## 9. Out of Scope

- HV tự đăng ký tài khoản (D4).
- Ô đồng ý Điều khoản sử dụng / Chính sách bảo vệ dữ liệu cá nhân khi GV đăng ký, và các trang nội dung tương ứng (V4-5).
- Bắt buộc HV đổi mật khẩu ở lần đăng nhập đầu; màn hình A04 (bỏ ở v4).
- Đăng nhập bằng mạng xã hội/SSO, xác thực hai lớp, đăng nhập bằng số điện thoại/mã OTP, tùy chọn "Ghi nhớ đăng nhập".
- Xác minh Email khi GV đăng ký (xem Clarifications Log; có thể xem lại sau MVP).
- HV tự đặt lại mật khẩu qua email (HV quên mật khẩu thì nhờ GV "Đặt lại mật khẩu"); gửi thông tin đăng nhập qua SMS/Zalo.
- GV xem, đặt tay hoặc tải xuống mật khẩu của HV; danh sách mật khẩu sau import.
- GV tùy chỉnh nội dung thư; theo dõi HV đã mở thư hay chưa; tự động nhắc HV chưa đăng nhập; mật khẩu ngẫu nhiên tự hết hạn.
- Tổ chức/trung tâm, nhiều GV dùng chung workspace, super-admin; khóa hay xóa tài khoản GV; GV tự xóa tài khoản/workspace; chuyển HV sang workspace khác.
- Thao tác hàng loạt trên T11 ngoài Kích hoạt và Gửi lại (khóa, xóa, đặt lại mật khẩu nhiều HV cùng lúc); sắp xếp T11 theo cột khác ngoài mặc định.
- Xuất danh sách HV ra tệp.
- Import định dạng .xls hoặc .csv; tải báo cáo lỗi import về máy.
- Hồ sơ HV: ảnh đại diện, ảnh bìa, thông tin cá nhân, lớp, tiến độ, xếp hạng, xem hồ sơ bạn cùng lớp — S10, S12 (→ 011); việc GV gỡ ảnh không phù hợp (→ 011).
- Thêm/gỡ HV khỏi Lớp (→ 003); hồ sơ học tập của HV — T15 (→ 009).
- Gói trả phí, giới hạn theo gói (A1); kiểm tra mật khẩu đã bị lộ trong các vụ rò rỉ; đồng hồ đo độ mạnh mật khẩu.
- Ngôn ngữ giao diện và ngôn ngữ thư khác tiếng Việt (A5).
- (Từ 2026-10-22) Tự đăng ký công khai để dùng khu Tự học (V14 vẫn không có); GV dùng khu Tự học với tư cách người học (V15).
- (Từ 2026-10-22) Mọi vai trò khác ngoài GV và HV — quản trị nội dung, quản trị hệ thống, đơn vị vận hành có tài khoản trong SAT (V15).
- (Từ 2026-10-22) Nội dung, chức năng và dữ liệu của khu Tự học S13–S20 (→ 012–015) và của Kho nội dung tự học T23–T27 (→ 016).

### Removed (2026-10-22, V15)

Mã bị bỏ không dùng lại:

- Mã US-9 — câu chuyện "Là quản trị nội dung, tôi muốn đăng nhập bằng tài khoản do đơn vị vận hành cấp và vào thẳng khu quản trị kho…".
- Mã REQ-19 — "Content admin role — Tài khoản Quản trị nội dung và phân quyền", gồm:
  - Mã AC-19.1 — không có giao diện tạo / vô hiệu hóa tài khoản QTND; QTND không thuộc workspace; Email QTND không trùng tài khoản GV, HV.
  - Mã AC-19.2 — đơn vị vận hành tạo QTND, thư "[SAT] Tài khoản quản trị nội dung của bạn đã sẵn sàng" chứa mật khẩu ngẫu nhiên.
  - Mã AC-19.3 — QTND đăng nhập ở A01 → Q01; A01, A02, A03 chuyển về Q01 khi QTND có phiên.
  - Mã AC-19.4 — QTND bị vô hiệu hóa không đăng nhập được ("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị hệ thống.").
  - Mã AC-19.5 — vô hiệu hóa QTND kết thúc mọi phiên của QTND.
  - Mã AC-19.6 — quy tắc mật khẩu, tạm khóa, hết hạn phiên, đổi mật khẩu, đăng xuất của QTND; A03 không gửi thư cho QTND.
  - Mã AC-19.7 — QTND mở T01–T21 hoặc S01–S20 → Q01.
  - Mã AC-19.8 — GV hoặc HV mở Q01–Q05 → A05.
- Hành vi bỏ khỏi REQ-20: mục "Tự học" trên thanh bên của GV và việc GV mở S13–S20 như người học (AC-20.2, AC-20.3, AC-20.4 cũ); quyền dùng khu Tự học "bất kể workspace" với một kho dùng chung toàn hệ thống (AC-20.3 cũ); QTND trong quy tắc riêng tư và trong định tuyến sau đăng nhập (AC-20.5, AC-20.8 cũ).
- Các màn hình Q01–Q05 (thay bằng T23–T27 của module 016, do GV dùng).

## 10. Assumptions & Dependencies

**Giả định** (chi tiết và lý do ở §12):

- Mỗi HV thuộc đúng một workspace (A3); Email tạm duy nhất trên toàn hệ thống, kể cả với HV Chưa kích hoạt (Q-1).
- Không xác minh Email khi GV đăng ký; rủi ro được giảm nhờ A03 và việc sửa Email ở T17.
- Hệ thống gửi thư cho HV (thay đổi A6 từ v4): thư kích hoạt và thư mật khẩu mới. GV không bao giờ thấy mật khẩu; vì mật khẩu không lưu ở dạng đọc lại được, mỗi lần "Gửi lại" tạo một mật khẩu mới.
- "Gửi email thất bại" = dịch vụ gửi thư không nhận thư sau 10 phút thử, hoặc báo địa chỉ không nhận được thư trong 24 giờ; dịch vụ gửi thư được chọn phải báo được hai tình huống này.
- Giới hạn gửi: tối đa 3 thư chứa mật khẩu/HV/60 phút; 1.000 thư chứa mật khẩu/workspace/24 giờ; 500 HV mỗi lần kích hoạt hoặc Gửi lại hàng loạt.
- HV Chưa kích hoạt được thêm vào Lớp (AC-7.6).
- Không giới hạn số HV mỗi workspace trong MVP; mục tiêu hiệu năng tính cho 2.000 HV/workspace (NFR-2).
- Tài khoản GV không thể bị khóa/xóa bởi ai trong MVP (không có super-admin — D1); chỉ có tạm khóa đăng nhập tự động (REQ-4).
- (Từ 2026-10-22, V15) Chỉ có hai vai trò GV và HV; không có tài khoản quản trị nào ngoài GV (vai trò QTND của V14 đã bỏ).
- (Từ 2026-10-22, V15) Mục "Tự học" mở S13 chỉ cho HV đã kích hoạt, không bị khóa, với nội dung Kho tự học của workspace của HV; GV có mục "Kho tự học" → T23 và không vào được S13–S20 (A05); dữ liệu tự học riêng tư, xóa trong vòng 24 giờ khi HV bị xóa, không phải Bài nộp (REQ-20).

**Phụ thuộc:**

- **003 Lớp học:** dùng lại T12 ở bước 2 của T03 (và từ T04) để thêm HV mới rồi thêm vào lớp; nhận HV ở mọi trạng thái, kể cả Chưa kích hoạt (AC-7.6), và quyết định nhãn hiển thị trong danh sách HV của lớp (ví dụ "Chưa kích hoạt", "Đã khóa"); cung cấp số Lớp HV đang tham gia cho T11 và hộp thoại xóa (AC-11.1, AC-13.1); nhận sự kiện "HV bị khóa / bị xóa" (HV bị xóa được gỡ khỏi mọi Lớp — AC-13.2).
- **005 Bài tập:** cung cấp sự thật nghiệp vụ "HV đã có Bài nộp" cho quy tắc xóa (AC-13.2, AC-13.3); quyết định cách xử lý lượt làm đang dở khi phiên của HV bị kết thúc.
- **008 Điểm & Xếp hạng, 009 Dashboard:** quyết định cách hiển thị HV Đã khóa và HV Chưa kích hoạt trên bảng xếp hạng, dashboard và T15 (dữ liệu của HV Đã khóa được giữ nguyên — AC-12.2).
- **011 Hồ sơ học viên:** sở hữu S10 "Hồ sơ của tôi" và S12; dùng quy tắc đổi mật khẩu của REQ-15 và AC-2.3/AC-2.4 ở S10; dùng thông tin "HV còn dùng mật khẩu do hệ thống tạo" (AC-15.5) cho gợi ý đổi mật khẩu (011 AC-4.5); cung cấp ảnh đại diện HV hiển thị ở T11 (AC-11.1); quyết định việc GV gỡ ảnh không phù hợp. Thư kích hoạt nhắc tới mục "Hồ sơ của tôi" (AC-17.1).
- **Mọi module 002–011:** áp dụng quy tắc cô lập và phân quyền của REQ-16 cho dữ liệu của mình; màn hình A05 "Không tìm thấy nội dung bạn yêu cầu." dùng chung.
- **012 Từ vựng thông minh (từ 2026-10-22):** sở hữu S13 "Tự học" — đích của mục "Tự học" của HV (AC-20.1); 012–015 áp dụng quyền dùng (chỉ HV, nội dung kho của workspace của HV — AC-20.3), việc chặn GV (AC-20.4) và quy tắc riêng tư của REQ-20 cho S13–S20 và dữ liệu tự học, và xóa dữ liệu tự học khi HV bị xóa (AC-20.6).
- **016 Kho nội dung tự học (từ 2026-10-22, V15):** sở hữu T23–T27 — đích của mục "Kho tự học" của GV (AC-20.2); nạp Bộ nội dung mẫu HSK cho workspace mới tạo ở AC-1.1; áp dụng quy tắc cô lập workspace (REQ-16) cho mục kho; HV mở T23–T27 → S01 (AC-20.10).
- **003, 011 (từ 2026-10-22):** thanh tab dưới của HV có mục "Tự học" (AC-20.1); **009:** thanh bên của GV có mục "Kho tự học" → T23, không có mục "Tự học" (AC-20.2).
- **Dịch vụ gửi thư bên ngoài:** gửi thư đặt lại mật khẩu GV và thư tài khoản HV (REQ-17, NFR-7); báo kết quả nhận thư và địa chỉ không nhận được thư (AC-18.1, AC-18.2).

## 11. Open Questions

- Q-1: [NEEDS CLARIFICATION: Email phải duy nhất trên toàn hệ thống (một người chỉ có một tài khoản, kể cả khi học với hai GV khác nhau) hay chỉ cần duy nhất trong từng workspace (khi đó A01 phải có thêm cách chọn workspace khi đăng nhập)?] — Ảnh hưởng: AC-1.2, AC-8.4, AC-9.4, AC-11.6, AC-14.2, AC-14.3, màn hình A01, thư kích hoạt. Từ v4, Email còn là nơi nhận mật khẩu, nên câu hỏi quan trọng hơn: duy nhất toàn hệ thống thì đăng nhập đơn giản, nhưng một HV học hai GV (hoặc hai anh chị em dùng chung Email phụ huynh) phải dùng Email khác nhau, và thông báo "Email này đã được sử dụng." cho GV B biết Email đó tồn tại ở đâu đó (không lộ workspace). Duy nhất theo workspace: linh hoạt hơn cho HV, nhưng A01 cần thêm mã/đường dẫn workspace và quên mật khẩu GV phải xử lý trùng Email. **Đề xuất:** duy nhất toàn hệ thống (đang áp dụng tạm).

## 12. Clarifications Log

### Session 2026-10-18

- Q: Ai quản trị dữ liệu và có cấp quản trị nào trên GV không? → A: Mỗi GV là quản trị viên duy nhất của workspace riêng, không có tổ chức/super-admin; GV không bao giờ thấy dữ liệu của GV khác (D1) — cơ sở cho REQ-16 và cho việc GV phải tự khôi phục mật khẩu (REQ-6). (source: stakeholder)
- [thay thế 2026-10-20 v4] Q: Tài khoản HV được tạo thế nào? → A: GV tạo từng HV hoặc import Excel; HV đăng nhập bằng email + mật khẩu và bắt buộc đổi mật khẩu ở lần đầu; không có HV tự đăng ký (D4). (source: stakeholder) — Phần "bắt buộc đổi mật khẩu ở lần đầu" và cách cấp mật khẩu được thay bằng V4-6 (xem Session 2026-10-20 v4); phần "không có HV tự đăng ký" vẫn giữ.
- Q: GV có tài khoản bằng cách nào? → A: Tự đăng ký bằng email + mật khẩu, miễn phí, không cần duyệt (A1). (source: assumption — giả định chung A1 của bản mô tả module; module 001 sở hữu)
- Q: Một HV thuộc bao nhiêu workspace? → A: Đúng một workspace; có thể ở nhiều Lớp của GV đó (A3). (source: assumption — giả định chung A3; phạm vi duy nhất của Email vẫn mở ở Q-1)
- Q: Thiết bị sử dụng? → A: GV dùng web trên máy tính (≥ 1280 px, dùng được ≥ 1024 px); HV dùng web ưu tiên điện thoại (360–430 px) — áp dụng ở NFR-8; A01–A03 cũng phải dùng được trên điện thoại vì GV thường mở thư đặt lại trên điện thoại (A4). (source: assumption — giả định chung A4)
- Q: Ngôn ngữ giao diện? → A: Tiếng Việt; Họ tên có thể chứa dấu tiếng Việt hoặc chữ Hán và phải hiển thị đúng (A5). (source: assumption — giả định chung A5)
- [thay thế 2026-10-20 v4] Q: Hệ thống có gửi thư nào? → A: Chỉ thư đặt lại mật khẩu cho GV; không gửi thư cho HV (A6). (source: assumption — giả định chung A6) — Thay bằng V4-6: hệ thống gửi thư kích hoạt và thư mật khẩu mới cho HV (REQ-17, REQ-18).
- Q: Múi giờ hiển thị? → A: Giờ Việt Nam UTC+7 (A7), dùng cho thời điểm đăng nhập gần nhất ở T11. (source: assumption — giả định chung A7)
- Q: Có xác minh Email khi GV đăng ký không? → A: Không trong MVP. (source: assumption — tăng phạm vi; rủi ro chiếm Email được giảm vì chủ thật của Email có thể lấy lại tài khoản qua A03, và GV gõ nhầm Email vẫn đăng nhập được để sửa ở T17)
- [thay thế 2026-10-20 v4] Q: Mật khẩu tạm do hệ thống tạo hay GV tự gõ? → A: Hệ thống tạo (10 ký tự, AC-2.5), hiển thị cho GV đúng một lần, không thể xem lại; mất thì GV dùng "Đặt lại mật khẩu". (source: assumption) — Vẫn do hệ thống tạo ngẫu nhiên 10 ký tự, nhưng chỉ gửi qua thư cho HV; GV không bao giờ thấy (V4-6).
- [thay thế 2026-10-20 v4] Q: Mật khẩu tạm có hết hạn không? → A: Không; chỉ mất hiệu lực khi HV đổi mật khẩu hoặc GV đặt lại lần nữa. (source: assumption) — Nay là "mật khẩu ngẫu nhiên", không còn là mật khẩu tạm phải đổi; vẫn không hết hạn, mất hiệu lực khi HV đổi mật khẩu, GV Đặt lại mật khẩu hoặc Gửi lại.
- Q: Chính sách mật khẩu? → A: 8–64 ký tự, ít nhất một chữ cái và một chữ số, áp dụng như nhau cho GV và HV. (source: assumption — đủ chặn mật khẩu quá yếu mà ít gây khó cho HV dùng điện thoại; độ dài tối thiểu 8 theo thông lệ phổ biến)
- Q: Tạm khóa khi đăng nhập sai? → A: 5 lần sai liên tiếp trong 15 phút → tạm khóa 15 phút theo Email, áp dụng cả cho Email không tồn tại; cộng thêm ngưỡng theo địa chỉ mạng ở NFR-5. (source: assumption — chống dò mật khẩu mà không khóa vĩnh viễn; tránh lộ Email tồn tại)
- Q: Thời gian hết hạn phiên? → A: GV 8 giờ không thao tác; HV 30 ngày không thao tác; cho phép nhiều phiên đồng thời. (source: assumption — GV giữ dữ liệu cá nhân của nhiều HV nên phiên ngắn hơn; HV chủ yếu dùng điện thoại cá nhân và cần vào nhanh)
- Q: Liên kết đặt lại mật khẩu? → A: Dùng một lần, hiệu lực 60 phút, liên kết mới vô hiệu liên kết cũ, tối đa 3 thư/tài khoản/60 phút. (source: assumption — thông lệ an toàn phổ biến, đủ thời gian để GV mở thư)
- Q: Import Excel nhập tất cả hay từng phần? → A: Hai bước: kiểm tra toàn bộ tệp và hiển thị báo cáo trước (chưa thêm gì), rồi GV xác nhận nhập đúng các dòng hợp lệ; một lần xác nhận là trọn gói (hoặc thêm tất cả dòng hợp lệ, hoặc không thêm gì). Chỉ nhận .xlsx ≤ 2 MB, ≤ 500 dòng; mọi dòng trùng Email trong tệp đều bị đánh dấu lỗi. (source: assumption — GV luôn thấy trước kết quả, không có trạng thái nhập dở dang, và không phải sửa cả tệp chỉ vì vài dòng lỗi; 500 dòng đủ cho nhiều lớp mà vẫn kiểm tra nhanh)
- Q: Có được xóa HV đã học không? → A: Chỉ xóa vĩnh viễn được HV chưa có Bài nộp nào (xóa cả dữ liệu học tập và gỡ khỏi Lớp); HV đã có Bài nộp chỉ có thể khóa. (source: assumption — giữ nguyên kết quả, thống kê và bảng xếp hạng của lớp; vẫn cho xóa HV thêm nhầm)
- Q: Khóa HV có ảnh hưởng tới dữ liệu và lớp không? → A: Không; HV bị đăng xuất ngay, không đăng nhập được, mọi dữ liệu và tư cách thành viên Lớp giữ nguyên; mở khóa khôi phục quyền truy cập. (source: assumption — khóa là thao tác đảo ngược được, an toàn hơn xóa)
- [thay thế 2026-10-20 v4] Q: HV có tự sửa thông tin cá nhân không? → A: Không; S10 chỉ xem (trừ đổi mật khẩu), GV quản lý Họ tên/Email/Số điện thoại. (source: assumption) — S10 nay là "Hồ sơ của tôi" thuộc module 011 (V4-7); 011 quyết định HV sửa được gì. Email và các thao tác tài khoản vẫn do GV quản lý ở T11.
- Q: GV có đổi được Email đăng nhập không? → A: Có, ở T17, phải nhập đúng mật khẩu hiện tại, không gửi thư xác minh. (source: assumption — cho phép sửa Email gõ nhầm lúc đăng ký, để GV còn dùng được A03)
- Q: Có giới hạn số HV mỗi workspace không? → A: Không giới hạn cứng trong MVP; hiệu năng thiết kế cho 2.000 HV/workspace. (source: assumption — A1 miễn phí, chưa có gói; xem lại khi có định giá)

### Session 2026-10-20 (v4)

- Q (Q-2 cũ): A02 có bắt buộc ô đồng ý Điều khoản/Chính sách dữ liệu không? → A: "bỏ qua mục này" — không có ô đồng ý trong MVP; chuyển sang Out of Scope (V4-5). Đóng Q-2. (source: stakeholder)
- Q: HV có tài khoản bằng cách nào? → A: "GV sẽ dùng email học viên cung cấp sau đó active email đó trên hệ thống; có thể bulk create bằng excel; sau đó hệ thống tự tạo tài khoản và gửi password được random về mail đó cho học viên login và truy cập hệ thống" — GV thêm Email + Họ tên (từng HV hoặc Excel) → "Chưa kích hoạt"; GV bấm "Kích hoạt" (từng HV hoặc hàng loạt) → hệ thống tạo tài khoản, sinh mật khẩu ngẫu nhiên, gửi thư; trạng thái Chưa kích hoạt / Đã kích hoạt / Gửi email thất bại (có "Gửi lại") / Đã khóa; GV không bao giờ thấy mật khẩu; "Đặt lại mật khẩu" cũng gửi mật khẩu ngẫu nhiên mới qua thư (V4-6) — REQ-7, REQ-8, REQ-10, REQ-12, REQ-17, REQ-18. (source: stakeholder)
- Q: HV có bắt buộc đổi mật khẩu ở lần đăng nhập đầu không? → A: "không bắt buộc đổi mật khẩu lần đầu" — bỏ A04 và REQ-7 cũ (Chờ đổi mật khẩu); HV đổi mật khẩu bất kỳ lúc nào ở hồ sơ (AC-3.2, REQ-15). (source: stakeholder)
- Q: Hồ sơ HV ở đâu? → A: "setting profile học viên có thể change password, upload avt…, upload ảnh bìa, và show thông tin cá nhân…" — S10 thành "Hồ sơ của tôi" thuộc module 011; 001 giữ quy tắc đổi mật khẩu (REQ-15) để 011 tham chiếu; AC-14.4 cũ bị bỏ (V4-7). (source: stakeholder)
- Q: HV Chưa kích hoạt có được thêm vào Lớp trước khi kích hoạt không? → A: Có; HV vẫn chưa đăng nhập được cho tới khi được kích hoạt, tư cách thành viên giữ nguyên khi kích hoạt (AC-7.6). **Cần 003 xác nhận nhãn hiển thị.** (source: assumption — khớp đề xuất của brief V4-6; GV thường xếp lớp trước khi phát tài khoản; không thêm quy tắc chặn chồng chéo với 003)
- Q: "Gửi lại" gửi lại mật khẩu cũ hay mật khẩu mới? → A: Luôn tạo mật khẩu ngẫu nhiên mới và làm mật khẩu trước đó mất hiệu lực (AC-18.4). (source: assumption — mật khẩu chỉ lưu dạng một chiều (NFR-4) nên không thể gửi lại mật khẩu cũ; đồng thời vô hiệu thư có thể đã lọt tới sai người)
- Q: Khi nào coi là "Gửi email thất bại"? → A: Dịch vụ gửi thư không nhận thư sau mọi lần thử trong 10 phút, hoặc báo địa chỉ không nhận được thư trong 24 giờ; trong lúc chờ, HV hiển thị trạng thái trung gian "Đang gửi email" (AC-7.1, AC-18.1, AC-18.2). (source: assumption — lỗi hay gặp nhất là GV gõ sai Email, chỉ phát hiện được khi thư bị trả lại; 24 giờ bao phủ phần lớn báo trả lại mà không giữ trạng thái quá lâu)
- Q: Giới hạn gửi lại? → A: Tối đa 3 thư chứa mật khẩu cho mỗi HV trong 60 phút (tính cả kích hoạt, Gửi lại, Đặt lại mật khẩu); tối đa 1.000 thư như vậy mỗi workspace trong 24 giờ; tối đa 500 HV mỗi lần thao tác hàng loạt (AC-7.4, AC-18.5, AC-18.6). (source: assumption — nhất quán với giới hạn 3 thư/60 phút của A03; 1.000/ngày đủ kích hoạt 2 lần import tối đa mà vẫn chặn lạm dụng gửi thư hàng loạt; 500 khớp giới hạn import)
- Q: Nội dung thư và người gửi? → A: Thư tiếng Việt, tên người gửi "SAT", không nhận trả lời; thân thư nêu Họ tên GV nhưng không nêu Email của GV; tiêu đề và các câu cố định theo AC-17.1–AC-17.4. (source: assumption — HV nhận ra thư nhờ tên GV; không lộ Email GV cho người lạ khi GV gõ sai Email HV)
- Q: Thao tác nào được phép ở từng trạng thái? → A: Theo AC-12.6; "Đặt lại mật khẩu" chỉ cho HV Đã kích hoạt (HV Gửi email thất bại dùng "Gửi lại", HV Đã khóa phải mở khóa trước); "Mở khóa" đưa HV về trạng thái trước khi khóa; GV kích hoạt từng HV không cần hộp thoại xác nhận, hàng loạt thì cần. (source: assumption — mỗi trạng thái chỉ có một cách gửi mật khẩu, tránh gửi thư cho HV đang bị khóa; một lần bấm nhầm "Kích hoạt" chỉ gửi đúng thư HV cần)
- Q: GV đổi Email của HV đã kích hoạt thì có tự gửi thư không? → A: Không; GV chủ động bấm "Gửi lại" hoặc "Đặt lại mật khẩu" để gửi tới Email mới (AC-11.6). (source: assumption — phần lớn lần sửa Email là sửa lỗi gõ khi HV chưa đăng nhập; tránh gửi thư ngoài ý muốn và đốt giới hạn gửi)
- Q: 011 cần biết HV còn dùng mật khẩu do hệ thống gửi hay không? → A: Có; 001 ghi nhận nguồn của mật khẩu hiện tại ("do hệ thống tạo" / "do HV tự đặt") và cung cấp cho 011 để hiển thị gợi ý, không bao giờ bắt buộc đổi (AC-15.5). (source: assumption — yêu cầu phối hợp từ 011 AC-4.5; khớp quyết định "không bắt buộc đổi mật khẩu lần đầu")
- Q: "Gửi lại" có làm hàng loạt được không? → A: Có, cùng quy tắc với kích hoạt hàng loạt (AC-18.4). (source: assumption — khi dịch vụ gửi thư gián đoạn trong lúc kích hoạt cả lớp, GV không phải bấm lại từng HV)

### Session 2026-10-21 (v8)

Áp dụng brief v8 cho 001 ở đúng một điểm: thêm thư nhắc hạn nộp của 003 vào danh mục thư dưới dạng tham chiếu (AC-17.5, mẫu M-4 ở spec.html). Không AC nào khác của 001 thay đổi; không mục cũ nào bị thay thế.

- Q: Stakeholder yêu cầu gì liên quan tới thư ở v8? → A: Nguyên văn: "mỗi bài tập sẽ được GV setting ngày deadline, nên trong phần dashboard làm đơn giản sẽ là danh sách các bài tập trong khóa đó, chọn 1 bài tập filter sẽ hiện ra danh sách học viên đã làm bài tập và chưa làm bài tập => tracking chỉ là có làm và không làm theo từng bài, và dựa vào deadline theo từng bài đó hệ thống sẽ gửi mail nhắc học viên chưa làm bài tập ngày hôm đó"; follow-up: email nhắc gửi lúc 08:00 ngày đến hạn. (source: stakeholder)
- Q: Thư nhắc hạn nộp thuộc module nào và 001 ghi nhận thế nào? → A: Thuộc 003 (REQ-24 đến REQ-26 của 003: người nhận, thời điểm, nội dung, kết quả gửi); 001 chỉ thêm AC-17.5 tham chiếu tới 003 và áp dụng ngôn ngữ, tên người gửi, dòng cuối của AC-17.4. (source: assumption — brief v8 "add the reminder template to 001's template list as a reference"; giữ một danh mục thư duy nhất mà không chuyển quyền sở hữu)
- [thay thế 2026-10-22 — một phần: giới hạn là một thư mỗi HV mỗi lớp mỗi ngày (AC-17.5)] Q: Quy tắc kết quả gửi và giới hạn gửi của REQ-18 có áp dụng cho thư nhắc không? → A: Dùng chung dịch vụ gửi thư và tiêu chí thất bại của AC-18.2, nhưng thư nhắc thất bại không đổi trạng thái tài khoản HV, không có "Gửi lại" và không tính vào giới hạn thư chứa mật khẩu của AC-18.5, AC-18.6 — do 003 quy định (AC-26.1, AC-26.2 của 003). (source: assumption — trạng thái "Gửi email thất bại" mô tả việc HV chưa nhận được thông tin đăng nhập; một thư nhắc không chứa mật khẩu và tự giới hạn ở một thư mỗi HV mỗi ngày)

### Session 2026-10-22 (đồng bộ prototype)

Quyết định của bên liên quan ngày 2026-10-22: prototype `specs/screen-flow-design.html` là chuẩn cho câu chữ giao diện và cho hành vi nó thể hiện; spec được sửa theo prototype.

- Q: Đăng xuất có cần xác nhận không? → A: Có — hộp thoại "Đăng xuất khỏi SAT?" kèm "Bạn sẽ cần email và mật khẩu để đăng nhập lại.", xác nhận thì về A01 với "Đã đăng xuất." (AC-5.1). (source: stakeholder "prototype là chuẩn")
- Q: Chọn hàng loạt mà không có HV nào đúng trạng thái thì sao? → A: Không mở hộp thoại; hiển thị "Không có học viên Chưa kích hoạt nào trong các học viên đã chọn." (Kích hoạt) hoặc "Không có học viên Gửi email thất bại nào trong các học viên đã chọn." (Gửi lại) (AC-7.2, AC-18.4). (source: stakeholder "prototype là chuẩn")
- Q: Hộp thoại Gửi lại hàng loạt nói gì? → A: "Gửi lại email cho N học viên? Mỗi học viên nhận một mật khẩu ngẫu nhiên mới."; tóm tắt "Gửi lại xong: …" (AC-18.4). (source: stakeholder "prototype là chuẩn")
- Q: Bộ lọc trạng thái ở T11 có đếm và HV Đang gửi email nằm ở đâu? → A: Mỗi bộ lọc kèm số HV; bộ lọc Đã kích hoạt gồm cả HV Đang gửi email (AC-11.4). (source: stakeholder "prototype là chuẩn")
- [thay thế 2026-10-22 — một phần: khi chọn "Thư nhắc hạn nộp" ngăn mang tên "Mẫu email nhắc hạn nộp" (AC-17.6)] Q: GV có xem trước được thư tài khoản không? → A: Có — nút "Xem mẫu email" ở T11 mở ngăn "Mẫu email tài khoản" (Thư kích hoạt, Thư mật khẩu mới, Thư nhắc hạn nộp của 003), mật khẩu luôn bị che (AC-17.6 mới). (source: stakeholder "prototype là chuẩn")
- Q: Biểu mẫu đặt mật khẩu có hiển thị quy tắc khi gõ không? → A: Có — hai quy tắc "8–64 ký tự", "Có ít nhất một chữ cái và một chữ số" được đánh dấu đạt/chưa đạt theo giá trị đang nhập ở A02, A03, T17 và S10 (AC-2.3). (source: stakeholder "prototype là chuẩn")
- Chỉ đổi câu chữ (không đổi hành vi): dòng kết quả import (AC-10.2) theo prototype; thêm câu "Thông tin, bài nộp, điểm và các lớp của học viên được giữ nguyên." vào hộp thoại Khóa tài khoản (AC-12.5); dòng bỏ qua "Z học viên sẽ được bỏ qua vì đang ở trạng thái khác." (AC-7.2); lỗi Email ở §8 thành "Email không đúng định dạng."; bỏ dấu ngoặc kép quanh "do hệ thống tạo" / "do HV tự đặt" ở AC-15.5 vì đây là trạng thái nội bộ, không phải chữ trên giao diện. Các thông báo lỗi mà prototype không mô phỏng (AC-5.4, AC-7.4, AC-9.3, AC-15.3, AC-18.2 lý do "Chưa gửi được thư…", thư AC-17.3) được giữ nguyên. (source: stakeholder "prototype là chuẩn")
- Q: Thư nhắc hạn nộp trong danh mục thư của 001 là thư gì? → A: Theo mẫu xem trước của prototype: một thư cho mỗi HV mỗi lớp mỗi ngày hạn nộp, gộp các bộ bài tập hết hạn hôm đó mà HV chưa nộp; tiêu đề "[SAT] Hôm nay là hạn nộp bài tập – {tên lớp}"; một nút "Làm bài ngay"; câu về việc vẫn nộp được sau hạn với nhãn "Nộp muộn"; dòng cuối "Đây là thư tự động, vui lòng không trả lời."; nội dung chi tiết vẫn do 003 REQ-25 sở hữu (AC-17.5). (source: stakeholder "cứ sửa spec theo prototype")
- Q: Ngăn xem mẫu thư hiển thị thư nhắc thế nào? → A: Chọn "Thư nhắc hạn nộp" thì ngăn đổi tiêu đề thành "Mẫu email nhắc hạn nộp" và có dòng "Gửi lúc 08:00 ngày hạn tới học viên đã kích hoạt, chưa nộp bộ đó; nhiều bộ cùng hạn trong một lớp gộp vào một thư."; thư kích hoạt và thư mật khẩu mới trong ngăn khớp AC-17.1, AC-17.2, AC-17.4 (đã đối chiếu, không đổi nội dung) (AC-17.6). (source: stakeholder "cứ sửa spec theo prototype")
- Q: GV thấy thông báo gì khi kích hoạt một HV và khi thư tới được HV? → A: "Đang gửi email đăng nhập tới [Email]…" khi bấm "Kích hoạt"; khi thư của một thao tác trên riêng một HV được nhận: "Đã gửi email đăng nhập tới [Email]." hoặc "Đã gửi email mật khẩu mới tới [Email]." (AC-7.1, AC-18.1). (source: stakeholder "cứ sửa spec theo prototype")

### Session 2026-10-22 (tự học toàn hệ thống)

Áp dụng quyết định V14 của stakeholder ngày 2026-10-22. Không đánh số lại, không sửa AC cũ; thêm US-9, US-10, REQ-19 (AC-19.1–AC-19.8), REQ-20 (AC-20.1–AC-20.9); cập nhật §1, §3, §7, §8, §9, §10. Chưa có artifact hạ nguồn.

- Q: Yêu cầu của stakeholder? → A: Nguyên văn: "với dự án hiện tại thì các feature đang là theo học viên trong 1 lớp để GV dễ tracking và quản lí theo giáo trình và bài học, giờ sẽ thêm các module feature global cho tất cả user để có thể dùng được và không phân biệt lớp: 3. Học từ vựng thông minh (…) · 4. Luyện viết chữ Hán (…) · 5. Luyện nghe và nói (…) · 6. Mô phỏng thi thử HSK (…)." (đầy đủ ở 016 §12) (source: stakeholder)
- [thay thế 2026-10-22 V15 — chỉ HV dùng Tự học, với Kho tự học của workspace mình; GV có "Kho tự học" → T23 và không vào S13–S20 (AC-20.2–AC-20.4)] Q: Ai dùng khu Tự học? → A: Mọi tài khoản HV và GV hiện có, không cần lớp, không phân biệt workspace; vẫn không có tự đăng ký công khai → mục "Tự học" ở thanh tab dưới của HV và thanh bên của GV mở S13; mọi HV đã kích hoạt, không bị khóa, và mọi GV dùng được (AC-20.1–AC-20.4). (source: stakeholder)
- [thay thế 2026-10-22 V15 — mỗi GV quản lý Kho tự học của workspace mình (016); REQ-19 bị bỏ] Q: Nội dung chung do ai duy trì? → A: Vai trò mới "Quản trị nội dung" ở cấp hệ thống (module 016) → REQ-19. (source: stakeholder)
- Q: Dữ liệu tự học có ai thấy? → A: Riêng tư với từng người, không hiển thị cho GV, không ảnh hưởng xếp hạng lớp (008) hay dashboard (009) (AC-20.5). (source: stakeholder)
- [thay thế 2026-10-22 V15 — không còn vai trò QTND] Q: Tài khoản QTND được tạo, vô hiệu hóa và cấp mật khẩu thế nào? → A: Đơn vị vận hành tạo/vô hiệu hóa ngoài giao diện SAT; khi tạo, hệ thống gửi thư mật khẩu ngẫu nhiên như thư kích hoạt HV; QTND không có A03, quên mật khẩu thì liên hệ đơn vị vận hành (AC-19.1, AC-19.2, AC-19.6). (source: assumption — brief "provisioned by the operator, no UI"; dùng lại quy tắc mật khẩu ngẫu nhiên AC-2.5 để không ai cầm mật khẩu)
- [thay thế 2026-10-22 V15 — không còn vai trò QTND] Q: QTND bị vô hiệu hóa thấy gì? → A: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị hệ thống." khi đăng nhập và ở thao tác kế tiếp của mọi phiên (AC-19.4, AC-19.5). (source: assumption — giống cách xử lý HV bị khóa ở AC-3.4, AC-12.3)
- [thay thế 2026-10-22 V15 — không còn vai trò QTND] Q: QTND có hết hạn phiên, tạm khóa như GV không? → A: Có — hết hạn sau 8 giờ không thao tác, cùng quy tắc mật khẩu và tạm khóa (AC-19.6). (source: assumption — QTND sửa nội dung cho toàn hệ thống nên ít nhất phải chặt như GV)
- [thay thế 2026-10-22 V15 — GV mở S13–S20 → A05 (AC-20.4); HV mở T23–T27 → S01 (AC-20.10); không còn QTND, Q01–Q05] Q: Định tuyến giữa vai trò? → A: QTND mở T01–T21 hoặc S01–S20 → về Q01; GV/HV mở Q01–Q05 → A05 (không tiết lộ khu quản trị tồn tại); GV mở S13–S20 được phép (ngoại lệ của AC-16.4) (AC-19.7, AC-19.8, AC-20.4). (source: stakeholder cho A05 theo brief; phần còn lại là assumption — đồng nhất với AC-16.3, AC-16.4)
- Q: Xóa HV thì dữ liệu tự học ra sao, có chặn xóa không? → A: Không truy cập được ngay, xóa vĩnh viễn trong vòng 24 giờ; dữ liệu tự học không phải Bài nộp nên không chặn xóa; HV bị khóa thì dữ liệu giữ nguyên (AC-20.6, AC-20.7). (source: assumption — thời hạn 30 ngày do điều phối viên đặt tạm, sẽ được thống nhất giữa 001 và 012–015)
- [thay thế 2026-10-22 V15 — một phần: chỉ HV trở lại đúng màn hình, GV về T01 (AC-20.8)] Q: Mở S13–S20 khi chưa đăng nhập? → A: Về A01, đăng nhập xong trở lại đúng màn hình với HV/GV, QTND về Q01 (AC-20.8). (source: assumption — áp dụng AC-5.5 cho khu Tự học)
- Q: Đăng xuất khi còn kết quả ôn tập chưa lưu? → A: Thay hộp thoại đăng xuất bằng cảnh báo của 012 AC-18.6 với "Ở lại" (mặc định) và "Vẫn đăng xuất" (AC-20.9). (source: assumption — yêu cầu phối hợp từ 012, giữ câu chữ của 012)

### Session 2026-10-22 (V15 — gom quản lý vào GV)

Áp dụng quyết định V15 của stakeholder ngày 2026-10-22. Không đánh số lại AC còn lại. Bỏ US-9, REQ-19 (AC-19.1–AC-19.8, mã không dùng lại — §9 "Removed (2026-10-22, V15)"); viết lại US-10, tiêu đề REQ-20, AC-20.2, AC-20.3, AC-20.4, AC-20.5, AC-20.8, AC-20.9; thêm AC-20.10; sửa AC-1.1 (workspace mới không còn "trống" vì Kho tự học được nạp Bộ nội dung mẫu HSK); cập nhật §1, §3, §7, §8, §9, §10. Các mục của Session 2026-10-22 (tự học toàn hệ thống) bị mâu thuẫn được gắn "[thay thế 2026-10-22 V15]".

- Q: Yêu cầu của stakeholder? → A: Nguyên văn: "Hệ thống hiện tại chỉ có 2 role là GV và học viên, và phần quản lí các nội dung tự học sẽ làm chung phần quản lí của GV luôn, và GV chỉ quản lí thôi, chức năng tự học chỉ dành cho user học viên. Gom quản lí hệ thống vào cho GV." (source: stakeholder)
- Q: Kho nội dung tự học là một kho chung hay mỗi GV một kho? → A: Mỗi GV có Kho tự học riêng trong workspace của mình, được nạp sẵn "Bộ nội dung mẫu HSK" mà GV sửa, thêm, ẩn tùy ý (module 016) → AC-1.1 nêu việc nạp khi tạo workspace; AC-20.3 HV dùng kho của workspace mình. (source: stakeholder)
- Q: Vai trò "Quản trị nội dung" còn không? → A: Không; chỉ GV và HV; bỏ REQ-19, màn hình Q01–Q05 và mọi tài khoản do đơn vị vận hành tạo. (source: stakeholder)
- Q: GV có dùng khu Tự học không? → A: Không; thanh bên GV có "Kho tự học" → T23 thay cho "Tự học" (AC-20.2); GV mở S13–S20 → A05 "Không tìm thấy nội dung bạn yêu cầu." (AC-20.4); GV xem trước nội dung trong T23–T27. (source: stakeholder cho "GV chỉ quản lí"; A05 là assumption — cùng phản hồi với dữ liệu không tồn tại, không tiết lộ màn hình người học, khớp mô hình chung của điều phối)
- Q: HV nào dùng được Tự học? → A: Mọi HV đã kích hoạt, không bị khóa của workspace, không cần lớp, với nội dung kho của workspace đó (AC-20.3). (source: stakeholder)
- Q: HV mở màn hình T23–T27 thì sao? → A: Về S01 như mọi màn hình GV khác (AC-20.10, đồng nhất với AC-16.3). (source: assumption — giữ một quy tắc duy nhất cho HV mở màn hình GV)
- Q: GV chưa đăng nhập mở đường dẫn S13 rồi đăng nhập thì về đâu? → A: T01 theo AC-5.5 (vai trò không được xem màn hình đó → trang chủ theo vai trò), không hiện A05 ngay sau đăng nhập (AC-20.8). (source: assumption — áp dụng nguyên quy tắc chung AC-5.5)
- Q: GV có thấy dữ liệu tự học của HV không? → A: Không thấy dữ liệu của riêng HV nào; chỉ số đếm tổng hợp ẩn danh của workspace trên T23 theo 016 (AC-20.5). (source: stakeholder — quyền riêng tư giữ nguyên)
