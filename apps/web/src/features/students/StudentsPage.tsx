import {
  ACCOUNT_ERROR_CODES,
  ACCOUNT_MESSAGES as M,
  type BulkAction,
  formatVnDateTime,
  MAIL_FAIL_MESSAGES,
  type Student,
  type StudentFilter,
} from '@sat/shared';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  Pagination,
  SegmentedControl,
  Skeleton,
} from '../../components';
import { ApiError } from '../../lib/api-client';
import { useDocumentTitle } from '../../lib/use-document-title';
import { NETWORK_ERROR } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { useToastStore } from '../toast/toast-store';
import { AddStudentsDialog, type AddTab } from './AddStudentsDialog';
import { EditStudentDialog } from './EditStudentDialog';
import { EmailPreviewDrawer } from './EmailPreviewDrawer';
import { EditIcon, KeyIcon, LockIcon, TrashIcon, UnlockIcon } from './row-icons';
import { StudentStatusChip } from './StudentFields';
import { useStudentsStore } from './students-store';
import './students.css';

const FILTERS: { value: StudentFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chưa kích hoạt' },
  { value: 'active', label: 'Đã kích hoạt' },
  { value: 'failed', label: 'Gửi email thất bại' },
  { value: 'locked', label: 'Đã khóa' },
];

type Confirm =
  | { type: 'reset' | 'lock' | 'delete' | 'blocked'; student: Student }
  | { type: 'bulk'; action: BulkAction; eligible: number; skipped: number };

const messageOf = (err: unknown) =>
  err instanceof ApiError && err.status < 500 ? err.message : NETWORK_ERROR;

/** T11 Danh sách học viên (REQ-7, REQ-11 … REQ-13, REQ-17, REQ-18). */
export function StudentsPage() {
  useDocumentTitle('Học viên');
  const push = useToastStore((s) => s.push);
  const status = useStudentsStore((s) => s.status);
  const list = useStudentsStore((s) => s.list);
  const q = useStudentsStore((s) => s.q);
  const filter = useStudentsStore((s) => s.filter);
  const page = useStudentsStore((s) => s.page);
  const selectedIds = useStudentsStore((s) => s.selectedIds);
  const allMatching = useStudentsStore((s) => s.allMatching);
  const tracking = useStudentsStore((s) => s.tracking);
  const summary = useStudentsStore((s) => s.summary);
  const load = useStudentsStore((s) => s.load);
  const setQuery = useStudentsStore((s) => s.setQuery);
  const setFilter = useStudentsStore((s) => s.setFilter);
  const setPage = useStudentsStore((s) => s.setPage);
  const clearFilters = useStudentsStore((s) => s.clearFilters);
  const toggle = useStudentsStore((s) => s.toggle);
  const togglePage = useStudentsStore((s) => s.togglePage);
  const selectAllMatching = useStudentsStore((s) => s.selectAllMatching);
  const clearSelection = useStudentsStore((s) => s.clearSelection);
  const dismissSummary = useStudentsStore((s) => s.dismissSummary);
  const mailAction = useStudentsStore((s) => s.mailAction);
  const lock = useStudentsStore((s) => s.lock);
  const unlock = useStudentsStore((s) => s.unlock);
  const remove = useStudentsStore((s) => s.remove);
  const bulkPreview = useStudentsStore((s) => s.bulkPreview);
  const bulkRun = useStudentsStore((s) => s.bulkRun);
  const poll = useStudentsStore((s) => s.poll);

  const [search, setSearch] = useState(q);
  const [addTab, setAddTab] = useState<AddTab | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load();
  }, [load, q, filter, page]);

  // Search as the GV types (AC-11.3).
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => setQuery(search), 250);
    return () => clearTimeout(t);
  }, [search, q, setQuery]);

  // Follow e-mails until each has a result (AC-7.1, AC-7.3, AC-18.1).
  const anySending = list?.items.some((s) => s.status === 'sending') ?? false;
  useEffect(() => {
    if (!tracking.length && !anySending) return;
    const timer = setInterval(() => {
      void poll().then((done) => {
        for (const { batch, sent } of done) {
          if (batch.scope === 'single' && sent > 0 && batch.email) {
            push(
              batch.mailKind === 'new_password'
                ? `Đã gửi email mật khẩu mới tới ${batch.email}.`
                : `Đã gửi email đăng nhập tới ${batch.email}.`,
              'success',
            );
          }
        }
        void load();
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [tracking.length, anySending, poll, load, push]);

  const fail = (err: unknown) => {
    push(messageOf(err), err instanceof ApiError && err.status === 429 ? 'warn' : 'error');
    if (err instanceof ApiError && err.code === ACCOUNT_ERROR_CODES.STATUS_CHANGED) void load();
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
      setConfirm(null);
      void load();
    }
  };

  const activate = (s: Student) =>
    void run(async () => {
      await mailAction(s, 'activate');
      push(`Đang gửi email đăng nhập tới ${s.email}…`, 'info');
    });
  const resend = (s: Student) =>
    void run(async () => {
      await mailAction(s, 'resend');
      push(`Đang gửi lại email tới ${s.email}…`, 'info');
    });
  const doUnlock = (s: Student) =>
    void run(async () => {
      await unlock(s.id);
      push(`Đã mở khóa tài khoản ${s.displayName}.`, 'success');
    });

  const confirmed = () => {
    if (!confirm) return;
    if (confirm.type === 'bulk') {
      const { action } = confirm;
      return void run(async () => {
        await bulkRun(action);
        push(`Đang gửi email tới ${confirm.eligible} học viên…`, 'info');
      });
    }
    const s = confirm.student;
    if (confirm.type === 'reset') {
      return void run(async () => {
        await mailAction(s, 'reset-password');
        push(`Mật khẩu mới đang được gửi tới ${s.email}.`, 'info');
      });
    }
    if (confirm.type === 'lock' || confirm.type === 'blocked') {
      return void run(async () => {
        await lock(s.id);
        push(`Đã khóa tài khoản ${s.displayName}.`, 'success');
      });
    }
    setBusy(true);
    remove(s.id).then(
      () => {
        push(`Đã xóa học viên ${s.displayName}.`, 'success');
        setConfirm(null);
        setBusy(false);
        void load();
      },
      (err: unknown) => {
        setBusy(false);
        if (err instanceof ApiError && err.code === ACCOUNT_ERROR_CODES.HAS_SUBMISSIONS) {
          setConfirm({ type: 'blocked', student: s });
        } else {
          setConfirm(null);
          fail(err);
        }
      },
    );
  };

  const startBulk = async (action: BulkAction) => {
    try {
      const preview = await bulkPreview(action);
      if (!preview.eligible) {
        push(action === 'activate' ? M.noPendingSelected : M.noFailedSelected, 'warn');
        return;
      }
      setConfirm({ type: 'bulk', action, ...preview });
    } catch (err) {
      fail(err);
    }
  };

  const items = list?.items ?? [];
  const counts = list?.counts;
  const pageSelected = items.length > 0 && items.every((s) => selectedIds.includes(s.id));
  const selectedCount = allMatching ? (list?.total ?? 0) : selectedIds.length;
  const filtered = !!q.trim() || filter !== 'all';

  return (
    <section aria-labelledby="t11-title" data-screen="T11">
      <header className="students__head">
        <div>
          <h1 id="t11-title" className="page-title">
            Học viên
          </h1>
          <p className="students__sub">
            {list?.workspaceTotal ?? 0} học viên trong workspace · tài khoản được kích hoạt bằng
            email
          </p>
        </div>
        <div className="students__actions">
          <Button variant="ghost" onClick={() => setPreviewOpen(true)}>
            Xem mẫu email
          </Button>
          <Button variant="outline" onClick={() => setAddTab('import')}>
            Import Excel
          </Button>
          <Button onClick={() => setAddTab('one')}>Thêm học viên</Button>
        </div>
      </header>

      <div className="students__stack">
        {summary && (
          <Notice
            tone="success"
            action={
              <Button variant="ghost" onClick={dismissSummary}>
                Đóng
              </Button>
            }
          >
            {summary}
          </Notice>
        )}
        {!!counts?.failed && (
          <Notice
            tone="danger"
            action={
              <Button variant="outline" onClick={() => setFilter('failed')}>
                Xem
              </Button>
            }
          >
            Có {counts.failed} học viên gửi email thất bại.
          </Notice>
        )}
      </div>

      <div className="students__toolbar">
        <input
          className="input students__search"
          type="search"
          aria-label="Tìm học viên"
          placeholder="Tìm theo họ tên hoặc email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SegmentedControl
          aria-label="Lọc trạng thái"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((f) => ({
            value: f.value,
            label: `${f.label} ${counts ? counts[f.value] : ''}`.trim(),
          }))}
        />
      </div>

      {selectedCount > 0 && (
        <div className="students__bulk" role="region" aria-label="Thao tác hàng loạt">
          <b>Đã chọn {selectedCount} học viên</b>
          <Button onClick={() => void startBulk('activate')}>Kích hoạt</Button>
          <Button variant="outline" onClick={() => void startBulk('resend')}>
            Gửi lại
          </Button>
          {pageSelected && !allMatching && (list?.total ?? 0) > items.length && (
            <Button variant="ghost" onClick={selectAllMatching}>
              Chọn tất cả {list?.total} học viên khớp bộ lọc
            </Button>
          )}
          <span className="students__bulk-spacer" />
          <Button variant="ghost" onClick={clearSelection}>
            Bỏ chọn
          </Button>
        </div>
      )}

      <div className="students__card">
        {status === 'error' && !list && <ErrorState title="Không tải được danh sách học viên." />}
        {!list && status !== 'error' && <Skeleton height={320} />}
        {list && items.length === 0 && (
          <EmptyState
            title={
              filtered || list.workspaceTotal > 0
                ? 'Không tìm thấy học viên phù hợp.'
                : 'Chưa có học viên nào.'
            }
            action={
              filtered || list.workspaceTotal > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    clearFilters();
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : (
                <span className="students__actions">
                  <Button onClick={() => setAddTab('one')}>Thêm học viên</Button>
                  <Button variant="outline" onClick={() => setAddTab('import')}>
                    Import Excel
                  </Button>
                </span>
              )
            }
          />
        )}
        {items.length > 0 && (
          <>
            <table className="students__table">
              <caption className="sr-only">Danh sách học viên</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <Checkbox
                      label={<span className="sr-only">Chọn cả trang</span>}
                      checked={pageSelected}
                      onChange={togglePage}
                    />
                  </th>
                  <th scope="col">Họ tên · Email</th>
                  <th scope="col">Số điện thoại</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="num">
                    Số lớp
                  </th>
                  <th scope="col">Đăng nhập gần nhất</th>
                  <th scope="col" className="num">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const selected = allMatching || selectedIds.includes(s.id);
                  return (
                    <tr key={s.id} aria-selected={selected}>
                      <td>
                        <Checkbox
                          label={<span className="sr-only">Chọn {s.displayName}</span>}
                          checked={selected}
                          onChange={() => toggle(s.id)}
                        />
                      </td>
                      <td>
                        <div className="students__who">
                          <Avatar name={s.displayName} size="sm" />
                          <span>
                            <span className="students__name">{s.displayName}</span>
                            <span className="students__email">{s.email}</span>
                          </span>
                        </div>
                      </td>
                      <td className="students__muted students__nowrap">{s.phone ?? '—'}</td>
                      <td>
                        <div className="students__status">
                          <StudentStatusChip status={s.status} />
                          {s.status === 'failed' && s.failReason && (
                            <span className="students__reason">
                              {MAIL_FAIL_MESSAGES[s.failReason]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="num">{s.classCount}</td>
                      <td className="students__muted students__nowrap">
                        {s.lastLoginAt
                          ? formatVnDateTime(new Date(s.lastLoginAt))
                          : 'Chưa đăng nhập'}
                      </td>
                      <td>
                        <RowActions
                          student={s}
                          disabled={busy}
                          onActivate={activate}
                          onResend={resend}
                          onUnlock={doUnlock}
                          onEdit={setEditing}
                          onConfirm={(type) => setConfirm({ type, student: s })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="students__foot">
              <span>{list?.total} học viên khớp · 50 học viên mỗi trang · mới thêm trước</span>
              {list && list.total > list.limit && (
                <Pagination
                  page={page}
                  pageCount={Math.ceil(list.total / list.limit)}
                  onChange={setPage}
                />
              )}
            </div>
          </>
        )}
      </div>

      {addTab && (
        <AddStudentsDialog
          open
          initialTab={addTab}
          onClose={() => {
            setAddTab(null);
            void load();
          }}
        />
      )}
      {editing && (
        <EditStudentDialog
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
      {previewOpen && <EmailPreviewDrawer onClose={() => setPreviewOpen(false)} />}
      {confirm && (
        <ConfirmFor
          confirm={confirm}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={confirmed}
        />
      )}
    </section>
  );
}

/** AC-12.6: the actions offered on a row depend on the student's state. */
function RowActions({
  student: s,
  disabled,
  onActivate,
  onResend,
  onUnlock,
  onEdit,
  onConfirm,
}: {
  student: Student;
  disabled: boolean;
  onActivate: (s: Student) => void;
  onResend: (s: Student) => void;
  onUnlock: (s: Student) => void;
  onEdit: (s: Student) => void;
  onConfirm: (type: 'reset' | 'lock' | 'delete') => void;
}) {
  // Text button for the state's main action, icon buttons (named "<action> <student>") for the rest.
  const text = (label: string, onClick: () => void) => (
    <Button
      key={label}
      variant="outline"
      disabled={disabled}
      aria-label={`${label} ${s.displayName}`}
      onClick={onClick}
    >
      {label}
    </Button>
  );
  const icon = (label: string, glyph: ReactNode, onClick: () => void) => (
    <IconButton
      key={label}
      size="sm"
      icon={glyph}
      title={label}
      disabled={disabled}
      aria-label={`${label} ${s.displayName}`}
      onClick={onClick}
    />
  );
  const edit = icon('Sửa', <EditIcon />, () => onEdit(s));
  const del = icon('Xóa', <TrashIcon />, () => onConfirm('delete'));
  const reset = icon('Đặt lại mật khẩu', <KeyIcon />, () => onConfirm('reset'));
  const lock = icon('Khóa tài khoản', <LockIcon />, () => onConfirm('lock'));
  const actions = {
    pending: [text('Kích hoạt', () => onActivate(s)), edit, del],
    sending: [edit, del],
    active: [edit, reset, lock, del],
    failed: [text('Gửi lại', () => onResend(s)), edit, lock, del],
    locked: [icon('Mở khóa', <UnlockIcon />, () => onUnlock(s)), edit, del],
  }[s.status];
  return <div className="students__row-actions">{actions}</div>;
}

/** Confirmations of AC-7.2, AC-12.5, AC-13.1, AC-13.3, AC-18.4. */
function ConfirmFor({
  confirm,
  busy,
  onCancel,
  onConfirm,
}: {
  confirm: Confirm;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (confirm.type === 'bulk') {
    const activate = confirm.action === 'activate';
    return (
      <ConfirmDialog
        open
        title={
          activate
            ? `Kích hoạt ${confirm.eligible} học viên? Hệ thống sẽ tạo tài khoản và gửi email đăng nhập tới từng học viên.`
            : `Gửi lại email cho ${confirm.eligible} học viên? Mỗi học viên nhận một mật khẩu ngẫu nhiên mới.`
        }
        message={
          confirm.skipped
            ? `${confirm.skipped} học viên sẽ được bỏ qua vì đang ở trạng thái khác.`
            : 'Mật khẩu được tạo ngẫu nhiên và chỉ gửi tới email của học viên — giáo viên không xem được.'
        }
        confirmLabel={activate ? 'Kích hoạt' : 'Gửi lại'}
        loading={busy}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
  }
  const s = confirm.student;
  const who = `${s.displayName} · ${s.email}`;
  const props = {
    reset: {
      title: 'Đặt lại mật khẩu?',
      message: (
        <>
          {who}
          <br />
          Học viên sẽ bị đăng xuất khỏi mọi thiết bị. Mật khẩu mới sẽ được gửi tới email của học
          viên.
        </>
      ),
      confirmLabel: 'Đặt lại mật khẩu',
      tone: 'primary' as const,
    },
    lock: {
      title: 'Khóa tài khoản?',
      message: (
        <>
          {who}
          <br />
          Học viên sẽ bị đăng xuất khỏi mọi thiết bị. Thông tin, bài nộp, điểm và các lớp của học
          viên được giữ nguyên.
        </>
      ),
      confirmLabel: 'Khóa tài khoản',
      tone: 'danger' as const,
    },
    delete: {
      title: 'Xóa học viên?',
      message: (
        <>
          {who} · đang tham gia {s.classCount} lớp.
          <br />
          Thao tác này không thể hoàn tác.
        </>
      ),
      confirmLabel: 'Xóa',
      tone: 'danger' as const,
    },
    blocked: {
      title: 'Không thể xóa học viên',
      message: M.hasSubmissions,
      confirmLabel: 'Khóa tài khoản',
      tone: 'danger' as const,
    },
  }[confirm.type];
  return (
    <ConfirmDialog
      open
      {...props}
      cancelLabel={confirm.type === 'blocked' ? 'Đóng' : 'Hủy'}
      loading={busy}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
