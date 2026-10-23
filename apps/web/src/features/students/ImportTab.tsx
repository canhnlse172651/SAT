import { ACCOUNT_MESSAGES as M } from '@sat/shared';
import { type DragEvent, useId, useRef } from 'react';
import { Button, Icon } from '../../components';
import { Notice } from '../auth/Notice';
import { AddedList } from './AddedList';
import type { StudentImport } from './use-student-import';
import './students.css';

/** T12 tab "Import Excel" (prototype `importBody`): template, file, check report, result. */
export function ImportTab({ state }: { state: StudentImport }) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const { busy, fileName, report, result, error, warning, pick, clearFile } = state;

  if (result) {
    return (
      <div>
        <Notice tone="success">
          Đã thêm <b>{result.added.length}</b> học viên ở trạng thái Chưa kích hoạt.{' '}
          {M.activationHint}
        </Notice>
        <AddedList students={result.added} />
      </div>
    );
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    void pick(e.dataTransfer.files[0]);
  };
  const fileInput = (
    <input
      ref={input}
      id={inputId}
      type="file"
      className="sr-only"
      aria-label="Chọn tệp Excel"
      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        void pick(file);
      }}
    />
  );

  if (!report) {
    return (
      <ol className="imp-steps">
        <li>
          <span className="q-no">1</span>
          <div className="imp-step">
            <div className="imp-step__title">Tải tệp mẫu</div>
            <div className="imp-muted">
              Trang đầu: Họ tên, Email, Số điện thoại, Ghi chú; trang “Hướng dẫn” mô tả quy tắc từng
              cột.
            </div>
            <a
              className="btn btn--outline btn--sm imp-step__btn"
              href="/api/students/import-template"
              download="mau-hoc-vien.xlsx"
            >
              <Icon name="download" size={16} />
              mau-hoc-vien.xlsx
            </a>
          </div>
        </li>
        <li>
          <span className="q-no">2</span>
          <div className="imp-step">
            <div className="imp-step__title">Chọn tệp đã điền</div>
            <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
              <Icon name="upload" size={28} />
              <div>
                <b>Kéo thả tệp .xlsx vào đây</b> hoặc
              </div>
              <Button
                size="sm"
                loading={busy === 'checking'}
                onClick={() => input.current?.click()}
              >
                Chọn tệp
              </Button>
              {fileInput}
              <div className="imp-help">
                Chỉ chấp nhận tệp Excel (.xlsx) tối đa 2 MB · tối đa 500 dòng
              </div>
            </div>
            {fileName && busy === 'checking' && (
              <p role="status" className="imp-muted">
                Đang kiểm tra {fileName}…
              </p>
            )}
            {error && (
              <Notice tone="danger" className="imp-error">
                {error}
              </Notice>
            )}
          </div>
        </li>
      </ol>
    );
  }

  return (
    <section aria-label="Báo cáo kiểm tra">
      <div className="file-row">
        <span className="file-ic">XLSX</span>
        <div className="file-row__main">
          <div className="file-row__name">{fileName}</div>
          <div className="imp-muted">{report.total} dòng dữ liệu · đã kiểm tra</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            clearFile();
            input.current?.click();
          }}
        >
          Chọn tệp khác
        </Button>
        {fileInput}
      </div>
      {warning && (
        <Notice tone="warn" className="imp-error">
          {warning}
        </Notice>
      )}
      <div className="imp-chips">
        <span className="chip chip--done">
          <Icon name="check" size={14} />
          {report.validCount} dòng hợp lệ
        </span>
        <span className="chip chip--danger">
          <Icon name="alert" size={14} />
          {report.errorCount} dòng lỗi
        </span>
        <span className="imp-muted">Tổng số dòng: {report.total}</span>
      </div>
      {report.validCount === 0 && (
        <Notice tone="warn" className="imp-error">
          {M.importNothingValid}
        </Notice>
      )}
      <div className="imp-table">
        <table className="tbl tbl--compact">
          <caption className="sr-only">Kết quả kiểm tra từng dòng</caption>
          <thead>
            <tr>
              <th scope="col">Dòng</th>
              <th scope="col">Họ tên</th>
              <th scope="col">Email</th>
              <th scope="col">Số điện thoại</th>
              <th scope="col">Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.line} className={r.reason ? 'is-err' : undefined}>
                <td className="num imp-muted">{r.line}</td>
                <td>{r.displayName || <span className="imp-empty">(trống)</span>}</td>
                <td>{r.email || <span className="imp-empty">(trống)</span>}</td>
                <td>{r.phone || <span className="imp-empty">(trống)</span>}</td>
                <td>
                  {r.reason ? (
                    <span className="err-msg">
                      <Icon name="alert" size={14} />
                      {r.reason}
                    </span>
                  ) : (
                    <span className="chip chip--done">Hợp lệ</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <Notice tone="danger" className="imp-error">
          {error}
        </Notice>
      )}
    </section>
  );
}
