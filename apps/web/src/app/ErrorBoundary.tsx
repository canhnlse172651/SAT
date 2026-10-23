import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ApiError } from '../lib/api-client';
import { NotFoundPage } from '../pages/NotFoundPage';

export function ErrorFallback({ error }: { error: unknown }) {
  // Another workspace's data and missing items look the same: A05.
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  return (
    <main role="alert" className="error-fallback">
      <h1>Đã xảy ra lỗi</h1>
      <p>Vui lòng thử lại. Nếu lỗi vẫn còn, hãy báo cho quản trị viên.</p>
      {requestId ? <p>Mã yêu cầu: {requestId}</p> : null}
      <button type="button" onClick={() => window.location.reload()}>
        Tải lại trang
      </button>
    </main>
  );
}

interface State {
  error: unknown;
  failed: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null, failed: false };

  static getDerivedStateFromError(error: unknown): State {
    return { error, failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render() {
    return this.state.failed ? <ErrorFallback error={this.state.error} /> : this.props.children;
  }
}
