import { useEffect } from 'react';

const SUFFIX = 'SAT';

/** Sets document.title to "<title> · SAT" while the component is mounted. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · ${SUFFIX}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
