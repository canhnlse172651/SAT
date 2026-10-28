import {
  EXAM_MESSAGES as M,
  type ExamListItem,
  type ExamState,
  foldSearch,
  formatNumber,
  formatVnDate,
  formatVnTime,
} from '@sat/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, ConfirmDialog, ErrorState, Icon, Skeleton, Switch } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { useToastStore } from '../toast/toast-store';
import { ExamStateChip } from './exam-bits';
import { liveState } from './exam-state';
import { useExamsStore } from './exams-store';
import { examPath, examResultsPath, newExamPath } from './paths';
import { useServerNow } from './server-clock';
import '../classes/classes.css';
import './exams.css';

type Filter = 'all' | 'draft' | 'scheduled' | 'open' | 'closed';
const FILTERS: [Filter, string][] = [
  ['all', 'Tất cả'],
  ['draft', 'Nháp'],
  ['scheduled', 'Đã lên lịch'],
  ['open', 'Đang mở'],
  ['closed', 'Đã đóng'],
];
/** AC-1.2: Đang mở → Đã lên lịch → Nháp → Đã đóng (→ Lưu trữ, AC-1.5). */
const GROUP: Record<ExamState, number> = {
  open: 0,
  scheduled: 1,
  draft: 2,
  closed: 3,
  archived: 4,
};

const t = (iso: string | null) => (iso ? Date.parse(iso) : 0);

function sortKey(x: ExamListItem, s: ExamState): number {
  if (s === 'open' || s === 'scheduled') return t(x.opensAt);
  if (s === 'draft') return -t(x.updatedAt);
  return -t(x.closesAt);
}

function When({ iso }: { iso: string | null }) {
  if (!iso) return <span className="muted">—</span>;
  const d = new Date(iso);
  return (
    <>
      <span className="nowrap">{formatVnDate(d)}</span>
      <br />
      <span className="muted">{formatVnTime(d)}</span>
    </>
  );
}

/** T10 Danh sách bài thi (REQ-1, REQ-6). */
export function ExamsPage() {
  useDocumentTitle('Bài thi');
  const navigate = useNavigate();
  const now = useServerNow(1000);
  const list = useExamsStore((s) => s.list);
  const status = useExamsStore((s) => s.listStatus);
  const loadList = useExamsStore((s) => s.loadList);
  const remove = useExamsStore((s) => s.remove);
  const archive = useExamsStore((s) => s.archive);
  const restore = useExamsStore((s) => s.restore);
  const duplicate = useExamsStore((s) => s.duplicate);
  const push = useToastStore((s) => s.push);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ExamListItem | null>(null);

  useEffect(() => {
    void loadList();
    // Submitted counts and states follow the exams without a reload.
    const timer = setInterval(() => void loadList(), 30_000);
    return () => clearInterval(timer);
  }, [loadList]);

  const rows = useMemo(() => (list ?? []).map((x) => ({ x, s: liveState(x, now) })), [list, now]);
  const live = rows.filter((r) => r.s !== 'archived');
  const archivedCount = rows.length - live.length;
  const count = (f: Filter) => live.filter((r) => f === 'all' || r.s === f).length;
  const needle = foldSearch(q.trim());
  const shown = rows
    .filter((r) =>
      r.s === 'archived'
        ? showArchived && (filter === 'all' || filter === 'closed')
        : filter === 'all' || r.s === filter,
    )
    .filter((r) => foldSearch(r.x.name).includes(needle))
    .sort((a, b) => GROUP[a.s] - GROUP[b.s] || sortKey(a.x, a.s) - sortKey(b.x, b.s));

  const create = (
    <Button onClick={() => navigate(newExamPath)}>
      <Icon name="plus" size={18} />
      Tạo bài thi
    </Button>
  );
  const archSwitch = archivedCount > 0 && (
    <Switch
      checked={showArchived}
      onChange={setShowArchived}
      label={M.archivedSwitch(archivedCount)}
    />
  );

  const act = async (fn: () => Promise<unknown>) => {
    setMenu(null);
    await fn();
    await loadList();
  };

  return (
    <section aria-labelledby="t10-title" data-screen="T10">
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t10-title" className="page-title">
            Danh sách bài thi
          </h1>
          <div className="page-sub">
            {list ? `${live.length} bài thi · giờ Việt Nam (UTC+7)` : '…'}
          </div>
        </div>
        <div className="page-head__actions">{create}</div>
      </div>

      {status === 'error' && !list && <ErrorState title="Không tải được danh sách bài thi." />}
      {!list && status !== 'error' && <Skeleton height={240} />}
      {list && !live.length && !showArchived && (
        <>
          {archSwitch && <div className="toolbar">{archSwitch}</div>}
          <div className="card">
            <div className="empty">
              <h3>{M.noExams}</h3>
              <p>Soạn đề bằng các dạng câu tự chấm, giao cho lớp và đặt giờ mở – giờ đóng.</p>
              <div className="empty__actions">{create}</div>
            </div>
          </div>
        </>
      )}
      {list && (live.length > 0 || showArchived) && (
        <>
          <div className="toolbar">
            <div className="cls-seg" role="group" aria-label="Lọc theo trạng thái">
              {FILTERS.map(([f, label]) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {label} <span className="muted">{count(f)}</span>
                </button>
              ))}
            </div>
            <div className="inp-search">
              <Icon name="search" size={18} />
              <input
                className="input"
                type="search"
                placeholder="Tìm theo tên bài thi"
                aria-label="Tìm theo tên bài thi"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <span className="grow" />
            {archSwitch}
          </div>
          <div className="card">
            {shown.length ? (
              <div className="tbl-scroll">
                <table className="tbl xm-tbl">
                  <thead>
                    <tr>
                      <th>Tên bài thi</th>
                      <th>Lớp được giao</th>
                      <th>Giờ mở</th>
                      <th className="r">Thời lượng</th>
                      <th>Giờ đóng</th>
                      <th>Trạng thái</th>
                      <th className="r">Đã nộp</th>
                      <th>
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map(({ x, s }) => (
                      <tr key={x.id} data-exam={x.id} className={s === 'archived' ? 'is-arch' : ''}>
                        <td>
                          <Link className="strong" to={examPath(x.id)}>
                            {x.name}
                          </Link>
                          <div className="small muted">
                            {x.questionCount} câu ·{' '}
                            {formatNumber(x.totalPoints, 1).replace(/,0$/, '')} điểm
                          </div>
                        </td>
                        <td>
                          {x.classes.length ? (
                            <div className="xm-classes">
                              {x.classes.map((c) => (
                                <span key={c.id} className="chip">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="small">
                          <When iso={x.opensAt} />
                        </td>
                        <td className="r nowrap">
                          {x.durationMin ? `${x.durationMin} phút` : '—'}
                        </td>
                        <td className="small">
                          <When iso={x.closesAt} />
                        </td>
                        <td>
                          <ExamStateChip state={s} />
                        </td>
                        <td className="r nowrap">
                          {s === 'draft' ? (
                            <span className="muted">—</span>
                          ) : (
                            <>
                              <strong>{x.submitted}</strong>/{x.takers}
                            </>
                          )}
                        </td>
                        <td className="r">
                          <div className="xm-row-acts">
                            {s !== 'draft' && (
                              <Link className="btn btn--outline btn--sm" to={examResultsPath(x.id)}>
                                Xem kết quả
                              </Link>
                            )}
                            <span className="xm-menu-wrap">
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                aria-haspopup="menu"
                                aria-expanded={menu === x.id}
                                aria-label={`Thao tác khác · ${x.name}`}
                                onClick={() => setMenu(menu === x.id ? null : x.id)}
                              >
                                ⋯
                              </button>
                              {menu === x.id && (
                                <div className="xm-menu" role="menu">
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() =>
                                      void act(async () => {
                                        const id = await duplicate(x.id);
                                        if (id) {
                                          push(
                                            'Đã nhân bản bài thi — bản sao ở trạng thái Nháp.',
                                            'success',
                                          );
                                          navigate(examPath(id));
                                        }
                                      })
                                    }
                                  >
                                    Nhân bản
                                  </button>
                                  {s === 'closed' && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() =>
                                        void act(async () => {
                                          const err = await archive(x.id);
                                          push(
                                            err ? err.message : `Đã lưu trữ “${x.name}”.`,
                                            err ? 'warn' : 'success',
                                          );
                                        })
                                      }
                                    >
                                      Lưu trữ
                                    </button>
                                  )}
                                  {s === 'archived' && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() =>
                                        void act(async () => {
                                          const err = await restore(x.id);
                                          push(
                                            err ? err.message : `Đã khôi phục “${x.name}”.`,
                                            err ? 'warn' : 'success',
                                          );
                                        })
                                      }
                                    >
                                      Khôi phục
                                    </button>
                                  )}
                                  {!x.locked && (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      className="xm-danger"
                                      onClick={() => {
                                        setMenu(null);
                                        setDeleting(x);
                                      }}
                                    >
                                      Xóa
                                    </button>
                                  )}
                                </div>
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">
                <h3>{M.noMatch}</h3>
                <div className="empty__actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQ('');
                      setFilter('all');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <ConfirmDialog
        open={!!deleting}
        title="Xóa bài thi?"
        message={deleting ? M.deleteConfirm(deleting.name) : ''}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const x = deleting;
          setDeleting(null);
          if (x)
            void act(async () => {
              const err = await remove(x.id);
              push(err ? err.message : M.deleted, err ? 'warn' : 'success');
            });
        }}
      />
    </section>
  );
}
