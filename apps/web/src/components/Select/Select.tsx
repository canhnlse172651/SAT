import type { SelectHTMLAttributes } from 'react';
import { cx } from '../cx';
import { FormField } from '../FormField/FormField';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
  /** Adds a first empty option with this text. */
  placeholder?: string;
  size?: 'md' | 'lg';
}

export function Select({
  label,
  options,
  hint,
  error,
  placeholder,
  size = 'md',
  required,
  className,
  ...rest
}: SelectProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <select
          {...rest}
          {...a11y}
          required={required}
          className={cx('input', 'select', size === 'lg' && 'input--lg', className)}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
