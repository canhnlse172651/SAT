import {
  RANKING_MESSAGES as M,
  type ScoreBreakdown,
  type SetScoreRow,
  formatDay,
  formatScore,
  formatVnDateTime,
  formulaText,
} from '@sat/shared';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../components';
import { setResultPath } from '../classes/paths';
import { myExamResultPath } from '../exams/paths';
import { Chip } from './rank-bits';
import { EXAM_STATUS, SET_STATUS, gotText } from './rank-format';

/** A row that opens a screen only when the item has a submission (AC-11.4, AC-11.11, AC-11.12). */
function Row({
  to,
  title,
  sub,
  right,
}: {
  to: string | null;
  title: string;
  sub: ReactNode;
  right: string;
}) {
  const body = (
    <>
      <span className="rk-row__main">
        <span className="rk-row__title">{title}</span>
        <span className="rk-row__sub">{sub}</span>
      </span>
      <span className="rk-row__pts">{right}</span>
    </>
  );
  return to ? (
    <Link className="rk-row rk-row--link" to={to}>
      {body}
    </Link>
  ) : (
    <div className="rk-row" aria-disabled="true">
      {body}
    </div>
  );
}

/** S09 "Điểm của tôi" (REQ-11, AC-13.5). */
export function MyScore({
  classId,
  mine,
  rank,
  total,
}: {
  classId: string;
  mine: ScoreBreakdown;
  rank: number | null;
  total: number;
}) {
  const groups: { lessonId: string; lessonName: string; rows: SetScoreRow[] }[] = [];
  for (const r of mine.sets) {
    const g = groups.at(-1);
    if (g?.lessonId === r.lessonId) g.rows.push(r);
    else groups.push({ lessonId: r.lessonId, lessonName: r.lessonName, rows: [r] });
  }
  return (
    <div className="rk-mine">
      <section className="rk-hero" aria-label="Tóm tắt Điểm của tôi">
        <div className="rk-hero__top">
          <div>
            <div className="rk-hero__label">Điểm xếp hạng</div>
            <div className="rk-hero__big num">{formatScore(mine.score)}</div>
          </div>
          <span className={`rk-hero__rank${rank ? ' rk-hero__rank--on' : ''}`}>
            {rank ? M.position(rank, total) : M.noRank}
          </span>
        </div>
        <p className="rk-hero__formula num">{formulaText(mine.avgEx, mine.avgExam, mine.score)}</p>
        <div className="rk-hero__grid">
          <div className="rk-cell">
            <span className="rk-cell__l">TB bài tập</span>
            <span className="rk-cell__v num">{formatScore(mine.avgEx)}</span>
            <span className="rk-cell__l">{mine.nEx} bộ được tính</span>
          </div>
          <div className="rk-cell">
            <span className="rk-cell__l">TB bài thi</span>
            <span className="rk-cell__v num">{formatScore(mine.avgExam)}</span>
            <span className="rk-cell__l">{mine.nExam} bài thi được tính</span>
          </div>
          <div className="rk-cell">
            <span className="rk-cell__l">Bộ bài tập đã nộp</span>
            <span className="rk-cell__v num">
              {mine.submitted}/{mine.withDeadline}
            </span>
            <span className="rk-cell__l">bộ có hạn nộp</span>
          </div>
        </div>
      </section>

      <h2 className="rk-sec">Bài tập</h2>
      {groups.length ? (
        groups.map((g) => (
          <section key={g.lessonId} aria-label={g.lessonName}>
            <h3 className="rk-bai">{g.lessonName}</h3>
            {g.rows.map((r) => {
              const st = SET_STATUS[r.status];
              const done = r.status === 'done';
              return (
                <Row
                  key={r.id}
                  to={done ? setResultPath(classId, r.id) : null}
                  title={r.title || 'Bộ bài tập'}
                  right={r.points === null ? '—' : `${r.points}/100`}
                  sub={
                    <>
                      <Chip {...st} />
                      {r.status === 'todo' && r.deadline && (
                        <span className="small">Hạn nộp {formatDay(r.deadline)}</span>
                      )}
                      {done && r.late && <Chip label="Nộp muộn" tone="pending" />}
                      {done && r.got !== null && r.max !== null && (
                        <span className="num">{gotText(r.got, r.max, r.points ?? 0)}</span>
                      )}
                    </>
                  }
                />
              );
            })}
          </section>
        ))
      ) : (
        <p className="rk-empty">{M.noSets}</p>
      )}
      {mine.hidden && (
        <p className="rk-line" role="note">
          <Icon name="eyeoff" size={16} />
          <span>{M.hiddenLine(mine.hidden.k, mine.hidden.sum)}</span>
        </p>
      )}

      <h2 className="rk-sec">Bài thi</h2>
      {mine.exams.length ? (
        mine.exams.map((x) => {
          const done = x.status === 'done';
          return (
            <Row
              key={x.id}
              to={done ? myExamResultPath(x.id) : null}
              title={x.name}
              right={x.points === null ? '—' : `${x.points}/100`}
              sub={
                <>
                  <Chip {...EXAM_STATUS[x.status]} />
                  {x.closesAt && (
                    <span className="small">Đóng {formatVnDateTime(new Date(x.closesAt))}</span>
                  )}
                  {done && x.got !== null && x.max !== null && (
                    <span className="num">{gotText(x.got, x.max, x.points ?? 0)}</span>
                  )}
                </>
              }
            />
          );
        })
      ) : (
        <p className="rk-empty">{M.noExams}</p>
      )}
      {mine.gone && (
        <p className="rk-line" role="note">
          <Icon name="archive" size={16} />
          <span>{M.goneLine(mine.gone.k, mine.gone.sum)}</span>
        </p>
      )}
    </div>
  );
}
