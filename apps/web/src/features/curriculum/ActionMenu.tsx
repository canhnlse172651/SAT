import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Icon, type IconName } from '../../components';

export interface MenuAction {
  label: string;
  icon: IconName;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  /** Draws a separator above the item. */
  separated?: boolean;
}

export interface ActionMenuProps {
  /** Accessible name of the "…" button, e.g. "Thao tác với Bài 1". */
  label: string;
  actions: MenuAction[];
  /** Replaces the default "…" icon button. */
  trigger?: (props: { onClick: () => void; expanded: boolean; id: string }) => ReactNode;
}

/** Prototype `.popover` menu: arrow keys move, Esc closes and returns focus, a click outside closes. */
export function ActionMenu({ label, actions, trigger }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    items.current.find((b) => b && !b.disabled)?.focus();
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const enabled = items.current.filter((b): b is HTMLButtonElement => !!b && !b.disabled);
    const at = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      enabled[(at + step + enabled.length) % enabled.length]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="cur-menu" ref={root}>
      {trigger ? (
        trigger({ onClick: () => setOpen((o) => !o), expanded: open, id })
      ) : (
        <button
          ref={button}
          type="button"
          className="icon-btn icon-btn--sm"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="more" />
        </button>
      )}
      {open && (
        <div className="popover" role="menu" id={id} aria-label={label} onKeyDown={onKeyDown}>
          {actions.map((a, i) => (
            <div key={a.label} role="none">
              {a.separated && <div className="popover__sep" role="separator" />}
              <button
                ref={(el) => {
                  items.current[i] = el;
                }}
                type="button"
                role="menuitem"
                className={a.danger ? 'popover__item popover__item--danger' : 'popover__item'}
                aria-disabled={a.disabled || undefined}
                title={a.title}
                onClick={() => {
                  if (a.disabled) return;
                  setOpen(false);
                  a.onSelect();
                }}
              >
                <Icon name={a.icon} size={18} />
                {a.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
