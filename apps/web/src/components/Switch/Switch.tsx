import { useId, type ReactNode } from 'react';
import { cx } from '../cx';
import './Switch.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  const labelId = useId();
  return (
    <span className={cx('switch', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        className="switch__track"
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" />
      </button>
      <span id={labelId} className="switch__label">
        {label}
      </span>
    </span>
  );
}
