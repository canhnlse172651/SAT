import { Link, useLocation } from 'react-router';
import { useDocumentTitle } from '../lib/use-document-title';

interface Props {
  id: string;
  name: string;
}

/** Stand-in for a screen that its module has not built yet. */
export function PlaceholderPage({ id, name }: Props) {
  useDocumentTitle(name);
  const { search } = useLocation();
  return (
    <section className="placeholder" data-screen={id}>
      <h1>
        Đang xây dựng · {id} {name}
      </h1>
      {/* Until module 001 builds A01, development offers the dev sign-in (keeps returnTo). */}
      {import.meta.env.DEV && id === 'A01' && (
        <p>
          <Link to={`/dev/login${search}`}>Đăng nhập nhanh (dev)</Link>
        </p>
      )}
    </section>
  );
}
