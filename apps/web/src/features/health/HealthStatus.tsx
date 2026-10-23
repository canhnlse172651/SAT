import { useEffect } from 'react';
import { useHealthStore } from './health-store';

const LABEL = {
  idle: 'Not checked yet',
  loading: 'Checking API…',
  ok: 'API is healthy',
  error: 'API unavailable',
} as const;

export function HealthStatus() {
  const status = useHealthStore((s) => s.status);
  const error = useHealthStore((s) => s.error);
  const check = useHealthStore((s) => s.check);

  useEffect(() => {
    void check();
  }, [check]);

  return (
    <p role="status" data-status={status}>
      {LABEL[status]}
      {error ? `: ${error}` : null}
    </p>
  );
}
