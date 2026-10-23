import { type InputHTMLAttributes, useState } from 'react';
import { FormField, Icon, IconButton } from '../../components';
import './auth.css';

export interface PasswordFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  label: string;
  error?: string | undefined;
  required?: boolean;
}

/** Prototype `pwField`: password input with a show / hide button inside it. */
export function PasswordField({ label, error, required, className, ...rest }: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  return (
    <FormField label={label} error={error} required={required}>
      {(a11y) => (
        <div className="pw-wrap">
          <input
            {...rest}
            {...a11y}
            type={shown ? 'text' : 'password'}
            maxLength={rest.maxLength ?? 64}
            required={required}
            className={['input', className].filter(Boolean).join(' ')}
          />
          <IconButton
            size="sm"
            aria-label="Hiện ký tự đã nhập"
            aria-pressed={shown}
            icon={<Icon name={shown ? 'eyeoff' : 'eye'} />}
            onClick={() => setShown((v) => !v)}
          />
        </div>
      )}
    </FormField>
  );
}
