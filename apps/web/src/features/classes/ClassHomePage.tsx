import {
  CLASS_MESSAGES as M,
  LESSON_LABELS,
  SECTION_NAMES,
  endedBanner,
  formatDay,
  upcomingMessage,
} from '@sat/shared';
import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ErrorState, HskBadge, Icon, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { ClassStatusChip, ProgressLine } from './ClassBits';
import { MembersList } from './MembersSheet';
import { useMyClassesStore } from './my-classes-store';
import { examsPath, myLessonPath, rankingPath } from './paths';
import { useHvRefusal } from './use-hv-refusal';
import './classes.css';

/** S02 Trang lớp (REQ-13, REQ-14, REQ-20): the Bài of the class with the HV's exercise progress. */
export function ClassHomePage() {
  const { classId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const status = useMyClassesStore((s) => s.pageStatus);
  const page = useMyClassesStore((s) => s.page);
  const error = useMyClassesStore((s) => s.error);
  const load = useMyClassesStore((s) => s.loadPage);
  useDocumentTitle(page?.name ?? 'Trang lớp');
  useHvRefusal(error);
  const showMembers = params.get('xem') === 'thanh-vien';

  useEffect(() => {
    void load(classId);
  }, [classId, load]);

  if (status === 'error' && !page) return <ErrorState title="Không tải được trang lớp." />;
  if (!page || page.id !== classId) return <Skeleton height={240} />;

  if (showMembers && page.status !== 'upcoming')
    return <MembersList classId={classId} onBack={() => setParams({})} />;

  return (
    <div data-screen="S02">
      {page.status === 'ended' && page.endDate && (
        <div className="hv-banner" role="status">
          {endedBanner(page.endDate)}
        </div>
      )}
      <div className="hv-pad">
        <h2 className="hv-title">{page.name}</h2>
        <div className="hv-info small muted">
          <ClassStatusChip status={page.status} />
          <span>Bắt đầu {formatDay(page.startDate)}</span>
          <span className="cls-cur">
            <HskBadge level={page.curriculum.hsk} /> {page.curriculum.name}
          </span>
          {page.schedule && <span>{page.schedule}</span>}
        </div>
      </div>

      {page.status === 'upcoming' || !page.lessons ? (
        <div className="cls-callout hv-pad-x" role="status">
          {upcomingMessage(page.startDate)}
        </div>
      ) : (
        <>
          <section className="hv-card" aria-labelledby="s02-progress">
            <div className="hv-card__head">
              <h3 id="s02-progress" className="strong">
                Tiến độ bài tập của tôi
              </h3>
              <Link to={rankingPath}>Bảng xếp hạng ›</Link>
            </div>
            {page.progress && page.progress.total > 0 ? (
              <ProgressLine progress={page.progress} />
            ) : (
              <span className="small muted">
                {page.lessons.some((l) => l.sections.includes('exercise'))
                  ? M.exercisesClosed
                  : M.noExercise}
              </span>
            )}
          </section>

          {page.memberCount !== null && (
            <button
              type="button"
              className="hv-row"
              onClick={() => setParams({ xem: 'thanh-vien' })}
            >
              <span className="hv-row__ic">
                <Icon name="users" size={20} />
              </span>
              <span className="hv-row__main">
                <span className="hv-row__title">Thành viên ({page.memberCount})</span>
                <span className="small muted">Xem hồ sơ bạn cùng lớp</span>
              </span>
              <Icon name="fwd" size={18} />
            </button>
          )}
          {page.examCount > 0 && (
            <Link to={examsPath} className="hv-row">
              <span className="hv-row__ic">
                <Icon name="grade" size={20} />
              </span>
              <span className="hv-row__main">
                <span className="hv-row__title">Bài thi của lớp ({page.examCount})</span>
              </span>
              <Icon name="fwd" size={18} />
            </Link>
          )}

          <h3 className="hv-sec-title">Các bài</h3>
          {page.lessons.length === 0 ? (
            <p className="muted hv-pad">{M.noLessons}</p>
          ) : (
            <ul className="hv-list">
              {page.lessons.map((l, i) => (
                <li key={l.id}>
                  <Link to={myLessonPath(classId, l.id)} className="hv-row">
                    <span className="hv-row__no">{i + 1}</span>
                    <span className="hv-row__main">
                      <span className="hv-row__title">{l.name}</span>
                      <span className="hv-row__chips">
                        {l.sections.map((s) => (
                          <span key={s} className="chip chip--todo">
                            {SECTION_NAMES[s]}
                          </span>
                        ))}
                      </span>
                      {l.progress ? (
                        <ProgressLine progress={l.progress} />
                      ) : (
                        l.label && (
                          <span
                            className={`chip ${l.label === 'closed' ? 'chip--pending' : 'chip--todo'}`}
                          >
                            {l.label === 'closed' && <Icon name="lock" size={12} />}
                            {LESSON_LABELS[l.label]}
                          </span>
                        )
                      )}
                    </span>
                    <Icon name="fwd" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
