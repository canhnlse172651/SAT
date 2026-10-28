import { EXERCISE_LIMITS as L, formatNumber } from '@sat/shared';
import { useId, useState } from 'react';
import { Button, Icon, IconButton, Textarea } from '../../components';
import { Cell, PinyinCell } from '../steps/editor-parts';
import { useSetEditing } from './set-editing';

/** A text field of a question, with its rule message once the GV left it (AC-2.6). */
export function QField({
  path,
  label,
  value,
  onChange,
  max,
  pinyin,
  zh,
  multiline,
  visibleLabel = true,
  placeholder,
  disabled,
}: {
  path: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  pinyin?: boolean;
  zh?: boolean;
  multiline?: boolean;
  visibleLabel?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { error } = useSetEditing();
  if (multiline)
    return (
      <Textarea
        label={label}
        value={value}
        rows={3}
        maxLength={max}
        placeholder={placeholder}
        disabled={disabled}
        error={error(path)}
        data-path={path}
        lang={zh ? 'zh-Hans' : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  const props = {
    label,
    value,
    onChange,
    maxLength: max,
    visibleLabel,
    placeholder,
    disabled,
    error: error(path),
    'data-path': path,
    ...(zh ? { lang: 'zh' as const } : {}),
  };
  return pinyin ? <PinyinCell {...props} /> : <Cell {...props} />;
}

const toText = (v: number) => (Number.isFinite(v) ? formatNumber(v, 1).replace(/,0$/, '') : '');
const parse = (s: string) => (s.trim() === '' ? Number.NaN : Number(s.replace(',', '.')));

/** "Điểm" (0,5–100, step 0,5 — AC-2.4); typed text is kept while it is not a number yet. */
export function PointsField({
  path,
  label = 'Điểm',
  value,
  onChange,
}: {
  path: string;
  label?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const { error, locked } = useSetEditing();
  const [text, setText] = useState(toText(value));
  // A value changed from outside (another edit, a reload) replaces the typed text.
  const [last, setLast] = useState(value);
  if (!Object.is(last, value)) {
    setLast(value);
    if (!Object.is(parse(text), value)) setText(toText(value));
  }
  return (
    <Cell
      className="ex-points"
      label={label}
      visibleLabel
      inputMode="decimal"
      value={text}
      disabled={locked}
      data-path={path}
      error={error(path)}
      onChange={(v) => {
        setText(v);
        onChange(parse(v));
      }}
    />
  );
}

/** Up / down / delete of a row inside a question (options, pairs, tiles, sub-questions). */
export function RowButtons({
  noun,
  index,
  count,
  min,
  onMove,
  onDelete,
  minReason,
}: {
  noun: string;
  index: number;
  count: number;
  min: number;
  onMove?: (to: number) => void;
  onDelete?: () => void;
  minReason?: string;
}) {
  const { locked } = useSetEditing();
  const atMin = count <= min;
  return (
    <span className="ex-row-tools">
      {onMove && (
        <>
          <IconButton
            size="sm"
            aria-label={`Lên trên ${noun}`}
            icon={<Icon name="up" size={14} />}
            disabled={locked || index === 0}
            onClick={() => onMove(index - 1)}
          />
          <IconButton
            size="sm"
            aria-label={`Xuống dưới ${noun}`}
            icon={<Icon name="down" size={14} />}
            disabled={locked || index === count - 1}
            onClick={() => onMove(index + 1)}
          />
        </>
      )}
      {onDelete && (
        <IconButton
          size="sm"
          aria-label={`Xóa ${noun}`}
          title={atMin ? minReason : undefined}
          icon={<Icon name="close" size={14} />}
          disabled={locked || atMin}
          onClick={onDelete}
        />
      )}
    </span>
  );
}

/**
 * "Thêm …" inside a question. Callers pass `locked` themselves for structural rows (AC-18.1); accepted answers stay
 * addable on a set with submissions. At the maximum the button is disabled and `fullReason` is shown (AC-4.1, AC-8.1).
 */
export function AddButton({
  label,
  onClick,
  disabled,
  full,
  fullReason,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  full?: boolean;
  fullReason?: string;
}) {
  const reasonId = useId();
  const showReason = !!full && !!fullReason;
  return (
    <span className="ex-add">
      <Button
        size="sm"
        variant="ghost"
        onClick={onClick}
        disabled={disabled || full}
        aria-describedby={showReason ? reasonId : undefined}
      >
        <Icon name="plus" size={15} />
        {label}
      </Button>
      {showReason && (
        <span id={reasonId} className="ex-add-reason">
          {fullReason}
        </span>
      )}
    </span>
  );
}

/** A labelled group of rows (options, blanks, pairs…). */
export function Rows({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="ex-rows" role="group" aria-labelledby={id}>
      <span id={id} className="field__label">
        {label}
      </span>
      {children}
    </div>
  );
}

export const LIMITS = L;
