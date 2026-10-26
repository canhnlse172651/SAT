import {
  CURRICULUM_MESSAGES as M,
  ITEM_NOUNS,
  type Item,
  SECTION_TITLES,
  type Section,
  formatVnTime,
  itemAddedMessage,
  itemMovedMessage,
  itemNotReadyReason,
  leaveQuestion,
  notReadyMessage,
  STEP_ERROR_CODES,
  STEP_MESSAGES as SM,
  deckMarksWarning,
  firstInvalidMessage,
  formatVnTime as hhmm,
  publishedNotice,
  sectionReplacedAt,
  stepIssues,
  stepVisibleWarning,
} from '@sat/shared';
import { ApiError } from '../../lib/api-client';
import { stepOf } from '../steps/step-content';
import { isUploading, useStepEditorStore } from '../steps/step-editor-store';
import { type StepNotice, StepNoticeView } from '../steps/StepNotices';
import { StorageMeter } from '../steps/StorageMeter';
import { useCallback, useEffect, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Icon,
  Skeleton,
  StatusChip,
  Switch,
  Tabs,
} from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { useToastStore } from '../toast/toast-store';
import { Crumbs } from './Crumbs';
import { useCurriculumStore } from './curriculum-store';
import { hasCode, isConflict, isNotFound, messageOf } from './errors';
import { ItemEditor } from './ItemEditor';
import { unsavedIds, useLessonEditorStore, workingItem } from './lesson-editor-store';
import { curriculaPath, curriculumPath, lessonPath } from './paths';
import { PublishLessonDialog } from './PublishLessonDialog';
import './curriculum.css';

const nowHm = () => formatVnTime(new Date());

/**
 * T07 "Soạn bài thủ công" (T09 = its Bài tập tab): header, tabs Bài học | Bài tập, immediate 002 actions, unsaved
 * edits kept across tabs and guarded when leaving (REQ-6, REQ-7, REQ-9, REQ-12, REQ-18). Edit-only, web layout.
 */
export function ManualEditorPage({ initialTab }: { initialTab: Section }) {
  const { curriculumId = '', lessonId = '' } = useParams();
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const status = useLessonEditorStore((s) => s.status);
  const lesson = useLessonEditorStore((s) => s.lesson);
  const drafts = useLessonEditorStore((s) => s.drafts);
  const showArchived = useLessonEditorStore((s) => s.showArchived);
  const load = useLessonEditorStore((s) => s.load);
  const edit = useLessonEditorStore((s) => s.edit);
  const discardAll = useLessonEditorStore((s) => s.discardAll);
  const setShowArchived = useLessonEditorStore((s) => s.setShowArchived);
  const addItem = useLessonEditorStore((s) => s.addItem);
  const move = useLessonEditorStore((s) => s.move);
  const save = useLessonEditorStore((s) => s.save);
  const publish = useLessonEditorStore((s) => s.publish);
  const setArchived = useLessonEditorStore((s) => s.setArchived);
  const remove = useLessonEditorStore((s) => s.remove);
  const publishLesson = useCurriculumStore((s) => s.publishLesson);
  const overwrite = useLessonEditorStore((s) => s.overwrite);
  const reloadItem = useLessonEditorStore((s) => s.reloadItem);
  const discardSection = useLessonEditorStore((s) => s.discardSection);
  const loadInfo = useStepEditorStore((s) => s.loadInfo);
  const info = useStepEditorStore((s) => s.info);
  const uploads = useStepEditorStore((s) => s.uploads);
  const cancelAll = useStepEditorStore((s) => s.cancelAll);
  const [notices, setNotices] = useState<Record<string, StepNotice>>({});

  const [tab, setTab] = useState<Section>(initialTab);
  const [missingId, setMissingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  useDocumentTitle('Soạn bài thủ công');

  const refresh = useCallback(() => {
    load(lessonId).catch((err: unknown) => {
      if (isNotFound(err)) setMissingId(lessonId);
    });
    void loadInfo(lessonId);
  }, [load, loadInfo, lessonId]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  const missing = missingId === lessonId;

  const unsaved = lesson?.id === lessonId ? unsavedIds({ drafts, lesson }) : [];
  const uploading = Object.values(uploads).some((u) => u.phase !== 'failed');

  // AC-7.13: leaving T07 with unsaved items asks first; switching tabs is not leaving.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (unsaved.length > 0 || uploading) && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!unsaved.length && !uploading) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [unsaved.length, uploading]);
  // Uploads belong to this screen: leaving it (or opening another Bài) cancels them (AC-2.2).
  useEffect(() => () => cancelAll(), [cancelAll, lessonId]);

  if (missing || (lesson && lesson.id === lessonId && lesson.curriculumId !== curriculumId)) {
    return <NotFoundPage />;
  }
  if (status === 'error' && !lesson) return <ErrorState title="Không tải được bài." />;
  if (!lesson || lesson.id !== lessonId) return <Skeleton height={320} />;

  const setNotice = (itemId: string, notice: StepNotice | null) =>
    setNotices((n) => {
      const next = { ...n };
      if (notice) next[itemId] = notice;
      else delete next[itemId];
      return next;
    });

  /** AC-19.5: the Bài học section was replaced by approved AI steps since this screen loaded it. */
  const replaced = (err: unknown): boolean => {
    if (!(err instanceof ApiError) || err.code !== STEP_ERROR_CODES.SECTION_REPLACED) return false;
    const at = (err.details as { at?: string } | undefined)?.at;
    push(sectionReplacedAt(at ? hhmm(new Date(at)) : nowHm()), 'warn');
    discardSection('lesson');
    setNotices({});
    refresh();
    return true;
  };

  /** Runs an immediate action; a conflict reloads the latest data and keeps unsaved edits (AC-17.4). */
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      if (replaced(err)) return;
      if (isConflict(err)) {
        push(M.changedElsewhere, 'warn');
        refresh();
      } else if (isNotFound(err)) {
        push(M.changedElsewhere, 'warn');
        refresh();
      } else {
        push(
          messageOf(err),
          hasCode(err, 'ITEM_LIMIT') || hasCode(err, 'NOT_READY') ? 'warn' : 'error',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const sectionItems = (s: Section) => lesson.items.filter((i) => i.section === s);
  const items = sectionItems(tab);
  const visible = items.filter((i) => showArchived[tab] || i.status !== 'archived');
  const archivedCount = items.filter((i) => i.status === 'archived').length;
  const counts = {
    published: items.filter((i) => i.status === 'published').length,
    draft: items.filter((i) => i.status === 'draft').length,
  };
  const drafts_ = lesson.items.filter((i) => i.status === 'draft').length;
  const publishLabel =
    lesson.status === 'draft' ? 'Xuất bản bài…' : drafts_ ? `Xuất bản… (${drafts_} Nháp)` : null;

  const onAdd = (afterItemId?: string) =>
    run(async () => {
      const id = await addItem(tab, afterItemId);
      setSavedAt(nowHm());
      push(itemAddedMessage(tab), 'success');
      setFocusId(id);
    });

  const onMove = (item: Item, direction: 'up' | 'down') =>
    run(async () => {
      try {
        const { position, total } = await move(item.id, direction);
        const text = itemMovedMessage(position, total);
        setSavedAt(nowHm());
        push(text, 'success');
        setAnnouncement(text);
      } catch (err) {
        if (isConflict(err)) throw err;
        push(M.orderFailed, 'error');
      }
    });

  /**
   * REQ-2 / REQ-7 for a step: invalid values and (published / archived, or publishing) readiness are checked first; a
   * conflict, a failure, a refusal or the issue list stays on the step.
   */
  const saveStep = (item: Item, mode: 'save' | 'publish', version?: number) => {
    const w = workingItem(item, drafts);
    const content = stepOf(w.content);
    const invalid = firstInvalidMessage(w.title, content);
    if (invalid) {
      setNotice(item.id, { kind: 'blocked', message: invalid });
      return;
    }
    if (mode === 'publish' || item.status !== 'draft') {
      const issues = stepIssues(w.title, content);
      if (issues.length) {
        setNotice(item.id, { kind: 'issues', issues });
        return;
      }
    }
    if (busy) return;
    setBusy(true);
    const task =
      version !== undefined
        ? overwrite(item.id, version)
        : mode === 'publish'
          ? publish(item.id)
          : save(item.id);
    task
      .then(() => {
        setNotice(item.id, null);
        const at = nowHm();
        setSavedAt(at);
        push(mode === 'publish' ? `Đã xuất bản · Đã lưu lúc ${at}` : `Đã lưu lúc ${at}`, 'success');
        void loadInfo(lessonId);
      })
      .catch((err: unknown) => {
        if (replaced(err)) return;
        const details = err instanceof ApiError ? (err.details as Record<string, unknown>) : null;
        const current = details?.['currentVersion'];
        if (isConflict(err) && typeof current === 'number') {
          setNotice(item.id, {
            kind: 'conflict',
            at: hhmm(new Date(String(details?.['updatedAt'] ?? new Date().toISOString()))),
            currentVersion: current,
          });
        } else if (isNotFound(err) || isConflict(err)) {
          push(M.changedElsewhere, 'warn');
          refresh();
        } else if (err instanceof ApiError && err.code === STEP_ERROR_CODES.INVALID_CONTENT) {
          setNotice(item.id, {
            kind: 'blocked',
            message: err.message.replace(/^Chưa lưu được: /, ''),
          });
        } else if (err instanceof ApiError && err.code === 'NOT_READY' && details?.['issues']) {
          setNotice(item.id, {
            kind: 'issues',
            issues: details['issues'] as { block: number | null; text: string }[],
          });
        } else if (err instanceof ApiError && err.status > 0 && err.status < 500) {
          push(messageOf(err), 'warn');
        } else {
          setNotice(item.id, { kind: 'failed', retry: mode });
        }
      })
      .finally(() => setBusy(false));
  };

  const onSave = (item: Item) => {
    if (item.section === 'lesson') {
      saveStep(item, 'save');
      return;
    }
    void run(async () => {
      await save(item.id);
      const at = nowHm();
      setSavedAt(at);
      push(`Đã lưu lúc ${at}`, 'success');
    });
  };

  const onPublish = (item: Item) => {
    if (item.section === 'lesson') {
      saveStep(item, 'publish');
      return;
    }
    const w = workingItem(item, drafts);
    const reason = itemNotReadyReason(item.section, w.title, w.content);
    if (reason) {
      push(notReadyMessage(reason), 'warn');
      return;
    }
    void run(async () => {
      await publish(item.id);
      const at = nowHm();
      setSavedAt(at);
      push(`Đã xuất bản · Đã lưu lúc ${at}`, 'success');
    });
  };

  const onDelete = (item: Item) => {
    if (item.hasLearningData) {
      push(M.setHasData, 'warn');
      return;
    }
    setDeleting(item);
  };

  const confirmDelete = () => {
    const item = deleting;
    setDeleting(null);
    if (!item) return;
    void run(async () => {
      await remove(item.id);
      setSavedAt(nowHm());
      push(M.deleted, 'success');
      setNotice(item.id, null);
      void loadInfo(lessonId);
    });
  };

  /** AC-8.1: the warnings of the delete confirmation of a step. */
  const deleteWarnings = (item: Item) => {
    if (item.section !== 'lesson') return [];
    const lines: string[] = [];
    const audience = info?.audience ?? 0;
    if (item.status === 'published' && lesson.status === 'published' && audience >= 1)
      lines.push(stepVisibleWarning(audience));
    const decks = stepOf(item.content).blocks.filter((b) => b.type === 'deck').length;
    if (decks >= 1) lines.push(deckMarksWarning(decks));
    return lines;
  };

  /** "Mở bộ bài tập" (AC-10.1): the Bài tập tab at that set, nothing saved or dropped. */
  const openSet = (setId: string) => {
    setTab('exercise');
    window.setTimeout(() => {
      document
        .querySelector(`[data-item="${setId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const back = () => navigate(lessonPath(curriculumId, lessonId), { state: { fromEditor: true } });

  const panel = (section: Section) => {
    const all = sectionItems(section);
    return (
      <div className="cur-editor">
        <div className="cur-rv-bar" role="toolbar" aria-label={`Phần ${SECTION_TITLES[section]}`}>
          <strong>{SECTION_TITLES[section]}</strong>
          <span className="small muted">
            {all.length} {ITEM_NOUNS[section]}
          </span>
          <span className="chip chip--done">{counts.published} Đã xuất bản</span>
          <span className="chip chip--pending">{counts.draft} Nháp</span>
          {archivedCount > 0 && (
            <>
              <span className="chip">{archivedCount} Lưu trữ</span>
              <Switch
                checked={showArchived[section]}
                onChange={(v) => setShowArchived(section, v)}
                label={`Hiện mục lưu trữ (${archivedCount})`}
              />
            </>
          )}
          <span className="grow" />
          {section === 'lesson' && <StorageMeter />}
          <span className="small muted" aria-live="polite">
            {unsaved.length
              ? `${unsaved.length} mục chưa lưu`
              : savedAt
                ? `Đã lưu lúc ${savedAt}`
                : ''}
          </span>
          <Button variant="outline" onClick={() => void onAdd()} disabled={busy}>
            <Icon name="plus" size={18} />
            {section === 'lesson' ? 'Thêm bước học' : 'Thêm bộ bài tập'}
          </Button>
          {publishLabel && (
            <Button onClick={() => setPublishing(true)}>
              <Icon name="check" size={18} />
              {publishLabel}
            </Button>
          )}
        </div>
        {section === 'lesson' && lesson.status === 'draft' && (
          <p className="st-banner st-banner--warn" role="note">
            {SM.draftLesson}
          </p>
        )}
        {section === 'lesson' &&
          lesson.status === 'published' &&
          counts.published > 0 &&
          (info?.audience ?? 0) > 0 && (
            <p className="st-banner" role="note">
              {publishedNotice(info?.audience ?? 0)}
            </p>
          )}
        <p className="field__hint cur-why">
          Sửa trực tiếp; mỗi bước / bộ có nút lưu riêng. Sắp xếp, thêm, xóa, lưu trữ, xuất bản có
          hiệu lực ngay. Đổi tab không mất thay đổi chưa lưu.
        </p>
        {visible.length === 0 ? (
          <p className="muted cur-editor__empty">
            {section === 'lesson'
              ? 'Chưa có bước học nào — bấm “Thêm bước học”.'
              : 'Chưa có bộ bài tập nào — bấm “Thêm bộ bài tập”.'}
          </p>
        ) : (
          visible.map((item) => {
            const w = workingItem(item, drafts);
            return (
              <ItemEditor
                key={item.id}
                item={item}
                working={{ title: w.title, content: w.content }}
                dirty={!!drafts[item.id]}
                position={all.indexOf(item) + 1}
                total={all.length}
                focusTitle={focusId === item.id}
                busy={busy}
                onEdit={(copy) => edit(item.id, copy)}
                onSave={() => void onSave(item)}
                onPublish={() => onPublish(item)}
                onArchive={() =>
                  void run(async () => {
                    await setArchived(item.id, true);
                    setSavedAt(nowHm());
                    push(M.archivedItem, 'success');
                  })
                }
                onRestore={() =>
                  void run(async () => {
                    await setArchived(item.id, false);
                    setSavedAt(nowHm());
                    push(M.restoredItem, 'success');
                  })
                }
                onMove={(d) => void onMove(item, d)}
                onAddAfter={() => void onAdd(item.id)}
                onDelete={() => onDelete(item)}
                blockedReason={
                  item.section === 'lesson' && isUploading(uploads, item.id) ? SM.uploading : null
                }
                onOpenSet={openSet}
                notice={
                  notices[item.id] ? (
                    <StepNoticeView
                      itemId={item.id}
                      stepNo={all.indexOf(item) + 1}
                      notice={notices[item.id] as StepNotice}
                      onReload={() => void reloadItem(item.id).then(() => setNotice(item.id, null))}
                      onOverwrite={() => {
                        const n = notices[item.id];
                        if (n?.kind === 'conflict') saveStep(item, 'save', n.currentVersion);
                      }}
                      onRetry={() => {
                        const n = notices[item.id];
                        saveStep(item, n?.kind === 'failed' ? n.retry : 'save');
                      }}
                    />
                  ) : null
                }
              />
            );
          })
        )}
      </div>
    );
  };

  const tabLabel = (s: Section) => {
    const n = unsavedIds({ drafts, lesson }, s).length;
    return n ? `${SECTION_TITLES[s]} · ${n} chưa lưu` : SECTION_TITLES[s];
  };

  return (
    <section aria-labelledby="t07-title" data-screen={tab === 'lesson' ? 'T07' : 'T09'}>
      <Crumbs
        items={[
          { label: 'Giáo trình', to: curriculaPath },
          { label: lesson.curriculumName, to: curriculumPath(curriculumId) },
          { label: lesson.name, to: lessonPath(curriculumId, lessonId) },
          { label: 'Soạn bài thủ công' },
        ]}
      />
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t07-title" className="page-title">
            Soạn bài thủ công
          </h1>
          <div className="page-sub cur-sub">
            <strong>{lesson.name}</strong>
            <StatusChip status={lesson.status} />
            <span>{lesson.curriculumName}</span>
          </div>
        </div>
        <div className="page-head__actions">
          <Button variant="outline" onClick={back}>
            <Icon name="back" size={18} />
            Về Soạn bài
          </Button>
        </div>
      </div>
      <Tabs
        aria-label="Phần của bài"
        value={tab}
        onChange={(id) => setTab(id as Section)}
        items={(['lesson', 'exercise'] as const).map((s) => ({
          id: s,
          label: tabLabel(s),
          count: sectionItems(s).length,
          content: panel(s),
        }))}
      />
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title={`Xóa “${deleting?.title.trim() || 'mục chưa có tên'}”?`}
        message={
          <>
            <span>Thao tác có hiệu lực ngay và không hoàn tác được.</span>
            {deleting &&
              deleteWarnings(deleting).map((w) => (
                <span key={w} className="st-warn-line">
                  {w}
                </span>
              ))}
          </>
        }
        confirmLabel="Xóa"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={leaveQuestion(unsaved.length)}
        message={M.leaveBody}
        confirmLabel="Rời đi"
        cancelLabel="Ở lại"
        tone="danger"
        onConfirm={() => {
          discardAll();
          cancelAll();
          blocker.proceed?.();
        }}
        onCancel={() => blocker.reset?.()}
      />
      <PublishLessonDialog
        lesson={publishing ? lesson : null}
        open={publishing}
        onClose={() => setPublishing(false)}
        onConfirm={async (itemIds) => {
          try {
            await publishLesson(lesson.id, lesson.version, itemIds);
            push(M.lessonPublished, 'success');
          } catch (err) {
            push(isConflict(err) ? M.changedElsewhere : messageOf(err), 'warn');
          } finally {
            setPublishing(false);
            refresh();
          }
        }}
      />
    </section>
  );
}

export function LessonTabPage() {
  return <ManualEditorPage initialTab="lesson" />;
}

export function ExerciseTabPage() {
  return <ManualEditorPage initialTab="exercise" />;
}
