import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import { SpinnerIcon } from '../icons';
import './Button.css';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** `lg` = 48 px, for the mobile student app. */
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'btn',
        `btn--${variant}`,
        size === 'lg' && 'btn--lg',
        block && 'btn--block',
        className,
      )}
    >
      {loading && <SpinnerIcon width={16} height={16} />}
      {children}
    </button>
  );
}
