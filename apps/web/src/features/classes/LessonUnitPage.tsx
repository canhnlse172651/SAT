import {
  CLASS_MESSAGES as M,
  LEARNER_SET_LABELS,
  LESSON_LABELS,
  type LearnerSet,
  endedBanner,
  formatPoints,
} from '@sat/shared';
import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ErrorState, Icon, Skeleton, Tabs } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { ProgressLine } from './ClassBits';
import { useMyClassesStore } from './my-classes-store';
import { myClassPath, setPath, setResultPath, stepPath } from './paths';
import { isNotFound, isNotStarted, useHvRefusal } from './use-hv-refusal';
import './classes.css';

const STATUS_TONE: Record<LearnerSet['status'], string> = {
  done: 'chip--done',
  closed: 'chip--todo',
  overdue: 'chip--danger',
  doing: 'chip--info',
  todo: 'chip--todo',
};

function SetRow({ classId, set, n }: { classId: string; set: LearnerSet; n: number }) {
  const questions = <span className="small">{set.questionCount} câu</span>;
  // AC-19.9: a set without a deadline is shown disabled and opens nothing.
  if (set.status === 'closed')
    return (
      <div
        className="hv-row is-closed"
        role="group"
        aria-disabled="true"
        aria-label={`${set.title} — Chưa mở`}
      >
        <span className="hv-row__no">{n}</span>
        <span className="hv-row__main">
          <span className="hv-row__title">{set.title}</span>
          <span className="hv-row__chips">
            {questions}
            <span className="chip chip--todo">
              <Icon name="lock" size={12} />
              {LEARNER_SET_LABELS.closed}
            </span>
          </span>
          <span className="small muted">{M.noTeacherDeadline}</span>
        </span>
        <Icon name="lock" size={16} />
      </div>
    );
  const done = set.status === 'done';
  return (
    <Link to={done ? setResultPath(classId, set.id) : setPath(classId, set.id)} className="hv-row">
      <span className={`hv-row__no ${done ? 'is-ok' : ''}`}>
        {done ? <Icon name="check" size={14} /> : n}
      </span>
      <span className="hv-row__main">
        <span className="hv-row__title">{set.title}</span>
        <span className="hv-row__chips">
          {questions}
          <span className={`chip ${STATUS_TONE[set.status]}`}>
            {done && set.score !== null && set.maxScore !== null
              ? `${LEARNER_SET_LABELS.done} · ${formatPoints(set.score)} / ${formatPoints(set.maxScore)}`
              : LEARNER_SET_LABELS[set.status]}
          </span>
          {set.deadlineLabel && (
            <span
              className={`chip ${set.deadlineLabel === 'Hạn hôm nay' ? 'chip--pending' : 'chip--todo'}`}
            >
              {set.deadlineLabel}
            </span>
          )}
          {done && set.late && <span className="chip chip--pending">Nộp muộn</span>}
        </span>
      </span>
      <Icon name="fwd" size={18} />
    </Link>
  );
}

/** S11 Trang bài (REQ-19, REQ-23): the Bài học and Bài tập tabs of one Bài for one class. */
export function LessonUnitPage() {
  const { classId = '', lessonId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const status = useMyClassesStore((s) => s.unitStatus);
  const unit = useMyClassesStore((s) => s.unit);
  const error = useMyClassesStore((s) => s.error);
  const load = useMyClassesStore((s) => s.loadUnit);
  useDocumentTitle(unit?.lesson.name ?? 'Trang bài');
  useHvRefusal(error);

  useEffect(() => {
    void load(classId, lessonId);
  }, [classId, lessonId, load]);

  const back = { to: myClassPath(classId), label: 'Về trang lớp' };
  if (status === 'error' && isNotFound(error)) return <NotFoundPage back={back} />;
  if (status === 'error' && isNotStarted(error))
    return (
      <div className="hv-pad" data-screen="S11">
        <div className="cls-callout" role="status">
          {error.message}
        </div>
        <Link to={back.to}>{back.label}</Link>
      </div>
    );
  if (status === 'error' && !unit) return <ErrorState title="Không tải được bài." />;
  if (!unit || unit.lesson.id !== lessonId) return <Skeleton height={240} />;

  const tabs = [
    ...(unit.steps.length
      ? [
          {
            id: 'bai-hoc',
            label: 'Bài học',
            count: unit.steps.length,
            content: (
              <ul className="hv-list">
                {unit.steps.map((s, i) => (
                  <li key={s.id}>
                    <Link to={stepPath(classId, s.id)} className="hv-row">
                      <span className="hv-row__no">{i + 1}</span>
                      <span className="hv-row__main">
                        <span className="hv-row__title">{s.title}</span>
                      </span>
                      <Icon name="fwd" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    ...(unit.sets.length
      ? [
          {
            id: 'bai-tap',
            label: 'Bài tập',
            count: unit.sets.length,
            content: (
              <ul className="hv-list">
                {unit.sets.map((s, i) => (
                  <li key={s.id}>
                    <SetRow classId={classId} set={s} n={i + 1} />
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
  ];
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab')! : tabs[0]?.id;

  return (
    <div data-screen="S11">
      {unit.classStatus === 'ended' && unit.endDate && (
        <div className="hv-banner" role="status">
          {endedBanner(unit.endDate)}
        </div>
      )}
      <div className="hv-unit-head">
        <Link to={myClassPath(classId)} className="hv-back">
          <Icon name="back" size={18} />
          {unit.className}
        </Link>
        <h2 className="hv-title">{unit.lesson.name}</h2>
        {unit.progress ? (
          <ProgressLine progress={unit.progress} />
        ) : (
          unit.label && (
            <span className="chip chip--todo">
              {unit.label === 'closed' && <Icon name="lock" size={12} />}
              {LESSON_LABELS[unit.label === 'noContent' ? 'noExercise' : unit.label]}
            </span>
          )
        )}
      </div>
      {tabs.length === 0 || !tab ? (
        <p className="muted hv-pad">{M.lessonEmpty}</p>
      ) : (
        <>
          <Tabs
            aria-label="Phần của bài"
            value={tab}
            onChange={(id) => setParams({ tab: id }, { replace: true })}
            items={tabs}
          />
          <p className="small muted hv-pad">
            Mở mục bất kỳ theo thứ tự nào. Chỉ bài tập được tính vào tiến độ.
            {unit.sets.some((s) => s.status === 'closed') &&
              ' Bộ bài tập “Chưa mở” mở khi giáo viên đặt hạn nộp cho lớp.'}
          </p>
        </>
      )}
    </div>
  );
}
