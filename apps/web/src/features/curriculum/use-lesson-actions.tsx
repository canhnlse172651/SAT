import { type AiLabel, CURRICULUM_MESSAGES as M, type Lesson } from '@sat/shared';
import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from '../../components';
import { useToastStore } from '../toast/toast-store';
import { useCurriculumStore } from './curriculum-store';
import { hasCode, isConflict, messageOf } from './errors';
import { LessonNameDialog } from './LessonNameDialog';
import { PublishLessonDialog } from './PublishLessonDialog';
import { curriculumPath, lessonPath } from './paths';

/** What T06 rows and the T18 header know about a Bài. */
export interface LessonRef {
  id: string;
  name: string;
  version: number;
  status: 'draft' | 'published';
  stepCount: number;
  setCount: number;
  hasLearningData: boolean;
  ai: AiLabel | null;
}

export const lessonRefOf = (l: Lesson): LessonRef => ({
  id: l.id,
  name: l.name,
  version: l.version,
  status: l.status,
  stepCount: l.items.filter((i) => i.section === 'lesson').length,
  setCount: l.items.filter((i) => i.section === 'exercise').length,
  hasLearningData: l.hasLearningData,
  ai: l.ai,
});

export interface LessonActions {
  rename: (l: LessonRef) => void;
  publish: (lessonId: string) => void;
  duplicate: (l: LessonRef) => void;
  remove: (l: LessonRef) => void;
  /** Ids of Bài being duplicated ("Đang nhân bản…", AC-15.6). */
  duplicating: readonly string[];
  dialogs: ReactNode;
}

/**
 * Rename (AC-5.4), publish (AC-9.3 … AC-9.5), duplicate (REQ-14) and delete (AC-12.4 … AC-12.7) of a Bài, shared by
 * T06 and T18. `refresh` reloads whatever the screen shows after a change or a conflict.
 */
export function useLessonActions(opts: {
  curriculumId: string;
  usedBy: number;
  refresh: () => void;
  /** After a delete: T18 goes back to T06; T06 just refreshes. */
  leaveAfterDelete?: boolean;
}): LessonActions {
  const { curriculumId, usedBy, refresh, leaveAfterDelete } = opts;
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const renameLesson = useCurriculumStore((s) => s.renameLesson);
  const publishLesson = useCurriculumStore((s) => s.publishLesson);
  const duplicateLesson = useCurriculumStore((s) => s.duplicateLesson);
  const removeLesson = useCurriculumStore((s) => s.removeLesson);
  const fetchLesson = useCurriculumStore((s) => s.fetchLesson);

  const [renaming, setRenaming] = useState<LessonRef | null>(null);
  const [publishing, setPublishing] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState<LessonRef | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState<string[]>([]);

  const fail = (err: unknown) => {
    if (isConflict(err)) {
      push(M.changedElsewhere, 'warn');
      refresh();
    } else {
      push(messageOf(err), 'error');
    }
  };

  const rename = (l: LessonRef) => setRenaming(l);
  const publish = (lessonId: string) => {
    fetchLesson(lessonId).then(setPublishing, fail);
  };
  const duplicate = (l: LessonRef) => {
    if (duplicating.includes(l.id)) return;
    setDuplicating((d) => [...d, l.id]);
    push(M.duplicating, 'info');
    duplicateLesson(l.id)
      .then(
        (copy) => {
          push(M.lessonDuplicated, 'success');
          navigate(lessonPath(curriculumId, copy.id));
        },
        (err: unknown) => {
          fail(err);
          refresh();
        },
      )
      .finally(() => setDuplicating((d) => d.filter((x) => x !== l.id)));
  };
  const remove = (l: LessonRef) => {
    if (l.hasLearningData) setBlocked(M.lessonHasData);
    else setDeleting(l);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await removeLesson(deleting.id);
      push(M.lessonDeleted, 'success');
      setDeleting(null);
      if (leaveAfterDelete) navigate(curriculumPath(curriculumId), { replace: true });
      else refresh();
    } catch (err) {
      setDeleting(null);
      // AC-12.6: learning data that appeared after the dialog opened still blocks.
      if (hasCode(err, 'HAS_LEARNING_DATA')) setBlocked(messageOf(err));
      else fail(err);
    } finally {
      setBusy(false);
    }
  };

  const deleteMessage = deleting && (
    <>
      Sẽ xóa {deleting.stepCount} bước học, {deleting.setCount} bộ bài tập. Thao tác không thể hoàn
      tác.
      {deleting.status === 'published' && usedBy > 0 && (
        <>
          <br />
          Bài đang hiển thị với học viên của {usedBy} lớp.
        </>
      )}
      {deleting.ai && (
        <>
          <br />
          {M.lessonAiWarning}
        </>
      )}
    </>
  );

  const dialogs = (
    <>
      <LessonNameDialog
        open={!!renaming}
        mode="rename"
        initialName={renaming?.name ?? ''}
        onClose={() => setRenaming(null)}
        onSubmit={async (name) => {
          if (!renaming) return;
          try {
            await renameLesson(renaming.id, renaming.version, name);
            push(M.lessonRenamed, 'success');
            setRenaming(null);
            refresh();
          } catch (err) {
            if (!isConflict(err)) {
              setRenaming(null);
              fail(err);
              return;
            }
            // AC-17.4: keep what the GV typed; the next "Lưu" applies on top of the latest data.
            fail(err);
            const current = renaming;
            fetchLesson(current.id).then(
              (fresh) => setRenaming({ ...current, version: fresh.version }),
              () => setRenaming(null),
            );
            return;
          }
        }}
      />
      <PublishLessonDialog
        lesson={publishing}
        open={!!publishing}
        onClose={() => setPublishing(null)}
        onConfirm={async (itemIds) => {
          if (!publishing) return;
          try {
            await publishLesson(publishing.id, publishing.version, itemIds);
            push(M.lessonPublished, 'success');
            setPublishing(null);
            refresh();
          } catch (err) {
            setPublishing(null);
            fail(err);
          }
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title={`Xóa bài “${deleting?.name ?? ''}”?`}
        message={deleteMessage}
        confirmLabel="Xóa bài"
        tone="danger"
        loading={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
      <ConfirmDialog
        open={!!blocked}
        title="Không thể xóa bài"
        message={blocked}
        confirmLabel="Đã hiểu"
        cancelLabel="Đóng"
        onConfirm={() => setBlocked(null)}
        onCancel={() => setBlocked(null)}
      />
    </>
  );

  return { rename, publish, duplicate, remove, duplicating, dialogs };
}
