import type { ReactNode } from 'react';
import { cx } from '../cx';
import './EmptyState.css';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  /** Usually a Button. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx('empty', className)}>
      <h3 className="empty__title">{title}</h3>
      {description && <p className="empty__desc">{description}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
