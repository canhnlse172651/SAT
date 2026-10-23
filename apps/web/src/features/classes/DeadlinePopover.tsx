import {
  CLASS_MESSAGES as M,
  type ClassContent,
  dayRange,
  deadlineLine,
  formatDay,
  vnDay,
  vnDayStart,
} from '@sat/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { Button, Calendar } from '../../components';

export interface DeadlineFieldProps {
  /** Accessible name of the field ("Hạn nộp Bộ 1", "Đặt hạn cho mọi bộ của bài"). */
  label: string;
  /** Visible caption next to the field (bulk cell). */
  caption?: string;
  /** Current deadline of a single set (null = "Đặt hạn"); bulk cells show "Đặt hạn". */
  value: string | null;
  /** Whether "Xóa" closes something for the class's HV (AC-21.8). */
  hasDeadline: boolean;
  content: Pick<ClassContent, 'today' | 'nowMinutes' | 'startDate'>;
  disabled?: boolean;
  onApply: (day: string) => Promise<void>;
  onClear: () => Promise<void>;
}

const EIGHT_AM = 8 * 60;

/**
 * A deadline cell of tab Nội dung with its popup calendar (AC-21.2 … AC-21.8, AC-22.1, AC-22.2): one day within
 * ±365 days, "Hạn nộp: 23:59 …", non-blocking warnings, "Xóa" and "Áp dụng"; Esc or a click outside closes it.
 */
export function DeadlineField({
  label,
  caption,
  value,
  hasDeadline,
  content,
  disabled,
  onApply,
  onClear,
}: DeadlineFieldProps) {
  const popId = useId();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<string | null>(value);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const [from, to] = dayRange(content.today);
  const past = !!day && day < content.today;
  const noMail =
    !!day &&
    !past &&
    ((day === content.today && content.nowMinutes >= EIGHT_AM) || day < content.startDate);

  return (
    <span className="cls-dl" ref={wrap}>
      {caption && <span className="small">{caption}</span>}
      <button
        ref={trigger}
        type="button"
        className={`cls-dl__field ${value ? '' : 'is-empty'}`}
        aria-label={`${label}: ${value ? formatDay(value) : 'chưa đặt'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        disabled={disabled}
        onClick={() => {
          setDay(value);
          setOpen((o) => !o);
        }}
      >
        {value ? formatDay(value) : M.setDeadline}
      </button>
      {open && (
        <div
          id={popId}
          role="dialog"
          aria-label={label}
          className="cls-dl__pop"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              close();
            }
          }}
        >
          <Calendar
            selected={day ? vnDayStart(day) : null}
            today={vnDayStart(content.today)}
            min={vnDayStart(from)}
            max={vnDayStart(to)}
            autoFocus
            onSelect={(d) => setDay(vnDay(d))}
          />
          <p className="cls-dl__line" aria-live="polite">
            {day ? deadlineLine(day) : M.pickDeadline}
          </p>
          {past && (
            <p className="cls-dl__warn" role="alert">
              {M.pastDeadlineWarning}
            </p>
          )}
          {noMail && (
            <p className="cls-dl__warn" role="alert">
              {M.noReminderWarning}
            </p>
          )}
          {hasDeadline && (
            <p className="cls-dl__note" role="note">
              {M.clearDeadlineWarning}
            </p>
          )}
          <div className="cls-dl__foot">
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => void run(onClear)}>
              Xóa
            </Button>
            <span className="grow" />
            <Button
              size="sm"
              loading={busy}
              disabled={!day}
              onClick={() => day && void run(() => onApply(day))}
            >
              Áp dụng
            </Button>
          </div>
        </div>
      )}
    </span>
  );
}
