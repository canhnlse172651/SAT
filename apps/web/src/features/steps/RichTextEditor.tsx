import { TEXT_COLORS, formatNumber, richTextLength, sanitizeRichText } from '@sat/shared';
import { type ClipboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Button, Icon } from '../../components';

export interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  /** Max characters of text (20 000 for the text block, 5 000 for a grammar explanation). */
  max: number;
  error?: string | undefined;
  minRows?: number;
}

/** Runs a formatting command on the current selection (execCommand is the only cross-browser rich-text primitive). */
const exec = (command: string, value?: string) => {
  document.execCommand('styleWithCSS', false, 'true');
  document.execCommand(command, false, value);
};

/**
 * Text with the allowed formats of AC-3.5 (bold, italic, underline, two heading levels, bullet / numbered lists, 8
 * colours, http(s) links). Pasted content keeps only these (AC-3.7); every change is sanitised before it is stored.
 */
export function RichTextEditor({
  label,
  value,
  onChange,
  max,
  error,
  minRows = 3,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('https://');
  const [linkError, setLinkError] = useState<string | null>(null);
  const saved = useRef<Range | null>(null);

  // The DOM is the editor's own state while it has focus; outside changes (reload, overwrite) are written in.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && sanitizeRichText(el.innerHTML) !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (el) onChange(sanitizeRichText(el.innerHTML));
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    exec(command, arg);
    emit();
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    const clean = html
      ? sanitizeRichText(html)
      : sanitizeRichText(text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>'));
    document.execCommand('insertHTML', false, clean);
    emit();
  };

  const rememberSelection = () => {
    const sel = window.getSelection();
    saved.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setLinkError('Liên kết phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    ref.current?.focus();
    const sel = window.getSelection();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
    if (sel && sel.isCollapsed)
      document.execCommand('insertHTML', false, `<a href="${url}">${url}</a>`);
    else exec('createLink', url);
    emit();
    setLinkOpen(false);
    setLinkError(null);
    setLink('https://');
  };

  const length = richTextLength(value);
  const tool = (name: string, command: string, arg: string | undefined, content: string) => (
    <button
      type="button"
      className="st-rte__btn"
      aria-label={name}
      title={name}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => run(command, arg)}
    >
      {content}
    </button>
  );

  return (
    <div className="field">
      <div className="field__head">
        <span className="field__label" id={`${id}-label`}>
          {label}
        </span>
        <span className={length > max ? 'small st-over' : 'small muted'}>
          {formatNumber(length)}/{formatNumber(max)}
        </span>
      </div>
      <div className="st-rte" role="group" aria-labelledby={`${id}-label`}>
        <div className="st-rte__bar" role="toolbar" aria-label={`Định dạng ${label.toLowerCase()}`}>
          {tool('Đậm', 'bold', undefined, 'B')}
          {tool('Nghiêng', 'italic', undefined, 'I')}
          {tool('Gạch chân', 'underline', undefined, 'U')}
          {tool('Tiêu đề 1', 'formatBlock', 'H3', 'H1')}
          {tool('Tiêu đề 2', 'formatBlock', 'H4', 'H2')}
          {tool('Đoạn thường', 'formatBlock', 'P', '¶')}
          {tool('Danh sách gạch đầu dòng', 'insertUnorderedList', undefined, '•')}
          {tool('Danh sách đánh số', 'insertOrderedList', undefined, '1.')}
          <span className="st-rte__colors" role="group" aria-label="Màu chữ">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className="st-rte__color"
                aria-label={`Màu chữ: ${c.name}`}
                title={c.name}
                style={{ background: c.value }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run('foreColor', c.value)}
              />
            ))}
          </span>
          <button
            type="button"
            className="st-rte__btn"
            aria-label="Chèn liên kết"
            aria-expanded={linkOpen}
            onMouseDown={(e) => {
              e.preventDefault();
              rememberSelection();
            }}
            onClick={() => setLinkOpen((v) => !v)}
          >
            <Icon name="fwd" size={14} />
          </button>
        </div>
        {linkOpen && (
          <div className="st-rte__link">
            <input
              className="input"
              aria-label="Địa chỉ liên kết"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
            <Button size="sm" variant="outline" onClick={addLink}>
              Chèn
            </Button>
            {linkError && <span className="field__error">{linkError}</span>}
          </div>
        )}
        <div
          ref={ref}
          className="st-rte__area st-richtext"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          aria-invalid={error ? true : undefined}
          style={{ minHeight: `${minRows * 1.6}em` }}
          onInput={emit}
          onBlur={emit}
          onPaste={onPaste}
        />
      </div>
      {error && (
        <p className="field__error">
          <Icon name="alert" size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
