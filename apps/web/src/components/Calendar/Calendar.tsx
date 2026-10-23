import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { cx } from '../cx';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
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
} from '../DatePicker/calendar';
import '../DatePicker/DatePicker.css';

export interface CalendarProps {
  /** 00:00 Vietnam time of the selected day, as a UTC instant. */
  selected: Date | null;
  onSelect: (day: Date) => void;
  min?: Date;
  max?: Date;
  /** The highlighted "today" (defaults to now; pass the server's day when it may differ). */
  today?: Date;
  /** Move focus to the roving day when the calendar mounts (popups). */
  autoFocus?: boolean;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Month grid (Vietnamese labels, Monday first, today marked, out-of-range days disabled) with arrow / Page /
 * Home / End keys — the calendar of `DatePicker` and of popups that pick a day (003 AC-21.2).
 */
export function Calendar({ selected, onSelect, min, max, today, autoFocus }: CalendarProps) {
  const captionId = `${useId()}-caption`;
  const minDay = min ? toYmd(min) : null;
  const maxDay = max ? toYmd(max) : null;
  const sel = selected ? toYmd(selected) : null;
  const todayDay = toYmd(today ?? new Date());
  const [focusDay, setFocusDay] = useState<Ymd>(() => clampDay(sel ?? todayDay, minDay, maxDay));
  const gridRef = useRef<HTMLTableElement>(null);
  const shouldFocus = useRef(!!autoFocus);

  useEffect(() => {
    if (shouldFocus.current) {
      shouldFocus.current = false;
      gridRef.current?.querySelector<HTMLElement>('button[tabindex="0"]')?.focus();
    }
  }, [focusDay]);

  const outOfRange = (day: Ymd) =>
    (minDay !== null && dayKey(day) < dayKey(minDay)) ||
    (maxDay !== null && dayKey(day) > dayKey(maxDay));

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
    shouldFocus.current = true;
    setFocusDay(clampDay(next, minDay, maxDay));
  };

  const shiftMonth = (n: number) => setFocusDay((d) => clampDay(addMonths(d, n), minDay, maxDay));
  const prevDisabled =
    minDay !== null && dayKey(addDays({ ...focusDay, d: 1 }, -1)) < dayKey(minDay);
  const nextDisabled =
    maxDay !== null && dayKey(addMonths({ ...focusDay, d: 1 }, 1)) > dayKey(maxDay);

  return (
    <div className="calendar">
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
      <table ref={gridRef} role="grid" aria-labelledby={captionId} className="datepicker__grid">
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
                const isSelected = sel !== null && dayKey(sel) === dayKey(day);
                return (
                  <td key={di} role="gridcell" aria-selected={isSelected}>
                    <button
                      type="button"
                      tabIndex={d === focusDay.d ? 0 : -1}
                      disabled={outOfRange(day)}
                      aria-label={`${d} tháng ${day.m} năm ${day.y}`}
                      aria-current={dayKey(todayDay) === dayKey(day) ? 'date' : undefined}
                      className={cx('datepicker__day', isSelected && 'datepicker__day--sel')}
                      onClick={() => {
                        setFocusDay(day);
                        onSelect(fromYmd(day));
                      }}
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
  );
}
