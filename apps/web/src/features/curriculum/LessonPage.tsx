import {
  CURRICULUM_LIMITS,
  CURRICULUM_MESSAGES as M,
  SECTIONS,
  SECTION_TITLES,
  formatVnDateTime,
  usedByNotice,
} from '@sat/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Button, ErrorState, Icon, Skeleton, StatusChip } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { Notice } from '../auth/Notice';
import { ActionMenu } from './ActionMenu';
import { AiChip } from './AiChip';
import { AiPanelFrame } from './AiPanelFrame';
import { Crumbs } from './Crumbs';
import { useCurriculumStore } from './curriculum-store';
import { isNotFound } from './errors';
import { curriculaPath, curriculumPath, editorPath } from './paths';
import { hasDrafts, sectionSummary } from './lesson-utils';
import { lessonRefOf, useLessonActions } from './use-lesson-actions';
import './curriculum.css';

/** T18 "Soạn bài": header + panel Thủ công (summary, "Soạn thủ công") + panel "Tạo bằng AI" (REQ-7, REQ-11). */
export function LessonPage() {
  const { curriculumId = '', lessonId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useCurriculumStore((s) => s.lessonStatus);
  const lesson = useCurriculumStore((s) => s.lesson);
  const loadLesson = useCurriculumStore((s) => s.loadLesson);
  const [missingId, setMissingId] = useState<string | null>(null);
  const aiPanel = useRef<HTMLElement>(null);
  useDocumentTitle(lesson?.name ?? 'Soạn bài');

  const refresh = useCallback(() => {
    loadLesson(lessonId).catch((err: unknown) => {
      if (isNotFound(err)) setMissingId(lessonId);
    });
  }, [loadLesson, lessonId]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  const missing = missingId === lessonId;

  const actions = useLessonActions({
    curriculumId,
    usedBy: lesson?.usedBy ?? 0,
    refresh,
    leaveAfterDelete: true,
  });

  const ready = !!lesson && lesson.id === lessonId && lesson.curriculumId === curriculumId;

  // AC-7.8: back from T07, focus "Soạn thủ công"; AC-11.4: "#tao-bang-ai" focuses the AI panel.
  const fromEditor = (location.state as { fromEditor?: boolean } | null)?.fromEditor;
  useEffect(() => {
    if (!ready) return;
    if (location.hash === '#tao-bang-ai') aiPanel.current?.focus();
    else if (fromEditor) document.getElementById('t18-manual-cta')?.focus();
  }, [ready, fromEditor, location.hash]);

  if (missing || (lesson && lesson.id === lessonId && lesson.curriculumId !== curriculumId)) {
    return <NotFoundPage />;
  }
  if (status === 'error' && !lesson) return <ErrorState title="Không tải được bài." />;
  if (!ready) return <Skeleton height={320} />;

  const full = lesson.lessonCount >= CURRICULUM_LIMITS.lessonsPerCurriculum;
  const copying = actions.duplicating.includes(lesson.id);
  const noVisible =
    lesson.status === 'published' && !lesson.items.some((i) => i.status === 'published');

  return (
    <section aria-labelledby="t18-title" data-screen="T18">
      <Crumbs
        items={[
          { label: 'Giáo trình', to: curriculaPath },
          { label: lesson.curriculumName, to: curriculumPath(curriculumId) },
          { label: lesson.name },
        ]}
      />
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t18-title" className="page-title cur-title">
            {lesson.name} <StatusChip status={lesson.status} />
          </h1>
          <div className="page-sub cur-sub">
            {lesson.ai && (
              <AiChip label={lesson.ai} curriculumId={curriculumId} lessonId={lesson.id} />
            )}
            {lesson.hasLearningData && <span className="chip chip--info">Có dữ liệu học viên</span>}
            <span>
              Bài {lesson.position}/{lesson.lessonCount} · {lesson.curriculumName}
            </span>
          </div>
        </div>
        <div className="page-head__actions">
          {hasDrafts(lesson) && (
            <Button onClick={() => actions.publish(lesson.id)}>
              <Icon name="check" size={18} />
              Xuất bản bài
            </Button>
          )}
          <ActionMenu
            label="Thao tác với bài"
            actions={[
              {
                label: 'Đổi tên',
                icon: 'edit',
                onSelect: () => actions.rename(lessonRefOf(lesson)),
              },
              {
                label: copying ? M.duplicating : 'Nhân bản bài',
                icon: 'copy',
                disabled: full || copying,
                title: full ? M.lessonLimit : undefined,
                onSelect: () => actions.duplicate(lessonRefOf(lesson)),
              },
              {
                label: 'Xóa bài',
                icon: 'trash',
                danger: true,
                separated: true,
                onSelect: () => actions.remove(lessonRefOf(lesson)),
              },
            ]}
          />
        </div>
      </div>
      {lesson.usedBy > 0 && (
        <Notice tone="info" className="cur-notice">
          {usedByNotice(lesson.usedBy)}
        </Notice>
      )}
      {noVisible && (
        <Notice tone="warn" className="cur-notice">
          {M.noVisibleContent}
        </Notice>
      )}

      <div className="cur-editor-grid">
        <section className="cur-panel" aria-labelledby="t18-manual">
          <div className="cur-panel__head">
            <Icon name="edit" size={18} />
            <h2 id="t18-manual">Thủ công</h2>
            <span className="small muted">
              Soạn bước học và bộ bài tập của bài trong một màn, hai tab Bài học | Bài tập.
            </span>
          </div>
          <div className="cur-panel__body">
            {SECTIONS.map((section) => {
              const items = lesson.items.filter((i) => i.section === section);
              const updated = lesson.sectionUpdatedAt[section];
              return (
                <section
                  key={section}
                  className="cur-sum"
                  aria-label={`Phần ${SECTION_TITLES[section]}`}
                >
                  <Icon name={section === 'lesson' ? 'book' : 'grade'} size={16} />
                  <strong>{SECTION_TITLES[section]}</strong>
                  {items.length ? (
                    <span className="cur-sum__text">{sectionSummary(lesson.items, section)}</span>
                  ) : (
                    <span className="cur-sum__text muted">
                      {section === 'lesson' ? M.noStepsYet : M.noSetsYet}
                    </span>
                  )}
                  {updated && items.length > 0 && (
                    <span className="small muted-3">
                      Cập nhật {formatVnDateTime(new Date(updated))}
                    </span>
                  )}
                </section>
              );
            })}
            <Button
              id="t18-manual-cta"
              className="cur-panel__cta"
              onClick={() => navigate(editorPath(curriculumId, lesson.id, 'lesson'))}
            >
              <Icon name="edit" size={18} />
              Soạn thủ công
            </Button>
          </div>
        </section>
        <AiPanelFrame ref={aiPanel} lesson={lesson} />
      </div>
      {actions.dialogs}
    </section>
  );
}
