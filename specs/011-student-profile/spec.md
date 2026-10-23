---
id: 011
slug: student-profile
title: Student Profile
status: draft
branch: feat/011-student-profile
created: 2026-10-20
updated: 2026-10-20
approved_by:
approved_at:
---

# Student Profile (Hồ sơ học viên)

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

Học viên (HV) hiện chỉ có màn hình tài khoản chỉ xem, không có cách thể hiện bản thân và không biết
gì về bạn cùng lớp ngoài 10 hạng đầu trên Bảng xếp hạng. Stakeholder yêu cầu (2026-10-20): "về phần
setting profile học viên có thể change password, upload avt…, upload ảnh bìa, và show thông tin cá
nhân như đang học lớp nào, tiến độ làm bài tập, và rank điểm … trong lớp học đó, và các học viên có thể
xem profile qua lại của nhau", với điều kiện chỉ **bạn cùng lớp** được xem và hồ sơ người khác chỉ hiện
**các lớp học chung**, không email/số điện thoại. Module này định nghĩa **S10 "Hồ sơ của tôi"** (thông
tin cá nhân chỉ xem, đổi mật khẩu theo quy tắc của 001, ảnh đại diện và ảnh bìa với cắt ảnh/xem trước/gỡ,
các lớp đang học kèm tiến độ bài tập theo 009 và Điểm xếp hạng + hạng theo 008 — từ 2026-10-22 Điểm xếp hạng là
30% × TB bài tập + 70% × TB bài thi trên thang 0–100, một chữ số thập phân, và tiến độ chỉ đếm các bộ bài tập GV
đã đặt Hạn nộp trong lớp), **S12 "Hồ sơ học viên"**
(xem hồ sơ bạn cùng lớp, chỉ các lớp học chung), quyền xem hồ sơ, cách hồ sơ phản ánh việc gỡ khỏi lớp,
khóa/xóa tài khoản, lớp kết thúc và nội dung bị ẩn, cùng thao tác **"Gỡ ảnh"** của Giáo viên (GV) với
ảnh không phù hợp. Kết quả mong muốn: HV có hồ sơ cá nhân hóa và có động lực học khi thấy tiến độ của
bạn cùng lớp, trong khi không một dữ liệu liên lạc hay dữ liệu lớp không chung nào bị lộ.

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| HV cá nhân hóa hồ sơ | Tỷ lệ HV đã đăng nhập có ảnh đại diện riêng sau 30 ngày | ≥ 40% |
| Tăng gắn kết trong lớp | Tỷ lệ HV của lớp Đang học mở ít nhất 1 hồ sơ bạn cùng lớp (S12) mỗi tháng | ≥ 30% |
| HV tự quản lý mật khẩu | Tỷ lệ HV đổi mật khẩu được gửi qua email trong 14 ngày kể từ khi được kích hoạt | ≥ 50% |
| Không lộ dữ liệu cá nhân | Số trường Email, Số điện thoại hoặc dữ liệu lớp không chung của HV khác gửi tới thiết bị của HV | 0 (NFR-4) |
| GV xử lý ảnh không phù hợp nhanh | Thời gian từ khi GV xác nhận "Gỡ ảnh" đến khi ảnh không còn hiển thị với bất kỳ ai | ≤ 60 giây (AC-14.4) |
| Đổi ảnh dễ dàng trên điện thoại | Tỷ lệ HV hoàn tất đổi ảnh đại diện (chọn ảnh → cắt → lưu) không cần trợ giúp | ≥ 9/10 HV trong kiểm thử khả dụng |

## 3. Actors & Context

- **Học viên (HV)** — tài khoản do GV tạo và kích hoạt (001, V4-6); dùng điện thoại là chính (360–430 px),
  có thể thuộc nhiều lớp của cùng GV (A3). Mở S10 từ tab "Tài khoản" của thanh tab dưới để xem thông tin
  của mình, đổi mật khẩu được gửi qua email, đặt ảnh đại diện/ảnh bìa và xem nhanh tiến độ, điểm, hạng ở
  từng lớp. Mở S12 khi chạm một bạn trên Bảng xếp hạng (S09) hoặc trong danh sách "Thành viên" của Trang
  lớp (S02) để xem bạn đó học thế nào ở các lớp học chung.
- **Giáo viên (GV)** — chủ và quản trị viên duy nhất của workspace (D1), dùng máy tính. Thấy ảnh đại diện của
  HV trên T11, T04 (tab Học viên, tab Xếp hạng) và T15; T15 vẫn là màn hình chi tiết của GV về một HV (009).
  GV gỡ ảnh đại diện hoặc ảnh bìa không phù hợp; GV không dùng S10/S12 và không tải ảnh hộ HV.
- **Hệ thống** — nhận các sự kiện nghiệp vụ "HV được thêm vào / gỡ khỏi lớp", "Lớp kết thúc / mở lại / bị
  xóa" (003), "Tài khoản HV được kích hoạt / bị khóa / bị xóa", "Thông tin HV được GV sửa" (001), và dùng
  tiến độ (009) cùng Điểm xếp hạng, hạng (008) để hiển thị trên hồ sơ.
- **Hiện nay** S10 chỉ hiển thị Họ tên, Email, Số điện thoại và đổi mật khẩu (001); HV không có ảnh, không
  xem được hồ sơ của nhau, và chỉ biết họ tên + điểm của 10 bạn đứng đầu trên S09.

## 4. User Stories

- US-1 (P1): Là HV, tôi muốn xem hồ sơ của mình gồm thông tin cá nhân và các lớp đang học kèm tiến độ bài
  tập, Điểm xếp hạng và hạng ở từng lớp, để nắm nhanh tình hình học của mình ở một chỗ.
  - Why this priority: là lõi của yêu cầu "show thông tin cá nhân như đang học lớp nào, tiến độ làm bài
    tập, và rank điểm"; mọi phần khác của hồ sơ dựa trên màn hình này.
  - Independent test: HV Trần Minh Anh thuộc lớp HSK1-K12 (Đang học, 10 bộ bài tập đang hiển thị có Hạn nộp,
    đã nộp 8, Điểm xếp hạng 74,2, hạng 3/25) và HSK2-K03 (Sắp bắt đầu ngày 05/11/2026) → S10 hiển thị Họ tên,
    Email, Số điện thoại chỉ xem; HSK1-K12 với "80% · Bộ bài tập 8/10 · 74,2 điểm · Hạng 3/25"; HSK2-K03 với
    "Bắt đầu ngày 05/11/2026".
- US-2 (P1): Là HV, tôi muốn đổi mật khẩu được gửi qua email sang mật khẩu của riêng tôi ngay trên hồ sơ,
  để tài khoản an toàn mà không bị bắt buộc đổi ở lần đăng nhập đầu.
  - Why this priority: V4-6 bỏ bắt buộc đổi mật khẩu lần đầu (A04); S10 là nơi duy nhất HV tự đổi mật khẩu.
  - Independent test: HV đăng nhập bằng mật khẩu nhận qua email → S10 hiển thị gợi ý đổi mật khẩu; HV đổi
    thành công → thấy "Đã đổi mật khẩu thành công.", gợi ý biến mất, phiên trên thiết bị khác bị kết thúc.
- US-3 (P1): Là HV, tôi muốn tải lên, cắt và xem trước ảnh đại diện, hoặc gỡ ảnh để dùng ảnh mặc định, để
  bạn cùng lớp và GV nhận ra tôi.
  - Why this priority: stakeholder nêu rõ "upload avt"; ảnh đại diện xuất hiện ở S09, danh sách thành viên,
    T04, T11, T15.
  - Independent test: HV chọn ảnh JPG 4 MB → khung cắt vuông với xem trước hình tròn → kéo, phóng to 2 lần
    → "Lưu" → S10 hiển thị ảnh mới và "Đã cập nhật ảnh đại diện."; bạn cùng lớp tải lại S09 thấy ảnh mới;
    HV gỡ ảnh → ảnh chữ viết tắt "TA" xuất hiện.
- US-4 (P2): Là HV, tôi muốn đặt ảnh bìa cho hồ sơ, để hồ sơ mang dấu ấn riêng.
  - Why this priority: stakeholder yêu cầu "upload ảnh bìa", nhưng hồ sơ vẫn dùng được khi chỉ có ảnh bìa
    mặc định.
  - Independent test: HV chọn ảnh PNG 2400 × 1200 px → khung cắt tỷ lệ 3:1 → "Lưu" → S10 và S12 (khi bạn
    cùng lớp mở) hiển thị ảnh bìa mới; chọn ảnh 800 × 250 px → "Ảnh bìa cần tối thiểu 900 × 300 px."
- US-5 (P1): Là HV, tôi muốn chạm vào một bạn trên Bảng xếp hạng hoặc trong danh sách thành viên lớp để xem
  hồ sơ của bạn đó ở các lớp chúng tôi học chung, để học hỏi và có động lực thi đua.
  - Why this priority: stakeholder yêu cầu "các học viên có thể xem profile qua lại của nhau".
  - Independent test: Minh Anh và Lê Thu Hà cùng học HSK1-K12; Thu Hà còn học HSK1-K13 → Minh Anh chạm Thu
    Hà trên S09 → S12 hiển thị ảnh bìa, ảnh đại diện, "Lê Thu Hà" và chỉ lớp HSK1-K12 với tiến độ, điểm, hạng
    của Thu Hà; không có HSK1-K13, Email hay Số điện thoại.
- US-6 (P1): Là HV, tôi muốn chỉ bạn cùng lớp mới xem được hồ sơ của tôi và không ai thấy email, số điện
  thoại hay các lớp khác của tôi, để bảo vệ quyền riêng tư.
  - Why this priority: hồ sơ là dữ liệu cá nhân (có thể của trẻ vị thành niên); sai phân quyền là rủi ro
    bảo mật nghiêm trọng.
  - Independent test: HV lớp HSK2-K01 (không học chung với Thu Hà) mở đường dẫn S12 của Thu Hà → A05 "Không
    tìm thấy nội dung bạn yêu cầu.", giống hệt khi mở đường dẫn của một HV không tồn tại.
- US-7 (P1): Là GV, tôi muốn thấy ảnh đại diện của HV trong các danh sách và gỡ ảnh đại diện hoặc ảnh bìa
  không phù hợp, kèm thông báo cho HV, để giữ môi trường lớp học lành mạnh.
  - Why this priority: cho HV tự tải ảnh mà không có cách gỡ thì không thể vận hành an toàn.
  - Independent test: GV mở T15 của Minh Anh → chọn ảnh bìa → "Gỡ ảnh" → xác nhận → T15 hiển thị ảnh bìa
    mặc định và "Đã gỡ ảnh."; Minh Anh mở S10 thấy "Giáo viên đã gỡ ảnh bìa của bạn vì không phù hợp. Bạn
    có thể chọn ảnh khác." kèm "Đã hiểu".
- US-8 (P1): Là HV và GV, tôi muốn hồ sơ phản ánh đúng việc gỡ khỏi lớp, khóa/xóa tài khoản, lớp kết thúc và
  nội dung bị ẩn, để quyền xem hồ sơ và số liệu luôn đúng.
  - Why this priority: không xử lý các thay đổi này thì hồ sơ lộ dữ liệu sau khi HV đã rời lớp.
  - Independent test: GV gỡ Thu Hà khỏi HSK1-K12 (lớp chung duy nhất) → Minh Anh tải lại S12 của Thu Hà → A05;
    S10 của Thu Hà không còn HSK1-K12.

## 5. Functional Requirements

### REQ-1: Thông tin cá nhân trên Hồ sơ của tôi (S10)

<!-- Story: US-1 · Priority: P1 · Screens: S10 -->

- AC-1.1: WHEN HV chọn tab "Tài khoản" ở thanh tab dưới THE SYSTEM SHALL mở S10 "Hồ sơ của tôi" gồm, từ trên xuống, ảnh bìa, ảnh đại diện, Họ tên, khối "Thông tin cá nhân", khối "Lớp đang học" và khối "Bảo mật" chứa nút "Đổi mật khẩu" và nút "Đăng xuất" (có hộp thoại xác nhận theo 001 AC-5.1).
- AC-1.2: THE SYSTEM SHALL hiển thị trong khối "Thông tin cá nhân" của S10 Họ tên, Email đăng nhập và Số điện thoại của chính HV ở dạng chỉ xem (hiển thị "Chưa có" khi không có Số điện thoại), kèm dòng "Liên hệ giáo viên nếu cần thay đổi thông tin."
- AC-1.3: THE SYSTEM SHALL không cung cấp cho HV bất kỳ cách nào để tự sửa Họ tên, Email hoặc Số điện thoại của mình.
- AC-1.4: THE SYSTEM SHALL không hiển thị trên S10 Ghi chú mà GV ghi về HV, trạng thái kích hoạt hay trạng thái tài khoản của HV.
- AC-1.5: WHEN GV sửa Họ tên, Email hoặc Số điện thoại của HV theo 001 THE SYSTEM SHALL hiển thị giá trị mới trên S10 (và Họ tên mới trên S12) ở lần mở hoặc tải lại kế tiếp.
- AC-1.6: IF không tải được dữ liệu của S10 THEN THE SYSTEM SHALL hiển thị "Không tải được hồ sơ. Vui lòng thử lại." kèm nút "Thử lại" và không hiển thị giá trị trống hoặc số 0 thay thế.

### REQ-2: Lớp đang học và chỉ số trên S10

<!-- Story: US-1 · Priority: P1 · Screens: S10 -->

- AC-2.1: WHEN HV mở S10 THE SYSTEM SHALL liệt kê trong khối "Lớp đang học" mọi lớp mà HV đang là thành viên, theo cùng thứ tự với S01 (Đang học có ngày bắt đầu mới nhất trước, rồi Sắp bắt đầu, rồi Đã kết thúc), mỗi lớp gồm tên lớp, nhãn trạng thái và tên Giáo trình kèm cấp HSK.
- AC-2.2: THE SYSTEM SHALL hiển thị cho mỗi lớp Đang học hoặc Đã kết thúc trong khối "Lớp đang học" Tiến độ tổng (%) và "Bộ bài tập x/y" của chính HV theo định nghĩa của 009 (y là số bộ bài tập đang hiển thị với HV có Hạn nộp trong lớp, x là số bộ trong đó HV đã nộp), cùng Điểm xếp hạng dạng "{n} điểm" trên thang 0–100 với một chữ số thập phân (ví dụ "74,2 điểm") và hạng dạng "Hạng r/N" hoặc "Chưa có hạng" theo 008.
- AC-2.3: WHILE một lớp của HV ở trạng thái Sắp bắt đầu THE SYSTEM SHALL hiển thị cho lớp đó trên S10 dòng "Bắt đầu ngày {dd/mm/yyyy}" thay cho tiến độ, Điểm xếp hạng và hạng.
- AC-2.4: IF một lớp Đang học hoặc Đã kết thúc không có bộ bài tập nào đang hiển thị với HV có Hạn nộp trong lớp (bộ được tính tiến độ theo 009) THEN THE SYSTEM SHALL hiển thị tiến độ của lớp đó là "—" kèm chú thích "Chưa có bài tập" và vẫn hiển thị Điểm xếp hạng và hạng.
- AC-2.5: THE SYSTEM SHALL bảo đảm Tiến độ tổng, "Bộ bài tập x/y", Điểm xếp hạng và hạng của cùng một cặp HV–Lớp hiển thị trên S10, S12, S01, S02 và S09 là cùng một giá trị tại cùng một thời điểm.

### REQ-3: Điều hướng, trạng thái trống và lỗi của khối Lớp đang học

<!-- Story: US-1 · Priority: P1 · Screens: S10, S02, S09 -->

- AC-3.1: WHEN HV chạm tên một lớp trong khối "Lớp đang học" của S10 THE SYSTEM SHALL mở S02 của lớp đó.
- AC-3.2: WHEN HV chạm "Xem xếp hạng" ở một lớp Đang học hoặc Đã kết thúc trên S10 THE SYSTEM SHALL mở S09 với lớp đó được chọn sẵn.
- AC-3.3: IF HV không thuộc lớp nào THEN THE SYSTEM SHALL hiển thị trong khối "Lớp đang học" thông điệp "Bạn chưa thuộc lớp nào. Khi giáo viên thêm bạn vào lớp, lớp sẽ hiển thị tại đây."
- AC-3.4: IF không tải được Điểm xếp hạng và hạng THEN THE SYSTEM SHALL vẫn hiển thị danh sách lớp và tiến độ, và hiển thị "Chưa tải được xếp hạng" kèm nút "Thử lại" tại vị trí điểm và hạng.

### REQ-4: Đổi mật khẩu trên S10

<!-- Story: US-2 · Priority: P1 · Screens: S10 · Rules owner: 001 -->

- AC-4.1: WHEN HV chọn "Đổi mật khẩu" trên S10 (dòng kèm chú thích "Các phiên khác sẽ bị đăng xuất") THE SYSTEM SHALL hiển thị biểu mẫu "Đổi mật khẩu" gồm "Mật khẩu hiện tại", "Mật khẩu mới" kèm danh sách quy tắc mật khẩu được đánh dấu đạt/chưa đạt khi gõ (theo 001 AC-2.3) và "Xác nhận mật khẩu mới", mỗi ô có nút hiện/ẩn mật khẩu, cùng nút "Lưu mật khẩu" và "Hủy".
- AC-4.2: WHEN HV gửi biểu mẫu đổi mật khẩu THE SYSTEM SHALL kiểm tra và xử lý theo đúng quy tắc mật khẩu tự đặt và quy tắc đổi mật khẩu của 001 (độ dài và thành phần của mật khẩu mới, xác nhận khớp, mật khẩu hiện tại đúng, mật khẩu mới khác mật khẩu hiện tại, giới hạn số lần nhập sai mật khẩu hiện tại), hiển thị đúng thông báo của 001 dưới trường tương ứng.
- AC-4.3: WHEN đổi mật khẩu thành công THE SYSTEM SHALL giữ phiên hiện tại, kết thúc mọi phiên khác của HV theo 001, đóng biểu mẫu, xóa mọi giá trị đã nhập, giữ HV ở S10 và hiển thị "Đã đổi mật khẩu thành công."
- AC-4.4: WHEN HV chọn "Hủy" hoặc rời S10 khi biểu mẫu đổi mật khẩu đang mở THE SYSTEM SHALL bỏ mọi giá trị đã nhập và giữ nguyên mật khẩu.
- AC-4.5: WHILE HV vẫn đang dùng mật khẩu do hệ thống tạo và gửi qua email (khi kích hoạt hoặc khi GV đặt lại mật khẩu theo 001) THE SYSTEM SHALL hiển thị ở đầu S10 gợi ý "Bạn đang dùng mật khẩu được gửi qua email. Hãy đổi sang mật khẩu của riêng bạn." kèm nút "Đổi mật khẩu", và không chặn HV dùng bất kỳ chức năng nào.

### REQ-5: Tải lên và cắt ảnh đại diện, ảnh bìa

<!-- Story: US-3, US-4 · Priority: P1 (ảnh đại diện), P2 (ảnh bìa) · Screens: S10 -->

- AC-5.1: WHEN HV chọn "Đổi ảnh đại diện" hoặc "Đổi ảnh bìa" (nút máy ảnh trên ảnh) trên S10 THE SYSTEM SHALL mở bảng chọn cùng tên với dòng "Chọn ảnh từ thiết bị (JPG, PNG, WebP · tối đa 10 MB) hoặc chụp ảnh mới.", cho HV chọn một tệp ảnh từ thiết bị hoặc chọn "Chụp ảnh" để chụp bằng máy ảnh của điện thoại (bảng chọn có thêm "Gỡ ảnh đại diện" / "Gỡ ảnh bìa" khi HV đang có ảnh riêng — AC-7.1), và kiểm tra tệp theo REQ-6, hiển thị lỗi ngay trong bảng chọn, trước khi mở khung cắt ảnh.
- AC-5.2: WHEN tệp ảnh hợp lệ THE SYSTEM SHALL mở khung cắt ảnh có tỷ lệ cố định 1:1 với xem trước hình tròn cho ảnh đại diện, hoặc 3:1 với xem trước như phần đầu của S10 và S12 cho ảnh bìa, cho HV kéo để chọn vùng, phóng to từ 1 đến 3 lần, chọn "Đặt lại", "Lưu" hoặc "Hủy", với ảnh hiển thị đúng chiều theo hướng chụp ghi trong tệp.
- AC-5.3: WHEN HV chọn "Lưu" trong khung cắt ảnh THE SYSTEM SHALL lưu đúng vùng đã chọn làm ảnh mới, thay thế ảnh cũ cùng loại, hiển thị ảnh mới trên S10 cùng thông báo "Đã cập nhật ảnh đại diện." hoặc "Đã cập nhật ảnh bìa.", và hiển thị ảnh mới cho mọi người có quyền xem ở lần mở hoặc tải lại kế tiếp [NEEDS CLARIFICATION: Ảnh HV vừa lưu được hiển thị ngay cho bạn cùng lớp (GV chỉ gỡ khi thấy không phù hợp — đề xuất), hay phải chờ GV duyệt trước khi người khác thấy?]
- AC-5.4: WHEN HV chọn "Hủy" trong khung cắt ảnh hoặc rời S10 trước khi lưu THE SYSTEM SHALL không lưu gì và giữ nguyên ảnh hiện tại.
- AC-5.5: WHILE ảnh đang được tải lên và xử lý THE SYSTEM SHALL hiển thị tiến trình theo phần trăm cùng nút "Hủy tải lên", và tiếp tục hiển thị ảnh cũ cho tới khi ảnh mới được lưu xong.
- AC-5.6: IF việc tải lên hoặc xử lý ảnh bị gián đoạn hay thất bại THEN THE SYSTEM SHALL giữ nguyên ảnh cũ, hiển thị "Không tải được ảnh lên. Vui lòng thử lại." và giữ khung cắt cùng vùng đã chọn để HV thử lại mà không phải chọn lại tệp.

### REQ-6: Quy tắc tệp ảnh hồ sơ

<!-- Story: US-3, US-4 · Priority: P1 · Screens: S10 -->

- AC-6.1: IF tệp được chọn không phải ảnh JPG, PNG hoặc WebP, xác định theo nội dung tệp chứ không chỉ theo phần mở rộng của tên tệp THEN THE SYSTEM SHALL từ chối tệp và hiển thị "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP."
- AC-6.2: IF tệp ảnh lớn hơn 10 MB THEN THE SYSTEM SHALL từ chối tệp trước khi tải lên và hiển thị "Ảnh vượt quá 10 MB. Vui lòng chọn ảnh nhỏ hơn."
- AC-6.3: IF ảnh nhỏ hơn 200 × 200 px khi đổi ảnh đại diện, nhỏ hơn 900 × 300 px khi đổi ảnh bìa, hoặc có chiều nào lớn hơn 8.000 px THEN THE SYSTEM SHALL từ chối tệp và hiển thị tương ứng "Ảnh đại diện cần tối thiểu 200 × 200 px.", "Ảnh bìa cần tối thiểu 900 × 300 px." hoặc "Ảnh quá lớn (tối đa 8.000 px mỗi chiều)."
- AC-6.4: IF tệp bị hỏng hoặc không đọc được dưới dạng ảnh THEN THE SYSTEM SHALL từ chối tệp và hiển thị "Không đọc được ảnh này. Vui lòng chọn ảnh khác."
- AC-6.5: WHEN tệp ảnh hợp lệ là ảnh động THE SYSTEM SHALL chỉ dùng khung hình đầu tiên làm ảnh tĩnh để cắt và lưu.
- AC-6.6: IF HV đã lưu 20 ảnh mới (tính chung ảnh đại diện và ảnh bìa) trong 24 giờ gần nhất THEN THE SYSTEM SHALL từ chối lần lưu tiếp theo và hiển thị "Bạn đã đổi ảnh quá nhiều lần. Vui lòng thử lại sau." cho tới khi số lần lưu trong 24 giờ gần nhất dưới 20.

### REQ-7: HV gỡ ảnh và ảnh mặc định

<!-- Story: US-3, US-4 · Priority: P1 · Screens: S10, S12, S09, S02, T04, T11, T15 -->

- AC-7.1: WHEN HV chọn "Gỡ ảnh đại diện" hoặc "Gỡ ảnh bìa" trên S10 và xác nhận "Gỡ ảnh đại diện? Ảnh mặc định sẽ được hiển thị thay thế." hoặc "Gỡ ảnh bìa? Ảnh mặc định sẽ được hiển thị thay thế." THE SYSTEM SHALL gỡ ảnh đó, hiển thị ảnh mặc định tương ứng trên S10 cùng thông báo "Đã gỡ ảnh đại diện." hoặc "Đã gỡ ảnh bìa.", và hiển thị ảnh mặc định cho mọi người có quyền xem ở lần mở hoặc tải lại kế tiếp.
- AC-7.2: WHILE HV chưa có ảnh đại diện THE SYSTEM SHALL hiển thị ảnh đại diện mặc định gồm chữ viết tắt theo Họ tên hiện tại (chữ cái đầu của từ đầu tiên và của từ cuối cùng, viết hoa, giữ dấu tiếng Việt, chỉ một chữ khi Họ tên có một từ) trên một nền màu cố định cho HV đó, giống nhau ở mọi màn hình.
- AC-7.3: WHILE HV chưa có ảnh bìa THE SYSTEM SHALL hiển thị một ảnh bìa mặc định chung cho mọi HV.
- AC-7.4: WHILE HV đang dùng ảnh mặc định của một loại ảnh THE SYSTEM SHALL không hiển thị thao tác "Gỡ" cho loại ảnh đó trên S10.

### REQ-8: Nội dung Hồ sơ học viên (S12)

<!-- Story: US-5 · Priority: P1 · Screens: S12 -->

- AC-8.1: WHEN HV mở S12 của một bạn có lớp học chung THE SYSTEM SHALL hiển thị màn hình "Hồ sơ học viên" gồm ảnh bìa, ảnh đại diện và Họ tên của bạn đó, khối "Lớp học chung (n)" với n là số lớp học chung, và nút "Quay lại".
- AC-8.2: THE SYSTEM SHALL liệt kê trong khối "Lớp học chung" của S12 chỉ các lớp học chung giữa người xem và người được xem, theo thứ tự như S01, mỗi lớp gồm tên lớp, nhãn trạng thái, tên Giáo trình kèm cấp HSK, Tiến độ tổng (%) và "Bộ bài tập x/y" của người được xem theo 009 (cùng định nghĩa x/y như AC-2.2), Điểm xếp hạng "{n} điểm" (0–100, một chữ số thập phân) và "Hạng r/N" hoặc "Chưa có hạng" của người được xem theo 008 [NEEDS CLARIFICATION: HV có được tự chọn ẩn tiến độ, điểm và hạng của mình khỏi S12 với bạn cùng lớp không (đề xuất: không trong MVP — mọi bạn cùng lớp đều thấy)?]
- AC-8.3: THE SYSTEM SHALL không hiển thị trên S12 và không gửi tới thiết bị của người xem Email, Số điện thoại, Ghi chú của GV, trạng thái tài khoản của người được xem, tên hay số lượng các lớp không chung, TB bài tập, TB bài thi, chi tiết điểm theo Bài, theo bộ bài tập hay theo bài thi, lịch sử điểm, hoặc bất kỳ thông tin nào về nội dung đang ẩn, đã lưu trữ hay bài thi đã gỡ khỏi lớp.
- AC-8.4: IF một lớp học chung không có bộ bài tập nào đang hiển thị có Hạn nộp trong lớp (bộ được tính tiến độ theo 009) THEN THE SYSTEM SHALL hiển thị tiến độ của người được xem ở lớp đó là "—" kèm chú thích "Chưa có bài tập".
- AC-8.5: WHEN HV chọn "Quay lại" trên S12 THE SYSTEM SHALL đưa HV về màn hình đã mở S12 (S09 hoặc danh sách "Thành viên" của S02) với lớp đang chọn được giữ nguyên.
- AC-8.6: IF không tải được dữ liệu của S12 THEN THE SYSTEM SHALL hiển thị "Không tải được hồ sơ. Vui lòng thử lại." kèm nút "Thử lại" và không hiển thị dữ liệu thiếu như thể là dữ liệu đầy đủ.

### REQ-9: Lối vào S12 từ Bảng xếp hạng và danh sách thành viên lớp

<!-- Story: US-5 · Priority: P1 · Screens: S09 (008), S02 (003), S12, S10 -->

- AC-9.1: WHEN HV chạm ảnh đại diện hoặc Họ tên của một HV khác trên S09 THE SYSTEM SHALL mở S12 của HV đó.
- AC-9.2: WHEN HV chạm một HV khác trong danh sách "Thành viên" của S02 THE SYSTEM SHALL mở S12 của HV đó.
- AC-9.3: WHEN HV chạm dòng của chính mình trên S09 hoặc trong danh sách "Thành viên" của S02 THE SYSTEM SHALL mở S10 thay cho S12.
- AC-9.4: THE SYSTEM SHALL hiển thị cho HV về mỗi bạn cùng lớp trong danh sách "Thành viên" của S02 chỉ ảnh đại diện (hoặc ảnh đại diện mặc định) và Họ tên.
- AC-9.5: THE SYSTEM SHALL không đưa vào danh sách "Thành viên" của S02 những HV chưa được kích hoạt tài khoản theo 001 (trạng thái "Chưa kích hoạt" hoặc "Gửi email thất bại").

### REQ-10: Quyền xem hồ sơ bạn cùng lớp

<!-- Story: US-6 · Priority: P1 · Screens: S12, S10, A05, A01, T01 -->

- AC-10.1: THE SYSTEM SHALL coi hai HV là có "lớp học chung" khi tài khoản của cả hai đã được kích hoạt theo 001 và cả hai hiện đang là thành viên của cùng một lớp ở trạng thái Đang học hoặc Đã kết thúc.
- AC-10.2: THE SYSTEM SHALL chỉ cho một HV xem S12 của HV khác khi hai HV có ít nhất một lớp học chung tại thời điểm mở hoặc tải lại S12.
- AC-10.3: IF HV mở S12 (kể cả qua đường dẫn trực tiếp) của một người không có lớp học chung với mình, thuộc workspace khác, đã bị xóa, chưa được kích hoạt hoặc không tồn tại THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." giống hệt nhau cho mọi trường hợp đó và không hiển thị dữ liệu nào của người đó.
- AC-10.4: IF HV mở S12 của chính mình THEN THE SYSTEM SHALL chuyển HV đến S10.
- AC-10.5: IF người dùng đăng nhập bằng tài khoản GV mở S10 hoặc S12 THEN THE SYSTEM SHALL không hiển thị màn hình đó và chuyển GV về T01.
- AC-10.6: IF người chưa đăng nhập mở S10 hoặc S12 THEN THE SYSTEM SHALL chuyển đến A01 và, sau khi HV đăng nhập thành công, mở lại đúng màn hình đã yêu cầu nếu HV còn quyền xem theo AC-10.2, nếu không thì hiển thị A05.

### REQ-11: Thay đổi thành viên, tài khoản, trạng thái lớp và nội dung ẩn

<!-- Story: US-8 · Priority: P1 · Screens: S10, S12, S02 -->

- AC-11.1: WHEN một trong hai HV bị gỡ khỏi một lớp học chung theo 003 THE SYSTEM SHALL bỏ lớp đó khỏi khối "Lớp học chung" trên S12 ở cả hai phía ở lần mở hoặc tải lại kế tiếp, và hiển thị A05 nếu không còn lớp học chung nào.
- AC-11.2: WHEN HV bị gỡ khỏi một lớp hoặc lớp bị xóa theo 003 THE SYSTEM SHALL bỏ lớp đó khỏi khối "Lớp đang học" trên S10 của HV ở lần mở hoặc tải lại kế tiếp.
- AC-11.3: WHILE tài khoản của một HV bị khóa theo 001 THE SYSTEM SHALL vẫn cho bạn cùng lớp xem S12 của HV đó như bình thường, không hiển thị nhãn hay dấu hiệu nào cho biết tài khoản bị khóa.
- AC-11.4: WHEN tài khoản HV bị xóa theo 001 THE SYSTEM SHALL hiển thị A05 cho mọi lần mở S12 của HV đó, bỏ HV khỏi danh sách "Thành viên" của mọi lớp và xóa vĩnh viễn ảnh đại diện, ảnh bìa của HV trong vòng 24 giờ.
- AC-11.5: WHILE một lớp ở trạng thái Đã kết thúc THE SYSTEM SHALL tiếp tục coi lớp đó là lớp học chung giữa các thành viên của lớp và hiển thị lớp đó trên S10 và S12 với nhãn "Đã kết thúc" cùng tiến độ, Điểm xếp hạng và hạng hiện hành.
- AC-11.6: WHILE section Bài tập của một Bài bị ẩn trong một lớp, một bộ bài tập đang Lưu trữ hoặc một bài thi đã bị gỡ khỏi lớp THE SYSTEM SHALL hiển thị trên S10 và S12 tiến độ của lớp theo 009 (không tính các bộ bài tập đó) và Điểm xếp hạng theo 008 (bài đã nộp vẫn được tính, mục chưa nộp không được tính), không kèm bất kỳ tên, số lượng hay chi tiết nào của nội dung bị ẩn, lưu trữ hoặc đã gỡ.

### REQ-12: Hiển thị ảnh hồ sơ cho HV và GV

<!-- Story: US-3, US-7 · Priority: P1 · Screens: S09, S02, S10, S12, T11, T04, T15 -->

- AC-12.1: THE SYSTEM SHALL hiển thị ảnh đại diện (hoặc ảnh đại diện mặc định) cạnh Họ tên HV trên S09, danh sách "Thành viên" của S02, S10 và S12.
- AC-12.2: THE SYSTEM SHALL hiển thị cho GV ảnh đại diện (hoặc ảnh đại diện mặc định) cạnh Họ tên HV trên T11, T04 tab Học viên, T04 tab Xếp hạng và ở phần đầu T15, cùng ảnh bìa (hoặc ảnh bìa mặc định) ở phần đầu T15.
- AC-12.3: WHEN GV chọn ảnh đại diện của một HV trên T11 hoặc T15, hoặc ảnh bìa trên T15 THE SYSTEM SHALL mở khung xem ảnh phóng to có tiêu đề "Ảnh đại diện · {Họ tên}" hoặc "Ảnh bìa · {Họ tên}", dòng "Học viên cập nhật lúc {dd/mm/yyyy HH:mm}" theo giờ Việt Nam (hoặc "Học viên đang dùng {ảnh đại diện | ảnh bìa} mặc định." khi HV chưa có ảnh riêng), nút "Gỡ ảnh" (chỉ khi HV đang có ảnh riêng) và nút "Đóng".

### REQ-13: GV gỡ ảnh không phù hợp

<!-- Story: US-7 · Priority: P1 · Screens: T11, T15, S10 -->

- AC-13.1: WHEN GV chọn "Gỡ ảnh" trong khung xem ảnh và xác nhận "Gỡ ảnh đại diện của {Họ tên}? Ảnh sẽ bị xóa vĩnh viễn và học viên sẽ nhận được thông báo." hoặc "Gỡ ảnh bìa của {Họ tên}? Ảnh sẽ bị xóa vĩnh viễn và học viên sẽ nhận được thông báo." THE SYSTEM SHALL gỡ ảnh đó, hiển thị ảnh mặc định tương ứng ở mọi màn hình ở lần mở hoặc tải lại kế tiếp và hiển thị cho GV "Đã gỡ ảnh."
- AC-13.2: WHEN GV đã gỡ ảnh của một HV THE SYSTEM SHALL hiển thị ở đầu S10 của HV đó thông báo "Giáo viên đã gỡ {ảnh đại diện | ảnh bìa | ảnh đại diện và ảnh bìa} của bạn vì không phù hợp. Bạn có thể chọn ảnh khác." kèm nút "Đã hiểu", và một chấm báo trên tab "Tài khoản", cho tới khi HV chọn "Đã hiểu".
- AC-13.3: IF ảnh mà GV định gỡ đã được HV thay hoặc gỡ trong lúc hộp xác nhận đang mở THEN THE SYSTEM SHALL không gỡ ảnh hiện tại, hiển thị "Ảnh đã được học viên thay đổi. Vui lòng xem lại ảnh mới." và hiển thị ảnh hiện tại trong khung xem ảnh.
- AC-13.4: IF GV yêu cầu xem phóng to hoặc gỡ ảnh của một HV không thuộc workspace của mình THEN THE SYSTEM SHALL không thực hiện và hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu."

### REQ-14: Riêng tư và bảo vệ ảnh hồ sơ

<!-- Story: US-6 · Priority: P1 · Screens: mọi màn hình HV, S12 -->

- AC-14.1: THE SYSTEM SHALL không hiển thị và không gửi tới thiết bị của một HV Email hay Số điện thoại của bất kỳ HV nào khác, trên mọi màn hình dành cho HV.
- AC-14.2: THE SYSTEM SHALL chỉ cung cấp ảnh đại diện và ảnh bìa của một HV cho chính HV đó, cho HV có lớp học chung với HV đó và cho GV chủ workspace của HV đó.
- AC-14.3: IF một người không thuộc nhóm được phép ở AC-14.2 mở trực tiếp địa chỉ của một ảnh hồ sơ, kể cả địa chỉ đã sao chép từ trước THEN THE SYSTEM SHALL không cung cấp ảnh đó.
- AC-14.4: WHEN một ảnh hồ sơ bị thay thế hoặc bị gỡ THE SYSTEM SHALL ngừng cung cấp ảnh cũ cho mọi người trong vòng 60 giây và xóa vĩnh viễn ảnh cũ trong vòng 24 giờ.
- AC-14.5: THE SYSTEM SHALL chỉ lưu phần ảnh đã cắt và không giữ lại tệp gốc mà HV tải lên.
- AC-14.6: THE SYSTEM SHALL loại bỏ khỏi mọi ảnh hồ sơ được lưu thông tin vị trí và thông tin thiết bị chụp có trong tệp gốc.

## 6. Non-Functional Requirements

- NFR-1: Performance: S10 và S12 hiển thị đầy đủ (ảnh, thông tin, mọi lớp kèm tiến độ, điểm, hạng) p95 ≤ 2 giây trên mạng di động 4G (≥ 10 Mbps) ở màn hình 360 px với HV thuộc 10 lớp; danh sách "Thành viên" 100 HV hiển thị đủ ảnh đại diện p95 ≤ 2 giây trong cùng điều kiện.
- NFR-2: Performance: từ lúc HV chọn "Lưu" trong khung cắt ảnh đến khi ảnh mới hiển thị trên S10 p95 ≤ 5 giây với tệp 5 MB và ≤ 12 giây với tệp 10 MB trên kết nối ≥ 10 Mbps; phần xử lý sau khi tải lên xong p95 ≤ 3 giây.
- NFR-3: Efficiency: mỗi ảnh đại diện hiển thị trong danh sách có dung lượng tải về ≤ 30 KB và mỗi ảnh bìa hiển thị trên S10/S12/T15 ≤ 300 KB, không nhòe ở màn hình mật độ điểm ảnh 3x.
- NFR-4: Privacy: 0 trường Email, Số điện thoại, Ghi chú, trạng thái tài khoản của HV khác và 0 dữ liệu (tên, số lượng, chỉ số) của lớp không chung được gửi đến thiết bị của HV, kiểm chứng bằng kiểm thử tự động bao phủ 100% dữ liệu của S12, danh sách "Thành viên" và S09; 100% ảnh hồ sơ được lưu chứa 0 thông tin vị trí và thông tin thiết bị chụp.
- NFR-5: Security: 100% lần mở trực tiếp S12 hoặc địa chỉ ảnh hồ sơ bởi người không có quyền trong bộ kiểm thử phân quyền (HV không có lớp chung, HV đã bị gỡ khỏi lớp, HV và GV workspace khác, người chưa đăng nhập) bị từ chối; ảnh cũ bị xóa vĩnh viễn trong ≤ 24 giờ sau khi bị thay, bị gỡ hoặc khi tài khoản bị xóa; tối đa 20 lần lưu ảnh mỗi HV mỗi 24 giờ.
- NFR-6: Usability: S10 và S12 dùng được ở chiều rộng 360–430 px không có cuộn ngang, vùng chạm ≥ 44×44 px; khung cắt ảnh thao tác được bằng cảm ứng (kéo, chụm để phóng to) và bằng bàn phím (phím mũi tên để di chuyển, phím + và − để phóng to/thu nhỏ); họ tên dài tới 100 ký tự hiển thị đầy đủ trên S12 và được rút gọn bằng "…" trong danh sách mà không vỡ bố cục.
- NFR-7: Accessibility: S10, S12 và khung cắt ảnh đạt WCAG 2.1 AA về tương phản (≥ 4,5:1 cho chữ thường, kể cả chữ viết tắt trên ảnh đại diện mặc định); 100% ảnh đại diện và ảnh bìa có văn bản thay thế dạng "Ảnh đại diện của {Họ tên}" / "Ảnh bìa của {Họ tên}"; 100% trường nhập có nhãn đọc được bằng trình đọc màn hình.
- NFR-8: Observability: 100% lần lưu ảnh, gỡ ảnh (do HV hoặc do GV), đổi mật khẩu (thành công hoặc thất bại) và lần mở S12 bị từ chối được ghi nhật ký có cấu trúc gồm thời điểm, mã người thực hiện, mã HV liên quan, loại thao tác và kết quả, không chứa họ tên, email, số điện thoại, mật khẩu hay nội dung ảnh, truy vết được trong ≥ 90 ngày.

## 7. Key Entities

- **Hồ sơ học viên** — cách nhìn của một tài khoản HV (001) dành cho hồ sơ: Họ tên, Email, Số điện thoại (do GV
  quản lý, HV chỉ xem), ảnh đại diện hiện tại, ảnh bìa hiện tại. Thuộc đúng một workspace (A3). Không có trường
  riêng nào khác trong MVP.
- **Ảnh hồ sơ** — một ảnh đại diện hoặc ảnh bìa đang dùng của một HV: loại (Ảnh đại diện / Ảnh bìa), phần ảnh đã
  cắt (tỷ lệ 1:1 hoặc 3:1, không lưu tệp gốc), thời điểm cập nhật. Mỗi HV có tối đa 1 ảnh mỗi loại; khi không có
  thì dùng ảnh mặc định (ảnh đại diện mặc định = chữ viết tắt trên nền màu cố định; ảnh bìa mặc định chung).
- **Thông báo gỡ ảnh** — ghi nhận GV đã gỡ ảnh của một HV: loại ảnh bị gỡ (một hoặc cả hai), thời điểm, trạng thái
  đã xem ("Đã hiểu"). Chỉ HV đó thấy.
- **Lớp học chung** — quan hệ suy ra (không nhập tay) giữa hai HV đã được kích hoạt cùng đang là thành viên của một
  lớp Đang học hoặc Đã kết thúc (AC-10.1). Quyết định quyền xem S12 và các lớp hiển thị trên S12.
- Tham chiếu (không thuộc module này): tài khoản HV, trạng thái kích hoạt/khóa/xóa, quy tắc mật khẩu và đổi mật
  khẩu (001); lớp, thành viên lớp, trạng thái lớp, danh sách "Thành viên" trên S02 (003); Điểm xếp hạng, hạng (008);
  tiến độ "Bộ bài tập x/y" (009); trạng thái Lưu trữ của bộ bài tập (002/005).

## 8. Edge Cases & Error Handling

- HV mở S10 trên hai thiết bị và lưu ảnh đại diện gần như cùng lúc: lần lưu sau cùng là ảnh hiện tại, ảnh kia bị
  thay thế và ngừng cung cấp (AC-5.3, AC-14.4).
- GV gỡ ảnh đúng lúc HV vừa thay ảnh mới: GV nhận "Ảnh đã được học viên thay đổi. Vui lòng xem lại ảnh mới." và
  ảnh mới không bị gỡ (AC-13.3).
- HV đổi ảnh ngay sau khi bị GV gỡ: được phép như bình thường, trong giới hạn 20 lần/24 giờ; thông báo gỡ ảnh vẫn
  hiển thị cho tới khi HV chọn "Đã hiểu" (AC-6.6, AC-13.2).
- GV gỡ cả ảnh đại diện và ảnh bìa trước khi HV mở S10: HV thấy một thông báo duy nhất "… ảnh đại diện và ảnh
  bìa …" (AC-13.2).
- Ảnh chụp bằng điện thoại bị xoay (ảnh dọc ghi hướng xoay trong tệp): khung cắt và ảnh đã lưu hiển thị đúng chiều
  (AC-5.2).
- Ảnh PNG có nền trong suốt: phần trong suốt hiển thị trên nền trắng trong khung cắt và sau khi lưu (AC-5.2, AC-5.3).
- Ảnh iPhone định dạng HEIC: nếu thiết bị không tự chuyển sang JPG khi chọn tệp, HV nhận "Chỉ hỗ trợ ảnh JPG, PNG
  hoặc WebP." (AC-6.1).
- Tệp đổi phần mở rộng thành .jpg nhưng thực chất là PDF hoặc tệp chạy: bị từ chối theo nội dung (AC-6.1).
- Ảnh GIF động: không thuộc định dạng hỗ trợ (AC-6.1); ảnh WebP động chỉ giữ khung hình đầu (AC-6.5).
- Ảnh đúng 10 MB: được chấp nhận; 10 MB + 1 byte bị từ chối trước khi tải lên (AC-6.2).
- Ảnh đúng kích thước tối thiểu (200 × 200 px cho ảnh đại diện, 900 × 300 px cho ảnh bìa): được chấp nhận; phóng
  to tối đa 3 lần để ảnh không quá nhòe (AC-5.2, AC-6.3).
- Mất mạng giữa lúc tải ảnh: giữ ảnh cũ, giữ vùng cắt, "Không tải được ảnh lên. Vui lòng thử lại." (AC-5.6).
- HV đóng ứng dụng khi khung cắt đang mở: không lưu gì (AC-5.4).
- Ảnh đại diện mặc định với họ tên đặc biệt: một từ ("An") → "A"; chữ Hán ("李明") → "李"; "Đặng Thu Hà" → "ĐH"
  (AC-7.2).
- GV đổi Họ tên HV: chữ viết tắt của ảnh mặc định đổi theo ở lần tải kế tiếp (AC-1.5, AC-7.2).
- HV bị gỡ khỏi lớp trong lúc bạn cùng lớp đang mở S12 của HV đó: lần tải lại kế tiếp bỏ lớp đó hoặc hiển thị A05
  nếu hết lớp chung (AC-11.1).
- Hai HV chỉ chung một lớp Sắp bắt đầu: chưa có lớp học chung, S12 hiển thị A05; khi lớp bắt đầu thì xem được
  (AC-10.1).
- Lớp được mở lại sau khi kết thúc: tiếp tục là lớp học chung, nhãn trở về "Đang học" (AC-10.1, AC-11.5).
- Lớp bị xóa (chỉ khi chưa có bài nộp theo 003): lớp biến mất khỏi S10 và không còn là lớp học chung (AC-11.2,
  AC-10.1).
- HV bị khóa: không đăng nhập được (001) nhưng hồ sơ vẫn hiển thị với bạn cùng lớp, không có nhãn "Đã khóa"
  (AC-11.3).
- HV bị xóa: S12 → A05, biến mất khỏi danh sách "Thành viên", ảnh bị xóa trong 24 giờ (AC-11.4).
- HV được GV thêm vào lớp nhưng chưa được kích hoạt (001): không xuất hiện trong danh sách "Thành viên", S12 → A05
  (AC-9.5, AC-10.3).
- HV bị gỡ rồi được thêm lại vào lớp: lớp xuất hiện lại trên S10/S12 với tiến độ và điểm từ các bài nộp còn lưu
  (003, 008, 009; AC-2.2, AC-8.2).
- Mọi bộ bài tập của lớp nằm trong section Bài tập đang ẩn: tiến độ "—" + "Chưa có bài tập", Điểm xếp hạng vẫn giữ
  (AC-2.4, AC-8.4, AC-11.6).
- Hai HV có cùng Họ tên trong lớp: phân biệt bằng ảnh đại diện; HV không thấy email (AC-9.4, AC-14.1).
- HV mở S12 bằng đường dẫn của bạn ở lớp đã bị gỡ khỏi: A05, giống hệt với người không tồn tại (AC-10.3).
- HV sao chép địa chỉ ảnh của bạn rồi bị gỡ khỏi lớp: địa chỉ không còn trả về ảnh (AC-14.3).
- Bảng xếp hạng chỉ có 10 hạng đầu: bạn cùng lớp ngoài top 10 xem được qua danh sách "Thành viên" (AC-9.2).
- Không tải được xếp hạng nhưng tải được tiến độ: hiển thị phần còn lại kèm "Chưa tải được xếp hạng" (AC-3.4).
- HV có Điểm xếp hạng 0,0 (kể cả khi chưa có bộ bài tập hay bài thi nào được tính): "0,0 điểm · Chưa có hạng" trên
  S10 và S12 (AC-2.2, AC-8.2).
- "Rank điểm đã làm bài thi": từ 2026-10-22 hạng và Điểm xếp hạng trên hồ sơ là giá trị 008 tính theo 30% × TB bài
  tập + 70% × TB bài thi (bài thi của 006); hồ sơ không hiển thị TB bài tập, TB bài thi hay điểm từng bài thi
  (AC-2.2, AC-8.2, AC-8.3).
- Lớp chưa có bài thi nào được tính: Điểm xếp hạng tối đa 30,0 theo 008; hồ sơ chỉ hiển thị đúng giá trị đó (AC-2.5).
- Bộ bài tập chưa có Hạn nộp trong lớp: không làm được và không vào y của "Bộ bài tập x/y" (AC-2.2, AC-2.4).
- Hạn nộp hoặc giờ đóng vừa qua khiến Điểm xếp hạng giảm: hồ sơ hiển thị giá trị mới ở lần mở hoặc tải lại kế tiếp,
  không có lịch sử điểm (AC-2.5, AC-8.3).

## 9. Out of Scope

- HV tự sửa Họ tên, Email, Số điện thoại (HV liên hệ GV; GV sửa theo 001).
- Các trường hồ sơ khác: giới thiệu bản thân, ngày sinh, mạng xã hội, biệt danh.
- Kết bạn, theo dõi, nhắn tin, bình luận, thả tim, "ai đã xem hồ sơ của tôi".
- Xem hồ sơ của HV không có lớp học chung, hồ sơ công khai, chia sẻ hồ sơ ra ngoài hệ thống.
- HV xem hồ sơ GV; ảnh đại diện của GV (T17).
- HV tự chọn ẩn tiến độ/điểm/hạng khỏi bạn cùng lớp (chờ Q-2).
- Kiểm duyệt ảnh tự động, nút "Báo cáo ảnh" cho HV, GV duyệt ảnh trước khi hiển thị (chờ Q-1), GV chặn HV đổi ảnh
  (nếu HV lạm dụng, GV khóa tài khoản theo 001).
- GV tải ảnh hoặc cắt ảnh hộ HV; GV khôi phục ảnh đã gỡ.
- Chi tiết điểm theo Bài, theo bộ bài tập hoặc lịch sử điểm của bạn cùng lớp (S12 chỉ có tổng của từng lớp chung).
- Ảnh động, video, khung ảnh trang trí, định dạng HEIC/GIF/BMP/TIFF; xoay ảnh thủ công trong khung cắt.
- Thông báo email hoặc đẩy khi ảnh bị gỡ (chỉ thông báo trong ứng dụng).
- Bắt buộc đổi mật khẩu ở lần đăng nhập đầu (A04 đã bỏ, V4-6); HV tự khôi phục mật khẩu qua email (HV liên hệ GV, 001).
- TB bài tập, TB bài thi, điểm từng bài thi hay danh sách bài thi trên hồ sơ (hồ sơ chỉ có Điểm xếp hạng tổng hợp và
  hạng theo 008; chi tiết nằm ở "Điểm của tôi" trên S09 của chính HV).
- **Hoãn:** hồ sơ hiển thị điểm bài nộp chấm tay (007 hoãn).

## 10. Assumptions & Dependencies

Quyết định của stakeholder được dùng: D1 (GV là quản trị viên duy nhất của workspace riêng), D4 (GV tạo tài khoản
HV; Họ tên là Họ tên GV nhập), D5 và X2 (ẩn section theo lớp; điểm đã đạt được giữ), V3-1 (chỉ theo dõi bộ bài tập),
V3-2 (Bài = Bài học · Bài tập), quyết định 2026-10-22 (Điểm xếp hạng = 30% × TB bài tập + 70% × TB bài thi; Bài thi
006 trở lại thành module độc lập; chỉ bộ bài tập có Hạn nộp trong lớp làm được và được tính), V4-6 (kích hoạt bằng email, không bắt buộc đổi mật khẩu lần đầu), V4-7 (hồ sơ
HV; xem hồ sơ = bạn cùng lớp; hồ sơ người khác chỉ hiện các lớp học chung, không email/SĐT).

Giả định được dùng: A3 (HV thuộc một workspace, có thể nhiều lớp), A4 (HV mobile-first 360–430 px; GV desktop), A5
(giao diện tiếng Việt, tên có thể có chữ Hán), A7 (giờ Việt Nam). A6 đã được V4-6 nới cho thư tài khoản; module này
không gửi email nào. Các giả định riêng của module ở §12 Session 2026-10-20 (v4).

Phụ thuộc module:

- **001** — tài khoản HV (Họ tên, Email, Số điện thoại, Ghi chú), trạng thái kích hoạt ("Chưa kích hoạt", "Đã kích
  hoạt", "Gửi email thất bại"), khóa/xóa; quy tắc mật khẩu tự đặt và đổi mật khẩu (thông báo, kết thúc phiên khác,
  giới hạn nhập sai); biết HV còn đang dùng mật khẩu do hệ thống gửi hay không (AC-4.5); "Đăng xuất"; định tuyến theo
  vai trò và A01, A05. **Cần 001 cập nhật:** chuyển phần hiển thị thông tin của S10 (AC-14.4 hiện tại) sang 011; đưa
  S12 vào phạm vi màn hình HV trong quy tắc định tuyến (AC-16.4 hiện ghi "S01–S10"); hiển thị ảnh đại diện trên T11.
- **003** — thành viên lớp, trạng thái lớp (Sắp bắt đầu / Đang học / Đã kết thúc), gỡ HV, xóa lớp; S01 (thứ tự lớp),
  S02. **Cần 003 bổ sung:** mục "Thành viên" trên S02 (danh sách thành viên hiện tại, chỉ ảnh đại diện + Họ tên, chạm
  mở S12/S10 — AC-9.2–AC-9.5) cho lớp Đang học hoặc Đã kết thúc; ảnh đại diện trên T04 tab Học viên.
- **008** — Điểm xếp hạng (0–100, một chữ số thập phân, 30% × TB bài tập + 70% × TB bài thi), hạng "Hạng r/N" /
  "Chưa có hạng"; quy tắc mục được tính (bộ có Hạn nộp, bài thi được giao cho lớp; đã nộp hoặc quá hạn = 0). **Cần
  008 bổ sung (đã có từ v4):** ảnh đại diện trên S09 và T04 tab
  Xếp hạng, chạm một dòng trên S09 mở S12 (AC-9.1). **Mâu thuẫn cần 008 sửa:** AC-9.1 và NFR-7 của 008 chỉ cho HV thấy
  họ tên, hạng, điểm của 10 hạng đầu; V4-7 (ràng buộc) cho HV thấy Điểm xếp hạng và hạng của mọi bạn có lớp học chung
  trên S12. 008 Q-2 (họ tên đầy đủ hay rút gọn) áp dụng cả cho S12.
- **009** — định nghĩa tiến độ (Tiến độ tổng, "Bộ bài tập x/y", bộ bài tập được tính, "—"/"Chưa có bài tập"); T15.
  **Cần 009 xác nhận (2026-10-22):** mẫu số của tiến độ = bộ bài tập đang hiển thị với HV có Hạn nộp trong lớp, tử số
  = số bộ trong đó HV đã nộp (khớp "Bộ bài tập đã nộp x/y" của 008 AC-11.2).
  **Cần 009 bổ sung:** ảnh đại diện và ảnh bìa ở phần đầu T15 cùng khung xem ảnh và "Gỡ ảnh" (AC-12.2, AC-12.3,
  REQ-13); thêm S10, S12 vào quy tắc nhất quán chỉ số (009 AC-4.6).
- **002, 003, 005, 006** — gián tiếp qua 008/009: bộ bài tập Lưu trữ, section ẩn, Hạn nộp theo lớp, bài nộp, bài thi
  được giao cho lớp và điểm bài thi.
- **007, 010** — không phụ thuộc trong MVP.

## 11. Open Questions

- Q-1 (AC-5.3) [NEEDS CLARIFICATION: Ảnh HV vừa lưu được hiển thị ngay cho bạn cùng lớp (GV chỉ gỡ khi thấy không phù hợp — đề xuất), hay phải chờ GV duyệt trước khi người khác thấy?] — Ảnh hưởng: luồng F-2, F-5, thêm trạng thái "Chờ duyệt" cho ảnh và hàng chờ duyệt ảnh cho GV. **Đề xuất:** hiển thị ngay, GV gỡ khi cần (REQ-13) — lớp khép kín do GV quản lý, ít ma sát cho HV, GV không phải duyệt hàng trăm ảnh; đang áp dụng tạm.
- Q-2 (AC-8.2) [NEEDS CLARIFICATION: HV có được tự chọn ẩn tiến độ, điểm và hạng của mình khỏi S12 với bạn cùng lớp không (đề xuất: không trong MVP — mọi bạn cùng lớp đều thấy)?] — Ảnh hưởng: S10 (thêm công tắc), S12 (trạng thái "Học viên này đã ẩn tiến độ"), quyền riêng tư của HV điểm thấp hoặc HV vị thành niên. **Đề xuất:** không trong MVP, đúng yêu cầu "các học viên có thể xem profile qua lại của nhau"; xem lại sau khi có phản hồi.

## 12. Clarifications Log

### Session 2026-10-18

- Q: Ai quản trị dữ liệu HV? → A: Mỗi GV là quản trị viên duy nhất của workspace riêng; GV không thấy HV của GV khác (source: stakeholder — D1)
- Q: Ai tạo tài khoản HV và Họ tên lấy từ đâu? → A: GV tạo; Họ tên trên hồ sơ là Họ tên GV nhập (source: stakeholder — D4)
- Q: HV có thể thuộc nhiều lớp? → A: Có, trong cùng một workspace (source: assumption — A3, owner 001/003)
- Q: Thiết bị? → A: S10, S12 mobile-first 360–430 px; T11, T04, T15 desktop ≥ 1280 px, dùng được ≥ 1024 px (source: assumption — A4)
- Q: Ngôn ngữ? → A: Giao diện tiếng Việt; Họ tên và tên lớp có thể chứa chữ Hán (source: assumption — A5)
- Q: Múi giờ? → A: Giờ Việt Nam UTC+7 (source: assumption — A7)

### Session 2026-10-19

- Q: Khi GV ẩn section Bài tập trong một lớp, hồ sơ hiển thị gì? → A: HV không thấy nội dung ẩn kể cả kết quả cũ; điểm đã đạt được giữ; tiến độ không tính phần ẩn (source: stakeholder — X2, D5)
- Q: Màn hình khi không có quyền hoặc không tồn tại? → A: A05 "Không tìm thấy nội dung" (source: stakeholder — v2 inventory)

### Session 2026-10-20

- [thay thế 2026-10-22] Q: Tiến độ trên hồ sơ đo gì? → A: Chỉ bộ bài tập đã làm / bộ bài tập được tính (định nghĩa 009); không theo dõi xem bài học hay thời lượng (source: stakeholder — V3-1)
- [thay thế 2026-10-22] Q: Bài thi có trên hồ sơ không? → A: Không; 006 hoãn sau MVP (source: stakeholder — V3-2)

### Session 2026-10-20 (v4)

- Q: Hồ sơ HV gồm gì? → A: "về phần setting profile học viên có thể change password, upload avt…, upload ảnh bìa, và show thông tin cá nhân như đang học lớp nào, tiến độ làm bài tập, và rank điểm đã làm bài thi trong lớp học đó, và các học viên có thể xem profile qua lại của nhau" (source: stakeholder)
- Q: Ai được xem hồ sơ của HV khác? → A: Bạn cùng lớp; hồ sơ người khác chỉ hiện thông tin các lớp học chung, không email/SĐT (source: stakeholder)
- Q: HV có bị bắt buộc đổi mật khẩu lần đầu? → A: Không; HV đổi bất kỳ lúc nào trên hồ sơ (source: stakeholder — V4-6)
- [thay thế 2026-10-22] Q: "Rank điểm đã làm bài thi" khi Bài thi hoãn? → A: Hạng và Điểm xếp hạng từ bộ bài tập theo 008 (source: stakeholder — V4-7 brief)
- Q: HV có được tự sửa Họ tên hoặc Số điện thoại? → A: Không; HV liên hệ GV (AC-1.3) (source: assumption — khuyến nghị của brief V4-7; giữ một nguồn sự thật do GV quản lý, tránh đổi tên hiển thị trên bảng xếp hạng)
- Q: Danh sách thành viên lớp cho HV nằm ở đâu? → A: Mục "Thành viên" trên S02, do 003 sở hữu và bổ sung lối vào S12 (AC-9.2) (source: assumption — khuyến nghị của brief V4-7; S02 là nơi HV xem mọi thứ của một lớp)
- Q: GV có được gỡ ảnh không phù hợp? → A: Có, "Gỡ ảnh" cho ảnh đại diện và ảnh bìa, HV nhận thông báo trong ứng dụng (REQ-13) (source: assumption — khuyến nghị của brief V4-7)
- Q: Lớp Đã kết thúc còn hiển thị và còn tính là lớp học chung? → A: Có cả hai; hiển thị nhãn "Đã kết thúc" với số liệu hiện hành (AC-11.5) (source: assumption — nhất quán với S01 và S09 vẫn cho xem lớp Đã kết thúc kèm bảng xếp hạng cuối cùng)
- Q: Lớp Sắp bắt đầu có tính là lớp học chung? → A: Không (AC-10.1) (source: assumption — trước ngày bắt đầu S02 và S09 chưa hiển thị nội dung hay thành viên; bảo thủ về quyền riêng tư)
- Q: HV chưa được kích hoạt có xuất hiện với bạn cùng lớp? → A: Không, cho tới khi được kích hoạt (AC-9.5, AC-10.1) (source: assumption — chưa có tài khoản đăng nhập, email có thể sai người)
- Q: HV bị khóa có còn hồ sơ với bạn cùng lớp? → A: Có, không có nhãn khóa (AC-11.3) (source: assumption — nhất quán với 008 AC-5.4 giữ HV bị khóa trên bảng xếp hạng; không tiết lộ trạng thái tài khoản)
- Q: Định dạng, dung lượng, kích thước và cắt ảnh? → A: JPG/PNG/WebP, ≤ 10 MB, ảnh đại diện ≥ 200 × 200 px cắt 1:1 (hiển thị tròn), ảnh bìa ≥ 900 × 300 px cắt 3:1, tối đa 8.000 px mỗi chiều, phóng to tối đa 3 lần, không lưu tệp gốc, xóa thông tin vị trí (REQ-5, REQ-6, AC-14.5, AC-14.6) (source: assumption — đủ cho ảnh điện thoại phổ biến 3–8 MB, tối thiểu dữ liệu cá nhân)
- Q: Giới hạn số lần đổi ảnh? → A: 20 lần lưu mỗi 24 giờ mỗi HV (AC-6.6) (source: assumption — hạn chế lạm dụng sau khi GV gỡ ảnh, không ảnh hưởng người dùng bình thường)

### Session 2026-10-22 (đồng bộ prototype)

Quyết định của bên liên quan ngày 2026-10-22: prototype `specs/screen-flow-design.html` là chuẩn cho câu chữ giao diện và cho hành vi nó thể hiện; spec được sửa theo prototype.

- Q: HV đổi ảnh bắt đầu thế nào? → A: Nút máy ảnh trên ảnh mở bảng chọn "Đổi ảnh đại diện" / "Đổi ảnh bìa" gồm tệp từ thiết bị, "Chụp ảnh" và (khi có ảnh riêng) "Gỡ ảnh đại diện" / "Gỡ ảnh bìa"; lỗi tệp hiện ngay trong bảng chọn (AC-5.1). (source: stakeholder "prototype là chuẩn")
- Q: Gỡ ảnh xong HV thấy gì? → A: Thông báo "Đã gỡ ảnh đại diện." hoặc "Đã gỡ ảnh bìa." (AC-7.1). (source: stakeholder "prototype là chuẩn")
- Q: Biểu mẫu đổi mật khẩu có quy tắc hiển thị khi gõ không? → A: Có, danh sách quy tắc của 001 AC-2.3 được đánh dấu đạt/chưa đạt dưới "Mật khẩu mới" (AC-4.1). (source: stakeholder "prototype là chuẩn")
- Q: Chạm vào đâu trên thẻ lớp ở S10 để mở S02? → A: Chạm tên lớp (thẻ còn liên kết "Xem xếp hạng ›" tới S09) (AC-3.1). (source: stakeholder "prototype là chuẩn")
- Q: Khung xem ảnh của GV hiển thị gì khi HV chưa có ảnh riêng? → A: Tiêu đề "Ảnh đại diện · {Họ tên}" / "Ảnh bìa · {Họ tên}" và dòng "Học viên đang dùng … mặc định.", không có "Gỡ ảnh" (AC-12.3). (source: stakeholder "prototype là chuẩn")
- Chỉ đổi câu chữ (không đổi hành vi): tiêu đề "Hồ sơ học viên" và khối "Lớp học chung (n)" của S12 (AC-8.1); chú thích "Các phiên khác sẽ bị đăng xuất" của dòng Đổi mật khẩu (AC-4.1); nút Đăng xuất tham chiếu hộp thoại xác nhận của 001 AC-5.1 (AC-1.1). Giữ nguyên vì prototype không mô phỏng: lỗi tải hồ sơ / xếp hạng / ảnh (AC-1.6, AC-3.4, AC-5.6, AC-8.6), tiến trình và "Hủy tải lên" (AC-5.5), các lỗi tệp ảnh không có tệp mẫu (AC-6.3 ảnh quá lớn, AC-6.4, AC-6.6), xung đột khi GV gỡ ảnh (AC-13.3). (source: stakeholder "prototype là chuẩn")

### Session 2026-10-22 (điểm 30/70)

Áp dụng quyết định của stakeholder ngày 2026-10-22 về Điểm xếp hạng (chi tiết ở 008 §12 cùng tên phiên). Không đánh số lại, không thêm hay bỏ AC; viết lại AC-2.2, AC-2.4, AC-8.2, AC-8.3, AC-8.4, AC-11.6; cập nhật §1, US-1, §8, §9, §10. Chưa có artifact hạ nguồn.

- Q: Quy tắc tính Điểm xếp hạng mới? → A: Nguyên văn: "quy tắc tính điểm xếp hạng: điểm làm những bài tập trên lớp cộng lại chia trung bình chiếm 30%, điểm của những bài thi cộng lại chia trung bình chiếm 70%, tổng 2 điểm này lại ra final xếp hạng." → Điểm xếp hạng trên S10, S12 là giá trị 008 tính: 30% × TB bài tập + 70% × TB bài thi, thang 0–100 (AC-2.2, AC-8.2) (source: stakeholder)
- Q: Bộ bài tập nào làm được và được tính? → A: Nguyên văn: "bài tập thì vẫn hiện full nhưng sẽ chỉ enable bài tập nào GV đã set deadline trước đó thì mới có thể làm được và tính điểm" → "Bộ bài tập x/y" trên hồ sơ: y = số bộ đang hiển thị với HV có Hạn nộp trong lớp, x = số bộ HV đã nộp; "—" + "Chưa có bài tập" khi lớp chưa có bộ nào có Hạn nộp (AC-2.2, AC-2.4, AC-8.4) (source: stakeholder)
- Q: Trung bình gồm những mục nào? → A: Mục được tính khi HV đã nộp, hoặc khi Hạn nộp / giờ đóng qua mà chưa nộp (= 0); chưa có mục nào thì TB = 0 — do 008 sở hữu, 011 chỉ hiển thị (source: stakeholder)
- Q: Hiển thị Điểm xếp hạng trên hồ sơ thế nào? → A: "{n} điểm" với một chữ số thập phân và dấu phẩy thập phân (ví dụ "74,2 điểm", "0,0 điểm"), đúng giá trị 008 (AC-2.2, AC-8.2) (source: assumption — theo quy tắc làm tròn của 008 AC-1.10; một nguồn số liệu, AC-2.5)
- Q: Hồ sơ có hiển thị TB bài tập, TB bài thi hay điểm từng bài thi? → A: Không trên S10 lẫn S12; chỉ Điểm xếp hạng và hạng; S12 không gửi các trường đó tới thiết bị người xem (AC-8.3, §9) (source: assumption — tối thiểu dữ liệu chia sẻ, nhất quán với 008 AC-9.1; HV xem thành phần của chính mình ở S09 "Điểm của tôi")
- Q: Nội dung ẩn, lưu trữ, bài thi đã gỡ ảnh hưởng hồ sơ thế nào? → A: Tiến độ không tính các bộ đó; Điểm xếp hạng theo 008 (bài đã nộp vẫn được tính, mục chưa nộp không tính); không lộ tên, số lượng hay chi tiết (AC-11.6) (source: assumption — theo quy tắc REQ-4 của 008)
- Q: "Rank điểm đã làm bài thi" nay hiểu thế nào? → A: Hạng theo Điểm xếp hạng 30/70 của 008, đã gồm điểm bài thi; thay mục cùng câu hỏi của phiên 2026-10-20 (v4) (source: stakeholder — quyết định 2026-10-22)
