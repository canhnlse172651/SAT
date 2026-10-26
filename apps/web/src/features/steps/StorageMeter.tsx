import { storageUsedLabel, storageWarning } from '@sat/shared';
import { useStepEditorStore } from './step-editor-store';

/** AC-5.5, AC-5.7: "Đã dùng {x} GB / 10 GB" and, from 80 %, the warning next to it (T07 bar and T08). */
export function StorageMeter() {
  const storage = useStepEditorStore((s) => s.info?.storage);
  if (!storage) return null;
  const warning = storageWarning(storage.usedBytes);
  return (
    <span className="st-storage">
      <span className="small muted">{storageUsedLabel(storage.usedBytes)}</span>
      {warning && (
        <span className="chip chip--pending" role="status">
          {warning}
        </span>
      )}
    </span>
  );
}
