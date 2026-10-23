import { ToastViewport } from '../../components';
import { useToastStore } from './toast-store';

/** Connects the toast store to the UI kit's viewport; mounted once in the root layout. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return <ToastViewport toasts={toasts} onDismiss={dismiss} />;
}
