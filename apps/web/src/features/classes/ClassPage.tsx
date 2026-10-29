import {
  CLASS_MESSAGES as M,
  RANKING_MESSAGES,
  deleteConfirm,
  deletedMessage,
  endConfirm,
  formatDay,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Button, ConfirmDialog, ErrorState, HskBadge, Skeleton, Tabs } from '../../components';
import { ApiError } from '../../lib/api-client';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { curriculumPath } from '../curriculum/paths';
import { RankingTab } from '../scoring/RankingTab';
import { useToastStore } from '../toast/toast-store';
import { ClassStatusChip } from './ClassBits';
import { useClassesStore } from './classes-store';
import { ContentTab } from './ContentTab';
import { EditClassDialog } from './EditClassDialog';
import { messageOf } from './errors';
import { OverviewTab } from './OverviewTab';
import { type ClassTab, classesPath } from './paths';
import { StudentsTab } from './StudentsTab';
import './classes.css';

type Confirm = 'end' | 'reopen' | 'delete' | null;
const TABS: ClassTab[] = ['tong-quan', 'hoc-vien', 'noi-dung', 'tien-do', 'xep-hang'];

/** T04 Chi tiết lớp (REQ-7 … REQ-11, REQ-15, REQ-16, REQ-21, REQ-22). */
export function ClassPage() {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const push = useToastStore((s) => s.push);
  const status = useClassesStore((s) => s.detailStatus);
  const detail = useClassesStore((s) => s.detail);
  const loadDetail = useClassesStore((s) => s.loadDetail);
  const end = useClassesStore((s) => s.end);
  const reopen = useClassesStore((s) => s.reopen);
  const remove = useClassesStore((s) => s.remove);
  const [missingId, setMissingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(detail?.name ?? 'Chi tiết lớp');

  const tabParam = params.get('tab') as ClassTab | null;
  const tab: ClassTab = tabParam && TABS.includes(tabParam) ? tabParam : 'tong-quan';

  useEffect(() => {
    loadDetail(classId).catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 404) setMissingId(classId);
    });
  }, [classId, loadDetail]);

  // 008 AC-9.4: the ranking tab of a class that is not the GV's says which thing was not found.
  if (missingId === classId)
    return <NotFoundPage title={tab === 'xep-hang' ? RANKING_MESSAGES.notFound : undefined} />;
  if (status === 'error' && !detail) return <ErrorState title="Không tải được lớp." />;
  if (!detail || detail.id !== classId) return <Skeleton height={320} />;

  const ended = detail.status === 'ended';
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      push(ok, 'success');
    } catch (err) {
      push(messageOf(err), 'error');
      void loadDetail(classId).catch(() => {});
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };
  const onDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await remove(classId);
      push(deletedMessage(detail.name), 'success');
      navigate(classesPath, { replace: true });
    } catch (err) {
      push(messageOf(err), 'error');
      setConfirm(null);
      void loadDetail(classId).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const setTab = (id: string) => setParams(id === 'tong-quan' ? {} : { tab: id });
  const later = (owner: string) => (
    <div className="card">
      <div className="empty">
        <h3>Đang xây dựng</h3>
        <p className="muted">Phần này thuộc module {owner}.</p>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="t04-title" data-screen="T04">
      <nav className="cls-crumbs" aria-label="Đường dẫn">
        <Link to={classesPath}>Lớp học</Link> <span aria-hidden="true">›</span> {detail.name}
      </nav>
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t04-title" className="page-title">
            {detail.name} <ClassStatusChip status={detail.status} />
          </h1>
          <div className="page-sub">
            <span>Bắt đầu {formatDay(detail.startDate)}</span>
            {detail.endDate && <span>Kết thúc {formatDay(detail.endDate)}</span>}
            <span className="cls-cur">
              <HskBadge level={detail.curriculum.hsk} />
              <Link to={curriculumPath(detail.curriculum.id)}>{detail.curriculum.name}</Link>
            </span>
            <span>Sĩ số {detail.memberCount}/100</span>
          </div>
        </div>
        <div className="page-head__actions">
          {ended && (
            <Button variant="outline" onClick={() => setConfirm('reopen')}>
              Mở lại lớp
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditing(true)}>
            Sửa thông tin lớp
          </Button>
          {detail.status === 'active' && (
            <Button variant="danger-outline" onClick={() => setConfirm('end')}>
              Kết thúc lớp
            </Button>
          )}
          <Button
            variant="danger-outline"
            disabled={detail.hasSubmissions}
            aria-describedby={detail.hasSubmissions ? 't04-delete-hint' : undefined}
            onClick={() => setConfirm('delete')}
          >
            Xóa lớp
          </Button>
        </div>
      </div>
      {detail.hasSubmissions && (
        <p id="t04-delete-hint" className="small muted cls-hint">
          {M.deleteLocked}
        </p>
      )}
      {detail.status === 'upcoming' && <div className="cls-callout">{M.upcomingHint}</div>}

      <Tabs
        aria-label="Chi tiết lớp"
        value={tab}
        onChange={setTab}
        items={[
          {
            id: 'tong-quan',
            label: 'Tổng quan',
            content: <OverviewTab detail={detail} onShowContent={() => setTab('noi-dung')} />,
          },
          {
            id: 'hoc-vien',
            label: 'Học viên',
            count: detail.memberCount,
            content: <StudentsTab detail={detail} />,
          },
          { id: 'noi-dung', label: 'Nội dung', content: <ContentTab detail={detail} /> },
          { id: 'tien-do', label: 'Tiến độ', content: later('009 (Dashboard giáo viên)') },
          { id: 'xep-hang', label: 'Xếp hạng', content: <RankingTab classId={classId} /> },
        ]}
      />

      {editing && <EditClassDialog detail={detail} onClose={() => setEditing(false)} />}
      <ConfirmDialog
        open={confirm === 'end'}
        title="Kết thúc lớp"
        message={endConfirm(detail.name)}
        confirmLabel="Kết thúc lớp"
        tone="danger"
        loading={busy}
        onConfirm={() => void run(() => end(classId), M.ended)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'reopen'}
        title="Mở lại lớp"
        message={`Mở lại lớp ${detail.name}? Học viên sẽ lại làm được bài tập.`}
        confirmLabel="Mở lại lớp"
        loading={busy}
        onConfirm={() => void run(() => reopen(classId), M.reopened)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Xóa lớp"
        message={deleteConfirm(detail.name, detail.memberCount)}
        confirmLabel="Xóa lớp"
        tone="danger"
        loading={busy}
        onConfirm={() => void onDelete()}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}
