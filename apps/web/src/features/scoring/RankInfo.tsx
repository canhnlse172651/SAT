import { Icon } from '../../components';

/** "Cách tính điểm" (AC-13.1): the S09 sheet and the T04 dialog. */
export function RankInfo() {
  return (
    <div className="rk-info">
      <p className="rk-info__formula">Điểm xếp hạng = 30% × TB bài tập + 70% × TB bài thi</p>
      <ul className="rk-info__list">
        <li>
          Mỗi <b>bộ bài tập</b> và mỗi <b>bài thi</b> được tính trên thang 0–100: điểm đạt ÷ điểm
          tối đa × 100 của bài nộp duy nhất, làm tròn tới số nguyên.
        </li>
        <li>
          Chỉ <b>bộ bài tập đã có hạn nộp</b> ở lớp mới được tính: đã nộp thì tính điểm bài nộp; quá
          hạn mà chưa nộp thì tính 0. Bài thi đã nộp tính điểm; qua giờ đóng mà không làm thì tính
          0. TB bằng 0 khi chưa có mục nào được tính.
        </li>
        <li>
          TB bài tập, TB bài thi và Điểm xếp hạng làm tròn tới một chữ số thập phân (từ 0,05 làm
          tròn lên).
        </li>
        <li>Giáo viên sửa đáp án → bài nộp được chấm lại, điểm có thể tăng hoặc giảm.</li>
        <li>
          Bài tập đã nộp thuộc phần bị ẩn hoặc đã lưu trữ vẫn được tính, gộp vào dòng “Nội dung đã
          ẩn: k bộ bài tập · S điểm”; bài thi đã nộp rồi bị gỡ khỏi lớp gộp vào dòng “Bài thi đã gỡ:
          k bài thi · S điểm”.
        </li>
        <li>
          Bước học và flashcard không cộng điểm. Bằng điểm thì cùng hạng (1, 2, 2, 4); 0,0 điểm là
          chưa có hạng (“—”).
        </li>
      </ul>
      <p className="rk-info__example">
        <Icon name="info" size={18} />
        <span>
          Ví dụ: hai bộ bài tập 90 và 70 → TB bài tập 80,0; một bài thi 84 → TB bài thi 84,0; Điểm
          xếp hạng = 30% × 80,0 + 70% × 84,0 = 82,8.
        </span>
      </p>
    </div>
  );
}
