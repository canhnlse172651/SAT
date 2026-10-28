import {
  EXAM_MESSAGES as M,
  type T16Kind,
  T16_LABELS,
  foldSearch,
  formatCountdown,
  formatNumber,
  formatSpent,
  formatVnStamp,
  formatVnTime,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ErrorState, Icon, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { ExamStateChip } from './exam-bits';
import { liveState } from './exam-state';
import { useExamsStore } from './exams-store';
import { examPath, examSubmissionPath } from './paths';
import { useServerNow } from './server-clock';
import '../classes/classes.css';
import './exams.css';

const TONE: Record<T16Kind, string> = {
  submitted: 'chip--done',
  doing: 'chip--info',
  noShow: 'chip--danger',
  lateJoin: 'chip--todo',
  todo: 'chip--todo',
};
type Sort = 'name' | 'score' | 'time';
const ts = (iso: string | null) => (iso ? Date.parse(iso) : 0);

/** T16 Kết quả bài thi theo lớp (REQ-15). */
export function ExamResultsPage() {
  const { examId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const classParam = params.get('lop');
  const now = useServerNow(1000);
  const data = useExamsStore((s) => s.results);
  const status = useExamsStore((s) => s.resultsStatus);
  const error = useExamsStore((s) => s.resultsError);
  const loadResults = useExamsStore((s) => s.loadResults);
  const [filter, setFilter] = useState<T16Kind | 'all'>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('name');
  useDocumentTitle('Kết quả bài thi');

  useEffect(() => {
    void loadResults(examId, classParam);
    // AC-15.7: starts and submissions show within 60 s without a reload.
    const timer = setInterval(() => void loadResults(examId, classParam, true), 15_000);
    return () => clearInterval(timer);
  }, [examId, classParam, loadResults]);

  if (status === 'error' && error?.status === 404) return <NotFoundPage />;
  if (status === 'error' && !data) return <ErrorState title="Không tải được kết quả bài thi." />;
  if (!data || data.exam.id !== examId) return <Skeleton height={320} />;

  const { exam } = data;
  const state = liveState(exam, now);
  const closed = state === 'closed' || state === 'archived';
  const rows = data.rows;
  const n = (k: T16Kind) => rows.filter((r) => r.kind === k).length;
  const done = rows.filter((r) => r.kind === 'submitted');
  const avg = done.length
    ? formatNumber(done.reduce((t, r) => t + (r.percent ?? 0), 0) / done.length, 1)
    : '—';
  const kinds: T16Kind[] = [
    'submitted',
    'doing',
    'todo',
    ...(closed ? (['noShow'] as const) : []),
    ...(n('lateJoin') ? (['lateJoin'] as const) : []),
  ];
  const needle = foldSearch(q.trim());
  const shown = rows
    .filter(
      (r) => (filter === 'all' || r.kind === filter) && foldSearch(r.student.name).includes(needle),
    )
    .sort(
      (a, b) =>
        (sort === 'score'
          ? (b.percent ?? -1) - (a.percent ?? -1)
          : sort === 'time'
            ? ts(b.submittedAt) - ts(a.submittedAt)
            : 0) || a.student.name.localeCompare(b.student.name, 'vi'),
    );
  const pick = (id: string) => setParams({ lop: id }, { replace: true });

  return (
    <section aria-labelledby="t16-title" data-screen="T16">
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t16-title" className="page-title">
            Kết quả bài thi
          </h1>
          <div className="page-sub">
            <strong>{exam.name}</strong> <ExamStateChip state={state} />
          </div>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--outline" to={examPath(exam.id)}>
            <Icon name="edit" size={17} />
            Soạn bài thi
          </Link>
        </div>
      </div>
      <div className="xm-meta">
        <span>
          Giờ mở <strong>{exam.opensAt ? formatVnStamp(new Date(exam.opensAt)) : '—'}</strong>
        </span>
        <span>
          Thời lượng <strong>{exam.durationMin ?? '—'} phút</strong>
        </span>
        <span>
          Giờ đóng <strong>{exam.closesAt ? formatVnStamp(new Date(exam.closesAt)) : '—'}</strong>
        </span>
        <span>
          {exam.questionCount} câu · {formatNumber(exam.totalPoints, 1).replace(/,0$/, '')} điểm
        </span>
      </div>

      {state === 'draft' || !data.classId ? (
        <div className="card">
          <div className="empty">
            <h3>Bài thi chưa được lên lịch — chưa có kết quả.</h3>
          </div>
        </div>
      ) : (
        <>
          {data.classes.length > 1 ? (
            <div className="cls-seg xm-classpick" role="group" aria-label="Chọn lớp">
              {data.classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === data.classId}
                  onClick={() => pick(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="small muted">
              Lớp được giao: <strong>{data.classes[0]?.name}</strong>
            </p>
          )}

          {!rows.length ? (
            <div className="card">
              <div className="empty">
                <h3>{M.noStudents}</h3>
              </div>
            </div>
          ) : (
            <>
              <div className="xm-counts" aria-label="Số liệu của lớp">
                {kinds.map((k) => (
                  <div key={k} className="card xm-count">
                    <span>{T16_LABELS[k]}</span>
                    <strong>{n(k)}</strong>
                  </div>
                ))}
                <div className="card xm-count">
                  <span>Điểm trung bình (Đã nộp)</span>
                  <strong>{avg}</strong>
                </div>
              </div>
              <div className="toolbar">
                <div className="cls-seg" role="group" aria-label="Lọc theo trạng thái">
                  <button
                    type="button"
                    aria-pressed={filter === 'all'}
                    onClick={() => setFilter('all')}
                  >
                    Tất cả <span className="muted">{rows.length}</span>
                  </button>
                  {kinds.map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={filter === k}
                      onClick={() => setFilter(k)}
                    >
                      {T16_LABELS[k]} <span className="muted">{n(k)}</span>
                    </button>
                  ))}
                </div>
                <div className="inp-search">
                  <Icon name="search" size={18} />
                  <input
                    className="input"
                    type="search"
                    placeholder="Tìm theo họ tên học viên"
                    aria-label="Tìm theo họ tên học viên"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <select
                  className="input xm-sort"
                  aria-label="Sắp xếp"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                >
                  <option value="name">Họ tên A→Z</option>
                  <option value="score">Điểm cao → thấp</option>
                  <option value="time">Nộp gần nhất</option>
                </select>
              </div>
              <div className="card">
                {shown.length ? (
                  <div className="tbl-scroll">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Học viên</th>
                          <th>Trạng thái</th>
                          <th className="r">Điểm</th>
                          <th>Nộp lúc / bắt đầu</th>
                          <th>Thời gian làm</th>
                          <th>
                            <span className="sr-only">Bài nộp</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((r) => (
                          <tr key={r.student.id} data-sid={r.student.id}>
                            <td>
                              <span className="strong">{r.student.name}</span>{' '}
                              {r.student.locked && (
                                <span className="chip chip--danger">Đã khóa</span>
                              )}
                            </td>
                            <td>
                              <span className={`chip ${TONE[r.kind]}`}>
                                {r.kind === 'noShow' ? 'Không làm bài · 0/100' : T16_LABELS[r.kind]}
                              </span>
                            </td>
                            <td className="r nowrap">
                              {r.kind === 'submitted' ? (
                                <strong>{r.percent}/100</strong>
                              ) : r.kind === 'noShow' ? (
                                <strong>0/100</strong>
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                            <td className="small nowrap">
                              {r.kind === 'submitted' && r.submittedAt ? (
                                <>
                                  {formatVnStamp(new Date(r.submittedAt))}{' '}
                                  {r.auto && (
                                    <span className="chip chip--pending">{M.autoLabel}</span>
                                  )}
                                </>
                              ) : r.kind === 'doing' && r.startedAt ? (
                                `Bắt đầu ${formatVnTime(new Date(r.startedAt))}`
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                            <td className="small nowrap">
                              {r.kind === 'submitted' && r.submittedAt && r.startedAt ? (
                                formatSpent(ts(r.submittedAt) - ts(r.startedAt))
                              ) : r.kind === 'doing' && r.endsAt ? (
                                `còn ${formatCountdown(ts(r.endsAt) - now.getTime())}`
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                            <td className="r">
                              {r.kind === 'submitted' && data.classId && (
                                <Link
                                  className="btn btn--outline btn--sm"
                                  to={examSubmissionPath(exam.id, data.classId, r.student.id)}
                                >
                                  Xem bài nộp
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="xm-none muted">Không có học viên phù hợp.</p>
                )}
                <div className="tbl-foot">
                  <span>
                    {state === 'open'
                      ? 'Bài thi đang mở — trạng thái và điểm tự cập nhật.'
                      : closed
                        ? 'Bài thi đã đóng — học viên không nộp được tính “Không làm bài · 0/100”.'
                        : 'Bài thi chưa mở.'}
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
