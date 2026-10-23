export type ScreenArea = 'auth' | 'gv' | 'hv' | 'selfStudy';

export interface Screen {
  id: string;
  name: string;
  path: string;
  area: ScreenArea;
}

const s = (id: string, name: string, path: string, area: ScreenArea): Screen => ({
  id,
  name,
  path,
  area,
});

/**
 * Route table keyed by screen id (specs/screen-flow-design.html). T12 (add students dialog) has no
 * route of its own: it opens over T11. T13 and T19 do not exist in the prototype. A05 lives in
 * NOT_FOUND_SCREEN because it is public and renders a real page.
 */
export const SCREENS: readonly Screen[] = [
  s('A01', 'Đăng nhập', '/dang-nhap', 'auth'),
  s('A02', 'Đăng ký giáo viên', '/dang-ky', 'auth'),
  s('A03', 'Quên mật khẩu', '/quen-mat-khau', 'auth'),
  s('T01', 'Dashboard', '/gv', 'gv'),
  s('T02', 'Danh sách lớp', '/gv/lop-hoc', 'gv'),
  s('T03', 'Tạo lớp', '/gv/lop-hoc/tao-moi', 'gv'),
  s('T04', 'Chi tiết lớp', '/gv/lop-hoc/:classId', 'gv'),
  s('T05', 'Danh sách giáo trình', '/gv/giao-trinh', 'gv'),
  s('T06', 'Chi tiết giáo trình', '/gv/giao-trinh/:curriculumId', 'gv'),
  s('T07', 'Soạn bài thủ công', '/gv/giao-trinh/:curriculumId/bai/:lessonId/bai-hoc', 'gv'),
  s('T08', 'Soạn bộ thẻ từ vựng', '/gv/giao-trinh/:curriculumId/bai/:lessonId/the-tu', 'gv'),
  s('T09', 'Soạn bài · tab Bài tập', '/gv/giao-trinh/:curriculumId/bai/:lessonId/thu-cong', 'gv'),
  s('T10', 'Danh sách bài thi', '/gv/bai-thi', 'gv'),
  s('T11', 'Danh sách học viên', '/gv/hoc-vien', 'gv'),
  s('T14', 'Xem bài nộp', '/gv/bai-nop', 'gv'),
  s('T15', 'Chi tiết học viên', '/gv/hoc-vien/:studentId', 'gv'),
  s('T16', 'Kết quả bài thi', '/gv/bai-thi/:examId/ket-qua', 'gv'),
  s('T17', 'Tài khoản giáo viên', '/gv/tai-khoan', 'gv'),
  s('T18', 'Soạn bài', '/gv/giao-trinh/:curriculumId/bai/:lessonId', 'gv'),
  s('T20', 'Review nội dung AI', '/gv/giao-trinh/:curriculumId/bai/:lessonId/review-ai', 'gv'),
  s('T21', 'Xem như học viên', '/gv/giao-trinh/:curriculumId/bai/:lessonId/xem-truoc', 'gv'),
  s('T22', 'Soạn bài thi', '/gv/bai-thi/:examId', 'gv'),
  s('T23', 'Tổng quan kho tự học', '/gv/kho-tu-hoc', 'gv'),
  s('T24', 'Từ vựng tự học', '/gv/kho-tu-hoc/tu-vung', 'gv'),
  s('T25', 'Nghe & hội thoại', '/gv/kho-tu-hoc/nghe-hoi-thoai', 'gv'),
  s('T26', 'Đề thi thử HSK', '/gv/kho-tu-hoc/de-thi-thu', 'gv'),
  s('T27', 'Chữ Hán & bộ thủ', '/gv/kho-tu-hoc/chu-han', 'gv'),
  s('S01', 'Lớp của tôi', '/hv', 'hv'),
  s('S02', 'Trang lớp', '/hv/lop/:classId', 'hv'),
  s('S03', 'Xem bài học', '/hv/lop/:classId/buoc/:stepId', 'hv'),
  s('S04', 'Học flashcard', '/hv/lop/:classId/buoc/:stepId/the-tu', 'hv'),
  s('S05', 'Làm bài tập', '/hv/lop/:classId/bai-tap/:setId', 'hv'),
  s('S06', 'Kết quả bài tập', '/hv/lop/:classId/bai-tap/:setId/ket-qua', 'hv'),
  s('S07', 'Bài thi', '/hv/bai-thi', 'hv'),
  s('S08', 'Làm bài thi', '/hv/bai-thi/:examId', 'hv'),
  s('S09', 'Bảng xếp hạng lớp', '/hv/xep-hang', 'hv'),
  s('S10', 'Hồ sơ của tôi', '/hv/ho-so', 'hv'),
  s('S11', 'Trang bài', '/hv/lop/:classId/bai/:lessonId', 'hv'),
  s('S12', 'Hồ sơ học viên', '/hv/hoc-vien/:studentId', 'hv'),
  s('S13', 'Tự học', '/tu-hoc', 'selfStudy'),
  s('S14', 'Từ vựng', '/tu-hoc/tu-vung', 'selfStudy'),
  s('S15', 'Ôn tập', '/tu-hoc/on-tap', 'selfStudy'),
  s('S16', 'Luyện viết chữ Hán', '/tu-hoc/luyen-viet', 'selfStudy'),
  s('S17', 'Luyện nghe', '/tu-hoc/nghe', 'selfStudy'),
  s('S18', 'Luyện nói', '/tu-hoc/noi', 'selfStudy'),
  s('S19', 'Thi thử HSK', '/tu-hoc/thi-thu', 'selfStudy'),
  s('S20', 'Kết quả & thống kê lỗi', '/tu-hoc/thi-thu/ket-qua', 'selfStudy'),
];
