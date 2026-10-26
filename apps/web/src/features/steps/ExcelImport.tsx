import {
  type ImportPreview,
  type ImportRow,
  STEP_LIMITS,
  STEP_MESSAGES as SM,
  excelAdded,
  excelCapacity,
  importPreviewSchema,
} from '@sat/shared';
import { useRef, useState } from 'react';
import { Button, Icon } from '../../components';
import { ApiError, apiRequest } from '../../lib/api-client';
import { useToastStore } from '../toast/toast-store';
import { TEMPLATE_URL, entryKey } from './step-dom';

/** "Tải file mẫu" (AC-12.1). */
export function TemplateLink() {
  return (
    <a className="btn btn--ghost btn--sm" href={TEMPLATE_URL} download="mau-tu-vung.xlsx">
      <Icon name="download" size={15} />
      Tải file mẫu
    </a>
  );
}

/**
 * AC-12.2 – AC-12.6: an .xlsx of the template, previewed (valid rows, errors per Excel row, duplicates skipped) before
 * the valid rows are added to the end of the deck or vocabulary block. Nothing is saved until the step is.
 */
export function ExcelImport({
  existing,
  current,
  capacity,
  onAdd,
}: {
  /** Keys (`entryKey`) of the entries already in the deck / block. */
  existing: ReadonlySet<string>;
  current: number;
  capacity: number;
  onAdd: (rows: ImportRow[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const push = useToastStore((s) => s.push);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const read = async (file: File) => {
    setPreview(null);
    if (!/\.xlsx$/i.test(file.name) || file.size > STEP_LIMITS.excelMaxBytes) {
      setError(SM.excelInvalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const raw = await apiRequest<unknown>('/steps/import', {
        method: 'POST',
        body: file,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      const parsed = importPreviewSchema.parse(raw);
      // Duplicates of entries already in the deck / block (the file's own duplicates come from the API).
      const rows: ImportRow[] = [];
      const duplicates = [...parsed.duplicates];
      for (const r of parsed.rows) {
        if (existing.has(entryKey(r.hanzi, r.pinyin)))
          duplicates.push({ line: r.line, hanzi: r.hanzi, pinyin: r.pinyin });
        else rows.push(r);
      }
      duplicates.sort((a, b) => a.line - b.line);
      setPreview({ rows, errors: parsed.errors, duplicates });
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : SM.excelInvalid);
    } finally {
      setBusy(false);
    }
  };

  const add = () => {
    if (!preview) return;
    const n = preview.rows.length;
    if (current + n > capacity) {
      setError(excelCapacity(Math.max(0, capacity - current), n));
      return;
    }
    onAdd(preview.rows);
    push(excelAdded(n), 'success');
    setPreview(null);
  };

  return (
    <div className="st-import">
      <input
        ref={input}
        type="file"
        hidden
        accept=".xlsx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void read(file);
        }}
      />
      <div className="st-inline">
        <Button size="sm" variant="ghost" loading={busy} onClick={() => input.current?.click()}>
          <Icon name="upload" size={15} />
          Nhập từ Excel
        </Button>
        <TemplateLink />
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <section className="st-import__preview" aria-label="Xem trước dữ liệu nhập">
          <p className="strong">
            {preview.rows.length} dòng hợp lệ · {preview.errors.length} dòng lỗi ·{' '}
            {preview.duplicates.length} dòng trùng
          </p>
          {preview.errors.length > 0 && (
            <ul className="st-import__list">
              {preview.errors.map((e) => (
                <li key={`e${e.line}`}>
                  Dòng {e.line}: {e.reason}
                </li>
              ))}
            </ul>
          )}
          {preview.duplicates.length > 0 && (
            <ul className="st-import__list muted">
              {preview.duplicates.map((d) => (
                <li key={`d${d.line}`}>
                  Dòng {d.line}: {d.hanzi} {d.pinyin} — trùng, bỏ qua
                </li>
              ))}
            </ul>
          )}
          <div className="st-inline">
            {preview.rows.length ? (
              <Button size="sm" onClick={add}>
                Thêm {preview.rows.length} từ hợp lệ
              </Button>
            ) : (
              <span className="small">{SM.excelNoValid}</span>
            )}
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
              Hủy
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
