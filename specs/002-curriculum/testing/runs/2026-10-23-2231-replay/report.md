# Replay 002 — 2026-10-23-2231

Chạy lại script đã lưu (không có AI), 72/76 Pass.

| Test | Kết quả | Thời gian |
|------|---------|-----------|
| [002:AC-1.1] [002:AC-1.2] [002:AC-4.2] TC-001 tạo giáo trình mở T06 trống | Pass | 3546 ms |
| [002:AC-1.3] TC-002 tên giáo trình rỗng hoặc quá 100 ký tự | Pass | 3432 ms |
| [002:AC-1.4] TC-003 tên trùng (hoa/thường, khoảng trắng, kể cả đã lưu trữ) | Pass | 2738 ms |
| [002:AC-1.5] TC-004 thiếu cấp độ HSK, mô tả quá 2000 ký tự | Pass | 2961 ms |
| [002:AC-1.6] [002:AC-1.2] TC-005 ảnh bìa: sai định dạng, quá 2 MB, PNG hợp lệ | Pass | 4508 ms |
| [002:AC-3.1] [002:AC-3.4] TC-006 T05 trống rồi thẻ giáo trình đầy đủ thông tin | Pass | 2841 ms |
| [002:AC-3.2] [002:AC-3.3] [002:AC-3.5] TC-007 lọc cấp độ giữ trong phiên, tìm không dấu, không khớp | Pass | 3757 ms |
| [002:AC-3.6] TC-008 phân trang 20 giáo trình, tổng số, T05 ≤ 2 s với 300 giáo trình (NFR-1) | Pass | 11647 ms |
| [002:AC-2.1] [002:AC-2.2] TC-009 sửa thông tin giáo trình, tên trùng bị từ chối | Pass | 5488 ms |
| [002:AC-2.3] [002:AC-2.4] TC-010 đổi cấp độ HSK của giáo trình đang dùng: xác nhận, hủy, lớp thấy mới | Pass | 7035 ms |
| [002:AC-4.1] [002:AC-4.3] TC-011 T06 dòng Bài: số, tên, trạng thái, tóm tắt, nhãn; thông báo lớp đang dùng | Pass | 4068 ms |
| [002:AC-4.4] TC-012 danh sách Lớp sử dụng | Pass | 3253 ms |
| [002:AC-13.1] TC-013 xóa giáo trình không lớp, không dữ liệu | Pass | 3489 ms |
| [002:AC-13.2] [002:AC-13.5] TC-014 giáo trình đang dùng không xóa được, lưu trữ thay thế | Pass | 5637 ms |
| [002:AC-13.3] TC-015 giáo trình có dữ liệu học tập không xóa được | Pass | 2308 ms |
| [002:AC-13.4] TC-016 lớp hoặc dữ liệu phát sinh sau khi hộp xóa đã mở | Pass | 3808 ms |
| [002:AC-13.6] TC-017 khôi phục giáo trình đã lưu trữ | Pass | 2747 ms |
| [002:AC-5.1] [002:AC-5.2] [002:AC-7.1] TC-018 thêm bài, T18 mở với 2 panel | Fail | 11416 ms |
| [002:AC-5.3] [002:AC-5.4] TC-019 đổi tên bài trên T06 và T18 (NFR-8) | Fail | 3036 ms |
| [002:AC-5.5] TC-020 giới hạn 100 bài | Pass | 4571 ms |
| [002:AC-6.1] [002:AC-6.3] TC-021 kéo-thả bài, thả ra ngoài thì về chỗ cũ | Pass | 2690 ms |
| [002:AC-6.2] [002:AC-6.3] TC-022 sắp xếp bài bằng bàn phím, nút và menu (NFR-5) | Pass | 3089 ms |
| [002:AC-6.4] TC-023 lưu thứ tự thất bại thì trả về thứ tự cũ | Pass | 2045 ms |
| [002:AC-6.5] [002:AC-6.6] [002:AC-8.1] TC-024 Lên/Xuống trong T07, kể cả mục lưu trữ đang ẩn | Pass | 2438 ms |
| [002:AC-7.3] [002:AC-7.4] [002:AC-7.2] TC-025 panel Thủ công: tóm tắt theo trạng thái, phần trống | Pass | 1680 ms |
| [002:AC-7.5] [002:AC-7.11] [002:AC-7.14] [002:AC-8.3] TC-026 T07 mở ở tab Bài học, phần đầu, không chế độ xem trước | Pass | 2187 ms |
| [002:AC-7.6] [002:AC-7.10] TC-027 thêm mục lưu ngay ở Nháp, Thêm sau, rời T07 | Pass | 2905 ms |
| [002:AC-7.8] TC-028 quay lại T18 thấy tóm tắt mới nhất, tiêu điểm ở Soạn thủ công | Pass | 3551 ms |
| [002:AC-7.9] TC-029 tối đa 30 bộ bài tập không lưu trữ, nút thêm luôn bật | Pass | 3715 ms |
| [002:AC-7.12] [002:AC-7.13] TC-030 thay đổi chưa lưu giữ qua tab, hỏi khi rời T07, đường dẫn T09 | Pass | 3797 ms |
| [002:AC-8.2] TC-031 không chuyển hay thêm mục sang phần kia | Pass | 1380 ms |
| [002:AC-8.3] [002:AC-10.2] TC-032 cùng một thứ tự cho T07, T21 và HV | Pass | 5438 ms |
| [002:AC-9.1] [002:AC-9.2] TC-033 xuất bản một mục: chưa hoàn chỉnh bị từ chối, lưu + xuất bản ngay | Pass | 3077 ms |
| [002:AC-9.3] [002:AC-9.4] TC-034 hộp xuất bản bài: chọn sẵn mục sẵn sàng, cảnh báo lớp, HV thấy đúng | Pass | 4727 ms |
| [002:AC-9.5] [002:AC-9.3] TC-035 không có mục sẵn sàng thì không xuất bản được bài | Pass | 1942 ms |
| [002:AC-9.6] [002:AC-9.3] TC-036 chỉ có các chuyển trạng thái hợp lệ, không về Nháp | Pass | 3062 ms |
| [002:AC-10.1] [002:AC-10.3] TC-037 HV chỉ thấy Bài và mục Đã xuất bản, không thấy phần/Bài rỗng | Pass | 3363 ms |
| [002:AC-10.5] [002:AC-17.3] TC-038 HV mở nội dung không được thấy: 404 đồng nhất, trang quản trị chuyển về S01, A05 | Fail | 9238 ms |
| [002:AC-10.4] [002:AC-11.2] [002:AC-11.3] TC-039 nhãn AI, mọi thao tác vẫn dùng được, HV chỉ thấy nội dung đã lưu | Pass | 4580 ms |
| [002:AC-10.6] TC-040 thay đổi của GV hiện cho HV ở lần tải kế tiếp ≤ 5 s (NFR-4) | Pass | 2662 ms |
| [002:AC-10.7] TC-041 Bài đã xuất bản không còn nội dung cho HV thì có cảnh báo | Pass | 2858 ms |
| [002:AC-11.1] TC-042 panel Tạo bằng AI có trên mọi Bài | Pass | 1972 ms |
| [002:AC-11.4] TC-043 bấm nhãn AI: chờ duyệt → T20, đang tạo → panel Tạo bằng AI của T18 | Pass | 2088 ms |
| [002:AC-11.5] [002:AC-11.7] [002:AC-19.2] [002:AC-19.3] [002:AC-19.6] TC-044 duyệt AI thay phần Bài tập | Pass | 4539 ms |
| [002:AC-11.6] TC-045 duyệt quá 30 mục thì không thay đổi gì | Pass | 1425 ms |
| [002:AC-19.1] TC-046 nội dung hộp xác nhận duyệt AI | Pass | 1614 ms |
| [002:AC-19.4] TC-047 mục chưa đạt điều kiện xuất bản thì không duyệt | Pass | 1519 ms |
| [002:AC-19.5] TC-048 phần đổi sau khi mở hộp duyệt thì không thay thế | Pass | 3130 ms |
| [002:AC-12.1] [002:AC-12.2] TC-049 xóa mục: hộp xác nhận, xóa cả thay đổi chưa lưu, đánh số lại | Pass | 2890 ms |
| [002:AC-12.3] [002:AC-12.6] TC-050 bộ bài tập có dữ liệu học tập không xóa được | Pass | 2626 ms |
| [002:AC-12.4] TC-051 xóa bài không có dữ liệu học tập | Pass | 3039 ms |
| [002:AC-12.5] [002:AC-12.6] TC-052 bài có dữ liệu học tập không xóa được | Pass | 3122 ms |
| [002:AC-12.7] TC-053 xóa bài có nội dung AI chờ duyệt | Pass | 2335 ms |
| [002:AC-18.1] [002:AC-18.2] [002:AC-18.4] TC-054 lưu trữ và khôi phục bộ bài tập có dữ liệu | Pass | 5580 ms |
| [002:AC-18.3] TC-055 mục lưu trữ: tính trong tóm tắt, ẩn mặc định, sửa được | Pass | 2659 ms |
| [002:AC-18.5] TC-056 không lưu trữ được khi còn thay đổi chưa lưu | Pass | 1997 ms |
| [002:AC-14.1] [002:AC-14.2] [002:AC-14.3] TC-057 nhân bản bài: ngay sau bản gốc, tất cả Nháp, giữ AI tạo | Pass | 3427 ms |
| [002:AC-14.1] [002:AC-14.4] TC-058 tên bản sao tối đa 100 ký tự, bản sao độc lập | Pass | 1965 ms |
| [002:AC-14.5] [002:AC-15.5] TC-059 nhân bản thất bại không để lại bản sao | Fail | 10531 ms |
| [002:AC-15.1] TC-060 hộp nhân bản giáo trình điền sẵn tên và cấp độ | Pass | 2592 ms |
| [002:AC-15.2] [002:AC-15.3] [002:AC-15.4] TC-061 nhân bản giáo trình: đầy đủ, giữ trạng thái, độc lập | Pass | 4176 ms |
| [002:AC-15.6] [002:AC-17.5] TC-062 đang nhân bản: thông báo, không nhận thêm yêu cầu | Pass | 5436 ms |
| [002:AC-16.1] [002:AC-16.10] TC-063 mở T21 từ T06; T18, T07 không có Xem như học viên | Pass | 1899 ms |
| [002:AC-16.1] [002:AC-16.2] TC-064 công tắc Gồm cả mục Nháp, trạng thái trống | Pass | 1824 ms |
| [002:AC-16.3] [002:AC-16.4] [002:AC-16.5] TC-065 nội dung đầy đủ, chọn thử đáp án, không nộp, không ghi nhận | Pass | 2342 ms |
| [002:AC-16.6] TC-066 thoát xem trước về đúng vị trí Bài trên T06 | Pass | 3263 ms |
| [002:AC-16.7] [002:AC-16.8] [002:AC-16.9] TC-067 Web / Mobile: mặc định Web, giữ trạng thái, nhớ trong phiên | Pass | 3906 ms |
| [002:AC-17.1] [002:AC-17.2] TC-068 GV workspace khác: A05 và 404 đồng nhất, không đổi dữ liệu (NFR-6) | Pass | 8801 ms |
| [002:AC-17.4] TC-069 thao tác dựa trên dữ liệu đã đổi ở tab khác bị từ chối, giữ nội dung đang nhập | Pass | 9522 ms |
| [002:AC-17.5] TC-070 bấm gửi nhiều lần chỉ thực hiện một lần | Pass | 5043 ms |
| [002:NFR-2] TC-071 hiệu năng T06, T18, thao tác lưu, Web/Mobile và duyệt AI | Pass | 14142 ms |
| [002:NFR-3] TC-072 hiệu năng nhân bản Bài 60 mục và giáo trình 20 Bài (~400 mục) | Pass | 23585 ms |
| [002:AC-3.3] [002:NFR-8] TC-075 chữ Hán, pinyin có dấu, tiếng Việt hiển thị nguyên văn | Pass | 3636 ms |
| [002:AC-2.4] [002:AC-10.6] TC-076 thông tin giáo trình mới hiện cho HV các lớp đang dùng | Pass | 3086 ms |
| [002:AC-7.2] [002:AC-8.2] TC-077 không có thao tác chuyển mục hay sửa phần trong T07 | Pass | 1738 ms |
| [002:AC-17.3] TC-078 HV mở T05 bị đưa về S01 | Pass | 1432 ms |
