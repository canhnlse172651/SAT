import {
  RANKING_MESSAGES as M,
  type SetScoreRow,
  type StudentBreakdown,
  formatDay,
  formatScore,
  formatVnDateTime,
  formulaText,
} from '@sat/shared';
import { Chip } from './rank-bits';
import { EXAM_STATUS, SET_STATUS, gotText } from './rank-format';

const FLAG = { hidden: 'Đã ẩn trong lớp', archived: 'Đã lưu trữ', removed: 'Đã gỡ khỏi lớp' };

const counted = (r: { counted: boolean; points: number | null }) =>
  r.counted ? (
    <b className="num">{r.points}/100</b>
  ) : (
    <span className="small muted">{M.notCounted}</span>
  );

/** AC-10.2: the GV's expanded row — every item, labelled, "Không tính" where it does not count. */
export function ScoreBreakdown({ data }: { data: StudentBreakdown }) {
  const groups: { lessonId: string; lessonName: string; rows: SetScoreRow[] }[] = [];
  for (const r of data.sets) {
    const g = groups.at(-1);
    if (g?.lessonId === r.lessonId) g.rows.push(r);
    else groups.push({ lessonId: r.lessonId, lessonName: r.lessonName, rows: [r] });
  }
  return (
    <div className="rk-bk">
      <p className="rk-bk__formula num">{formulaText(data.avgEx, data.avgExam, data.score)}</p>
      <table className="tbl compact">
        <thead>
          <tr>
            <th>Mục</th>
            <th>Trạng thái</th>
            <th>Hạn / giờ đóng</th>
            <th className="r">Bài nộp</th>
            <th className="r">Điểm được tính</th>
          </tr>
        </thead>
        <tbody>
          <tr className="grp">
            <td colSpan={5}>
              Bài tập · TB {formatScore(data.avgEx)} ({data.nEx} bộ được tính)
            </td>
          </tr>
          {groups.length ? (
            groups.flatMap((g) => [
              <tr key={`g-${g.lessonId}`} className="sub-grp">
                <td colSpan={5}>{g.lessonName}</td>
              </tr>,
              ...g.rows.map((r) => (
                <tr key={r.id} className={r.counted ? undefined : 'muted-row'}>
                  <td>
                    {r.title || 'Bộ bài tập'}
                    {r.flag && <span className="rk-flag">{FLAG[r.flag]}</span>}
                  </td>
                  <td>
                    <Chip {...SET_STATUS[r.status]} />
                    {r.late && <Chip label="Nộp muộn" tone="pending" />}
                  </td>
                  <td className="small num">
                    {r.deadline ? `Hạn ${formatDay(r.deadline)}` : 'Chưa đặt hạn'}
                  </td>
                  <td className="r num">
                    {r.got !== null && r.max !== null ? gotText(r.got, r.max, r.points ?? 0) : '—'}
                  </td>
                  <td className="r">{counted(r)}</td>
                </tr>
              )),
            ])
          ) : (
            <tr>
              <td colSpan={5} className="muted small">
                Lớp chưa có bộ bài tập nào.
              </td>
            </tr>
          )}
          <tr className="grp">
            <td colSpan={5}>
              Bài thi · TB {formatScore(data.avgExam)} ({data.nExam} bài thi được tính)
            </td>
          </tr>
          {data.exams.length ? (
            data.exams.map((x) => (
              <tr key={x.id} className={x.counted ? undefined : 'muted-row'}>
                <td>
                  {x.name}
                  {x.flag && <span className="rk-flag">{FLAG[x.flag]}</span>}
                </td>
                <td>
                  <Chip {...EXAM_STATUS[x.status]} />
                </td>
                <td className="small num">
                  {x.closesAt ? `Đóng ${formatVnDateTime(new Date(x.closesAt))}` : '—'}
                </td>
                <td className="r num">
                  {x.got !== null && x.max !== null ? gotText(x.got, x.max, x.points ?? 0) : '—'}
                </td>
                <td className="r">{counted(x)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="muted small">
                {M.noExams}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
