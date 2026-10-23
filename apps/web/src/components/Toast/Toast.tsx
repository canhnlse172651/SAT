import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from '../icons';
import './Toast.css';

export type ToastKind = 'success' | 'warn' | 'error' | 'info';

export interface ToastData {
  id: string;
  kind: ToastKind;
  message: string;
}

export interface ToastProps {
  kind: ToastKind;
  message: string;
  onDismiss?: () => void;
}

const ICONS = { success: CheckIcon, warn: AlertIcon, error: AlertIcon, info: InfoIcon };

/** Presentational: timing and queueing belong to the toast store. */
export function Toast({ kind, message, onDismiss }: ToastProps) {
  const Icon = ICONS[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`toast toast--${kind}`}>
      <Icon className="toast__icon" />
      <span className="toast__msg">{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="toast__close"
          aria-label="Đóng thông báo"
          onClick={onDismiss}
        >
          <CloseIcon width={16} height={16} />
        </button>
      )}
    </div>
  );
}

export interface ToastViewportProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

/** Bottom-centre stack; the region stays mounted so screen readers announce new toasts. */
export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <section className="toast-viewport" aria-label="Thông báo">
      {toasts.map((t) => (
        <Toast key={t.id} kind={t.kind} message={t.message} onDismiss={() => onDismiss(t.id)} />
      ))}
    </section>
  );
}
