import { useId, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import './FormField.css';

/** Props a control must spread so the label, hint and error stay wired to it. */
export interface FieldA11y {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
}

export interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Right-aligned slot in the label row, e.g. a character counter. */
  aside?: ReactNode;
  children: (a11y: FieldA11y) => ReactNode;
}

export function FormField({ label, hint, error, required, aside, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');
  const a11y: FieldA11y = { id };
  if (describedBy) a11y['aria-describedby'] = describedBy;
  if (error) a11y['aria-invalid'] = true;
  if (required) a11y['aria-required'] = true;

  return (
    <div className="field">
      <div className="field__head">
        <label className="field__label" htmlFor={id}>
          {label}
          {required && (
            <span className="field__req" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children(a11y)}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error">
          <Icon name="alert" size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
