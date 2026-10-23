import type { Role } from '@sat/shared';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components';
import { useSessionStore } from '../../features/session/session-store';
import { ApiError, apiRequest } from '../../lib/api-client';
import { homePath } from '../../lib/home-path';
import { useDocumentTitle } from '../../lib/use-document-title';

/**
 * Development only (registered when import.meta.env.DEV): signs in as the seeded GV or an HV through
 * POST /api/dev/session until module 001 provides the real sign-in on A01.
 */
export function DevLoginPage() {
  useDocumentTitle('Đăng nhập nhanh (dev)');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const load = useSessionStore((s) => s.load);
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (role: Role) => {
    setBusy(role);
    setError(null);
    try {
      await apiRequest('/dev/session', { method: 'POST', body: JSON.stringify({ role }) });
      await load();
      navigate(params.get('returnTo') ?? homePath(role), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? 'Chưa có dữ liệu mẫu. Chạy "npm run dev:seed" rồi thử lại.'
          : `Không đăng nhập được: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="placeholder">
      <h1>Đăng nhập nhanh (dev)</h1>
      <p>
        Chỉ có khi chạy dev. Dùng tài khoản mẫu cho tới khi module 001 làm màn hình đăng nhập thật.
      </p>
      <p>
        <Button onClick={() => void signIn('GV')} loading={busy === 'GV'}>
          Vào vai Giáo viên (Cô Lan)
        </Button>{' '}
        <Button variant="outline" onClick={() => void signIn('HV')} loading={busy === 'HV'}>
          Vào vai Học viên
        </Button>
      </p>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
