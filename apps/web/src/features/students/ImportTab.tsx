import {
  ACCOUNT_ERROR_CODES,
  ACCOUNT_MESSAGES as M,
  IMPORT_MAX_BYTES,
  type ImportReport,
  type ImportResult,
  importReportSchema,
} from '@sat/shared';
import { type ChangeEvent, useId, useState } from 'react';
import { Avatar, Button } from '../../components';
import { ApiError } from '../../lib/api-client';
import { NETWORK_ERROR } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { useStudentsStore } from './students-store';
import { StudentStatusChip } from './StudentFields';
import './students.css';

/** The report that came with a 400/409 of the confirmation (AC-10.4, AC-10.5). */
const reportOf = (err: unknown): ImportReport | null => {
  if (!(err instanceof ApiError)) return null;
  const parsed = importReportSchema.safeParse(
    (err.details as { report?: unknown } | undefined)?.report,
  );
  return parsed.success ? parsed.data : null;
};

const errorMessage = (err: unknown) =>
  err instanceof ApiError
    ? err.status === 413
      ? M.invalidImportFile
      : err.status >= 500
        ? NETWORK_ERROR
        : err.message
    : NETWORK_ERROR;

/** T12 tab "Import Excel": template, file check report, confirmation (REQ-9, REQ-10). */
export function ImportTab({ onAdded }: { onAdded: () => void }) {
  const inputId = useId();
  const checkImport = useStudentsStore((s) => s.checkImport);
  const confirmImport = useStudentsStore((s) => s.confirmImport);
  const [busy, setBusy] = useState<'checking' | 'importing' | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileName(file.name);
    setReport(null);
    setResult(null);
    setWarning(null);
    setError(null);
    if (file.size > IMPORT_MAX_BYTES || !file.size) {
      setError(M.invalidImportFile);
      return;
    }
    setBusy('checking');
    try {
      setReport(await checkImport(file));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const confirm = async () => {
    if (!report) return;
    setBusy('importing');
    setWarning(null);
    try {
      setResult(await confirmImport(report.importId));
      onAdded();
    } catch (err) {
      const updated = reportOf(err);
      if (updated) {
        setReport(updated);
        setWarning(
          err instanceof ApiError && err.code === ACCOUNT_ERROR_CODES.IMPORT_CHANGED
            ? err.message
            : null,
        );
      } else setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (result) {
    return (
      <div>
        <Notice tone="success">
          Đã thêm {result.added.length} học viên ở trạng thái Chưa kích hoạt. {M.activationHint}
        </Notice>
        <ul className="added-list" aria-label="Học viên vừa thêm">
          {result.added.map((s) => (
            <li key={s.id}>
              <Avatar name={s.displayName} size="sm" />
              <span className="added-list__who">
                <b>{s.displayName}</b> <span className="students__muted">{s.email}</span>
              </span>
              <StudentStatusChip status="pending" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <div className="import__pick">
        <a className="btn btn--outline" href="/api/students/import-template" download>
          Tải tệp mẫu
        </a>
        <label htmlFor={inputId} className="btn btn--primary">
          Chọn tệp Excel
        </label>
        <input
          id={inputId}
          type="file"
          className="sr-only"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => void pick(e)}
        />
        <span className="students__muted">
          {fileName ?? 'Chỉ chấp nhận tệp Excel (.xlsx) tối đa 2 MB · tối đa 500 dòng'}
        </span>
      </div>
      <p className="student-form__help">
        Trang đầu: Họ tên, Email, Số điện thoại, Ghi chú; trang “Hướng dẫn” mô tả quy tắc từng cột.
        Học viên được thêm ở trạng thái Chưa kích hoạt.
      </p>
      {busy === 'checking' && <p role="status">Đang kiểm tra tệp…</p>}
      {error && <Notice tone="danger">{error}</Notice>}
      {report && (
        <section className="import__report" aria-label="Báo cáo kiểm tra">
          {warning && <Notice tone="warn">{warning}</Notice>}
          <p className="import__summary">
            <span>Tổng số dòng: {report.total}</span>
            <span>Hợp lệ: {report.validCount}</span>
            <span>Lỗi: {report.errorCount}</span>
          </p>
          {report.errors.length > 0 && (
            <table className="import__errors">
              <caption className="sr-only">Các dòng lỗi</caption>
              <thead>
                <tr>
                  <th scope="col">Dòng</th>
                  <th scope="col">Họ tên</th>
                  <th scope="col">Email</th>
                  <th scope="col">Lý do</th>
                </tr>
              </thead>
              <tbody>
                {report.errors.map((r) => (
                  <tr key={r.line}>
                    <td className="num">{r.line}</td>
                    <td>{r.displayName || '—'}</td>
                    <td>{r.email || '—'}</td>
                    <td>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {report.validCount === 0 && <Notice tone="warn">{M.importNothingValid}</Notice>}
          <p>
            <Button
              disabled={report.validCount === 0}
              loading={busy === 'importing'}
              onClick={() => void confirm()}
            >
              Nhập {report.validCount} học viên hợp lệ
            </Button>
          </p>
        </section>
      )}
    </div>
  );
}
