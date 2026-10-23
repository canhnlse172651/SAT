import { Link } from 'react-router';
import { useSessionStore } from '../features/session/session-store';
import { homePath } from '../lib/home-path';
import { useDocumentTitle } from '../lib/use-document-title';

/** A05 — shared by 404, other-workspace data and wrong-role access (001 AC-16.2). */
export function NotFoundPage() {
  useDocumentTitle('Không tìm thấy nội dung');
  const role = useSessionStore((s) => s.user?.role);
  return (
    <main className="notfound">
      <h1>Không tìm thấy nội dung bạn yêu cầu.</h1>
      <p>Nội dung không tồn tại hoặc bạn không có quyền xem.</p>
      <Link to={homePath(role)}>{role ? 'Về trang chủ' : 'Về trang đăng nhập'}</Link>
    </main>
  );
}
