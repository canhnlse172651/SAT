import { Button } from '../Button/Button';
import { cx } from '../cx';
import './ErrorState.css';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  /** Server request id, shown so the user can quote it to support. */
  requestId?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Vui lòng thử lại sau ít phút.',
  requestId,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cx('error-state', className)}>
      <h3 className="error-state__title">{title}</h3>
      <p className="error-state__msg">{message}</p>
      {requestId && (
        <p className="error-state__id">
          Mã yêu cầu: <code>{requestId}</code>
        </p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
