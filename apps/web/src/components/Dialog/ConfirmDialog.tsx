import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` for destructive confirmations (initial focus lands on Cancel). */
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      role="alertdialog"
      size="sm"
      layout="confirm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
