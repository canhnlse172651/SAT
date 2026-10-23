import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../components';
import './auth.css';

export type NoticeTone = 'info' | 'success' | 'warn' | 'danger' | 'neutral';

export interface NoticeProps {
  tone?: NoticeTone;
  /** Overrides the tone's icon (e.g. `key` for the S10 password hint). */
  icon?: IconName;
  children: ReactNode;
  /** Right-aligned action (button). */
  action?: ReactNode;
  className?: string;
}

const ICONS: Record<NoticeTone, IconName> = {
  info: 'info',
  success: 'check',
  warn: 'alert',
  danger: 'alert',
  neutral: 'info',
};

/** Prototype `.callout`: `danger` is announced as an alert, the others as a status. */
export function Notice({ tone = 'info', icon, children, action, className }: NoticeProps) {
  return (
    <div
      className={['callout', `callout--${tone}`, className].filter(Boolean).join(' ')}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon name={icon ?? ICONS[tone]} size={18} />
      <div className="callout__body">{children}</div>
      {action && <div className="callout__action">{action}</div>}
    </div>
  );
}
