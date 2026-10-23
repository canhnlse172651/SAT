import {
  CURRICULUM_MESSAGES as M,
  type Item,
  SECTION_TITLES,
  type Section,
  setContentSchema,
  stepContentSchema,
} from '@sat/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Button,
  ErrorState,
  Icon,
  SegmentedControl,
  Skeleton,
  StatusChip,
  Switch,
  Tabs,
} from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { Notice } from '../auth/Notice';
import { Crumbs } from './Crumbs';
import { useCurriculumStore } from './curriculum-store';
import { isNotFound } from './errors';
import { curriculaPath, curriculumPath } from './paths';
import { readPref, writePref } from './session-prefs';
import './curriculum.css';

export type Viewport = 'web' | 'mobile';
/** Shared with the "Xem trước" mode of T20 (010) — AC-16.8. */
export const VIEWPORT_PREF = 'preview.viewport';

/** A step as S03 shows it (interim: text blocks — 004 AC-7.6 rendering replaces it). */
function StepView({ item }: { item: Item }) {
  const content = stepContentSchema.safeParse(item.content);
  return (
    <>
      {(content.success ? content.data.blocks : []).map((b, k) => (
        <p key={k} className="pv-text">
          {b.text}
        </p>
      ))}
    </>
  );
}

/** A set as S05 shows it: every question, answers can be tried, nothing submitted or graded (AC-16.3 … AC-16.5). */
function SetView({
  item,
  answers,
  onAnswer,
}: {
  item: Item;
  answers: Record<string, number>;
  onAnswer: (key: string, option: number) => void;
}) {
  const content = setContentSchema.safeParse(item.content);
  return (
    <ol className="pv-questions">
      {(content.success ? content.data.questions : []).map((q, k) => {
        const key = `${item.id}-${k}`;
        return (
          <li key={key} className="pv-question">
            <fieldset>
              <legend>
                Câu {k + 1}. {q.prompt}
              </legend>
              {q.options.map((opt, o) =>
                opt.trim() ? (
                  <label key={o} className="pv-option">
                    <input
                      type="radio"
                      name={key}
                      checked={answers[key] === o}
                      onChange={() => onAnswer(key, o)}
                    />
                    <span>{opt}</span>
                  </label>
                ) : null,
              )}
            </fieldset>
          </li>
        );
      })}
    </ol>
  );
}

/** T21 "Xem như học viên" — opened only from T06 (REQ-16). Nothing is recorded. */
export function PreviewPage() {
  const { curriculumId = '', lessonId = '' } = useParams();
  const navigate = useNavigate();
  const status = useCurriculumStore((s) => s.lessonStatus);
  const lesson = useCurriculumStore((s) => s.lesson);
  const loadLesson = useCurriculumStore((s) => s.loadLesson);
  const [missingId, setMissingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Section>('lesson');
  // AC-16.2: off every time T21 opens.
  const [withDrafts, setWithDrafts] = useState(false);
  const [viewport, setViewport] = useState<Viewport>(() =>
    readPref<Viewport>(VIEWPORT_PREF, ['web', 'mobile'], 'web'),
  );
  // Tried answers live only on this screen (AC-16.5).
  const [answers, setAnswers] = useState<Record<string, number>>({});
  useDocumentTitle('Xem như học viên');

  const refresh = useCallback(() => {
    loadLesson(lessonId).catch((err: unknown) => {
      if (isNotFound(err)) setMissingId(lessonId);
    });
  }, [loadLesson, lessonId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const missing = missingId === lessonId;

  if (missing || (lesson && lesson.id === lessonId && lesson.curriculumId !== curriculumId)) {
    return <NotFoundPage />;
  }
  if (status === 'error' && !lesson) return <ErrorState title="Không tải được bài." />;
  if (!lesson || lesson.id !== lessonId) return <Skeleton height={320} />;

  const shown = (i: Item) => i.status === 'published' || (withDrafts && i.status === 'draft');
  const itemsOf = (s: Section) => lesson.items.filter((i) => i.section === s && shown(i));

  const exit = () => navigate(curriculumPath(curriculumId), { state: { focusLesson: lesson.id } });

  const panel = (section: Section) => {
    const list = itemsOf(section);
    return (
      <div>
        <div className="cur-rv-bar" role="toolbar" aria-label="Xem như học viên">
          <strong>{SECTION_TITLES[section]}</strong>
          <span className="small muted">{M.previewNote}</span>
          <span className="grow" />
          <Switch checked={withDrafts} onChange={setWithDrafts} label="Gồm cả mục Nháp" />
          <SegmentedControl
            aria-label="Chế độ hiển thị"
            value={viewport}
            onChange={(v) => {
              setViewport(v);
              writePref(VIEWPORT_PREF, v);
            }}
            options={[
              { value: 'web', label: 'Web' },
              { value: 'mobile', label: 'Mobile' },
            ]}
          />
        </div>
        <div className={`pv-frame pv-frame--${viewport}`}>
          <div className="pv-frame__screen" data-viewport={viewport}>
            {list.length === 0 ? (
              <p className="muted pv-empty">
                {section === 'lesson' ? M.noPublishedSteps : M.noPublishedSets}
              </p>
            ) : (
              list.map((item, k) => (
                <article
                  key={item.id}
                  className="pv-item"
                  aria-label={item.title || `Mục ${k + 1}`}
                >
                  <header className="pv-item__head">
                    <h2>{item.title}</h2>
                    {item.status === 'draft' && <StatusChip status="draft" />}
                  </header>
                  {section === 'lesson' ? (
                    <StepView item={item} />
                  ) : (
                    <SetView
                      item={item}
                      answers={answers}
                      onAnswer={(key, o) => setAnswers((a) => ({ ...a, [key]: o }))}
                    />
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section aria-labelledby="t21-title" data-screen="T21">
      <Crumbs
        items={[
          { label: 'Giáo trình', to: curriculaPath },
          { label: lesson.curriculumName, to: curriculumPath(curriculumId) },
          { label: `Xem như học viên · ${lesson.name}` },
        ]}
      />
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t21-title" className="page-title">
            Xem như học viên
          </h1>
          <div className="page-sub cur-sub">
            <strong>{lesson.name}</strong>
            <StatusChip status={lesson.status} />
            <span>{lesson.curriculumName}</span>
          </div>
        </div>
        <div className="page-head__actions">
          <Button onClick={exit}>
            <Icon name="close" size={18} />
            Thoát xem trước
          </Button>
        </div>
      </div>
      {lesson.status === 'draft' && (
        <Notice tone="neutral" className="cur-notice">
          {M.draftLessonNotice}
        </Notice>
      )}
      <Tabs
        aria-label="Phần của bài"
        value={tab}
        onChange={(id) => setTab(id as Section)}
        items={(['lesson', 'exercise'] as const).map((s) => ({
          id: s,
          label: SECTION_TITLES[s],
          count: itemsOf(s).length,
          content: panel(s),
        }))}
      />
    </section>
  );
}
