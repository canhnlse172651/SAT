import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../cx';
import { CloseIcon } from '../icons';
import { IconButton } from '../IconButton/IconButton';
import './Overlay.css';

export type OverlayVariant = 'dialog' | 'drawer' | 'sheet';

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Short explanation wired to `aria-describedby`. */
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  role?: 'dialog' | 'alertdialog';
  /** Clicking the scrim closes the layer (default true). */
  closeOnScrim?: boolean;
  /** Dialog widths 440 / 520 / 680 / 860 px (prototype modal and modal.wide); drawers 360 / 440 / 640. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** `confirm`: the prototype's confirmation card — question, impact, actions; no header bar or close button. */
  layout?: 'standard' | 'confirm';
  /** The header's "Đóng" (X) button (default true); leave it out when the footer has the only way out. Esc still closes. */
  closeButton?: boolean;
  className?: string;
}

type PanelProps = Omit<InternalProps, 'open'>;

interface InternalProps extends OverlayProps {
  variant: OverlayVariant;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function OverlayPanel({
  variant,
  onClose,
  title,
  description,
  footer,
  children,
  role = 'dialog',
  closeOnScrim = true,
  size = 'md',
  layout = 'standard',
  closeButton = true,
  className,
}: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  // Mount = open: take focus, lock page scroll; unmount = close: give focus back.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const preferred = panel?.querySelector<HTMLElement>('[data-autofocus]');
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (preferred ?? first ?? panel)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    e.stopPropagation();
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      e.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className={cx('overlay', `overlay--${variant}`)}>
      <div className="overlay__scrim" onClick={closeOnScrim ? onClose : undefined} />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cx(
          'overlay__panel',
          `overlay__panel--${size}`,
          layout === 'confirm' && 'overlay__panel--confirm',
          className,
        )}
      >
        {variant === 'sheet' && <span className="overlay__grab" aria-hidden="true" />}
        {layout === 'confirm' ? (
          <h2 id={titleId} className="overlay__q">
            {title}
          </h2>
        ) : (
          <header className="overlay__head">
            <h2 id={titleId} className="overlay__title">
              {title}
            </h2>
            {closeButton && (
              <IconButton aria-label="Đóng" icon={<CloseIcon />} size="sm" onClick={onClose} />
            )}
          </header>
        )}
        {description && (
          <p id={descId} className="overlay__desc">
            {description}
          </p>
        )}
        {children !== undefined && <div className="overlay__body">{children}</div>}
        {footer && <footer className="overlay__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Overlay({ open, ...props }: InternalProps) {
  return open ? <OverlayPanel {...props} /> : null;
}
