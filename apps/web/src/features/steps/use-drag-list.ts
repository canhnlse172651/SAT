import { type DragEvent, useRef } from 'react';

/** Native drag-and-drop of rows by their grip; keyboard users use "Lên" / "Xuống" (NFR-7). */
export function useDragList(onMove: (from: number, to: number) => void) {
  const from = useRef<number | null>(null);
  return {
    grip: (i: number) => ({
      draggable: true,
      onDragStart: (e: DragEvent) => {
        e.stopPropagation();
        from.current = i;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(i));
      },
      onDragEnd: () => {
        from.current = null;
      },
    }),
    target: (i: number) => ({
      onDragOver: (e: DragEvent) => {
        if (from.current === null) return;
        e.preventDefault();
        e.stopPropagation();
      },
      onDrop: (e: DragEvent) => {
        if (from.current === null) return;
        e.preventDefault();
        e.stopPropagation();
        const src = from.current;
        from.current = null;
        if (src !== i) onMove(src, i);
      },
    }),
  };
}
