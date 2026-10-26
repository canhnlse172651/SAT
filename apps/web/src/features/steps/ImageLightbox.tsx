import { type TouchEvent, useEffect, useRef, useState } from 'react';
import { Button } from '../../components';

const MAX_ZOOM = 4;
const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(1, Math.round(z * 100) / 100));

/** AC-14.4: the image full screen, zoom up to 4× (pinch or +/−), caption and "Đóng". */
export function ImageLightbox({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt: string;
  caption: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const close = useRef<HTMLButtonElement>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [onClose]);

  const distance = (e: TouchEvent) => {
    const [a, b] = [e.touches[0], e.touches[1]];
    return a && b ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : 0;
  };

  return (
    <div className="st-lightbox" role="dialog" aria-modal="true" aria-label={alt || 'Hình ảnh'}>
      <div className="st-lightbox__bar">
        <Button
          size="sm"
          variant="ghost"
          aria-label="Thu nhỏ"
          disabled={zoom <= 1}
          onClick={() => setZoom((z) => clamp(z - 0.5))}
        >
          −
        </Button>
        <span className="small num">{Math.round(zoom * 100)}%</span>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Phóng to"
          disabled={zoom >= MAX_ZOOM}
          onClick={() => setZoom((z) => clamp(z + 0.5))}
        >
          +
        </Button>
        <span className="grow" />
        <button ref={close} type="button" className="btn btn--outline btn--sm" onClick={onClose}>
          Đóng
        </button>
      </div>
      <div
        className="st-lightbox__stage"
        onTouchStart={(e) => {
          if (e.touches.length === 2) pinch.current = { dist: distance(e), zoom };
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinch.current?.dist) {
            setZoom(clamp((pinch.current.zoom * distance(e)) / pinch.current.dist));
          }
        }}
        onTouchEnd={() => {
          pinch.current = null;
        }}
      >
        <img src={src} alt={alt} style={{ width: `${zoom * 100}%` }} draggable={false} />
      </div>
      {caption && <p className="st-lightbox__caption">{caption}</p>}
    </div>
  );
}
