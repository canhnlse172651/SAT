import { Link } from 'react-router';
import { Icon } from '../components';
import { useSessionStore } from '../features/session/session-store';
import { homePath } from '../lib/home-path';
import { useDocumentTitle } from '../lib/use-document-title';

/**
 * A05 — shared by 404, other-workspace data and wrong-role access (001 AC-16.2). Prototype
 * SCREENS.A05: inside the role's shell, "Về Dashboard" for a GV, "Về trang lớp" for an HV.
 */
export function NotFoundPage() {
  useDocumentTitle('Không tìm thấy nội dung');
  const role = useSessionStore((s) => s.user?.role);
  return (
    <section className={role === 'HV' ? 'notfound notfound--hv' : 'notfound'} data-screen="A05">
      <div className="empty__ill notfound__ill">
        <Icon name="search" size={34} />
      </div>
      <h1 className="notfound__title">Không tìm thấy nội dung bạn yêu cầu.</h1>
      <p>Đường dẫn có thể không đúng hoặc nội dung không còn dành cho bạn.</p>
      <Link className="btn btn--primary" to={homePath(role)}>
        {role === 'HV' && <Icon name="back" size={18} />}
        {role === 'GV' ? 'Về Dashboard' : role === 'HV' ? 'Về trang lớp' : 'Về trang đăng nhập'}
      </Link>
    </section>
  );
}
