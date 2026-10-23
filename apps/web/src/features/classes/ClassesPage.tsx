import {
  CLASS_FILTERS,
  CLASS_LIMITS,
  CLASS_MESSAGES as M,
  type ClassFilter,
  formatDay,
  formatVnDate,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, ErrorState, HskBadge, Icon, Pagination, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { ClassStatusChip } from './ClassBits';
import { useClassesStore } from './classes-store';
import { classPath, newClassPath } from './paths';
import './classes.css';

const FILTER_LABELS: Record<ClassFilter, string> = {
  live: 'Đang hoạt động',
  upcoming: 'Sắp bắt đầu',
  active: 'Đang học',
  ended: 'Đã kết thúc',
  all: 'Tất cả',
};

/** T02 Danh sách lớp (REQ-6). */
export function ClassesPage() {
  useDocumentTitle('Lớp học');
  const navigate = useNavigate();
  const status = useClassesStore((s) => s.listStatus);
  const list = useClassesStore((s) => s.list);
  const filter = useClassesStore((s) => s.filter);
  const q = useClassesStore((s) => s.q);
  const page = useClassesStore((s) => s.page);
  const loadList = useClassesStore((s) => s.loadList);
  const setFilter = useClassesStore((s) => s.setFilter);
  const setQuery = useClassesStore((s) => s.setQuery);
  const setPage = useClassesStore((s) => s.setPage);
  const clearFilters = useClassesStore((s) => s.clearFilters);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    void loadList();
  }, [loadList, filter, q, page]);

  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => setQuery(search), 250);
    return () => clearTimeout(t);
  }, [search, q, setQuery]);

  const counts = list?.counts;
  const items = list?.items ?? [];
  const pageCount = list ? Math.max(1, Math.ceil(list.total / CLASS_LIMITS.pageSize)) : 1;
  const empty = !!list && (counts?.all ?? 0) === 0;
  const create = (
    <Button onClick={() => navigate(newClassPath)}>
      <Icon name="plus" size={18} />
      Tạo lớp
    </Button>
  );

  return (
    <section aria-labelledby="t02-title" data-screen="T02">
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t02-title" className="page-title">
            Lớp học
          </h1>
          <div className="page-sub">{counts ? `${counts.all} lớp` : '…'}</div>
        </div>
        <div className="page-head__actions">{create}</div>
      </div>

      {empty ? (
        <div className="card">
          <div className="empty">
            <h3>{M.noClasses}</h3>
            <div className="empty__actions">{create}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="cls-seg" role="group" aria-label="Lọc theo trạng thái">
              {CLASS_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {FILTER_LABELS[f]} <span className="muted">{counts?.[f] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="inp-search">
              <Icon name="search" size={18} />
              <input
                className="input"
                type="search"
                placeholder="Tìm theo tên lớp"
                aria-label="Tìm theo tên lớp"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {status === 'error' && !list && <ErrorState title="Không tải được danh sách lớp." />}
          {!list && status !== 'error' && <Skeleton height={240} />}
          {list && (
            <div className="card">
              {items.length ? (
                <>
                  <div className="tbl-scroll">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Tên lớp</th>
                          <th>Trạng thái</th>
                          <th>Ngày bắt đầu</th>
                          <th>Giáo trình</th>
                          <th className="r">Sĩ số</th>
                          <th>Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((c) => (
                          <tr
                            key={c.id}
                            className="cls-row"
                            onClick={() => navigate(classPath(c.id))}
                          >
                            <td>
                              <Link className="strong" to={classPath(c.id)}>
                                {c.name}
                              </Link>
                            </td>
                            <td>
                              <ClassStatusChip status={c.status} />
                            </td>
                            <td className="nowrap">{formatDay(c.startDate)}</td>
                            <td>
                              {c.curriculum && (
                                <span className="cls-cur">
                                  <HskBadge level={c.curriculum.hsk} />
                                  <span>{c.curriculum.name}</span>
                                </span>
                              )}
                            </td>
                            <td className="r nowrap">{c.memberCount}/100</td>
                            <td className="small muted nowrap">
                              {formatVnDate(new Date(c.createdAt))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="tbl-foot">
                    <span>
                      {list.total} lớp khớp · {CLASS_LIMITS.pageSize} lớp mỗi trang
                    </span>
                    {pageCount > 1 && (
                      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
                    )}
                  </div>
                </>
              ) : (
                <div className="empty">
                  <h3>{M.noClassMatch}</h3>
                  <div className="empty__actions">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch('');
                        clearFilters();
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
