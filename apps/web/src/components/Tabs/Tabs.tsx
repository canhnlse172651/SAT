import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: string;
  /** Optional count shown after the label. */
  count?: number;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  'aria-label': string;
  className?: string;
}

/** Controlled tabs with automatic activation and a roving tabindex. */
export function Tabs({ items, value, onChange, 'aria-label': ariaLabel, className }: TabsProps) {
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = items.find((i) => i.id === value) ?? items[0];

  const move = (index: number) => {
    const target = items[(index + items.length) % items.length];
    if (!target) return;
    onChange(target.id);
    refs.current[items.indexOf(target)]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    move(next);
  };

  return (
    <div className={cx('tabs', className)}>
      <div role="tablist" aria-label={ariaLabel} className="tabs__list">
        {items.map((item, i) => {
          const isSelected = item.id === selected?.id;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={isSelected}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              className="tabs__tab"
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {item.label}
              {item.count !== undefined && (
                <>
                  {' '}
                  <span className="tabs__count">{item.count}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {selected && (
        <div
          role="tabpanel"
          id={`${base}-panel-${selected.id}`}
          aria-labelledby={`${base}-tab-${selected.id}`}
          tabIndex={0}
          className="tabs__panel"
        >
          {selected.content}
        </div>
      )}
    </div>
  );
}
