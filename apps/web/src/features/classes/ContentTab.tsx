import {
  CLASS_MESSAGES as M,
  type ClassContent,
  type ClassDetail,
  type ContentLesson,
  type Section,
  SECTION_NAMES,
  type VisibilityScope,
  alreadyInStateMessage,
  bulkDeadlineClearedMessage,
  bulkUpdatedMessage,
  contentSummary,
  deadlineSetMessage,
  hiddenMessage,
  hideConfirm,
  inProgressLine,
  pastDeadlineSetMessage,
  showConfirm,
  shownMessage,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, ConfirmDialog, ErrorState, Skeleton } from '../../components';
import { curriculumPath, lessonPath } from '../curriculum/paths';
import { SetSubmissionsDrawer } from '../exercises/SetSubmissionsDrawer';
import { useToastStore } from '../toast/toast-store';
import { useClassesStore } from './classes-store';
import { DeadlineField } from './DeadlinePopover';
import { detailsOf, hasCode } from './errors';

const SECTIONS: Section[] = ['lesson', 'exercise'];
const COUNT_NOUN: Record<Section, string> = { lesson: 'bước học', exercise: 'bộ bài tập' };

interface Pending {
  hidden: boolean;
  scope: VisibilityScope;
  title: string;
  message: string;
  done: string;
}

/** The part of the AC-16.1 / AC-16.2 question after its first sentence (reused by bulk confirms — AC-16.4). */
const tail = (text: string) => text.slice(text.indexOf('? ') + 2);

/** T04 tab Nội dung (REQ-15, REQ-16, REQ-21, REQ-22). */
export function ContentTab({ detail }: { detail: ClassDetail }) {
  const push = useToastStore((s) => s.push);
  const status = useClassesStore((s) => s.contentStatus);
  const content = useClassesStore((s) => s.content);
  const loadContent = useClassesStore((s) => s.loadContent);
  const setContent = useClassesStore((s) => s.setContent);
  const preview = useClassesStore((s) => s.visibilityPreview);
  const setVisibility = useClassesStore((s) => s.setVisibility);
  const setDeadlines = useClassesStore((s) => s.setDeadlines);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [submissionsOf, setSubmissionsOf] = useState<{ id: string; title: string } | null>(null);
  const ended = detail.status === 'ended';

  useEffect(() => {
    void loadContent(detail.id);
  }, [detail.id, detail.curriculum.id, loadContent]);

  if (status === 'error' && !content) return <ErrorState title="Không tải được nội dung lớp." />;
  if (!content) return <Skeleton height={240} />;
  if (!content.lessons.length)
    return (
      <div className="card">
        <div className="empty">
          <h3>Giáo trình «{content.curriculum.name}» chưa có bài nào.</h3>
          <Link to={curriculumPath(content.curriculum.id)}>Mở giáo trình</Link>
        </div>
      </div>
    );

  const isHidden = (l: ContentLesson, s: Section) => l.sections[s].hidden;

  /** Asks first, with the number of sections and the HV with an attempt in progress (AC-16.3, AC-16.4). */
  const ask = async (hidden: boolean, scope: VisibilityScope) => {
    if (busy) return;
    let impact: { changes: number; inProgress: number };
    try {
      impact = await preview(detail.id, { hidden, scope });
    } catch {
      push(M.visibilityFailed, 'error');
      return;
    }
    const { changes, inProgress } = impact;
    const lesson =
      scope.kind === 'column' ? null : content.lessons.find((l) => l.id === scope.lessonId);
    const extra = hidden && inProgress ? ` ${inProgressLine(inProgress)}` : '';
    if (scope.kind === 'section' && lesson) {
      const name = SECTION_NAMES[scope.section];
      setPending({
        hidden,
        scope,
        title: hidden ? 'Ẩn với lớp' : 'Hiện với lớp',
        message:
          (hidden
            ? hideConfirm(name, lesson.name, detail.name)
            : showConfirm(name, lesson.name, detail.name)) + extra,
        done: hidden ? hiddenMessage(name, lesson.name) : shownMessage(name, lesson.name),
      });
      return;
    }
    const question =
      scope.kind === 'column'
        ? `${hidden ? 'Ẩn' : 'Hiện'} «${SECTION_NAMES[scope.section]}» của ${changes} bài với lớp ${detail.name}?`
        : `${hidden ? 'Ẩn' : 'Hiện'} ${changes} phần của «${lesson?.name ?? ''}» với lớp ${detail.name}?`;
    const body = tail(hidden ? hideConfirm('', '', detail.name) : showConfirm('', '', detail.name));
    setPending({
      hidden,
      scope,
      title: hidden ? 'Ẩn với lớp' : 'Hiện với lớp',
      message: `${question} ${body}${extra}`,
      done: bulkUpdatedMessage(changes),
    });
  };

  const apply = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const changed = await setVisibility(detail.id, {
        hidden: pending.hidden,
        scope: pending.scope,
      });
      push(
        pending.scope.kind === 'section' ? pending.done : bulkUpdatedMessage(changed),
        'success',
      );
    } catch (err) {
      if (hasCode(err, 'ALREADY_IN_STATE')) {
        const latest = detailsOf<{ content: ClassContent }>(err).content;
        if (latest) setContent(latest);
        push(alreadyInStateMessage(pending.hidden), 'info');
      } else push(M.visibilityFailed, 'error');
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const deadline = (target: { setId: string } | { lessonId: string }, count?: number) => ({
    onApply: async (day: string) => {
      try {
        await setDeadlines(detail.id, { target, date: day });
        push(
          day < content.today ? pastDeadlineSetMessage(day) : deadlineSetMessage(day, count),
          'success',
        );
      } catch {
        push(M.deadlineFailed, 'error');
      }
    },
    onClear: async () => {
      try {
        await setDeadlines(detail.id, { target, date: null });
        push(
          count === undefined ? M.deadlineCleared : bulkDeadlineClearedMessage(count),
          'success',
        );
      } catch {
        push(M.deadlineFailed, 'error');
      }
    },
  });

  const column = (s: Section) => {
    const hiddenCount = content.lessons.filter((l) => isHidden(l, s)).length;
    return (
      <div className="cls-bulk">
        {hiddenCount < content.lessons.length && (
          <Button
            variant="ghost"
            size="sm"
            disabled={ended}
            onClick={() => void ask(true, { kind: 'column', section: s })}
          >
            Ẩn {SECTION_NAMES[s]} ở mọi bài
          </Button>
        )}
        {hiddenCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={ended}
            onClick={() => void ask(false, { kind: 'column', section: s })}
          >
            Hiện {SECTION_NAMES[s]} ở mọi bài
          </Button>
        )}
      </div>
    );
  };

  const cell = (l: ContentLesson, s: Section) => {
    const sec = l.sections[s];
    return (
      <td className={`cls-sec-cell ${sec.hidden ? 'is-hidden' : ''}`}>
        <div className="small strong">
          {sec.publishedCount ? (
            `${sec.publishedCount} ${COUNT_NOUN[s]}`
          ) : (
            <span className="muted">Chưa có nội dung đã xuất bản</span>
          )}
        </div>
        <div className="cls-sec-cell__state">
          <span className={`chip ${sec.hidden ? 'chip--todo' : 'chip--done'}`}>
            {sec.hidden ? 'Đang ẩn' : 'Hiển thị'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={ended}
            aria-label={`${sec.hidden ? 'Hiện với lớp' : 'Ẩn với lớp'}: ${SECTION_NAMES[s]} của ${l.name}`}
            onClick={() => void ask(!sec.hidden, { kind: 'section', lessonId: l.id, section: s })}
          >
            {sec.hidden ? 'Hiện với lớp' : 'Ẩn với lớp'}
          </Button>
        </div>
        {s === 'exercise' && l.sets.length > 0 && (
          <div className="cls-dl-list">
            {l.sets.map((set) => (
              <div key={set.id} className={`cls-dl-row ${set.deadline ? '' : 'is-closed'}`}>
                <span className="grow small">{set.title || 'Bộ bài tập'}</span>
                <span className="cls-dl-cell">
                  <DeadlineField
                    label={`Hạn nộp ${set.title}`}
                    value={set.deadline}
                    hasDeadline={!!set.deadline}
                    content={content}
                    disabled={ended}
                    {...deadline({ setId: set.id })}
                  />
                  {!set.deadline && <span className="cls-dl-sub">{M.closedForStudents}</span>}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Bài nộp: ${set.title || 'Bộ bài tập'}`}
                  onClick={() => setSubmissionsOf({ id: set.id, title: set.title || 'Bộ bài tập' })}
                >
                  Bài nộp
                </Button>
              </div>
            ))}
            <div className="cls-dl-row">
              <span className="grow" />
              <DeadlineField
                label={`Đặt hạn cho mọi bộ của bài ${l.name}`}
                caption="Đặt hạn cho mọi bộ của bài"
                value={null}
                hasDeadline={l.sets.some((x) => !!x.deadline)}
                content={content}
                disabled={ended}
                {...deadline({ lessonId: l.id }, l.sets.length)}
              />
            </div>
            {sec.hidden && l.sets.some((x) => !!x.deadline) && (
              <p className="small muted">{M.hiddenDeadlinesNote}</p>
            )}
          </div>
        )}
      </td>
    );
  };

  return (
    <div>
      <div className="cls-content-head">
        <span className="strong">
          {contentSummary(content.lessons.length, content.hiddenCount)}
        </span>
        <span className="small muted">
          Ẩn chỉ áp dụng cho lớp này — các lớp khác dùng giáo trình không bị ảnh hưởng. Điểm xếp
          hạng đã có được giữ.
        </span>
        {ended && <span className="small muted">{M.endedHint}</span>}
      </div>
      <div className="card cls-content-card">
        <table className="tbl cls-content-grid">
          <thead>
            <tr>
              <th>Bài</th>
              {SECTIONS.map((s) => (
                <th key={s}>
                  {SECTION_NAMES[s]}
                  {column(s)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.lessons.map((l) => {
              const all = SECTIONS.every((s) => isHidden(l, s));
              const any = SECTIONS.some((s) => isHidden(l, s));
              return (
                <tr key={l.id}>
                  <td className="cls-lesson-cell">
                    <Link className="strong" to={lessonPath(content.curriculum.id, l.id)}>
                      {l.name}
                    </Link>
                    <div>
                      {l.status === 'published' ? (
                        <span className="chip chip--done">Đã xuất bản</span>
                      ) : (
                        <span className="chip chip--pending">Nháp — học viên chưa thấy</span>
                      )}
                    </div>
                    <div className="cls-bulk">
                      {!all && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={ended}
                          aria-label={`Ẩn cả bài: ${l.name}`}
                          onClick={() => void ask(true, { kind: 'lesson', lessonId: l.id })}
                        >
                          Ẩn cả bài
                        </Button>
                      )}
                      {any && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={ended}
                          aria-label={`Hiện cả bài: ${l.name}`}
                          onClick={() => void ask(false, { kind: 'lesson', lessonId: l.id })}
                        >
                          Hiện cả bài
                        </Button>
                      )}
                    </div>
                  </td>
                  {cell(l, 'lesson')}
                  {cell(l, 'exercise')}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!pending}
        title={pending?.title ?? ''}
        message={pending?.message ?? ''}
        confirmLabel={pending?.hidden ? 'Ẩn với lớp' : 'Hiện với lớp'}
        loading={busy}
        onConfirm={() => void apply()}
        onCancel={() => setPending(null)}
      />
      <SetSubmissionsDrawer
        classId={detail.id}
        set={submissionsOf}
        onClose={() => setSubmissionsOf(null)}
      />
    </div>
  );
}
