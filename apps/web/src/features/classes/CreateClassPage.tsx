import { CLASS_MESSAGES as M, createdMessage, formatDay, vnDay } from '@sat/shared';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useSearchParams } from 'react-router';
import { Button, ConfirmDialog, HskBadge, Icon } from '../../components';
import { ApiError } from '../../lib/api-client';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NETWORK_ERROR } from '../auth/form-errors';
import { useToastStore } from '../toast/toast-store';
import { type InfoErrors, validateInfo } from './class-info';
import { ClassInfoFields } from './ClassInfoFields';
import { ClassStatusChip } from './ClassBits';
import { useClassWizardStore, WIZARD_STEPS, type WizardStep } from './class-wizard-store';
import { useClassesStore } from './classes-store';
import { CurriculumPicker } from './CurriculumPicker';
import { detailsOf, hasCode, messageOf } from './errors';
import { classPath, classesPath } from './paths';
import { StudentPicker } from './StudentPicker';
import './classes.css';

const clampStep = (n: number, max: WizardStep): WizardStep =>
  Math.min(Math.max(1, Number.isFinite(n) ? Math.trunc(n) : 1), max) as WizardStep;

/** T03 Tạo lớp mới — wizard of 4 steps (REQ-1 … REQ-5). The step is in the URL so Back goes one step back. */
export function CreateClassPage() {
  useDocumentTitle('Tạo lớp mới');
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const [params, setParams] = useSearchParams();
  const reached = useClassWizardStore((s) => s.step);
  const setReached = useClassWizardStore((s) => s.setStep);
  const info = useClassWizardStore((s) => s.info);
  const setInfo = useClassWizardStore((s) => s.setInfo);
  const selected = useClassWizardStore((s) => s.selected);
  const select = useClassWizardStore((s) => s.select);
  const unselect = useClassWizardStore((s) => s.unselect);
  const curriculum = useClassWizardStore((s) => s.curriculum);
  const setCurriculum = useClassWizardStore((s) => s.setCurriculum);
  const createKey = useClassWizardStore((s) => s.createKey);
  const isDirty = useClassWizardStore((s) => s.isDirty);
  const reset = useClassWizardStore((s) => s.reset);
  const nameAvailable = useClassesStore((s) => s.nameAvailable);
  const createClass = useClassesStore((s) => s.create);

  const today = vnDay(new Date());
  const [errors, setErrors] = useState<InfoErrors>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const leaving = useRef(false);
  const creating = useRef(false);

  // A fresh wizard every time T03 opens: nothing is kept or restored (AC-1.6, spec §9).
  useEffect(() => {
    reset();
    leaving.current = false;
  }, [reset]);

  const step = clampStep(Number(params.get('buoc') ?? 1), reached);
  useEffect(() => {
    if (!leaving.current && String(step) !== (params.get('buoc') ?? '1'))
      setParams({ buoc: String(step) }, { replace: true });
  }, [step, params, setParams]);

  // AC-1.5: leaving T03 (menu, Back on step 1, Hủy) after entering anything asks first.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !leaving.current && isDirty() && currentLocation.pathname !== nextLocation.pathname,
  );
  // AC-1.6: closing or reloading the tab asks the browser's question.
  const dirty = isDirty();
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  /**
   * The wizard's history is always [step 1 … current step]: "Tiếp tục" pushes the next step, every move back ("Quay lại",
   * the progress bar, "Sửa", re-validation) goes back through that history. So the browser's Back on steps 2–4 always
   * lands on the step before (AC-1.3) and never on a step the GV came back from.
   */
  const goTo = (n: WizardStep) => {
    setStepError(null);
    if (n < step) void navigate(n - step);
    else if (n > step) setParams({ buoc: String(n) });
  };

  const next = async () => {
    if (busy) return;
    setStepError(null);
    if (step === 1) {
      const found = validateInfo(info, today);
      if (!found.name) {
        try {
          if (!(await nameAvailable(info.name.trim()))) found.name = M.nameTaken;
        } catch {
          push(NETWORK_ERROR, 'error');
          return;
        }
      }
      setErrors(found);
      if (Object.keys(found).length) return;
    }
    if (step === 3 && !curriculum) {
      setStepError(M.curriculumRequired);
      return;
    }
    const to = (step + 1) as WizardStep;
    setReached(Math.max(reached, to) as WizardStep);
    goTo(to);
  };

  const create = async () => {
    // A ref, not the `busy` state: clicks in a row arrive before React re-renders (AC-5.6).
    if (creating.current || leaving.current || !curriculum || !info.startDate) return;
    creating.current = true;
    setBusy(true);
    setStepError(null);
    try {
      const created = await createClass({
        name: info.name,
        startDate: vnDay(info.startDate),
        description: info.description,
        schedule: info.schedule,
        curriculumId: curriculum.id,
        studentIds: selected.map((s) => s.id),
        createKey,
      });
      leaving.current = true;
      push(createdMessage(created.name), 'success');
      navigate(classPath(created.id), { replace: true });
    } catch (err) {
      if (leaving.current) return; // the class exists and T04 is open: a late failure changes nothing
      // AC-5.4: back to the earliest step that is no longer valid, keeping the rest.
      if (hasCode(err, 'CLASS_NAME_TAKEN')) {
        setErrors({ name: M.nameTaken });
        goTo(1);
      } else if (hasCode(err, 'STUDENTS_MISSING')) {
        for (const id of detailsOf<{ missingIds: string[] }>(err).missingIds ?? []) unselect(id);
        goTo(2);
        setStepError(messageOf(err));
      } else if (hasCode(err, 'CURRICULUM_UNAVAILABLE')) {
        setCurriculum(null);
        goTo(3);
        setStepError(M.curriculumUnavailable);
      } else {
        setStepError(err instanceof ApiError && err.status < 500 ? err.message : M.createFailed);
      }
    } finally {
      creating.current = false;
      setBusy(false);
    }
  };

  const startDay = info.startDate ? vnDay(info.startDate) : null;
  const summaryRow = (label: string, value: ReactNode, edit: WizardStep) => (
    <div className="cls-sum-row">
      <span className="cls-sum-row__k">{label}</span>
      <div className="grow">{value}</div>
      <Button variant="ghost" size="sm" onClick={() => goTo(edit)} aria-label={`Sửa ${label}`}>
        Sửa
      </Button>
    </div>
  );

  return (
    <section aria-labelledby="t03-title" data-screen="T03">
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t03-title" className="page-title">
            Tạo lớp mới
          </h1>
          <div className="page-sub">
            Bước {step}/4 · {WIZARD_STEPS[step - 1]}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="cls-wiz-head">
          <ol className="cls-stepper" aria-label="Các bước tạo lớp">
            {WIZARD_STEPS.map((label, i) => {
              const n = (i + 1) as WizardStep;
              const state = n < step ? 'done' : n === step ? 'cur' : '';
              const inner = (
                <>
                  <span className="cls-stepper__no">
                    {n < step ? <Icon name="check" size={14} /> : n}
                  </span>
                  <span>{label}</span>
                </>
              );
              return (
                <li
                  key={label}
                  className={`cls-stepper__step ${state}`}
                  aria-current={n === step ? 'step' : undefined}
                >
                  {n < step ? (
                    <button
                      type="button"
                      className="cls-stepper__btn"
                      aria-label={`Quay lại bước ${n}: ${label}`}
                      onClick={() => goTo(n)}
                    >
                      {inner}
                    </button>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="cls-wiz-body">
          {step === 1 && (
            <div className="cls-wiz-narrow">
              <h2 className="cls-wiz-title">Thông tin lớp</h2>
              <ClassInfoFields
                info={info}
                onChange={(patch) => {
                  setInfo(patch);
                  setErrors((e) => ({
                    ...e,
                    ...('name' in patch ? { name: undefined } : {}),
                    ...('startDate' in patch ? { startDate: undefined } : {}),
                  }));
                }}
                errors={errors}
                today={today}
                startsNowNotice
              />
            </div>
          )}
          {step === 2 && (
            <>
              {stepError && (
                <p className="err-msg" role="alert">
                  {stepError}
                </p>
              )}
              <StudentPicker selected={selected} onSelect={select} onUnselect={unselect} />
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="cls-wiz-title">Chọn giáo trình cho lớp</h2>
              <CurriculumPicker
                value={curriculum}
                onChange={(c) => {
                  setCurriculum(c);
                  setStepError(null);
                }}
                error={stepError}
              />
            </>
          )}
          {step === 4 && curriculum && startDay && (
            <div className="cls-wiz-wide">
              <h2 className="cls-wiz-title">Kiểm tra lại trước khi tạo</h2>
              {stepError && (
                <p className="err-msg" role="alert">
                  {stepError}
                </p>
              )}
              {!selected.length && (
                <div className="cls-callout cls-callout--warn">{M.emptyClassWarning}</div>
              )}
              {curriculum.publishedLessonCount === 0 && (
                <div className="cls-callout cls-callout--warn">{M.noPublishedLessons}</div>
              )}
              {summaryRow('Tên lớp', <span className="strong">{info.name.trim()}</span>, 1)}
              {summaryRow(
                'Ngày bắt đầu',
                <span className="cls-sum-inline">
                  <span className="strong">{formatDay(startDay)}</span>· trạng thái ban đầu
                  <ClassStatusChip status={startDay > today ? 'upcoming' : 'active'} />
                </span>,
                1,
              )}
              {summaryRow('Mô tả', info.description.trim() || <span className="muted">—</span>, 1)}
              {summaryRow('Lịch học', info.schedule.trim() || <span className="muted">—</span>, 1)}
              {summaryRow(
                `Học viên (${selected.length})`,
                selected.length ? (
                  <span className="cls-sum-chips">
                    {selected.map((s) => (
                      <span key={s.id} className="chip chip--todo">
                        {s.displayName}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="muted">Chưa có</span>
                ),
                2,
              )}
              {summaryRow(
                'Giáo trình',
                <>
                  <span className="cls-cur">
                    <HskBadge level={curriculum.hsk} />
                    <span className="strong">{curriculum.name}</span>
                  </span>
                  <div className="small muted">
                    {curriculum.publishedLessonCount} bài đã xuất bản
                  </div>
                </>,
                3,
              )}
            </div>
          )}
        </div>
        <div className="cls-wiz-foot">
          <Button variant="ghost" onClick={() => navigate(classesPath)}>
            Hủy
          </Button>
          <span className="grow" />
          {step > 1 && (
            <Button variant="outline" onClick={() => goTo((step - 1) as WizardStep)}>
              Quay lại
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => void next()}>Tiếp tục ›</Button>
          ) : (
            <Button loading={busy} onClick={() => void create()}>
              Tạo lớp
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={M.leaveTitle}
        message=""
        confirmLabel="Bỏ"
        cancelLabel="Ở lại"
        tone="danger"
        onConfirm={() => {
          leaving.current = true;
          blocker.proceed?.();
          reset();
        }}
        onCancel={() => blocker.reset?.()}
      />
    </section>
  );
}
