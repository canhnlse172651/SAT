import type { InputHTMLAttributes } from 'react';
import { cx } from '../cx';
import { FormField } from '../FormField/FormField';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: string;
  error?: string;
  /** `lg` = 48 px / 16 px text for the mobile student app. */
  size?: 'md' | 'lg';
}

export function TextField({
  label,
  hint,
  error,
  size = 'md',
  required,
  className,
  type = 'text',
  ...rest
}: TextFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <input
          {...rest}
          {...a11y}
          type={type}
          required={required}
          className={cx('input', size === 'lg' && 'input--lg', className)}
        />
      )}
    </FormField>
  );
}
