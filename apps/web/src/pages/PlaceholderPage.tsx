import { useDocumentTitle } from '../lib/use-document-title';

interface Props {
  id: string;
  name: string;
}

/** Stand-in for a screen that its module has not built yet. */
export function PlaceholderPage({ id, name }: Props) {
  useDocumentTitle(name);
  return (
    <section className="placeholder" data-screen={id}>
      <h1>
        Đang xây dựng · {id} {name}
      </h1>
    </section>
  );
}
