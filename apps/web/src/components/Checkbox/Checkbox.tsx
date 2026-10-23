import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { CheckIcon } from '../icons';
import './Checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

/** Native checkbox (keyboard, forms, screen readers) with a drawn box. */
export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx('check', className)}>
      <input {...rest} type="checkbox" className="check__input" />
      <span className="check__box" aria-hidden="true">
        <CheckIcon width={14} height={14} strokeWidth={3} />
      </span>
      <span className="check__label">{label}</span>
    </label>
  );
}
