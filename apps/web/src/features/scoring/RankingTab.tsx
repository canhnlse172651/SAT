import { RANKING_MESSAGES as M, foldSearch, formatScore } from '@sat/shared';
import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Avatar, Button, Dialog, ErrorState, Icon, IconButton, Skeleton } from '../../components';
import { RankBadge } from './rank-bits';
import { achievedText, updatedText } from './rank-format';
import { RankInfo } from './RankInfo';
import { useRankingStore } from './ranking-store';
import { ScoreBreakdown } from './ScoreBreakdown';
import './scoring.css';

const MAX_QUERY = 100;
/** T15 Chi tiết học viên (009). */
const studentPath = (id: string) => `/gv/hoc-vien/${id}`;

/** T04 tab "Xếp hạng" (REQ-10, AC-13.1 … AC-13.4). */
export function RankingTab({ classId }: { classId: string }) {
  const table = useRankingStore((s) => s.table);
  const status = useRankingStore((s) => s.tableStatus);
  const details = useRankingStore((s) => s.details);
  const loadTable = useRankingStore((s) => s.loadTable);
  const loadDetail = useRankingStore((s) => s.loadDetail);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [info, setInfo] = useState(false);

  // AC-13.3: opening the tab loads the newest data.
  useEffect(() => {
    void loadTable(classId);
  }, [classId, loadTable]);

  const refresh = () => {
    setOpen(null);
    void loadTable(classId);
  };
  const toggle = (studentId: string) => {
    if (open === studentId) return setOpen(null);
    setOpen(studentId);
    void loadDetail(classId, studentId);
  };

  const q = query.trim();
  const folded = foldSearch(q);
  const rows =
    table?.rows.filter(
      (r) =>
        !folded ||
        foldSearch(r.student.name).includes(folded) ||
        foldSearch(r.student.email).includes(folded),
    ) ?? [];

  const toolbar = (
    <div className="toolbar">
      <div className="inp-search">
        <Icon name="search" size={18} />
        <input
          className="input"
          type="search"
          placeholder="Tìm họ tên hoặc email"
          aria-label="Tìm học viên"
          maxLength={MAX_QUERY}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button variant="outline" onClick={() => setInfo(true)}>
        <Icon name="info" size={18} />
        Cách tính điểm
      </Button>
      <span className="grow" />
      <span className="small muted num">{table ? updatedText(table.loadedAt) : ''}</span>
      <Button variant="ghost" onClick={refresh} disabled={status === 'loading'}>
        <Icon name="refresh" size={16} />
        Làm mới
      </Button>
    </div>
  );

  let body;
  if (status === 'error') body = <ErrorState title={M.loadError} message="" onRetry={refresh} />;
  else if (status === 'notFound')
    body = (
      <div className="card">
        <div className="empty">
          <h3>{M.notFound}</h3>
        </div>
      </div>
    );
  else if (!table) body = <Skeleton height={240} />;
  else if (!table.members)
    body = (
      <div className="card">
        <div className="empty">
          <h3>{M.noStudents}</h3>
        </div>
      </div>
    );
  else if (!rows.length && q)
    body = (
      <div className="card">
        <div className="empty">
          <h3>{M.noMatch(q)}</h3>
        </div>
      </div>
    );
  else
    body = (
      <div className="card tbl-scroll">
        <table className="tbl rk-tbl">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th className="r">TB bài tập</th>
              <th className="r">TB bài thi</th>
              <th className="r">Điểm xếp hạng</th>
              <th>Cập nhật lần cuối</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const expanded = open === r.student.id;
              const detail = details[r.student.id];
              return (
                <Fragment key={r.student.id}>
                  <tr>
                    <td>
                      <RankBadge rank={r.rank} />
                    </td>
                    <td>
                      <span className="rk-tbl__who">
                        <Avatar name={r.student.name} size="sm" />
                        <span className="strong">{r.student.name}</span>
                        {r.student.locked && (
                          <span className="chip chip--danger">
                            <Icon name="lock" size={14} />
                            Đã khóa
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="small muted rk-tbl__email">{r.student.email}</td>
                    <td className="r num">{formatScore(r.avgEx)}</td>
                    <td className="r num">{formatScore(r.avgExam)}</td>
                    <td className="r num rk-tbl__score">{formatScore(r.score)}</td>
                    <td className="small num">{r.achievedAt ? achievedText(r.achievedAt) : '—'}</td>
                    <td className="r">
                      <IconButton
                        size="sm"
                        aria-label={`Chi tiết điểm của ${r.student.name}`}
                        aria-expanded={expanded}
                        icon={<Icon name={expanded ? 'up' : 'down'} size={18} />}
                        onClick={() => toggle(r.student.id)}
                      />
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="rk-tbl__detail">
                      <td />
                      <td colSpan={7}>
                        {detail?.data ? (
                          <ScoreBreakdown data={detail.data} />
                        ) : detail?.status === 'loading' ? (
                          <Skeleton height={120} />
                        ) : (
                          <ErrorState
                            title={M.loadError}
                            message=""
                            onRetry={() => void loadDetail(classId, r.student.id)}
                          />
                        )}
                        <Link className="link" to={studentPath(r.student.id)}>
                          Xem hồ sơ học tập ›
                        </Link>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  return (
    <div className="rk-tab" data-screen="T04-xep-hang">
      {toolbar}
      {body}
      <Dialog
        open={info}
        onClose={() => setInfo(false)}
        title="Cách tính điểm"
        size="md"
        footer={<Button onClick={() => setInfo(false)}>Đã hiểu</Button>}
      >
        <RankInfo />
      </Dialog>
    </div>
  );
}
