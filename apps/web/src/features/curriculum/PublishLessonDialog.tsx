import {
  CURRICULUM_MESSAGES as M,
  type Item,
  type Lesson,
  SECTIONS,
  SECTION_TITLES,
  publishWarning,
} from '@sat/shared';
import { useState } from 'react';
import { Button, Checkbox, Dialog, Icon } from '../../components';
import { Notice } from '../auth/Notice';

export interface PublishLessonDialogProps {
  /** The Bài as saved (readiness is judged on saved content — AC-9.2). */
  lesson: Lesson | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (itemIds: string[]) => Promise<void>;
}

const titleOf = (i: Item) => i.title.trim() || '(chưa có tên)';

/** AC-9.3 … AC-9.5: ready drafts pre-checked, not-ready ones listed with their reason (prototype MODALS.pubBai). */
export function PublishLessonDialog(props: PublishLessonDialogProps) {
  // Mounted only while open: the ready drafts are pre-checked on every opening.
  return props.open && props.lesson ? <PublishForm {...props} lesson={props.lesson} /> : null;
}

function PublishForm({
  lesson,
  onClose,
  onConfirm,
}: PublishLessonDialogProps & { lesson: Lesson }) {
  const [picked, setPicked] = useState<string[]>(() =>
    lesson.items.filter((i) => i.status === 'draft' && !i.notReady).map((i) => i.id),
  );
  const [busy, setBusy] = useState(false);
  const drafts = lesson.items.filter((i) => i.status === 'draft');
  const canConfirm = lesson.items.some((i) => i.status === 'published') || picked.length > 0;

  const confirm = async () => {
    if (!canConfirm || busy) return;
    setBusy(true);
    try {
      await onConfirm(picked);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Xuất bản “${lesson.name}”`}
      size="lg"
      footer={
        <>
          {!canConfirm && <span className="field__hint cur-foot-hint">{M.needOneReady}</span>}
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button
            onClick={() => void confirm()}
            loading={busy}
            disabled={!canConfirm || busy}
            title={canConfirm ? undefined : M.needOneReady}
          >
            <Icon name="check" size={18} />
            Xuất bản bài
          </Button>
        </>
      }
    >
      <div className="cur-publish">
        {lesson.usedBy > 0 && <Notice tone="warn">{publishWarning(lesson.usedBy)}</Notice>}
        <p className="small muted">Mục Nháp sẵn sàng được chọn sẵn; mục chưa sẵn sàng giữ Nháp.</p>
        {SECTIONS.map((section) => {
          const list = drafts.filter((i) => i.section === section);
          if (!list.length) return null;
          return (
            <fieldset key={section} className="cur-publish__sec">
              <legend>{SECTION_TITLES[section]}</legend>
              {list.map((i) =>
                i.notReady ? (
                  <div key={i.id} className="cur-publish__blocked">
                    <Icon name="lock" size={14} />
                    <span className="grow">{titleOf(i)}</span>
                    <span className="field__error">{i.notReady}</span>
                  </div>
                ) : (
                  <Checkbox
                    key={i.id}
                    label={titleOf(i)}
                    checked={picked.includes(i.id)}
                    onChange={() =>
                      setPicked((p) =>
                        p.includes(i.id) ? p.filter((x) => x !== i.id) : [...p, i.id],
                      )
                    }
                  />
                ),
              )}
            </fieldset>
          );
        })}
        {!drafts.length && <p className="small muted">Không có mục Nháp nào.</p>}
      </div>
    </Dialog>
  );
}
