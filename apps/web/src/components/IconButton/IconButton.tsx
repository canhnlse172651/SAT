import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import './IconButton.css';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  /** Required: an icon alone has no accessible name. */
  'aria-label': string;
  icon: ReactNode;
  /** `md` = 44 px (default, HV), `sm` = 36 px (dense GV tables). */
  size?: 'sm' | 'md';
}

export function IconButton({
  icon,
  size = 'md',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cx('icon-btn', size === 'sm' && 'icon-btn--sm', className)}
    >
      {icon}
    </button>
  );
}
