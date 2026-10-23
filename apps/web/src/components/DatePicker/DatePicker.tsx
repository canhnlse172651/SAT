import { formatVnDate, parseVnDate } from '@sat/shared';
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { cx } from '../cx';
import { FormField } from '../FormField/FormField';
import { CalendarIcon } from '../icons';
import { Calendar } from '../Calendar/Calendar';
import { dayKey, fromYmd, toYmd, type Ymd } from './calendar';
import './DatePicker.css';

export interface DatePickerProps {
  label: string;
  /** 00:00 Vietnam time of the chosen day, as a UTC instant (apply `endOfVnDay` for deadlines). */
  value: Date | null;
  onChange: (value: Date | null) => void;
  min?: Date;
  max?: Date;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
}

export function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  hint,
  error,
  required,
  disabled,
  size = 'md',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const minDay = min ? toYmd(min) : null;
  const maxDay = max ? toYmd(max) : null;
  const text = draft ?? (value ? formatVnDate(value) : '');

  const outOfRange = (day: Ymd) =>
    (minDay !== null && dayKey(day) < dayKey(minDay)) ||
    (maxDay !== null && dayKey(day) > dayKey(maxDay));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openPopup = () => setOpen(true);

  const closePopup = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const choose = (day: Ymd) => {
    onChange(fromYmd(day));
    setDraft(null);
    setLocalError(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setDraft(next);
    const parsed = parseVnDate(next);
    if (parsed && !outOfRange(toYmd(parsed))) {
      setLocalError(null);
      onChange(parsed);
    }
  };

  const commitDraft = () => {
    if (draft === null) return;
    if (draft.trim() === '') {
      onChange(null);
      setDraft(null);
      setLocalError(null);
      return;
    }
    const parsed = parseVnDate(draft);
    if (!parsed) setLocalError('Ngày không hợp lệ, nhập theo dd/MM/yyyy');
    else if (outOfRange(toYmd(parsed))) setLocalError('Ngày nằm ngoài khoảng cho phép');
    else {
      setDraft(null);
      setLocalError(null);
    }
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && !disabled) {
      e.preventDefault();
      openPopup();
    }
  };

  const onPopupKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closePopup(true);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <FormField
      label={label}
      hint={hint}
      error={error ?? localError ?? undefined}
      required={required}
    >
      {(a11y) => (
        <div className="datepicker" ref={wrapRef}>
          <input
            {...a11y}
            ref={inputRef}
            type="text"
            className={cx('input', 'datepicker__input', size === 'lg' && 'input--lg')}
            placeholder="dd/MM/yyyy"
            autoComplete="off"
            value={text}
            disabled={disabled}
            required={required}
            onChange={onInput}
            onBlur={commitDraft}
            onKeyDown={onInputKeyDown}
          />
          <button
            ref={triggerRef}
            type="button"
            className="datepicker__trigger"
            aria-label="Chọn ngày"
            aria-haspopup="dialog"
            aria-expanded={open}
            disabled={disabled}
            onClick={() => (open ? closePopup(false) : openPopup())}
          >
            <CalendarIcon />
          </button>
          {open && (
            <div
              role="dialog"
              aria-label="Chọn ngày"
              className="datepicker__pop"
              onKeyDown={onPopupKeyDown}
            >
              <Calendar
                selected={value}
                min={min}
                max={max}
                autoFocus
                onSelect={(d) => choose(toYmd(d))}
              />
            </div>
          )}
        </div>
      )}
    </FormField>
  );
}
