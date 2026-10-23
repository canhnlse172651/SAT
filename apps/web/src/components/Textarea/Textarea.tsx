import { useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { cx } from '../cx';
import { FormField } from '../FormField/FormField';
import './Textarea.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  size?: 'md' | 'lg';
}

export function Textarea({
  label,
  hint,
  error,
  size = 'md',
  required,
  className,
  maxLength,
  value,
  defaultValue,
  onChange,
  ...rest
}: TextareaProps) {
  const [typed, setTyped] = useState(String(defaultValue ?? '').length);
  const length = value !== undefined ? String(value).length : typed;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTyped(e.target.value.length);
    onChange?.(e);
  };

  const counter =
    maxLength !== undefined ? (
      <span className={cx('counter', length >= maxLength && 'counter--full')} aria-live="polite">
        {length}/{maxLength}
      </span>
    ) : null;

  return (
    <FormField label={label} hint={hint} error={error} required={required} aside={counter}>
      {(a11y) => (
        <textarea
          {...rest}
          {...a11y}
          {...(value !== undefined ? { value } : { defaultValue })}
          maxLength={maxLength}
          required={required}
          onChange={handleChange}
          className={cx('input', 'input--area', size === 'lg' && 'input--lg', className)}
        />
      )}
    </FormField>
  );
}
