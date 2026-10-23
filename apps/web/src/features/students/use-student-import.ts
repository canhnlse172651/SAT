import {
  ACCOUNT_ERROR_CODES,
  ACCOUNT_MESSAGES as M,
  IMPORT_MAX_BYTES,
  type ImportReport,
  type ImportResult,
  importReportSchema,
} from '@sat/shared';
import { useState } from 'react';
import { ApiError } from '../../lib/api-client';
import { NETWORK_ERROR } from '../auth/form-errors';
import { useStudentsStore } from './students-store';

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

export interface StudentImport {
  busy: 'checking' | 'importing' | null;
  fileName: string | null;
  report: ImportReport | null;
  result: ImportResult | null;
  error: string | null;
  warning: string | null;
  pick: (file: File | undefined) => Promise<void>;
  confirm: () => Promise<boolean>;
  clearFile: () => void;
}

/** T12 "Import Excel": check a file (REQ-9), then confirm its valid rows (REQ-10). */
export function useStudentImport(): StudentImport {
  const checkImport = useStudentsStore((s) => s.checkImport);
  const confirmImport = useStudentsStore((s) => s.confirmImport);
  const [busy, setBusy] = useState<StudentImport['busy']>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const clearFile = () => {
    setFileName(null);
    setReport(null);
    setResult(null);
    setError(null);
    setWarning(null);
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    clearFile();
    setFileName(file.name);
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
    if (!report || !report.validCount) return false;
    setBusy('importing');
    setWarning(null);
    try {
      setResult(await confirmImport(report.importId));
      return true;
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
      return false;
    } finally {
      setBusy(null);
    }
  };

  return { busy, fileName, report, result, error, warning, pick, confirm, clearFile };
}
