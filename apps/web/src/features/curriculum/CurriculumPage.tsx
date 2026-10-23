import {
  CLASS_STATUS_LABELS,
  CURRICULUM_LIMITS,
  CURRICULUM_MESSAGES as M,
  type LessonRow,
  type UsingClass,
  formatVnDate,
  formatVnDateTime,
  inUseMessage,
  positionAnnouncement,
  usedByNotice,
} from '@sat/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import {
  Button,
  ConfirmDialog,
  ErrorState,
  HskBadge,
  Icon,
  Skeleton,
  StatusChip,
} from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { Notice } from '../auth/Notice';
import { useToastStore } from '../toast/toast-store';
import { ActionMenu } from './ActionMenu';
import { AiChip } from './AiChip';
import { Cover } from './Cover';
import { Crumbs } from './Crumbs';
import { CurriculumFormDialog, type CurriculumFormMode } from './CurriculumFormDialog';
import { useCurriculumStore } from './curriculum-store';
import { hasCode, isConflict, isNotFound, messageOf } from './errors';
import { LessonNameDialog } from './LessonNameDialog';
import { classContentPath, curriculaPath, lessonPath, previewPath } from './paths';
import { type LessonRef, useLessonActions } from './use-lesson-actions';
import { useSortable } from './use-sortable';
import './curriculum.css';

const summary = (l: LessonRow) =>
  `${l.stepCount} bước học · ${l.setCount} bộ bài tập${l.draftCount ? ` · ${l.draftCount} mục nháp` : ''}`;

const refOf = (l: LessonRow): LessonRef => ({ ...l });

/** "Dùng bởi N lớp" → "Lớp sử dụng" (AC-4.4). */
function UsingClasses({ curriculumId, usedBy }: { curriculumId: string; usedBy: number }) {
  const classes = useCurriculumStore((s) => s.classes);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UsingClass[] | null>(null);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    classes(curriculumId).then(setItems, () => setItems([]));
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, classes, curriculumId]);

  return (
    <span className="cur-menu" ref={root}>
      <button
        type="button"
        className="link"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) setItems(null);
          setOpen(!open);
        }}
      >
        Dùng bởi {usedBy} lớp
      </button>
      {open && (
        <div
          className="popover popover--left cur-classes"
          role="dialog"
          aria-label="Lớp sử dụng"
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        >
          {!items && <Skeleton height={40} />}
          {items?.length === 0 && <p className="small muted cur-classes__empty">{M.noClasses}</p>}
          {items?.map((c) => (
            <Link key={c.id} to={classContentPath(c.id)} className="popover__item">
              <span className="grow">
                {c.name}
                <span className="small muted cur-classes__date">
                  Bắt đầu{' '}
                  {c.startDate ? formatVnDate(new Date(`${c.startDate}T00:00:00+07:00`)) : '—'}
                </span>
              </span>
              <span className="chip chip--info">{CLASS_STATUS_LABELS[c.status]}</span>
            </Link>
          ))}
        </div>
      )}
    </span>
  );
}

/** T06 Chi tiết giáo trình = danh sách Bài (REQ-2, REQ-4 … REQ-6, REQ-13 … REQ-16). */
export function CurriculumPage() {
  const { curriculumId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const push = useToastStore((s) => s.push);
  const status = useCurriculumStore((s) => s.detailStatus);
  const detail = useCurriculumStore((s) => s.detail);
  const loadDetail = useCurriculumStore((s) => s.loadDetail);
  const reorder = useCurriculumStore((s) => s.reorder);
  const addLesson = useCurriculumStore((s) => s.addLesson);
  const archive = useCurriculumStore((s) => s.archive);
  const restore = useCurriculumStore((s) => s.restore);
  const remove = useCurriculumStore((s) => s.remove);
  const classes = useCurriculumStore((s) => s.classes);
  useDocumentTitle(detail?.name ?? 'Giáo trình');

  const [missingId, setMissingId] = useState<string | null>(null);
  const [form, setForm] = useState<CurriculumFormMode | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<
    | { kind: 'delete' }
    | { kind: 'inUse'; names: string[]; count: number }
    | { kind: 'hasData' }
    | null
  >(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    loadDetail(curriculumId).catch((err: unknown) => {
      if (isNotFound(err)) setMissingId(curriculumId);
    });
  }, [loadDetail, curriculumId]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  const missing = missingId === curriculumId;

  const lessons = useMemo(
    () => (detail?.id === curriculumId ? detail.lessons : []),
    [detail, curriculumId],
  );
  const [announcement, setAnnouncement] = useState('');
  const ids = lessons.map((l) => l.id);

  const commitOrder = (order: string[], id: string) => {
    reorder(curriculumId, order).then(
      () => {
        push(M.orderSaved, 'success');
        setAnnouncement(positionAnnouncement(order.indexOf(id) + 1, order.length));
      },
      (err: unknown) => {
        if (isConflict(err)) {
          push(M.changedElsewhere, 'warn');
          refresh();
        } else {
          push(M.orderFailed, 'error');
        }
      },
    );
  };
  const sortable = useSortable(ids, commitOrder, setAnnouncement);
  const moveTo = (id: string, to: number) => {
    const next = ids.filter((x) => x !== id);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, id);
    commitOrder(next, id);
  };

  const actions = useLessonActions({
    curriculumId,
    usedBy: detail?.usedBy ?? 0,
    refresh,
  });

  // AC-16.6: back from T21 at the Bài that was previewed.
  const focusId = (location.state as { focusLesson?: string } | null)?.focusLesson;
  useEffect(() => {
    if (!focusId || !lessons.some((l) => l.id === focusId)) return;
    const el = document.querySelector<HTMLElement>(`[data-lesson="${focusId}"] .cur-row__name`);
    el?.scrollIntoView({ block: 'center' });
    el?.focus();
  }, [focusId, lessons]);

  if (missing) return <NotFoundPage />;
  if (status === 'error' && !detail) return <ErrorState title="Không tải được giáo trình." />;
  if (!detail || detail.id !== curriculumId) return <Skeleton height={320} />;

  const full = lessons.length >= CURRICULUM_LIMITS.lessonsPerCurriculum;
  const published = lessons.filter((l) => l.status === 'published').length;

  const onAddLesson = async (name: string) => {
    try {
      const lesson = await addLesson(curriculumId, name);
      push(M.lessonAdded, 'success');
      setAdding(false);
      navigate(lessonPath(curriculumId, lesson.id));
    } catch (err) {
      setAdding(false);
      push(messageOf(err), 'error');
      refresh();
    }
  };

  const onArchive = async () => {
    try {
      if (detail.archived) {
        await restore(curriculumId);
        push(M.curriculumRestored, 'success');
      } else {
        await archive(curriculumId);
        push(M.curriculumArchived, 'success');
      }
    } catch (err) {
      push(messageOf(err), 'error');
    }
  };

  const showInUse = async (count: number) => {
    const names = (await classes(curriculumId).catch(() => [])).map((c) => c.name);
    setConfirm({ kind: 'inUse', names, count });
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      await remove(curriculumId);
      push(M.curriculumDeleted, 'success');
      navigate(curriculaPath, { replace: true });
    } catch (err) {
      // AC-13.4: a class or learning data that appeared meanwhile still blocks.
      if (hasCode(err, 'IN_USE')) await showInUse(detail.usedBy || 1);
      else if (hasCode(err, 'HAS_LEARNING_DATA')) setConfirm({ kind: 'hasData' });
      else {
        setConfirm(null);
        push(messageOf(err), 'error');
      }
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="t06-title" data-screen="T06">
      <Crumbs items={[{ label: 'Giáo trình', to: curriculaPath }, { label: detail.name }]} />
      <div className="page-head">
        <Cover hsk={detail.hsk} url={detail.coverUrl} name={detail.name} size="sm" />
        <div className="page-head__text">
          <h1 id="t06-title" className="page-title cur-title">
            {detail.name} <HskBadge level={detail.hsk} />
            {detail.archived && <span className="chip cur-chip-outline">Đã lưu trữ</span>}
          </h1>
          <div className="page-sub cur-sub">
            {detail.description && <span>{detail.description}</span>}
            <UsingClasses curriculumId={curriculumId} usedBy={detail.usedBy} />
            <span>Cập nhật {formatVnDateTime(new Date(detail.updatedAt))}</span>
          </div>
        </div>
        <div className="page-head__actions">
          <Button variant="outline" onClick={() => setForm('duplicate')}>
            <Icon name="copy" size={18} />
            Nhân bản
          </Button>
          <ActionMenu
            label="Thao tác giáo trình"
            actions={[
              { label: 'Sửa thông tin', icon: 'edit', onSelect: () => setForm('edit') },
              {
                label: detail.archived ? 'Khôi phục' : 'Lưu trữ',
                icon: detail.archived ? 'refresh' : 'archive',
                onSelect: () => void onArchive(),
              },
              {
                label: 'Xóa giáo trình',
                icon: 'trash',
                danger: true,
                separated: true,
                onSelect: () =>
                  detail.usedBy > 0
                    ? void showInUse(detail.usedBy)
                    : setConfirm({ kind: 'delete' }),
              },
            ]}
          />
        </div>
      </div>

      {detail.usedBy > 0 && (
        <Notice tone="info" className="cur-notice">
          {usedByNotice(detail.usedBy)}
        </Notice>
      )}

      <div className="toolbar">
        <strong>
          {lessons.length} bài · {published} đã xuất bản
        </strong>
        <div className="cur-legend small muted">
          <span>
            <StatusChip status="draft" /> học viên chưa thấy
          </span>
        </div>
        <span className="grow" />
        <Button
          onClick={() => !full && setAdding(true)}
          aria-disabled={full || undefined}
          title={full ? M.lessonLimit : undefined}
        >
          <Icon name="plus" size={18} />
          Thêm bài
        </Button>
      </div>
      {full && <p className="field__hint cur-limit">{M.lessonLimit}</p>}

      <div className="card cur-list-card">
        {lessons.length === 0 ? (
          <div className="empty">
            <div className="empty__ill">
              <Icon name="book" size={28} />
            </div>
            <h3>{M.noLessons}</h3>
            <Button onClick={() => setAdding(true)}>
              <Icon name="plus" size={18} />
              Thêm bài
            </Button>
            <p className="small muted">
              Mỗi bài soạn ở màn hình “Soạn bài”: thủ công hoặc tạo bằng AI từ tài liệu PDF/Word.
            </p>
          </div>
        ) : (
          <ol className="cur-rows" aria-label="Danh sách bài">
            {sortable.order.map((id, i) => {
              const l = lessons.find((x) => x.id === id);
              if (!l) return null;
              const copying = actions.duplicating.includes(l.id);
              return (
                <li
                  key={l.id}
                  className={sortable.lifted === l.id ? 'cur-row cur-row--lifted' : 'cur-row'}
                  aria-label={l.name}
                  data-lesson={l.id}
                  {...sortable.rowProps(l.id)}
                >
                  <button
                    type="button"
                    className="cur-row__grip"
                    aria-label={`Kéo để sắp xếp: ${l.name}`}
                    aria-describedby="cur-sort-help"
                    title="Kéo để sắp xếp (bàn phím: Space để nhấc, ↑/↓ để di chuyển)"
                    {...sortable.gripProps(l.id)}
                  >
                    <Icon name="grip" size={18} />
                  </button>
                  <span className="cur-row__ord">{i + 1}</span>
                  <div className="cur-row__main">
                    <Link className="cur-row__name" to={lessonPath(curriculumId, l.id)}>
                      {l.name}
                    </Link>
                    <div className="cur-row__sub">
                      <span>{summary(l)}</span>
                      <span className="muted-3">
                        Cập nhật {formatVnDateTime(new Date(l.updatedAt))}
                      </span>
                    </div>
                    {l.status === 'published' && l.publishedItemCount === 0 && (
                      <div className="cur-row__warn">
                        <Icon name="alert" size={14} />
                        {M.noVisibleContent}
                      </div>
                    )}
                  </div>
                  <div className="cur-row__tags">
                    {l.ai && <AiChip label={l.ai} curriculumId={curriculumId} lessonId={l.id} />}
                    {l.hasLearningData && (
                      <span className="chip chip--info">Có dữ liệu học viên</span>
                    )}
                    <StatusChip status={l.status} />
                  </div>
                  <div className="cur-mv">
                    <button
                      type="button"
                      aria-label="Lên trên"
                      disabled={i === 0}
                      onClick={() => moveTo(l.id, i - 1)}
                    >
                      <Icon name="up" size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Xuống dưới"
                      disabled={i === lessons.length - 1}
                      onClick={() => moveTo(l.id, i + 1)}
                    >
                      <Icon name="down" size={16} />
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="nowrap"
                    aria-label={`Xem như học viên: ${l.name}`}
                    onClick={() => navigate(previewPath(curriculumId, l.id))}
                  >
                    <Icon name="eye" size={16} />
                    Xem như học viên
                  </Button>
                  <ActionMenu
                    label={`Thao tác với ${l.name}`}
                    actions={[
                      { label: 'Đổi tên', icon: 'edit', onSelect: () => actions.rename(refOf(l)) },
                      ...(l.status === 'draft'
                        ? [
                            {
                              label: 'Xuất bản bài',
                              icon: 'check' as const,
                              onSelect: () => actions.publish(l.id),
                            },
                          ]
                        : []),
                      {
                        label: copying ? M.duplicating : 'Nhân bản bài',
                        icon: 'copy',
                        disabled: full || copying,
                        title: full ? M.lessonLimit : undefined,
                        onSelect: () => actions.duplicate(refOf(l)),
                      },
                      { label: 'Lên đầu', icon: 'up', onSelect: () => moveTo(l.id, 0) },
                      {
                        label: 'Xuống cuối',
                        icon: 'down',
                        onSelect: () => moveTo(l.id, lessons.length - 1),
                      },
                      {
                        label: 'Xóa bài',
                        icon: 'trash',
                        danger: true,
                        separated: true,
                        onSelect: () => actions.remove(refOf(l)),
                      },
                    ]}
                  />
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <p id="cur-sort-help" className="sr-only">
        Space để nhấc, mũi tên Lên/Xuống để di chuyển, Space để thả, Esc để hủy.
      </p>
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <CurriculumFormDialog
        mode={form ?? 'edit'}
        open={!!form}
        source={detail}
        onClose={() => setForm(null)}
      />
      <LessonNameDialog
        open={adding}
        mode="add"
        initialName={`Bài ${lessons.length + 1}`}
        onClose={() => setAdding(false)}
        onSubmit={onAddLesson}
      />
      {actions.dialogs}
      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        title={`Xóa giáo trình ${detail.name}?`}
        message={`Sẽ xóa ${lessons.length} bài cùng mọi mục. Thao tác không thể hoàn tác.`}
        confirmLabel="Xóa giáo trình"
        tone="danger"
        loading={busy}
        onConfirm={() => void onDelete()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === 'inUse'}
        title={inUseMessage(confirm?.kind === 'inUse' ? confirm.count : 0)}
        message={
          <>
            {confirm?.kind === 'inUse' && confirm.names.join(', ')}.
            <br />
            Bạn có thể lưu trữ giáo trình thay thế.
          </>
        }
        confirmLabel="Lưu trữ"
        cancelLabel="Đóng"
        onConfirm={() => {
          setConfirm(null);
          if (!detail.archived) void onArchive();
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === 'hasData'}
        title="Không thể xóa giáo trình"
        message={M.curriculumHasData}
        confirmLabel="Đã hiểu"
        cancelLabel="Đóng"
        onConfirm={() => setConfirm(null)}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}
