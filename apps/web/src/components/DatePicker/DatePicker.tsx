import { formatVnDate, parseVnDate } from '@sat/shared';
import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { cx } from '../cx';
import { FormField } from '../FormField/FormField';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons';
import {
  addDays,
  addMonths,
  clampDay,
  dayKey,
  fromYmd,
  monthGrid,
  toYmd,
  weekdayIndex,
  type Ymd,
} from './calendar';
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

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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
  const captionId = `${useId()}-caption`;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState<Ymd>(() => toYmd(new Date()));
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const shouldFocusGrid = useRef(false);

  const minDay = min ? toYmd(min) : null;
  const maxDay = max ? toYmd(max) : null;
  const selected = value ? toYmd(value) : null;
  const today = toYmd(new Date());
  const text = draft ?? (value ? formatVnDate(value) : '');

  const outOfRange = (day: Ymd) =>
    (minDay !== null && dayKey(day) < dayKey(minDay)) ||
    (maxDay !== null && dayKey(day) > dayKey(maxDay));

  // Move DOM focus to the roving day only after keyboard navigation or opening.
  useEffect(() => {
    if (open && shouldFocusGrid.current) {
      shouldFocusGrid.current = false;
      gridRef.current?.querySelector<HTMLElement>('button[tabindex="0"]')?.focus();
    }
  }, [open, focusDay]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openPopup = () => {
    setFocusDay(clampDay(selected ?? today, minDay, maxDay));
    shouldFocusGrid.current = true;
    setOpen(true);
  };

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

  const onGridKeyDown = (e: KeyboardEvent) => {
    const weekday = weekdayIndex(focusDay.y, focusDay.m, focusDay.d);
    const moves: Record<string, Ymd> = {
      ArrowLeft: addDays(focusDay, -1),
      ArrowRight: addDays(focusDay, 1),
      ArrowUp: addDays(focusDay, -7),
      ArrowDown: addDays(focusDay, 7),
      PageUp: addMonths(focusDay, -1),
      PageDown: addMonths(focusDay, 1),
      Home: addDays(focusDay, -weekday),
      End: addDays(focusDay, 6 - weekday),
    };
    const next = moves[e.key];
    if (!next) return;
    e.preventDefault();
    shouldFocusGrid.current = true;
    setFocusDay(clampDay(next, minDay, maxDay));
  };

  const onPopupKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closePopup(true);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const shiftMonth = (n: number) => setFocusDay((d) => clampDay(addMonths(d, n), minDay, maxDay));
  const prevDisabled =
    minDay !== null && dayKey(addDays({ ...focusDay, d: 1 }, -1)) < dayKey(minDay);
  const nextDisabled =
    maxDay !== null && dayKey(addMonths({ ...focusDay, d: 1 }, 1)) > dayKey(maxDay);

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
              <div className="datepicker__nav">
                <button
                  type="button"
                  className="datepicker__step"
                  aria-label="Tháng trước"
                  disabled={prevDisabled}
                  onClick={() => shiftMonth(-1)}
                >
                  <ChevronLeftIcon />
                </button>
                <div id={captionId} className="datepicker__caption" aria-live="polite">
                  Tháng {focusDay.m} năm {focusDay.y}
                </div>
                <button
                  type="button"
                  className="datepicker__step"
                  aria-label="Tháng sau"
                  disabled={nextDisabled}
                  onClick={() => shiftMonth(1)}
                >
                  <ChevronRightIcon />
                </button>
              </div>
              <table
                ref={gridRef}
                role="grid"
                aria-labelledby={captionId}
                className="datepicker__grid"
              >
                <thead>
                  <tr>
                    {WEEKDAYS.map((w) => (
                      <th key={w} scope="col" className="datepicker__dow">
                        {w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody onKeyDown={onGridKeyDown}>
                  {monthGrid(focusDay.y, focusDay.m).map((week, wi) => (
                    <tr key={wi}>
                      {week.map((d, di) => {
                        if (d === null) return <td key={di} />;
                        const day: Ymd = { y: focusDay.y, m: focusDay.m, d };
                        const isSelected = selected !== null && dayKey(selected) === dayKey(day);
                        return (
                          <td key={di} role="gridcell" aria-selected={isSelected}>
                            <button
                              type="button"
                              tabIndex={d === focusDay.d ? 0 : -1}
                              disabled={outOfRange(day)}
                              aria-label={`${d} tháng ${day.m} năm ${day.y}`}
                              aria-current={dayKey(today) === dayKey(day) ? 'date' : undefined}
                              className={cx(
                                'datepicker__day',
                                isSelected && 'datepicker__day--sel',
                              )}
                              onClick={() => choose(day)}
                            >
                              {d}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </FormField>
  );
}
