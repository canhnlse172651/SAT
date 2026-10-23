import {
  CURRICULUM_LIMITS,
  CURRICULUM_MESSAGES as M,
  formatVnDateTime,
  HSK_LEVELS,
  hskLevelLabel,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, ErrorState, HskBadge, Icon, Pagination, Skeleton, Switch } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { useToastStore } from '../toast/toast-store';
import { Cover } from './Cover';
import { CurriculumFormDialog } from './CurriculumFormDialog';
import { type LevelFilter, useCurriculumStore } from './curriculum-store';
import { messageOf } from './errors';
import { curriculumPath } from './paths';
import './curriculum.css';

const LEVELS: LevelFilter[] = ['all', ...HSK_LEVELS.map((l) => `${l}` as const)];

/** T05 Danh sách giáo trình (REQ-1, REQ-3, REQ-13). */
export function CurriculaPage() {
  useDocumentTitle('Giáo trình');
  const push = useToastStore((s) => s.push);
  const status = useCurriculumStore((s) => s.listStatus);
  const list = useCurriculumStore((s) => s.list);
  const level = useCurriculumStore((s) => s.level);
  const q = useCurriculumStore((s) => s.q);
  const archived = useCurriculumStore((s) => s.archived);
  const page = useCurriculumStore((s) => s.page);
  const loadList = useCurriculumStore((s) => s.loadList);
  const setLevel = useCurriculumStore((s) => s.setLevel);
  const setQuery = useCurriculumStore((s) => s.setQuery);
  const setArchived = useCurriculumStore((s) => s.setArchived);
  const setPage = useCurriculumStore((s) => s.setPage);
  const clearFilters = useCurriculumStore((s) => s.clearFilters);
  const restore = useCurriculumStore((s) => s.restore);

  const [search, setSearch] = useState(q);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void loadList();
  }, [loadList, level, q, archived, page]);

  // AC-3.3: filter as the GV types.
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => setQuery(search), 250);
    return () => clearTimeout(t);
  }, [search, q, setQuery]);

  const onRestore = async (id: string) => {
    try {
      await restore(id);
      push(M.curriculumRestored, 'success');
    } catch (err) {
      push(messageOf(err), 'error');
    } finally {
      void loadList();
    }
  };

  const items = list?.items ?? [];
  const counts = list?.levelCounts ?? {};
  const activeCount = archived ? null : (counts['all'] ?? 0);
  const filtered = level !== 'all' || !!q.trim();
  const pageCount = list ? Math.max(1, Math.ceil(list.total / CURRICULUM_LIMITS.pageSize)) : 1;

  return (
    <section aria-labelledby="t05-title" data-screen="T05">
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t05-title" className="page-title">
            Giáo trình
          </h1>
          <div className="page-sub">
            {activeCount ?? '…'} giáo trình {archived ? 'đã lưu trữ' : 'hoạt động'} · mỗi giáo trình
            gồm các Bài, mỗi Bài có 2 phần Bài học · Bài tập
          </div>
        </div>
        <div className="page-head__actions">
          <Button onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} />
            Tạo giáo trình
          </Button>
        </div>
      </div>

      <div className="toolbar cur-toolbar">
        <div className="cur-chips" role="group" aria-label="Lọc theo cấp HSK">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              className="cur-chip"
              aria-pressed={level === l}
              onClick={() => setLevel(l)}
            >
              {l === 'all' ? 'Tất cả' : hskLevelLabel(Number(l) as (typeof HSK_LEVELS)[number])}{' '}
              <span className="cur-chip__n">{counts[l] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="inp-search">
          <Icon name="search" size={18} />
          <input
            className="input"
            type="search"
            aria-label="Tìm giáo trình"
            placeholder="Tìm theo tên"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Switch checked={archived} onChange={setArchived} label="Đã lưu trữ" />
      </div>

      {status === 'error' && !list && <ErrorState title="Không tải được danh sách giáo trình." />}
      {!list && status !== 'error' && <Skeleton height={240} />}
      {list && items.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="empty__ill">
              <Icon name="book" size={28} />
            </div>
            {filtered || archived || (counts['all'] ?? 0) > 0 ? (
              <>
                <h3>{M.noMatch}</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    clearFilters();
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </>
            ) : (
              <>
                <h3>{M.emptyList}</h3>
                <Button onClick={() => setCreating(true)}>
                  <Icon name="plus" size={18} />
                  Tạo giáo trình
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      {items.length > 0 && (
        <>
          <ul className="cur-grid" aria-label="Danh sách giáo trình">
            {items.map((c) => (
              <li key={c.id} className="card cur-tile">
                <Cover hsk={c.hsk} url={c.coverUrl} name={c.name} />
                <div className="cur-tile__body">
                  <div className="cur-tile__top">
                    <HskBadge level={c.hsk} />
                    <span className="small muted">Dùng bởi {c.usedBy} lớp</span>
                  </div>
                  <Link className="cur-tile__name" to={curriculumPath(c.id)}>
                    {c.name}
                  </Link>
                  <div className="small muted">
                    {c.lessonCount} bài · {c.publishedLessonCount} đã xuất bản
                  </div>
                  <div className="small muted-3">
                    Cập nhật {formatVnDateTime(new Date(c.updatedAt))}
                  </div>
                  {c.archived && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="cur-tile__restore"
                      aria-label={`Khôi phục ${c.name}`}
                      onClick={() => void onRestore(c.id)}
                    >
                      Khôi phục
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="cur-list-foot">
            <p className="small muted">
              {list?.total} giáo trình · sắp theo cập nhật gần nhất · 20 mỗi trang
            </p>
            {pageCount > 1 && <Pagination page={page} pageCount={pageCount} onChange={setPage} />}
          </div>
        </>
      )}

      <CurriculumFormDialog mode="create" open={creating} onClose={() => setCreating(false)} />
    </section>
  );
}
