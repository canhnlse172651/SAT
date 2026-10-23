---
id: 003
slug: classes
title: Class Management
status: tasked
branch: feat/003-classes
created: 2026-10-18
updated: 2026-10-23
approved_by: canh
approved_at: 2026-10-23
---

# Class Management

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

Bản trình bày chi tiết (luồng nghiệp vụ, sơ đồ, quy tắc, màn hình): [spec.html](spec.html). Phiên bản nội dung: v3 (2026-10-20) — mỗi Bài có 2 phần Bài học · Bài tập, ẩn/hiện phần theo lớp (D5), chỉ theo dõi việc HV làm bài tập (V3-1); bỏ lộ trình và Bài thi. Bổ sung v4 (2026-10-20): danh sách Thành viên lớp cho HV ở S02 mở hồ sơ S12 (011), ảnh đại diện ở tab Học viên của T04, HV "Chưa kích hoạt" được thêm vào lớp (V4-6, V4-7); bỏ A04. Bổ sung v8 (2026-10-21): hạn nộp cho từng bộ bài tập theo lớp ở tab Nội dung của T04, nhãn "Hạn nộp" / "Hạn hôm nay" / "Quá hạn" cho HV ở S11 và S05, và email nhắc lúc 08:00 ngày đến hạn cho HV chưa nộp (V8-1, V8-2). Bổ sung v11 (2026-10-22): mỗi HV chỉ nộp mỗi bộ bài tập một lần trong lớp (V11-1 của 005, thay X1) — S11 hiển thị "Đã hoàn thành · {điểm}/{điểm tối đa}" của bài nộp duy nhất, chạm vào mở S06 "Xem lại bài làm", S02 và S11 không có "Làm lại" (V11-3). Bổ sung 2026-10-22 (bài tập theo hạn nộp): HV thấy và học được mọi Bài, mọi bước học của lớp theo bất kỳ thứ tự nào, không khóa tuần tự (AC-19.8); HV thấy mọi bộ bài tập đã xuất bản nhưng chỉ làm được (và được tính điểm — 005, 008) bộ mà GV đã đặt hạn nộp ở lớp — bộ chưa có hạn hiện "Chưa mở" · "Giáo viên chưa đặt hạn nộp" và không mở được (AC-19.3, AC-19.9, AC-13.7); tab Nội dung cho GV biết bộ nào "Chưa mở với học viên" và cảnh báo rằng xóa hạn sẽ đóng bộ với HV (AC-21.7, AC-21.8). Cùng ngày, theo 006 (bài thi độc lập giao cho lớp): bài nộp bài thi chặn xóa lớp (AC-11.3), xóa lớp bỏ lớp khỏi bài thi (AC-11.5), S02 có lối vào "Bài thi của lớp ({N})" → S07 (AC-13.8), ẩn/hiện phần không áp dụng cho bài thi (AC-17.8).

## 1. Summary

Giáo viên (GV) dạy tiếng Trung cần gom học viên (HV) thành lớp, gắn mỗi lớp với một giáo trình HSK và quyết định từ ngày nào HV được học — đúng luồng stakeholder mô tả: tạo lớp → đặt tên lớp → chọn ngày bắt đầu → thêm từng tài khoản HV → chọn giáo trình phù hợp. Một giáo trình gồm các Bài (Bài 1, Bài 2, …), mỗi Bài có đúng 2 phần Bài học · Bài tập (V3-2). Module 003 cung cấp cho GV wizard tạo lớp 4 bước (T03), danh sách lớp (T02) và chi tiết lớp (T04 — tab Tổng quan, Học viên, Nội dung) để quản lý thông tin, sĩ số, giáo trình, vòng đời lớp (Sắp bắt đầu → Đang học → Đã kết thúc) và — theo quyết định D5 — ẩn/hiện từng phần của từng Bài **chỉ cho lớp đó**. Ở phía HV, module cung cấp "Lớp của tôi" (S01), trang lớp (S02) liệt kê các Bài kèm tiến độ bài tập của chính HV ở từng Bài, và trang bài (S11) với hai tab Bài học · Bài tập; nội dung chỉ mở từ ngày bắt đầu, phần bị ẩn biến mất hoàn toàn với HV của lớp (kể cả kết quả cũ), và lớp đã kết thúc chuyển sang chế độ chỉ xem lại. Hệ thống chỉ theo dõi việc HV làm các bộ bài tập; việc xem bài học không được theo dõi (V3-1). Từ v4, HV xem được danh sách Thành viên của lớp (ảnh đại diện, họ tên) ở S02 và chạm vào một bạn cùng lớp để mở hồ sơ S12 (module 011); GV thấy ảnh đại diện và trạng thái tài khoản của HV ở tab Học viên; HV mà GV đã thêm bằng email nhưng chưa kích hoạt (V4-6) vẫn được thêm vào lớp, chỉ GV thấy, cho tới khi được kích hoạt. Từ v8, GV đặt **hạn nộp** cho từng bộ bài tập riêng cho từng lớp ở tab Nội dung của T04 (từng bộ hoặc mọi bộ của một Bài, bằng lịch chọn dạng popup; hạn là 23:59 giờ Việt Nam của ngày đã chọn); HV thấy "Hạn nộp dd/MM", "Hạn hôm nay" hoặc "Quá hạn" trên bộ bài tập ở S11 và S05; và lúc 08:00 ngày đến hạn, hệ thống gửi cho mỗi HV đủ điều kiện chưa nộp, theo từng lớp, một email tiếng Việt gộp mọi bộ bài tập của lớp đó đến hạn hôm đó. HV vẫn nộp được sau hạn (bài nộp được 005 đánh dấu "Nộp muộn"). Từ 2026-10-22, hạn nộp còn là **công tắc mở bài tập**: HV của lớp Đang học xem và học được mọi Bài, mọi bước học theo bất kỳ thứ tự nào, thấy mọi bộ bài tập đã xuất bản, nhưng chỉ làm được bộ mà GV đã đặt hạn nộp ở lớp đó; bộ chưa có hạn hiện "Chưa mở" kèm "Giáo viên chưa đặt hạn nộp"; đặt hạn mở bộ ngay, xóa hạn đóng bộ với HV chưa nộp (bài đã nộp và điểm được giữ).

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| GV tạo lớp nhanh theo đúng luồng stakeholder | Thời gian trung vị để một GV lần đầu tạo lớp có 10 HV sẵn có và 1 giáo trình | ≤ 3 phút |
| Ít bỏ dở khi tạo lớp | Tỉ lệ lượt mở T03 kết thúc bằng một lớp được tạo | ≥ 80% |
| HV vào học không vướng | Số lần chạm từ S01 tới một bước học của lớp Đang học | ≤ 3 lần chạm |
| Lớp sẵn sàng giảng dạy | Tỉ lệ lớp Đang học có ≥ 1 HV và giáo trình có ≥ 1 Bài đã xuất bản | ≥ 90% |
| Ẩn/hiện đúng phạm vi lớp | Số trường hợp HV thấy nội dung hoặc kết quả của một phần đang ẩn ở lớp mình, hoặc HV lớp khác bị ảnh hưởng bởi thiết lập ẩn của lớp này | 0 |
| GV điều chỉnh nội dung của lớp nhanh | Thời gian trung vị để GV ẩn phần Bài tập của mọi Bài trong một lớp, tính từ lúc mở T04 | ≤ 30 giây |
| Cô lập dữ liệu giữa các GV | Số trường hợp GV hoặc HV xem được lớp không thuộc mình | 0 |
| GV đặt hạn nộp nhanh (v8) | Thời gian trung vị để GV đặt cùng một hạn nộp cho mọi bộ bài tập của một Bài, tính từ lúc mở tab Nội dung | ≤ 20 giây |
| Nhắc đúng người, đúng lúc (v8) | Tỉ lệ HV đủ điều kiện (AC-24.2) có email nhắc được chuyển cho dịch vụ gửi thư trước 08:15 giờ Việt Nam của ngày đến hạn | ≥ 99% |
| Không làm phiền HV (v8) | Số email nhắc gửi cho HV không đủ điều kiện, hoặc số HV nhận hơn một email nhắc cho cùng một lớp trong một ngày | 0 |

## 3. Actors & Context

- **Giáo viên (GV)** — chủ và quản trị viên duy nhất của workspace của mình (D1); làm việc trên máy tính (A4). Dùng module này khi mở khóa học mới, khi HV nhập học muộn hoặc nghỉ, khi cần sửa thông tin lớp, khi muốn điều chỉnh nội dung riêng cho một lớp (ví dụ lớp ôn tập chỉ làm bài tập, lớp chỉ đọc bài học) và khi khóa học kết thúc. Hiện nay GV thường quản lý lớp bằng nhóm chat, bảng tính và gửi tài liệu thủ công — không có nơi gắn HV với một giáo trình HSK, điều chỉnh nội dung theo từng lớp và biết ai đã làm bài tập nào.
- **Học viên (HV)** — tài khoản do GV thêm bằng email và kích hoạt (D4, V4-6), thuộc đúng một workspace và có thể ở nhiều lớp của GV đó (A3); chủ yếu dùng điện thoại (A4). Vào S01 ngay sau khi đăng nhập, chọn lớp (S02), chọn Bài (S11) rồi xem bài học hoặc làm bài tập; ở S02 xem được các bạn cùng lớp và mở hồ sơ của họ (S12, module 011).
- **Hệ thống (theo thời gian)** — tự chuyển lớp từ Sắp bắt đầu sang Đang học lúc 00:00 giờ Việt Nam (UTC+7) của ngày bắt đầu (A7, A9); từ v8, lúc 08:00 giờ Việt Nam mỗi ngày gửi email nhắc hạn nộp cho HV chưa nộp bộ bài tập đến hạn hôm đó (REQ-24).
- **Ngữ cảnh** — lớp là điểm nối giữa HV (001), giáo trình và các Bài (002), nội dung hai phần: bài học (004) và bài tập (005); xếp hạng (008) và tiến độ bài tập (009) đều được tính theo lớp. Thiết lập ẩn/hiện của lớp quyết định HV của lớp thấy phần nào. Chấm tay (007) bị hoãn sau MVP nên không có trạng thái "Chờ chấm". [thay thế 2026-10-22: Bài thi (006) nay là module độc lập giao bài thi cho lớp — lịch thi, kết quả thi thuộc 006; 003 chỉ có lối vào "Bài thi của lớp" ở S02 (AC-13.8), tính bài nộp bài thi khi chặn xóa lớp (AC-11.3) và bỏ lớp khỏi bài thi khi xóa lớp (AC-11.5).] Nội dung do AI tạo (010) chỉ vào Bài khi GV duyệt (V3-4). Hồ sơ HV (S10 "Hồ sơ của tôi", S12 "Hồ sơ học viên") và ảnh đại diện thuộc module 011; 003 chỉ cung cấp lối vào S12 từ danh sách Thành viên của lớp. Từ v8, hạn nộp của bộ bài tập thuộc lớp (003); nhãn "Nộp muộn" và trạng thái bộ bài tập thuộc 005; danh sách Đã làm / Chưa làm theo bộ bài tập ở T01, T04 tab Tiến độ thuộc 009; quy tắc chung về thư (ngôn ngữ, tên người gửi, dịch vụ gửi thư) thuộc 001.

## 4. User Stories

- US-1 (P1): Là GV, tôi muốn tạo lớp qua wizard 4 bước (thông tin lớp → thêm học viên → chọn giáo trình → xác nhận), để HV của tôi vào học đúng giáo trình từ ngày bắt đầu.
  - Why this priority: Đây là luồng cốt lõi stakeholder mô tả; không có lớp thì HV không có nơi học và mọi module khác không có ngữ cảnh.
  - Independent test: Với workspace có 3 HV và 1 giáo trình HSK1 có ít nhất 1 Bài đã xuất bản, GV hoàn thành T03 → T04 hiển thị lớp mới với đúng 3 HV và giáo trình đó; HV đăng nhập thấy lớp trong S01.
- US-2 (P1): Là GV, tôi muốn xem danh sách lớp, xem chi tiết từng lớp và sửa thông tin lớp (tên, ngày bắt đầu, mô tả, lịch học), để nắm và giữ đúng thông tin các lớp mình đang dạy.
  - Why this priority: Là điểm vào của mọi thao tác quản lý lớp; thiếu nó GV không tìm lại được lớp đã tạo.
  - Independent test: Với 25 lớp ở các trạng thái khác nhau, T02 lọc, tìm và phân trang đúng; mở một lớp thấy T04 đúng dữ liệu và đúng 5 tab; đổi tên lớp → tên mới hiển thị ở T02 và S01.
- US-3 (P1): Là GV, tôi muốn thêm hoặc gỡ HV khỏi lớp sau khi đã tạo lớp, để cập nhật sĩ số khi HV nhập học muộn hoặc nghỉ học.
  - Why this priority: Sĩ số thay đổi liên tục trong thực tế; thiếu chức năng này GV phải tạo lại lớp.
  - Independent test: Thêm 2 HV vào một lớp Đang học → hai HV thấy lớp ở S01; gỡ 1 HV → HV đó không còn thấy lớp và không mở được S02.
- US-4 (P1): Là HV, tôi muốn thấy các lớp của mình và trong mỗi lớp thấy danh sách Bài kèm tiến độ bài tập của chính mình ở từng Bài, để biết mình đã làm bài tập tới đâu và cần học Bài nào tiếp.
  - Why this priority: Hiện thực trực tiếp yêu cầu "học viên khi vào lớp sẽ thấy các hệ thống bài giảng và bài tập của lớp đó" theo cấu trúc Bài; tiến độ chỉ đếm bài tập (V3-1).
  - Independent test: Lớp Đang học dùng giáo trình có 3 Bài đã xuất bản và 1 Bài Nháp; HV mở S01 → S02 thấy đúng 3 Bài theo thứ tự giáo trình, mỗi Bài có tiến độ bài tập dạng "{số bộ đã hoàn thành}/{số bộ được tính} bộ bài tập"; một lớp Sắp bắt đầu chỉ hiển thị thông điệp khóa.
- US-5 (P1): Là HV, tôi muốn mở một Bài và thấy riêng phần Bài học và phần Bài tập của Bài đó, để đọc bài học và làm bài tập theo thứ tự giáo viên sắp xếp nhưng vẫn tự do mở mục mình cần.
  - Why this priority: Mỗi Bài là đơn vị học; không có trang bài thì HV không tiếp cận được bước học và bộ bài tập.
  - Independent test: Bài 1 có 3 bước học và 2 bộ bài tập đã xuất bản, cả hai đã có hạn nộp chưa qua ở lớp; HV mở S11 → tab Bài học liệt kê đúng 3 bước theo thứ tự GV sắp, tab Bài tập liệt kê đúng 2 bộ với số câu hỏi và trạng thái "Chưa làm"; HV mở bộ 2 trước bộ 1 được; sau khi nộp bộ 2, bộ 2 hiển thị "Đã hoàn thành · {điểm}/{điểm tối đa}", không có "Làm lại", chạm vào mở S06 "Xem lại bài làm", và tiến độ Bài thành "1/2 bộ bài tập".
- US-6 (P1): Là GV, tôi muốn ẩn hoặc hiện từng phần Bài học / Bài tập của từng Bài chỉ cho một lớp, để điều chỉnh nội dung theo nhịp và mục tiêu riêng của lớp mà không ảnh hưởng các lớp khác dùng cùng giáo trình.
  - Why this priority: Quyết định D5 của stakeholder; một giáo trình được nhiều lớp dùng (A2) nên điều chỉnh phải theo lớp.
  - Independent test: Hai lớp A, B dùng cùng giáo trình; ở T04 của lớp A, GV ẩn phần Bài tập của Bài 2 → HV lớp A không còn thấy các bộ bài tập đó và kết quả cũ của mình, HV lớp B vẫn thấy; GV hiện lại → HV lớp A thấy lại các bộ bài tập cùng kết quả cũ.
- US-7 (P2): Là GV, tôi muốn kết thúc và khi cần thì mở lại một lớp, để khi khóa học xong HV chỉ còn xem lại được và danh sách lớp đang dạy gọn gàng.
  - Why this priority: Cần cho vận hành dài hạn nhưng không chặn việc dạy và học của khóa đầu tiên.
  - Independent test: Kết thúc một lớp Đang học → HV thấy biểu ngữ "Lớp đã kết thúc" ở S02 và S11, không bắt đầu được bài mới; mở lại → HV làm bài được.
- US-8 (P2): Là GV, tôi muốn đổi giáo trình của lớp khi lớp chưa có bài nộp, để sửa việc chọn nhầm giáo trình lúc tạo lớp.
  - Why this priority: Lỗi chọn nhầm có thể khắc phục bằng xóa và tạo lại lớp khi chưa có bài nộp, nên không thuộc MVP tối thiểu.
  - Independent test: Đổi giáo trình của một lớp Sắp bắt đầu → S02 của HV hiển thị các Bài của giáo trình mới và thiết lập ẩn được đặt lại; thử đổi ở lớp đã có bài nộp → bị chặn.
- US-9 (P3): Là GV, tôi muốn xóa một lớp tạo nhầm khi lớp chưa có bài nộp, để danh sách lớp không còn lớp rác.
  - Why this priority: Tiện ích; kết thúc lớp đã đáp ứng phần lớn nhu cầu dọn dẹp.
  - Independent test: Xóa một lớp Sắp bắt đầu có 2 HV → lớp biến mất ở T02 và S01 của 2 HV, tài khoản HV còn nguyên; lớp đã có bài nộp không xóa được.
- US-10 (P2): Là HV, tôi muốn xem danh sách thành viên của lớp (ảnh đại diện, họ tên) và mở hồ sơ của một bạn cùng lớp, để biết mình học cùng ai và xem tiến độ, xếp hạng của bạn trong lớp chung.
  - Why this priority: Stakeholder yêu cầu "các học viên có thể xem profile qua lại của nhau" (V4-7); không chặn việc dạy và học, và S09 (008) đã là một lối vào S12, nên là P2.
  - Independent test: Lớp có 4 HV đã kích hoạt (An, Bình, Chi, Dũng) và 1 HV "Chưa kích hoạt" (Em); An mở S02 → "Thành viên (4)" liệt kê An với nhãn "Bạn" đứng đầu rồi Bình, Chi, Dũng, mỗi dòng có ảnh đại diện và họ tên, không có Em và không có email; An chạm Bình → S12 hồ sơ của Bình mở ra.
- US-11 (P1): Là GV, tôi muốn đặt, đổi hoặc xóa hạn nộp cho từng bộ bài tập riêng cho từng lớp (từng bộ hoặc mọi bộ của một Bài), để HV của lớp biết phải làm bài tập nào trước ngày nào mà không ảnh hưởng các lớp khác dùng cùng giáo trình.
  - Why this priority: Stakeholder v8: "mỗi bài tập sẽ được GV setting ngày deadline"; hạn nộp là cơ sở cho nhãn của HV, email nhắc và nhãn "Nộp muộn" (005).
  - Independent test: Hai lớp A, B dùng cùng giáo trình; ở tab Nội dung của lớp A, GV chọn ô hạn nộp của bộ 1 thuộc Bài 2, chọn ngày 30/10/2026 trên lịch popup và bấm "Áp dụng" → ô hiển thị "30/10/2026"; tab Nội dung của lớp B vẫn hiển thị "Đặt hạn" cho bộ đó; GV chọn ô "Đặt hạn cho mọi bộ của bài" ở Bài 3 với ngày 05/11/2026 → mọi bộ đã xuất bản của Bài 3 hiển thị "05/11/2026"; GV mở lịch của bộ 1 và bấm "Xóa" → ô về "Đặt hạn".
- US-12 (P1): Là HV, tôi muốn thấy hạn nộp của từng bộ bài tập và biết bộ nào hết hạn hôm nay hoặc đã quá hạn, để sắp xếp thời gian làm bài.
  - Why this priority: Không có phần hiển thị này thì hạn nộp GV đặt không tới được HV.
  - Independent test: Lớp Đang học, hôm nay 21/10/2026; bộ X hạn 25/10, bộ Y hạn 21/10, bộ Z hạn 18/10, bộ W không có hạn, HV chưa làm bộ nào → tab Bài tập ở S11 hiển thị "Hạn nộp 25/10" ở X, "Hạn hôm nay" ở Y, "Quá hạn" ở Z, và ở W không có nhãn hạn mà có "Chưa mở" · "Giáo viên chưa đặt hạn nộp" ở dạng bị vô hiệu; HV mở Z và nộp được; chạm W không mở gì.
- US-13 (P1): Là HV, tôi muốn nhận một email nhắc vào buổi sáng ngày đến hạn khi tôi chưa nộp bộ bài tập, để không quên nộp bài.
  - Why this priority: Stakeholder v8: "dựa vào deadline theo từng bài đó hệ thống sẽ gửi mail nhắc học viên chưa làm bài tập ngày hôm đó".
  - Independent test: Lớp Đang học có 3 HV đã kích hoạt (An đã nộp bộ X, Bình chưa nộp, Chi chưa nộp nhưng bị khóa) và bộ X, Y cùng hạn hôm nay; lúc 08:00 giờ Việt Nam, Bình nhận đúng một email của lớp đó liệt kê X và Y kèm tên Bài, hạn nộp và nút "Làm bài ngay"; An nhận email chỉ có Y; Chi không nhận email nào.
- US-14 (P1): Là HV, tôi muốn học trước mọi Bài và mọi bước học của lớp theo bất kỳ thứ tự nào, và thấy trước mọi bộ bài tập nhưng chỉ làm những bộ giáo viên đã giao (đã đặt hạn nộp); là GV, tôi muốn việc đặt hạn nộp chính là việc giao bài tập cho lớp, để HV chủ động học trước còn bài tập được làm và tính điểm theo đúng nhịp tôi giao.
  - Why this priority: Stakeholder 2026-10-22: "ở học viên bài học sẽ hiện full và học được hết trước các bài trong khóa, nhưng bài tập thì vẫn hiện full nhưng sẽ chỉ enable bài tập nào GV đã set deadline trước đó thì mới có thể làm được và tính điểm".
  - Independent test: Lớp Đang học dùng giáo trình có Bài 1, Bài 2, Bài 3 đã xuất bản, mỗi Bài 2 bước học; HV chưa làm gì mở S02 → thấy đủ 3 Bài, mở Bài 3 rồi bước 2 của Bài 3 trước mọi bước khác mà không bị chặn; Bài 2 có bộ P (hạn 30/10) và bộ Q (chưa đặt hạn) → S11 hiển thị P "Hạn nộp 30/10" · "Chưa làm" mở được S05, Q "Chưa mở" · "Giáo viên chưa đặt hạn nộp" bị vô hiệu; Bài 3 chỉ có bộ chưa đặt hạn → S02 hiển thị "Bài tập chưa mở" cho Bài 3; GV mở popup hạn của P thấy cảnh báo xóa hạn, bấm "Xóa" → thông báo "Đã xóa hạn nộp. Bộ bài tập chuyển sang “Chưa mở” với học viên.", ô của P hiển thị "Đặt hạn" kèm "Chưa mở với học viên" và HV thấy P "Chưa mở" sau khi tải lại.

## 5. Functional Requirements

### REQ-1: Wizard navigation — Điều hướng wizard tạo lớp (T03)

<!-- Story: US-1 · Priority: P1 -->

- AC-1.1: WHEN GV bấm "Tạo lớp" ở T02 THE SYSTEM SHALL mở T03 "Tạo lớp mới" ở bước 1 với thanh tiến trình 4 bước đánh số "Thông tin lớp", "Thêm học viên", "Chọn giáo trình", "Xác nhận", đánh dấu bước hiện tại và hiển thị dòng "Bước {n}/4 · {tên bước}".
- AC-1.2: WHEN GV bấm "Tiếp tục" THE SYSTEM SHALL kiểm tra dữ liệu của bước hiện tại và chỉ chuyển sang bước kế tiếp khi dữ liệu hợp lệ; nếu không hợp lệ, GV ở lại bước đó và mỗi trường sai hiển thị thông báo lỗi ngay bên dưới.
- AC-1.3: WHEN GV bấm "Quay lại" ở bước 2, 3 hoặc 4, hoặc dùng nút Back của trình duyệt ở các bước này, THE SYSTEM SHALL đưa GV về bước liền trước và giữ nguyên toàn bộ dữ liệu đã nhập và đã chọn ở mọi bước.
- AC-1.4: WHEN GV bấm vào một bước trên thanh tiến trình THE SYSTEM SHALL chỉ chuyển tới bước đó nếu nó đứng trước bước hiện tại; các bước sau chỉ mở được bằng nút "Tiếp tục".
- AC-1.5: WHEN GV bấm "Hủy" hoặc rời T03 bằng điều hướng khác (menu bên, nút Back của trình duyệt ở bước 1) sau khi đã nhập hoặc chọn bất kỳ dữ liệu nào THE SYSTEM SHALL hỏi "Bỏ tạo lớp? Thông tin bạn đã nhập sẽ không được lưu." với hai lựa chọn "Ở lại" và "Bỏ"; chọn "Bỏ" thì không có lớp nào được tạo, dữ liệu wizard bị hủy và GV đi tới nơi đã chọn (mặc định T02).
- AC-1.6: IF GV đóng hoặc tải lại thẻ trình duyệt khi đang ở T03 và đã nhập dữ liệu THEN THE SYSTEM SHALL hiển thị hộp xác nhận rời trang của trình duyệt, và nếu GV vẫn rời đi thì không có lớp nào được tạo và dữ liệu đã nhập không được khôi phục khi mở lại T03.

### REQ-2: Class information step — Bước 1 Thông tin lớp

<!-- Story: US-1 · Priority: P1 -->

- AC-2.1: WHEN GV ở bước 1 THE SYSTEM SHALL hiển thị các trường "Tên lớp" (bắt buộc), "Ngày bắt đầu" (bắt buộc, chọn từ lịch, hiển thị dd/mm/yyyy, mặc định trống), "Mô tả" (tùy chọn, tối đa 500 ký tự) và "Lịch học" (tùy chọn, ghi chú tự do tối đa 200 ký tự, ví dụ "Thứ 2, 4, 6 — 19:00–20:30"), trong đó hai trường tùy chọn có bộ đếm ký tự và không nhận thêm ký tự khi đã đủ giới hạn.
- AC-2.2: IF "Tên lớp" trống hoặc chỉ gồm khoảng trắng THEN THE SYSTEM SHALL hiển thị "Vui lòng nhập tên lớp" và không cho sang bước 2.
- AC-2.3: IF "Tên lớp" sau khi bỏ khoảng trắng đầu và cuối dài hơn 100 ký tự THEN THE SYSTEM SHALL hiển thị "Tên lớp tối đa 100 ký tự" và không cho sang bước 2.
- AC-2.4: IF "Tên lớp" trùng với tên một lớp khác trong workspace của GV, kể cả lớp Đã kết thúc (so sánh sau khi bỏ khoảng trắng đầu và cuối, không phân biệt chữ hoa/thường), THEN THE SYSTEM SHALL hiển thị "Tên lớp đã tồn tại" và không cho sang bước 2.
- AC-2.5: IF "Ngày bắt đầu" trống, không phải ngày hợp lệ hoặc nằm ngoài khoảng từ 365 ngày trước đến 365 ngày sau hôm nay (giờ Việt Nam) THEN THE SYSTEM SHALL hiển thị "Vui lòng chọn ngày bắt đầu từ {dd/mm/yyyy} đến {dd/mm/yyyy}" với hai mốc của khoảng hợp lệ và không cho sang bước 2.
- AC-2.6: WHEN GV chọn "Ngày bắt đầu" là hôm nay hoặc một ngày đã qua THE SYSTEM SHALL hiển thị thông báo không chặn "Lớp sẽ ở trạng thái Đang học ngay sau khi tạo — học viên có thể vào học ngay." và vẫn cho sang bước 2.

### REQ-3: Add students step — Bước 2 Thêm học viên

<!-- Story: US-1 · Priority: P1 -->

- AC-3.1: WHEN GV ở bước 2 THE SYSTEM SHALL liệt kê toàn bộ và chỉ những HV thuộc workspace của GV, mỗi HV hiển thị họ tên, email và nhãn "Chưa kích hoạt", "Gửi email thất bại" hoặc "Đã khóa" khi tài khoản đang ở trạng thái đó theo module 001 (HV ở mọi trạng thái đều chọn được), sắp xếp theo họ tên A→Z, 20 HV mỗi trang, kèm ô tìm kiếm.
- AC-3.2: WHEN GV nhập từ khóa vào ô tìm kiếm THE SYSTEM SHALL chỉ hiển thị các HV có họ tên hoặc email chứa từ khóa, không phân biệt chữ hoa/thường và dấu tiếng Việt (ví dụ "nguyen" tìm thấy "Nguyễn"), và hiển thị "Không tìm thấy học viên phù hợp" khi không có kết quả.
- AC-3.3: WHEN GV tích chọn hoặc bỏ chọn một HV THE SYSTEM SHALL cập nhật khu "Đã chọn ({N})" — mỗi HV xuất hiện một lần, có nút bỏ chọn — và giữ nguyên lựa chọn khi GV đổi từ khóa, chuyển trang hoặc quay lại bước này.
- AC-3.4: WHEN GV thêm thành công một hoặc nhiều HV (email và họ tên) qua hộp thoại T12 (module 001) mở từ nút "Tạo học viên mới" ở bước 2 THE SYSTEM SHALL đóng hộp thoại, giữ nguyên dữ liệu wizard, đưa các HV mới vào danh sách với nhãn "Chưa kích hoạt" và tự động chọn họ.
- AC-3.5: IF việc chọn HV (kể cả tự động chọn sau khi tạo mới) làm số HV đã chọn vượt quá 100 THEN THE SYSTEM SHALL không chọn các HV vượt giới hạn và hiển thị "Một lớp có tối đa 100 học viên".
- AC-3.6: WHEN workspace chưa có HV nào THE SYSTEM SHALL hiển thị "Bạn chưa có học viên nào." cùng nút "Tạo học viên mới".
- AC-3.7: WHEN GV bấm "Tiếp tục" khi chưa chọn HV nào THE SYSTEM SHALL cho sang bước 3 mà không báo lỗi (lớp được phép tạo với 0 HV).

### REQ-4: Choose curriculum step — Bước 3 Chọn giáo trình

<!-- Story: US-1 · Priority: P1 -->

- AC-4.1: WHEN GV ở bước 3 THE SYSTEM SHALL liệt kê toàn bộ và chỉ các giáo trình chưa bị lưu trữ thuộc workspace của GV, mỗi giáo trình hiển thị tên, cấp độ HSK, số Bài đã xuất bản và số lớp đang dùng, sắp theo cấp độ HSK tăng dần rồi theo tên.
- AC-4.2: WHEN GV chọn một cấp độ trong bộ lọc HSK ("Tất cả", HSK1…HSK9) hoặc nhập từ khóa tên giáo trình THE SYSTEM SHALL chỉ hiển thị các giáo trình khớp cả hai điều kiện, và hiển thị "Không có giáo trình phù hợp" khi không có kết quả.
- AC-4.3: WHEN GV chọn một giáo trình THE SYSTEM SHALL đánh dấu giáo trình đó là lựa chọn duy nhất; chọn giáo trình khác sẽ thay thế lựa chọn trước.
- AC-4.4: IF GV bấm "Tiếp tục" khi chưa chọn giáo trình THEN THE SYSTEM SHALL hiển thị "Vui lòng chọn một giáo trình" và ở lại bước 3.
- AC-4.5: WHEN GV chọn một giáo trình chưa có Bài nào ở trạng thái Đã xuất bản THE SYSTEM SHALL hiển thị cảnh báo không chặn "Giáo trình này chưa có bài nào đã xuất bản. Học viên sẽ chưa thấy bài nào cho đến khi bạn xuất bản." và vẫn cho sang bước 4.
- AC-4.6: WHEN workspace chưa có giáo trình nào THE SYSTEM SHALL hiển thị "Bạn chưa có giáo trình nào. Hãy tạo giáo trình trước để gán cho lớp." cùng liên kết mở T05 trong thẻ trình duyệt mới và nút "Tải lại danh sách" cập nhật bước 3 mà không làm mất dữ liệu wizard.

### REQ-5: Confirm and create — Bước 4 Xác nhận & tạo lớp

<!-- Story: US-1 · Priority: P1 -->

- AC-5.1: WHEN GV ở bước 4 THE SYSTEM SHALL hiển thị tóm tắt gồm tên lớp, ngày bắt đầu, trạng thái ban đầu (Sắp bắt đầu hoặc Đang học), mô tả, lịch học, số lượng và họ tên các HV đã chọn, giáo trình (tên, cấp độ HSK, số Bài đã xuất bản), mỗi phần có nút "Sửa" đưa GV về bước tương ứng với dữ liệu được giữ nguyên.
- AC-5.2: WHEN GV ở bước 4 THE SYSTEM SHALL hiển thị lại các cảnh báo không chặn còn hiệu lực: "Lớp chưa có học viên. Bạn có thể thêm học viên sau khi tạo lớp." khi chưa chọn HV nào, và cảnh báo của AC-4.5 khi giáo trình chưa có Bài nào đã xuất bản.
- AC-5.3: WHEN GV bấm "Tạo lớp" và dữ liệu vẫn hợp lệ THE SYSTEM SHALL tạo đúng một lớp với dữ liệu đã tóm tắt, mọi phần của mọi Bài ở trạng thái Hiển thị với lớp, ghi ngày vào lớp là hôm nay cho mỗi HV đã chọn, mở T04 tab Tổng quan của lớp mới và hiển thị thông báo "Đã tạo lớp «{tên lớp}»".
- AC-5.4: IF tại thời điểm bấm "Tạo lớp" dữ liệu không còn hợp lệ (tên lớp vừa bị lớp khác dùng, giáo trình đã chọn bị xóa hoặc lưu trữ, hoặc HV đã chọn bị xóa khỏi workspace) THEN THE SYSTEM SHALL không tạo lớp, đưa GV về bước sớm nhất có lỗi với thông báo tương ứng ("Tên lớp đã tồn tại" / "Giáo trình đã chọn không còn khả dụng. Vui lòng chọn giáo trình khác." / "{N} học viên đã bị xóa khỏi workspace và đã được bỏ chọn") và giữ nguyên dữ liệu còn hợp lệ.
- AC-5.5: IF việc tạo lớp thất bại do lỗi kết nối hoặc lỗi hệ thống THEN THE SYSTEM SHALL ở lại bước 4, giữ nguyên dữ liệu và hiển thị "Không thể tạo lớp. Vui lòng kiểm tra kết nối và thử lại."
- AC-5.6: THE SYSTEM SHALL đảm bảo mỗi lần hoàn thành wizard tạo ra nhiều nhất một lớp, kể cả khi GV bấm "Tạo lớp" nhiều lần liên tiếp hoặc bấm lại sau lỗi kết nối.

### REQ-6: Class list — Danh sách lớp (T02)

<!-- Story: US-2 · Priority: P1 -->

- AC-6.1: WHEN GV mở T02 THE SYSTEM SHALL hiển thị nút "Tạo lớp" và danh sách các lớp thuộc workspace của GV với các cột Tên lớp, Trạng thái, Ngày bắt đầu, Giáo trình (tên + cấp độ HSK), Sĩ số, Ngày tạo; mặc định lọc "Đang hoạt động" (Sắp bắt đầu và Đang học) và sắp theo ngày bắt đầu mới nhất trước.
- AC-6.2: WHEN GV chọn bộ lọc trạng thái ("Đang hoạt động", "Sắp bắt đầu", "Đang học", "Đã kết thúc", "Tất cả") hoặc nhập từ khóa THE SYSTEM SHALL chỉ hiển thị các lớp khớp cả hai điều kiện (tên lớp chứa từ khóa, không phân biệt chữ hoa/thường và dấu tiếng Việt), và hiển thị "Không có lớp phù hợp" cùng nút "Xóa bộ lọc" khi không có kết quả.
- AC-6.3: WHEN danh sách sau khi lọc có hơn 20 lớp THE SYSTEM SHALL phân trang 20 lớp mỗi trang và hiển thị tổng số lớp khớp.
- AC-6.4: WHEN GV chưa có lớp nào THE SYSTEM SHALL hiển thị "Bạn chưa có lớp nào. Tạo lớp đầu tiên để bắt đầu giảng dạy." cùng nút "Tạo lớp".
- AC-6.5: WHEN GV bấm vào một lớp trong danh sách THE SYSTEM SHALL mở T04 của lớp đó ở tab Tổng quan.

### REQ-7: Class detail and editing — Chi tiết lớp (T04: khung, tab Tổng quan) & sửa thông tin

<!-- Story: US-2 · Priority: P1 -->

- AC-7.1: WHEN GV mở T04 THE SYSTEM SHALL hiển thị phần đầu gồm tên lớp, nhãn trạng thái, ngày bắt đầu, giáo trình (tên + cấp độ HSK, liên kết tới T06), sĩ số và các thao tác khả dụng theo trạng thái lớp, cùng các tab theo thứ tự Tổng quan · Học viên · Nội dung · Tiến độ · Xếp hạng, tab Tổng quan được chọn mặc định.
- AC-7.2: WHEN GV xem tab Tổng quan THE SYSTEM SHALL hiển thị mô tả, lịch học, ngày tạo, ngày kết thúc (nếu lớp Đã kết thúc) và thẻ giáo trình gồm số Bài đã xuất bản, số phần đang ẩn với lớp kèm liên kết "Xem tab Nội dung" và nút "Đổi giáo trình".
- AC-7.3: WHEN GV lưu biểu mẫu "Sửa thông tin lớp" với dữ liệu hợp lệ THE SYSTEM SHALL cập nhật lớp, hiển thị "Đã lưu thay đổi" và hiển thị dữ liệu mới ở T02, T04, S01 và S02; biểu mẫu áp dụng cùng trường, quy tắc và thông báo như AC-2.1 đến AC-2.5, ngoại trừ tên trùng không tính chính lớp đó và khoảng ngày chỉ được kiểm tra khi ngày bắt đầu bị thay đổi.
- AC-7.4: IF lớp đang ở trạng thái Đang học và GV đổi ngày bắt đầu sang một ngày sau hôm nay THEN THE SYSTEM SHALL từ chối lưu và hiển thị "Lớp đang học — chỉ có thể đổi ngày bắt đầu thành hôm nay hoặc một ngày đã qua".
- AC-7.5: IF lớp đã bị thay đổi ở một phiên làm việc khác kể từ lúc GV mở biểu mẫu THEN THE SYSTEM SHALL từ chối lưu, không ghi đè thay đổi kia và hiển thị "Lớp vừa được thay đổi ở nơi khác. Vui lòng tải lại để xem thông tin mới nhất."

### REQ-8: Manage students in a class — Quản lý học viên trong lớp (T04 tab Học viên)

<!-- Story: US-3 · Priority: P1 -->

- AC-8.1: WHEN GV mở tab Học viên THE SYSTEM SHALL liệt kê các HV hiện thuộc lớp với ảnh đại diện (hoặc ảnh đại diện mặc định theo module 011 khi HV chưa có ảnh), họ tên, email, trạng thái tài khoản theo module 001 (Chưa kích hoạt / Đã kích hoạt / Gửi email thất bại / Đã khóa) và ngày vào lớp, sắp theo họ tên A→Z, hiển thị sĩ số dạng "{N}/100" và ô tìm theo họ tên hoặc email; khi lớp chưa có HV, hiển thị "Lớp chưa có học viên." cùng nút "Thêm học viên".
- AC-8.2: WHEN GV bấm "Thêm học viên" THE SYSTEM SHALL mở hộp thoại chọn HV có cùng danh sách, tìm kiếm, chọn nhiều và tạo mới qua T12 như bước 2 của T03 (AC-3.1 đến AC-3.4), trong đó HV đã thuộc lớp hiển thị nhãn "Đã trong lớp" và không chọn được.
- AC-8.3: WHEN GV bấm "Thêm ({N})" trong hộp thoại THE SYSTEM SHALL thêm các HV đã chọn vào lớp trong cùng một lần (hoặc không thêm ai nếu thao tác thất bại), ghi ngày vào lớp là hôm nay, bỏ qua HV đã có trong lớp tại thời điểm đó, hiển thị "Đã thêm {N} học viên vào lớp" và lớp xuất hiện ở S01 của các HV vừa thêm.
- AC-8.4: IF việc thêm làm sĩ số vượt quá 100, kể cả khi có nhiều thao tác thêm diễn ra đồng thời, THEN THE SYSTEM SHALL không thêm HV nào trong thao tác đó và hiển thị "Lớp chỉ còn chỗ cho {K} học viên (tối đa 100)".
- AC-8.5: WHEN GV bấm "Gỡ khỏi lớp" ở một HV và xác nhận "Gỡ {họ tên} khỏi lớp {tên lớp}? Học viên sẽ không còn thấy lớp này." THE SYSTEM SHALL gỡ HV khỏi lớp, cập nhật sĩ số và lớp biến mất khỏi S01 của HV đó, trong khi tài khoản HV và tư cách thành viên ở các lớp khác không thay đổi.
- AC-8.6: WHEN một HV bị gỡ khỏi lớp THE SYSTEM SHALL giữ lại (không xóa) các bài nộp và điểm của HV đó trong lớp, không tính và không hiển thị chúng trong tiến độ và xếp hạng của lớp, và hiển thị lại toàn bộ nếu HV được thêm lại vào chính lớp đó.
- AC-8.7: WHILE một HV thuộc lớp có tài khoản ở trạng thái "Chưa kích hoạt" hoặc "Gửi email thất bại" THE SYSTEM SHALL vẫn tính HV đó vào sĩ số "{N}/100" ở T02, ở phần đầu T04, ở tab Học viên và ở hộp thoại "Thêm học viên", vào giới hạn 100 của lớp, và hiển thị trên dòng của HV ở tab Học viên nhãn trạng thái tài khoản tương ứng ("Chưa kích hoạt" hoặc "Gửi email thất bại").
- AC-8.9: WHILE một HV thuộc lớp có tài khoản ở trạng thái "Chưa kích hoạt" hoặc "Gửi email thất bại" THE SYSTEM SHALL không đưa HV đó vào tab Tiến độ (009) và tab Xếp hạng (008) của T04 — kể cả số "Học viên" trong phần tóm tắt của tab Tiến độ — trong khi HV có tài khoản "Đã khóa" vẫn được đưa vào; HV xuất hiện ở hai tab này ngay sau khi được kích hoạt.
- AC-8.8: WHEN GV kích hoạt (module 001) một HV đang thuộc lớp THE SYSTEM SHALL giữ nguyên tư cách thành viên và ngày vào lớp của HV, và lớp xuất hiện ở S01 ngay từ lần đăng nhập đầu tiên của HV.

### REQ-9: Change curriculum — Đổi giáo trình của lớp

<!-- Story: US-8 · Priority: P2 -->

- AC-9.1: WHEN GV bấm "Đổi giáo trình" ở một lớp Sắp bắt đầu hoặc Đang học chưa có bài nộp nào THE SYSTEM SHALL mở hộp thoại chọn giáo trình có cùng danh sách, bộ lọc và cảnh báo như bước 3 của T03 (AC-4.1 đến AC-4.5), trong đó giáo trình hiện tại có nhãn "Đang dùng".
- AC-9.2: WHEN GV chọn một giáo trình khác và xác nhận "Đổi giáo trình của lớp {tên lớp} sang {tên giáo trình}? Học viên sẽ thấy các bài của giáo trình mới; tiến độ theo giáo trình cũ không còn được tính cho lớp này và thiết lập ẩn/hiện nội dung của lớp sẽ được đặt lại." THE SYSTEM SHALL gán giáo trình mới cho lớp, bỏ mọi thiết lập ẩn của lớp (mọi phần của giáo trình mới ở trạng thái Hiển thị) và mọi hạn nộp bài tập của lớp, hiển thị "Đã đổi giáo trình" và S02 của mọi HV trong lớp hiển thị các Bài của giáo trình mới từ lần mở kế tiếp.
- AC-9.3: IF lớp đã có ít nhất một bài nộp bài tập của HV THEN THE SYSTEM SHALL vô hiệu hóa nút "Đổi giáo trình" trên thẻ giáo trình của tab Tổng quan kèm chú thích "Không thể đổi giáo trình vì học viên đã có bài nộp trong lớp này." và không mở hộp thoại chọn giáo trình.
- AC-9.4: IF lớp phát sinh bài nộp đầu tiên trong khoảng giữa lúc GV mở hộp thoại và lúc xác nhận đổi giáo trình THEN THE SYSTEM SHALL từ chối đổi, giữ nguyên giáo trình cũ và hiển thị thông báo của AC-9.3.

### REQ-10: End and reopen a class — Kết thúc & mở lại lớp

<!-- Story: US-7 · Priority: P2 -->

- AC-10.1: WHEN GV bấm "Kết thúc lớp" ở một lớp Đang học và xác nhận "Kết thúc lớp {tên lớp}? Học viên sẽ chỉ xem lại được bài học và kết quả, không thể làm bài tập mới. Bạn có thể mở lại lớp sau." THE SYSTEM SHALL chuyển lớp sang "Đã kết thúc" với ngày kết thúc là hôm nay và hiển thị "Đã kết thúc lớp".
- AC-10.2: WHILE lớp ở trạng thái Sắp bắt đầu THE SYSTEM SHALL không cung cấp thao tác "Kết thúc lớp" và hiển thị gợi ý "Lớp chưa bắt đầu — bạn có thể xóa lớp nếu không còn cần".
- AC-10.3: WHILE lớp ở trạng thái Đã kết thúc THE SYSTEM SHALL chỉ cho GV sửa tên lớp, mô tả, lịch học, mở lại lớp, xóa lớp (theo REQ-11) và xem các bài nộp đã có ở chế độ chỉ đọc; các thao tác đổi ngày bắt đầu, thêm hoặc gỡ HV, đổi giáo trình, ẩn/hiện nội dung và đặt, đổi hoặc xóa hạn nộp không khả dụng và hiển thị gợi ý "Mở lại lớp để thay đổi".
- AC-10.4: WHEN GV bấm "Mở lại lớp" ở một lớp Đã kết thúc và xác nhận THE SYSTEM SHALL chuyển lớp về "Đang học", xóa ngày kết thúc, hiển thị "Đã mở lại lớp" và HV lại được làm bài tập theo quy tắc của module 005.
- AC-10.5: WHEN lớp chuyển sang Đã kết thúc trong lúc HV có lượt làm bài tập chưa nộp THE SYSTEM SHALL giữ lại các câu trả lời đã lưu của lượt đó, từ chối lần lưu hoặc nộp tiếp theo với thông báo "Lớp đã kết thúc — không thể làm bài mới", và cho HV tiếp tục chính lượt đó nếu lớp được mở lại.
- AC-10.6: THE SYSTEM SHALL chỉ chuyển lớp sang Đã kết thúc khi GV bấm "Kết thúc lớp" và xác nhận (AC-10.1), không có trường ngày kết thúc ở T03 hay ở biểu mẫu "Sửa thông tin lớp" và không bao giờ tự kết thúc lớp theo ngày; ngày kết thúc chỉ là ngày GV kết thúc lớp, hiển thị ở tab Tổng quan khi lớp Đã kết thúc.

### REQ-11: Delete a class — Xóa lớp

<!-- Story: US-9 · Priority: P3 -->

- AC-11.1: WHEN GV bấm "Xóa lớp" ở một lớp chưa có bài nộp nào và xác nhận "Xóa lớp {tên lớp}? Lớp có {N} học viên. Thao tác này không thể hoàn tác." THE SYSTEM SHALL xóa lớp vĩnh viễn, đưa GV về T02 với thông báo "Đã xóa lớp «{tên lớp}»" và lớp biến mất khỏi T02 và S01 của mọi HV.
- AC-11.2: WHEN một lớp bị xóa THE SYSTEM SHALL giữ nguyên tài khoản các HV, tư cách thành viên của họ ở các lớp khác và giáo trình đã gán, và cho phép dùng lại tên lớp đó cho lớp mới.
- AC-11.3: IF lớp đã có ít nhất một bài nộp của HV (kể cả của HV đã bị gỡ khỏi lớp), dù là bài nộp bộ bài tập (005) hay bài nộp bài thi được giao cho lớp (006, kể cả bài nộp tự động) THEN THE SYSTEM SHALL vô hiệu hóa "Xóa lớp" và hiển thị "Không thể xóa lớp đã có bài nộp của học viên."
- AC-11.4: IF lớp phát sinh bài nộp đầu tiên trong khoảng giữa lúc GV mở hộp thoại xóa và lúc xác nhận THEN THE SYSTEM SHALL từ chối xóa, giữ nguyên lớp và hiển thị thông báo của AC-11.3.
- AC-11.5: WHEN một lớp chưa có bài nộp nào bị xóa THE SYSTEM SHALL bỏ lớp đó khỏi danh sách lớp được giao của mọi bài thi (006) đang được giao cho lớp, mà không thay đổi bài thi hay việc giao bài thi cho các lớp khác.

### REQ-12: My classes — Lớp của tôi (S01)

<!-- Story: US-4 · Priority: P1 -->

- AC-12.1: WHEN HV mở S01 THE SYSTEM SHALL hiển thị một thẻ cho mỗi lớp mà HV đang là thành viên, gồm tên lớp, nhãn trạng thái, ngày bắt đầu, tên giáo trình kèm cấp độ HSK và tóm tắt tiến độ bài tập của chính HV do module 009 cung cấp, xếp theo thứ tự Đang học (ngày bắt đầu mới nhất trước), Sắp bắt đầu (ngày bắt đầu gần nhất trước), Đã kết thúc (ngày kết thúc mới nhất trước); chạm vào thẻ mở S02 của lớp đó.
- AC-12.2: WHILE lớp ở trạng thái Sắp bắt đầu THE SYSTEM SHALL hiển thị trên thẻ lớp ở S01 dòng "Bắt đầu ngày {dd/mm/yyyy}" thay cho tóm tắt tiến độ.
- AC-12.3: WHEN HV chưa thuộc lớp nào THE SYSTEM SHALL hiển thị ở S01 thông điệp "Bạn chưa được thêm vào lớp nào. Hãy liên hệ giáo viên của bạn."

### REQ-13: Class page — Trang lớp: danh sách Bài (S02)

<!-- Story: US-4 · Priority: P1 -->

- AC-13.1: WHEN HV mở S02 của một lớp Đang học hoặc Đã kết thúc THE SYSTEM SHALL hiển thị tên lớp, nhãn trạng thái, ngày bắt đầu, giáo trình (tên + cấp độ HSK), lịch học (nếu có), tóm tắt tiến độ bài tập của chính HV trong lớp do module 009 cung cấp, liên kết tới S09 và danh sách Bài của lớp.
- AC-13.2: THE SYSTEM SHALL liệt kê ở S02 các Bài hiển thị với HV theo AC-17.2, theo đúng thứ tự Bài trong giáo trình; chạm vào một Bài mở S11 của Bài đó.
- AC-13.3: THE SYSTEM SHALL hiển thị cho mỗi Bài ở S02 tên Bài, nhãn các phần đang có nội dung hiển thị với HV (Bài học, Bài tập) và tiến độ bài tập của chính HV trong Bài theo định nghĩa của module 009 dạng "{số bộ đã hoàn thành}/{số bộ được tính} bộ bài tập", chỉ tính các bộ bài tập đang hiển thị với HV.
- AC-13.4: THE SYSTEM SHALL hiển thị ở S02, thay cho tiến độ bài tập của một Bài, nhãn "Chưa có bài tập" khi Bài có bước học nhưng không có bộ bài tập nào hiển thị với HV, và nhãn "Chưa có nội dung" khi Bài không có nội dung nào hiển thị với HV.
- AC-13.5: WHEN lớp Đang học hoặc Đã kết thúc không có Bài nào hiển thị với HV THE SYSTEM SHALL hiển thị ở S02 thông điệp "Lớp chưa có bài nào. Giáo viên sẽ cập nhật nội dung sau."
- AC-13.6: THE SYSTEM SHALL xác định danh sách Bài, nhãn phần, trạng thái và tiến độ hiển thị ở S02 và S11 riêng cho từng lớp, kể cả khi HV thuộc hai lớp dùng cùng giáo trình với thiết lập ẩn khác nhau.
- AC-13.7: WHILE một Bài có ít nhất một bộ bài tập hiển thị với HV nhưng không bộ nào đang mở trong lớp (chưa bộ nào có hạn nộp hiệu lực — module 005) THE SYSTEM SHALL hiển thị nhãn "Bài tập chưa mở" thay cho tiến độ bài tập của Bài đó ở S02 và ở phần đầu S11.
- AC-13.8: WHILE lớp ở trạng thái Đang học hoặc Đã kết thúc và có ít nhất một bài thi được giao cho lớp mà HV thấy được theo 006 (006 AC-7.1) THE SYSTEM SHALL hiển thị ở S02 lối vào "Bài thi của lớp ({N})", với N là số bài thi đó, mở S07 "Bài thi" (006), và không hiển thị lối vào này khi N bằng 0.

### REQ-14: Class state and access control — Trạng thái lớp & kiểm soát truy cập

<!-- Story: US-4, US-5, US-7 · Priority: P1 -->

- AC-14.1: THE SYSTEM SHALL xác định trạng thái lớp là "Đã kết thúc" nếu GV đã kết thúc lớp và chưa mở lại; nếu không thì là "Sắp bắt đầu" khi ngày hiện tại theo giờ Việt Nam (UTC+7) trước ngày bắt đầu và "Đang học" khi ngày hiện tại bằng hoặc sau ngày bắt đầu; nhãn này hiển thị giống nhau ở T02, T04, S01 và S02.
- AC-14.2: WHEN đến 00:00 (UTC+7) của ngày bắt đầu THE SYSTEM SHALL chuyển lớp từ Sắp bắt đầu sang Đang học mà không cần GV thao tác và mở nội dung lớp cho HV trong vòng 1 phút.
- AC-14.3: WHILE lớp ở trạng thái Sắp bắt đầu THE SYSTEM SHALL hiển thị ở S02 thông tin lớp và thông điệp "Lớp sẽ bắt đầu vào ngày {dd/mm/yyyy}. Nội dung sẽ mở từ ngày này." thay cho danh sách Bài và danh sách Thành viên, và từ chối mở mọi Bài (S11), bước học và bộ bài tập của lớp với HV, kể cả qua đường dẫn trực tiếp, bằng cùng thông điệp đó.
- AC-14.4: WHILE lớp ở trạng thái Đã kết thúc THE SYSTEM SHALL hiển thị ở S02 và S11 biểu ngữ "Lớp đã kết thúc ngày {dd/mm/yyyy}. Bạn có thể xem lại bài học và kết quả, nhưng không thể làm bài mới.", vẫn cho HV mở các Bài, bước học, bộ thẻ từ vựng và S06 "Xem lại bài làm" của các bộ bài tập đã hoàn thành đang hiển thị với lớp, và từ chối bắt đầu lượt làm bài tập mới với thông báo "Lớp đã kết thúc — không thể làm bài mới".
- AC-14.5: IF HV mở S02 hoặc S11, mở một nội dung hoặc nộp bài của một lớp mà HV không còn là thành viên hoặc lớp đã bị xóa THEN THE SYSTEM SHALL từ chối, hiển thị "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" và đưa HV về S01.
- AC-14.6: IF một GV không phải chủ workspace của lớp mở T04 hoặc thực hiện bất kỳ thao tác quản lý lớp nào (kể cả ẩn/hiện nội dung), hoặc một thao tác của GV tham chiếu HV hay giáo trình thuộc workspace khác, THEN THE SYSTEM SHALL từ chối, hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." và không tiết lộ bất kỳ thông tin nào về đối tượng đó.

### REQ-15: Class content view — Tab Nội dung của lớp (T04)

<!-- Story: US-6 · Priority: P1 -->

- AC-15.1: WHEN GV mở tab Nội dung của T04 THE SYSTEM SHALL hiển thị dòng tóm tắt "{N} bài · {M} phần đang ẩn với lớp này" và liệt kê mọi Bài của giáo trình lớp, kể cả Bài Nháp, theo thứ tự trong giáo trình, mỗi Bài một dòng gồm tên Bài (liên kết tới T18), trạng thái Bài (Nháp / Đã xuất bản) và hai ô Bài học · Bài tập.
- AC-15.2: THE SYSTEM SHALL hiển thị trong mỗi ô phần số nội dung đã xuất bản của phần đó ("{n} bước học", "{n} bộ bài tập") hoặc "Chưa có nội dung đã xuất bản" khi bằng 0, cùng trạng thái hiển thị với lớp bằng chữ "Hiển thị" hoặc "Đang ẩn" và thao tác tương ứng "Ẩn với lớp" hoặc "Hiện với lớp".
- AC-15.3: WHILE một Bài ở trạng thái Nháp THE SYSTEM SHALL hiển thị dòng Bài đó với nhãn "Nháp — học viên chưa thấy" và vẫn cho GV ẩn hoặc hiện trước từng phần của Bài, với thiết lập được giữ và có hiệu lực ngay khi Bài được xuất bản.
- AC-15.4: WHEN giáo trình của lớp chưa có Bài nào THE SYSTEM SHALL hiển thị ở tab Nội dung "Giáo trình «{tên giáo trình}» chưa có bài nào." cùng liên kết mở T06.

### REQ-16: Hide and show sections per class — Ẩn/hiện phần theo lớp

<!-- Story: US-6 · Priority: P1 -->

- AC-16.1: WHEN GV chọn "Ẩn với lớp" ở một phần đang Hiển thị và xác nhận "Ẩn «{tên phần}» của «{tên Bài}» với lớp {tên lớp}? Học viên của lớp này sẽ không còn thấy phần này, kể cả kết quả đã làm. Điểm xếp hạng đã có được giữ nguyên. Các lớp khác dùng giáo trình này không bị ảnh hưởng. Bạn có thể hiện lại bất cứ lúc nào." THE SYSTEM SHALL chuyển phần đó sang "Đang ẩn" chỉ trong lớp này, cập nhật ô và dòng tóm tắt, và hiển thị "Đã ẩn «{tên phần}» của «{tên Bài}» với lớp".
- AC-16.2: WHEN GV chọn "Hiện với lớp" ở một phần Đang ẩn và xác nhận "Hiện lại «{tên phần}» của «{tên Bài}» với lớp {tên lớp}? Học viên sẽ thấy lại phần này cùng toàn bộ kết quả đã làm trước đây." THE SYSTEM SHALL chuyển phần đó về "Hiển thị" chỉ trong lớp này, cập nhật ô và dòng tóm tắt, và hiển thị "Đã hiện «{tên phần}» của «{tên Bài}» với lớp".
- AC-16.3: IF tại lúc mở hộp xác nhận ẩn, phần cần ẩn là phần Bài tập và có HV của lớp đang làm dở bài tập trong phần đó THEN THE SYSTEM SHALL bổ sung vào hộp xác nhận dòng "{N} học viên đang làm dở bài tập trong phần này — câu trả lời đã lưu được giữ lại nhưng không nộp được cho tới khi bạn hiện lại."
- AC-16.4: WHEN GV chọn thao tác hàng loạt "Ẩn {tên phần} ở mọi bài" hoặc "Hiện {tên phần} ở mọi bài" ở đầu một cột, hoặc "Ẩn cả bài" hoặc "Hiện cả bài" ở một dòng Bài, và xác nhận hộp thoại nêu số phần sẽ thay đổi (ví dụ "Ẩn «Bài tập» của {K} bài với lớp {tên lớp}?") kèm nội dung của AC-16.1 hoặc AC-16.2 và dòng của AC-16.3 với số học viên cộng dồn THE SYSTEM SHALL áp dụng trong một lần cho mọi phần thuộc phạm vi hiện có (kể cả phần của Bài Nháp) chưa ở trạng thái đích, bỏ qua các phần đã ở trạng thái đích, hiển thị "Đã cập nhật {K} phần", và không cung cấp thao tác hàng loạt khi mọi phần trong phạm vi đã ở trạng thái đích.
- AC-16.5: IF thao tác ẩn hoặc hiện, đơn lẻ hay hàng loạt, thất bại do lỗi kết nối hoặc lỗi hệ thống THEN THE SYSTEM SHALL không thay đổi phần nào, giữ nguyên trạng thái hiển thị trên tab và hiển thị "Không thể cập nhật hiển thị nội dung. Vui lòng thử lại."
- AC-16.6: IF phần mà GV xác nhận ẩn hoặc hiện đã ở trạng thái đích do một thao tác ở phiên làm việc khác THEN THE SYSTEM SHALL không tạo thay đổi, cập nhật ô theo trạng thái hiện tại và hiển thị "Phần này đã ở trạng thái «{Đang ẩn | Hiển thị}»."

### REQ-17: Visibility rule for students — Quy tắc hiển thị nội dung với học viên

<!-- Story: US-4, US-5, US-6 · Priority: P1 -->

- AC-17.1: THE SYSTEM SHALL cho HV thấy và mở một nội dung của lớp (bước học, bộ bài tập) chỉ khi đồng thời: HV đang là thành viên lớp; lớp ở trạng thái Đang học hoặc Đã kết thúc; Bài chứa nội dung ở trạng thái Đã xuất bản; nội dung ở trạng thái Đã xuất bản (không phải Nháp và không bị Lưu trữ — nội dung bị lưu trữ vắng mặt với HV ở mọi lớp); và phần chứa nội dung không bị ẩn trong lớp.
- AC-17.2: THE SYSTEM SHALL hiển thị một Bài cho HV (trong danh sách ở S02 và khi mở S11) chỉ khi HV đang là thành viên lớp, lớp ở trạng thái Đang học hoặc Đã kết thúc, Bài ở trạng thái Đã xuất bản và ít nhất một trong hai phần của Bài không bị ẩn trong lớp.
- AC-17.3: THE SYSTEM SHALL áp dụng thiết lập ẩn/hiện của một lớp chỉ cho HV của lớp đó, để HV của lớp khác dùng cùng giáo trình thấy phần theo thiết lập của lớp họ, và coi mọi phần của Bài mới xuất hiện trong giáo trình là "Hiển thị" với lớp cho tới khi GV ẩn.
- AC-17.4: WHILE một phần đang ẩn với lớp THE SYSTEM SHALL không hiển thị cho HV của lớp bất kỳ dấu vết nào của phần đó — tab ở S11, liên kết "Luyện tập" từ bước học, nhãn phần ở S02, kết quả, điểm, bài làm đã nộp (S06) và phần đóng góp vào tiến độ — trong khi kết quả bài tập HV đã có ở phần đó vẫn được giữ và được tính vào Điểm xếp hạng theo quy tắc của module 008.
- AC-17.5: IF HV là thành viên của một lớp Đang học hoặc Đã kết thúc mở qua đường dẫn trực tiếp một Bài hoặc một nội dung của lớp không hiển thị với HV theo AC-17.1 hoặc AC-17.2 THEN THE SYSTEM SHALL hiển thị A05 "Không tìm thấy nội dung bạn yêu cầu." kèm nút quay về S02 của lớp và không tiết lộ tên hay sự tồn tại của Bài hoặc nội dung đó.
- AC-17.6: WHEN GV hiện lại một phần THE SYSTEM SHALL hiển thị lại cho HV của lớp toàn bộ phần đó cùng mọi dữ liệu làm bài tập HV đã có (bài nộp và điểm của bài nộp, xem lại được ở S06; lượt làm bài tập dở dang để tiếp tục) và tính lại tiến độ theo module 009.
- AC-17.7: THE SYSTEM SHALL không hiển thị cho HV ở S01, S02, S11 và mọi màn hình nội dung nhãn "AI tạo" của GV, trạng thái tạo hoặc duyệt nội dung bằng AI của module 010, hay bất kỳ nội dung AI nào GV chưa duyệt.
- AC-17.8: THE SYSTEM SHALL áp dụng thiết lập ẩn/hiện phần theo lớp (REQ-16) chỉ cho phần Bài học và phần Bài tập của các Bài, không cho bài thi được giao cho lớp (006): ẩn hay hiện phần của bất kỳ Bài nào không làm thay đổi việc HV của lớp thấy, vào thi hay xem kết quả bài thi.

### REQ-18: Hiding while a student is active — Ẩn phần khi học viên đang học hoặc làm bài

<!-- Story: US-6 · Priority: P1 -->

- AC-18.1: WHEN HV thao tác tiếp (chuyển bước Trước/Tiếp, lật hoặc chuyển thẻ) trên một bước học hoặc bộ thẻ từ vựng (S03, S04) thuộc phần vừa bị ẩn với lớp THE SYSTEM SHALL không hiển thị nội dung tiếp theo, hiển thị "Nội dung này hiện không khả dụng." và đưa HV về S11 của Bài, hoặc về S02 nếu Bài không còn hiển thị với HV.
- AC-18.2: WHEN HV lưu hoặc nộp một lượt làm bài tập (S05) thuộc phần vừa bị ẩn với lớp THE SYSTEM SHALL từ chối, giữ nguyên lượt làm dở với các câu trả lời đã lưu trước đó, hiển thị "Bài tập này hiện không khả dụng. Câu trả lời đã lưu của bạn được giữ lại." và đưa HV về S11 của Bài, hoặc về S02 nếu Bài không còn hiển thị với HV.
- AC-18.3: WHEN GV ẩn hoặc hiện một phần THE SYSTEM SHALL áp dụng thay đổi cho mọi màn hình HV của lớp mở hoặc tải lại từ 5 giây sau lúc GV xác nhận (S02, S11, S03–S06 và đường dẫn trực tiếp), và cập nhật màn hình HV đang mở sẵn ở lần thao tác hoặc tải lại kế tiếp.

### REQ-19: Lesson page — Trang bài (S11)

<!-- Story: US-5, US-14 · Priority: P1 · 2026-10-22: học mọi Bài, mọi bước học theo bất kỳ thứ tự nào (AC-19.8); bộ bài tập "Chưa mở" khi chưa có hạn nộp (AC-19.9) -->

- AC-19.1: WHEN HV mở S11 của một Bài hiển thị với HV THE SYSTEM SHALL hiển thị tên Bài, tên lớp, nút quay lại S02, tiến độ bài tập của chính HV trong Bài theo module 009 (hoặc "Chưa có bài tập" khi Bài không có bộ bài tập nào hiển thị với HV, hoặc "Bài tập chưa mở" theo AC-13.7) và các tab theo thứ tự Bài học, Bài tập, trong đó chỉ có tab của phần không bị ẩn trong lớp và có ít nhất một nội dung hiển thị với HV, và tab đầu tiên hiện có được chọn mặc định.
- AC-19.2: THE SYSTEM SHALL liệt kê ở tab Bài học mọi bước học hiển thị với HV theo thứ tự GV đã sắp xếp trong phần Bài học của Bài (module 002), đánh số liên tục từ 1, mỗi mục gồm số thứ tự và tên bước học, không kèm trạng thái đã xem hay nhãn nội bộ nào của GV (AC-17.7).
- AC-19.3: THE SYSTEM SHALL liệt kê ở tab Bài tập mọi bộ bài tập hiển thị với HV theo thứ tự GV đã sắp xếp trong phần Bài tập của Bài (module 002), đánh số liên tục từ 1, mỗi mục gồm tên bộ, số câu hỏi dạng "{n} câu", nhãn hạn nộp theo REQ-23 (nếu có) và trạng thái của chính HV trong lớp theo module 005: "Chưa mở" (bộ chưa có hạn nộp hiệu lực trong lớp và HV chưa có bài nộp, kể cả khi có lượt dở — AC-19.9), "Chưa làm" (bộ có hạn nộp, chưa có lượt làm nào và chưa quá hạn), "Quá hạn" (chưa có bài nộp và đã qua hạn nộp của lớp, kể cả khi có lượt dở — AC-23.3), "Đang làm" (có lượt dở nhưng chưa có bài nộp và chưa quá hạn) hoặc "Đã hoàn thành · {điểm}/{điểm tối đa}" (đã có bài nộp — mỗi bộ chỉ được nộp một lần trong lớp theo module 005 — với điểm là điểm của bài nộp duy nhất đó; kèm nhãn "Nộp muộn" theo quy tắc của module 005).
- AC-19.4: THE SYSTEM SHALL cho HV mở mọi bước học và mọi bộ bài tập không ở trạng thái "Chưa mở" hiển thị ở S11 theo bất kỳ thứ tự nào, không khóa mục sau khi mục trước chưa được xem hoặc chưa hoàn thành, và không đánh dấu mục nào là mục gợi ý; bộ "Chưa mở" không mở được theo AC-19.9.
- AC-19.5: WHEN HV chạm một mục ở S11 THE SYSTEM SHALL mở S03 cho bước học, S05 cho bộ bài tập "Chưa làm", "Quá hạn" hoặc "Đang làm" và S06 "Xem lại bài làm" (module 005) cho bộ bài tập "Đã hoàn thành", và không mở màn hình nào khi HV chạm bộ bài tập "Chưa mở".
- AC-19.6: WHEN HV mở S11 của một Bài hiển thị với HV nhưng không có nội dung nào hiển thị với HV THE SYSTEM SHALL hiển thị tên Bài và thông điệp "Bài này chưa có nội dung. Giáo viên sẽ cập nhật sau." thay cho các tab.
- AC-19.7: THE SYSTEM SHALL không hiển thị ở S02 và S11 thao tác "Làm lại" hay bất kỳ lối nào bắt đầu một lượt làm mới cho bộ bài tập "Đã hoàn thành", ở mọi trạng thái lớp.
- AC-19.8: THE SYSTEM SHALL cho HV của lớp Đang học hoặc Đã kết thúc xem mọi Bài hiển thị với HV theo AC-17.2 và mở mọi bước học hiển thị theo AC-17.1 của mọi Bài theo bất kỳ thứ tự nào, không phụ thuộc việc HV đã mở Bài hay bước học nào khác, đã làm hay nộp bộ bài tập nào, hay bộ bài tập đã có hạn nộp hay chưa, và không khóa, mở khóa dần hay đặt lịch mở riêng cho Bài hoặc bước học.
- AC-19.9: WHILE một bộ bài tập hiển thị với HV ở trạng thái "Chưa mở" (bộ chưa có hạn nộp hiệu lực trong lớp và HV chưa có bài nộp — module 005) THE SYSTEM SHALL hiển thị dòng của bộ ở tab Bài tập của S11 ở dạng bị vô hiệu với tên bộ, số câu hỏi, nhãn "Chưa mở" và dòng "Giáo viên chưa đặt hạn nộp", không cho mở S05 từ dòng đó và không hiển thị nhãn hạn nộp nào.

### REQ-20: Class members for students — Thành viên lớp (S02)

<!-- Story: US-10 · Priority: P2 -->

- AC-20.1: WHEN HV mở S02 của một lớp Đang học hoặc Đã kết thúc mà HV là thành viên THE SYSTEM SHALL hiển thị lối vào "Thành viên ({N})", trong đó N là số thành viên được liệt kê theo AC-20.3, kể cả chính HV.
- AC-20.2: WHEN HV chạm "Thành viên ({N})" THE SYSTEM SHALL hiển thị danh sách thành viên của lớp, mỗi dòng gồm ảnh đại diện (hoặc ảnh đại diện mặc định theo module 011 khi chưa có ảnh) và họ tên, trong đó dòng của chính HV đứng đầu với nhãn "Bạn" và các dòng còn lại sắp theo họ tên A→Z.
- AC-20.3: THE SYSTEM SHALL liệt kê trong danh sách Thành viên mọi HV đang là thành viên lớp, trừ HV có tài khoản chưa được kích hoạt (trạng thái "Chưa kích hoạt" hoặc "Gửi email thất bại" theo module 001), HV đã bị gỡ khỏi lớp và HV có tài khoản đã bị xóa; HV có tài khoản "Đã khóa" vẫn được liệt kê và không kèm nhãn trạng thái.
- AC-20.4: THE SYSTEM SHALL không hiển thị trong danh sách Thành viên email, số điện thoại, trạng thái tài khoản, ngày vào lớp, tiến độ hay điểm của bất kỳ thành viên nào.
- AC-20.5: WHEN HV chạm dòng của một bạn cùng lớp trong danh sách Thành viên THE SYSTEM SHALL mở S12 "Hồ sơ học viên" (module 011) của bạn đó, còn khi HV chạm dòng của chính mình thì mở S10 "Hồ sơ của tôi".
- AC-20.6: WHEN chính HV là thành viên duy nhất được liệt kê THE SYSTEM SHALL hiển thị bên dưới dòng của HV thông điệp "Lớp chưa có thành viên nào khác."
- AC-20.7: IF HV mở danh sách Thành viên của một lớp mà HV không phải thành viên (kể cả qua đường dẫn trực tiếp, sau khi bị gỡ hoặc khi lớp đã bị xóa) THEN THE SYSTEM SHALL từ chối, không hiển thị bất kỳ thành viên nào, hiển thị "Bạn không thuộc lớp này hoặc lớp không còn tồn tại" và đưa HV về S01.

### REQ-21: Exercise deadline per class — Hạn nộp bộ bài tập theo lớp (T04 tab Nội dung)

<!-- Story: US-11, US-14 · Priority: P1 · v8 (V8-1) · 2026-10-22: hạn nộp là điều kiện mở bộ bài tập cho HV (AC-21.7, AC-21.8) -->

- AC-21.1: WHEN GV mở tab Nội dung của T04 THE SYSTEM SHALL liệt kê trong ô Bài tập của mỗi Bài mọi bộ bài tập Đã xuất bản của phần Bài tập theo thứ tự GV đã sắp (module 002), mỗi bộ một dòng gồm tên bộ và ô hạn nộp hiển thị ngày hạn dạng dd/MM/yyyy hoặc "Đặt hạn" khi bộ chưa có hạn, và bên dưới các bộ một ô "Đặt hạn cho mọi bộ của bài".
- AC-21.2: WHEN GV bấm ô hạn nộp của một bộ ở lớp Sắp bắt đầu hoặc Đang học THE SYSTEM SHALL mở lịch chọn dạng popup ngay dưới ô đó cùng kiểu với lịch chọn của module 009 (AC-9.8: nhãn tiếng Việt, tuần bắt đầu từ Thứ Hai, ngày hôm nay được làm nổi bật, đóng khi GV bấm ra ngoài hoặc nhấn Esc mà không thay đổi gì), cho chọn đúng một ngày trong khoảng từ 365 ngày trước đến 365 ngày sau hôm nay (giờ Việt Nam) với các ngày ngoài khoảng bị vô hiệu, đánh dấu sẵn ngày hạn hiện có, hiển thị dòng "Hạn nộp: 23:59 {dd/MM/yyyy}" của ngày đang chọn (hoặc "Chọn ngày hạn nộp" khi chưa chọn ngày nào), và có nút "Xóa" và "Áp dụng".
- AC-21.3: WHEN GV chọn một ngày không trước hôm nay trong popup và bấm "Áp dụng" THE SYSTEM SHALL lưu hạn nộp của bộ đó chỉ cho lớp này với thời hạn là 23:59 giờ Việt Nam (UTC+7) của ngày đã chọn, thay thế hạn trước đó nếu có, đóng popup, hiển thị ngày mới trong ô và thông báo "Đã đặt hạn nộp 23:59 {dd/MM/yyyy}. Nhắc học viên chưa làm lúc 08:00 ngày hạn."
- AC-21.4: IF ngày GV chọn trong popup đứng trước hôm nay (giờ Việt Nam) THEN THE SYSTEM SHALL hiển thị trong popup cảnh báo không chặn "Ngày đã qua — học viên chưa làm sẽ thấy “Quá hạn” ngay và không có thư nhắc.", vẫn cho bấm "Áp dụng", và sau khi lưu hiển thị thông báo "Đã đặt hạn {dd/MM/yyyy} — ngày đã qua: học viên chưa làm thấy “Quá hạn”, không gửi nhắc." thay cho thông báo của AC-21.3.
- AC-21.5: IF ngày GV chọn trong popup là hôm nay khi đã qua 08:00 giờ Việt Nam, hoặc là một ngày chưa qua nhưng đứng trước ngày bắt đầu của lớp, THEN THE SYSTEM SHALL hiển thị trong popup cảnh báo không chặn "Học viên sẽ không nhận email nhắc cho hạn nộp này." và vẫn cho bấm "Áp dụng".
- AC-21.6: WHEN GV bấm "Xóa" trong popup của một bộ THE SYSTEM SHALL bỏ hạn nộp của bộ đó (nếu có) chỉ trong lớp này mà không hỏi xác nhận, đóng popup, hiển thị "Đặt hạn" trong ô và thông báo "Đã xóa hạn nộp. Bộ bài tập chuyển sang “Chưa mở” với học viên."
- AC-21.7: WHILE một bộ bài tập Đã xuất bản chưa có hạn nộp trong lớp THE SYSTEM SHALL hiển thị trong ô hạn nộp của bộ ở tab Nội dung chữ "Đặt hạn" kèm dòng phụ "Chưa mở với học viên".
- AC-21.8: WHEN GV mở lịch popup của một bộ đang có hạn nộp trong lớp, hoặc của ô "Đặt hạn cho mọi bộ của bài" khi ít nhất một bộ Đã xuất bản của Bài đang có hạn nộp trong lớp, THE SYSTEM SHALL hiển thị trong popup, phía trên nút "Xóa", cảnh báo không chặn "Xóa hạn sẽ đóng bộ bài tập với học viên lớp này: ai chưa nộp sẽ thấy “Chưa mở” và không làm được; bài đã nộp và điểm được giữ."

### REQ-22: Bulk deadlines and deadline lifecycle — Đặt hạn hàng loạt theo Bài & hiệu lực của hạn nộp

<!-- Story: US-11 · Priority: P1 · v8 (V8-1) -->

- AC-22.1: WHEN GV bấm ô "Đặt hạn cho mọi bộ của bài" ở một Bài có ít nhất một bộ bài tập Đã xuất bản, chọn một ngày trên lịch popup (cùng khoảng ngày, nút và cảnh báo như AC-21.2, AC-21.4, AC-21.5) và bấm "Áp dụng" THE SYSTEM SHALL đặt hạn đó cho mọi bộ Đã xuất bản của Bài chỉ trong lớp này trong một lần mà không hỏi xác nhận, thay thế hạn đã có của các bộ đó, cập nhật các ô và hiển thị "Đã đặt hạn nộp 23:59 {dd/MM/yyyy} cho {K} bộ bài tập. Nhắc học viên chưa làm lúc 08:00 ngày hạn." (hoặc thông báo ngày đã qua của AC-21.4).
- AC-22.2: WHEN GV mở lịch popup của ô "Đặt hạn cho mọi bộ của bài" và bấm "Xóa" THE SYSTEM SHALL xóa trong một lần, không hỏi xác nhận, hạn nộp của mọi bộ Đã xuất bản của Bài chỉ trong lớp này, cập nhật các ô và hiển thị "Đã xóa hạn nộp của {K} bộ bài tập. Các bộ này chuyển sang “Chưa mở” với học viên." với K là số bộ Đã xuất bản của Bài.
- AC-22.3: IF thao tác đặt, đổi hoặc xóa hạn nộp, đơn lẻ hay hàng loạt, thất bại do lỗi kết nối hoặc lỗi hệ thống THEN THE SYSTEM SHALL không thay đổi hạn nộp nào, giữ nguyên các ô trên tab và hiển thị "Không thể cập nhật hạn nộp. Vui lòng thử lại."
- AC-22.4: THE SYSTEM SHALL áp dụng hạn nộp đặt ở một lớp chỉ cho lớp đó — tab Nội dung và HV của lớp khác dùng cùng giáo trình không thấy hạn đó, HV lớp khác không bị đánh dấu "Quá hạn" hay "Nộp muộn" và không nhận email nhắc theo hạn đó — và coi mọi bộ bài tập mới xuất hiện trong giáo trình là chưa đặt hạn với lớp, nên ở trạng thái "Chưa mở" với HV của lớp cho tới khi GV đặt hạn (AC-19.9).
- AC-22.5: WHILE phần Bài tập của Bài đang ẩn với lớp, bộ bài tập bị Lưu trữ (module 002), hoặc Bài chứa bộ còn Nháp THE SYSTEM SHALL giữ nguyên hạn nộp đã đặt của bộ nhưng coi hạn đó là không hiệu lực — không hiển thị với HV và không tạo email nhắc — và áp dụng lại hạn đó ngay khi bộ hiển thị lại với HV theo AC-17.1.
- AC-22.6: WHILE phần Bài tập của một Bài đang ẩn với lớp và ít nhất một bộ của Bài có hạn nộp THE SYSTEM SHALL hiển thị bên dưới ô Bài tập của Bài đó dòng "Hạn nộp được giữ nhưng không gửi nhắc khi phần đang ẩn." và vẫn cho GV đặt, đổi hoặc xóa hạn.

### REQ-23: Deadline display for students — Hiển thị hạn nộp cho học viên (S11, S05)

<!-- Story: US-12 · Priority: P1 · v8 (V8-1) -->

- AC-23.1: WHILE một bộ bài tập hiển thị với HV có hạn nộp hiệu lực trong lớp THE SYSTEM SHALL hiển thị trên dòng của bộ ở tab Bài tập của S11 và ở phần đầu S05 nhãn "Hạn nộp {dd/MM}" (dạng "Hạn nộp {dd/MM/yyyy}" khi năm của hạn khác năm hiện tại), trừ khi AC-23.2 áp dụng.
- AC-23.2: WHILE hôm nay (giờ Việt Nam) là ngày hạn nộp của bộ, lớp Đang học và HV chưa có bài nộp nào cho bộ đó trong lớp THE SYSTEM SHALL hiển thị nhãn "Hạn hôm nay" thay cho "Hạn nộp {dd/MM}" ở S11 và S05.
- AC-23.3: WHILE đã qua hạn nộp của bộ (sau 23:59 giờ Việt Nam của ngày hạn), lớp Đang học và HV chưa có bài nộp nào cho bộ đó trong lớp THE SYSTEM SHALL hiển thị bằng chữ trạng thái "Quá hạn" ở S11 và S05 thay cho "Chưa làm" hoặc "Đang làm" (thứ tự ưu tiên của module 005 AC-17.5: Đã hoàn thành › Chưa mở › Quá hạn › Đang làm › Chưa làm), không hiển thị "Đang làm" kèm theo, cùng nhãn "Hạn nộp {dd/MM}", và vẫn giữ nút "Tiếp tục làm" theo module 005 khi HV có lượt làm dở.
- AC-23.4: WHILE một bộ bài tập ở trạng thái "Quá hạn" với HV THE SYSTEM SHALL vẫn cho HV mở, bắt đầu hoặc làm tiếp lượt dở và nộp bộ đó như trước hạn, và bài nộp được đánh dấu "Nộp muộn" theo module 005.
- AC-23.5: WHILE bộ bài tập chưa đặt hạn nộp trong lớp THE SYSTEM SHALL không hiển thị cho HV nhãn "Hạn nộp", "Hạn hôm nay" hay "Quá hạn" của bộ đó, và hiển thị bộ ở trạng thái "Chưa mở" theo AC-19.9 khi HV chưa có bài nộp cho bộ đó trong lớp.
- AC-23.6: WHILE lớp ở trạng thái Đã kết thúc THE SYSTEM SHALL chỉ hiển thị nhãn "Hạn nộp {dd/MM}" cho các bộ có hạn và không hiển thị "Hạn hôm nay" hay "Quá hạn".
- AC-23.7: WHEN GV đặt hạn nộp cho một bộ đang "Chưa mở" hoặc xóa hạn nộp của một bộ trong lớp THE SYSTEM SHALL cập nhật dòng của bộ ở S11 cho HV của lớp trong thời hạn của NFR-4 — sau khi đặt hạn: nhãn hạn nộp và trạng thái "Chưa làm", "Đang làm" hoặc "Quá hạn", mở được S05; sau khi xóa hạn: "Chưa mở" với HV chưa có bài nộp, trong khi HV đã nộp vẫn thấy "Đã hoàn thành · {điểm}/{điểm tối đa}" và mở được S06.

### REQ-24: Deadline reminder — eligibility and timing — Email nhắc hạn nộp: điều kiện và thời điểm

<!-- Story: US-13 · Priority: P1 · v8 (V8-2) -->

- AC-24.1: WHEN đến 08:00 giờ Việt Nam (UTC+7) của mỗi ngày THE SYSTEM SHALL gửi cho mỗi HV, với mỗi lớp có ít nhất một bộ bài tập đủ điều kiện nhắc theo AC-24.2, đúng một email nhắc hạn nộp của lớp đó, gộp mọi bộ đủ điều kiện của lớp có hạn nộp là ngày hôm đó.
- AC-24.2: THE SYSTEM SHALL coi một bộ bài tập của một lớp là đủ điều kiện nhắc cho một HV chỉ khi tại lần xét gửi đồng thời: hạn nộp của bộ trong lớp là ngày hôm đó; tài khoản HV ở trạng thái "Đã kích hoạt" theo module 001 (không phải Chưa kích hoạt, Đang gửi email, Gửi email thất bại hay Đã khóa); HV đang là thành viên lớp; lớp ở trạng thái Đang học; bộ hiển thị với HV theo AC-17.1 (Bài và bộ Đã xuất bản, phần Bài tập không bị ẩn trong lớp); và HV chưa có bài nộp nào cho bộ đó trong lớp (HV có lượt làm dở vẫn đủ điều kiện).
- AC-24.3: THE SYSTEM SHALL xét điều kiện nhắc theo hạn nộp và dữ liệu tại lần xét gửi lúc 08:00, để hạn nộp được đặt, được đổi thành, hoặc trở lại hiệu lực cho ngày hôm đó sau 08:00 không tạo email nhắc nào trong ngày, và thay đổi xảy ra sau lần xét gửi (HV nộp bài, GV đổi hoặc xóa hạn, ẩn phần) không tạo email bổ sung hay email đính chính.
- AC-24.4: WHEN GV dời hạn nộp của một bộ sang một ngày sau hôm nay THE SYSTEM SHALL xét nhắc lại bộ đó vào 08:00 của ngày hạn mới theo AC-24.2, kể cả với HV đã được nhắc theo hạn cũ.
- AC-24.5: THE SYSTEM SHALL gửi cho mỗi HV nhiều nhất một email nhắc cho mỗi lớp mỗi ngày và nhắc mỗi bộ của mỗi lớp cho một HV nhiều nhất một lần trong cùng một ngày, kể cả khi lần xét gửi bị thực hiện lại.
- AC-24.6: IF lần xét gửi lúc 08:00 không thực hiện được do sự cố của hệ thống THEN THE SYSTEM SHALL thực hiện bù đúng một lần ngay khi khôi phục nếu khi đó chưa quá 20:00 giờ Việt Nam cùng ngày, với điều kiện xét tại lúc gửi bù, và bỏ lần nhắc của ngày đó nếu đã quá 20:00.

### REQ-25: Deadline reminder — content — Email nhắc hạn nộp: nội dung

<!-- Story: US-13 · Priority: P1 · v8 (V8-2) -->

- AC-25.1: WHEN hệ thống gửi email nhắc hạn nộp cho một HV THE SYSTEM SHALL dùng tiêu đề "[SAT] Hôm nay là hạn nộp bài tập – {tên lớp}" và nội dung gồm: "Chào {Họ tên HV},", câu "Hôm nay ({dd/MM/yyyy}) là hạn nộp {k} bộ bài tập của lớp {tên lớp} mà bạn chưa nộp:", rồi với mỗi bộ đủ điều kiện: tên bộ bài tập và dòng "{tên Bài} · Hạn nộp 23:59 {dd/MM/yyyy}", sau danh sách một nút "Làm bài ngay", câu "Liên kết mở bài tập (đăng nhập nếu cần). Bạn vẫn nộp được sau hạn; bài nộp sẽ được ghi “Nộp muộn”." và câu "Nếu bạn đã nộp bài, hãy bỏ qua thư này."
- AC-25.2: THE SYSTEM SHALL sắp các bộ trong email nhắc theo thứ tự Bài trong giáo trình của lớp, rồi theo thứ tự bộ trong phần Bài tập của Bài.
- AC-25.3: IF một email nhắc có hơn 20 bộ đủ điều kiện THEN THE SYSTEM SHALL chỉ liệt kê 20 bộ đầu tiên theo thứ tự của AC-25.2 và thêm dòng "Và {M} bài tập khác cũng hết hạn hôm nay." trước nút "Làm bài ngay".
- AC-25.4: WHEN HV chọn nút "Làm bài ngay" trong email nhắc THE SYSTEM SHALL mở S05 của bộ được nhắc khi email chỉ có một bộ, hoặc S02 của lớp khi email có từ hai bộ trở lên, nếu HV đang đăng nhập, hoặc mở A01 rồi chuyển HV thẳng tới màn hình đó sau khi đăng nhập thành công, với quy tắc truy cập và hiển thị như khi mở đường dẫn trực tiếp (AC-14.4, AC-14.5, AC-17.5).
- AC-25.5: THE SYSTEM SHALL gửi email nhắc bằng tiếng Việt với tên người gửi "SAT" và dòng cuối "Đây là thư tự động, vui lòng không trả lời." theo AC-17.5 của module 001, và không đưa vào email điểm, kết quả, thông tin của HV khác, Email hay số điện thoại của GV, hoặc bộ bài tập HV đã nộp.

### REQ-26: Deadline reminder — delivery and teacher visibility — Email nhắc hạn nộp: kết quả gửi và thông tin cho GV

<!-- Story: US-13 · Priority: P1 · v8 (V8-2) -->

- AC-26.1: IF dịch vụ gửi thư không nhận email nhắc của một HV sau mọi lần thử trong vòng 10 phút, hoặc báo địa chỉ không nhận được thư (cùng tiêu chí với AC-18.2 của module 001), THEN THE SYSTEM SHALL không gửi lại email đó, giữ nguyên trạng thái tài khoản của HV và ghi lần gửi thất bại kèm lý do vào nhật ký vận hành.
- AC-26.2: THE SYSTEM SHALL không tính email nhắc hạn nộp vào giới hạn thư chứa mật khẩu của module 001 (AC-18.5, AC-18.6) và không để các giới hạn đó chặn việc gửi email nhắc.
- AC-26.3: WHEN lần xét gửi của một ngày đã hoàn tất cho một bộ có hạn nộp hiệu lực là ngày đó trong lớp THE SYSTEM SHALL ghi nhận cho bộ đó trong lớp thời điểm gửi và số HV n có bộ đó trong email nhắc đã được chuyển cho dịch vụ gửi thư (n có thể bằng 0), cung cấp thông tin này cho phần theo dõi bộ bài tập của 009 (009 AC-19.7) cho tới khi hạn của bộ bị đổi hoặc xóa, và không hiển thị thông tin này ở ô hạn nộp của tab Nội dung.

## 6. Non-Functional Requirements

- NFR-1: Performance: T02 của workspace có 300 lớp, tab Học viên của lớp có 100 HV, tab Nội dung của lớp có giáo trình 50 Bài và thao tác "Tạo lớp" với 100 HV đều hoàn tất hiển thị trong ≤ 2 giây ở p95 trên máy tính với kết nối 10 Mbps.
- NFR-2: Performance: Kết quả tìm kiếm HV ở bước 2 của T03 và hộp thoại "Thêm học viên" cập nhật trong ≤ 1 giây ở p95 sau khi GV ngừng gõ, với workspace có 2.000 HV.
- NFR-3: Performance: S01 (HV thuộc 10 lớp), S02 (lớp có giáo trình 50 Bài), danh sách Thành viên của lớp có 100 HV và S11 (Bài có tổng cộng 40 bước học và bộ bài tập) hiển thị nội dung chính trong ≤ 3 giây ở p95 trên điện thoại tầm trung qua mạng 4G (10 Mbps, độ trễ 100 ms).
- NFR-4: Timeliness: Thay đổi về thành viên (kể cả việc một HV của lớp được kích hoạt, hiển thị ở danh sách Thành viên), trạng thái (kết thúc, mở lại, xóa), giáo trình, ẩn/hiện nội dung và hạn nộp bài tập (đặt, đổi, xóa — v8) của lớp có hiệu lực với HV trong ≤ 5 giây; thao tác ẩn/hiện hàng loạt trên giáo trình 50 Bài và đặt hoặc xóa hạn hàng loạt cho một Bài có 20 bộ bài tập hoàn tất trong ≤ 3 giây ở p95; việc chuyển Sắp bắt đầu → Đang học diễn ra trong ≤ 1 phút sau 00:00 (UTC+7) của ngày bắt đầu.
- NFR-5: Usability: Trong thử nghiệm với ≥ 5 GV lần đầu sử dụng, ≥ 80% tạo xong một lớp có 10 HV sẵn có và 1 giáo trình trong ≤ 3 phút và ≥ 80% ẩn được phần Bài tập của mọi Bài trong một lớp trong ≤ 30 giây, đều không cần hướng dẫn.
- NFR-6: Accessibility: 100% thao tác của T03, tab Nội dung của T04 (kể cả lịch chọn hạn nộp dạng popup), S01, S02 và S11 thực hiện được chỉ bằng bàn phím và có nhãn cho trình đọc màn hình; trạng thái "Hiển thị" / "Đang ẩn" và nhãn "Hạn nộp" / "Hạn hôm nay" / "Quá hạn" thể hiện bằng chữ, không chỉ bằng màu; email nhắc hạn nộp đọc đầy đủ ở chiều rộng 360–430 px không cần cuộn ngang; 100% ảnh đại diện ở danh sách Thành viên và tab Học viên có mô tả thay thế là họ tên HV; độ tương phản chữ ≥ 4.5:1; S01, S02 và S11 không cuộn ngang ở chiều rộng 360–430 px, T02–T04 không cuộn ngang ở chiều rộng ≥ 1024 px.
- NFR-7: Security: 100% ca kiểm thử cô lập (GV khác, HV không thuộc lớp, HV đã bị gỡ, tham chiếu HV hoặc giáo trình của workspace khác), 100% ca kiểm thử phần bị ẩn (mở trực tiếp Bài, nội dung, kết quả, lịch sử của phần đang ẩn; HV lớp khác cùng giáo trình) và 100% ca kiểm thử danh sách Thành viên (HV không thuộc lớp, HV chưa được kích hoạt) và 100% ca kiểm thử cô lập hạn nộp (lớp khác cùng giáo trình, GV khác đặt hạn, nút "Làm bài" trong email mở bởi người không còn là thành viên) cho đúng kết quả quy định, 0 thông tin của lớp hoặc của phần đang ẩn bị lộ trong phản hồi từ chối, và 0 trường dữ liệu của thành viên ngoài ảnh đại diện và họ tên được gửi đến thiết bị HV khi mở danh sách Thành viên.
- NFR-8: Observability: 100% thao tác tạo, sửa, đổi giáo trình, thêm/gỡ HV, kết thúc, mở lại, xóa lớp, ẩn/hiện nội dung (đơn lẻ và hàng loạt, kèm số phần thay đổi) và đặt/đổi/xóa hạn nộp (đơn lẻ và hàng loạt, kèm số bộ thay đổi) được ghi nhật ký vận hành gồm người thực hiện, lớp, loại thao tác, thời điểm và kết quả; 100% lần xét gửi email nhắc được ghi nhật ký gồm ngày, thời điểm bắt đầu và kết thúc, số email đã chuyển cho dịch vụ gửi thư và số email thất bại kèm lý do; 0 mục nhật ký chứa mật khẩu, email hoặc họ tên HV.
- NFR-9: Timeliness: Với tới 20.000 email nhắc trong cùng một ngày trên toàn hệ thống, 100% email của lần xét gửi lúc 08:00 được chuyển cho dịch vụ gửi thư trước 08:15 giờ Việt Nam, và ≥ 95% được dịch vụ gửi thư nhận trước 08:30, đo theo tháng.
- NFR-10: Reliability: Trong 100% ca kiểm thử của ma trận điều kiện AC-24.2 (từng điều kiện bị vi phạm riêng lẻ, HV ở 2 lớp, xét gửi chạy lại, hạn đổi trước và sau 08:00), 0 email nhắc được gửi cho HV không đủ điều kiện, 0 HV nhận hơn 1 email nhắc cho cùng một lớp trong một ngày và 0 bộ đủ điều kiện bị thiếu trong email.

## 7. Key Entities

- **Lớp (Class)** — đơn vị tổ chức học tập của một GV. Thuộc tính nghiệp vụ: tên lớp (duy nhất trong workspace), mô tả, lịch học (ghi chú tự do), ngày bắt đầu, ngày kết thúc (chỉ có khi GV kết thúc lớp), trạng thái (suy ra: Sắp bắt đầu / Đang học / Đã kết thúc), ngày tạo. Quan hệ: thuộc đúng một workspace; dùng đúng một Giáo trình (A2); có 0–100 Thành viên lớp; có một Thiết lập hiển thị phần cho mỗi phần (Bài học, Bài tập) của mỗi Bài trong giáo trình.
- **Thành viên lớp (Class membership)** — việc một HV thuộc một lớp. Thuộc tính: HV, lớp, ngày vào lớp; khi bị gỡ, bài nộp và điểm của HV trong lớp được giữ lại và ẩn khỏi lớp, hiển thị lại khi HV được thêm lại. Một HV có tối đa một tư cách thành viên đang hiệu lực trong mỗi lớp và có thể thuộc nhiều lớp của cùng GV (A3). HV có tài khoản chưa được kích hoạt ("Chưa kích hoạt" hoặc "Gửi email thất bại") vẫn là thành viên (tính sĩ số) nhưng vắng mặt trong danh sách Thành viên mà HV khác thấy cho tới khi được kích hoạt (V4-6).
- **Thiết lập hiển thị phần theo lớp (Class section visibility)** — trạng thái của một phần (Bài học hoặc Bài tập) của một Bài trong một lớp: "Hiển thị" (mặc định) hoặc "Đang ẩn"; người và thời điểm thay đổi gần nhất. Thuộc đúng một lớp, không ảnh hưởng lớp khác dùng cùng giáo trình (D5); được đặt lại khi lớp đổi giáo trình; không đổi được khi lớp Đã kết thúc.
- **Giáo trình và Bài (Curriculum, Lesson unit)** — sở hữu bởi 002. Module 003 dùng: tên và cấp độ HSK của giáo trình, trạng thái lưu trữ; danh sách Bài theo thứ tự, tên và trạng thái (Nháp / Đã xuất bản) của từng Bài; thứ tự bước học trong phần Bài học và thứ tự bộ bài tập trong phần Bài tập của một Bài; số lớp đang dùng.
- **Nội dung trong phần (Section content)** — bước học (004) thuộc phần Bài học, bộ bài tập (005) thuộc phần Bài tập; trạng thái Nháp / Đã xuất bản / Lưu trữ (quy tắc chung của 002). Nội dung do AI tạo chỉ trở thành nội dung của Bài khi GV duyệt (010, V3-4). Module 003 dùng: tên, loại, trạng thái, thứ tự, số nội dung đã xuất bản mỗi phần.
- **Học viên (Student)** — sở hữu bởi 001. Module 003 dùng: họ tên, email, trạng thái tài khoản (Chưa kích hoạt / Đã kích hoạt / Gửi email thất bại / Đã khóa — V4-6).
- **Hồ sơ học viên (Student profile)** — sở hữu bởi 011. Module 003 dùng: ảnh đại diện (hoặc ảnh mặc định) để hiển thị ở danh sách Thành viên và tab Học viên; S12 là đích khi HV chạm một bạn cùng lớp.
- **Bài nộp (Submission)** — sở hữu bởi 005. Module 003 dùng sự tồn tại của bài nộp bài tập trong lớp (để quyết định được xóa lớp, đổi giáo trình) và, từ 2026-10-22, của bài nộp bài thi được giao cho lớp (006 — chỉ để chặn xóa lớp) và điểm của bài nộp (để hiển thị ở S11). Từ v11, mỗi HV có nhiều nhất một bài nộp cho mỗi bộ bài tập trong một lớp (V11-1). MVP chỉ chấm tự động nên không có trạng thái chờ chấm (D3 v2).
- **Trạng thái của HV với bộ bài tập (Learner exercise status)** — giá trị hiển thị ở S11, suy ra từ 005 theo từng lớp: Chưa mở (2026-10-22 — bộ chưa có hạn nộp hiệu lực, HV chưa nộp) / Chưa làm / Quá hạn (v8) / Đang làm / Đã hoàn thành + điểm của bài nộp duy nhất (v11), kèm nhãn "Nộp muộn" (v8) (nhãn do 005 sở hữu). Bước học không có trạng thái theo HV vì việc xem bài học không được theo dõi (V3-1).
- **Hạn nộp bộ bài tập theo lớp (Class exercise deadline)** — v8: một ngày (hạn là 23:59 giờ Việt Nam của ngày đó) gắn với một bộ bài tập trong một lớp; người và thời điểm thay đổi gần nhất. Mỗi (lớp, bộ bài tập) có 0 hoặc 1 hạn nộp; không ảnh hưởng lớp khác dùng cùng giáo trình; được giữ nhưng không hiệu lực khi phần Bài tập đang ẩn, bộ bị Lưu trữ hoặc bộ/Bài còn Nháp; bị bỏ khi lớp đổi giáo trình hoặc bị xóa; không đổi được khi lớp Đã kết thúc. 005 dùng hạn nộp để gắn nhãn "Nộp muộn"; 009 dùng để hiển thị và chọn bộ bài tập mặc định ở T01. Từ 2026-10-22, hạn nộp hiệu lực là điều kiện để bộ bài tập "đang mở" với HV của lớp (làm được và được tính điểm — 005, 008); bộ không có hạn là "Chưa mở".
- **Lần nhắc hạn nộp (Deadline reminder)** — v8: kết quả xét gửi của một ngày. Theo (HV, ngày): một email gồm các (lớp, bộ bài tập) đủ điều kiện, thời điểm chuyển cho dịch vụ gửi thư, kết quả (Đã chuyển / Đã nhận / Thất bại + lý do). Theo (lớp, bộ bài tập, ngày hạn): thời điểm xét gửi và số HV được nhắc — hiển thị ở tab Nội dung (AC-26.3) và cho 009. Không lưu bản sao nội dung email.
- **Tiến độ bài tập theo Bài (Lesson exercise progress)** — sở hữu bởi 009: số bộ bài tập HV đã hoàn thành trên số bộ bài tập được tính trong một Bài của một lớp, chỉ tính các bộ đang hiển thị với lớp (X2, V3-1) và, từ 2026-10-22, đang mở (có hạn nộp hiệu lực — định nghĩa do 009 chốt). Module 003 trình bày ở S02 và S11; Bài có bộ hiển thị nhưng không bộ nào đang mở hiển thị "Bài tập chưa mở" (AC-13.7).

## 8. Edge Cases & Error Handling

- Ngày bắt đầu là hôm nay → lớp ở trạng thái Đang học ngay khi tạo; HV vào học được ngay (AC-2.6, AC-14.1).
- HV hoặc GV ở múi giờ khác → trạng thái lớp và mốc mở nội dung luôn tính theo giờ Việt Nam UTC+7 (AC-14.1, AC-14.2).
- Lớp Đang học có ngày bắt đầu cũ hơn 365 ngày → GV vẫn sửa được tên, mô tả, lịch học mà không bị lỗi khoảng ngày vì ngày bắt đầu không đổi (AC-7.3).
- Hai thẻ trình duyệt của cùng GV tạo hai lớp trùng tên gần như đồng thời → chỉ một lớp được tạo; lần còn lại quay về bước 1 với "Tên lớp đã tồn tại" (AC-5.4).
- GV bấm "Tạo lớp" nhiều lần hoặc bấm lại sau lỗi mạng → chỉ tối đa một lớp được tạo (AC-5.6).
- HV hoặc giáo trình đã chọn bị xóa (hoặc giáo trình bị lưu trữ) trong lúc wizard đang mở → không tạo lớp, quay về bước liên quan (AC-5.4).
- GV đóng T12 mà không tạo HV → bước 2 giữ nguyên lựa chọn (AC-3.3). HV đã tạo qua T12 rồi GV bỏ wizard → HV vẫn tồn tại trong workspace nhưng không thuộc lớp nào (AC-1.5).
- Import Excel qua T12 từ bước 2 tạo 150 HV → chỉ tự động chọn tới giới hạn 100, phần còn lại không được chọn (AC-3.5).
- Hai phiên thêm HV vào cùng một lớp cùng lúc → không HV nào bị trùng và sĩ số không vượt 100 (AC-8.3, AC-8.4).
- Lỗi kết nối khi thêm HV → không HV nào được thêm, GV thử lại được (AC-8.3).
- HV bị khóa (001) → vẫn được thêm và vẫn ở trong lớp với nhãn "Đã khóa"; HV không đăng nhập được cho tới khi được mở khóa (AC-3.1, AC-8.1).
- HV bị xóa (001) → biến mất khỏi danh sách và sĩ số của mọi lớp theo quy tắc xóa của 001 (phụ thuộc 001).
- HV "Chưa kích hoạt" được thêm vào lớp → tính vào sĩ số, GV thấy nhãn trạng thái "Chưa kích hoạt" ở tab Học viên (không có gợi ý kích hoạt); HV đó không có trong tab Tiến độ, tab Xếp hạng và danh sách Thành viên; sau khi GV kích hoạt, HV đăng nhập thấy lớp ở S01 và xuất hiện ở tab Tiến độ, tab Xếp hạng và danh sách Thành viên (AC-8.7, AC-8.8, AC-8.9, AC-20.3).
- Lớp có 10 HV, trong đó 2 "Chưa kích hoạt", 1 "Gửi email thất bại" và 1 "Đã khóa" → sĩ số "10/100" ở T02, T04 và tab Học viên; tab Tiến độ và tab Xếp hạng có 7 HV (gồm HV "Đã khóa") (AC-8.7, AC-8.9).
- GV bấm "Kích hoạt" nhưng gửi email thất bại → HV ở trạng thái "Gửi email thất bại", vẫn vắng mặt khỏi danh sách Thành viên và chưa đăng nhập được cho tới khi GV "Gửi lại" thành công (AC-20.3, phụ thuộc 001).
- HV chạm một bạn cùng lớp vừa bị gỡ khỏi lớp khi danh sách Thành viên đang mở là dữ liệu cũ → S12 áp dụng quy tắc truy cập của 011 (chỉ mở khi hai HV còn ít nhất một lớp chung); mở lại danh sách thì không còn dòng đó (AC-20.5, AC-20.3).
- Bạn cùng lớp chưa tải ảnh đại diện hoặc ảnh đã bị GV gỡ (011) → hiển thị ảnh đại diện mặc định của 011 ở danh sách Thành viên và tab Học viên (AC-20.2, AC-8.1).
- Hai thành viên trùng họ tên → HV phân biệt bằng ảnh đại diện hoặc mở S12; không hiển thị thêm thông tin nhận dạng (AC-20.2, AC-20.4).
- Lớp Sắp bắt đầu → S02 chưa có danh sách Thành viên (cũng như danh sách Bài); danh sách xuất hiện khi lớp chuyển sang Đang học (AC-20.1, AC-14.3).
- HV bị gỡ hoặc lớp bị xóa trong lúc HV đang mở S02, S11 hoặc đang làm bài tập → thao tác kế tiếp hoặc lần nộp của HV bị từ chối và HV về S01 (AC-14.5).
- Lớp kết thúc khi HV đang làm dở bài tập → câu trả lời được giữ, không nộp được; mở lại lớp thì tiếp tục được (AC-10.5).
- GV đổi giáo trình trong lúc HV đang xem S02 hoặc S11 → HV thấy các Bài của giáo trình mới từ lần mở kế tiếp; mọi thiết lập ẩn cũ bị bỏ (AC-9.2).
- GV xuất bản một Bài mới hoặc nội dung mới trong giáo trình → xuất hiện với HV mọi lớp dùng giáo trình, các phần ở trạng thái Hiển thị trừ khi lớp đã đặt trước "Đang ẩn" khi Bài còn Nháp (AC-17.3, AC-15.3).
- GV duyệt nội dung do AI tạo vào một Bài (010) → nội dung đã duyệt xuất hiện với HV như nội dung soạn tay, theo quy tắc xuất bản của 002 và quy tắc hiển thị của lớp; nội dung AI chưa duyệt không bao giờ xuất hiện với HV (AC-17.1, AC-17.7).
- GV ẩn một phần ở lớp A → HV lớp B dùng cùng giáo trình không bị ảnh hưởng (AC-17.3).
- Một HV ở hai lớp dùng cùng giáo trình với thiết lập ẩn khác nhau → mỗi lớp hiển thị theo thiết lập riêng; nhãn và tiến độ tính riêng từng lớp (AC-13.6).
- Ẩn cả 2 phần của một Bài → Bài biến mất khỏi S02; HV đang ở S11 của Bài đó được đưa về S02 ở thao tác kế tiếp; đường dẫn trực tiếp tới Bài cho A05 (AC-17.2, AC-17.5, AC-18.3).
- Bài Đã xuất bản nhưng mọi nội dung của các phần không bị ẩn còn Nháp → S02 hiển thị Bài với nhãn "Chưa có nội dung"; S11 hiển thị thông điệp trống (AC-13.4, AC-19.6).
- Bài có bước học hiển thị nhưng không có bộ bài tập hiển thị (phần Bài tập đang ẩn hoặc chưa có bộ đã xuất bản) → S02 và S11 hiển thị "Chưa có bài tập" thay cho tiến độ; S11 chỉ có tab Bài học (AC-13.4, AC-19.1).
- HV xem nhiều hay ít bước học → không làm thay đổi tiến độ; tiến độ chỉ đếm bộ bài tập (AC-13.3, AC-19.2).
- HV đang làm dở bài tập khi phần Bài tập bị ẩn → lần lưu hoặc nộp kế tiếp bị từ chối, lượt dở được giữ; khi hiện lại, HV tiếp tục chính lượt đó (AC-18.2, AC-17.6).
- HV đang xem bước học hoặc học flashcard khi phần Bài học bị ẩn → thao tác chuyển bước hoặc chuyển thẻ kế tiếp không hiển thị nội dung, HV về S11 (AC-18.1).
- Bước học có liên kết "Luyện tập" tới bộ bài tập trong phần Bài tập đang ẩn → liên kết không hiển thị với HV (AC-17.4).
- Ẩn/hiện hàng loạt bị mất kết nối giữa chừng → không phần nào thay đổi (AC-16.5).
- Hai phiên của GV cùng ẩn một phần → phiên sau nhận "Phần này đã ở trạng thái «Đang ẩn»." và không có thay đổi trùng (AC-16.6); thao tác hàng loạt bỏ qua phần đã ở trạng thái đích (AC-16.4).
- Lớp Đã kết thúc → tab Nội dung chỉ xem; thiết lập ẩn giữ nguyên như lúc kết thúc (AC-10.3).
- GV sửa đáp án bộ bài tập và hệ thống chấm lại bài nộp cũ (X5, 005) → điểm của bài nộp ở S11 và tiến độ ở S02 phản ánh kết quả mới (AC-19.3, AC-13.3).
- HV đã có điểm từ một phần nay bị ẩn → kết quả đó vẫn được giữ và được 008 tính vào Điểm xếp hạng theo quy tắc của 008 (X2) dù HV không thấy chi tiết kết quả (AC-17.4).
- GV lưu trữ một bước học hoặc bộ bài tập đã có dữ liệu học tập (002) → nội dung biến mất với HV ở mọi lớp, kể cả khỏi tab phần ở S11; dữ liệu được giữ; khôi phục thì hiện lại cùng dữ liệu cũ (AC-17.1, AC-19.2, AC-19.3).
- Bài bị xóa khỏi giáo trình (002 chỉ cho khi chưa có dữ liệu học tập) → biến mất khỏi tab Nội dung và S02 cùng thiết lập ẩn của nó (AC-15.1, AC-13.2).
- Giáo trình của lớp chưa có Bài nào hoặc chưa có Bài đã xuất bản → tab Nội dung và S02 hiển thị thông điệp trống tương ứng (AC-15.4, AC-13.5).
- Tên lớp chứa chữ Hán, pinyin có dấu thanh hoặc tiếng Việt có dấu → hợp lệ, hiển thị đúng ở mọi màn hình (AC-2.1, A5).
- Phiên đăng nhập của GV hết hạn giữa wizard → dữ liệu wizard không được lưu (không có nháp); sau khi đăng nhập lại GV bắt đầu từ T02 (AC-1.6, phụ thuộc 001).
- GV mở đường dẫn T04 của lớp đã xóa hoặc của GV khác → A05 "Không tìm thấy nội dung bạn yêu cầu." (AC-14.6). HV mở màn hình của GV → xử lý theo quy tắc phân quyền vai trò của 001.
- (v8) GV đặt hạn hôm nay lúc 09:00 → không có email nhắc trong ngày (popup đã cảnh báo); HV vẫn thấy "Hạn hôm nay" và từ 00:00 hôm sau thấy "Quá hạn" nếu chưa nộp (AC-21.5, AC-24.3, AC-23.2, AC-23.3).
- (v8) GV đặt hạn là một ngày đã qua → HV chưa nộp thấy "Quá hạn" ngay, không có email (AC-21.4, AC-23.3).
- (v8) Lớp Sắp bắt đầu có hạn nộp trước ngày bắt đầu → không có email (lớp chưa Đang học vào ngày hạn); từ ngày bắt đầu HV chưa nộp thấy "Quá hạn" (AC-21.5, AC-24.2, AC-23.3).
- (v8) Email đã gửi lúc 08:00, sau đó GV dời hạn sang ngày mai → không có email nào trong hôm nay nữa; 08:00 ngày mai, HV vẫn chưa nộp nhận nhắc lại (AC-24.3, AC-24.4).
- (v8) GV dời hạn từ ngày mai về hôm nay lúc 10:00 → không có email hôm nay, kể cả với HV chưa từng được nhắc (AC-24.3).
- (v8) GV xóa hạn sau khi email đã gửi → không có email đính chính; HV không còn thấy nhãn hạn (AC-24.3, AC-23.5).
- (v8) GV đổi hạn rồi đổi lại đúng ngày cũ trong cùng một ngày đã nhắc → không có email thứ hai cho bộ đó trong ngày (AC-24.5).
- (v8) HV nộp lúc 07:59 → không có bộ đó trong email; HV nộp lúc 08:05 sau khi nhận email → không có email nào thêm, S11 hiển thị "Đã hoàn thành" (AC-24.2, AC-24.3).
- (v8) HV có lượt làm dở nhưng chưa nộp → vẫn được nhắc; sau hạn chỉ hiển thị "Quá hạn" (không kèm "Đang làm"), nút "Tiếp tục làm" vẫn còn (AC-24.2, AC-23.3).
- (v8) HV ở hai lớp có bộ cùng hạn hôm nay → một email liệt kê bộ của cả hai lớp, sắp theo tên lớp (AC-24.1, AC-25.2).
- (v8, cập nhật 2026-10-22) HV Chưa kích hoạt, Gửi email thất bại hoặc Đã khóa → không nhận email nhắc; HV Đã khóa vẫn được tính trong danh sách Chưa làm của 009, còn HV Chưa kích hoạt hoặc Gửi email thất bại không có trong phần theo dõi của 009 (AC-24.2, AC-8.9).
- (v8) HV bị gỡ khỏi lớp trước 08:00 → không có email cho lớp đó; được thêm lại → xét theo các hạn từ ngày được thêm lại (AC-24.2).
- (v8) Phần Bài tập bị ẩn lúc 08:00 rồi hiện lại lúc 10:00 cùng ngày → không có email cho các bộ đó trong ngày; HV thấy lại hạn và nhãn (AC-22.5, AC-24.3).
- (v8) Bộ bài tập bị Lưu trữ rồi khôi phục (002) → hạn được giữ và có hiệu lực lại; không có email cho các ngày bộ đang Lưu trữ (AC-22.5).
- (v8) GV đặt hạn cho bộ hoặc Bài còn Nháp → HV chưa thấy; khi xuất bản trước ngày hạn, hạn có hiệu lực và email được xét như bình thường (AC-21.1, AC-22.5).
- (v8) Lớp kết thúc trước ngày hạn → không có email; HV chỉ thấy "Hạn nộp dd/MM"; mở lại lớp → các hạn chưa qua lại có hiệu lực (AC-24.2, AC-23.6).
- (v8) Lớp đổi giáo trình → mọi hạn nộp của lớp bị bỏ (AC-9.2).
- (v8) Hai lớp A, B dùng cùng giáo trình, chỉ lớp A đặt hạn → HV lớp B không thấy hạn và không nhận email (AC-22.4).
- (v8) Hai phiên của GV đặt hạn khác nhau cho cùng một bộ → lần xác nhận sau cùng có hiệu lực; ô hiển thị giá trị đã lưu ở lần tải kế tiếp (AC-21.3).
- (v8, cập nhật 2026-10-22) Đặt hạn hàng loạt cho Bài có bộ đã có hạn khác → mọi bộ Đã xuất bản nhận hạn mới ngay khi bấm "Áp dụng", không có hộp xác nhận (AC-22.1).
- (v8) Hạn nộp sang năm sau → HV thấy "Hạn nộp dd/MM/yyyy" (AC-23.1).
- (v8) Hệ thống gặp sự cố lúc 08:00 và khôi phục lúc 11:00 → gửi bù một lần lúc 11:00; khôi phục sau 20:00 → bỏ nhắc của ngày đó (AC-24.6).
- (v8) Dịch vụ gửi thư từ chối email nhắc hoặc địa chỉ không nhận thư → không gửi lại, trạng thái tài khoản HV không đổi, lỗi được ghi nhật ký (AC-26.1).
- (v8, cập nhật 2026-10-22) Có hơn 20 bộ cùng hạn cho một HV trong một lớp → email của lớp đó liệt kê 20 bộ đầu và số bộ còn lại (AC-25.3); HV thuộc nhiều lớp có bộ đến hạn cùng ngày nhận mỗi lớp một email (AC-24.1).
- (v8) HV bấm "Làm bài ngay" trong email sau khi bị gỡ, khi phần đã bị ẩn hoặc khi lớp đã kết thúc → áp dụng quy tắc truy cập và hiển thị thông thường (AC-25.4, AC-14.5, AC-17.5, AC-14.4).
- (v8) GV sửa Email của HV trước 08:00 → email nhắc gửi tới Email hiện tại của HV (AC-24.1, phụ thuộc 001).
- (2026-10-22) HV mới vào lớp Đang học, chưa làm gì → mở được mọi Bài và mọi bước học theo bất kỳ thứ tự nào, kể cả Bài cuối trước Bài đầu (AC-19.8).
- (2026-10-22) Bộ bài tập Đã xuất bản nhưng lớp chưa đặt hạn → HV thấy dòng bị vô hiệu "Chưa mở" · "Giáo viên chưa đặt hạn nộp" kèm số câu hỏi; chạm không mở gì; mở đường dẫn trực tiếp tới S05 thấy màn hình bắt đầu không có nút làm bài (005 AC-23.8) (AC-19.9, AC-19.5).
- (2026-10-22) Bài có bộ bài tập hiển thị nhưng chưa bộ nào có hạn → S02 và phần đầu S11 hiển thị "Bài tập chưa mở" thay cho tiến độ; tab Bài tập vẫn liệt kê các bộ "Chưa mở" (AC-13.7, AC-19.9).
- (2026-10-22) GV đặt hạn cho một bộ "Chưa mở" → HV thấy bộ với nhãn hạn và "Chưa làm" (hoặc "Đang làm" nếu có lượt dở đã giữ, "Quá hạn" nếu hạn đã qua) trong ≤ 5 giây; email nhắc xét như bình thường (AC-23.7, AC-24.2, NFR-4).
- (2026-10-22) GV xóa hạn khi HV đang làm dở → popup đã cảnh báo; HV chưa nộp thấy "Chưa mở", lần lưu/nộp kế tiếp bị từ chối, câu trả lời đã lưu được giữ; GV đặt lại hạn thì HV làm tiếp (AC-21.8, AC-23.7, 005 AC-23.9 – AC-23.11).
- (2026-10-22) GV xóa hạn sau khi đã có bài nộp → HV đã nộp vẫn thấy "Đã hoàn thành · {điểm}/{điểm tối đa}" và S06; bài nộp không còn nhãn "Nộp muộn"; việc 008 còn tính bộ đó hay không thuộc 008 (AC-23.7, 005 AC-23.11).
- (2026-10-22) Xóa hạn hàng loạt cho cả Bài → mọi bộ Đã xuất bản của Bài thành "Chưa mở" với HV chưa nộp; thông báo nêu số bộ (AC-22.2, AC-21.8).
- (2026-10-22) Bộ mới được xuất bản, GV duyệt nội dung AI thay phần Bài tập, hoặc lớp đổi giáo trình → các bộ mới chưa có hạn nên "Chưa mở" với HV cho tới khi GV đặt hạn ở tab Nội dung (AC-22.4, AC-9.2, AC-21.7).
- (2026-10-22) Lớp Đã kết thúc → bộ chưa có hạn vẫn hiển thị "Chưa mở"; không bộ nào bắt đầu được (AC-14.4, AC-19.9).
- (2026-10-22) HV thuộc hai lớp cùng giáo trình, chỉ lớp A đặt hạn bộ X → ở lớp A X làm được, ở lớp B X "Chưa mở" (AC-22.4, AC-13.6).
- (2026-10-22) Xem như học viên (T21 — 002) và "Xem trước" (T20 — 010) không thuộc lớp nào → không có "Chưa mở" (005 AC-18.6).
- (2026-10-22, 006) Lớp chưa có bài nộp bài tập nhưng đã có một bài nộp bài thi (kể cả nộp tự động) → "Xóa lớp" bị vô hiệu với "Không thể xóa lớp đã có bài nộp của học viên."; đổi giáo trình vẫn được (AC-11.3, AC-9.3).
- (2026-10-22, 006) Xóa một lớp chưa có bài nộp đang được giao 2 bài thi → lớp biến khỏi danh sách lớp được giao của cả 2 bài thi; bài thi và các lớp được giao khác giữ nguyên (AC-11.5).
- (2026-10-22, 006) Lớp có bài thi được giao nhưng HV chưa thấy được (bài thi Nháp theo 006) hoặc không có bài thi → S02 không có lối vào "Bài thi của lớp" (AC-13.8); lớp Sắp bắt đầu → không có lối vào (AC-14.3).
- (2026-10-22, 006) GV ẩn cả hai phần của mọi Bài → bài thi được giao cho lớp vẫn hiển thị và làm được theo 006; lối vào ở S02 vẫn còn (AC-17.8, AC-13.8).

## 9. Out of Scope

- Lưu nháp wizard hoặc lớp ở trạng thái nháp; khôi phục dữ liệu wizard sau khi rời trang.
- Ngày kết thúc dự kiến (ở T03 hoặc ở biểu mẫu sửa lớp) và tự động kết thúc lớp theo ngày — lớp chỉ kết thúc thủ công (Q-3 đóng 2026-10-22, AC-10.6).
- Đổi giáo trình của lớp đã có bài nộp bài tập (Q-1 đóng 2026-10-22, AC-9.3).
- Trạng thái "Lưu trữ" riêng ngoài "Đã kết thúc"; ẩn lớp khỏi danh sách.
- Nhiều giáo trình trong một lớp; nhiều GV hoặc trợ giảng cho một lớp.
- HV tự đăng ký hoặc tự tham gia lớp bằng mã mời/đường dẫn (D4).
- Chuyển HV giữa các lớp bằng một thao tác (thực hiện bằng gỡ rồi thêm); gỡ nhiều HV cùng lúc; nhập danh sách HV của lớp trực tiếp từ Excel (dùng Import Excel của T12 rồi chọn).
- Mục "Đã rời lớp" để GV xem dữ liệu học tập của HV đã bị gỡ.
- Lịch học có cấu trúc (buổi học, thời khóa biểu), điểm danh, học trực tuyến qua video.
- Ẩn/hiện riêng từng nội dung (một bước học, một bộ bài tập) cho từng lớp — chỉ ẩn/hiện ở mức phần (D5); hẹn giờ ẩn/hiện; quy tắc tự ẩn một phần ở các Bài thêm sau; chọn tùy ý nhiều Bài để ẩn/hiện ngoài thao tác theo cột và theo dòng.
- Mở khóa tuần tự (mục sau chỉ mở khi mục trước hoàn thành) và mở nội dung theo lịch từng Bài.
- (2026-10-22) Mở bộ bài tập bằng cách khác ngoài đặt hạn nộp (nút "Mở" riêng, ngày mở, mở cho từng HV); ẩn bộ "Chưa mở" khỏi HV; hộp xác nhận khi xóa hạn (chỉ có cảnh báo trong popup — AC-21.8); nhãn "Chưa mở" ở S02 cho từng bộ (S02 chỉ có nhãn cấp Bài "Bài tập chưa mở" — AC-13.7).
- Xem trước như HV của một lớp cụ thể (áp dụng thiết lập ẩn của lớp); xem trước theo giáo trình thuộc T21 (002).
- Thông báo email/push khi HV được thêm vào lớp, khi lớp bắt đầu, kết thúc hoặc khi nội dung bị ẩn/hiện (A6 vẫn đúng với các sự kiện này; email tài khoản theo V4-6 do 001 gửi; từ v8, email duy nhất do 003 gửi là email nhắc hạn nộp — REQ-24).
- (v8) Hạn nộp có giờ tùy chọn khác 23:59; hạn nộp hoặc gia hạn riêng cho từng HV; chặn nộp bài sau hạn (HV vẫn nộp được, bài được 005 đánh dấu "Nộp muộn"); hạn nộp cho bước học; đặt hạn hàng loạt cho nhiều Bài hoặc cả giáo trình.
- (v8) Nhắc nhiều lần (trước hạn một ngày, sau khi quá hạn), nhắc qua push/SMS/Zalo, email báo cho GV; GV tắt nhắc theo lớp hoặc theo bộ, sửa nội dung email hay gửi nhắc thủ công; HV hủy nhận email nhắc; theo dõi HV đã mở email hay chưa.
- (v8) Danh sách "Sắp đến hạn" hoặc lịch hạn nộp cho HV ở S01, S02; nhãn hạn nộp ở S02.
- (v8) Danh sách Đã làm / Chưa làm theo bộ bài tập ở T01 và tab Tiến độ của T04 (009); nhãn "Nộp muộn" và cách tính điểm của bài nộp muộn (005, 008).
- Hồ sơ HV (S10, S12), tải hoặc gỡ ảnh đại diện và ảnh bìa (011); kích hoạt tài khoản, gửi email đăng nhập và đổi mật khẩu (001).
- Tìm kiếm hoặc lọc trong danh sách Thành viên; nhắn tin, kết bạn, theo dõi hay bình luận giữa HV; hiển thị tiến độ, hạng hay điểm của bạn cùng lớp ngay trong danh sách Thành viên (chỉ ở S12 của 011 và S09 của 008).
- Chấm tay, trạng thái "Chờ chấm" và các dạng câu Nói, Nghe, Viết đoạn tự do (D3 v2; module 007 hoãn sau MVP).
- Nhân bản lớp; xuất danh sách lớp hoặc danh sách HV của lớp.
- Cách tính tiến độ (009), điểm xếp hạng và bảng xếp hạng (008); nội dung các tab Tiến độ, Xếp hạng của T04; soạn, sắp xếp thứ tự trong từng phần và xuất bản Bài (002); tạo nội dung bằng AI và duyệt (010).
- [thay thế 2026-10-22 — một phần: 006 được khôi phục thành bài thi độc lập giao cho lớp; 003 nay có lối vào "Bài thi của lớp" ở S02 (AC-13.8), bỏ lớp khỏi bài thi khi xóa lớp (AC-11.5) và tính bài nộp bài thi khi chặn xóa lớp (AC-11.3); phần còn lại dưới đây vẫn ngoài phạm vi của 003 hoặc thuộc 006] Hoãn (v3, 2026-10-20) — phần Bài thi và mọi thứ gắn với nó trong lớp: lịch thi theo lớp và ô lịch thi ở tab Nội dung, tab "Kết quả thi" của T04 (T16), nhãn "Bài thi đang mở" ở S02, tab Bài thi ở S11, quy tắc lượt thi khi lớp kết thúc hoặc khi phần bị ẩn, điều kiện hiển thị bài thi với HV (module 006 hoãn sau MVP cùng S07, S08).
- Hoãn (v3, 2026-10-20) — lộ trình học trong Bài: tab "Lộ trình" và nhãn "Gợi ý tiếp theo" ở S11.
- Hoãn (v3, 2026-10-20) — theo dõi việc xem bài học: "Đánh dấu đã học", trạng thái Chưa học / Đã học của bước học và thời lượng học (V3-1).
- (v11) Làm lại bộ bài tập đã nộp, lượt làm thứ hai, "lần cao nhất" hay lịch sử lượt làm ở S02 và S11 (V11-1); nội dung S06 "Xem lại bài làm" (đáp án, giải thích — 005).

### Removed (2026-10-22)

Không AC nào bị bỏ (không có mã bị bỏ); các hành vi sau không còn:

- **Bộ bài tập không có hạn nộp vẫn mở và làm được** (AC-19.4, AC-19.5, AC-23.5 cũ; US-12 cũ: "không có nhãn hạn ở W"): nay bộ chưa có hạn là "Chưa mở", bị vô hiệu ở S11 (AC-19.9) và không làm được (005).
- **"Đã xóa hạn nộp." / "Đã xóa hạn nộp của {K} bộ bài tập." không nêu hệ quả** (AC-21.6, AC-22.2 cũ): thông báo nay nêu bộ chuyển sang "Chưa mở" với HV.

## 10. Assumptions & Dependencies

Quyết định của module này (ghi nhận chi tiết ở §12):

- Wizard không lưu nháp; rời wizard sau khi xác nhận sẽ hủy dữ liệu.
- Lớp được tạo với 0–100 HV; bắt buộc chọn đúng một giáo trình chưa bị lưu trữ.
- Ngày bắt đầu trong khoảng ±365 ngày quanh hôm nay; ngày đã qua được phép.
- Tên lớp duy nhất trong workspace, không phân biệt chữ hoa/thường, tính cả lớp Đã kết thúc.
- HV bị khóa vẫn được thêm vào lớp; tìm kiếm không phân biệt dấu tiếng Việt.
- Lớp chỉ kết thúc thủ công khi Đang học (không có ngày kết thúc dự kiến — Q-3 đóng 2026-10-22 theo prototype); có thể mở lại; không có trạng thái lưu trữ riêng.
- Xóa lớp và đổi giáo trình chỉ khi lớp chưa có bài nộp bài tập nào (Q-1 đóng 2026-10-22 theo prototype); đổi giáo trình đặt lại thiết lập ẩn.
- HV bị gỡ: bài nộp và điểm được giữ lại, ẩn khỏi lớp, hiển thị lại khi thêm lại.
- Trước ngày bắt đầu, S02 không hiển thị danh sách Bài; lớp Đã kết thúc ở chế độ chỉ xem lại và thiết lập ẩn bị khóa.
- Ẩn/hiện ở mức phần (Bài học, Bài tập), mặc định Hiển thị; thao tác hàng loạt theo cột (mọi Bài hiện có) và theo dòng (cả Bài); Bài Nháp được đặt trước; cả ẩn và hiện đều cần xác nhận.
- Lượt bài tập dở được giữ nhưng không nộp được khi phần Bài tập bị ẩn hoặc lớp kết thúc; tiếp tục được khi hiện lại hoặc mở lại lớp.
- Tiến độ trình bày ở S01, S02, S11 chỉ đếm bộ bài tập (V3-1); Bài có bước học nhưng không có bộ bài tập hiển thị → "Chưa có bài tập".
- S11 chỉ có hai tab Bài học · Bài tập, mở được mọi mục theo bất kỳ thứ tự nào, không có mục gợi ý; HV không thấy nhãn "AI tạo" hay nội dung AI chưa được GV duyệt.
- (v4, cập nhật 2026-10-22) HV "Chưa kích hoạt" được thêm vào lớp và tính sĩ số; chỉ GV thấy HV chưa được kích hoạt ("Chưa kích hoạt" hoặc "Gửi email thất bại") cho tới khi kích hoạt xong, và chỉ ở tab Học viên (cùng sĩ số) — tab Tiến độ, tab Xếp hạng của T04 chỉ gồm HV đã kích hoạt, kể cả HV "Đã khóa" (theo prototype, AC-8.9).
- (v4) Danh sách Thành viên cho HV nằm ở S02 của lớp Đang học hoặc Đã kết thúc; mỗi dòng chỉ có ảnh đại diện và họ tên; chính HV đứng đầu với nhãn "Bạn"; chạm bạn cùng lớp mở S12, chạm dòng của mình mở S10 (011).
- (v8) Hạn nộp đặt theo từng bộ bài tập và từng lớp, là một ngày; hạn là 23:59 giờ Việt Nam của ngày đó; chọn bằng lịch popup cùng kiểu 009 AC-9.8, trong khoảng ±365 ngày; ngày đã qua được phép kèm cảnh báo; không có hạn thì không có nhắc, không có "Quá hạn" và không bao giờ "Nộp muộn" — và, từ 2026-10-22, bộ "Chưa mở" (không làm được).
- (v8, cập nhật 2026-10-22) Đặt hạn hàng loạt theo Bài thay thế mọi hạn cũ của các bộ Đã xuất bản trong Bài; đặt và xóa hạn (đơn lẻ hay cả Bài) không cần xác nhận; chỉ bộ Đã xuất bản có ô hạn nộp, GV đặt trước được hạn cho bộ Đã xuất bản thuộc Bài Nháp; bộ Lưu trữ không hiển thị ở tab Nội dung nhưng hạn được giữ.
- (v8, cập nhật 2026-10-22) Email nhắc: lúc 08:00 giờ Việt Nam ngày đến hạn, mỗi HV một email cho mỗi lớp mỗi ngày, gộp mọi bộ đủ điều kiện của lớp; điều kiện xét tại 08:00; hạn đặt hoặc đổi thành hôm nay sau 08:00 không tạo email; dời hạn sang ngày sau thì nhắc lại vào ngày mới; sự cố thì gửi bù một lần trước 20:00; thất bại không gửi lại và không đổi trạng thái tài khoản; không tính vào giới hạn thư chứa mật khẩu của 001.
- (v8) "Hạn hôm nay" chỉ hiện khi HV chưa nộp; "Quá hạn" thay "Chưa làm" và "Đang làm" theo thứ tự ưu tiên của 005 (Đã hoàn thành › Quá hạn › Đang làm › Chưa làm); lớp Đã kết thúc chỉ hiện "Hạn nộp dd/MM"; thông tin đã gửi nhắc (thời điểm, số HV) chỉ hiện ở phần theo dõi của 009, không ở tab Nội dung (cập nhật 2026-10-22).
- (v11) Mỗi HV nộp mỗi bộ bài tập đúng một lần trong lớp (005, thay X1); S11 hiển thị điểm của bài nộp duy nhất đó; "Đã hoàn thành" mở S06 "Xem lại bài làm"; S02 và S11 không có "Làm lại", kể cả ở lớp Đã kết thúc.
- (2026-10-22) HV học được mọi Bài, mọi bước học theo bất kỳ thứ tự nào, không khóa (AC-19.8); hạn nộp là điều kiện mở bộ bài tập: bộ không có hạn nộp hiệu lực trong lớp là "Chưa mở" · "Giáo viên chưa đặt hạn nộp", hiển thị bị vô hiệu ở S11 kèm số câu hỏi, không mở được (AC-19.9); Bài không có bộ nào đang mở → "Bài tập chưa mở" ở S02, S11 (AC-13.7); tab Nội dung hiển thị "Chưa mở với học viên" dưới "Đặt hạn" và cảnh báo trong popup trước khi xóa hạn, không có hộp xác nhận (AC-21.7, AC-21.8); bộ mới luôn "Chưa mở" cho tới khi GV đặt hạn (AC-22.4); điều kiện nhắc email không đổi (chỉ bộ có hạn hôm đó).

Phụ thuộc:

- **001** — danh sách HV của workspace (họ tên, email, trạng thái tài khoản Chưa kích hoạt / Đã kích hoạt / Gửi email thất bại / Đã khóa — V4-6), hộp thoại T12 (email + họ tên, từng người hoặc Import Excel) mở được từ T03 bước 2 và từ T04 và trả về các HV vừa thêm ở trạng thái "Chưa kích hoạt", T11 nơi GV kích hoạt HV, quy tắc xóa HV (gỡ HV khỏi mọi lớp), màn hình A05 "Không tìm thấy nội dung bạn yêu cầu.", phân quyền theo vai trò và phiên đăng nhập (không còn A04 — không bắt buộc đổi mật khẩu lần đầu). Từ v8: trạng thái "Đã kích hoạt" và Email hiện tại của HV cho email nhắc (AC-24.2); quy tắc chung của thư — tiếng Việt, tên người gửi "SAT", dòng cuối, dịch vụ gửi thư và tiêu chí gửi thất bại (001 AC-17.4, AC-17.5, AC-18.2); A01 chuyển HV tới S05 hoặc S02 sau khi đăng nhập từ nút "Làm bài ngay" (AC-25.4); email nhắc được ghi trong danh mục thư của 001 dưới dạng tham chiếu (001 AC-17.5).
- **002** — (v8: trạng thái Nháp / Đã xuất bản / Lưu trữ của bộ bài tập quyết định hạn nộp có hiệu lực — AC-22.5) danh sách giáo trình (tên, cấp độ HSK, trạng thái lưu trữ, số lớp đang dùng); danh sách Bài theo thứ tự với trạng thái Nháp / Đã xuất bản; mỗi Bài đúng 2 phần Bài học · Bài tập với thứ tự bước học và bộ bài tập trong từng phần (T18 Soạn bài); quy tắc Lưu trữ / Khôi phục bước học và bộ bài tập (nội dung lưu trữ vắng mặt với HV ở mọi lớp); T06, T18; giả định giáo trình đang được ít nhất một lớp dùng không thể bị xóa.
- **004** — bước học, bộ thẻ từ vựng; S03 (xem bước học, Trước/Tiếp trong phần Bài học), S04 tôn trọng quy tắc hiển thị (AC-17.1, AC-17.4) và từ chối thao tác khi phần bị ẩn (AC-18.1); không khóa bước học theo thứ tự hay theo bài tập (AC-19.8, 004 AC-13.8); nút "Luyện tập" của bộ "Chưa mở" bị vô hiệu (004 AC-10.3); liên kết "Luyện tập" chỉ hiện khi bộ bài tập hiển thị với HV; việc xem bước học không được theo dõi (V3-1).
- **005** — bộ bài tập, nhãn trạng thái Chưa làm / Đang làm / Đã hoàn thành (005 sở hữu), lượt làm dở, một bài nộp mỗi bộ trong lớp và điểm của bài nộp đó (V11-1, thay X1), S06 "Xem lại bài làm", chấm lại (X5); S05, S06 tôn trọng quy tắc hiển thị và trạng thái lớp (AC-18.2, AC-10.5, AC-14.4); T14 xem bài nộp chỉ đọc (X3). Từ v8: trạng thái "Quá hạn" và thứ tự ưu tiên trạng thái, nhãn "Nộp muộn" theo hạn nộp của lớp (V8-3); S05 hiển thị nhãn hạn nộp của REQ-23 ở phần đầu và cho nộp sau hạn (AC-23.4); sự tồn tại bài nộp của HV cho một bộ trong lớp để xét email nhắc (AC-24.2). Từ 2026-10-22: trạng thái "Chưa mở" và quy tắc mở / đóng bộ theo hạn nộp hiệu lực của lớp (005 AC-17.5, AC-23.7 – AC-23.11), màn hình bắt đầu S05 của bộ "Chưa mở" (005 AC-23.8), số câu hỏi của bộ cho S11 (AC-19.3, AC-19.9).
- **006** — từ 2026-10-22 được khôi phục thành module bài thi độc lập, giao cho lớp (giờ mở, thời lượng, giờ đóng — do 006 sở hữu); điểm bài thi vào Điểm xếp hạng qua 008. 003 cung cấp cho 006: lớp, thành viên, trạng thái lớp và sự kiện "Lớp bị xóa" (bỏ lớp khỏi các bài thi được giao — AC-11.5); 003 dùng của 006: sự tồn tại bài nộp bài thi của lớp để chặn xóa lớp (AC-11.3, AC-11.4 — không ảnh hưởng đổi giáo trình, AC-9.3 vẫn chỉ xét bài nộp bài tập), danh sách bài thi HV thấy được (006 AC-7.1) cho lối vào "Bài thi của lớp ({N})" ở S02 mở S07 (AC-13.8). Ẩn/hiện phần theo lớp không áp dụng cho bài thi (AC-17.8). S11 và tab Nội dung của T04 không có bài thi; kết quả bài thi theo lớp ở T16 (006).
- **008** — Điểm xếp hạng theo lớp (từ 2026-10-22: 30 % × TB bài tập + 70 % × TB bài thi, 0–100; bộ bài tập được tính khi HV đã nộp hoặc đã quá hạn mà chưa nộp — 008 sở hữu công thức); giữ kết quả đã có từ phần bị ẩn (X2); loại HV bị gỡ khỏi bảng xếp hạng lớp (AC-8.6); tab Xếp hạng của T04 và S09; tab Xếp hạng chỉ gồm HV đã kích hoạt (kể cả "Đã khóa"), không gồm HV "Chưa kích hoạt" hay "Gửi email thất bại" (AC-8.9).
- **009** — tiến độ bài tập theo lớp và theo Bài của HV (số bộ bài tập đã hoàn thành trên số bộ được tính), chỉ tính các bộ đang hiển thị với lớp (X2, V3-1), cho S01, S02, S11; tab Tiến độ của T04 (chỉ gồm HV đã kích hoạt, kể cả "Đã khóa" — AC-8.9); T15. Từ v8: 009 dùng hạn nộp theo lớp (REQ-21) cho bộ chọn bài tập và danh sách Đã làm / Chưa làm ở T01 và tab Tiến độ, và hiển thị thông tin "Đã gửi nhắc" (thời điểm, số HV — AC-26.3) do 003 cung cấp (V8-4). Từ 2026-10-22: 009 chỉ tính tiến độ và chỉ theo dõi (bộ chọn, Đã làm / Chưa làm, Bảng theo dõi) các bộ có hạn nộp hiệu lực trong lớp; tiến độ ở S01, S02, S11 theo định nghĩa đó.
- **010** — nội dung AI chỉ vào Bài khi GV duyệt (V3-4); sau khi duyệt được đối xử như nội dung soạn tay; nhãn "AI tạo" chỉ dành cho GV — HV không thấy nhãn đó, trạng thái tạo/duyệt AI hay nội dung chưa được duyệt (AC-17.7).
- **011** — ảnh đại diện của HV và ảnh mặc định khi chưa có ảnh hoặc ảnh đã bị GV gỡ (AC-8.1, AC-20.2); S12 "Hồ sơ học viên" nhận lối vào từ danh sách Thành viên (AC-20.5) và tự áp dụng quy tắc chỉ cho bạn cùng lớp xem, chỉ hiện các lớp chung.

## 11. Open Questions

Không còn câu hỏi mở.

Đã đóng ngày 2026-10-22 (đồng bộ prototype, §12):

- Q-1 (REQ-9, AC-9.3) — GV có được đổi giáo trình khi lớp đã có bài nộp không? → phương án (a): chặn — nút "Đổi giáo trình" bị vô hiệu kèm chú thích "Không thể đổi giáo trình vì học viên đã có bài nộp trong lớp này." như prototype.
- Q-3 (REQ-10, AC-10.6) — Lớp kết thúc thế nào khi không có ngày kết thúc? → phương án (a): chỉ thủ công bằng "Kết thúc lớp"; T03 không có trường ngày kết thúc như prototype.

Q-2 (dữ liệu của HV bị gỡ) đã đóng ở Session 2026-10-19. v3 (Session 2026-10-20), v4 (Session 2026-10-20 (v4)) và v8 (Session 2026-10-21 (v8)) không đóng thêm câu hỏi nào; Q-1 nay chỉ liên quan bài nộp bài tập. v8 không mở câu hỏi mới: các điểm brief để ngỏ (giờ 23:59, nhắc cho hạn đặt sau 08:00, thông tin "Đã gửi nhắc" cho GV) được quyết định và ghi ở §12 dưới dạng giả định. v11 (Session 2026-10-22 (v11)) không mở hay đóng câu hỏi nào.

## 12. Clarifications Log

### Session 2026-10-18

- Q: Ai quản lý lớp, có quản trị viên trung tâm không? → A: D1 — mỗi GV là admin duy nhất của workspace của mình; GV không bao giờ thấy lớp, HV, giáo trình của GV khác (AC-14.6). (source: stakeholder)
- [thay thế 2026-10-19] Q: "Giáo án" trong luồng tạo lớp là gì? → A: D2 — Giáo án = Giáo trình, gắn một cấp độ HSK, có đúng 3 phần cố định Bài học / Bài tập / Bài thi; S02 có 3 tab tương ứng. (source: stakeholder)
- [thay thế 2026-10-19] Q: Bài Viết/Nói được chấm thế nào (ảnh hưởng nhãn "Chờ chấm" ở S02)? → A: D3 — GV chấm tay; trước khi chấm xong, bài nộp ở trạng thái Chờ chấm. (source: stakeholder)
- Q: HV có tự đăng ký hoặc tự tham gia lớp không? → A: D4 — không; GV tạo tài khoản HV và GV thêm HV vào lớp (REQ-3, REQ-8). (source: stakeholder)
- Q: Một lớp dùng bao nhiêu giáo trình? → A: A2 — đúng một; một giáo trình dùng được cho nhiều lớp (AC-4.3). (source: assumption — giả định chung A2 do 003 sở hữu; mô hình đơn giản nhất khớp "chọn giáo án phù hợp với lớp đó")
- Q: HV thuộc bao nhiêu workspace và bao nhiêu lớp? → A: A3 — đúng một workspace, nhiều lớp của GV đó. (source: assumption — giả định chung A3)
- Q: Thiết bị mục tiêu? → A: A4 — GV dùng máy tính (≥ 1024 px), HV ưu tiên điện thoại 360–430 px (NFR-6). (source: assumption — giả định chung A4)
- Q: Ngôn ngữ giao diện và nội dung? → A: A5 — giao diện tiếng Việt; tên lớp và nội dung có thể chứa chữ Hán, pinyin. (source: assumption — giả định chung A5)
- Q: Có báo cho HV khi được thêm vào lớp hoặc khi lớp bắt đầu không? → A: A6 — không có email/push; HV thấy lớp ở S01. (source: assumption — giả định chung A6)
- Q: Múi giờ dùng để xác định ngày bắt đầu? → A: A7 — giờ Việt Nam UTC+7 (AC-14.1, AC-14.2). (source: assumption — giả định chung A7)
- [thay thế 2026-10-19] Q: Lớp thấy thay đổi của giáo trình thế nào? → A: A8 — lớp tham chiếu trực tiếp giáo trình; nội dung mới xuất bản xuất hiện ở mọi lớp; nội dung đã có bài nộp chỉ ẩn được ở cấp giáo trình (nay: ẩn theo lớp — D5, và Lưu trữ — R4). (source: assumption — giả định chung A8, chủ sở hữu 002)
- [thay thế 2026-10-22 — một phần: từ ngày bắt đầu mọi Bài và bước học hiển thị đều mở, còn bộ bài tập chỉ mở khi có hạn nộp (AC-19.8, AC-19.9)] Q: HV làm được gì trước ngày bắt đầu? → A: A9 — thấy lớp "Sắp bắt đầu" nhưng không mở được nội dung; từ ngày bắt đầu mọi nội dung hiển thị đều mở (AC-14.3, AC-14.2). (source: assumption — giả định chung A9 do 003 sở hữu)
- [thay thế 2026-10-19] Q: Nhãn "Đã làm" của bài tập hiển thị điểm nào? → A: A10 — bài tập làm lại không giới hạn, hiển thị điểm cao nhất (nay là X1; nhãn đổi thành "Đã hoàn thành" — R5). (source: assumption — giả định chung A10)
- Q: Điểm xếp hạng tính theo phạm vi nào? → A: A11 — theo từng lớp; HV bị gỡ không còn trong bảng xếp hạng của lớp (AC-8.6). (source: assumption — giả định chung A11)
- Q: Rời wizard giữa chừng thì lưu nháp hay hủy? → A: Hủy sau khi xác nhận; không có lớp nháp (AC-1.5, AC-1.6). (source: assumption — đơn giản nhất theo Hiến pháp IV; wizard ngắn ≤ 3 phút nên mất dữ liệu ít tốn kém; tránh lớp "dở dang" hiển thị cho HV)
- Q: Có bắt buộc thêm HV khi tạo lớp không? → A: Không; cho phép 0 HV kèm cảnh báo (AC-3.7, AC-5.2). (source: assumption — GV thường tạo lớp trước khi chốt danh sách; vẫn thêm được sau ở T04)
- Q: Có bắt buộc chọn giáo trình khi tạo lớp không? → A: Có, đúng một (AC-4.4). (source: assumption — A2; lớp không có giáo trình sẽ trống với HV)
- Q: Ngày bắt đầu có được ở quá khứ không? → A: Có, trong 365 ngày gần nhất; tương lai tối đa 365 ngày (AC-2.5, AC-2.6). (source: assumption — GV chuyển lớp đang dạy sẵn lên nền tảng; giới hạn chặn lỗi gõ nhầm năm)
- Q: Sĩ số tối đa của một lớp? → A: 100 HV (AC-3.5, AC-8.4). (source: assumption — lớp tiếng Trung thường 5–40 HV; 100 đủ cho lớp trực tuyến lớn và giữ danh sách, bảng xếp hạng gọn)
- Q: Quy tắc trùng tên lớp? → A: Duy nhất trong workspace, không phân biệt chữ hoa/thường, tính cả lớp Đã kết thúc (AC-2.4). (source: assumption — lớp được nhận diện bằng tên ở T01, T15 và các bảng báo cáo; tránh nhầm lẫn)
- Q: HV đang bị khóa có được thêm vào lớp không? → A: Có, kèm nhãn "Đã khóa" (AC-3.1). (source: assumption — khóa là kiểm soát đăng nhập của 001; không cần thêm quy tắc chồng chéo)
- Q: Tìm kiếm có phân biệt dấu tiếng Việt không? → A: Không (AC-3.2, AC-6.2). (source: assumption — người dùng Việt thường gõ không dấu)
- Q: Có trạng thái "Lưu trữ" riêng không? → A: Không; "Đã kết thúc" là trạng thái cuối, có bộ lọc riêng ở T02 và có thể mở lại (AC-6.2, AC-10.4). (source: assumption — đơn giản nhất; tránh hai trạng thái gần nghĩa)
- Q: Có kết thúc được lớp chưa bắt đầu không? → A: Không; lớp chưa bắt đầu thì xóa (AC-10.2). (source: assumption — lớp Sắp bắt đầu không thể có bài nộp nên xóa là đủ)
- Q: HV làm được gì ở lớp Đã kết thúc? → A: Xem lại bài học, flashcard và kết quả; không bắt đầu hay nộp bài mới (AC-14.4). (source: assumption — "chỉ xem lại" giữ giá trị ôn tập mà không làm thay đổi kết quả của khóa đã xong)
- [thay thế 2026-10-19] Q: Lượt làm dở khi lớp kết thúc? → A: Lượt thi dở được nộp tự động với câu trả lời đã lưu; bài tập chưa nộp không nộp được nữa. (source: assumption — nhất quán với nộp tự động khi hết giờ của 006; không làm mất câu trả lời bài thi)
- Q: Lớp Đang học có được dời ngày bắt đầu sang tương lai không? → A: Không (AC-7.4). (source: assumption — tránh khóa lại nội dung HV đang học)
- Q: Khi nào được xóa lớp? → A: Chỉ khi lớp chưa có bài nộp nào (AC-11.1, AC-11.3). (source: assumption — không bao giờ hủy kết quả học tập của HV; lớp đã dùng thì kết thúc)
- Q: S02 hiển thị gì trước ngày bắt đầu? → A: Chỉ thông tin lớp và thông điệp khóa, không có danh sách nội dung (AC-14.3). (source: assumption — A9; đơn giản và không lộ nội dung chưa mở)

### Session 2026-10-19

- [thay thế 2026-10-20] Q: Cấu trúc nội dung mà HV thấy trong lớp là gì? → A: D2 v2 — Giáo trình (một cấp HSK) → danh sách Bài có thứ tự → mỗi Bài có đúng 3 phần Bài học · Bài tập · Bài thi. S02 trở thành danh sách Bài kèm tiến độ của HV ở từng Bài (REQ-13); trang bài S11 mới hiển thị lộ trình và các tab phần (REQ-19); bước 3 của T03, bước 4 và tab Tổng quan đếm "số Bài đã xuất bản" (AC-4.1, AC-4.5, AC-5.1, AC-7.2). (source: stakeholder)
- Q: MVP có chấm tay không, S02/S11 còn nhãn "Chờ chấm" không? → A: D3 v2 — MVP chỉ chấm tự động; Nói, Nghe, Viết tự do và chấm tay (007) hoãn. Bỏ nhãn "Chờ chấm" khỏi trang lớp; lớp Đã kết thúc GV chỉ xem bài nộp ở chế độ chỉ đọc (AC-10.3, AC-19.3). (source: stakeholder)
- [thay thế 2026-10-20] Q: GV có ẩn được nội dung riêng cho một lớp không? → A: D5 — GV ẩn được bất kỳ phần nào trong 3 phần của bất kỳ Bài nào chỉ cho lớp đó; HV của lớp không còn thấy phần đó (kể cả kết quả cũ); lớp khác không bị ảnh hưởng; hiện lại thì khôi phục tất cả (REQ-15, REQ-16, REQ-17). (source: stakeholder)
- Q: Phần bị ẩn ảnh hưởng điểm xếp hạng và tiến độ thế nào? → A: X2 — HV không thấy phần ẩn kể cả kết quả cũ; Điểm xếp hạng đã có được giữ; tiến độ của lớp không tính phần ẩn (AC-17.4, AC-13.3). (source: stakeholder)
- [thay thế 2026-10-22 v11] Q: Bài tập làm lại và điểm hiển thị? → A: X1 — làm lại không giới hạn, điểm tính theo lần cao nhất; S11 hiển thị "Đã hoàn thành · {điểm cao nhất}/{điểm tối đa}" (AC-19.3). (source: stakeholder)
- Q: GV xem bài nộp ở đâu khi lớp đã kết thúc? → A: X3 — T14 "Xem bài nộp" chỉ đọc (005); chế độ chấm trên T14 để sau cùng 007 (AC-10.3). (source: stakeholder)
- [thay thế 2026-10-20] Q: Lịch thi đặt ở đâu? → A: X4 — theo từng lớp, ở T04; ô lịch thi do 006 cung cấp nằm trong ô Bài thi của tab Nội dung. (source: stakeholder)
- Q: Sửa đáp án bài tập sau khi có bài nộp thì sao? → A: X5 — hệ thống chấm lại sau khi GV xác nhận; điểm cao nhất ở S11 và tiến độ ở S02 phản ánh kết quả mới; nội dung bài thi khóa từ lượt làm đầu tiên (006). (source: stakeholder)
- [thay thế 2026-10-20] Q: Nội dung do AI tạo có tới tay HV trước khi GV duyệt không? → A: D6 — không; mọi thứ AI tạo là Nháp cho tới khi GV xuất bản; quy tắc hiển thị yêu cầu Bài và nội dung Đã xuất bản (AC-17.1, AC-17.2). (source: stakeholder)
- [thay thế 2026-10-20] Q: Điều kiện để HV thấy một nội dung? → A: Bài Đã xuất bản VÀ nội dung Đã xuất bản VÀ phần không bị ẩn trong lớp VÀ lớp đã bắt đầu; bài thi cần thêm lịch thi trong lớp (AC-17.1). (source: stakeholder — D5, X2, X4 cùng A9, được hợp nhất ở brief v2 §2)
- [thay thế 2026-10-20] Q: "Bài thi cần lịch thi đang mở" nghĩa là HV chỉ thấy bài thi trong khung giờ mở? → A: Không; bài thi hiển thị với HV khi lớp đã có lịch thi áp dụng cho HV (lịch của lớp hoặc lịch riêng của 006), kể cả trước giờ mở ("Sắp mở — mở lúc …") và sau khi đóng (để xem kết quả); chỉ được bắt đầu làm khi lịch đang mở theo 006. (source: assumption — HV cần biết trước giờ thi để chuẩn bị và cần xem lại kết quả sau khi đóng; bài thi chưa có lịch thì không hiện vì không có thông tin hữu ích; cần 006 xác nhận)
- [thay thế 2026-10-20] Q: Bài có cả 3 phần bị ẩn, hoặc Bài Nháp, có hiện với HV không? → A: Không; Bài biến mất khỏi S02 và đường dẫn trực tiếp cho A05 (AC-17.2, AC-17.5). (source: assumption — "ẩn" nghĩa là vắng mặt hoàn toàn; một Bài không còn phần nào là vỏ rỗng)
- Q: Bài Đã xuất bản có phần không bị ẩn nhưng chưa có nội dung hiển thị? → A: Vẫn liệt kê ở S02 với nhãn "Chưa có nội dung" (cùng từ ngữ với 009) và S11 hiển thị thông điệp trống (AC-13.4, AC-19.6). (source: assumption — GV đã chủ động xuất bản Bài; HV biết Bài sắp có nội dung; không lộ phần bị ẩn)
- Q: Tab phần ở S11 hiện khi nào? → A: Chỉ khi phần không bị ẩn và có ít nhất một nội dung hiển thị với HV (AC-19.1). (source: assumption — tránh tab trống trên màn hình điện thoại)
- Q: GV có ẩn/hiện được nhiều phần cùng lúc không? → A: Có, theo cột ("Ẩn {phần} ở mọi bài" — áp dụng cho các Bài hiện có, kể cả Nháp) và theo dòng ("Ẩn cả bài"); thực hiện trọn vẹn hoặc không thay đổi gì (AC-16.4, AC-16.5). (source: assumption — trường hợp phổ biến là "lớp này chỉ ôn bài tập" hoặc "tạm ẩn cả Bài"; chọn tùy ý nhiều Bài để sau theo Hiến pháp IV)
- Q: Bài mới thêm vào giáo trình sau khi GV đã ẩn hàng loạt thì sao? → A: Các phần của Bài mới mặc định Hiển thị với lớp; thao tác hàng loạt không tạo quy tắc lâu dài (AC-17.3). (source: assumption — D5 coi ẩn là lựa chọn chủ động; Bài mới chỉ tới HV khi GV xuất bản (002), nên rủi ro lộ ngoài ý muốn thấp)
- Q: Có đặt trước ẩn/hiện cho Bài còn Nháp không? → A: Có; thiết lập có hiệu lực ngay khi Bài được xuất bản (AC-15.3). (source: assumption — giúp GV chuẩn bị để phần không mong muốn không bao giờ hiện với lớp)
- [thay thế 2026-10-20] Q: Ẩn và hiện có cần xác nhận không, nội dung xác nhận ra sao? → A: Cả hai đều cần xác nhận; hộp thoại ẩn nêu rõ HV mất quyền xem kể cả kết quả cũ, điểm xếp hạng giữ nguyên, lớp khác không bị ảnh hưởng, và cảnh báo thêm nếu có HV đang làm bài hoặc lịch thi đang mở (AC-16.1, AC-16.2). (source: assumption — cả hai chiều đều thay đổi ngay điều HV thấy; hiện nhầm một bài thi có thể lộ đề sớm)
- [thay thế 2026-10-20] Q: HV đang ở trong phần bị ẩn (đang xem bước học, đang làm bài tập, đang thi) thì sao? → A: Bước học/flashcard: thao tác kế tiếp không được ghi nhận, về S11; bài tập: lần lưu/nộp kế tiếp bị từ chối, lượt dở được giữ và tiếp tục được khi hiện lại; bài thi: lượt đang làm tiếp tục tới khi nộp hoặc hết giờ, kết quả không xem được khi phần còn ẩn (REQ-18). (source: assumption — phối hợp với quy tắc bản v1 của 005 (bài tập không còn khả dụng: từ chối lưu/nộp, giữ lượt dở) và của 006 (bài thi bị ẩn: lượt đang làm được hoàn tất): không làm mất câu trả lời, không cắt ngang bài thi có giờ của HV vì một thao tác của GV)
- [thay thế 2026-10-20] Q: Ẩn phần Bài thi có ảnh hưởng lịch thi không? → A: Không; ẩn và lịch độc lập — lịch vẫn chạy khi phần bị ẩn, GV vẫn đặt/sửa lịch được; hiện lại thì bài thi hiển thị theo trạng thái lịch hiện tại. (source: assumption — tránh hai thao tác ngầm sửa nhau; GV xử lý thi bù bằng lịch riêng/thêm lượt của 006)
- [thay thế 2026-10-20] Q: Lượt thi dở khi lớp kết thúc? → A: Đổi so với v1: lượt thi tiếp tục tới khi HV nộp hoặc hết giờ, không có lượt mới; lượt bài tập dở được giữ, không nộp được, tiếp tục được khi mở lại lớp (AC-10.5). (source: assumption — thống nhất với quy tắc bản v1 của 006 (lớp kết thúc: lượt đang làm được tiếp tục tới khi nộp hoặc hết giờ) để không mâu thuẫn giữa module, và cùng quy tắc với ẩn phần Bài thi)
- Q: GV có ẩn/hiện được khi lớp Đã kết thúc không? → A: Không; tab Nội dung chỉ xem, gợi ý "Mở lại lớp để thay đổi" (AC-10.3). (source: assumption — nhất quán với chế độ chỉ xem của lớp đã kết thúc và với việc 009 chốt tiến độ khi lớp kết thúc)
- Q: Đổi giáo trình thì thiết lập ẩn xử lý thế nào? → A: Bị bỏ; mọi phần của giáo trình mới ở trạng thái Hiển thị; hộp xác nhận nêu rõ (AC-9.2). (source: assumption — thiết lập gắn với Bài của giáo trình cũ nên không còn ý nghĩa)
- [thay thế 2026-10-20] Q: Lộ trình có khóa tuần tự không? → A: Không; mọi mục mở được, S11 chỉ đánh dấu "Gợi ý tiếp theo". (source: assumption — brief v2 §2: bước là gợi ý, không khóa trong MVP; 010 có thể đề xuất khác)
- Q: HV có thấy nhãn "AI tạo" không? → A: Không; nội dung GV đã xuất bản là nội dung của GV (AC-17.7, AC-19.2). (source: assumption — nhãn phục vụ việc duyệt của GV ở 002/010, không có giá trị cho HV)
- [thay thế 2026-10-20] Q: Tab "Bài thi" của T04 đổi thế nào? → A: T04 v2 có 6 tab Tổng quan · Học viên · Nội dung · Tiến độ · Xếp hạng · Kết quả thi; "Kết quả thi" (006) dẫn tới màn hình kết quả thi của 006 (AC-7.1). (source: stakeholder — danh mục màn hình v2)
- Q: Truy cập trái phép của GV hiển thị gì? → A: A05 "Không tìm thấy nội dung bạn yêu cầu." theo 001 thay cho "Không tìm thấy lớp" của v1 (AC-14.6, AC-17.5). (source: assumption — A05 đã vào danh mục màn hình v2; một thông điệp thống nhất cho mọi đối tượng không tồn tại hoặc không có quyền)
- [thay thế 2026-10-22 — một phần: Q-1 và Q-3 đã đóng (AC-9.3, AC-10.6)] Q: Câu trả lời v2 có giải quyết Q-1, Q-2, Q-3 của v1 không? → A: Q-2 đóng — áp dụng phương án (a): dữ liệu HV bị gỡ được giữ, ẩn khỏi lớp và hiển thị lại khi thêm lại (AC-8.6); mục "Đã rời lớp" ngoài phạm vi. Q-1 và Q-3 vẫn mở vì không câu trả lời nào đề cập đổi giáo trình hay cách kết thúc lớp. (source: assumption — X2 cho thấy nguyên tắc của stakeholder là "ẩn chứ không xóa, khôi phục khi hiện lại"; phương án (a) áp dụng đúng nguyên tắc đó cho HV bị gỡ, phương án (c) trái với nó)
- Q: Mục tiêu số lần chạm của HV? → A: Từ S01 tới một bước học ≤ 3 lần chạm (S01 → S02 → S11 → S03) thay cho ≤ 2 của v1 (§2). (source: assumption — cấu trúc Bài của v2 thêm một cấp)
- [thay thế 2026-10-20] Q: R1 — Lượt thi đang làm khi lớp kết thúc hoặc phần Bài thi bị ẩn? → A: Không bao giờ bị cắt ngang và không mất câu trả lời: lượt tiếp tục, câu trả lời tiếp tục được ghi nhận tới khi HV nộp hoặc hết giờ (nộp tự động); không có lượt mới; nếu phần đang ẩn, HV thấy "Đã nộp bài thi. Kết quả hiện chưa thể xem." và điểm vẫn được chuyển cho 008 khi kết quả công bố. Quy tắc của 003 được chọn; 006 điều chỉnh theo. (source: assumption — cross-module alignment (orchestrator))
- [thay thế 2026-10-20] Q: R4 — Nội dung bị Lưu trữ có hiện với HV không? → A: Không, ở mọi lớp; bước học và bộ bài tập theo vòng đời Nháp → Đã xuất bản ⇄ Lưu trữ (002); dữ liệu được giữ, chỗ trên lộ trình được giữ nhưng không hiển thị với HV; khôi phục thì hiện lại; bài thi dùng cơ chế phiên bản nên S11 chỉ hiển thị phiên bản đang hiệu lực (AC-17.1). (source: assumption — cross-module alignment (orchestrator))
- [thay thế 2026-10-21 v8] Q: R5 — Nhãn trạng thái bộ bài tập cho HV? → A: Đúng nhãn của 005: "Chưa làm" / "Đang làm" / "Đã hoàn thành" luôn kèm điểm cao nhất; thay cho "Đang làm dở" và "Đã làm" (AC-19.3, AC-19.5). (source: assumption — cross-module alignment (orchestrator)) — Từ v8 thêm trạng thái "Quá hạn" và nhãn "Nộp muộn" của 005 (AC-19.3, AC-19.5, AC-23.3); các nhãn còn lại giữ nguyên.
- [thay thế 2026-10-20] Q: R6 — HV có thấy bộ từ ngữ duyệt AI không? → A: Không; "AI tạo", "Chờ duyệt", "Đã duyệt", "Đã chỉnh sửa", "AI · Chờ duyệt (n)" và trạng thái tác vụ của 010 chỉ dành cho GV (AC-17.7). (source: assumption — cross-module alignment (orchestrator))
- Q: R7 — Dọn dẹp? → A: Các mục Session 2026-10-18 bị v2 thay thế được gắn "[thay thế 2026-10-19]"; đã kiểm tra không AC nào phụ thuộc "Chờ chấm", T13 hay 007. (source: assumption — cross-module alignment (orchestrator))

### Session 2026-10-20

- Q: Hệ thống theo dõi gì về việc học của HV trong lớp? → A: V3-1 — chỉ việc HV làm các bộ bài tập của từng Bài (lượt làm, điểm cao nhất, đã/chưa hoàn thành); không theo dõi việc xem bài học, không có "Đánh dấu đã học" và không đo thời lượng học. S01, S02, S11 trình bày tiến độ bài tập (AC-12.1, AC-13.3, AC-19.1); bước học ở S11 không có trạng thái (AC-19.2); dữ liệu được giữ khi gỡ HV hay khi ẩn phần chỉ còn bài nộp, điểm và lượt dở (AC-8.6, AC-17.6). (source: stakeholder — "chỉ tracking học viên làm bài tập của buổi học chứ không tracking thời lượng và nội dung học")
- Q: Mỗi Bài còn những phần nào? → A: V3-2 — đúng 2 phần Bài học · Bài tập; bỏ lộ trình và Bài thi (006 hoãn sau MVP). Tab Nội dung của T04 là lưới Bài × 2 ô phần, không còn ô lịch thi (REQ-15); ẩn/hiện theo lớp (D5, X2) giữ nguyên cho 2 phần (REQ-16, REQ-17); Bài có cả 2 phần đang ẩn hoặc Bài Nháp vắng mặt với HV (AC-17.2, AC-17.5). Thay D2 v2 và D5 bản 3 phần. (source: stakeholder — "phần giáo trình tinh gọn lại sẽ chỉ có section bài học và bài tập, bỏ lộ trình và bài thi")
- Q: T04 còn những tab nào? → A: Tổng quan · Học viên · Nội dung · Tiến độ · Xếp hạng; bỏ "Kết quả thi" (AC-7.1). (source: stakeholder — hệ quả của V3-2, danh mục màn hình v3)
- [thay thế 2026-10-22 — một phần: bộ bài tập chưa có hạn nộp là "Chưa mở" và không mở được (AC-19.4, AC-19.9); bước học vẫn mở theo bất kỳ thứ tự nào] Q: S11 hiển thị gì? → A: Hai tab Bài học · Bài tập, mỗi tab liệt kê nội dung hiển thị theo thứ tự GV sắp trong phần đó; không có tab Lộ trình, không có "Gợi ý tiếp theo", không có bài thi; mọi mục mở được theo bất kỳ thứ tự nào (REQ-19). (source: stakeholder — hệ quả của V3-2, danh mục màn hình v3)
- Q: Còn quy tắc nào về bài thi trong 003 không? → A: Không; bỏ mọi quy tắc bài thi (lượt thi khi lớp kết thúc hoặc khi phần bị ẩn, lịch thi theo lớp, nhãn "Bài thi đang mở", điều kiện hiển thị bài thi, kết quả thi khi hiện lại phần); giữ quy tắc lượt bài tập dở khi lớp kết thúc hoặc khi phần Bài tập bị ẩn (AC-10.5, AC-18.2). "Bài nộp" nay là bài nộp bài tập (AC-9.3, AC-11.3). Thay X4, R1 và các giả định về bài thi của Session 2026-10-19. (source: stakeholder — hệ quả của V3-2)
- Q: Nội dung AI tới HV thế nào? → A: V3-4 — kết quả AI chỉ được lưu vào Bài khi GV duyệt; nội dung chưa duyệt không bao giờ tới HV; sau khi duyệt, nội dung được đối xử như nội dung soạn tay và chỉ hiện với HV khi Bài đã xuất bản (002) và phần không bị ẩn; nhãn "AI tạo" chỉ dành cho GV (AC-17.1, AC-17.7). T18 nay là "Soạn bài" với 2 panel Thủ công · Tạo bằng AI; liên kết từ tên Bài ở tab Nội dung giữ nguyên (AC-15.1). Thay D6 và R6. (source: stakeholder — "tạo bằng AI sẽ được có chức năng review các section bài học và bài tập AI tạo — chỉ save khi GV approve")
- Q: S02 hiển thị tiến độ của một Bài thế nào? → A: "{số bộ đã hoàn thành}/{số bộ được tính} bộ bài tập" theo định nghĩa của 009, chỉ tính bộ bài tập hiển thị với HV; Bài có bước học nhưng không có bộ bài tập hiển thị → "Chưa có bài tập"; Bài không có nội dung hiển thị → "Chưa có nội dung" (AC-13.3, AC-13.4, AC-19.1). (source: assumption — trình bày trực tiếp đại lượng duy nhất còn được theo dõi (V3-1); dạng phân số dễ đọc trên điện thoại; tách "Chưa có bài tập" để HV không hiểu nhầm là 0 % khi Bài chỉ có bài học; định dạng cuối cùng do 009 chốt)
- Q: Tab nào được chọn mặc định ở S11? → A: Tab đầu tiên hiện có — Bài học nếu hiển thị, nếu không thì Bài tập (AC-19.1). (source: assumption — giữ thứ tự tự nhiên "học trước, làm bài sau" và mục tiêu ≤ 3 lần chạm từ S01 tới một bước học)
- Q: HV đang xem bước học hoặc flashcard khi phần Bài học bị ẩn thì sao, khi không còn gì được ghi nhận? → A: Thao tác chuyển bước hoặc chuyển thẻ kế tiếp không hiển thị nội dung, HV thấy "Nội dung này hiện không khả dụng." và về S11 hoặc S02 (AC-18.1). (source: assumption — giữ nguyên nghĩa "ẩn là vắng mặt" của X2 với ít hành vi nhất)
- Q: Có đánh số lại AC không? → A: Có — AC bị bỏ được rút khỏi REQ và các AC sau được đánh số lại (số v2 → số v3): REQ-10 10.4 → 10.3, 10.5 → 10.4, 10.6 → 10.5; REQ-15 15.6 → 15.4; REQ-18 18.5 → 18.3; bỏ 10.3, 15.4, 15.5, 18.3, 18.4 (bài thi) của v2; AC-13.4 nay là quy tắc nhãn "Chưa có bài tập" / "Chưa có nội dung" của S02; REQ-19 viết lại cho 2 tab. AC-3.5 và AC-9.3 (được 008 trích dẫn) giữ nguyên số. (source: assumption — brief v3 §4 cho phép đánh số lại; feature chưa có task hay test nào trích dẫn AC của 003)
- [thay thế 2026-10-22 — Q-1 và Q-3 đã đóng] Q: v3 có đóng câu hỏi mở nào không? → A: Không; Q-1 và Q-3 vẫn mở vì v3 không đề cập đổi giáo trình hay cách kết thúc lớp; Q-1 nay chỉ liên quan bài nộp bài tập. (source: assumption — đối chiếu nội dung stakeholder 2026-10-20)

### Session 2026-10-20 (v4)

Áp dụng brief v4 (câu trả lời và yêu cầu mới của stakeholder ngày 2026-10-20, vòng hai). Không mục cũ nào của 003 bị thay thế: D4 (GV đưa HV vào hệ thống) và A6 (003 không gửi email cho sự kiện của lớp) vẫn đúng; V4-6 chỉ đổi cách tài khoản HV được tạo ở 001. Thêm US-10, REQ-20 (AC-20.1–AC-20.7), AC-8.7 và AC-8.8 vào cuối REQ-8; không đánh số lại AC hiện có.

- Q: Stakeholder bổ sung gì về tài khoản HV? → A: Nguyên văn: "GV sẽ dùng email học viên cung cấp sau đó active email đó trên hệ thống; có thể bulk create bằng excel; sau đó hệ thống tự tạo tài khoản và gửi password được random về mail đó cho học viên login và truy cập hệ thống" và "không bắt buộc đổi mật khẩu lần đầu". V4-6: GV nhập email + họ tên ở T12 (từng người hoặc Import Excel), HV ở trạng thái "Chưa kích hoạt" cho tới khi GV bấm "Kích hoạt" ở T11; A04 bị bỏ nên điều kiện trước của luồng HV vào lớp chỉ còn "HV đã đăng nhập" (AC-3.1, AC-3.4, AC-8.1). (source: stakeholder)
- Q: Stakeholder bổ sung gì về hồ sơ HV? → A: Nguyên văn: "các học viên có thể xem profile qua lại của nhau"; follow-up: xem hồ sơ = bạn cùng lớp, hồ sơ người khác chỉ hiện thông tin các lớp học chung (không email/SĐT). V4-7: S12 "Hồ sơ học viên" do 011 sở hữu, mở từ S09 và từ một danh sách thành viên lớp; GV thấy ảnh đại diện HV (AC-8.1, AC-20.5). (source: stakeholder)
- Q: Danh sách thành viên lớp cho HV nằm ở S02 hay S11? → A: S02, lối vào "Thành viên ({N})" khi lớp Đang học hoặc Đã kết thúc, danh sách mở ngay trong S02 (REQ-20); S11 là trang của một Bài, không phải của lớp. Lớp Sắp bắt đầu chưa có danh sách, cùng quy tắc với danh sách Bài (AC-14.3). (source: assumption — thành viên là thuộc tính của lớp và S02 là trang lớp; brief v4 để 003/011 chọn và 011 cũng giả định S02; 011 chỉ coi lớp Đang học hoặc Đã kết thúc là "lớp học chung" nên ở lớp Sắp bắt đầu mọi lần chạm sẽ dẫn tới A05)
- Q: Mỗi dòng của danh sách Thành viên hiển thị gì? → A: Chỉ ảnh đại diện và họ tên; chính HV đứng đầu với nhãn "Bạn", còn lại theo họ tên A→Z; không email, số điện thoại, trạng thái tài khoản, ngày vào lớp, tiến độ hay điểm (AC-20.2, AC-20.4). (source: assumption — follow-up "không email/SĐT"; tối thiểu dữ liệu, tiến độ và hạng chỉ xem ở S12 theo lớp chung; thứ tự A→Z giống tab Học viên)
- [thay thế 2026-10-22 — một phần: không có gợi ý kích hoạt kèm liên kết T11 (AC-8.7); HV chưa kích hoạt không có trong tab Tiến độ, Xếp hạng (AC-8.9)] Q: HV "Chưa kích hoạt" có được thêm vào lớp trước khi kích hoạt không? → A: Có — được chọn ở T03 bước 2 và hộp thoại Thêm học viên, tính vào sĩ số và giới hạn 100; GV thấy trạng thái và gợi ý kích hoạt kèm liên kết T11; sau khi kích hoạt, tư cách thành viên và ngày vào lớp giữ nguyên (AC-3.1, AC-8.7, AC-8.8). (source: assumption — khuyến nghị của brief v4 (V4-6); GV xếp lớp trước rồi kích hoạt hàng loạt khi khóa học bắt đầu, không phải làm hai lần)
- Q: HV chưa kích hoạt có hiện với bạn cùng lớp không? → A: Không; HV "Chưa kích hoạt" hoặc "Gửi email thất bại" vắng mặt khỏi danh sách Thành viên và khỏi số N cho tới khi kích hoạt xong (email đã gửi); HV "Đã khóa" vẫn được liệt kê, không kèm nhãn (AC-20.3). (source: assumption — người chưa nhận được thông tin đăng nhập chưa thực sự tham gia lớp; thống nhất với quy tắc danh sách Thành viên và "lớp học chung" của 011 (REQ-9, REQ-10 của 011); không lộ trạng thái tài khoản của người khác)
- Q: HV chạm dòng của chính mình thì sao? → A: Mở S10 "Hồ sơ của tôi" thay cho S12 (AC-20.5). (source: assumption — theo quy tắc lối vào hồ sơ của 011 (REQ-9 của 011) để mọi lối vào hồ sơ (S09, S02) hành xử như nhau)
- Q: Ai được xem danh sách Thành viên? → A: Chỉ HV đang là thành viên lớp; người khác bị từ chối như truy cập S02 (AC-20.7). GV dùng tab Học viên, không dùng danh sách này. (source: assumption — cùng quy tắc truy cập của S02 (AC-14.5); follow-up "xem hồ sơ = bạn cùng lớp")
- Q: GV thấy gì mới ở tab Học viên? → A: Ảnh đại diện và trạng thái tài khoản 4 giá trị của 001 thay cho "Hoạt động / Đã khóa"; bấm tên HV vẫn mở T15 (AC-8.1). (source: stakeholder — V4-7 "GV thấy avatar HV"; trạng thái theo V4-6)
- [thay thế 2026-10-22 — Q-1 và Q-3 đã đóng] Q: v4 có đóng câu hỏi mở nào của 003 không? → A: Không; Q-1 và Q-3 vẫn mở (brief v4 §2). (source: stakeholder — brief v4 §2 "Still open")

### Session 2026-10-21 (v8)

Áp dụng brief v8 (V8-1, V8-2 do 003 sở hữu). Thêm US-11, US-12, US-13 và REQ-21 đến REQ-26; sửa AC-9.2 (đổi giáo trình bỏ cả hạn nộp), AC-10.3 (lớp Đã kết thúc khóa hạn nộp), AC-19.3 (nhãn hạn nộp, trạng thái "Quá hạn", nhãn "Nộp muộn") và AC-19.5 (bộ "Quá hạn" mở S05); không đánh số lại AC hiện có. Mục R5 (Session 2026-10-19) được gắn "[thay thế 2026-10-21 v8]". A6 vẫn đúng với các sự kiện của lớp; email nhắc hạn nộp là ngoại lệ duy nhất.

- Q: Stakeholder yêu cầu gì ở v8? → A: Nguyên văn: "mỗi bài tập sẽ được GV setting ngày deadline, nên trong phần dashboard làm đơn giản sẽ là danh sách các bài tập trong khóa đó, chọn 1 bài tập filter sẽ hiện ra danh sách học viên đã làm bài tập và chưa làm bài tập => tracking chỉ là có làm và không làm theo từng bài, và dựa vào deadline theo từng bài đó hệ thống sẽ gửi mail nhắc học viên chưa làm bài tập ngày hôm đó". 003 sở hữu hạn nộp (V8-1) và email nhắc (V8-2); dashboard thuộc 009, "Nộp muộn" thuộc 005 (REQ-21 đến REQ-26). (source: stakeholder)
- Q: Hạn nộp đặt theo giáo trình hay theo lớp? → A: Theo lớp — "Deadline is set per class"; giáo trình dùng chung nhưng hạn không lan sang lớp khác (AC-21.3, AC-22.4). (source: stakeholder)
- Q: Email nhắc gửi lúc nào? → A: "08:00 on the deadline day", giờ Việt Nam (AC-24.1). (source: stakeholder)
- Q: Sau hạn HV còn nộp được không? → A: Còn; bài nộp sau hạn được gắn nhãn "Nộp muộn" (005) và vẫn tính đủ điểm (AC-23.4, AC-25.1). (source: stakeholder)
- Q: Bộ chọn bài tập ở dashboard có thay thanh tiến độ và nhóm "Cần chú ý" không? → A: Có — thuộc 009; 003 chỉ cung cấp hạn nộp và thông tin "Đã gửi nhắc" (§10 phụ thuộc 009). Định nghĩa tiến độ mà S01, S02, S11 dùng không đổi. (source: stakeholder)
- Q: Hạn nộp là mốc giờ nào của ngày đã chọn? → A: 23:59 giờ Việt Nam (UTC+7) của ngày đó; GV chỉ chọn ngày (AC-21.3). (source: assumption — brief v8 đề xuất; HV có trọn ngày để nộp, khớp với email nhắc buổi sáng; một mốc cố định đơn giản hơn chọn giờ)
- [thay thế 2026-10-22 — một phần: nút của popup là "Xóa" / "Áp dụng" (AC-21.2)] Q: GV chọn ngày thế nào? → A: Lịch chọn dạng popup cùng kiểu 009 AC-9.8 nhưng chọn một ngày, cho chọn ngày tương lai, khoảng ±365 ngày quanh hôm nay (giống BR-3 của ngày bắt đầu), có "Áp dụng" và "Xóa hạn" (AC-21.2). (source: assumption — brief v8 "same pattern as 009 AC-9.8"; giới hạn khoảng chặn lỗi chọn nhầm năm)
- Q: Ngày đã qua có được phép không? → A: Có, kèm cảnh báo không chặn; HV chưa nộp thấy "Quá hạn" ngay, không có email (AC-21.4). (source: assumption — brief v8 "past dates allowed only with a warning"; GV ghi lại hạn của bài đã giao trước khi dùng hệ thống)
- Q: Hạn đặt (hoặc đổi thành) hôm nay sau 08:00 có được nhắc không? → A: Không; popup cảnh báo "Học viên sẽ không nhận email nhắc cho hạn nộp này." (AC-21.5, AC-24.3). Cảnh báo này cũng hiện khi ngày chọn đứng trước ngày bắt đầu lớp. (source: assumption — brief v8 "decide or flag"; một lần xét gửi duy nhất lúc 08:00 dễ kiểm chứng, tránh email bất ngờ giữa ngày và tránh nhắc trùng)
- [thay thế 2026-10-22] Q: Đặt hạn hàng loạt theo Bài làm gì với hạn đã có? → A: Thay thế mọi hạn của các bộ Nháp hoặc Đã xuất bản trong Bài sau khi GV xác nhận; có thêm "Xóa hạn mọi bộ"; không có hàng loạt cho nhiều Bài (AC-22.1, AC-22.2). (source: assumption — brief v8 ví dụ "đặt hạn cho mọi bộ của Bài n"; hộp xác nhận nêu rõ việc thay thế)
- [thay thế 2026-10-22] Q: Xóa hạn có cần xác nhận không? → A: Không với từng bộ (đặt lại được ngay); có với "Xóa hạn mọi bộ" (AC-21.6, AC-22.2). (source: assumption — thao tác đơn lẻ dễ đảo ngược; hàng loạt cần thấy số bộ bị ảnh hưởng)
- Q: Bộ nào hiện ở tab Nội dung để đặt hạn? → A: Bộ Nháp hoặc Đã xuất bản của phần Bài tập (bộ Nháp có nhãn "Nháp"); bộ Lưu trữ không hiện nhưng hạn được giữ (AC-21.1, AC-22.5). (source: assumption — cùng nguyên tắc "đặt trước cho Bài Nháp" của AC-15.3; bộ Lưu trữ vắng mặt ở mọi lớp theo R4)
- [thay thế 2026-10-22 — một phần: GV thấy dòng "Hạn nộp được giữ nhưng không gửi nhắc khi phần đang ẩn." (AC-22.6)] Q: Phần Bài tập bị ẩn hoặc bộ bị Lưu trữ thì hạn nộp ra sao? → A: Giữ nguyên nhưng không hiệu lực — không hiển thị với HV, không nhắc; GV thấy "Không hiệu lực — phần đang ẩn"; hiệu lực lại khi bộ hiển thị lại (AC-22.5, AC-22.6). (source: assumption — brief v8 "deadline is kept but inactive"; nhất quán với "ẩn chứ không xóa" của X2)
- Q: Đổi giáo trình hoặc lớp kết thúc thì sao? → A: Đổi giáo trình bỏ mọi hạn nộp của lớp (hộp xác nhận nêu rõ); lớp Đã kết thúc khóa việc đặt, đổi, xóa hạn và HV chỉ thấy "Hạn nộp dd/MM" (AC-9.2, AC-10.3, AC-23.6). (source: assumption — hạn gắn với bộ bài tập của giáo trình cũ; lớp đã kết thúc không cho làm bài mới nên "Quá hạn" chỉ gây nhiễu)
- [thay thế 2026-10-21 v8] Q: Nhãn nào HV thấy và khi nào? → A: "Hạn nộp dd/MM" (dd/MM/yyyy nếu khác năm); "Hạn hôm nay" vào ngày hạn khi HV chưa nộp; "Quá hạn" sau hạn khi HV chưa nộp — thay "Chưa làm" nếu chưa có lượt làm, đi kèm "Đang làm" nếu có lượt dở; HV vẫn mở và nộp được (AC-23.1 đến AC-23.4). Cần 005 xác nhận cách đọc thứ tự ưu tiên "Chưa làm / Quá hạn / Đang làm / Đã hoàn thành" của V8-3. (source: assumption — brief v8 V8-1 "overdue and the HV has no submission: Quá hạn"; giữ thông tin lượt dở để HV biết làm tiếp; "Hạn hôm nay" chỉ có ý nghĩa với người chưa nộp)
- Q: Khi HV có lượt làm dở và đã quá hạn, S11 và S05 hiển thị gì? → A: Chỉ "Quá hạn", không kèm "Đang làm"; nút "Tiếp tục làm" vẫn giữ. Theo thứ tự ưu tiên trạng thái của 005 — Đã hoàn thành › Quá hạn › Đang làm › Chưa làm (005 AC-17.5, AC-23.x); sửa AC-23.3, AC-19.3; thay mục "Nhãn nào HV thấy và khi nào?" ở trên. (source: assumption — cross-module alignment (orchestrator), 005 sở hữu trạng thái bộ bài tập)
- Q: Ai nhận email nhắc? → A: HV "Đã kích hoạt" (không khóa), đang là thành viên, chưa có bài nộp cho bộ, bộ hiển thị với HV và lớp Đang học, xét tại 08:00; HV đang có lượt làm dở vẫn được nhắc (AC-24.2). (source: stakeholder — điều kiện của brief v8 V8-2; phần "lượt dở vẫn được nhắc" là assumption — "chưa có bài nộp" là tiêu chí duy nhất của brief)
- [thay thế 2026-10-22] Q: Gộp email thế nào? → A: Một email mỗi HV mỗi ngày, gộp mọi bộ đến hạn ở mọi lớp của HV, sắp theo tên lớp, thứ tự Bài, thứ tự bộ; tối đa 20 bộ được liệt kê (AC-24.1, AC-24.5, AC-25.2, AC-25.3). (source: assumption — brief v8 "batch … into one email"; một HV chỉ thuộc một workspace nên mọi lớp đều của cùng GV; giới hạn 20 giữ email đọc được trên điện thoại)
- Q: Hạn đổi sau khi đã nhắc thì sao? → A: Không gửi lại hay đính chính; dời sang ngày sau thì nhắc lại vào 08:00 ngày mới; mỗi (HV, lớp, bộ) nhiều nhất một lần mỗi ngày (AC-24.3, AC-24.4, AC-24.5). (source: assumption — brief v8 V8-2 edge cases)
- Q: Hệ thống không gửi được lúc 08:00 thì sao? → A: Gửi bù một lần ngay khi khôi phục nếu trước 20:00 cùng ngày, xét điều kiện lúc gửi bù; sau 20:00 bỏ lần nhắc đó (AC-24.6). (source: assumption — nhắc vẫn có ích khi HV còn vài giờ để nộp; tránh email lúc khuya)
- [thay thế 2026-10-22] Q: Email nhắc chứa gì? → A: Tiếng Việt, người gửi "SAT"; tiêu đề "[SAT] Hôm nay là hạn nộp bài tập"; lời chào, tên GV, danh sách (lớp, Bài, bộ, "Hạn nộp: 23:59 dd/MM/yyyy", nút "Làm bài" tới S05 hoặc A01 rồi S05), câu về "Nộp muộn", dòng cuối của 001; không có điểm, thông tin HV khác hay liên hệ của GV (AC-25.1, AC-25.4, AC-25.5). (source: assumption — brief v8 "class name, Bài, set title, deadline, and a link to S05 / login"; cùng giọng văn với thư của 001 AC-17.1)
- Q: Email nhắc theo quy tắc gửi, thất bại và giới hạn nào của 001? → A: Dùng chung dịch vụ gửi thư, ngôn ngữ, tên người gửi, dòng cuối và tiêu chí thất bại (10 phút, địa chỉ không nhận thư) của 001; thất bại không gửi lại và không đổi trạng thái tài khoản HV (khác thư tài khoản); không tính vào giới hạn thư chứa mật khẩu; 001 ghi email nhắc vào danh mục thư dưới dạng tham chiếu tới 003 (001 AC-17.5) (AC-26.1, AC-26.2). (source: assumption — brief v8 "follows 001's email delivery, failure and limit rules"; chuyển một HV đang học sang "Gửi email thất bại" vì một email nhắc sẽ làm HV biến mất khỏi danh sách Thành viên (AC-20.3); giới hạn 001 dành cho thư chứa mật khẩu và email nhắc tự giới hạn ở một email mỗi HV mỗi ngày)
- [thay thế 2026-10-22] Q: GV có thấy việc đã gửi nhắc không? → A: Có — "Đã gửi nhắc lúc HH:mm dd/MM · n HV" ở ô Hạn nộp của tab Nội dung, và 003 cung cấp cùng thông tin cho bảng của 009 ở T01 (AC-26.3). (source: assumption — brief v8 "optional, decide"; GV cần biết hệ thống đã nhắc để không nhắc trùng qua kênh khác; n đếm email đã chuyển cho dịch vụ gửi thư vì kết quả nhận thư có thể tới muộn)
- [thay thế 2026-10-22 — Q-1 và Q-3 đã đóng] Q: v8 có đóng hay mở câu hỏi nào của 003 không? → A: Không; Q-1 và Q-3 của 003 vẫn mở (Q-3 về thresholds mà brief v8 đóng là câu hỏi của 009). (source: assumption — đối chiếu brief v8 §V8-4 "close Q-3" thuộc 009)

### Session 2026-10-22 (v11)

Áp dụng brief v11 (V11-3 cho 003; V11-1 do 005 sở hữu). Sửa US-5 (independent test), AC-14.4, AC-17.4, AC-17.6, AC-19.3, AC-19.5; thêm AC-19.7; cập nhật §7 (Bài nộp, Trạng thái của HV), §8, §9, §10. Thay X1 (mục "Bài tập làm lại và điểm hiển thị?" của Session 2026-10-19). Các mục cũ nhắc "điểm cao nhất" (X5, V3-1, R5) nay đọc là "điểm của bài nộp duy nhất".

- Q: Stakeholder yêu cầu gì ở v11? → A: Nguyên văn: "chỉ được làm bài tập 1 lần và tính điểm 1 lần, xong rồi sẽ được xem lại bài tập gồm đáp án và giải thích". Mỗi HV nộp mỗi bộ bài tập đúng một lần trong lớp; điểm của bài nộp đó là điểm của bộ; thay X1. (source: stakeholder)
- Q: S11 hiển thị gì cho bộ đã nộp? → A: "Đã hoàn thành · {điểm}/{điểm tối đa}" với điểm của bài nộp duy nhất (kèm "Nộp muộn" nếu có); chạm vào mở S06 "Xem lại bài làm" (AC-19.3, AC-19.5). (source: stakeholder)
- Q: S02 và S11 còn "Làm lại" không? → A: Không, ở mọi trạng thái lớp (AC-19.7); lớp Đã kết thúc vẫn mở được S06 của bộ đã hoàn thành (AC-14.4). (source: stakeholder)
- Q: Ẩn rồi hiện lại phần Bài tập thì HV thấy lại gì? → A: Bài nộp và điểm (xem lại ở S06) và lượt làm dở để tiếp tục; không còn "lịch sử làm bài" nhiều lượt (AC-17.4, AC-17.6). (source: assumption — V11-1 bỏ lịch sử lượt làm; quy tắc ẩn X2 giữ nguyên)
- Q: Chấm lại khi GV sửa đáp án (X5) còn áp dụng không? → A: Có; tính lại điểm của bài nộp duy nhất, S11 và tiến độ S02 phản ánh kết quả mới (§8). (source: stakeholder — brief v11 V11-1)

### Session 2026-10-22 (đồng bộ prototype)

Ghi chú: quyết định của stakeholder ngày 2026-10-22 — prototype `specs/screen-flow-design.html` là chuẩn cho câu chữ giao diện và cho hành vi mà nó thể hiện. Không đánh số lại REQ/AC; các mục bị thay thế ở phiên v8 được gắn "[thay thế 2026-10-22]".

- Q: Bộ bài tập nào có ô hạn nộp ở tab Nội dung, ô trống hiển thị gì? → A: Chỉ bộ Đã xuất bản (kể cả thuộc Bài Nháp); ô trống hiển thị "Đặt hạn"; bộ Nháp không có ô (AC-21.1, AC-22.5). (source: stakeholder "prototype là chuẩn")
- Q: Lịch popup và thông báo khi đặt / xóa hạn? → A: Popup có dòng "Hạn nộp: 23:59 {dd/MM/yyyy}" và hai nút "Xóa" / "Áp dụng"; đặt hạn báo "Đã đặt hạn nộp 23:59 {dd/MM/yyyy}. Nhắc học viên chưa làm lúc 08:00 ngày hạn."; ngày đã qua có cảnh báo trong popup và thông báo riêng; "Xóa" bỏ hạn không cần xác nhận, báo "Đã xóa hạn nộp." (AC-21.2 … AC-21.4, AC-21.6). (source: stakeholder "prototype là chuẩn")
- Q: Đặt / xóa hạn cho mọi bộ của một Bài có cần xác nhận không? → A: Không; ô "Đặt hạn cho mọi bộ của bài" mở cùng lịch popup, "Áp dụng" đặt hạn cho mọi bộ Đã xuất bản của Bài, "Xóa" xóa hạn của mọi bộ đó, áp dụng ngay — thay hộp xác nhận và thao tác "Xóa hạn mọi bộ" của v8 (AC-22.1, AC-22.2). (source: stakeholder "prototype là chuẩn")
- Q: GV thấy gì khi phần Bài tập đang ẩn mà có hạn nộp? → A: Dòng "Hạn nộp được giữ nhưng không gửi nhắc khi phần đang ẩn." bên dưới ô Bài tập của Bài, thay nhãn "Không hiệu lực — phần đang ẩn" (AC-22.6). (source: stakeholder "prototype là chuẩn")
- Q: Thông tin "đã gửi nhắc" hiển thị ở đâu? → A: Chỉ ở phần theo dõi bộ bài tập của 009 (prototype: "Đã gửi nhắc {HH:mm} · {n} HV"); tab Nội dung không hiển thị (AC-26.3). (source: stakeholder "prototype là chuẩn")
- Q: Email nhắc gộp theo HV hay theo lớp, nội dung thế nào? → A: Theo lớp: mỗi HV một email cho mỗi lớp mỗi ngày; tiêu đề "[SAT] Hôm nay là hạn nộp bài tập – {tên lớp}"; danh sách bộ kèm "{tên Bài} · Hạn nộp 23:59 {dd/MM/yyyy}" sắp theo thứ tự Bài và bộ; một nút "Làm bài ngay"; không nêu tên GV; bỏ nút "Xem lớp của tôi" khi quá 20 bộ (AC-24.1, AC-24.5, AC-25.1 … AC-25.3, NFR-10, Goals). (source: stakeholder "prototype là chuẩn")
- Q: Nút "Làm bài ngay" mở đâu khi email có nhiều bộ? → A: Email có một bộ → S05 của bộ đó; từ hai bộ trở lên → S02 của lớp; qua A01 nếu chưa đăng nhập (AC-25.4). (source: assumption — prototype chỉ ghi "Liên kết mở bài tập (đăng nhập nếu cần)"; S02 là đích chung an toàn nhất khi các bộ thuộc nhiều Bài)
- Q: Dòng HV "Chưa kích hoạt" ở tab Học viên có gợi ý kèm liên kết T11 không? → A: Không; chỉ có nhãn trạng thái tài khoản "Chưa kích hoạt" như prototype (AC-8.7). (source: stakeholder "prototype là chuẩn")
- Q: Các thay đổi chỉ về câu chữ? → A: AC-1.1 (tiêu đề "Tạo lớp mới", stepper đánh số "Thông tin lớp", "Thêm học viên", "Chọn giáo trình", "Xác nhận", dòng "Bước {n}/4 · {tên bước}") và AC-9.2 (hộp xác nhận đổi giáo trình theo câu của prototype; hạn nộp của lớp vẫn bị bỏ). Các chuỗi prototype không mô phỏng (lỗi kiểm tra của wizard và biểu mẫu sửa lớp, trạng thái trống bước 2 / bước 3, lỗi mạng, xung đột phiên, giới hạn 100 HV, cảnh báo hạn hôm nay sau 08:00) giữ nguyên theo spec. (source: stakeholder "prototype là chuẩn")
- Q: Q-1 — GV có được đổi giáo trình khi lớp đã có bài nộp của HV không? → A: Phương án (a) — chặn: trên thẻ giáo trình của tab Tổng quan (T04), nút "Đổi giáo trình" bị vô hiệu kèm chú thích "Không thể đổi giáo trình vì học viên đã có bài nộp trong lớp này." như prototype; bỏ dấu cần làm rõ ở REQ-9; AC-9.3 viết lại; Q-1 đóng (§11). (source: stakeholder "cứ sửa spec theo prototype")
- Q: Q-3 — Lớp kết thúc thế nào khi đầu vào không có ngày kết thúc? → A: Phương án (a) — chỉ thủ công bằng "Kết thúc lớp" (lớp Đang học, có hộp xác nhận); T03 và biểu mẫu sửa lớp không có trường ngày kết thúc, hệ thống không tự kết thúc lớp; ngày kết thúc = ngày GV kết thúc lớp, hiện ở tab Tổng quan, như prototype; bỏ dấu cần làm rõ ở REQ-10; thêm AC-10.6; Q-3 đóng (§11, §9). (source: stakeholder "cứ sửa spec theo prototype")
- Q: HV chưa kích hoạt được đếm và hiển thị thế nào trong lớp? → A: Sĩ số "{N}/100" (T02, phần đầu T04, tab Học viên, hộp thoại "Thêm học viên") và giới hạn 100 tính mọi thành viên, kể cả "Chưa kích hoạt" và "Gửi email thất bại", mỗi HV mang nhãn trạng thái tài khoản ở tab Học viên; tab Tiến độ (009) và tab Xếp hạng (008) chỉ gồm HV đã kích hoạt, kể cả "Đã khóa" — khớp quy tắc đếm của 009 — AC-8.7 viết lại, thêm AC-8.9, §8, §10. (source: stakeholder "cứ sửa spec theo prototype")
- Q: Thông tin "Đã gửi nhắc" trong 003 có khớp prototype không? → A: Có — 003 chỉ ghi nhận thời điểm gửi và số HV n cho 009 hiển thị "Đã gửi nhắc {HH:mm} · {n} HV" ở phần theo dõi bộ bài tập; tab Nội dung không hiển thị (AC-26.3, không đổi). (source: stakeholder "cứ sửa spec theo prototype")

### Session 2026-10-22 (bài tập theo hạn nộp)

Không đánh số lại REQ/AC; không AC nào bị bỏ. Sửa US-5, US-12 (independent test), AC-17.4, AC-19.1, AC-19.3, AC-19.4, AC-19.5, AC-21.6, AC-22.2, AC-22.4, AC-23.5; thêm US-14, AC-13.7, AC-19.8, AC-19.9, AC-21.7, AC-21.8, AC-23.7; theo spec 006 (bài thi độc lập) sửa AC-11.3, thêm AC-11.5, AC-13.8, AC-17.8; cập nhật §1, §7, §8, §9 (thêm "Removed (2026-10-22)"), §10. Mục A9 (Session 2026-10-18) và "S11 hiển thị gì?" (Session 2026-10-20) được gắn "[thay thế 2026-10-22 — một phần …]".

- Q: Stakeholder yêu cầu gì? → A: Nguyên văn: "và ở học viên bài học sẽ hiện full và học được hết trước các bài trong khóa, nhưng bài tập thì vẫn hiện full nhưng sẽ chỉ enable bài tập nào GV đã set deadline trước đó thì mới có thể làm được và tính điểm". Kèm theo (008 sở hữu): Điểm xếp hạng = 30 % × TB bài tập + 70 % × TB bài thi; một bộ bài tập được tính cho HV khi đã nộp, hoặc khi đã quá hạn mà chưa nộp (= 0); điểm bài thi lấy từ module 006 (bài thi độc lập giao cho lớp: giờ mở + thời lượng + giờ đóng). (source: stakeholder)
- Q: HV học bài học thế nào? → A: Mọi Bài đã xuất bản của giáo trình (không bị ẩn ở lớp) và mọi bước học hiển thị mở ngay từ khi lớp Đang học, theo bất kỳ thứ tự nào, không khóa tuần tự, không mở dần theo tiến độ hay theo bài tập; ẩn phần theo lớp (D5) giữ nguyên (AC-19.8, AC-17.1, AC-17.2). (source: stakeholder)
- Q: Bộ bài tập chưa có hạn nộp hiển thị thế nào ở S11, chữ gì? → A: Vẫn liệt kê (tên, số câu hỏi "{n} câu"), dòng bị vô hiệu với nhãn "Chưa mở" và dòng "Giáo viên chưa đặt hạn nộp", chạm không mở gì; không có nhãn hạn (AC-19.3, AC-19.9, AC-19.5). (source: assumption — "Chưa mở" ngắn, đúng nghĩa và không đổ lỗi cho HV; không cho chạm là cách rõ nhất để thể hiện "disabled"; số câu hỏi đáp ứng "bài tập vẫn hiện full")
- Q: S02 hiển thị gì cho Bài mà chưa bộ bài tập nào có hạn? → A: Nhãn "Bài tập chưa mở" thay cho tiến độ "{x}/{y} bộ bài tập" (cũng ở phần đầu S11); S02 không có nhãn "Chưa mở" theo từng bộ (AC-13.7, §9). (source: assumption — tiến độ của 009 chỉ tính bộ đang mở nên y = 0; nhãn riêng tránh hiển thị "0/0" hay "Chưa có bài tập" gây hiểu nhầm là Bài không có bài tập)
- Q: GV biết bộ nào đang đóng với HV và được cảnh báo khi xóa hạn thế nào? → A: Ô hạn nộp trống hiển thị "Đặt hạn" kèm "Chưa mở với học viên"; popup của bộ (hoặc của ô "Đặt hạn cho mọi bộ của bài") đang có hạn hiển thị cảnh báo không chặn "Xóa hạn sẽ đóng bộ bài tập với học viên lớp này: ai chưa nộp sẽ thấy “Chưa mở” và không làm được; bài đã nộp và điểm được giữ."; vẫn không có hộp xác nhận (giữ hành vi prototype); thông báo sau khi xóa nêu bộ chuyển sang "Chưa mở" (AC-21.6, AC-21.7, AC-21.8, AC-22.2). (source: assumption — yêu cầu "deadline UI must warn"; cảnh báo trong popup đủ để GV thấy trước khi bấm "Xóa" mà không thêm bước so với prototype; xóa hạn đảo ngược được bằng đặt lại hạn)
- Q: Xóa hạn khi HV đang làm dở hoặc sau khi đã có bài nộp thì sao? → A: Đang làm dở: bộ thành "Chưa mở", lần lưu / nộp kế tiếp bị từ chối, câu trả lời đã lưu được giữ, đặt lại hạn thì làm tiếp (005 AC-23.9 – AC-23.11). Đã nộp: bài nộp, điểm, "Đã hoàn thành" và S06 giữ nguyên (AC-23.7); 008 quyết định cách tính trong Điểm xếp hạng. (source: assumption — phương án thận trọng nhất, cùng mẫu "giữ dữ liệu, chặn thao tác" của phần bị ẩn (AC-18.2); "never lose learning data")
- Q: Email nhắc thay đổi gì? → A: Không; điều kiện nhắc (AC-24.2) vốn yêu cầu bộ có hạn nộp là ngày hôm đó, tức chỉ bộ đang mở. (source: assumption — đối chiếu yêu cầu "reminder eligibility (only enabled sets, as today)")
- Q: Bộ mới xuất bản, bộ do AI duyệt thay thế, lớp đổi giáo trình? → A: Bộ mới chưa có hạn ở lớp nên "Chưa mở" cho tới khi GV đặt hạn ở tab Nội dung (AC-22.4, AC-9.2, §8). (source: assumption — hệ quả trực tiếp của quy tắc; tránh tự mở bài tập GV chưa giao)
- Q: "Điểm xếp hạng đã tích lũy" (AC-17.4) còn đúng không? → A: Không còn là tổng; AC-17.4 và §8 nay nói kết quả bài tập đã có được giữ và được 008 tính vào Điểm xếp hạng theo công thức của 008. (source: assumption — loại bỏ cách hiểu "điểm xếp hạng = tổng" trái với mô hình 30/70 của 008)
- Q: Bài thi (006, khôi phục 2026-10-22) ảnh hưởng 003 thế nào? → A: (1) Bài nộp bài thi được giao cho lớp (kể cả nộp tự động) là "bài nộp của lớp" khi chặn xóa lớp (AC-11.3, AC-11.4) — không ảnh hưởng đổi giáo trình (AC-9.3); (2) xóa lớp chưa có bài nộp bỏ lớp khỏi mọi bài thi được giao (AC-11.5); (3) S02 có lối vào "Bài thi của lớp ({N})" mở S07 của 006 khi HV thấy được ít nhất một bài thi của lớp (AC-13.8); (4) ẩn/hiện phần theo lớp không áp dụng cho bài thi (AC-17.8); S11 và tab Nội dung không có bài thi; §9 mục "Hoãn (v3) — Bài thi" được gắn "[thay thế 2026-10-22 — một phần]". (source: stakeholder — điều phối liên module 2026-10-22 theo spec 006; nhãn "Bài thi của lớp ({N})" và việc ẩn lối vào khi N = 0 là assumption — cùng kiểu "Thành viên ({N})" của AC-20.1)
