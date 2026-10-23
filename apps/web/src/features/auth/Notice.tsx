import type { ReactNode } from 'react';
import { AlertIcon, CheckIcon, InfoIcon } from '../../components/icons';
import './auth.css';

export interface NoticeProps {
  tone?: 'info' | 'success' | 'warn' | 'danger';
  children: ReactNode;
  /** Right-aligned action (button). */
  action?: ReactNode;
  className?: string;
}

/** Inline callout: `danger` is announced as an alert, the others as a status. */
export function Notice({ tone = 'info', children, action, className }: NoticeProps) {
  const Icon = tone === 'success' ? CheckIcon : tone === 'info' ? InfoIcon : AlertIcon;
  return (
    <div
      className={['notice', `notice--${tone}`, className].filter(Boolean).join(' ')}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon width={18} height={18} aria-hidden="true" />
      <div className="notice__body">{children}</div>
      {action && <div className="notice__action">{action}</div>}
    </div>
  );
}
