import {
  EXAM_LIMITS as XL,
  EXAM_MESSAGES as M,
  type ExamState,
  classStartWarnings,
  formatNumber,
  formatVnStamp,
  formatVnTime,
  parseVnDateTime,
  setPoints,
} from '@sat/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import {
  Button,
  Checkbox,
  ConfirmDialog,
  ErrorState,
  Icon,
  Skeleton,
  TextField,
  Textarea,
} from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { SetBody } from '../exercises/SetEditor';
import { scrollToQuestion } from '../exercises/set-editing';
import { useToastStore } from '../toast/toast-store';
import { ExamStateChip } from './exam-bits';
import { liveState } from './exam-state';
import { type FieldKey, isDirty, useExamsStore } from './exams-store';
import { NEW_EXAM_ID, examPath, examResultsPath, examsPath } from './paths';
import { useServerNow } from './server-clock';
import '../exercises/exercises.css';
import '../exercises/question-view.css';
import './exams.css';

const CLASS_STATUS = {
  upcoming: 'Sắp bắt đầu',
  active: 'Đang học',
  ended: 'Đã kết thúc',
} as const;

function focusTarget(target: string) {
  if (target.startsWith('q')) {
    scrollToQuestion('exam', target.slice(1));
    return;
  }
  // `data-field`, not `id`: the UI kit gives every field its own generated id.
  const el =
    document.querySelector<HTMLElement>(`[data-field="${target}"]`) ??
    document.getElementById('xm-questions');
  el?.scrollIntoView({ block: 'center' });
  el?.focus();
}

/** T22 Soạn bài thi (REQ-2 … REQ-6): info, 005 questions, assigned classes and the one schedule, actions. */
export function ExamEditorPage() {
  const { examId = '' } = useParams();
  const isNew = examId === NEW_EXAM_ID;
  const navigate = useNavigate();
  const now = useServerNow(1000);
  const push = useToastStore((s) => s.push);
  const s = useExamsStore;
  const id = s((x) => x.id);
  const exam = s((x) => x.exam);
  const work = s((x) => x.work);
  const saved = s((x) => x.saved);
  const status = s((x) => x.status);
  const error = s((x) => x.error);
  const busy = s((x) => x.busy);
  const savedAt = s((x) => x.savedAt);
  const issues = s((x) => x.issues);
  const fieldErrors = s((x) => x.fieldErrors);
  const notice = s((x) => x.notice);
  const touched = s((x) => x.touched);
  const options = s((x) => x.options);
  const { openNew, load, edit, touch, patchImage, save, schedule, unschedule } = s.getState();
  const [picker, setPicker] = useState(false);
  const [confirm, setConfirm] = useState<'unschedule' | 'delete' | null>(null);
  useDocumentTitle('Soạn bài thi');

  useEffect(() => {
    void s.getState().loadOptions();
  }, [s]);
  useEffect(() => {
    if (isNew) openNew();
    else if (s.getState().id !== examId || s.getState().status !== 'ok') void load(examId);
  }, [examId, isNew, openNew, load, s]);

  const dirty = isDirty({ work, saved });
  // AC-2.8: leaving with unsaved changes asks first (closing / reloading the tab: the browser's warning).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  const state: ExamState = exam ? liveState(exam, now) : 'draft';
  const closed = state === 'closed' || state === 'archived';
  const locked = !!exam?.locked && !closed;
  const roQuestions = locked || closed;
  const opensAt = parseVnDateTime(work.open);
  const closesAt = parseVnDateTime(work.close);
  const selected = useMemo(() => {
    const known = new Map(options.map((o) => [o.id, o]));
    for (const c of exam?.classes ?? [])
      if (!known.has(c.id)) known.set(c.id, { ...c, memberCount: 0 });
    return work.classIds.flatMap((cid) => {
      const c = known.get(cid);
      return c ? [c] : [];
    });
  }, [options, exam, work.classIds]);
  const warnings = classStartWarnings(selected, opensAt, closesAt);

  if (!isNew && status === 'error' && error?.status === 404) return <NotFoundPage />;
  if (!isNew && status === 'error') return <ErrorState title="Không tải được bài thi." />;
  if (!isNew && (status !== 'ok' || id !== examId)) return <Skeleton height={320} />;

  const err = (k: FieldKey) => fieldErrors[k];
  const stateLine =
    state === 'draft'
      ? savedAt
        ? M.savedAt(formatVnTime(savedAt))
        : isNew || !exam
          ? 'Chưa lưu — bài thi được tạo khi bạn lưu lần đầu'
          : `Lưu gần nhất ${formatVnStamp(new Date(exam.updatedAt))}`
      : state === 'scheduled' && exam?.opensAt
        ? M.scheduledAt(new Date(exam.opensAt))
        : state === 'open' && exam?.closesAt
          ? `Đang mở · đóng lúc ${formatVnStamp(new Date(exam.closesAt))}`
          : state === 'closed' && exam?.closesAt
            ? `Đã đóng lúc ${formatVnStamp(new Date(exam.closesAt))}`
            : 'Lưu trữ — học viên không thấy bài thi này';

  // The exam exists from its first save (AC-2.1) — also when "Lên lịch" then lists unmet conditions.
  const afterWrite = (_ok: boolean, created: string | null) => {
    if (created && isNew) navigate(examPath(created), { replace: true });
  };
  const doSave = async () => {
    const ok = await save();
    if (ok && state !== 'draft') push(M.savedAt(formatVnTime(new Date())), 'success');
    afterWrite(ok, s.getState().id);
  };
  const doSchedule = async () => afterWrite(await schedule(), s.getState().id);
  const toggleClass = (cid: string) =>
    edit({
      classIds: work.classIds.includes(cid)
        ? work.classIds.filter((x) => x !== cid)
        : [...work.classIds, cid],
    });

  const title = work.name.trim() || exam?.name || 'Bài thi mới';
  return (
    <section aria-labelledby="t22-title" data-screen="T22" className="xm-editor">
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t22-title" className="page-title">
            Soạn bài thi
          </h1>
          <div className="page-sub">
            <strong>{title}</strong> <ExamStateChip state={state} />
          </div>
        </div>
        <div className="page-head__actions">
          <Button variant="outline" onClick={() => navigate(examsPath)}>
            <Icon name="back" size={18} />
            Về danh sách bài thi
          </Button>
        </div>
      </div>

      <div className="xm-grid">
        <div className="xm-main">
          {closed && (
            <div className="cls-callout" role="note">
              {M.closedBanner}
            </div>
          )}
          {locked && (
            <div className="cls-callout cls-callout--warn" role="note">
              {M.lockedBanner}
            </div>
          )}
          {notice && (
            <div className="cls-callout cls-callout--warn" role="alert">
              {notice}
            </div>
          )}
          {issues.length > 0 && (
            <div className="st-notice st-notice--danger" role="alert">
              <strong>
                {state === 'draft' ? 'Chưa lên lịch được' : 'Chưa lưu được'} — còn {issues.length}{' '}
                điều kiện chưa đạt:
              </strong>
              <ul className="st-notice__issues">
                {issues.map((i) => (
                  <li key={i.message}>
                    <button type="button" onClick={() => focusTarget(i.target)}>
                      {i.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="card card-pad" aria-labelledby="xm-info">
            <h2 id="xm-info" className="xm-h">
              Thông tin bài thi
            </h2>
            <TextField
              data-field="name"
              label="Tên bài thi"
              required
              maxLength={XL.nameMax + 50}
              placeholder="Ví dụ: Kiểm tra giữa kỳ HSK1"
              value={work.name}
              error={err('name')}
              onChange={(e) => edit({ name: e.target.value })}
            />
            <Textarea
              data-field="instructions"
              label="Hướng dẫn (tùy chọn)"
              rows={2}
              maxLength={XL.instructionsMax}
              placeholder="Hiển thị cho học viên ở sảnh thi"
              value={work.content.instructions}
              error={err('instructions')}
              onChange={(e) => edit({ content: { ...work.content, instructions: e.target.value } })}
            />
          </section>

          <section className="card card-pad" aria-labelledby="xm-questions" data-item="exam">
            <h2 id="xm-questions" className="xm-h" tabIndex={-1}>
              Câu hỏi <span className="chip">{work.content.questions.length}</span>
              <span className="grow" />
              <span className="small muted">Dạng câu tự chấm của 005 · tối đa 100 câu</span>
            </h2>
            {!work.content.questions.length && (
              <div className="empty">
                <h3>Chưa có câu hỏi</h3>
                <p>Bấm “Thêm câu hỏi” và chọn dạng câu.</p>
              </div>
            )}
            <fieldset className="xm-questions" disabled={roQuestions}>
              <SetBody
                itemId="exam"
                title={work.name || '-'}
                content={work.content}
                touched={touched}
                onTouch={touch}
                onChange={(content) => edit({ content })}
                locked={roQuestions}
                limitMessage={M.questionLimit}
                allowEmpty
                patchImage={patchImage}
              />
            </fieldset>
          </section>
        </div>

        <aside className="xm-side">
          <div className="card card-pad">
            <div className="xm-status">
              <ExamStateChip state={state} />
              {dirty && <span className="chip chip--danger">Chưa lưu</span>}
            </div>
            <p className="small" role="status">
              {stateLine}
            </p>
            <div className="xm-sum" aria-live="polite">
              <div>
                <strong>{work.content.questions.length}</strong>
                <span>câu hỏi</span>
              </div>
              <div>
                <strong>{formatNumber(setPoints(work.content), 1).replace(/,0$/, '')}</strong>
                <span>tổng điểm tối đa</span>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="xm-h">Lớp được giao và lịch thi</h2>
            <div className="field">
              <span className="field__label">
                Lớp được giao <span aria-hidden="true">*</span>
              </span>
              {selected.length ? (
                <div className="xm-chips">
                  {selected.map((c) => (
                    <span key={c.id} className="xm-chip">
                      {c.name}
                      {!closed && (
                        <button
                          type="button"
                          aria-label={`Bỏ lớp ${c.name}`}
                          onClick={() => toggleClass(c.id)}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="small muted">Chưa chọn lớp nào</p>
              )}
              {!closed && (
                <div className="xm-picker">
                  <Button
                    data-field="classes"
                    size="sm"
                    variant="outline"
                    aria-haspopup="true"
                    aria-expanded={picker}
                    onClick={() => setPicker((v) => !v)}
                  >
                    <Icon name="users" size={15} />
                    Chọn lớp…
                  </Button>
                  {picker && (
                    <div className="xm-picker__pop" role="group" aria-label="Chọn lớp được giao">
                      {options.length ? (
                        options.map((o) => (
                          <Checkbox
                            key={o.id}
                            checked={work.classIds.includes(o.id)}
                            onChange={() => toggleClass(o.id)}
                            label={`${o.name} · ${CLASS_STATUS[o.status]} · ${o.memberCount} học viên`}
                          />
                        ))
                      ) : (
                        <p className="small muted">Chưa có lớp Sắp bắt đầu hoặc Đang học.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {err('classes') && (
                <p className="field__error" role="alert">
                  {err('classes')}
                </p>
              )}
            </div>
            <div className="xm-sched">
              <TextField
                data-field="open"
                label="Giờ mở"
                placeholder="dd/mm/yyyy hh:mm"
                hint="Giờ Việt Nam (UTC+7)"
                value={work.open}
                readOnly={closed || locked}
                error={err('open')}
                onChange={(e) => edit({ open: e.target.value })}
              />
              <TextField
                data-field="dur"
                label="Thời lượng (phút)"
                placeholder="1–300"
                inputMode="numeric"
                value={work.dur}
                readOnly={closed || locked}
                error={err('dur')}
                onChange={(e) => edit({ dur: e.target.value })}
              />
              <TextField
                data-field="close"
                label="Giờ đóng"
                placeholder="dd/mm/yyyy hh:mm"
                hint={locked ? 'Chỉ lùi được muộn hơn' : 'Giờ Việt Nam (UTC+7)'}
                value={work.close}
                readOnly={closed}
                error={err('close')}
                onChange={(e) => edit({ close: e.target.value })}
              />
            </div>
            {warnings.map((w) => (
              <p key={w} className="cls-callout cls-callout--warn small" role="note">
                {w}
              </p>
            ))}
            <p className="small muted">
              Một lịch cho mọi lớp được giao. Mỗi học viên làm một lần, có đủ thời lượng nhưng không
              quá giờ đóng.
            </p>
          </div>

          <div className="card card-pad xm-acts">
            {state === 'draft' ? (
              <>
                <Button variant="outline" disabled={busy} onClick={() => void doSave()}>
                  Lưu nháp
                </Button>
                <Button disabled={busy} onClick={() => void doSchedule()}>
                  <Icon name="clock" size={17} />
                  Lên lịch
                </Button>
              </>
            ) : state === 'archived' ? (
              <Button
                disabled={busy}
                onClick={() =>
                  void s
                    .getState()
                    .restore(examId)
                    .then((e) =>
                      push(
                        e ? e.message : 'Đã khôi phục bài thi về Đã đóng.',
                        e ? 'warn' : 'success',
                      ),
                    )
                }
              >
                Khôi phục
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => void doSave()}>
                Lưu thay đổi
              </Button>
            )}
            <div className="xm-acts__more">
              {exam && state !== 'draft' && (
                <Link className="btn btn--ghost btn--sm" to={examResultsPath(exam.id)}>
                  Xem kết quả
                </Link>
              )}
              {exam && (state === 'scheduled' || state === 'open') && !exam.locked && (
                <Button size="sm" variant="ghost" onClick={() => setConfirm('unschedule')}>
                  Hủy lịch
                </Button>
              )}
              {exam && state === 'closed' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void s
                      .getState()
                      .archive(exam.id)
                      .then((e) =>
                        push(
                          e
                            ? e.message
                            : `Đã lưu trữ “${exam.name}” — bài nộp và điểm được giữ nguyên.`,
                          e ? 'warn' : 'success',
                        ),
                      )
                  }
                >
                  Lưu trữ
                </Button>
              )}
              {exam && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void s
                      .getState()
                      .duplicate(exam.id)
                      .then((copy) => {
                        if (!copy) return;
                        push('Đã nhân bản bài thi — bản sao ở trạng thái Nháp.', 'success');
                        navigate(examPath(copy));
                      })
                  }
                >
                  Nhân bản
                </Button>
              )}
              {exam && !exam.locked && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="xm-danger"
                  onClick={() => setConfirm('delete')}
                >
                  Xóa
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === 'unschedule'}
        title="Hủy lịch?"
        message={M.unscheduleConfirm(exam?.name ?? '')}
        confirmLabel="Hủy lịch"
        cancelLabel="Giữ lịch"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void unschedule();
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Xóa bài thi?"
        message={M.deleteConfirm(exam?.name ?? '')}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          if (!exam) return;
          void s
            .getState()
            .remove(exam.id)
            .then((e) => {
              if (e) {
                push(e.message, 'warn');
                void load(exam.id);
                return;
              }
              // Nothing left to lose: the exam is gone.
              s.setState({ saved: JSON.stringify(s.getState().work) });
              push(M.deleted, 'success');
              navigate(examsPath);
            });
        }}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Rời trang?"
        message={M.leaveConfirm}
        confirmLabel="Rời trang"
        cancelLabel="Ở lại"
        tone="danger"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </section>
  );
}
