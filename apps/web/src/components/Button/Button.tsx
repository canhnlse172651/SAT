import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import { SpinnerIcon } from '../icons';
import './Button.css';

export type ButtonVariant =
  'primary' | 'outline' | 'ghost' | 'danger' | 'danger-outline' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** `sm` = 32 px (dense rows, prototype .btn-sm), `lg` = 48 px for the mobile student app. */
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
        size === 'sm' && 'btn--sm',
        block && 'btn--block',
        className,
      )}
    >
      {loading && <SpinnerIcon width={16} height={16} />}
      {children}
    </button>
  );
}
