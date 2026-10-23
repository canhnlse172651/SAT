import {
  CLASS_MESSAGES as M,
  type ClassDetail,
  type CurriculumOption,
  changeCurriculumConfirm,
} from '@sat/shared';
import { useState } from 'react';
import { Button, ConfirmDialog, Dialog } from '../../components';
import { useToastStore } from '../toast/toast-store';
import { useClassesStore } from './classes-store';
import { CurriculumPicker } from './CurriculumPicker';
import { messageOf } from './errors';

/** "Đổi giáo trình" (AC-9.1, AC-9.2, AC-9.4): same list as T03 step 3, then a confirmation. */
export function ChangeCurriculumDialog({
  detail,
  onClose,
}: {
  detail: ClassDetail;
  onClose: () => void;
}) {
  const push = useToastStore((s) => s.push);
  const changeCurriculum = useClassesStore((s) => s.changeCurriculum);
  const loadDetail = useClassesStore((s) => s.loadDetail);
  const [choice, setChoice] = useState<CurriculumOption | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const changed = !!choice && choice.id !== detail.curriculum.id;

  const apply = async () => {
    if (!choice || busy) return;
    setBusy(true);
    try {
      await changeCurriculum(detail.id, choice.id);
      push(M.curriculumChanged, 'success');
      onClose();
    } catch (err) {
      push(messageOf(err), 'error');
      setConfirming(false);
      onClose();
      void loadDetail(detail.id).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog
        open={!confirming}
        onClose={onClose}
        title="Đổi giáo trình"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button disabled={!changed} onClick={() => setConfirming(true)}>
              Đổi giáo trình
            </Button>
          </>
        }
      >
        <CurriculumPicker value={choice} onChange={setChoice} currentId={detail.curriculum.id} />
      </Dialog>
      <ConfirmDialog
        open={confirming && !!choice}
        title="Đổi giáo trình"
        message={choice ? changeCurriculumConfirm(detail.name, choice.name) : ''}
        confirmLabel="Đổi giáo trình"
        loading={busy}
        onConfirm={() => void apply()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
