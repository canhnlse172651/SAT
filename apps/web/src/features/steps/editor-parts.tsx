import { convertPinyin } from '@sat/shared';
import { type InputHTMLAttributes, useId } from 'react';
import type { useDragList } from './use-drag-list';
import { Button, Icon, IconButton } from '../../components';
import { cx } from '../../components/cx';

export interface CellProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Message under the control (AC-4.4, AC-11.4). */
  error?: string | undefined;
  /** Shows the label above the control (forms); compact rows only use it as the accessible name. */
  visibleLabel?: boolean;
  /** `zh` = Hanzi field (lang + font). */
  lang?: 'zh';
  multiline?: boolean;
}

/** One input of a block editor, with its message right under it. */
export function Cell({
  label,
  value,
  onChange,
  error,
  visibleLabel,
  lang,
  multiline,
  className,
  ...rest
}: CellProps) {
  const id = useId();
  const common = {
    id,
    'aria-label': visibleLabel ? undefined : label,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? `${id}-err` : undefined,
    lang: lang === 'zh' ? 'zh-Hans' : undefined,
    className: cx('input', lang === 'zh' && 'han--sans st-han-input', className),
    value,
  };
  return (
    <div className={cx('st-cell', error && 'st-cell--error')}>
      {visibleLabel && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          {...common}
          rows={2}
          maxLength={rest.maxLength}
          placeholder={rest.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input {...rest} {...common} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && (
        <p id={`${id}-err`} className="field__error st-cell__error">
          {error}
        </p>
      )}
    </div>
  );
}

/** AC-4.5: tone numbers become tone marks when the GV leaves the field ("ni3 hao3" → "nǐ hǎo"). */
export function PinyinCell(props: CellProps) {
  const { onChange, value } = props;
  return (
    <Cell
      {...props}
      onBlur={() => {
        const next = convertPinyin(value);
        if (next !== value) onChange(next);
      }}
    />
  );
}

export interface RowToolsProps {
  /** "từ", "dòng", "ví dụ", "thẻ", "khối" — used in the delete label ("Xóa từ 2"). */
  noun: string;
  index: number;
  count: number;
  grip: ReturnType<ReturnType<typeof useDragList>['grip']>;
  onMove: (to: number) => void;
  onDelete: () => void;
  /** Delete disabled (the last card / block). */
  keepLast?: boolean;
}

/** Grip, "Lên", "Xuống" and delete of one row. */
export function RowTools({ noun, index, count, grip, onMove, onDelete, keepLast }: RowToolsProps) {
  const n = index + 1;
  return (
    <span className="st-tools">
      <span {...grip} className="st-grip" title="Kéo để sắp xếp" aria-hidden="true">
        <Icon name="grip" size={16} />
      </span>
      <IconButton
        size="sm"
        aria-label={`Lên (${noun} ${n})`}
        icon={<Icon name="up" size={15} />}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
      />
      <IconButton
        size="sm"
        aria-label={`Xuống (${noun} ${n})`}
        icon={<Icon name="down" size={15} />}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
      />
      <IconButton
        size="sm"
        aria-label={`Xóa ${noun} ${n}`}
        icon={<Icon name="trash" size={15} />}
        disabled={keepLast && count <= 1}
        onClick={onDelete}
      />
    </span>
  );
}

/** "Thêm từ" / "Thêm dòng"… — disabled with the limit message when full. */
export function AddRow({
  label,
  full,
  fullMessage,
  onAdd,
}: {
  label: string;
  full: boolean;
  fullMessage: string;
  onAdd: () => void;
}) {
  const id = useId();
  return (
    <div className="st-addrow">
      <Button
        size="sm"
        variant="ghost"
        disabled={full}
        aria-describedby={full ? id : undefined}
        onClick={onAdd}
      >
        <Icon name="plus" size={15} />
        {label}
      </Button>
      {full && (
        <span id={id} className="small muted">
          {fullMessage}
        </span>
      )}
    </div>
  );
}
