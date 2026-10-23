import { type DragEvent, type KeyboardEvent, useRef, useState } from 'react';
import { positionAnnouncement } from '@sat/shared';

const moved = (order: readonly string[], id: string, to: number): string[] => {
  const next = order.filter((x) => x !== id);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, id);
  return next;
};

/**
 * Sorting of the T06 Bài list (AC-6.1 … AC-6.3): mouse drag-and-drop, or keyboard on the grip — Space lifts,
 * ↑ / ↓ move, Space drops, Esc (or leaving the list) puts the Bài back. `commit` receives the new order.
 */
export function useSortable(
  ids: readonly string[],
  commit: (order: string[], id: string) => void,
  /** Screen-reader announcements ("Vị trí 5 trên 12" — AC-6.2). */
  announce: (text: string) => void,
) {
  const [preview, setPreview] = useState<string[] | null>(null);
  const [lifted, setLifted] = useState<string | null>(null);
  const dragging = useRef<string | null>(null);
  const dropped = useRef(false);

  const order = preview ?? [...ids];

  const finish = (next: string[] | null, id: string) => {
    setPreview(null);
    setLifted(null);
    dragging.current = null;
    if (next && next.join() !== ids.join()) commit(next, id);
  };

  const cancel = () => {
    setPreview(null);
    setLifted(null);
    dragging.current = null;
  };

  const gripProps = (id: string) => ({
    draggable: true,
    'aria-pressed': lifted === id,
    onDragStart: (e: DragEvent) => {
      dragging.current = id;
      dropped.current = false;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      setPreview([...ids]);
    },
    // Released outside the list (no drop): back to where it was (AC-6.3).
    onDragEnd: () => {
      if (!dropped.current) cancel();
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (lifted !== id) {
          setLifted(id);
          setPreview([...ids]);
          announce(`Đã nhấc. ${positionAnnouncement(ids.indexOf(id) + 1, ids.length)}`);
        } else {
          finish(order, id);
        }
      } else if (lifted === id && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const at = order.indexOf(id) + (e.key === 'ArrowUp' ? -1 : 1);
        if (at < 0 || at >= order.length) return;
        setPreview(moved(order, id, at));
        announce(positionAnnouncement(at + 1, order.length));
      } else if (lifted === id && e.key === 'Escape') {
        e.preventDefault();
        cancel();
        announce(`Đã hủy di chuyển. ${positionAnnouncement(ids.indexOf(id) + 1, ids.length)}`);
      }
    },
    onBlur: () => {
      if (lifted === id) cancel();
    },
  });

  const rowProps = (id: string) => ({
    onDragOver: (e: DragEvent) => {
      const src = dragging.current;
      if (!src) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (src !== id) setPreview((p) => moved(p ?? [...ids], src, (p ?? [...ids]).indexOf(id)));
    },
    onDrop: (e: DragEvent) => {
      const src = dragging.current;
      if (!src) return;
      e.preventDefault();
      dropped.current = true;
      finish(preview, src);
    },
  });

  return { order, lifted, gripProps, rowProps };
}
